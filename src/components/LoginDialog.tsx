import React, { useState } from 'react'
import { Eye, EyeOff, User, Lock, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { validatePasswordStrength } from '@/lib/crypto'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { login, register, isLoading } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // 用户名验证
    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空'
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符'
    } else if (formData.username.length > 50) {
      newErrors.username = '用户名最多50个字符'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字、下划线和短横线'
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = '密码不能为空'
    } else if (mode === 'register') {
      const passwordValidation = validatePasswordStrength(formData.password)
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message
      }
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符'
    }

    // 注册模式下验证确认密码
    if (mode === 'register') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = '请确认密码'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = mode === 'login'
        ? await login(formData.username.trim(), formData.password)
        : await register(formData.username.trim(), formData.password)

      if (result.success) {
        // 成功后关闭对话框并重置表单
        onOpenChange(false)
        setFormData({ username: '', password: '', confirmPassword: '' })
        setErrors({})
        setMode('login')
      } else {
        setErrors({ submit: result.error || '操作失败' })
      }

    } catch (error) {
      console.error('Auth error:', error)
      setErrors({
        submit: error instanceof Error ? error.message : '网络错误，请稍后重试'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    // 清除提交错误
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }))
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setFormData({ username: '', password: '', confirmPassword: '' })
    setErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'login' ? (
              <>
                <User className="h-5 w-5" />
                用户登录
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                用户注册
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login'
              ? '登录后可以管理您的个人工具集合'
              : '创建账户来保存和管理您的工具'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 用户名输入 */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              用户名 *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
                autoComplete="username"
                disabled={isLoading || isSubmitting}
              />
            </div>
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          {/* 密码输入 */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              密码 *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                disabled={isLoading || isSubmitting}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || isSubmitting}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* 确认密码输入（仅注册模式） */}
          {mode === 'register' && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                确认密码 *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                  disabled={isLoading || isSubmitting}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading || isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* 提交错误提示 */}
          {errors.submit && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full"
            >
              {isSubmitting
                ? (mode === 'login' ? '登录中...' : '注册中...')
                : (mode === 'login' ? '登录' : '注册')
              }
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={switchMode}
                disabled={isLoading || isSubmitting}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === 'login'
                  ? '没有账户？点击注册'
                  : '已有账户？点击登录'
                }
              </button>
            </div>
          </div>
        </form>

        {/* 安全提示 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-600">
            🔒 您的数据将被加密存储，密码不会上传到服务器
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}