<template>
	<view class="banner-image-container" :class="[options.display]">
		<view class="" v-if="options.mode.indexOf('mode_1')==0">
			<image :src="firstImg.url" mode="aspectFill" class="image"
				:style="{height:firstImg.height+'rpx',width:firstImg.width+'rpx'}">
			</image>
			<view class="ti-flex" v-if="options.mode=='mode_1_1_2'">
				<view class="flex-2">
					<image :src="secondImg.url" mode="aspectFill" class="image "
						:style="{height:secondImg.height+'rpx',width:secondImg.width+'rpx'}">
					</image>
				</view>
				<view class="flex-1">
					<view v-for="(item,index) in dataList" :key="index" @click="navToItem(item,index)" class="flex-1">
						<image :src="item.url" mode="aspectFill" class=" image"
							:style="{height:item.height+'rpx',width:item.width+'rpx'}">
						</image>
					</view>
				</view>
			</view>
			<view class="ti-flex" v-else-if="options.mode=='mode_1_3'">
				<view class="flex-1">
					<image :src="secondImg.url" mode="aspectFill" class="image "
						:style="{height:secondImg.height+'rpx',width:secondImg.width+'rpx'}">
					</image>
				</view>
				<view v-for="(item,index) in dataList" :key="index" @click="navToItem(item,index)" class="flex-1">
					<image :src="item.url" mode="aspectFill" class=" image"
						:style="{height:item.height+'rpx',width:item.width+'rpx'}">
					</image>
				</view>
			</view>
		</view>
		<view class="" v-else-if="options.mode.indexOf('mode_2')==0">
			<view class="ti-flex">
				<image :src="firstImg.url" mode="aspectFill" class="image flex-1"
					:style="{height:firstImg.height+'rpx',width:firstImg.width+'rpx'}">
				</image>
				<image :src="secondImg.url" mode="aspectFill" class="image flex-1"
					:style="{height:secondImg.height+'rpx',width:secondImg.width+'rpx'}">
				</image>
			</view>
			<view class="ti-flex">
				<view v-for="(item,index) in dataList" :key="index" @click="navToItem(item,index)" class="flex-1">
					<image :src="item.url" mode="aspectFill" class=" image"
						:style="{height:item.height+'rpx',width:item.width+'rpx'}">
					</image>
				</view>
			</view>
		</view>
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
				firstImg: {},
				secondImg: {},
				dataList: [],
				current: 0,
				options: {
					display: "default",
					mode: "mode_1_1_2",
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
				let minLength = 2;
				//处理图片尺寸 | thumbImg('700x300')
				data.forEach(item => {
					//微信中不支持使用过滤器
					item.url = this.$thumbImg(item.bannerfile.url,
						`${this.options.width}x${this.options.height}`)
					item.height = this.options.height
					item.width = this.options.height
				})
				this.firstImg = data.shift();
				this.firstImg.width = this.options.width;

				this.secondImg = data.shift();
				if (this.options.mode == 'mode_1_1_2') {
					this.secondImg.width = this.options.width / 3 * 2;
					this.secondImg.height = this.options.height * 2;
				} else if (this.options.mode == 'mode_2_2') {
					this.secondImg.width = this.firstImg.width = this.options.width / 2;
					data.forEach(item => {
						item.width = this.secondImg.width;
					})
				} else if (this.options.mode == 'mode_2_3') {
					minLength = 3;
					this.secondImg.width = this.firstImg.width = this.options.width / 2;
				}
				//必须保证小图数量正确
				if (data.length > minLength) {
					for (let i = 0; i < data.length - minLength; i++) {
						data.pop()
					}
				}

				console.log(this.firstImg)
			}
		}
	}
</script>
<style lang="scss">
	.banner-image-container {
		margin: $uni-spacing-row-base $uni-spacing-row-base 0;
		overflow: hidden;

		.first {}

		.second {}

		.small {
			display: flex;
			flex-direction: column;
		}

		// padding: $uni-spacing-col-base $uni-spacing-row-base 0;
		&.full {
			margin: 0;

			.image {
				border-radius: 0;
			}

		}

		&.mode_1_1_2 {}

		&.mode_1_3 {}
	}

	.image {
		width: 400rpx;
		height: 400rpx;
		margin: 0rpx;
		display: block;
		border-radius: $uni-border-radius-base;
	}

	.swiper-box {
		border-radius: $uni-border-radius-base;
		overflow: hidden;
	}
</style>
