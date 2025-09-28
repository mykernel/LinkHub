import { Category } from './types'

const now = new Date()

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'all',
    name: '全部',
    icon: '📊',
    color: 'blue',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'favorites',
    name: '收藏',
    icon: '⭐',
    color: 'yellow',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'monitoring',
    name: '监控',
    icon: '📈',
    color: 'green',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'logging',
    name: '日志',
    icon: '📝',
    color: 'orange',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'deployment',
    name: '部署',
    icon: '🚀',
    color: 'purple',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'database',
    name: '数据库',
    icon: '🗄️',
    color: 'red',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'documentation',
    name: '文档',
    icon: '📚',
    color: 'cyan',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'network',
    name: '网络',
    icon: '🌐',
    color: 'indigo',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'security',
    name: '安全',
    icon: '🔒',
    color: 'yellow',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  }
]

export const STORAGE_KEYS = {
  TOOLS: 'linkhub-tools',
  SETTINGS: 'linkhub-settings'
} as const