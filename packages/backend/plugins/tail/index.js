const { EventEmitter } = require('events')
const config = require('@/core/config')
const LogTailer = require('./tail')
const { parseLogLine } = require('./events')
const logger = require('@/utils/logger')

class LogEmitter extends EventEmitter {
  constructor() {
    super()
    const logFilePath = config.PATH_LOG_FILE
    this.logTailer = new LogTailer(logFilePath)
    this._initialize()
  }

  _initialize() {
    if (!this.logTailer.filePath) {
      logger.warn('由于未配置日志文件路径，LogEmitter 未启动。')
      return
    }
    this.logTailer.on('line', (line) => {
      const parsedEvent = parseLogLine(line)
      if (parsedEvent) {
        const { eventName, data } = parsedEvent
        this.emit(eventName, data)
      }
    })
    this.logTailer.on('error', (error) => {
      this.emit('error', error)
    })
  }

  start() {
    this.logTailer.start()
    logger.info('日志事件发射器已启动。')
  }

  stop() {
    this.logTailer.stop()
    logger.info('日志事件发射器已停止。')
  }
}

module.exports = new LogEmitter()
