import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AddToolDialogProps {
  categories: Category[]
  onAddTool: (toolData: {
    name: string
    url: string
    category: string
    description?: string
    icon?: string
  }) => void
}

export function AddToolDialog({ categories, onAddTool }: AddToolDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    protocol: 'https',
    url: '',
    category: '',
    description: '',
    icon: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '工具名称不能为空'
    }

    if (!formData.url.trim()) {
      newErrors.url = '域名/地址不能为空'
    } else {
      try {
        // Validate the complete URL with protocol
        const fullUrl = `${formData.protocol}://${formData.url}`
        new URL(fullUrl)
      } catch {
        newErrors.url = '请输入有效的域名或地址'
      }
    }

    if (!formData.category) {
      newErrors.category = '请选择分类'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onAddTool({
      name: formData.name.trim(),
      url: `${formData.protocol}://${formData.url.trim()}`,
      category: formData.category,
      description: formData.description.trim() || undefined,
      icon: formData.icon.trim() || undefined
    })

    // Reset form and close dialog
    setFormData({
      name: '',
      protocol: 'https',
      url: '',
      category: '',
      description: '',
      icon: ''
    })
    setErrors({})
    setOpen(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Filter out "all" and "favorites" category for selection (favorites are set via star button)
  const selectableCategories = categories.filter(cat => cat.id !== 'all' && cat.id !== 'favorites')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          添加工具
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加新工具</DialogTitle>
          <DialogDescription>
            填写工具信息，添加到导航页面中。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                工具名称 *
              </label>
              <Input
                id="name"
                placeholder="例如：Jenkins"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="url" className="text-sm font-medium">
                URL地址 *
              </label>
              <div className="flex gap-1">
                <Select
                  value={formData.protocol}
                  onValueChange={(value) => handleInputChange('protocol', value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="https">https</SelectItem>
                    <SelectItem value="http">http</SelectItem>
                  </SelectContent>
                </Select>
                <span className="flex items-center px-2 text-muted-foreground">://</span>
                <Input
                  id="url"
                  placeholder="example.com"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className={cn("flex-1", errors.url ? 'border-red-500' : '')}
                />
              </div>
              {errors.url && (
                <p className="text-sm text-red-500">{errors.url}</p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                分类 *
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {selectableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="icon" className="text-sm font-medium">
                图标
              </label>
              <Input
                id="icon"
                placeholder="🚀 (可选，留空将自动生成)"
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                描述
              </label>
              <Input
                id="description"
                placeholder="简单描述工具的用途 (可选)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit">添加工具</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}