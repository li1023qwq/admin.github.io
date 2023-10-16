<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="name" label="任务名称" required>
				<uni-easyinput placeholder="任务名称" v-model="formData.name" trim="both" />
			</uni-forms-item>
			<uni-forms-item name="comment" label="任务描述">
				<uni-easyinput placeholder="任务描述" v-model="formData.comment" trim="both" />
			</uni-forms-item>
			<uni-forms-item name="bounty" label="奖励积分">
				<uni-easyinput placeholder="任务完成后的奖励积分" type="number" v-model="formData.bounty" />
			</uni-forms-item>
			<uni-forms-item name="per_amount" label="操作次数">
				<uni-easyinput placeholder="操作多少次算完成任务" type="number" v-model="formData.per_amount" />
			</uni-forms-item>
			<uni-forms-item name="multiple" label="加倍倍数">
				<uni-easyinput placeholder="加倍倍数,0不能加倍，3获得3倍bounty" type="number" v-model="formData.multiple" />
			</uni-forms-item>
			<uni-forms-item name="icon" label="图标">
				<uni-easyinput placeholder="图标" v-model="formData.icon" trim="both" />
			</uni-forms-item>
			<uni-forms-item name="open_url" label="点击目标地址">
				<uni-easyinput placeholder="点击跳转目标地址。" v-model="formData.open_url" trim="both" />
				<view class="colorGray margin-top-20 font-24">
					<text>如果是web地址则使用内置web-view打开；如果是本地页面则跳转本地页面；如果是schema地址则打开本地的app,；::本地方法</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="sort" label="序号">
				<uni-easyinput placeholder="菜单序号（越大越靠后）" type="number" v-model="formData.sort" />
			</uni-forms-item>
			<uni-forms-item name="middle_getout" label="中途退出奖励">
				<switch @change="binddata('middle_getout', $event.detail.value)" :checked="formData.middle_getout" />
			</uni-forms-item>
			<uni-forms-item name="enable" label="是否启用">
				<switch @change="binddata('enable', $event.detail.value)" :checked="formData.enable" />
			</uni-forms-item>
			<uni-forms-item name="max_per_hour" label="每小时限制">
				<uni-easyinput placeholder="每小时允许执行的最大次数" type="number" v-model="formData.max_per_hour" />
			</uni-forms-item>
			<uni-forms-item name="max_per_day" label="每天限制">
				<uni-easyinput placeholder="每天允许执行的最大次数" type="number" v-model="formData.max_per_day" />
			</uni-forms-item>
			<uni-forms-item name="max_per_week" label="每周限制">
				<uni-easyinput placeholder="每周允许执行的最大次数" type="number" v-model="formData.max_per_week" />
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
	} from '../../js_sdk/validator/uni-id-task.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'uni-id-task';

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
					"name": "",
					"comment": "",
					"bounty": null,
					"per_amount": 1,
					"multiple": 0,
					"icon": "",
					"open_url": "",
					"sort": null,
					"enable": null,
					middle_getout: false,
					"max_per_hour": null,
					"max_per_day": null,
					"max_per_week": null,
					"create_date": null
				},
				formOptions: {},
				rules: {
					...getValidator(["name", "comment", "bounty", "per_amount", "middle_getout", "multiple", "icon",
						"open_url", "sort",
						"enable", "max_per_hour", "max_per_day", "max_per_week", "create_date"
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
					'name,comment,bounty,per_amount,multiple,icon,open_url,sort,enable,middle_getout,max_per_hour,max_per_day,max_per_week,create_date'
				).get().then((res) => {
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
