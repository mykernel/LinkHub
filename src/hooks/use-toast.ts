import { useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

// 简单的Toast系统
let toastId = 0

export function useToast() {
  const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }: ToastProps) => {
    // 简单实现：使用浏览器原生alert作为临时方案
    // 在实际项目中应该使用专业的Toast组件库
    const message = title + (description ? '\n' + description : '')

    if (variant === 'destructive') {
      console.error('Toast Error:', message)
      // 可以在这里集成实际的Toast UI组件
      alert('错误: ' + message)
    } else {
      console.log('Toast:', message)
      // 可以在这里集成实际的Toast UI组件
      alert(message)
    }

    return {
      id: (++toastId).toString(),
      title,
      description,
      variant,
      duration
    }
  }, [])

  return { toast }
}