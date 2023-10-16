<template>
	<view class="article-container" :style="bgStyle" :class="[options.bgClassName]" @click="bgClick">
		<view v-for="(item, index) in dataList" :key="index">
			<view class="item" :class="item.className" :style="item.style" @click.stop="navToDetail(item)">
				<view class="content">
					<view class="title">
						<text>{{ item.title }}</text>
					</view>
					<view class="more">
						<view class="time" v-if="item.excerpt">
							<text>{{ item.excerpt }}</text>
						</view>
						<view class="time">
							<text>更新时间：{{ item.publish_date }}</text>
						</view>
						<view class="time" v-if="item.source_from">
							<text>{{ item.source_from }}</text>
						</view>
					</view>
				</view>
				<image :src="item.avatar" mode="aspectFill" class="image"></image>
			</view>
			<ad v-if="item.adpid" :adpid="item.adpid" :unit-id="item.adpid" @load="adLoad" @error="adError"
				@close="adClose" class="ad" :class="[options.adClassName]"></ad>
		</view>
		<uni-load-more v-if="options.loadmore" :status="status"></uni-load-more>
	</view>
</template>
<script>
	const db = uniCloud.database();
	import layouts from './layouts.js';
	/**
	 * 文章组件，需要配合opendb-article
	 * @property {Object} configs configs.mode=[default|blend1_2]
	 */
	export default {
		data() {
			return {
				where: '',
				bgStyle: '',
				dataList: [],
				status: 'more', //more|loading|noMore
				options: {
					bgClassName: "",
					adClassName: '', //广告样式
					itemClassName: '', //单条类名
					mode: 'default', //默认左文右图，blend1_1，blend1_2,，blend1_3混合
					category_id: '',
					loadmore: true,
					limit: 10
				}
			};
		},
		props: {
			configs: {
				type: Object,
				default: () => {
					//动态读取
					return {};
				}
			},
			items: {
				type: Array,
				default: () => {
					//静态显示
					return [];
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
			refresh() {
				console.log('article refresh');
				//重新加载
				this.page = 0;
				this.status = 'loading';
				this.loadData();
			},
			loadmore() {
				//加载更多，最好文章是在最后，才开启
				console.log('loadmore');
				if (this.options.loadmore) {
					//加载下一页
					this.loadData();
				}
			},
			newReadId(newVal) {
				console.log('article watch newReadId', newVal);
				//更新文章为已读
				this.dataList.forEach(item => {
					if (!item.read) {
						item.read = newVal.indexOf(item._id) != -1;
						if (item.read) {
							//已经变为字符串
							item.className += " read";
						}
					}
				});
			}
		},
		computed: {
			adConfig() {
				if (this.$store.state && this.$store.state.app.adConfig && this.$store.state.app.adConfig.article && this
					.$store.state.app.adConfig.article.list) {
					return this.$store.state.app.adConfig.article.list;
				}
				return false;
			},
			newReadId() {
				if(!this.$store.state.mall){
					return []
				}
				return this.$store.state.mall.articleRead;
			}
		},

		created() {
			this.page = 0;
			console.log('article created', this.configs);
			//静态数据
			if (this.items && this.items.length > 0) {
				this.dataList = this.items;
				this.buildData(this.dataList);
			} else if (this.configs) {
				//动态读取
				this.options = Object.assign(this.options, {
					...this.configs
				});
				this.loadData();
			}
		},
		methods: {
			bgClick() {
				if (this.options.top_url) {
					this.navTo(this.options.top_url)
				}
			},
			async loadData() {
				if (this.options.background_img) {
					// console.log("this.options.background_img", this.options.background_img)
					this.bgStyle =
						`background:url(${this.options.background_img}) no-repeat ;    background-size: 100%;`
				}
				if (this.status == 'noMore') {
					console.log('没有更多了');
					return;
				}
				this.status = 'loading';
				this.page++;
				db.action('article_read_check')
					.collection('opendb-news-articles')
					.where(`article_status==1 && category_id=="${this.options.category_id}"`)
					.field('avatar,title,excerpt,publish_date,view_count,source_from')
					.skip((this.page - 1) * this.options.limit)
					.limit(this.options.limit)
					.orderBy('publish_date desc')
					.get()
					.then(({
						result
					}) => {
						console.log('article 查询完毕');
						if (result.data.length < this.options.limit) {
							this.status = 'noMore';
						} else {
							this.status = 'more';
						}
						this.buildData(result.data);
						if (this.page == 1) {
							this.dataList = result.data;
						} else {
							this.dataList = this.dataList.concat(result.data);
						}
					});
			},
			buildData(data) {
				let pinlv = 0;
				if (this.adConfig) {
					pinlv = parseInt(this.options.limit / this.adConfig.length);
				}
				//处理图片尺寸 | thumbImg('700x300')
				data.forEach((item, index) => {
					item.style = this.configs.style;
					item.className = [this.options.itemClassName];
					item.read = !!item.read;
					if (index == data.length - 1) {
						item.className.push('last');
					}
					if (item.read) {
						item.className.push('read');
					}
					item.layout = this.getConfigWithIndex(index);
					item.className.push(item.layout.className);
					//兼容百度小程序
					item.className = item.className.join(" ")
					//微信中不支持使用过滤器
					item.avatar = this.$thumbImg(item.avatar, item.layout.image);
					if (typeof item.user_id == 'object') {
						if (item.user_id && item.user_id.length > 0) {
							item.user_id = item.user_id[0].nickname;
						} else {
							item.user_id = '系统';
						}
					}
					item.adpid = false;
					//处理广告
					if (this.adConfig && pinlv > 0 && (index + 1) % pinlv == 0) {
						item.adpid = this.adConfig[parseInt((index + 1) / pinlv) % this.adConfig.length];
					}
					//处理时间
					item.publish_date = this.$dateFormat('Y-m-d', item.publish_date);
				});
			},
			navToDetail(item) {
				console.log('navToDetail', item);
				this.navTo('/uni_modules/tian-article/pages/article/detail?id=' + item._id, item);
			},
			getConfigWithIndex(index) {
				let mode = layouts[this.options.mode];
				return mode[index % mode.length];
			}
		}
	};
</script>
<style lang="scss">
	$row-base: 22rpx;
	$border-radius: 10rpx;

	.article-container {
		overflow-x: hidden;

		.ad {
			margin-bottom: $row-base;
		}

		.item {
			padding: $row-base;
			display: flex;
			align-items: center;
			background-color: #ffffff;
			border-radius: $border-radius;
			// margin: 0 $row-base $row-base;

			&.banner {
				//大图/底部文字
				flex-direction: column;
				flex-flow: column-reverse;
				align-items: left;
				padding: 0;

				.content {
					width: calc(100% - 44rpx);
					padding: 22rpx;
				}

				.more {
					display: flex;
					justify-content: space-between;
				}

				.image {
					width: 700rpx;
					height: 280rpx;
					margin-bottom: 16rpx;
				}
			}

			&.last {
				// margin-bottom: 0;
			}

			.content {
				flex: 1;
			}

			.title {
				font-size: 32rpx;
			}

			.time {
				font-size: 24rpx;
				color: #b3b3b3;
				margin-top: 12rpx;
			}

			.image {
				width: 160rpx;
				height: 160rpx;
				margin: 0rpx;
				display: block;
				border-radius: $border-radius;
			}

			&.read {
				color: #0055ff;
			}
		}
	}
</style>
