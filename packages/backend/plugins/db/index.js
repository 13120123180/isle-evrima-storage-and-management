const Database = require('better-sqlite3')
const path = require('path')
const config = require('@/core/config')
const logger = require('@/utils/logger')

const MODULE_NAME = '数据库'

class MyDB {
  constructor() {
    const dbPath = config.PATH_DB_FILE

    const dbDir = path.dirname(dbPath)
    const fs = require('fs')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    logger.info(`数据库模块初始化成功，已连接到: ${dbPath}`)
  }

  _all(sql, params = []) {
    return this.db.prepare(sql).all(params)
  }

  _get(sql, params = []) {
    return this.db.prepare(sql).get(params)
  }

  _run(sql, params = []) {
    return this.db.prepare(sql).run(params)
  }

  _buildWhereClause(where) {
    if (!where || Object.keys(where).length === 0) {
      return { clause: '', params: [] }
    }

    const conditions = []
    const params = []

    for (const key in where) {
      if (Object.hasOwnProperty.call(where, key)) {
        const value = where[key]
        if (typeof value === 'object' && value !== null && value.operator && value.value !== undefined) {
          // 处理复杂操作符，如 IN, LIKE
          switch (value.operator.toUpperCase()) {
            case 'IN':
              if (Array.isArray(value.value) && value.value.length > 0) {
                const placeholders = value.value.map(() => '?').join(', ')
                conditions.push(`${key} IN (${placeholders})`)
                params.push(...value.value)
              } else {
                // 如果 IN 的值为空数组，则条件为永不满足
                conditions.push('1 = 0')
              }
              break
            case 'LIKE':
              conditions.push(`${key} LIKE ?`)
              params.push(value.value)
              break
            // 可以根据需要添加更多操作符
            default:
              conditions.push(`${key} = ?`)
              params.push(value)
              break
          }
        } else {
          // 默认处理等于操作
          conditions.push(`${key} = ?`)
          params.push(value)
        }
      }
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    return { clause, params }
  }

  select(tableName, where = {}, options = {}) {
    const { fields = ['*'], orderBy, limit, offset } = options
    const fieldList = Array.isArray(fields) ? fields.join(', ') : '*'
    const { clause, params } = this._buildWhereClause(where)
    let sql = `SELECT ${fieldList} FROM ${tableName} ${clause}`
    if (orderBy && orderBy.column) {
      const order = orderBy.order && orderBy.order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      sql += ` ORDER BY ${orderBy.column} ${order}`
    }
    if (typeof limit === 'number' && limit > 0) {
      sql += ` LIMIT ${limit}`
    }
    if (typeof offset === 'number' && offset > 0) {
      sql += ` OFFSET ${offset}`
    }
    if (limit === 1) {
      return this._get(sql, params)
    }
    return this._all(sql, params)
  }

  insert(tableName, data) {
    if (Array.isArray(data)) {
      const insertStmt = this.db.transaction((items) => {
        for (const item of items) {
          this.insert(tableName, item)
        }
      })
      return insertStmt(data)
    }
    const keys = Object.keys(data)
    const columns = keys.join(', ')
    const placeholders = keys.map(() => '?').join(', ')
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`
    return this._run(sql, Object.values(data))
  }

  update(tableName, where, data) {
    if (!data || Object.keys(data).length === 0) {
      const err = new Error('更新数据不能为空。')
      logger.error(MODULE_NAME, 'update', err)
      throw err
    }
    if (!where || Object.keys(where).length === 0) {
      const err = new Error('更新操作的WHERE条件不能为空，如果希望更新整个表，请使用 updateAll() 方法。')
      logger.error(MODULE_NAME, 'update', err)
      throw err
    }
    const { clause, params: whereParams } = this._buildWhereClause(where)
    const setKeys = Object.keys(data)
    const setClause = setKeys.map((key) => `${key} = ?`).join(', ')
    const setParams = Object.values(data)
    const sql = `UPDATE ${tableName} SET ${setClause} ${clause}`
    const params = [...setParams, ...whereParams]
    return this._run(sql, params)
  }

  updateAll(tableName, data) {
    if (!data || Object.keys(data).length === 0) {
      const err = new Error('更新数据不能为空。')
      logger.error(MODULE_NAME, 'updateAll', err)
      throw err
    }
    const setKeys = Object.keys(data)
    const setClause = setKeys.map((key) => `${key} = ?`).join(', ')
    const sql = `UPDATE ${tableName} SET ${setClause}`
    return this._run(sql, Object.values(data))
  }

  upsert(tableName, data, conflictColumn) {
    const keys = Object.keys(data)
    const columns = keys.join(', ')
    const placeholders = keys.map(() => '?').join(', ')
    const updateSet = keys
      .filter((key) => key !== conflictColumn)
      .map((key) => `${key} = excluded.${key}`)
      .join(', ')
    const doUpdate = updateSet ? `DO UPDATE SET ${updateSet}` : 'DO NOTHING'
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) ON CONFLICT(${conflictColumn}) ${doUpdate}`
    return this._run(sql, Object.values(data))
  }

  remove(tableName, where) {
    if (!where || Object.keys(where).length === 0) {
      const err = new Error('删除操作的WHERE条件不能为空，如果希望清空整个表，请使用 clear() 方法。')
      logger.error(MODULE_NAME, 'remove', err)
      throw err
    }
    const { clause, params } = this._buildWhereClause(where)
    const sql = `DELETE FROM ${tableName} ${clause}`
    return this._run(sql, params)
  }

  clear(tableName) {
    const sql = `DELETE FROM ${tableName}`
    return this._run(sql)
  }

  count(tableName, where = {}) {
    const { clause, params } = this._buildWhereClause(where)
    const sql = `SELECT COUNT(*) as count FROM ${tableName} ${clause}`
    const result = this._get(sql, params)
    return result ? result.count : 0
  }

  /**
   * 执行一个事务
   * @param {Function} callback - 包含所有数据库操作的回调函数
   * @returns {*} - 返回回调函数的返回值
   */
  transaction(callback) {
    const fn = this.db.transaction(callback);
    return fn();
  }

  async backup() {
    const dbPath = config.PATH_DB_FILE
    const backupDir = path.dirname(dbPath)
    const backupFile = `backup-${Date.now()}.db`
    const backupPath = path.join(backupDir, backupFile)
    logger.info(`正在备份数据库到: ${backupPath}...`)
    try {
      await this.db.backup(backupPath)
      logger.info('数据库备份成功。')
    } catch (err) {
      logger.error(MODULE_NAME, 'backup', `备份失败: ${err.message}`)
    }
  }

  /**
   * 执行分页查询，并返回列表和总数。
   * @param {string} tableName - 表名。
   * @param {object} where - WHERE 条件对象。
   * @param {object} options - 选项，包括 page, pageSize, orderBy。
   * @returns {{list: Array, total: number}} - 包含列表数据和总数的对象。
   */
  paginate(tableName, where = {}, options = {}) {
    const { page = 1, pageSize = 10, orderBy } = options
    const offset = (page - 1) * pageSize

    const { clause, params: whereParams } = this._buildWhereClause(where)

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM ${tableName} ${clause}`
    const totalResult = this._get(countSql, whereParams)
    const total = totalResult ? totalResult.total : 0

    // 获取分页数据
    let listSql = `SELECT * FROM ${tableName} ${clause}`
    if (orderBy && orderBy.column) {
      const order = orderBy.order && orderBy.order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      listSql += ` ORDER BY ${orderBy.column} ${order}`
    }
    listSql += ` LIMIT ? OFFSET ?`
    const list = this._all(listSql, [...whereParams, pageSize, offset])

    return { list, total }
  }
}

module.exports = new MyDB()
