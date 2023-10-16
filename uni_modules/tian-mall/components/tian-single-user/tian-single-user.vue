<template>
	<view class="ti-flex">
		<view class="">
			<image :src="item.avatar?item.avatar:'/static/logo.png'" mode="aspectFill" class="border-radius"
				:class="['image-width-'+size]">
			</image>
		</view>
		<view class="margin-left-20 flex-1">
			<view class="" v-if="item.nickname">
				<text>{{item.nickname}}</text>
			</view>
			<view class="" v-else>
				<text>匿名</text>
			</view>
			<view class="font-20" v-if="item.mobile" @click="tel(item.mobile)">
				<text>{{item.mobile}}</text>
			</view>
		</view>
		<slot></slot>
	</view>
</template>

<script>
	export default {
		name: "tian-user",
		data() {
			return {
				item: {}
			};
		},
		props: {
			value: {
				type: Object,
				default: () => {
					return {}
				}
			},
			size: {
				type: Number,
				default: "80"
			}
		},
		watch: {
			value(newVal) {
				this.item = newVal;
			}
		},
		created() {
			this.item = this.value
		},
		methods: {
			tel(mobile) {
				uni.makePhoneCall({
					phoneNumber: mobile
				});
			}
		}
	}
</script>

<style lang="scss">

</style>
