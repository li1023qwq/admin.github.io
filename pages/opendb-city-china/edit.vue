
<template>
  <view class="uni-container">
    <uni-forms ref="form" :value="formData" validateTrigger="bind">
      <uni-forms-item name="code" label="编码" required>
  <uni-easyinput v-model="formData.code" />
</uni-forms-item>
<uni-forms-item name="parent_code" label="父级编码">
  <uni-easyinput v-model="formData.parent_code" />
</uni-forms-item>
<uni-forms-item name="name" label="城市" required>
  <uni-easyinput placeholder="城市名称" v-model="formData.name" />
</uni-forms-item>
<uni-forms-item name="type" label="城市类型">
  <uni-data-checkbox v-model="formData.type" :localdata="formOptions.type_localdata" />
</uni-forms-item>
<uni-forms-item name="first_letter" label="首字母">
  <uni-easyinput placeholder="拼音首字母" v-model="formData.first_letter" />
</uni-forms-item>
<uni-forms-item name="is_recommend" label="是否推荐">
  <switch @change="binddata('is_recommend', $event.detail.value)" :checked="formData.is_recommend" />
</uni-forms-item>
<uni-forms-item name="pinyin" label="拼音">
  <uni-easyinput placeholder="城市名称的完整汉语拼音，用于拼音检索" v-model="formData.pinyin" />
</uni-forms-item>
<uni-forms-item name="zip_code" label="邮编">
  <uni-easyinput placeholder="邮政编码" v-model="formData.zip_code" />
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
  import { validator } from '../../js_sdk/validator/opendb-city-china.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'opendb-city-china';

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
  "code": "",
  "parent_code": "",
  "name": "",
  "type": 0,
  "first_letter": "",
  "is_recommend": null,
  "pinyin": "",
  "zip_code": ""
},
        formOptions: {
  "type_localdata": [
    {
      "text": "省",
      "value": 0
    },
    {
      "text": "市",
      "value": 1
    },
    {
      "text": "区",
      "value": 2
    }
  ]
},
        rules: {
          ...getValidator(["code","parent_code","name","type","first_letter","is_recommend","pinyin","zip_code"])
        }
      }
    },
    onLoad(e) {
      const id = e.id
      this.formDataId = id
      this.getDetail(id)
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
        db.collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
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

      /**
       * 获取表单数据
       * @param {Object} id
       */
      getDetail(id) {
        uni.showLoading({
          mask: true
        })
        db.collection(dbCollectionName).doc(id).field('code,parent_code,name,type,first_letter,is_recommend,pinyin,zip_code').get().then((res) => {
          const data = res.result.data[0]
          if (data) {
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
      }
    }
  }
</script>

