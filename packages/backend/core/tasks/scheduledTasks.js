const config = require('@/core/config')
const rcon = require('@/plugins/rcon')
const kook = require('@/plugins/kook')
const logger = require('@/utils/logger')
const db = require('@/plugins/db') // 引入数据库模块
const { exec } = require('child_process')

const MODULE_NAME = '定时任务逻辑'

// 辅助函数，用于将 exec 包装成 Promise
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr })
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

async function _hasRestartedRecently(hours = 1) {
  try {
    // 从 system 表直接查询唯一的一行记录
    const startupState = await db.select('system', {}, { limit: 1 })
    if (!startupState || !startupState.runtime) {
      logger.warn(`[${MODULE_NAME}] 无法从数据库中获取上次启动时间，将继续执行任务。`)
      return false
    }

    const lastStartupTime = new Date(startupState.runtime)
    const threshold = hours * 60 * 60 * 1000
    const hasRestarted = new Date() - lastStartupTime < threshold

    if (hasRestarted) {
      logger.info(`[${MODULE_NAME}] 服务器在最近 ${hours} 小时内重启过，跳过当前任务序列。`)
    }
    return hasRestarted
  } catch (error) {
    logger.error(MODULE_NAME, '_hasRestartedRecently', `检查最近重启时间时发生数据库错误: ${error.message}`)
    // 在检查失败时，默认允许任务执行，避免因数据库问题卡住所有定时任务
    return false
  }
}

async function handleRebootSequence() {
  if (await _hasRestartedRecently(1)) return

  const serviceName = config.WINDOWS_SERVICE_NAME

  try {
    logger.info(`[${MODULE_NAME}] 触发重启序列...`)

    await kook.sendAnnouncement(config.KOOK_MSG_REBOOT_WARN_3MIN);
    await rcon.broadcast(config.RCON_MSG_REBOOT_WARN_3MIN);

    logger.info(`[${MODULE_NAME}] 等待2分钟...`)
    await new Promise((resolve) => setTimeout(resolve, 120000)) // 2 minutes

    await kook.sendAnnouncement(config.KOOK_MSG_REBOOT_WARN_1MIN);
    await rcon.broadcast(config.RCON_MSG_REBOOT_WARN_1MIN);

    logger.info(`[${MODULE_NAME}] 等待1分钟...`)
    await new Promise((resolve) => setTimeout(resolve, 60000)) // 1 minute

    logger.info(`[${MODULE_NAME}] 正在保存游戏世界...`)
    await rcon.save()

    logger.info(`[${MODULE_NAME}] 正在重命名KOOK频道为“服务器重启中”...`)
    await kook.renameOnlineChannel(config.KOOK_CHANNEL_NAME_REBOOTING);

    logger.info(`[${MODULE_NAME}] 正在停止 Windows 服务: ${serviceName}...`)
    try {
      const stopResult = await runCommand(`net stop ${serviceName}`)
      logger.info(`[${MODULE_NAME}] 成功停止服务: ${serviceName}。输出: ${stopResult.stdout}`)
      if (stopResult.stderr) logger.warn(`[${MODULE_NAME}] 停止服务时产生错误输出: ${stopResult.stderr}`)
    } catch (err) {
      logger.error(MODULE_NAME, 'handleRebootSequence.stopService', `停止服务 ${serviceName} 时出错: ${err.error ? err.error.message : err}`)
      if (err.stderr) logger.error(MODULE_NAME, 'handleRebootSequence.stopService.stderr', `停止服务时的错误输出: ${err.stderr}`)
    }

    logger.info(`[${MODULE_NAME}] 等待10秒以确保服务完全停止...`)
    await new Promise((resolve) => setTimeout(resolve, 10000))

    logger.info(`[${MODULE_NAME}] 正在启动 Windows 服务: ${serviceName}...`)
    try {
      const startResult = await runCommand(`net start ${serviceName}`)
      logger.info(`[${MODULE_NAME}] 成功启动服务: ${serviceName}。输出: ${startResult.stdout}`)
      if (startResult.stderr) logger.warn(`[${MODULE_NAME}] 启动服务时产生错误输出: ${startResult.stderr}`)
    } catch (err) {
      logger.error(MODULE_NAME, 'handleRebootSequence.startService', `启动服务 ${serviceName} 时出错: ${err.error ? err.error.message : err}`)
      if (err.stderr) logger.error(MODULE_NAME, 'handleRebootSequence.startService.stderr', `启动服务时的错误输出: ${err.stderr}`)
    }

    logger.info(`[${MODULE_NAME}] 服务器重启序列已完成。`)
  } catch (error) {
    logger.error(MODULE_NAME, 'handleRebootSequence', `重启序列中发生意外错误: ${error.message}`)
    try {
      await kook.sendAnnouncement(config.KOOK_MSG_REBOOT_FAIL);
    } catch (announceError) {
      logger.error(MODULE_NAME, 'handleRebootSequence.failAnnounce', `发送重启失败通知时出错: ${announceError.message}`)
    }
  }
}

async function handleCleanupSequence() {
  if (await _hasRestartedRecently(1)) return
  try {
    logger.info(`[${MODULE_NAME}] 触发清理序列...`)
    await rcon.broadcast(config.RCON_MSG_CLEANUP_WARNING)
    await new Promise((resolve) => setTimeout(resolve, 3 * 60 * 1000))
    logger.info(`[${MODULE_NAME}] 执行尸体清理...`)
    await rcon.cleanup()
    await rcon.broadcast(config.RCON_MSG_CLEANUP_DONE)
  } catch (error) {
    logger.error(MODULE_NAME, 'handleCleanupSequence', error)
  }
}

async function hourlyWelcome() {
  await rcon.broadcast(config.RCON_MSG_HOURLY_WELCOME)
}

async function updateKookChannelStatus() {
  try {
    const info = await rcon.getServerInfo()
    if (info) {
      const { ServerCurrentPlayers, ServerMaxPlayers } = info
      await kook.renameOnlineChannel(`在线: ${ServerCurrentPlayers} / ${ServerMaxPlayers}`)
    }
  } catch (error) {
    logger.error(MODULE_NAME, 'updateKookChannelStatus', error)
  }
}

module.exports = {
  handleRebootSequence,
  handleCleanupSequence,
  hourlyWelcome,
  updateKookChannelStatus
}
