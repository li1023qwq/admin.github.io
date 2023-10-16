<template>
	<view class="uni-container" style="display: flex;">
		<view class="">

			<uni-forms ref="form" :value="formData" validateTrigger="bind">
				<view class="font-36 under-line padding-bottom-10 margin-bottom-20">
					<text>基本配置</text>
				</view>
				<uni-forms-item name="payment_types" label="收款方式">
					<uni-data-checkbox :multiple="true" v-model="formData.payment_types" collection="tian-payment-types"
						field="payment_id as value,title as text" orderby="posid asc" where="state==1"
						@change="changePayment" />
				</uni-forms-item>
				<uni-forms-item name="bank_card" label="收款账号">
					<cloud-image v-model="formData.bank_card" size="600x400">
					</cloud-image>
				</uni-forms-item>
				<uni-forms-item name="payments" label="支付配置" v-if="payments && payments.length>0">
					<view class="items" v-for="(pay,index1) in payments" :key="index1" style="width: 320px;">
						<uni-forms :ref="'form'+index1" :value="pay" validateTrigger="bind">
							<view class="padding-bottom-20">
								<text>{{pay.title}}配置</text>
								<text class="colorGray">(不填写将使用默认配置)</text>
							</view>
							<uni-forms-item v-for="(item,index) in pay.attributes" :name="index" :key="index"
								:label="item.title" labelWidth="90">
								<block v-if="item.enum">
									<uni-data-checkbox v-if="item.enum.collection" v-model="item.value"
										:collection="item.enum.collection" :field="item.enum.field" />
									<uni-data-checkbox v-else v-model="item.value" :localdata="item.enum" />
								</block>
								<uni-easyinput v-else-if="item.bsonType=='int'" :placeholder="'请输入'+item.title"
									type="number" v-model="item.value" />
								<uni-easyinput v-else-if="item.bsonType=='string'" :placeholder="'请输入'+item.title"
									:maxlength="-1" v-model="item.value" />
								<switch v-else-if="item.bsonType=='bool'" @change="binddata(index, $event.detail.value)"
									:checked="!!item.value" />
								<view class="margin-top-10" v-if="item.applyButton">
									<button type="primary" size="mini"
										@click="openApply(pay)">{{item.applyButton}}</button>
								</view>
							</uni-forms-item>
						</uni-forms>
					</view>
					<view class="colorGray font-24">
						<text>配置了子商户，将采用分账模式收取佣金，剩余资金自动转到商户对应的银行账户，否则扣除佣金后，商户从余额提现。</text>
					</view>
				</uni-forms-item>
				<uni-forms-item label="申请状态" v-if="shop.business_code">
					<view class="" v-if="applymentInfo.sign_url">
						<image :src="applymentInfo.sign_url" mode="widthFix" style="width: 200px;"></image>
					</view>
					<view class=" colorBlue font-24">
						<text>{{applymentInfo.applyment_state_msg}}</text>
					</view>
				</uni-forms-item>
				<view class="font-36 under-line padding-bottom-10 margin-bottom-20">
					<text>收款码配置</text>
				</view>

			</uni-forms>
			<uni-forms ref="qrCodeForm" :value="qrCodeFormData" validateTrigger="bind">
				<uni-forms-item name="settlement_mode" label="结算模式">
					<uni-data-checkbox v-model="qrCodeFormData.settlement_mode" :localdata="formOptions.modeList" />
				</uni-forms-item>
				<uni-forms-item name="rebate_rate" label="返红包比例">
					<uni-easyinput placeholder="请输入返红包比例,0-100" type="number" v-model="qrCodeFormData.rebate_rate" />
				</uni-forms-item>
				<uni-forms-item name="money_rate" label="佣金比例">
					<uni-easyinput placeholder="请输入佣金比例,0-100" type="number" v-model="qrCodeFormData.money_rate" />
				</uni-forms-item>
				<uni-forms-item name="payment_notice" label="支付公告">
					<uni-easyinput placeholder="请输入收款页面公告" type="textarea" v-model="qrCodeFormData.payment_notice" />
				</uni-forms-item>
				<uni-forms-item name="background" label="收款背景">
					<cloud-image name="background" v-model="qrCodeFormData.background" size="600x400" />
				</uni-forms-item>
			</uni-forms>


			<view class="font-36 under-line padding-bottom-10 margin-bottom-20">
				<text>商城配置</text>
			</view>
			<uni-forms ref="mallForm" :value="mallFormData" validateTrigger="bind">
				<uni-forms-item name="settlement_mode" label="结算模式">
					<uni-data-checkbox v-model="mallFormData.settlement_mode" :localdata="formOptions.modeList" />
				</uni-forms-item>
				<uni-forms-item name="money_rate" label="佣金比例">
					<uni-easyinput placeholder="请输入佣金比例,0-100" type="number" v-model="mallFormData.money_rate" />
				</uni-forms-item>
			</uni-forms>
			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
				<navigator open-type="navigateBack" style="margin-left: 15px;">
					<button class="uni-button" style="width: 100px;">返回</button>
				</navigator>
			</view>
		</view>
		<view class="payment-popup bg-white padding-22 flex-1" v-if="applyPayment">
			<view class="header">
				<text>申请子商户</text>
				<text class="colorGray font-24 margin-left-20">{{result}}</text>
			</view>
			<uni-forms ref="paymentForm" :value="paymentFormData" validateTrigger="bind">
				<uni-forms-item v-for="(item,index) in payment.applyment" :name="index" :key="index" :label="item.title"
					labelWidth="110" v-if="itemDisplayCondition(item)">
					<block v-if="item.enum">
						<uni-data-checkbox v-if="item.enum.collection" :multiple="item.bsonType!='string'"
							v-model="item.value" :collection="item.enum.collection" :field="item.enum.field"
							@change="changePaymentItem" />
						<uni-data-checkbox v-else v-model="item.value" :multiple="item.bsonType!='string'"
							:localdata="item.enum" @change="changePaymentItem" />
					</block>
					<view class="" v-else-if="item.component && item.component.name=='cloud-image'">
						<cloud-image v-model="item.value" v-bind="item.component.props">
						</cloud-image>
						<button type="primary" size="mini" class="uni-button" style="width: 100px;"
							@click="ocrImage(item)">识别</button>
					</view>
					<uni-easyinput v-else-if="item.bsonType=='int'" type="number" :placeholder="'请输入'+item.title"
						v-model="item.value" @input="changePaymentItem" />
					<uni-easyinput v-else-if="item.bsonType=='string'" :placeholder="'请输入'+item.title" :maxlength="-1"
						v-model="item.value" @input="changePaymentItem" />
					<switch v-else-if="item.bsonType=='bool'"
						@change="binddata('state', $event.detail.value);changePaymentItem" :checked="!!item.value" />
					<view class="margin-top-10 font-24 colorGray" v-if="item.description">
						<text>{{item.description}}</text>
					</view>
				</uni-forms-item>

				<view class="uni-button-group">
					<button type="primary" class="uni-button" style="width: 100px;" @click="paymentSubmit">提交申请</button>
					<button type="warn" class="uni-button" style="width: 100px;" @click="printApplyment">打印</button>
				</view>
			</uni-forms>
		</view>
	</view>
</template>

<script>
	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-mall-shops';

	export default {
		data() {
			return {
				applyPayment: false,
				result: "",
				mallFormData: {
					settlement_mode: "balance"
				},
				qrCodeFormData: {
					settlement_mode: "balance"
				},
				formData: {
					"bank_card": "",
					"payment_types": [],
					"payments": []
				},
				paymentFormData: {},
				payment: {
					applyment: {}
				},
				payments: [],
				applymentInfo: {},
				shop: {},
				shopFiles: [],
				formOptions: {
					paymentTypes: {},
					modeList: [{
						text: "自动分账",
						value: "profit_sharing"
					}, {
						text: "余额提现",
						value: "balance"
					}]
				},
				rules: {
					"types": {
						"rules": [{
							"format": "array"
						}]
					},
				}
			}
		},
		onLoad(e) {
			const id = e.id
			this.formDataId = id
			this.getDetail(id)
		},
		onReady() {
			// this.$refs.form.setRules(this.rules)
			// this.$refs.qrCodeForm.setRules(this.rules)
		},
		methods: {
			changePaymentItem(e) {
				if (e.detail) {
					this.result = e.detail.value;
				}
			},
			itemDisplayCondition(item) {
				if (item.displayCondition) {
					let obj = this.payment.applyment;
					//分拆或者条件
					let hasOr = item.displayCondition.match(/(\|\|)/g);
					if (hasOr && hasOr.length > 0) {
						//只要满足一个条件即可
					} else {
						let conditions = item.displayCondition.match(/([\w'"\-.$]+)\s?==\s?([\w\u4e00-\u9fa5'"\-.$]+)/g);
						if (conditions) {
							for (let b = 0; b < conditions.length; b++) {
								let res = this.checkEqualCondition(conditions[b], obj)
								if (!res) {
									return false;
								}
							}
							return true;
						}
						//判断数组
						conditions = item.displayCondition.match(/([\w'"\-.$]+)\s?in\s?([\[\]\w\u4e00-\u9fa5'"\-.$]+)/g);
						if (conditions) {
							for (let b = 0; b < conditions.length; b++) {
								let res = this.checkInCondition(conditions[b], obj)
								if (!res) {
									return false;
								}
							}
							return true;
						}
						return true;
					}
				}
				return true;
			},
			checkInCondition(str, obj) {
				let conditions = str.match(/([\w'"\-.$]+)\s?in\s?([\[\]\w\u4e00-\u9fa5'"\-.$]+)/);
				if (conditions && conditions.length > 0) {
					// console.log("in conditions", conditions)
					//"'SALES_SCENES_MINI_PROGRAM' in sales_scenes_type"
					//判断左侧的变量是否存在于右侧的固定数组中
					if (conditions[2].match(/['"]/)) {
						//右侧数组转换
						let arr = JSON.parse(conditions[2].replace(/'/g, "\""));
						return arr.indexOf(obj[conditions[1]].value) != -1;
					}
					//左侧的字符串是否存在于右侧的变量中
					if (conditions[1].match(/['"]/)) {
						let value = conditions[1].replace(/['"]/g, "")
						// console.log("in value", value, obj[conditions[2]].value)
						return obj[conditions[2]] && obj[conditions[2]].value
							.indexOf(value) != -1;
					}
				}
				return true;
			},
			checkEqualCondition(str, obj) {
				let conditions = str.match(/([\w'"\-.$]+)\s?==\s?([\w\u4e00-\u9fa5'"\-.$]+)/);
				if (conditions && conditions.length > 0) {
					//判断是否直接等于一个固定值
					if (conditions[2].match(/['"]/)) {
						let value = conditions[2].replace(/['"]/g, "")
						return obj[conditions[1]].value == value;
					}
					//左右是变量
					return obj[conditions[1]].value == obj[conditions[2]].value;
				}
				return true;
			},
			ocrImage(data) {
				console.log("data", data)
				this.$request("admin/wxpay/ocr", {
					type: data.type,
					img_url: encodeURIComponent(data.value)
				}, {
					functionName: "tiantian-wxpay-v3",
					loading: true
				}).then(res => {
					console.log("res", res)
					for (let key in res) {
						if (this.payment.applyment[key]) {
							this.payment.applyment[key].value = res[key]
						}
					}
					this.result = "识别" + data.title + "完成"
					// console.log("this.payment", this.payment)
				})
			},
			paymentSubmit() {
				/* this.$refs.paymentForm.submit().then(res => {
					console.log("paymentForm", res)
				}) */
				this.$request("admin/wxpay/applyment", {
					id: this.formDataId,
					data: this.payment.applyment
				}, {
					functionName: "tiantian-wxpay-v3",
					loading: true
				}).then(res => {
					uni.showToast({
						title: "申请成功"
					})
					this.getOpenerEventChannel().emit('refreshData')
					setTimeout(() => uni.navigateBack(), 500)
					console.log("paymentSubmit", res)
				})
				console.log("this.payment", this.payment)
			},
			getApplymentInfo() {
				if (!this.shop.business_code) {
					return;
				}
				/* this.$refs.paymentForm.submit().then(res => {
					console.log("paymentForm", res)
				}) */
				this.$request("admin/wxpay/applymentinfo", {
					id: this.shop.business_code,
				}, {
					functionName: "tiantian-wxpay-v3",
					loading: true
				}).then(res => {
					console.log("paymentSubmit", res)
					this.applymentInfo = res;
				})
				console.log("this.payment", this.payment)
			},
			printApplyment() {
				console.log("this.payment", this.payment.applyment)
				let data = ["<table class='table'>", "<tr><th>标题</th><th>值</th><th>说明</th></tr>"]
				for (let key in this.payment.applyment) {
					let item = this.payment.applyment[key]
					let info = `<tr>`;
					info += `<td style="width:200px">${item.title}</td>`

					if (item.value && item.value.indexOf("http") != -1) {
						info += `<td><img src="${item.value}" style="width:200px;"/></td>`
					} else {
						info += `<td>${item.value}</td>`
					}
					info +=
						`<td style="font-size:12px;color: #007bff;width: 200px; text-align: left;">${item.description?item.description:''}</td>`
					info += '</tr>'
					data.push(info)
				}
				data.push("</table>")
				//打印申请表
				this.$printContents(data.join(""), "申请表")

			},
			openApply(pay) {
				//按分组字段排序
				/* let applyment = {};
				Object.keys(pay.applyment).sort(function(a,b){
					return pay.applyment[a].group
				}) */
				let imgs = []
				//处理applyment默认值
				Object.keys(pay.applyment).map(key => {
					pay.applyment[key].value = ""
					if (pay.applyment[key].defaultValue) {
						if (typeof(pay.applyment[key].defaultValue) == "string") {
							pay.applyment[key].value = this.$stringFormat(pay.applyment[key].defaultValue, {
								shop: this.shop
							}, true);
						} else {
							pay.applyment[key].value = pay.applyment[key].defaultValue;
						}
					}
					if (pay.applyment[key].value && pay.applyment[key].component && pay.applyment[key].component
						.name == 'cloud-image') {
						imgs.push(key)
					}

				})
				this.payment = pay;
				console.log("this.payment", this.payment)
				this.applyPayment = true;
				setTimeout(() => {
					//自动识别证件
					imgs.map(key => {
						this.ocrImage(this.payment.applyment[key])
					})

				}, 500)
			},
			/**
			 * 触发表单提交
			 */
			async submit() {
				let qrCode = await this.$refs.qrCodeForm.validate();
				let mall = await this.$refs.mallForm.validate()
				uni.showLoading({
					mask: true
				})
				//统计payment值
				let payments = {}
				this.payments.map(pay => {
					let data = {};
					for (let key in pay.attributes) {
						if (pay.attributes[key].value) {
							data[key] = pay.attributes[key].value;
						}
					}
					payments[pay.payment_id] = data
				});
				this.$refs.form.validate().then((res) => {
					// console.log("res", res)
					delete res.payments;
					console.log("res", res)
					console.log("qrCode", JSON.stringify(qrCode))
					console.log("mall", JSON.stringify(mall))
					this.submitForm({
						...res,
						payments: JSON.stringify(payments),
						qr_code_payment: JSON.stringify(qrCode),
						mall_payment: JSON.stringify(mall)
					})
					//自动绑定分账方
					this.$request('admin/shop/profitsharingaddreceiver', {
						payments: payments
					}, {
						functionName: 'tiantian-mall'
					})
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
					const data = res.result.data[0];
					console.log("detail", data)
					this.shop = data;
					let payments = {};
					let formData = data
					if (data && data.qr_code_payment) {
						if (typeof(data.qr_code_payment) == "string") {
							data.qr_code_payment = JSON.parse(data.qr_code_payment);
						}
						this.qrCodeFormData = data.qr_code_payment;
						payments = []
					}
					if (data && data.payments) {
						payments = JSON.parse(data.payments);
					}
					//银行卡照片
					// formData.bank_card = data.bank_card;
					// formData.types = data.payment_types;

					if (data.mall_payment) {
						this.mallFormData = JSON.parse(data.mall_payment)
					}
					this.formData = formData;
					console.log("this.formData", this.formData)
					this.getApplymentInfo();

					this.getPaymentTypes((extIds) => {
						this.changePayment({
							detail: {
								value: this.formData.payment_types
							}
						})
					}, payments);
				}).catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
				})
			},
			getPaymentTypes(callback, payments) {
				db.collection("tian-payment-types").where("state==1").orderBy("posid asc").get().then(({
					result
				}) => {
					console.log("getPaymentTypes result", result, payments)
					let extIds = []
					result.data.forEach(item => {
						if (typeof(item.attributes) == "string") {
							item.attributes = JSON.parse(item.attributes);
						}
						if (typeof(item.applyment) == "string") {
							item.applyment = JSON.parse(item.applyment);
						}
						if (payments[item.payment_id]) {
							let val = payments[item.payment_id];
							for (let key in item.attributes) {
								item.attributes[key].value = val[key] ? val[key] : "";
							}
							extIds.push(item.payment_id);
						} else {
							for (let key in item.attributes) {
								item.attributes[key].value = "";
							}
						}
					})
					this.formOptions.paymentTypes = result.data;
					if (callback) {
						callback(extIds)
					}
				})
			},
			changePayment(e) {
				console.log("changePayment", e)
				if (!e.detail.value || e.detail.value.length == 0) {
					this.payments = []
					return;
				}
				this.payments = this.formOptions.paymentTypes.filter(item => e.detail.value.indexOf(item
						.payment_id) !=
					-1)

				console.log("this.payments", this.payments)
			}
		}
	}
</script>

<style lang="scss">
	.items {
		padding: 20rpx;
		border-radius: 20rpx;
	}
</style>
