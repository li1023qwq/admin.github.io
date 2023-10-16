<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title">退换货管理</view>
				<view class="uni-sub-title">
					<button class="uni-button" v-for="(item,index) in filterBtns" :key="index"
						:type="filters==item.condition?'primary':'default'" size="mini"
						@click="setFilters(item.condition)">{{item.title}}</button>
				</view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<!-- <download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData"
					:type="exportExcel.type" :name="exportExcel.filename">
					<button class="uni-button" type="primary" size="mini">导出 Excel</button>
				</download-excel> -->
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" :collection="collectionList"
				field="create_time,update_time,operater_log,id,order_id,type,reason,goods_status,shop_id,describe,imgs,money,platform,state,user_id,goods,shop,result"
				:where="where" page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
				:options="options" loadtime="manual" @load="onqueryload">
				<uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe
					@selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">编号</uni-th>
						<uni-th align="center">售后类型</uni-th>
						<uni-th align="center">原因</uni-th>
						<uni-th align="center">商品</uni-th>
						<uni-th align="center">退款金额</uni-th>
						<uni-th align="center">申请时间</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center">{{item.id}}</uni-td>
						<uni-td align="center">{{options.typeEnum[item.type]}}</uni-td>
						<uni-td align="">
							<view class="">
								<text>{{item.goods_status}}</text>
							</view>
							<view class="">
								<text>{{item.reason}}</text>
							</view>
							<view class="">
								<text>详细说明：</text>
								<text v-if="item.describe">{{item.describe}}</text>
								<text v-else>无</text>
							</view>
						</uni-td>
						<uni-td align="" width="300">
							<view v-for="(goods,index2) in [item.goods]" :key="index2" class="margin-top-10">
								<view class="">
									<text>{{index2+1}}：</text>
									<text>{{goods.name}}</text>
								</view>
								<view class="ti-flex">
									<image :src="goods.goods_thumb" mode="aspectFill" class="image-width-80"></image>
									<view class="margin-left-30 flex-1">
										<view class="">
											<text>规格：{{goods.sku_name}}</text>
										</view>
										<view class="">
											<text class="">价格：</text>
											<text class="price">{{goods.price/100}}</text>
											<text class="margin-left-30">数量：</text>
											<text class="font-38">{{goods.amount}}</text>
										</view>
										<view class="colorBlue" v-if="goods.delivery"
											@click="showExpress(goods.delivery)">
											<text>{{goods.delivery.company}}：</text>
											<text>{{goods.delivery.number}}</text>
											<text class="margin-left-10">详情></text>
										</view>
									</view>
								</view>
							</view>
							<view class="ti-flex">
								<view v-for="(img,index) in item.imgs" :key="index">
									<image :src="img" mode="aspectFill" class="image-width-80"></image>
								</view>
							</view>
						</uni-td>
						<uni-td align="center">
							<text class="price">{{item.money/100}}</text>
						</uni-td>
						<uni-td align="center">
							<uni-dateformat :threshold="[0, 0]" :date="item.create_time"></uni-dateformat>
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="confirmPass(item._id)" class="uni-button" size="mini"
									type="primary">通过</button>
								<button @click="confirmDelete(item._id)" class="uni-button" size="mini"
									type="warn">拒绝</button>
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
		<uni-popup type="center" ref="expressDetailPopup">
			<view class="padding-20 bg-white">
				<tian-express-detail @canceled="closeExpressDetailPopup" :value="expressValue">
				</tian-express-detail>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import {
		enumConverter,
		filterToWhere
	} from '../../js_sdk/validator/tian-mall-order-refunds.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'id asc' // 排序字段
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
				filters: "state==0",
				filterBtns: [{
					title: "待处理",
					condition: "state==0"
				}, {
					title: "已通过",
					condition: "state==1"
				}, {
					title: "已拒绝",
					condition: "state==2"
				}],
				expressValue: {},
				collectionList: "tian-mall-order-refunds",
				query: '',
				where: '',
				orderby: dbOrderBy,
				orderByFieldName: "",
				selectedIndexs: [],
				options: {
					pageSize,
					pageCurrent,
					filterData: {},
					...enumConverter
				},
				imageStyles: {
					width: 64,
					height: 64
				},
				exportExcel: {
					"filename": "tian-mall-order-refunds.xls",
					"type": "xls",
					"fields": {
						"create_time": "create_time",
						"update_time": "update_time",
						"后台操作日志，0最新操作": "operater_log",
						"编号": "id",
						"订单编号": "order_id",
						"售后类型": "type",
						"原因": "reason",
						"商品状态": "goods_status",
						"店铺id": "shop_id",
						"描述": "describe",
						"图片描述": "imgs",
						"退款金额，单位分": "money",
						"操作平台": "platform",
						"退款状态": "state",
						"用户": "user_id",
						"商品": "goods",
						"店铺信息": "shop",
						"退款结果": "result"
					}
				},
				exportExcelData: []
			}
		},
		onLoad() {
			this._filter = {}
			this.search();
		},
		onReady() {
			this.$refs.udb.loadData()
		},
		methods: {
			setFilters(str) {
				this.filters = str;
				this.search();
			},
			showExpress(item) {
				this.showNumber = true;
				console.log("expressValue", item)
				//快递发货,弹出输入单号
				this.$refs.expressDetailPopup.open()
				setTimeout(() => {
					this.expressValue = item;
				}, 200)
			},
			closeExpressDetailPopup() {
				console.log("closeExpressPopup")
				this.$refs.expressDetailPopup.close()
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
				if (this.cid) {
					condition.push(`category_id._id=="${this.cid}"`)
				}
				newWhere = condition.join(" && ");
				this.where = newWhere;
				console.log(this.where)
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
			confirmPass(id) {
				this.confirmAction(() => {
					this.$request(
						'admin/order/refund', {
							id,
							type: "pass",
						}, {
							functionName: 'tiantian-mall'
						}
					).then(res => {
						uni.hideLoading()
						uni.showToast({
							title: "操作成功"
						})
						setTimeout(() => {
							this.search();
						}, 2000)
					});
				}, "是否确定通过申请？")
			},
			confirmDelete(id) {
				this.confirmAction(() => {
					this.$request(
						'admin/order/refund', {
							id,
							type: "rejected",
						}, {
							functionName: 'tiantian-mall'
						}
					).then(res => {
						uni.hideLoading()
						uni.showToast({
							title: "操作成功"
						})
						setTimeout(() => {
							this.search();
						}, 2000)
					});
				}, "是否确定拒绝申请？")
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
