import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest
} from '@/lib/types'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import { getTokenFromStorage } from '@/lib/auth'
import { fetchWithRetry, retryPresets } from '@/lib/api-retry'

// API基础路径 - 与认证模块保持一致
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3001'
  : ''

export function useCategories() {
  const { isAuthenticated } = useAuth()

  // 内部API请求函数 - 带重试机制
  const apiRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const tokenData = getTokenFromStorage()
    const token = tokenData?.token

    // ✅ 正确的做法：先构造headers对象，避免被options.headers覆盖
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers
    }

    const fetchOptions = {
      ...options,
      headers
    }

    // 使用重试机制进行请求
    const response = await fetchWithRetry(`${API_BASE}${url}`, fetchOptions, {
      ...retryPresets.standard,
      onRetry: (attempt, error) => {
        console.warn(`分类API重试中 (${attempt}/${retryPresets.standard.maxRetries}):`, error?.message)
      }
    })

    if (!response.ok) {
      const errorText = response.status === 502
        ? '服务暂时不可用，请稍后重试'
        : `HTTP error! status: ${response.status}`
      throw new Error(errorText)
    }

    return response.json()
  }, [])

  // 状态管理
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // 分类缓存键名
  const CACHE_KEY = `linkhub-categories-${isAuthenticated ? 'user' : 'guest'}`

  // 从本地缓存加载分类
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const cachedData = JSON.parse(cached)
        const categoriesWithDates = cachedData.map((cat: any) => ({
          ...cat,
          created_at: new Date(cat.created_at),
          updated_at: new Date(cat.updated_at)
        }))
        return categoriesWithDates
      }
    } catch (error) {
      console.warn('Failed to load categories from cache:', error)
    }
    return null
  }, [CACHE_KEY])

  // 保存分类到本地缓存
  const saveToCache = useCallback((categoriesToCache: Category[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(categoriesToCache))
    } catch (error) {
      console.warn('Failed to save categories to cache:', error)
    }
  }, [CACHE_KEY])

  // 获取分类列表
  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) {
      // 未登录用户只显示默认分类
      setCategories(DEFAULT_CATEGORIES)
      setIsDataLoaded(true)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await apiRequest('/api/categories', {
        method: 'GET'
      })

      if (response.success) {
        // 转换日期字段
        const categoriesWithDates = response.categories.map((cat: any) => ({
          ...cat,
          created_at: new Date(cat.created_at),
          updated_at: new Date(cat.updated_at)
        }))

        setCategories(categoriesWithDates)
        // 成功获取后保存到缓存
        saveToCache(categoriesWithDates)
        setIsDataLoaded(true)
      } else {
        console.error('Failed to fetch categories:', response.error)
        setError(response.error || '获取分类失败')

        // 优先使用缓存，避免丢失用户设置
        const cachedCategories = loadFromCache()
        if (cachedCategories) {
          console.log('📋 使用缓存的分类数据，避免丢失用户设置')
          setCategories(cachedCategories)
        } else {
          console.log('📋 无缓存数据，回退到默认分类')
          setCategories(DEFAULT_CATEGORIES)
        }
        setIsDataLoaded(true)
      }
    } catch (error) {
      console.error('Fetch categories error:', error)
      const errorMsg = error instanceof Error && error.message.includes('502')
        ? '服务暂时不可用，请稍后重试'
        : error instanceof Error ? error.message : '网络错误，请重试'
      setError(errorMsg)

      // 网络错误时也优先使用缓存
      const cachedCategories = loadFromCache()
      if (cachedCategories) {
        console.log('📋 网络错误，使用缓存的分类数据')
        setCategories(cachedCategories)
      } else {
        console.log('📋 网络错误且无缓存，回退到默认分类')
        setCategories(DEFAULT_CATEGORIES)
      }
      setIsDataLoaded(true)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, apiRequest])

  // 创建分类
  const createCategory = useCallback(async (data: CreateCategoryRequest): Promise<{ success: boolean; error?: string; category?: Category }> => {
    if (!isAuthenticated) {
      return { success: false, error: '需要登录才能创建分类' }
    }

    setError(null)

    try {
      const response = await apiRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (response.success) {
        // 转换日期字段
        const newCategory = {
          ...response.category,
          created_at: new Date(response.category.created_at),
          updated_at: new Date(response.category.updated_at)
        }

        // 乐观更新：立即添加到本地状态
        const updatedCategories = [...categories, newCategory]
        setCategories(updatedCategories)
        // 同步更新缓存
        saveToCache(updatedCategories)

        return { success: true, category: newCategory }
      } else {
        setError(response.error || '创建分类失败')
        return { success: false, error: response.error || '创建分类失败' }
      }
    } catch (error) {
      console.error('Create category error:', error)
      const errorMsg = error instanceof Error && error.message.includes('502')
        ? '服务暂时不可用，请稍后重试'
        : error instanceof Error ? error.message : '网络错误，请重试'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [isAuthenticated, apiRequest])

  // 更新分类
  const updateCategory = useCallback(async (id: string, data: UpdateCategoryRequest): Promise<{ success: boolean; error?: string; category?: Category }> => {
    if (!isAuthenticated) {
      return { success: false, error: '需要登录才能更新分类' }
    }

    setError(null)

    try {
      const response = await apiRequest(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })

      if (response.success) {
        // 转换日期字段
        const updatedCategory = {
          ...response.category,
          created_at: new Date(response.category.created_at),
          updated_at: new Date(response.category.updated_at)
        }

        // 乐观更新：立即更新本地状态
        const updatedCategories = categories.map(cat =>
          cat.id === id ? updatedCategory : cat
        )
        setCategories(updatedCategories)
        // 同步更新缓存
        saveToCache(updatedCategories)

        return { success: true, category: updatedCategory }
      } else {
        setError(response.error || '更新分类失败')
        return { success: false, error: response.error || '更新分类失败' }
      }
    } catch (error) {
      console.error('Update category error:', error)
      const errorMsg = error instanceof Error && error.message.includes('502')
        ? '服务暂时不可用，请稍后重试'
        : error instanceof Error ? error.message : '网络错误，请重试'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [isAuthenticated, apiRequest])

  // 删除分类
  const deleteCategory = useCallback(async (id: string, targetCategoryId?: string): Promise<{ success: boolean; error?: string; movedTools?: number }> => {
    console.log('🔥 删除分类函数被调用！', { id, targetCategoryId, isAuthenticated })

    if (!isAuthenticated) {
      return { success: false, error: '需要登录才能删除分类' }
    }

    setError(null)

    try {
      const url = `/api/categories/${id}${targetCategoryId ? `?target_category_id=${targetCategoryId}` : ''}`
      console.log('🌐 即将发送DELETE请求到：', url)

      const response = await apiRequest(url, {
        method: 'DELETE'
      })

      console.log('✅ DELETE请求响应：', response)

      if (response.success) {
        // 乐观更新：立即从本地状态中移除
        const updatedCategories = categories.filter(cat => cat.id !== id)
        setCategories(updatedCategories)
        // 关键：同步更新缓存，保存用户的删除操作
        saveToCache(updatedCategories)

        return {
          success: true,
          movedTools: response.moved_tools
        }
      } else {
        setError(response.error || '删除分类失败')
        return { success: false, error: response.error || '删除分类失败' }
      }
    } catch (error) {
      console.error('❌ Delete category error:', error)
      const errorMsg = error instanceof Error && error.message.includes('502')
        ? '服务暂时不可用，请稍后重试'
        : error instanceof Error ? error.message : '网络错误，请重试'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [isAuthenticated, apiRequest])

  // 获取指定分类下的工具数量（需要配合useTools使用）
  const getCategoryToolCount = useCallback((categoryId: string, tools: any[]) => {
    if (categoryId === 'all') {
      return tools.length
    } else if (categoryId === 'favorites') {
      return tools.filter(tool => tool.isPinned).length
    } else {
      return tools.filter(tool => tool.category === categoryId).length
    }
  }, [])

  // 检查分类是否可以编辑/删除
  const canManageCategory = useCallback((category: Category) => {
    // 只保护核心功能分类，其他系统分类可以管理
    return isAuthenticated && category.id !== 'all' && category.id !== 'favorites'
  }, [isAuthenticated])

  // 初始化时优先从缓存加载，提高启动速度
  useEffect(() => {
    if (!isDataLoaded) {
      // 如果已登录，先尝试从缓存加载，然后再从API获取最新数据
      if (isAuthenticated) {
        const cachedCategories = loadFromCache()
        if (cachedCategories) {
          console.log('🚀 启动时从缓存加载分类数据')
          setCategories(cachedCategories)
          setIsDataLoaded(true)
          // 后台静默更新
          fetchCategories()
        } else {
          fetchCategories()
        }
      } else {
        fetchCategories()
      }
    }
  }, [isDataLoaded, isAuthenticated, fetchCategories, loadFromCache])

  // 当认证状态改变时重新加载和清理缓存
  useEffect(() => {
    setIsDataLoaded(false)
    // 认证状态变化时清理旧缓存
    if (!isAuthenticated) {
      try {
        localStorage.removeItem(CACHE_KEY)
        console.log('🧹 已清理分类缓存')
      } catch (error) {
        console.warn('清理分类缓存失败:', error)
      }
    }
  }, [isAuthenticated, CACHE_KEY])

  return {
    // 数据
    categories,
    isLoading,
    error,
    isDataLoaded,

    // 方法
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // 工具方法
    getCategoryToolCount,
    canManageCategory,

    // 清除错误
    clearError: () => setError(null)
  }
}