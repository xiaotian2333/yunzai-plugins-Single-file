// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file

import plugin from '../../lib/plugins/plugin.js'
import fetch from "node-fetch"

//是否允许私聊使用，设为false则禁止私聊使用（主人除外）
let group = true

export class ql extends plugin {
    constructor() {
        super({
            name: '清凉图',
            dsc: '图片',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '清凉图',
                    fnc: 'ql'
                },
                {
                    reg: '二元图',
                    fnc: 'yuan2'
                },
                {
                    reg: '三元图',
                    fnc: 'yuan3'
                },
                {
                    reg: 'r16',
                    fnc: 'r16'
                }
            ]
        })
    }

    async ql(e) {
        if (!group)
            if (e.isPrivate && !e.isMaster) {
                return true
            }
        let msg = e.msg
        msg = msg.replace(/清凉图/g)
        if (!msg) return
        e.reply(segment.image('https://imgapi.cn/cos.php'))
        return true
    }

    async yuan2(e) {
        if (!group)
            if (e.isPrivate && !e.isMaster) {
                return true
            }
        e.reply(segment.image('http://api.liangx.link/API/AGG.php'))
        return true
    }

    async yuan3(e) {
        if (!group)
            if (e.isPrivate && !e.isMaster) {
                return true
            }
        e.reply(segment.image('https://api.r10086.com/樱道随机图片api接口.php?图片系列=少女写真1'))
        return true
    }

    async r16(e) {
        if (!group)
            if (e.isPrivate && !e.isMaster) {
                return true
            }
        e.reply(segment.image('https://api.r10086.com/樱道随机图片api接口.php?图片系列=萝莉'))
        return true
    }
}