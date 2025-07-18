const express = require('express')
const router = express.Router()
const authService = require('@/core/auth/authService')
const authMiddleware = require('@/core/auth/authMiddleware')
const logger = require('@/utils/logger')

const MODULE_NAME = '路由-公共认证'

// --- 路由模块 ---
const playerRoutes = require('./players')
const characterRoutes = require('./character')
const banRoutes = require('./ban')

// --- 认证路由 (不受保护) ---
router.post('/auth/login', async (req, res) => {
  try {
    const { id, password } = req.body
    const token = await authService.login(id, password)
    res.json({ success: true, token })
  } catch (error) {
    logger.warn(`[${MODULE_NAME}] 登录尝试失败 for user [${req.body.id}]: ${error.message}`)
    res.status(401).json({ success: false, message: error.message })
  }
})

// --- 从此处开始，所有路由都需要认证 ---
router.use(authMiddleware)

// POST /auth/logout - 用户登出 (象征性)
router.post('/auth/logout', (req, res) => {
  // 对于无状态的JWT，服务器端登出通常是象征性的。
  // 客户端应负责销毁本地存储的Token。
  // 如果需要强制Token失效，需要实现一个Token黑名单机制。
  logger.info(`[${MODULE_NAME}] 用户 [${req.user.id}] 登出。`)
  res.json({ success: true, message: '登出成功。' })
})

// --- 挂载受保护的路由 ---
router.use('/players', playerRoutes)
router.use('/character', characterRoutes)
router.use('/ban', banRoutes)

module.exports = router
