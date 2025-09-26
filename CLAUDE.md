# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 开发规则

- 不允许添加用户没有明确指定的功能。

## 项目概述

这是一个 **运维仪表板** - 现代化全栈运维导航工具，专为DevOps团队设计的集中式书签管理系统。它提供了一种清洁、高效的方式来组织和访问各种运维工具和系统，具备用户认证、数据加密和云同步功能。

## 技术栈

### 前端
- **前端框架**: React 18.3.1 + TypeScript 5.6.2 + Vite 6.0.1
- **UI框架**: 基于 Radix UI 原语构建的 shadcn/ui 组件
- **样式**: Tailwind CSS 3.4.15 支持自定义主题
- **图标**: Lucide React + 分类表情符号图标
- **状态管理**: React 内置钩子 + 自定义钩子模式
- **存储**: localStorage + 加密云存储

### 后端
- **运行时**: Node.js + Express.js 框架
- **认证**: JWT 令牌 + 刷新机制
- **安全**: AES-256-GCM 用户数据加密
- **存储**: 基于JSON文件的用户数据 + 文件锁定机制
- **API**: RESTful 端点 + 速率限制
- **密码哈希**: bcryptjs + PBKDF2 密钥派生

## 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器 (Vite)
npm run build        # 生产环境构建 (TypeScript + Vite)
npm run lint         # 运行 ESLint 代码质量检查
npm run preview      # 预览生产构建
```

## 架构与代码组织

### 组件架构
- **全栈应用程序**：React 前端 + Express.js 后端
- **基于组件的架构**：使用自定义钩子处理业务逻辑
- **单向数据流**：父组件向下传递数据，事件向上冒泡
- **混合持久化**：localStorage 离线存储 + 加密云存储同步

### 关键模式
- **自定义钩子模式**：业务逻辑抽象为可重用钩子（`useTools`、`useLocalStorage`）
- **组件属性模式**：事件用回调属性，显示用数据属性
- **强类型 TypeScript**：所有数据结构的严格类型定义

### 项目结构
```
src/
├── components/
│   ├── ui/              # shadcn/ui 可重用组件
│   ├── ToolCard.tsx     # 工具显示卡片
│   ├── CategoryNav.tsx  # 分类导航
│   ├── AddToolDialog.tsx # 添加/编辑工具对话框
│   └── ...
├── hooks/
│   ├── useTools.ts      # 中心工具管理逻辑
│   └── useLocalStorage.ts # 持久化存储
├── lib/
│   ├── types.ts         # TypeScript 接口定义
│   └── utils.ts         # 工具函数
└── data/
    └── categories.json  # 默认分类
```

### 核心数据类型
```typescript
interface Tool {
  id: string          // 工具唯一标识符
  name: string        // 工具名称
  url: string         // 工具链接
  category: string    // 所属分类
  description?: string // 工具描述（可选）
  icon?: string       // 工具图标（可选）
  clickCount: number  // 点击次数
  lastAccessed: Date  // 最后访问时间
  isPinned: boolean   // 是否固定
}

interface Category {
  id: string    // 分类标识符
  name: string  // 分类名称
  icon: string  // 分类图标
}
```

### 状态管理
- **React 内置**：useState、useEffect、useMemo 管理组件状态
- **中心业务逻辑**：`useTools` 钩子管理所有工具操作
- **持久化存储**：`useLocalStorage` 钩子提供自动数据持久化
- **无外部状态库**：完全依赖 React 的内置功能

## 主要功能与实现说明

### 工具管理
- 工具存储在 localStorage 中，通过 `useTools` 钩子管理
- 分类为预定义（监控、日志、部署、数据库、文档、网络、安全）
- 每个工具跟踪点击次数和访问模式，用于智能排序

### UI 组件
- 使用 shadcn/ui 构建，保证一致性和可访问性
- 响应式设计，支持网格/列表视图模式
- 支持深色/浅色主题
- 搜索和筛选功能

### 数据流
1. `useTools` 钩子管理所有工具状态和操作
2. 组件通过 props 接收数据，通过回调函数发送事件
3. 更改自动持久化到 localStorage 和加密云存储
4. UI 通过 React 状态系统响应式更新
5. 认证状态管理用户会话和加密上下文

## 已知问题与解决方案

### Express Body 解析问题 (Content-Type 错误)

**问题描述：**
- **症状**: 保存用户数据时出现400错误，提示"数据不能为空"
- **前端表现**: 数据加密成功，网络面板显示正确的JSON载荷
- **后端表现**: `req.body`接收到空对象`{}`，尽管数据已发送

**根本原因：**
当`Content-Type`请求头被设置为`text/plain`而非`application/json`时，Express.js的`req.body`解析失败，导致`express.json()`中间件跳过JSON解析。

**调试步骤：**
1. **前端调试**: 检查控制台的加密成功和请求载荷日志
   ```javascript
   // 查找这些日志:
   // ✅ 数据加密成功，长度: XXXX
   // 🌐 API Request: {method: 'POST', body: '{"encryptedData":"..."}'}
   ```

2. **后端调试**: 添加详细的请求日志
   ```javascript
   console.log('请求详情:', {
     contentType: req.headers['content-type'],
     contentLength: req.headers['content-length'],
     bodyKeys: Object.keys(req.body || {})
   });
   ```

3. **关键指标**:
   - ✅ 正常: `contentType: 'application/json'`, `bodyKeys: ['encryptedData', 'currentVersion']`
   - ❌ 问题: `contentType: 'text/plain'`, `bodyKeys: []`

**解决方案：**
修复前端请求头构造 (`src/lib/auth.ts`):

```javascript
// ❌ 有问题的代码:
const response = await fetch(fullUrl, {
  headers: {
    'Content-Type': 'application/json',
    ...options.headers  // 可能覆盖Content-Type
  },
  ...options
})

// ✅ 正确的代码:
const headers = {
  'Content-Type': 'application/json',
  ...options.headers
};
const fetchOptions = { ...options, headers };
const response = await fetch(fullUrl, fetchOptions);
```

**预防措施：**
- 始终在fetch选项之前单独构造headers对象
- 在开发环境记录请求头以验证正确的Content-Type
- 使用TypeScript严格模式捕获headers覆盖问题

### UTF-8密码编码问题

**问题描述：**
包含非ASCII字符的密码导致会话恢复失败，造成加密上下文丢失。

**根本原因：**
`btoa()`/`atob()`函数仅支持Latin-1字符集，无法处理UTF-8字符如中文、表情符号等。

**解决方案：**
使用UTF-8安全的base64编码函数:

```javascript
// UTF-8安全的base64编码
const utf8ToBase64 = (str) => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binaryString);
};

const base64ToUtf8 = (str) => {
  const binaryString = atob(str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
};
```

### 问题诊断工具

**快速检测脚本：**
在浏览器控制台运行以检测当前问题：

```javascript
// 检查认证状态
console.log('认证状态:', {
  isAuthenticated: !!localStorage.getItem('ops-user'),
  hasEncryptionKey: !!sessionStorage.getItem('ops-encryption-password'),
  tokenExists: !!localStorage.getItem('ops-user-token')
});

// 检查最近的API请求
const lastRequest = performance.getEntriesByType('navigation')[0];
console.log('最后请求:', lastRequest);
```