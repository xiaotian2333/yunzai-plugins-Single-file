import plugin from '../../lib/plugins/plugin.js';

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
      // 定义一个对象，存储每个链接的名字及提供者
      // 链接必须带上正确的 key
      // qq字段为可选项，部分节点是白名单的需要填写白名单里的qq才可以检测
      let publicUrls = {
        'https://1.qsign.icu?key=XxxX': {
          name: 'Qsign-1',
          provider: 'hanxuan'
        },
        'https://2.qsign.icu?key=XxxX': {
          name: 'Qsign-2',
          provider: 'hanxuan'
        },
        'https://3.qsign.icu?key=XxxX': {
          name: 'Qsign-3',
          provider: 'hanxuan'
        },
        'https://4.qsign.icu?key=XxxX': {
          name: 'Qsign-4',
          provider: 'hanxuan'
        },
        'https://5.qsign.icu?key=XxxX': {
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

      e.reply('正在检测各签名服务连通性...', true); // 开始检测提示

      // 合并转发消息初始化
      let msgList = []
      // 第一条消息（置顶消息），如不需要可删除或注释掉
      msgList.push({
        user_id: '系统消息',
        message: '状态说明\n正常✅：签名可以正常使用\n异常❗：签名无法正常使用'
      })

      // 遍历对象的键，即链接
      for (let publicUrl of Object.keys(publicUrls)) {
        let msgList_ = `名称:${publicUrls[publicUrl].name}\n提供者:${publicUrls[publicUrl].provider}\n` //创建基础提示
        // 开始获取qq版本
        try {
          let res = await fetch(publicUrl); // 获取返回的数据
          res = await res.json();
          if (res.code != 0) {msgList_ += `状态:异常❗：接口返回错误，code非0`}
          // 基础接口请求成功，进入二级请求
          else {
            // 开始处理链接
            let parts = publicUrl.split("?");
            // 处理白名单qq
            qq = 2854196310
            if (publicUrl.hasOwnProperty("qq")) {
              qq = publicUrls[publicUrl].qq
            }
            // 开始模拟icqq请求
            let sign = await fetch(
              `${parts[0]}/sign?${parts[1]}&uin=${qq}&qua=${res.data.protocol.qua}&cmd=sign&seq=1848698645&buffer=0C099F0C099F0C099F&guid=123456&android_id=2854196310`,{
                headers: {
                  'User-Agent': 'icqq@0.6.10 (Released on 2024/2/3)'
                }
              }
            ) 
            sign = await sign.json();
            if (sign.code == 0 && sign.msg == "success") {msgList_ += `版本:${res.data.protocol.version}\n状态:正常✅`}
            else {msgList_ += `状态:异常❗：签名失败`}
          }
        }
      
        // 基础请求未成功
        catch(err) {msgList_ += `状态:异常❗：接口请求错误\n${err.message}`}
        // 提交信息到合并信息列表
        msgList.push({
          user_id: Bot.uin,
          message: msgList_
        })
      }
    // 处理完毕，发送合并消息
    e.reply(await Bot[Bot.uin].pickUser(e.self_id).makeForwardMsg(msgList)) // 发送合并的消息 
    return true;
  }}
