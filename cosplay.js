// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/yunzai-plugins-Single-file


// 从 '../../lib/plugins/plugin.js' 文件中导入 plugin
import plugin from '../../lib/plugins/plugin.js'
import { segment } from 'oicq'

// 定义一个名为 example 的类，继承自 plugin 类
export class example extends plugin {
	constructor() {
		super({
			name: 'cosplay',
			dsc: '返回一组cosplay图片，数据来自葫芦侠，发送图片链接而非图片以节省服务器流量',
			event: 'message',
			priority: 5000,
			rule: [{
					reg: '^#?cosplay.*$',
					fnc: 'cos'
				}
			]
		})
	}
	
	async cos(e) {
		fetch('https://api.yujn.cn/api/cosplay.php?type=json')
  			.then(response => {
				if (!response.ok) {
					logger.erro('网络请求失败');
				}
    		return response.json();
  			})
			.then(data => {
				let m = data.data.title + "\n"
				let n = data.data.images.join("\n---\n");
				m = m + n
				e.reply(m)
			})
			.catch(error => {
				//输出错误提示
				logger.error('获取错误：', error);
			});
	}
}

