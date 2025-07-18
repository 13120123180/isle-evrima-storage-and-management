const express = require('express')
const router = express.Router()
const db = require('@/plugins/db')
const kook = require('@/plugins/kook')
const config = require('@/core/config')
const { formatMessage } = require('@/utils/formatter')
const { executeBan } = require('@/core/services/banService') // 导入新的服务
const logger = require('@/utils/logger')

const MODULE_NAME = '路由-私有-封禁'
const handleRequest = require('@/utils/routeHandler')

// --- 封禁列表与搜索 (GET /bans/list) ---
router.get(
  '/list',
  handleRequest(async (params) => {
    const { ids, created_by, state, page = 1, pageSize = 10 } = params

    const where = {}
    if (ids) where.ids = { operator: 'LIKE', value: `%${ids}%` }
    if (created_by) where.created_by = { operator: 'LIKE', value: `%${created_by}%` }
    if (state !== undefined && state !== '') where.state = state

    const { list, total } = db.paginate('bans', where, {
      page,
      pageSize,
      orderBy: { column: 'time', order: 'DESC' }
    })

    return { list, total }
  })
)

// --- 封禁详情 (GET /bans/detail) ---
router.get(
  '/detail',
  handleRequest(async (params) => {
    const { id } = params
    if (!id) throw new Error('封禁记录ID不能为空。')

    const ban = await db.select('bans', { id: id }, { limit: 1 })
    if (!ban) {
      logger.warn(`[${MODULE_NAME}] 查询详情失败: 未找到ID为 [${id}] 的封禁记录。`)
      throw new Error('未找到该封禁记录。')
    }

    const fetchVoterNames = async (idString) => {
      if (!idString) return []
      const ids = idString.split(',').filter(Boolean)
      if (ids.length === 0) return []
      // 使用 db.select 和新的 IN 操作符格式
      return db.select('players', { id: { operator: 'IN', value: ids } }, { fields: ['id', 'name'] })
    }

    const [supporters, opponents] = await Promise.all([fetchVoterNames(ban.supporter), fetchVoterNames(ban.opponent)])

    return { ...ban, supporters, opponents }
  })
)

// --- 管理操作接口 (POST) ---

// POST /bans/approve - 管理员直接批准
router.post(
  '/approve',
  handleRequest(async (params, user) => {
    const { id } = params
    if (!id) throw new Error('封禁记录ID不能为空。')
    const ban = await db.select('bans', { id: id }, { limit: 1 })
    if (!ban) {
      logger.warn(`[${MODULE_NAME}] 批准失败: 未找到ID为 [${id}] 的封禁记录。操作员: ${user.id}`)
      throw new Error('未找到该封禁记录。')
    }
    if (ban.state === 1) {
      logger.warn(`[${MODULE_NAME}] 批准失败: 封禁 [${id}] 已被批准。操作员: ${user.id}`)
      throw new Error('该提议已被批准，请勿重复操作。')
    }

    await db.update('bans', { id: id }, { state: 1 })
    await executeBan(ban)
    logger.info(`[${MODULE_NAME}] 封禁 [${id}] 已由管理员 [${user.id}] 批准并执行。`)
    return { message: '封禁已由管理员批准并执行。' }
  })
)

// POST /bans/reject - 管理员直接否决
router.post(
  '/reject',
  handleRequest(async (params, user) => {
    const { id } = params
    if (!id) throw new Error('封禁记录ID不能为空。')
    const ban = await db.select('bans', { id: id }, { limit: 1 })
    if (!ban) {
      logger.warn(`[${MODULE_NAME}] 否决失败: 未找到ID为 [${id}] 的封禁记录。操作员: ${user.id}`)
      throw new Error('未找到该封禁记录。')
    }
    if (ban.state === 2) {
      logger.warn(`[${MODULE_NAME}] 否决失败: 封禁 [${id}] 已被否决。操作员: ${user.id}`)
      throw new Error('该提议已被否决，请勿重复操作。')
    }

    await db.update('bans', { id: id }, { state: 2 })
    const message = formatMessage(config.KOOK_MSG_BAN_FAIL, { ids: ban.ids })
    await kook.sendBanRecord(message)
    logger.info(`[${MODULE_NAME}] 封禁 [${id}] 已由管理员 [${user.id}] 否决。`)
    return { message: '封禁已由管理员否决。' }
  })
)

// POST /bans/revoke - 管理员撤销
router.post(
  '/revoke',
  handleRequest(async (params, user) => {
    const { id } = params
    if (!id) throw new Error('封禁记录ID不能为空。')
    const result = await db.update('bans', { id: id }, { state: 3 })
    if (result.changes === 0) {
      logger.warn(`[${MODULE_NAME}] 撤销失败: 未找到ID为 [${id}] 的封禁记录。操作员: ${user.id}`)
      throw new Error('未找到该封禁记录。')
    }
    logger.info(`[${MODULE_NAME}] 封禁 [${id}] 已由管理员 [${user.id}] 撤销。`)
    return { message: '封禁记录已由管理员撤销。' }
  })
)

module.exports = router
