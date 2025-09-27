/**
 * 管理员默认工具管理组件
 * 允许管理员配置系统级默认工具，供所有未登录用户查看
 */

import { useState, useEffect } from 'react'
import { useDefaultTools } from '@/hooks/useDefaultTools'
import { useCategories } from '@/hooks/useCategories'
import { Tool } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToolCard } from '@/components/ToolCard'
import { AddToolDialog } from '@/components/AddToolDialog'
import { SearchBar } from '@/components/SearchBar'
import { ViewModeToggle } from '@/components/ViewModeToggle'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RotateCcw, Save, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminDefaultTools() {
  const {
    tools,
    version,
    isLoading,
    error,
    saveDefaultTools,
    resetToStaticDefaults,
    clearError
  } = useDefaultTools()

  const { categories } = useCategories()

  // 本地状态
  const [localTools, setLocalTools] = useState<Tool[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 同步远程数据到本地
  useEffect(() => {
    setLocalTools(tools)
    setHasUnsavedChanges(false)
  }, [tools])

  // 监听本地变化
  useEffect(() => {
    setHasUnsavedChanges(JSON.stringify(localTools) !== JSON.stringify(tools))
  }, [localTools, tools])

  // 过滤工具
  const filteredTools = localTools.filter(tool =>
    !searchQuery ||
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 处理工具操作
  const handleAddTool = (toolData: Omit<Tool, 'id' | 'clickCount' | 'lastAccessed' | 'createdAt' | 'isPinned'>) => {
    const newTool: Tool = {
      ...toolData,
      id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clickCount: 0,
      lastAccessed: new Date(),
      createdAt: new Date(),
      isPinned: false,
      pinnedPosition: undefined
    }
    setLocalTools(prev => [...prev, newTool])
  }

  const handleUpdateTool = (id: string, updates: Partial<Tool>) => {
    setLocalTools(prev => prev.map(tool =>
      tool.id === id ? { ...tool, ...updates } : tool
    ))
  }

  const handleDeleteTool = (id: string) => {
    setLocalTools(prev => prev.filter(tool => tool.id !== id))
  }

  // 保存更改
  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const result = await saveDefaultTools(localTools)

      if (result.success) {
        setSaveMessage({ type: 'success', text: `成功保存 ${localTools.length} 个默认工具` })
        setHasUnsavedChanges(false)
      } else {
        setSaveMessage({ type: 'error', text: result.error || '保存失败' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: '保存时发生错误' })
    } finally {
      setIsSaving(false)
    }

    // 3秒后清除消息
    setTimeout(() => setSaveMessage(null), 3000)
  }

  // 重置为静态默认数据
  const handleReset = async () => {
    if (!confirm('确定要重置为静态默认工具配置吗？这将清除所有自定义配置。')) {
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const result = await resetToStaticDefaults()

      if (result.success) {
        setSaveMessage({ type: 'success', text: '已重置为静态默认配置' })
      } else {
        setSaveMessage({ type: 'error', text: result.error || '重置失败' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: '重置时发生错误' })
    } finally {
      setIsSaving(false)
    }

    // 3秒后清除消息
    setTimeout(() => setSaveMessage(null), 3000)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>加载系统默认工具...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">默认工具管理</h1>
            <p className="text-muted-foreground mt-1">
              配置系统级默认工具，供所有未登录用户查看
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              版本 {version}
            </Badge>
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="text-xs">
                有未保存更改
              </Badge>
            )}
          </div>
        </div>

        {/* Status Info */}
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            这里配置的工具将作为所有未登录用户的默认工具显示。登录用户仍然使用他们的个人工具配置。
          </AlertDescription>
        </Alert>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              placeholder="搜索默认工具..."
            />
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          <div className="flex items-center gap-2">
            <AddToolDialog
              categories={categories}
              onAddTool={handleAddTool}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              重置
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              保存更改
            </Button>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <Alert className={cn("mt-4", saveMessage.type === 'error' && "border-destructive")}>
            {saveMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription className={saveMessage.type === 'success' ? "text-green-700" : "text-destructive"}>
              {saveMessage.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="mt-4 border-destructive">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
              <Button
                variant="link"
                size="sm"
                onClick={clearError}
                className="ml-2 h-auto p-0 text-destructive"
              >
                清除错误
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Tools List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>默认工具列表</span>
            <Badge variant="outline">{filteredTools.length} 个工具</Badge>
          </CardTitle>
          <CardDescription>
            管理系统级默认工具配置
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTools.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchQuery ? '未找到匹配的工具' : '暂无默认工具'}
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                >
                  清除搜索条件
                </Button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "flex flex-col gap-3"
            }>
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onRecordClick={() => {}} // 管理界面不记录点击
                  onTogglePin={() => {}} // 管理界面不支持收藏
                  onTogglePinPosition={() => {}} // 管理界面不支持位置固定
                  onEdit={(tool) => handleUpdateTool(tool.id, tool)}
                  onDelete={handleDeleteTool}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}