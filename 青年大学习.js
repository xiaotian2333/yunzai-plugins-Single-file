import plugin from '../../lib/plugins/plugin.js'
import fetch from "node-fetch"

const _path = process.cwd()
//是否允许私聊使用，设为false则禁止私聊使用（主人除外）
let group = true

export class qndxx extends plugin {
    constructor() {
        super({
            name: '青年大学习',
            dsc: '截图',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '#青年大学习',
                    fnc: 'qndxx'
                }
            ]
        })
    }

    async qndxx(e) {
        if (!group)
            if (e.isPrivate && !e.isMaster) {
                return true
            }
        let msg = e.msg
        msg = msg.replace(/青年/g, "大学习")
        if (!msg) return
        let url = 'https://quickso.cn/api/qndxx/api.php?sort=random'
        let response = await fetch(url)
        let res = await response.text()
        res = res.replace(/<\/br>/g, '').trim()
        e.reply(segment.image('https://' + res))
        return true
    }
}