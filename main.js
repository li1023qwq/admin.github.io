import Vue from 'vue'
import App from './App'
import store from './store'
import plugin from './js_sdk/uni-admin/plugin'
import messages from './i18n/index.js'
const lang = uni.getLocale()
console.log("lang", lang)
Vue.config.productionTip = false

import VueI18n from 'vue-i18n'
Vue.use(VueI18n)
// 通过选项创建 VueI18n 实例
const i18n = new VueI18n({
	locale: lang, // 设置地区
	messages, // 设置地区信息
})

import mixin from '@/common/js/mixin.js'
Vue.mixin(mixin)

Vue.use(plugin)

App.mpType = 'app'

const app = new Vue({
	i18n,
	store,
	...App
})
app.$mount()
