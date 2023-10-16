<template>
	<view style="display: flex;">
		<button type="warn" @click="update()" size="mini" style="margin-left: 22rpx;">云同步</button>
	</view>
</template>

<script>
	import config from '@/admin.config.js'
	const db = uniCloud.database();
	const cmd = db.command;
	console.log("cloud", config.cloud)
	const url = config.cloud.url + "/http/mall/utils/database";
	/**
	 * 云同步
	 */
	export default {
		name: "tian-cloud-async",
		data() {
			return {

			};
		},
		props: {
			name: {
				type: String,
				default: ""
			},
			condition: {
				type: Object,
				default: () => {
					return {}
				}
			},
			onlyAdd: {
				type: Boolean,
				default: false
			},
			primaryKey: {
				type: String,
				default: "_id"
			},
		},
		methods: {
			update() {
				//更新
				if (!this.name) {
					uni.showToast({
						icon: "none",
						title: "表名不能为空"
					})
					return false;
				}
				uni.showModal({
					title: "云同步提示",
					content: "云端数据将覆盖自己修改的，是否确定同步云端数据？",
					success: (res) => {
						if (res.confirm) {
							uni.showLoading({
								title: "正在获取"
							})
							uni.request({
								method: "POST",
								data: {
									collection: this.name,
									condition: this.condition
								},
								url: url,
								success: ({
									data
								}) => {
									uni.hideLoading()
									console.log(data)
									this.updateDatas(data)
								}
							})
						}
					}
				})
			},
			async updateDatas(data) {
				uni.showLoading({
					title: "处理中"
				})
				//更新数据，否则新增
				const collection = db.collection(this.name);
				//查询存在的数据
				const {
					result: existsResult
				} = await collection.where({
					[this.primaryKey]: cmd.in(data.map(e => e[this.primaryKey]))
				}).field(`${this.primaryKey}`).get()

				console.log("existsResult", existsResult)
				let extIds = existsResult.data.map(e => e[this.primaryKey]);
				let updated = 0;
				let added = 0;
				for (let i = 0; i < data.length; i++) {
					let item = data[i];
					let id = item[this.primaryKey];
					delete item._id;
					if (extIds.indexOf(id) != -1) {
						if (!this.onlyAdd) {
							const result = await collection.where({
								[this.primaryKey]: id
							}).update({
								...item
							})
							updated++;
						}
					} else {
						const result = await collection.add({
							...item,
							[this.primaryKey]: id
						})
						added++;
					}
				}
				uni.hideLoading()
				uni.showToast({
					icon: "none",
					title: `更新${updated}\n新增${added}`
				})
			}
		}
	}
</script>

<style lang="scss">

</style>
