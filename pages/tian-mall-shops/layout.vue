<template>
	<view class="">
		<view class="layout-container" :style="containerStyle">
			<view class="assembly">
				<scroll-view scroll-y="true" style="flex: 1;">
					<view class="items">
						<view v-for="(item,index) in assemblyList" :key="index" class="item" @click="add(item)">
							<image :src="item.thumb" mode="aspectFill" class="image-thumb"></image>
						</view>
					</view>
				</scroll-view>
			</view>
			<view class="preview">
				<view class="items" :style="containerStyle">
					<scroll-view scroll-y="true">
						<tian-pages :configs="pageConfigs" :preview="true" @click="edit" @deletes="delItem">
						</tian-pages>
					</scroll-view>
				</view>
			</view>
			<view class="attribute " :style="containerStyle">
				<view class="uni-group"
					style="padding: 20rpx 30rpx 0;text-align: right;display: flex;justify-content: flex-end;">
					<!-- <button type="default" class="uni-button" style="width: 100px;" @click="goBack">返回</button> -->
					<button type="primary" class="uni-button" style="width: 100px;" @click="submit">保存配置</button>
				</view>
				<view class="items" v-if="attrCurrent==0  && formData.attributes">
					<scroll-view scroll-y="true">
						<uni-forms ref="form" :value="formData" validateTrigger="bind">
							<uni-forms-item name="title" label="标题" labelWidth="90">
								<uni-easyinput v-model="formData.title" />
							</uni-forms-item>
							<uni-forms-item name="state" label="是否显示" labelWidth="90">
								<uni-data-checkbox v-model="formData.state" :localdata="formOptions.state_localdata" />
							</uni-forms-item>

							<uni-forms-item v-for="(item,index) in formData.attributes" :name="index" :key="index"
								:label="item.title" labelWidth="90">
								<block v-if="item.enum">
									<uni-data-checkbox v-if="item.enum.collection" v-model="item.value"
										:collection="item.enum.collection" :field="item.enum.field" />
									<uni-data-checkbox v-else v-model="item.value" :localdata="item.enum" />
								</block>
								<uni-easyinput v-else-if="item.bsonType=='int'" type="number" v-model="item.value" />
								<uni-easyinput v-else-if="item.bsonType=='string'" v-model="item.value" />
								<cloud-image v-else-if="item.bsonType=='image'" v-model="item.value" />
								<switch v-else-if="item.bsonType=='bool'"
									@change="bindItemData(index, $event.detail.value,item)" :checked="!!item.value" />
								<view class="colorGray margin-top-10" v-if="item.description">
									<text>{{item.description}}</text>
								</view>
							</uni-forms-item>
							<!-- 读取原来的数据 -->
							<view v-if="formData.items && formData.component && formData.component.data">
								<view class="font-38 ti-flex under-line padding-12">
									<text>列表数据</text>
									<view class="flex-1">

									</view>
									<button type="primary" size="mini" class="uni-button"
										@click="pushData(0)">新增</button>
								</view>
								<view v-for="(item2,index2) in formData.items" :key="index2"
									class="padding-bottom-20 padding-top-12 margin-right-20 under-line">
									<uni-forms ref="form">
										<uni-forms-item v-for="(item,index3) in formData.component.data" :name="index3"
											:key="index3" :label="item.title" labelWidth="90">
											<block v-if="item.enum">
												<uni-data-checkbox v-if="item.enum.collection" v-model="item2[index3]"
													:collection="item.enum.collection" :field="item.enum.field" />
												<uni-data-checkbox v-else v-model="item2[index3]"
													:localdata="item.enum" />
											</block>
											<uni-easyinput v-else-if="item.bsonType=='int'" type="number"
												v-model="item2[index3]" />
											<uni-easyinput v-else-if="item.bsonType=='string'"
												v-model="item2[index3]" />
											<switch v-else-if="item.bsonType=='bool'"
												@change="binddata('state', $event.detail.value)"
												:checked="!!item2[index3]" />
											<cloud-image v-else-if="item.bsonType=='image'" :name="index3"
												v-model="item2[index3]" size="160x160" />
										</uni-forms-item>
									</uni-forms>
									<view class="ti-flex">
										<view class="flex-1">

										</view>
										<button type="primary" size="mini" class="uni-button"
											@click="pushData(index2)">插入</button>
										<button type="primary" size="mini" class="uni-button"
											@click="pushData(index2,1)">追加</button>
										<button type="warn" size="mini" class="uni-button"
											@click="deleteData(index2)">删除</button>
									</view>
								</view>
							</view>
						</uni-forms>
					</scroll-view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import draggable from 'vuedraggable'
	const db = uniCloud.database();
	const cmd = db.command;
	export default {
		components: {
			draggable,
		},
		data() {
			return {
				id: "",
				type: "",
				src: "",
				newIndex: 0,
				attrCurrent: 0,
				areaHeight: 0,
				areaTimer: null,
				assemblyList: [],
				assemblyMap: {},
				delIds: [],
				dataList: [], //临时存放组件,点保存，再提交数据
				formData: {
					component: {}
				},
				formOptions: {
					"state_localdata": [{
							"text": "否",
							"value": 0
						},
						{
							"text": "是",
							"value": 1
						}
					]
				},
				windowSize: {
					height: 1000
				}
			};
		},
		onLoad(e) {
			this.id = e.id;
			this.type = e.type;
			this.loadData();
			this.loadAssembly();
			let topSize = 40
			uni.onWindowResize((res) => {
				// console.log("uni.onWindowResize", res)
				let {
					windowHeight,
					windowWidth
				} = res.size;
				this.windowSize = {
					height: windowHeight - topSize
				}
			});
			uni.getSystemInfo({
				success: (res) => {
					console.log("uni.getSystemInfo", res)
					this.windowSize.height = res.windowHeight - topSize;
				}
			})
		},
		watch: {
			formData: {
				handler(newData, oldData) {
					console.log("watch", newData, oldData);
					//替换到dataList里面
					if (oldData && newData._id != oldData._id) {
						oldData.checked = false;
						this.updateData(oldData);
					}
				},
				immediate: true,
				deep: true
			}
		},
		computed: {
			pageConfigs() {
				//页面配置
				console.log("页面配置参数", this.dataList)
				return {
					children: this.dataList.map(e => {
						e.configs = {}
						//attributes转换为configs
						if (e.attributes) {
							for (let key in e.attributes) {
								e.configs[key] = e.attributes[key].value;
							}
						}
						return e;
					})
				}
			},
			containerStyle() {
				return `height:${this.windowSize.height}px;`
			},
			areaStyle() {
				return `height:${this.areaHeight}px;`
			}
		},
		methods: {
			goBack() {
				uni.navigateBack({

				})
			},
			onChange(e) {
				this.attrCurrent = 0;
				clearTimeout(this.areaTimer);
				this.areaTimer = setTimeout(() => {
					console.log("onChange", e)
					let y = e.detail.y;
					let id = e.target.id;
					let data = [];
					let target = this.dataList.filter(i => i._id == id)[0];
					let index = 0;
					//前半段
					this.dataList.map((item) => {
						if (id != item._id) {
							//超过一半
							if ((item.y + item.height / 2) < y) {
								data.push(item);
								index++;
							}
						}
					})
					data.push(target);
					//后半段
					this.dataList.map((item, index2) => {
						if (id != item._id && index2 >= index) {
							data.push(item);
						}
					})
					console.log("data", data)
					this.dataList = data;
					this.buildSort()
				}, 500)
			},
			add(item) {
				this.newIndex++;
				let index = this.dataList.findIndex(e => e.checked);
				let newData = {
					...item,
					component: item.component_id,
					configs: {},
					_id: `new${this.newIndex}`,
					y: 0,
					height: item.height,
					title: item.title,
					// component: item,
					items: [],
					checked: false,
					state: 1,
					posid: this.dataList.length
				}
				if (index != -1) {
					index += 1;
					this.dataList.splice(index, 0, newData);
				} else {
					this.dataList.push(newData)
					index = this.dataList.length - 1;
				}
				this.buildSort()
				this.edit(this.dataList[index])
			},
			edit(item) {
				// console.log("this.formData", this.formData)
				// this.formData = {};
				this.attrCurrent = 0;
				this.dataList.forEach(i => {
					i.checked = i._id == item._id;
				})
				console.log("this.dataList", this.dataList)
				// item.checked = true
				//处理属性默认值
				for (let key in item.attributes) {
					let attr = item.attributes[key];
					if (!attr.value) {
						if (attr.defaultValue) {
							item.attributes[key].value = attr.defaultValue
						} else if (attr.bsonType == "bool") {
							item.attributes[key].value = false;
						} else {
							item.attributes[key].value = "";
						}
					}
				}
				//处理data默认值
				setTimeout(() => {
					this.setComponentDefaultData(item);
					// this.formData = {
					// 	...item
					// };
					this.formData = item;
					console.log("this.formData", this.formData)
				}, 100)
			},
			setComponentDefaultData(item) {
				for (let key in item.data) {
					let attr = item.data[key];
					if (!attr.value) {
						if (attr.defaultValue) {
							item.data[key].value = attr.defaultValue
						} else if (attr.bsonType == "bool") {
							item.data[key].value = false;
						} else {
							item.data[key].value = "";
						}
					}
				}
			},
			updateData(item) {
				console.log("updateData", item)
				let index = this.dataList.findIndex(e => e._id == item._id);
				if (index > -1) {
					this.dataList[index] = item;
				}
			},
			pushData(index2, next = 0) {
				let data = {};
				for (let key in this.formData.component.data) {
					data[key] = this.formData.component.data[key].value;
					// this.formData.component.data[key].value = false;
				}
				console.log("this.formData", this.formData.component.data);
				this.formData.items.splice(index2 + next, 0, data)
			},
			saveData() {
				let index = this.dataList.findIndex(e => e.checked);
				console.log("this.formData", this.formData.component.data);
				let data = {};
				for (let key in this.formData.component.data) {
					data[key] = this.formData.component.data[key].value;
					// this.formData.component.data[key].value = false;
				}
				// this.setComponentDefaultData(this.formData);
				this.formData.items.push(data);
				this.dataList[index].items = this.formData.items;
				console.log("this.dataList[index]", this.dataList[index])
			},
			deleteData(index) {
				let index1 = this.dataList.findIndex(e => e.checked);
				this.dataList[index1].items.splice(index, 1)
			},
			delItem(item, index) {
				if (item._id) {
					this.delIds.push(item._id)
					console.log("this.delIds", this.delIds)
				}
				this.dataList.splice(index, 1);
				this.buildSort()
				if (item.checked) {
					this.formData = {}
					if (this.dataList.length > 0) {
						this.edit(this.dataList[0])
					}
				}
			},
			buildSort() {
				return;
				//从新计算高度
				let y = 0;
				this.dataList.forEach(pg => {
					pg.y = y;
					y += pg.height;
				})
				this.areaHeight = y
			},
			/**
			 * 触发表单提交
			 */
			async submit() {
				//最后一个信息替换列表
				this.updateData(this.formData);
				uni.showLoading({
					mask: true
				})
				if (!this.currentAdminShop.page_id) {
					//没有页面id，需要新增
					console.log("没有页面id，需要新增")
					let {
						result
					} = await db.collection("tian-pages").add({
						title: this.currentAdminShop.name,
						posid: this.currentAdminShop.id,
						state: 0,
						component: "tian-pages"
					})
					this.id = result.id;
					//更新到店铺信息
					db.collection("tian-mall-shops").doc(this.currentAdminShop._id).update({
						page_id: result.id
					})
					console.log("result", result)
				}
				console.log("this.dataList", this.dataList)
				let addData = [];
				let editData = {};
				//转换component为configs
				this.dataList.forEach((item, index) => {
					if (item._id.indexOf("new") == 0) {
						delete item._id;
					}
					let pg = {
						title: item.title,
						posid: index,
						state: item.state,
						items: item.items,
						parent_id: this.id,
						configs: {},
						component: item.component_id
					}
					for (let key in item.attributes) {
						let attr = item.attributes[key];
						//转换数据类型
						this.formatValue(attr);
						pg.configs[key] = attr.value;
					}
					if (item._id) {
						//修改数据
						editData[item._id] = pg
					} else {
						addData.push(pg)
					}
				});
				if (this.delIds.length > 0) {
					db.action("backup").collection("tian-pages").where({
						_id: cmd.in(this.delIds)
					}).remove()
				}
				if (addData.length > 0) {
					db.collection("tian-pages").add(addData)
				}
				for (let id in editData) {
					db.collection("tian-pages").doc(id).update(editData[id])
				}
				uni.showToast({
					title: "保存成功"
				})

				setTimeout(() => {
					/* uni.navigateBack({
						delta: 1
					}) */
					// this.$store.dispatch('app/init', {});
				}, 2000)
				this.$store.commit('app/SET_ADMIN_SHOP', {
					...this.currentAdminShop,
					page_id: this.id
				})
			},

			loadData() {
				if (!this.currentAdminShop.page_id) {
					//没有页面id，需要新增
					console.log("没有页面id，需要新增", this.currentAdminShop)
					return;
				}
				this.id = this.currentAdminShop.page_id;
				/* let link = window.location.protocol + "//" + window.location.host;
				if (link.indexOf("localhost") != -1) {
					link = "http://tian.cqsort.com"
				}
				this.src = `${link}/#/pages/app/pages?id=${this.id}&type=${this.type}`; */
				db.collection("tian-pages,tian-page-components").where(`parent_id=="${this.id}"`).field(
						"title,component,items,state,posid,created,modified,configs").orderBy("posid asc").limit(150).get()
					.then(({
						result
					}) => {
						this.dataList = result.data.map(item => {
							// item.y = 0;
							// item.checked = false;
							let component = item.component[0];
							//处理属性，转换为对象
							if (typeof component.attributes == "string") {
								component.attributes = JSON.parse(component.attributes);
							}
							component.checked = false;
							component._id = item._id;
							//填充默认值
							for (let key in component.attributes) {
								let attr = component.attributes[key];
								if (item.configs && item.configs[key]) {
									component.attributes[key].value = item.configs[key];
								} else if (attr.bsonType == "bool") {
									component.attributes[key].value = false;
								} else {
									component.attributes[key].value = "";
								}
							}
							if (item.items) {
								component.items = item.items;
							}
							component.state = item.state;
							component.component = component.component_id
							console.log("item.component", item.component)
							//处理尺寸
							// item.height = this.buildSize(item.component);
							return component;
						});
						this.buildSort()
						if (this.dataList.length > 0) {
							this.edit(this.dataList[0])
						}
						console.log("this.dataList", this.dataList)
					})
			},
			loadAssembly() {
				db.collection("tian-page-components").where("is_page!=true && shop_decoration==true").orderBy("posid asc")
					.limit(100).get().then(({
						result
					}) => {
						result.data.forEach(item => {
							//处理属性，转换为对象
							if (typeof item.attributes == "string") {
								item.attributes = JSON.parse(item.attributes);
							}
							//处理尺寸
							item.height = this.buildSize(item);
							this.assemblyMap[item.component_id] = item;
						})
						this.assemblyList = result.data;
						console.log("result", result.data)
					})
			},
			buildSize(item) {
				let maxWidth = 740;
				if (item.previewfile) {
					let {
						width,
						height
					} = item.previewfile.image;
					let newHeight = (height * maxWidth / width).toFixed(2);
					item.thumb_style = `width:${maxWidth}rpx;height:${newHeight}rpx;`;
					return uni.upx2px(height);
				}
				if (item.thumb_size) {
					let [width, height] = item.thumb_size.split("x");
					let newHeight = (height * maxWidth / width).toFixed(2);
					item.thumb_style = `width:${maxWidth}rpx;height:${newHeight}rpx;`;
					return uni.upx2px(height);
				}
				return 100;
			},
			formatValue(item) {
				if (item.bsonType == "int") {
					item.value = parseInt(item.value)
				} else if (item.bsonType == "double" || item.bsonType == "float") {
					item.value = parseFloat(item.value)
				} else if (item.bsonType == "bool") {
					item.value = !!item.value
				}
			},
			changeAttr(index) {
				this.attrCurrent = index;
				console.log("this.formdata", this.formData)
			},
			bindItemData(key, value, item) {
				// console.log(key, value, item)
				item.value = value;
			}
		}
	}
</script>

<style lang="scss">
	.layout-container {
		height: 100%;
		background: #FFFFFF;
		display: flex;
		border-bottom: 2rpx solid #f5f5f5;

		.title {
			text-align: center;
			padding: 30rpx;
			font-size: 36rpx;
		}

		.assembly {
			width: 320rpx;
			padding: 20rpx;
			border-right: 2rpx solid #f5f5f5;
			display: flex;
			height: 98%;

			.items {
				flex: 1;
				display: flex;
				flex-wrap: wrap;
			}

			.item {
				margin-left: 30rpx;
				margin-top: 40rpx;
				text-align: center;
				background: #f8f8f8;
				padding: 20rpx;
				border-radius: 16rpx;
			}

			.image-thumb {
				cursor: pointer;
				width: 240rpx;
				height: 180rpx;
			}
		}

		.preview {
			flex: 1;
			padding: 20rpx;
			border-right: 2rpx solid #f5f5f5;
			background: #fafafa;

			.items {
				margin: 0 auto;
				width: 790rpx;
				height: 100rpx;
				display: flex;

				.items-area {
					height: 100rpx;
				}

				.item {
					cursor: pointer;
					width: 740rpx;
					position: relative;
					padding: 2rpx;
					border: 2rpx solid #f8f8f8;

					&:hover {
						border: 2rpx solid $uni-color-primary;

						.btnDelete {
							display: block;
						}
					}

					&.checked {
						border-color: $uni-color-success;
					}
				}

				.btnDelete {
					display: none;
					position: absolute;
					top: 0rpx;
					right: 0rpx;
					z-index: 99;
				}

				.item-image {
					width: 740rpx;
					display: block;
				}
			}

			.web-panel {
				margin: 0 auto;
				position: relative;
				width: 800rpx;
				height: 150rpx;
			}
		}

		.attribute {
			width: 1000rpx;
			display: flex;
			flex-direction: column;

			.items {
				padding: 40rpx;
				height: 150rpx;
				display: flex;
				flex: 1;
			}
		}
	}

	.tabs {
		.current {
			background: #C0C0C0;
			color: #FFFFFF;
		}
	}
</style>
