const express = require('express')
const router = express.Router()
const banService = require('@/core/services/banService')
const handleRequest = require('@/utils/routeHandler')

// GET /ban/ - 获取封禁列表
router.get(
  '/',
  handleRequest(async (params) => {
    return await banService.getBans(params)
  })
)

// POST /ban/ - 创建一个新的封禁提议
router.post(
  '/',
  handleRequest(async (params, user) => {
    return await banService.createBan(params, user)
  })
)

// GET /ban/:id - 获取特定ID的封禁详情
router.get(
  '/:id',
  handleRequest(async (params) => {
    return await banService.getBanById(params.id)
  })
)

// POST /ban/:id/vote - 为封禁提议投票
router.post(
  '/:id/vote',
  handleRequest(async (params, user) => {
    const { voteType } = params
    const banId = params.id
    const voterId = user.id
    return await banService.voteOnBan(banId, voterId, voteType)
  })
)

// POST /ban/:id/revoke - 撤销一个封禁（管理员操作）
router.post(
  '/:id/revoke',
  handleRequest(async (params) => {
    return await banService.revokeBan(params.id)
  })
)

module.exports = router
