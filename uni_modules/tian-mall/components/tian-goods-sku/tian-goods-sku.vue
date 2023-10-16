<template>
	<view class="goods-sku-container">
		<uni-popup ref="skuPopup" :animation="!0" :maskClick="!0" type="bottom" @change="change">
			<view class="panel" :class="{single:single}">
				<view class="goods-info">
					<view class="goods-list" v-if="selectSku._id">
						<image :src="selectSku.goods_thumb" mode="aspectFill" class="image-width-168 goods-image">
						</image>
						<view class="goods-content">
							<tian-goods-price :value="selectSku" :hasCart="false"></tian-goods-price>
							<view class="font-26 colorGray">
								<text>库存{{selectSku.stock}}件</text>
							</view>
							<view class="font-26 ti-flex">
								<text>已选择</text>
								<text class="margin-left-18">{{selectNames}}</text>
							</view>
						</view>
					</view>
					<view class="goods-list" v-else>
						<image :src="item.goods_thumb" mode="aspectFill" class="image-width-168 goods-image"></image>
						<view class="goods-content">
							<tian-goods-price :value="item" :hasCart="false"></tian-goods-price>
							<view class="font-26 colorGray">
								<text>库存{{stock}}件</text>
							</view>
							<view class="font-26 ti-flex" v-if="selectNames">
								<text>已选择</text>
								<text class="margin-left-18">{{selectNames}}</text>
							</view>
							<view class="font-26 ti-flex" v-else>
								<text>请选择</text>
								<view v-if="skuNames.length>1" v-for="(name,index2) in skuNames" :key="index2">
									<text class="margin-left-18">{{name}}</text>
								</view>
							</view>
						</view>
					</view>
					<tian-icons type="guanbi2" @click="close()" size="26"></tian-icons>
				</view>
				<uni-load-more v-if="!loaded" status="loading"></uni-load-more>
				<scroll-view scroll-y="true" class="sku-content" v-if="loaded">
					<view v-for="(item,index) in skuNamesMap" :key="index" class="under-line">
						<view class="title">
							<text>{{index}}</text>
						</view>
						<view class="skus">
							<view v-for="(sku,index2) in item" :key="index2" class="name"
								:class="{disabled:!sku.enable,checked:sku.checked}"
								@click="chooseSku(sku,index,index2)">
								<text>{{sku.name}}</text>
							</view>
						</view>
					</view>
					<view class="amount">
						<text>数量</text>
						<view class="">
							<uni-number-box :min="1" :max="99" :step="1" v-model="amount"></uni-number-box>
						</view>
					</view>
				</scroll-view>
				<view class="margin-top-22">
					<tian-goods-nav v-if="isSubmitSku" :options="[]" :buttonGroup="submitButtonGroup" :fill="true"
						@buttonClick="buttonClick({index:isSubmitSku-1})"></tian-goods-nav>
					<tian-goods-nav v-else :options="[]" :fill="true" @buttonClick="buttonClick"></tian-goods-nav>
				</view>
			</view>
		</uni-popup>
	</view>
</template>
<script>
	const db = uniCloud.database();
	/**
	 * 商品多规格
	 */
	export default {
		data() {
			return {
				item: {},
				stock: 0,
				loaded: false,
				single: false,
				amount: 1,
				where: "",
				options: {},
				divider: "&gt;",
				selectSku: {},
				selectNames: "",
				submitButtonGroup: [{
					text: '确定',
					backgroundColor: '#ff0000',
					color: '#fff'
				}],
				skus: [],
				nameHash: [],
				skuNames: [], //如果没选中，则默认规格名称
				skuMap: {}, //所有键值对
				skuNamesMap: {}
			}
		},
		props: {
			value: {
				type: Object,
				default: () => {
					return {
						price: 0,
						market_price: 0,
						member: {},
					}
				}
			},
			isSubmitSku: {
				type: Number,
				default: 0
			},
			sid: {
				type: String,
				default: ""
			},
			group_buying_id: {
				type: String,
				default: ""
			}
		},
		watch: {
			value(newVal) {
				//console.log("watch value", newVal)
				this.item = newVal;
				this.skuNames = newVal.sku_name ? newVal.sku_name : []
				this.loadData();
			},
			group_buying_id(newVal) {
				console.log("watch group_buying_id", newVal)
			}
		},
		created() {
			this.item = this.value;
			this.skuNames = this.value.sku_name ? this.value.sku_name : []
			this.loadData();
		},
		methods: {
			loadData() {
				if (!this.item || !this.item._id) {
					console.log("sku 没有商品id")
					return;
				}
				this.single = false;
				this.skuNamesMap = {}
				this.loaded = false;
				if (!this.item.sku_name || this.item.sku_name.length == 0) {
					console.log("商品没有规格")
					this.loaded = true;
					this.single = true;
					this.selectSku = {
						price: this.item.price,
						stock: this.item.remain_count,
						market_price: this.item.market_price,
						goods_thumb: this.item.goods_thumb,
					}
					this.stock = this.item.remain_count;
					return;
				}

				this.isSelect = false;
				this.selectSku = {};
				let skuNamesMap = {};
				let nameHash = [];
				this.amount = 1;
				console.log("this.skuNames", this.skuNames)
				this.skuNames.map(name => {
					skuNamesMap[name] = []
				})
				console.log("this.item", this.item)
				db.action("goods_skus").collection("opendb-mall-sku,opendb-mall-goods").where(
					`goods_id._id=="${this.item._id}"`).field(
					"sku_name,price,market_price,shop_id,stock,goods_thumb,goods_id.use_score_rate,goods_id.use_score,goods_id.is_real,goods_id.is_vip,goods_id.name,goods_id.goods_thumb"
				).limit(
					200).get().then(({
					result
				}) => {
					let skuMap = {};
					let defaultSelectName = [];
					this.stock = 0;
					result.data.map(item => {
						//console.log("item",item)
						if (item.goods_thumb == "") {
							delete item.goods_thumb;
						} else if (item.goods_thumb) {
							item.goods_thumb = this.$thumbImg(item.goods_thumb, '168x168')
						}
						let names = item.sku_name.split(this.divider);
						skuMap[item.sku_name] = {
							...this.item,
							...item,
							sku_name: names.join("+")
						};
						this.stock += item.stock;
						names.map((n, index) => {
							//不能重复添加
							if (this.skuNames[index] && skuNamesMap[this.skuNames[index]]) {
								let ind2 = skuNamesMap[this.skuNames[index]].findIndex(e => e
									.name == n);
								if (ind2 == -1) {
									skuNamesMap[this.skuNames[index]].push({
										name: n,
										checked: false,
										enable: true
									})
								}
							}
						});
						//默认选中
						if (this.sid == item._id) {
							this.selectSku = skuMap[item.sku_name];
							defaultSelectName = names;
							this.selectNames = names.join("，");
							this.$emit("change", this.selectSku);
						}
						//存一下所有可能的组合
						for (let i = 0; i < names.length - 1; i++) {
							let arr = [names[i]]
							nameHash.push(names[i])
							for (let j = i + 1; j < names.length; j++) {
								nameHash.push(names[j])
								nameHash.push([names[i], names[j]].sort().join(this.divider))
								arr.push(names[j])
							}
							nameHash.push(arr.sort().join(this.divider))
						}
					})
					let selectNameMap = {}
					//选中规格
					if (defaultSelectName.length > 0) {
						for (let key in skuNamesMap) {
							skuNamesMap[key].forEach(child => {
								child.checked = defaultSelectName.indexOf(child.name) != -1;
								if (child.checked) {
									selectNameMap[key] = child.name;
								}
							})
						}
					}
					this.skuNamesMap = skuNamesMap;
					this.skuMap = skuMap;
					this.nameHash = this.unique(nameHash);
					// console.log("this.skuMap", this.skuMap)
					// console.log("this.skuNamesMap", this.skuNamesMap)
					// console.log("nameHash", this.nameHash)
					if (defaultSelectName.length > 0) {
						setTimeout(() => {
							this.checkSkuEnable(defaultSelectName, selectNameMap);
						}, 100)
					}
					this.loaded = true;
				})
			},
			unique(data) {
				let arr = []; //新建一个临时数组
				for (let i = 0; i < data.length; i++) { //遍历当前数组
					//当前数组的第i个值在新数组中找不到，则添加到新数组中去
					if (arr.indexOf(data[i]) == -1) {
						arr.push(data[i]);
					}
				}
				return arr;
			},
			close() {
				// console.log("close")
				this.$refs.skuPopup.close()
			},
			change({
				show
			}) {
				if (show) {
					uni.hideTabBar();
				} else {
					uni.showTabBar()
				}
			},
			open() {
				// this.loadData();
				this.$refs.skuPopup.open()
			},
			chooseSku(sku, index, index2) {
				// console.log("choose sku", sku, index)
				if (!sku.enable) {
					//不能点的
					return false;
				}
				//点击切换,
				sku.checked = !sku.checked;
				//去掉同一层级的checked
				if (sku.checked) {
					this.skuNamesMap[index].forEach(e => {
						if (e.name != sku.name) {
							e.checked = false;
						}
					})
				}
				let selected = [],
					selectedNames = [],
					selectNameMap = {};
				//获取已选择组合
				for (let skey in this.skuNamesMap) {
					let select = this.skuNamesMap[skey].filter(e => e.checked);
					if (select.length > 0) {
						selected.push(select[0])
						selectedNames.push(select[0].name);
						//一种类型，只有一条
						selectNameMap[skey] = select[0].name;
					}
				}
				this.selectNames = selectedNames.join("，");
				//所有都选择了，可以定位规格
				if (selected.length == this.skuNames.length) {
					let sName = selectedNames.join(this.divider);
					// console.log("sName", sName)
					this.selectSku = this.skuMap[sName];
				} else {
					this.selectSku = {}
				}
				//没有选择的组合，判断是否存在相应的组合，否则设置为disable
				for (let skey in this.skuNamesMap) {
					if (skey != index) {
						this.skuNamesMap[skey].forEach(e => {
							//去除此行选中的元素
							let oName = selectedNames.filter(se => se != selectNameMap[skey]);
							let asName = [...oName, e.name].sort().join(this.divider);
							// console.log("asName", asName)
							e.enable = this.nameHash.indexOf(asName) != -1;
						})
					}
				}
				this.$emit("change", this.selectSku);
				// console.log("this.skuNamesMap", this.skuNamesMap[index][index2])
				// console.log("this.selectSku", this.selectSku)
			},
			checkSkuEnable(selectedNames, selectNameMap) {
				//没有选择的组合，判断是否存在相应的组合，否则设置为disable
				for (let index = 0; index < selectedNames.length; index++) {
					for (let skey in this.skuNamesMap) {
						if (skey != index) {
							this.skuNamesMap[skey].forEach(e => {
								//去除此行选中的元素
								let oName = selectedNames.filter(se => se != selectNameMap[skey]);
								let asName = [...oName, e.name].sort().join(this.divider);
								// console.log("asName", asName)
								e.enable = this.nameHash.indexOf(asName) != -1;
							})
						}
					}
				}
			},
			/**
			 * 加入购物车/购买
			 */
			buttonClick({
				index
			}) {
				console.log("buttonClick", index)
				if (!this.checkBindMobile("必须绑定手机才能下单")) {
					return;
				}
				//判断是否已经登录
				if (!this.$store.getters['user/isTokenValid']) {
					this.navToLoginNotice()
					return;
				}
				//判断规格是否都选择完成
				if (!this.single && !this.selectSku._id) {
					this.$message("请选择规格")
					return;
				}
				if (this.isSubmit) {
					return;
				}
				//检查库存
				if (this.selectSku.stock < this.amount) {
					this.$message("库存不足")
					return;
				}
				if (index == 0) {
					this.isSubmit = true;
					uni.showLoading({
						title: "请等待",
						mask: true
					})
					//加入购物车
					db.action("cart").collection("opendb-mall-cart").where({
						goods_id: this.item._id,
						sku_id: this.selectSku._id,
						user_id: db.env.uid
					}).update({
						goods_id: this.item._id,
						goods_name: this.selectSku.name,
						goods_thumb: this.selectSku.goods_thumb,
						shop_id: this.item.shop_id,
						sku_id: this.selectSku._id,
						sku_name: this.selectSku.sku_name,
						price: this.selectSku.price,
						market_price: this.selectSku.market_price,
						amount: +this.amount,
						user_id: db.env.uid
					}).then(({
						result
					}) => {
						console.log("加入结果", result)
						if (result.updated) {
							//更新本地数量统计
							this.$store.commit('mall/INCREMENT_CART_NUMBER', +this.amount);
							this.$success("加入成功");
						} else {
							this.$message("加入失败");
						}
					}).catch(err => {
						this.$message(err.message || "加入失败");
						console.log("加入失败", err)
					}).finally(() => {
						if (this.isSubmitSku > 0) {}
						this.close();
						//uni.hideLoading();
						setTimeout(() => {
							this.isSubmit = false;
						}, 1000)
					})

				} else {
					//立即购买
					this.close();
					let goods = {
						...this.selectSku,
						goods_id: this.item._id,
						sku_id: this.selectSku._id,
						amount: this.amount,
					}
					//订单类型：0加入购物车，1直接购买，2拼单购买，3虚拟商品购买
					this.navTo("/pages/order/create", {
						type: "single",
						goods: [{
							group_buying: index == 2,
							group_buying_id: this.group_buying_id,
							goods_id: this.item._id,
							sku_id: this.selectSku._id,
							amount: this.amount,
						}],
						goodsList: [goods],
					})
				}
			}
		}
	}
</script>
<style lang="scss">
	.goods-sku-container {
		position: relative;
		z-index: 996;

		.panel {
			background: #FFFFFF;
			height: 900rpx;
			border-radius: $uni-border-radius-lg $uni-border-radius-lg 0 0;
			padding: $uni-spacing-col-base $uni-spacing-row-base;

			&.single {
				height: 700rpx;

				.sku-content {
					height: 300rpx;
				}
			}
		}

		.goods-info {
			display: flex;
			padding: 10rpx 10rpx 10rpx 16rpx;
		}

		.goods-list {
			display: flex;
			flex: 1;
		}

		.goods {
			padding: 20rpx 0 14rpx;
			display: flex;
		}

		.goods-image {
			display: inline-block;
			width: 168rpx;
			height: 168rpx;
			border-radius: 12rpx;
		}

		.goods-content {
			flex: 1;
			margin-left: 24rpx;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
		}

		.sku-content {
			height: 500rpx;

			.title {
				margin-top: 20rpx;
			}

			.skus {
				display: flex;
				flex-wrap: wrap;
				align-items: center;
				padding: 10rpx 0;

				.name {
					font-size: 24rpx;
					margin-right: 24rpx;
					border: 2rpx solid $uni-border-color;
					border-radius: 40rpx;
					padding: 6rpx 30rpx;
					margin-bottom: 10rpx;

					&.disabled {
						background-color: #fbfbfb;
						border-color: #f5f5f5;
						color: #cccccc;
					}

					&.checked {
						background-color: #fff3f5;
						border-color: #ff8a7f;
						color: #ff5747;
					}
				}
			}

			.amount {
				display: flex;
				justify-content: space-between;
				padding: 30rpx 0 30rpx;
			}
		}
	}
</style>
