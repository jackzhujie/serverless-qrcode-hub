/**
 * 认证中间件
 */

// 验证管理员登录状态
function isAuthenticated(req, res, next) {
  // 检查是否有有效的认证cookie
  const isLoggedIn = req.cookies && req.cookies.authenticated === 'true';
  
  if (isLoggedIn) {
    return next(); // 已认证，继续处理请求
  }
  
  // 未认证，重定向到登录页面
  res.redirect('/login.html');
}

// 验证API请求的认证状态
function isAuthenticatedApi(req, res, next) {
  // 检查是否有有效的认证cookie
  const isLoggedIn = req.cookies && req.cookies.authenticated === 'true';
  
  if (isLoggedIn) {
    return next(); // 已认证，继续处理请求
  }
  
  // 未认证，返回401错误
  res.status(401).json({ error: '未授权访问' });
}

// 验证管理员密码
function validateAdminPassword(password) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    console.error('警告: 未设置管理员密码环境变量 ADMIN_PASSWORD');
    return false;
  }
  
  return password === adminPassword;
}

module.exports = {
  isAuthenticated,
  isAuthenticatedApi,
  validateAdminPassword
};