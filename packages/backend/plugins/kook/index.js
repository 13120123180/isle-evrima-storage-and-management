const { default: Kasumi, Card } = require('kasumi.js')
const config = require('@/core/config')
const keywords = require('./keyword')
const logger = require('@/utils/logger')

const MODULE_NAME = 'KOOK机器人'

const MessageType = {
  TEXT: 9,
  CARD: 10
}

class MyKook {
  constructor() {
    if (!config.KOOK_TOKEN) {
      logger.warn('KOOK_TOKEN 未配置，KOOK 模块已禁用。')
      this.initialized = false
      return
    }

    this.client = new Kasumi({
      type: 'websocket',
      token: config.KOOK_TOKEN,
      vendor: 'hexona',
      disableSnOrderCheck: true
    })

    this.initialized = false
    this._connect()
  }

  _connect() {
    this.client.on('error', (err) => {
      this.initialized = false
      logger.error(MODULE_NAME, '_connect', `连接时发生错误: ${err.message}`)
    })
    this.client.connect()
    this.initialized = true
    this._registerChatListener()
    logger.info('KOOK 机器人已成功连接。')
  }

  _registerChatListener() {
    if (!config.KOOK_CHAT_CHANNEL_ID) {
      logger.info('KOOK_CHAT_CHANNEL_ID 未配置，聊天消息监听功能未开启。')
      return
    }
    this.client.on('message.text', (event) => {
      const { channelId, content } = event
      if (!content || channelId !== config.KOOK_CHAT_CHANNEL_ID) return
      for (const key in keywords) {
        if (content.includes(key)) {
          const card = new Card().addText(keywords[key])
          event.reply(card).catch((err) => logger.error(MODULE_NAME, '_registerChatListener', `回复消息失败: ${err.message}`))
          return
        }
      }
    })
  }

  async sendMessage(channelId, content, messageType = MessageType.CARD) {
    if (!this.initialized) return logger.warn('无法发送消息：KOOK 客户端尚未初始化。')
    if (!channelId) return logger.warn('无法发送消息：未提供或未配置频道ID。')
    try {
      let message = content
      if (messageType === MessageType.CARD) {
        message = new Card().addText(content)
      }
      await this.client.API.message.create(messageType, channelId, message)
    } catch (err) {
      logger.error(MODULE_NAME, 'sendMessage', `向频道 ${channelId} 发送消息失败: ${err.message}`)
    }
  }

  async renameOnlineChannel(name) {
    if (!this.initialized) return logger.warn('无法重命名频道：KOOK 客户端尚未初始化。')
    try {
      await this.client.API.channel.update(config.KOOK_ONLINE_CHANNEL_ID, name)
    } catch (err) {
      logger.error(MODULE_NAME, 'renameOnlineChannel', `重命名在线频道失败: ${err.message}`)
    }
  }

  sendAnnouncement(msg) {
    return this.sendMessage(config.KOOK_ONLINE_CHANNEL_ID, msg, MessageType.CARD)
  }

  sendBanRecord(msg) {
    return this.sendMessage(config.KOOK_BAN_CHANNEL_ID, msg, MessageType.CARD)
  }

  sendStatus(msg) {
    return this.sendMessage(config.KOOK_STATUS_CHANNEL_ID, msg, MessageType.TEXT)
  }
}

module.exports = new MyKook()
