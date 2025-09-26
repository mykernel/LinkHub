import { Grid3x3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ViewModeToggleProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center border rounded-md">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className="rounded-r-none border-r"
        title="网格视图"
      >
        <Grid3x3 className="h-4 w-4" />
        <span className="sr-only">网格视图</span>
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className="rounded-l-none"
        title="列表视图"
      >
        <List className="h-4 w-4" />
        <span className="sr-only">列表视图</span>
      </Button>
    </div>
  )
}