/**
* 作者：xiaotian2333
* 开源地址：https://github.com/xiaotian2333/yunzai-plugins-Single-file
*/

import fetch from "node-fetch"

// 智谱API Key，需要自行申请(需实名)
// 申请链接：https://www.bigmodel.cn/invite?icode=iGW2wQ0KiXGc0PVU%2BeTSFEjPr3uHog9F4g5tjuOUqno%3D
// 绘图必须填写key，否则无法使用
const Authorization = "" //智谱API Key
const url = "https://open.bigmodel.cn/api/paas/v4/images/generations" //智谱API接口,不要修改
const model = "CogView-4" //模型名称
//图像分辨率
const size = [
    "1024x1024",
    "768x1344",
    "864x1152",
    "1344x768",
    "1152x864",
    "1440x720",
    "720x1440"
]
// 过滤词列表
const list = [
    '过滤词列表-156411gfchc',
    '模糊匹配-15615156htdy1',
]


export class bigmodel extends plugin {
    constructor() {
        super({
            name: '智谱绘图',
            event: 'message',
            priority: 2000,
            rule: [
                {
                    reg: '^#?绘(个)?图(.*)',
                    fnc: 'chat'
                }
            ]
        })
    }

    async chat(e) {
        //if (!e.isMaster) { return false } // 只允许主人使用

        if (!Authorization) {
            e.reply("智谱API Key未设置，请参照注释设置后重试")
            return true
        }

        // 删除不需要的部分
        let msg = e.msg
        msg = msg.replace(' ', '');

        // 输入过滤
        if (list.some(item => msg.includes(item))) {
            // 检测到需要过滤的词后的处理逻辑，默认不理人
            logger.info(`[智谱绘图]检测到敏感词，已过滤`)
            e.reply("输入包含敏感词，已拦截")
            return true
        }

        // 如果 msg 为空，则返回
        if (!msg) {
            e.reply('请输入绘图提示词')
            return false
        }
        // 消息长度限制
        if (msg.length > 1000) {
            e.reply('输入文本长度过长')
            return true
        }


        const data = {
            "model": `${model}`,
            "prompt": msg,
            "size": size[Math.floor(Math.random() * size.length)],
            "user_id": `${e.group_id}_${e.user_id}`,

        }

        let Reply = await fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": Authorization,
                "User-Agent": "GLM (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)"
            },
            body: JSON.stringify(data)
        })
        Reply = await Reply.json()

        // 内容安全相关
        if (Reply.content_filter) {
            const role_list = {
                "user": "用户",
                "assistant": "模型",
                "history": "历史"
            }
            if (Reply.content_filter.level >= 2) {
                // 轻度敏感
                logger.mark("[智谱绘图]${role_list[Reply.content_filter.role]}内容包含轻微敏感信息，不直接发送图片")
                e.reply(`${role_list[Reply.content_filter.role]}内容包含轻微敏感信息，不直接发送图片\n${Reply.data[0].url}`)
                return true
            }
            // 高度敏感
            e.reply(`${role_list[Reply.content_filter.role]}内容包含高度敏感信息，拦截发送`)
            logger.warn(`[智谱绘图]${role_list[Reply.content_filter.role]}内容包含高度敏感信息，拦截发送：${Reply.data[0].url}`)
            return true
        }
        // 发送图片
        e.reply(segment.image(Reply.data[0].url))
        return true
    }
}