// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file

// API接口需要KEY，请先注册 
let key = 'UmxWMFdtcEZlWFl5VjFsalMwc3JLMWRVWVZWblFUMDk=' //53bd859c7703a7812c828fe768cfb27e

// 从 '../../lib/plugins/plugin.js' 文件中导入 plugin
import plugin from '../../lib/plugins/plugin.js'

// 定义一个名为 example 的类，继承自 plugin 类
export class example extends plugin {
  // 构造函数
  constructor () {
    // 调用父类的构造函数
    super({
      // 功能名称
      name: '点歌',
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
          reg: '^#?点歌.*$',
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
    msg = msg.replace('#', '');
    msg = msg.replace('点歌', '');
    msg = msg.replace(' ', '');
    // 如果 msg 为空，则返回
    if (!msg) {
      e.reply('点歌后跟上歌名，可点VIP歌曲')
      return true
    }
    fetch(`https://api.linhun.vip/api/qqyy?name=${msg}=1&n=1&apiKey=${key}`)
    .then(response => {
    if (!response.ok) {
      logger.erro('网络请求失败');
    }
    return response.json();
    })
  .then(data => {
    // 提取出data中的audioSrc并发送语音
    logger.debug('[点歌]获取到歌曲链接：',data.mp3)
    // this.e.reply(segment.record(data.mp3)) //普通语音
    e.reply(uploadRecord(data.mp3,0,false)) //高清语音,参数说明 ：1.音频链接 2.音频时长 欺骗，0=关闭 3.压缩音质
  })
  .catch(error => {
    //输出错误提示
    logger.error('获取错误：', error);
  });
    // 返回 true 拦截消息继续往下
    return true
  }
}
