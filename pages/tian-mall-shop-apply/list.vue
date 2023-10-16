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
				<download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData"
					:type="exportExcel.type" :name="exportExcel.filename">
					<button class="uni-button margin-left-20" type="primary" size="mini">导出 Excel</button>
				</download-excel>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" collection="tian-mall-shop-apply"
				field="id,name,phone,src,business_license,food_license,legal_person_license,legal_person_license_back,apply_result,state,modified,address,uid"
				:where="where" page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
				:options="options" loadtime="manual" @load="onqueryload">
				<uni-table ref="table" :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe
					type="selection" @selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">编号</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'name')"
							sortable @sort-change="sortChange($event, 'name')">店铺名称</uni-th>
						<uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'phone')"
							sortable @sort-change="sortChange($event, 'phone')">联系电话</uni-th>
						<uni-th align="center">店铺logo</uni-th>
						<uni-th align="center">审核结果</uni-th>
						<uni-th align="center" filter-type="select" :filter-data="options.filterData.state_localdata"
							@filter-change="filterChange($event, 'state')">状态</uni-th>
						<uni-th align="center" filter-type="timestamp" @filter-change="filterChange($event, 'modified')"
							sortable @sort-change="sortChange($event, 'modified')">modified</uni-th>
						<uni-th align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center">{{item.id}}</uni-td>
						<uni-td align="">
							<view class="">
								<text>{{item.name}}</text>
							</view>
							<view class="" v-if="item.address">
								<text>{{item.address.address}}</text>
							</view>
						</uni-td>
						<uni-td align="center">{{item.phone}}</uni-td>
						<uni-td align="center">
							<image :src="$thumbImg(item.src,'60x60')" @click="previewImage([item.src],0)"
								mode="aspectFill" class="image-width-120 border-radius"></image>
						</uni-td>
						<uni-td align="center">{{item.apply_result}}</uni-td>
						<uni-td align="center">{{options.state_valuetotext[item.state]}}</uni-td>
						<uni-td align="center">
							<uni-dateformat :threshold="[0, 0]" :date="item.modified"></uni-dateformat>
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button" size="mini"
									type="primary">审核</button>
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
	} from '../../js_sdk/validator/tian-mall-shop-apply.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'id desc' // 排序字段
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
				query: '',
				where: '',
				orderby: dbOrderBy,
				orderByFieldName: "",
				selectedIndexs: [],
				options: {
					pageSize,
					pageCurrent,
					filterData: {
						"state_localdata": [{
								"text": "审核中",
								"value": 0
							},
							{
								"text": "通过",
								"value": 1
							},
							{
								"text": "拒绝",
								"value": 2
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
					"filename": "tian-mall-shop-apply.xls",
					"type": "xls",
					"fields": {
						"编号": "id",
						"店铺名称": "name",
						"联系电话": "phone",
						"店铺logo": "src",
						"营业执照": "business_license",
						"食品经营许可": "food_license",
						"法人身份证正面": "legal_person_license",
						"法人身份证反面": "legal_person_license_back",
						"审核结果": "apply_result",
						"状态": "state",
						"modified": "modified",
						"地址": "address",
						"创建者": "uid"
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

<style>
</style>
