const getTimestamp = () => {
  // 格式化为 'YYYY-MM-DD HH:mm:ss'
  return new Date()
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    .replace(/\//g, '-')
}

/**
 * 记录参考信息
 * @param {string} message 日志信息
 */
const info = (message) => {
  console.log(`[${getTimestamp()}] [信息] ${message}`)
}

/**
 * 记录警告信息
 * @param {string} message 警告信息
 */
const warn = (message) => {
  console.warn(`[${getTimestamp()}] [警告] ${message}`)
}

/**
 * 格式化并记录错误日志
 * @param {string} moduleName - 模块名, e.g., '数据库'
 * @param {string} methodName - 方法名, e.g., 'update'
 * @param {string|Error} error - 错误信息或错误对象
 */
const error = (moduleName, methodName, error) => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`[${getTimestamp()}] [错误] [${moduleName}] 在方法 '${methodName}' 中: ${errorMessage}`)
}

module.exports = {
  info,
  warn,
  error
}
