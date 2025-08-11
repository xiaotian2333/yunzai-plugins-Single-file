// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file
// 由于hosts文件权限问题，需要以root权限（linux）或Administrator权限（windows）运行云崽
// 否则无法写入hosts文件


import { get } from 'https';
import { createConnection } from 'net';
import fs from 'fs';
import path from 'path';
import cfg from '../../lib/config/config.js';
import makeConfig from "../../lib/plugins/config.js";

// 配置区
const PORT = 443;       // 测试用的 TCP 端口，可按需改为 80 或其它
const TIMEOUT = 3000;   // 单次连接超时 (ms)
const TRY_COUNT = 3;    // 每个 IP 测试次数
const pluginName = "自动优选签名IP"; // 插件名字


/**
 * 从 ICQQ 插件的配置文件中读取 sign_api_addr
 * @returns {Promise}
 * 从ICQQ-plugin里面扣的代码
 */
const { config, configSave } = await makeConfig("ICQQ", {
    tips: "",
    permission: "master",
    markdown: {
        mode: false,
        button: false,
        callback: true,
    },
    bot: {},
    token: [],
}, {
    tips: [
        "欢迎使用 TRSS-Yunzai ICQQ Plugin ! 作者：时雨🌌星空",
        "参考：https://github.com/TimeRainStarSky/Yunzai-ICQQ-Plugin",
    ],
})

/**
 * 获取 A 记录里的所有 IP
 * @param {string} _DNS_API - DNS API 地址，接受DNS JSON API查询链接输入
 * @returns {Promise<string[]>} IP 地址数组
 */
function fetchIpList(_DNS_API) {
    return new Promise((resolve, reject) => {
        get(_DNS_API, res => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(raw);
                    const ips = (json.Answer || [])
                        .filter(x => x.type === 1)  // 只要 type=1 (A 记录)
                        .map(x => x.data);
                    resolve([...new Set(ips)]);  // 去重
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

/**
 * 单次 TCP 连接测速 
 * @param {string} ip - 要测试的 IP 地址
 * @param {number} port - 要测试的端口号
 * @param {number} timeout - 连接超时时间
 * @returns {Promise<number>} 连接延迟（毫秒）
 */

function tcpPing(ip, port = PORT, timeout = TIMEOUT) {
    return new Promise(resolve => {
        const start = Date.now();
        const socket = createConnection({ host: ip, port, timeout }, () => {
            const cost = Date.now() - start;
            socket.destroy();
            resolve(cost);
        });
        const onErr = () => {   // error / timeout 都算失败
            socket.destroy();
            resolve(timeout);   // 以超时值计入
        };
        socket.on('error', onErr);
        socket.on('timeout', onErr);
    });
}

/**
 * 对某 IP 连续测 TRY_COUNT 次并计算平均值
 * @param {string} ip - 要测试的 IP 地址
 * @returns {Promise<{ip: string, avg: number}>} 包含 IP 和平均延迟的对象
 */
async function testIpLatency(ip) {
    let sum = 0;
    for (let i = 0; i < TRY_COUNT; i++) {
        const cost = await tcpPing(ip);
        sum += cost;
    }
    return { ip, avg: sum / TRY_COUNT };
}

/**
 * 主逻辑函数
 * @param {string} _DNS_API - DNS API 地址，接受DNS JSON API查询链接输入
 * @returns {Promise<string|false>} 最快的 IP 或 false
 */
async function getFastestIp(_DNS_API) {
    try {
        const ips = await fetchIpList(_DNS_API)
        if (!ips.length) return false;

        const results = await Promise.all(ips.map(testIpLatency));
        // 输出详细表格
        console.log(`[${pluginName}] 签名延迟测试`);
        console.log(`共测试 ${ips.length} 个 IP，每个 IP 测试 ${TRY_COUNT} 次`);
        console.table(results.map(r => ({
            IP: r.ip,
            'Avg (ms)': r.avg.toFixed(2)
        })));
        results.sort((a, b) => a.avg - b.avg);
        console.log(`最快 IP: ${results[0].ip} (${results[0].avg.toFixed(2)} ms)`);
        return results[0].ip;
    } catch (err) {
        return false;
    }
}

/**
 * hosts 文件更新函数
 * @param {string} FalshIP - 要写入的新 IP 地址
 * @param {string} hostName - 要更新的域名
 */
async function updateHosts(FalshIP, hostName) {
    const newHostEntry = `${FalshIP} ${hostName}`;

    // 1. 根据不同操作系统，确定 hosts 文件路径
    // Windows 路径为 %SystemRoot%\System32\drivers\etc\hosts
    // Linux 和 macOS 路径为 /etc/hosts
    const hostsPath = process.platform === 'win32'
        ? path.join(process.env.SystemRoot, 'System32', 'drivers', 'etc', 'hosts')
        : '/etc/hosts';

    try {
        // 2. 读取 hosts 文件内容
        const originalHostsContent = fs.readFileSync(hostsPath, 'utf8');

        // 将文件内容按行分割
        const lines = originalHostsContent.split(/\r?\n/);

        let entryExists = false;
        let contentChanged = false;

        // 3. 逐行检查并更新
        const newLines = lines.map(line => {
            // 使用正则表达式匹配包含目标域名的行（忽略行首的#注释）
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('#')) {
                return line; // 如果是注释行，则保持不变
            }

            // 正则表达式匹配 IP + 空白 + 域名
            const regex = new RegExp(`^(\\S+)\\s+(${hostName})$`);
            const match = trimmedLine.match(regex);

            if (match) {
                entryExists = true;
                // 如果 IP 地址与新 IP 不同，则替换为新行
                if (match[1] !== FalshIP) {
                    contentChanged = true;
                    return newHostEntry;
                }
            }
            return line; // 其他行保持不变
        });

        // 4. 如果域名不存在，则在文件末尾添加新条目
        if (!entryExists) {
            // 如果文件末尾不是空行，则先添加一个换行符
            if (originalHostsContent.length > 0 && !originalHostsContent.endsWith('\n')) {
                newLines.push('');
            }
            newLines.push(newHostEntry);
            contentChanged = true;
        }

        // 5. 如果内容有变，则写入文件
        if (contentChanged) {
            const newHostsContent = newLines.join('\n');
            fs.writeFileSync(hostsPath, newHostsContent);
            return { type: true, msg: `Hosts 文件已成功更新: ${hostName} -> ${FalshIP}` }
        } else {
            return { type: true, msg: `无需更新，Hosts 配置已是最新。` }
        }

    } catch (error) {
        // 6. 捕获并处理异常
        if (error.code === 'EPERM' || error.code === 'EACCES') {
            return { type: false, msg: '权限不足，无法修改 hosts 文件。请尝试使用管理员或 root 权限运行。' }
        } else {
            return { type: false, msg: `更新 hosts 文件时发生未知错误: ${error.message}` }
        }
    }
}

/**
 * 云崽类型判断函数
 * @returns {string} 云崽类型，返回云崽的类型，如：miao、trss、pe、yunzai
 */
function getYunzaiType() {
    const type = cfg._package.name
    if (type === 'trss-yunzai') {
        // https://github.com/TimeRainStarSky/Yunzai
        return 'trss'
    }
    if (type === 'miao-yunzai') {
        // https://github.com/yoimiya-kokomi/miao-yunzai
        return 'miao'
    }
    if (type === 'yunzai-pe') {
        // https://github.com/yunzaijs/bot
        return 'pe'
    }
    if (type === 'yunzai') {
        // 默认的云崽名，通常是云崽v2或v3的原版或轻量版
        return 'yunzai'
    }
    return 'unknown'
}

/**
 * 获取当前配置的签名 API 地址，并解析成HOST
 * @returns {Promise<string>} 返回当前配置的签名 API 的 HOST
 */
function getHostName() {
    const type = getYunzaiType()
    let sign_api_addr
    if (type === 'trss') {
        // 读取config/ICQQ.yaml
        sign_api_addr = config.bot.sign_api_addr
    } else if (type === 'miao') {
        // 读取cfg.config.bot.sign_api_addr
        sign_api_addr = cfg.config.bot.sign_api_addr
    } else {
        logger.error(`[${pluginName}]暂不支持此云崽分支自动读取签名配置`)
        return false
    }
    if (sign_api_addr) {
        return new URL(sign_api_addr).hostname
    }
    logger.error(`[${pluginName}]云崽签名配置为空，如您已完成配置请重启云崽后重试`)
    return false
}

export class testip extends plugin {
    constructor() {
        super({
            name: pluginName,
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: /^#?(优选|测试|优化)(签名|sign|qsign)?(ip|IP)$/,
                    fnc: 'testip'
                },
            ]
        })
    }

    async testip(e) {
        const HOST = getHostName()
        if (!HOST) {
            await e.reply(`错误：获取云崽签名配置失败\n暂不支持此云崽分支自动读取签名配置或签名配置为空\n详情请查看日志`)
            return true
        }

        const DNS_API = `https://dns.alidns.com/resolve?name=${HOST}&type=A`;
        const FalshIP = await getFastestIp(DNS_API)
        if (!FalshIP) {
            await e.reply(`获取 IP 失败`)
            return true
        }
        
        await e.reply(`获取到最快的 IP 为：${FalshIP}`);
        const data = await updateHosts(FalshIP, HOST);
        if (data.type) {
            await e.reply(data.msg)
        } else {
            await e.reply(data.msg)
        }
        return true
    }
}