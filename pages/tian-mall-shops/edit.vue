<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="name" label="店铺名称">
				<uni-easyinput placeholder="" v-model="formData.name" />
			</uni-forms-item>
			<uni-forms-item name="src" label="店铺logo">
				<cloud-image name="src" v-model="formData.src" />
			</uni-forms-item>
			<uni-forms-item name="banner" label="banner">
				<cloud-image name="banner" v-model="formData.banner" />
			</uni-forms-item>
			<uni-forms-item name="address" label="地址">
				<cloud-map v-model="formData.address"></cloud-map>
			</uni-forms-item>
			<uni-forms-item name="deliveryTypes" label="配送方式">
				<uni-data-checkbox :multiple="true" v-model="formData.deliveryTypes"
					:localdata="formOptions.deliveryTypes_localdata" />
			</uni-forms-item>
			<uni-forms-item name="month_sell" label="月售">
				<uni-easyinput placeholder="近30天销售" type="number" v-model="formData.month_sell" />
			</uni-forms-item>
			<uni-forms-item name="score" label="评分">
				<uni-easyinput placeholder="" type="number" v-model="formData.score" />
			</uni-forms-item>
			<uni-forms-item name="phone" label="联系电话">
				<uni-easyinput placeholder="例如:15986613315" v-model="formData.phone" />
			</uni-forms-item>
			<uni-forms-item name="serviceTime" label="服务时间">
				<uni-easyinput placeholder="例如:早上9点到晚上6点" v-model="formData.serviceTime" />
			</uni-forms-item>
			<uni-forms-item name="isPrint" label="开启打印">
				<switch @change="binddata('isPrint', $event.detail.value)" :checked="formData.isPrint" />
			</uni-forms-item>
			<uni-forms-item name="online" label="是否营业">
				<switch @change="binddata('online', $event.detail.value)" :checked="formData.online" />
			</uni-forms-item>
			<uni-forms-item name="state" label="是否启用">
				<switch @change="binddata('state', $event.detail.value)" :checked="formData.state" />
			</uni-forms-item>
		</uni-forms>
		<view class="">
			<text>退换货地址配置</text>
		</view>
		<uni-forms ref="formRefund" :value="formRefundData">
			<uni-forms-item name="name" label="收货人">
				<uni-easyinput placeholder="例如:张三" v-model="formRefundData.name" />
			</uni-forms-item>
			<uni-forms-item name="phone" label="联系电话">
				<uni-easyinput placeholder="例如:15986613315" v-model="formRefundData.phone" />
			</uni-forms-item>
			<uni-forms-item name="address" label="地址">
				<uni-easyinput placeholder="填写省市县街道xx号" v-model="formRefundData.address" />
			</uni-forms-item>
		</uni-forms>
		<view class="uni-button-group">
			<button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
			<navigator open-type="navigateBack" style="margin-left: 15px;">
				<button class="uni-button" style="width: 100px;">返回</button>
			</navigator>
		</view>

	</view>
</template>

<script>
	import {
		validator
	} from '../../js_sdk/validator/tian-mall-shops.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-mall-shops';

	function getValidator(fields) {
		let reuslt = {}
		for (let key in validator) {
			if (fields.includes(key)) {
				reuslt[key] = validator[key]
			}
		}
		return reuslt
	}

	export default {
		data() {
			return {
				formRefundData: {},
				formData: {
					"address": null,
					"banner": "",
					"deliveryTypes": "deliveryHome",
					"isPrint": null,
					"month_sell": null,
					"name": "",
					"online": null,
					"phone": "",
					"score": 5,
					"serviceTime": "",
					"src": "",
					"state": null
				},
				formOptions: {
					"deliveryTypes_localdata": [{
							"text": "配送到家",
							"value": "deliveryHome"
						},
						{
							"text": "快递",
							"value": "express"
						},
						{
							"text": "到店/自提点自提",
							"value": "selfRaising"
						}
					]
				},
				rules: {
					...getValidator(["banner", "deliveryTypes", "isPrint", "name", "online", "phone", "score",
						"serviceTime", "src", "state", "month_sell"
					])
				}
			}
		},
		onLoad(e) {
			const id = e.id
			this.formDataId = id
			this.getDetail(id)
		},
		onReady() {
			this.$refs.form.setRules(this.rules)
		},
		methods: {
			/**
			 * 触发表单提交
			 */
			async submit() {
				uni.showLoading({
					mask: true
				})
				let refund = await this.$refs.formRefund.validate();
				console.log("refund", refund)
				this.$refs.form.submit().then((res) => {
					res.refund_address = refund;
					this.submitForm(res)
				}).catch((errors) => {
					uni.hideLoading()
				})
			},

			submitForm(value) {
				// 使用 clientDB 提交数据
				db.collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
					uni.showToast({
						title: '修改成功'
					})
					this.getOpenerEventChannel().emit('refreshData')
					setTimeout(() => uni.navigateBack(), 500)
				}).catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
				})
			},

			/**
			 * 获取表单数据
			 * @param {Object} id
			 */
			getDetail(id) {
				uni.showLoading({
					mask: true
				})
				db.collection(dbCollectionName).doc(id).field(
					'address,banner,delivery,deliveryTypes,isPrint,month_sell,name,online,phone,score,serviceTime,src,state,dayStatisticsLog,goods,order,printers,refund_address'
				).get().then((res) => {
					const data = res.result.data[0]
					if (data) {
						this.formData = data;
						if (data.refund_address) {
							this.formRefundData = data.refund_address;
						}
					}
				}).catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
				})
			}
		}
	}
</script>
