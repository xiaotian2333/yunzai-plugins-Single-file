// 插件作者github：https://github.com/Midnight-2004/mc-wiki 
// 本仓库（https://github.com/xiaotian2333/yunzai-plugins-Single-file）仅收集

import plugin from '../../lib/plugins/plugin.js';
import puppeteer from '../../lib/puppeteer/puppeteer.js';
import { segment } from 'icqq';
import common from "../../lib/common/common.js";

export class QueryHandler extends plugin {
    constructor(query) {
        let rule = {
            reg: /^#mcwiki(.*)/,
            fnc: 'handleWikiQuery',
        }
        super({
            name: 'mcwiki',
            dsc: 'mcwiki',
            event: 'message',
            priority: 5000,
            rule: [rule],
        })
    }

    async handleWikiQuery(query) {
        let querywithoutwiki = (query + "").replace('#mcwiki', '')
        let encodeQuery = encodeURI(querywithoutwiki)
        let url = `https://zh.minecraft.wiki/w/${encodeQuery}`
        //await this.reply(url)
        const browser = await puppeteer.browserInit()
        const page = await browser.newPage()
        await page.goto(url)
        const height = await page.evaluate(() => document.documentElement.scrollHeight)
        if (height === 894) {
            return this.reply('搜索不到此结果，请检查关键词是否准确无误')
        } else
        await page.setViewport({ width: 1280, height })
        const buff = await page.screenshot()
        await page.close()
        //await this.reply(segment.image(buff))
        let message = [url]
         message.push(segment.image(buff))
         message.push('受服务器网络波动影响，如果无法加载出正确的图片，还请您重新发送或点开上面的链接进入网页查看')
        return this.reply(await common.makeForwardMsg(this.e, message))
    }
}