import { useState, useMemo, useEffect } from 'react'
import { Tool, SortOption } from '../lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalStorage } from './useLocalStorage'
import { useCategories } from './useCategories'
import { useSystemDefaultTools } from './useSystemDefaultTools'
import defaultToolsData from '../data/defaultTools.json'

export function useTools() {
  const { isAuthenticated, loadUserTools, saveUserTools } = useAuth()

  // 系统默认工具加载
  const {
    tools: systemDefaultTools,
    isLoading: isLoadingSystemDefaults,
    usingSystemConfig
  } = useSystemDefaultTools()

  // 集成分类管理
  const {
    categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryToolCount,
    canManageCategory,
    clearError: clearCategoriesError
  } = useCategories()

  // 本地存储（仅供未登录用户使用）
  const [localStorageTools, setLocalStorageTools] = useLocalStorage<Tool[]>('linkhub_tools_local', defaultToolsData.map(tool => ({
    ...tool,
    lastAccessed: new Date(tool.lastAccessed),
    createdAt: new Date(tool.createdAt)
  })))

  // 用户工具状态
  const [userTools, setUserTools] = useState<Tool[]>([])
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false)
  const [isLoadingUserData, setIsLoadingUserData] = useState(false)

  // 其他状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('clicks')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 加载用户数据（仅当登录时）
  useEffect(() => {
    if (isAuthenticated && !isUserDataLoaded && !isLoadingUserData) {
      loadUserData()
    } else if (!isAuthenticated) {
      // 未登录时重置用户数据状态
      setUserTools([])
      setIsUserDataLoaded(false)
    }
  }, [isAuthenticated, isUserDataLoaded, isLoadingUserData])

  const loadUserData = async () => {
    setIsLoadingUserData(true)
    try {
      const result = await loadUserTools()
      if (result.success) {
        const tools = result.tools || []
        setUserTools(tools.map(tool => ({
          ...tool,
          lastAccessed: new Date(tool.lastAccessed),
          createdAt: new Date(tool.createdAt)
        })))
        setIsUserDataLoaded(true)
      } else {
        console.error('Failed to load user tools:', result.error)
        // 加载失败时优先使用系统配置的默认数据，降级到静态默认数据
        if (systemDefaultTools.length > 0) {
          // 使用系统配置的默认工具，为用户创建个人副本
          const userCopyTools = systemDefaultTools.map(tool => ({
            ...tool,
            id: `user_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${tool.id}`,
            lastAccessed: new Date(),
            createdAt: new Date(),
            clickCount: 0,
            isPinned: false,
            pinnedPosition: undefined
          }))
          setUserTools(userCopyTools)

          if (import.meta.env.DEV) {
            console.log('✅ 用户数据加载失败，使用系统配置默认工具', { count: userCopyTools.length })
          }
        } else {
          // 系统配置为空时，使用静态默认数据
          setUserTools(defaultToolsData.map(tool => ({
            ...tool,
            lastAccessed: new Date(tool.lastAccessed),
            createdAt: new Date(tool.createdAt)
          })))

          if (import.meta.env.DEV) {
            console.log('📁 用户数据加载失败，使用静态默认数据', { count: defaultToolsData.length })
          }
        }
        setIsUserDataLoaded(true)
      }
    } catch (error) {
      console.error('Load user data error:', error)
      // 异常情况下也优先使用系统配置的默认工具
      if (systemDefaultTools.length > 0) {
        const userCopyTools = systemDefaultTools.map(tool => ({
          ...tool,
          id: `user_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${tool.id}`,
          lastAccessed: new Date(),
          createdAt: new Date(),
          clickCount: 0,
          isPinned: false,
          pinnedPosition: undefined
        }))
        setUserTools(userCopyTools)

        if (import.meta.env.DEV) {
          console.log('✅ 用户数据加载异常，使用系统配置默认工具', { count: userCopyTools.length })
        }
      } else {
        setUserTools([])
      }
      setIsUserDataLoaded(true)
    } finally {
      setIsLoadingUserData(false)
    }
  }

  // 保存用户数据（仅当登录时）
  const saveUserData = async (tools: Tool[]) => {
    if (!isAuthenticated) return

    try {
      const result = await saveUserTools(tools)
      if (!result.success) {
        console.error('Failed to save user tools:', result.error)
        // TODO: 显示错误提示
      }
    } catch (error) {
      console.error('Save user data error:', error)
    }
  }

  // 获取当前使用的工具数据
  const currentTools = useMemo(() => {
    if (isAuthenticated) {
      return userTools
    } else {
      // 未登录用户：优化的加载逻辑，避免闪烁
      if (isLoadingSystemDefaults) {
        // 正在加载系统配置时，返回空数组触发骨架屏
        return []
      }

      if (usingSystemConfig) {
        // 使用系统配置的默认工具
        return systemDefaultTools.map(tool => {
          // 尝试从localStorage获取该工具的点击状态
          const localTool = localStorageTools.find(local => local.url === tool.url)
          return {
            ...tool,
            clickCount: localTool?.clickCount || tool.clickCount || 0,
            lastAccessed: localTool?.lastAccessed instanceof Date
              ? localTool.lastAccessed
              : localTool?.lastAccessed
                ? new Date(localTool.lastAccessed)
                : tool.lastAccessed instanceof Date
                  ? tool.lastAccessed
                  : new Date(tool.lastAccessed),
            isPinned: localTool?.isPinned || tool.isPinned || false,
            pinnedPosition: localTool?.pinnedPosition || tool.pinnedPosition
          }
        })
      } else {
        // 系统配置为空或加载失败时，使用localStorage静态数据
        return localStorageTools.map(tool => ({
          ...tool,
          lastAccessed: tool.lastAccessed instanceof Date ? tool.lastAccessed : new Date(tool.lastAccessed),
          createdAt: tool.createdAt instanceof Date ? tool.createdAt : new Date(tool.createdAt)
        }))
      }
    }
  }, [isAuthenticated, userTools, systemDefaultTools, localStorageTools, isLoadingSystemDefaults, usingSystemConfig])

  // 更新工具数据
  const updateTools = (newTools: Tool[] | ((prev: Tool[]) => Tool[])) => {
    const updatedTools = typeof newTools === 'function'
      ? newTools(currentTools)
      : newTools

    if (isAuthenticated) {
      setUserTools(updatedTools)
      // 异步保存到服务器
      saveUserData(updatedTools)
    } else {
      // 未登录用户：如果使用系统配置，只保存状态到localStorage
      if (usingSystemConfig) {
        // 只保存点击次数、收藏状态等用户行为数据
        const statusOnlyTools = updatedTools.map(tool => {
          const localTool = localStorageTools.find(local => local.url === tool.url)
          if (localTool) {
            // 更新现有工具的状态
            return {
              ...localTool,
              clickCount: tool.clickCount,
              lastAccessed: tool.lastAccessed,
              isPinned: tool.isPinned,
              pinnedPosition: tool.pinnedPosition
            }
          } else {
            // 新增工具状态记录（只保留必要字段）
            return {
              id: tool.id,
              name: tool.name,
              url: tool.url,
              category: tool.category,
              description: tool.description || '',
              icon: tool.icon || '🔗',
              clickCount: tool.clickCount,
              lastAccessed: tool.lastAccessed,
              createdAt: tool.createdAt,
              isPinned: tool.isPinned,
              pinnedPosition: tool.pinnedPosition
            }
          }
        })
        setLocalStorageTools(statusOnlyTools)
      } else {
        // 不使用系统配置时，完整保存到localStorage
        setLocalStorageTools(updatedTools)
      }
    }
  }

  // 过滤和排序工具
  const filteredTools = useMemo(() => {
    let filtered = currentTools

    // 按分类过滤
    if (selectedCategory === 'favorites') {
      filtered = filtered.filter(tool => tool.isPinned)
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory)
    }

    // 按搜索关键词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query)
      )
    }

    // 排序工具（保持固定位置工具的位置）
    const pinnedTools = filtered.filter(tool => tool.pinnedPosition !== undefined)
    const unpinnedTools = filtered.filter(tool => tool.pinnedPosition === undefined)

    unpinnedTools.sort((a, b) => {
      switch (sortBy) {
        case 'clicks':
          return b.clickCount - a.clickCount
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'accessed':
          return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
        default:
          return 0
      }
    })

    // 重新组合固定位置和未固定的工具
    const result: Tool[] = []
    let unpinnedIndex = 0

    for (let i = 0; i < filtered.length; i++) {
      const pinnedAtThisPosition = pinnedTools.find(tool => tool.pinnedPosition === i)

      if (pinnedAtThisPosition) {
        result[i] = pinnedAtThisPosition
      } else {
        if (unpinnedIndex < unpinnedTools.length) {
          result[i] = unpinnedTools[unpinnedIndex]
          unpinnedIndex++
        }
      }
    }

    return result.filter(Boolean)
  }, [currentTools, searchQuery, selectedCategory, sortBy])

  // 分页计算
  const totalTools = filteredTools.length
  const totalPages = Math.ceil(totalTools / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  // 分页后的工具
  const paginatedTools = useMemo(() => {
    return filteredTools.slice(startIndex, endIndex)
  }, [filteredTools, startIndex, endIndex])

  // 重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, sortBy])

  // 分页操作
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const changePageSize = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  // 工具操作（仅登录用户可以修改）
  const addTool = (toolData: Omit<Tool, 'id' | 'clickCount' | 'lastAccessed' | 'createdAt' | 'isPinned' | 'pinnedPosition'>) => {
    if (!isAuthenticated) {
      console.warn('需要登录才能添加工具')
      return
    }

    const newTool: Tool = {
      ...toolData,
      id: Date.now().toString(),
      clickCount: 0,
      lastAccessed: new Date(),
      createdAt: new Date(),
      isPinned: false,
      pinnedPosition: undefined
    }

    updateTools(prev => [...prev, newTool])
  }

  const updateTool = (id: string, updates: Partial<Tool>) => {
    if (!isAuthenticated) {
      console.warn('需要登录才能修改工具')
      return
    }

    updateTools(prev => prev.map(tool =>
      tool.id === id ? { ...tool, ...updates } : tool
    ))
  }

  const deleteTool = (id: string) => {
    if (!isAuthenticated) {
      console.warn('需要登录才能删除工具')
      return
    }

    updateTools(prev => prev.filter(tool => tool.id !== id))
  }

  // 记录点击（所有用户都可以）
  const recordClick = (id: string) => {
    updateTools(prev => prev.map(tool =>
      tool.id === id
        ? {
            ...tool,
            clickCount: tool.clickCount + 1,
            lastAccessed: new Date()
          }
        : tool
    ))
  }

  // 切换收藏/固定状态（仅登录用户）
  const togglePin = (id: string) => {
    if (!isAuthenticated) {
      console.warn('需要登录才能收藏工具')
      return
    }

    updateTools(prev => prev.map(tool =>
      tool.id === id ? { ...tool, isPinned: !tool.isPinned } : tool
    ))
  }

  const togglePinPosition = (id: string) => {
    if (!isAuthenticated) {
      console.warn('需要登录才能固定工具位置')
      return
    }

    updateTools(prev => {
      const currentTool = prev.find(tool => tool.id === id)
      if (!currentTool) return prev

      if (currentTool.pinnedPosition !== undefined) {
        // 取消固定位置
        return prev.map(tool =>
          tool.id === id ? { ...tool, pinnedPosition: undefined } : tool
        )
      } else {
        // 固定到当前位置
        const currentPosition = filteredTools.findIndex(tool => tool.id === id)
        return prev.map(tool =>
          tool.id === id ? { ...tool, pinnedPosition: currentPosition >= 0 ? currentPosition : 0 } : tool
        )
      }
    })
  }

  // 批量操作（仅登录用户）
  const deleteMultiple = (ids: string[]) => {
    if (!isAuthenticated) return
    updateTools(prev => prev.filter(tool => !ids.includes(tool.id)))
  }

  const updateToolsCategory = (ids: string[], category: string) => {
    if (!isAuthenticated) return
    updateTools(prev => prev.map(tool =>
      ids.includes(tool.id) ? { ...tool, category } : tool
    ))
  }

  return {
    // 数据
    tools: paginatedTools,
    allTools: currentTools,
    allFilteredTools: filteredTools,
    categories,

    // 状态
    isLoading: isLoadingUserData || isCategoriesLoading,
    isDataLoaded: (!isAuthenticated || isUserDataLoaded),
    isLoadingDefaults: !isAuthenticated && isLoadingSystemDefaults,

    // 过滤和搜索
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,

    // 分页
    currentPage,
    pageSize,
    totalTools,
    totalPages,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changePageSize,

    // 视图模式
    viewMode,
    setViewMode,

    // 工具操作
    addTool,
    updateTool,
    deleteTool,
    recordClick,
    togglePin,
    togglePinPosition,
    deleteMultiple,
    updateToolsCategory,

    // 分类管理
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryToolCount,
    canManageCategory,
    categoriesError,
    clearCategoriesError,

    // 数据同步
    refreshUserData: loadUserData
  }
}