# LinkHub Backend

## 项目说明

LinkHub 是一个智能书签管理系统的后端服务，基于 Python + FastAPI 构建。

## 技术栈

- **框架**: FastAPI 0.104.1
- **数据库**: MySQL 8.0
- **ORM**: SQLAlchemy 2.0
- **认证**: JWT (python-jose)
- **加密**: AES-256-GCM (cryptography)
- **密码哈希**: bcrypt (passlib)

## 快速开始

### 1. 安装依赖

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 3. 初始化数据库

```bash
mysql -h 172.16.63.222 -P 3307 -u root -p1234567 < init_db.sql
```

### 4. 启动服务

```bash
python main.py
```

服务将在 http://localhost:8000 启动

## API 文档

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 项目结构

```
backend/
├── main.py              # FastAPI 主应用
├── config.py            # 配置管理
├── database.py          # 数据库连接
├── models.py            # SQLAlchemy 模型
├── schemas.py           # Pydantic 数据验证
├── auth.py              # JWT 认证
├── security.py          # 数据加密
├── crud.py              # 数据库操作
├── init_db.sql          # 数据库初始化脚本
├── requirements.txt     # Python 依赖
├── .env                 # 环境变量配置
└── README.md           # 项目文档
```

##注意事项

当前数据库已存在旧的表结构。为了快速启动，建议：

1. **选项 A**: 删除旧数据库重新创建
```bash
mysql -h 172.16.63.222 -P 3307 -u root -p1234567 -e "DROP DATABASE linkhub; CREATE DATABASE linkhub;"
mysql -h 172.16.63.222 -P 3307 -u root -p1234567 linkhub < init_db.sql
```

2. **选项 B**: 使用新的数据库名（推荐用于测试）
修改 `.env` 中的 `DB_NAME=linkhub_new`

## 测试账户

- 用户名: `demo`
- 密码: `password123`