<template>
	<view class="goods-price-container" :class="[size]">
		<view class="" v-if="item.is_vip">
			<view class="">
				<text class="price">{{item.price/100}}</text>
				<text v-if="item.use_score" class="font-20">+{{item.use_score}}{{scoreName}}</text>
			</view>
			<view class="member" v-if="item.member">
				<text class="price small">{{item.member.price/100}}</text>
				<text class="name">{{item.member.name}}</text>
			</view>
		</view>
		<view class="" v-else>
			<!-- 普通价格 -->
			<text class="price">{{item.price/100}}</text>
			<text v-if="item.use_score" class="font-20">+{{item.use_score}}{{scoreName}}</text>
			<text class="price del" v-if="item.market_price > item.price">{{item.market_price/100}}</text>
		</view>
		<view class="font-24" style="flex: 1;">
			<view class="colorGray" v-if="hasSaleCount">
				<text>月销量 {{item.month_sell_count}}</text>
			</view>
		</view>
		<tian-icons v-if="hasCart" type="jiahao2fill" color="#ff5a1d" @click="openSku()" size="26"></tian-icons>
		<uni-number-box v-else-if="hasAmount" :min="1" :max="99" :step="1" v-model="amount" @change="changeAmount()">
		</uni-number-box>
		<view class="" v-else-if="readAmount">
			<text>{{amount}}</text>
		</view>
	</view>
</template>
<script>
	/**
	 * 商品价格
	 */
	export default {
		data() {
			return {
				timerId: null,
				amount: 1,
				item: {}
			}
		},
		props: {
			value: {
				type: Object,
				default: () => {
					return {
						price: 0,
						market_price: 0,
						member: {},
					}
				}
			},
			hasCart: {
				type: Boolean,
				default: true
			},
			hasAmount: {
				type: Boolean,
				default: false
			},
			hasSaleCount: {
				type: Boolean,
				default: false
			},
			readAmount: {
				type: Boolean,
				default: false
			},
			size: {
				type: String,
				default: ""
			}
		},
		watch: {
			value(newVal) {
				this.buildPrice(newVal);
			}
		},
		computed: {
			scoreName() {
				return this.$store.state.app.customer.scoreName;
			}
		},
		created() {
			this.buildPrice(this.value);
		},
		methods: {
			buildPrice(val) {
				this.item = {
					...val,
					// member: {}//默认member，在结算的时候，会有问题
				}
				this.amount = +this.item.amount;
				if (val.is_vip && val.member && val.member.rate) {
					this.item.member = {
						...val.member
					}
					//会员价
					this.item.member.price = parseInt(val.price * val.member.rate)
				}
			},
			openSku() {
				//uni.$emit('openSku',this.item); 
				this.$emit("click")
			},
			changeAmount() {
				clearTimeout(this.timerId);
				this.timerId = setTimeout(() => {
					// console.log("amount", this.amount);
					this.$emit("change", {
						_id: this.item._id,
						amount: this.amount
					})
				}, 500)
			},
		}
	}
</script>
<style lang="scss">
	.goods-price-container {
		display: flex;
		align-items: center;
		line-height: 1.2;
		height: 62rpx;

		.member {
			.name {
				font-size: 18rpx;
				margin-right: 12rpx;
				background: #468d4e;
				color: #FFFFFF;
				padding: 0 12rpx;
				border-radius: 8rpx;
			}

			.price {
				color: #468d4e;
				font-size: 22rpx;
			}
		}

		&.big {
			.price {
				font-size: 38rpx;
			}

			.del {
				font-size: 20rpx;
			}
		}
	}
</style>
