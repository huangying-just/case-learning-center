# Case Learning Center

一个专门用于教学案例管理的内容管理系统（CMS）。

## 技术架构

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: SQLite3
- **认证**: JWT (jsonwebtoken)
- **密码加密**: bcrypt
- **文件上传**: multer
- **跨域**: cors

### 前端
- **框架**: React
- **路由**: react-router-dom
- **HTTP客户端**: axios
- **状态管理**: React Context API
- **UI组件**: Ant Design

## 功能特性

- 基于角色的用户管理 (管理员/教师/学生)
- 案例的增删改查 (CRUD)
- 文件附件上传和下载
- JWT认证和授权
- 响应式用户界面

## 项目结构

```
case-learning-center/
├── backend/          # Node.js 后端
├── frontend/         # React 前端
└── README.md
```

## 快速开始

### 方式一：一键启动（推荐）
```bash
# 安装所有依赖并初始化数据库
npm install
npm run setup

# 同时启动前后端
npm run dev
```

### 方式二：分别启动

#### 后端启动
```bash
cd backend
npm install
npm run setup  # 初始化数据库和演示数据
npm run dev    # 启动开发服务器
```

#### 前端启动
```bash
cd frontend
npm install
npm start
```

## 访问地址

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001
- **API文档**: http://localhost:3001 (根路径显示所有可用的API端点)
- **健康检查**: http://localhost:3001/api/health

## 演示账户

系统已预置以下测试账户：

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 管理员 | admin | password | 全部权限 |
| 教师 | teacher | password | 创建、编辑案例 |
| 学生 | student | password | 浏览案例 |

## API 接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 案例管理
- `GET /api/cases` - 获取案例列表
- `GET /api/cases/:id` - 获取单个案例
- `POST /api/cases` - 创建案例
- `PUT /api/cases/:id` - 更新案例
- `DELETE /api/cases/:id` - 删除案例

### 附件
- `GET /attachments/:filename` - 下载附件 