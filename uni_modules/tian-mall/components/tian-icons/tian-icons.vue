<template>
	<view class="icon-container" :class="[align]" :style="{ color: color}" @click="_onClick">
		<text :style="{ 'font-size': size + 'px',color: icolor }" class="tiantian_iconfont " :class="[iconType]"></text>
		<slot></slot>
		<text v-if="badge" class="badge" :style="{ backgroundColor: badgeBgColor}">{{badge}}</text>
	</view>
</template>
<script>
	/**
	 * Icons 图标
	 * @description 用于展示 icons 图标
	 * @tutorial https://www.iconfont.cn/manage/index?manage_type=myprojects&projectId=2479288
	 * @property {Number} size 图标大小
	 * @property {String} type 图标图案，参考示例
	 * @property {String} color 整体颜色
	 * @property {String} icolor 图标颜色
	 * @event {Function} click 点击 Icon 触发事件
	 */
	export default {
		name: 'TianIcons',
		props: {
			type: {
				type: String,
				default: ""
			},
			color: {
				type: String,
				default: '#333333'
			},
			icolor: {
				type: String,
				default: ''
			},
			badgeBgColor: {
				type: String,
				default: ''
			},
			size: {
				type: [Number, String],
				default: 16
			},
			badge: {
				type: [Number, String],
				default: 0
			},
			customIcons: {
				type: String,
				default: ''
			},
			align: {
				type: String,
				default: 'bottom'
			}
		},
		data() {
			return {}
		},
		computed: {
			iconType() {
				//兼容加前缀写法
				if (this.type && this.type.indexOf("tian_") != -1) {
					return this.type;
				}
				return 'tian_' + this.type;
			}
		},
		methods: {
			_onClick() {
				this.$emit('click')
			}
		}
	}
</script>
<style lang="scss">
	.icon-container {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		position: relative;

		&.right {
			flex-direction: row;

			.tiantian_iconfont {
				margin-right: 8rpx;
			}
		}

		&.left {
			flex-direction: row-reverse;

			.tiantian_iconfont {
				margin-left: 8rpx;
			}
		}

		.badge {
			position: absolute;
			top: -14rpx;
			left: 50%;
			font-size: 20rpx;
			color: #FFFFFF;
			background: #ec6535;
			width: 32rpx;
			height: 32rpx;
			border-radius: 50%;
			margin-left: 16rpx;
			text-align: center;
		}
	}
</style>
