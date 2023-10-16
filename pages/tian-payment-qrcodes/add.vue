
<template>
  <view class="uni-container">
    <uni-forms ref="form" :value="formData" validateTrigger="bind">
      <uni-forms-item name="total_fee" label="付款金额">
  <uni-easyinput type="number" v-model="formData.total_fee" />
</uni-forms-item>
<uni-forms-item name="rebate" label="返利金额">
  <uni-easyinput type="number" v-model="formData.rebate" />
</uni-forms-item>
<uni-forms-item name="user_id" label="用户">
  <uni-easyinput v-model="formData.user_id" />
</uni-forms-item>
<uni-forms-item name="shop_id" label="店铺">
  <uni-easyinput v-model="formData.shop_id" />
</uni-forms-item>
<uni-forms-item name="src" label="logo">
  <uni-easyinput v-model="formData.src" />
</uni-forms-item>
<uni-forms-item name="title" label="标题">
  <uni-easyinput v-model="formData.title" />
</uni-forms-item>
<uni-forms-item name="body" label="内容">
  <uni-easyinput v-model="formData.body" />
</uni-forms-item>
<uni-forms-item name="outTradeNo" label="支付订单号">
  <uni-easyinput v-model="formData.outTradeNo" />
</uni-forms-item>
<uni-forms-item name="state" label="状态">
  <uni-data-checkbox v-model="formData.state" :localdata="formOptions.state_localdata" />
</uni-forms-item>
<uni-forms-item name="id" label="订单id">
  <uni-easyinput type="number" v-model="formData.id" />
</uni-forms-item>
<uni-forms-item name="create_time" label="">
  <uni-datetime-picker return-type="timestamp" :value="formData.create_time" />
</uni-forms-item>
<uni-forms-item name="update_time" label="">
  <uni-datetime-picker return-type="timestamp" :value="formData.update_time" />
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
  import { validator } from '../../js_sdk/validator/tian-payment-qrcodes.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'tian-payment-qrcodes';

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
        formData: {
  "total_fee": null,
  "rebate": null,
  "user_id": "",
  "shop_id": "",
  "src": "",
  "title": "",
  "body": "",
  "outTradeNo": "",
  "shop": null,
  "payment": null,
  "payInfo": null,
  "state": 0,
  "id": null,
  "create_time": null,
  "update_time": null
},
        formOptions: {
  "state_localdata": [
    {
      "text": "未付款",
      "value": 0
    },
    {
      "text": "已付款",
      "value": 1
    }
  ]
},
        rules: {
          ...getValidator(["total_fee","rebate","user_id","shop_id","src","title","body","outTradeNo","shop","payment","payInfo","state","id","create_time","update_time"])
        }
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      /**
       * 触发表单提交
       */
      submit() {
        uni.showLoading({
          mask: true
        })
        this.$refs.form.submit().then((res) => {
          this.submitForm(res)
        }).catch((errors) => {
          uni.hideLoading()
        })
      },

      submitForm(value) {
        // 使用 clientDB 提交数据
        db.collection(dbCollectionName).add(value).then((res) => {
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
        }).finally(() => {
          uni.hideLoading()
        })
      }
    }
  }
</script>
