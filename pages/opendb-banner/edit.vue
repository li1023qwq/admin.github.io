<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="bannerfile" label="图片文件" required>
				<uni-file-picker file-mediatype="image" return-type="object" v-model="formData.bannerfile" />
			</uni-forms-item>
			<uni-forms-item name="open_url" label="点击目标地址">
				<uni-easyinput placeholder="点击跳转目标地址。如果是web地址则使用内置web-view打开；如果是本地页面则跳转本地页面；如果是schema地址则打开本地的app"
					v-model="formData.open_url" trim="both" />
			</uni-forms-item>
			<uni-forms-item name="title" label="标题">
				<uni-easyinput placeholder="注意标题文字颜色和背景图靠色导致看不清的问题" v-model="formData.title" trim="both" />
			</uni-forms-item>
			<uni-forms-item name="sort" label="排序">
				<uni-easyinput placeholder="数字越小，排序越前" type="number" v-model="formData.sort" />
			</uni-forms-item>
			<uni-forms-item name="category_id" label="分类id">
				<uni-data-checkbox v-model="formData.category_id" collection="opendb-banner-category"
					field="_id as value, name as text" />
			</uni-forms-item>
			<uni-forms-item name="status" label="生效状态">
				<switch @change="binddata('status', $event.detail.value)" :checked="formData.status" />
			</uni-forms-item>
			<uni-forms-item name="description" label="备注">
				<uni-easyinput placeholder="维护者自用描述" v-model="formData.description" trim="both" />
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
	} from '../../js_sdk/validator/opendb-banner.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'opendb-banner';

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
					"bannerfile": null,
					"open_url": "",
					"title": "",
					"sort": null,
					"category_id": "",
					"status": true,
					"description": ""
				},
				formOptions: {},
				rules: {
					...getValidator(["bannerfile", "open_url", "title", "sort", "category_id", "status", "description"])
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
				db.collection(dbCollectionName).doc(id).get().then((res) => {
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
