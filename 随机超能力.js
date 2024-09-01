// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file
// 单文件版本已停止更新，请安装新版本使用 https://github.com/xiaotian2333/special-ability
// 欢迎投稿超能力列表，前往新版本页面即可查看要求

// 能力列表链接
const cnl_url = 'https://oss.xt-url.com/超能力/超能力列表.txt'
const cnl_url_pro = 'https://oss.xt-url.com/超能力/超能力列表pro.txt'
// 能力列表pro
const fzy_url = 'https://oss.xt-url.com/超能力/副作用列表.txt'
const fzy_url_pro = 'https://oss.xt-url.com/超能力/副作用列表pro.txt'
// 本地列表路径，具体到txt文件，要求utf-8编码
const cnl_file = 'D:/资料/github-blog仓库/oss/超能力/测试列表1.txt'
const fzy_file = 'D:/资料/github-blog仓库/oss/超能力/测试列表2.txt'
// 功能开关选项
const ispro = false
const islocal = false

import fs from 'fs'

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

/** 
 * 获取本地列表，返回一个数组
 * @param filePath 本地文件路径
*/
async function read_File(filePath) {
    try {
        let data = fs.readFileSync(filePath, 'utf8')
        data = data.split(/\r?\n/)
        data = data.filter(line => line.trim() !== '')
        return data
    } catch (err) {
        logger.error('[随机超能力]读取文件时发生错误：', err)
    }
}


// 读取超能力列表
let cnl_list = await get_data(cnl_url)
// 读取副作用列表
let fzy_list = await get_data(fzy_url)
// 当pro标识开启时并入pro列表
if (ispro) {
    cnl_list.push(...await get_data(cnl_url_pro))
    fzy_list.push(...await get_data(fzy_url_pro))
}
// 当本地标识开启时并入本地列表
if (islocal) {
    cnl_list.push(...await read_File(cnl_file))
    fzy_list.push(...await read_File(fzy_file))
}

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
                    reg: "^#?超能力$",
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