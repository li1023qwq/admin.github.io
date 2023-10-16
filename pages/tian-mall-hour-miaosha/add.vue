<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="name" label="名称">
				<uni-easyinput v-model="formData.name"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="hour" label="小时">
				<uni-easyinput v-model="formData.hour"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="posid" label="排序，正序">
				<uni-easyinput type="number" v-model="formData.posid"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="state" label="状态">
				<uni-data-checkbox v-model="formData.state" :localdata="formOptions.state_localdata">
				</uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item name="begin_time" label="开始时间">
				<uni-datetime-picker return-type="timestamp" v-model="formData.begin_time"></uni-datetime-picker>
			</uni-forms-item>
			<uni-forms-item name="end_time" label="结束时间">
				<uni-datetime-picker return-type="timestamp" v-model="formData.end_time"></uni-datetime-picker>
			</uni-forms-item>
			<uni-forms-item name="description" label="描述">
				<uni-easyinput type="textarea" v-model="formData.description"></uni-easyinput>
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
	} from '../../js_sdk/validator/tian-mall-hour-miaosha.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-mall-hour-miaosha';

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
				"name": "",
				"description": "",
				"hour": "",
				"posid": 0,
				"state": 0,
				"begin_time": null,
				"end_time": null
			}
			return {
				formData,
				formOptions: {
					"state_localdata": [{
							"text": "已停用",
							"value": 0
						},
						{
							"text": "已发布",
							"value": 1
						}
					]
				},
				rules: {
					...getValidator(Object.keys(formData))
				}
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
					res.begin_time = !res.begin_time ? 0 : res.begin_time;
					res.end_time = !res.end_time ? 0 : res.end_time;
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
				return db.collection(dbCollectionName).add(value).then((res) => {
					uni.showToast({
						title: '新增成功'
					})
					this.getOpenerEventChannel().emit('refreshData')
					setTimeout(() => uni.navigateBack(), 500)
				}).catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				})
			}
		}
	}
</script>
