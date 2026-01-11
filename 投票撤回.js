/** 
 * 作者：xiaotian2333
 * 开源地址：https://github.com/xiaotian2333/yunzai-plugins-Single-file
 * 需要 ICQQ 1.5.8 及以上版本
 * 表情内容参考官方 https://bot.q.qq.com/wiki/develop/api-v2/openapi/emoji/model.html
 */

const recall_threshold = 5 // 撤回阈值，投票人数达到时触发，请根据群活跃度调整
let recall_list = {} // 记录每个消息的撤回投票


export class VoteRecall extends plugin {
  constructor() {
    super({
      name: '投票撤回',
      event: 'notice.group.reaction',
      priority: -9999,
      rule: [{
        fnc: 'VoteRecall',
        log: false
      }]
    })
  }

  async VoteRecall(e) {
    // 过滤自己
    if (e.user_id == e.self_id) return false
    const source = (await e.group.getChatHistory(e.seq, 1)).pop()

    // 增加投票数
    if (e.id == "112" && e.set == true) {
      if (source?.message_id) {
        recall_list[source.message_id] = (recall_list[source.message_id] || 0) + 1
      }

      // 检查是否达到撤回阈值或管理员操作
      if (recall_list[source.message_id] >= recall_threshold || e.isMaster) {
        await e.group.recallMsg(source.message_id) // 执行撤回
        e.reply(`[${source.user_id}] 的消息被投票撤回`) // 发送提示
        delete recall_list[source.message_id] // 释放内存
      }
    }

    // 如果取消则减少投票数
    if (e.id == "112" && e.set == false) {
      if (source?.message_id) {
        recall_list[source.message_id] = Math.max(0, (recall_list[source.message_id] || 0) - 1)
      }
    }
    return true
  }
}