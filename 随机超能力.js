// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file

import fs from 'fs'

// 文件路径  
const cnl_path = 'D:/资料/github-blog仓库/oss超能力列表.txt'
const fzy_path = 'D:/资料/github-blog仓库/oss副作用列表.txt'

const cnl_url = ''
const fzy_url = ''

// 读取超能力列表
let cnl_list = []
try {
    cnl_list = fs.readFileSync(cnl_path, 'utf8')
    cnl_list = cnl_list.split(/\r?\n/)

    if (cnl_list.length > 0) {
        logger.error('超能力列表文件为空')
    }
} catch (error) {
    // 处理可能的错误，比如文件不存在或读取权限问题
    logger.error('读取文件时发生错误:', error)
}

// 读取超能力列表
let fzy_list = []
try {
    fzy_list = fs.readFileSync(fzy_path, 'utf8')
    fzy_list = fzy_list.split(/\r?\n/)

    if (fzy_list.length > 0) {
        logger.error('副作用列表文件为空')
    }
} catch (error) {
    // 处理可能的错误，比如文件不存在或读取权限问题
    logger.error('读取文件时发生错误:', error)
}

import plugin from '../../lib/plugins/plugin.js'

export class nb extends plugin {
    constructor() {
        super({
            name: '综合帮助',
            dsc: '发送综合帮助图片',
            event: 'message',
            priority: -99999,
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
        e.reply(`你的超能力是：\n${cnl}\n但是：\n${fzy}`)
        return true
    }
}