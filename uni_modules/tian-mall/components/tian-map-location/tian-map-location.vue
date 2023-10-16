<template>
	<view class="tian-map-location" :class="[options.display]">
		<map id="map" class="map" min-scale="10" :scale="options.scale" :show-location="true" :latitude="latitude"
			:longitude="longitude" @regionchange="onRegionchange"
			:style="{height:options.height+'rpx',width:options.width+'rpx'}">
			<cover-image class="map-center-icon" src="../../static/location-center.png"
				:style="{top:(options.height/2-32)+'rpx'}"></cover-image>
		</map>
		<view class="address">
			<text>{{name}}</text>
		</view>
	</view>
</template>

<script>
	let _mapCtx = null;
	export default {
		name: 'tian-map-location',
		data() {
			return {
				name: "当前位置",
				address: "",
				timer: false,
				latitude: 39.909,
				longitude: 116.39742,
				options: {
					display: "default",
					key: "tiantian-location-value",
					scale: 16,
					width: 710,
					height: 440,
				}
			};
		},
		props: {
			configs: {
				type: Object,
				default: () => {
					//动态读取
					return {}
				}
			},
			value: [Number, String, Array, Object],
			location: {
				// 排列方向 row column
				type: Object,
				default: () => {}
			},
		},
		mounted() {
			_mapCtx = uni.createMapContext('map');
		},
		created() {
			if (this.configs) {
				//动态读取
				this.options = Object.assign(this.options, {
					...this.configs
				})
			}
			console.log("this.value", this.value)
			//获取定位
			this.getLocation()
		},
		watch: {
			value(newVal) {
				console.log("watch value", newVal)
				if (newVal) {
					this.setValues(newVal);
				}
			}
		},
		methods: {
			getLocation() {
				uni.getLocation({
					type: 'gcj02',
					success: (res) => {
						console.log(res)
						this.latitude = res.latitude;
						this.longitude = res.longitude;
						this.reverseGeocoder(res);
					}
				})
			},
			setValues(newVal) {
				this.name = newVal.name;
				this.address = newVal.address;
				this.latitude = newVal.latitude;
				this.longitude = newVal.longitude;
			},
			//地图区域改变
			onRegionchange(e) {
				// console.log("onRegionchange", e)
				clearTimeout(this.timer)
				this.timer = setTimeout(() => {
					//h5 end  安卓 regionchange
					if (e.type === 'end' || e.type === 'regionchange') {
						//微信小程序不生效
						//#ifdef MP-WEIXIN
						return this.reverseGeocoder(e.target.centerLocation);
						//#endif
						//中间位置
						_mapCtx.getCenterLocation({
							success: res => {
								this.reverseGeocoder(res);
							},
							fail: err => {
								console.log(err);
							},
							complete: (e) => {
								console.log(e);
							}
						})
					}
				}, 500)
			},
			reverseGeocoder({
				latitude,
				longitude
			}) {
				this.$request('utils/getLocationAddress', {
						fromLatlng: [latitude, longitude].join(",")
					})
					.then(res => {
						// console.log(res)
						//以最近的一个位置,防止地图抖动
						this.selectAddress({
							address: res.address,
							title: res.formatted_addresses.recommend,
							latitude: res.location.lat,
							longitude: res.location.lng,
						});
					}).catch(err => {

					}).finally(err => {})
			},
			selectAddress(item) {
				this.address = item.address;
				this.name = item.title;
				uni.setStorage({
					key: this.options.key,
					data: item
				})
				this.$emit('input', item);
			}
		}
	}
</script>
<style lang="scss">
	.tian-map-location {
		width: 710rpx;
		margin: 0 auto;
		margin-top: 20rpx;
		overflow: hidden;
		border: 2rpx solid #e7e7e7;
		position: relative;
		border-radius: 16rpx;

		&.full {
			width: 750rpx;
			border: none;
			border-radius: 0;

			.map {
				width: 750rpx;

			}
		}

		.map {
			width: 710rpx;
			height: 400rpx;
			position: relative;

		}

		.map-center-icon {
			position: absolute;
			left: 323rpx;
			top: 228rpx;
			width: 64rpx;
			height: 64rpx;
		}

		.address {
			padding: 20rpx 30rpx;
			font-size: 24rpx;
			color: #e74246;
			background: #FFFFFF;
		}
	}
</style>
