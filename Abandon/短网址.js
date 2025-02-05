import {URL} from 'url'

/**统一网络请求函数，不管返回格式
* @param url 要请求的url
*/
async function get_data(url) {
  let result = await fetch(url, {
    headers: {
      'User-Agent': 'url (url by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
    }
  })
  return result
}

function isValidURL(string) {
    try {
        new URL(string)
        return true
    } catch (_) {
        return false
    }
}


export class MemoryCheck extends plugin {
  constructor() {
    super({
      name: '生成短链接',
      event: 'message',
      rule: [
        {
          reg: "^#?短(链接|网址|连接)",
          fnc: 'url',
          permission: 'master'
        }
      ]
    })
  }

  async url(e) {
    let msg = e.msg
    msg = msg.replace(/^#?短(链接|网址|连接)/, '')
    // 如果为空则返回
    if (!msg) {
      e.reply('请发送正确的链接')
      return false
    }
    // 不符合url格式返回
    if (!isValidURL(msg)) {
      e.reply('请发送正确的链接')
      return false
    }

    let result = await get_data(`https://oiapi.net/API/ShortLink/add?url=${msg}`)
    result = await result.json()
    e.reply(`=========${result.message}=========\n短链接：${result.data.url}\n过期时间：${result.data.time}`)
    return true
  }
}
