const { Tail } = require('tail')
const { EventEmitter } = require('events')
const fs = require('fs')
const logger = require('@/utils/logger')

const MODULE_NAME = '日志监听器'

/**
 * 负责监听指定日志文件的变化，并逐行发出日志内容。
 * @extends EventEmitter
 */
class LogTailer extends EventEmitter {
  constructor(filePath) {
    super()
    if (!filePath) {
      logger.warn('未在 .env 文件中提供 PATH_LOG_FILE，日志监听模块已禁用。')
      return
    }
    if (!fs.existsSync(filePath)) {
      logger.warn(`指定的日志文件不存在: ${filePath}，日志监听模块已禁用。`)
      return
    }

    this.filePath = filePath
    this.tail = null
  }

  /**
   * 开始监听日志文件
   */
  start() {
    if (this.tail) {
      logger.warn('日志监听器已经启动，请勿重复调用 start()。')
      return
    }

    try {
      this.tail = new Tail(this.filePath, { fromBeginning: false, follow: true })

      this.tail.on('line', (line) => {
        // 发射 'line' 事件，将原始日志行传递出去
        this.emit('line', line)
      })

      this.tail.on('error', (error) => {
        logger.error(MODULE_NAME, 'tailError', `监听文件 ${this.filePath} 时发生错误: ${error.message}`)
        this.emit('error', error) // 转发错误事件
      })

      logger.info(`已开始监听日志文件: ${this.filePath}`)
    } catch (error) {
      logger.error(MODULE_NAME, 'start', `启动日志监听器失败: ${error.message}`)
    }
  }

  /**
   * 停止监听
   */
  stop() {
    if (this.tail) {
      this.tail.unwatch()
      this.tail = null
      logger.info(`已停止监听日志文件: ${this.filePath}`)
    }
  }
}

module.exports = LogTailer
