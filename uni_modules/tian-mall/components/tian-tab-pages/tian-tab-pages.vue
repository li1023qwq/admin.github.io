<template>
	<view class="container">
		<block v-if="isShowTabbar">
			<view class=" tab-header">
				<scroll-view scroll-x="true">
					<view class="ti-flex">
						<view v-for="(item,index) in dataList" :key="index" class="margin-right-36 tabs"
							@click="change(index)" :class="{current:index==options.current}">
							<text>{{item.title}}</text>
						</view>
					</view>
				</scroll-view>
			</view>
			<view class="tab-header-seize"></view>
		</block>
		<tian-pages v-for="(item,index) in dataList" :key="index" v-if="options.current==index" :configs="item"
			:loadmore="loadmore" :refresh="refresh">
		</tian-pages>
	</view>
</template>
<script>
	const db = uniCloud.database()
	/**
	 * tab性质的页面
	 * @property {Object} configs 组件配置 
	 * @property {Object} styles 组件样式
	 * @property {Number} refresh 刷新值
	 */
	export default {
		data() {
			return {
				startwith: "index", //不允许从根目录检索数据，消耗太大
				dataList: [],
				options: {
					current: 0,
				}
			}
		},
		computed: {
			isShowTabbar() {
				return this.dataList && this.dataList.length > 1;
			}
		},
		props: {
			configs: {
				type: Object,
				default: () => {
					return {
						parent_id: ""
					}
				}
			},
			styles: {
				type: Object,
				default: () => {
					return {}
				}
			},
			refresh: {
				type: Number,
				default: 0
			},
			loadmore: {
				type: Number,
				default: 0
			}
		},
		watch: {
			refresh(newVal) {
				console.log("watch refresh", newVal)
				this.loadData()
			},
		},
		created() {
			this.loadData()
		},
		methods: {
			loadData() {
				db.collection("tian-pages").where("state==1").orderBy("posid asc").get({
					getTree: {
						limitLevel: 10,
						startWith: `parent_id=="${this.configs.parent_id}"`
					}
				}).then(({
					result
				}) => {
					this.dataList = result.data;
					this.change(0);
				})
			},
			change(e) {
				console.log("this.current", e)
				this.options.current = e;
				let pg = this.dataList[e];
				//设置页面标题
				uni.setNavigationBarTitle({
					title: pg && pg.title ? pg.title : ""
				});
			}
		}
	}
</script>
<style lang="scss" scoped>
	.tab-header {
		background: $uni-bg-color;
		padding: $uni-spacing-row-base $uni-spacing-row-base 10rpx;
		position: fixed;
		top: var(--window-top);
		left: 0;
		right: 0;
		z-index: 9;
		height: 64rpx;
		overflow-y: hidden;

		.ti-flex {
			padding-bottom: 30rpx;
		}
	}

	.tab-header-seize {
		height: 44px;
	}

	.tabs {
		padding-bottom: 12rpx;
		font-size: 36rpx;
		position: relative;
		margin-left: 12rpx;
		align-self: baseline;
		overflow: visible;
		white-space: nowrap;
	}

	.current {
		color: $uni-red;
		font-weight: 600;

		&::after {
			content: " ";
			border-bottom: 4rpx solid $uni-red;
			position: absolute;
			left: 4rpx;
			right: 4rpx;
			bottom: 0;
		}
	}
</style>
