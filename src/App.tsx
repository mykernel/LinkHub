import { useMemo } from 'react'
import { useTools } from '@/hooks/useTools'
import { ToolCard } from '@/components/ToolCard'
import { CategoryNav } from '@/components/CategoryNav'
import { SearchBar } from '@/components/SearchBar'
import { AddToolDialog } from '@/components/AddToolDialog'
import { Button } from '@/components/ui/button'
import './App.css'

function App() {
  const {
    tools,
    allTools,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    recordClick,
    togglePin,
    addTool
  } = useTools()

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
            <AddToolDialog
              categories={categories}
              onAddTool={addTool}
            />
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
              <div className="mb-6">
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  placeholder="搜索工具名称或描述..."
                />
              </div>

              {tools.length === 0 ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {tools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      onRecordClick={recordClick}
                      onTogglePin={togglePin}
                    />
                  ))}
                </div>
              )}

              {tools.length > 0 && (
                <div className="mt-8 text-center text-sm text-muted-foreground">
                  显示 {tools.length} 个工具
                  {selectedCategory !== 'all' && (
                    <span> • 分类: {categories.find(c => c.id === selectedCategory)?.name}</span>
                  )}
                  {searchQuery && (
                    <span> • 搜索: "{searchQuery}"</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App