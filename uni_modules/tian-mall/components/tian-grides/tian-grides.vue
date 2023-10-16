<template>
	<view class="gride-container" :class="[options.display]">
		<uni-grid :column="options.column" :showBorder="false" :square="false">
			<uni-grid-item v-for="(gi,ind3) in items" :key="ind3">
				<view class="item" @click="itemNavTo(gi.open_url,ind3)" :class="options.itemClassName">
					<image :src="thumbImg(gi.src)" mode="aspectFill" class="image image-width-84" :style="imageStyle">
					</image>
					<text v-if="gi.text" class="font-24">{{gi.text}}</text>
				</view>
			</uni-grid-item>
		</uni-grid>
	</view>
</template>
<script>
	/**
	 * tab性质的页面
	 */
	export default {
		data() {
			return {
				current: 0,
				dataList: [],
				options: {
					display: "",
					title: "",
					style: "",
					itemClassName: "",
					width: 80,
					height: 80,
					column: 5,
				}
			}
		},
		props: {
			configs: {
				type: Object,
				default: () => {
					return {
						column: 4,
					}
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
		watch: {
			configs(newVal) {
				this.options = Object.assign(this.options, {
					...newVal
				})
			},
			items(newVal) {
				console.log("watch items", newVal)
			}
		},
		computed: {
			imageFilter() {
				//每一个的宽度
				let width = parseInt((750 - 44) / this.options.column);
				let height = width; //parseInt(this.options.height * width / this.options.width);
				return `${width}x${height}`
			},
			imageStyle() {
				//每一个的宽度
				let width = parseInt((750 - 44) / this.options.column);
				let height = width; //this.options.height * width / this.options.width;
				return `${this.options.style}`
			}
		},
		created() {
			this.options = Object.assign(this.options, {
				...this.configs
			})
			if (this.options.column > this.items.length) {
				this.options.column = this.items.length;
			}
			console.log("this.items gride", this.items, this.options)
		},
		methods: {
			thumbImg(src) {
				return this.$thumbImg(src, this.imageFilter)
			},
			itemNavTo(url, index) {
				if (url != "preview") {
					if (url.indexOf("::") != -1) {
						//传递形式：::function,{a:b}
						let args = url.substr(2).split(",");
						args.push("{}")
						if (args[0]) {
							return uni.$emit(args[0], JSON.parse(args[1]))
						}
						console.log("方法参数不正确")
						return false;
					}
					console.log(url)
					return this.navTo(url);
				}
				if (this.options.preview_mode && this.options.preview_mode == "single") {
					//单图预览
					uni.previewImage({
						current: index,
						urls: [this.items[index].origin_src]
					})
					return;
				}
				//预览图片
				uni.previewImage({
					current: index,
					urls: this.items.filter(e => e.url == "preview").map(e => e.origin_src)
				})
			}
		}
	}
</script>
<style lang="scss">
	.gride-container {
		background: $uni-bg-color;
		margin: 0 $uni-spacing-row-base;
		// padding-top: 8rpx;
		border-radius: $uni-border-radius-base;

		&.full {
			margin: 0;
			border-radius: 0;
		}

		.item {
			text-align: center;

			.image {
				display: block;
				margin: 0 auto;
			}
		}
	}
</style>
