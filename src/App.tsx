import { useMemo } from 'react'
import { useTools } from '@/hooks/useTools'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ToolCard } from '@/components/ToolCard'
import { CategoryNav } from '@/components/CategoryNav'
import { SearchBar } from '@/components/SearchBar'
import { AddToolDialog } from '@/components/AddToolDialog'
import { Pagination } from '@/components/Pagination'
import { ThemeToggle } from '@/components/theme-toggle'
import { ViewModeToggle } from '@/components/ViewModeToggle'
import { Button } from '@/components/ui/button'
import './App.css'

function App() {

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
    setViewMode
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">运维导航页面</h1>
              <p className="text-muted-foreground mt-2">
                快速访问运维工具和系统 • 共 {allTools.length} 个工具
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AddToolDialog
                categories={categories}
                onAddTool={addTool}
              />
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

              {allFilteredTools.length === 0 ? (
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
    </div>
  )
}

export default App