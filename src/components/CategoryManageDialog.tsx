import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Category,
  CategoryManageOperation,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CategoryIcon,
  CategoryColor
} from '@/lib/types'

interface CategoryManageDialogProps {
  trigger?: React.ReactNode | null
  operation?: CategoryManageOperation
  category?: Category
  categories: Category[]
  allTools: any[]
  onCreateCategory: (data: CreateCategoryRequest) => Promise<{ success: boolean; error?: string }>
  onUpdateCategory: (id: string, data: UpdateCategoryRequest) => Promise<{ success: boolean; error?: string }>
  onDeleteCategory: (id: string, targetCategoryId?: string) => Promise<{ success: boolean; error?: string; movedTools?: number }>
  canManageCategory: (category: Category) => boolean
  // 外部状态控制props
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CategoryManageDialog({
  trigger,
  operation = 'create',
  category,
  categories,
  allTools,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  canManageCategory,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: CategoryManageDialogProps) {
  const { toast } = useToast()

  // 对话框状态 - 支持外部控制或内部控制
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // 使用外部状态或内部状态
  const isControlledExternally = externalOpen !== undefined
  const open = isControlledExternally ? externalOpen : internalOpen
  const setOpen = isControlledExternally ? (externalOnOpenChange || (() => {})) : setInternalOpen

  // 表单状态
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<CategoryIcon>('📊')
  const [color, setColor] = useState<CategoryColor>('blue')

  // 删除目标分类状态
  const [targetCategoryId, setTargetCategoryId] = useState<string>('')

  // 获取当前分类下的工具数量
  const toolsInCategory = category ? allTools.filter(tool => tool.category === category.id).length : 0

  // 获取可用的目标分类（删除时重分配用）
  const availableTargetCategories = categories.filter(cat =>
    cat.id !== category?.id
  )

  // 初始化表单数据
  useEffect(() => {
    if (operation === 'edit' && category) {
      setName(category.name)
      setIcon(category.icon as CategoryIcon)
      setColor(category.color as CategoryColor)
    } else if (operation === 'create') {
      setName('')
      setIcon('📊')
      setColor('blue')
    }
  }, [operation, category, open])

  // 表单验证
  const validateForm = (): string | null => {
    if (!name.trim()) {
      return '分类名称不能为空'
    }

    if (name.length > 20) {
      return '分类名称不能超过20个字符'
    }

    // 检查名称是否与其他分类冲突
    const existingCategory = categories.find(cat =>
      cat.name === name.trim() && cat.id !== category?.id
    )
    if (existingCategory) {
      return '分类名称已存在'
    }

    return null
  }

  // 处理提交
  const handleSubmit = async () => {
    const error = validateForm()
    if (error) {
      toast({
        title: '验证失败',
        description: error,
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      let result

      if (operation === 'create') {
        result = await onCreateCategory({
          name: name.trim(),
          icon,
          color
        })
      } else if (operation === 'edit' && category) {
        result = await onUpdateCategory(category.id, {
          name: name.trim(),
          icon,
          color
        })
      }

      if (result?.success) {
        toast({
          title: operation === 'create' ? '创建成功' : '更新成功',
          description: operation === 'create' ? '分类已创建' : '分类已更新'
        })
        setOpen(false)
      } else {
        toast({
          title: operation === 'create' ? '创建失败' : '更新失败',
          description: result?.error || '操作失败，请重试',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Category operation error:', error)
      toast({
        title: '操作失败',
        description: '网络错误，请重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 处理删除
  const handleDelete = async () => {
    console.log('🔥 CategoryManageDialog.handleDelete 被调用！', {
      category: category?.name,
      categoryId: category?.id,
      toolsInCategory,
      targetCategoryId
    })

    if (!category) return

    // 如果有工具但没有选择目标分类
    if (toolsInCategory > 0 && !targetCategoryId) {
      toast({
        title: '请选择目标分类',
        description: '该分类下还有工具，请选择要移动到的目标分类',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      console.log('🚀 即将调用 onDeleteCategory...', category.id, targetCategoryId)
      const result = await onDeleteCategory(category.id, targetCategoryId || undefined)
      console.log('✅ onDeleteCategory 返回结果：', result)

      if (result?.success) {
        toast({
          title: '删除成功',
          description: `分类已删除${result.movedTools ? `，${result.movedTools}个工具已移动` : ''}`
        })
        setOpen(false)
      } else {
        toast({
          title: '删除失败',
          description: result?.error || '删除失败，请重试',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('❌ Delete category error:', error)
      toast({
        title: '删除失败',
        description: '网络错误，请重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 默认触发器
  const defaultTrigger = (
    <Button
      variant={operation === 'delete' ? 'destructive' : operation === 'edit' ? 'outline' : 'default'}
      size="sm"
      disabled={category && !canManageCategory(category)}
    >
      {operation === 'create' && <Plus className="h-4 w-4 mr-2" />}
      {operation === 'edit' && <Pencil className="h-4 w-4 mr-2" />}
      {operation === 'delete' && <Trash2 className="h-4 w-4 mr-2" />}
      {operation === 'create' && '新建分类'}
      {operation === 'edit' && '编辑'}
      {operation === 'delete' && '删除'}
    </Button>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger !== null && (
          <DialogTrigger asChild>
            {trigger || defaultTrigger}
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {operation === 'create' && '创建新分类'}
              {operation === 'edit' && '编辑分类'}
              {operation === 'delete' && '删除分类'}
            </DialogTitle>
            <DialogDescription>
              {operation === 'create' && '创建一个新的工具分类'}
              {operation === 'edit' && '修改分类信息'}
              {operation === 'delete' && `确定要删除分类"${category?.name}"吗？`}
            </DialogDescription>
          </DialogHeader>

          {operation === 'delete' ? (
            <div className="py-4">
              {toolsInCategory > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      该分类下有 {toolsInCategory} 个工具，删除后这些工具将移动到指定分类
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-category">选择目标分类</Label>
                    <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择目标分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTargetCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="mr-2">{cat.icon}</span>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  该分类下没有工具，可以安全删除。
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">分类名称</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入分类名称"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  {name.length}/20 字符
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">图标</Label>
                <Select value={icon} onValueChange={(value) => setIcon(value as CategoryIcon)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="grid grid-cols-6 gap-1 p-2">
                      {CATEGORY_ICONS.map((iconOption) => (
                        <SelectItem
                          key={iconOption}
                          value={iconOption}
                          className="flex items-center justify-center p-2 hover:bg-accent cursor-pointer"
                        >
                          <span className="text-lg">{iconOption}</span>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">颜色</Label>
                <Select value={color} onValueChange={(value) => setColor(value as CategoryColor)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_COLORS.map((colorOption) => (
                      <SelectItem key={colorOption} value={colorOption}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full bg-${colorOption}-500 border border-${colorOption}-600`}
                          />
                          <span className="capitalize">{colorOption}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 预览 */}
              <div className="space-y-2">
                <Label>预览</Label>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <span className="text-lg">{icon}</span>
                  <span className="font-medium">{name || '分类名称'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              取消
            </Button>
            {operation === 'delete' ? (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || (toolsInCategory > 0 && !targetCategoryId)}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                删除分类
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {operation === 'create' ? '创建' : '保存'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </>
  )
}