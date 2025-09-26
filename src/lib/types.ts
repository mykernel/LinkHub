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
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface ToolsState {
  tools: Tool[]
  categories: Category[]
  searchQuery: string
  selectedCategory: string
}

export type SortOption = 'clicks' | 'name' | 'created' | 'accessed'