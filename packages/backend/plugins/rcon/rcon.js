const net = require('net');
const config = require('@/core/config');
const logger = require('@/utils/logger');

const MODULE_NAME = 'RCON';

const RECONNECT_DELAY = 5000;
const AUTH_TIMEOUT = 5000;

let instance = null;

class Rcon {
    constructor() {
        // RCON 配置已在 configLoader 中验证
        this.host = config.RCON_HOST;
        this.port = parseInt(config.RCON_PORT, 10);
        this.password = config.RCON_PASSWORD;
        this.encoding = config.RCON_ENCODING;

        this.socket = null;
        this.isConnected = false;
        this.isAuthenticating = false;
        this.isReady = false;
        this.isConnecting = false;

        this.commandQueue = [];
        this.currentRequest = null;
        this.authPromise = null;

        this.connect();
    }

    connect() {
        if (this.isConnecting || this.isReady) return;
        this.isConnecting = true;
        logger.info(`正在连接到 RCON 服务器: ${this.host}:${this.port}...`);

        this.socket = new net.Socket();

        this.socket.connect(this.port, this.host, () => {
            this.isConnected = true;
            logger.info('RCON TCP 连接已建立，正在进行身份验证...');
            this._authenticate().catch(err => {
                logger.error(MODULE_NAME, 'connect', `身份验证过程中发生错误: ${err.message}`);
                this.socket.destroy();
            });
        });

        this.socket.on('data', (buffer) => this._handleData(buffer));
        this.socket.on('close', () => this._handleDisconnect());
        this.socket.on('error', (err) => this._handleError(err));
    }

    _authenticate() {
        if (this.isAuthenticating) return this.authPromise;
        this.isAuthenticating = true;
        this.authPromise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => reject(new Error('身份验证超时。')), AUTH_TIMEOUT);
            this.authCallback = (err, response) => {
                clearTimeout(timeoutId);
                this.isAuthenticating = false;
                this.authCallback = null;
                if (err) return reject(err);
                this.isReady = true;
                logger.info('RCON 身份验证成功，连接就绪。');
                this._processQueue();
                resolve(response);
            };
            logger.info('发送认证指令...');
            this.socket.write(Buffer.from(`\x01${this.password}`, this.encoding));
        });
        return this.authPromise;
    }

    _handleData(buffer) {
        const response = buffer.toString(this.encoding);
        if (this.authCallback) {
            this.authCallback(null, response);
            return;
        }
        if (this.currentRequest && this.currentRequest.needResolve) {
            logger.info(`收到RCON响应: ${response.substring(0, 100)}...`);
            this.currentRequest.resolve(response);
            this.currentRequest = null;
            this._processQueue();
        } else {
            logger.info(`收到未经请求的RCON数据: ${response.substring(0, 100)}...`);
        }
    }

    _handleDisconnect() {
        logger.info('RCON 连接已关闭。');
        this.isConnected = false;
        this.isReady = false;
        this.isConnecting = false;
        const error = new Error('RCON 连接已关闭，指令无法发送。');
        if (this.currentRequest) {
            this.currentRequest.reject(error);
            this.currentRequest = null;
        }
        this.commandQueue.forEach(({ reject }) => reject(error));
        this.commandQueue = [];
        setTimeout(() => this.connect(), RECONNECT_DELAY);
        logger.info(`${RECONNECT_DELAY / 1000}秒后尝试重新连接...`);
    }

    _handleError(err) {
        logger.error(MODULE_NAME, 'socketError', `Socket 发生错误: ${err.message}`);
        this.socket.destroy();
    }

    _processQueue() {
        if (this.currentRequest || this.commandQueue.length === 0 || !this.isReady) return;
        this.currentRequest = this.commandQueue.shift();
        const { command, resolve, needResolve } = this.currentRequest;
        this.socket.write(Buffer.from(command, this.encoding), this.encoding, () => {
            logger.info(`已发送RCON指令: ${command}`);
            if (!needResolve) {
                resolve();
                this.currentRequest = null;
                this._processQueue();
            }
        });
    }

    sendCommand(command, needResolve = false) {
        return new Promise((resolve, reject) => {
            if (!this.isReady && !this.isConnecting) {
                logger.warn('RCON 未连接，正在尝试连接... 指令已加入队列。');
                this.connect();
            }
            this.commandQueue.push({ command, resolve, reject, needResolve });
            this._processQueue();
        });
    }
}

if (!instance) {
    instance = new Rcon();
}

module.exports = instance;