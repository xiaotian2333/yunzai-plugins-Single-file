// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file


import plugin from '../../lib/plugins/plugin.js'

export class example extends plugin {
  constructor () {
    super({
      name: '小姐姐视频',
      dsc: '发送随机小姐姐视频',
      // 匹配的消息类型，参考https://oicqjs.github.io/oicq/#events
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^#?小姐姐视频',
          fnc: 'start'
        }
      ]
    })
  }

  async start(e) {
    e.reply(segment.video('https://api.lolimi.cn/API/xjj/xjj.php'))
    return true
}
}
