<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title"></view>
				<view class="uni-sub-title"></view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" :collection="collection" :field="field" :where="where" page-data="replace"
				:orderby="orderby" :getcount="true" :page-size="options.pageSize" :page-current="options.pageCurrent"
				v-slot:default="{data,pagination,loading,error,options}" :options="options">
				<uni-table :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection"
					@selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center" v-if="!uid">会员</uni-th>
						<uni-th align="center" v-if="!tid">任务</uni-th>
						<uni-th align="center">是否成功</uni-th>
						<uni-th align="center">积分</uni-th>
						<uni-th align="center">已完成次数</uni-th>
						<uni-th align="center">小时记录</uni-th>
						<uni-th align="center">创建时间</uni-th>
						<uni-th width="204" align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="" v-if="!uid">
							<tian-user :value="item.user_id"></tian-user>
						</uni-td>
						<uni-td align="" v-if="!tid"> {{item.task_id?item.task_id.map(e=>e.name).join():""}} </uni-td>
						<uni-td align="center"> {{item.result == true ? '✅' : '❌'}} </uni-td>
						<uni-td align="center"> {{item.bounty}} </uni-td>
						<uni-td align="center"> {{item.amount}} </uni-td>
						<uni-td align="">
							<view v-for="(times,index2) in item.hour_times" :key="index2">
								<text>{{index2}}:00</text>
								<text class="margin-left-10">{{times}}次</text>
							</view>

						</uni-td>
						<uni-td align="center">
							<uni-dateformat :date="item.create_date" :threshold="[0, 0]" />
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button v-if="item.result" @click="reGetScore(item)" class="uni-button" size="mini"
									type="primary">积分补登</button>
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
	} from '../../js_sdk/validator/uni-id-task-log.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'create_date desc' // 排序字段
	const dbSearchFields = ['user_id.nickname', 'user_id.mobile'] // 模糊搜索字段，支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 10
	const pageCurrent = 1

	export default {
		data() {
			return {
				tid: '',
				uid: '',
				field: 'user_id._id,user_id.nickname,user_id.mobile,user_id.avatar,task_id,result,bounty,amount,hour_times,create_date',
				query: '',
				collection: 'uni-id-task-log,uni-id-users,uni-id-task',
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
		onLoad(e) {
			if (e.tid) {
				this.tid = e.tid;
				this.collection = "uni-id-task-log,uni-id-users"
				this.field =
					"user_id._id,user_id.nickname,user_id.mobile,user_id.avatar,result,bounty,amount,hour_times,create_date"
			}
			if (e.uid) {
				this.uid = e.uid;
				this.collection = "uni-id-task-log,uni-id-task"
				this.field =
					"task_id.name,result,bounty,amount,hour_times,create_date"
			}
			this.search();
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
				let newWhere = this.getWhere()
				let condition = [];
				if (newWhere) {
					condition.push(`(${newWhere})`)
				}
				if (this.tid) {
					condition.push(`task_id =="${this.tid}"`);
				}
				if (this.uid) {
					condition.push(`user_id == "${this.uid}"`);
				}
				newWhere = condition.join("&&");
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
			reGetScore(item) {
				//积分补登
				if (!item.result) {
					return false;
				}
				uni.showModal({
					title: "积分补登",
					content: "是否确定再次录入？",
					success: (res) => {
						if (res.confirm) {
							uni.showLoading({
								mask: true
							})
							this.$request(
								'admin/uni_id_score/reget', {
									id: item._id
								}, {
									functionName: 'tiantian-mall'
								}
							).then(res => {
								uni.hideLoading()
								uni.showToast({
									title: res.message
								})
								setTimeout(() => {
									this.loadData();
								}, 2000)
							}, err => {
								uni.hideLoading()
							});
						}
					}

				})
			}
		}
	}
</script>
<style>
</style>
