/**
* 作者：xiaotian2333
* 开源地址：https://github.com/xiaotian2333/yunzai-plugins-Single-file
*/

/** 冷却相关配置 */
const cd = 3 // 一天只能触发1次
const cd_tips = "今天的次数就这么多，明天继续吧" // 冷却提示
let user_cd = {} // 初始化冷却数据

/** 反悔相关配置 */
const regret = true // 是否允许反悔
let regret_data = {} // 初始化反悔数据


/**
 * 将“一行一段话”的字符串转换为数组（支持过滤空行）
 * @param {string} str - 输入的字符串（一行一段话）
 * @returns {string[]} 转换后的数组
 */
function strToLineList(str) {
    // 分割换行符：兼容 \n（Linux/macOS）和 \r\n（Windows）
    const lines = str.split(/\r?\n/);
    // 过滤空行，去除纯空格/制表符的行
    return lines.filter(line => line.trim() !== '');
}

/**统一网络请求函数
* @param {string} url 要请求的url
* @returns {string[]} 数组
*/
async function get_data(url) {
    let result = await fetch(url, {
        headers: {
            'User-Agent': 'Random-Title (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
        },
    })
    result = await result.text()
    return strToLineList(result)
}

let 名字 = await get_data("https://oss.xt-url.com/%E7%BD%91%E6%98%93%E9%9A%8F%E6%9C%BA%E5%90%8D/%E5%90%8D%E5%AD%97.txt")
let 形容词 = await get_data("https://oss.xt-url.com/%E7%BD%91%E6%98%93%E9%9A%8F%E6%9C%BA%E5%90%8D/%E5%BD%A2%E5%AE%B9%E8%AF%8D.txt")

export class example extends plugin {
    constructor() {
        super({
            name: "抽头衔",
            event: "message.group",
            priority: 2000,
            rule: [
                {
                    reg: /^#?抽头衔$/,
                    fnc: 'ctx'
                },
                {
                    reg: /^#?反悔$/,
                    fnc: 'fh'
                }
            ]
        }),
            this.task = {
                cron: '0 0 0 * * *',
                name: '定时重置冷却',
                fnc: () => this.Reset_cd(), // 指触发的函数
                log: false // 是否输出日志
            }
    }


    // 重置冷却数据
    async Reset_cd() {
        user_cd = {}
        logger.mark(`[抽头衔] 冷却已重置`)
    }

    async ctx(e) {
        // 检查机器人是否是群主
        if (!e.group.is_owner) return e.reply("我又不是群主，做不到啊")

        // 检查每日使用次数
        // 字段不存在则默认0，存在则保留原值
        user_cd[e.user_id] = user_cd[e.user_id] ?? 0

        // 到达边界提示
        if (user_cd[e.user_id] == cd) {
            e.reply(cd_tips)
            user_cd[e.user_id] += 1
            return true
        }

        // 已越界，不再回复消息
        if (user_cd[e.user_id] > cd) {
            user_cd[e.user_id] += 1
            return true
        }

        // 加入冷却
        user_cd[e.user_id] += 1

        const txt = `${形容词[Math.floor(Math.random() * 形容词.length)]}${名字[Math.floor(Math.random() * 名字.length)]}`
        e.group.setTitle(e.user_id, txt)
        e.reply(`你的新头衔是${txt}`)
        regret_data[e.user_id] = e.sender.title
        return true
    }

    async fh(e) {
        // 没有开启反悔
        if (!regret) {
            e.reply("反悔无效，受着")
            return false
        }
        // 没有历史数据
        if (!regret_data[e.user_id]) {
            e.reply("忘了你上一个是啥了，现在这个先用着吧")
            return false
        }
        // 历史与当前一致
        if (regret_data[e.user_id] === e.sender.title) {
            e.reply("你又没抽新的，反悔个什么玩意？")
            return false
        }
        // 反悔流程
        e.group.setTitle(e.user_id, regret_data[e.user_id])
        e.reply("哼哼，给你新的你也不敢用啊")
        return true
    }
}