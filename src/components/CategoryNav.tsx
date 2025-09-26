import { Category } from '@/lib/types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn } from '@/lib/utils'

interface CategoryNavProps {
  categories: Category[]
  selectedCategory: string
  onSelectCategory: (categoryId: string) => void
  toolCounts?: Record<string, number>
}

export function CategoryNav({
  categories,
  selectedCategory,
  onSelectCategory,
  toolCounts = {}
}: CategoryNavProps) {
  return (
    <Card className="dark:bg-surface dark:border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">分类导航</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <nav className="space-y-1">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-left font-normal transition-all duration-200",
                "hover:bg-accent/80 dark:hover:bg-surface-highlight",
                selectedCategory === category.id && "bg-primary text-primary-foreground shadow-sm"
              )}
              onClick={() => onSelectCategory(category.id)}
            >
              <span className="mr-2">{category.icon}</span>
              <span className="flex-1 truncate">{category.name}</span>
              {toolCounts[category.id] !== undefined && (
                <span className={cn(
                  "ml-2 px-2 py-0.5 text-xs rounded-full",
                  selectedCategory === category.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {toolCounts[category.id]}
                </span>
              )}
            </Button>
          ))}
        </nav>
      </CardContent>
    </Card>
  )
}