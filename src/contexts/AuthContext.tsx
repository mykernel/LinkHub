import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  loginUser,
  registerUser,
  saveUserData,
  getUserData,
  decryptUserData,
  saveTokenToStorage,
  getTokenFromStorage,
  clearTokenFromStorage,
  refreshToken
} from '@/lib/auth'
import { Tool } from '@/lib/types'

// UTF-8 safe base64 encoding functions
const utf8ToBase64 = (str: string): string => {
  // 使用TextEncoder确保UTF-8编码正确
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
  return btoa(binaryString)
}

const base64ToUtf8 = (str: string): string => {
  // 使用TextDecoder确保UTF-8解码正确
  const binaryString = atob(str)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const decoder = new TextDecoder()
  return decoder.decode(bytes)
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  userPassword: string | null // 用于数据加密，仅保存在内存中
  userSalt: string | null
  dataVersion: number | null
}

interface AuthContextType extends AuthState {
  // 增强的状态信息
  hasValidSession: boolean      // 有有效token
  needsPassword: boolean        // 需要重新输入密码解锁数据

  // 认证操作
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void

  // 数据操作
  loadUserTools: () => Promise<{ success: boolean; tools?: Tool[]; error?: string }>
  saveUserTools: (tools: Tool[]) => Promise<{ success: boolean; error?: string }>

  // 工具栏
  refreshAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    userPassword: null,
    userSalt: null,
    dataVersion: null
  })

  // 初始化：检查已保存的token
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      const tokenData = getTokenFromStorage()

      if (tokenData) {
        // 验证token是否仍然有效
        const refreshResult = await refreshToken(tokenData.token)

        if (refreshResult.success && refreshResult.token) {
          // 尝试从 sessionStorage 恢复加密凭据
          let userPassword: string | null = null
          let userSalt: string | null = null

          try {
            const encryptedPassword = sessionStorage.getItem('ops-encryption-password')
            const storedSalt = sessionStorage.getItem('ops-encryption-salt')

            if (encryptedPassword && storedSalt) {
              userPassword = base64ToUtf8(encryptedPassword)
              userSalt = storedSalt
            }
          } catch (error) {
            console.warn('Failed to restore encryption credentials from sessionStorage:', error)
          }

          setAuthState(prev => ({
            ...prev,
            user: {
              username: tokenData.username,
              token: refreshResult.token!
            },
            isLoading: false,
            // 恢复加密凭据（如果可用）
            userPassword,
            userSalt,
            dataVersion: null // 重置版本，让应用重新加载用户数据
          }))

          // 保存新token
          saveTokenToStorage(refreshResult.token, tokenData.username)

          return
        }
      }

      // Token无效或不存在
      setAuthState(prev => ({ ...prev, isLoading: false }))

    } catch (error) {
      console.error('Initialize auth error:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))

      const result = await loginUser(username, password)

      if (!result.success || !result.user) {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return { success: false, error: result.error }
      }

      // 保存认证信息 - 使用从 loginUser 返回的 salt，避免重复请求
      setAuthState(prev => ({
        ...prev,
        user: result.user!,
        isAuthenticated: true,
        isLoading: false,
        userPassword: password, // 保存在内存中用于数据加密
        userSalt: result.salt!,
        dataVersion: result.dataVersion || null
      }))

      // 保存token到localStorage
      saveTokenToStorage(result.user.token, username)

      // 保存加密凭据到sessionStorage（页面会话期间有效）
      try {
        sessionStorage.setItem('ops-encryption-password', utf8ToBase64(password))
        sessionStorage.setItem('ops-encryption-salt', result.salt!)
      } catch (error) {
        console.warn('Failed to save encryption credentials to sessionStorage:', error)
      }

      return { success: true }

    } catch (error) {
      console.error('Login error:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : '登录失败'
      }
    }
  }

  const register = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))

      const result = await registerUser(username, password)

      setAuthState(prev => ({ ...prev, isLoading: false }))

      if (!result.success) {
        return { success: false, error: result.error }
      }

      // 注册成功后自动登录
      return await login(username, password)

    } catch (error) {
      console.error('Register error:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
      return {
        success: false,
        error: error instanceof Error ? error.message : '注册失败'
      }
    }
  }

  const logout = () => {
    // 清理敏感数据
    if (authState.userPassword) {
      // 尝试覆盖内存中的密码（有限的安全措施）
      const password = authState.userPassword
      for (let i = 0; i < password.length; i++) {
        // 这只是示意性的，JavaScript无法完全清除内存
      }
    }

    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      userPassword: null,
      userSalt: null,
      dataVersion: null
    })

    clearTokenFromStorage()

    // 清除 sessionStorage 中的加密凭据
    try {
      sessionStorage.removeItem('ops-encryption-password')
      sessionStorage.removeItem('ops-encryption-salt')
    } catch (error) {
      console.warn('Failed to clear encryption credentials from sessionStorage:', error)
    }
  }

  const loadUserTools = async (): Promise<{ success: boolean; tools?: Tool[]; error?: string }> => {
    if (!authState.user || !authState.userPassword || !authState.userSalt) {
      return { success: false, error: '用户未登录' }
    }

    try {
      const result = await getUserData(authState.user.token)

      if (!result.success) {
        return { success: false, error: result.error }
      }

      if (!result.data) {
        // 用户还没有保存过数据，返回空数组
        return { success: true, tools: [] }
      }

      // 解密数据
      const decryptResult = await decryptUserData(
        result.data,
        authState.userPassword,
        authState.userSalt
      )

      if (!decryptResult.success) {
        return { success: false, error: decryptResult.error }
      }

      // 更新数据版本
      setAuthState(prev => ({
        ...prev,
        dataVersion: result.version || null
      }))

      return {
        success: true,
        tools: decryptResult.data?.tools || []
      }

    } catch (error) {
      console.error('Load user tools error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '加载数据失败'
      }
    }
  }

  const saveUserTools = async (tools: Tool[]): Promise<{ success: boolean; error?: string }> => {
    // 调试信息
    console.log('💾 saveUserTools called:', {
      hasUser: !!authState.user,
      username: authState.user?.username,
      hasPassword: !!authState.userPassword,
      passwordLength: authState.userPassword?.length,
      hasSalt: !!authState.userSalt,
      saltLength: authState.userSalt?.length,
      toolsCount: tools?.length,
      isAuthenticated: authState.isAuthenticated
    })

    // 检查基本认证状态
    if (!authState.user) {
      console.error('❌ 用户未登录')
      return { success: false, error: '用户未登录，请重新登录' }
    }

    // 检查加密凭据
    if (!authState.userPassword || !authState.userSalt) {
      console.error('❌ 加密凭据缺失:', {
        hasPassword: !!authState.userPassword,
        hasSalt: !!authState.userSalt
      })
      return {
        success: false,
        error: '加密凭据已失效，请重新登录以恢复数据同步功能'
      }
    }

    // 验证数据
    if (!Array.isArray(tools)) {
      return { success: false, error: '数据格式错误' }
    }

    try {
      const userData = {
        tools,
        settings: {}, // 预留设置字段
        lastModified: new Date().toISOString()
      }

      const result = await saveUserData(
        userData,
        authState.userPassword,
        authState.userSalt,
        authState.user.token,
        authState.dataVersion || undefined
      )

      if (result.success) {
        // 更新数据版本
        setAuthState(prev => ({
          ...prev,
          dataVersion: result.version || null
        }))
        return { success: true }
      } else {
        // 根据错误类型提供不同的提示
        let errorMessage = result.error || '保存数据失败'

        if (errorMessage.includes('数据不能为空')) {
          errorMessage = '数据加密失败，请重新登录'
        } else if (errorMessage.includes('token')) {
          errorMessage = '登录已过期，请重新登录'
        }

        return { success: false, error: errorMessage }
      }

    } catch (error) {
      console.error('Save user tools error:', error)
      let errorMessage = '保存数据失败'

      if (error instanceof Error) {
        if (error.message.includes('加密失败')) {
          errorMessage = '数据加密失败，请重新登录'
        } else {
          errorMessage = error.message
        }
      }

      return { success: false, error: errorMessage }
    }
  }

  const refreshAuth = async (): Promise<boolean> => {
    if (!authState.user) return false

    try {
      const result = await refreshToken(authState.user.token)

      if (result.success && result.token) {
        setAuthState(prev => prev.user ? ({
          ...prev,
          user: {
            ...prev.user,
            token: result.token!
          }
        }) : prev)

        saveTokenToStorage(result.token, authState.user.username)
        return true
      }

      return false

    } catch (error) {
      console.error('Refresh auth error:', error)
      return false
    }
  }

  // 派生状态 - 区分两阶段认证
  const hasValidSession = Boolean(authState.user)
  const hasEncryptionContext = Boolean(authState.user && authState.userPassword && authState.userSalt)

  const contextValue: AuthContextType = {
    ...authState,
    // 重新定义 isAuthenticated 为完整加密就绪状态
    isAuthenticated: hasEncryptionContext,
    // 新增状态字段
    hasValidSession,
    needsPassword: hasValidSession && !hasEncryptionContext,
    // 方法
    login,
    register,
    logout,
    loadUserTools,
    saveUserTools,
    refreshAuth
  }

  // 开发环境调试日志
  if (import.meta.env.DEV) {
    console.debug('[Auth] state update', {
      hasValidSession,
      hasEncryptionContext,
      needsPassword: hasValidSession && !hasEncryptionContext,
      username: authState.user?.username,
      version: authState.dataVersion,
    })
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}