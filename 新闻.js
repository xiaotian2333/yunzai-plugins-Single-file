import plugin from '../../lib/plugins/plugin.js'

export class news extends plugin {
    constructor() {
        super({
            name: '新闻',
            dsc: '每日60秒新闻，数据来自《每天60秒读懂世界》公众号',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '^#?新闻.*$',
                    fnc: 'news'
                }
            ]
        })
    }

    async news(e) {
        e.reply(segment.image('https://api.jun.la/60s.php?format=image'))
        return true
    }
}