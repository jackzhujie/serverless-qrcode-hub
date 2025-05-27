/**
 * QR Code Hub 主应用文件
 */

// 加载环境变量
require('dotenv').config();

// 导入依赖
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// 导入自定义模块
const { initScheduledTasks } = require('./src/utils/scheduler');

// 导入路由
const authRoutes = require('./src/routes/auth');
const mappingRoutes = require('./src/routes/mappings');
const pageRoutes = require('./src/routes/pages');

// 创建Express应用
const app = express();

// 设置安全相关中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "*"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// 设置请求速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP在windowMs内最多100个请求
  standardHeaders: true,
  legacyHeaders: false,
});

// 应用中间件
app.use(morgan('dev')); // 日志
app.use(cors()); // CORS
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: false })); // URL编码解析
app.use(cookieParser()); // Cookie解析
app.use(limiter); // 速率限制

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 挂载路由
app.use('/api/auth', authRoutes);
app.use('/api/mappings', mappingRoutes);
app.use('/', pageRoutes);

// 404处理
app.use((req, res, next) => {
  res.status(404).json({ error: '未找到请求的资源' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  
  // 初始化定时任务
  initScheduledTasks();
});

module.exports = app;