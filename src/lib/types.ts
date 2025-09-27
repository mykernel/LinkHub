export interface Tool {
  id: string
  name: string
  url: string
  category: string
  description?: string
  icon?: string
  clickCount: number
  lastAccessed: Date
  createdAt: Date
  isPinned: boolean
  pinnedPosition?: number
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  user_id?: string
  is_system: boolean
  created_at: Date
  updated_at: Date
  version: number
}

export interface ToolsState {
  tools: Tool[]
  categories: Category[]
  searchQuery: string
  selectedCategory: string
}

export type SortOption = 'clicks' | 'name' | 'created' | 'accessed'

// 分类管理相关类型
export interface CreateCategoryRequest {
  name: string
  icon: string
  color: string
}

export interface UpdateCategoryRequest {
  name?: string
  icon?: string
  color?: string
}

export interface DeleteCategoryRequest {
  target_category_id?: string // 工具重分配的目标分类
}

export interface CategoryApiResponse {
  success: boolean
  category?: Category
  categories?: Category[]
  error?: string
  message?: string
}

export type CategoryManageOperation = 'create' | 'edit' | 'delete'

// 预定义图标和颜色选项
export const CATEGORY_ICONS = [
  '📊', '⭐', '📈', '📝', '🚀', '🗄️', '📚', '🌐', '🔒',
  '💻', '🛠️', '🔧', '⚙️', '📱', '🖥️', '🔍', '📉', '📋',
  '🎯', '💡', '🔔', '📌', '🏷️', '📂', '📁', '🗂️', '🎮'
] as const

export const CATEGORY_COLORS = [
  'blue', 'green', 'yellow', 'red', 'purple', 'indigo',
  'pink', 'orange', 'cyan', 'emerald', 'rose', 'violet',
  'amber', 'lime', 'teal', 'sky'
] as const

export type CategoryIcon = typeof CATEGORY_ICONS[number]
export type CategoryColor = typeof CATEGORY_COLORS[number]