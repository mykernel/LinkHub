import { Category } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'all',
    name: '全部',
    icon: '📊',
    color: 'blue'
  },
  {
    id: 'favorites',
    name: '收藏',
    icon: '⭐',
    color: 'yellow'
  },
  {
    id: 'monitoring',
    name: '监控',
    icon: '📈',
    color: 'green'
  },
  {
    id: 'logging',
    name: '日志',
    icon: '📝',
    color: 'orange'
  },
  {
    id: 'deployment',
    name: '部署',
    icon: '🚀',
    color: 'purple'
  },
  {
    id: 'database',
    name: '数据库',
    icon: '🗄️',
    color: 'red'
  },
  {
    id: 'documentation',
    name: '文档',
    icon: '📚',
    color: 'cyan'
  },
  {
    id: 'network',
    name: '网络',
    icon: '🌐',
    color: 'indigo'
  },
  {
    id: 'security',
    name: '安全',
    icon: '🔒',
    color: 'yellow'
  }
]

export const STORAGE_KEYS = {
  TOOLS: 'ops-dashboard-tools',
  SETTINGS: 'ops-dashboard-settings'
} as const