const config = require('@/core/config');
const scheduler = require('@/plugins/cron');
const tasks = require('./scheduledTasks');
const logger = require('@/utils/logger');

function _createJob(name, cronTime, task) {
    try {
        scheduler.createJob(name, cronTime, task);
    } catch (error) {
        logger.error('任务初始化器', `创建任务[${name}]`, `无效的 Cron 表达式: ${cronTime}`);
    }
}

function initialize() {
    logger.info('正在初始化定时任务...');

    const {
        TASK_REBOOT_HOURS,
        TASK_WELCOME_MINUTES,
        TASK_CLEANUP_HOURS,
        TASK_KOOK_STATUS_MINUTES,
    } = config;

    if (TASK_WELCOME_MINUTES) {
        _createJob('hourlyWelcome', `0 ${TASK_WELCOME_MINUTES} * * * *`, tasks.hourlyWelcome);
    }
    if (TASK_KOOK_STATUS_MINUTES) {
        _createJob('updateKookStatus', `0 ${TASK_KOOK_STATUS_MINUTES} * * * *`, tasks.updateKookChannelStatus);
    }

    if (TASK_REBOOT_HOURS) {
        const validHoursPattern = /^[\d,]+$|^\*$/;
        if (validHoursPattern.test(TASK_REBOOT_HOURS)) {
            _createJob('rebootSequence', `0 57 ${TASK_REBOOT_HOURS} * * *`, tasks.handleRebootSequence);
        } else {
            logger.warn(`无效的小时配置: TASK_REBOOT_HOURS=${TASK_REBOOT_HOURS}。重启任务将不会被调度。`);
        }
    }

    if (TASK_CLEANUP_HOURS) {
        const validHoursPattern = /^[\d,]+$|^\*$/;
        if (validHoursPattern.test(TASK_CLEANUP_HOURS)) {
            _createJob('cleanupSequence', `0 27 ${TASK_CLEANUP_HOURS} * * *`, tasks.handleCleanupSequence);
        } else {
            logger.warn(`无效的小时配置: TASK_CLEANUP_HOURS=${TASK_CLEANUP_HOURS}。清理任务将不会被调度。`);
        }
    }
}

module.exports = { initialize };