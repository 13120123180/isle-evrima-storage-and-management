const express = require('express');
const router = express.Router();

// 引入所有私有路由模块
const serverRoutes = require('./server');
const userRoutes = require('./users');
const onlinePlayerRoutes = require('./onlinePlayers');
const banRoutes = require('./bans');
const logsRoutes = require('./logs');

// 根据模块挂载路由 (简洁版)
router.use('/serv', serverRoutes);
router.use('/users', userRoutes);
router.use('/online', onlinePlayerRoutes);
router.use('/bans', banRoutes);
router.use('/logs', logsRoutes);

module.exports = router;
