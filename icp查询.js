import { parse } from 'url';
import { encode } from 'punycode';

function extractMainDomain(input) {
    // 处理空输入
    if (!input || typeof input !== 'string') {
        return '';
    }

    // 确保输入有协议，方便url模块解析
    let normalizedInput = input;
    if (!/^https?:\/\//i.test(normalizedInput)) {
        normalizedInput = 'http://' + normalizedInput;
    }

    // 使用Node.js内置url模块解析
    const parsedUrl = parse(normalizedInput);
    let domain = parsedUrl.hostname;

    // 如果解析失败，尝试直接处理输入
    if (!domain) {
        // 移除端口号、路径、查询参数和哈希
        const separatorIndex = input.search(/[/?#:]/);
        if (separatorIndex !== -1) {
            domain = input.substring(0, separatorIndex);
        } else {
            domain = input;
        }
    }

    // 处理主域名提取（考虑常见的多部分顶级域名）
    const multiPartTLDs = ['co.uk', 'com.cn', 'org.cn', 'net.cn', 'gov.cn', 'ac.cn', 'eu.org', 'com.hk', 'org.hk'];
    const parts = domain.split('.');

    // 简单情况：本身就是主域名（如 mihoyo.com）
    if (parts.length <= 2) {
        return encodePunycode(domain);
    }

    // 检查是否包含多部分顶级域名
    for (const tld of multiPartTLDs) {
        const tldParts = tld.split('.');
        const tldLength = tldParts.length;

        // 检查域名最后几个部分是否匹配多部分顶级域名
        if (parts.length >= tldLength + 1) {
            const domainTld = parts.slice(-tldLength).join('.');
            if (domainTld === tld) {
                const mainDomain = parts.slice(-tldLength - 1).join('.');
                return encodePunycode(mainDomain);
            }
        }
    }

    // 普通情况：取最后两个部分作为主域名
    const mainDomain = parts.slice(-2).join('.');
    return encodePunycode(mainDomain);
}

// 将包含非ASCII字符的域名转换为Punycode编码(xn--格式)
function encodePunycode(domain) {
    // 检查是否包含非ASCII字符
    if (/[^\x00-\x7F]/.test(domain)) {
        try {
            // 分割域名部分进行编码
            return domain.split('.')
                .map(part => {
                    // 只对包含非ASCII的部分进行编码
                    if (/[^\x00-\x7F]/.test(part)) {
                        return 'xn--' + encode(part);
                    }
                    return part;
                })
                .join('.');
        } catch (e) {
            console.error('Punycode编码失败:', e);
            return domain;
        }
    }
    return domain;
}

export class icp extends plugin {
    constructor() {
        super({
            name: 'magnet',
            dsc: 'ICP查询',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: /^#?(ICP|icp|备案)?(强制)?查询/,
                    fnc: 'icp'
                }
            ]
        })
    }

    async icp(e) {
        let domain = e.msg
        domain = await domain.replace(/^#?(ICP|icp|备案)?(强制)?查询/, '')
        // 常规查询
        if (e.msg.includes('强制')) {
            logger.debug(`域名[${domain}]触发强制查询`)
        } else {
            domain = extractMainDomain(domain)
        }

        const url = `https://icp.2x.nz/?domain=${domain}`  // 感谢二叉树树提供的接口
        let res = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'icp-query (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
            }
        })
        if (res.status !== 200) {
            logger.error(`域名[${domain}]查询失败`)
            e.reply('查询失败，请稍后再试', true)
            return false
        }
        res = await res.json()
        const icp = res.params.list[0]
        // 为空则没有备案信息
        if (!icp) {
            e.reply('该域名未备案', true)
            return true
        }
        // 构建消息
        let msg = [
            `域名：${domain}`,
            `${icp.natureName}备案：${icp.unitName}`,
            `备案号：${icp.serviceLicence}`,
        ]
        msg = msg.join("\n")
        e.reply(msg, true)
        return true
    }
}