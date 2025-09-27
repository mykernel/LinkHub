/**
 * 工具卡片骨架屏组件
 * 在加载系统默认工具时显示，避免页面闪烁
 */

// import { cn } from '@/lib/utils'

interface ToolCardSkeletonProps {
  viewMode?: 'grid' | 'list'
  count?: number
}

export function ToolCardSkeleton({ viewMode = 'grid', count = 8 }: ToolCardSkeletonProps) {
  const skeletonItems = Array.from({ length: count }, (_, index) => (
    <SkeletonCard key={index} viewMode={viewMode} />
  ))

  return (
    <div className={viewMode === 'grid'
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      : "flex flex-col gap-3"
    }>
      {skeletonItems}
    </div>
  )
}

function SkeletonCard({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="animate-pulse">
        <div className="border rounded-lg p-4 dark:bg-surface-elevated dark:border-border/50">
          <div className="flex items-center gap-4">
            {/* Icon and info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="min-w-0 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-xs">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view skeleton
  return (
    <div className="animate-pulse">
      <div className="border rounded-lg dark:bg-surface-elevated dark:border-border/50">
        <div className="flex p-4">
          {/* 左侧内容区 */}
          <div className="flex-1 min-w-0 pr-4">
            {/* 第一排：图标 + 名称 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            </div>

            {/* 第二排：描述 */}
            <div className="mb-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>

            {/* 第三、四排：辅助信息 */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          </div>

          {/* 右侧操作区 */}
          <div className="flex flex-col items-center justify-start gap-2 pt-1 flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ToolCardSkeleton