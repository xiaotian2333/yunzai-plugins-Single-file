/**
* 作者：xiaotian2333
* 开源地址：https://github.com/xiaotian2333/yunzai-plugins-Single-file
* 此版本为针对new-api专门优化的版本，不支持开箱即用，如只使用智谱推荐使用智谱GLM.js
* 两个版本的对话记忆、token统计互通。但智谱GLM.js将暂停更新，仅修复bug
*/

import fetch from "node-fetch"
import fs from "fs"
import schedule from 'node-schedule'

const Authorization = "" // API Key
const base_url = "http://localhost:8000/v1/chat/completions" // API接口，openai兼容
let model = "" // 模型名称
const max_log = 10 // 最大历史记录数
const plugin_name = "new-api" // 插件名称
const think_print = false // 支持思考的模型是否输出思考过程
const user_agent_disguise = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0" // 伪装ua
const Reaction = true // 是否开启表情回应
const Reaction_id = 187 // 表情id

// 多模态相关配置
let vision_enable = false // 是否开启多模态
const version_Authorization = "" // 多模态API Key
const version_url = "http://localhost:8000/v1/chat/completions" // 多模态API接口，openai兼容
const vision_model = "" // 多模态模型名称
const version_do_sample = true // 是否启用采样策略来生成文本。默认值为 true。对于需要一致性和可重复性的任务（如代码生成、翻译），建议设置为 false。
const version_top_p = 0.6 // 不懂勿动
const version_temperature = 0.8 // 不懂勿动


// 系统提示词，引导模型进行对话
// 请通过配置文件进行修改，不要直接修改代码
// 配置文件路径
const plugin_data_path = `./data/plugins/智谱GLM/` // 插件数据路径，由于历史兼容考虑，不建议修改
const system_prompt_file = `${plugin_data_path}system_prompt.json`
const model_list_file = `${plugin_data_path}model_list.json`
let system_prompt

const list = [
    '过滤词列表-156411gfchc',
    '模糊匹配-15615156htdy1',
]

// 函数：读取并解析JSON文件
// 参数：文件路径
// 返回：解析后的JSON对象
// 抛出错误：文件不存在、文件为空、JSON解析错误
function readJsonFile(path) {
    if (!fs.existsSync(path)) {
        throw new Error(`配置文件不存在`)
    }

    const stats = fs.statSync(path)
    if (stats.size === 0) {
        throw new Error(`配置文件为空`)
    }

    const data = fs.readFileSync(path, 'utf8')
    return JSON.parse(data)
}


// 下载系统提示词
async function Download_file(url, path) {
    try {
        // 确保目录存在
        fs.mkdirSync(plugin_data_path, { recursive: true })
        // 发送HTTP请求下载文件
        logger.debug(`[${plugin_name}]正在下载来自 ${url} 的文件`)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'new-api (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
            }
        })
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`[${plugin_name}]网络请求错误：\n${response.status}`)
        }
        // 解析响应数据为JSON
        const data = await response.json()
        logger.debug(`[${plugin_name}]文件下载完备：\n${data}`)
        // 将数据保存到文件
        await fs.promises.writeFile(path, JSON.stringify(data))
        return true
    } catch (error) {
        // 捕获并打印错误信息
        //logger.error(`[${plugin_name}]配置文件下载失败：\n`, error)
        return false
    }
}

// 重新读取配置文件
async function read_config() {
    try {
        system_prompt_list = await readJsonFile(system_prompt_file)
        model_list = await readJsonFile(model_list_file)
        return false
    } catch (err) {
        logger.error(`[${plugin_name}]读取或解析JSON文件时出错:`, err.message)
        return `读取或解析JSON文件时出错: \n${err.message}`
    }
}

// 动态变量实时替换
function replace_var(str, nickname) {
    const date = new Date(Date.now())

    // 年月日
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0') // 月份从0开始，需要加1，并确保是两位数
    const day = String(date.getDate()).padStart(2, '0')
    // 时分秒
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const second = String(date.getSeconds()).padStart(2, '0')

    str = str.replace(/\$\{Bot\.nickname\}/, `${nickname}`)
    str = str.replace(/\$\{now_date\}/, `${year}年${month}月${day}日`)
    str = str.replace(/\$\{now_time\}/, `${hour}时${minute}分${second}秒`)
    return str
}

/** 时间戳转可视化日期函数
 * @param timestamp 毫秒级时间戳
 * 返回格式参考：2023,10,05
 */
function formatTimestamp(timestamp = Date.now()) {
    const date = new Date(timestamp)

    // 获取年、月、日
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0') // 月份从0开始，需要加1，并确保是两位数
    const day = String(date.getDate()).padStart(2, '0')

    // 格式化日期字符串
    const formattedDate = `${year},${month},${day}`

    return formattedDate
}

/** 休眠函数
 * @time 毫秒
 */
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time))
}

/**
 * 获取用户引用的消息
 * @param {Object} getReply - 引用消息对象
 * @return {list<object>} - 返回引用的消息内容
 */
async function get_quote_message(getReply) {
    if (typeof getReply === 'function') {
        try {
            const reply = await getReply()
            if (reply.message) {
                return reply.message
            }
        }
        catch (err) {
            logger.warn(`[${plugin_name}]引用消息获取失败，错误信息：${err}`)
            return false
        }
    }
}

/**
 * 将消息列表拆分并分类
 * @param {list} message 
 */
function split_message(message) {
    // 多模态相关信息初始化
    let text_list = []
    let image_list = []
    let isVision = false // 是否激活多模态处理

    // 拆分消息
    for (let i = 0; i < message.length; i++) {
        let element = message[i]

        // 分类
        if (element.type === "text") {
            // 文字
            text_list.push(element.text)

        } else if (element.type === "image") {
            // 图片
            image_list.push(element.url)
            isVision = true

        }
    }
    return {
        text_list,
        image_list,
        isVision
    }
}

/**
 * 批量删除Redis中匹配指定模式的键（完全参考你的实测代码实现）
 * @param {string} pattern - 键匹配模式，如GLM:chat_log:123456:*
 * @param {number} [count=5000] - 每次SCAN遍历的键数量（和你的代码保持一致，设为5000）
 * @returns {number} 总共删除的键数量
 */
async function batchDeleteRedisKeys(pattern, count = 5000) {
    let total = 0; // 记录总共删除的键数量
    let cursor = 0; // SCAN的游标，0表示开始迭代

    do {
        // 完全参考你的代码：scan调用方式为 cursor + 配置对象 { MATCH, COUNT }
        const res = await redis.scan(cursor, {
            MATCH: pattern,
            COUNT: count
        });
        // 更新游标（res.cursor是返回的新游标，和你的代码一致）
        cursor = res.cursor;
        // 有匹配的键时，批量删除（直接传res.keys数组，和你的代码一致）
        if (res.keys.length > 0) {
            const delCount = await redis.del(res.keys);
            total += delCount;
            // logger.info(`[${plugin_name}][批量删除] 本次删除${delCount}个键，匹配模式：${pattern}，当前游标：${cursor}`);
        }
    } while (cursor !== 0); // 游标为0时遍历结束

    return total;
}

export class bigmodel extends plugin {
    constructor() {
        super({
            name: plugin_name,
            event: 'message',
            priority: 9000,
            rule: [
                {
                    reg: /^#(智谱|new-api|gpt)?(新开|重启|重置|清空|删除|清楚|清除)(全部|所有|全局|一切|本群|此群|当前群)?(聊天|对话|记录|记忆|历史)$/,
                    fnc: 'clear',
                },
                {
                    reg: /^#(智谱|new-api|gpt)?(角色|身份|人物|设定|提示词|预设|人格)列表$/,
                    fnc: 'role_list',
                },
                {
                    reg: /^#(智谱|new-api|gpt)?(切换|更改|换)(角色|身份|人物|设定|提示词|预设|人格)/,
                    fnc: 'role',
                },
                {
                    reg: /^#(智谱|new-api|gpt)?(更新|下载|克隆)(角色|身份|人物|设定|提示词|预设|人格)?(文件|配置|配置文件|数据)?/,
                    fnc: 'pull_1',
                },
                {
                    reg: /^#(?:(智谱|new-api|gpt)(状态|info)(信息|数据)?|(状态|info)(信息|数据)?)$/,
                    fnc: 'GLM_info',
                },
                {
                    reg: /^#(智谱|new-api|gpt)?(更换|切换|换|改|设置)(模型|model)/,
                    fnc: 'model_set',
                },
                {
                    reg: '',
                    fnc: 'chat',
                    log: false
                }
            ]
        })
    }

    async chat(e) {
        // if (!e.isMaster) { return false } // 只允许主人使用

        // 先过滤非文本信息
        if (!e.msg) { return false }

        // 删除不需要的部分
        let msg = e.msg
        msg = msg.replace(' ', '')

        // 只有被艾特、私聊、命中机器人名字的消息才会被处理
        if (!(e.isPrivate || e.atme || e.atBot || msg.includes(this.e.bot.nickname))) {
            return false
        }

        // 输入过滤
        if (list.some(item => msg.includes(item))) {
            // 检测到需要过滤的词后的处理逻辑
            logger.mark(`[${plugin_name}]检测到敏感词，已过滤`)
            e.reply("输入包含敏感词，已拦截")
            return true
        }

        // 再过滤空信息
        if (!msg) {
            return false
        }
        // 消息长度限制，正常聊天200字足以，字数开放越多越容易被洗脑
        if (msg.length > 200 && !e.isMaster) {
            e.reply('输入文本长度过长')
            return true
        }

        logger.mark(`[${plugin_name}]${e.group_id}_${e.user_id} 发送了消息：${msg}`)

        if (e.isGroup && Reaction) { // 是群且开启表情回应时进行回应（私聊不支持标签回应）
            if (!Bot.pickGroup(e.group_id)?.setReaction(e.seq, Reaction_id, 1)) {
                logger.warn(`[${plugin_name}]${e.group_id}_${e.user_id} 表情回应失败，该适配器无法执行此操作`)
            }
        }

        // 多模态相关信息初始化
        let text_list = [] // 历史文本列表
        let image_list = [] // 图片列表，存储url
        let isVision = false // 是否激活多模态处理
        let backup_msg = '' // 备份消息，用于多模态处理时，防止单模特模型无法处理多模态内容


        // 引用历史消息
        let quote_message = await get_quote_message(e?.getReply)

        // 存在历史消息
        if (quote_message) {
            quote_message = split_message(quote_message)


            text_list.push(...quote_message.text_list)
            image_list.push(...quote_message.image_list)
            isVision = quote_message.isVision // 如引用的消息包含图片等多模态内容则开启多模态处理
        }

        // 判断用户消息是否有图片
        let user_message = split_message(e.message)
        if (user_message.isVision) {
            image_list.push(...user_message.image_list)
            isVision = isVision || user_message.isVision // 如用户消息包含图片等多模态内容则开启多模态处理，如本身已激活则保持激活
        }

        // 判断引用的消息是否有图片
        if (isVision && vision_enable) {
            // 多模态处理
            let version_msg = []
            for (let i = 0; i < image_list.length; i++) {
                version_msg.push({
                    "type": "image_url",
                    "image_url": {
                        "url": image_list[i]
                    }
                })
            }

            // 添加引导词
            if (text_list.length > 0) {
                version_msg.push({
                    "type": "text",
                    "text": `用户引用了一些图片和历史消息，这些图片和历史消息大概率会帮助回答用户问题，但也有小概率不关联。历史消息内容如下：\n${text_list.join('\n')}\n以下是用户的输入：\n${msg}`
                })
            } else {
                version_msg.push({
                    "type": "text",
                    "text": `用户引用了一些图片，图片大概率会帮助回答用户问题，但也有小概率不关联，以下是用户的输入：\n${msg}`
                })
            }
            // 创建文本模型兼容消息，作为放入redis的历史消息存储
            backup_msg = `用户引用了一些图片，已由其他模型处理并回答，如用户询问请根据上下文回答用户问题，以下是用户引用图片时的输入：\n${msg}`

            msg = version_msg
        } else if (text_list > 0) {
            // 没有激活多模态处理，但引用了消息
            msg = `用户引用了这些历史消息：${text_list.join('\n')}\n以上消息可能会帮助回答用户问题，但也有可能不关联，以下是用户的输入：\n${msg}`
        }

        let msg_log = await redis.type(`GLM:chat_log:${e.group_id}:${e.user_id}`)
        if (msg_log == 'none') {
            // 如果msg_log不存在，初始化msg_log
            msg_log = [{
                "role": "system",
                "content": system_prompt
            }]

        } else {
            // 如果msg_log存在，获取msg_log
            msg_log = await redis.get(`GLM:chat_log:${e.group_id}:${e.user_id}`)
            msg_log = JSON.parse(msg_log)
        }
        // 添加聊天信息
        const backup_msg_log = [...msg_log]

        msg_log.push({
            "role": "user",
            "content": msg
        })

        // 限制聊天记录长度
        if (msg_log.length > max_log) {
            // 删除除system_prompt之外的最旧记录
            msg_log.splice(1, 1)
        }

        // 实时修改system_prompt
        msg_log[0].content = replace_var(system_prompt, this.e.bot.nickname)

        let data = {}
        let llm_url = base_url
        let api_key = Authorization
        // 构建请求体
        if (isVision && vision_enable) {
            // 多模态处理
            logger.debug(`[${plugin_name}]进入多模态处理，构建多模态请求`)
            llm_url = version_url
            api_key = version_Authorization
            data = {
                model: vision_model,
                messages: msg_log,
                do_sample: version_do_sample,
                temperature: version_temperature,
                top_p: version_top_p,
                stream: false,
                user_id: `${e.group_id}_${e.user_id}`,
            }
        } else {
            // 单模态处理
            logger.debug(`[${plugin_name}]未激活多模态处理，构建文本请求`)
            data = {
                model: model,
                messages: msg_log,
                do_sample: true,
                temperature: 0.8, // 温度，0.8是默认值，可以调整
                stream: false,
                user_id: `${e.group_id}_${e.user_id}`,
            }
        }

        // 网络请求
        let Reply = await fetch(llm_url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${api_key}`,
                "User-Agent": user_agent_disguise
            },
            body: JSON.stringify(data)
        })
        Reply = await Reply.json()

        // 错误处理
        if (Reply.error) {
            e.reply(`[${plugin_name}]发生错误，响应码[${Reply.code || Reply.error.code || "无"}]\n来自API的错误信息：\n${Reply?.error?.message || Reply?.msg || "没有来自API的错误信息"}`)
            return false
        }
        // 检查choices是否存在
        if (!Reply?.choices || !Reply?.choices[0]) {
            e.reply(`[${plugin_name}]API返回格式错误：缺少回复数据`)
            logger.error(`[${plugin_name}]发生错误，缺少回复数据\n来自API的返回数据：\n${JSON.stringify(Reply)}`)
            return false
        }
        // 获取回复内容
        let content = Reply.choices[0].message.content

        // 输出过滤
        if (list.some(item => content.includes(item))) {
            // 检测到需要过滤的词后的处理逻辑
            logger.mark(`[${plugin_name}]检测到敏感词，已过滤`)
            e.reply("输出包含敏感词，已拦截")
            return true
        }

        // 过滤思考过程
        let think_text = ''
        // 标准思考处理
        if (Reply.choices[0].message?.reasoning_content) {
            logger.debug(`[${plugin_name}]检测到有思考过程`)
            think_text = Reply.choices[0].message?.reasoning_content
        }
        // 兼容早期思考输出
        else if (content.startsWith('\n<think>') || content.startsWith('<think>')) {

            logger.debug(`[${plugin_name}]检测到有思考过程`)
            // 处理think标签
            think_text = content.split('</think>')
            think_text[0] = think_text[0].replace('<think>', '').trim()
            // 过滤思考过程
            content = think_text[1].trim()
            think_text = think_text[0]
        }

        // 如果用户开启思考发送且think_text不为空，则发送思考过程
        if (think_print && think_text) {
            logger.debug(`[${plugin_name}]用户开启了发送思考过程`)
            // 发送思考过程
            let msgList = [{
                user_id: 2854200865,
                nickname: '思考过程',
                message: think_text
            }]
            await e.reply(await Bot.makeForwardMsg(msgList))
        }

        // 过滤智普多模态回复中的标记
        content = content.replace(/<\|begin_of_box\|>/, '')
        content = content.replace(/<\|end_of_box\|>/, '')

        // 过滤首尾空格
        content = content.trim()

        // 为兼容文本模型，多模态处理的消息存储为普通格式
        if (isVision && vision_enable) {
            // 多模态处理
            msg_log = backup_msg_log

            // 添加用户消息
            msg_log.push({
                "role": "user",
                "content": backup_msg
            })

            // 限制聊天记录长度
            if (msg_log.length > max_log) {
                // 删除除system_prompt之外的最旧记录
                msg_log.splice(1, 1)
            }

            // 添加模型的回答
            msg_log.push({
                "role": "assistant",
                "content": content
            })
        } else {
            // 纯文本处理
            msg_log.push({
                "role": "assistant",
                "content": content
            })
        }
        // 保存对话记录
        await redis.set(`GLM:chat_log:${e.group_id}:${e.user_id}`, JSON.stringify(msg_log), { EX: 60 * 60 * 24 * 7 }) // 保存到redis，过期时间为7天

        // 长文本分多句发送
        content = content.split('\n')

        for (const line of content) {
            e.reply(line)
            await sleep(Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000)
        }

        // 统计token用量
        // 今日用量
        let token_today = parseInt(await redis.get(`GLM:token:Today`), 10)
        if (token_today == 'none') {
            token_today = 0
        }
        await redis.set(`GLM:token:Today`, token_today + Reply.usage.total_tokens)
        // 总用量
        let token_history = parseInt(await redis.get(`GLM:token:Statistics`), 10)
        if (token_history == 'none') {
            token_history = 0
        }
        await redis.set(`GLM:token:Statistics`, token_history + Reply.usage.total_tokens)

        return true
    }

    async clear(e) {
        const ALL_Group = /全部|所有|全局|一切/;
        const Current_Group = /本群|此群|当前群/;
        // 解构关键参数
        const { group_id, user_id, isMaster, msg, reply } = e;

        // 主人发送关键词，批量删除所有对话记录
        if (isMaster && ALL_Group.test(msg)) {
            const pattern = `GLM:chat_log:*`;
            // 调用批量删除函数
            const deleteCount = await batchDeleteRedisKeys(pattern);
            logger.info(`[${plugin_name}][清理记录] 主人已清除所有对话记录，匹配模式：${pattern}，共删除${deleteCount}条`);
            await reply('已清除所有对话记录');
            return true;
        }

        // 主人发送关键词，批量删除群内对话记录
        if (isMaster && Current_Group.test(msg)) {
            const pattern = `GLM:chat_log:${group_id}:*`;
            // 调用批量删除函数
            const deleteCount = await batchDeleteRedisKeys(pattern);
            logger.info(`[${plugin_name}][清理记录] 主人已清除群${group_id}的所有对话记录，匹配模式：${pattern}，共删除${deleteCount}条`);
            await reply('已清除本群对话记录');
            return true;
        }

        // 非主人/未发送关键词：删除单个用户的对话记录
        const singleKey = `GLM:chat_log:${group_id}:${user_id}`;
        const deleteResult = await redis.del(singleKey);
        logger.info(`[${plugin_name}][清理记录] 用户${user_id}已清除群${group_id}的个人对话记录，键：${singleKey}，删除结果：${deleteResult}`);
        await reply('对话记录已清除');
        return true;
    }

    async role_list(e) {
        // 刷新配置文件
        const err = await read_config()
        if (err) {
            e.reply(err)
            return false
        }

        let name_list = ["可切换的角色身份\n"]

        Object.keys(system_prompt_list).forEach(key => {
            //console.log(`name: ${key}, key: ${system_prompt_list[key]}`)
            // 如果key为system_prompt则跳过本次循环
            if (key == 'system_prompt') {
                return
            }
            name_list.push(`${key}\n`)
        })

        e.reply(name_list)
        return true
    }

    async role(e) {
        // 只允许主人使用
        if (!e.isMaster) {
            e.reply('只有主人才能设置角色')
            return false
        }

        const name = e.msg.replace(/^#(智谱|new-api|gpt)?(切换|更改|换)(角色|身份|人物|设定|提示词|预设|人格)/, '')

        if (!name) {
            e.reply('请输入要切换的预设\n\n发送 #智谱预设列表 查看可切换的预设')
            return false
        }

        // 刷新配置文件
        const err = await read_config()
        if (err) {
            e.reply(err)
            return false
        }

        // 标记是否找到匹配的角色
        let type = false

        // 遍历人物设定
        Object.keys(system_prompt_list).forEach(key => {
            //console.log(`name: ${key}, key: ${system_prompt_list[key]}`)
            if (key == name) {
                system_prompt = system_prompt_list.system_prompt + system_prompt_list[key]
                type = true
            }
        })

        // 判断是否找到匹配的角色设定
        if (type) {
            e.reply(`人物设定已切换为${name}`)
        } else {
            e.reply(`人物设定${name}不存在，想要创建一个临时预设吗\n\n发送 #创建临时预设 进行创建`)
            this.setContext('set_system_prompt_1')
            return true
        }

        return true
    }

    async pull_1(e) {
        // 只允许主人使用
        if (!e.isMaster) {
            e.reply('只有主人才覆盖预设文件')
            return false
        }
        e.reply(`警告：此操作不可撤销！！！\n\n确定要进行下载吗，这将会覆盖当前的配置文件\n\n确定覆盖发送 #确认覆盖预设文件 进行下一步操作`)
        this.setContext('pull_2')
        return true
    }

    async pull_2(e) {
        e = this.e
        this.finish('pull_2')
        // 只允许主人使用
        if (!e.isMaster) {
            e.reply('只有主人才覆盖预设文件')
            return false
        }
        if (e.msg == '#确认覆盖预设文件') {
            const type = await Download_file(model_list.system_prompt_url, system_prompt_file)
            if (type) {
                e.reply(`配置文件覆盖成功`)
                return true
            } else {
                e.reply(`配置文件覆盖失败`)
                return true
            }
        } else {
            e.reply(`未发送确认指令，取消覆盖预设文件`)
            return true
        }
    }

    async set_system_prompt_1(e) {
        e = this.e
        this.finish('set_system_prompt_1')
        // 只允许主人使用
        if (!e.isMaster) {
            e.reply('只有主人才创建临时预设')
            return false
        }
        // 删除不需要的部分
        let msg = e.msg
        msg = msg.replace(' ', '')

        if (msg == '#创建临时预设') {
            e.reply(`请发送要设置的提示词`)
            this.setContext('set_system_prompt_2')
            return true
        } else {
            return true

        }
    }

    async set_system_prompt_2(e) {
        e = this.e
        // 只允许主人使用
        if (!e.isMaster) {
            e.reply('只有主人才创建临时预设')
            return false
        }
        // 删除不需要的部分
        let msg = e.msg
        msg = msg.replace(' ', '')

        if (!msg) {
            e.reply(`请发送要设置的提示词`)
            return true
        } else {
            this.finish('set_system_prompt_2')
            system_prompt = msg
            e.reply(`已创建并应用临时预设：\n${system_prompt}`)
            return true
        }
    }

    async GLM_info(e) {
        // 取token用量
        const token_today = parseInt(await redis.get(`GLM:token:Today`), 10)
        const token_history = parseInt(await redis.get(`GLM:token:Statistics`), 10)

        // 取随机提示
        const tips = model_list.tips[Math.floor(Math.random() * model_list.tips.length)]

        // 构建信息
        const msg = [
            `=====${plugin_name}当前状态=====\n`,
            `今日token消耗：${token_today}\n`,
            `累计token消耗：${token_history}\n`,
            `当前模型：${model}\n`,
            `数据版本：${model_list.version}\n`,
            `思考输出：${think_print ? '开启' : '关闭'}\n`,
            `多模态能力：${vision_enable ? '开启' : '关闭'}\n`,
            `=====================\n`,
            `Tip：${tips}`

        ]

        // 发送信息
        e.reply(msg)
        return true
    }

    async model_set(e) {
        // 只允许主人使用
        if (!e.isMaster) {
            e.reply('只有主人才能更改模型')
            return false
        }

        // 获取命令参数
        const model_name = e.msg.replace(/^#(智谱|new-api|gpt)?(更换|切换|换|改|设置)(模型|model)\s*/, '')
        if (!model_name) {
            e.reply('请指定要切换的模型名称')
            return false
        }

        // 切换模型，不再检查模型是否存在
        model = model_name
        e.reply(`已切换模型为：${model_name}`)
        return true
    }
}

// 以下代码在插件载入时执行一次

// 检测模型列表文件是否存在
if (!fs.existsSync(model_list_file)) {
    logger.mark(`[${plugin_name}]模型列表不存在，开始下载`)
    const type = await Download_file('https://oss.xt-url.com/GPT-Config/model_list.json', model_list_file)
    if (type) {
        logger.mark(`[${plugin_name}]模型列表下载成功`)
    } else {
        logger.error(`[${plugin_name}]模型列表下载失败`)
    }
}

// 全局动态变量model_list
let model_list = await readJsonFile(model_list_file)

// 检查配置文件是否存在
if (!fs.existsSync(system_prompt_file)) {
    logger.mark(`[${plugin_name}]配置文件不存在，开始下载`)
    const type = await Download_file(model_list.system_prompt_url, system_prompt_file)
    if (type) {
        logger.mark(`[${plugin_name}]配置文件下载成功`)
    } else {
        logger.error(`[${plugin_name}]配置文件下载失败`)
    }
}

// 动态全局变量system_prompt_list
let system_prompt_list = await readJsonFile(system_prompt_file)

// 设置初始system_prompt
if (!system_prompt) {
    system_prompt = system_prompt_list.system_prompt + model_list.default_prompt
}

// 每日统计token
schedule.scheduleJob('0 0 0 * * *', async () => {
    //schedule.scheduleJob('1 * * * * *', async () => { // 测试用
    logger.mark(`[${plugin_name}]开始统计昨日token`)
    try {
        // 获取Redis中的数据
        const token_history = parseInt(await redis.get(`GLM:token:Today`), 10)

        // 重置Redis中的数据
        await redis.set(`GLM:token:Today`, 0)

        // 写入CSV文件
        fs.appendFileSync(`${plugin_data_path}/token_log.csv`, `${formatTimestamp(new Date() - 24 * 60 * 60 * 1000)},${token_history}\n`, 'utf8')
    } catch (error) {
        logger.error(`[${plugin_name}]导出数据失败: ${error}`)
    }
});

// 每日检测模型更新
schedule.scheduleJob('0 0 2 * * *', async () => {
    //schedule.scheduleJob('1 * * * * *', async () => { // 测试用
    logger.mark(`[${plugin_name}]开始检查模型列表更新`)

    // 获取把本地模型列表版本
    model_list = await readJsonFile(model_list_file)

    // 获取云端模型列表版本
    let Reply = await fetch('https://oss.xt-url.com/GPT-Config/model_list.json', {
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "new-api (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)"
        }
    })
    Reply = await Reply.json()

    // 比较版本号
    if (Reply.version == model_list.version) {
        logger.mark(`[${plugin_name}]模型列表已是最新版本`)
    } else {
        logger.mark(`[${plugin_name}]发现新版本模型列表，正在更新中...`)

        // 更新本地模型列表
        fs.writeFileSync(model_list_file, JSON.stringify(Reply));

        logger.mark(`[${plugin_name}]模型列表更新完成`)
    }
});

// 旧版本redis数据升级
(async () => {
    let migrateDone = {}

    try {
        migrateDone.token_today = await redis.get(`GLM_chat_token/today`)
        if (migrateDone.token_today) {
            await redis.set(`GLM:token:Today`, migrateDone.token_today)
            await redis.del(`GLM_chat_token/today`)
        }

        migrateDone.token_history = await redis.get(`GLM_chat_token/Statistics`)
        if (migrateDone.token_history) {
            await redis.set(`GLM:token:Statistics`, migrateDone.token_history)
            await redis.del(`GLM_chat_token/Statistics`)
        }

    } catch (error) {
        logger.error(`[${plugin_name}] Redis数据迁移失败: ${error.stack}`)
    } finally {
        migrateDone = null
    }
})()