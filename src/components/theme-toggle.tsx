import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'light') {
      return (
        <Sun className={cn(
          "h-4 w-4 transition-all duration-500 ease-out",
          "rotate-0 scale-100 drop-shadow-sm",
          "group-hover:rotate-12 group-hover:scale-110"
        )} />
      )
    } else {
      return (
        <Moon className={cn(
          "h-4 w-4 transition-all duration-500 ease-out",
          "rotate-0 scale-100 drop-shadow-sm",
          "group-hover:-rotate-12 group-hover:scale-110"
        )} />
      )
    }
  }

  const getTooltip = () => {
    if (theme === 'light') {
      return '切换到暗色模式'
    } else {
      return '切换到亮色模式'
    }
  }

  const getBadgeText = () => {
    if (theme === 'light') return 'Light'
    return 'Dark'
  }

  return (
    <div className="flex items-center gap-2">
      {/* 主题指示器 */}
      <div className="hidden sm:flex items-center">
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-md transition-all duration-200",
          "bg-muted/50 text-muted-foreground border",
          "group-hover:bg-muted group-hover:text-foreground"
        )}>
          {getBadgeText()}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title={getTooltip()}
        className={cn(
          "h-9 w-9 relative group",
          "hover:bg-accent/80 hover:text-accent-foreground",
          "active:scale-95 transition-all duration-200",
          "focus:ring-2 focus:ring-primary/50 focus:outline-none"
        )}
      >
        {/* 背景动画效果 */}
        <div className={cn(
          "absolute inset-0 rounded-md transition-all duration-300",
          "bg-gradient-to-br opacity-0 group-hover:opacity-10",
          theme === 'light' && "from-yellow-400 to-orange-500",
          theme === 'dark' && "from-blue-600 to-indigo-700"
        )} />

        {/* 图标容器 */}
        <div className="relative z-10 transition-transform duration-200 group-active:scale-90">
          {getIcon()}
        </div>

        <span className="sr-only">切换主题</span>
      </Button>
    </div>
  )
}