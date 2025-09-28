import { useMemo, useState } from 'react'
import { useTools } from '@/hooks/useTools'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAuth } from '@/contexts/AuthContext'
import { ToolCard } from '@/components/ToolCard'
import { ToolCardSkeleton } from '@/components/ToolCardSkeleton'
import { CategoryNav } from '@/components/CategoryNav'
import { SearchBar } from '@/components/SearchBar'
import { AddToolDialog } from '@/components/AddToolDialog'
import { LoginDialog } from '@/components/LoginDialog'
import { Pagination } from '@/components/Pagination'
import { ThemeToggle } from '@/components/theme-toggle'
import { ViewModeToggle } from '@/components/ViewModeToggle'
import { AdminLayout } from '@/components/AdminLayout'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut, User } from 'lucide-react'
import './App.css'

function App() {
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const {
    tools,
    allTools,
    allFilteredTools,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    recordClick,
    togglePin,
    togglePinPosition,
    addTool,
    deleteTool,
    // Pagination
    currentPage,
    pageSize,
    totalTools,
    totalPages,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changePageSize,
    // View mode
    viewMode,
    setViewMode,
    // Category management
    createCategory,
    updateCategory,
    deleteCategory,
    canManageCategory,
    updateToolsCategory,
    // Loading states
    isLoadingDefaults
  } = useTools()

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearchFocus: () => {
      // TODO: Implement search focus after fixing SearchBar forwardRef issue
      console.log('Search focus shortcut pressed')
    },
    onEscape: () => {
      // Clear search when pressing Escape
      if (searchQuery) {
        setSearchQuery('')
      }
    },
    categories: categories.slice(0, 9), // Only support shortcuts for first 9 categories
    onCategorySelect: setSelectedCategory
  })

  // 包装删除分类函数，处理工具移动
  const handleDeleteCategory = async (id: string, targetCategoryId?: string) => {
    // 先找到该分类下的所有工具
    const toolsInCategory = allTools.filter(tool => tool.category === id)
    console.log('🔥 App.handleDeleteCategory 被调用！', { id, targetCategoryId, toolsCount: toolsInCategory.length })

    // 如果有工具且有目标分类，先移动工具
    if (toolsInCategory.length > 0 && targetCategoryId) {
      const toolIds = toolsInCategory.map(tool => tool.id)
      console.log('🔄 正在移动工具：', { toolIds, from: id, to: targetCategoryId })
      updateToolsCategory(toolIds, targetCategoryId)
      console.log(`✅ 已在前端移动 ${toolsInCategory.length} 个工具`)
    }

    // 然后删除分类
    const result = await deleteCategory(id, targetCategoryId)

    // 返回实际移动的工具数量
    if (result.success) {
      return {
        ...result,
        movedTools: toolsInCategory.length
      }
    }

    return result
  }

  // Calculate tool counts for each category
  const toolCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    categories.forEach(category => {
      if (category.id === 'all') {
        counts[category.id] = allTools.length
      } else if (category.id === 'favorites') {
        counts[category.id] = allTools.filter(tool => tool.isPinned).length
      } else {
        counts[category.id] = allTools.filter(tool => tool.category === category.id).length
      }
    })

    return counts
  }, [allTools, categories])


  // Admin用户直接显示管理界面
  if (isAuthenticated && user?.username === 'admin') {
    return <AdminLayout />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">LinkHub - 智能书签管理</h1>
              <p className="text-muted-foreground mt-2">
                {isAuthenticated ? (
                  <>
                    欢迎回来，{user?.username} • 共 {allTools.length} 个书签
                  </>
                ) : (
                  <>
                    快速访问收藏的网站链接 • 共 {allTools.length} 个书签 •
                    <span className="text-orange-500 ml-1">登录后可管理书签</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />

              {/* 用户认证按钮 */}
              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLoginDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {user?.username}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    注销
                  </Button>
                  <AddToolDialog
                    categories={categories}
                    onAddTool={addTool}
                  />
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowLoginDialog(true)}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <LogIn className="h-4 w-4" />
                  {isLoading ? '加载中...' : '登录'}
                </Button>
              )}
            </div>
          </div>
        </header>

        <main>
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-64 flex-shrink-0">
              <CategoryNav
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                toolCounts={toolCounts}
                allTools={allTools}
                onCreateCategory={createCategory}
                onUpdateCategory={updateCategory}
                onDeleteCategory={handleDeleteCategory}
                canManageCategory={canManageCategory}
              />
            </aside>

            <div className="flex-1 min-w-0">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex-1">
                  <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    placeholder="搜索工具名称或描述..."
                  />
                </div>
                <ViewModeToggle
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </div>

              {isLoadingDefaults ? (
                // 显示骨架屏，避免闪烁
                <ToolCardSkeleton viewMode={viewMode} count={8} />
              ) : allFilteredTools.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    {searchQuery ? '未找到匹配的工具' : '当前分类下暂无工具'}
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
                  {tools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      onRecordClick={recordClick}
                      onTogglePin={togglePin}
                      onTogglePinPosition={togglePinPosition}
                      onDelete={deleteTool}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}

              {allFilteredTools.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalTools}
                  pageSize={pageSize}
                  onPageChange={goToPage}
                  onPageSizeChange={changePageSize}
                  onPrevPage={goToPrevPage}
                  onNextPage={goToNextPage}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* 登录对话框 */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />
    </div>
  )
}

export default App