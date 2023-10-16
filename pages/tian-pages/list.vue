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
			<view class="" style="flex: 1;">
				<uni-table border stripe type="selection" @selection-change="selectionChange">
					<uni-tr>
						<uni-th align="">页面标题</uni-th>
						<uni-th align="center">平台/应用</uni-th>
						<uni-th align="center">地区</uni-th>
						<uni-th align="center">排序/时段</uni-th>
						<uni-th align="center">是否启用</uni-th>
						<uni-th align="center">修改时间</uni-th>
						<uni-th width="140" align="center">操作</uni-th>
					</uni-tr>
					<uni-tr v-for="(item,index) in dataList" :key="index">
						<uni-td align="">
							<view class="ti-flex">
								<text class="flex-1">{{item.title}}</text>
								<button @click="preview(item)" class="uni-button " size="mini"
									type="primary">H5预览</button>
							</view>
						</uni-td>
						<uni-td align="">
							<view class="">
								<text>
									{{item.app_id && item.app_id.length>0?item.app_id.map(e=>e.name).join("，"):"所有应用"}}</text>
							</view>

							<view class="" v-if="item.platforms">
								<text>{{item.platforms.map(e=>e.text).join(",")}}</text>
							</view>
						</uni-td>
						<uni-td align="center">
							<view class="" v-if="item.city">
								<view class="">
									<text>{{item.city.code}}</text>
								</view>
								<view class="">
									<text>{{item.city.name}}</text>
								</view>
							</view>
						</uni-td>
						<uni-td align="center">
							<view class="">
								<text>{{item.posid}}</text>
							</view>
							<view class="" v-if="item.begin_hours">
								<text>{{item.begin_hours}}点后</text>
							</view>
							<view class="" v-else>
								<text>全天</text>
							</view>
						</uni-td>
						<uni-td align="center">
							<view class="" @click="changeBooleanProperty(item,'state')">
								<text>{{item.state ? '✅' : '❌'}}</text>
							</view>
							<view class="" v-if="item.begin_time>0">
								<uni-dateformat :date="item.begin_time" :threshold="[0, 0]" format="yyyy/MM/dd hh:mm" />
							</view>
							<view class="" v-else>
							</view>
						</uni-td>
						<uni-td align="center">
							<uni-dateformat :date="item.modified" :threshold="[0, 0]" format="yyyy/MM/dd hh:mm" />
						</uni-td>
						<uni-td align="">
							<view class="">
								<button v-if="item.component=='tian-tab-pages'"
									@click="navigateTo('./add?id='+item._id, false)" class="uni-button" size="mini"
									type="primary">子集</button>
								<button v-else
									@click="navigateTo('./layout?id='+item._id+'&type='+item.component, false)"
									class="uni-button" size="mini" type="primary">排版</button>
								<button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button" size="mini"
									type="primary">修改</button>
							</view>
							<view class=" margin-top-20"><button @click="confirmCopy(item._id)" class="uni-button"
									size="mini" type="warn">复制</button>
								<button @click="confirmDelete([item._id])" class="uni-button" size="mini"
									type="warn">删除</button>
							</view>
						</uni-td>
					</uni-tr>
				</uni-table>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		enumConverter
	} from '../../js_sdk/validator/tian-pages.js';

	const db = uniCloud.database();
	const cmd = db.command;
	// 表查询配置
	const dbOrderBy = 'parent_id asc,posid asc' // 排序字段
	const dbSearchFields = ['title'] // 模糊搜索字段，支持模糊搜索的字段列表
	// 分页配置
	const pageSize = 10
	const pageCurrent = 1
	// 菜单扁平化
	function flatMenu(menu, result, depth = 0) {
		menu.originTitle = menu.title;
		menu.title = (depth ? '　'.repeat(depth) + '|-' : '') + menu.title
		result.push(menu)
		if (menu.children) {
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
				filters: "",
				filterBtns: [{
					title: "所有",
					condition: ""
				}],
				dataList: [],
				query: '',
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
				info: {}
			}
		},
		onLoad() {
			this.loadData()
		},
		onShow() {
			this.info = {}
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
				this.loadData()
			},
			loadData() {
				let newWhere = this.getWhere()
				let condition = []
				if (newWhere) {
					condition.push(`(${newWhere})`)
				}
				if (this.filters) {
					condition.push(this.filters)
				}
				newWhere = condition.join(" && ");
				//当前页面域名，只有发布之后，才能看到真实效果
				let link = window.location.protocol + "//" + window.location.host;
				let where = 'component=="tian-pages" || component=="tian-tab-pages"';
				if (newWhere) {
					where = `(${where}) && (${newWhere})`
				}
				uni.showLoading()
				db.collection("tian-pages,opendb-app-list,tian-platforms,opendb-city-china").where(where).field(
						"title,component,items,state,posid,city{code,name},parent_id,created,modified,platforms{text,value},begin_time,begin_hours,app_id{appid,name},configs"
					)
					.orderBy(
						"posid asc").limit(500)
					.get({}).then(({
						result
					}) => {
						//转换成2级
						let parentData = {};
						let derity = []
						let citys = {}
						result.data.map(e => {
							if (!e.parent_id) {
								e.children = []
								parentData[e._id] = e;
							}
							if (e.city) {
								if (e.city.length > 0) {
									e.city = e.city[0]
									if (e.city.code) {
										citys[e.city.code] = e.city.name;
									}
								} else {
									e.city = {}
								}
							}
						});
						if (this.filterBtns.length < 2) {
							this.filterBtns = [{
								title: "所有",
								condition: ""
							}]
							Object.keys(citys).map(e => {
								this.filterBtns.push({
									title: citys[e],
									condition: `city.code=="${e}"`
								})
							})
						}

						result.data.map(e => {
							if (e.parent_id) {
								if (parentData[e.parent_id]) {
									parentData[e.parent_id].children.push(e)
								} else {
									derity.push(e._id);
								}
							}
						})
						let data = [];
						for (let key in parentData) {
							data.push(parentData[key]);
						}

						this.dataList = flatMenus(data);

						this.dataList.forEach(item => {
							if (item.component) {
								item.src =
									`${link}/#/pages/app/pages?id=${item._id}&type=${item.component}&title=${item.title}`;
								// console.log(item.src)
							}
						})
						if (derity.length > 0) {
							//删除没用的节点
							db.collection("tian-pages").where({
								_id: cmd.in(derity)
							}).remove()
						}
						uni.hideLoading()
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
				// this.$refs.udb.remove(this.selectedItems())
				this.confirmDelete(this.selectedItems())
			},
			// 多选
			selectionChange(e) {
				this.selectedIndexs = e.detail.index
			},
			confirmDelete(id) {
				// this.$refs.udb.remove(id)
				uni.showModal({
					title: "系统提示",
					content: "是否确定删除？",
					success: (res) => {
						if (res.confirm) {
							db.collection("tian-pages").where({
								_id: cmd.in(id)
							}).remove().then(res => {
								this.loadData(false)
							})
						}
					}
				})
			},
			confirmCopy(id) {
				// this.$refs.udb.remove(id)
				let basic = this.dataList.filter(e => e._id == id);
				console.log("basic", basic)
				uni.showModal({
					title: "系统提示",
					content: "是否确定复制？",
					success: (res) => {
						if (res.confirm) {
							this.copyByParent(basic[0], basic[0].parent_id).then(() => {
								this.loadData(false)
							})
						}
					}
				})
			},
			async copyByParent(basic, parent_id) {
				return db.collection("tian-pages").add({
					component: basic.component,
					title: basic.originTitle + " 复制",
					items: basic.items,
					configs: basic.configs,
					app_id: basic.app_id ? basic.app_id.map(e => e.appid) : undefined,
					platforms: basic.platforms ? basic.platforms.map(e => e.value) : undefined,
					begin_hours: basic.begin_hours,
					begin_time: basic.begin_time,
					city: basic.city ? basic.city.code : undefined,
					state: basic.state,
					posid: basic.posid + 1,
					parent_id: parent_id,
				}).then(({
					result
				}) => {
					//查询布局
					console.log(result.id)
					parent_id = result.id;
					db.collection("tian-pages").where(`parent_id=="${basic._id}"`)
						.get().then(async ({
							result
						}) => {
							let children = result.data
							if (children && children.length > 0) {
								for (let i = 0; i < children.length; i++) {
									let item = children[i];
									item.originTitle = item.title;
									await this.copyByParent(item, parent_id)
								}
							}
						})
				})
			},
			preview(item) {
				if (item.src.indexOf("localhost") != -1) {
					uni.showModal({
						content: "请发布后再使用\n或在编辑器中运行前端",
						showCancel: false
					})
					return;
				}
				window.open(item.src, "preview", "width=360,height=600")
			},
			changeBooleanProperty(item, field) {
				item[field] = item[field] ? 0 : 1;
				db.collection("tian-pages").doc(item._id).update({
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
<style lang="scss">
	.uni-container {
		display: flex;
	}
</style>
