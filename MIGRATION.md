# 从Cloudflare Workers迁移到Node.js/Express/SQLite3

本文档提供了将Serverless QR Code Hub从Cloudflare Workers和D1数据库迁移到传统Node.js服务器环境的指南。

## 迁移概述

原始项目使用Cloudflare Workers作为无服务器运行时，使用Cloudflare D1作为SQLite兼容的数据库。迁移后的项目使用：

- **Node.js**: 运行时环境
- **Express**: Web框架
- **SQLite3**: 本地数据库

## 目录结构

迁移后的项目结构如下：

```
serverless-qrcode-hub/
├── app.js                 # 主应用入口
├── package.json           # 项目依赖
├── .env                   # 环境变量
├── .gitignore             # Git忽略文件
├── public/                # 静态文件
│   ├── admin.html         # 管理页面
│   ├── login.html         # 登录页面
│   └── assets/            # 资源文件
├── database/              # 数据库文件
│   ├── qrcode.db          # SQLite数据库
│   └── init.sql           # 数据库初始化SQL
└── src/                   # 源代码
    ├── models/            # 数据模型
    │   ├── db.js          # 数据库连接
    │   └── mapping.js     # 映射模型
    ├── routes/            # 路由处理
    │   ├── auth.js        # 认证路由
    │   ├── mappings.js    # 映射API路由
    │   └── pages.js       # 页面路由
    ├── middleware/        # 中间件
    │   └── auth.js        # 认证中间件
    └── utils/             # 工具函数
        ├── helpers.js     # 辅助函数
        └── scheduler.js   # 定时任务
```

## 安装和配置

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

编辑 `.env` 文件，设置以下变量：

```
# 服务器配置
PORT=3000

# 认证
ADMIN_PASSWORD=your_secure_password_here

# 数据库
DB_PATH=./database/qrcode.db

# 应用设置
BASE_URL=http://localhost:3000
MAX_AGE_DAYS=30
```

### 3. 初始化数据库

数据库会在应用首次启动时自动初始化。如果你需要从Cloudflare D1导出数据，可以使用以下步骤：

1. 在Cloudflare Workers控制台中导出D1数据库为SQLite文件
2. 将导出的SQLite文件复制到 `database/qrcode.db`

## 启动应用

### 开发环境

```bash
npm run dev
```

### 生产环境

```bash
npm start
```

## 功能对比

| 功能 | Cloudflare Workers | Node.js/Express |
|------|-------------------|---------------|
| 短链接生成 | ✅ | ✅ |
| 二维码自定义 | ✅ | ✅ |
| 微信二维码特殊处理 | ✅ | ✅ |
| 过期检测 | ✅ | ✅ |
| 管理界面 | ✅ | ✅ |
| 密码保护 | ✅ | ✅ |
| 定时任务 | Cron Triggers | Node.js定时器 |
| 数据存储 | Cloudflare D1 | SQLite3 |

## 主要变更

1. **数据库访问**: 从Cloudflare D1 API迁移到Node.js的SQLite3库
2. **认证机制**: 保持相同的基于Cookie的认证，但使用Express中间件实现
3. **定时任务**: 从Cloudflare的Cron Triggers迁移到Node.js的定时器
4. **静态文件**: 使用Express的静态文件中间件替代Workers的静态资源处理

## 部署建议

### 基本部署

1. 在服务器上安装Node.js
2. 克隆代码库并安装依赖
3. 配置环境变量
4. 使用PM2或类似工具启动应用

```bash
npm install -g pm2
pm2 start app.js --name qrcode-hub
```

### 使用Nginx作为反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 安全注意事项

1. 确保设置强密码作为管理员密码
2. 在生产环境中使用HTTPS
3. 定期备份SQLite数据库文件
4. 考虑添加更多的安全中间件，如CSRF保护

## 故障排除

### 数据库错误

如果遇到数据库访问错误，请检查：

- 数据库文件路径是否正确
- 应用是否有数据库文件的读写权限
- SQLite数据库文件是否损坏

### 服务器启动问题

如果服务器无法启动，请检查：

- 端口是否被占用
- 环境变量是否正确配置
- 依赖是否完全安装

## 结论

通过这次迁移，QR Code Hub从Cloudflare的无服务器环境转移到了传统的Node.js服务器环境，同时保留了所有原有功能。这使得应用可以在更广泛的环境中部署，并且可以更灵活地进行自定义和扩展。