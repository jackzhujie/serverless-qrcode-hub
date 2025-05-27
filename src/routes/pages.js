/**
 * 页面路由处理
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const Mapping = require('../models/mapping');
const { isAuthenticated } = require('../middleware/auth');
const { safeJsonParse } = require('../utils/helpers');

// 管理页面（需要认证）
router.get('/admin', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin.html'));
});

// 微信二维码页面
router.get('/wechat/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取映射
    const mapping = await Mapping.getById(id);
    
    if (!mapping) {
      return res.status(404).send('映射不存在');
    }
    
    // 检查是否过期
    if (mapping.expires_at && mapping.expires_at < Date.now()) {
      return res.status(410).send('映射已过期');
    }
    
    // 检查是否为微信二维码
    if (!mapping.is_wechat) {
      return res.redirect(mapping.url);
    }
    
    // 解析微信数据
    const wechatData = safeJsonParse(mapping.wechat_data, {});
    const customData = safeJsonParse(mapping.custom_data, {});
    
    // 渲染微信二维码页面
    res.send(`
      <!DOCTYPE html>
      <html lang="zh-CN" class="${customData.theme || 'light'}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${wechatData.title || '微信二维码'}</title>
        <link href="https://cdn.jsdelivr.net/npm/daisyui@3.9.4/dist/full.css" rel="stylesheet" type="text/css" />
        <script src="https://cdn.jsdelivr.net/npm/tailwindcss@2.2/dist/tailwind.min.js"></script>
        <style>
          :root {
            --primary-color: #07C160;
            --bg-color: #f7f7f7;
            --text-color: #333;
          }
          
          html.dark {
            --bg-color: #1f1f1f;
            --text-color: #f0f0f0;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            margin: 0;
            padding: 0;
          }
          
          .container {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            align-items: center;
            justify-content: center;
          }
          
          .qrcode-container {
            background-color: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            text-align: center;
          }
          
          .dark .qrcode-container {
            background-color: #2d2d2d;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          }
          
          .qrcode-image {
            max-width: 100%;
            height: auto;
            margin-bottom: 15px;
          }
          
          .title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 10px;
            color: var(--text-color);
          }
          
          .description {
            font-size: 1rem;
            margin-bottom: 20px;
            color: var(--text-color);
          }
          
          .wechat-icon {
            width: 40px;
            height: 40px;
            margin-bottom: 10px;
          }
          
          .footer {
            margin-top: auto;
            text-align: center;
            padding: 10px;
            font-size: 0.8rem;
            color: #888;
          }
          
          .footer a {
            color: var(--primary-color);
            text-decoration: none;
          }
          
          @media (prefers-color-scheme: dark) {
            html:not(.light):not(.dark) {
              --bg-color: #1f1f1f;
              --text-color: #f0f0f0;
            }
            
            html:not(.light):not(.dark) .qrcode-container {
              background-color: #2d2d2d;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="qrcode-container">
            <img src="/assets/wechat-icon.svg" alt="微信图标" class="wechat-icon" />
            <div class="title">${wechatData.title || '微信二维码'}</div>
            <div class="description">${wechatData.description || '扫描下方二维码'}</div>
            <img src="${wechatData.qrcode_url || mapping.url}" alt="微信二维码" class="qrcode-image" />
            ${wechatData.note ? `<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">${wechatData.note}</p>` : ''}
          </div>
        </div>
        <div class="footer">
          <a href="https://github.com/imaegoo/serverless-qrcode-hub" target="_blank">QR Code Hub</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('渲染微信二维码页面错误:', error);
    res.status(500).send('服务器错误');
  }
});

// 根路径重定向到管理页面
router.get('/', (req, res) => {
  res.redirect('/admin');
});

module.exports = router;