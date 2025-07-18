const config = require('@/core/config')
const db = require('@/plugins/db')
const kook = require('@/plugins/kook')
const rcon = require('@/plugins/rcon')
const logger = require('@/utils/logger')
const { formatMessage } = require('@/utils/formatter')

const MODULE_NAME = '事件处理器'

async function onServerStarted(data) {
  logger.info(`[${MODULE_NAME}] 事件: 服务器已启动`)
  try {
    // 使用事务确保数据库操作的原子性
    db.transaction(() => {
      db.clear('system')
      db.insert('system', { runtime: new Date().toISOString() })
      db.updateAll('players', { isonline: 0 })
    })

    // 外部服务调用不适合放在DB事务内
    await kook.renameOnlineChannel('服务器重启完毕')
    await kook.sendAnnouncement('服务器重启完毕，可以上线了！')
    await kook.sendStatus(config.KOOK_MSG_SERVER_RESTARTED)
  } catch (error) {
    logger.error(MODULE_NAME, 'onServerStarted', error)
  }
}

async function onPlayerJoined(data) {
  logger.info(`[${MODULE_NAME}] 事件: 玩家已加入 - ${data.name} (${data.id})`)
  try {
    await db.upsert('players', { id: data.id, name: data.name, isonline: 1 }, 'id')
    await kook.sendStatus(formatMessage(config.KOOK_MSG_LOGIN, data))
    await rcon.messagePlayer(data.id, config.RCON_MSG_HOURLY_WELCOME)
  } catch (error) {
    logger.error(MODULE_NAME, 'onPlayerJoined', error)
  }
}

async function onPlayerSpawned(data) {
  logger.info(`[${MODULE_NAME}] 事件: 新玩家出生 - ${data.name} (${data.id})`)
  try {
    await db.upsert('players', { id: data.id, name: data.name, isonline: 1 }, 'id')
    await kook.sendStatus(formatMessage(config.KOOK_MSG_SPAWN, data))
    await rcon.messagePlayer(data.id, config.RCON_MSG_HOURLY_WELCOME)
  } catch (error) {
    logger.error(MODULE_NAME, 'onPlayerSpawned', error)
  }
}

async function onPlayerLeftSafe(data) {
  logger.info(`[${MODULE_NAME}] 事件: 玩家安全下线 - ${data.name} (${data.id})`)
  try {
    await db.update('players', { id: data.id }, { isonline: 0 })
    await kook.sendStatus(formatMessage(config.KOOK_MSG_SAFELOG, data))
  } catch (error) {
    logger.error(MODULE_NAME, 'onPlayerLeftSafe', error)
  }
}

async function onPlayerLeftUnsafe(data) {
  logger.info(`[${MODULE_NAME}] 事件: 玩家非安全下线 - ${data.name} (${data.id})`)
  try {
    await db.update('players', { id: data.id }, { isonline: 0 })
    await kook.sendStatus(formatMessage(config.KOOK_MSG_LOGOUT, data))
  } catch (error) {
    logger.error(MODULE_NAME, 'onPlayerLeftUnsafe', error)
  }
}

async function onPlayerKilled(data) {
  logger.info(`[${MODULE_NAME}] 事件: 玩家被击杀 - 击杀者: ${data.killername}, 受害者: ${data.killedname}`)
  try {
    const dinoClass = await db.select('classis', { class: data.killedclass }, { limit: 1 })
    if (!dinoClass || !dinoClass.cost) {
      logger.warn(`[${MODULE_NAME}] 无法找到物种 ${data.killedclass} 的成本配置，跳过积分奖励。`)
      // 即使没有积分，也要记录击杀并更新状态
      db.transaction(() => {
        db.insert('kills', {
          killerid: data.killerid,
          killername: data.killername,
          killerclass: data.killerclass,
          killedid: data.killedid,
          killedname: data.killedname,
          killedclass: data.killedclass,
          time: new Date().toISOString()
        })
        db.update('players', { id: data.killedid }, { isonline: 0 })
      })
      return
    }

    const rewardPoints = Math.floor(parseFloat(data.killedgrowth) * dinoClass.cost * 0.2)
    const killer = await db.select('players', { id: data.killerid }, { limit: 1 })

    // 使用事务来保证击杀记录、受害者状态和击杀者积分的原子性更新
    db.transaction(() => {
      db.insert('kills', {
        killerid: data.killerid,
        killername: data.killername,
        killerclass: data.killerclass,
        killedid: data.killedid,
        killedname: data.killedname,
        killedclass: data.killedclass,
        time: new Date().toISOString()
      })
      db.update('players', { id: data.killedid }, { isonline: 0 })
      if (killer) {
        db.update('players', { id: data.killerid }, { points: (killer.points || 0) + rewardPoints })
      } else {
        // 如果击杀者信息不存在，事务会回滚，保证数据一致性
        // 但在此场景下，我们可能希望即使击杀者信息有误，击杀记录仍然保存
        // 因此，将killer的检查放在事务外
        logger.warn(`[${MODULE_NAME}] 未找到击杀者 ${data.killername} 的信息，无法发放积分。`)
      }
    })

    if (killer) {
      const messageData = { ...data, points: rewardPoints }
      const message = formatMessage(config.KOOK_MSG_KILLED, messageData)
      await kook.sendStatus(message)
    }
  } catch (error) {
    logger.error(MODULE_NAME, 'onPlayerKilled', error)
  }
}

async function onPlayerDied(data) {
  logger.info(`[${MODULE_NAME}] 事件: 玩家死亡 - ${data.name} (${data.id})`)
  try {
    await db.update('players', { id: data.id }, { isonline: 0 })
    await kook.sendStatus(formatMessage(config.KOOK_MSG_DIED, data))
  } catch (error) {
    logger.error(MODULE_NAME, 'onPlayerDied', error)
  }
}

async function onPlayerChat(data) {
  logger.info(`[${MODULE_NAME}] 事件: 玩家聊天 - ${data.name}: ${data.content}`)
  const REG_PASSWORD_LENGTH = 6 // !reg 命令的密码长度
  try {
    if (data.content.toLowerCase().startsWith('!reg')) {
      const password = data.content.split(' ')[1]
      if (password && password.length === REG_PASSWORD_LENGTH && !isNaN(password)) {
        await db.upsert('players', { id: data.id, name: data.name, password: password, isonline: 1 }, 'id')
        const message = formatMessage(config.RCON_MSG_REG_SUCCESS, { password })
        await rcon.messagePlayer(data.id, message)
      } else {
        await rcon.messagePlayer(data.id, config.RCON_MSG_REG_FAIL)
      }
    } else {
      await db.insert('chats', { id: data.id, content: data.content, groupid: data.groupid, time: new Date().toISOString() })
    }
  } catch (error) {
    logger.error(MODULE_NAME, 'onPlayerChat', error)
  }
}

module.exports = { onServerStarted, onPlayerJoined, onPlayerSpawned, onPlayerLeftSafe, onPlayerLeftUnsafe, onPlayerKilled, onPlayerDied, onPlayerChat }
