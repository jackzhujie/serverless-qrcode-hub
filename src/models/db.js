const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 获取数据库路径
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/qrcode.db');

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接错误:', err.message);
    process.exit(1);
  }
  console.log('已连接到SQLite数据库');
  
  // 初始化数据库
  initDatabase();
});

// 初始化数据库结构
function initDatabase() {
  const initSqlPath = path.join(__dirname, '../../database/init.sql');
  
  try {
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    // 执行初始化SQL
    db.exec(initSql, (err) => {
      if (err) {
        console.error('数据库初始化错误:', err.message);
        return;
      }
      console.log('数据库结构已初始化');
    });
  } catch (err) {
    console.error('读取初始化SQL文件错误:', err.message);
  }
}

// 启用外键约束
db.run('PRAGMA foreign_keys = ON');

// 提供Promise包装的数据库方法
const dbAsync = {
  // 执行查询并返回所有结果
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  // 执行查询并返回第一行结果
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  // 执行更新/插入/删除操作
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  
  // 执行多条SQL语句
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// 确保应用关闭时关闭数据库连接
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接错误:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
    process.exit(err ? 1 : 0);
  });
});

module.exports = { db, dbAsync };