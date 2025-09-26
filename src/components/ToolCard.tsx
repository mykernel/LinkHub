import { useState } from 'react'
import { ExternalLink, Copy, Star, StarOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tool } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  tool: Tool
  onRecordClick: (id: string) => void
  onTogglePin: (id: string) => void
  onEdit?: (tool: Tool) => void
  onDelete?: (id: string) => void
}

export function ToolCard({
  tool,
  onRecordClick,
  onTogglePin,
  onEdit,
  onDelete
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

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20",
        tool.isPinned && "ring-2 ring-primary/20 border-primary/30"
      )}
      onClick={handleVisit}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-lg flex-shrink-0">{tool.icon}</span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{tool.name}</CardTitle>
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {tool.description}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0"
            onClick={handlePin}
          >
            {tool.isPinned ? (
              <Star className="h-4 w-4 fill-current text-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>点击 {tool.clickCount} 次</span>
            {tool.lastAccessed && (
              <span>
                最近访问: {new Date(tool.lastAccessed).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                handleVisit()
              }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
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