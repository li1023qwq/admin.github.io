<template>
	<view class="uni-container">
		<uni-forms ref="form" v-model="formData" :rules="rules" validateTrigger="bind" @submit="submit">
			<uni-forms-item name="username" label="用户名" required>
				<uni-easyinput v-model="formData.username" :clearable="false" placeholder="请输入用户名" />
			</uni-forms-item>
			<uni-forms-item name="nickname" label="昵称" required>
				<uni-easyinput v-model="formData.nickname" :clearable="false" placeholder="请输入昵称" />
			</uni-forms-item>
			<uni-forms-item :name="showPassword ? 'password' : ''" label="重置密码">
				<span v-show="!showPassword" class="reset-password-btn" @click="trigger">点击重置密码</span>
				<uni-easyinput v-show="showPassword" v-model="password" :clearable="false" placeholder="请输入重置密码">
					<view slot="right" class="cancel-reset-password-btn" @click="trigger">取消</view>
				</uni-easyinput>
			</uni-forms-item>
			<uni-forms-item name="role" label="角色列表">
				<uni-data-checkbox multiple :localdata="roles" v-model="formData.role" />
			</uni-forms-item>
			<uni-forms-item name="mobile" label="手机号">
				<uni-easyinput v-model="formData.mobile" :clearable="false" placeholder="请输入手机号" />
			</uni-forms-item>
			<uni-forms-item name="email" label="邮箱">
				<uni-easyinput v-model="formData.email" :clearable="false" placeholder="请输入邮箱" />
			</uni-forms-item>
			<uni-forms-item name="inviter_uid" label="邀请者">
				<uni-forms ref="inviter_uid_form">
					<view v-for="(item,index) in inviters" :key="index" style="line-height: 2;font-size: 32rpx;">
						<text>{{index+1}}：</text>
						<text class="">{{item.mobile}}</text>
						<text class="margin-left-20" v-if="item.nickname">{{item.nickname}}</text>
					</view>
				</uni-forms>
			</uni-forms-item>
			<uni-forms-item name="dcloud_appid" label="客户端">
				<uni-data-checkbox :multiple="true" v-model="formData.dcloud_appid" collection="opendb-app-list"
					orderby="appid asc" field="appid as value, name as text" />
			</uni-forms-item>
			<uni-forms-item name="status" label="用户状态">
				<uni-data-checkbox :localdata="statusList" v-model="formData.status" />
			</uni-forms-item>
			<uni-forms-item name="score_charge_rate" label="积分互转手续费">
				<uni-easyinput placeholder="积分互转手续费，0.01-0.99" type="number" v-model="formData.score_charge_rate" />
			</uni-forms-item>
			<view class="uni-button-group">
				<button style="width: 100px;" type="primary" class="uni-button" @click="submitForm">提交</button>
				<navigator open-type="navigateBack" style="margin-left: 15px;"><button style="width: 100px;"
						class="uni-button">返回</button></navigator>
				<button v-if="inviters && inviters.length>0" style="width: 150px;margin-left: 15px;" type="warn"
					class="uni-button" @click="delInvite">删除邀请者</button>
			</view>
		</uni-forms>
	</view>
</template>

<script>
	import validator from '@/js_sdk/validator/uni-id-users.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'uni-id-users';

	function getValidator(fields) {
		let reuslt = {}
		for (let key in validator) {
			if (fields.includes(key)) {
				reuslt[key] = validator[key]
			}
		}
		return reuslt
	}

	export default {
		data() {
			return {
				inviters: [],
				showPassword: false,
				password: "",
				formData: {
					"username": "",
					"inviter_uid": [],
					"nickname": "",
					"password": "",
					"role": [],
					"mobile": "",
					"email": "",
					"score_charge_rate": 0.03,
					"status": 1 //默认禁用
				},
				rules: {
					...getValidator(["username", "password", "role", "mobile", "email", "score_charge_rate"]),
					"status": {
						"rules": [{
							"format": "int"
						}]
					},
					"score_charge_rate": {
						"rules": [{
							"format": "double"
						}]
					}
				},
				roles: [],
				statusList: [{
					"text": "正常",
					"value": 0
				}, {
					"text": "禁用",
					"value": 1
				}, {
					"text": "审核中",
					"value": 2
				}, {
					"text": "审核拒绝",
					"value": 3
				}]
			}
		},
		onLoad(e) {
			const id = e.id
			this.formDataId = id
			this.getDetail(id)
			this.loadroles()

		},
		methods: {
			/**
			 * 切换重置密码框显示或隐藏
			 */
			trigger() {
				this.showPassword = !this.showPassword
			},

			/**
			 * 触发表单提交
			 */
			submitForm(form) {
				this.$refs.form.submit();
			},

			/**
			 * 表单提交
			 * @param {Object} event 回调参数 Function(callback:{value,errors})
			 */
			submit(event) {
				const {
					value,
					errors
				} = event.detail
				// 表单校验失败页面会提示报错 ，要停止表单提交逻辑
				if (errors) {
					return
				}
				uni.showLoading({
					title: '修改中...',
					mask: true
				})

				// // 是否启用功能的数据类型转换， 0 正常， 1 禁用
				// if (typeof value.status === "boolean") {
				// 	value.status = Number(!value.status)
				// }
				const resetData = {
					uid: this.formDataId,
					password: this.password
				}
				delete value.password
				// 使用 uni-clientDB 提交数据
				db.collection(dbCollectionName).where({
					_id: this.formDataId
				}).update(value).then((res) => {
					if (this.showPassword && resetData.password) {
						this.resetPWd(resetData)
					}
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

			resetPWd(resetData) {
				this.$request('system/user/resetPwd', resetData)
					.then().catch(err => {
						uni.showModal({
							content: err.message || '请求服务失败',
							showCancel: false
						})
					}).finally()
			},
			/**
			 * 获取表单数据
			 * @param {Object} id
			 */
			getDetail(id) {
				uni.showLoading({
					mask: true
				})
				db.collection(dbCollectionName)
					.doc(id)
					.field('username,nickname,inviter_uid,role,mobile,email,status,score_charge_rate,dcloud_appid')
					.get()
					.then((res) => {
						const data = res.result.data[0]
						if (data) {
							if (data.status === undefined) {
								data.status = 0
							}
							if (!data.username) {
								data.username = data.mobile
							}
							this.getInviters(data.inviter_uid);
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
			},
			getInviters(uids) {
				if (uids && uids.length > 0) {
					db.collection(dbCollectionName).where({
						_id: dbCmd.in(uids)
					}).field("nickname,mobile").get().then(({
						result
					}) => {
						//按原来的顺序排列
						let inviterMap = {}
						result.data.map(e => {
							inviterMap[e._id] = e;
						})

						this.inviters = uids.map(id => {
							return inviterMap[id] ? inviterMap[id] : {};
						});
					});
				}
			},
			delInvite(key) {
				uni.showModal({
					title: "删除邀请关系",
					content: "是否确定删除他的邀请者，\n此操作不可撤销",
					success: (res) => {
						if (res.confirm) {
							// this.inviters = this.inviters.filter(e => e._id != key);
							// this.formData.inviter_uid = this.formData.inviter_uid.filter(e => e != key);
							this.formData.inviter_uid = [];
							this.inviters = [];
							console.log("this.formData.inviter_uid", this.formData.inviter_uid)
						}
					}
				})
			},
			loadroles() {
				db.collection('uni-id-roles').limit(500).get().then(res => {
					const roleIds = []
					this.roles = res.result.data.map(item => {
						roleIds.push(item.role_id)
						return {
							value: item.role_id,
							text: item.role_name
						}
					})
					if (roleIds.indexOf('admin') === -1) {
						this.roles.unshift({
							value: 'admin',
							text: '超级管理员'
						})
					}
				}).catch(err => {
					uni.showModal({
						title: '提示',
						content: err.message,
						showCancel: false
					})
				})
			},
			// status 对应文字显示
			parseUserStatus(status) {
				if (status === 0) {
					return '启用'
				} else if (status === 1) {
					return '禁用'
				} else if (status === 2) {
					return '审核中'
				} else if (status === 3) {
					return '审核拒绝'
				} else {
					return '启用'
				}
			}
		}
	}
</script>

<style>
	.reset-password-btn {
		/* height: 100%; */
		line-height: 36px;
		color: #007AFF;
		text-decoration: underline;
		cursor: pointer;
	}

	.cancel-reset-password-btn {
		color: #007AFF;
		padding-right: 10px;
		cursor: pointer;
	}
</style>
