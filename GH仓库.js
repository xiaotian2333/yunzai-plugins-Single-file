// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file


// 定义调用接口
const baseurl = 'https://opengraph.githubassets.com/xiaotian'

export class example extends plugin {
  constructor() {
    super({
      name: 'GH仓库',
      dsc: '检测到github链接时发送仓库速览图',
      // 匹配的消息类型，参考https://oicqjs.github.io/oicq/#events
      event: 'message',
      priority: 3000,
      rule: [
        {
          reg: '^(https://|http://)?github.com/[a-zA-Z0-9-]{1,39}/[a-zA-Z0-9_-]{1,100}(.git)?',
          fnc: 'start'
        }
      ]
    })
  }

  async start(e) {
    // 简化消息变量，同时方便调用
    let msg = e.msg
    // 删除不需要的部分
    msg = msg.replace('https://', '')
    msg = msg.replace('http://', '')
    msg = msg.replace('.git', '')

    // 如果 msg 为空，则返回
    if (!msg) return

    // 提取用户名字段
    const name = msg.split('/')[1]
    // 提取仓库名字段
    const repo = msg.split('/')[2]
    // 构建完整的URL
    let url = baseurl + '/' + name + '/' + repo

    // 提取issues或pull request字段
    const issueOrPR = msg.split('/')[3]
    if (issueOrPR == 'issues' || issueOrPR == 'pull') {
      const Quantity = msg.split('/')[4];
      // 如果是数字，则添加到url
      if (Quantity && /^\d+$/.test(Quantity)) {
        url += '/' + issueOrPR + '/' + Quantity
      }
    }

    // 发送消息
    e.reply(segment.image(url))
    return true
  }
}