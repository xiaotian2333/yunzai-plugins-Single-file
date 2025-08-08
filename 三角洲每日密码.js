// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file

const plugin_name = '三角洲每日密码'

/**统一网络请求函数，不管返回格式
* @param url 要请求的url
*/
async function get_data(url) {
  let result = await fetch(url, {
    headers: {
      'User-Agent': 'sjz (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
    },
  })

  return result
}

export class sjz extends plugin {
  constructor() {
    super({
      name: plugin_name,
      event: 'message',
      priority: 4999,
      rule: [
        {
          reg: /^#?(sjz|三角洲)?(每日|行动门)密码$/,
          fnc: 'sjz'
        },
      ]
    })
  }


  async sjz(e) {
    let data = await get_data('http://sjz-mrmm.api.xt-url.com/')
    data = await data.json()
    let msg = [
      `${data.UpdatedData}`
    ]
    // 遍历data.passwords并输出key和value
    for (let key in data.passwords) {
      let value = data.passwords[key]
      msg.push(`【${key}】：${value}`)
    }
    msg = msg.join('\n')
    e.reply(msg, true)
    return true
  }
}