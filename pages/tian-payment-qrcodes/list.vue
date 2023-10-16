<template>
	<view>
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" collection="tian-payment-qrcodes"
				field="total_fee,rebate,user_id,shop_id,src,title,body,outTradeNo,shop,payment,payInfo,profitsharing,isProfitsharing,state,id,create_time,update_time"
				:where="where" page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
				:options="options">
				<uni-table :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection"
					@selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">订单id</uni-th>
						<uni-th align="center">付款/返利</uni-th>
						<uni-th align="center">商户</uni-th>
						<uni-th align="center">支付信息</uni-th>
						<uni-th align="center">下单时间</uni-th>
						<uni-th width="204" align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center"> {{item.id}} </uni-td>
						<uni-td align="center">
							<text class="price">{{item.total_fee/100}}</text>
							<text>/</text>
							<text class="price">{{item.rebate/100}}</text>
						</uni-td>
						<uni-td align="center">
							<view class="">
								<text>{{item.shop.name}}</text>
								<view class="">
									<image :src="item.shop.src" mode="aspectFill" class="image-width-80"></image>
								</view>
							</view>
						</uni-td>
						<uni-td align="" width="300">
							<block v-if="item.payInfo">
								<view class="">
									<text>支付方式：{{item.payInfo.type}}</text>
								</view>
								<view class="">
									<text>支付金额：</text><text class="price">{{item.payInfo.totalFee/100}}</text>
								</view>
								<view class="">
									<text>子商户：{{item.payInfo.subMchId}}</text>
								</view>
								<view class="">
									<text>银行卡：{{item.payInfo.bankType}}</text>
								</view>
								<view class="">
									<text>付款号：{{item.payInfo.transactionId}}</text>
								</view>
								<view class="">
									<text>支付号：{{item.outTradeNo}}</text>
								</view>
							</block>

						</uni-td>
						<uni-td align="center">
							<uni-dateformat :date="item.create_time" :threshold="[0, 0]" />
						</uni-td>
						<uni-td align="center">
							<view class="uni-group" v-if="!item.isProfitsharing">
								<button @click="orderamountquery(item._id)" class="uni-button" size="mini"
									type="primary">查询分账</button>
								<button @click="orderprofitsharing(item._id)" class="uni-button" size="mini"
									type="warn">平台分账</button>
							</view>
							<view class="" v-else>
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
	} from '../../js_sdk/validator/tian-payment-qrcodes.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'create_time desc' // 排序字段
	const dbSearchFields = [] // 模糊搜索字段，支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 8
	const pageCurrent = 1

	export default {
		data() {
			return {
				query: '',
				where: 'state==1',
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
			orderamountquery(id) {
				this.$request(
					'admin/order/profitsharingorderamountquery', {
						id,
						module: "shopqr"
					}, {
						functionName: 'tiantian-mall'
					}
				).then((result) => {
					console.log(result)
					uni.showToast({
						icon: "none",
						title: "金额：￥" + result / 100
					})
				})
			},
			orderprofitsharing(id) {
				this.$request(
					'admin/order/orderprofitsharing', {
						id,
						module: "shopqr"
					}, {
						functionName: 'tiantian-mall'
					}
				).then((result) => {
					console.log(result)
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
			}
		}
	}
</script>
<style>
</style>
