<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="miaosha_id" label="秒杀场次">
				<uni-data-checkbox v-model="formData.miaosha_id" collection="tian-mall-hour-miaosha"
					field="_id as value,name as text" order="hour asc"></uni-data-checkbox>
			</uni-forms-item>
			<uni-forms-item label="秒杀商品">
				<tian-select-goods v-model="goodsInfo" @change="changeGoods" condition="miaosha==null">
				</tian-select-goods>
			</uni-forms-item>
			<uni-forms-item name="discount" label="折扣比例">
				<view class="ti-flex">
					<view class="flex-1">
						<slider min="1" max="99" show-value :value="formData.discount" @change="changeDiscount"
							style="margin-right: 0;"></slider>
					</view>
					<text>%</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="price" label="秒杀价">
				<uni-easyinput v-model="formData.price" @blur="changePrice"></uni-easyinput>
			</uni-forms-item>
			<uni-forms-item label="是否限购">
				<switch @change="changeLimit" :checked="formData.is_limit"></switch>
			</uni-forms-item>
			<block v-if="formData.is_limit">
				<uni-forms-item name="limit_stock" label="总库存">
					<uni-easyinput placeholder="0不限制" type="number" v-model="formData.limit_stock"></uni-easyinput>
				</uni-forms-item>
				<uni-forms-item name="limit_order_count" label="订单限购">
					<uni-easyinput type="number" v-model="formData.limit_order_count"></uni-easyinput>
				</uni-forms-item>
				<uni-forms-item name="limit_user_count" label="用户限购">
					<uni-easyinput type="number" v-model="formData.limit_user_count"></uni-easyinput>
				</uni-forms-item>
			</block>

			<uni-forms-item label="有效时间">
				<uni-datetime-picker :start="startDate" type="daterange" :value="dates" @change="changeDate">
				</uni-datetime-picker>
			</uni-forms-item>
			<uni-forms-item name="state" label="状态">
				<uni-data-checkbox v-model="formData.state" :localdata="formOptions.state_localdata">
				</uni-data-checkbox>
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
	} from '../../js_sdk/validator/tian-mall-hour-miaosha-goods.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-mall-hour-miaosha-goods';

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
				"miaosha_id": "",
				"goods_id": "",
				"sku_id": "",
				"posid": 0,
				"price": 0,
				"discount": 80,
				"is_limit": false,
				"limit_stock": 0,
				"limit_order_count": 0,
				"limit_user_count": 0,
				"state": 0,
				"miaosha": null,
				"sku": null,
				begin_time: 0,
				end_time: 0,
				"goods": null
			}
			return {
				formData,
				oldGid: "",
				goodsInfo: {

				},
				dates: [],
				formOptions: {
					"state_localdata": [{
							"text": "审核中",
							"value": 0
						},
						{
							"text": "已发布",
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
		computed: {
			startDate() {
				return this.$dateFormat("Y-m-d")
			},
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
			changePrice(e) {
				console.log(e)
				//计算折扣
				this.formData.discount = parseInt(e.detail.value * 100 / this.goodsInfo.price * 100)
				console.log("this.formData.discount", this.formData.discount)
			},
			changeGoods(e) {
				//根据折扣比例重新计算秒杀价
				this.formData.price = parseInt(e.price * this.formData.discount / 100) / 100
			},
			changeDate(e) {
				console.log(e)
				this.formData.begin_time = (new Date(e[0])).getTime()
				this.formData.end_time = (new Date(e[1] + " 23:59:59")).getTime()
			},
			changeLimit(e) {
				console.log(e)
				this.formData.is_limit = e.detail.value;
			},
			changeDiscount(e) {
				this.formData.discount = parseInt(e.detail.value);
				//计算价格
				this.formData.price = parseInt(this.goodsInfo.price * this.formData.discount / 100) / 100
			},
			/**
			 * 验证表单并提交
			 */
			submit() {
				uni.showLoading({
					mask: true
				})
				this.$refs.form.validate().then((res) => {
					res.begin_time = this.formData.begin_time;
					res.end_time = this.formData.end_time;
					res.is_limit = this.formData.is_limit;
					res.modified = Date.now()
					return this.submitForm({
						...res,
						...this.goodsInfo,
						market_price: this.goodsInfo.price,
						price: parseInt(res.price * 100),
					})
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
					if (this.oldGid && this.oldGid != value.goods_id) {
						//删除商品的秒杀信息
						db.collection("opendb-mall-goods").doc(this.oldGid).update({
							miaosha: {
								enable: false
							}
						})
					}
					//更新此商品的秒杀信息
					uniCloud.callFunction({
						name: "tiantian-mall-miaosha",
						data: {
							miaosha_id: value.miaosha_id,
							miaosha_goods_id: this.formDataId
						}
					}).then(() => {})
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
					"miaosha_id,goods_id,sku_id,posid,discount,is_limit,begin_time,end_time,price,limit_stock,limit_order_count,limit_user_count,state,sku,goods"
				).get().then((res) => {
					const data = res.result.data[0]
					if (data) {
						// data.price = data.price / 100;
						this.dates = [this.$dateFormat("Y-m-d", data.begin_time), this.$dateFormat("Y-m-d", data
							.end_time)]
						this.formData = data
						this.formData.price = data.price / 100;
						this.oldGid = data.goods_id;
						this.goodsInfo = {
							goods_id: data.goods_id,
							goods: data.goods,
							price: data.sku ? data.sku.price : data.goods.price,
							sku_id: data.sku_id,
							sku: data.sku,
						}
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
