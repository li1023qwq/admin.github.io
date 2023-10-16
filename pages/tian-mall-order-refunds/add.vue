<template>
  <view class="uni-container">
    <uni-forms ref="form" :value="formData" validateTrigger="bind">
      <uni-forms-item name="create_time" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.create_time"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="update_time" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.update_time"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="operater_log" label="后台操作日志，0最新操作">
        <uni-data-checkbox :multiple="true" v-model="formData.operater_log"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="id" label="编号">
        <uni-easyinput type="number" v-model="formData.id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="order_id" label="订单编号">
        <uni-easyinput v-model="formData.order_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="type" label="售后类型">
        <uni-easyinput v-model="formData.type"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="reason" label="原因">
        <uni-easyinput v-model="formData.reason"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="goods_status" label="商品状态">
        <uni-easyinput v-model="formData.goods_status"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="shop_id" label="店铺id">
        <uni-easyinput v-model="formData.shop_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="describe" label="描述">
        <uni-easyinput v-model="formData.describe"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="imgs" label="图片描述">
        <uni-data-checkbox :multiple="true" v-model="formData.imgs"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="money" label="退款金额，单位分">
        <uni-easyinput type="number" v-model="formData.money"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="platform" label="操作平台">
        <uni-easyinput v-model="formData.platform"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="state" label="退款状态">
        <uni-easyinput placeholder="0申请中，1同意退款，2退款成功，-1拒绝" type="number" v-model="formData.state"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="user_id" label="用户">
        <uni-easyinput placeholder="用户" v-model="formData.user_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="goods" label="商品">
        <undefined v-model="formData.goods"></undefined>
      </uni-forms-item>
      <uni-forms-item name="shop" label="店铺信息">
        <undefined v-model="formData.shop"></undefined>
      </uni-forms-item>
      <uni-forms-item name="result" label="退款结果">
        <undefined v-model="formData.result"></undefined>
      </uni-forms-item>
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
  import { validator } from '../../js_sdk/validator/tian-mall-order-refunds.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'tian-mall-order-refunds';

  function getValidator(fields) {
    let result = {}
    for (let key in validator) {
      if (fields.includes(key)) {
        result[key] = validator[key]
      }
    }
    return result
  }

  export default {
    data() {
      let formData = {
        "create_time": null,
        "update_time": null,
        "operater_log": [],
        "id": null,
        "order_id": "",
        "type": "",
        "reason": "",
        "goods_status": "",
        "shop_id": "",
        "describe": "",
        "imgs": [],
        "money": null,
        "platform": "",
        "state": null,
        "user_id": "",
        "goods": null,
        "shop": null,
        "result": null
      }
      return {
        formData,
        formOptions: {},
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      /**
       * 验证表单并提交
       */
      submit() {
        uni.showLoading({
          mask: true
        })
        this.$refs.form.validate().then((res) => {
          return this.submitForm(res)
        }).catch(() => {
        }).finally(() => {
          uni.hideLoading()
        })
      },

      /**
       * 提交表单
       */
      submitForm(value) {
        // 使用 clientDB 提交数据
        return db.collection(dbCollectionName).add(value).then((res) => {
          uni.showToast({
            title: '新增成功'
          })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 500)
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        })
      }
    }
  }
</script>
