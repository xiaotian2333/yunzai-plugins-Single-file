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

### 综合帮助

发送一张帮助图片，聚合各菜单的入口（图片需自己生成）  
图片生成方式：使用锅巴备份喵喵插件，然后改里面的文案，发送帮助保存图片就行了。最后把备份的还原回去

### 点赞续火

自动化点赞和续火，免去每天发“赞我”的麻烦  
需要打开插件自行修改相关配置

### MC服务器状态

查询mc服务器的状态，可配置默认查询的服务器  
目前仅支持java版

### 米游社cos

获取米游社里的cos帖子并合并发送里面的图片或视频  
二改自[此插件](https://gitee.com/bling_yshs/yunzaiv3-ys-plugin/blob/master/ys-%E7%B1%B3%E6%B8%B8%E7%A4%BEcos.js)  

要发送的图片/视频在超过一定大小后会提示，避免误以为机器人无反应  
大宽带的服务器可以关闭或修改提示的阈值  

新增定时发送功能，需自行配置要发送到的群或人  
发送时间也可自定义，看着注释改就行  

### 随机超能力

此插件的单文件版本已停止更新，请[前往此处](https://github.com/xiaotian2333/special-ability)安装新版本  
单文件版本仍然可用，但不会获得任何更新支持（云列表更新可正常获取）

获取一个超能力及对应的副作用  
内容仅供娱乐！！！  
默认开启大众模式，放心使用  
可选开启pro模式，会有更多能力及作用被加入  
支持本地语句，需自行配置  

### 文案

聚合各类文案api

- 每日一句 - 金山词霸每日一句，发送图片及对应的英语语音，发送音频需要[高清语音模块](https://github.com/xiaotian2333/YunzaiBOT-HD-Voice-module)

- 一言 - 一言文案

- 青年大学习 - 发送青年大学习即可获取完成图

- 新闻 - 数据来自《每天60秒读懂世界》公众号 [接口作者原文](https://www.jun.la/collect/1582.html)

### 快举报

此插件的单文件版本已停止更新，请[前往此处](https://github.com/xiaotian2333/xiaotian-qunguan)安装新版本  
单文件版本仍然可用，但不会获得任何更新支持

在群内快速便捷地向管理员举报违规行为  
灵感来源为简幻欢群机器人，但代码均为原创  

发送快举报，按流程使用即可

### 快讯

获取实时快讯，数据来源微信订阅号

有定时发送功能，需自行配置要发送到的群或人  
发送时间也可自定义，看着注释改就行  

### 智谱GLM

基于智谱大模型的聊天插件  
默认使用`glm-4-flash-250414`模型

支持开箱即用，但仍建议配置自己的key  

直接艾特机器人即可对话  
可发送 `#重置对话` 清除聊天记录  
管理员可使用 `#智谱切换预设` 切换预设  
使用 `#智谱预设列表` 查看预设列表  

管理员可使用 `#智谱切换模型` 可在机器人运行时临时切换模型  
使用 `#智谱模型列表` 查看模型列表  

插件初次加载时自动下载云端配置文件  
默认数据目录为`./data/plugins/智谱GLM/`  

支持统计每日token用量，并于每日0点自动导出昨日统计到数据目录  

<details>
<summary>默认格式</summary>

此处展示的文本限于篇幅，大幅精简且不会实时更新  
如需查看原始文件请点击对应的链接查看  

[system_prompt.json](https://oss.xt-url.com/GPT-Config/system_prompt.json)

``` json
{
    "预设名1": "预设内容1",
    "预设名2": "预设内容2"
}
```

[model_list.json](https://oss.xt-url.com/GPT-Config/model_list.json)

``` json
{
    "data": "2025年5月4日",
    "version": "1.2.2",
    "author": "xiaotian2333",
    "tips": [
        "每日token统计信息可在插件数据目录token_log.csv查看"
    ],
    "bigmodel": {
        "name": "智谱",
        "url": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        "instructions": "模型价格为官网公示价格",
        "model_list": {
            "glm-4-flash-250414": {
                "instructions": "免费的语言模型",
                "Price": "免费",
                "free": true,
                "type": "语言模型"
            },
            "glm-z1-air": {
                "instructions": "具备强大推理能力，适用于需要深度推理的任务",
                "Price": "0.5元|百万Tokens",
                "free": false,
                "type": "推理模型"
            },
            "codegeex-4": {
                "instructions": "代码优化模型，专为程序员准备",
                "Price": "0.1元|百万Tokens",
                "free": false,
                "type": "代码模型"
            }
        }
    }
}
```

</details>

#### 可配置的参数如下

| 设置项 | 默认设置 | 说明 |
| --- | --- | --- |
| Authorization | 空 | `API Key` 如不填则默认使用沉浸式翻译的Token |
| model | glm-4-flash-250414 | 默认模型版本，可配置项参考[这里](https://www.bigmodel.cn/dev/howuse/model) |
| web_search | false | 是否开启联网功能，联网搜索至少需要消耗`1000`token |
| search_engine | search_std | 使用哪个搜索引擎，可配置项参考[这里](https://www.bigmodel.cn/pricing) |
| max_log | 10 | 聊天记忆深度，建议范围5~20 |
| think_print | true | 支持思考的模型是否输出思考过程 |
| system_prompt | 详情见配置文件 | 系统提示词可参考[这里](https://www.bigmodel.cn/dev/howuse/prompt) |
| list | 详情见源码 | 屏蔽词列表，用于过滤敏感词 |

> 从2025年6月1日0点起，联网功能收费单价为0.01元/次，因此改为默认关闭

### 智谱绘图

基于智谱大模型的绘图插件  
默认使用`CogView-4`模型

需要配置自己的key，否则无法使用
前往[智谱官网](https://www.bigmodel.cn/invite?icode=iGW2wQ0KiXGc0PVU%2BeTSFEjPr3uHog9F4g5tjuOUqno%3D)申请即可

> 新用户赠送400次免费额度，使用完毕后可换成免费模型或继续付费使用

#### 可配置的参数如下

| 设置项 | 默认设置 | 说明 |
| --- | --- | --- |
| Authorization | 空 | `API Key` 如不填则无法使用 |
| model | CogView-4 | 模型版本，可配置项参考[这里](https://www.bigmodel.cn/dev/howuse/model) |
| list | 详情见源码 | 屏蔽词列表，用于过滤敏感词 |

## 非常规插件

此类插件仅供参考使用

<details>
<summary>点击展开</summary>

### Demo类

这里都是一些插件开发示例，仅用于参考  

存放于 Demo 文件夹下  
进入文件夹后有详细说明

### 已归档的插件

这里存放的是一些已经不再维护的插件  
仅供参考使用，无法保证可用性

存放于 Archive 文件夹下  
进入文件夹后有详细说明

### 已放弃开发的插件

这里存放的是一些已经放弃开发的插件  
仅供参考使用，无法保证可用性

存放于 Abandon 文件夹下  
进入文件夹后有详细说明

</details>

## 开源协议

还没想好用什么开源协议，暂时不添加
