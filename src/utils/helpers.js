/**
 * 工具函数集合
 */

// 生成指定长度的随机ID
function generateId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = chars.length;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

// 计算过期时间戳
function calculateExpiryTimestamp(days) {
  if (!days) return null; // 如果未指定天数，返回null表示永不过期
  
  const now = new Date();
  const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return expiryDate.getTime();
}

// 格式化时间戳为可读日期
function formatTimestamp(timestamp) {
  if (!timestamp) return '永不过期';
  
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// 检查URL是否有效
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

// 安全解析JSON
function safeJsonParse(str, defaultValue = null) {
  try {
    if (!str) return defaultValue;
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON解析错误:', error);
    return defaultValue;
  }
}

// 计算剩余天数
function getRemainingDays(expiryTimestamp) {
  if (!expiryTimestamp) return Infinity;
  
  const now = Date.now();
  const diff = expiryTimestamp - now;
  
  if (diff <= 0) return 0;
  
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

module.exports = {
  generateId,
  calculateExpiryTimestamp,
  formatTimestamp,
  isValidUrl,
  safeJsonParse,
  getRemainingDays
};