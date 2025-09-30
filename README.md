# LinkHub - 智能书签管理系统

LinkHub 是一个现代化的书签管理系统，采用 Python FastAPI + 纯 HTML/CSS/JavaScript 构建，具有云端同步、数据加密和响应式设计等特性。

## ✨ 特性

- 🔐 **安全可靠**: JWT 认证 + AES-256-GCM 数据加密
- ☁️ **云端同步**: 多设备数据实时同步
- 📱 **响应式设计**: 完美适配手机、平板和桌面
- 🎨 **现代化 UI**: 渐变紫色主题，流畅动画效果
- 🔍 **强大搜索**: 实时搜索、分类筛选、多维排序
- 📌 **书签管理**: 固定、收藏、分类、统计
- 🎯 **访客模式**: 无需登录即可浏览

## 🚀 快速开始

### 前置要求

- Python 3.8+
- MySQL 8.0+
- 现代浏览器（Chrome, Firefox, Safari, Edge）

### 一键启动

```bash
cd /root/LinkHub
./start.sh
```

启动成功后访问：
- **前端页面**: http://localhost:3003/login.html
- **后端 API**: http://localhost:7001
- **API 文档**: http://localhost:7001/docs

### 测试账户

- **用户名**: `demo`
- **密码**: `password123`

## 📁 项目结构

```
LinkHub/
├── backend/                 # 后端服务
│   ├── main.py             # FastAPI 应用入口
│   ├── config.py           # 配置管理
│   ├── database.py         # 数据库连接
│   ├── models.py           # SQLAlchemy 模型
│   ├── schemas.py          # Pydantic 数据验证
│   ├── auth.py             # JWT 认证
│   ├── security.py         # AES-256-GCM 加密
│   ├── crud.py             # 数据库操作
│   ├── init_db.sql         # 数据库初始化脚本
│   ├── requirements.txt    # Python 依赖
│   └── .env                # 环境变量配置
├── frontend/               # 前端页面
│   ├── login.html          # 登录页面
│   ├── signup.html         # 注册页面
│   ├── bookmarks.html      # 书签管理页面
│   ├── categories.html     # 分类管理页面
│   └── js/
│       ├── api.js          # API 调用封装
│       └── auth.js         # 认证管理
├── start.sh                # 启动脚本
└── README.md              # 项目文档
```

## 🛠️ 技术栈

### 后端
- **框架**: FastAPI 0.104.1
- **数据库**: MySQL 8.0
- **ORM**: SQLAlchemy 2.0
- **认证**: JWT (python-jose)
- **加密**: AES-256-GCM (cryptography)
- **密码哈希**: bcrypt (passlib)

### 前端
- **纯 HTML/CSS/JavaScript** (无框架依赖)
- **响应式设计**: Flexbox + Grid
- **API 通信**: Fetch API
- **状态管理**: LocalStorage

## 📊 数据库配置

```
主机: 172.16.63.222
端口: 3307
用户名: root
密码: 1234567
数据库: linkhub
```

## 🔧 端口配置

- **前端**: 3003
- **后端**: 7001

## 📖 核心功能

### 1. 用户认证
- 注册/登录（用户名 + 密码）
- JWT Token 认证
- 记住我功能
- 访客模式

### 2. 书签管理
- ✅ 创建、编辑、删除书签
- ✅ 固定书签（置顶显示）
- ✅ 收藏书签
- ✅ 点击统计
- ✅ 最后访问时间
- ✅ 分类归属

### 3. 分类管理
- 系统预设分类（9个）
- 自定义分类（图标 + 颜色）
- 分类排序
- 删除时书签转移

### 4. 搜索与筛选
- 实时搜索（300ms 防抖）
- 分类筛选
- 多维排序（时间、名称、点击量）
- 分页展示（12/24/48 条/页）

### 5. 视图模式
- 网格视图
- 列表视图

## 🔒 安全特性

1. **密码安全**: bcrypt 哈希（12 轮加盐）
2. **数据加密**: AES-256-GCM 加密敏感字段
3. **会话管理**: JWT Token（可配置过期时间）
4. **CORS 保护**: 跨域访问控制
5. **SQL 注入防护**: SQLAlchemy ORM 参数化查询

## 📝 API 文档

启动服务后访问 Swagger UI：http://localhost:7001/docs

### 主要接口

#### 认证
- `POST /api/auth/signup` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户

#### 书签
- `GET /api/bookmarks` - 获取书签列表（支持搜索、筛选、排序）
- `POST /api/bookmarks` - 创建书签
- `PUT /api/bookmarks/{id}` - 更新书签
- `DELETE /api/bookmarks/{id}` - 删除书签
- `POST /api/bookmarks/{id}/visit` - 访问书签（增加点击数）
- `PUT /api/bookmarks/{id}/pin` - 切换固定状态

#### 分类
- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类
- `PUT /api/categories/{id}` - 更新分类
- `DELETE /api/categories/{id}` - 删除分类（需转移书签）

## 🎯 使用指南

### 1. 注册账户
访问 http://localhost:3003/signup.html 注册新账户

### 2. 登录系统
使用注册的账户或测试账户登录

### 3. 添加书签
点击"添加书签"按钮，填写名称、URL 和分类

### 4. 管理分类
访问分类管理页面，创建自定义分类

### 5. 搜索书签
使用搜索框实时搜索，或点击分类标签筛选

## 🐛 故障排除

### 端口被占用
```bash
# 清理占用的端口
fuser -k 3003/tcp
fuser -k 7001/tcp
```

### 数据库连接失败
检查数据库配置和网络连接

### 依赖安装失败
```bash
pip install --break-system-packages -r backend/requirements.txt
```

## 📜 许可证

MIT License

## 👥 作者

LinkHub Team

---

**享受使用 LinkHub！** 🚀