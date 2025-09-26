import { useState, useMemo, useEffect } from 'react'
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  // View states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter and sort tools (without pagination)
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

    // Sort tools with pinned tools staying at their original positions
    const pinnedTools = filtered.filter(tool => tool.pinnedPosition !== undefined)
    const unpinnedTools = filtered.filter(tool => tool.pinnedPosition === undefined)

    // Sort unpinned tools according to current sort option
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

    // Create final array with pinned tools at their fixed positions
    const result: Tool[] = []
    let unpinnedIndex = 0

    for (let i = 0; i < filtered.length; i++) {
      // Check if there's a pinned tool that should be at position i
      const pinnedAtThisPosition = pinnedTools.find(tool => tool.pinnedPosition === i)

      if (pinnedAtThisPosition) {
        result[i] = pinnedAtThisPosition
      } else {
        // Fill with next unpinned tool if available
        if (unpinnedIndex < unpinnedTools.length) {
          result[i] = unpinnedTools[unpinnedIndex]
          unpinnedIndex++
        }
      }
    }

    filtered = result.filter(Boolean) // Remove any undefined slots

    return filtered
  }, [tools, searchQuery, selectedCategory, sortBy])

  // Pagination calculations
  const totalTools = filteredTools.length
  const totalPages = Math.ceil(totalTools / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  // Paginated tools
  const paginatedTools = useMemo(() => {
    return filteredTools.slice(startIndex, endIndex)
  }, [filteredTools, startIndex, endIndex])

  // Reset to first page when filters change
  const resetToFirstPage = () => {
    setCurrentPage(1)
  }

  // Auto reset to first page when search, category, or sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, sortBy])

  // Pagination handlers
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
    setCurrentPage(1) // Reset to first page when changing page size
  }

  // Add new tool
  const addTool = (toolData: Omit<Tool, 'id' | 'clickCount' | 'lastAccessed' | 'createdAt' | 'isPinned' | 'pinnedPosition'>) => {
    const newTool: Tool = {
      ...toolData,
      id: Date.now().toString(),
      clickCount: 0,
      lastAccessed: new Date(),
      createdAt: new Date(),
      isPinned: false,
      pinnedPosition: undefined
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

  // Toggle pin position (fix tool to current position in filtered list)
  const togglePinPosition = (id: string) => {
    setTools(prev => {
      const currentTool = prev.find(tool => tool.id === id)
      if (!currentTool) return prev

      if (currentTool.pinnedPosition !== undefined) {
        // Remove pin position
        return prev.map(tool =>
          tool.id === id ? { ...tool, pinnedPosition: undefined } : tool
        )
      } else {
        // Add pin position - find current position in filtered tools
        const currentPosition = filteredTools.findIndex(tool => tool.id === id)
        return prev.map(tool =>
          tool.id === id ? { ...tool, pinnedPosition: currentPosition >= 0 ? currentPosition : 0 } : tool
        )
      }
    })
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
    tools: paginatedTools, // Changed to paginated tools
    allTools: tools,
    allFilteredTools: filteredTools, // All filtered tools without pagination
    categories: DEFAULT_CATEGORIES,

    // Filters and search
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,

    // Pagination
    currentPage,
    pageSize,
    totalTools,
    totalPages,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changePageSize,
    resetToFirstPage,

    // View mode
    viewMode,
    setViewMode,

    // Actions
    addTool,
    updateTool,
    deleteTool,
    recordClick,
    togglePin,
    togglePinPosition,
    deleteMultiple,
    updateCategory
  }
}