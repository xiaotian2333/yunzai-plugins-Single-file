// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file

import plugin from '../../lib/plugins/plugin.js'

/**默认服务器，没有发送域名/ip时使用 */
const Default_server = 'mc.xt-url.com'
/**使用默认查询时的提示 */
const Default_Tips = '没有发送服务器信息，查询默认服务器'

/**进行正则表达式匹配，过滤非域名或ip的触发，不懂别乱动 */
const Domain = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?$/ // 匹配域名，支持带端口号
const ip = /\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b(?:\:\d{1,5})?/ //匹配ip，支持端口号

export class example extends plugin {
  constructor() {
    super({
      name: 'mc服务器状态',
      dsc: '通过api获取mc-java服务器的状态',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '^#?(mc|MC|Mc|我的世界|java|jv|minecraft|Minecraft)(服务器|版)?(状态情况|状态|情况)',
        fnc: 'java'
      }]
    })
  }

  async java(e) {
    // 简化消息变量，同时方便调用
    let msg = e.msg
    // 删除不需要的部分
    msg = msg.replace(/#?(mc|MC|Mc|我的世界|java|jv|minecraft|Minecraft)(服务器|版)?(状态情况|状态|情况)/g, '')
    // 没有发送服务器信息，使用默认参数
    if (msg == '') {
      e.reply(Default_Tips)
      msg = Default_server
    }

    // 使用test方法检查字符串是否符合正则表达式
    if (Domain.test(msg) || ip.test(msg)) {
      fetch(`https://api.mcstatus.io/v2/status/java/${msg}`)
        .then(response => {
          if (!response.ok) {
            logger.erro('网络请求失败')
            e.reply('网络请求失败')
          }
          return response.json()
        })
        .then(data => {
          // 开始解析服务器数据
          let msglist = `服务器地址：${msg}\n`
          // 判断在线状态
          if (data.online) {
            msglist += '服务器状态：在线🟢\n'
          } else {
            e.reply(`服务器地址：${msg}\n服务器状态：离线🔴`)
            return true
          }

          // 正版验证状态
          if (data.eula_blocked) {
            msglist += `正版验证：开启\n`
          } else if (!data.eula_blocked) {
            msglist += `正版验证：关闭\n`
          }
          else {
            msglist += `正版验证：无法判断，请查看日志输出\n`
            logger.error(`正版验证值无法判断，接口返回：${data.eula_blocked}`)
          }

          msglist += `版本：${data.version.name_clean}\n`
          msglist += `介绍：\n${data.motd.clean.replace(' ', '')}\n`
          msglist += `在线玩家数：${data.players.max}/${data.players.online}`

          // 服务器图片
          const regex = /^data:image\/png;base64,/
          if (regex.test(data.icon)) {
            const img = data.icon.replace("data:image/png;base64,", "base64://")
            e.reply([segment.image(img), msglist])
          } else if (data.icon === null) {
            e.reply(['[该服务器没有设置LOGO]\n', msglist])
          } else {
            e.reply(['[该服务器的LOGO无法识别]\n', msglist])
          }

          return true
        })
        .catch(error => {
          //输出错误提示
          e.reply('发生错误，请查看控制台日志')
          logger.error('获取错误：', error)
          return false
        })
    } else {
      e.reply('请输入正确的域名或IP，支持带有端口号')
      return false
    }
  }
}