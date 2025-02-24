/**
* 作者：xiaotian2333
* 开源地址：https://github.com/xiaotian2333/yunzai-plugins-Single-file
*/

import fetch from "node-fetch"
import fs from "fs"

// 智谱API Key，需要自行申请(需实名)
// 申请链接：https://www.bigmodel.cn/invite?icode=iGW2wQ0KiXGc0PVU%2BeTSFEjPr3uHog9F4g5tjuOUqno%3D

// 可不填，不填则使用沉浸式翻译的Token（仅可使用 glm-4-flash 模型，其他模型需自行申请）
const Authorization = "" //智谱API Key
const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions" //智谱API接口,不要修改
const model = "glm-4-flash" //模型名称
const web_search = "True" //是否使用web搜索
const max_log = 5 //最大历史记录数
const plugin_name = "智谱GLM" //插件名称
const Bot_name = Bot.nickname

// 系统提示词，引导模型进行对话
// 请通过配置文件进行修改，不要直接修改代码
// 配置文件路径
const system_prompt_phat = "./data/plugins/智谱GLM/"
const system_prompt_file = `${system_prompt_phat}system_prompt.json`
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
        // logger.info(`[${plugin_name}]获取到新的Token：${token.apiToken}`)
        await redis.set('GLM_token', token.apiToken, { EX: token.expireTime }) // 保存到redis
    }
    // 返回Token
    return await redis.get('GLM_token')
}

// 下载系统提示词
async function dlowadSystemPrompt(url) {
    try {
        // 确保目录存在
        fs.mkdirSync(system_prompt_phat, { recursive: true })
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
        await fs.promises.writeFile(system_prompt_file, JSON.stringify(data))
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

export class bigmodel extends plugin {
    constructor() {
        super({
            name: '智谱GLM-4-Flash',
            event: 'message',
            priority: 9000,
            rule: [
                {
                    reg: '^#(智谱)?(GLM|glm|Glm|GML|gml|Gml)?(新开|重启|重置|清空|删除|清楚|清除)(聊天|对话|记录|记忆|历史)',
                    fnc: 'clear',
                },
                {
                    reg: '^#(智谱)?(GLM|glm|Glm|GML|gml|Gml)?(角色|身份|人物|设定|提示词|预设|人格)?列表',
                    fnc: 'role_list',
                },
                {
                    reg: '^#(智谱)?(GLM|glm|Glm|GML|gml|Gml)?(切换|更改|换)(角色|身份|人物|设定|提示词|预设|人格)?',
                    fnc: 'role',
                },
                {
                    reg: '^#(智谱)?(GLM|glm|Glm|GML|gml|Gml)?(更新|下载|克隆)(角色|身份|人物|设定|提示词|预设|人格)?(文件|配置|配置文件|数据)?',
                    fnc: 'pull_1',
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

        // 只有被艾特和私聊的消息才会被处理
        if (!(e.isPrivate || e.atme || e.atBot || e.msg.includes(Bot_name))) {
            return false
        }

        // 删除不需要的部分
        let msg = e.msg
        msg = msg.replace(' ', '')

        // 输入过滤
        if (list.some(item => msg.includes(item))) {
            // 检测到需要过滤的词后的处理逻辑，默认不理人
            logger.info(`[${plugin_name}]检测到敏感词，已过滤`)
            e.reply("输入包含敏感词，已拦截")
            return true
        }

        // 如果 msg 为空，则返回
        if (!msg) {
            e.reply('请输入内容')
            return false
        }
        // 消息长度限制，正常聊天100字足以，字数开放越多越容易被洗脑
        if (msg.length > 100) {
            e.reply('输入文本长度过长')
            return true
        }

        logger.info(`[${plugin_name}]${e.group_id}_${e.user_id} 发送了消息：${msg}`)
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

        const data = {
            "model": `${model}`,
            "messages": msg_log,
            "do_sample": "true",
            "temperature": "0.8", // 温度，0.8是默认值，可以调整
            "stream": "false",
            "user_id": `${e.group_id}_${e.user_id}`,
            "tools": [{
                "type": "web_search",
                "web_search": {
                    "enable": web_search
                }
            }]
        }

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
        const content = Reply.choices[0].message.content

        // 输出过滤
        //if (list.some(item => content.includes(item))) {
        //    // 检测到需要过滤的词后的处理逻辑，默认不理人
        //    logger.info(`[智谱GLM]检测到输出包含敏感词，已过滤：${content}`)
        //    e.reply("输出包含敏感词，已拦截")
        //    return true
        //}

        msg_log.push({
            "role": "assistant",
            "content": content
        })
        // 保存对话记录
        await redis.set(`GLM_chat_log/${e.group_id}_${e.user_id}`, JSON.stringify(msg_log), { EX: 60 * 60 * 24 * 7 }) // 保存到redis，过期时间为7天
        e.reply(content)
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

        const name = e.msg.replace(/#(智谱)?(GLM|glm|Glm|GML|gml|Gml)?(切换|更改|换)(角色|身份|人物|设定|提示词|预设|人格)?/, '')

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
            const type = await dlowadSystemPrompt('https://oss.xt-url.com/GPT-Config/system_prompt.json')
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
}

// 以下代码在插件载入时执行一次

// 检查配置文件是否存在
if (!fs.existsSync(system_prompt_file)) {
    logger.info(`[${plugin_name}]配置文件不存在，开始下载`)
    const type = await dlowadSystemPrompt('https://oss.xt-url.com/GPT-Config/system_prompt.json')
    if (type) {
        logger.info(`[${plugin_name}]配置文件下载成功`)
    } else {
        logger.error(`[${plugin_name}]配置文件下载失败`)
    }
}

// 设置初始system_prompt
if (!system_prompt) {
    system_prompt = await get_default_prompt()
}
