<template>
	<view class="banner-container" :class="[options.display]">
		<uni-forms ref="form" :value="formData" validate-trigger="bind" err-show-type="toast" style="padding: 0;"
			@validate="validate">
			<uni-forms-item v-for="(item,index) in dataList" :name="index" :key="index" :label="item.title"
				labelWidth="90">
				<block v-if="item.enum">
					<uni-data-checkbox v-if="item.enum.collection" v-model="item.value"
						:collection="item.enum.collection" :field="item.enum.field" />
					<uni-data-checkbox v-else v-model="item.value" :localdata="item.enum" />
				</block>
				<uni-easyinput v-else-if="item.bsonType=='int'" type="number" v-model="item.value" />
				<uni-easyinput v-else-if="item.bsonType=='string'" v-model="item.value" />
				<cloud-image v-else-if="item.bsonType=='image'" v-model="item.value" />
				<switch v-else-if="item.bsonType=='bool'" @change="bindItemData(index, $event.detail.value,item)"
					:checked="!!item.value" />
				<view class="colorGray margin-top-10" v-if="item.description">
					<text>{{item.description}}</text>
				</view>
			</uni-forms-item>
		</uni-forms>
	</view>
</template>
<script>
	const db = uniCloud.database();
	/**
	 * 
	 */
	export default {
		data() {
			return {
				formData: {},
				where: "",
				dataList: {},
				current: 0,
				options: {
					display: "default",
					mode: "default",
				}
			}
		},
		props: {
			value: {
				type: Object,
				default: () => {
					//动态读取
					return {}
				}
			},
			configs: {
				type: Object,
				default: () => {
					//动态读取
					return {}
				}
			},
			items: {
				type: Object,
				default: () => {
					//静态显示
					return []
				}
			}
		},
		watch: {
			items(newVal) {
				// console.log("watch items");
				this.setItems(newVal)
			}
		},
		created() {
			if (this.configs) {
				//动态读取
				this.options = Object.assign(this.options, {
					...this.configs
				})
			}
			// console.log("this.items", this.items)
			//静态数据
			this.setItems(this.items)
		},
		methods: {
			validate(e) {
				console.log("validate", e)
			},
			formatValue(item) {
				if (item.bsonType == "int") {
					item.value = parseInt(item.value)
				} else if (item.bsonType == "double" || item.bsonType == "float") {
					item.value = parseFloat(item.value)
				} else if (item.bsonType == "bool") {
					item.value = !!item.value
				}
			},
			bindItemData(key, value, item) {
				item.value = value;
			},
			setItems(data) {
				this.dataList = {}
				this.$nextTick(() => {
					for (let key in data) {
						let attr = data[key];
						if (attr.defaultValue) {
							data[key].value = attr.defaultValue;
						} else if (attr.bsonType == "bool") {
							data[key].value = false;
						} else {
							data[key].value = "";
						}
					}
					this.dataList = data;
				})
			},
			getValue() {
				let out = {}
				for (let key in this.dataList) {
					let item = this.dataList[key];
					this.formatValue(item);
					out[item.title] = item.value;
				}
				console.log(out)
				return out;
			}
		}
	}
</script>
<style lang="scss">
</style>
