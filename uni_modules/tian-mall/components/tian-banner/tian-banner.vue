<template>
	<view class="banner-container" :class="[options.display]">
		<uni-swiper-dot :info="dataList" :current="current" field="content" :mode="options.mode">
			<swiper class="swiper-box" :class="options.style"
				:style="{height:options.height+'rpx',width:options.width+'rpx'}" @change="change">
				<swiper-item v-for="(item,index) in dataList" :key="index" @click="navToItem(item,index)">
					<image :src="item.url" mode="aspectFill" class="image" :class="options.itemClassName"
						:style="{height:options.height+'rpx',width:options.width+'rpx'}">
					</image>
				</swiper-item>
			</swiper>
		</uni-swiper-dot>
	</view>
</template>
<script>
	const db = uniCloud.database();
	/**
	 * 广告组件，需要配合opendb-banner
	 */
	export default {
		data() {
			return {
				where: "",
				dataList: [],
				current: 0,
				options: {
					itemClassName: "",
					display: "default",
					mode: "default",
					width: 716,
					height: 300,
				}
			}
		},
		props: {
			configs: {
				type: Object,
				default: () => {
					//动态读取
					return {}
				}
			},
			items: {
				type: Array,
				default: () => {
					//静态显示
					return []
				}
			}
		},
		created() {
			console.log("ad created", this.configs)
			if (this.configs) {
				//动态读取
				this.options = Object.assign(this.options, {
					...this.configs
				})
			}
			//静态数据
			if (this.items && this.items.length > 0) {
				this.dataList = this.items;
				this.buildData(this.dataList)
			} else {
				//动态读取
				this.loadData()
			}
		},
		methods: {
			navToItem(item, index) {
				let {
					open_url
				} = item;
				if (typeof open_url == "string") {
					if (open_url == "preview") {
						if (this.options.preview_mode && this.options.preview_mode == "single") {
							//单图预览
							uni.previewImage({
								current: index,
								urls: [this.dataList[index].url]
							})
							return;
						}
						//预览图片
						uni.previewImage({
							current: index,
							urls: this.dataList.map(e => e.url)
						})
					} else {
						this.navTo(open_url)
					}
				} else {
					this.$emit("click", item)
				}
			},
			change(e) {
				this.current = e.detail.current;
			},
			loadData() {
				db.collection("opendb-banner").where(`status==true && category_id=="${this.configs.category_id}"`).field(
					"open_url,bannerfile").orderBy("sort asc").get().then(({
					result
				}) => {
					this.buildData(result.data)
					this.dataList = result.data;
				})
			},
			buildData(data) {
				//处理图片尺寸 | thumbImg('700x300')
				data.forEach(item => {
					//微信中不支持使用过滤器
					item.url = this.$thumbImg(item.bannerfile.url,
						`${this.options.width}x${this.options.height}`)
				})
			}
		}
	}
</script>
<style lang="scss">
	.banner-container {
		margin: $uni-spacing-row-base $uni-spacing-row-base 0;

		// padding: $uni-spacing-col-base $uni-spacing-row-base 0;
		&.full {
			margin: 0;

			.image {
				border-radius: 0;
			}

			.swiper-box {
				border-radius: 0;
			}
		}
	}

	.image {
		width: 716rpx;
		height: 300rpx;
		margin: 0rpx;
		display: block;
		border-radius: 12rpx;
	}

	.swiper-box {
		border-radius: $uni-border-radius-base;
		overflow: hidden;
	}
</style>
