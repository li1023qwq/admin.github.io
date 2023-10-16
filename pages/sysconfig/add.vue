<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="name" label="名称">
				<uni-easyinput v-model="formData.name" placeholder="例如:app支付" />
			</uni-forms-item>
			<uni-forms-item name="key" label="关键字">
				<uni-easyinput v-model="formData.key" placeholder="例如:a.b.c" />
			</uni-forms-item>
			<uni-forms-item name="data" label="内容">
				<uni-easyinput v-model="formData.data" type="textarea" placeholder="例如:{appid:'aaa'}" maxlength="-1" />
			</uni-forms-item>
			<uni-forms-item name="dataType" label="数据类型">
				<uni-data-checkbox v-model="formData.dataType" :localdata="formOptions.type_localdata" />
			</uni-forms-item>
			<uni-forms-item name="dcloud_appid" label="客户端">
				<uni-data-checkbox :multiple="true" v-model="formData.dcloud_appid" collection="opendb-app-list"
					orderby="appid asc" field="appid as value, name as text" />
				<view class="colorGray font-24">
					<text>不选择为所有客户端生效，优先级低于选择了客户端的数据</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="description" label="说明">
				<uni-easyinput v-model="formData.description" type="textarea" placeholder="例如:应用id" />
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
					"dcloud_appid": [],
					"data": "",
					"options": "",
					"dataType": "string",
					"create_date": null,
					"update_date": null
				},
				formOptions: {
					"type_localdata": [{
							"text": "字符串",
							"value": "string"
						},
						{
							"text": "整型",
							"value": "int"
						}, {
							"text": "浮点",
							"value": "double"
						},
						{
							"text": "布尔",
							"value": "bool"
						},
						{
							"text": "对象",
							"value": "object"
						},
						{
							"text": "数组",
							"value": "array"
						}
					]
				},
				rules: {
					...getValidator(["key", "name", "value", "data", "options", "create_date",
						"update_date"
					])
				}
			}
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
					res.type = "sysconfig";
					if (res.dataType == "object" || res.dataType == "array") {
						res.data = JSON.stringify(JSON.parse(res.data))
					}
					this.submitForm(res)
				}).catch((errors) => {
					uni.hideLoading()
				})
			},

			submitForm(value) {
				// 使用 clientDB 提交数据
				db.collection(dbCollectionName).add(value).then((res) => {
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
				}).finally(() => {
					uni.hideLoading()
				})
			}
		}
	}
</script>
