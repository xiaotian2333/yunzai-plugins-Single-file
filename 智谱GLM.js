/**
* 作者：xiaotian2333
* 开源地址：https://github.com/xiaotian2333/yunzai-plugins-Single-file
*/

import fetch from "node-fetch"
import fs from "fs"
import schedule from 'node-schedule'

// 智谱API Key，需要自行申请(需实名)
// 申请链接：https://www.bigmodel.cn/invite?icode=iGW2wQ0KiXGc0PVU%2BeTSFEjPr3uHog9F4g5tjuOUqno%3D

// 可不填，不填则使用沉浸式翻译的Token（仅可使用 glm-4-flash（旧版），glm-4-flash-250414（新版），glm-z1-flash（推理） 模型，其他模型需自行申请）
const Authorization = "" //智谱API Key
const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions" //智谱API接口,不要修改
let model = "glm-4-flash-250414" //模型名称
let web_search = false //是否使用web搜索，从2025年6月1日0点起，收费单价为0.01元/次，因此改为默认关闭
const search_engine = "search_std" //搜索引擎名称，参考：https://www.bigmodel.cn/pricing
const max_log = 10 //最大历史记录数
const plugin_name = "智谱GLM" //插件名称
const Bot_name = Bot.nickname //机器人名称
const think_print = true //支持思考的模型是否输出思考过程

// 系统提示词，引导模型进行对话
// 请通过配置文件进行修改，不要直接修改代码
// 配置文件路径
const plugin_data_path = `./data/plugins/智谱GLM/`
const system_prompt_file = `${plugin_data_path}system_prompt.json`
const model_list_file = `${plugin_data_path}model_list.json`
let system_prompt = ``

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


// 生成32位随机字符串
function randomString() {
    let str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let res = ""
    for (let i = 0; i < 32; i++) {
        let id = Math.ceil(Math.random() * str.length)
        res += str.charAt(id)
    }
    return res
}

// 获取Token
async function get_token() {
    // 如果Authorization存在，直接返回
    if (Authorization) {
        return Authorization
    }

    // 检查Token是否存在
    let token = await redis.type("GLM_token")
    // 如果Token不存在，获取新的Token
    if (token == 'none') {
        token = await fetch(`https://api2.immersivetranslate.com/big-model/get-token?deviceId=${randomString()}`)
        token = await token.json()
        logger.debug(`[${plugin_name}]获取到新的Token：${token.apiToken}`)
        await redis.set('GLM_token', token.apiToken, { EX: token.expireTime }) // 保存到redis
    }
    // 返回Token
    return await redis.get('GLM_token')
}

// 下载系统提示词
async function Download_file(url, path) {
    try {
        // 确保目录存在
        fs.mkdirSync(plugin_data_path, { recursive: true })
        // 发送HTTP请求下载文件
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'GLM (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
            }
        })
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`[${plugin_name}]网络请求错误：\n${response.status}`)
        }
        // 解析响应数据为JSON
        const data = await response.json()
        // 将数据保存到文件
        await fs.promises.writeFile(path, JSON.stringify(data))
        return true
    } catch (error) {
        // 捕获并打印错误信息
        //logger.error(`[${plugin_name}]配置文件下载失败：\n`, error)
        return false
    }
}

// 获取默认系统提示词
async function get_default_prompt() {
    const system_prompt_list = readJsonFile(system_prompt_file)
    Object.keys(system_prompt_list).forEach(key => {
        return system_prompt_list[key]
    })
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

export class bigmodel extends plugin {
    constructor() {
        super({
            name: '智谱GLM',
            event: 'message',
            priority: 9000,
            rule: [
                {
                    reg: /^#(智谱|[Gg][Ll][Mm])?(新开|重启|重置|清空|删除|清楚|清除)(聊天|对话|记录|记忆|历史)/,
                    fnc: 'clear',
                },
                {
                    reg: /^#(智谱|[Gg][Ll][Mm])?(角色|身份|人物|设定|提示词|预设|人格)列表/,
                    fnc: 'role_list',
                },
                {
                    reg: /^#(智谱|[Gg][Ll][Mm])?(切换|更改|换)(角色|身份|人物|设定|提示词|预设|人格)/,
                    fnc: 'role',
                },
                {
                    reg: /^#(智谱|[Gg][Ll][Mm])?(更新|下载|克隆)(角色|身份|人物|设定|提示词|预设|人格)?(文件|配置|配置文件|数据)?/,
                    fnc: 'pull_1',
                },
                {
                    reg: /^#(?:(智谱|[Gg][Ll][Mm])(状态|info)(信息|数据)?|(状态|info)(信息|数据)?)$/,
                    fnc: 'GLM_info',
                },
                {
                    reg: /^#(智谱|[Gg][Ll][Mm])?(模型|model)(列表|信息|数据)?/,
                    fnc: 'model_list_help',
                },
                {
                    reg: /^#(智谱|[Gg][Ll][Mm])?(强制|强行)?(更换|切换|换|改|设置)(模型|model)/,
                    fnc: 'model_set',
                },
                {
                    reg: /^#(智谱|[Gg][Ll][Mm])?(开启|打开|关闭|取消)(联网|搜索|网络)/,
                    fnc: 'web_search_set',
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

        // 只有被艾特和私聊的消息才会被处理
        if (!(e.isPrivate || e.atme || e.atBot || msg.includes(Bot_name))) {
            return false
        }

        // 输入过滤
        if (list.some(item => msg.includes(item))) {
            // 检测到需要过滤的词后的处理逻辑，默认不理人
            logger.mark(`[${plugin_name}]检测到敏感词，已过滤`)
            e.reply("输入包含敏感词，已拦截")
            return true
        }

        // 再过滤空信息
        if (!msg) {
            e.reply('请输入内容')
            return false
        }
        // 消息长度限制，正常聊天200字足以，字数开放越多越容易被洗脑
        if (msg.length > 200) {
            e.reply('输入文本长度过长')
            return true
        }

        logger.mark(`[${plugin_name}]${e.group_id}_${e.user_id} 发送了消息：${msg}`)
        let msg_log = await redis.type(`GLM_chat_log/${e.group_id}_${e.user_id}`)


        if (msg_log == 'none') {
            // 如果msg_log不存在，初始化msg_log
            msg_log = [{
                "role": "system",
                "content": system_prompt
            }]

        } else {
            // 如果msg_log存在，获取msg_log
            msg_log = await redis.get(`GLM_chat_log/${e.group_id}_${e.user_id}`)
            msg_log = JSON.parse(msg_log)
        }
        // 添加聊天信息
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
        msg_log[0].content = system_prompt

        // 构建请求体
        const data = {
            "model": model,
            "messages": msg_log,
            "do_sample": "true",
            "temperature": "0.8", // 温度，0.8是默认值，可以调整
            "stream": "false",
            "user_id": `${e.group_id}_${e.user_id}`,
            "tools": [{
                "type": "web_search",
                "web_search": {
                    "enable": web_search,
                    "search_engine": search_engine,  // 选择搜索引擎类型
                }
            }]
        }
        // 网络请求
        let Reply = await fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": await get_token(),
                "User-Agent": "GLM (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)"
            },
            body: JSON.stringify(data)
        })
        Reply = await Reply.json()
        // 错误处理
        if (Reply.error) {
            e.reply(`发生错误：\n${Reply.error.message}`)
            return false
        }
        // 获取回复内容
        let content = Reply.choices[0].message.content

        // 过滤思考过程
        if (content.startsWith('\n<think>') || content.startsWith('<think>')) {
            // 检测到有思考过程
            logger.debug(`[${plugin_name}]检测到有思考过程`)

            let think_text = content.split('</think>')
            think_text[0] = think_text[0].replace('<think>', '').trim()
            content = think_text[1].trim()

            if (think_print) {
                logger.debug(`[${plugin_name}]用户开启了发送思考过程`)
                // 发送思考过程
                let msgList = [{
                    user_id: 2854200865,
                    nickname: '思考过程',
                    message: think_text[0]
                }]
                await e.reply(await Bot.makeForwardMsg(msgList))
            }
        }

        content = content.trim()
        // 添加到对话记录
        msg_log.push({
            "role": "assistant",
            "content": content
        })

        // 保存对话记录
        await redis.set(`GLM_chat_log/${e.group_id}_${e.user_id}`, JSON.stringify(msg_log), { EX: 60 * 60 * 24 * 7 }) // 保存到redis，过期时间为7天
        e.reply(content)

        // 统计token用量
        // 今日用量
        let token_today = parseInt(await redis.get(`GLM_chat_token/today`), 10)
        if (token_today == 'none') {
            token_today = 0
        }
        await redis.set(`GLM_chat_token/today`, token_today + Reply.usage.total_tokens)
        // 总用量
        let token_history = parseInt(await redis.get(`GLM_chat_token/Statistics`), 10)
        if (token_history == 'none') {
            token_history = 0
        }
        await redis.set(`GLM_chat_token/Statistics`, token_history + Reply.usage.total_tokens)


        return true
    }

    async clear(e) {
        // if (!e.isMaster) { return false } // 只允许主人使用
        await redis.del(`GLM_chat_log/${e.group_id}_${e.user_id}`)
        e.reply('对话记录已清除')
        return true
    }

    async role_list(e) {
        try {
            const system_prompt_list = readJsonFile(system_prompt_file)

            let name_list = ["可切换的角色身份\n"]

            Object.keys(system_prompt_list).forEach(key => {
                //console.log(`name: ${key}, key: ${system_prompt_list[key]}`)
                name_list.push(`${key}\n`)
            })

            e.reply(name_list)
            return true

        } catch (err) {
            logger.error(`[${plugin_name}]读取或解析JSON文件时出错:`, err.message)
            e.reply(`读取或解析JSON文件时出错: \n${err.message}`)
        }
    }

    async role(e) {
        // 只允许主人使用
        if (!e.isMaster) {
            e.reply('只有主人才能设置角色')
            return false
        }

        const name = e.msg.replace(/^#(智谱|[Gg][Ll][Mm])?(切换|更改|换)(角色|身份|人物|设定|提示词|预设|人格)/, '')

        if (!name) {
            e.reply('请输入要切换的预设\n\n发送 #智谱预设列表 查看可切换的预设')
            return false
        }

        try {
            const system_prompt_list = readJsonFile(system_prompt_file)

            // 标记是否找到匹配的角色
            let type = false

            // 遍历人物设定
            Object.keys(system_prompt_list).forEach(key => {
                //console.log(`name: ${key}, key: ${system_prompt_list[key]}`)
                if (key == name) {
                    system_prompt = system_prompt_list[key]
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

            // 如果有匹配变量，则替换
            system_prompt = system_prompt.replace(/\$\{Bot\.nickname\}/, `${Bot.nickname}`)

            return true
        } catch (err) {
            logger.error(`[${plugin_name}]读取或解析JSON文件时出错:`, err.message)
            e.reply(`读取或解析JSON文件时出错: \n${err.message}`)
            return false
        }
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
            const type = await Download_file('https://oss.xt-url.com/GPT-Config/system_prompt.json', system_prompt_file)
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
        const token_today = parseInt(await redis.get(`GLM_chat_token/today`), 10)
        const token_history = parseInt(await redis.get(`GLM_chat_token/Statistics`), 10)

        // 取随机提示
        const tips = model_list.tips[Math.floor(Math.random() * model_list.tips.length)]

        // 构建信息
        const msg = [
            `=====${plugin_name}当前状态=====\n`,
            `今日token消耗：${token_today}\n`,
            `累计token消耗：${token_history}\n`,
            `当前模型：${model}\n`,
            `数据版本：${model_list.version}\n`,
            `联网能力：${web_search ? '开启' : '关闭'}\n`,
            `=====================\n`,
            `Tip：${tips}`

        ]

        // 发送信息
        e.reply(msg)
        return true
    }

    async model_list_help(e) {
        let msgList = []
        msgList.push(
            {
                user_id: 2854200865,
                nickname: '更新时间',
                message: model_list.data
            },
            {
                user_id: 2854200865,
                nickname: '当前版本',
                message: model_list.version
            }
        )

        //model_list.bigmodel.model_list

        for (const [modelName, modelInfo] of Object.entries(model_list.bigmodel.model_list)) {
            msgList.push({
                user_id: 2854200865,
                nickname: '模型介绍',
                message: `模型：${modelName}\n介绍：${modelInfo.instructions}\n价格：${modelInfo.Price}\n类型：${modelInfo.type}`
            })
        }

        // 发送消息
        await e.reply(await Bot.makeForwardMsg(msgList))
        return true
    }

    async model_set(e) {
        // 只允许主人使用
        if (!e.isMaster) {
            e.reply('只有主人才能更改模型')
            return false
        }

        // 获取命令参数
        const model_name = e.msg.replace(/^#(智谱|[Gg][Ll][Mm])?(强制|强行)?(更换|切换|换|改|设置)(模型|model)\s*/, '')
        if (!model_name) {
            e.reply('请指定要切换的模型名称\n\n可发送 #模型列表 查看所有可用模型')
            return false
        }
        // 强制切换则不检查模型是否存在
        if (e.msg.includes('强制') || e.msg.includes('强行')) {
            model = model_name
            e.reply(`已强制切换模型为：${model_name}`)
            return true
        }

        // 检查模型是否存在
        let finish = false
        for (const [modelName] of Object.entries(model_list.bigmodel.model_list)) {
            if (modelName === model_name) {
                finish = true
            }
        }
        if (!finish) {
            e.reply(`模型 ${model_name} 不存在，请检查模型名称是否正确\n\n可发送 #模型列表 查看所有可用模型\n如确实需要切换请发送 #强制切换模型 进行切换`)
            return false
        }

        // 切换模型
        model = model_name
        e.reply(`已切换模型为：${model_name}`)
        return true
    }
    
    async web_search_set(e) {
        // 只允许主人使用
        if (!e.isMaster) {
            e.reply('只有主人才能更改联网设置')
            return false
        }

        // 判断是开启还是关闭联网
        if (e.msg.includes('开启') || e.msg.includes('打开')) {
            web_search = true
            e.reply(`已开启联网功能`)
        }
        if (e.msg.includes('关闭') || e.msg.includes('取消')) {
            web_search = false
            e.reply(`已关闭联网功能`)
        }

        return true
    }
}

// 以下代码在插件载入时执行一次

// 检查配置文件是否存在
if (!fs.existsSync(system_prompt_file)) {
    logger.mark(`[${plugin_name}]配置文件不存在，开始下载`)
    const type = await Download_file('https://oss.xt-url.com/GPT-Config/system_prompt.json', system_prompt_file)
    if (type) {
        logger.mark(`[${plugin_name}]配置文件下载成功`)
    } else {
        logger.error(`[${plugin_name}]配置文件下载失败`)
    }
}

// 设置初始system_prompt
if (!system_prompt) {
    system_prompt = await get_default_prompt()
}

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

// 全局动态变量
let model_list = await readJsonFile(model_list_file)

// 每日统计token
schedule.scheduleJob('0 0 0 * * *', async () => {
    //schedule.scheduleJob('1 * * * * *', async () => { // 测试用
    logger.mark(`[${plugin_name}]开始统计昨日token`)
    try {
        // 获取Redis中的数据
        const token_history = parseInt(await redis.get(`GLM_chat_token/today`), 10)

        // 重置Redis中的数据
        await redis.set(`GLM_chat_token/today`, 0)

        // 写入CSV文件
        fs.appendFileSync(`${plugin_data_path}/token_log.csv`, `${formatTimestamp(new Date() - 24 * 60 * 60 * 1000)},${token_history}\n`, 'utf8')
    } catch (error) {
        logger.error(`[${plugin_name}]导出数据失败: ${error}`)
    }
})

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
            "User-Agent": "GLM (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)"
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
}
)