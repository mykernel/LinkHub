import { useState } from 'react'
import { Copy, Star, StarOff, Trash2, Pin, PinOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tool } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  tool: Tool
  onRecordClick: (id: string) => void
  onTogglePin: (id: string) => void
  onTogglePinPosition: (id: string) => void
  onEdit?: (tool: Tool) => void
  onDelete?: (id: string) => void
  viewMode?: 'grid' | 'list'
}

export function ToolCard({
  tool,
  onRecordClick,
  onTogglePin,
  onTogglePinPosition,
  onEdit: _onEdit,
  onDelete,
  viewMode = 'grid'
}: ToolCardProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleVisit = () => {
    onRecordClick(tool.id)
    window.open(tool.url, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(tool.url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation()
    onTogglePin(tool.id)
  }

  const handlePinPosition = (e: React.MouseEvent) => {
    e.stopPropagation()
    onTogglePinPosition(tool.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && confirm(`确定要删除工具 "${tool.name}" 吗？此操作无法撤销。`)) {
      onDelete(tool.id)
    }
  }

  if (viewMode === 'list') {
    // List view - horizontal layout
    return (
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:shadow-primary/5 hover:border-primary/20",
          "dark:hover:shadow-lg dark:hover:shadow-primary/10 dark:hover:border-primary/30",
          "dark:bg-surface-elevated dark:border-border/50",
          tool.isPinned && "ring-2 ring-primary/20 border-primary/30 dark:ring-primary/30"
        )}
        onClick={handleVisit}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon and info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xl flex-shrink-0">{tool.icon}</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium truncate">{tool.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{tool.description}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span>点击 {tool.clickCount} 次</span>
              {tool.lastAccessed && (
                <span>
                  最近访问: {new Date(tool.lastAccessed).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 transition-opacity",
                  tool.isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={handlePin}
              >
                {tool.isPinned ? (
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 transition-opacity",
                  tool.pinnedPosition !== undefined ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={handlePinPosition}
              >
                {tool.pinnedPosition !== undefined ? (
                  <Pin className="h-4 w-4 fill-current text-blue-500" />
                ) : (
                  <PinOff className="h-4 w-4" />
                )}
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {isCopied && (
            <div className="mt-2 text-xs text-green-600 animate-in fade-in-0">
              链接已复制到剪贴板
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Grid view - fixed layout with better space utilization
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:shadow-primary/5 hover:border-primary/20",
        "dark:hover:shadow-lg dark:hover:shadow-primary/10 dark:hover:border-primary/30",
        "dark:bg-surface-elevated dark:border-border/50",
        tool.isPinned && "ring-2 ring-primary/20 border-primary/30 dark:ring-primary/30"
      )}
      onClick={handleVisit}
    >
      <div className="flex p-4">
        {/* 左侧内容区 - 优化后的4排结构 */}
        <div className="flex-1 min-w-0 pr-4">
          {/* 第一排：图标 + 名称 - 16px半粗 */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl flex-shrink-0">{tool.icon}</span>
            <CardTitle className="text-base font-semibold truncate leading-tight">{tool.name}</CardTitle>
          </div>

          {/* 第二排：描述 - 14px常规 */}
          <div className="mb-4">
            <CardDescription className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {tool.description}
            </CardDescription>
          </div>

          {/* 第三、四排：辅助信息分组 - 12px */}
          <div className="bg-muted/30 dark:bg-muted/20 rounded-lg p-3 space-y-2">
            {/* 第三排：更新时间 */}
            {tool.lastAccessed && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground/80">最近访问:</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(tool.lastAccessed).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* 第四排：访问次数 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground/80">访问次数:</span>
              <span className="text-xs text-muted-foreground">
                {tool.clickCount} 次
              </span>
            </div>
          </div>

          {/* 复制提示 */}
          {isCopied && (
            <div className="mt-3 text-xs text-green-600 animate-in fade-in-0">
              链接已复制到剪贴板
            </div>
          )}
        </div>

        {/* 右侧操作区 - 优化后的竖排 */}
        <div className="flex flex-col items-center justify-start gap-2 pt-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 transition-all duration-200 hover:scale-105",
              tool.isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={handlePin}
            title={tool.isPinned ? "取消收藏" : "收藏工具"}
          >
            {tool.isPinned ? (
              <Star className="h-4 w-4 fill-current text-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 hover:scale-105"
            onClick={handleCopy}
            title="复制链接"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 transition-all duration-200 hover:scale-105",
              tool.pinnedPosition !== undefined ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={handlePinPosition}
            title={tool.pinnedPosition !== undefined ? "取消固定位置" : "固定在当前位置"}
          >
            {tool.pinnedPosition !== undefined ? (
              <Pin className="h-4 w-4 fill-current text-blue-500" />
            ) : (
              <PinOff className="h-4 w-4" />
            )}
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 text-destructive hover:text-destructive hover:scale-105"
              onClick={handleDelete}
              title="删除工具"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}