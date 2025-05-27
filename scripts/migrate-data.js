// 迁移数据脚本
require('dotenv').config();
const { dbAsync } = require('../src/models/db');

// 这里需要手动填入从Cloudflare D1获取的数据
const cloudflareData = [
  // 示例数据格式
  // {
  //   id: 'abc123',
  //   url: 'https://example.com',
  //   created_at: 1620000000000,
  //   expires_at: 1630000000000,
  //   is_wechat: 0,
  //   wechat_data: null,
  //   custom_data: null
  // }
];

async function migrateData() {
  try {
    console.log('开始数据迁移...');
    
    // 遍历Cloudflare数据并插入到SQLite
    for (const item of cloudflareData) {
      await dbAsync.run(
        `INSERT INTO mappings (id, url, created_at, expires_at, is_wechat, wechat_data, custom_data)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.url,
          item.created_at,
          item.expires_at,
          item.is_wechat,
          item.wechat_data,
          item.custom_data
        ]
      );
      console.log(`已迁移映射: ${item.id}`);
    }
    
    console.log('数据迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据迁移错误:', error);
    process.exit(1);
  }
}

migrateData();