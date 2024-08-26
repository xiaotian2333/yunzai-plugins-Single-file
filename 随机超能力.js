// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file

// 欢迎投稿超能力列表，前往 https://github.com/xiaotian2333/yunzai-plugins-Single-file/discussions/3 即可投稿

// 能力列表链接
const cnl_url = 'https://oss.xt-url.com/超能力列表.txt'
const fzy_url = 'https://oss.xt-url.com/副作用列表.txt'

/**
 * 获取能力列表，返回一个数组
 * @param url 资源列表链接
 */
async function get_data(url) {
    let result = await fetch(url, {
      headers: {
        'User-Agent': 'Special-ability(author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
      }
    })
    result = await result.text()
    return result.split(/\r?\n/)
  }

// 读取超能力列表
const cnl_list = await get_data(cnl_url)
// 读取副作用列表
const fzy_list = await get_data(fzy_url)

import plugin from '../../lib/plugins/plugin.js'
logger.info("随机超能力初始化完毕")

export class nb extends plugin {
    constructor() {
        super({
            name: '随机超能力',
            dsc: '获取一个超能力及对应的副作用',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: "超能力",
                    fnc: 'nb'
                }
            ]
        })
    }

    async nb(e) {
        // 随机选择一行  
        const cnl = cnl_list[Math.floor(Math.random() * cnl_list.length)]
        const fzy = fzy_list[Math.floor(Math.random() * fzy_list.length)]
        e.reply(`你的超能力是：\n${cnl}\n但是：\n${fzy}`, true)
        return true
    }
}