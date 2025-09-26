# 运维导航页面 (Ops Dashboard)

一个简洁高效的运维工具导航页面，帮助运维团队快速访问各种工具和系统。

## 🎯 项目目标

- 提供类似书签管理的运维工具导航
- 简洁易用，避免过度设计
- 支持分类、搜索、智能排序等核心功能

## 🛠 技术栈

- **前端框架**: Vite + React + TypeScript
- **UI组件**: shadcn/ui + Tailwind CSS
- **状态管理**: React 内置 (useState/useContext)
- **数据存储**: JSON 文件 + localStorage
- **部署**: 静态文件部署

## 📋 功能规划

### 🎯 第一期 - MVP 核心功能

1. **工具链接展示**
   - 卡片式布局展示运维工具
   - 显示工具名称、描述、图标
   - 支持一键复制链接、新标签页打开

2. **分类管理**
   - 预设分类：监控、日志、部署、数据库、文档、网络、安全
   - 左侧分类导航，点击过滤显示
   - 支持"全部"视图

3. **搜索功能**
   - 顶部搜索框
   - 按工具名称、描述实时搜索
   - 搜索结果高亮显示

4. **基本管理**
   - ➕ 添加新工具链接
   - ✏️ 编辑已有链接信息
   - 🗑️ 删除不需要的链接

5. **简单批量操作**
   - 批量选择工具
   - 批量删除、批量分类调整

### 🔧 第二期 - 实用增强功能

6. **智能排序** ⭐
   - 按点击次数排序 (默认)
   - 按添加时间排序
   - 按名称字母排序
   - 手动拖拽排序

7. **快速访问**
   - 常用工具标星功能
   - 最近访问记录
   - 快捷键支持 (Ctrl+K 搜索)

8. **数据管理**
   - 导入/导出 JSON 配置
   - 本地数据持久化
   - 配置备份与还原

### 🎨 第三期 - 界面完善

9. **显示选项**
   - 网格/列表视图切换
   - 卡片大小调节
   - 暗色/亮色主题切换

10. **响应式设计**
    - 移动端适配
    - 平板端优化

### 📊 第四期 - 高级功能 (可选)

11. **服务状态检测**
    - 简单 ping 检测
    - 状态指示灯显示

12. **团队协作**
    - 配置文件共享
    - 团队模板管理

## 🏗 数据结构

```typescript
interface Tool {
  id: string
  name: string
  url: string
  category: string
  description?: string
  icon?: string
  clickCount: number        // 点击次数统计
  lastAccessed: Date        // 最后访问时间
  createdAt: Date          // 创建时间
  isPinned: boolean        // 是否置顶
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}
```

## 📁 项目结构

```
src/
├── components/
│   ├── ui/              # shadcn/ui 组件
│   ├── ToolCard.tsx     # 工具卡片组件
│   ├── CategoryNav.tsx  # 分类导航组件
│   ├── SearchBar.tsx    # 搜索栏组件
│   ├── AddToolDialog.tsx # 添加工具弹窗
│   └── BatchActions.tsx # 批量操作组件
├── hooks/
│   ├── useTools.ts      # 工具数据管理
│   └── useLocalStorage.ts # 本地存储
├── lib/
│   ├── utils.ts         # 工具函数
│   └── constants.ts     # 常量定义
├── data/
│   ├── defaultTools.json # 默认工具数据
│   └── categories.json   # 分类配置
└── App.tsx              # 主应用组件
```

## 🚀 开发计划

### Phase 1 - 项目搭建
- [x] 项目初始化 (Vite + React + TS)
- [x] 配置 shadcn/ui 和 Tailwind
- [x] 基础项目结构搭建

### Phase 2 - MVP 实现
- [ ] 工具卡片展示组件
- [ ] 分类导航功能
- [ ] 搜索过滤功能
- [ ] 添加/编辑/删除工具
- [ ] 点击统计和本地存储

### Phase 3 - 功能完善
- [ ] 批量操作功能
- [ ] 智能排序实现
- [ ] 数据导入导出

## 🎨 设计原则

1. **简洁第一** - 避免过度设计，专注核心功能
2. **用户体验** - 快速访问，高效操作
3. **可维护性** - 清晰的代码结构，易于扩展
4. **响应式** - 适配不同设备和屏幕尺寸

## 📝 使用说明

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 默认分类说明

- **监控**: Prometheus、Grafana、Zabbix 等
- **日志**: ELK、Loki、Splunk 等
- **部署**: Jenkins、GitLab CI、K8s Dashboard 等
- **数据库**: MySQL、Redis、MongoDB 管理工具等
- **文档**: Confluence、GitBook、内部文档等
- **网络**: 网络监控、防火墙管理等
- **安全**: 安全扫描、漏洞管理等

## 🔄 更新日志

### v1.0.0 (规划中)
- MVP 基础功能实现
- 工具展示、分类、搜索、管理功能
- 点击统计和智能排序

---

**开发状态**: 🚧 开发中
**最后更新**: 2025-09-26