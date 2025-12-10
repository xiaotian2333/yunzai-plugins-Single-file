// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file

import sharp from 'sharp' // 图片转换依赖
import axios from 'axios' // 网络请求依赖
import fs from 'fs/promises'
import crypto from 'crypto'
import path from "path"
import schedule from 'node-schedule';

// 配置项
// 本地图库配置
const local_img = true // 是否使用本地图库
const local_img_path = 'data/plugins/吊图' // 本地图库路径

// 网络图库配置
const network_img = true // 是否使用网络图库

// 冷却相关配置
const cd = 3 // 一天只能触发5次
const cd_tips = "你还没冲够？没也不许冲，憋着😏" // 冷却提示

// 白名单用户配置，主人默认存在白名单中无需添加
const white_list = [
  1719549416,
  2859278670
]

// 插件常量
const plugin_name = "吊图"
const user_agent = 'ys-dio-pic-repo (author by xiaotian2333) github(https://github.com/xiaotian2333/yunzai-plugins-Single-file)'
const timeout = 10000 // 超时设置（10秒）


// 开始初始化
logger.debug(`[${plugin_name}]开始初始化`)

const _path = process.cwd().replace(/\\/g, '/')

// 构建索引数据
let img_data = {
  version: "0.0.0",
  data: "未启用网络图库",
  source: "",
  img_url: "",
  img_list: [],
  local_img_list: []
}
// 下载网络索引数据
if (network_img) {
  try {
    const response = await axios.get("https://oss.xt-url.com/ys-dio-pic-repo/imglist.json", {
      timeout: timeout,
      headers: {
        'User-Agent': user_agent
      }
    })

    // axios会自动解析JSON，响应数据在response.data中
    img_data.version = response.data.version
    img_data.data = response.data.data
    img_data.source = response.data.source
    img_data.img_url = response.data.img_url
    img_data.img_list = response.data.img_list

  } catch (err) {
    logger.error(`[${plugin_name}]网络请求错误：${err.message}`)
    img_data = {
      version: "0.0.0",
      data: "网络请求失败，服务已降级",
      source: "",
      img_url: "",
      img_list: [],
      local_img_list: []
    }
  }
}

// 初始化冷却数据
let user_cd = {}

// 导入本地图库
if (local_img) {
  img_data.local_img_list = await ReadLocalImg(path.join(_path, local_img_path))
}


// 加载白名单列表
const whiteListSet = new Set(white_list)

logger.debug(`[${plugin_name}]初始化完毕`)

// 函数定义

/**
 * 读取本地图库文件列表
 * @param {string} data_path - 本地图库路径
 * @returns {Promise<string[]>} 本地图库文件列表
 */
async function ReadLocalImg(data_path) {
  try {
    // 使用 fs.promises.access() 检查目录是否存在（异步）
    await fs.access(data_path)

    // 目录存在，继续读取
  } catch (err) {
    // 如果 access 失败（ENOENT = 文件/目录不存在），则创建
    if (err.code === 'ENOENT') {
      await fs.mkdir(data_path, { recursive: true })
      logger.mark(`[${plugin_name}] 本地图库目录创建成功: ${data_path}`)
    } else {
      // 其他错误（权限不足等）
      logger.error(`[${plugin_name}]访问目录失败：`, err.message)
      return []
    }
  }
  // 目录存在，继续读取
  try {
    const entries = await fs.readdir(data_path, { withFileTypes: true })
    let local_img_list = []
    for (const entry of entries) {
      if (entry.isFile()) {
        local_img_list.push(entry.name)
      }
    }

    logger.debug(`[${plugin_name}]获取到的本地图片列表：`, local_img_list)
    return local_img_list
  } catch (err) {
    logger.error(`[${plugin_name}]读取目录失败：`, err.message)
    return []
  }
}

/**
 * 计算Buffer的MD5值
 * @param {Buffer} buffer - 要计算MD5的Buffer
 * @returns {string} MD5哈希值（32位小写）
 */
function calculateMd5(buffer) {
  return crypto.createHash('md5')
    .update(buffer)
    .digest('hex')
}

/**
 * 获取优先级图片
 * 优先级：引用消息图片 > 当前消息图片
 * @param {object} e - 消息事件对象
 * @returns {Promise<{url: string|null, txt: string|null}>}
 */
async function getPriorityImage(e) {
  const result = { url: null, txt: null }

  // 1. 引用消息里的图片
  if (e.getReply || e.source) {
    try {
      let source
      if (e.getReply) {
        source = await e.getReply()
      } else if (e.source) {
        if (e.group?.getChatHistory) {
          source = (await e.group.getChatHistory(e.source.seq, 1)).pop()
        } else if (e.friend?.getChatHistory) {
          source = (await e.friend.getChatHistory(e.source.time, 1)).pop()
        }
      }

      if (source?.message?.length) {
        const imgs = source.message
          .filter(m => m.type === "image")
          .map(m => m.url)
        if (imgs.length > 0) {
          result.url = imgs[0]
          result.txt = "引用"
          return result
        }
      }
    } catch { }
  }

  // 2. 当前消息中的图片
  const imgSeg = e.message.find(m => m.type === "image")
  if (imgSeg?.url) {
    result.url = imgSeg.url
    result.txt = "消息"
    return result
  }

  return result
}

/**
 * 通过网络URL获取图片并转换为AVIF格式
 * @param {string} imageUrl - 图片的网络URL
 * @param {number} quality - AVIF压缩质量（0-100，默认60）
 * @returns {Promise<Buffer>} 转换后的AVIF格式Buffer
 */
async function convertUrlToAvif(imageUrl, quality = 70) {
  try {
    // 1. 发送GET请求获取图片Buffer
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer', // 关键：指定响应类型为二进制数据
      timeout: timeout,
      headers: {
        'User-Agent': user_agent
      }
    })

    // 2. 检查响应是否为图片（简单验证Content-Type）
    const contentType = response.headers['content-type']
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`URL返回的不是图片，Content-Type: ${contentType}`)
    }

    // 3. 将获取到的二进制数据转为Buffer并进行AVIF转换
    const imageBuffer = Buffer.from(response.data, 'binary')
    const avifBuffer = await sharp(imageBuffer)
      .avif({
        quality,
        speed: 1 // 编码速度（1=最慢最优，10=最快）
      })
      .toBuffer()

    logger.debug(`[${plugin_name}]URL图片转换AVIF成功: ${imageUrl}`)
    return avifBuffer

  } catch (err) {
    logger.error(`[${plugin_name}]URL图片转换失败: ${err.message} (URL: ${imageUrl})`)
    return false
  }
}

/**
 * 任意图片格式转jpg格式
 * @param {Buffer} imageBuffer - 原始图片的Buffer数据
 * @returns {Promise<Buffer>} 转换后的JPG格式Buffer
 * @throws {Error} 如果转换失败一律返回false
 */
async function convertToJpg(imageBuffer) {
  try {
    // 转换为JPG格式，设置最高质量（不压缩）
    const jpgBuffer = await sharp(imageBuffer)
      .jpeg({
        quality: 100, // 最高质量（100=不压缩）
        progressive: false, // 禁用渐进式JPG（避免额外处理）
        chromaSubsampling: '4:4:4' // 保留完整色彩信息（默认是4:2:0，会轻微压缩色彩）
      })
      .toBuffer()
    return jpgBuffer
  } catch (err) {
    logger.error(`[${plugin_name}]图片转换失败: ${err.message}`)
    return false
  }
}

/**
 * 判断是否为白名单用户
 * @param {number} userId 
 * @returns {bool}
 */
function isInWhiteList(userId) {
  return whiteListSet.has(userId)
}

// 主逻辑
export class example extends plugin {
  constructor() {
    super({
      name: '吊图',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: /^#?(吊|叼|屌|铞)图$/,
          fnc: 'start'
        },
        {
          reg: /^#?(吊|叼|屌|铞)图(上传|添加)图片$/,
          fnc: 'upload'
        },
        {
          reg: /^#?(吊|叼|屌|铞)图(图片)?列表$/,
          fnc: 'list'
        },
        {
          reg: /^#?(吊|叼|屌|铞)图查看图片/,
          fnc: 'view'
        },
        {
          reg: /^#?(吊|叼|屌|铞)图状态$/,
          fnc: 'status'
        },
        {
          reg: /^#?(吊|叼|屌|铞)图(图片|上传|图片上传)?统计$/,
          fnc: 'statistics'
        }
      ]
    })
  }

  async start(e) {
    // 字段不存在则默认0，存在则保留原值
    user_cd[e.user_id] = user_cd[e.user_id] ?? 0

    // 冲过头了
    if (user_cd[e.user_id] >= cd) {
      e.reply(cd_tips)
      return true
    }

    // 随机一个图片名称
    let imgname = []
    // 网络图片
    if (network_img && img_data.img_list.length > 0) {
      // 不要拼接/，img_data.img_url已经包含了/
      imgname.push(`${img_data.img_url}${img_data.img_list[Math.floor(Math.random() * img_data.img_list.length)]}`)
    }
    // 本地图片
    if (local_img && img_data.local_img_list.length > 0) {
      const filePath = path.join(_path, local_img_path, img_data.local_img_list[Math.floor(Math.random() * img_data.local_img_list.length)])
      // 拉格朗日不支持直接发送avif图，需要先转一下，如使用icqq可直接发送avif图
      let imgBuffer = await fs.readFile(filePath)
      imgBuffer = await convertToJpg(imgBuffer)

      imgname.push(imgBuffer)
    }
    // 随机一个图片类型
    const img = imgname[Math.floor(Math.random() * imgname.length)]
    if (!img) {
      e.reply('没有可用图片')
      return true
    }

    e.reply(segment.image(img))
    user_cd[e.user_id] = user_cd[e.user_id] + 1 // 计数加1
    return true
  }

  async upload(e) {
    if (!e.isMaster && !isInWhiteList(e.user_id)) {
      e.reply('只有管理员才能上传图片')
      return true
    }
    // 获取图片链接
    const img = await getPriorityImage(e)
    if (!img.url) {
      e.reply('请引用或附带图片')
      return true
    }
    // 压缩图片
    const imgBuffer = await convertUrlToAvif(img.url)
    if (!imgBuffer) {
      e.reply('图片转换失败')
      return true
    }
    // 存储图片
    const imgMd5 = calculateMd5(imgBuffer)
    const imgPath = path.join(_path, local_img_path, `${e.user_id}-${imgMd5}.avif`)
    await fs.writeFile(imgPath, imgBuffer)

    // 刷新本地图片列表
    img_data.local_img_list = await ReadLocalImg(path.join(_path, local_img_path))

    e.reply(`图片上传成功`)
    return true
  }

  async list(e) {
    if (!e.isMaster && !isInWhiteList(e.user_id)) {
      e.reply('只有管理员才能查看列表')
      return true
    }
    let msg = [
      "========吊图本地列表========\n",
      ...img_data.local_img_list
    ]
    msg = msg.join('\n')
    e.reply(msg)
    return true
  }

  async view(e) {
    if (!e.isMaster && !isInWhiteList(e.user_id)) {
      e.reply('只有管理员才能查看图片')
      return true
    }
    let msg = e.msg
    msg = msg.replace(/^#?(吊|叼|屌|铞)图查看图片/, '')
    if (!img_data.local_img_list.includes(msg)) {
      e.reply("不存在此图片，请检查是否为图片的全称")
      return true
    }

    const filePath = path.join(_path, local_img_path, msg)
    // 拉格朗日不支持直接发送avif图，需要先转一下，如使用icqq可直接发送avif图
    let imgBuffer = await fs.readFile(filePath)
    imgBuffer = await convertToJpg(imgBuffer)
    e.reply(segment.image(imgBuffer))
    return true
  }

  async status(e) {
    let version = img_data.version
    if (version === "0.0.0") {
      version = "未启用云图库"
    }

    const msg = [
      `------吊图状态------`,
      `本地图片数量: ${img_data.local_img_list.length}`,
      `网络图片数量: ${img_data.img_list.length}`,
      `云图库版本: ${version}`
    ]
    e.reply(msg.join('\n'))
    return true
  }

  async statistics(e) {
    // 统计前缀出现次数
    const prefixCounts = {};
    for (const str of img_data.local_img_list) {
      const prefix = str.split('-')[0];
      prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
    }

    // 转换为数组并按数量排序（从高到低）
    const sortedEntries = Object.entries(prefixCounts).sort((a, b) => b[1] - a[1]);

    // 将排序后的结果存入列表
    const resultList = sortedEntries.map(([prefix, count]) => `用户[${prefix}]上传${count}张`);

    e.reply([
      "图片上传数量统计\n",
      resultList.join("\n")
    ])
    return true
  }
}

// 每日重置使用限制
schedule.scheduleJob('0 0 0 * * *', async () => {
  user_cd = {}
  logger.mark(`[吊图] 冷却已重置`)
});