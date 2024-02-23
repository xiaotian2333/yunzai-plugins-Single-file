// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file


import plugin from '../../lib/plugins/plugin.js'

// 用户的 apikey ，强烈建议新建普通用户并分配需要控制的实例而非管理员用户直接控制
const api_key = ''
// mcsm 的域名/ip 注意不能以 `/` 结尾，以免潜在 bug。应为 mcsm.com 而非 mcsm.com/
const api_url = ''

// 统一网络请求函数
function mcsmapi(url) {
    // 自适应加 key ，但务必保证传进来的 url 格式正确
    if (url[-1] == '?') {
        url = `${url}apikey=${api_key}`
    } else {
        url = `${url}&apikey=${api_key}`
    }
    logger.mark(`[mcsm管理器][网络请求]开始请求${url}`);
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('网络请求失败');
            }
            return response.json();
        });
}




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
				}
			]
		})
	}


    // 进程守护列表
    async remote_services_list(e) {
        // 合并转发消息初始化
        let msgList = []
        // 调用函数并处理返回的数据或错误
        mcsmapi(`${api_url}/api/service/remote_services_list?`)
        .then(async data => {
            // 在这里处理返回的数据
            data.data.forEach(item => {
                let msgList_ = `名称:${item.remarks}\n`
                msgList_ += `GID:${item.uuid}\n`
                if (item.available) {msgList_ += `状态:在线`} else {msgList_ += `状态:离线`}
                // 提交信息到合并信息列表
                msgList.push({
                    user_id: Bot.uin,
                    message: msgList_
                })
            });
        e.reply(await Bot[Bot.uin].pickUser(e.self_id).makeForwardMsg(msgList)) // 发送合并的消息 
        return true;
        })
        .catch(error => {
            // 在这里处理错误
            logger.error('[mcsm管理器][进程守护列表]',error);
            e.reply('网络请求错误',error)
            return true;
        });
    }
    // 查询指定节点内的实例状态
    // 不知道为啥接口用不了，只能靠文档来写了
    async remote_service_instances(e) {
        // 合并转发消息初始化
        let msgList = []
        // 删除不需要的部分
        let msgList_ = ''
        let gid = e.msg
        gid = gid.replace('mcsm', '');
        gid = gid.replace('实例', '');
        gid = gid.replace('容器', '');
        gid = gid.replace('列表', '');
        gid = gid.replace('状态', '');
        gid = gid.replace(/ /g, "");
        if (!gid) {
            msgList_ = '未发送GID，默认查询主节点状态'
            // 主节点的gid，TODO：改为自动获取第一个节点
            gid = ''
        } else {
            msgList_ = `GID:${gid}`
        }
        // 调用函数并处理返回的数据或错误
        mcsmapi(`${api_url}/api/service/remote_service_instances?remote_uuid=${gid}&page=1&page_size=50`)
        .then(async data => {
            // 在这里处理返回的数据
            data.data.forEach(item => {
                let msgList_ = `名称:${item.remarks}\n` //创建基础提示
                if (item.available) {msgList_ += `状态:在线`} else {msgList_ += `状态:离线`}
                // 提交信息到合并信息列表
                msgList.push({
                    user_id: Bot.uin,
                    message: msgList_
                })
            });
        e.reply(await Bot[Bot.uin].pickUser(e.self_id).makeForwardMsg(msgList)) // 发送合并的消息 
        return true;
        })
        .catch(error => {
            // 在这里处理错误
            logger.error('[mcsm管理器][实例列表]',error);
            e.reply('网络请求错误',error)
            return true;
        });
    }
}