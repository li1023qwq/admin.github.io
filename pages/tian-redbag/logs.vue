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
				<download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData"
					:type="exportExcel.type" :name="exportExcel.filename">
					<button class="uni-button" type="primary" size="mini">导出 Excel</button>
				</download-excel>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" :collection="collectionList" :where="where" page-data="replace" :orderby="orderby"
				:getcount="true"
				field="dcloud_appid,user,redbag_id,payment,money,type,type_text,update_date,create_date"
				:page-size="options.pageSize" :page-current="options.pageCurrent"
				v-slot:default="{data,pagination,loading,error,options}" :options="options" loadtime="manual"
				@load="onqueryload">
				<uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe>
					<uni-tr>
						<uni-th align="center">用户</uni-th>
						<uni-th align="center">支付方式</uni-th>
						<uni-th align="center">金额</uni-th>
						<uni-th align="center">类型</uni-th>
						<uni-th align="center">更新时间</uni-th>
						<uni-th align="center">领取时间</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center">
							<tian-user :value="[item.user]"></tian-user>
						</uni-td>
						<uni-td align="center">{{options.payment_valuetotext[item.payment]}}</uni-td>
						<uni-td align="center">
							<text class="price">{{item.money/100}}</text>
						</uni-td>
						<uni-td align="center">{{item.type_text}}</uni-td>
						<uni-td align="center">
							<uni-dateformat :date="item.update_date"></uni-dateformat>
						</uni-td>
						<uni-td align="center">
							<uni-dateformat :date="item.create_date"></uni-dateformat>
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
	} from '../../js_sdk/validator/tian-redbag-users.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'create_date desc' // 排序字段
	const dbSearchFields = ['user.nickname'] // 模糊搜索字段，支持模糊搜索的字段列表。联表查询格式: 主表字段名.副表字段名，例如用户表关联角色表 role.role_name
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
				collectionList: "tian-redbag-users",
				query: '',
				where: '',
				_id: "",
				orderby: dbOrderBy,
				orderByFieldName: "",
				selectedIndexs: [],
				options: {
					pageSize,
					pageCurrent,
					filterData: {
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
						],
					},
					...enumConverter
				},
				imageStyles: {
					width: 64,
					height: 64
				},
				exportExcel: {
					"filename": "tian-redbag-users.xls",
					"type": "xls",
					"fields": {
						"应用id": "dcloud_appid",
						"用户": "user_id",
						"红包id": "redbag_id",
						"支付方式": "payment",
						"金额": "money",
						"类型": "type_text",
						"update_date": "update_date",
						"create_date": "create_date"
					}
				},
				exportExcelData: []
			}
		},
		onLoad(e) {
			this._filter = {}
			if (e.id) {
				this._id = e.id
			}
		},
		onReady() {
			// this.$refs.udb.loadData()
			this.search()
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
				let newWhere = this.getWhere()
				let condition = [`redbag_id=="${this._id}"`]
				if (newWhere) {
					condition.push(newWhere)
				}
				this.where = condition.join("&&")
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

<style>
</style>
