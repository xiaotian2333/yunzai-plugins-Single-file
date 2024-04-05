import plugin from '../../lib/plugins/plugin.js'
import fs from 'node:fs'
export class qsign extends plugin {
  constructor() {
    super({
      name: '签名状态检测',
      dsc: '签名状态检测',
      event: 'message',
      priority: 9,
      rule: [{
        reg: `^#?(签名|qsign|sign)状态$`,
        fnc: `qsign`
      }]
    })
  }

  async qsign(e) {
    await e.reply('正在检测各签名服务可用性...', true) // 开始检测提示
    /** 定义一个列表，存储每个链接的名字及提供者
    * 链接必须带上正确的 key
    * @name 签名的显示名字
    * @provider 签名的提供者
    * @qq 可选项，部分节点是白名单的需要填写白名单里的qq才可以检测
    */
    let publicUrls = {
      'http://1.qsign.icu?key=XxxX': {
        name: 'Qsign-1',
        provider: 'hanxuan'
      },
      'http://2.qsign.icu?key=XxxX': {
        name: 'Qsign-2',
        provider: 'hanxuan'
      },
      'http://3.qsign.icu?key=XxxX': {
        name: 'Qsign-3',
        provider: 'hanxuan'
      },
      'http://4.qsign.icu?key=XxxX': {
        name: 'Qsign-4',
        provider: 'hanxuan'
      },
      'http://5.qsign.icu?key=XxxX': {
        name: 'Qsign-5',
        provider: 'hanxuan'
      },
      'https://t1.qsign.xt-url.com?key=xiaotian': {
        name: '小天t1节点反代',
        provider: 'xiaotian（崩了进群628306033反馈）'
      },
      // 时雨签名不需要密钥，为了兼容代码加上key字段
      'http://gz.console.microgg.cn:2536?key=null': {
        name: '时雨-1',
        provider: '时雨',
        qq: '123456'
      },
      'http://110.40.249.125:2536?key=null': {
        name: '时雨-2',
        provider: '时雨',
        qq: '123456'
      }
    }

    /** 合并转发消息列表 */
    let msgList = []
    // 第一条消息（置顶消息），如不需要可删除或注释掉
    msgList.push({
      user_id: '系统消息',
      message: '状态说明\n正常✅：签名可以正常使用\n异常❗：签名无法正常使用'
    })
    /** 兼容TRSS崽用的长消息文本 */
    let mdmsg = '状态说明\n正常✅：签名可以正常使用\n异常❗：签名无法正常使用'

    // 不知道为啥直接用云崽的api会乱返回崽消息，只能自己实现了
    /** 云崽的类型 */
    let YZname = 'trss-yunzai'
    try {
      YZname = await JSON.parse(fs.readFileSync('package.json', 'utf8')).name
    }
    catch(err) {
      logger.warn('[签名状态检测][qsign] 获取云崽版本失败，使用兼容模式发送')
    }

    // 遍历列表的键，即链接
    for (let publicUrl of Object.keys(publicUrls)) {
      /** 单个签名的消息体 */
      let msgList_ = `名称:${publicUrls[publicUrl].name}\n提供者:${publicUrls[publicUrl].provider}\n` //创建基础提示
      // 开始获取qq版本
      try {
        let res = await fetch(publicUrl) // 获取返回的数据
        res = await res.json()
        if (res.code != 0) {msgList_ += `状态:异常❗：接口返回错误，code非0`}
        // 基础接口请求成功，进入二级请求
        else {
          // 开始处理链接
          let parts = publicUrl.split("?")
          // 处理白名单qq
          let qq = 2854196310
          if (publicUrl.hasOwnProperty("qq")) {
            qq = publicUrls[publicUrl].qq
          }
          // 开始模拟icqq请求
          const startTime = new Date().getTime() // 延迟检测开始
          let sign = await fetch(
            `${parts[0]}/sign?${parts[1]}&uin=${qq}&qua=${res.data.protocol.qua}&cmd=sign&seq=1848698645&buffer=0C099F0C099F0C099F&guid=123456&android_id=2854196310`,{
              headers: {
                'User-Agent': 'icqq@0.6.10 (Released on 2024/2/3)'
              }
            }
          )
          const elapsedTime = new Date().getTime() - startTime // 延迟检测结束，计算时间差
          sign = await sign.json()
          if (sign.code == 0 && sign.msg == "success") {msgList_ += `版本:${res.data.protocol.version}\n状态:正常✅\n延迟:${elapsedTime}ms`}
          else {msgList_ += `状态:异常❗：签名失败`}
        }
      }
      
      // 基础请求未成功
      catch(err) {
        if (err instanceof SyntaxError) {
          msgList_ += `状态:异常❗：非QSign接口返回的文本`
        } else if(err.message = 'fetch failed') {
          msgList_ += '状态:异常❗：请求超时'
        } else {
        msgList_ += `状态:异常❗：接口请求错误\n${err.message}`
        }
      }
      // 提交信息到合并信息列表
      // 获取云崽的分支版本
      if (YZname == 'miao-yunzai') {
        msgList.push({
          user_id: Bot.uin,
          message: msgList_
        })
      } else {
        // 非喵崽用长文本消息
        mdmsg += '\n---\n'+msgList_
      }
    }

    // 处理完毕，发送消息
    if (YZname == 'miao-yunzai') {
      // 喵崽发送合并转发消息
      e.reply(await Bot[Bot.uin].pickUser(e.self_id).makeForwardMsg(msgList))
    } else {
      // 非喵崽发送长消息文本
      e.reply(mdmsg)
    }
    return true
  }
}