const db = require('@/plugins/db')
const rcon = require('@/plugins/rcon')
const kook = require('@/plugins/kook')
const config = require('@/core/config')
const logger = require('@/utils/logger')
const { formatMessage } = require('@/utils/formatter')

const MODULE_NAME = '服务-封禁'

async function getBans(params) {
  const { page, pageSize, ids, state, witness } = params

  const where = {}
  if (ids) {
    where.ids = { operator: 'LIKE', value: `%${ids}%` }
  }
  if (state !== undefined && state !== null && state !== '') {
    where.state = state
  }
  if (witness) {
    where.witness = witness
  }

  return db.paginate('bans', where, {
    page,
    pageSize,
    orderBy: { column: 'time', order: 'DESC' }
  })
}

async function getBanById(banId) {
  const ban = await db.select('bans', { id: banId }, { limit: 1 })
  if (!ban) {
    logger.warn(`[${MODULE_NAME}] 查询封禁详情失败: 未找到ID为 [${banId}] 的记录。`)
    throw new Error('未找到该封禁记录。')
  }
  return ban
}

async function createBan(params, user) {
  const { ids, reason, video, type, time } = params
  const banData = { ids, reason, video, type, time, state: 0, witness: user.id }
  const result = await db.insert('bans', banData)
  logger.info(`[${MODULE_NAME}] 新的封禁提议已创建: ID [${result.lastInsertRowid}], 提议人 [${user.id}]`)
  return { id: result.lastInsertRowid, ...banData }
}

async function voteOnBan(banId, voterId, voteType) {
  let ban, finalState

  // 1. 使用事务来原子化地更新投票状态，防止竞态条件
  db.transaction(() => {
    ban = db.select('bans', { id: banId }, { limit: 1 })
    if (!ban) {
      logger.warn(`[${MODULE_NAME}] 投票失败: 未找到ID为 [${banId}] 的封禁记录。`)
      throw new Error('找不到对应的封禁记录。')
    }
    if (ban.state !== 0) {
      logger.warn(`[${MODULE_NAME}] 投票失败: 封禁 [${banId}] 的投票已结束。`)
      throw new Error('投票已结束。')
    }

    let supporters = ban.supporter ? ban.supporter.split(',').filter(Boolean) : []
    let opponents = ban.opponent ? ban.opponent.split(',').filter(Boolean) : []

    // 确保用户不能重复投票
    supporters = supporters.filter((id) => id !== voterId)
    opponents = opponents.filter((id) => id !== voterId)

    if (voteType === 'approve') {
      supporters.push(voterId)
    } else {
      opponents.push(voterId)
    }

    const voteThreshold = parseInt(config.GAME_VOTE_THRESHOLD, 10)
    let newState = 0
    if (supporters.length >= voteThreshold) newState = 1 // 封禁成功
    else if (opponents.length >= voteThreshold) newState = 2 // 封禁失败

    finalState = newState // 将最终状态保存到外部变量
    db.update('bans', { id: banId }, { supporter: supporters.join(','), opponent: opponents.join(','), state: newState })
    logger.info(`[${MODULE_NAME}] 用户 [${voterId}] 为封禁 [${banId}] 投票: ${voteType}。当前支持: ${supporters.length}, 反对: ${opponents.length}`)
  })

  // 2. 在事务成功提交后，执行外部调用，避免长事务
  if (finalState !== 0) {
    logger.info(`封禁投票 [${banId}] 已结束，状态: ${finalState}`)
    if (finalState === 1) {
      await executeBan(ban) // ban 对象是从事务内部获取的
    } else {
      const message = formatMessage(config.KOOK_MSG_BAN_FAIL, { ids: ban.ids })
      await kook.sendBanRecord(message)
    }
  }

  return { message: '投票成功！', state: finalState }
}

async function revokeBan(banId) {
  const result = await db.update('bans', { id: banId }, { state: 3 })
  if (result.changes > 0) {
    logger.info(`[${MODULE_NAME}] 封禁 [${banId}] 已被管理员撤销。`)
  }
  return result
}

/**
 * 执行完整的封禁流程：RCON封禁、发放补偿和奖励、发送KOOK通知
 * @param {object} ban - 从数据库中查出的完整封禁记录对象
 */
async function executeBan(ban) {
  try {
    const targetIds = ban.ids.split(',')
    for (const targetId of targetIds) {
      const targetPlayer = await db.select('players', { id: targetId }, { limit: 1 })
      await rcon.banPlayer(
        targetId,
        ban.type || 'kaigua',
        parseInt(config.GAME_BAN_DURATION_HOURS, 10),
        targetPlayer ? targetPlayer.name : 'unRegisteredPlayer'
      )
      const kills = await db.select('kills', { killerid: targetId })
      for (const kill of kills) {
        const victim = await db.select('players', { id: kill.killedid }, { limit: 1 })
        if (victim) {
          const victimCompensationPoints = parseInt(config.GAME_VOTE_COMPENSATION_POINTS, 10)
          await db.update('players', { id: victim.id }, { points: (victim.points || 0) + victimCompensationPoints })
          const message = formatMessage(config.KOOK_MSG_VICTIM_COMPENSATION, {
            name: victim.name,
            killername: kill.killername,
            points: victimCompensationPoints
          })
          await kook.sendBanRecord(message)
        }
      }
    }
    const witness = await db.select('players', { id: ban.witness }, { limit: 1 })
    if (witness) {
      const witnessRewardPoints = parseInt(config.GAME_VOTE_WITNESS_REWARD_POINTS, 10)
      await db.update('players', { id: witness.id }, { points: (witness.points || 0) + witnessRewardPoints })
      const message = formatMessage(config.KOOK_MSG_WITNESS_REWARD, { name: witness.name, points: witnessRewardPoints })
      await kook.sendBanRecord(message)
    }
    const message = formatMessage(config.KOOK_MSG_BAN_SUCCESS, { ids: ban.ids, reason: ban.reason })
    await kook.sendBanRecord(message)
    logger.info(`[${MODULE_NAME}] 封禁流程执行成功: BanID [${ban.id}]`)
  } catch (error) {
    logger.error(MODULE_NAME, 'executeBan', `执行封禁流程 BanID [${ban.id}] 时发生严重错误: ${error}`)
    // 尝试通知管理员封禁执行失败
    try {
      await kook.sendBanRecord(`(met)all(met) 封禁执行失败！BanID: ${ban.id}，原因: ${error.message}，请管理员手动检查处理！`)
    } catch (notifyError) {
      logger.error(MODULE_NAME, 'executeBan.notifyFail', `发送封禁失败通知时也发生错误: ${notifyError}`)
    }
  }
}

module.exports = {
  getBans,
  getBanById,
  createBan,
  voteOnBan,
  revokeBan,
  executeBan
}
