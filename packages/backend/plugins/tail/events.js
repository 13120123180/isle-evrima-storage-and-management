

// 内部辅助函数，用于从日志行中解析出结构化数据
const formatLogContent = (str, format) => {
    str = str.trim();
    const obj = {};
    let tempKey = null;
    for (const keyword of format) {
        if (keyword.includes('dbargs_')) {
            tempKey = keyword.replace('dbargs_', '');
        } else {
            const index = str.indexOf(keyword);
            if (index === -1) return null; // 如果关键字未找到，则解析失败
            const value = str.slice(0, index);
            str = str.slice(index + keyword.length);
            if (tempKey) {
                obj[tempKey] = value;
                tempKey = null;
            }
        }
    }
    if (tempKey && format[format.length - 1].includes('dbargs_')) {
        obj[tempKey] = str;
    }
    return obj;
};

// 事件定义：每个事件都包含一个关键词和一个触发器（解析函数）
const events = {
    serverStarted: {
        keyWord: 'Session was created successfully',
        eventName: 'serverStarted',
        trigger: () => ({ timestamp: new Date() }), // 只返回一个时间戳
    },
    playerJoined: {
        keyWord: 'Joined The Server. Save file found Dino',
        eventName: 'playerJoined',
        trigger: (line) => formatLogContent(line, [
            `[`,
            `dbargs_time`,
            `][LogTheIsleJoinData]: `,
            `dbargs_name`,
            ` [`,
            `dbargs_id`,
            `] Joined The Server. Save file found Dino: `,
            `dbargs_classname`,
            `, Gender: `,
            `dbargs_gender`,
            `, Growth: `,
            `dbargs_growth`
        ]),
    },
    playerSpawned: {
        keyWord: 'Starting as fresh spawn',
        eventName: 'playerSpawned',
        trigger: (line) => formatLogContent(line, [
            `[`,
            `dbargs_time`,
            `][LogTheIsleJoinData]: `,
            `dbargs_name`,
            ` [`,
            `dbargs_id`,
            `] Save file not found - Starting as fresh spawn. Class: `,
            `dbargs_classname`,
            `, Gender: `,
            `dbargs_gender`,
            `, Growth: `,
            `dbargs_growth`
        ]),
    },
    playerLeftSafe: {
        keyWord: 'Left The Server whilebeing safelogged',
        eventName: 'playerLeftSafe',
        trigger: (line) => formatLogContent(line, [
            `[`,
            `dbargs_time`,
            `][LogTheIsleJoinData]: `,
            `dbargs_name`,
            ` [`,
            `dbargs_id`,
            `] Left The Server whilebeing safelogged, Was playing as: `,
            `dbargs_classname`,
            `, Gender: `,
            `dbargs_gender`,
            `, Growth: `,
            `dbargs_growth`
        ]),
    },
    playerLeftUnsafe: {
        keyWord: 'Left The Server while not being safelogged',
        eventName: 'playerLeftUnsafe',
        trigger: (line) => formatLogContent(line, [
            `[`,
            `dbargs_time`,
            `][LogTheIsleJoinData]: `,
            `dbargs_name`,
            ` [`,
            `dbargs_id`,
            `] Left The Server while not being safelogged, Was playing as: `,
            `dbargs_classname`,
            `, Gender: `,
            `dbargs_gender`,
            `, Growth: `,
            `dbargs_growth`
        ]),
    },
    playerKilled: {
        keyWord: 'Killed the following player:',
        eventName: 'playerKilled',
        trigger: (line) => formatLogContent(line, [
            `[`,
            `dbargs_time`,
            `][LogTheIsleKillData]: `,
            `dbargs_killername`,
            ` [`,
            `dbargs_killerid`,
            `] Dino: `,
            `dbargs_killerclass`,
            `, `,
            `dbargs_killergender`,
            `, `,
            `dbargs_killergrowth`,
            ` - Killed the following player: `,
            `dbargs_killedname`,
            `, [`,
            `dbargs_killedid`,
            `], Dino: `,
            `dbargs_killedclass`,
            `, Gender: `,
            `dbargs_killedgender`,
            `, Growth: `,
            `dbargs_killedgrowth`,
            `, at: X=`,
            `dbargs_x`,
            ` Y=`,
            `dbargs_y`,
            ` Z=`,
            `dbargs_z`
        ]),
    },
    playerDied: {
        keyWord: 'Died from Natural cause',
        eventName: 'playerDied',
        trigger: (line) => formatLogContent(line, [
            `[`,
            `dbargs_time`,
            `][LogTheIsleKillData]: `,
            `dbargs_name`,
            ` [`,
            `dbargs_id`,
            `] Dino: `,
            `dbargs_classname`,
            `, `,
            `dbargs_gender`,
            `, `,
            `dbargs_growth`,
            ` - Died from Natural cause`
        ]),
    },
    playerChat: {
        keyWord: 'LogTheIsleChatData',
        eventName: 'playerChat',
        trigger: (line) => formatLogContent(line, [
            `[`,
            `dbargs_time`,
            `][LogTheIsleChatData]: [Spatial] [GROUP-`,
            `dbargs_groupid`,
            `] `,
            `dbargs_name`,
            ` [`,
            `dbargs_id`,
            `]: `,
            `dbargs_content`
        ]),
    },
};

/**
 * 遍历所有事件定义，解析日志行。
 * @param {string} line - 日志行.
 * @returns {{eventName: string, data: Object}|null} - 如果匹配成功，返回事件名称和解析后的数据，否则返回null。
 */
function parseLogLine(line) {
    for (const key in events) {
        const event = events[key];
        if (line.includes(event.keyWord)) {
            const data = event.trigger(line);
            if (data) {
                return { eventName: event.eventName, data };
            }
        }
    }
    return null;
}

module.exports = { parseLogLine };
