const trackers = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'udp://tracker.bittorrent.am:80/announce',
  'udp://tracker.coppersurfer.tk:6969/announce',
  'udp://tracker.leechers-paradise.org:6969/announce',
  'udp://p4p.arenabg.com:1337/announce',
  'udp://tracker.internetwarriors.net:1337/announce',
  'udp://9.rarbg.to:2710/announce',
  'udp://9.rarbg.me:2710/announce',
  'udp://9.rarbg.to:2710/announce',
  'udp://9.rarbg.me:2710/announce',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://tracker.coppersurfer.tk:6969/announce',
  'udp://tracker.leechers-paradise.org:6969/announce',
  'udp://tracker.openbittorrent.com:80/announce',
  'udp://explodie.org:6969/announce',
  'udp://p4p.arenabg.com:1337/announce',
  'http://vps02.net.orel.ru:80/announce',
  'http://tracker.files.fm:6969/announce',
  'http://173.254.204.71:10068/announce'
]

export class magnet extends plugin {
  constructor() {
    super({
      name: 'magnet',
      dsc: '哈希转磁力',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: /^#?(哈希|hash)?转(磁力|bt|BT)(详细|扩展)?[0-9a-fA-F]{40}$/,
          fnc: 'hash'
        }
      ]
    })
  }

  async hash(e) {
    let hash = e.msg
    hash = await hash.replace(/^#?(哈希|hash)?转(磁力|bt|BT)(详细|扩展)?/, '')
    let magnet = `magnet:?xt=urn:btih:${hash}`
    if (e.msg.includes('详细') || e.msg.includes('扩展')) {
      magnet += `&tr=${trackers.join('&tr=')}`
    }
    e.reply(magnet, true)
  }
}

