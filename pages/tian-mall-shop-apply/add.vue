<template>
  <view class="uni-container">
    <uni-forms ref="form" :value="formData" validateTrigger="bind">
      <uni-forms-item name="id" label="编号">
        <uni-easyinput placeholder="ID，系统自动生成" type="number" v-model="formData.id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="name" label="店铺名称" required>
        <uni-easyinput placeholder="" v-model="formData.name"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="phone" label="联系电话" required>
        <uni-easyinput placeholder="" v-model="formData.phone"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="src" label="店铺logo" required>
        <cloud-image name="src" v-model="formData.src" placeholder=""></cloud-image>
      </uni-forms-item>
      <uni-forms-item name="business_license" label="营业执照" required>
        <cloud-image name="business_license" v-model="formData.business_license" placeholder=""></cloud-image>
      </uni-forms-item>
      <uni-forms-item name="food_license" label="食品经营许可">
        <cloud-image name="food_license" v-model="formData.food_license" placeholder=""></cloud-image>
      </uni-forms-item>
      <uni-forms-item name="legal_person_license" label="法人身份证正面" required>
        <cloud-image name="legal_person_license" v-model="formData.legal_person_license" placeholder=""></cloud-image>
      </uni-forms-item>
      <uni-forms-item name="legal_person_license_back" label="法人身份证反面" required>
        <cloud-image name="legal_person_license_back" v-model="formData.legal_person_license_back" placeholder=""></cloud-image>
      </uni-forms-item>
      <uni-forms-item name="apply_result" label="审核结果">
        <uni-easyinput placeholder="" v-model="formData.apply_result"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="state" label="状态">
        <uni-data-checkbox v-model="formData.state" :localdata="formOptions.state_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="modified" label="">
        <uni-datetime-picker return-type="timestamp" v-model="formData.modified"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="address" label="地址">
        <undefined v-model="formData.address"></undefined>
      </uni-forms-item>
      <uni-forms-item name="uid" label="创建者">
        <uni-easyinput placeholder="" v-model="formData.uid"></uni-easyinput>
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
  import { validator } from '../../js_sdk/validator/tian-mall-shop-apply.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'tian-mall-shop-apply';

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
        "id": null,
        "name": "",
        "phone": "",
        "src": "",
        "business_license": "",
        "food_license": "",
        "legal_person_license": "",
        "legal_person_license_back": "",
        "apply_result": "",
        "state": 0,
        "modified": null,
        "address": null,
        "uid": ""
      }
      return {
        formData,
        formOptions: {
          "state_localdata": [
            {
              "text": "审核中",
              "value": 0
            },
            {
              "text": "通过",
              "value": 1
            },
            {
              "text": "拒绝",
              "value": 2
            }
          ]
        },
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
