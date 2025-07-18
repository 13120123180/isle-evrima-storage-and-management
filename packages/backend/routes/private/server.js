const express = require('express')
const router = express.Router()
const config = require('@/core/config')
const rcon = require('@/plugins/rcon')
const kook = require('@/plugins/kook')
const scheduledTasks = require('@/core/tasks/scheduledTasks')
const fs = require('fs').promises // 引入 fs.promises
const path = require('path') // 引入 path

const handleRequest = require('@/utils/routeHandler')

// --- 数据展示接口 (GET) ---

// GET /serv/status - 获取服务器状态
router.get(
  '/status',
  handleRequest(() => rcon.getServerInfo())
)

// GET /serv/schedules - 获取定时任务配置
router.get(
  '/schedules',
  handleRequest(() => {
    return {
      reboot_hours: config.TASK_REBOOT_HOURS,
      cleanup_hours: config.TASK_CLEANUP_HOURS,
      welcome_minutes: config.TASK_WELCOME_MINUTES
    }
  })
)

// =============================================================================
// !!! 安全警告 (SECURITY WARNING) !!!
// 以下两个接口 (/serv/game-ini) 允许对服务器上的任意文件进行读写操作。
// 这是通过 `PATH_GAME_INI` 环境变量配置的。如果该环境变量被恶意篡改，
// 攻击者可能读取敏感文件或写入恶意代码，从而完全控制服务器。
//
// **部署要求 (DEPLOYMENT REQUIREMENT):**
// 必须在运维层面采取严格的访问控制措施，确保运行此应用的用户
// 无法修改环境变量，并且 `.env` 等配置文件具有严格的、最小化的文件权限。
// =============================================================================

// GET /serv/game-ini - 读取 Game.ini 配置文件内容
router.get(
  '/game-ini',
  handleRequest(async () => {
    const gameIniPath = config.PATH_GAME_INI
    if (!gameIniPath) {
      throw new Error('Game.ini 路径未配置。')
    }
    try {
      const content = await fs.readFile(gameIniPath, 'utf8')
      return { content }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Game.ini 文件未找到: ${gameIniPath}`)
      } else {
        throw new Error(`读取 Game.ini 文件失败: ${error.message}`)
      }
    }
  })
)

// POST /serv/game-ini - 写入 Game.ini 配置文件内容
router.post(
  '/game-ini',
  handleRequest(async (params) => {
    const { content } = params
    if (content === undefined || content === null) {
      throw new Error('要写入的内容不能为空。')
    }
    const gameIniPath = config.PATH_GAME_INI
    if (!gameIniPath) {
      throw new Error('Game.ini 路径未配置。')
    }
    try {
      await fs.writeFile(gameIniPath, content, 'utf8')
      return { message: 'Game.ini 文件写入成功。' }
    } catch (error) {
      throw new Error(`写入 Game.ini 文件失败: ${error.message}`)
    }
  })
)

// --- 操作执行接口 (POST) ---

// POST /serv/cast - 发送游戏内广播
router.post(
  '/cast',
  handleRequest((params) => {
    const { message } = params
    if (!message) throw new Error('广播消息内容不能为空。')
    return rcon.broadcast(message)
  })
)

// POST /serv/kook - 发送KOOK公告
router.post(
  '/kook',
  handleRequest((params) => {
    const { message } = params
    if (!message) throw new Error('KOOK公告内容不能为空。')
    return kook.sendAnnouncement(message)
  })
)

// POST /serv/save - 保存游戏世界
router.post(
  '/save',
  handleRequest(() => rcon.save())
)

// POST /serv/clean - 清理服务器
router.post(
  '/clean',
  handleRequest(() => rcon.cleanup())
)

// POST /serv/reboot - 手动触发重启
router.post(
  '/reboot',
  handleRequest(() => scheduledTasks.handleRebootSequence())
)

module.exports = router
