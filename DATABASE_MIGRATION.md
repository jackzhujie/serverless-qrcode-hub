# 从Cloudflare D1迁移数据到SQLite

由于Cloudflare控制台的界面可能会随时间变化，本文档提供了手动创建SQLite数据库并迁移数据的替代方法。

## 方法一：手动创建SQLite数据库

如果无法从Cloudflare D1导出数据，可以按照以下步骤手动创建SQLite数据库：

### 1. 安装SQLite工具

在Windows上，可以从[SQLite官网](https://www.sqlite.org/download.html)下载SQLite命令行工具。

### 2. 创建数据库文件

```bash
# 进入项目目录
cd e:\project\serverless-qrcode-hub

# 创建数据库目录（如果尚未创建）
mkdir -p database

# 创建SQLite数据库
sqlite3 database/qrcode.db
```

### 3. 执行初始化SQL

在SQLite命令行中，执行以下命令导入初始化SQL：

```sql
.read database/init.sql
.exit
```

## 方法二：使用Node.js脚本迁移数据

如果你有权限访问Cloudflare D1数据库，但无法找到导出功能，可以创建一个简单的数据迁移脚本：

### 1. 创建迁移脚本

创建文件 `scripts/migrate-data.js`：

```javascript
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
```

### 2. 获取Cloudflare D1数据

你可以通过以下方式获取Cloudflare D1数据：

1. 在Cloudflare Workers控制台中，使用D1控制台执行查询：
   ```sql
   SELECT * FROM mappings
   ```

2. 将查询结果复制到迁移脚本中的`cloudflareData`数组。

### 3. 运行迁移脚本

```bash
node scripts/migrate-data.js
```

## 方法三：使用应用程序自动创建数据库

最简单的方法是直接启动应用程序，它会自动创建并初始化数据库：

```bash
npm run dev
```

然后，你可以通过管理界面手动添加所需的映射数据。

## 数据库结构参考

以下是SQLite数据库的表结构：

```sql
CREATE TABLE IF NOT EXISTS mappings (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  is_wechat INTEGER DEFAULT 0,
  wechat_data TEXT,
  custom_data TEXT
);

CREATE INDEX IF NOT EXISTS idx_mappings_expires_at ON mappings(expires_at);
CREATE INDEX IF NOT EXISTS idx_mappings_created_at ON mappings(created_at);
CREATE INDEX IF NOT EXISTS idx_mappings_is_wechat ON mappings(is_wechat);
```

## 数据备份建议

一旦数据库创建并填充完成，建议定期备份数据库文件：

```bash
# Windows批处理脚本示例 (backup.bat)
@echo off
set BACKUP_DIR=backups
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

copy database\qrcode.db %BACKUP_DIR%\qrcode_%TIMESTAMP%.db
echo 数据库已备份到 %BACKUP_DIR%\qrcode_%TIMESTAMP%.db
```