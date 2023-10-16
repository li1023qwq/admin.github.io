<template>
	<view>
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="primary" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="warn" size="mini" :disabled="!selectedIndexs.length"
					@click="delTable">批量删除</button>
				<tian-cloud-async name="tian-identity" primaryKey="key" :condition="{type:'sysconfig'}" :onlyAdd="true">
				</tian-cloud-async>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" collection="tian-identity"
				field="name,dataType,key,data,dcloud_appid,description,type" :where="where" page-data="replace"
				:orderby="orderby" :getcount="true" :page-size="options.pageSize" :page-current="options.pageCurrent"
				v-slot:default="{data,pagination,loading,error,options}" :options="options" @load="loaded">
				<uni-table :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection"
					@selection-change="selectionChange">
					<uni-tr>
						<uni-th width="204" align="center">名称</uni-th>
						<uni-th align="center">关键字</uni-th>
						<uni-th align="center">值</uni-th>
						<uni-th width="204" align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td width="100">
							{{item.name}}
						</uni-td>
						<uni-td>
							{{item.key}}
						</uni-td>
						<uni-td>
							<view v-if="item.dataType=='bool'">
								<text @click="changeBooleanProperty(item)">{{item.data == 'true' ? '✅' : '❌'}}</text>
							</view>
							<view class="" v-else style="width: 400px;white-space: normal;word-wrap: break-word;">
								<text>{{item.data}}</text>
							</view>
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button" size="mini"
									type="primary">修改</button>
								<button @click="copy(item)" class="uni-button" size="mini" type="primary">复制</button>
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
</template>

<script>
	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'key asc' // 排序字段
	const dbSearchFields = ["name", "key"] // 模糊搜索字段，支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 20
	const pageCurrent = 1

	export default {
		data() {
			return {
				query: '',
				where: "type=='sysconfig'",
				orderby: dbOrderBy,
				selectedIndexs: [],
				options: {
					pageSize,
					pageCurrent,
				},
				imageStyles: {
					width: 64,
					height: 64
				}
			}
		},
		methods: {
			loaded(data) {
				let maxLength = 100;
				data.forEach(item => {
					/* if (item.dataType == "object" || item.dataType == "array") {
						item.data = JSON.parse(item.data)
					} */
					//最多显示200字符
					if (item.data && item.data.length > maxLength) {
						item.originData = item.data;
						item.data = item.data.substr(0, maxLength) + "..."
					}
				})
			},
			changeBooleanProperty(item) {
				uni.showModal({
					content: "是否确定修改？",
					success: (res) => {
						if (res.confirm) {
							uni.showLoading({
								mask: true
							})
							let field = "data";
							item[field] = item[field] == "true" ? "false" : "true";
							db.collection("tian-identity").doc(item._id).update({
								[field]: item[field],
							}).then(() => {
								uni.showToast({
									title: "更新成功"
								})
							})
						}
					}
				})
			},
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
				const isSameWhere = newWhere === this.where
				if (newWhere) {
					this.where = "type=='sysconfig' && " + newWhere
				} else {
					this.where = "type=='sysconfig'"
				}
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
			copy(item) {
				uni.showModal({
					content: "是否确定复制？",
					success: (res) => {
						if (res.confirm) {
							let keys = item.key.split(".");
							keys.pop();
							keys.push("")
							let item2 = {
								...item,
								key: keys.join(".")
							}
							//展示数据被裁剪
							if (item.originData) {
								item2.data = item.originData;
								delete item2.originData;
							}
							delete item2._id;
							db.collection("tian-identity").add(item2).then(({
								result
							}) => {
								console.log(result)
								if (result.id) {
									this.navigateTo('./edit?id=' + result.id, false)
								}
								// this.loadData(false)
							});
						}
					}
				})
			}
		}
	}
</script>
<style>
</style>
