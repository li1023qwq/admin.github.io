<template>
	<view>
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length"
					@click="delTable">批量删除</button>
			</view>
		</view>
		<view class="uni-container">
			<view class="category">
				<unicloud-db ref="udb" collection="opendb-banner-category" field="name,create_date" page-data="replace"
					orderby="create_date desc" :page-size="500" v-slot:default="{data,pagination,loading,error,options}"
					:options="options">
					<scroll-view scroll-y="true" style="max-height: 1400rpx;">
						<radio-group @change="changeCategory">
							<view class="item">
								<label for="">
									<radio :checked="cid==''" value=""></radio>
									<text>全部分类</text>
								</label>
							</view>
							<view v-for="(item,index) in data" :key="index" class="item">
								<label for="">
									<radio :value="item._id" :checked="cid==item._id"></radio>
									<text>{{item.name}}</text>
								</label>
							</view>
						</radio-group>
					</scroll-view>
				</unicloud-db>
			</view>
			<view class="" style="flex: 1;">
				<unicloud-db ref="udb" collection="opendb-banner"
					field="bannerfile,open_url,title,sort,category_id,status,description" :where="where"
					page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
					:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
					:options="options">
					<uni-table :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection"
						@selection-change="selectionChange">
						<uni-tr>
							<uni-th align="center">标题</uni-th>
							<uni-th align="center">图片文件</uni-th>
							<uni-th align="center">点击目标地址</uni-th>
							<uni-th align="center">排序</uni-th>
							<uni-th align="center">生效状态</uni-th>
							<uni-th align="center">备注</uni-th>
							<uni-th align="center">操作</uni-th>
						</uni-tr>
						<uni-tr v-for="(item,index) in data" :key="index">
							<uni-td align="center"> {{item.title}} </uni-td>
							<uni-td align="center">
								<uni-file-picker v-if="item.bannerfile.fileType == 'image'" :value="item.bannerfile"
									:file-mediatype="item.bannerfile.fileType" return-type="object"
									:imageStyles="imageStyles" readonly></uni-file-picker>
								<uni-link v-else :href="item.bannerfile.url" :text="item.bannerfile.url"></uni-link>
							</uni-td>
							<uni-td align="" width="300">
								<view class="" style="width:300px;overflow: hidden;">
									<text>{{item.open_url}}</text>
								</view>
							</uni-td>
							<uni-td align="center"> {{item.sort}} </uni-td>
							<uni-td align="center"> {{item.status == true ? '✅' : '❌'}} </uni-td>
							<uni-td align="center"> {{item.description}} </uni-td>
							<uni-td align="center">
								<view class="uni-group">
									<button @click="copy(item._id)" class="uni-button" size="mini"
										type="default">复制</button>
									<button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button"
										size="mini" type="primary">修改</button>
									<button @click="confirmDelete(item._id)" class="uni-button" size="mini"
										type="warn">删除</button>
								</view>
							</uni-td>
						</uni-tr>
					</uni-table>
					<view class="uni-pagination-box">
						<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current"
							:total="pagination.count" @change="onPageChanged" />
					</view>
				</unicloud-db>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		enumConverter
	} from '../../js_sdk/validator/opendb-banner.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'sort asc' // 排序字段
	const dbSearchFields = ["title"] // 模糊搜索字段，支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 10
	const pageCurrent = 1

	export default {
		data() {
			return {
				query: '',
				where: '',
				cid: "",
				orderby: dbOrderBy,
				selectedIndexs: [],
				options: {
					pageSize,
					pageCurrent,
					...enumConverter
				},
				imageStyles: {
					width: 64,
					height: 64
				}
			}
		},
		methods: {
			getWhere() {
				const query = this.query.trim()
				if (!query) {
					return ''
				}
				const queryRe = new RegExp(query, 'i')
				return dbSearchFields.map(name => queryRe + '.test(' + name + ')').join(' || ')
			},
			search() {
				const newWhere = this.getWhere()
				let condition = []
				if (newWhere) {
					condition.push(newWhere)
				}
				if (this.cid) {
					condition.push(`category_id=="${this.cid}"`)
				}
				const isSameWhere = condition.join("&&") === this.where
				this.where = condition.join("&&")
				if (isSameWhere) { // 相同条件时，手动强制刷新
					this.loadData()
				}
			},
			loadData(clear = true) {
				this.$refs.udb.loadData({
					clear
				})
			},
			onPageChanged(e) {
				this.$refs.udb.loadData({
					current: e.current
				})
			},
			copy(id) {
				uni.showModal({
					content: "是否确定复制一条？",
					success: (res) => {
						if (res.confirm) {
							db.action("backup").collection("opendb-banner").where({
								_id: id
							}).get().then(() => {
								this.loadData()
							})
							uni.showToast({
								title: "复制成功"
							})
						}
					}
				})

			},
			navigateTo(url, clear) {
				// clear 表示刷新列表时是否清除页码，true 表示刷新并回到列表第 1 页，默认为 true
				uni.navigateTo({
					url,
					events: {
						refreshData: () => {
							this.loadData(clear)
						}
					}
				})
			},
			// 多选处理
			selectedItems() {
				var dataList = this.$refs.udb.dataList
				return this.selectedIndexs.map(i => dataList[i]._id)
			},
			// 批量删除
			delTable() {
				this.$refs.udb.remove(this.selectedItems())
			},
			// 多选
			selectionChange(e) {
				this.selectedIndexs = e.detail.index
			},
			confirmDelete(id) {
				this.$refs.udb.remove(id)
			},
			changeCategory(e) {
				console.log(e)
				this.cid = e.detail.value;
				this.search()
			}
		}
	}
</script>
<style lang="scss">
	.uni-container {
		display: flex;
	}

	.category {
		margin-right: 20rpx;
		width: 350rpx;

		.item {
			margin-top: 22rpx;
			color: #333;
		}
	}
</style>
