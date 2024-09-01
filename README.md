# 云崽轻量级插件

## 关于喵崽V4的相关说明

所有插件均不支持喵崽V4  
由于喵崽V4仍在开发阶段，短期内无升级计划

如有问题可加Q群提问 [628306033](https://jq.qq.com/?k=fjSGhscz)

## 安装方式

下载对应文件放入 `plugins\example` 文件夹即可

## 插件介绍

排名按编写时间排序

### GH仓库

在检测到github链接时发送仓库速览图  
速览图如下

![示例图](https://opengraph.githubassets.com/xiaotian/xiaotian2333/yunzai-plugins-Single-file)

### 唱鸭

随机返回一段唱鸭的音频片段

> 需安装 ffmpeg 否则无法生效，默认开启高清语音，需安装枫叶，土块等包含高清语音的插件或独立的[高清语音模块](https://github.com/xiaotian2333/YunzaiBOT-HD-Voice-module)

### 青年大学习

发送青年大学习即可获取完成图

### 清凉图

返回一些清凉的图片  
可自己更换接口  
目前有4个触发词

``` 触发词
清凉图 - 分级大概为12+
二元图 - 二次元相关的图片
三元图 - 三次元相关的图片
r16 - 分级大概为16+
```

TODO

- [ ] 可配置多个接口，触发时随机选择

### 播放

发送播放后跟上音频的链接即可

> 需安装 ffmpeg 否则无法生效，默认开启高清语音，需安装枫叶，土块等包含高清语音的插件或独立的[高清语音模块](https://github.com/xiaotian2333/YunzaiBOT-HD-Voice-module)

### 新闻

发送新闻即可，数据来自《每天60秒读懂世界》公众号 [接口作者原文](https://www.jun.la/collect/1582.html)

### 签名状态检测

检测各签名服务的可用性，可修改插件内的配置自定义

### 综合帮助

发送一张帮助图片，聚合各菜单的入口（图片需自己生成）  
图片生成方式：使用锅巴备份喵喵插件，然后改里面的文案，发送帮助保存图片就行了。最后把备份的还原回去

### MCSM管理器

对接 mcsm 控制面板，通过 api 进行控制  
需自行填写 key 和 url
> **这个插件仍未开发完成，仅上传存档**

### 点赞续火

自动化点赞和续火，免去每天发“赞我”的麻烦  
需要打开插件自行修改相关配置

### MC服务器状态

查询mc服务器的状态，可配置默认查询的服务器  
目前仅支持java版

TODO

- [ ] 支持基岩版

### 小姐姐视频

随机发送一个小姐姐视频  
感谢桑帛云API

### 米游社cos

获取米游社里的cos帖子并合并发送里面的图片或视频  
二改自[此插件](https://gitee.com/bling_yshs/yunzaiv3-ys-plugin/blob/master/ys-%E7%B1%B3%E6%B8%B8%E7%A4%BEcos.js)  

要发送的图片/视频在超过一定大小后会提示，避免误以为机器人无反应  
大宽带的服务器可以关闭或修改提示的阈值  
如果觉得一张图片直接发送有割裂感，可以到配置项里禁用单张图片独立发送  

新增定时发送功能，需自行配置要发送到的群或人  
发送时间也可自定义，看着注释改就行  

### 随机超能力

获取一个超能力及对应的副作用  
内容仅供娱乐！！！
默认开启大众模式，放心使用
可选开启pro模式，会有更多能力及作用被加入
支持本地语句，需自行配置

可以前往[投稿专用帖](https://github.com/xiaotian2333/yunzai-plugins-Single-file/discussions/3)进行投稿，但是请注意投稿要求

## 开源协议

还没想好用什么开源协议，暂时不添加
