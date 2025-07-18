const express = require('express');
const router = express.Router();
const rcon = require('@/plugins/rcon');
const db = require('@/plugins/db');

const handleRequest = require('@/utils/routeHandler');

// --- 核心数据接口 (GET) ---

// GET /online/list - 获取增强的在线玩家列表
router.get('/list', handleRequest(async () => {
    const onlinePlayers = await rcon.getPlayerList();
    if (!onlinePlayers || onlinePlayers.length === 0) {
        return [];
    }

    const playerIds = onlinePlayers.map(p => p.PlayerID);

    // 如果没有在线玩家，直接返回，避免空的 IN 子句导致SQL错误
    if (playerIds.length === 0) {
        return [];
    }

    // 使用新的 where 条件格式支持 IN 操作符
    const registeredPlayers = db.select('players', { id: { operator: 'IN', value: playerIds } });
    const registeredIds = new Set(registeredPlayers.map(p => p.id));

    // 增强玩家列表，添加 isRegistered 标志
    const enhancedPlayers = onlinePlayers.map(player => ({
        ...player,
        isRegistered: registeredIds.has(player.PlayerID)
    }));

    return enhancedPlayers;
}));

// --- 管理操作接口 (POST) ---

// POST /online/kick - 踢出玩家
router.post('/kick', handleRequest((params) => {
    const { id, reason } = params;
    if (!id) throw new Error('玩家ID不能为空。');
    return rcon.kickPlayer(id, reason);
}));

// POST /online/ban - 直接封禁玩家
router.post('/ban', handleRequest((params) => {
    const { id, name, reason, time } = params;
    if (!id || !reason || !time) throw new Error('玩家ID、封禁原因和时长均不能为空。');
    return rcon.banPlayer(id, reason, time, name);
}));

// POST /online/msg - 发送私信
router.post('/msg', handleRequest((params) => {
    const { id, message } = params;
    if (!id || !message) throw new Error('玩家ID和消息内容不能为空。');
    return rcon.messagePlayer(id, message);
}));

module.exports = router;
