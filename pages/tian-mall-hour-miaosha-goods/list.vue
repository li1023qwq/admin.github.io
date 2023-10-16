<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title">秒杀商品管理</view>
				<view class="uni-sub-title">
					<button class="uni-button" v-for="(item,index) in filterBtns" :key="index"
						:type="filters==item.condition?'primary':'default'" size="mini"
						@click="setFilters(item.condition)">{{item.title}}</button>
				</view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length"
					@click="delTable">批量删除</button>
				<button class="uni-button" type="warn" size="mini" @click="refreshMiaosha">更新秒杀</button>
				<download-excel class="hide-on-phone" :fields="exportExcel.fields"
					:data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
					<button class="uni-button" type="primary" size="mini">导出 Excel</button>
				</download-excel>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" :collection="collectionList"
				field="miaosha_id,goods_id,sku_id,posid,discount,is_limit,limit_stock,limit_order_count,limit_user_count,state,miaosha,sku,goods,price"
				:where="where" page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
				:options="options" loadtime="manual" @load="onqueryload">
				<uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe
					type="selection" @selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">秒杀场次</uni-th>
						<uni-th align="center">商品信息</uni-th>
						<uni-th align="center">商品规格</uni-th>
						<uni-th align="center">秒杀价</uni-th>
						<uni-th align="center">折扣</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'is_limit')">限购</uni-th>
						<uni-th align="center" filter-type="select" :filter-data="options.filterData.state_localdata"
							@filter-change="filterChange($event, 'state')">状态</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center">{{miaoshaMap[item.miaosha_id]}}</uni-td>
						<uni-td align="">{{item.goods?item.goods.name:""}}</uni-td>
						<uni-td align="center">{{item.sku?item.sku.sku_name:""}}</uni-td>
						<uni-td align="center">
							<text class="price">{{item.price/100}}</text>
						</uni-td>
						<uni-td align="center">{{item.discount}}%</uni-td>
						<uni-td align="">
							<view class="">
								<text>{{item.is_limit == true ? '' : '❌'}}</text>
							</view>
							<view class="ti-flex" v-if="item.is_limit"
								style="flex-direction: column;align-items: flex-start;">
								<text>秒杀库存：{{item.limit_stock}}</text>
								<text>订单限购：{{item.limit_order_count}}</text>
								<text>用户限购：{{item.limit_user_count}}</text>
							</view>
						</uni-td>
						<uni-td align="center">{{options.state_valuetotext[item.state]}}</uni-td>
						<uni-td align="center">
							<view class="uni-group">
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
		enumConverter,
		filterToWhere
	} from '../../js_sdk/validator/tian-mall-hour-miaosha-goods.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'modified desc' // 排序字段
	const dbSearchFields = [] // 模糊搜索字段，支持模糊搜索的字段列表。联表查询格式: 主表字段名.副表字段名，例如用户表关联角色表 role.role_name
	// 分页配置
	const pageSize = 10
	const pageCurrent = 1

	const orderByMapping = {
		"ascending": "asc",
		"descending": "desc"
	}

	export default {
		data() {
			return {
				filters: ``,
				filterBtns: [],
				collectionList: "tian-mall-hour-miaosha-goods",
				query: '',
				where: '',
				orderby: dbOrderBy,
				orderByFieldName: "",
				selectedIndexs: [],
				miaoshaMap: {},
				options: {
					pageSize,
					pageCurrent,
					filterData: {
						"state_localdata": [{
								"text": "审核中",
								"value": 0
							},
							{
								"text": "已发布",
								"value": 1
							},
							{
								"text": "拒绝",
								"value": 2
							}
						]
					},
					...enumConverter
				},
				imageStyles: {
					width: 64,
					height: 64
				},
				exportExcel: {
					"filename": "tian-mall-hour-miaosha-goods.xls",
					"type": "xls",
					"fields": {
						"秒杀场次": "miaosha_id",
						"商品": "goods_id",
						"商品规格": "sku",
						"排序，正序": "posid",
						"折扣": "discount",
						"是否限购": "is_limit",
						"总库存": "limit_stock",
						"订单限购数量": "limit_order_count",
						"用户限购数量": "limit_user_count",
						"状态": "state",
						"秒杀信息": "miaosha",
						"商品信息": "goods"
					}
				},
				exportExcelData: []
			}
		},
		onLoad() {
			this._filter = {}
			this.getMiaoshaChangci()
		},
		onReady() {
			// this.$refs.udb.loadData()

		},
		methods: {
			refreshMiaosha() {
				uni.showLoading({
					title: "更新中"
				})
				uniCloud.callFunction({
					name: "tiantian-mall-miaosha"
				}).then(() => {
					uni.hideLoading()
					uni.showToast({
						icon: 'none',
						title: "更新完成"
					})
				})

			},
			getMiaoshaChangci() {
				db.collection("tian-mall-hour-miaosha").get().then(({
					result
				}) => {
					this.filterBtns = result.data.map(e => {
						return {
							title: e.name,
							condition: `miaosha_id=="${e._id}"`
						}
					})
					this.miaoshaMap = result.data.reduce((pre, item) => {
						pre[item._id] = item.name;
						return pre;
					}, {})
					this.search()
				})
			},
			setFilters(str) {
				this.filters = str;
				this.search();
			},
			onqueryload(data) {
				this.exportExcelData = data
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
				let newWhere = this.getWhere()
				let condition = [`shop_id=="${this.adminShopId}"`]
				if (newWhere) {
					condition.push(`(${newWhere})`)
				}
				if (this.filters) {
					condition.push(this.filters)
				}
				// if (this.cid) {
				// 	condition.push(`category_id._id=="${this.cid}"`)
				// }
				newWhere = condition.join(" && ");
				const isSameWhere = newWhere === this.where
				this.where = newWhere;
				console.log(this.where)
				this.$nextTick(() => {
					this.loadData(true)
				})
			},
			loadData(clear = true) {
				this.$refs.udb.loadData({
					clear
				})
			},
			onPageChanged(e) {
				this.selectedIndexs.length = 0
				this.$refs.table.clearSelection()
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
				this.$refs.udb.remove(this.selectedItems(), {
					success: (res) => {
						this.$refs.table.clearSelection()
					}
				})
			},
			// 多选
			selectionChange(e) {
				this.selectedIndexs = e.detail.index
			},
			confirmDelete(id) {
				this.$refs.udb.remove(id, {
					success: (res) => {
						this.$refs.table.clearSelection()
					}
				})
			},
			sortChange(e, name) {
				this.orderByFieldName = name;
				if (e.order) {
					this.orderby = name + ' ' + orderByMapping[e.order]
				} else {
					this.orderby = ''
				}
				this.$refs.table.clearSelection()
				this.$nextTick(() => {
					this.$refs.udb.loadData()
				})
			},
			filterChange(e, name) {
				this._filter[name] = {
					type: e.filterType,
					value: e.filter
				}
				let newWhere = filterToWhere(this._filter, db.command)
				if (Object.keys(newWhere).length) {
					this.where = newWhere
				} else {
					this.where = ''
				}
				this.$nextTick(() => {
					this.$refs.udb.loadData()
				})
			}
		}
	}
</script>

<style>
</style>
