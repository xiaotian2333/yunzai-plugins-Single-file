// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file

/**统一网络请求函数，不管返回格式
* @param url 要请求的url
*/
async function get_data(url) {
    let result = await fetch(url, {
        headers: {
          'User-Agent': 'copywriting (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
        }
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
                    reg: '^#?(每|今)日一句.*$',
                    fnc: 'dsapi'
                },
                {
                    reg: "^#*(一言|壹言)$",
                    fnc: "hitokoto",
                },
                {
                    reg: '^#?(每日|今日|本日)?(新闻|60s|60S).*$',
                    fnc: 'news'
                },
                {
                  reg: '^#?(青年)?大学习',
                  fnc: 'qndxx'
              }
            ]
        })
    }

    // 金山词霸每日一句
    // API 文档：https://open.iciba.com/index.php?c=wiki
    async dsapi(e) {
        let result = await get_data('https://open.iciba.com/dsapi/')
        result = await result.json()
        await e.reply(uploadRecord(result.tts,0,false)) // 发送英语音频，不需要可删除或注释
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
        e.reply(segment.image('https://api.jun.la/60s.php?format=image'))
        return true
    }

    // 青年大学习完成图
    async qndxx(e) {
      let result = await get_data('https://quickso.cn/api/qndxx/api.php?sort=random')
      result = await result.text()
      result = result.replace(/<\/br>/g, '').trim()
      e.reply(segment.image(`https://${result}`))
  }
}