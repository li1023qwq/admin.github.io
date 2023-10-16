<template>
	<view class="uni-container">
		<uni-forms ref="form" :value="formData" validateTrigger="bind">
			<uni-forms-item name="component" label="组件类型">
				<uni-data-checkbox v-model="formData.component" collection="tian-page-components"
					field="posid,title as text, component_id as value" where="state==1 && is_page==true"
					orderby="posid asc" />
			</uni-forms-item>
			<uni-forms-item name="begin_time" label="生效时间">
				<uni-datetime-picker return-type="timestamp" :value="formData.begin_time" placeholder="请选择生效时间" />
			</uni-forms-item>
			<uni-forms-item name="begin_hours" label="生效小时">
				<uni-easyinput placeholder="可选择0-23" type="number" v-model="formData.begin_hours" />
			</uni-forms-item>
			<uni-forms-item name="title" label="页面标题">
				<uni-easyinput v-model="formData.title" />
			</uni-forms-item>
			<uni-forms-item name="parent_id" label="上级">
				<uni-data-checkbox v-model="formData.parent_id" collection="tian-pages"
					field="posid,title as text, _id as value" where="component=='tian-tab-pages' && title !=null"
					orderby="posid asc" />
				<button type="primary" size="mini" @click="formData.parent_id=''">取消上级</button>
			</uni-forms-item>
			<uni-forms-item name="city" label="城市编号">
				<uni-easyinput placeholder="市/区县编号" v-model="formData.city" />
				<view class="colorGray padding-top-12">
					<text>区县必须在城市管理内是推荐，否则前端无法定位到</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="state" label="是否显示">
				<uni-data-checkbox v-model="formData.state" :localdata="formOptions.state_localdata" />
			</uni-forms-item>
			<uni-forms-item name="posid" label="排序">
				<uni-easyinput type="number" v-model="formData.posid" />
			</uni-forms-item>

			<uni-forms-item name="app_id" label="应用">
				<uni-data-checkbox :multiple="true" v-model="formData.app_id" collection="opendb-app-list"
					field="name as text, appid as value" />
				<view class="colorGray padding-top-12">
					<text>不选择则为所有应用都有效</text>
				</view>
			</uni-forms-item>
			<uni-forms-item name="platforms" label="平台" required>
				<uni-data-checkbox :multiple="true" v-model="formData.platforms" collection="tian-platforms"
					field="text,value,sort" orderby="sort asc" />
				<text>必须选择一个平台</text>
			</uni-forms-item>
			<view class="items" v-if="formData.attributes">
				<uni-forms ref="formConfig" :value="formData.configs" validateTrigger="bind">
					<uni-forms-item v-for="(item,index) in formData.attributes" :name="index" :key="index"
						:label="item.title" labelWidth="90">
						<block v-if="item.enum">
							<uni-data-checkbox v-if="item.enum.collection" v-model="item.value"
								:collection="item.enum.collection" :field="item.enum.field" />
							<uni-data-checkbox v-else v-model="item.value" :localdata="item.enum" />
						</block>
						<uni-easyinput v-else-if="item.bsonType=='int'" type="number" v-model="item.value" />
						<uni-easyinput v-else-if="item.bsonType=='string'" v-model="item.value" />
						<cloud-image v-else-if="item.bsonType=='image'" v-model="item.value" />
						<switch v-else-if="item.bsonType=='bool'"
							@change="bindItemData(index, $event.detail.value,item)" :checked="!!item.value" />
						<view class="colorGray margin-top-10" v-if="item.description">
							<text>{{item.description}}</text>
						</view>
					</uni-forms-item>
				</uni-forms>
			</view>
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
	} from '../../js_sdk/validator/tian-pages.js';

	const db = uniCloud.database();
	const dbCmd = db.command;
	const dbCollectionName = 'tian-pages';

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
				assemblyList: [],
				assemblyMap: {},
				formData: {
					configs: {},
					"component": "",
					"title": "",
					"city": "",
					"items": [],
					"state": 0,
					begin_hours: 0,
					"begin_time": 0,
					"posid": 0,
					"parent_id": ""
				},
				formOptions: {
					"state_localdata": [{
							"text": "否",
							"value": 0
						},
						{
							"text": "是",
							"value": 1
						}
					],
				},
				rules: {
					...getValidator(["component", "title", "items", "state", 'begin_time', 'begin_hours', "posid",
						"parent_id"
					])
				}
			}
		},
		onLoad(e) {
			const id = e.id
			this.formDataId = id
			this.getDetail(id)
			// this.loadAssembly();
		},
		onReady() {
			this.$refs.form.setRules(this.rules)
		},
		methods: {
			bindItemData(key, value, item) {
				console.log(key, value, item)
				item.value = value;
			},
			/**
			 * 触发表单提交
			 */
			async submit() {
				let configs = {};
				if (this.formData.attributes) {
					// configs = await this.$refs.formConfig.validate()
					// console.log("configs", configs)
					for (let key in this.formData.attributes) {
						configs[key] = this.formData.attributes[key].value;
					}
				}
				uni.showLoading({
					mask: true
				})
				this.$refs.form.validate().then((res) => {
					res.configs = configs;
					this.submitForm(res)
				}).catch((errors) => {
					uni.hideLoading()
				})
			},

			submitForm(value) {
				// 使用 clientDB 提交数据
				db.collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
					this.getOpenerEventChannel().emit('refreshData')
					uni.showToast({
						title: '修改成功',
						mask: true
					})
					setTimeout(() => uni.navigateBack(), 2000)
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
				db.collection("tian-pages,tian-page-components").doc(id).field(
						'component,title,items,state,posid,parent_id,platforms,app_id,begin_time,city,configs,begin_hours')
					.get().then(
						(
							res) => {
							const item = res.result.data[0]
							if (item) {
								item.component = item.component[0];
								//处理属性，转换为对象
								if (typeof item.component.attributes == "string") {
									item.component.attributes = JSON.parse(item.component.attributes);
								}
								//填充默认值
								for (let key in item.component.attributes) {
									let attr = item.component.attributes[key];
									if (item.configs && item.configs[key]) {
										item.component.attributes[key].value = item.configs[key];
									} else if (attr.bsonType == "bool") {
										item.component.attributes[key].value = false;
									} else {
										item.component.attributes[key].value = item.component.attributes[key].defaultValue;
									}
								}
								item.attributes = item.component.attributes;
								item.component = item.component.component_id;
								console.log("item", item)
								if (!item.city) {
									item.city = ""
								}
								if (!item.parent_id) {
									item.parent_id = ""
								}
								this.formData = item
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
			loadAssembly() {
				db.collection("tian-page-components").orderBy("posid asc").where("is_page==true").limit(100).get().then(({
					result
				}) => {
					result.data.forEach(item => {
						//处理属性，转换为对象
						if (typeof item.attributes == "string") {
							item.attributes = JSON.parse(item.attributes);
						}
						this.assemblyMap[item.component_id] = item;
					})
					this.assemblyList = result.data;
					console.log("result", result.data)
				})
			},
		}
	}
</script>
