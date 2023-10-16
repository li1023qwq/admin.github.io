<template>
	<view class="goods-list-container" :class="[options.mode]">
		<view :class="[options.bgClassName]" class="goods-list-inner" :style="bgStyle" @click="bgClick">
			<scroll-view scroll-x v-if="options.mode=='mode_more'">
				<view class="goods-list ">
					<view v-for="(item,index) in dataList" :key="index" class="goods" :style="options.style"
						:class="options.itemClassName">
						<image :src="item.goods_thumb" :style="item.goods_style" mode="aspectFill"
							class="image-width-168 goods-image" @click.stop="navToDetail(item)"></image>
						<view class="goods-content">
							<view class="title text-hide" @click.stop="navToDetail(item)">
								<text>{{item.name}}</text>
							</view>
							<tian-goods-price :hasCart="item.hasCart" :value="item" @click="openSku(item)">
							</tian-goods-price>
						</view>
					</view>
				</view>
			</scroll-view>
			<view class="" v-else-if="options.mode=='mode_1_3'">
				<image :src="firstGoods.banner_path" mode="aspectFill" :style="firstGoods.style"
					class="image-width-168 goods-image" style="margin: 0 auto;display: block;"
					@click.stop="navToDetail(firstGoods)"></image>
				<scroll-view scroll-x>
					<view class="goods-list ">
						<view v-for="(item,index) in dataList" :key="index" class="goods" :style="options.style"
							:class="options.itemClassName">
							<image :src="item.goods_thumb" :style="item.goods_style" mode="aspectFill"
								class="image-width-168 goods-image" @click.stop="navToDetail(item)"></image>
							<view class="goods-content">
								<view class="title text-hide" @click.stop="navToDetail(item)">
									<text>{{item.name}}</text>
								</view>
								<tian-goods-price :hasCart="item.hasCart" :value="item" @click="openSku(item)">
								</tian-goods-price>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>
<script>
	const db = uniCloud.database();
	/**
	 * 商品布局，
	 * 1-3,2-2
	 * @param {String} category_id 分类id 
	 */
	export default {
		data() {
			return {
				firstGoods: {},
				secondGoods: {},
				dataList: [],
				goods: {},
				bgStyle: "",
				isItemClick: false,
				options: {
					checkLocation: false,
					display: "default",
					mode: "mode_more",
					className: "",
					bgClassName: "",
					itemClassName: "",
					width: 716,
					height: 300,
					loadmore: false,
					loading: false,
					image_size: "260x260",
					page_size: 20,
					scrollY: false
				},
			}
		},
		props: {
			configs: {
				type: Object,
				default: () => {
					return {

					}
				}
			},
			condition: {
				type: String,
				default: ""
			},
			withSku: {
				type: Boolean,
				default: true
			}
		},
		watch: {
			configs(newVal) {
				console.log("watch configs ", newVal)
				this.options = Object.assign(this.options, {
					...newVal
				})
			}
		},
		computed: {
			where() {
				let conditions = ["is_on_sale==true"];
				if (this.configs && this.configs.condition) {
					conditions.push(`(${this.configs.condition})`)
				}
				if (this.condition) {
					conditions.push(`(${this.condition})`)
				}
				console.log("conditions", conditions)
				return conditions.join(" && ")
			},
			orderby() {
				if (this.options && this.options.order) {
					return this.options.order;
				}
				return "last_modify_date desc"
			}
		},
		created() {
			if (this.configs) {
				console.log("goods layout this.configs", this.configs)
				//动态读取
				this.options = Object.assign(this.options, {
					...this.configs
				})
			}
			this.setBg();
			this.loadData()
		},
		methods: {
			bgClick() {
				if (!this.isItemClick && this.options.top_url) {
					console.log("bg click")
					this.navTo(this.options.top_url)
				}
			},
			async loadData() {
				console.log("goods layout where", this.where)
				let {
					result
				} = await db.action("goods_member").collection("opendb-mall-goods").where(this.where).field(
					"goods_sn,name,keywords,shop_id,goods_thumb,price,goods_banner,market_price,sku_name,is_vip,remain_count,month_sell_count,total_sell_count,comment_count,is_real,is_on_sale,is_alone_sale,is_best,is_new,is_hot,add_date,last_modify_date,use_score,use_score_rate"
				).orderBy(this.orderby).limit(this.options.page_size).get()
				//处理图片尺寸 | thumbImg('80x80')
				result.data.forEach(item => {
					//最多30个字
					item.name = item.name ? item.name.substr(0, 30) : "";
					let size = this.configs.image_size || '260x260';
					let [width, height] = size.split("x");
					item.goods_style = `width:${width}rpx;height:${height}rpx;`
					item.goods_thumb = this.$thumbImg(item.goods_thumb, size);
					item.hasCart = !!item.is_real;
				})
				if (this.options.mode == 'mode_1_3') {
					//提取存在goods_banner作为第一张图
					let banners = result.data.filter(e => e.goods_banner);
					if (banners.length > 0) {
						//随机一条
						this.firstGoods = banners[parseInt(Math.random() * banners.length)];
						//从原数组中删除
						result.data.splice(result.data.findIndex(e => e._id == this.firstGoods._id), 1)
						//banner图处理
						let banner = this.firstGoods.goods_banner;
						this.firstGoods.banner_path = banner.path;
						this.firstGoods.style = `width:${banner.image.width}rpx;height:${banner.image.height}rpx;`
					}
					console.log("this.firstGoods", this.firstGoods)
				}
				this.dataList = result.data;
				console.log("goods layout", result.data)
			},
			setBg() {
				if (this.options.background_img) {
					// console.log("this.options.background_img", this.options.background_img)
					this.bgStyle =
						`background-image:url(${this.options.background_img}) ; background-repeat: no-repeat;   background-size: 100%;`
				}
			},
			scrolltolower() {
				console.log("goods scrolltolower")
				//查询下一页
				if (this.configs.loadmore) {
					this.$refs.udb.loadMore()
				}
			},
			loadMore() {
				console.log("goods loadmore")
				this.$refs.udb.loadMore()
			},
			navToDetail(item) {
				this.navTo("/pages/product/detail?id=" + item._id, item)
			},
			openSku(item) {
				if (this.withSku) {
					this.goods = item;
					this.$refs.tianSkuPop.open();
				} else {
					this.$emit("click", item)
				}
				this.isItemClick = true;
				setTimeout(() => {
					this.isItemClick = false;
				}, 2000)
			}
		}
	}
</script>
<style lang="scss">
	page {
		height: 100%;
	}

	.goods-list-container {
		height: 100%;

		&.style-padding {
			background: none;
		}

		&.style-gride {
			background: none;
		}
	}

	.goods-list-inner {
		overflow: hidden;
		// padding: 20rpx 26rpx;
	}

	.goods-list {
		display: flex;
		padding-top: 16rpx;

		.goods {
			width: 260rpx;
			margin-right: 12rpx;
		}

		.goods-image {
			display: inline-block;
			width: 260rpx;
			height: 260rpx;
			border-radius: 12rpx;
		}

		.goods-content {
			flex: 1;
			margin-left: 12rpx;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
		}

		.title {
			font-size: 24rpx;
		}


	}
</style>
