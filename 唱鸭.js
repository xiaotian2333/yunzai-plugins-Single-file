// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file


// 从 '../../lib/plugins/plugin.js' 文件中导入 plugin
import plugin from '../../lib/plugins/plugin.js'
import { segment } from 'oicq'

// 定义一个名为 example 的类，继承自 plugin 类
export class example extends plugin {
	constructor() {
		super({
			name: '唱鸭',
			dsc: '随机返回一段唱鸭的音频片段',
			event: 'message',
			priority: 5000,
			rule: [{
					reg: '^#?唱[呀鸭吖丫]$',
					fnc: 'changya'
				}
			]
		})
	}
	
	async changya(e) {
		fetch('https://api.cenguigui.cn/api/singduck/')
  			.then(response => {
				if (!response.ok) {
					logger.erro('网络请求失败');
				}
    		return response.json();
  			})
			.then(data => {
				// 提取出data中的audioSrc并发送语音
				logger.debug('[唱鸭]获取到歌曲链接：',data.data.audioSrc)
				this.e.reply(segment.record(data.data.audioSrc))
				// 提取出data中的lyrics并发送歌词
				logger.debug('[唱鸭]获取到歌词：',data.data.lyrics)
				// 处理歌词换行
				let lyrics = data.data.lyrics.replace(/ /g, "\n");
				lyrics = "歌手：" + data.data.nickname + "\n" + lyrics + "\n---\n歌曲链接\n" + data.data.audioSrc;
				e.reply(lyrics)
			})
			.catch(error => {
				//输出错误提示
				logger.error('获取错误：', error);
			});
	}
}

