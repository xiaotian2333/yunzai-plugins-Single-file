// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file
// 灵感来源为简幻欢群机器人，但代码均为原创

const QQ = '1719549416' // 举报信息发到这个QQ号，填你自己的

import common from "../../lib/common/common.js"

// 用户举报信息存放
let Select_list = {} // 举报类型
let violator_list = {} // 被举报者

const ly = {
  1: '发布色情/违法信息',
  2: '存在诈骗骗钱行为',
  3: '提问群公告已存在问题',
  4: '水军/营销广告',
  5: '网络暴力/侵权',
  6: '无底线追星',
  7: '以上内容均不贴切'
}

export class report extends plugin {
  constructor() {
    super({
      name: '快举报',
      event: 'message',
      rule: [
        {
          reg: "^#?快举报$",
          fnc: 'trigger',
          //permission: 'master'
        }
      ]
    })
  }

  // 用户触发快举报
  async trigger(e) {
    e.reply(`===快举报===
[0] 关闭快举报
[1] 发布色情/违法信息
[2] 存在诈骗骗钱行为
[3] 提问群公告已存在问题
[4] 水军/营销广告
[5] 网络暴力/侵权
[6] 无底线追星
[7] 以上内容均不贴切
------------------
*发送对应序号来选择`, true)

    this.setContext('Select') // 监听用户信息，触发选择理由流程
    return true //返回这个可能会存在bug，但是先留着
  }

  // 用户选择举报类型
  async Select(e) {
    e = this.e

    let num = parseInt(e.msg, 10)
    if (isNaN(num) || num > 8 || num < 0) {
      e.reply('请正确输入举报理由编号', true)
    }

    // 用户退出快举报
    if (e.msg == '0') {
      this.finish('Select') // 停止选择理由流程监听
      e.reply('快举报已退出', true)
      return true
    }

    // 记录用户的举报原因
    Select_list[e.user_id] = e.msg

    this.finish('Select') // 停止选择理由流程监听
    e.reply('请发送被举报人QQ，直接发送QQ号，可发送多个但请用空格断开', true)
    this.setContext('violator') // 开始举报者监听
    return true
  }

  // 用户发送被举报者QQ号
  async violator(e) {
    e = this.e

    violator_list[e.user_id] = e.msg // 记录被举报者
    this.finish('violator') // 停止举报者监听
    e.reply('请发送相应的聊天记录截图', true)
    this.setContext('Evidence') // 开始证据收集监听
    return true
  }

  // 用户发送被举报者违规行为
  async Evidence(e) {
    e = this.e

    this.finish('Evidence') // 停止证据收集监听

    e.reply('举报成功，请等待管理组审核', true)

    // 私聊发送举报信息
    common.relpyPrivate(QQ, [
      '===快举报信息===\n',
      `来源群号：${e.group_id}\n`,
      `举报理由：${ly[Select_list[e.user_id]]}\n`,
      `举报人：${e.user_id}\n`,
      `被举报者：${violator_list[e.user_id]}\n`,
      `聊天记录：\n`,
      segment.image(e.img[0])
    ])

    return true
  }
}