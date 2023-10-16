<template>
	<view class="uni-container">
		<uni-forms ref="form" v-model="formData" validateTrigger="bind" style="max-width: 792px;" :rules="rules">
			<uni-card title="基础信息">
				<uni-forms-item class="forn-item__flex" name="appid" label="AppID" required>
					<uni-easyinput :disabled="isEdit" placeholder="应用的AppID" v-model="formData.appid" trim="both">
					</uni-easyinput>
					<button class="custom-button" size="mini" type="primary" @click="autoFill">自动填充</button>
					<show-info :left="-180" :top="25" content="填写 appid 从数据库（opendb-app-list）查询填充数据" />
				</uni-forms-item>
				<uni-forms-item name="name" label="应用名称" required>
					<uni-easyinput placeholder="应用名称" v-model="formData.name" trim="both"></uni-easyinput>
				</uni-forms-item>
				<uni-forms-item name="alias" label="应用别名" required>
					<uni-easyinput placeholder="英文，唯一。用于 url 发布页链接到对应 app 的映射关系" v-model="formData.alias" trim="both">
					</uni-easyinput>
				</uni-forms-item>
				<uni-forms-item name="introduction" label="应用简介">
					<uni-easyinput placeholder="应用简介" v-model="formData.introduction" trim="both"></uni-easyinput>
				</uni-forms-item>
				<uni-forms-item name="description" label="应用描述">
					<textarea :maxlength="-1" auto-height placeholder="应用描述"
						@input="binddata('description', $event.detail.value)" class="uni-textarea-border"
						v-model="formData.description"></textarea>
				</uni-forms-item>
			</uni-card>

			<uni-card title="图标素材">
				<uni-forms-item label="应用图标">
					<uni-file-picker v-model="middleware_img.icon_url" :image-styles="{'width' : 100}"
						return-type="object" file-mediatype="image" limit="1" mode="grid"
						@success="(res) => iconUrlSuccess(res,'icon_url')"
						@delete="(res) => iconUrlDelete(res,'icon_url')">
					</uni-file-picker>
				</uni-forms-item>
				<uni-forms-item label="应用截图">
					<uni-file-picker v-model="screenshotList" file-mediatype="image" mode="grid"
						:image-styles="{'height': 250,'width' : 150}" @delete="iconUrlDelete">
					</uni-file-picker>
				</uni-forms-item>
			</uni-card>

			<uni-card class="app_platform" title="App">
				<view class="extra-button">
					<button type="primary" plain size="mini" @click="autoFillApp">自动填充</button>
					<show-info :left="40" :top="-35" content="填写 appid 从数据库（opendb-app-version）查询填充数据" />
				</view>
				<template v-for="item in appPlatformKeys">
					<view :key="item">
						<label class="title_padding" :class="{'font_bold':getPlatformChcekbox(item)}">
							<checkbox :ref="`${item}_checkbox`" />
							<text>{{appPlatformValues[item]}}</text>
						</label>
						<template v-if="getPlatformChcekbox(item)">
							<uni-forms-item label="名称">
								<uni-easyinput v-model="formData[item].name" trim="both"></uni-easyinput>
							</uni-forms-item>
							<uni-forms-item class="forn-item__flex" v-if="item === 'app_android'" label="上传包">
								<uni-file-picker v-model="appPackageInfo" file-extname="apk" :disabled="hasPackage"
									returnType="object" file-mediatype="all" limit="1"
									@success="(res) => iconUrlSuccess(res, `${item}.url`)"
									@delete="(res) => iconUrlDelete(res,`${item}.url`)" style="flex:1;">
									<button type="primary" size="mini" @click="selectFile">选择文件</button>
								</uni-file-picker>
								<text v-if="hasPackage"
									style="padding-left: 20px;color: #a8a8a8;">{{appPackageInfo.size && Number(appPackageInfo.size / 1024 / 1024).toFixed(2) + 'M'}}</text>
							</uni-forms-item>
							<uni-forms-item label="下载链接">
								<uni-easyinput v-model="formData[item].url" trim="both"></uni-easyinput>
							</uni-forms-item>
						</template>
					</view>
				</template>
			</uni-card>

			<uni-card class="mp_platform" title="小程序">
				<view class="extra-button">
					<button type="primary" plain size="mini" @click="mpAccordion">{{mpExtra}}</button>
					<show-info :left="40" :top="-20" content="折叠状态下，即使勾选也不会显示详情" />
				</view>
				<template v-for="item in platFormKeys">
					<template v-if="item.indexOf('mp') !== -1">
						<view :key="item">
							<label class="title_padding" :class="{'font_bold':getPlatformChcekbox(item)}">
								<checkbox :ref="`${item}_checkbox`" />
								<text>{{mpPlatform[item]}}</text>
							</label>
							<template v-if="mpAccordionStatus && getPlatformChcekbox(item)">
								<uni-forms-item label="名称">
									<uni-easyinput v-model="formData[item].name" trim="both"></uni-easyinput>
								</uni-forms-item>
								<uni-forms-item label="小程序码">
									<uni-file-picker v-model="middleware_img[item]" :image-styles="{'width' : 100}"
										return-type="object" file-mediatype="image" limit="1" mode="grid"
										@success="(res) => iconUrlSuccess(res, `${item}.qrcode_url`)"
										@delete="(res) => iconUrlDelete(res, `${item}.qrcode_url`)">
									</uni-file-picker>
								</uni-forms-item>
							</template>
						</view>
					</template>
				</template>
			</uni-card>

			<uni-card title="H5">
				<uni-forms-item label="链接地址">
					<uni-easyinput v-model="formData.h5.url" trim="both"></uni-easyinput>
					<span style="font-size: 13px; color: #999;">如需免费的前端网页托管，请开通 <a style="color: inherit;"
							href="https://unicloud.dcloud.net.cn">uniCloud</a> ，创建服务空间，并在 “前端网页托管”
						里上传你的网页</span>
				</uni-forms-item>
			</uni-card>

			<uni-card title="快应用">
				<uni-forms-item label="名称">
					<uni-easyinput v-model="formData.quickapp.name" trim="both"></uni-easyinput>
				</uni-forms-item>
				<uni-forms-item label="快应用码">
					<uni-file-picker v-model="middleware_img.quickapp" :image-styles="{'width' : 100}"
						return-type="object" file-mediatype="image" limit="1" mode="grid"
						@success="(res) => iconUrlSuccess(res,'quickapp.qrcode_url')"
						@delete="(res) => iconUrlDelete(res,'quickapp.qrcode_url')">
					</uni-file-picker>
				</uni-forms-item>
			</uni-card>

			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px;" @click="submit">保存</button>
				<button :type="publishBtnType" class="uni-button" style="width: 100px;"
					@click="publish">{{publishBtnText}}</button>
				<navigator open-type="navigateBack" style="margin-left: 15px;">
					<button class="uni-button" style="width: 100px;">返回</button>
				</navigator>
			</view>
		</uni-forms>
	</view>
</template>

<script>
	import mixin from '../mixin/publish_add_detail_mixin.js';
	import showInfo from '../components/show-info.vue'

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'opendb-app-publish';

	export default {
		components: {
			showInfo
		},
		mixins: [mixin],
		data() {
			return {
				mpExtra: ' ',
				mpAccordionStatus: 1,
				publishBtnText: '发行',
				publishBtnType: 'primary',
				oldStatus: 0
			}
		},
		onLoad(e) {
			if (e.id) {
				this.isEdit = true
				this.formDataId = e.id
				this.getDetail(e.id)
			}
		},
		onReady() {
			this.mpExtra = '折叠'
		},
		methods: {
			publish() {
				this.oldStatus = this.getFormData('status')
				this.setFormData('status', this.oldStatus ? 0 : 1)
				this.submit()
			},
			/**
			 * 验证表单并提交
			 */
			submit() {
				uni.showLoading({
					mask: true
				})

				this.formatFormData()

				this.$refs.form.validate(this.keepItems).then((res) => {
					return this.submitForm(res)
				}).catch(() => {
					this.setFormData('status', this.oldStatus)
				}).finally(() => {
					uni.hideLoading()
				})
			},
			/**
			 * 提交表单
			 */
			submitForm(value) {
				// 使用 clientDB 提交数据
				(
					this.isEdit ?
					this.requestCloudFunction('setPublishData', {
						id: this.formDataId,
						value
					}) :
					db.collection(dbCollectionName).add(value)
				)
				.then((res) => {
					uni.showToast({
						title: `${this.isEdit ? '更新' : '新增'}成功`
					})
					this.getOpenerEventChannel().emit('refreshData')
					setTimeout(() => uni.navigateBack(), 500)
				}).catch((err) => {
					this.setFormData('status', this.oldStatus)
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
				db.collection(dbCollectionName).doc(id).get().then((res) => {
					const data = res.result.data[0]
					if (data) {
						this.initFormData(data)
						this.getFormData('status') && (this.publishBtnText = '下架', this.publishBtnType = 'warn')
					}
				}).catch((err) => {
					uni.showModal({
						content: err.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					uni.hideLoading()
				})
			},
			mpAccordion() {
				if (this.mpAccordionStatus) {
					this.mpExtra = '展开'
					this.mpAccordionStatus = 0
				} else {
					this.mpExtra = '折叠'
					this.mpAccordionStatus = 1
				}
			}
		}
	}
</script>

<style lang="scss">
	.title_padding {
		padding-bottom: 15px;
		display: block;
	}

	.font_bold {
		font-weight: bold;
	}

	.uni-button-group {
		& button {
			margin-left: 15px;
		}

		& button:first-child {
			margin-left: 0px;
		}
	}

	::v-deep {
		.forn-item__flex {
			.uni-forms-item__content {
				display: flex;
				align-items: center;

				.custom-button {
					height: 100%;
					margin-left: 10rpx;
					line-height: 36px;
				}
			}
		}

		.uni-card {
			cursor: auto;
		}

		.uni-card__header {
			background-color: #eee;
		}

		.uni-card__header-title-text {
			font-weight: bold;
		}
	}

	.app_platform,
	.mp_platform {
		::v-deep {
			.uni-card__header-extra-text span {
				color: #fff;
				background-color: #409EFF;
				border-radius: 4px;
				cursor: pointer;
				padding: 5px 10px;
			}
		}
	}

	.extra-button {
		display: flex;
		align-items: center;
		margin-bottom: 15px;

		button {
			margin: 0;
		}
	}
</style>
