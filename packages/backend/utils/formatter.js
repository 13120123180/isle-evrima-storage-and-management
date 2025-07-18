/**
 * 使用给定的数据对象，格式化一个带有 {key} 占位符的模板字符串。
 * @param {string} template - 包含 {key} 占位符的模板字符串。
 * @param {Object} data - 包含替换值的数据对象。
 * @returns {string} - 格式化后的字符串。
 */
function formatMessage(template, data) {
    if (!template) return '';
    if (!data) return template;
    return template.replace(/{(\w+)}/g, (match, key) => {
        return data.hasOwnProperty(key) ? data[key] : match;
    });
}

module.exports = { formatMessage };
