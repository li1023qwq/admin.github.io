<template>
	<view>
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length"
					@click="btnEditStatus()">批量开放</button>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" collection="uni-id-score-day-statistics" field="day,money,value,status,open_time"
				:where="where" page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
				:options="options">
				<uni-table :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection"
					@selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">日期</uni-th>
						<uni-th align="center">积分总值</uni-th>
						<uni-th align="center">分红金额</uni-th>
						<uni-th align="center">积分价值</uni-th>
						<uni-th align="center">开放状态</uni-th>
						<uni-th align="center">开放时间</uni-th>
						<uni-th width="204" align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center">
							<uni-dateformat :date="item.day" :threshold="[0, 0]" />
						</uni-td>
						<uni-td align="center"> {{item.value.toFixed(2)}} </uni-td>
						<uni-td align="center">
							<text v-if="item.money" class="price">{{item.money/100}}</text>
							<text v-else>未设置</text>
						</uni-td>
						<uni-td align="center">
							<text v-if="item.money">
								{{(item.money/item.value/100).toFixed(6)}}
							</text>
						</uni-td>
						<uni-td align="center">
							<text v-if="item.status" style="color: #4CD964;">
								{{options.status_valuetotext[item.status]}}
							</text>
							<text v-else>禁用</text>
						</uni-td>
						<uni-td align="center">
							<uni-dateformat v-if="item.open_time" :date="item.open_time" :threshold="[0, 0]" />
						</uni-td>
						<uni-td align="center">
							<view class="uni-group" >
								<block v-if="item.status!=1">
									<button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button" size="mini"
										type="primary">修改</button>
									<button @click="btnEditStatus(item)" class="uni-button" size="mini"
										type="warn">启用</button>
								</block>
								<button @click="btnStatistics(item)" class="uni-button" size="mini"
									type="default">修复统计</button>
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
	} from '../../js_sdk/validator/uni-id-score-day-statistics.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'day desc' // 排序字段
	const dbSearchFields = [] // 模糊搜索字段，支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 10
	const pageCurrent = 1

	export default {
		data() {
			return {
				query: '',
				where: '',
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
			btnEditStatus(item) {
				let ids = [];
				if (!item) {
					let dataList = this.$refs.udb.dataList;
					//必须先设置分红金额
					ids = this.selectedIndexs.map(i => dataList[i].money && dataList[i]._id);
				} else if (item.money > 0) {
					ids = [item._id]
				}
				console.log(ids)
				if (ids.length == 0 || ids.filter(e => !e).length > 0) {
					uni.showToast({
						title: "必须设置分红金额",
						icon: "none"
					})
					return;
				}
				uni.showModal({
					title: "开放状态提示",
					content: "是否确定开放状态，开放后，不允许再修改！",
					success: (res) => {
						if (res.confirm) {
							ids.map(id => {
								if (id) {
									this.$refs.udb.update(id, {
										open_time: Date.now(),
										status: 1
									})
								}
							});

							setTimeout(() => {
								this.loadData(false)
							}, 2000)
						}
					}
				})
			},
			// 多选
			selectionChange(e) {
				this.selectedIndexs = e.detail.index
			},
			confirmDelete(id) {
				this.$refs.udb.remove(id)
			},
			/**
			 * 修复统计
			 * @param {Object} item
			 */
			btnStatistics(item) {
				this.$request(
					'admin/score_day_statistics/repair', {
						id: item._id,
						day: item.day,
					}, {
						functionName: 'tiantian-mall'
					}
				).then(res => {
					uni.hideLoading()
					uni.showToast({
						title: res.message || "操作成功"
					})
					setTimeout(() => {
						this.loadData(false);
					}, 2000)
				});
			}
		}
	}
</script>
<style>
</style>
