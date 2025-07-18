const express = require('express');
const router = express.Router();
const handleRequest = require('@/utils/routeHandler');
const characterService = require('@/core/services/characterService');
const logger = require('@/utils/logger');

const MODULE_NAME = '路由-角色';

// GET /character/ - 获取当前用户的角色信息
router.get('/', handleRequest(async (params, user) => {
  return await characterService.getCharacterDetails(user.id);
}));

// DELETE /character/ - 删除当前用户的角色存档
router.delete('/', handleRequest(async (params, user) => {
  return await characterService.deleteCharacter(user.id);
}));

// POST /character/sell - 回收角色存档以换取积分
router.post('/sell', handleRequest(async (params, user) => {
  return await characterService.sellCharacter(user.id);
}));

// POST /character/grow - 消耗积分使角色成长（点大）
router.post('/grow', handleRequest(
  async (params, user) => {
    return await characterService.growCharacter(user.id);
  },
  // 为点大功能提供一个自定义的、对用户更友好的错误处理器
  (error, req, res) => {
    logger.error(MODULE_NAME, 'POST /grow', `点大失败 for user ${req.user.id}: ${error.message}`);
    // 只将安全、通用的错误消息返回给客户端
    res.status(500).json({ success: false, message: error.message || '操作失败，请联系管理员。' });
  }
));

module.exports = router;
