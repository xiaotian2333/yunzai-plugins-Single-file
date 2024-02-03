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
			dsc: '小天开发',
			event: 'message',
			priority: 5000,
			rule: [{
					reg: '^#?唱[呀鸭吖丫].*$',
					fnc: 'changya'
				}
			]
		})
	}
	
	async changya(e) {
		this.e.reply(segment.record('https://api.yujn.cn/api/changya.php?type=mp3'))
	}
}