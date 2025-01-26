/** 
 * 作者：xiaotian2333
 * 开源地址：https://github.com/xiaotian2333/yunzai-plugins-Single-file
 * 需要 ICQQ 1.5.8 及以上版本
 * 表情内容参考官方 https://bot.q.qq.com/wiki/develop/api-v2/openapi/emoji/model.html
 */


// 接受到表情的回应处理逻辑
export class Reaction extends plugin {
  constructor() {
    super({
      name: '监听表情',
      event: 'notice.group.reaction',
      priority: -9999,
      rule: [
        {
          fnc: 'reaction',
          log: false
        }
      ]
    })
  }

  async reaction(e) {
    // 过滤自己
    if (e.user_id == e.self_id) return false
    // 过滤非管理员
    if (!e.isMaster) return false

    //console.dir(e, { depth: null }) // 输出日志
    //e.reply(`收到表情回应\n来源群:${e.group_id}\n来源QQ:${e.user_id}\n表情ID:${e.id}\n是否管理员:${e.isMaster}\nseq:${e.seq}`)

    // 判断表情ID
    if (e.id == "128076") {
      e.reply(`收到👌表情`)

      // 接下来可以处理同意逻辑
      let data = await redis.type(`AN_Demo/${e.seq}`)
      if (data == 'none') {
        e.reply("按钮已过期")
        return true
      }

      // 获取业务数据
      data = await redis.get(`AN_Demo/${e.seq}`)
      // 及时删除业务数据避免冲突
      redis.del(`AN_Demo/${e.seq}`)
      // 处理业务逻辑
      e.reply(`对应消息的业务数据:${data}`)
      return true
    }

    if (e.id == "10060") {
      e.reply(`收到❌表情`)
      // 接下来可以处理拒绝逻辑
      // 略
      return true
    }

  }
}

// 发送按钮消息
export class example extends plugin {
  constructor() {
    super({
      name: '按钮Demo',
      dsc: '按钮Demo',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '^#?按钮$',
        fnc: 'an'
      }
      ]
    })
  }

  async an(e) {
    const data = await e.reply("按钮测试\n按👌同意，❌拒绝")
    //console.dir(await data, { depth: null }) // 输出日志
    Bot.pickGroup(e.group_id).setReaction(data.seq, 128076, 1)
    Bot.pickGroup(e.group_id).setReaction(data.seq, 10060, 1)
    // 通过redis存储seq，建议设置过期时间
    // EX: 600 为600秒过期
    await redis.set(`AN_Demo/${data.seq}`, "要存储的业务数据", { EX: 600 })
  }
}