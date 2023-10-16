<template>
	<view class="goods-list-container" :class="[configs.style,configs.bgClassName]" :style="bgStyle" @click="bgClick">
		<scroll-view :scroll-y="!!configs.scrollY" style="height: 100%;" @scrolltolower="scrolltolower">
			<unicloud-db ref="udb" v-slot:default="{data, loading, error, options,hasMore}"
				collection="opendb-mall-goods" @load="loadData" action="goods_member"
				field="goods_sn,name,keywords,shop_id,goods_summary,goods_thumb,goods_banner,price,market_price,sku_name,is_vip,remain_count,month_sell_count,total_sell_count,comment_count,is_real,is_on_sale,is_alone_sale,is_best,is_new,is_hot,add_date,last_modify_date,use_score,use_score_rate"
				:where="where" :options="configs" :page-size="configs.page_size" :orderby="orderby"
				style="height: 100%;">
				<tian-empty v-if="!loading && data.length == 0" text="暂无数据" marginTop="200"></tian-empty>
				<view class="goods-list" :class="[options.style]">
					<view v-for="(item,index) in data" :key="index" class="under-line goods" :class="configs.itemClassName">
						<image :src="item.banner_path" mode="aspectFill" class="image-width-168 goods-image"
							:style="item.style" @click.stop="navToDetail(item)"></image>
						<view class="goods-content">
							<view class="title" @click.stop="navToDetail(item)">
								<text>{{item.name}}</text>
							</view>
							<view class="desc colorGray font-24 padding-top-8" v-if="item.goods_summary">
								<text>{{item.goods_summary}}</text>
							</view>
							<tian-goods-price :hasCart="item.hasCart" :hasSaleCount="item.hasSaleCount" :value="item"
								@click="openSku(item)"></tian-goods-price>
						</view>
					</view>
				</view>
				<uni-load-more v-if="options.loading" status="loading">
				</uni-load-more>
				<uni-load-more v-else-if="options.loadmore" :status="loading?'loading':(hasMore ? 'more' : 'noMore')">
				</uni-load-more>
			</unicloud-db>
			<tian-goods-sku v-if="withSku" :value="goods" ref="tianSkuPop"></tian-goods-sku>
		</scroll-view>
	</view>
</template>
<script>
	/**
	 * 商品列表，
	 * 左图右文字，两图，一大图
	 * @param {String} category_id 分类id
	 */
	export default {
		data() {
			return {
				isItemClick: false,
				bgStyle: "",
				goods: {},
			}
		},
		props: {
			configs: {
				type: Object,
				default: () => {
					return {
						checkLocation: true,
						loadmore: false,
						loading: false,
						bgClassName: "none",
						itemClassName: "none",
						style: "", //style-gride,style-padding
						image_size: "260x260",
						page_size: 20,
						scrollY: false
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
			},
			refresh: {
				type: Number,
				default: 0
			},
			loadmore: {
				type: Number,
				default: 0
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
				return conditions.join(" && ")
			},
			orderby() {
				if (this.configs && this.configs.order) {
					return this.configs.order;
				}
				return "last_modify_date desc"
			}
		},
		watch: {
			loadmore() {
				this.scrolltolower()
			},
			configs(newVal) {
				console.log("goods list configs", newVal)
			}
		},
		created() {},
		methods: {
			bgClick() {
				if (!this.isItemClick && this.configs.top_url) {
					console.log("bg click")
					this.navTo(this.configs.top_url)
				}
			},
			loadData(data) {
				console.log("goods list", this.configs, data)
				//处理图片尺寸 | thumbImg('80x80')
				data.forEach(item => {
					item.style = "";
					item.hasCart = true;
					item.hasSaleCount = false;
					item.banner_path = this.$thumbImg(item.goods_thumb, this.configs.image_size || '260x260')
					if (this.configs.style == "style-big-image") {
						if (item.goods_banner && item.goods_banner.path) {
							let banner = item.goods_banner;
							if (this.configs.image_size) {
								let [width] = this.configs.image_size.split("x");
								//等宽缩放
								let height = parseInt(banner.image.height * width / banner.image.width);
								item.style = `width:${width}rpx;height:${height}rpx;`;
								item.banner_path = this.$thumbImg(banner.path, `${width}x${height}`);
							} else {
								//不做裁剪
								item.banner_path = banner.path;
								item.style = `width:${banner.image.width}rpx;height:${banner.image.height}rpx;`;
							}
						}
						if (!item.is_real) {
							item.hasCart = false;
							item.hasSaleCount = true;
						}
					} else {
						//最多30个字
						item.name = item.name ? item.name.substr(0, 30) : "";
					}
				})
				// console.log("goods loadData", data)
				if (this.configs.background_img) {
					// console.log("this.configs.background_img", this.configs.background_img)
					this.bgStyle = `background-image:url(${this.configs.background_img}) ; background-repeat: no-repeat;    background-size: 100%;`
				}
			},
			scrolltolower() {
				console.log("goods scrolltolower")
				//查询下一页
				if (this.configs.loadmore) {
					this.$refs.udb.loadMore()
				}
			},
			loadMoreData() {
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
				return false;
			}
		}
	}
</script>
<style lang="scss">
	page {
		height: 100%;
	}

	.goods-list-container {
		background: $uni-bg-color;
		height: 100%;

		&.style-padding {
			background: none;
		}

		&.style-gride {
			background: none;
		}
	}

	.goods-list {
		// padding: 10rpx 26rpx 10rpx 16rpx;

		.desc {
			display: none;
		}

		.goods {
			padding: 20rpx 0 14rpx;
			display: flex;
		}

		.goods-image {
			display: inline-block;
			width: 168rpx;
			height: 168rpx;
			border-radius: 12rpx;
		}

		.goods-content {
			flex: 1;
			margin-left: 24rpx;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
		}

		.title {
			font-size: 28rpx;
		}

		&.style-padding {
			background: none;
			margin: $uni-spacing-row-base;
			margin-top: 0;
			padding: 0;

			.goods {
				background: $uni-bg-color;
				margin-bottom: $uni-spacing-row-base;
				padding: $uni-spacing-row-base;
				border-radius: $uni-border-radius-base;
			}
		}

		&.style-gride {
			display: flex;
			flex-wrap: wrap;
			// padding: 0 $uni-spacing-row-base;
			// margin-top: $uni-spacing-row-base;

			.goods {
				background: $uni-bg-color;
				width: calc(50% - 14rpx);
				padding: 0 0 $uni-spacing-row-base;
				display: block;
				overflow: hidden;
				border-radius: $uni-border-radius-lg;
				margin-bottom: $uni-spacing-row-base;

				.goods-content {
					margin: 0 $uni-spacing-row-base;
				}

				.goods-image {
					width: 100%;
					height: 350rpx;
					border-radius: 12rpx 12rpx 0 0;

				}

				&:nth-child(2n) {
					margin-left: 24rpx;
				}
			}
		}

		&.style-big-image {
			padding: 0;

			.desc {
				display: block;
			}

			.goods {
				padding: 0;
				display: block;
				background: #FFFFFF;
				margin-bottom: 22rpx;
				border-radius: 22rpx;
				padding-bottom: 16rpx;

				.title {
					font-size: 32rpx;
					font-weight: 500;
				}

				.goods-image {
					width: 100%;
					height: 300rpx;
					margin: 0 auto;
					display: block;
					border-radius: 22rpx 22rpx 0 0;
				}

				.goods-content {
					margin-top: 16rpx;
					margin-right: 24rpx;
				}
			}
		}
	}
</style>
