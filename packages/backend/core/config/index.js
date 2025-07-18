const dotenv = require('dotenv')
const logger = require('@/utils/logger')

dotenv.config({ path: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.prod' })

const requiredConfigs = [
  // ==============================================================================
  // 核心服务配置
  // ==============================================================================
  'NODE_ENV',
  'PRIVATE_PORT',
  'PUBLIC_PORT',
  'JWT_SECRET',
  'WINDOWS_SERVICE_NAME',

  // ==============================================================================
  // 外部服务集成配置
  // ==============================================================================
  'DECRYPT_SERVICE_URL',
  'DECRYPT_SERVICE_TIMEOUT',

  // ==============================================================================
  // 文件路径配置
  // ==============================================================================
  'PATH_DB_FILE',
  'PATH_LOG_FILE',
  'PATH_PLAYER_DATA',
  'PATH_GAME_INI', // 游戏配置文件路径

  // ==============================================================================
  // KOOK 机器人配置
  // ==============================================================================
  'KOOK_TOKEN',
  'KOOK_ONLINE_CHANNEL_ID',
  'KOOK_CHAT_CHANNEL_ID',
  'KOOK_STATUS_CHANNEL_ID',
  'KOOK_BAN_CHANNEL_ID',

  // ==============================================================================
  // RCON 服务配置
  // ==============================================================================
  'RCON_HOST',
  'RCON_PORT',
  'RCON_PASSWORD',
  'RCON_ENCODING',

  // ==============================================================================
  // 定时任务配置
  // ==============================================================================
  'TASK_REBOOT_HOURS',
  'TASK_WELCOME_MINUTES',
  'TASK_CLEANUP_HOURS',
  'TASK_KOOK_STATUS_MINUTES',

  // ==============================================================================
  // 游戏机制配置
  // ==============================================================================
  'GAME_BAN_DURATION_HOURS',
  'GAME_VOTE_THRESHOLD',
  'GAME_VOTE_COMPENSATION_POINTS',
  'GAME_VOTE_WITNESS_REWARD_POINTS',
  'GAME_SIGNIN_MAX_CONSECUTIVE_DAYS',
  'GAME_SIGNIN_POINTS_MULTIPLIER',
  'GAME_SELL_MIN_GROWTH',

  // ==============================================================================
  // KOOK 消息模板
  // ==============================================================================
  'KOOK_MSG_SERVER_RESTARTED',
  'KOOK_MSG_SPAWN',
  'KOOK_MSG_LOGIN',
  'KOOK_MSG_SAFELOG',
  'KOOK_MSG_LOGOUT',
  'KOOK_MSG_KILLED',
  'KOOK_MSG_DIED',
  'KOOK_MSG_BAN_SUCCESS',
  'KOOK_MSG_BAN_FAIL',
  'KOOK_MSG_WITNESS_REWARD',
  'KOOK_MSG_VICTIM_COMPENSATION',
  'KOOK_MSG_REBOOT_WARN_3MIN',
  'KOOK_MSG_REBOOT_WARN_1MIN',
  'KOOK_MSG_REBOOT_FAIL',
  'KOOK_CHANNEL_NAME_REBOOTING',

  // ==============================================================================
  // RCON 消息模板
  // ==============================================================================
  'RCON_MSG_REG_SUCCESS',
  'RCON_MSG_REG_FAIL',
  'RCON_MSG_CLEANUP_WARNING',
  'RCON_MSG_CLEANUP_DONE',
  'RCON_MSG_HOURLY_WELCOME',
  'RCON_MSG_REBOOT_WARN_3MIN',
  'RCON_MSG_REBOOT_WARN_1MIN'
]

const config = {}

logger.info('正在加载和验证配置文件...')

for (const key of requiredConfigs) {
  const value = process.env[key]
  if (value === undefined || value === null || value === '') {
    throw new Error(`关键配置项 '${key}' 未在 .env 文件中定义或值为空！应用无法启动。`)
  }
  config[key] = value
}

logger.info('所有关键配置已成功加载并验证。')

module.exports = Object.freeze(config)
