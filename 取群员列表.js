// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file


import fs from "fs"
import path from "path"
const plugin_name = '取群员列表'

export class getlist extends plugin {
      constructor() {
            super({
                  name: "取群员列表",
                  dsc: "一个插件示例",
                  event: "message",
                  priority: 5000,
                  rule: [{
                        reg: /^#?取群员列表(\d{5,12})?$/,
                        fnc: "getlist"
                  }]
            })
      }

      async getlist(e) {
            // 检查消息内容是否包含5到12位的数字
            const match = e.msg.match(/^#?取群员列表(\d{5,12})$/)
            let group_id

            // 检查是否匹配到群号
            if (match) {
                  group_id = Number(match[1])
            } else {
                  group_id = Number(e.group_id)
            }

            logger.debug(`[${plugin_name}]开始获取群号${group_id}的成员列表`)

            // 尝试获取对应群的成员列表
            let userList = await Bot.gml.get(group_id)
            if (!userList) {
                  logger.error(`[${plugin_name}]群号${group_id}不存在或无法获取成员列表`)
                  e.reply(`群号${group_id}不存在或无法获取成员列表`)
                  return true
            }
            // 将 Map 或对象转换为可迭代的数组格式
            userList = Array.from(userList.entries())

            // 创建一个数组来缓存所有用户信息
            const userInfoList = []

            // 处理数据并输出到日志
            userList.forEach(([userId, userInfo]) => {
                  // 获取card，如果不存在则使用nickname
                  let displayName = userInfo?.card || userInfo?.nickname || '未知用户'

                  // 清理不可见字符，保留可读文本（字母、数字、标点、符号、空格等）
                  displayName = displayName.replace(/[^\p{L}\p{N}\p{P}\p{S}\p{Z}]/gu, '').trim()

                  // 如果清理后为空字符串，可以设置一个默认值
                  if (!displayName) {
                        displayName = '用户名为不可见字符，已过滤'
                  }

                  logger.debug(`${userId}---${displayName}`)

                  // 将用户信息添加到缓存数组
                  userInfoList.push(`${userId},${displayName}`)
            })

            const dirPath = 'data/plugins/取群员列表'
            const filePath = path.join(dirPath, `${group_id}_userlist.csv`)

            try {
                  // 确保目录存在
                  if (!fs.existsSync(dirPath)) {
                        fs.mkdirSync(dirPath, { recursive: true })
                  }

                  // 写入数据（覆盖模式）
                  fs.writeFileSync(filePath, userInfoList.join('\n') + '\n')
            } catch (err) {
                  logger.error(`[${plugin_name}]写入文件失败，报错信息：${err}`)
                  return true
            }
            
            logger.info(`[${plugin_name}]已将${group_id}群成员列表保存为数据文件\n位于${filePath}`)
            e.reply(`任务处理完成，已保存为数据文件\n位于${filePath}`)
            return true
      }
}
