<template>
	<view class="page-container" :style="pageStyle" :class="[bgClassName]">
		<view v-for="(subItem,index2) in dataList" :key="index2" class="component_item"
			:class="[subItem.configs.className]">
			<tian-banner v-if="subItem.component=='tian-banner'" :configs="subItem.configs" />
			<tian-map-location v-else-if="subItem.component=='tian-map-location'" :configs="subItem.configs">
			</tian-map-location>
			<tian-grides v-else-if="subItem.component=='tian-grides'" :configs="subItem.configs"
				:items="subItem.items" />
			<tian-search-bar v-else-if="subItem.component=='tian-search-bar'" :configs="subItem.configs">
			</tian-search-bar>
			<tian-article v-else-if="subItem.component=='tian-article'" :configs="subItem.configs" :loadmore="loadmore"
				:refresh="refresh">
			</tian-article>
			<tian-banner-image v-else-if="subItem.component=='tian-banner-image'" :configs="subItem.configs"
				:loadmore="loadmore" :refresh="refresh">
			</tian-banner-image>
			<tian-goods-list v-else-if="subItem.component=='tian-goods-list'" :configs="subItem.configs"
				:withSku="false" :loadmore="loadmore" :refresh="refresh" @click="openSku"></tian-goods-list>
			<tian-goods-layout v-else-if="subItem.component=='tian-goods-layout'" :configs="subItem.configs"
				:withSku="false" :refresh="refresh" @click="openSku"></tian-goods-layout>
			<tian-goods-join-list v-else-if="subItem.component=='tian-goods-join-list'" :configs="subItem.configs"
				:refresh="refresh" :withSku="false" @click="openSku">
			</tian-goods-join-list>
			<!-- #ifdef APP-PLUS || H5 -->
			<uni-notice-bar v-else-if="subItem.component=='uni-notice-bar'" v-bind="subItem.configs"
				@click="navTo(subItem.configs.clickUrl)">
			</uni-notice-bar>
			<uni-link v-else-if="subItem.component=='uni-link'" v-bind="subItem.configs">
			</uni-link>
			<uni-title v-else-if="subItem.component=='uni-title'" v-bind="subItem.configs">
			</uni-title>

			<uni-rate v-else-if="subItem.component=='uni-rate'" v-bind="subItem.configs">
			</uni-rate>
			<uni-steps v-else-if="subItem.component=='uni-steps'" v-bind="subItem.configs">
			</uni-steps>
			<!-- #endif -->
			<!-- #ifdef MP -->
			<uni-notice-bar v-else-if="subItem.component=='uni-notice-bar'" :text="subItem.configs.text"
				:backgroundColor="subItem.configs.backgroundColor" :color="subItem.configs.color"
				:moreColor="subItem.configs.moreColor" :moreText="subItem.configs.moreText"
				:single="subItem.configs.single" :scrollable="subItem.configs.scrollable"
				:showIcon="subItem.configs.showIcon" :showClose="subItem.configs.showClose"
				:showGetMore="subItem.configs.showGetMore" @click="navTo(subItem.configs.clickUrl)">
			</uni-notice-bar>
			<uni-link v-else-if="subItem.component=='uni-link'" :title="subItem.configs.title"
				:subTitle="subItem.configs.subTitle" :extra="subItem.configs.extra" :note="subItem.configs.note"
				:thumbnail="subItem.configs.thumbnail" :mode="subItem.configs.mode" :isFull="subItem.configs.isFull"
				:isShadow="subItem.configs.isShadow" :href="subItem.configs.href" :text="subItem.configs.text"
				:downlaod="subItem.configs.downlaod" :showUnderLine="subItem.configs.showUnderLine"
				:copyTips="subItem.configs.copyTips" :color="subItem.configs.color"
				:fontSize="subItem.configs.fontSize">
			</uni-link>
			<uni-title v-else-if="subItem.component=='uni-title'" :type="subItem.configs.type"
				:title="subItem.configs.title" :align="subItem.configs.align" :color="subItem.configs.color"
				:stat="subItem.configs.stat">
			</uni-title>
			<!-- #endif -->
			<ad v-else-if="subItem.component=='ad'" :adpid="subItem.configs.unitid" :unit-id="subItem.configs.unitid"
				class="margin-top-22" />
			<view class="" v-else-if="subItem.previewfile">
				<image :src="subItem.previewfile.url" mode="widthFix" class="image" style="width: 100%;">
				</image>
			</view>
			<view class="preview-cover" v-if="preview" :class="{checked:subItem.checked}">
				<view class="btnFuncs">
					<uni-icons type="arrow-up" v-if="index2!=0" @click="sortItem(subItem,index2,'up')" color="#eb4e38"
						class="" size="40">
					</uni-icons>
					<uni-icons type="arrow-down" v-if="index2!=dataList.length-1"
						@click="sortItem(subItem,index2,'down')" color="#eb4e38" class="" size="40">
					</uni-icons>
					<uni-icons type="close" @click="delItem(subItem,index2)" color="#eb4e38" size="40">
					</uni-icons>
				</view>
				<view class="inner-cover" @click="clickPreview(subItem)">

				</view>
			</view>
		</view>
		<!-- 有商品模块，初始化此控件 -->
		<tian-goods-sku v-if="hasGoodsModule" :value="goods" ref="tianSkuPop"></tian-goods-sku>
	</view>
</template>
<script>
	const db = uniCloud.database();
	/**
	 * 普通组件页面
	 * @property {Object} configs 组件配置
	 * @property {Object} styles 组件样式
	 * @property {Array} items 组件静态数据
	 * @property {Number} refresh 刷新值
	 */
	export default {
		data() {
			return {
				goods: {},
				pageStyle: "",
				dataList: []
			}
		},
		props: {
			configs: {
				type: Object,
				default: () => {
					return {}
				}
			},
			styles: {
				type: Object,
				default: () => {
					return {}
				}
			},
			items: {
				type: Array,
				default: () => {}
			},
			refresh: {
				type: Number,
				default: 0
			},
			loadmore: {
				type: Number,
				default: 0
			},
			preview: {
				//后台预览专用
				type: Boolean,
				default: false
			}
		},
		computed: {
			/**
			 * 是否存在商品模块
			 */
			hasGoodsModule() {
				if (this.dataList) {
					return this.dataList.filter(e => e.component.indexOf("goods") != -1).length > 0;
				}
				return false;
			},
			bgClassName() {
				if (this.configs && this.configs.configs) {
					let names = []
					if (this.configs.configs.bgClassName) {
						names.push(this.configs.configs.bgClassName)
					}
					if (this.configs.configs.isImmersive) {
						names.push("immersive")
					}
					return names.join(" ")
				}
				return ""
			}
		},
		watch: {
			configs(newVal) {
				this.buildPage()
				if (newVal.children) {
					//静态数据
					if (this.preview) {
						this.dataList = [];
						//延时显示
						setTimeout(() => {}, 120)
						this.dataList = newVal.children;
					} else {
						this.dataList = newVal.children;
					}
					console.log("page 重新加载", this.dataList)
				} else {
					if (newVal.parent_id != this.configs.parent_id) {
						//动态数据
						this.loadData()
					}
				}
				console.log("page newVal", newVal)
			},
			loadmore() {
				console.log("pages loadmore")
			}
		},
		created() {
			// console.log("this.config", this.configs)
			this.buildPage()
			if (this.configs.children) {
				this.dataList = this.checkData(this.configs.children)
				console.log("created page", this.dataList)
			} else {
				this.loadData()
			}
		},
		mounted() {
			this.loaded = true;
		},
		methods: {
			clickPreview(item) {
				console.log("clickPreview", item)
				this.$emit("click", item)
			},
			sortItem(item, index, type) {
				this.$emit("sort", item, index, type)
			},
			delItem(item, index) {
				this.$emit("deletes", item, index)
			},
			buildPage() {
				let configs = Object.assign({}, {
					...this.configs,
					...this.configs.configs,
					configs: undefined,
					children: undefined,
				})
				console.log("buildPage page config", configs)
				if (configs.title) {
					//设置页面标题
					uni.setNavigationBarTitle({
						title: configs.title
					});
				}
				//必须同时设置
				if (configs.topbarColor && configs.topbarBgColor) {
					//设置页面标题
					uni.setNavigationBarColor({
						backgroundColor: configs.topbarBgColor,
						frontColor: configs.topbarColor,
					});
				} else {
					//默认颜色
					uni.setNavigationBarColor({
						backgroundColor: "#ffffff",
						frontColor: "#000000",
					});
				}
				this.pageStyle = "";
				if (configs.backgroundImg) {
					this.pageStyle =
						`background-image:url(${configs.backgroundImg}) ;background-repeat:no-repeat;background-size: 100%;`
				}
				if (configs.isImmersive) {
					let {
						top
					} = this.systemInfo.custom;
					this.pageStyle += `padding-top:${top}px;`
				}
			},
			loadData() {
				db.collection("tian-pages").where("state==1").orderBy("posid asc").get({
					getTree: {
						limitLevel: 10,
						startWith: `parent_id=="${this.configs.parent_id}"`
					}
				}).then(({
					result
				}) => {
					this.dataList = this.checkData(result.data)
				})
			},
			checkData(data) {
				if (!data) {
					data = []
				}
				data.forEach(e => {
					if (this.configs.city) {
						e.configs.city = this.configs.city;
						if (e.configs.condition) {
							//自动增加city过滤
							e.configs.condition += ` && city_ids=="${this.configs.city}"`
						}
						//传递到子组件，方便后面查询
						e.city = this.configs.city;
					}
					if (this.configs.shop_id) {
						if (e.configs.condition) {
							//自动增加city过滤
							e.configs.condition += ` && shop_id=="${this.configs.shop_id}"`
						}
						//传递到子组件，方便后面查询
						e.shop_id = this.configs.shop_id;
					}
					if (e.children) {
						this.checkData(e.children);
					}
				})
				return data;
			},
			/**
			 * 列表上打开sku
			 * @param {Object} e
			 */
			openSku(e) {
				console.log("openSku", e)
				this.goods = e;
				this.$refs.tianSkuPop.open();
			},
		}
	}
</script>
<style lang="scss">
	.page-container {
		&.immersive {
			padding-top: var(--status-bar-height);
		}
	}

	.component_item {
		position: relative;

		.preview-cover {
			position: absolute;
			left: 0;
			top: 0;
			right: 0;
			bottom: 0;
			border: 2rpx solid #f8f8f8;
			min-height: 30px;

			.inner-cover {
				position: absolute;
				left: 0;
				top: 0;
				right: 0;
				bottom: 0;
				z-index: 8;
			}

			&:hover {
				border: 2rpx solid $uni-color-primary;
				z-index: 10;

				.btnFuncs {
					display: block;
				}
			}

			&.checked {
				border-color: $uni-color-success;
				z-index: 10;
			}

		}

		.btnFuncs {
			display: none;
			position: absolute;
			top: 0rpx;
			right: 0rpx;
			z-index: 99;
		}
	}
</style>
