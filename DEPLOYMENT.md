# 🚀 Case Learning Center 部署指南

## 📋 部署问题解决方案

### 🔧 数据库路径问题修复

如果在服务器部署时遇到"找不到数据库"的错误，请按以下步骤解决：

#### 1. 环境变量配置

在服务器上创建 `backend/.env` 文件：

```bash
# 服务器端口
PORT=9999

# JWT密钥 (生产环境请务必更改)
JWT_SECRET=your-production-secret-key-here

# 数据库绝对路径 (推荐设置)
DB_PATH=/path/to/your/project/backend/database/case.db

# 上传文件绝对路径 (推荐设置)
UPLOAD_PATH=/path/to/your/project/backend/uploads
```

#### 2. 确保目录存在

```bash
# 在服务器上，进入项目目录
cd /path/to/your/project

# 确保后端数据库目录存在
mkdir -p backend/database
mkdir -p backend/uploads

# 初始化数据库
cd backend
npm run setup
```

#### 3. 权限设置

```bash
# 确保数据库文件有写权限
chmod 664 backend/database/case.db
chmod 755 backend/database
chmod 755 backend/uploads
```

### 🌐 常见部署平台配置

#### Render.com 部署
```bash
# 构建命令
npm run install:all && npm run build

# 启动命令
cd backend && npm start

# 环境变量
PORT=10000
JWT_SECRET=your-secret-key
```

#### Railway 部署
```bash
# 构建命令
npm run install:all && npm run build

# 启动命令
cd backend && npm start

# 环境变量
PORT=$PORT
JWT_SECRET=your-secret-key
```

#### VPS/服务器部署
```bash
# 1. 克隆项目
git clone https://github.com/huangying-just/case-learning-center.git
cd case-learning-center

# 2. 安装依赖和初始化
npm run setup

# 3. 创建环境变量文件
cp backend/.env.example backend/.env
# 编辑 backend/.env 设置实际路径

# 4. 使用 PM2 启动 (推荐)
npm install -g pm2
pm2 start ecosystem.config.js

# 或直接启动
cd backend && npm start
```

### 🔍 故障排除

#### "Cannot find module '../database/db'" 错误
如果在运行 `npm run setup` 或初始化脚本时遇到此错误：

```bash
Error: Cannot find module '../database/db'
Require stack:
- /app/backend/scripts/seedData.js
```

**原因分析**：
- 在容器化环境中，`database/db.js` 模块可能没有被正确部署
- 或者存在模块路径解析问题

**解决方案**：
1. **确保所有文件都已上传**：
   ```bash
   # 检查关键文件是否存在
   ls -la backend/database/db.js
   ls -la backend/scripts/seedData.js
   ls -la backend/config.js
   ```

2. **重新克隆最新版本**（推荐）：
   ```bash
   git clone https://github.com/huangying-just/case-learning-center.git
   cd case-learning-center
   npm run setup
   ```

3. **手动安装依赖**：
   ```bash
   cd backend
   npm install
   npm run init-db
   npm run seed
   ```

#### 数据库文件不存在
```bash
# 检查数据库文件是否存在
ls -la backend/database/case.db

# 如果不存在，重新初始化
cd backend
npm run init-db
npm run seed
```

#### 权限问题
```bash
# 检查文件权限
ls -la backend/database/

# 修复权限
sudo chown -R $USER:$USER backend/database/
sudo chown -R $USER:$USER backend/uploads/
```

#### 路径问题调试
在 `backend/app.js` 中添加调试信息：
```javascript
console.log('当前工作目录:', process.cwd());
console.log('数据库路径:', config.dbPath);
console.log('上传路径:', config.uploadPath);
```

### 📁 目录结构检查清单

部署后确保以下目录结构存在：
```
项目根目录/
├── backend/
│   ├── database/
│   │   └── case.db (重要！)
│   ├── uploads/ (重要！)
│   ├── .env (如果需要)
│   └── app.js
└── frontend/
    └── build/ (构建后)
```

### 🎯 部署成功验证

1. **后端健康检查**：访问 `http://your-domain:port/api/health`
2. **数据库连接**：访问 `http://your-domain:port/api/cases`
3. **前端访问**：访问前端页面确认功能正常

### 📞 需要帮助？

如果仍有问题，请检查：
1. 服务器日志中的具体错误信息
2. 数据库文件的绝对路径是否正确
3. 环境变量是否正确设置
4. 目录权限是否正确 