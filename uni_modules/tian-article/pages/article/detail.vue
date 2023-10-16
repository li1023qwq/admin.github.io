<template>
	<view>
		<view class="title">
			<text>{{ item.title }}</text>
			<view class="sub-title">
				<text class="st-fav" @click="unFav" v-if="isFav">已收藏</text>
				<text class="st-fav" @click="fav" v-else>收藏</text>
				<uni-dateformat class="font-20 margin-left-20" :date="item.publish_date" format="yyyy/MM/dd"
					:threshold="[60000, 3600000]"></uni-dateformat>
				<text class="st-item">浏览：{{ item.view_count }}</text>
				<text class="st-item" v-if="item.source_from">{{ item.source_from }}</text>
				<text class="st-item" v-else-if="item.user_id">上传用户：{{ item.user_id }}</text>
			</view>
		</view>
		<uni-load-more v-if="!loaded" status="loading" class="margin-top-60"></uni-load-more>
		<block v-if="loaded">
			<ad v-if="topAdpid" :adpid="topAdpid" :unit-id="topAdpid" @load="adLoad" @error="adError" @close="adClose">
			</ad>
			<view class="content">
				<rich-text :nodes="item.content"></rich-text>
			</view>
			<ad v-if="bottomAdpid" :adpid="bottomAdpid" :unit-id="bottomAdpid" @load="adLoad" @error="adError"
				@close="adClose"></ad>
		</block>
		<view class="text-center padding-40" v-if="canGetDoubleScore" @click="getDoubleScore(item.task, 'article')">
			<tian-icons type="chakanshipin" size="40" color="#eb4e38"><text class="font-36">{{item.task.name}}</text>
			</tian-icons>
		</view>
		<block v-if="item.comment_status">
			<view class="ti-flex padding-22">
				<image :src="userInfo.avatar" mode="aspectFill" class="image-width-60 bg-white border-radius padding-2">
				</image>
				<uni-easyinput v-model="content" placeholder="写下您的评论..." class="margin-left-16 flex-1">
					<template v-slot:right>
						<button type="primary" class="cuboid" @click="submitComment()">评论</button>
					</template>
				</uni-easyinput>
			</view>
			<!-- 评论 -->
			<view class="">
				<view v-for="(item, index) in commentList" :key="index"
					class="comments bg-white border-radius padding-22 ">
					<image :src="item.user.avatar" mode="aspectFill"
						class="image-width-60 bg-white border-radius padding-2"></image>
					<view class="margin-left-18 flex-1">
						<view class="">
							<text>{{ item.user.nickname }}</text>
							<uni-dateformat class="font-20 margin-left-20 colorGray" :date="item.comment_date"
								format="yyyy/MM/dd" :threshold="[60000, 3600000]"></uni-dateformat>
						</view>
						<view class="font-24">
							<text>{{ item.comment_content }}</text>
						</view>
					</view>
				</view>
				<tian-empty v-if="commentList.length == 0" text="暂无评论" marginTop="200" mode="liuyan"
					paddingBottom="200"></tian-empty>
				<uni-load-more v-else :status="loadingType"></uni-load-more>
			</view>
		</block>
	</view>
</template>

<script>
	const db = uniCloud.database();
	import adMixin from '@/common/mixin/ad';
	// 表查询配置
	const dbCollectionName = 'opendb-news-articles';
	import AD from '@/common/js/ad.js';

	export default {
		mixins: [adMixin],
		data() {
			return {
				id: '',
				isFav: false,
				isGetScore: false,
				loaded: false,
				where: '',
				content: '',
				commentList: [],
				item: {}
			};
		},
		onLoad(e) {
			this.id = e.id;
			this.loadData();
		},
		onShow() {
			this.checkFav();
		},
		onReachBottom() {
			console.log('加载下一页评论，滑动到底部，增加积分');
			if (this.item.task && !this.isGetScore && this.checkBindMobile("必须绑定手机才能做任务")) {
				this.isGetScore = true;
				//完成阅读，增加积分
				if (this.item.task.normal) {
					this.articleRead(this.item.task);
				}
			}
			this.loadCommentData();
		},
		computed: {
			isLogin() {
				return this.$store.getters['user/isTokenValid'];
			},
			userInfo() {
				return this.$store.state.user.userInfo;
			},
			adConfig() {
				if (this.$store.state && this.$store.state.app.adConfig && this.$store.state.app.adConfig.article && this
					.$store.state.app.adConfig.article.detail) {
					return this.$store.state.app.adConfig.article.detail;
				}
				return {};
			},
			bottomAdpid() {
				if (this.adConfig.bottom) {
					return this.adConfig.bottom;
				}
				return false;
			},
			topAdpid() {
				if (this.adConfig.top) {
					return this.adConfig.top;
				}
				return false;
			},
			canGetDoubleScore() {
				return this.item.task && this.item.task.multiple && (this.adConfig.signin || this.adConfig.video);
			}
		},
		methods: {
			submitComment(reply_comment) {
				if (!this.isLogin) {
					this.navToLoginNotice();
					return;
				}
				if (!this.content) {
					uni.showToast({
						icon: 'none',
						title: '请输入评论内容'
					});
					return;
				}
				uni.showLoading({
					title: '提交中',
					mask: true
				});
				let item = {
					article_id: this.id,
					user_id: db.env.uid,
					user: {
						avatar: this.userInfo.avatar,
						nickname: this.userInfo.nickname,
					},
					like_count: 0,
					comment_type: 0,
					comment_content: this.content,
					reply_comment_id: reply_comment ? reply_comment._id : '',
					reply_user_id: reply_comment ? reply_comment.user_id : ''
				};
				db.collection('opendb-news-comments')
					.add(item)
					.then(({
						result
					}) => {
						console.log('res', result);
						uni.hideLoading();
						uni.showToast({
							title: '发布成功'
						});
						item._id = result.id;
						item.user_id = [this.userInfo];
						item.comment_date = Date.now();
						let newData = [item];
						this.buildComment(newData);
						this.commentList = newData.concat(this.commentList);
						this.content = '';
					});
			},
			loadCommentData() {
				if (!this.item.comment_status) {
					console.log("文章不支持评论")
					return;
				}
				if (this.loadingType == 'noMore') {
					return;
				}
				this.loadingType == 'loading';
				this.page++;
				//默认查询第一层
				db.collection('opendb-news-comments')
					.where(`article_id=="${this.id}" && reply_comment_id==""`)
					.field(
						'comment_content,like_count,comment_type,reply_user_id,reply_comment_id,comment_date,user'
					)
					.orderBy('comment_date desc')
					.skip((this.page - 1) * this.limit)
					.limit(this.limit)
					.get()
					.then(({
						result
					}) => {
						if (result.data.length < this.limit) {
							this.loadingType = 'noMore';
						} else {
							this.loadingType = 'more';
						}
						this.buildComment(result.data);

						if (this.page == 1) {
							this.commentList = result.data;
						} else {
							this.commentList = this.commentList.concat(result.data);
						}
					});
			},
			buildComment(data) {
				//处理头像
				let info = {
					avatar: '/static/missing-face.png',
					nickname: '匿名'
				};
				data.forEach(item => {
					if (item.user) {
						item.user = {
							...info,
							...item.user
						};
					} else {
						item.user = info;
					}
				});
			},
			loadData() {
				let data = this.getItemData();
				this.buildData(data);
				db.action('article_read')
					.collection('opendb-news-articles,uni-id-users')
					.foreignKey('opendb-news-articles.user_id')
					.where(`article_status==1 && _id=="${this.id}"`)
					.field(
						'avatar,title,excerpt,publish_date,like_count,source_from,view_count,user_id.nickname,content,comment_count,comment_status'
					)
					.get({
						getOne: true
					})
					.then(({
						result
					}) => {
						// console.log("result.data", result.data)
						this.buildData(result.data);
						//更新今日已读文章列表
						if (this.isLogin) {
							this.$store.commit('mall/UPDATE_ARTICLE_READ', this.item._id);
						}
						this.loaded = true;
					});
			},
			buildData(item) {
				if (!item) {
					return;
				}
				uni.setNavigationBarTitle({
					title: item.title
				});
				//微信中不支持使用过滤器
				if (item.avatar) {
					item.avatar = this.$thumbImg(item.avatar, `750x400`);
				}
				if (typeof item.user_id == 'object') {
					if (item.user_id && item.user_id.length > 0) {
						item.user_id = item.user_id[0].nickname;
					} else {
						item.user_id = '';
					}
				}
				//处理文中的图片
				if (item.content) {
					item.content = this.$repairImageSize(item.content);
				}
				this.item = item;
			},
			checkFav() {
				db.collection('opendb-news-favorite')
					.where(`user_id==$cloudEnv_uid && article_id=="${this.id}"`)
					.field('_id')
					.get({
						getOne: true
					})
					.then(({
						result
					}) => {
						console.log('checkFav result', result);
						this.isFav = result.data.length > 0;
					})
					.catch(err => {
						console.log('未登录');
					});
			},
			unFav() {
				uni.showModal({
					content: '是否确定取消收藏？',
					success: res => {
						if (res.confirm) {
							uni.showLoading({
								mask: true
							});
							db.collection('opendb-news-favorite')
								.where(`user_id==$cloudEnv_uid && article_id=="${this.id}"`)
								.remove()
								.then(() => {
									uni.hideLoading();
									this.isFav = false;
									uni.showToast({
										title: '取消成功'
									});
								})
								.catch(() => {
									uni.hideLoading();
									uni.showToast({
										icon: 'none',
										title: '取消失败'
									});
								});
						}
					}
				});
			},
			fav() {
				if (this.isLogin) {
					uni.showLoading({
						mask: true
					});
					//收藏，必须登录
					db.action('article_favorite')
						.collection('opendb-news-favorite')
						.where({
							user_id: db.env.uid,
							article_id: this.id
						})
						.field('_id')
						.get({
							getOne: true
						})
						.then(({
							result
						}) => {
							this.isFav = true;
							console.log('fav result');
							uni.hideLoading();
							uni.showToast({
								title: '收藏成功'
							});
						})
						.catch(() => {
							uni.hideLoading();
							uni.showToast({
								icon: 'none',
								title: '收藏失败'
							});
						});
				} else {
					//提示登录
					this.navToLoginNotice(() => {
						this.checkFav();
					});
				}
			},
			/**
			 * 提示消息,页面可以单独自定义
			 * @param {Object} res
			 */
			finishTaskResult(res) {
				this.item.task.log = {
					...res,
					task: undefined
				};
				this.item.task.multiple = res.task.multiple;
				if (res.getDouble) {
					this.$message(`阅读翻倍奖励 +${res.task.bounty}`);
				} else if (res.getScore) {
					this.$message(`阅读奖励 +${res.task.bounty}`);
				} else if (res.needMore) {
					this.$message(`已完成${res.amount}次`);
				} else if (res.result) {}
			}
		}
	};
</script>
<style>
	page {
		background: #ffffff;
	}

	.title {
		font-size: 40rpx;
		padding: 22rpx;
		border-bottom: 2rpx solid #e8e8e8;
	}

	.title .sub-title {
		font-size: 24rpx;
		margin-top: 16rpx;
		color: #adadad;
	}

	.title .st-fav {
		color: #0000ff;
	}

	.title .st-item {
		margin-left: 18rpx;
	}

	.content {
		padding: 22rpx;
		line-height: 1.6;
		font-size: 32rpx;
		overflow: hidden;
	}

	.content>>>p {
		margin-top: 12rpx;
	}

	.content>>>img {
		max-width: 100%;
		height: auto;
	}

	.image {
		width: 750rpx;
		height: 400rpx;
	}

	.comments {
		display: flex;
	}
</style>
