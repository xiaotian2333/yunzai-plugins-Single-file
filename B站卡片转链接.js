export class bili extends plugin {
  constructor() {
    super({
      name: "B站卡片转链接",
      event: "message",
      priority: 5000,
      rule: [
        {
          reg: /b23.tv/,
          fnc: "go"
        }
      ]
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
    const bilidata = {
      url: data.meta.detail_1.qqdocurl.split('?')[0], // 视频链接，b23.tv
      title: data.meta.detail_1.desc, // 视频标题
      img: img_url, // 带有信息的视频封面
      host: data.meta.detail_1?.host // 原始分享者消息：uin,nick
    }

    const msg = [
      `标题：${bilidata.title}\n`,
      `链接：${bilidata.url}\n`,
      segment.image(bilidata.img),
      `\n原始分享者：${bilidata?.host?.nick}(${bilidata?.host?.uin})`,
    ]
    e.reply(msg, true)
  }
}