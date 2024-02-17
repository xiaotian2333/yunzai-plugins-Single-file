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
        'https://qsign.xt-url.com?key=XxxX': {
          name: '小天cf反代抱脸',
          provider: 'hanxuan & xiaotian'
        },
        'http://119.188.240.80:56613?key=xiaotian': {
          name: '蓝天云',
          provider: 'xiaotian'
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
            // 开始模拟icqq请求
            let sign = await fetch(`${parts[0]}/sign?${parts[1]}&uin=2854196310&qua=${res.data.protocol.qua}&cmd=sign&seq=1848698645&buffer=0C099F0C099F0C099F&guid=123456&android_id=2854196310`); 
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