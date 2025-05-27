/**
 * 定时任务处理模块
 */

const Mapping = require('../models/mapping');
const { formatTimestamp } = require('./helpers');

// 检查过期映射
async function checkExpiredMappings() {
  try {
    console.log('开始检查过期映射...');
    
    // 获取已过期的映射
    const expiredMappings = await Mapping.getExpired();
    
    if (expiredMappings.length > 0) {
      console.log(`发现 ${expiredMappings.length} 个过期映射:`);
      expiredMappings.forEach(mapping => {
        console.log(`- ID: ${mapping.id}, URL: ${mapping.url}, 过期时间: ${formatTimestamp(mapping.expires_at)}`);
      });
    } else {
      console.log('没有发现过期映射');
    }
    
    // 获取即将过期的映射（2天内）
    const expiringSoonMappings = await Mapping.getExpiringSoon(2);
    
    if (expiringSoonMappings.length > 0) {
      console.log(`发现 ${expiringSoonMappings.length} 个即将过期的映射:`);
      expiringSoonMappings.forEach(mapping => {
        console.log(`- ID: ${mapping.id}, URL: ${mapping.url}, 过期时间: ${formatTimestamp(mapping.expires_at)}`);
      });
    } else {
      console.log('没有发现即将过期的映射');
    }
    
    return {
      expired: expiredMappings,
      expiringSoon: expiringSoonMappings
    };
  } catch (error) {
    console.error('检查过期映射时出错:', error);
    throw error;
  }
}

// 初始化定时任务
function initScheduledTasks() {
  // 每天凌晨2点运行过期检查
  const checkTime = new Date();
  checkTime.setHours(2, 0, 0, 0);
  
  let timeUntilCheck;
  if (new Date() > checkTime) {
    // 如果当前时间已经过了今天的检查时间，则设置为明天的检查时间
    timeUntilCheck = checkTime.getTime() + 24 * 60 * 60 * 1000 - Date.now();
  } else {
    timeUntilCheck = checkTime.getTime() - Date.now();
  }
  
  // 设置定时任务
  setTimeout(() => {
    checkExpiredMappings();
    
    // 设置每24小时运行一次
    setInterval(checkExpiredMappings, 24 * 60 * 60 * 1000);
  }, timeUntilCheck);
  
  console.log(`定时任务已设置，将在 ${new Date(Date.now() + timeUntilCheck).toLocaleString()} 首次运行`);
}

module.exports = {
  checkExpiredMappings,
  initScheduledTasks
};