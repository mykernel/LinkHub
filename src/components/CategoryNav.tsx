import { useState } from 'react'
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/lib/types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { CategoryManageDialog } from './CategoryManageDialog'
import { cn } from '@/lib/utils'
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface CategoryNavProps {
  categories: Category[]
  selectedCategory: string
  onSelectCategory: (categoryId: string) => void
  toolCounts?: Record<string, number>
  allTools?: any[]
  onCreateCategory?: (data: CreateCategoryRequest) => Promise<{ success: boolean; error?: string }>
  onUpdateCategory?: (id: string, data: UpdateCategoryRequest) => Promise<{ success: boolean; error?: string }>
  onDeleteCategory?: (id: string, targetCategoryId?: string) => Promise<{ success: boolean; error?: string; movedTools?: number }>
  canManageCategory?: (category: Category) => boolean
}

export function CategoryNav({
  categories,
  selectedCategory,
  onSelectCategory,
  toolCounts = {},
  allTools = [],
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  canManageCategory
}: CategoryNavProps) {
  const { isAuthenticated } = useAuth()

  // 对话框状态管理
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<Category | null>(null)
  const [selectedCategoryForDelete, setSelectedCategoryForDelete] = useState<Category | null>(null)

  return (
    <>
    <Card className="dark:bg-surface dark:border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">分类导航</CardTitle>
          {isAuthenticated && onCreateCategory && (
            <CategoryManageDialog
              operation="create"
              categories={categories}
              allTools={allTools}
              onCreateCategory={onCreateCategory}
              onUpdateCategory={onUpdateCategory!}
              onDeleteCategory={onDeleteCategory!}
              canManageCategory={canManageCategory!}
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <nav className="space-y-1">
          {categories.map((category) => (
            <div key={category.id} className="group relative">
              <Button
                variant={selectedCategory === category.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-left font-normal transition-all duration-200",
                  "hover:bg-accent/80 dark:hover:bg-surface-highlight",
                  selectedCategory === category.id && "bg-primary text-primary-foreground shadow-sm",
                  isAuthenticated && "pr-8"
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

              {/* 管理按钮 - 对所有已认证用户显示 */}
              {isAuthenticated && canManageCategory && canManageCategory(category) && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-accent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="right">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedCategoryForEdit(category)
                          setEditDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive cursor-pointer"
                        onClick={() => {
                          console.log('🔥 删除按钮被点击，分类：', category.name)
                          setSelectedCategoryForDelete(category)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </nav>
      </CardContent>
    </Card>

    {/* 独立的编辑对话框 */}
    {selectedCategoryForEdit && onUpdateCategory && (
      <CategoryManageDialog
        operation="edit"
        category={selectedCategoryForEdit}
        categories={categories}
        allTools={allTools}
        onCreateCategory={onCreateCategory!}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory!}
        canManageCategory={canManageCategory!}
        trigger={null}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setSelectedCategoryForEdit(null)
          }
        }}
      />
    )}

    {/* 独立的删除对话框 */}
    {selectedCategoryForDelete && onDeleteCategory && (
      <CategoryManageDialog
        operation="delete"
        category={selectedCategoryForDelete}
        categories={categories}
        allTools={allTools}
        onCreateCategory={onCreateCategory!}
        onUpdateCategory={onUpdateCategory!}
        onDeleteCategory={onDeleteCategory}
        canManageCategory={canManageCategory!}
        trigger={null}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          console.log('🔥 删除对话框状态变化：', open)
          setDeleteDialogOpen(open)
          if (!open) {
            setSelectedCategoryForDelete(null)
          }
        }}
      />
    )}
  </>
  )
}