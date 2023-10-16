<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="component_id" label="组件ID">
				<uni-easyinput placeholder="唯一标识，不可修改，不允许重复" v-model="formData.component_id" />
			</uni-forms-item>
			<uni-forms-item name="title" label="组件名称">
				<uni-easyinput v-model="formData.title" />
			</uni-forms-item>
			<uni-forms-item name="previewfile" label="预览图">
				<uni-file-picker file-mediatype="image" return-type="object" v-model="formData.previewfile" />
			</uni-forms-item>
			<uni-forms-item name="thumb" label="缩略图">
				<cloud-image name="thumb" v-model="formData.thumb" size="400x300"></cloud-image>
			</uni-forms-item>
			<uni-forms-item name="state" label="是否显示">
				<uni-data-checkbox v-model="formData.state" :localdata="formOptions.state_localdata" />
			</uni-forms-item>
			<uni-forms-item name="is_page" label="是否页面">
				<switch @change="binddata('is_page', $event.detail.value)" :checked="formData.is_page" />
			</uni-forms-item>
			<uni-forms-item name="shop_decoration" label="店铺装修">
				<switch @change="binddata('shop_decoration', $event.detail.value)"
					:checked="formData.shop_decoration" />
			</uni-forms-item>
			<uni-forms-item name="posid" label="排序">
				<uni-easyinput type="number" v-model="formData.posid" />
			</uni-forms-item>
			<uni-forms-item name="attributes" label="属性">
				<uni-easyinput type="textarea" v-model="formData.attributes" maxlength="-1" />
			</uni-forms-item>
			<uni-forms-item name="data" label="数据">
				<uni-easyinput type="textarea" v-model="formData.data" maxlength="-1" />
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
	} from '../../js_sdk/validator/tian-page-components.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-page-components';

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
					"component_id": "",
					"title": "",
					previewfile: {},
					"thumb": "",
					"attributes": "",
					"data": "",
					"state": 0,
					"is_page": false,
					"shop_decoration": false,
					"posid": 0
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
					]
				},
				rules: {
					...getValidator(["component_id", "is_page", "shop_decoration", "thumb", "title", "state", "posid"])
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
