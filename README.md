# Case Learning Center v1.0.0

<div align="center">

![Logo](https://img.shields.io/badge/Case%20Learning%20Center-v1.0.0-blue?style=for-the-badge)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3+-orange?style=flat-square&logo=sqlite)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**一个专门用于教学案例管理的现代化内容管理系统（CMS）**

[功能特性](#功能特性) • [快速开始](#快速开始) • [部署指南](#部署指南) • [API文档](#api文档) • [贡献指南](#贡献指南)

</div>

---

## 📋 项目概述

Case Learning Center 是一个基于现代Web技术栈构建的教学案例内容管理系统，专为教育机构、培训组织和学习社区设计。系统采用前后端分离架构，提供安全的、基于角色的环境，让授权用户能够高效管理案例库，普通用户可以便捷地浏览和学习。

## ✨ 功能特性

### 🔐 用户管理与认证
- **多角色用户系统**: 支持管理员、教师、学生三种角色
- **JWT认证机制**: 安全的token认证和会话管理
- **权限控制**: 基于角色的精细化权限管理
- **用户注册登录**: 完整的用户认证流程

### 📚 案例管理
- **案例CRUD**: 完整的案例增删改查功能
- **富文本编辑**: 支持格式化的案例内容编辑
- **文件附件**: 支持PDF、Word、PPT等多种格式文件上传
- **案例搜索**: 强大的搜索和筛选功能

### 🎨 用户界面
- **响应式设计**: 完美适配桌面端和移动端
- **现代化UI**: 基于Ant Design的美观界面
- **直观导航**: 清晰的页面结构和导航体系
- **交互反馈**: 丰富的用户操作反馈

### 🛡️ 安全特性
- **密码加密**: 使用bcrypt进行密码哈希
- **CORS配置**: 安全的跨域资源共享设置
- **文件验证**: 严格的文件类型和大小限制
- **SQL注入防护**: 参数化查询防止SQL注入

## 🏗️ 技术架构

### 后端技术栈
```
Node.js 18+               # 运行时环境
├── Express.js           # Web框架
├── SQLite3              # 轻量级数据库
├── JWT                  # 身份认证
├── bcryptjs             # 密码加密
├── multer               # 文件上传
└── cors                 # 跨域处理
```

### 前端技术栈
```
React 18+                # 前端框架
├── React Router DOM     # 路由管理
├── Axios               # HTTP客户端
├── Ant Design          # UI组件库
├── Context API         # 状态管理
└── React Hooks         # 组件逻辑
```

### 系统架构图
```
┌─────────────────┐    HTTP/HTTPS    ┌──────────────────┐    SQL    ┌──────────────┐
│                 │                  │                  │           │              │
│   Frontend      │◄────────────────►│   Backend API    │──────────►│   SQLite     │
│  (React/Vite)   │   RESTful API    │ (Node.js/Express)│ Database  │  (case.db)   │
│                 │                  │                  │           │              │
└─────────────────┘                  └─────────┬────────┘           └──────────────┘
                                               │
                                               │ File System
                                               │
                                        ┌──────▼──────┐
                                        │             │
                                        │  Uploads/   │
                                        │ (PDFs, etc) │
                                        └─────────────┘
```

## 📁 项目结构

```
case-learning-center/
├── 📄 README.md                    # 项目说明文档
├── 📄 package.json                 # 根目录项目配置
├── 📄 .gitignore                   # Git忽略文件配置
├── 📁 backend/                     # 后端源码
│   ├── 📄 app.js                   # Express应用主文件
│   ├── 📄 config.js                # 配置管理
│   ├── 📄 package.json             # 后端依赖管理
│   ├── 📁 routes/                  # API路由模块
│   │   ├── 📄 auth.js              # 认证相关路由
│   │   └── 📄 cases.js             # 案例管理路由
│   ├── 📁 middleware/              # 中间件
│   │   └── 📄 authMiddleware.js    # JWT认证中间件
│   ├── 📁 database/                # 数据库模块
│   │   └── 📄 db.js                # 数据库连接和操作
│   └── 📁 scripts/                 # 脚本文件
│       ├── 📄 initDatabase.js      # 数据库初始化
│       └── 📄 seedData.js          # 演示数据填充
├── 📁 frontend/                    # 前端源码
│   ├── 📄 package.json             # 前端依赖管理
│   ├── 📁 public/                  # 静态资源
│   │   └── 📄 index.html           # HTML模板
│   └── 📁 src/                     # React源码
│       ├── 📄 App.js               # 根组件
│       ├── 📄 index.js             # 应用入口
│       ├── 📁 components/          # 通用组件
│       │   ├── 📄 Navbar.js        # 导航栏组件
│       │   └── 📄 PrivateRoute.js  # 私有路由组件
│       ├── 📁 pages/               # 页面组件
│       │   ├── 📄 HomePage.js      # 首页
│       │   ├── 📄 LoginPage.js     # 登录页
│       │   ├── 📄 RegisterPage.js  # 注册页
│       │   ├── 📄 CaseListPage.js  # 案例列表页
│       │   ├── 📄 CaseDetailPage.js# 案例详情页
│       │   └── 📄 CaseFormPage.js  # 案例编辑页
│       ├── 📁 context/             # Context状态管理
│       │   └── 📄 AuthContext.js   # 认证状态管理
│       └── 📁 services/            # API服务
│           └── 📄 api.js           # HTTP请求封装
```

## 🚀 快速开始

### 环境要求
- Node.js 18.0+
- npm 8.0+ 或 yarn 1.22+
- Git

### 方式一：一键启动（推荐）
```bash
# 1. 克隆项目
git clone https://github.com/huangying-just/case-learning-center.git
cd case-learning-center

# 2. 安装所有依赖并初始化数据库
npm install
npm run setup

# 3. 同时启动前后端服务
npm run dev
```

### 方式二：分别启动

#### 后端启动
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 初始化数据库和演示数据
npm run setup

# 启动开发服务器
npm run dev
```

#### 前端启动
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 📦 可用脚本

#### 根目录脚本
```bash
npm install          # 安装前后端所有依赖
npm run setup        # 初始化项目（安装依赖+数据库初始化）
npm run dev          # 同时启动前后端开发服务器
npm run build        # 构建前端生产版本
```

#### 后端脚本
```bash
npm start           # 启动生产服务器
npm run dev         # 启动开发服务器（热重载）
npm run init-db     # 仅初始化数据库表结构
npm run seed        # 仅添加演示数据
npm run setup       # 完整数据库设置（init-db + seed）
```

#### 前端脚本
```bash
npm start           # 启动开发服务器
npm run build       # 构建生产版本
npm test            # 运行测试
```

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 🎨 前端应用 | http://localhost:3000 | React开发服务器 |
| 🔧 后端API | http://localhost:3001 | Express API服务器 |
| 📖 API文档 | http://localhost:3001 | 根路径显示所有可用端点 |
| 💓 健康检查 | http://localhost:3001/api/health | 服务器状态检查 |

## 👥 演示账户

系统已预置以下测试账户，开箱即用：

| 角色 | 用户名 | 密码 | 权限描述 |
|------|--------|------|----------|
| 🔑 **管理员** | `admin` | `password` | 全部权限：用户管理、案例管理、系统配置 |
| 👨‍🏫 **教师** | `teacher` | `password` | 案例管理：创建、编辑、删除自己的案例 |
| 👨‍🎓 **学生** | `student` | `password` | 只读权限：浏览和下载所有案例 |

## 📡 API 文档

### 认证接口
| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | ❌ |
| POST | `/api/auth/login` | 用户登录 | ❌ |

### 案例管理接口
| 方法 | 端点 | 描述 | 认证 | 权限 |
|------|------|------|------|------|
| GET | `/api/cases` | 获取案例列表 | ❌ | 公开 |
| GET | `/api/cases/:id` | 获取单个案例详情 | ❌ | 公开 |
| POST | `/api/cases` | 创建新案例 | ✅ | 教师、管理员 |
| PUT | `/api/cases/:id` | 更新案例 | ✅ | 作者、管理员 |
| DELETE | `/api/cases/:id` | 删除案例 | ✅ | 作者、管理员 |

### 文件接口
| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/attachments/:filename` | 下载文件附件 | ❌ |

### API请求示例

#### 用户登录
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "teacher", "password": "password"}'
```

#### 获取案例列表
```bash
curl http://localhost:3001/api/cases
```

#### 创建案例（需要认证）
```bash
curl -X POST http://localhost:3001/api/cases \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=新案例标题" \
  -F "content=案例内容详情" \
  -F "attachment=@file.pdf"
```

## 🚀 部署指南

### 生产环境部署

#### 后端部署（推荐平台）
- **Render**: 支持SQLite持久化存储
- **Railway**: 现代化部署平台
- **Heroku**: 需要升级到PostgreSQL
- **VPS**: 完全控制的自建服务器

#### 前端部署（推荐平台）
- **Vercel**: 零配置React部署
- **Netlify**: 强大的静态站点托管
- **GitHub Pages**: 免费的静态站点托管

#### 环境变量配置
```bash
# 后端环境变量 (.env)
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_PATH=./database/case.db
UPLOAD_PATH=./uploads
```

#### 生产环境建议
1. **数据库升级**: SQLite适合开发，生产环境建议使用PostgreSQL
2. **文件存储**: 使用云存储服务（AWS S3、阿里云OSS等）
3. **安全加固**: 更新JWT密钥、启用HTTPS、配置防火墙
4. **监控日志**: 集成日志系统和性能监控

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看以下指南：

### 提交问题
1. 搜索现有Issues确认问题未被报告
2. 使用问题模板提供详细信息
3. 包含复现步骤和环境信息

### 提交代码
1. Fork此仓库到您的GitHub账户
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 开启Pull Request

### 开发规范
- 遵循现有代码风格
- 添加必要的注释和文档
- 确保所有测试通过
- 更新相关文档

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。您可以自由使用、修改和分发此软件。

## 🆘 支持与反馈

- **GitHub Issues**: [提交问题或建议](https://github.com/huangying-just/case-learning-center/issues)
- **GitHub Discussions**: [参与社区讨论](https://github.com/huangying-just/case-learning-center/discussions)
- **Email**: 发送邮件获取技术支持

## 📈 版本历史

### v1.0.0 (2024-06-11)
- 🎉 初始版本发布
- ✅ 完整的前后端分离架构
- ✅ JWT认证和角色权限系统  
- ✅ 案例CRUD功能
- ✅ 文件上传和管理
- ✅ 响应式Web界面
- ✅ 完整的API文档
- ✅ 演示数据和部署指南

---

<div align="center">

**🌟 如果这个项目对您有帮助，请给个Star支持一下！**

Made with ❤️ by [huangying-just](https://github.com/huangying-just)

</div> 