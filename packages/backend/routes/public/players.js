const express = require('express')
const router = express.Router()
const config = require('@/core/config')
const db = require('@/plugins/db')
const logger = require('@/utils/logger')

const handleRequest = require('@/utils/routeHandler')

const MODULE_NAME = '路由-玩家'
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000 // 一天的毫秒数

// GET /players/me - 获取当前登录用户的详细信息
router.get(
  '/me',
  handleRequest(async (params, user) => {
    const userId = user.id
    const player = await db.select('players', { id: userId }, { limit: 1 })
    if (player) {
      return player
    } else {
      logger.warn(`[${MODULE_NAME}] Token有效，但未在数据库中找到用户 [${userId}]。`)
      // 注意：此处的错误消息会暴露给客户端
      throw new Error('未在数据库中找到与您的Token匹配的用户。')
    }
  })
)

// POST /players/me/signin - 每日签到
router.post(
  '/me/signin',
  handleRequest(async (params, user) => {
    const userId = user.id

    // 使用数据库事务来防止竞态条件，确保签到操作的原子性
    const result = db.transaction(() => {
      const player = db.select('players', { id: userId }, { limit: 1 })
      if (!player) {
        logger.warn(`[${MODULE_NAME}] 签到失败: 未找到用户 [${userId}]。`)
        throw new Error('未找到该玩家。')
      }

      // 所有日期计算均基于 UTC 时间
      const today = new Date().toISOString().slice(0, 10)
      if (player.signindate === today) {
        logger.warn(`[${MODULE_NAME}] 签到失败: 用户 [${userId}] 今日已签到。`)
        throw new Error('今日已签到，请勿重复操作。')
      }

      const yesterday = new Date(Date.now() - ONE_DAY_IN_MS).toISOString().slice(0, 10)
      let newSigninTimes = 1
      // 检查上次签到是否是昨天，以计算连续签到天数
      if (player.signindate === yesterday) {
        newSigninTimes = (player.signintimes || 0) + 1
      }

      const maxDays = parseInt(config.GAME_SIGNIN_MAX_CONSECUTIVE_DAYS, 10)
      const multiplier = parseInt(config.GAME_SIGNIN_POINTS_MULTIPLIER, 10)
      const pointsToAdd = Math.min(newSigninTimes, maxDays) * multiplier
      const newPoints = (player.points || 0) + pointsToAdd

      db.update('players', { id: userId }, { points: newPoints, signindate: today, signintimes: newSigninTimes })

      logger.info(
        `[${MODULE_NAME}] 用户 [${userId}] 签到成功。连续天数: ${newSigninTimes}, 获得积分: ${pointsToAdd}, 总积分: ${newPoints}`
      )
      return { message: `签到成功！连续签到 ${newSigninTimes} 天，获得 ${pointsToAdd} 积分。`, points: newPoints }
    })

    return result
  })
)

module.exports = router
