<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title">平台分类信息管理</view>
				<view class="uni-sub-title">
					<button class="uni-button" v-for="(item,index) in filterBtns" :key="index"
						:type="filters==item.condition?'primary':'default'" size="mini"
						@click="setFilters(item.condition)">{{item.title}}</button>
				</view>
			</view>
			<view class="uni-group">
				<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
				<button class="uni-button" type="default" size="mini" @click="search">搜索</button>
				<button class="uni-button" type="default" size="mini"
					@click="navigateTo('./add?inc=100&sort='+lastSort)">新增主分类</button>
				<button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length"
					@click="delTable">批量删除</button>
			</view>
		</view>
		<view class="uni-container">
			<uni-table border stripe type="selection" @selection-change="selectionChange">
				<uni-tr>
					<uni-th align="" width="200">名称</uni-th>
					<uni-th align="center">图标</uni-th>
					<uni-th align="center">排序</uni-th>
					<uni-th align="center">首页显示</uni-th>
					<uni-th align="center">生效状态</uni-th>
					<uni-th align="center">create_date</uni-th>
					<uni-th width="" align="center">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="(item,index) in dataList" :key="index">
					<uni-td align="">
						<view class="ti-flex" @click="changeState(item)">
							<uni-icons type="top" v-if="item.isOpen"></uni-icons>
							<uni-icons type="plusempty" v-else-if="item.depth!=2"></uni-icons>
							<text>{{item.showName}}</text>
						</view>
					</uni-td>
					<uni-td align="center">
						<cloud-image name="icon" iconSize="50" v-model="item.icon" size="120x120"
							@input="changeImg($event,item._id)" />
					</uni-td>
					<uni-td align="center"> {{item.sort}} </uni-td>
					<uni-td align="center">
						<view class="" v-if="!item.parent_id" @click="changeBooleanProperty(item,'is_index_show')">
							<text>{{item.is_index_show == true ? '✅' : '❌'}}</text>
						</view>
					</uni-td>
					<uni-td align="center">
						<view class="" @click="changeBooleanProperty(item,'status')">
							<text>{{item.status == true ? '✅' : '❌'}}</text>
						</view>
					</uni-td>
					<uni-td align="center">
						<uni-dateformat :date="item.create_date" :threshold="[0, 0]" />
					</uni-td>
					<uni-td align="center">
						<view class="uni-group">
							<button v-if="item.depth<2"
								@click="navigateTo('./add?pid='+item._id+'&sort='+item.lastSort+'&inc='+item.inc+'&title='+item.name, false)"
								class="uni-button" size="mini" type="primary">子分类</button>
							<button v-else @click="navigateTo('/pages/opendb-mall-goods/list?cid='+item._id, false)"
								class="uni-button" size="mini" type="primary">商品</button>
							<button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button" size="mini"
								type="primary">修改</button>
							<button @click="confirmDelete(item._id)" class="uni-button" size="mini"
								type="warn">删除</button>
						</view>
					</uni-td>
				</uni-tr>
			</uni-table>
		</view>
	</view>
</template>

<script>
	import {
		enumConverter
	} from '../../js_sdk/validator/opendb-mall-categories.js';

	const db = uniCloud.database()
	// 表查询配置
	const dbOrderBy = '' // 排序字段
	const dbSearchFields = ["name", "description"] // 模糊搜索字段，支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 10
	const pageCurrent = 1
	// 菜单扁平化
	function flatMenu(menu, result, depth = 0) {
		menu.showName = (depth ? '　'.repeat(depth) + '|-' : '') + menu.name;
		menu.depth = depth;
		let inc = [10, 1, 1, 1, 1][depth];
		menu.inc = inc;
		menu.lastSort = menu.sort + inc;
		if (menu.children && menu.children.length > 0) {
			menu.lastSort = parseInt(menu.children[menu.children.length - 1].sort) + inc;
		}
		result.push(menu)
		if (menu.children && menu.isOpen) {
			flatMenus(menu.children, result, depth + 1)
		}
	}

	function flatMenus(menus, result = [], depth = 0) {
		menus.forEach(menu => flatMenu(menu, result, depth))
		return result
	}
	export default {
		data() {
			return {
				lastSort: 100,
				filters: "status==true",
				filterBtns: [{
					title: "所有分类",
					condition: "name!=null"
				}, {
					title: "有效分类",
					condition: "status==true"
				}, {
					title: "首页显示",
					condition: "is_index_show==true"
				}],
				originDataList: [],
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
		onLoad() {
			this.search()
		},
		watch: {
			originDataList: {
				handler(newVal) {
					console.log("watch data")
				},
				deep: true
			}
		},
		computed: {
			dataList() {
				console.log("shuaxin")
				return flatMenus(this.originDataList)
			}
		},
		methods: {
			changeState(item) {
				item.isOpen = !item.isOpen;
				console.log(item)
				//更新原数据
				this.originDataList = this.originDataList.map(e => {
					if (e._id == item._id) {
						e.isOpen = item.isOpen
						console.log("改变")
					}
					return e;
				})
			},
			changeImg(e, id) {
				console.log("changeImg", e, id)
				db.collection("tian-mall-categories").doc(id).update({
					icon: e
				})
			},
			setFilters(str) {
				this.filters = str;
				this.search();
			},
			getWhere() {
				const query = this.query.trim()
				if (!query) {
					return;
				}
				const queryRe = new RegExp(query, 'i')
				return dbSearchFields.map(name => queryRe + '.test(' + name + ')').join(' || ')
			},
			search() {
				this.loadData();
			},
			loadData() {
				const newWhere = this.getWhere()
				let condition = ["name!=null"]
				if (newWhere) {
					condition.push(`(${newWhere})`)
				}
				if (this.filters) {
					condition.push(this.filters)
				}

				console.log(condition.join(" && "))
				this.where = condition.join(" && ");
				let collection = db.collection("tian-mall-categories")
				collection.where(this.where).field(
					"parent_id,name,icon,sort,description,is_hot_show,is_index_show,status,create_date").orderBy(
					"sort asc").limit(50).get({
					getTree: true
				}).then(({
					result
				}) => {
					if (result.data && result.data.length > 0) {
						this.lastSort = result.data[result.data.length - 1].sort + 100
					}
					//多级数据，默认全部关闭

					this.originDataList = result.data;
					// this.originDataList = flatMenus(result.data);
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
				var dataList = this.dataList
				return this.selectedIndexs.map(i => dataList[i]._id)
			},
			// 批量删除
			delTable() {
				let ids = this.selectedItems().join(",");
				uni.showModal({
					content: "是否确定删除？",
					success: (res) => {
						if (res.confirm) {
							db.collection("tian-mall-categories").where(`_id in([${ids}])`).remove().then(
								() => {
									uni.showToast({
										icon: "success",
										title: "删除成功"
									})
									this.search()
								});
						}
					}
				})

			},
			// 多选
			selectionChange(e) {
				this.selectedIndexs = e.detail.index
			},
			confirmDelete(id) {
				uni.showModal({
					content: "是否确定删除？",
					success: (res) => {
						if (res.confirm) {
							db.collection("tian-mall-categories").doc(id).remove().then(() => {
								uni.showToast({
									icon: "success",
									title: "删除成功"
								})
								this.search()
							});
						}
					}
				})
			},
			changeBooleanProperty(item, field) {
				item[field] = !item[field];
				db.collection("tian-mall-categories").doc(item._id).update({
					[field]: item[field]
				}).then(() => {
					uni.showToast({
						icon: "none",
						title: "更新成功"
					})
				})
			}
		}
	}
</script>
<style>
</style>
