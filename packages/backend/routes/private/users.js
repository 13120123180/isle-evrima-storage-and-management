const express = require('express')
const router = express.Router()
const db = require('@/plugins/db')
const { getDecryptedSaveData } = require('@/utils/saveFileReader') // 导入存档读取工具
const logger = require('@/utils/logger')

const MODULE_NAME = '路由-私有-用户'
const handleRequest = require('@/utils/routeHandler')

// --- 用户列表与搜索 (GET /users/list) ---
router.get(
  '/list',
  handleRequest(async (params) => {
    const { id, name, page = 1, pageSize = 10 } = params

    // 使用 db.paginate 方法，避免手动拼接 SQL，更安全、更简洁
    const where = {}
    if (id) {
      where.id = { operator: 'LIKE', value: `%${id}%` }
    }
    if (name) {
      where.name = { operator: 'LIKE', value: `%${name}%` }
    }

    return db.paginate('players', where, { page, pageSize })
  })
)

// --- 用户详情 (GET /users/detail) ---
router.get(
  '/detail',
  handleRequest(async (params) => {
    const { id } = params
    if (!id) throw new Error('玩家ID不能为空。')

    const [playerInfo, saveData, killsAsKiller, killsAsVictim, chats] = await Promise.all([
      db.select('players', { id: id }, { limit: 1 }),
      getDecryptedSaveData(id), // 新增调用
      db.select('kills', { killerid: id }),
      db.select('kills', { killedid: id }),
      db.select('chats', { id: id })
    ])

    if (!playerInfo) {
      logger.warn(`[${MODULE_NAME}] 查询用户详情失败: 未找到ID为 [${id}] 的用户。`)
      // 即使玩家基本信息不存在，也可能存在相关日志，所以仍然返回空数据结构而不是抛出错误
    }

    return {
      playerInfo: playerInfo || null,
      saveData: saveData || null, // 新增字段
      killsAsKiller,
      killsAsVictim,
      chats
    }
  })
)

// --- 用户更新 (POST /users/update) ---
router.post(
  '/update',
  handleRequest(async (params, user) => {
    const { id, points } = params
    if (!id) throw new Error('要更新的用户ID不能为空。')

    const updateData = {}
    if (points !== undefined) {
      const newPoints = parseInt(points, 10)
      if (isNaN(newPoints) || newPoints < 0) {
        throw new Error('积分必须是一个有效的非负数字。')
      }
      updateData.points = newPoints
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('没有提供任何要更新的数据。')
    }

    const result = db.update('players', { id: id }, updateData)
    if (result.changes === 0) {
      logger.warn(`[${MODULE_NAME}] 更新用户信息失败: 未找到ID为 [${id}] 的用户，或数据无需更新。操作员: ${user.id}`)
      throw new Error('未找到匹配的用户，或数据无需更新。')
    }

    logger.info(`[${MODULE_NAME}] 用户 [${id}] 的信息已由管理员 [${user.id}] 更新。`)
    return { message: '用户信息更新成功。' }
  })
)

module.exports = router
