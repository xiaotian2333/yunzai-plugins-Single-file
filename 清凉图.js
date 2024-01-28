import plugin from '../../lib/plugins/plugin.js'
import fetch from "node-fetch"

const _path = process.cwd()
//是否允许私聊使用，设为false则禁止私聊使用（主人除外）
let group = true

export class qndxx extends plugin {
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
        e.reply(segment.image('https://api.r10086.com/樱道随机图片api接口.php?图片系列=少女写真1'))
        return true
    }
}