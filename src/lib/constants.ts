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
    id: 'social',
    name: '社交媒体',
    icon: '📏',
    color: 'green',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'news',
    name: '新闻资讯',
    icon: '📰',
    color: 'orange',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'tools',
    name: '在线工具',
    icon: '🔧',
    color: 'purple',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'entertainment',
    name: '娱乐影音',
    icon: '🎬',
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
    id: 'education',
    name: '学习教育',
    icon: '🎓',
    color: 'indigo',
    is_system: true,
    created_at: now,
    updated_at: now,
    version: 1
  },
  {
    id: 'shopping',
    name: '购物商城',
    icon: '🛍️',
    color: 'pink',
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