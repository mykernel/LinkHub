# PM2 生产环境部署指南

## 安装 PM2

```bash
# 全局安装 PM2（推荐）
npm install -g pm2

# 或者使用项目本地安装（已配置在 package.json 中）
cd server && npm install
```

## 基本命令

### 启动服务

```bash
# 开发环境启动
npm run pm2:start

# 生产环境启动
npm run pm2:start:prod

# 或者直接使用 PM2 命令
pm2 start ecosystem.config.js --env production
```

### 管理服务

```bash
# 查看状态
npm run pm2:status

# 重启服务
npm run pm2:restart

# 优雅重载（零停机）
npm run pm2:reload

# 停止服务
npm run pm2:stop

# 删除服务
npm run pm2:delete

# 查看日志
npm run pm2:logs
```

## 生产环境配置

### 环境变量

确保设置以下环境变量：

```bash
export NODE_ENV=production
export JWT_SECRET="your-super-secure-jwt-secret-key"
export PORT=3001
```

### 启动服务

```bash
# 方式1：使用 run.sh（推荐）
NODE_ENV=production JWT_SECRET="your-secret" ./run.sh start

# 方式2：直接使用 PM2
cd server
NODE_ENV=production JWT_SECRET="your-secret" npm run pm2:start:prod
```

## 监控和日志

### 实时监控

```bash
# 实时监控面板
pm2 monit

# 查看进程列表
pm2 list

# 查看详细信息
pm2 show linkhub-server
```

### 日志管理

```bash
# 查看实时日志
pm2 logs linkhub-server

# 查看错误日志
pm2 logs linkhub-server --err

# 清空日志
pm2 flush

# 日志文件位置
# - 综合日志：/tmp/linkhub/logs/pm2-combined.log
# - 输出日志：/tmp/linkhub/logs/pm2-out.log
# - 错误日志：/tmp/linkhub/logs/pm2-error.log
```

## 自动启动（系统重启后）

```bash
# 保存当前 PM2 进程列表
pm2 save

# 生成启动脚本
pm2 startup

# 按照提示执行生成的命令（通常需要 sudo）
```

## 故障排除

### 端口占用

```bash
# 检查端口占用
lsof -i :3001

# 杀死占用进程
pm2 delete linkhub-server
pkill -f "node src/server.js"
```

### 服务无法启动

1. 检查日志：`pm2 logs linkhub-server --lines 50`
2. 验证配置：`pm2 show linkhub-server`
3. 检查环境变量：确保 JWT_SECRET 已设置
4. 验证文件权限：确保有读写 data 目录的权限

### 性能优化

```bash
# 启用集群模式（多核 CPU）
# 修改 ecosystem.config.js 中的 instances: 'max'

# 内存使用监控
pm2 monit

# 重载配置（不停机）
pm2 reload ecosystem.config.js --env production
```

## 与 run.sh 集成

LinkHub 的 `run.sh` 脚本已集成环境检测：

- `NODE_ENV=development`：使用 nodemon 热重载
- `NODE_ENV=production`：使用 node 直接启动

要使用 PM2 替代默认的 node 启动，可以：

1. 修改 `run.sh` 中的 production 分支
2. 或者直接使用 PM2 命令独立管理服务

## 最佳实践

1. **生产环境必须设置 NODE_ENV=production**
2. **使用强密码设置 JWT_SECRET**
3. **定期备份 data 目录**
4. **监控内存和 CPU 使用率**
5. **设置日志轮转避免磁盘满**
6. **使用 pm2 reload 实现零停机更新**