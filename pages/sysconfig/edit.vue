<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind" style="max-width: 980px;">
			<uni-forms-item name="name" label="名称">
				<uni-easyinput v-model="formData.name" placeholder="例如:app支付" />
			</uni-forms-item>
			<uni-forms-item name="key" label="关键字">
				<uni-easyinput v-model="formData.key" placeholder="例如:a.b.c" />
			</uni-forms-item>
			<uni-forms-item name="dataType" label="数据类型">
				<uni-data-checkbox v-model="formData.dataType" :localdata="formOptions.type_localdata" />
			</uni-forms-item>
			<uni-forms-item name="data" label="内容">
				<vue-json-editor v-if="formData.dataType=='object' || formData.dataType=='array'"
					v-model="formData.dataObject" mode="code" @json-change="onJsonChange">
				</vue-json-editor>
				<uni-easyinput v-else v-model="formData.data" type="textarea" placeholder="例如:{appid:'aaa'}"
					maxlength="-1" :autoHeight="true" />
			</uni-forms-item>
			<uni-forms-item name="dcloud_appid" label="客户端">
				<uni-data-checkbox :multiple="true" v-model="formData.dcloud_appid" collection="opendb-app-list"
					orderby="appid asc" field="appid as value, name as text" />
				<view class="colorGray font-24">
					<text>不选择为所有客户端生效，优先级低于选择了客户端的数据</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="description" label="说明">
				<uni-easyinput v-model="formData.description" type="textarea" placeholder="例如:应用id" :maxlength="-1" />
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
	import vueJsonEditor from 'vue-json-editor'
	export default {
		components: {
			vueJsonEditor
		},
		data() {
			return {
				formData: {
					"key": "",
					"name": "",
					"value": null,
					"dataObject": null,
					"dcloud_appid": [],
					"data": "",
					"options": "",
					"is_key_value": null,
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
						},
						{
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
					...getValidator(["key", "name", "value", "data", "options", "is_key_value", "create_date",
						"update_date", "dcloud_appid"
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
			onJsonChange(e) {
				console.log("onJsonChange", e)
				this.formData.data = JSON.stringify(e)
			},
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
					if (!res.dcloud_appid) {
						res.dcloud_appid = []
					}
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
						'key,name,value,data,options,is_key_value,create_date,update_date,dataType,dcloud_appid,description'
						).get()
					.then((res) => {
						const data = res.result.data[0]
						if (data) {
							if (data.dataType == "object" || data.dataType == "array") {
								data.dataObject = JSON.parse(data.data)
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
<style lang="scss">
	/deep/ .uni-forms-item__content {
		max-width: 680px;
	}
</style>
