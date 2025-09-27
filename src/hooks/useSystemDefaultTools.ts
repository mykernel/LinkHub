/**
 * 系统默认工具获取 Hook
 * 供所有用户使用，获取管理员配置的默认工具
 */

import { useState, useEffect } from 'react'
import { Tool } from '@/lib/types'
import defaultToolsData from '@/data/defaultTools.json'

interface SystemDefaultToolsResult {
  tools: Tool[]
  isLoading: boolean
  error: string | null
  usingSystemConfig: boolean // 是否使用系统配置
}

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api'

export function useSystemDefaultTools(): SystemDefaultToolsResult {
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingSystemConfig, setUsingSystemConfig] = useState(false)

  useEffect(() => {
    loadSystemDefaultTools()
  }, [])

  const loadSystemDefaultTools = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 尝试获取系统配置的默认工具 (使用公开API)
      const response = await fetch(`${API_BASE}/default-tools`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()

        if (data.success && data.tools && data.tools.length > 0) {
          // 使用系统配置的工具
          const systemTools = data.tools.map((tool: any) => ({
            ...tool,
            lastAccessed: new Date(tool.lastAccessed),
            createdAt: new Date(tool.createdAt)
          }))

          setTools(systemTools)
          setUsingSystemConfig(true)

          if (import.meta.env.DEV) {
            console.log('✅ 使用系统配置的默认工具', { count: systemTools.length })
          }
        } else {
          // 系统配置为空，使用静态默认数据
          useStaticDefaults()
        }
      } else {
        // API调用失败，使用静态默认数据
        useStaticDefaults()
      }
    } catch (error) {
      // 网络错误等，使用静态默认数据
      if (import.meta.env.DEV) {
        console.log('⚠️ 系统配置加载失败，使用静态默认数据', error)
      }
      useStaticDefaults()
    } finally {
      setIsLoading(false)
    }
  }

  const useStaticDefaults = () => {
    // 使用静态默认数据
    const staticTools = defaultToolsData.map(tool => ({
      ...tool,
      lastAccessed: new Date(tool.lastAccessed),
      createdAt: new Date(tool.createdAt)
    }))

    setTools(staticTools)
    setUsingSystemConfig(false)

    if (import.meta.env.DEV) {
      console.log('📁 使用静态默认数据', { count: staticTools.length })
    }
  }

  return {
    tools,
    isLoading,
    error,
    usingSystemConfig
  }
}