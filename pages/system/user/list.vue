<template>
	<view>
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group hide-on-phone">
				<view class="uni-sub-title">
					<view v-for="(item,index) in conditions" :key="index">
						<text>{{item.text}}</text>
						<uni-icons type="close" @click="delFilter(index)" color="#eb4e38"></uni-icons>
					</view>
				</view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="default" size="mini" @click="delTable"
					:disabled="!selectedIndexs.length">批量删除</button>
				<button class="uni-button" type="primary" size="mini" @click="repairAll">批量修复邀请人</button>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" @load="onqueryload" collection="uni-id-users" :options="options" :where="where"
				field="_id,username,avatar,nickname,statistics,inviter_uid,inviter_uid_repair,score,balance,coupon,my_invite_code,mobile,email,status,register_date,score_charge_rate"
				page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				action="user_inviter" :page-current="options.pageCurrent"
				v-slot:default="{data,pagination,loading,error}">
				<uni-table :loading="loading" :emptyText="error.message || '没有更多数据，请调整筛选条件'" border stripe
					type="selection" @selection-change="selectionChange">
					<uni-tr>
						<!-- <uni-th align="center">用户名</uni-th> -->
						<uni-th align="center">用户信息(点击过滤下级)</uni-th>
						<uni-th align="center">直接推荐人</uni-th>
						<uni-th align="center">分享邀请码</uni-th>
						<uni-th align="center">积分</uni-th>
						<uni-th align="center">余额</uni-th>
						<uni-th align="center">优惠券</uni-th>
						<uni-th align="center">邀请等级</uni-th>
						<uni-th align="center">用户状态</uni-th>
						<uni-th align="center">团队统计</uni-th>
						<uni-th width="170" align="center">创建时间</uni-th>
						<uni-th width="204" align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<!-- <uni-td align="center">{{item.username?item.username:item.mobile}}</uni-td> -->
						<uni-td align="center">
							<view class="" @click="filterData('inviter_uid',{
									value:item._id,
									text:'邀请人：'+item.nickname
								})">

								<image v-if="item.avatar" :src="item.avatar" mode="aspectFill"
									class="image-width-80 border-radius"></image>
								<view class="">
									<text>{{item.nickname}}</text>
								</view>
								<view class="">
									<text>{{item.mobile}}</text>
								</view>
							</view>
						</uni-td>
						<uni-td align="center">
							<view class="" v-if="item.inviter">
								<image v-if="item.inviter.avatar" :src="item.inviter.avatar" mode="aspectFill"
									class="image-width-80 border-radius"></image>
								<view class="">
									<text>{{item.inviter.nickname}}</text>
								</view>
								<view class="">
									<text>{{item.inviter.mobile}}</text>
								</view>
							</view>
						</uni-td>
						<uni-td align="center">{{item.my_invite_code}}</uni-td>
						<uni-td align="center">
							<view class="">
								<text>{{item.score?item.score:0}}</text>
							</view>
							<button @click="navigateTo('/pages/uni-id-scores/list?uid='+item._id, false)"
								class="uni-button" size="mini" type="default">日志</button>
							<view class="colorBlue">
								<text>{{item.score_charge_rate?item.score_charge_rate*100+'%':"默认"}}转账费率</text>
							</view>
						</uni-td>
						<uni-td align="center">
							<view class="">
								<text class="price">{{item.balance?item.balance/100:0}}</text>
							</view>
							<button @click="navigateTo('/pages/uni-id-balances/list?uid='+item._id, false)"
								class="uni-button" size="mini" type="default">日志</button><button @click="recharge(item)"
								class="uni-button" size="mini" type="warn">充值</button>
						</uni-td>
						<uni-td align="center">{{item.coupon?item.coupon:0}}</uni-td>

						<uni-td align="center">
							<view class="">
								<text>{{item.inviter_uid?item.inviter_uid.length:0}}</text>
							</view>
							<button @click="repair(item)" class="uni-button" size="mini" type="default">修复直推</button>
							<button @click="repair(item,true)" class="uni-button" size="mini"
								:type="item.inviter_uid_repair?'warn':'default' ">修复邀请人</button>
						</uni-td>
						<uni-td align="center">{{item.status}}</uni-td>
						<uni-td align="">
							<view v-if="item.statistics" v-for="(stati,index2) in item.statistics" :key="index2">
								<text>{{index2}}：</text>
								<text>{{stati}}</text>
							</view>
						</uni-td>
						<uni-td align="center">
							<uni-dateformat :date="item.
register_date" :threshold="[0, 0]" />
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="navigateTo('/pages/uni-id-task-log/list?uid='+item._id, false)"
									class="uni-button" size="mini" type="default">任务日志</button>
								<button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button" size="mini"
									type="primary">修改</button>
								<button @click="confirmDelete(item)" class="uni-button" size="mini"
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
		<uni-popup ref="popup" type="center">
			<uni-popup-dialog mode="input" title="充值" placeholder="请输入充值金额,单位元" @confirm="confirmRecharge">
			</uni-popup-dialog>
		</uni-popup>
		<!-- #ifndef H5 -->
		<fix-window />
		<!-- #endif -->
	</view>
</template>

<script>
	const db = uniCloud.database();
	const cmd = db.command;
	// 表查询配置
	const dbOrderBy = 'register_date desc' // 排序字段
	const dbSearchFields = ['username', 'nickname', 'mobile', 'email'] // 支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 10
	const pageCurrent = 1

	import {
		mapState
	} from 'vuex'
	export default {
		data() {
			return {
				query: '',
				where: '',
				conditions: {},
				orderby: dbOrderBy,
				options: {
					pageSize,
					pageCurrent
				},
				formData: {},
				selectedIndexs: [] //批量选中的项
			}
		},
		computed: {
			...mapState('user', ['userInfo']),
		},
		methods: {
			delFilter(key) {
				console.log("delFilter key", key)
				let condition = {}
				for (let key2 in this.conditions) {
					if (key != key2) {
						condition[key2] = this.conditions[key2]
					}
				}
				this.conditions = condition;
				this.search()
			},
			filterData(key, data) {
				this.conditions[key] = data;
				this.query = "";
				this.search()
			},
			async onqueryload(data) {
				data.forEach(item => {
					item.nickname = item.nickname ? item.nickname : "未填写"
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
					fiters.push(`${key}=="${this.conditions[key].value}"`)
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
				this.options.pageCurrent = e.current;
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
			repair(item, isParent = false) {
				uni.showLoading({
					title: "修复中",
				})
				this.$request(
					'admin/user/repair', {
						id: item._id,
						action: isParent ? "recommend" : "invite",
						mode: "user",
					}, {
						functionName: 'tiantian-mall'
					}
				).then(res => {
					console.log("res", res)
					uni.hideLoading()
					uni.showToast({
						title: res.message || "操作成功"
					})
					setTimeout(() => {
						this.loadData(false);
					}, 2000)
				});
			},
			async repairAll() {
				if (this.$refs.udb.dataList.length == 0) {
					return;
				}
				console.log("开始修复")
				uni.showLoading({
					title: "修复中",
				});
				for (let i = 0; i < this.$refs.udb.dataList.length; i++) {
					let item = this.$refs.udb.dataList[i];
					if (!item.inviter_uid_repair) {
						await this.$request(
							'admin/user/repair', {
								id: item._id,
								action: "recommend",
								mode: "user",
							}, {
								functionName: 'tiantian-mall'
							}
						);
					}
				}
				console.log("修复完成")
				uni.hideLoading();

				if (this.$refs.udb.dataList.length == this.options.pageSize) {
					this.options.pageCurrent = this.options.pageCurrent + 1;
					//下一页
					setTimeout(() => {
						this.repairAll();
					}, 2000);
				}
			},
			recharge(item) {
				this.formData = item;
				this.$refs.popup.open()
			},
			confirmRecharge(val) {
				if (val > 0) {
					this.$request(
						'admin/user/recharge', {
							id: this.formData._id,
							amount: val * 100,
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
	}
</script>
<style>
	/* #ifndef H5 */
	page {
		padding-top: 85px;
	}

	/* #endif */
</style>
