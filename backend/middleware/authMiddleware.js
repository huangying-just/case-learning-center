const jwt = require('jsonwebtoken');
const config = require('../config');

const authMiddleware = (req, res, next) => {
  // 从请求头获取token
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: '访问被拒绝，未提供认证令牌' 
    });
  }

  // 检查Bearer格式
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token) {
    return res.status(401).json({ 
      error: '访问被拒绝，令牌格式错误' 
    });
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // 将用户信息附加到请求对象
    next();
  } catch (error) {
    console.error('JWT验证失败:', error.message);
    res.status(403).json({ 
      error: '无效的认证令牌' 
    });
  }
};

// 检查用户角色的中间件
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: '未认证的用户' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: '权限不足，无法访问此资源' 
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  checkRole
}; 