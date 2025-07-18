const express = require('express');
const router = express.Router();
const db = require('@/plugins/db');

const handleRequest = require('@/utils/routeHandler');

// --- 击杀日志 (GET /logs/kills) ---
router.get(
  '/kills',
  handleRequest(async (params) => {
    const { killerid, killedid, page = 1, pageSize = 10 } = params;

    const where = {};
    if (killerid) {
      where.killerid = { operator: 'LIKE', value: `%${killerid}%` };
    }
    if (killedid) {
      where.killedid = { operator: 'LIKE', value: `%${killedid}%` };
    }

    return db.paginate('kills', where, {
      page,
      pageSize,
      orderBy: { column: 'time', order: 'DESC' },
    });
  })
);

// --- 聊天日志 (GET /logs/chats) ---
router.get(
  '/chats',
  handleRequest(async (params) => {
    const { id, groupid, page = 1, pageSize = 10 } = params;

    const where = {};
    if (id) {
      where.id = { operator: 'LIKE', value: `%${id}%` };
    }
    if (groupid) {
      where.groupid = { operator: 'LIKE', value: `%${groupid}%` };
    }

    // 修复：查询 'chats' 表，并按 'time' 字段排序
    return db.paginate('chats', where, {
      page,
      pageSize,
      orderBy: { column: 'time', order: 'DESC' },
    });
  })
);

module.exports = router;
