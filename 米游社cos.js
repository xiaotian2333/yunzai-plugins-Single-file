/**
* 此插件为二改插件
* 二改作者：xiaotian2333
* 开源地址：https://github.com/xiaotian2333/yunzai-plugins-Single-file
* 源作者：bling_yshs
* 源开源地址：https://gitee.com/bling_yshs/yunzaiv3-ys-plugin
*/

// 主动触发相关
/** 文件大小提示开关，开启后总大小超过提示值时提示 */
const size_tips = true
/** 文件大小提示值，仅在提示开关开启后生效，单位M */
const size_than = 15

// 自动触发相关
/** 自动发送cos的群/人列表
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
const auto_cron = "30 8 12 * * *"
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
    Bot.pickGroup(channel_id).sendMsg(msg)
    return true
  } else if (source == "private") {
    // 私聊
    Bot.pickUser(channel_id).sendMsg(msg)
    return true
  } else {
    logger.error(`[米游社cos][消息发送] 没有匹配的发送渠道，关键信息：source=${source},channel_id=${channel_id},msg=${msg}`)
    return false
  }
}


/** 获取资源列表 */
async function get_data() {
  // forumId对应不同社区的不同板块，gameType对返回值没有影响，但可作为游戏类型的判断
  const config = [
    // 原神
    { forumId: '49', gameType: '2' },
    // 崩铁
    { forumId: '62', gameType: '6' },
    // 大别野
    { forumId: '47', gameType: '5' },
    // 绝区零
    { forumId: '65', gameType: '8' },
    // 崩环3
    //由于崩环3没有专门的cos分区，因此可能导致很多杂乱的东西，自行考虑是否开启，默认关闭
    // { forumId: '4', gameType: '1' }
  ]
  /** 随机生成0到3的整数，用于随机选择 config 里的其中一个并保存到 selected 变量 */
  const selected = config[Math.floor(Math.random() * 4)]
  /** 随机生成1到3的整数，貌似只有1跟2影响数据，还是先保留着吧 */
  const pageNum = Math.floor(Math.random() * 3) + 1
  /** 是否获取热门数据 */
  let is_hot = Math.floor(Math.random() * 2)
  if (is_hot == 1) { is_hot = "false" } else if (is_hot == 0) { is_hot = "true" }

  // 拼接请求地址
  const url = `https://bbs-api.miyoushe.com/post/wapi/getForumPostList?forum_id=${selected.forumId}&gids=${selected.gameType}&is_good=false&is_hot=${is_hot}&page_size=20&sort_type=${pageNum}`
  // 这是测试用地址，由于米游社的数据每天都会变，因此采用自存挡数据
  //const url = 'https://oss.xt-url.com/%E7%B1%B3%E6%B8%B8%E7%A4%BEcos%E6%8F%92%E4%BB%B6%E6%A0%B7%E6%9C%AC%E6%95%B0%E6%8D%AE.json'

  // 发起请求
  let result = await fetch(url, {
    headers: {
      'User-Agent': 'msy-cos (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
    }
  })
  result = await result.json()
  // 随机生成0到19的整数，用于随机选择列表里的一个帖子并展开
  return result?.data?.list[Math.floor(Math.random() * 20)]
  // 搭配测试用地址 ， 0 视频帖子，1 图片帖子
  //result = result?.data?.list[0]
}

/**
 * 信息发送函数
 * 
 * @param sender 合并信息里的图片/视频发送者QQ号
 * @param source (Group,User) 信息来自源标识
 * @param channel_id 信息来源的标识ID
 * @param tips 是否开启提醒，自动触发时保持关闭
 */
async function mian(sender, source, channel_id, tips) {
  const result = await get_data()
  /** 合并消息列表，多图时使用 */
  let msgList = []

  // 这是在合并消息前面的提示
  msgList.push({
    user_id: 2854200865,
    nickname: '帖子信息',
    // 原帖地址貌似只看id，具体分类是不管的，那也懒得去动态变化了
    // 如果未来失效了就改ys成真的分区的就好
    message: `标题：${result.post.subject}\n原帖地址：\nhttps://www.miyoushe.com/ys/article/${result.post.post_id}\n作者：${result.user.nickname}`
  })

  // 访问images数组并检查其长度
  if (result.post.images.length === 0) {
    /**
    * 空数组，这种情况有两种可能
    * 1.米游社改接口了
    * 2.这是个视频帖子，不包含图片
    * 现在要做的就是排除第二种可能
    */

    // 鬼知道他为什么没法用if判断，只能用try去试了
    try {
      /** 视频最高画质挡的数据 */
      const video_data = result.vod_list[result.vod_list.length - 1].resolutions[result.vod_list[result.vod_list.length - 1].resolutions.length - 1]

      // 这里不需要循环累计，性能损失可以忽略，就不作区分了
      /** 视频大小，单位M */
      const video_size = ((video_data.size) / 1024 / 1024).toFixed(2)

      if (video_size > size_than && tips) {
        // 如果视频大于提示值则提示用户
        //e.reply()
        post_msg(`正在发送较大视频（${video_size}M），请耐心等待`, source, channel_id)
      }

      msgList.push({
        user_id: sender,
        nickname: '视频',
        message: segment.video(video_data.url)
      })
      msgList.push({
        user_id: 2854200865,
        nickname: '视频信息',
        message: `画质：${video_data.definition}(${video_data.height}x${video_data.width})\n编码格式：${video_data.format}(${video_data.codec})\n文件大小：${video_size}M`
      })
      return msgList
    }
    catch (err) {
      // 凉凉，需要人工更新插件
      post_msg("获取图片失败，可能是米游社接口已发生变动", source, channel_id)
      return false
    }

  }

  // 仅当开启提示时执行
  if (tips) {
    /** 图片的总大小，单位字节*/
    let totalSize = 0

    // 计算图片总大小 
    result.image_list.forEach(image => {
      // 将每个图片的size（字符串）转换为数字，然后累加到totalSize上  
      totalSize += parseInt(image.size, 10) // 10是基数，表示十进制
    })

    // 图片的总大小，单位变为M
    totalSize = ((totalSize) / 1024 / 1024).toFixed(2)
    if (totalSize > size_than) {
      // 如果图片总大小大于提示值则提示用户
      post_msg(`正在发送较大图片（${totalSize}M），请耐心等待`, source, channel_id)
    }
  }

  // 这是正常取到多张图片的处理
  // 获取图片列表
  const imgUrls = result.post?.images
  for (const image of imgUrls) {
    // 米游社从2024年10月12日起开始在域名upload-bbs.miyoushe.com拦截ua axios/1.7.7
    // 临时解决方法为升级或降低axios版本即可，反正别是1.7.7
    // 或者换个请求域名，这个域名暂时没有拦截
    // image = image.replace('upload-bbs.miyoushe.com','upload-bbs.mihoyo.com')

    // 自定义icqq的图片请求ua，感谢寒暄
    segment.image = (file, name) => ({
      type: 'image',
      file,
      name,
      headers: {
        'User-Agent': 'msy-cos (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
      }
    })
    msgList.push({
      user_id: sender,
      nickname: '图片',
      message: segment.image(image)
    })
  }
  return msgList
}

export class example extends plugin {
  constructor() {
    super({
      name: '米游社cos',
      dsc: '发送米游社cos图片或视频',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: /^#?(米游社|mys)?cos$/,
        fnc: 'cos',
        //permission: 'master', // 仅限主人可触发
      }]
    })
  }

  async cos(e) {
    let channel_id = "undefined"
    if (e.message_type == "group") {
      // 群
      channel_id = e.group_id
    } else if (e.message_type == "private") {
      // 私聊
      channel_id = e.from_id
    }
    await e.reply(await Bot.makeForwardMsg(await mian(e.user_id, e.message_type, channel_id, size_tips)))
    return true
  }
}

/** 休眠函数
 * @time 毫秒
 */
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

/** 主动触发-发到指定群 */
schedule.scheduleJob(auto_cron, async () => {
  logger.mark('[米游社cos][定时触发] 开始定时发送')
  // 取到消息列表
  const msg = await mian(2854196310, "private", Bot.uin, false)

  // 发送
  for (let channel_id of Object.keys(postlist)) {
    post_msg(Bot.makeForwardMsg(msg), postlist[channel_id].type, channel_id)
    await sleep(10000) // 等10秒在下一个
  }
  logger.mark('[米游社cos][定时触发] 结束定时发送')
})