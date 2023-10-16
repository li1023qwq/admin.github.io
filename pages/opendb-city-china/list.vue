<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
				<view class="uni-title" @click="chooseItem()">全国</view>
				<view class="uni-sub-title" v-for="(item,index) in selectedCity" :key="index"
					@click="chooseItem(item,index)">
					<text>>{{item.name}}</text>
				</view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length"
					@click="delTable">批量删除</button>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" collection="opendb-city-china"
				field="code,parent_code,name,type,first_letter,is_recommend,pinyin,zip_code" :where="where"
				page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
				:options="options">
				<uni-table :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection"
					@selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">编码</uni-th>
						<uni-th align="center">父级编码</uni-th>
						<uni-th align="center">城市</uni-th>
						<uni-th align="center">城市类型</uni-th>
						<uni-th align="center">首字母</uni-th>
						<uni-th align="center">是否推荐</uni-th>
						<uni-th align="center">拼音</uni-th>
						<uni-th align="center">邮编</uni-th>
						<uni-th width="204" align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center"> {{item.code}} </uni-td>
						<uni-td align="center"> {{item.parent_code}} </uni-td>
						<uni-td align="center"> {{item.name}} </uni-td>
						<uni-td align="center"> {{options.type_valuetotext[item.type]}} </uni-td>
						<uni-td align="center"> {{item.first_letter}} </uni-td>
						<uni-td align="center">
							<view class="" @click="changeBooleanProperty(item,'is_recommend')">
								<text>{{item.is_recommend== true ? '✅' : '❌'}}</text>
							</view>

						</uni-td>
						<uni-td align="center"> {{item.pinyin}} </uni-td>
						<uni-td align="center"> {{item.zip_code}} </uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button v-if="item.type!=2" @click="showNext(item.code,item.name)" class="uni-button"
									size="mini" type="primary">下一级</button>
								<button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button" size="mini"
									type="primary">修改</button>
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
	import {
		enumConverter
	} from '../../js_sdk/validator/opendb-city-china.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'code asc' // 排序字段
	const dbSearchFields = ['code', 'parent_code', 'name', 'first_letter', 'pinyin'] // 模糊搜索字段，支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 20
	const pageCurrent = 1

	export default {
		data() {
			return {
				query: '',
				where: 'type==0',
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
				},
				selectedCity: []
			}
		},
		onLoad(e) {
			if (e.type) {
				this.where = `type==${e.type} && parent_code=="${e.code}"`
			} else {
				this.where = "type==0"
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
				const isSameWhere = newWhere === this.where
				this.where = newWhere
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
			showNext(code, name) {
				this.selectedCity.push({
					name,
					code
				})
				this.where = `parent_code=="${code}"`
			},
			chooseItem(item, index) {
				if (!item) {
					this.where = 'type==0';
					this.selectedCity = []
					return;
				}
				this.where = `parent_code=="${item.code}"`;
				this.selectedCity = this.selectedCity.filter((e, ind) => ind <= index);
			},
			changeBooleanProperty(item, field) {
				item[field] = !item[field];
				db.collection("opendb-city-china").doc(item._id).update({
					[field]: item[field]
				}).then(() => {
					uni.showToast({
						icon: "none",
						title: "更新成功"
					})
					// this.loadData(false)
				})
			}
		}
	}
</script>
<style>
</style>
