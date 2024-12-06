/**
* 作者：xiaotian2333
* 开源地址：https://github.com/xiaotian2333/yunzai-plugins-Single-file
*/


// 自动触发相关
/** 自动发送的群/人列表
* @param type (group,private)群还是人
*/
const postlist = {
  /** 人示例 */
  1719549416: {
    type: "private"
  },
  /** 群示例 */
  628306033: {
    type: "group"
  }
}
/** 自动触发的时间
 * cron表达式定义推送时间 (秒 分 时 日 月 星期) 
 * 可使用此网站辅助生成：https://www.matools.com/cron/
 * 注意，每天都需要触发，因此日及以上选通配符或不指定
 * 只选小时就可以了
*/
const auto_cron = "30 8 8 * * *"
//const auto_cron = "1 * * * * *" // 每分钟触发一次，测试用


import fetch from 'node-fetch'
import schedule from 'node-schedule'



/** 统一主动信息发送
 * 成功true，失败false
 * @param msg 要发送的信息
 * @param source (group,private) 发到什么渠道
 * @param channel_id 渠道的标识ID
 */
function post_msg(msg, source, channel_id) {
  if (source == "group") {
    // 群
    Bot[Bot.uin].pickGroup(channel_id).sendMsg(msg)
    return true
  } else if (source == "private") {
    // 私聊
    Bot[Bot.uin].pickUser(channel_id).sendMsg(msg)
    return true
  } else {
    logger.error(`[快讯][消息发送] 没有匹配的发送渠道，关键信息：source=${source},channel_id=${channel_id},msg=${msg}`)
    return false
  }
}

/** 休眠函数
 * @time 毫秒
 */
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

/** 获取资源列表 */
async function get_data() {
  // 拼接请求地址
  const url = `https://bc.weixin.qq.com/mp/recommendtag?f=json&action=show_news_feed&msg_type=1&tag_type=24&tag=快讯&hotnewsfgeed=1&sn=xiaotian2333`

  // 发起请求
  let result = await fetch(url, {
    headers: {
      'User-Agent': 'News-flash (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
    }
  })
  result = await result.json()
  // 提取新闻部分并返回
  return result.mp_msgs
}

/** 时间转换 */
function formatTimeAgo(send_time) {
  const currentTime = Math.floor(Date.now() / 1000) // 当前时间的秒级时间戳，Date.now()返回的是毫秒，除以1000转换为秒
  const diffSeconds = currentTime - send_time

  const minutes = Math.floor(diffSeconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours >= 1) {
    return `${hours}小时前`
  } else if (minutes >= 1) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

/** 去除追踪参数 */
function removeParamsFromUrl(url) {
  const paramsToRemove = ['listen_content_id_', 'exptype', 'subscene', 'scene', 'chksm']
  const urlObject = new URL(url)
  const searchParams = new URLSearchParams(urlObject.search)

  paramsToRemove.forEach(param => {
    searchParams.delete(param)
  })

  urlObject.search = searchParams.toString()
  return urlObject.href
}

/** 主函数 */
async function mian(uin) {
  // 请求快讯列表
  const news_list = await get_data()
  /** 合并消息列表 */
  let msgList = []
  // 这是在合并消息前面的提示
  /** 
  msgList.push({
    user_id: uin,
    nickname: '实时快讯',
    message: `本实时快讯来源微信`
  })
  */
  // 制作合并消息
  for (const news of news_list) {
    //logger.info(news) // 输出每个新闻的详细
    let msg = [
      `${news.title}\n\n`,
      `${news.digest}\n\n`,
      //await segment.image(news?.cover_url),
      `来源：${news.biz_info.name}\n`,
      `发布时间：${formatTimeAgo(news.send_time)}\n`,
      `阅读原文：${removeParamsFromUrl(news.jump_url)}`
    ]
    logger.info(news.title, news?.cover_url)
    msgList.push({
      user_id: uin,
      nickname: '实时快讯',
      message: msg
    })
    //await sleep(5000) // 服务端有限速，等5秒在下一个

  }
  return msgList
}


export class example extends plugin {
  constructor() {
    super({
      name: '快讯',
      dsc: '来源微信订阅号-快讯',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '^#?快讯',
        fnc: 'flash',
        //permission: 'master', // 仅限主人可触发
      }]
    })
  }

  async flash(e) {
    //e.reply('正在获取快讯，请稍后', true, 2)
    let channel_id = "undefined"
    if (e.message_type == "group") {
      // 群
      channel_id = e.group_id
    } else if (e.message_type == "private") {
      // 私聊
      channel_id = e.from_id
    }
    await e.reply(await Bot[Bot.uin].makeForwardMsg(await mian(e.user_id)))
    return true
  }
}


/** 主动触发-发到指定群 */
schedule.scheduleJob(auto_cron, async () => {
  logger.mark('[快讯][定时触发] 开始定时发送')
  // 取到消息列表
  const msg = await mian(Bot.uin)

  // 发送
  for (let channel_id of Object.keys(postlist)) {
    post_msg(Bot.makeForwardMsg(msg), postlist[channel_id].type, channel_id)
    await sleep(10000) // 等10秒在下一个
  }
  logger.mark('[快讯][定时触发] 结束定时发送')
})