import { useState, useEffect, useMemo } from 'react'
import { Tool, SortOption } from '../lib/types'
import { STORAGE_KEYS, DEFAULT_CATEGORIES } from '../lib/constants'
import { useLocalStorage } from './useLocalStorage'
import defaultToolsData from '../data/defaultTools.json'

export function useTools() {
  const [storedTools, setStoredTools] = useLocalStorage<Tool[]>(STORAGE_KEYS.TOOLS, defaultToolsData.map(tool => ({
    ...tool,
    lastAccessed: new Date(tool.lastAccessed),
    createdAt: new Date(tool.createdAt)
  })))

  // Ensure dates are always Date objects when reading from localStorage
  const tools = useMemo(() => {
    return storedTools.map(tool => ({
      ...tool,
      lastAccessed: tool.lastAccessed instanceof Date ? tool.lastAccessed : new Date(tool.lastAccessed),
      createdAt: tool.createdAt instanceof Date ? tool.createdAt : new Date(tool.createdAt)
    }))
  }, [storedTools])

  const setTools = (value: Tool[] | ((prev: Tool[]) => Tool[])) => {
    setStoredTools(value)
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('clicks')

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    let filtered = tools

    // Filter by category
    if (selectedCategory === 'favorites') {
      filtered = filtered.filter(tool => tool.isPinned)
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query)
      )
    }

    // Sort tools (removed pinned priority to allow proper click-based sorting)
    filtered.sort((a, b) => {
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

    return filtered
  }, [tools, searchQuery, selectedCategory, sortBy])

  // Add new tool
  const addTool = (toolData: Omit<Tool, 'id' | 'clickCount' | 'lastAccessed' | 'createdAt' | 'isPinned'>) => {
    const newTool: Tool = {
      ...toolData,
      id: Date.now().toString(),
      clickCount: 0,
      lastAccessed: new Date(),
      createdAt: new Date(),
      isPinned: false
    }
    setTools(prev => [...prev, newTool])
  }

  // Update tool
  const updateTool = (id: string, updates: Partial<Tool>) => {
    setTools(prev => prev.map(tool =>
      tool.id === id ? { ...tool, ...updates } : tool
    ))
  }

  // Delete tool
  const deleteTool = (id: string) => {
    setTools(prev => prev.filter(tool => tool.id !== id))
  }

  // Record tool click
  const recordClick = (id: string) => {
    setTools(prev => prev.map(tool =>
      tool.id === id
        ? {
            ...tool,
            clickCount: tool.clickCount + 1,
            lastAccessed: new Date()
          }
        : tool
    ))
  }

  // Toggle pin status
  const togglePin = (id: string) => {
    setTools(prev => prev.map(tool =>
      tool.id === id ? { ...tool, isPinned: !tool.isPinned } : tool
    ))
  }

  // Batch operations
  const deleteMultiple = (ids: string[]) => {
    setTools(prev => prev.filter(tool => !ids.includes(tool.id)))
  }

  const updateCategory = (ids: string[], category: string) => {
    setTools(prev => prev.map(tool =>
      ids.includes(tool.id) ? { ...tool, category } : tool
    ))
  }

  return {
    // Data
    tools: filteredTools,
    allTools: tools,
    categories: DEFAULT_CATEGORIES,

    // Filters and search
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,

    // Actions
    addTool,
    updateTool,
    deleteTool,
    recordClick,
    togglePin,
    deleteMultiple,
    updateCategory
  }
}