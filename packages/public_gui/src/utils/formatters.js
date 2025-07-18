/**
 * 将毫秒时间戳格式化为北京时间字符串 (YYYY-MM-DD HH:mm:ss)。
 * @param {string | number} timestamp - 毫秒时间戳。
 * @returns {string} - 格式化后的北京时间字符串。
 */
export function formatBeijingTime(timestamp) {
  if (!timestamp) return '未知';
  const date = new Date(parseInt(timestamp, 10));
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
}
