// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file

// help图片生成方式：使用锅巴备份喵喵插件，然后改里面的文案，发送帮助保存图片就行了。最后把备份的还原回去
import plugin from '../../lib/plugins/plugin.js'

export class help extends plugin {
    constructor() {
        super({
            name: '综合帮助',
            dsc: '发送综合帮助图片',
            event: 'message',
            priority: -99999,
            rule: [
                {
                    reg: /^#?(云崽)?(命令|帮助|菜单|help|说明|功能|指令|使用说明)$/,
                    fnc: 'help'
                }
            ]
        })
    }

    async help(e) {
        e.reply(segment.image('C:/BOT/Yunzai-Bot-res/resources/help.jpg'))
        return true
    }
}