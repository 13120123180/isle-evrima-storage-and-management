const logger = require('@/utils/logger')

const handleRequest =
  (handler, customErrorHandler = null) =>
  async (req, res) => {
    try {
      const params = { ...req.query, ...req.body, ...req.params };
      // 将 user 信息（如果存在）传递给处理器，用于记录操作者
      const result = await handler(params, req.user)
      if (!res.headersSent) {
        res.status(200).json({ success: true, data: result === undefined ? null : result })
      }
    } catch (error) {
      if (customErrorHandler) {
        // 如果提供了自定义错误处理器，调用它。它负责发送响应。
        await customErrorHandler(error, req, res)
      } else {
        // 默认错误处理
        logger.error('RouteHandler', 'handleRequest', error) // 记录错误
        res.status(500).json({ success: false, message: error.message || '服务器内部错误' })
      }
    }
  }

module.exports = handleRequest
