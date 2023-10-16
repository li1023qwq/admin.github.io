<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="key" label="关键字">
				<uni-easyinput v-model="formData.key" />
			</uni-forms-item>
			<uni-forms-item name="name" label="名称">
				<uni-easyinput v-model="formData.name" />
			</uni-forms-item>
			<uni-forms-item name="value" label="值">
				<uni-easyinput type="number" v-model="formData.value" />
			</uni-forms-item>
			<uni-forms-item name="data" label="内容">
				<uni-easyinput v-model="formData.data" type="textarea" />
			</uni-forms-item>
			<uni-forms-item name="options" label="选项">
				<uni-easyinput v-model="formData.options" />
			</uni-forms-item>
			<uni-forms-item name="is_key_value" label="键值对">
				<switch @change="binddata('is_key_value', $event.detail.value)" :checked="formData.is_key_value" />
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
	} from '../../js_sdk/validator/tian-identity.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-identity';

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
				formData: {
					"key": "",
					"name": "",
					"value": null,
					"data": "",
					"options": "",
					"is_key_value": null,
					"create_date": null,
					"update_date": null
				},
				formOptions: {},
				rules: {
					...getValidator(["key", "name", "value", "data", "options", "is_key_value", "create_date",
						"update_date"
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
					res.type = "basedata";
					res.update_date = Date.now();
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
					'key,name,value,data,options,is_key_value,create_date,update_date').get().then((res) => {
					const data = res.result.data[0]
					if (data) {
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
