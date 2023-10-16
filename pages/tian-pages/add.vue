<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="component" label="组件类型">
				<uni-data-checkbox v-model="formData.component" collection="tian-page-components"
					field="posid,title as text, component_id as value" where="state==1 && is_page==true"
					orderby="posid asc" />
			</uni-forms-item>
			<uni-forms-item name="begin_time" label="生效时间">
				<uni-datetime-picker return-type="timestamp" :value="formData.begin_time" />
			</uni-forms-item>
			<uni-forms-item name="begin_hours" label="生效小时">
				<uni-easyinput placeholder="可选择0-23" type="number" v-model="formData.begin_hours" />
			</uni-forms-item>
			<uni-forms-item name="title" label="页面标题" required>
				<uni-easyinput v-model="formData.title" />
			</uni-forms-item>
			<uni-forms-item name="city" label="城市编号">
				<uni-easyinput placeholder="市/区县编号" v-model="formData.city" />
				<view class="colorGray padding-top-12">
					<text>区县必须在城市管理内是推荐，否则前端无法定位到</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="state" label="是否显示">
				<uni-data-checkbox v-model="formData.state" :localdata="formOptions.state_localdata" />
			</uni-forms-item>
			<uni-forms-item name="posid" label="排序">
				<uni-easyinput type="number" v-model="formData.posid" />
			</uni-forms-item>
			<uni-forms-item name="app_id" label="应用">
				<uni-data-checkbox :multiple="true" v-model="formData.app_id" collection="opendb-app-list"
					field="name as text, appid as value" />
				<view class="colorGray padding-top-12">
					<text>不选择则为所有应用都有效</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="platforms" label="平台" required>
				<uni-data-checkbox :multiple="true" v-model="formData.platforms" collection="tian-platforms"
					field="text,value,sort" orderby="sort asc" />
				<view class="colorGray padding-top-12">
					<text>必须选择一个平台</text>
				</view>
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
	} from '../../js_sdk/validator/tian-pages.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-pages';

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
				pid: "",
				formData: {
					"component": "tian-pages",
					"title": "新页面",
					"city": "",
					"items": [],
					"platforms": [],
					"state": 0,
					"posid": 0,
					"begin_hours": 0,
					"begin_time": 0,
					"parent_id": ""
				},
				formOptions: {
					"state_localdata": [{
							"text": "否",
							"value": 0
						},
						{
							"text": "是",
							"value": 1
						}
					],
				},
				rules: {
					...getValidator(["component", "title", "items", "state", "posid", "begin_time", 'begin_hours',
						"parent_id"
					])
				}
			}
		},
		onLoad(e) {
			this.pid = e.id;
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
				this.$refs.form.validate().then((res) => {
					if (this.pid) {
						res.parent_id = this.pid
					} else {
						res.parent_id = ""
					}
					this.submitForm(res)
				}).catch((errors) => {
					uni.hideLoading()
				})
			},

			submitForm(value) {
				// 使用 clientDB 提交数据
				db.collection(dbCollectionName).add(value).then((res) => {
					this.getOpenerEventChannel().emit('refreshData')
					uni.showToast({
						title: '新增成功',
						mask: true
					})
					setTimeout(() => uni.navigateBack(), 2000)
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
