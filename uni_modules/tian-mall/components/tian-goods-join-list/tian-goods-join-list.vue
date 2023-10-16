<template>
	<view class="goods-list-container" :class="[configs.style]">
		<unicloud-db ref="udb" v-slot:default="{data, loading, error, options,hasMore}"
			:collection="collection+',opendb-mall-goods'" @load="loadData" action="goods_member,cart_goods"
			:field="field+',goods_id{_id as goods_id,goods_sn,name,keywords,shop_id,goods_thumb,price,market_price,sku_name,is_vip,remain_count,month_sell_count,total_sell_count,comment_count,is_real,is_on_sale,is_alone_sale,is_best,is_new,is_hot,add_date,last_modify_date,use_score,use_score_rate}'"
			:where="where" :options="configs" :orderby="orderby" style="height: 100%;">
			<tian-empty v-if="!loading && data.length == 0" text="暂无数据"></tian-empty>
			<view class="goods-list" :class="[options.style]">
				<block v-for="(item,index) in data" :key="index">
					<view class="colorGray padding-22" v-if="item.groupTime">
						<text>{{item.groupTime}}</text>
					</view>
					<view class="goods">
						<image :src="item.goods_thumb" mode="aspectFill" class="image-width-168 goods-image"
							@click="navToDetail(item)"></image>
						<view class="goods-content">
							<view class="title" @click="navToDetail(item)">
								<text>{{item.name}}</text>
							</view>
							<view class="ti-flex">
								<tian-goods-price :value="item" @click="openSku(item)" class="flex-1">
								</tian-goods-price>
								<tian-icons v-if="options.withDel" type="shanchu" size="26" icolor="#ec6535"
									class="padding-left-30" @click="delItem(item)">
								</tian-icons>
							</view>
						</view>
					</view>
				</block>
			</view>
			<uni-load-more v-if="loading || hasMore" :status="loading?'loading':(hasMore ? 'more' : 'noMore')">
			</uni-load-more>
		</unicloud-db>
		<tian-goods-sku v-if="withSku" :value="goods" ref="tianSkuPop"></tian-goods-sku>
	</view>
</template>
<script>
	/**
	 * 商品列表，关联查询专用，
	 * 左图右文字，两图，一大图
	 * @param {String} configs 分类id 
	 * @param {String} collection 主表
	 */
	export default {
		data() {
			return {
				where: "",
				orderby: "updated_date desc,update_date desc",
				goods: {}
			}
		},
		props: {
			configs: {
				type: Object,
				default: () => {
					return {
						hasMore: false,
						style: "style1",
						image_size: "260x260",
						column: 4,
					}
				}
			},
			collection: {
				type: String,
				default: ""
			},
			field: {
				type: String,
				default: ""
			},
			condition: {
				type: String,
				default: ""
			},
			withSku: {
				type: Boolean,
				default: true
			},
			withGroupTime: {
				type: Boolean,
				default: false
			},
		},
		watch: {
			condition(newVal) {
				console.log("watch condition", newVal)
				this.where = `(${newVal}) && goods_id.is_on_sale==true`
			}
		},
		created() {
			console.log("goods-list created", this.condition)
			this.where = `(${this.condition}) && goods_id.is_on_sale==true`
		},
		methods: {
			refresh() {
				this.$refs.udb.loadData({
					clear: true
				})
			},
			loadData(data) {
				//处理图片尺寸 | thumbImg('80x80')
				let time = "";
				data.forEach(item => {
					//强制设置商品id为当前id
					item._id = item.goods_id;
					if (this.withGroupTime) {
						if (item.updated_date != time) {
							time = item.updated_date;
							item.groupTime = time;
						}
					}
					//最多30个字
					item.name = item.name ? item.name.substr(0, 30) : "";
					item.goods_thumb = this.$thumbImg(item.goods_thumb, this.configs.image_size || '260x260')
				})
				console.log("goods loadData", data)
			},
			loadMore() {
				console.log("goods loadMore")
				//查询下一页
				this.$refs.udb.loadMore()
			},
			navToDetail(item) {
				this.navTo("/pages/product/detail?id=" + item._id, item)
			},
			openSku(item) {
				if (this.withSku) {
					console.log("sku item", item)
					this.goods = item;
					this.$refs.tianSkuPop.open();
				} else {
					this.$emit("click", item)
				}
			},
			delItem(item) {
				console.log("delItem")
				this.$emit("deleteItem", item)
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
		padding: 10rpx 26rpx 10rpx 16rpx;
		height: 100%;

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
			padding: 0 $uni-spacing-row-base;
			margin-top: $uni-spacing-row-base;

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
				}

				&:nth-child(2n) {
					margin-left: 24rpx;
				}
			}
		}
	}
</style>
