// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file


// 从 '../../lib/plugins/plugin.js' 文件中导入 plugin
import plugin from '../../lib/plugins/plugin.js'

// 定义一个名为 example 的类，继承自 plugin 类
export class example extends plugin {
  // 构造函数
  constructor () {
    // 调用父类的构造函数
    super({
      // 功能名称
      name: 'GH仓库',
      // 功能描述
      dsc: '检测到github链接时发送仓库速览图',
      // 匹配的消息类型，参考https://oicqjs.github.io/oicq/#events
      event: 'message',
      // 优先级，数字越小等级越高
      priority: 5000,
      // 定义匹配词
      rule: [
        {
          // 命令正则匹配
          reg: '^(https://|http://)?github.com/[a-zA-Z0-9-]{1,39}/[a-zA-Z0-9_-]{1,100}(.git)?$',
          // 执行方法
          fnc: 'start'
        }
      ]
    })
  }

  async start(e) {
    // 简化消息变量，同时方便调用
    let msg = e.msg
    // 删除不需要的部分
    msg = msg.replace('https://', '');
    msg = msg.replace('http://', '');
    msg = msg.replace('.git', '');
    // 如果 msg 为空，则返回
    if (!msg) return
    // 提取用户名字段
    let name = msg.split('/')[1];
    // 提取仓库名字段
    let repo = msg.split('/')[2];
    // 定义调用就接口
    let url = 'opengraph.githubassets.com/xiaotian'
    // 输出日志
    logger.mark('[处理完毕]', 'https://' + url + '/' + name + '/' + repo)
    // 使用 reply 方法回复消息
    e.reply(segment.image('https://' + url + '/' + name + '/' + repo))
    // 返回 true 拦截消息继续往下
    return true
}
}
