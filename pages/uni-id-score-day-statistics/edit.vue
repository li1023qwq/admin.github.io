<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="day" label="日期时间">
				<uni-datetime-picker return-type="timestamp" :disabled="true" :value="formData.day" />
			</uni-forms-item>
			<uni-forms-item name="value" label="积分总计">
				<uni-easyinput type="number" :disabled="true" v-model="formData.value" />
			</uni-forms-item>
			<uni-forms-item name="money" label="分红金额">
				<uni-easyinput placeholder="录入启用后，不允许修改" type="number" v-model="formData.money" />
			</uni-forms-item>
			<uni-forms-item name="status" label="开放状态">
				<uni-data-checkbox v-model="formData.status" :localdata="formOptions.status_localdata" />
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
	} from '../../js_sdk/validator/uni-id-score-day-statistics.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'uni-id-score-day-statistics';

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
					"day": null,
					"money": null,
					"value": null,
					"status": 0
				},
				formOptions: {
					"status_localdata": [{
							"text": "禁用",
							"value": 0
						},
						{
							"text": "启用",
							"value": 1
						}
					]
				},
				rules: {
					...getValidator(["day", "money", "value", "status"])
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
					res.money = parseInt(res.money * 100);
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
				db.collection(dbCollectionName).doc(id).field('day,money,value,status').get().then((res) => {
					const data = res.result.data[0]
					if (data) {
						this.formData = data;
						if (!this.formData.status) {
							this.formData.status = 0;
						}
						if (this.formData.money) {
							this.formData.money = this.formData.money / 100;
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
