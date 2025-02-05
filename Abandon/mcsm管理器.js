// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file


import plugin from '../../lib/plugins/plugin.js'

/** 用户的 apikey */
const api_key = ''
/** mcsm 的域名/IP 注意不能以 `/` 结尾 */
const api_url = ''

/** 统一网络请求模块
 * @url api入口，只需要 api/ 以后的部分
 */
function mcsmapi(url) {
    // 拼接链接，务必保证传进来的 url 格式正确
    url = `${api_url}/api/${url}`
    if (url[-1] == '?') {
        url = `${url}apikey=${api_key}`
    } else {
        url = `${url}&apikey=${api_key}`
    }
    logger.mark(`[mcsm管理器][网络请求] 开始请求${url}`)
    try {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    logger.error('[mcsm管理器][网络请求] 网络请求失败')
                    return false
                }
                return response.json()
            })
    }
    catch {
        logger.error('[mcsm管理器][网络请求] 网络请求失败')
        return false
    }
        
}
/** 通用消息精简模块
 * @msg 待精简的消息
 */
function msg_simplify(msg) {
    msg = msg.replace('mcsm', '')
    msg = msg.replace('#', '')
    msg = msg.replace('实例', '')
    msg = msg.replace('容器', '')
    msg = msg.replace('列表', '')
    msg = msg.replace('状态', '')
    msg = msg.replace('重启', '')
    return msg
}
/** 获取节点的GID
 * @n 可选项，整数型，选择第几个节点
 */
async function git_default_gid(n) {
    const data = await mcsmapi('service/remote_services_list?')
    if (n === "") {n = 0}
    return data.data[n].uuid
    
}


// 开始主函数部分
export class example extends plugin {
	constructor() {
		super({
			name: 'mcsm管理器',
			dsc: '对接mcsm面板进行控制',
			event: 'message',
			priority: 5000,
			rule: [{
					reg: '^#?(mcsm)?(进程守护|服务器|节点|主机)(列表|状态)$',
					fnc: 'remote_services_list'
				},
                {
					reg: '^#?(mcsm)?(实例|容器)(列表|状态)',
					fnc: 'remote_service_instances'
				},
                {
					reg: '^#?(mcsm)?重启(实例|容器)',
					fnc: 'protected_instance_restart'
				}
			]
		})
	}


    // 进程守护列表
    async remote_services_list(e) {
        /** 最终发送的消息 */
        let mdmsg = '节点列表'
        // 调用函数并处理返回的数据或错误
        mcsmapi(`service/remote_services_list?`)
        .then(async data => {
            // 开始处理返回的数据
            data.data.forEach(item => {
                let msgList_ = `名称:${item.remarks}\n`
                msgList_ += `GID:${item.uuid}\n`
                if (item.available) {msgList_ += `状态:在线`} else {msgList_ += `状态:离线`}
                // 提交信息到信息列表
                mdmsg += '\n---\n'+msgList_
            })
        e.reply(mdmsg) 
        return true
        })
        .catch(error => {
            // 在这里处理错误
            logger.error('[mcsm管理器][进程守护列表]',error)
            e.reply('网络请求错误',error)
            return false
        })
    }

    // 查询指定节点内的实例状态
    async remote_service_instances(e) {
        /** 最终发送的消息 */
        let mdmsg = '实例状态\n'
        /** 节点的唯一识别号 */
        let gid = msg_simplify(e.msg)
        gid = gid.replace(/ /g, "")
        if (!gid) {
            mdmsg += '未发送GID，默认查询主节点状态'
            gid = await git_default_gid(0)
        } else {
            mdmsg += `GID:${gid}`
        }
        // 调用函数并处理返回的数据或错误
        mcsmapi(`service/remote_service_instances?remote_uuid=${gid}&page=1&page_size=50&instance_name=`)
        .then(async data => {
            // 开始处理返回的数据
            data.data.data.forEach(data => {
                let msgList_ = ''
                msgList_ += `名称:${data.config.nickname}\nUID:${data.instanceUuid}\n`
                switch (true) {
                    // 会返回的值及其解释：-1（状态未知）；0（已停止）；1（正在停止）；2（正在启动）；3（正在运行）
                    case data.status == -1:
                        msgList_ += '状态:未知'
                        break
                    case data.status == 0:
                        msgList_ += '状态:已停止'
                        break
                    case data.status == 1:
                        msgList_ += '状态:正在停止'
                        break
                    case data.status == 2:
                        msgList_ += '状态:正在启动'
                        break
                    case data.status == 3:
                        msgList_ += '状态:正常运行'
                        break
                    default:
                        msgList_ += '状态:异常返回值'
                        logger.error('异常的返回值:' + data.status)
                }
                mdmsg += '\n---\n'+msgList_
            })
            e.reply(mdmsg)
            return true
        })
        .catch(error => {
            // 在这里处理错误
            logger.error('[mcsm管理器][实例列表]',error)
            e.reply('网络请求错误',error)
            return false
        })
    }

async protected_instance_restart(e) {
    /** 最终发送的消息 */
    let mdmsg = '重启实例\n'
        // 简化消息
        let msg = msg_simplify(e.msg)
        msg = msg.split(" ")
        e.reply(msg[0] + '===' + msg[1])
        if (msg[1] == '') {} //这里想实现的是gid可选，msg0是gid，1是uid。如果msg1是空则代表没写giu，此时msg0是uid，giu则自动获取
        if (!gid) {
            mdmsg += '未发送GID，默认查询主节点状态'
            gid = await git_default_gid(0)
        } else {
            mdmsg += `GID:${gid}\n--\n`
        }
        // 调用函数并处理返回的数据或错误
        mcsmapi(`protected_instance/restart?remote_uuid=${msg[0]}&uuid=${msg[1]}`)
        .then(async data => {
            return // 未实现
        })
}
}