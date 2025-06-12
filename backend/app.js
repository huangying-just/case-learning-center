const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const config = require('./config');

// 导入路由
const authRoutes = require('./routes/auth');
const casesRoutes = require('./routes/cases');
const configRoutes = require('./routes/config');
const usersRoutes = require('./routes/users');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 附件下载
app.use('/attachments', (req, res, next) => {
  const filename = req.params[0] || req.path.slice(1);
  const filePath = path.join(config.uploadPath, filename);
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      error: '文件不存在' 
    });
  }

  // 设置响应头，让浏览器能正确处理文件
  const originalName = req.query.name || filename;
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
  
  // 发送文件
  res.sendFile(path.resolve(filePath));
}, express.static(config.uploadPath));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/config', configRoutes);
app.use('/api/users', usersRoutes);

// 根路径欢迎页面
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用案例学习中心 API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register'
      },
      cases: {
        list: 'GET /api/cases',
        detail: 'GET /api/cases/:id',
        create: 'POST /api/cases',
        update: 'PUT /api/cases/:id',
        delete: 'DELETE /api/cases/:id'
      },
      users: {
        list: 'GET /api/users',
        detail: 'GET /api/users/:id',
        create: 'POST /api/users',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
        stats: 'GET /api/users/stats/overview'
      },
      config: {
        list: 'GET /api/config',
        manage: 'POST /api/config'
      },
      attachments: 'GET /attachments/:filename'
    },
    documentation: 'https://github.com/your-repo/case-learning-center'
  });
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Case Learning Center API 运行正常',
    timestamp: new Date().toISOString()
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '请求的资源不存在',
    path: req.originalUrl
  });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);

  // Multer 错误处理
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: '文件大小超过限制（最大20MB）'
      });
    }
  }

  // 自定义错误处理
  if (err.message && err.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      error: err.message
    });
  }

  res.status(500).json({
    error: '服务器内部错误'
  });
});

// 启动服务器
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 Case Learning Center API 服务已启动`);
  console.log(`📍 端口: ${PORT}`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📁 数据库路径: ${config.dbPath}`);
  console.log(`📂 上传目录: ${config.uploadPath}`);
  console.log(`===========================================`);
});

module.exports = app; 