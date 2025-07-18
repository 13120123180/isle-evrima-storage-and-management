const config = require('@/core/config')
const db = require('@/plugins/db')
const logger = require('@/utils/logger')
const { getDecryptedSaveData, deleteSaveFiles } = require('@/utils/saveFileReader')

const MODULE_NAME = '服务-角色'

/**
 * 获取角色详细信息
 * @param {string} userId - 玩家ID
 */
async function getCharacterDetails(userId) {
  const saveData = await getDecryptedSaveData(userId)
  if (!saveData) {
    logger.warn(`[${MODULE_NAME}] 获取角色详情失败: 未找到用户 [${userId}] 的存档。`)
    throw new Error('未找到存档文件。')
  }
  const classKey = saveData.Class ? saveData.Class.split('.BP_').pop().replace('_C', '') : '未知'
  const dinoClass = await db.select('classis', { name: classKey }, { limit: 1 })
  return {
    class: classKey,
    className: dinoClass ? dinoClass.label : classKey,
    cost: dinoClass ? dinoClass.cost : 0,
    gender: saveData.CustomizedData ? (saveData.CustomizedData.bIsFemale ? '雌性' : '雄性') : '未知',
    growth: `${Math.floor((saveData.Growth || 0) * 100)}%`,
    health: saveData.Health || 0
  }
}

/**
 * 删除角色存档
 * @param {string} userId - 玩家ID
 */
async function deleteCharacter(userId) {
  await deleteSaveFiles(userId)
  logger.info(`[${MODULE_NAME}] 用户 [${userId}] 的存档已被删除。`)
  return { message: '存档已删除。' }
}

/**
 * 回收角色，返还积分
 * @param {string} userId - 玩家ID
 */
async function sellCharacter(userId) {
  const saveData = await getDecryptedSaveData(userId)
  if (!saveData) {
    logger.warn(`[${MODULE_NAME}] 回收失败: 未找到用户 [${userId}] 的存档。`)
    throw new Error('无存档可回收。')
  }

  const growth = parseFloat(saveData.Growth)
  if (growth < parseFloat(config.GAME_SELL_MIN_GROWTH)) {
    logger.warn(
      `[${MODULE_NAME}] 回收失败: 用户 [${userId}] 的龙成长度 [${growth}] 低于最低要求 [${config.GAME_SELL_MIN_GROWTH}]。`
    )
    throw new Error(`成长度低于${config.GAME_SELL_MIN_GROWTH}，无法回收。`)
  }

  const classKey = saveData.Class ? saveData.Class.split('.BP_').pop().replace('_C', '') : '未知'
  const dinoClass = await db.select('classis', { name: classKey }, { limit: 1 })
  if (!dinoClass || !dinoClass.cost) {
    logger.warn(`[${MODULE_NAME}] 回收失败: 无法找到物种 [${classKey}] 的成本配置。`)
    throw new Error(`无法找到物种 ${classKey} 的成本配置。`)
  }

  const points = Math.floor(dinoClass.cost * 0.5)

  // 使用事务确保积分更新的原子性，防止竞态条件
  db.transaction(() => {
    const playerInfo = db.select('players', { id: userId }, { limit: 1 })
    if (!playerInfo) throw new Error('未找到该玩家信息。')

    const newPoints = (playerInfo.points || 0) + points
    db.update('players', { id: userId }, { points: newPoints })
  })

  // 事务成功后，再删除存档文件
  await deleteSaveFiles(userId)

  logger.info(`[${MODULE_NAME}] 用户 [${userId}] 回收角色 [${classKey}] 成功，获得 ${points} 积分。`)
  return { message: `回收成功，并获得${points}积分`, points }
}

/**
 * 使角色成长（点大）
 * @param {string} userId - 玩家ID
 */
async function growCharacter(userId) {
  const axios = require('axios')
  const fs = require('fs').promises
  const path = require('path')
  const growConfig = require('@/utils/growConf.js')
  const DECRYPT_URL = config.DECRYPT_SERVICE_URL
  const API_TIMEOUT = parseInt(config.DECRYPT_SERVICE_TIMEOUT, 10)
  const SAVE_GAME_PATH = config.PATH_PLAYER_DATA

  // 1. 前置检查 (在事务外)
  const saveData = await getDecryptedSaveData(userId)
  if (!saveData) {
    logger.warn(`[${MODULE_NAME}] 点大失败: 未找到用户 [${userId}] 的存档。`)
    throw new Error('无存档可用于点大。')
  }

  const classKey = saveData.Class ? saveData.Class.split('.BP_').pop().replace('_C', '') : '未知'
  const growthData = growConfig[classKey]
  if (!growthData) {
    logger.warn(`[${MODULE_NAME}] 点大失败: 未找到物种 [${classKey}] 的成长配置。`)
    throw new Error(`未找到物种 ${classKey} 的成长配置。`)
  }

  const dinoClass = await db.select('classis', { name: classKey }, { limit: 1 })
  if (!dinoClass || !dinoClass.cost) {
    logger.warn(`[${MODULE_NAME}] 点大失败: 无法找到物种 [${classKey}] 的成本配置。`)
    throw new Error(`无法找到物种 ${classKey} 的成本配置。`)
  }

  const growCost = dinoClass.cost
  const playerInfo = await db.select('players', { id: userId }, { limit: 1 })
  if (!playerInfo || (playerInfo.points || 0) < growCost) {
    logger.warn(
      `[${MODULE_NAME}] 点大失败: 用户 [${userId}] 积分不足。需要 [${growCost}], 拥有 [${playerInfo.points || 0}]。`
    )
    throw new Error(`积分不足，需要 ${growCost} 积分。`)
  }

  // 2. 调用外部加密服务 (在事务外)
  const { SavedNutrientsStruct, StaticParams } = growthData
  const newSaveData = { ...saveData, ...StaticParams, SavedNutrientsStruct: { ...saveData.SavedNutrientsStruct, ...SavedNutrientsStruct } }

  let encryptedData
  try {
    const response = await axios.post(`${DECRYPT_URL}/encrypt`, { data: JSON.stringify(newSaveData) }, { timeout: API_TIMEOUT })
    if (!response.data || !response.data.success) {
      throw new Error(`加密服务返回失败: ${response.data.message || '无响应数据'}`)
    }
    encryptedData = response.data.data
  } catch (error) {
    logger.error(MODULE_NAME, 'growCharacter.encrypt', `加密存档失败: ${error.message}`)
    // 重新包装错误，以便路由层可以提供更友好的用户消息
    const serviceError = new Error('与存档服务通信时发生错误，请稍后再试。')
    serviceError.originalError = error
    throw serviceError
  }

  // 3. 数据库事务：扣除积分 (快速、原子操作)
  try {
    db.transaction(() => {
      const currentPlayer = db.select('players', { id: userId }, { limit: 1 })
      if (!currentPlayer || (currentPlayer.points || 0) < growCost) {
        throw new Error(`积分不足，需要 ${growCost} 积分。`)
      }
      const newPoints = (currentPlayer.points || 0) - growCost
      db.update('players', { id: userId }, { points: newPoints })
    })
  } catch (dbError) {
    logger.error(MODULE_NAME, 'growCharacter.transaction', `扣除积分失败: ${dbError.message}`)
    throw new Error('更新玩家积分时出错，操作已取消。')
  }

  // 4. 写入最终存档文件 (在事务后)
  const finalSavePath = path.join(SAVE_GAME_PATH, `${userId}.sav`)
  const tempSavePath = `${finalSavePath}.${Date.now()}.tmp`

  try {
    // 4a. 写入临时文件
    await fs.writeFile(tempSavePath, encryptedData)
    // 4b. 原子性地重命名临时文件为最终文件
    await fs.rename(tempSavePath, finalSavePath)
    // 4c. 清理旧的备份文件 (如果存在)
    await fs.unlink(path.join(SAVE_GAME_PATH, `${userId}.sav.bak`)).catch((e) => e.code !== 'ENOENT' && logger.warn(`删除 .sav.bak 失败: ${e.message}`))
  } catch (fileError) {
    logger.error(MODULE_NAME, 'growCharacter.writeFile', `写入最终存档失败: ${fileError.message}`)
    // 补偿机制：文件写入失败，需要把积分还给用户
    logger.info(MODULE_NAME, 'growCharacter.compensation', `正在为用户 ${userId} 回滚积分...`)
    await db.update('players', { id: userId }, { points: playerInfo.points })
    throw new Error('写入存档文件失败，操作已回滚。')
  }

  return { success: true, message: `点大成功，消耗积分${growCost}` }
}

module.exports = {
  getCharacterDetails,
  deleteCharacter,
  sellCharacter,
  growCharacter
}
