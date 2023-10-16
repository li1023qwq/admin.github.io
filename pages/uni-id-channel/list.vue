<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
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
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" collection="uni-id-channel,uni-id-users"
				field="id,modified,title,total,day_total,user_id{nickname,mobile,my_invite_code},status" :where="where"
				page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
				:options="options" @load="loaded">
				<uni-table :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection"
					@selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">渠道号</uni-th>
						<uni-th align="center">渠道名称</uni-th>
						<uni-th align="center">用户</uni-th>
						<uni-th align="center">状态</uni-th>
						<uni-th align="center">总计</uni-th>
						<uni-th align="center">近10日</uni-th>
						<uni-th width="204" align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center"> {{item.id}} </uni-td>
						<uni-td align="center"> {{item.title}} </uni-td>
						<uni-td align="">
							<view class="" v-if="item.user_id">
								<view class="">
									<text>{{item.user_id.nickname}}</text>
								</view>
								<view class="">
									<text>{{item.user_id.mobile}}</text>
								</view>
							</view>
							<view class="" v-else>
								<text>未绑定</text>
							</view>
						</uni-td>
						<uni-td align="center">{{options.status_valuetotext[item.status]}} </uni-td>
						<uni-td align="center"> {{item.total}} </uni-td>
						<uni-td align="center">
							<view v-for="(item2,index2) in item.dayTotals" :key="index2">
								<text>{{item2.name}}</text>
								<text class="margin-left-10">{{item2.amount}}</text>
							</view>
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="getQrCode(item)" class="uni-button" size="mini"
									type="default">二维码</button>
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
		<uni-popup ref="qrPopup" type="center">
			<view class="">
				<image :src="qrcode" mode="aspectFill" style="width: 200px;height: 200px;"></image>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import {
		enumConverter
	} from '../../js_sdk/validator/uni-id-channel.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'id desc' // 排序字段
	const dbSearchFields = ['title', 'id'] // 模糊搜索字段，支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 10
	const pageCurrent = 1

	export default {
		data() {
			return {
				qrcode: "",
				filters: "",
				filterBtns: [{
					title: "待审核",
					condition: "status==1"
				}, {
					title: "已通过",
					condition: "status==2"
				}, {
					title: "已拒绝",
					condition: "status==3"
				}],
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
			setFilters(str) {
				this.filters = str;
				this.search();
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
				let condition = []
				if (newWhere) {
					condition.push(`(${newWhere})`)
				}
				if (this.filters) {
					condition.push(this.filters)
				}
				newWhere = condition.join(" && ");
				const isSameWhere = newWhere === this.where
				this.where = newWhere;
				console.log(this.where)
				if (isSameWhere) { // 相同条件时，手动强制刷新
					this.loadData()
				}
			},
			loaded(data) {
				data.forEach(item => {
					if (item.user_id && item.user_id.length > 0) {
						item.user_id = item.user_id[0]
					}

					if (!item.total) {
						item.total = 0
					}
					if (!item.day_total) {
						item.day_total = {}
					}
					//只显示最近10天的数据
					let dayTotals = []
					for (let day in item.day_total) {
						dayTotals.push({
							day,
							name: this.$formatDate(day * 1, "MM月dd日"),
							amount: item.day_total[day]
						})
					}
					//倒序排序
					dayTotals.sort((a, b) => {
						return b.day - a.day
					})
					dayTotals.splice(10, dayTotals.length - 10);
					item.dayTotals = dayTotals;
				})
			},
			getQrCode(info) {
				let share = {
					...this.$store.state.app.share
				};
				//处理邀请链接
				share.href = this.$stringFormat(share.href, {
					my_invite_code: info.user_id.my_invite_code,
					channel_code: info.id
				});
				console.log("share.href", share.href)
				this.$refs.qrPopup.open();
				uniCloud.callFunction({
					name: "tiantian-qr-image",
					data: {
						url: encodeURIComponent(share.href)
					},
					success: ({
						result
					}) => {
						this.qrcode = result.image
						// console.log("qrcode", result.image)
					},
					fail: () => {}
				})
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
