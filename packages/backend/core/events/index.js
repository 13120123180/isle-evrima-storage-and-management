const logEmitter = require('@/plugins/tail');
const handlers = require('./handlers');
const logger = require('@/utils/logger');

/**
 * 初始化并注册所有日志事件的监听器
 */
function initialize() {
    logger.info('正在初始化事件监听器...');

    // 将事件名映射到对应的处理函数
    const eventHandlerMap = {
        serverStarted: handlers.onServerStarted,
        playerJoined: handlers.onPlayerJoined,
        playerSpawned: handlers.onPlayerSpawned,
        playerLeftSafe: handlers.onPlayerLeftSafe,
        playerLeftUnsafe: handlers.onPlayerLeftUnsafe,
        playerKilled: handlers.onPlayerKilled,
        playerDied: handlers.onPlayerDied,
        playerChat: handlers.onPlayerChat,
    };

    // 遍历映射，为每个事件注册监听器
    for (const eventName in eventHandlerMap) {
        if (Object.hasOwnProperty.call(eventHandlerMap, eventName)) {
            logEmitter.on(eventName, eventHandlerMap[eventName]);
            logger.info(`已为事件 '${eventName}' 注册处理器。`);
        }
    }

    // 注册通用的错误处理器
    logEmitter.on('error', (error) => {
        logger.error('日志监听模块', 'onError', error);
    });

    // 在所有事件都注册完毕后，启动日志监听
    logEmitter.start();
}

module.exports = { initialize };
