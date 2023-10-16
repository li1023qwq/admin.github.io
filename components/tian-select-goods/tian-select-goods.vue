<template>
	<view>
		<view class="ti-flex" v-if="goodsInfo" @click="openGoodsPanel">
			<image :src="goodsInfo.goods_thumb" class="img" mode="aspectFill"></image>
			<view class="content">
				<text class="font-bold">{{goodsInfo.name}}</text>
				<text class="colorGray margin-top-10">{{goodsInfo.goods_summary}}</text>
				<text class="price margin-top-10">{{goodsInfo.price/100}}</text>
				<view class="skus margin-top-10" v-if="goodsInfo.sku_name && goodsInfo.sku_name.length>0 && skuInfo">
					<text>{{skuInfo.sku_name}}</text>
				</view>
			</view>
		</view>
		<view class="ti-flex" v-else @click="openGoodsPanel">
			<uni-icons type="plusempty" size="40"></uni-icons>
			<text>请选择商品</text>
		</view>
		<uni-popup ref="goodsPopup" type="center">
			<view class="goodsPopup">
				<view class="uni-group">
					<input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
					<button class="uni-button" type="primary" size="mini" @click="search">搜索</button>
				</view>
				<view class="uni-container">
					<!-- 分页查询自己店铺的商品 -->
					<unicloud-db ref="udb" collection="opendb-mall-goods"
						field="goods_sn,name,price,market_price,miaosha,keywords,goods_desc,goods_thumb,goods_banner_imgs,remain_count,month_sell_count,total_sell_count,comment_count,is_real,is_on_sale,is_alone_sale,is_best,is_new,is_hot,is_vip,add_date,last_modify_date,sku_name,use_score_rate"
						:where="where" page-data="replace" :orderby="orderby" :getcount="true"
						:page-size="options.pageSize" :page-current="options.pageCurrent"
						v-slot:default="{data,pagination,loading,error,options}" :options="options" manual>
						<uni-table :loading="loading" :emptyText="error.message || '没有更多数据'" border stripe>
							<uni-tr>
								<uni-th align="center">缩略图</uni-th>
								<uni-th align="">名称</uni-th>
								<uni-th align="center">零售价/原价</uni-th>
								<uni-th align="center">月售/总销量/库存</uni-th>
								<uni-th align="center">上下架</uni-th>
								<uni-th align="center">商品状态</uni-th>
								<uni-th width="204" align="center">操作</uni-th>
							</uni-tr>
							<uni-tr v-for="(item,index) in data" :key="index">
								<uni-td align="center">
									<image v-if="item.goods_thumb" :src="item.goods_thumb" mode="aspectFill"
										class="image-width-80 border-radius">
								</uni-td>
								<uni-td align="" width="200">
									<view class="font-28">
										<text class="text-1">{{item.name}} </text>
									</view>
									<view class="font-24">
										<text>{{item.seller_note}} </text>
									</view>
									<view class="font-24">
										<text> {{item.keywords}} </text>
									</view>
									<view class="font-24">
										<text>货号： {{item.goods_sn}} </text>
									</view>
								</uni-td>
								<uni-td align="center">
									<text class="price">{{item.price/100}}</text>
									<block v-if="item.market_price">
										<text>/</text>
										<text class="price">{{item.market_price/100}}</text>
									</block>
								</uni-td>
								<uni-td align="center"> {{item.month_sell_count}} / {{item.total_sell_count}} /
									{{item.remain_count}}
								</uni-td>
								<uni-td align="center">
									<uni-tag text="上架" size="small" type="primary" v-if="item.is_on_sale"></uni-tag>
									<uni-tag text="下架" size="small" type="error" v-else></uni-tag>
								</uni-td>
								<uni-td align="">
									<uni-tag text="秒杀" size="small" type="warning" v-if="item.miaosha"></uni-tag>
									<uni-tag text="新品" size="small" type="primary" v-if="item.is_new"></uni-tag>
									<uni-tag text="热门" size="small" type="success" v-if="item.is_hot"></uni-tag>
									<uni-tag text="会员" size="small" type="error" v-if="item.is_vip"></uni-tag>
								</uni-td>
								<uni-td align="center">
									<view class="uni-group">
										<button v-if="item.sku_name && item.sku_name.length>0"
											@click="selectGoodsSku(item)" class="uni-button" size="mini" type="primary">
											选择规格
										</button>
										<button v-else @click="selectGoods(item)" class="uni-button" size="mini"
											type="primary">
											选择单品
										</button>
									</view>
								</uni-td>
							</uni-tr>
						</uni-table>
						<view class="uni-pagination-box">
							<uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current"
								:total="pagination.count" @change="onPageChanged" />
						</view>
					</unicloud-db>
				</view>
			</view>
		</uni-popup>
		<uni-popup ref="skuPopup" type="center">
			<view class="skuPopup">
				<scroll-view scroll-y style="max-height: 800rpx;">
					<view v-for="(item,index) in skuList" :key="index" class=" ti-flex under-line padding-22">
						<image v-if="item.goods_thumb" :src="item.goods_thumb" mode="aspectFill"
							class="image-width-40 border-radius">
							<text>{{item.sku_name}}</text>
							<text class="price margin-left-18">{{item.price/100}}</text>
							<view class="flex-1">

							</view>
							<button @click="selectGoods(item.goods,item.sku)" class="uni-button" size="mini"
								type="primary">
								选择
							</button>
					</view>
				</scroll-view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	const db = uniCloud.database()
	const goodsCollection = db.collection("opendb-mall-goods")
	const dbSearchFields = ["name"] // 模糊搜索字段，支持模糊搜索的字段列表
	export default {
		name: "tian-select-goods",
		data() {
			return {
				goodsInfo: {
					price: 0
				},
				skuList: [],
				query: "",
				skuInfo: {},
				where: "",
				orderby: "last_modify_date desc",
				options: {
					pageSize: 10,
					pageCurrent: 1,
				}
			};
		},
		props: {
			value: {
				type: Object,
				default: () => {
					return {
						goods: {},
						sku: {},
						price: 0,
						goods_id: "",
						sku_id: undefined
					}
				}
			},
			condition: String
		},
		watch: {
			value(newVal) {
				this.goodsInfo = newVal.goods;
				this.skuInfo = newVal.sku;
				console.log("goods_id", newVal)
				if (newVal.goods_id && !newVal.goods) {
					this.getGoodsInfo(newVal.goods_id)
				}
			}
		},
		created() {
			this.goodsInfo = this.value.goods;
			this.skuInfo = this.value.sku;
			if (this.value.goods_id && !this.value.goods) {
				this.getGoodsInfo(this.value.goods_id)
			}
		},
		methods: {
			selectGoodsSku(item) {
				//打开规格弹窗
				this.$refs.skuPopup.open()
				db.collection("opendb-mall-sku").where({
					goods_id: item._id
				}).get().then(({
					result
				}) => {
					this.skuList = result.data.map(e => {
						e.sku_name = e.sku_name.replace(/&gt;/g, ' ');
						return {
							...e,
							sku: e,
							goods: {
								...item
							},
							goods_id: item._id,
						}
					})
				})
			},
			selectGoods(goods, sku = {}) {
				this.$refs.skuPopup.close()
				this.$refs.goodsPopup.close()
				if (sku && sku._id) {
					goods.price = sku.price;
				}
				// this.goodsInfo = goods;
				// this.skuInfo = sku;
				let info = {
					goods: goods,
					sku: sku,
					price: goods.price,
					goods_id: goods._id,
					sku_id: sku._id
				}
				this.$emit("input", info)
				this.$emit("change", info)
			},
			openGoodsPanel() {
				this.$refs.goodsPopup.open()
				this.$nextTick(() => {
					this.search(true)
				})
			},
			loadData(clear = true) {
				this.$refs.udb.loadData({
					clear
				})
			},
			onPageChanged(e) {
				this.$refs.udb.loadData({
					current: e.current
				})
			},
			getWhere() {
				const query = this.query.trim()
				if (!query) {
					return ''
				}
				const queryRe = new RegExp(query, 'i')
				return dbSearchFields.map(name => queryRe + '.test(' + name + ')').join(' || ')
			},
			search() {
				let newWhere = this.getWhere()
				let condition = [`shop_id=="${this.adminShopId}"`]
				if (newWhere) {
					condition.push(`(${newWhere})`)
				}
				if(this.condition){
					condition.push(this.condition)
				}
				newWhere = condition.join(" && ");
				const isSameWhere = newWhere === this.where
				this.where = newWhere;
				console.log(this.where)
				if (isSameWhere) { // 相同条件时，手动强制刷新
					this.loadData(true)
				}
			},
			getGoodsInfo(id) {
				goodsCollection.doc(id).get({
					getOne: true
				}).then(({
					result
				}) => {
					console.log(result.data)
					this.goodsInfo = result.data;
				})
			}
		}
	}
</script>

<style lang="scss">
	.img {
		width: 200rpx;
		height: 200rpx;
		border-radius: 8rpx;
		border: 2rpx solid #aaa;
	}

	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		margin-left: 16rpx;
	}

	.goodsPopup {
		background: #fff;
		padding: 22rpx;
		border-radius: 12rpx;
	}

	.skuPopup {
		background: #fff;
		border-radius: 12rpx;
		line-height: 2;
		width: 800rpx;
	}
</style>
