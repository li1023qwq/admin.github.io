<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="parent_id" label="父级ID">
				<view class="padding-bottom-20" v-if="title">
					<text>{{title}}</text>
				</view>
				<uni-easyinput placeholder="父ID，用于多级分类" disabled v-model="formData.parent_id" />
			</uni-forms-item>
			<uni-forms-item name="name" label="类别名称" required>
				<uni-easyinput placeholder="类别名称" v-model="formData.name" trim="both" focus @confirm="submit(2)" />
				<view class="colorGray font-24">
					<text>填写完成，敲击回车自动提交&新增</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="icon" label="图标">
				<cloud-image name="icon" v-model="formData.icon" :value="formData.icon" />
			</uni-forms-item>
			<uni-forms-item name="sort" label="排序">
				<uni-easyinput placeholder="类别排序，越大越靠后" type="number" v-model="formData.sort" />
			</uni-forms-item>
			<uni-forms-item name="description" label="类别描述">
				<uni-easyinput placeholder="类别描述" v-model="formData.description" trim="both" />
			</uni-forms-item>
			<uni-forms-item name="is_hot_show" label="加入热门显示">
				<switch @change="binddata('is_hot_show', $event.detail.value)" :checked="formData.is_hot_show" />
			</uni-forms-item>
			<uni-forms-item name="is_index_show" label="首页显示">
				<switch @change="binddata('is_index_show', $event.detail.value)" :checked="formData.is_index_show" />
			</uni-forms-item>
			<uni-forms-item name="status" label="生效状态">
				<switch @change="binddata('status', $event.detail.value)" :checked="formData.status" />
			</uni-forms-item>

			<uni-forms-item name="ad_banner" label="广告图片">
				<cloud-image name="ad_banner" v-model="formData.ad_banner" size="450x150" />
				<view class="colorGray font-24">
					<text>图片尺寸450x150</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="ad_open_url" label="广告跳转">
				<uni-easyinput placeholder="广告跳转地址" v-model="formData.ad_open_url" trim="both" />
			</uni-forms-item>
			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px;" @click="submit(1)">提交</button>
				<button type="warn" class="uni-button" style="width: 120px;" @click="submit(2)">提交&新增</button>
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
	} from '../../js_sdk/validator/opendb-mall-categories.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-mall-categories';

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
				inc: 1,
				title: "",
				formData: {
					"parent_id": "",
					"name": "",
					"icon": "",
					"sort": null,
					"description": "",
					"is_hot_show": null,
					"is_index_show": null,
					"status": true,
					ad_banner: "",
					ad_open_url: "",
					"create_date": null
				},
				formOptions: {},
				rules: {
					...getValidator(["parent_id", "name", "icon", "sort", "description", "is_hot_show", "is_index_show",
						"status", "create_date"
					])
				}
			}
		},
		onLoad(e) {
			if (e.pid) {
				this.formData.parent_id = e.pid;
			}
			if (e.sort) {
				this.formData.sort = parseInt(e.sort);
			}
			if (e.inc) {
				this.inc = parseInt(e.inc);
			}
			if (e.title) {
				this.title = e.title;
			}
		},
		onReady() {
			this.$refs.form.setRules(this.rules)
		},
		methods: {
			/**
			 * 触发表单提交
			 */
			submit(type) {
				uni.showLoading({
					mask: true
				})
				this.$refs.form.submit().then((res) => {
					this.submitForm(res, type)
				}).catch((errors) => {
					uni.hideLoading()
				})
			},

			submitForm(value, type) {
				// 使用 clientDB 提交数据
				db.collection(dbCollectionName).add(value).then((res) => {
					uni.showToast({
						title: '新增成功'
					})
					this.getOpenerEventChannel().emit('refreshData')
					if (type == 1) {
						setTimeout(() => uni.navigateBack(), 500)
					} else {
						this.formData.name = ""
						this.formData.sort = parseInt(this.formData.sort) + this.inc
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
