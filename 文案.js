// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file

/**统一网络请求函数，不管返回格式
* @param url 要请求的url
*/
async function get_data(url) {
  let result = await fetch(url, {
    headers: {
      'User-Agent': 'copywriting (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
    },
  })

  return result
}

/** 统一图片请求
 * 返回一个格式化数据
 * @param url 图片的链接
 * @returns return.success 是否成功
 * @returns return.base64Img 成功时返回的base64值，不包含头
 * @returns return.errmsg 失败时返回失败原因
 */
//import https from 'https'
/** 暂时用不着
async function imgUrlToBase64(url) {
    let base64Img
    return new Promise(function (resolve) {
        const options = {
            headers: {
                'User-Agent': 'copywriting (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
            }
        }
      let req = https.get(url,options, function (res) {
        var chunks = []
        var size = 0
        res.on('data', function (chunk) {
          chunks.push(chunk)
          size += chunk.length //累加缓冲数据的长度
        })
        res.on('end', function (err) {
          var data = Buffer.concat(chunks, size)
          base64Img = data.toString('base64')
          resolve({ success: true, base64Img })
        })
      })
      req.on('error', (e) => {
        resolve({ success: false, errmsg: e.message })
      })
      req.end()
    })
  }
*/


export class copywriting extends plugin {
  constructor() {
    super({
      name: '文案',
      dsc: '搜集各类文案API',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: /^#?(每|今)(日|天)(一)?(句|言|英语).*$/,
          fnc: 'dsapi'
        },
        {
          reg: /^#*(一言|壹言)$/,
          fnc: "hitokoto",
        },
        {
          reg: /^#?(每日|今日|本日)?(新闻|60s|60S).*$/,
          fnc: 'news'
        },
        {
          reg: /^#?(青年)?大学习(完成|截图)?/,
          fnc: 'qndxx'
        },
        {
          reg: /^#?古(诗|词|名句|诗词)/,
          fnc: 'poetry'
        },
        {
          reg: /^#?历史上的今天/,
          fnc: 'histoday'
        }
      ]
    })
  }

  // 金山词霸每日一句
  // API 文档：https://open.iciba.com/index.php?c=wiki
  async dsapi(e) {
    let result = await get_data('https://open.iciba.com/dsapi/')
    result = await result.json()
    //await e.reply(uploadRecord(result.tts, 0, false)) // 高清语音，需安装支持模块
    await e.reply(segment.record(result.tts)) //普通语音
    await e.reply(segment.image(result.fenxiang_img))
    return true
  }

  // 一言
  async hitokoto(e) {
    let result = await get_data('https://v1.hitokoto.cn/?encode=text&charset=utf-8&c=d&c=i&c=h&c=e')
    result = await result.text()
    e.reply(result)
  }

  // 每日60秒新闻，数据来自《每天60秒读懂世界》公众号
  async news(e) {
    let result = await fetch('https://uapi.woobx.cn/app/alapi', {
      method: 'POST',
      headers: {
        'User-Agent': 'copywriting (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)',
        'Accept-Encoding': 'gzip'
      },
      body: new URLSearchParams({
        'path': '/api/zaobao'
      })
    })
    result = await result.json()

    await e.reply(segment.record(result.data.audio))
    await e.reply(segment.image(result.data.image))
    return true
  }

  // 青年大学习完成图
  async qndxx(e) {
    let result = await get_data('https://quickso.cn/api/qndxx/api.php?sort=random')
    result = await result.text()
    result = result.replace(/<\/br>/g, '').trim()
    e.reply(segment.image(`https://${result}`))
  }

  // 古诗词名句
  async poetry(e) {
    let result = await get_data('https://oiapi.net/API/Sentences')
    result = await result.json()
    e.reply(`${result.data.content}——${result.data.author}《${result.data.works}》`)
  }

  // 历史上的今天
  async histoday(e) {
    if (true) { e.reply('此功能极其危险，请谨慎开启\n如需开启请编辑源码注释或删除此行代码'); return true }
    const today = new Date()
    const month = Number(today.getMonth() + 1) // 月份从0开始，所以要加1
    const day = Number(today.getDate())

    let result = await get_data(`https://uapi.woobx.cn/app/histoday?month=${month}&day=${day}`)
    result = await result.json()
    let msg_list = []
    msg_list.push({
      user_id: 2854200865,
      nickname: '今日日期',
      message: `${month}月${day}日`
    })
    // 历史事件
    result.data.forEach(event => {
      let msg = [`${event.year}年 ${event.title}\n${event.content}`]

      // 如果有图片，则添加图片
      if (event.cover) {
        msg.push(segment.image(event.cover))
      }

      // 如果有链接，则添加链接
      if (event.detail) {
        msg.push(`相关链接：${event.detail}`)
      }

      // 合并消息
      msg_list.push({
        user_id: 2854200865,
        nickname: '历史事件',
        message: msg
      })
    })

    await e.reply(await Bot.makeForwardMsg(msg_list))
  }
}