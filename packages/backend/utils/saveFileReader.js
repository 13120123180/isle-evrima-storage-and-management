const axios = require('axios')
const fs = require('fs').promises
const path = require('path')
const config = require('@/core/config')
const logger = require('@/utils/logger')

const MODULE_NAME = '工具-存档读取器'
const SAVE_GAME_PATH = config.PATH_PLAYER_DATA
const DECRYPT_URL = config.DECRYPT_SERVICE_URL
const API_TIMEOUT = parseInt(config.DECRYPT_SERVICE_TIMEOUT, 10) // 从配置中获取

/**
 * 读取并解密指定用户的游戏存档文件 (.sav or .sav.bak)
 * @param {string} userId - 玩家ID
 * @returns {Promise<object|null>} - 返回解密后的存档对象，如果找不到或失败则返回null
 */
async function getDecryptedSaveData(userId) {
  let encryptedData
  try {
    encryptedData = await fs.readFile(path.join(SAVE_GAME_PATH, `${userId}.sav`), 'utf-8')
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(MODULE_NAME, 'getDecryptedSaveData.readFile', `读取主存档失败 for user ${userId}: ${error.message}`)
      return null // 读取失败，返回null
    }
    try {
      encryptedData = await fs.readFile(path.join(SAVE_GAME_PATH, `${userId}.sav.bak`), 'utf-8')
    } catch (bakError) {
      if (bakError.code !== 'ENOENT') {
        logger.error(MODULE_NAME, 'getDecryptedSaveData.readFile.bak', `读取备份存档失败 for user ${userId}: ${bakError.message}`)
      }
      return null // 主/备存档都不存在或读取失败，返回null
    }
  }

  try {
    const response = await axios.post(`${DECRYPT_URL}/decrypt`, { data: encryptedData }, { timeout: API_TIMEOUT })
    if (!response.data || !response.data.success) {
      logger.error(
        MODULE_NAME,
        'getDecryptedSaveData.decryptAPI',
        `解密服务返回失败 for user ${userId}: ${response.data ? response.data.message : '无响应数据'}`
      )
      return null
    }
    return JSON.parse(response.data.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(MODULE_NAME, 'getDecryptedSaveData.axios', `调用解密服务时发生 Axios 错误 for user ${userId}: ${error.message}`)
    } else {
      logger.error(MODULE_NAME, 'getDecryptedSaveData.unknown', `调用解密服务时发生未知错误 for user ${userId}: ${error.message}`)
    }
    return null
  }
}
/**
 * 删除指定用户的游戏存档文件 (.sav 和 .sav.bak)
 * @param {string} userId - 玩家ID
 */
async function deleteSaveFiles(userId) {
  const savPath = path.join(SAVE_GAME_PATH, `${userId}.sav`)
  const bakPath = path.join(SAVE_GAME_PATH, `${userId}.sav.bak`)

  try {
    await fs.unlink(savPath)
    logger.info(MODULE_NAME, 'deleteSaveFiles', `已删除主存档文件: ${savPath}`)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // 忽略文件不存在的错误
      logger.error(MODULE_NAME, 'deleteSaveFiles', `删除主存档文件失败 ${savPath}: ${error.message}`)
      throw error // 重新抛出其他错误
    }
  }

  try {
    await fs.unlink(bakPath)
    logger.info(MODULE_NAME, 'deleteSaveFiles', `已删除备份存档文件: ${bakPath}`)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // 忽略文件不存在的错误
      logger.error(MODULE_NAME, 'deleteSaveFiles', `删除备份存档文件失败 ${bakPath}: ${error.message}`)
      throw error // 重新抛出其他错误
    }
  }
}

module.exports = { getDecryptedSaveData, deleteSaveFiles }
