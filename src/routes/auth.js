/**
 * 认证相关路由
 */

const express = require('express');
const router = express.Router();
const { validateAdminPassword } = require('../middleware/auth');

// 登录API
router.post('/login', (req, res) => {
  const { password } = req.body;
  
  // 验证密码
  if (!password) {
    return res.status(400).json({ error: '密码不能为空' });
  }
  
  // 检查密码是否正确
  if (validateAdminPassword(password)) {
    // 设置认证cookie
    res.cookie('authenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 在生产环境中使用secure
      maxAge: 24 * 60 * 60 * 1000 // 24小时过期
    });
    
    return res.json({ success: true });
  }
  
  // 密码错误
  res.status(401).json({ error: '密码错误' });
});

// 登出API
router.post('/logout', (req, res) => {
  // 清除认证cookie
  res.clearCookie('authenticated');
  res.json({ success: true });
});

// 检查登录状态API
router.get('/check', (req, res) => {
  const isLoggedIn = req.cookies && req.cookies.authenticated === 'true';
  res.json({ authenticated: isLoggedIn });
});

module.exports = router;