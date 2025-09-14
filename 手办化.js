// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file

import axios from 'axios'

// 填入你的智谱key或token，如没有可加群获取token
// 收费标准为按调用次数后付费，0.06 元/次
const API_KEY = ""

const prompt = "Using the nano-banana model, a commercial 1/7 scale figurine of the character in the picture was created, depicting a realistic style and a realistic environment. The figurine is placed on a computer desk with a round transparent acrylic base. There is no text on the base. The computer screen shows the Zbrush modeling process of the figurine. Next to the computer screen is a BANDAI-style toy box with the original painting printed on it. Please turn this photo into a figure. Behind it, there should be a partially transparent plastic paper box with the character from this photo printed on it. In front of the box, on a round plastic base, place the figure version of the photo I gave you. I'd like the PVC material to be clearly represented. It would be even better if the background is indoors"


async function GLM(imageUrl) {

  let data = JSON.stringify({
    "stream": false,
    "agent_id": "cartoon_generator",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "image_url",
            "image_url": imageUrl
          },
          {
            "type": "text",
            "text": prompt
          }
        ]
      }
    ]
  })

  try {

    let config = {
      method: 'POST',
      url: 'https://open.bigmodel.cn/api/v1/agents',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      data: data
    }


    const res = await axios.request(config)

    const image_url = res.data?.choices?.[0]?.messages[0]?.content[0]?.image_url
    if (image_url) {
      return { success: true, imageUrl: image_url }
    } else {
      logger.info(image_url)
      return { success: false, error: '图片生成失败' }
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}


export class GLM_手办化 extends plugin {
  constructor() {
    super({
      name: '手办化',
      event: 'message',
      priority: -Infinity,
      rule: [{ reg: '^#?(#手办|手办化|变手办|转手办)$', fnc: 'X' }]
    })
  }


  async X(e) {
    try {
      const { url: imageUrl, txt: sourceType } = await getPriorityImage(e)

      if (!imageUrl) return e.reply('请发送或引用1张图片', true)

      e.reply('来了来了，等派蒙一小会', true)

      const result = await GLM(imageUrl)

      if (result.success) {
        await e.reply(segment.image(result.imageUrl), true)
      } else {
        await e.reply(`生成失败：${result.error}`, true)
      }

    } catch (err) {
      let msg = '生成失败'
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') msg += '：请求超时'
        else if (err.response) msg += `：HTTP ${err.response.status}`
        else msg += `：${err.message}`
      } else if (err instanceof Error) msg += `：${err.message}`
      await e.reply(msg, true)
    }
  }
}

/**
 * 获取优先级图片
 * 优先级：引用消息图片 > 当前消息图片 > @用户头像 > 发送者头像
 * @param {object} e - 消息事件对象
 * @returns {Promise<{url: string|null, txt: string|null}>}
 */
async function getPriorityImage(e) {
  const result = { url: null, txt: null }

  // 1️⃣ 引用消息里的图片
  if (e.getReply || e.source) {
    try {
      let source
      if (e.getReply) {
        source = await e.getReply()
      } else if (e.source) {
        if (e.group?.getChatHistory) {
          source = (await e.group.getChatHistory(e.source.seq, 1)).pop()
        } else if (e.friend?.getChatHistory) {
          source = (await e.friend.getChatHistory(e.source.time, 1)).pop()
        }
      }

      if (source?.message?.length) {
        const imgs = source.message
          .filter(m => m.type === "image")
          .map(m => m.url)
        if (imgs.length > 0) {
          result.url = imgs[0]
          result.txt = "引用"
          return result
        }
      }
    } catch { }
  }

  // 2️⃣ 当前消息中的图片
  const imgSeg = e.message.find(m => m.type === "image")
  if (imgSeg?.url) {
    result.url = imgSeg.url
    result.txt = "消息"
    return result
  }

  // 3️⃣ 被 @ 的用户头像
  const atSeg = e.message.find(m => m.type === "at")
  if (atSeg?.qq) {
    result.url = `https://q1.qlogo.cn/g?b=qq&nk=${atSeg.qq}&s=640`
    result.txt = "@头像"
    return result
  }

  // 4️⃣ 当前触发用户头像
  if (e.user_id) {
    result.url = `https://q1.qlogo.cn/g?b=qq&nk=${e.user_id}&s=640`
    result.txt = "用户头像"
    return result
  }

  return result
}

