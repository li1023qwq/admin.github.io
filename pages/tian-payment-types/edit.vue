<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="payment_id" label="支付ID">
				<uni-easyinput placeholder="唯一标识，不可修改，不允许重复,例如：wxpay/alipay" v-model="formData.payment_id">
				</uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="title" label="组件名称">
				<uni-easyinput v-model="formData.title"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="thumb" label="缩略图地址">
				<uni-easyinput placeholder="缩略图，用于在列表或搜索结果中预览显示" v-model="formData.thumb" trim="both"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="thumb_size" label="缩略图尺寸">
				<uni-easyinput v-model="formData.thumb_size" trim="both"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="state" label="是否显示">
				<uni-data-checkbox v-model="formData.state" :localdata="formOptions.state_localdata">
				</uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item name="posid" label="排序，正序">
				<uni-easyinput type="number" v-model="formData.posid"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="attributes" label="属性配置">
				<uni-easyinput v-model="formData.attributes" type="textarea" :maxlength="-1" autoHeight></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="applyment" label="申请商户配置">
				<uni-easyinput v-model="formData.applyment" type="textarea" :maxlength="-1"></uni-easyinput>
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
	} from '../../js_sdk/validator/tian-payment-types.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-payment-types';

	function getValidator(fields) {
		let result = {}
		for (let key in validator) {
			if (fields.includes(key)) {
				result[key] = validator[key]
			}
		}
		return result
	}

	export default {
		data() {
			let formData = {
				"payment_id": "",
				"title": "",
				"thumb": "",
				"thumb_size": "",
				"state": 0,
				"posid": 0,
				"attributes": null,
				"applyment": null,
			}
			return {
				formData,
				formOptions: {
					"state_localdata": [{
							"text": "否",
							"value": 0
						},
						{
							"text": "是",
							"value": 1
						}
					]
				},
				rules: {
					...getValidator(Object.keys(formData))
				}
			}
		},
		onLoad(e) {
			if (e.id) {
				const id = e.id
				this.formDataId = id
				this.getDetail(id)
			}
		},
		onReady() {
			this.$refs.form.setRules(this.rules)
		},
		methods: {
			/**
			 * 验证表单并提交
			 */
			submit() {
				uni.showLoading({
					mask: true
				})
				this.$refs.form.validate().then((res) => {
					res.attributes = JSON.stringify(JSON.parse(res.attributes));
					if (res.applyment) {
						res.applyment = JSON.stringify(JSON.parse(res.applyment));
					} else {
						res.applyment = ""
					}
					return this.submitForm(res)
				}).catch(() => {}).finally(() => {
					uni.hideLoading()
				})
			},

			/**
			 * 提交表单
			 */
			submitForm(value) {
				// 使用 clientDB 提交数据
				return db.collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
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
						"payment_id,title,thumb,thumb_size,state,posid,attributes,applyment")
					.get().then((res) => {
						const data = res.result.data[0]
						if (data) {
							if (typeof(data.attributes) == "object") {
								data.attributes = JSON.stringify(data.attributes);
							}
							if (typeof(data.applyment) == "object") {
								data.applyment = JSON.stringify(data.applyment);
							}
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
