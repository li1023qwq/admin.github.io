<template>
	<view class="search-container" :class="{fixed:configs.fixed,isSeat:configs.isSeat}">
		<view class="uni-searchbar">
			<view class="uni-searchbar-city" v-if="configs.back" @click="goBack">
				<tian-icons size="24" type="xiangzuo1" class="margin-left-6" />
			</view>
			<view class="uni-searchbar-city" v-if="configs.selectCity" @click="navTo('/pages/app/cities?save=1')">
				<text class="uni-searchbar-city-result" :style="{color:configs.cityColor}">{{selectedCityName}}</text>
				<tian-icons :color="configs.cityColor" size="14" type="xiangxia1" class="margin-left-6" />
			</view>
			<view :style="{borderRadius:radius+'px',backgroundColor: bgColorText}" class="uni-searchbar__box"
				@click="searchClick">
				<view class="uni-searchbar__box-icon-search">
					<slot name="searchIcon">
						<tian-icons color="#999999" size="18" type="sousuo" />
					</slot>
				</view>
				<input v-if="show || searchVal" :focus="showSync" :placeholder="placeholderText" :maxlength="maxlength"
					class="uni-searchbar__box-search-input" confirm-type="search" type="text" v-model="searchVal"
					@confirm="confirm" @blur="blur" />
				<text v-else class="uni-searchbar__text-placeholder">{{ placeholderText }}</text>
				<view v-if="show && (clearButton==='always'||clearButton==='auto'&&searchVal!=='')"
					class="uni-searchbar__box-icon-clear" @click="clear">
					<slot name="clearIcon">
						<tian-icons color="#c0c4cc" size="18" type="shanchu" />
					</slot>
				</view>
			</view>
			<text @click="cancel" class="uni-searchbar__cancel"
				v-if="cancelButton ==='always' || show && cancelButton ==='auto'">{{cancelText}}</text>
		</view>
		<view class="search-tmp">

		</view>
	</view>
</template>

<script>
	const db = uniCloud.database();
	/**
	 * SearchBar 搜索栏
	 * @description 评分组件
	 * @tutorial https://ext.dcloud.net.cn/plugin?id=866
	 * @property {Number} radius 搜索栏圆角
	 * @property {Number} maxlength 输入最大长度
	 * @property {String} placeholder 搜索栏Placeholder
	 * @property {String} clearButton = [always|auto|none] 是否显示清除按钮
	 * 	@value always 一直显示
	 * 	@value auto 输入框不为空时显示
	 * 	@value none 一直不显示
	 * @property {String} cancelButton = [always|auto|none] 是否显示取消按钮
	 * 	@value always 一直显示
	 * 	@value auto 输入框不为空时显示
	 * 	@value none 一直不显示
	 * @property {String} cancelText 取消按钮的文字
	 * @property {String} bgColor 输入框背景颜色
	 * @property {Boolean} focus 是否自动聚焦
	 * @property {Boolean} disabled 是否禁用
	 * @property {Object} configs 自定义布局传递参数
	 * @event {Function} confirm uniSearchBar 的输入框 confirm 事件，返回参数为uniSearchBar的value，e={value:Number}
	 * @event {Function} input uniSearchBar 的 value 改变时触发事件，返回参数为uniSearchBar的value，e=value
	 * @event {Function} cancel 点击取消按钮时触发事件，返回参数为uniSearchBar的value，e={value:Number}
	 * @event {Function} clear 点击清除按钮时触发事件，返回参数为uniSearchBar的value，e={value:Number}
	 * @event {Function} blur input失去焦点时触发事件，返回参数为uniSearchBar的value，e={value:Number}
	 * @event {Function} click 禁用后，点击事件，e={value:Number}
	 */

	export default {
		name: "TianSearchBar",
		props: {
			placeholder: {
				type: String,
				default: "请输入搜索内容"
			},
			radius: {
				type: [Number, String],
				default: 5
			},
			clearButton: {
				type: String,
				default: "auto"
			},
			cancelButton: {
				type: String,
				default: "auto"
			},
			cancelText: {
				type: String,
				default: '取消'
			},
			bg_color: {
				type: String,
				default: "#F8F8F8"
			},
			maxlength: {
				type: [Number, String],
				default: 100
			},
			value: {
				type: [Number, String],
				default: ""
			},
			focus: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			configs: {
				type: Object,
				default: () => {
					return {
						selectCity: false, //选择城市
						fixed: false,
						isSeat: false,
						cityColor: "#000000"
					}
				}
			},
		},
		data() {
			return {
				selectedCityName: "",
				selectCityKey: "user_select_city",
				show: false,
				showSync: false,
				back: false,
				searchVal: ''
			}
		},
		watch: {
			value: {
				immediate: true,
				handler(newVal) {
					this.searchVal = newVal
					if (newVal) {
						this.show = true
					}
				}
			},
			focus: {
				immediate: true,
				handler(newVal) {
					if (newVal) {
						this.show = true;
						this.$nextTick(() => {
							this.showSync = true
						})
					}
				}
			},
			searchVal(newVal, oldVal) {
				this.$emit("input", newVal)
			},
			userInfo() {
				this.getSelectedCityName();
			}
		},
		computed: {
			userInfo() {
				return this.$store.state.user.userInfo;
			},
			placeholderText() {
				if (this.configs.placeholder) {
					return this.configs.placeholder;
				}
				return this.placeholder;
			},
			bgColorText() {
				if (this.configs.bgColor) {
					return this.configs.bgColor;
				}
				return this.bg_color;
			}
		},
		mounted() {
			this.getSelectedCityName();
		},
		methods: {
			goBack() {
				uni.navigateBack({

				})
			},
			loadData() {
				this.getSelectedCityName();
			},
			getSelectedCityName() {
				if (!this.configs.selectCity) {
					//不带城市，自动删除城市信息
					// console.log("删除分站城市信息")
					//@TODO 2022-01-07很多页面都有在调用，分站信息需要重新规划
					// uni.removeStorage({
					// 	key: this.selectCityKey
					// })
					return;
				}
				//优先读取用户设定的地区，方便同步，小程序杀死后，没有缓存
				if (this.userInfo.selectCity) {
					this.selectedCityName = this.userInfo.selectCity.name;
				} else {
					//与pages/app/cities搭配使用，固定key
					let city = uni.getStorageSync(this.selectCityKey);
					console.log("city", city)
					if (city) {
						this.selectedCityName = city.name;
					} else {
						this.selectedCityName = "请选择";
						//定位，需要配置定位权限，否则无法获得位置信息
						this.getLocation();
					}
				}
			},
			async getLocation() {
				let zhixiashi = {
					"北京市": "110000",
					"天津市": "120000",
					"重庆市": "500000",
					"上海市": "310000",
				}
				//查询推荐的区县
				let {
					result
				} = await db.collection("opendb-city-china").where("type==2 && is_recommend==true").field(
					"code,name").get();
				let districts = {};
				result.data.map(e => {
					districts[e.name] = e.code;
				})
				uni.getLocation({
					success: (e) => {
						console.log("getLocation", e)
						//根据经纬度，获得城市
						this.$request("utils/getLocationAddress", {
							fromLatlng: [e.latitude, e.longitude].join()
						}).then(data => {
							console.log("data", data)
							if (data.ad_info) {
								let localCity = {}
								if (districts[data.ad_info.district]) {
									//处理区县
									localCity = {
										latitude: e.latitude,
										longitude: e.longitude,
										name: data.ad_info.district,
										code: districts[data.ad_info.district]
									}
								} else if (zhixiashi[data.ad_info.province]) {
									//需要处理直辖市
									localCity = {
										latitude: e.latitude,
										longitude: e.longitude,
										name: data.ad_info.province,
										code: zhixiashi[data.ad_info.province]
									}
								} else {
									//普通城市
									localCity = {
										latitude: e.latitude,
										longitude: e.longitude,
										name: data.ad_info.city,
										code: data.ad_info.adcode.substr(0, 4) + "00"
									}
								}
								uni.setStorage({
									key: this.selectCityKey,
									data: localCity,
									success: () => {
										console.log("重新加载首页", localCity)
										//重新加载首页
										setTimeout(() => {
											this.$store.dispatch('app/init', {
												city: localCity
											});
										}, 100)
									}
								});
								this.selectedCityName = localCity.name;
							}
						})
					}
				})
			},
			searchClick() {
				if (this.configs.disabled) {
					//直接跳转
					uni.navigateTo({
						url: this.configs.openUrl
					})
					return;
				}
				if (this.disabled) {
					this.$emit("click")
					return;
				}
				if (this.show) {
					return
				}
				this.show = true;
				this.$nextTick(() => {
					this.showSync = true
				})
			},
			clear() {
				this.$emit("clear", {
					value: this.searchVal
				})
				this.searchVal = ""
			},
			cancel() {
				this.$emit("cancel", {
					value: this.searchVal
				});
				this.searchVal = ""
				this.show = false
				this.showSync = false
				// #ifndef APP-PLUS
				uni.hideKeyboard()
				// #endif
				// #ifdef APP-PLUS
				plus.key.hideSoftKeybord()
				// #endif
			},
			confirm() {
				// #ifndef APP-PLUS
				uni.hideKeyboard();
				// #endif
				// #ifdef APP-PLUS
				plus.key.hideSoftKeybord()
				// #endif
				this.$emit("confirm", {
					value: this.searchVal
				})
			},
			blur() {
				// #ifndef APP-PLUS
				uni.hideKeyboard();
				// #endif
				// #ifdef APP-PLUS
				plus.key.hideSoftKeybord()
				// #endif
				this.$emit("blur", {
					value: this.searchVal
				})
			}
		}
	};
</script>

<style lang="scss" scoped>
	$uni-searchbar-height: 36px;

	.search-container {
		&.fixed {
			.uni-searchbar {
				padding-bottom: $uni-spacing-row-base;
				// position: fixed;
				// width: calc(100% - 44rpx);
				// z-index: 90;
				background: #fff;
				padding-top: calc(var(--status-bar-height) + 22rpx);
			}

			.search-tmp {
				display: block;
				// height: calc(var(--status-bar-height) + 104rpx);
			}
		}

		&.isSeat {
			.uni-searchbar {
				display: none;
			}

			.search-tmp {
				display: block;
				height: 84rpx;
			}
		}
	}

	.search-tmp {
		display: none;
	}

	.uni-searchbar {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		position: relative;
		// padding: $uni-spacing-col-base;
		// background-color: $uni-bg-color;
		padding: 0 $uni-spacing-row-base 0;
	}

	.uni-searchbar-city {
		margin-right: 16rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
	}

	.uni-searchbar-city-result {
		font-size: 32rpx;
		max-width: 80px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.uni-searchbar__box {
		/* #ifndef APP-NVUE */
		display: flex;
		box-sizing: border-box;
		/* #endif */
		overflow: hidden;
		position: relative;
		flex: 1;
		justify-content: center;
		flex-direction: row;
		align-items: center;
		height: $uni-searchbar-height;
		padding: 5px 8px 5px 0px;
		border-width: 0.5px;
		border-style: solid;
		border-color: $uni-border-color;
	}

	.uni-searchbar__box-icon-search {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		// width: 32px;
		padding: 0 8px;
		justify-content: center;
		align-items: center;
		color: $uni-text-color-placeholder;
	}

	.uni-searchbar__box-search-input {
		flex: 1;
		font-size: $uni-font-size-base;
		color: $uni-text-color;
	}

	.uni-searchbar__box-icon-clear {
		align-items: center;
		line-height: 24px;
		padding-left: 8px;
		/* #ifdef H5 */
		cursor: pointer;
		/* #endif */
	}

	.uni-searchbar__text-placeholder {
		font-size: $uni-font-size-base;
		color: $uni-text-color-placeholder;
		margin-left: 5px;
	}

	.uni-searchbar__cancel {
		padding-left: 10px;
		line-height: $uni-searchbar-height;
		font-size: 14px;
		color: $uni-text-color;
		/* #ifdef H5 */
		cursor: pointer;
		/* #endif */
	}
</style>
