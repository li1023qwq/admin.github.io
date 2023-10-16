# uni-puglish-page-admin 发布页

### 概述

> 负责应用发布信息的管理。

<!-- TODO 修改插件地址 -->

> 本插件为发布页后台管理系统，前台展示页面请点击查看 [uni-publish-page](https://ext.dcloud.net.cn/plugin?id=4542)

### 基于 uniCloud 的 App 发布页，本插件具有如下特征：

- 云端基于 uniCloud 云函数实现
- 数据库遵循 opendb 规范
- 遵循 uni-admin 框架规范，可直接导入 Admin 项目中
- 支持 App、小程序、H5、快应用 灵活修改发布，实时线上更新

## 什么是 uniCloud

uniCloud 是 DCloud 联合阿里云、腾讯云，为开发者提供的基于 serverless 模式和 js 编程的云开发平台，更多请参考[uniCloud 文档](https://uniapp.dcloud.io/uniCloud)。

## 解决了什么问题？

uni-puglish-page-admin 是一款 uni-admin 插件，负责应用发布信息管理。包含管理界面、各平台信息填写，前台展示页面请求做相应的效果展示。

有以下功能点：

- 应用管理，对应用的发布信息记录和管理
- 发布管理，可方便直观的对当前 App 以及上线应用进行新增、编辑和删除操作
- 与 `升级中心` 的数据联动，方便快捷

只需导入插件，初始化数据库即可拥有上述功能。

您也可以自己修改逻辑自定义数据库字段，和随意定制 UI 样式。

## 安装指引

1. 使用`HBuilderX 3.1.0+`，因为要使用到`uni_modules`

2. 使用已有`uni-admin`项目或新建项目：`打开HBuilderX` -> `文件` -> `新建` -> `项目` -> `uni-app` 选择 `uni-admin`模板，键入一个名字，确定

3. 鼠标右键选择`关联云服务空间`和`运行云服务空间初始化向导`

4. 在插件市场打开本插件页面，在右侧点击`使用 HBuilderX 导入插件`，选择 `uni-admin` 项目点击确定

5. 等待下载安装完毕。由于本插件依赖一些 uni-ui 插件，下载完成后会显示合并插件页面，自行选择即可

6. 找到`/uni_modules/uni-publish-page-admin/uniCloud/cloudfunctions`，右键上传所有云函数

7. 找到`/uni_modules/uni-publish-page-admin/uniCloud/database/db_init.json`，右键初始化数据库

8. 在`pages.json`中添加页面路径

   ```json
   //此结构与uni-admin中的pages.json结构一致
   "pages": [
         // ……其他页面配置
         {
           "path" : "uni_modules/uni-publish-page-admin/pages/app/list",
           "style" :{
               "navigationBarTitleText": "发行列表",
               "enablePullDownRefresh": false
           }
         },
         {
           "path" : "uni_modules/uni-publish-page-admin/pages/app/add",
           "style" :{
               "navigationBarTitleText": "新增发行",
               "enablePullDownRefresh": false
           }
         }
   ]
   ```

9. 在`manifest.json -> 源码视图`中添加以下配置：

   ```js
   "networkTimeout":{
   	"uploadFile":1200000	//ms， 如果不配置，上传大文件可能会超时
   }
   ```

10. 运行项目到`Chrome`

11. 运行起来 uni-admin，菜单管理模块会自动读取`/uni_modules/uni-publish-page-admin/menu.json`文件中的菜单配置，生成【待添加菜单】，选中`应用发行`，点击`添加选中的菜单`即可

    <div align="center">
    <img src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-8ed92fab-502d-4290-af3c-1d65c4dbfc4d/9e80f9ef-aa1f-4385-a342-1604abe263a2.png" width="800"></img>
    </div>

12. 添加成功后，就可以在左侧的菜单栏中找到`应用发行`菜单

    <div align="center">
    <img src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-8ed92fab-502d-4290-af3c-1d65c4dbfc4d/61468ed1-7136-40a0-b4f6-a4a95b1ee2ec.png" width="200"></img>
    </div>

13. 由于插件依赖的 uni-ui 的一些组件，建议右键`/uni_modules/uni-publish-page-admin`安装一下第三方依赖，否则可能会出现一些问题

14. 运行在`uniCloud`，由于本插件使用了`clientDB`，因此可能需要配置一下`uni-config-center插件`关于`uni-id`的配置信息。如提示`公用模块uni-id缺少配置信息`请这样做：

    1. 点击[uni-config-center](https://ext.dcloud.net.cn/plugin?id=4425)导入插件
    2. 在`/uniCloud/cloudfunctions/common/uni-config-center/`下创建`uni-id`文件夹，文件夹内创建`config.json`文件。
    3. 点击[config.json 默认配置](https://uniapp.dcloud.net.cn/uniCloud/uni-id?id=start)。将内容拷贝至`config.json`中。

    **注：一定要把注释去除！**

## 使用指南

### 应用发行

#### 应用列表

1. 点击菜单`应用发行`进入`应用管理`，这里展示你所添加的 App

   - 可以在列表的操作列进行`更新`应用信息或者`删除`该应用。
   - 默认`发行`状态排序优先

    <div align="center">
      <img src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-8ed92fab-502d-4290-af3c-1d65c4dbfc4d/31110f50-1b09-4a50-9d43-7f7436d96c1d.png" width="800"></img>
    </div>

**Tips**

- 修改时，删除应用上传的包并不能把云存储中的文件删除，请到[uniCloud web 控制台](https://unicloud.dcloud.net.cn/)手动删除

#### 新增应用发布信息

> 在应用列表的右上角点击`新增`，可以新增一个应用发布信息

- ##### 基础信息

  <div align="center">
    <img src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-8ed92fab-502d-4290-af3c-1d65c4dbfc4d/cc90c01a-c0ec-4081-bd4c-3fb588ea5370.png" width="800"></img>
  </div>

  1. `AppID`：所要发布的 app 的 id。唯一。
  2. `应用别名`：前台展示页面会通过此字段来做请求，仅限英文。唯一。
  3. `自动填充`：如果你的`uni-admin`项目同时使用了[升级中心](https://ext.dcloud.net.cn/plugin?id=4470)，那么当你填写了`AppID`点击按钮后，会自动从`升级中心`同步 App 的一些信息。

- ##### App 下载信息

  <div align="center">
    <img src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-8ed92fab-502d-4290-af3c-1d65c4dbfc4d/863f6e58-47cd-43cd-8e69-c20e57c8333a.png" width="800"></img>
  </div>

  1. 可以选择手动填写还是上传安装包到云存储自动填写下载链接
  2. 勾选代表需要发布此类信息，不勾选会默认折叠
  3. `自动填充`：如果你的`uni-admin`项目同时使用了[升级中心](https://ext.dcloud.net.cn/plugin?id=4470)，那么当你填写了`AppID`点击按钮后，会自动从`升级中心`同步 App 当前已上线的安装包信息。

- ##### 小程序信息

  <div align="center">
    <img src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-8ed92fab-502d-4290-af3c-1d65c4dbfc4d/0730908e-f568-4d21-8aaa-e1e4e4f919a4.png" width="800"></img>
  </div>

  1. `折叠`：小程序种类繁多，此按钮可以将所有的小程序信息折叠起来

- ##### H5、快应用

  <div align="center">
    <img src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-8ed92fab-502d-4290-af3c-1d65c4dbfc4d/04dcf0a7-eb58-427e-a2f8-0599948f542e.png" width="800"></img>
  </div>

  1. `H5`：当你填写了链接，才会在前台展示页面显示
  2. `快应用`：只有填写了`快应用码`，才会在前台页面展示

## 项目代码说明

### uniCloud 数据表

数据表基于 [openDB](https://gitee.com/dcloud/opendb/tree/master) 规范，它约定了一个标准用户表的表名和字段定义，并且基于 nosql 的特性，可以由开发者自行扩展字段。

本项目用到了 1 个表：

- opendb-app-publish：应用发布管理表。记录管理应用的发布信息。[详见](https://gitee.com/dcloud/opendb/tree/master/collection/opendb-app-publish)
