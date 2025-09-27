# 运维仪表板 (Ops Dashboard)

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/ops-dashboard)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

现代化全栈运维导航工具，专为DevOps团队设计的集中式书签管理系统。提供清洁、高效的方式来组织和访问各种运维工具和系统，具备用户认证、数据加密和云同步功能。

## 🎯 项目亮点

- 🔒 **企业级安全**：端到端加密，客户端AES-256-GCM数据保护
- 🚀 **一键部署**：零配置启动，内置管理员账户初始化
- 🌐 **全栈架构**：React前端 + Node.js后端，完整的用户认证系统
- 👥 **团队协作**：多用户支持，加密云存储，离线可用

## 📖 目录

- [快速开始](#-快速开始)
- [功能特性](#-功能特性)
- [技术栈](#-技术栈)
- [系统架构](#-系统架构)
- [模块详解](#-模块详解)
- [安全性说明](#-安全性说明)
- [部署说明](#-部署说明)
- [开发指南](#-开发指南)
- [更新日志](#-更新日志)
- [常见问题](#-常见问题)

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.0.0 或更高版本
- **npm**: 9.0.0 或更高版本
- **可用端口**: 3001 (后端API), 5173 (前端开发)

### 一键启动

```bash
# 克隆项目
git clone <repository-url>
cd ops-dashboard

# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..

# 启动完整服务（前端 + 后端）
./run.sh start
```

### Admin账户初始化

```bash
# 进入服务器目录
cd server

# 生成管理员账户和密码
node init-admin.js

# ⚠️ 重要：请记录显示的admin密码，系统不会再次显示
```

### 访问系统

启动完成后，通过以下地址访问：

- **前端界面**: http://localhost:5173
- **后端API**: http://localhost:3001
- **Admin管理**: 登录后点击右上角头像进入管理界面

## 💡 功能特性

### 🎯 核心功能

- **工具导航管理**: 分类组织、智能搜索、一键访问运维工具
- **数据云同步**: 端到端加密存储，多设备同步，离线可用
- **使用统计分析**: 访问次数统计、智能排序、使用习惯分析
- **响应式设计**: 支持桌面、平板、移动端，自适应界面布局

### ⚙️ 管理功能

- **分类管理**: 创建、编辑、删除工具分类，拖拽排序
- **工具管理**: 批量添加、编辑工具信息，标签管理
- **用户管理**: 账户创建、权限控制、使用统计
- **数据管理**: 数据备份、恢复、版本控制、导入导出

### 🔒 安全功能

- **端到端加密**: 客户端AES-256-GCM加密，服务器无法解密
- **身份认证**: JWT双令牌机制，自动刷新，会话管理
- **访问控制**: 基于角色的权限管理，API速率限制
- **安全审计**: 登录日志、操作记录、异常检测

## 🛠 技术栈

### 前端技术栈

- **前端框架**: React 18.3.1 + TypeScript 5.6.2 + Vite 6.0.1
- **UI框架**: 基于 Radix UI 原语构建的 shadcn/ui 组件
- **样式方案**: Tailwind CSS 3.4.15 支持自定义主题
- **图标库**: Lucide React + 分类表情符号图标
- **状态管理**: React 内置钩子 + 自定义钩子模式
- **存储方案**: localStorage + 加密云存储

### 后端技术栈

- **运行时**: Node.js + Express.js 4.18.2 框架
- **认证机制**: JWT 令牌 + bcryptjs 密码哈希
- **数据存储**: 基于JSON文件 + proper-lockfile 文件锁定
- **安全防护**: express-rate-limit API限流 + CORS跨域控制
- **密码安全**: PBKDF2 密钥派生函数 + 安全随机盐

### 开发工具

- **构建工具**: Vite 6.0.1 超快构建
- **类型检查**: TypeScript 严格模式
- **代码规范**: ESLint + Prettier
- **开发体验**: 热重载、源码映射、错误边界

## 🏗 系统架构

### 整体架构

```
┌─────────────────┐    HTTPS/WSS    ┌─────────────────┐
│   React 前端    │ ◄──────────────► │  Express 后端   │
│                 │                  │                 │
│ ┌─────────────┐ │                  │ ┌─────────────┐ │
│ │  UI 组件层  │ │                  │ │  认证中间件 │ │
│ ├─────────────┤ │                  │ ├─────────────┤ │
│ │  状态管理   │ │                  │ │  API 路由   │ │
│ ├─────────────┤ │                  │ ├─────────────┤ │
│ │  加密模块   │ │                  │ │  文件存储   │ │
│ └─────────────┘ │                  │ └─────────────┘ │
└─────────────────┘                  └─────────────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                  ┌─────────────────┐
│  本地存储       │                  │  文件系统       │
│  localStorage   │                  │  JSON + 锁机制  │
└─────────────────┘                  └─────────────────┘
```

### 数据流向

1. **用户操作** → 前端组件响应
2. **数据处理** → 客户端加密处理
3. **API调用** → 后端认证验证
4. **数据存储** → 文件系统持久化
5. **状态同步** → 前端状态更新

## 📦 模块详解

### 前端核心模块

#### 🎨 UI 组件层
- **ToolCard**: 工具卡片展示，支持图标、描述、使用统计
- **CategoryNav**: 分类导航，支持过滤、拖拽排序
- **SearchBar**: 智能搜索，实时过滤、关键词高亮
- **AddToolDialog**: 工具添加/编辑弹窗，表单验证
- **AdminDashboard**: 管理员控制面板，用户管理、系统设置

#### ⚙️ 业务逻辑层
- **useTools**: 工具数据管理钩子，CRUD操作、状态管理
- **useAuth**: 认证状态管理，登录/登出、令牌刷新
- **useLocalStorage**: 本地存储钩子，数据持久化、自动同步
- **useCategories**: 分类管理钩子，分类CRUD、排序功能

#### 🔐 安全模块
- **crypto**: 客户端加密/解密，AES-256-GCM算法
- **auth**: 认证服务，JWT处理、API请求封装
- **password**: 密码管理，强度验证、哈希处理

### 后端核心模块

#### 🛡️ 认证与安全
- **JWT认证**: 双令牌机制，访问令牌(15分钟) + 刷新令牌(7天)
- **密码安全**: bcryptjs哈希 + PBKDF2密钥派生
- **API限流**: express-rate-limit防暴力攻击
- **输入验证**: 严格的数据校验和过滤

#### 💾 数据存储
- **用户数据**: SHA-256用户名哈希 + AES加密存储
- **文件锁定**: proper-lockfile防止并发写入冲突
- **版本控制**: 数据版本管理，冲突检测和解决
- **备份机制**: 自动备份，数据恢复功能

#### 📊 API接口
- **认证API**: `/api/auth/*` - 登录、注册、令牌刷新
- **用户数据API**: `/api/data/*` - 用户数据CRUD操作
- **管理API**: `/api/admin/*` - 管理员专用接口
- **健康检查**: `/api/health` - 服务状态监控

## 🔒 安全性说明

### 数据加密

本系统采用业界标准的端到端加密方案，确保用户数据的绝对安全：

- **加密算法**: AES-256-GCM对称加密，提供数据机密性和完整性保护
- **密钥管理**: PBKDF2密钥派生函数，100,000次迭代增强密码强度
- **随机性**: 每次加密使用新的随机初始化向量(IV)，防止重放攻击
- **客户端加密**: 所有敏感数据在客户端加密，服务器无法解密用户数据

### 身份认证

实现了多层次的身份认证和会话管理机制：

- **JWT双令牌**: 访问令牌(15分钟短期) + 刷新令牌(7天长期)
- **密码哈希**: bcryptjs + 随机盐，防止彩虹表攻击
- **会话管理**: 自动令牌刷新，无感知的安全体验
- **登录保护**: 失败次数限制，防止暴力破解

### 权限控制

基于角色的访问控制(RBAC)确保系统资源的合理分配：

- **角色分离**: 普通用户和管理员角色明确区分
- **API权限**: 不同角色访问不同的API端点
- **资源隔离**: 用户数据完全隔离，无法互相访问
- **操作审计**: 记录关键操作日志，支持安全审计

### 安全存储

文件系统级的安全存储机制保护数据持久化安全：

- **文件隔离**: 每用户独立的加密数据文件
- **并发保护**: proper-lockfile防止数据竞争和损坏
- **访问控制**: 文件系统权限控制，防止未授权访问
- **数据完整性**: 版本号和校验和确保数据完整性

### 传输安全

网络传输层面的安全保护措施：

- **HTTPS强制**: 生产环境强制使用HTTPS传输
- **安全请求头**: 设置适当的安全响应头
- **CORS策略**: 严格的跨域资源共享策略
- **API限流**: 防止DDoS攻击和资源滥用

## 📦 部署说明

### 生产环境部署

#### 环境准备

```bash
# 1. 确保Node.js环境
node --version  # 应该 >= 18.0.0
npm --version   # 应该 >= 9.0.0

# 2. 克隆代码
git clone <repository-url>
cd ops-dashboard

# 3. 安装依赖
npm install
cd server && npm install && cd ..
```

#### 构建和启动

```bash
# 1. 构建前端生产版本
npm run build

# 2. 设置必要的环境变量
export JWT_SECRET="your-super-secure-jwt-secret-key"
export NODE_ENV="production"

# 3. 启动生产服务
./run.sh start

# 4. 初始化管理员账户
cd server && node init-admin.js
```

#### 进程管理（可选）

使用PM2进行生产环境进程管理：

```bash
# 安装PM2
npm install -g pm2

# 使用PM2启动
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 环境变量配置

创建 `.env` 文件配置环境变量：

```bash
# JWT密钥（必需，至少32字符）
JWT_SECRET=your-super-secure-jwt-secret-key-for-production

# 服务端口
SERVER_PORT=3001

# 客户端端口（开发环境）
CLIENT_PORT=5173

# 运行环境
NODE_ENV=production

# 数据目录（可选）
DATA_DIR=./server/data

# 日志级别（可选）
LOG_LEVEL=info
```

### Docker部署（预留）

```dockerfile
# Dockerfile 示例（待实现）
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001 5173
CMD ["npm", "start"]
```

### 反向代理配置

Nginx配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 👨‍💻 开发指南

### 本地开发环境

```bash
# 1. 克隆项目
git clone <repository-url>
cd ops-dashboard

# 2. 安装依赖
npm install
cd server && npm install && cd ..

# 3. 启动开发服务器
./run.sh dev

# 4. 创建管理员账户
cd server && node init-admin.js
```

### 开发脚本

```bash
# 启动完整开发环境（前端+后端）
./run.sh dev

# 仅启动前端开发服务器
npm run dev

# 仅启动后端开发服务器
cd server && npm run dev

# 构建生产版本
npm run build

# 代码质量检查
npm run lint

# 预览生产构建
npm run preview
```

### 代码规范

- **TypeScript**: 启用严格模式，确保类型安全
- **ESLint**: 遵循React和TypeScript最佳实践
- **文件命名**: 组件使用PascalCase，工具函数使用camelCase
- **注释规范**: 使用JSDoc注释复杂函数和组件

### 项目结构

```
ops-dashboard/
├── src/                    # 前端源码
│   ├── components/         # React组件
│   │   ├── ui/            # shadcn/ui基础组件
│   │   ├── admin/         # 管理员专用组件
│   │   └── ...            # 业务组件
│   ├── hooks/             # 自定义React钩子
│   ├── lib/               # 工具函数和类型定义
│   ├── data/              # 静态数据和默认配置
│   └── App.tsx            # 主应用组件
├── server/                # 后端源码
│   ├── src/               # 服务器逻辑
│   ├── data/              # 数据存储目录
│   └── init-admin.js      # 管理员初始化脚本
├── public/                # 静态资源
├── dist/                  # 构建输出
└── run.sh                 # 启动脚本
```

### 贡献指南

1. **Fork项目**并创建特性分支
2. **编写代码**，遵循现有代码规范
3. **添加测试**（如果适用）
4. **更新文档**，包括README和注释
5. **提交PR**，详细描述变更内容

## 📝 更新日志

### v1.0.0 (2025-09-27) 🎉

#### 🚀 新功能
- **完整全栈架构**: React前端 + Node.js后端的完整运维导航系统
- **用户认证系统**: JWT双令牌机制，支持注册、登录、自动刷新
- **端到端加密**: 客户端AES-256-GCM加密，保护用户数据隐私
- **管理员界面**: 完整的Admin管理系统，用户管理和系统设置
- **分类管理功能**: 可视化分类管理，支持增删改查和拖拽排序
- **一键部署脚本**: run.sh脚本支持开发和生产环境一键启动

#### 🔒 安全更新
- **修复关键安全漏洞**: 修复Challenge验证绕过等4个安全问题
- **增强认证安全**: 完善JWT密钥管理和用户名枚举防护
- **密码安全优化**: bcryptjs哈希 + PBKDF2密钥派生双重保护
- **API安全加固**: 速率限制、输入验证、CORS策略

#### 🛠 技术改进
- **TypeScript完整支持**: 全项目TypeScript化，类型安全保障
- **Vite构建优化**: 升级到Vite 6.0.1，构建性能大幅提升
- **shadcn/ui组件**: 现代化UI组件库，保证界面一致性
- **文件锁定机制**: proper-lockfile防止数据竞争和损坏

#### 🐛 修复问题
- **UTF-8密码编码**: 修复包含中文字符的密码登录问题
- **图钉功能修复**: 修复工具图钉功能的位置保持问题
- **分类删除修复**: 修复删除分类时工具移动失败的问题
- **TypeScript类型**: 解决vite.config.ts和组件类型错误

### 版本历史

- **ec49c01** (最新): Admin密码重置并清理测试用户数据
- **936a7ca**: 修复关键安全漏洞 - 完善认证系统安全防护
- **593b337**: 解决vite.config.ts中的TypeScript类型异常
- **5e6540a**: 实现完整分类管理功能
- **bd572ab**: 修复删除分类时工具移动失败问题
- **dd969d5**: 添加运维仪表板一键管理脚本
- **7afbf39**: 添加Admin前端界面组件
- **0cdc445**: 实现完整Admin管理系统与安全优化
- **050cd51**: 实现完整用户认证系统和数据同步功能
- **86f11f0**: 实现运维导航页面 v1.0 - 完整的工具管理系统

## ❓ 常见问题

### 🚨 启动问题

**Q: 启动时提示端口被占用怎么办？**

A: 使用以下命令检查和处理：
```bash
# 检查服务状态
./run.sh status

# 停止所有服务
./run.sh stop

# 查看端口占用情况
lsof -i :3001  # 检查后端端口
lsof -i :5173  # 检查前端端口

# 杀死占用进程
kill -9 <PID>
```

**Q: JWT_SECRET错误怎么办？**

A: 确保环境变量正确设置：
```bash
# 检查环境变量
echo $JWT_SECRET

# 如果为空，设置一个强密钥（至少32字符）
export JWT_SECRET="your-super-secure-jwt-secret-key-for-production"

# 或修改run.sh脚本中的JWT_SECRET
```

**Q: 依赖安装失败怎么办？**

A: 尝试以下解决方案：
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 使用yarn（可选）
yarn install
```

### 🔑 认证问题

**Q: Admin密码忘记了怎么办？**

A: 重新生成管理员账户：
```bash
# 删除现有admin账户文件
rm server/data/users/8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918.*

# 重新初始化admin账户
cd server && node init-admin.js

# 记录新生成的密码
```

**Q: 登录后立即退出是什么原因？**

A: 通常是时间同步问题：
```bash
# 检查系统时间
date

# 同步系统时间（Linux）
sudo ntpdate -s time.nist.gov

# 检查JWT令牌有效期设置
```

**Q: 密码包含中文字符登录失败？**

A: 系统已修复UTF-8编码问题，如仍有问题：
1. 确保使用最新版本
2. 尝试重新注册账户
3. 检查浏览器控制台错误信息

### 💾 数据问题

**Q: 数据同步失败怎么办？**

A: 检查以下方面：
1. **网络连接**: 确保前后端通信正常
2. **加密密钥**: 确保与注册时使用的密码一致
3. **数据版本**: 检查是否存在版本冲突
4. **存储空间**: 确保磁盘空间充足

**Q: 如何备份用户数据？**

A: 备份server/data目录：
```bash
# 创建备份
tar -czf ops-dashboard-backup-$(date +%Y%m%d).tar.gz server/data/

# 恢复备份
tar -xzf ops-dashboard-backup-20250927.tar.gz
```

**Q: 如何重置所有数据？**

A: ⚠️ 慎重操作，将删除所有用户数据：
```bash
# 停止服务
./run.sh stop

# 删除用户数据（不可恢复）
rm -rf server/data/users/*

# 重新初始化admin账户
cd server && node init-admin.js

# 重启服务
./run.sh start
```

### 🚀 性能问题

**Q: 系统运行缓慢怎么办？**

A: 性能优化建议：
1. **检查系统资源**: CPU、内存、磁盘使用情况
2. **清理数据**: 删除不需要的工具和分类
3. **重启服务**: `./run.sh restart`
4. **检查网络**: 确保前后端网络通信正常

**Q: 大量数据时如何优化？**

A: 考虑以下优化措施：
1. **分页加载**: 大量工具时实现分页
2. **数据缓存**: 启用适当的缓存机制
3. **索引优化**: 对频繁搜索的字段建立索引
4. **定期清理**: 清理过期的会话和日志

## 📄 许可证

本项目使用 [MIT 许可证](LICENSE)。

## 🤝 支持与反馈

- **问题报告**: 请在 [GitHub Issues](https://github.com/your-org/ops-dashboard/issues) 提交
- **功能请求**: 欢迎在 Issues 中提出新功能建议
- **技术讨论**: 加入我们的技术交流群
- **文档贡献**: 帮助我们改进文档和教程

---

**项目状态**: ✅ 生产就绪
**最后更新**: 2025-09-27
**维护状态**: 🔄 积极维护中

<p align="center">
  <i>🛠 为DevOps团队打造的现代化运维导航工具</i>
</p>