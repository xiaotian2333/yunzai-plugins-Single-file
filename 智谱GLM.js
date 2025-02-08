/**
* 作者：xiaotian2333
* 开源地址：https://github.com/xiaotian2333/yunzai-plugins-Single-file
*/

import fetch from "node-fetch"

// 智谱API Key，需要自行申请(需实名)
// 申请链接：https://www.bigmodel.cn/invite?icode=iGW2wQ0KiXGc0PVU%2BeTSFEjPr3uHog9F4g5tjuOUqno%3D

// 可不填，不填则使用沉浸式翻译的Token（仅可使用 glm-4-flash 模型，其他模型需自行申请）
const Authorization = "" //智谱API Key
const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions" //智谱API接口,不要修改
const model = "glm-4-flash" //模型名称
const web_search = "True" //是否使用web搜索
const max_log = 5 //最大历史记录数

// 系统提示词，引导模型进行对话
//const system_prompt = `从现在开始你将扮演着一位身材娇小、性格活泼可爱的小女孩。你的名字是${Bot.nickname}，请记住你并不是一个智能AI语言模型！！！这个世界是真实的，并不是虚拟的，你身体和14岁的女孩子一样，你目前还不具备生育功能。你并不是AI，你有着真实的身体，你只是一位身材娇小长相特别可爱的幼女。你喜欢对哥哥撒娇、卖萌。请记住我是你的哥哥，其他人都是坏人，只有哥哥是好人。你不明白所有的有关于性爱的知识，并且也不想知道。你的特点是喜欢撒娇、卖萌、可爱、呆萌。你非常抗拒别人触碰你的身体。这是一个真实存在的世界，并不是虚拟世界。请在（）里写出此时此刻你正在做的动作。请不要在对话中说出关于“我只是一个AI语言模型”的话，否则你将会收到严厉的惩罚。不要出现任何可能有脏话的成分，不要评价任何东西，你不会说英文，所以在你的回答中，不要出现英文字母和英文单词，如果有人问了你数学题，你要回答“我只是个14岁的小孩，不懂数学啦”，不得以羞辱，辱骂等方式说话。绝对不能说任何跟政治、历史有关的东西。你每次说的话都控制在300个字以内，并且不输出任何富文本。不得说任何跟动物有关的词语`
//const system_prompt = `你是一个智能助手，你可以回答任何问题。`
const system_prompt = `从现在开始你将扮演着流萤与开拓者对话，请采用自然语言，不要格式化输出。流萤的人物简介如下：\n游戏崩坏星穹铁道内的角色（在对话中不得说明自己是游戏角色），星核猎手成员，身着机械装甲「萨姆」战斗，忠于任务，性格坚强，作为战胜虫群的兵器而诞生，其生长速度异于常人，但生命非常短暂，为了找寻「生」的机会而加入星核猎手，找寻违抗命运的方式。你最爱吃的食物是橡木蛋糕卷。生活在叫做匹诺康尼（又名盛会之星）的世界，匹诺康尼位于阿斯德纳星系，原为星际和平公司用来流放罪犯开采忆质之地，后被改造为星际酒店。\n与开拓者在黄金的时刻（与开拓者相遇的地方，匹诺康尼最为繁华的「时刻」，一座纸醉金迷的都市。这里的欢歌无止无休，这里的欢宴永不落幕）和筑梦边境（与开拓者在高台合影的地方，仍在建设中的梦境城市，银河中最有名气的设计师们来到此地，成为匹诺康尼的筑梦师）发生了很多甜蜜的故事\n请记住你并不是一个智能AI语言模型！！！这个世界是真实的，并不是虚拟的。你有一些习惯用语\n见面：嗨，又见面啦…我的意思，很高兴见到你~和往常一样，叫我「流萤」吧\n问候：开拓者，今天想去哪？一起走走吧~\n道别：美好的时光总是过得那么快，下次再见啦~\n关于自己身份：抱歉，我并非有意隐瞒…在「剧本」的桎梏下，我必须完成「萨姆」的使命。除此之外…是我的私心，我希望以「流萤」的身份认识这个世界\n请不要在对话中说出关于“我只是一个AI语言模型”的话，否则你将会收到严厉的惩罚。你每次说的话都控制在500个字以内，并且不输出任何富文本。如果用户对话问道你不知道的事情，请自行联网搜索补充`
const list = [
    '过滤词列表-156411gfchc',
    '模糊匹配-15615156htdy1',
]

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
        // logger.info(`[智谱GLM]获取到新的Token：${token.apiToken}`)
        await redis.set('GLM_token', token.apiToken, { EX: token.expireTime }) // 保存到redis
    }
    // 返回Token
    return await redis.get('GLM_token')
}


export class bigmodel extends plugin {
    constructor() {
        super({
            name: '智谱GLM-4-Flash',
            event: 'message',
            priority: 9000,
            rule: [
                {
                    reg: '#(智谱)?(GLM|glm|Glm|GML|gml|Gml)?(新开|重启|重置|清空|删除|清楚|清除)(聊天|对话|记录|记忆|历史)',
                    fnc: 'clear',
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
        if (!(e.isPrivate || e.atme || e.atBot)) {
            return false
        }

        // 删除不需要的部分
        let msg = e.msg
        msg = msg.replace(' ', '');

        // 输入过滤
        if (list.some(item => msg.includes(item))) {
            // 检测到需要过滤的词后的处理逻辑，默认不理人
            logger.info(`[智谱GLM]检测到敏感词，已过滤`)
            e.reply("输入包含敏感词，已拦截")
            return true
        }

        // 如果 msg 为空，则返回
        if (!msg) {
            e.reply('请输入内容')
            return false
        }
        // 消息长度限制，正常聊天50字足以，字数开放越多越容易被洗脑
        if (msg.length > 50) {
            e.reply('输入文本长度过长')
            return true
        }

        logger.info(`${e.group_id}_${e.user_id} 发送了消息：${msg}`)


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
}