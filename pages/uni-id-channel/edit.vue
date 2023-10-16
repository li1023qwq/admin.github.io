<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="id" label="渠道号">
				<uni-easyinput placeholder="5位数字，从10000起自增长，数字类型，局限性很大" v-model="formData.id" />
			</uni-forms-item>
			<uni-forms-item name="title" label="渠道名称">
				<uni-easyinput v-model="formData.title" />
			</uni-forms-item>
			<uni-forms-item name="rebate_money_rate" label="返利比例">
				<uni-easyinput v-model="formData.rebate_money_rate" />
				<view class="colorGray font-24 padding-12">
					<text>填写0-0.99百分比，例如0.04，表示返利订单总金额的4%</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="status" label="用户状态">
				<uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata" />
			</uni-forms-item>
			<uni-forms-item name="address" label="地址">
				<view class="ti-flex">
					<view class="form-item flex-1 ti-flex">
						<text class="colorGray" v-if="address && address.name">{{address.name}}</text>
						<text class="colorGray" v-else>未选择</text>
					</view>
				</view>
			</uni-forms-item>
			<uni-forms-item name="user_id" label="用户">
				<cloud-user-select v-model="formData.user_id" :value="formData.user_id" />
			</uni-forms-item>

			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
				<navigator open-type="navigateBack" style="margin-left: 15px;">
					<button class="uni-button" style="width: 100px;">返回</button>
				</navigator>
			</view>
		</uni-forms>
	</view>
</template>

<script>
	import {
		validator
	} from '../../js_sdk/validator/uni-id-channel.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'uni-id-channel';

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
				address: {},
				formData: {
					"id": "",
					"modified": null,
					"title": "",
					"status": 0,
					"rebate_money_rate": 0,
					"total": null,
					"day_total": null,
					"user_id": ""
				},
				formOptions: {
					"status_localdata": [{
							"text": "未提交",
							"value": 0
						},
						{
							"text": "审核中",
							"value": 1
						},
						{
							"text": "通过",
							"value": 2
						},
						{
							"text": "审核拒绝",
							"value": 3
						}
					]
				},
				rules: {
					...getValidator(["id", "modified", "title", "total", "day_total", "user_id", "status",
						"rebate_money_rate"
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
			submit() {
				uni.showLoading({
					mask: true
				})
				this.$refs.form.submit().then((res) => {
					res.modified = Date.now();
					res.address = this.address;
					this.submitForm(res)
				}).catch((errors) => {
					uni.hideLoading()
				})
			},

			submitForm(value) {
				// 使用 clientDB 提交数据
				db.action("channel_apply").collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
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
						'id,modified,title,total,day_total,user_id,status,rebate_money_rate').get()
					.then((
						res) => {
						const data = res.result.data[0]
						if (data) {
							this.address = data.address;
							this.formData = data
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
