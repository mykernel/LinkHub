import { Category } from './types'
import defaultCategoriesData from '../../shared/default-categories.json'

const now = new Date()

// 将JSON数据转换为带有Date对象的Category类型
export const DEFAULT_CATEGORIES: Category[] = defaultCategoriesData.map(cat => ({
  ...cat,
  created_at: now,
  updated_at: now,
  version: 1
}))

export const STORAGE_KEYS = {
  TOOLS: 'linkhub-tools',
  SETTINGS: 'linkhub-settings'
} as const