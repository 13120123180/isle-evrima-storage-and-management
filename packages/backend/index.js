// 使用 module-alias 自定义路径别名, @ 指向项目根目录
require('module-alias/register')
const express = require('express')
const cors = require('cors')
const path = require('path') // 引入 path 模块
const logger = require('@/utils/logger')
const config = require('@/core/config')
const eventInitializer = require('@/core/events')
const taskInitializer = require('@/core/tasks')

// --- 1. 环境配置 ---
logger.info(`-------------------------------------------------`)
logger.info(`应用启动，当前环境: ${config.NODE_ENV}`)
logger.info(`-------------------------------------------------`)

// --- 2. 错误处理中间件 ---
function errorHandler(err, req, res, next) {
  logger.error('发生未捕获的错误:', err)
  if (config.NODE_ENV === 'dev') {
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
      stack: err.stack
    })
  } else {
    res.status(500).json({
      error: 'Internal Server Error'
    })
  }
}

// --- 3. 启动HTTP服务 ---
function startHttpServers() {
  // =================================================================
  // 创建 Private App (内网管理后台)
  // =================================================================
  const privateApp = express()
  privateApp.use(cors())
  privateApp.use(express.json())

  // API 路由前缀: 所有 /private_api 的请求都会被 privateRoutes 处理
  const privateRoutes = require('@/routes/private')
  privateApp.use('/private_api', privateRoutes)

  // 静态文件服务: 托管 private_gui 的打包文件
  const privateDistPath = path.join(__dirname, '..', 'private_gui', 'dist')
  privateApp.use(express.static(privateDistPath))

  // SPA 回退路由: 任何未匹配到 API 和静态文件的 GET 请求都返回 index.html
  privateApp.get(/.*/, (req, res) => {
    res.sendFile(path.join(privateDistPath, 'index.html'))
  })

  // 注册全局错误处理中间件
  privateApp.use(errorHandler)

  privateApp.listen(config.PRIVATE_PORT, () => {
    logger.info(`内网服务 (Private) 已启动，监听端口: ${config.PRIVATE_PORT}`)
    logger.info(`内网管理后台 UI 已托管于: http://localhost:${config.PRIVATE_PORT}`)
  })

  // =================================================================
  // 创建 Public App (公网用户前台)
  // =================================================================
  const publicApp = express()
  publicApp.use(cors())
  publicApp.use(express.json())

  // API 路由前缀: 所有 /server_api 的请求都会被 publicRoutes 处理
  const publicRoutes = require('@/routes/public')
  publicApp.use('/server_api', publicRoutes)

  // 静态文件服务: 托管 public_gui 的打包文件
  const publicDistPath = path.join(__dirname, '..', 'public_gui', 'dist')
  publicApp.use(express.static(publicDistPath))

  // SPA 回退路由: 任何未匹配到 API 和静态文件的 GET 请求都返回 index.html
  publicApp.get(/.*/, (req, res) => {
    res.sendFile(path.join(publicDistPath, 'index.html'))
  })

  // 注册全局错误处理中间件
  publicApp.use(errorHandler)

  publicApp.listen(config.PUBLIC_PORT, () => {
    logger.info(`公网服务 (Public) 已启动，监听端口: ${config.PUBLIC_PORT}`)
    logger.info(`公网用户前台 UI 已托管于: http://localhost:${config.PUBLIC_PORT}`)
  })
}

// --- 4. 主函数 ---
function main() {
  // 启动事件监听和处理系统
  eventInitializer.initialize()

  // 启动定时任务调度系统
  taskInitializer.initialize()

  // 启动Web服务
  startHttpServers()
}

main()