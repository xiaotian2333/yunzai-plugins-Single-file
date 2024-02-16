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
      name: '播放',
      // 功能描述
      dsc: '播放指定的音频链接',
      // 匹配的消息类型，参考https://oicqjs.github.io/oicq/#events
      event: 'message',
      // 优先级，数字越小等级越高
      priority: 5000,
      // 定义匹配词
      rule: [
        {
          // 命令正则匹配
          reg: '^播放',
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
    msg = msg.replace('播放', '');
    msg = msg.replace(/ /g, "");
    // 如果 msg 为空，则返回
    if (!msg) return
    // 输出日志
    logger.mark('[播放]处理完毕，链接：', msg)
    // 使用 reply 方法回复消息
    // e.reply(segment.record(msg)) //普通语音
    e.reply(await uploadRecord(msg,0,false)) //高清语音,参数说明 ：1.音频链接 2.音频时长 欺骗，0=关闭 3.压缩音质
    // 返回 true 拦截消息继续往下
    return true
}
}
