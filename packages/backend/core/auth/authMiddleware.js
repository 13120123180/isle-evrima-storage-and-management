const jwt = require('jsonwebtoken')
const config = require('@/core/config')
const logger = require('@/utils/logger')

const MODULE_NAME = '中间件-认证'
const SECRET_KEY = config.JWT_SECRET

/**
 * Express 中间件，用于验证 JWT
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '认证失败：缺少 Token。' })
  }

  const token = authHeader.split(' ')[1]

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      // 记录无效Token的尝试
      logger.warn(`[${MODULE_NAME}] 无效的Token被拒绝访问。IP: ${req.ip}, Token: ${token}`)
      return res.status(403).json({ success: false, message: '认证失败：无效的 Token。' })
    }

    // 将解码后的用户信息附加到请求对象上
    req.user = decoded
    next()
  })
}

module.exports = authMiddleware
