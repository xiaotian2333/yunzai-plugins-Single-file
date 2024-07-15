/**
* 此插件为二改插件
* 二改作者：xiaotian2333
* 开源地址：https://github.com/xiaotian2333/yunzai-plugins-Single-file
* 源作者：bling_yshs
* 源开源地址：https://gitee.com/bling_yshs/yunzaiv3-ys-plugin
* 原作者的话：随机获取米游社cos图片并发送，如果你恰巧拥有编程知识，希望你可以修改一下下方的Header，因为这个Header是我在抓包的时候抓到的，不保证永久有效
*/

/** 文件大小提示开关，开启后总大小超过提示值时提示 */
const size_tips = true
/** 文件大小提示值，仅在提示开关开启后生效，单位M */
const size_than = 7


import plugin from '../../lib/plugins/plugin.js'
import fetch from 'node-fetch'

export class example extends plugin {
  constructor() {
    super({
      name: 'ys-米游社cos',
      dsc: '发送米游社cos图片或视频',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '^#?cos',
        fnc: 'cos'
      }]
    })
  }

  async cos(e) {
    // 鬼知道原作者为啥要这样写，别动就对了
    const config = [
      { forumId: '49', gameType: '2' },
      { forumId: '62', gameType: '6' },
      { forumId: '47', gameType: '5' },
      { forumId: '65', gameType: '8' }
    ]
    /** 随机生成0到3的整数，用于随机选择 config 里的其中一个并保存到 selected 变量 */
    const selected = config[Math.floor(Math.random() * 4)]
    /** 随机生成1到3的整数，实际上这玩意好像不影响返回的数据啊，不知道原作者是什么考虑 */
    const pageNum = Math.floor(Math.random() * 3) + 1

    // 拼接请求地址
    const url = `https://bbs-api.miyoushe.com/post/wapi/getForumPostList?forum_id=${selected.forumId}&gids=${selected.gameType}&is_good=false&is_hot=true&page_size=20&sort_type=${pageNum}`
    // 这是测试用地址，由于米游社的数据每天都会变，因此采用自存挡数据
    //const url = 'https://oss.xt-url.com/%E7%B1%B3%E6%B8%B8%E7%A4%BEcos%E6%8F%92%E4%BB%B6%E6%A0%B7%E6%9C%AC%E6%95%B0%E6%8D%AE.json'

    // 发起请求
    let result = await fetch(url, {
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'sec-ch-ua': '"Chromium";v="5", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'x-rpc-app_version': '2.70.0',
        'x-rpc-client_type': '4',
        'x-rpc-device_fp': '38d7f8806b954',
        'x-rpc-device_id': '3c7618753452ac898fb92a0220e22927',
        Referer: 'https://www.miyoushe.com/',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
      body: null,
      method: 'GET'
    })
    result = await result.json()



    // 随机生成0到19的整数，用于随机选择列表里的一个帖子并展开
    result = result?.data?.list[Math.floor(Math.random() * 20)]
    // 搭配测试用地址 ， 0 视频帖子，1 图片帖子
    //result = result?.data?.list[0]

    /** 合并消息列表，多图时使用 */
    let msgList = []

    // 这是在合并消息前面的提示
    // user_id正常情况下应该填qq号，但是字符串也是可以用的，但是只能在手机端看见，电脑端会显示为QQ用户
    msgList.push({
      user_id: '帖子信息',
      message: `标题：${result.post.subject}\n原帖地址：https://www.miyoushe.com/ys/article/${result.post.post_id}\n作者：${result.user.nickname}`
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

        if (video_size > size_than && size_tips) {
          // 如果视频大于提示值则提示用户
          e.reply('正在发送较大视频，请耐心等待')
        }

        msgList.push({
          user_id: Bot.uin,
          message: segment.video(video_data.url)
        })
        msgList.push({
          user_id: '视频信息',
          message: `画质：${video_data.definition}(${video_data.height}x${video_data.width})\n编码格式：${video_data.format}(${video_data.codec})\n文件大小：${video_size}M`
        })
        e.reply(await Bot[Bot.uin].pickUser(e.self_id).makeForwardMsg(msgList))
        return true
      }
      catch (err) {
        // 凉凉，需要人工更新插件
        e.reply("获取图片失败，可能是米游社接口已发生变动")
        return false
      }

    }

    // 仅当开启提示时执行
    if (size_tips) {
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
        e.reply(`正在发送较大图片（${totalSize}M），请耐心等待`)
      }
    }

    if (result.post.images.length === 1) {
      // 只有一张图片，图文混排发送
      e.reply([
        segment.image(result.post?.images[0]),
        `标题：${result.post.subject}\n原帖地址：https://www.miyoushe.com/ys/article/${result.post.post_id}\n作者：${result.user.nickname}`
      ])
      return true
    }

    // 这是正常取到多张图片的处理
    // 获取图片列表
    let imgUrls = result.post?.images
    imgUrls.forEach(image => {
      msgList.push({
        user_id: Bot.uin,
        message: segment.image(image)
      })
    })
    e.reply(await Bot[Bot.uin].pickUser(e.self_id).makeForwardMsg(msgList))
    return true
  }
}