<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="id" label="编号">
				<uni-easyinput placeholder="ID，系统自动生成" type="number" disabled v-model="formData.id"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="name" label="店铺名称" required>
				<uni-easyinput placeholder="" v-model="formData.name"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item label="地址">
				<view class="" v-if="formData.address">
					<view class="">
						<text>{{formData.address.name}}</text>
					</view>
					<view class="">
						<text>{{formData.address.address}}</text>
					</view>
				</view>
			</uni-forms-item>
			<uni-forms-item name="phone" label="联系电话" required>
				<uni-easyinput placeholder="" v-model="formData.phone"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="src" label="店铺logo" required>
				<cloud-image name="src" v-model="formData.src" placeholder="" :disabled="isDisable"></cloud-image>
			</uni-forms-item>
			<uni-forms-item name="business_license" label="营业执照" required>
				<cloud-image name="business_license" v-model="formData.business_license" placeholder=""
					:disabled="isDisable" size="706x400"></cloud-image>
			</uni-forms-item>
			<uni-forms-item name="food_license" label="食品经营许可">
				<cloud-image name="food_license" v-model="formData.food_license" placeholder="" :disabled="isDisable"
					size="706x400">
				</cloud-image>
			</uni-forms-item>
			<uni-forms-item name="legal_person_license" label="法人身份证正面" required>
				<cloud-image name="legal_person_license" v-model="formData.legal_person_license" placeholder=""
					:disabled="isDisable" size="706x400">
				</cloud-image>
			</uni-forms-item>
			<uni-forms-item name="legal_person_license_back" label="法人身份证反面" required>
				<cloud-image name="legal_person_license_back" v-model="formData.legal_person_license_back"
					placeholder="" :disabled="isDisable" size="706x400"></cloud-image>
			</uni-forms-item>
			<uni-forms-item name="bank_card" label="收款银行卡" labelPosition="top" labelWidth="200">
				<cloud-image name="bank_card" v-model="formData.bank_card" size="706x400" :disabled="isDisable"
					tips="企业对公账户或者个体户法人银行卡" />
			</uni-forms-item>
			<uni-forms-item name="bank_no" label="收款银行卡号" labelPosition="top" labelWidth="200">
				<uni-easyinput v-model="formData.bank_no" placeholder="请输入收款银行卡号" :disabled="isDisable" />
				<view class="colorGray font-24">
					<text>企业对公账户或者个体户法人银行卡，如已上传收款银行卡，此项不用填写</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="bank_deposit" label="银行卡开户行" labelPosition="top" labelWidth="200">
				<uni-easyinput v-model="formData.bank_deposit" placeholder="请输入开户行,精确到支行" :disabled="isDisable" />
			</uni-forms-item>
			<uni-forms-item name="store_face" label="门店门脸照片" labelPosition="top" labelWidth="200">
				<cloud-image name="store_face" v-model="formData.store_face" :disabled="isDisable" size="706x400" />
			</uni-forms-item>
			<uni-forms-item name="store_imgs" label="门店内部照片" labelPosition="top" labelWidth="200">
				<cloud-image name="store_imgs" v-model="formData.store_imgs" :disabled="isDisable" size="706x400" />
			</uni-forms-item>
			<uni-forms-item name="food_menu" label="菜单/食谱" labelPosition="top" labelWidth="200">
				<cloud-image name="food_menu" v-model="formData.food_menu" :disabled="isDisable" size="706x400"
					tips="餐饮菜单,方便一键开通商品功能" :imageNumber="10" />
			</uni-forms-item>
			<uni-forms-item name="state" label="状态">
				<uni-data-checkbox v-model="formData.state" :localdata="formOptions.state_localdata">
				</uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item name="apply_result" label="审核结果">
				<uni-easyinput placeholder="" v-model="formData.apply_result" type="textarea"></uni-easyinput>
			</uni-forms-item>
			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
				<button type="warn" class="uni-button" style="width: 100px;" @click="setEdit">编辑</button>
				<button type="primary" class="uni-button" style="width: 130px;" @click="setShopManager">升级为店长</button>
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
	} from '../../js_sdk/validator/tian-mall-shop-apply.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-mall-shop-apply';

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
				"id": null,
				"name": "",
				"phone": "",
				"src": "",
				"business_license": "",
				"food_license": "",
				"legal_person_license": "",
				"legal_person_license_back": "",
				"apply_result": "",
				"state": 0,
				"modified": null,
				"address": null,
				"uid": ""
			}
			return {
				isDisable: true,
				originData: {},
				formData,
				formOptions: {
					"state_localdata": [{
							"text": "审核中",
							"value": 0
						},
						{
							"text": "通过",
							"value": 1
						},
						{
							"text": "拒绝",
							"value": 2
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
			setEdit() {
				uni.showToast({
					title: '开启编辑模式'
				})
				this.isDisable = false
			},
			setShopManager() {
				//设置用户为店长，初始密码为手机号
				this.$request("admin/shop/setmanager", {
					id: this.formDataId,
					uid: this.originData.uid
				}, {
					functionName: 'tiantian-mall'
				}).then(res => {
					uni.showToast({
						title: '设置后台登录账户成功'
					})
				})
			},
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
					if (value.state == 1) {
						this.setShopManager()
						value = this.originData;
						delete value._id;
						delete value.apply_result;
						let newVal = Object.assign({}, {
							...value,
							state: true,
							online: true,
							address: {
								...value.address,
								location: new db.Geo.Point(value.address.longitude, value.address.latitude)
							},
							deliveryTypes: ["deliveryHome"],
							apply_id: this.formDataId
						})
						console.log("value", newVal)
						db.action("genId").collection("tian-mall-shops").add(newVal)
					}
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
					"id,name,phone,src,business_license,food_license,legal_person_license,legal_person_license_back,apply_result,state,modified,address,uid,bank_card,bank_no,bank_deposit,food_menu,store_face,store_imgs"
				).get().then((res) => {
					const data = res.result.data[0]
					if (data) {
						this.originData = data;
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
