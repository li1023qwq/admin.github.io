<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
				<view class="uni-sub-title"></view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length"
					@click="delTable">批量删除</button>
				<download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData"
					:type="exportExcel.type" :name="exportExcel.filename">
					<button class="uni-button" type="primary" size="mini">导出 Excel</button>
				</download-excel>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" :collection="collectionList"
				field="title,blessing,open,type,payment,platforms{text,value},auto_show,total_money,status,background,avatar,dcloud_appid{name},stock,get_count,get_limit,moneys,create_date"
				:where="where" page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
				:options="options" loadtime="manual" @load="onqueryload">
				<uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe
					type="selection" @selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">应用</uni-th>
						<uni-th align="center">标题</uni-th>
						<uni-th align="center" filter-type="select" :filter-data="options.filterData.type_localdata"
							@filter-change="filterChange($event, 'type')">类型</uni-th>
						<uni-th align="center" sortable @sort-change="sortChange($event, 'status')">生效状态</uni-th>
						<uni-th align="center">已领取/总量</uni-th>
						<uni-th align="center">总金额</uni-th>
						<uni-th align="center">领取限制</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center">
							<view class="">
								<text>{{item.dcloud_appid && item.dcloud_appid[0] && item.dcloud_appid[0].name}}</text>
							</view>
							<view class="" v-if="item.platforms">
								<text>{{item.platforms.map(e=>e.text).join(",")}}</text>
							</view>
						</uni-td>
						<uni-td align="center">{{item.title}}</uni-td>
						<uni-td align="center">{{options.type_valuetotext[item.type]}}</uni-td>
						<uni-td align="center">{{item.status == true ? '✅' : '❌'}}</uni-td>
						<uni-td align="center">{{item.get_count}}/{{item.stock+item.get_count}}</uni-td>
						<uni-td align="center">
							<text class="price" v-if="item.total_money">{{item.total_money/100}}</text>
							<text v-else>无</text>
						</uni-td>
						<uni-td align="center">{{item.get_limit}}</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="navigateTo('./logs?id='+item._id, false)" class="uni-button" size="mini"
									type="default">领取日志</button>
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
	} from '../../js_sdk/validator/tian-redbag.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'create_date desc' // 排序字段
	const dbSearchFields = [] // 模糊搜索字段，支持模糊搜索的字段列表。联表查询格式: 主表字段名.副表字段名，例如用户表关联角色表 role.role_name
	// 分页配置
	const pageSize = 20
	const pageCurrent = 1

	const orderByMapping = {
		"ascending": "asc",
		"descending": "desc"
	}

	export default {
		data() {
			return {
				collectionList:"tian-redbag,tian-platforms,opendb-app-list",
				query: '',
				where: '',
				orderby: dbOrderBy,
				orderByFieldName: "",
				selectedIndexs: [],
				options: {
					pageSize,
					pageCurrent,
					filterData: {
						"type_localdata": [{
								"text": "新人注册",
								"value": "newpeople"
							},
							{
								"text": "小区圈发帖",
								"value": "addcircle"
							}
						],
						"payment_localdata": [{
								"text": "余额",
								"value": "balance"
							},
							{
								"text": "微信",
								"value": "wxpay"
							},
							{
								"text": "支付宝",
								"value": "alipay"
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
					"filename": "tian-redbag.xls",
					"type": "xls",
					"fields": {
						"标题": "title",
						"祝福语": "blessing",
						"打开词": "open",
						"类型": "type",
						"支付方式": "payment",
						"自动展示": "auto_show",
						"生效状态": "status",
						"红包背景": "background",
						"默认头像": "avatar",
						"应用id": "dcloud_appid",
						"小区id": "housing_appid",
						"限定数量": "stock",
						"已领取": "get_count",
						"领取限制": "get_limit",
						"领取金额": "moneys"
					}
				},
				exportExcelData: []
			}
		},
		onLoad() {
			this._filter = {}
		},
		onReady() {
			this.$refs.udb.loadData()
		},
		methods: {
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
				const newWhere = this.getWhere()
				this.where = newWhere
				this.$nextTick(() => {
					this.loadData()
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

<style lang="scss">
</style>
