const rcon = require('./rcon')
const logger = require('@/utils/logger')

const MODULE_NAME = 'RCON服务'

// --- 内部辅助函数 ---

const parseKeyValueString = (str) => {
  const obj = {}
  if (!str) return obj
  str.split(',').forEach((item) => {
    const parts = item.trim().split(':')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const value = parts.slice(1).join(':').trim()
      if (key === 'PlayerID' || key === 'EosID') {
        obj[key] = value
      } else if (value === 'true') {
        obj[key] = true
      } else if (value === 'false') {
        obj[key] = false
      } else if (!isNaN(value) && value !== '') {
        obj[key] = Number(value)
      } else {
        obj[key] = value
      }
    }
  })
  return obj
}

const parsePlayerData = (playerDataStr) => {
  if (!playerDataStr || !playerDataStr.includes('PlayerID:')) {
    return []
  }
  return playerDataStr
    .trim()
    .split('\n')
    .map((line) => {
      const cleanedLine = line.replace(/^\s*\u005b.*?\u005d\s*/, '').trim()
      const normalizedLine = cleanedLine.replace(/^PlayerDataName:/, 'Name:')
      return parseKeyValueString(normalizedLine)
    })
    .filter((p) => p && p.PlayerID)
}

// --- 导出的RCON指令方法 ---

/**
 * 获取服务器详细信息
 * @returns {Promise<Object>}
 */
async function getServerInfo() {
  try {
    const data = await rcon.sendCommand(`\x02\x12`, true)
    const info = parseKeyValueString(data.split('ServerDetails')[1])
    return info
  } catch (error) {
    logger.error(MODULE_NAME, 'getServerInfo', error)
    throw new Error('通过RCON获取服务器信息失败')
  }
}

/**
 * 向服务器发送广播
 * @param {string} message
 * @returns {Promise<void>}
 */
async function broadcast(message) {
  if (!message) throw new Error('广播消息内容不能为空。')
  // 净化输入，移除所有逗号以防止命令结构破坏
  const sanitizedMessage = message.replace(/,/g, '')
  try {
    await rcon.sendCommand(`\x02\x10${sanitizedMessage}`)
  } catch (error) {
    logger.error(MODULE_NAME, 'broadcast', error)
    throw new Error('发送广播失败')
  }
}

/**
 * 清理服务器上的尸体和血迹
 * @returns {Promise<void>}
 */
async function cleanup() {
  try {
    await rcon.sendCommand(`\x02\x13`)
  } catch (error) {
    logger.error(MODULE_NAME, 'cleanup', error)
    throw new Error('执行清理命令失败')
  }
}

/**
 * 保存服务器世界数据
 * @returns {Promise<void>}
 */
async function save() {
  try {
    await rcon.sendCommand(`\x02\x50`)
  } catch (error) {
    logger.error(MODULE_NAME, 'save', error)
    throw new Error('执行保存命令失败')
  }
}

/**
 * 获取在线玩家列表及详细信息
 * @returns {Promise<Array<Object>>}
 */
async function getPlayerList() {
  try {
    const [listData, detailData] = await Promise.all([rcon.sendCommand(`\x02\x40`, true), rcon.sendCommand(`\x02\x77`, true)])

    const listLines = listData.trim().split('\n')
    if (listLines.length < 3 || listLines[0].trim() !== 'PlayerList') {
      return [] // 没有玩家在线
    }

    const cleanLine = (line) => (line ? (line.trim().endsWith(',') ? line.trim().slice(0, -1) : line.trim()) : '')
    const ids = cleanLine(listLines[1])
      .split(',')
      .filter((id) => id)
    const names = cleanLine(listLines[2])
      .split(',')
      .filter((name) => name)
    const playerDetails = parsePlayerData(detailData)

    return ids.map((id, index) => ({
      PlayerID: id,
      Name: names[index] || null,
      ...(playerDetails.find((p) => p.PlayerID === id) || {})
    }))
  } catch (error) {
    logger.error(MODULE_NAME, 'getPlayerList', error)
    throw new Error('获取玩家列表失败')
  }
}

/**
 * 给指定玩家发送私信
 * @param {string} id 玩家ID
 * @param {string} message 消息内容
 * @returns {Promise<void>}
 */
async function messagePlayer(id, message) {
  if (!id || !message) throw new Error('玩家ID和消息内容不能为空。')
  // 净化输入，移除所有逗号
  const sanitizedMessage = message.replace(/,/g, '')
  try {
    await rcon.sendCommand(
      `${id},

${sanitizedMessage}`,
      false
    )
  } catch (error) {
    logger.error(MODULE_NAME, 'messagePlayer', error)
    throw new Error('发送私信失败')
  }
}

/**
 * 将玩家踢出服务器
 * @param {string} id 玩家ID
 * @param {string} [reason='您已被管理员请出服务器'] 踢出原因
 * @returns {Promise<void>}
 */
async function kickPlayer(id, reason = '您已被管理员请出服务器') {
  if (!id) throw new Error('玩家ID不能为空。')
  // 净化输入，移除所有逗号
  const sanitizedReason = reason.replace(/,/g, '')
  try {
    await rcon.sendCommand(`\x02\x30${id},${sanitizedReason}`, false)
  } catch (error) {
    logger.error(MODULE_NAME, 'kickPlayer', error)
    throw new Error('踢出玩家失败')
  }
}

/**
 * 封禁玩家
 * @param {string} id 玩家ID
 * @param {string} reason 封禁原因
 * @param {number} time 封禁时长（小时）
 * @param {string} [name='未知玩家'] 玩家名称
 * @returns {Promise<void>}
 */
async function banPlayer(id, reason, time, name = '未知玩家') {
  if (!id || !reason || !time) throw new Error('玩家ID、封禁原因和时长均不能为空。')
  // 净化输入，移除所有逗号
  const sanitizedReason = reason.replace(/,/g, '')
  const sanitizedName = name.replace(/,/g, '')
  try {
    await rcon.sendCommand(`\x02\x20${sanitizedName},${id},ban ${time} hours because of ${sanitizedReason},${time}`)
  } catch (error) {
    logger.error(MODULE_NAME, 'banPlayer', error)
    throw new Error('封禁玩家失败')
  }
}

module.exports = {
  getServerInfo,
  broadcast,
  cleanup,
  save,
  getPlayerList,
  messagePlayer,
  kickPlayer,
  banPlayer
}
