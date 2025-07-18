const jwt = require('jsonwebtoken')
const config = require('@/core/config')
const db = require('@/plugins/db')
const logger = require('@/utils/logger')

const MODULE_NAME = '服务-认证'
const SECRET_KEY = config.JWT_SECRET

/**
 * 用户登录并签发 Token
 * @param {string} id - 用户ID
 * @param {string} password - 用户密码
 * @returns {Promise<string>} - 返回生成的 JWT
 */
async function login(id, password) {
  if (!id || !password) {
    throw new Error('ID和密码均不能为空。')
  }

  const user = await db.select('players', { id: id }, { limit: 1 })

  if (!user) {
    logger.warn(`[${MODULE_NAME}] 登录失败: 未找到用户 [${id}]。`)
    throw new Error('用户不存在。')
  }

  // 在实际应用中，密码应该是经过哈希存储的，这里仅为示例
  // const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  const isPasswordValid = password === user.password

  if (!isPasswordValid) {
    logger.warn(`[${MODULE_NAME}] 登录失败: 用户 [${id}] 密码错误。`)
    throw new Error('密码错误。')
  }

  // 密码验证成功，生成 Token
  const payload = { id: user.id, name: user.name }
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' }) // Token有效期24小时

  logger.info(`[${MODULE_NAME}] 用户 [${id}] 登录成功。`)
  return token
}

module.exports = { login }
