<template>
	<view>
		<view class="uni-header">
			<view class="uni-group hide-on-phone">
				<view class="uni-title"></view>
				<view class="">
					<view class="uni-sub-title ti-flex">
						<uni-data-checkbox v-model="month" :localdata="formOptions.months" @change="changeMonth" />
						<button class="uni-button" type="default" size="mini" @click="getStatistics()">统计</button>
						<button class="uni-button" type="primary" size="mini" @click="getMonthTotal()">总计</button>
						<button class="uni-button" type="warn" size="mini" @click="getMonthFilter()">过滤</button>
						<text class="margin-left-30">总计：{{total}}</text>
					</view>
					<view class="ti-flex margin-top-20">
						<text class="">积分单价：</text>
						<input class="uni-search " type="text" v-model="unit" placeholder="请输入积分单价" />
						<text>积分限制：</text>
						<input class="uni-search" type="text" v-model="minScore" placeholder="请输入积分限制" />
						<button class="uni-button" type="warn" size="mini" @click="setScoreMoney()">分红</button>
					</view>
					<view class="margin-top-20 colorBlue">
						<text>操作步骤：1选择月份，设置积分单价，积分限制，2点击统计，等待全部分页执行完成，3点击过滤，只显示有效的用户，4点击分红，等待分页执行</text>
					</view>
				</view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" @load="onqueryload" collection="uni-id-users,uni-id-roles" :options="options"
				:where="where" foreign-key="uni-id-roles.role_id"
				field="_id,username,avatar,nickname,role.role_id,role.role_name,statistics,inviter_uid,score,score_log,score_cashout,score_month,balance,coupon,my_invite_code,mobile,email,status,register_date,score_charge_rate"
				page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error}">
				<view class=" margin-bottom-30">
					<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current"
						:total="pagination.count" @change="onPageChanged" />
				</view>
				<uni-table :loading="loading" :emptyText="error.message || '没有更多数据，请调整筛选条件'" border stripe
					type="selection" @selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">用户</uni-th>
						<uni-th align="center">积分</uni-th>
						<uni-th align="center">余额</uni-th>
						<uni-th width="204" align="center">任务</uni-th>
						<uni-th align="center">每月积分</uni-th>
						<uni-th align="center">积分兑现金</uni-th>
						<uni-th width="170" align="center">创建时间</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="">
							<view class="">
								<text>{{item.nickname}}</text>
							</view>
							<view class="">
								<text>{{item.mobile}}</text>
							</view>
						</uni-td>
						<uni-td align="center">
							<view class="">
								<text>{{item.score?item.score.toFixed(4):0}}</text>
							</view>
							<button @click="navigateTo('/pages/uni-id-scores/list?uid='+item._id, false)"
								class="uni-button" size="mini" type="default">查看日志</button>
						</uni-td>
						<uni-td align="center">
							<view class="">
								<text class="price">{{item.balance?item.balance/100:0}}</text>
							</view>
							<button @click="navigateTo('/pages/uni-id-balances/list?uid='+item._id, false)"
								class="uni-button" size="mini" type="default">查看日志</button>
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="navigateTo('/pages/uni-id-task-log/list?uid='+item._id, false)"
									class="uni-button" size="mini" type="default">任务日志</button>
							</view>
						</uni-td>
						<uni-td align="">
							<view v-if="item.score_month" v-for="(item2,index2) in item.score_month" :key="index2"
								class="margin-top-10 flex-1 ti-flex">
								<uni-dateformat :date="index2*1" :threshold="[0, 0]" format="yyyy-MM" />
								<text class="flex-1">：{{item2.toFixed(2)}}</text>
								<button v-if="!item.score_cashout || item.score_cashout.day < index2"
									class="uni-button margin-left-10" type="warn" size="mini"
									@click="setItemScore2money(item,index2*1,true)">分红</button>
							</view>
						</uni-td>
						<uni-td align="">
							<view class="" v-if="item.score_cashout">
								<view class="">
									<text>数量：{{item.score_cashout.amount}}</text>
								</view>
								<view class="">
									<text>金额：</text>
									<text class="price">{{item.score_cashout.money/100}}</text>
								</view>
								<uni-dateformat :date="item.score_cashout.day*1" :threshold="[0, 0]" />
							</view>
						</uni-td>
						<uni-td align="center">
							<uni-dateformat :date="item.register_date" :threshold="[0, 0]" />
						</uni-td>
					</uni-tr>
				</uni-table>
				<view class="uni-pagination-box">
					<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current"
						:total="pagination.count" @change="onPageChanged" />
				</view>
			</unicloud-db>
		</view>
		<!-- #ifndef H5 -->
		<fix-window />
		<!-- #endif -->
	</view>
</template>

<script>
	const db = uniCloud.database()
	const cmd = db.command;
	const $ = cmd.aggregate;
	// 表查询配置
	const dbOrderBy = 'register_date desc' // 排序字段
	const dbSearchFields = ['username', 'nickname', 'role_name', 'mobile', 'email'] // 支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 100
	const pageCurrent = 1

	import {
		mapState
	} from 'vuex'
	export default {
		data() {
			return {
				month: 0,
				begin: 0,
				end: 0,
				total: 0,
				money: '',
				unit: 0.005,
				minScore: 100,
				query: '',
				where: '',
				conditions: [],
				orderby: dbOrderBy,
				options: {
					pageSize,
					pageCurrent
				},
				formOptions: {
					months: []
				},
				selectedIndexs: [] //批量选中的项
			}
		},
		onLoad() {
			this.getLastMonths()
		},
		computed: {
			...mapState('user', ['userInfo']),
		},
		methods: {
			getLastMonths() {
				//最近6个月
				let date = new Date();
				date.setDate(1);
				date.setHours(0);
				date.setMinutes(0);
				date.setSeconds(0);
				date.setMilliseconds(0)
				let m = date.getMonth();
				for (let i = 1; i < 6; i++) {
					date.setMonth(m - i)
					let month = date.getMonth();
					if (i == 1) {
						this.month = date.getTime();
					}
					this.formOptions.months.push({
						"text": (month + 1) + "月",
						"value": date.getTime()
					})
				}
			},
			onqueryload(data) {
				data.forEach(item => {
					item.nickname = item.nickname ? item.nickname : "未填写昵称"
					item.role = item.role ? item.role.map(item => item.role_name).join('、') : ""
					item.status = this.parseUserStatus(item.status);
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
			search(e) {
				let newWhere = this.getWhere();
				let fiters = [];
				if (newWhere) {
					fiters.push(`(${newWhere})`)
				}
				for (let key in this.conditions) {
					fiters.push(this.conditions[key])
				}
				/* if(fiters.length>0){
					return;
				} */
				newWhere = fiters.join(" && ");
				console.log("where", newWhere)
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
			navigateTo(url, clear) { // clear 表示刷新列表时是否清除当前页码，true 表示刷新并回到列表第 1 页，默认为 true
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
			//批量删除
			delTable() {
				const ids = this.selectedItems()
				const currentUserId = this.userInfo._id
				if (ids.includes(currentUserId)) {
					uni.showToast({
						icon: 'none',
						title: '当前账号不能删除自己',
						duration: 1500
					})
					return
				}
				this.$refs.udb.remove(ids)
			},
			// 多选
			selectionChange(e) {
				this.selectedIndexs = e.detail.index
			},
			confirmDelete(item) {
				const currentUserId = this.userInfo._id
				if (currentUserId === item._id) {
					uni.showToast({
						icon: 'none',
						title: '不允许 admin 账号删除自己',
						duration: 1500
					})
					return
				}
				this.$refs.udb.remove(item._id)
			},
			parseUserStatus(status) {
				if (status === 0) {
					return '启用'
				} else if (status === 1) {
					return '禁用'
				} else if (status === 2) {
					return '审核中'
				} else if (status === 3) {
					return '审核拒绝'
				} else {
					return '启用'
				}
			},
			repair(item) {
				this.$request(
					'admin/user/repair', {
						id: item._id,
						action: "invite",
						mode: "user",
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
			},
			getTimes() {
				this.total = 0;
				//计算月初和月末
				let date = new Date(this.month);
				this.begin = date.getTime();
				date.setMonth(date.getMonth() + 1);
				date.setDate(date.getDate() - 1);
				//每月最后一天00:00:00
				this.end = date.getTime();
				console.log(this.begin, this.end)
			},
			getMonthFilter() {
				this.getTimes()
				if (!this.month) {
					uni.showToast({
						title: "请选择月份",
						icon: "none"
					})
					return;
				}
				//筛选合格的用户
				this.conditions = [
					`score_month[${this.begin}]>${this.minScore}`
				]
				this.search()
			},
			async getMonthTotal() {
				this.getTimes()
				this.getMonthTotalByIndex(0)
			},
			async getMonthTotalByIndex(index) {
				let limit = 500;
				const {
					result
				} = await db.collection('uni-id-users').aggregate()
					.match({
						score_month: {
							[this.begin]: cmd.gt(0)
						}
					}).skip(index * limit)
					.addFields({
						score2: '$score_month.' + this.begin
					}).project({
						score2: 1
					})
					.end();
				if (result.data) {
					result.data.map(item => {
						this.total += item.score2;
					})

					if (result.data.length == limit) {
						//下一页
						this.getMonthTotalByIndex(index + 1)
					}
				}
			},
			getStatistics() {
				this.getTimes()
				this.getUserScoreByIndex(0)
			},
			async getUserScoreByIndex(index = 0) {
				if (this.$refs.udb.dataList && this.$refs.udb.dataList[index]) {
					let item = this.$refs.udb.dataList[index];
					//提取score_log
					let total = 0;
					if (item.score_log) {
						for (let day in item.score_log) {
							if (day >= this.begin && day <= this.end) {
								total += item.score_log[day]
							}
						}
						this.total += total;
					}
					//保存记录
					db.collection("uni-id-users").doc(item._id).update({
						score_month: {
							[this.begin]: total
						}
					}).then(res => {})
					this.getUserScoreByIndex(index + 1)
				} else {
					uni.showLoading({
						title: "正在获取"
					})
					//下一页
					this.options.pageCurrent = this.options.pageCurrent + 1;
					// this.$refs.udb.loadMore();
					setTimeout(() => {
						uni.hideLoading()
						if (this.$refs.udb.dataList.length > 0) {
							this.getUserScoreByIndex(0)
						}
					}, 2000)
				}
			},
			changeMonth(e) {
				console.log("changeMonth", e)
				this.getTimes()
			},
			setScoreMoney() {
				if (!this.month) {
					uni.showToast({
						title: "请选择月份",
						icon: "none"
					})
					return;
				}
				if (!this.unit) {
					uni.showToast({
						title: "积分单价不能为空",
						icon: "none"
					})
					return;
				}
				uni.showModal({
					content: `是否确定分红？每积分价值${this.unit}`,
					success: (res) => {
						if (res.confirm) {
							this.setUserScore2moneyPages();
						}
					}
				})
			},
			async setUserScore2moneyPages() {
				uni.showLoading({
					title: "正在处理数据"
				})
				this.$refs.udb.dataList.map(async (item) => {
					await this.setUserScore2money(item, this.month)
				})
				console.log("处理完成")
				if (this.$refs.udb.dataList.length == this.options.pageSize) {
					this.options.pageCurrent = this.options.pageCurrent + 1;
					//下一页
					setTimeout(() => {
						this.setUserScore2moneyPages();
					}, 2000);
				}
				uni.hideLoading();
			},
			setItemScore2money(item, index2, notice) {
				uni.showModal({
					content: `是否确定分红？每积分价值${this.unit}`,
					success: (res) => {
						if (res.confirm) {
							this.setUserScore2money(item, index2, notice)
						}
					}
				})
			},
			async setUserScore2money(item, index2, notice) {
				let score = 0,
					balance = item.score;
				let month = this.month;
				if (index2) {
					score = item.score_month[index2];
					month = index2;
				}
				let day = new Date(month);
				day.setMonth(day.getMonth() + 1);
				day.setDate(day.getDate() - 1);
				//每月最后一天
				let endTime = day.getTime();
				//判断是否已经分红，可能没有这个字段
				if (item.score_cashout && item.score_cashout.day >= endTime) {
					console.log("用户已分红")
					if (notice) {
						uni.showToast({
							title: "用户已分红",
							icon: "none"
						})
					}
					return;
				}
				score = Math.floor(score);

				if (balance < parseFloat(this.minScore)) {
					console.log("用户总积分不足", score)
					if (notice) {
						uni.showToast({
							title: "用户总积分不足",
							icon: "none"
						})
					}
					return;
				}
				if (score < parseFloat(this.minScore) || score > balance) {
					console.log("用户积分不足", score, balance)
					if (notice) {
						uni.showToast({
							title: "用户积分不足",
							icon: "none"
						})
					}
					return;
				}

				let res = await this.$request(
					'admin/user/score2money', {
						uid: item._id,
						day: endTime,
						amount: score,
						unit: this.unit
					}, {
						functionName: 'tiantian-mall'
					}
				);
				console.log("setUserScore2money", res)
				if (res) {
					if (notice) {
						uni.showToast({
							title: "兑换成功",
						})
						this.loadData(false)
					}
				}
			}
		}
	}
</script>
<style lang="scss">
	/* #ifndef H5 */
	page {
		padding-top: 85px;
	}

	/* #endif */
	.uni-header {
		height: auto;
		padding: 30rpx;
	}
</style>
