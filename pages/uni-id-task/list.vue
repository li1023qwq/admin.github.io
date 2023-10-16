<template>
	<view>
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length"
					@click="delTable">批量删除</button>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" collection="uni-id-task"
				field="name,comment,bounty,per_amount,multiple,icon,open_url,sort,enable,middle_getout,max_per_hour,max_per_day,max_per_week,create_date"
				:where="where" page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
				:options="options">
				<uni-table :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection"
					@selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">任务名称</uni-th>
						<uni-th align="center">奖励积分</uni-th>
						<uni-th align="center">操作次数</uni-th>
						<uni-th align="center">加倍倍数</uni-th>
						<uni-th align="center">图标</uni-th>
						<uni-th align="center">
							点击目标地址，双冒号打开本地方法
						</uni-th>
						<uni-th align="center">序号</uni-th>
						<uni-th align="center">是否启用</uni-th>
						<uni-th align="center">中途退出奖励</uni-th>
						<uni-th align="center">每小时限制</uni-th>
						<uni-th align="center">每天限制</uni-th>
						<uni-th align="center">每周限制</uni-th>
						<uni-th align="center">创建时间</uni-th>
						<uni-th width="204" align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align=""> {{item.name}} </uni-td>
						<uni-td align="center"> {{item.bounty}} </uni-td>
						<uni-td align="center"> {{item.per_amount}} </uni-td>
						<uni-td align="center"> {{item.multiple}} </uni-td>
						<uni-td align=""> {{item.icon}} </uni-td>
						<uni-td align=""> {{item.open_url}} </uni-td>
						<uni-td align="center"> {{item.sort}} </uni-td>
						<uni-td align="center"> {{item.enable == true ? '✅' : '❌'}} </uni-td>
						<uni-td align="center"> {{item.middle_getout == true ? '✅' : '❌'}} </uni-td>
						<uni-td align="center"> {{item.max_per_hour}} </uni-td>
						<uni-td align="center"> {{item.max_per_day}} </uni-td>
						<uni-td align="center"> {{item.max_per_week}} </uni-td>
						<uni-td align="center">
							<uni-dateformat :date="item.create_date" :threshold="[0, 0]" />
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="navigateTo('../uni-id-task-log/list?tid='+item._id, false)"
									class="uni-button" size="mini" type="default">日志</button>
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
		enumConverter
	} from '../../js_sdk/validator/uni-id-task.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = '' // 排序字段
	const dbSearchFields = ["name"] // 模糊搜索字段，支持模糊搜索的字段列表
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
