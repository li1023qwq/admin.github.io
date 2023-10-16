<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="title" label="标题">
				<uni-easyinput v-model="formData.title"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="blessing" label="祝福语">
				<uni-easyinput v-model="formData.blessing"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="open" label="打开词">
				<uni-easyinput v-model="formData.open"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="type" label="类型">
				<uni-data-checkbox v-model="formData.type" :localdata="formOptions.type_localdata"></uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item name="payment" label="支付方式">
				<uni-data-checkbox v-model="formData.payment" :localdata="formOptions.payment_localdata">
				</uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item name="position" label="展示位置">
				<uni-data-checkbox v-model="formData.position" :localdata="formOptions.position_localdata">
				</uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item name="auto_show" label="自动展示">
				<switch @change="binddata('auto_show', $event.detail.value)" :checked="formData.auto_show"></switch>
			</uni-forms-item>
			<uni-forms-item name="status" label="生效状态">
				<switch @change="binddata('status', $event.detail.value)" :checked="formData.status"></switch>
			</uni-forms-item>
			<uni-forms-item name="background" label="红包背景">
				<uni-file-picker file-mediatype="image" return-type="object" v-model="formData.background">
				</uni-file-picker>
			</uni-forms-item>
			<uni-forms-item name="avatar" label="默认头像">
				<uni-file-picker file-mediatype="image" return-type="object" v-model="formData.avatar">
				</uni-file-picker>
			</uni-forms-item>
			<uni-forms-item name="dcloud_appid" label="应用id">
				<uni-data-checkbox v-model="formData.dcloud_appid" collection="opendb-app-list"
					field="appid as value, name as text"></uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item name="platforms" label="平台">
				<uni-data-checkbox :multiple="true" v-model="formData.platforms" collection="tian-platforms"
					field="text,value,sort" orderby="sort asc" />
			</uni-forms-item>
			<uni-forms-item name="stock" label="限定数量">
				<uni-easyinput type="number" v-model="formData.stock"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="get_limit" label="领取限制">
				<uni-easyinput type="number" v-model="formData.get_limit"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="moneys" label="领取金额">
				<uni-easyinput placeholder="英文逗号隔开" type="textarea" v-model="formData.moneys"></uni-easyinput>
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
	} from '../../js_sdk/validator/tian-redbag.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-redbag';

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
				"title": "送您一个红包",
				"blessing": "恭喜发财",
				"open": "開",
				"type": "newpeople",
				"payment": "balance",
				"position": "leftTop",
				"auto_show": true,
				"status": true,
				"background": null,
				"avatar": null,
				"dcloud_appid": "",
				"stock": 100,
				"get_count": 0,
				"get_limit": 1,
				"moneys": ""
			}
			return {
				formData,
				formOptions: {
					"type_localdata": [{
							"text": "新人注册",
							"value": "newpeople"
						},
						{
							"text": "小区圈发帖",
							"value": "addcircle"
						}
					],
					"payment_localdata": [{
							"text": "余额",
							"value": "balance"
						},
						{
							"text": "微信",
							"value": "wxpay"
						}
					],
					"position_localdata": [{
							"text": "左上",
							"value": "leftTop"
						},
						{
							"text": "左下",
							"value": "leftDown"
						},
						{
							"text": "右上",
							"value": "rightTop"
						},
						{
							"text": "右下",
							"value": "rightDown"
						}, {
							"text": "不显示",
							"value": "none"
						}
					]
				},
				rules: {
					...getValidator(Object.keys(formData))
				}
			}
		},
		onLoad(e) {
			if (e.id) {
				const id = e.id
				this.formDataId = id
				this.getDetail(id)
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
				return db.collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
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
					"title,blessing,open,type,payment,position,auto_show,status,platforms,background,avatar,dcloud_appid,stock,get_count,get_limit,moneys"
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
