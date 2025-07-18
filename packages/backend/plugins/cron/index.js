const schedule = require('node-schedule')
const logger = require('@/utils/logger')

const MODULE_NAME = '定时任务调度器'

let instance = null

/**
 * 通用定时任务调度器服务
 */
class Scheduler {
  constructor() {
    this.jobs = new Map()
    logger.info('定时任务调度器已初始化。')
  }

  /**
   * 创建并启动一个新的定时任务。
   * 如果已存在同名任务，将先取消旧任务再创建新的。
   * @param {string} name - 任务的唯一名称，用于管理。
   * @param {string} cronTime - Cron 格式的时间表达式 (e.g., '* 5 * * * *')。
   * @param {Function} taskFunction - 要执行的任务函数。
   */
  createJob(name, cronTime, taskFunction) {
    // 如果已存在同名任务，先取消
    if (this.jobs.has(name)) {
      this.removeJob(name)
    }

    try {
      const job = schedule.scheduleJob(cronTime, async () => {
        logger.info(`正在执行定时任务: ${name}...`)
        try {
          await taskFunction()
          logger.info(`定时任务: ${name} 执行成功。`)
        } catch (error) {
          logger.error(MODULE_NAME, `任务[${name}]`, error)
        }
      })

      this.jobs.set(name, job)
      logger.info(`已成功创建定时任务: '${name}'，执行时间: '${cronTime}'`)
    } catch (error) {
      logger.error(MODULE_NAME, 'createJob', `创建任务 '${name}' 失败，无效的Cron表达式: ${cronTime}`)
    }
  }

  /**
   * 根据名称取消并移除一个定时任务。
   * @param {string} name - 要移除的任务的名称。
   */
  removeJob(name) {
    const job = this.jobs.get(name)
    if (job) {
      job.cancel()
      this.jobs.delete(name)
      logger.info(`已成功移除定时任务: ${name}`)
    } else {
      logger.warn(`尝试移除一个不存在的定时任务: ${name}`)
    }
  }

  /**
   * 获取所有已注册的任务名称。
   * @returns {string[]}
   */
  getJobNames() {
    return Array.from(this.jobs.keys())
  }
}

// 导出 Scheduler 的单例
if (!instance) {
  instance = new Scheduler()
}

module.exports = instance
