import schedule from 'node-schedule'

/** 自动点赞续火列表
* @push 是否开启点赞消息推送
* @hitokoto 是否开启推送一言
*/
const thumbsUpMelist = {
  /** 作者 */
  1719549416: {
    push: false,
    hitokoto: true
  },
  /** 作者的机器人 */
  2859278670: {
    push: false,
    hitokoto: false
  }
}
/** 点赞次数，非会员10次，会员20次 */
const thumbsUpMe_sum = 10

/** 点赞消息推送文本 */
const thumbsUpMe_msg = '派蒙给你点赞啦，记得给我回赞哦'

/** 一言接口，请使用纯文本的接口 */
const hitokoto_api = 'https://v1.hitokoto.cn/?encode=text&charset=utf-8&c=d&c=i&c=h&c=e'

/** 一言默认文案，网络请求失败时发送这个 */
const hitokoto_Default_text = '种自己的花，爱自己的宇宙🌍'

/** 冷却相关配置 */
const cd = 2 // 一天只能触发1次
const cd_tips = "点过就别继续发了，还搁这讨赞呢？你是乞丐吗？😏" // 冷却提示
let user_cd = {} // 初始化冷却数据


async function getHitokoto() {
  try {
    let res = await fetch(hitokoto_api)
    return res.text()
  } catch (e) {
    logger.warn(`[点赞续火][续火] 接口请求失败，使用默认文案。报错详情：${e}`)
    return hitokoto_Default_text
  }
}


/** 被消息触发 */
export class dzxh extends plugin {
  constructor() {
    super({
      name: "点赞续火",
      dsc: "给群友点赞及续火",
      event: "message",
      priority: 5000,
      rule: [
        {
          reg: "^#*赞我$",
          fnc: "thumbsUpMe",
        },
        {
          reg: "^#*(续火|一言|壹言)$",
          fnc: "hitokoto",
        }
      ],
    }),
      this.task = {
        cron: '0 0 0 * * *',
        name: '定时重置冷却',
        fnc: () => this.Reset_cd(), // 指触发的函数
        log: false // 是否输出日志
      }
  }

  /** 重置冷却数据 */
  async Reset_cd() {
    user_cd = {}
    logger.mark(`[点赞续火][赞我] 冷却已重置`)
  }

  /** 赞我 */
  async thumbsUpMe(e) {
    // 字段不存在则默认0，存在则保留原值
    user_cd[e.user_id] = user_cd[e.user_id] ?? 0

    // 到达边界提示
    if (user_cd[e.user_id] == cd) {
      e.reply(cd_tips)
      user_cd[e.user_id] += 1
      return true
    }

    // 已越界，不再回复消息
    if (user_cd[e.user_id] > cd) {
      user_cd[e.user_id] += 1
      return true
    }

    // 加入冷却
    user_cd[e.user_id] += 1

    Bot.pickFriend(this.e.user_id).thumbUp(thumbsUpMe_sum)
    this.e.reply(thumbsUpMe_msg)
    return true
  }
  /** 续火 */
  async hitokoto(e) {
    let msg = await getHitokoto()
    e.reply(msg)
    return true
  }
}

/** 休眠函数
 * @time 毫秒
 */
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

/** 主动触发-点赞
 * 点赞开始时间
 * cron表达式定义推送时间 (秒 分 时 日 月 星期) 
 * 可使用此网站辅助生成：https://www.matools.com/cron/
 * 注意，每天都需要触发，因此日及以上选通配符或不指定
 * 只选小时就可以了
*/
schedule.scheduleJob('30 5 12 * * *', async () => {
  //schedule.scheduleJob('1 * * * * *', async () => {
  for (let qq of Object.keys(thumbsUpMelist)) {
    Bot.pickFriend(qq).thumbUp(thumbsUpMe_sum)
    logger.mark(`[点赞续火][自动点赞] 已给QQ${qq}点赞${thumbsUpMe_sum}次`)
    if (thumbsUpMelist[qq].push) {
      Bot.pickFriend(qq).sendMsg(thumbsUpMe_msg)
    }
    await sleep(10000) // 等10秒在下一个
  }
})

// 主动触发-续火
schedule.scheduleJob('30 15 12 * * *', async () => {
  //schedule.scheduleJob('1 * * * * *', async () => {
  logger.mark(`[点赞续火][自动续火] 触发一言定时`)
  let msg = await getHitokoto()

  for (let qq of Object.keys(thumbsUpMelist)) {
    if (thumbsUpMelist[qq].hitokoto) {
      Bot.pickFriend(qq).sendMsg(msg)
    }
    await sleep(2000) // 等2秒在下一个
  }
})