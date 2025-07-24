import { URL } from 'url'

async function getRedirectUrl(originalUrl) {
  try {
    // 发送请求但不自动跟随重定向
    const response = await fetch(originalUrl, {
      redirect: 'manual' // 关键：不自动跟随重定向
    })

    // 检查是否发生了重定向（状态码3xx）
    if (response.status >= 300 && response.status < 400) {
      let redirectUrl = response.headers.get('location')

      // 如果重定向地址是相对路径，需要拼接成完整URL
      redirectUrl = new URL(redirectUrl, originalUrl).href
      // 去除?后的参数
      redirectUrl = redirectUrl.split('?')[0]
      return redirectUrl.split('https://www.bilibili.com/video/')[1]
    } else {
      return false
    }
  } catch (error) {
    logger.error('[B站卡片转链接]获取重定向链接时出错:', error.message)
    return false
  }
}


export class bili extends plugin {
  constructor() {
    super({
      name: "B站卡片转链接",
      event: "message",
      priority: 5000,
      rule: [{
        reg: /b23.tv/,
        fnc: "go"
      }]
    })
  }

  async go(e) {
    // 不是json格式，中断
    if (e.message[0].type != 'json') { return false }

    const data = JSON.parse(e.message[0].data)

    // 不是b站视频分享卡片，中断
    if (data.view != 'view_8C8E89B49BE609866298ADDFF2DBABA4' && data.meta.detail_1.appid != '1109937557') { return false }

    // 处理图片链接
    let img_url = data.meta.detail_1.preview
    // 如无协议头，添加https
    if (!/^https?:\/\//i.test(img_url)) {
      img_url = `https://${img_url}`
    }

    // 处理视频链接
    const BV = await getRedirectUrl(data.meta.detail_1.qqdocurl.split('?')[0])
    const BV_URL = `https://b23.tv/${BV}`

    // 制作数据
    const bilidata = {
      url: BV_URL || data.meta.detail_1.qqdocurl.split('?')[0], // 视频链接
      title: data.meta.detail_1.desc, // 视频标题
      img: img_url, // 带有信息的视频封面
      host: data.meta.detail_1?.host, // 原始分享者消息：uin,nick
      bv: BV, // 视频BV号
    }
    // 制作消息
    const msg = [
      segment.at(e.user_id),
      `分享了一个B站链接\n`,
      `标题：${bilidata.title}\n`,
      `链接：${bilidata.url}\n`,
      segment.image(bilidata.img),
      `\n原始分享者：${bilidata?.host?.nick}(${bilidata?.host?.uin})`,
    ]
    e.reply(msg)
    e.recall() // 撤回卡片消息
  }
}