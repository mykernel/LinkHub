/**
 * 系统默认工具管理 Hook
 * 仅供管理员使用，管理系统级默认工具配置
 */

import { useState, useEffect } from 'react'
import { Tool } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

interface DefaultToolsState {
  tools: Tool[]
  version: number
  isLoading: boolean
  error: string | null
}

interface UseDefaultToolsResult extends DefaultToolsState {
  // 数据操作
  loadDefaultTools: () => Promise<void>
  saveDefaultTools: (tools: Tool[]) => Promise<{ success: boolean; error?: string }>
  resetToStaticDefaults: () => Promise<{ success: boolean; error?: string }>

  // 工具操作
  addDefaultTool: (tool: Omit<Tool, 'id' | 'clickCount' | 'lastAccessed' | 'createdAt' | 'isPinned'>) => void
  updateDefaultTool: (id: string, updates: Partial<Tool>) => void
  deleteDefaultTool: (id: string) => void

  // 状态管理
  clearError: () => void
}

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api'

export function useDefaultTools(): UseDefaultToolsResult {
  const { isAuthenticated, user } = useAuth()

  const [state, setState] = useState<DefaultToolsState>({
    tools: [],
    version: 0,
    isLoading: false,
    error: null
  })

  // 仅管理员可使用
  const isAdmin = isAuthenticated && user?.username === 'admin'

  // API 请求辅助函数
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    if (!isAdmin) {
      throw new Error('仅管理员可访问系统默认工具配置')
    }

    const token = user?.token
    if (!token) {
      throw new Error('未找到认证令牌')
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '请求失败' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // 加载系统默认工具
  const loadDefaultTools = async () => {
    if (!isAdmin) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const data = await apiRequest('/admin/default-tools')

      setState(prev => ({
        ...prev,
        tools: data.tools || [],
        version: data.version || 0,
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '加载失败',
        isLoading: false
      }))
    }
  }

  // 保存系统默认工具
  const saveDefaultTools = async (tools: Tool[]) => {
    if (!isAdmin) {
      return { success: false, error: '仅管理员可修改系统默认工具' }
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const data = await apiRequest('/admin/default-tools', {
        method: 'POST',
        body: JSON.stringify({
          tools,
          currentVersion: state.version
        })
      })

      setState(prev => ({
        ...prev,
        tools,
        version: data.version,
        isLoading: false
      }))

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存失败'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }))
      return { success: false, error: errorMessage }
    }
  }

  // 重置为静态默认数据
  const resetToStaticDefaults = async () => {
    if (!isAdmin) {
      return { success: false, error: '仅管理员可重置系统默认工具' }
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      await apiRequest('/admin/default-tools/reset', {
        method: 'POST'
      })

      // 重置后重新加载
      await loadDefaultTools()

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重置失败'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }))
      return { success: false, error: errorMessage }
    }
  }

  // 添加默认工具
  const addDefaultTool = (toolData: Omit<Tool, 'id' | 'clickCount' | 'lastAccessed' | 'createdAt' | 'isPinned'>) => {
    if (!isAdmin) return

    const newTool: Tool = {
      ...toolData,
      id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clickCount: 0,
      lastAccessed: new Date(),
      createdAt: new Date(),
      isPinned: false,
      pinnedPosition: undefined
    }

    setState(prev => ({
      ...prev,
      tools: [...prev.tools, newTool]
    }))
  }

  // 更新默认工具
  const updateDefaultTool = (id: string, updates: Partial<Tool>) => {
    if (!isAdmin) return

    setState(prev => ({
      ...prev,
      tools: prev.tools.map(tool =>
        tool.id === id ? { ...tool, ...updates } : tool
      )
    }))
  }

  // 删除默认工具
  const deleteDefaultTool = (id: string) => {
    if (!isAdmin) return

    setState(prev => ({
      ...prev,
      tools: prev.tools.filter(tool => tool.id !== id)
    }))
  }

  // 清除错误
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  // 初始加载
  useEffect(() => {
    if (isAdmin) {
      loadDefaultTools()
    }
  }, [isAdmin])

  return {
    ...state,
    loadDefaultTools,
    saveDefaultTools,
    resetToStaticDefaults,
    addDefaultTool,
    updateDefaultTool,
    deleteDefaultTool,
    clearError
  }
}