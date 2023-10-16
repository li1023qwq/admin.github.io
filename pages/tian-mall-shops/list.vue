<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title"></view>
				<view class="uni-sub-title"></view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="primary" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
				<button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length"
					@click="delTable">批量删除</button>
			</view>
		</view>
		<view class="uni-container">
			<unicloud-db ref="udb" collection="tian-mall-shops"
				field="id,address,banner,deliveryTypes,isPrint,name,online,phone,score,serviceTime,src,state,month_sell,employees"
				:where="where" page-data="replace" :orderby="orderby" :getcount="true" :page-size="options.pageSize"
				:page-current="options.pageCurrent" v-slot:default="{data,pagination,loading,error,options}"
				:options="options">
				<uni-table :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe type="selection"
					@selection-change="selectionChange">
					<uni-tr>
						<uni-th align="center">店铺名称</uni-th>
						<uni-th align="center">地址电话</uni-th>
						<uni-th align="center">是否营业</uni-th>
						<uni-th align="center">是否启用</uni-th>
						<uni-th align="center">收款码</uni-th>
						<uni-th width="204" align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in data" :key="index">
						<uni-td align="center">
							<image v-if="item.src" :src="item.src" mode="aspectFill"
								class="image-width-120 border-radius">
								<view class="">
									<text>{{item.name}}({{item.id}}) </text>
								</view>
						</uni-td>
						<uni-td align="" width="200">
							<view class="" v-if="item.address">
								<text>
									{{item.address.name}}
								</text>
							</view>
							<view class="" v-if="item.address">
								<text>
									{{item.address.address}}
								</text>
							</view>
							<view class="">
								<text>电话：{{item.phone}}</text>
							</view>
							<view class="">
								<text>{{item.serviceTime}}</text>
							</view>

						</uni-td>
						<uni-td align="center"> {{item.online == true ? '✅' : '❌'}} </uni-td>
						<uni-td align="center"> {{item.state == true ? '✅' : '❌'}} </uni-td>
						<uni-td align="center">
							<button @click="genQr(item)" class="uni-button" size="mini" type="primary">查看</button>
						</uni-td>
						<uni-td align="center">
							<view class="uni-group">
								<button @click="selectAdmin(item)" class="uni-button icon-button" size="mini"
									type="primary">
									<uni-icons type="auth" color="#ffffff" size="18"></uni-icons>
								</button>
								<button @click="navigateTo('./payment?id='+item._id, false)"
									class="uni-button icon-button" size="mini" type="primary">
									<uni-icons type="wallet" color="#ffffff" size="18"></uni-icons>
								</button>
								<button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button icon-button"
									size="mini" type="primary">
									<uni-icons type="compose" color="#ffffff" size="18"></uni-icons>
								</button>
								<button @click="confirmDelete(item._id)" class="uni-button icon-button" size="mini"
									type="warn">
									<uni-icons type="trash" color="#ffffff" size="18"></uni-icons>
								</button>
							</view>
						</uni-td>
					</uni-tr>
				</uni-table>
				<view class="uni-pagination-box">
					<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current"
						:total="pagination.count" @change="onPageChanged" />
				</view>
			</unicloud-db>
			<uni-popup ref="qrpopup" type="center">
				<view class="bg-white padding-22 border-radius">
					<uqrcode ref="uqrcode"></uqrcode>
				</view>
			</uni-popup>
			<uni-popup ref="userPopup" type="center">
				<view class="user-modal">
					<view class="title">
						<text>请选择店铺管理员</text>
						<view class="font-24 colorGray">
							<text>管理人员必须先在系统管理-->用户管理中，选择一个角色</text>
						</view>
					</view>
					<scroll-view class="user-content" scroll-y="true">
						<uni-data-checkbox mode="tag" v-model="shop.employees" collection="uni-id-users"
							field="_id as value, nickname as text" where="nickname!=null && role !=null"
							:multiple="true">
						</uni-data-checkbox>
					</scroll-view>
					<view class="uni-button-group pointer">
						<button class="uni-button " style="width: 100px;" type="primary"
							@click="submitShopAdmin">保存</button>
						<button class="uni-button " style="width: 100px;" type="default" @click="closeAdmin">关闭</button>
					</view>
				</view>
			</uni-popup>
		</view>
	</view>
</template>

<script>
	import {
		enumConverter
	} from '../../js_sdk/validator/tian-mall-shops.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = 'id desc' // 排序字段
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
				},
				shop: {}
			}
		},
		methods: {
			submitShopAdmin() {
				//修改店铺管理员
				db.collection("tian-mall-shops").doc(this.shop._id).update({
					employees: this.shop.employees
				}).then(() => {
					uni.showToast({
						title: '修改成功'
					})
				})
				this.$refs.userPopup.close()
			},
			selectAdmin(item) {
				this.shop = item;
				this.$refs.userPopup.open()
			},
			closeAdmin() {
				this.$refs.userPopup.close()
			},
			genQr(item) {
				let code = this.$store.state.app.customer.shopQrCode;
				if (!code) {
					uni.showToast({
						icon: 'none',
						title: '未配置二维码地址'
					})
					return;
				}
				this.$refs.qrpopup.open();
				this.$nextTick(() => {
					let link = this.$stringFormat(code, {
						shop: item
					})
					this.$refs.uqrcode.make({
						size: 354,
						// mode: "canvas",
						text: link
					})
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
<style lang="scss">
	.user-modal {
		width: 450px;
		padding: 15px 30px;
		border-radius: 10px;
		background-color: #FFFFFF;

		.title {
			text-align: center;
			color: #333333;
			padding-bottom: 10px;
		}
	}

	.user-content {
		height: 200px;
		box-sizing: border-box;
	}
</style>
