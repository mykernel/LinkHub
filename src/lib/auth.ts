/**
 * 认证服务
 * 处理登录、注册、token管理等认证相关功能
 */

import { hashPassword, encryptData, decryptData } from './crypto'
import defaultToolsData from '../data/defaultTools.json'

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3001/api'
  : '/api'

export interface User {
  username: string
  token: string
  dataVersion?: number
}

export interface AuthChallenge {
  salt: string
  challenge: string
  // 安全修复：移除exists字段以防止用户名枚举攻击
}

export interface LoginResult {
  success: boolean
  user?: User
  encryptedData?: string | null
  dataVersion?: number
  salt?: string
  error?: string
}

export interface RegisterResult {
  success: boolean
  salt?: string
  error?: string
}

// API请求辅助函数
async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = `${API_BASE}${url}`;

  // 正确构造headers，确保Content-Type不被覆盖
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // 构造最终的fetch选项，确保headers不被覆盖
  const fetchOptions: RequestInit = {
    ...options,
    headers
  };

  // 安全的API请求日志（过滤敏感信息）
  if (import.meta.env.DEV) {
    const safeHeaders = { ...fetchOptions.headers };
    if (safeHeaders.Authorization) {
      safeHeaders.Authorization = '[REDACTED]';
    }

    let safeBody = fetchOptions.body;
    if (typeof safeBody === 'string') {
      try {
        const bodyObj = JSON.parse(safeBody);
        if (bodyObj.passwordHash) bodyObj.passwordHash = '[REDACTED]';
        if (bodyObj.encryptedData) bodyObj.encryptedData = '[REDACTED - LENGTH: ' + bodyObj.encryptedData.length + ']';
        safeBody = JSON.stringify(bodyObj);
      } catch (e) {
        safeBody = '[BODY - LENGTH: ' + safeBody.length + ']';
      }
    }

    console.log('🌐 API Request:', {
      method: fetchOptions.method || 'GET',
      url: fullUrl,
      headers: safeHeaders,
      body: safeBody
    });
  }

  const response = await fetch(fullUrl, fetchOptions)

  console.log('📡 API Response:', {
    status: response.status,
    statusText: response.statusText,
    url: fullUrl
  });

  return response
}

// 带token的API请求
async function authenticatedRequest(url: string, token: string, options: RequestInit = {}): Promise<Response> {
  return apiRequest(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  })
}

// 获取认证挑战
export async function getAuthChallenge(username: string): Promise<AuthChallenge> {
  try {
    const response = await apiRequest(`/auth/challenge/${encodeURIComponent(username)}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '获取认证挑战失败')
    }

    return await response.json()

  } catch (error) {
    console.error('Get challenge error:', error)
    throw error instanceof Error ? error : new Error('网络请求失败')
  }
}

// 用户注册
export async function registerUser(
  username: string,
  password: string
): Promise<RegisterResult> {
  try {
    // 1. 获取挑战信息
    const challenge = await getAuthChallenge(username)

    // 安全修复：移除客户端exists检查，由服务器统一处理用户存在性
    // 这样可以防止用户名枚举攻击

    // 2. 生成密码hash
    const passwordHash = await hashPassword(password, challenge.salt)

    // 3. 准备默认工具数据 - 转换日期格式并设置当前时间
    const currentTime = new Date().toISOString()
    const initialToolsData = defaultToolsData.map(tool => ({
      ...tool,
      lastAccessed: currentTime,
      createdAt: currentTime,
      // 为新用户生成新的ID以避免冲突
      id: `${tool.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }))

    // 4. 将默认工具数据包装成与 saveUserTools 相同的结构
    const initialUserData = {
      tools: initialToolsData,
      settings: {},
      lastModified: currentTime
    }

    // 5. 加密默认工具数据
    const encryptedInitialData = await encryptData(initialUserData, password, challenge.salt)

    // 6. 发送注册请求，包含salt和加密的初始数据
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        passwordHash,
        salt: challenge.salt,
        initialEncryptedData: encryptedInitialData
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || '注册失败' }
    }

    const result = await response.json()
    return {
      success: true,
      salt: result.salt
    }

  } catch (error) {
    console.error('Register error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '注册失败'
    }
  }
}

// 用户登录
export async function loginUser(
  username: string,
  password: string
): Promise<LoginResult> {
  try {
    // 1. 获取认证挑战
    const challenge = await getAuthChallenge(username)

    // 安全修改：移除客户端exists检查，让服务器统一处理用户不存在的情况
    // 这样可以防止用户名枚举攻击

    // 2. 生成密码hash
    const passwordHash = await hashPassword(password, challenge.salt)

    // 安全调试日志（移除敏感信息）
    if (import.meta.env.DEV) {
      console.log('Login Debug Info:')
      console.log('- Username:', username)
      console.log('- Password: [REDACTED]')
      console.log('- Salt Length:', challenge.salt?.length)
      console.log('- Hash Generated:', !!passwordHash)
      console.log('- Challenge Length:', challenge.challenge?.length)
    }

    // 3. 发送登录请求
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        passwordHash,
        challenge: challenge.challenge
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || '登录失败' }
    }

    const result = await response.json()

    return {
      success: true,
      user: {
        username,
        token: result.token,
        dataVersion: result.dataVersion
      },
      encryptedData: result.encryptedData,
      dataVersion: result.dataVersion,
      salt: challenge.salt
    }

  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '登录失败'
    }
  }
}

// 保存用户数据
export async function saveUserData(
  data: any,
  password: string,
  salt: string,
  token: string,
  currentVersion?: number
): Promise<{ success: boolean; version?: number; error?: string }> {
  try {
    // 调试信息
    console.log('📝 saveUserData called:', {
      hasData: !!data,
      dataType: typeof data,
      hasPassword: !!password,
      passwordLength: password?.length,
      hasSalt: !!salt,
      saltLength: salt?.length,
      hasToken: !!token,
      currentVersion
    })

    // 验证必要参数
    if (!data) {
      throw new Error('数据为空')
    }
    if (!password) {
      throw new Error('密码为空')
    }
    if (!salt) {
      throw new Error('盐值为空')
    }
    if (!token) {
      throw new Error('令牌为空')
    }

    // 1. 加密数据
    console.log('🔒 开始加密数据...')
    const encryptedData = await encryptData(data, password, salt)
    console.log('✅ 数据加密成功，长度:', encryptedData?.length)

    // 2. 发送到服务器
    const response = await authenticatedRequest('/data/user', token, {
      method: 'POST',
      body: JSON.stringify({
        encryptedData,
        currentVersion
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || '保存失败' }
    }

    const result = await response.json()
    return {
      success: true,
      version: result.version
    }

  } catch (error) {
    console.error('Save data error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存失败'
    }
  }
}

// 获取用户数据
export async function getUserData(token: string): Promise<{
  success: boolean;
  data?: any;
  version?: number;
  error?: string;
}> {
  try {
    const response = await authenticatedRequest('/data/user', token)

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || '获取数据失败' }
    }

    const result = await response.json()
    return {
      success: true,
      data: result.encryptedData,
      version: result.version
    }

  } catch (error) {
    console.error('Get data error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败'
    }
  }
}

// 解密用户数据
export async function decryptUserData(
  encryptedData: string,
  password: string,
  salt: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!encryptedData) {
      return { success: true, data: null }
    }

    const data = await decryptData(encryptedData, password, salt)
    return { success: true, data }

  } catch (error) {
    console.error('Decrypt data error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '解密失败'
    }
  }
}

// Token刷新
export async function refreshToken(token: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    const response = await authenticatedRequest('/auth/refresh', token, {
      method: 'POST'
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Token刷新失败' }
    }

    const result = await response.json()
    return {
      success: true,
      token: result.token
    }

  } catch (error) {
    console.error('Refresh token error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token刷新失败'
    }
  }
}

// Token存储
export function saveTokenToStorage(token: string, username: string) {
  try {
    const tokenData = {
      token,
      username,
      timestamp: Date.now()
    }
    localStorage.setItem('auth_token', JSON.stringify(tokenData))
  } catch (error) {
    console.error('Save token error:', error)
  }
}

// Token读取
export function getTokenFromStorage(): { token: string; username: string } | null {
  try {
    const tokenStr = localStorage.getItem('auth_token')
    if (!tokenStr) return null

    const tokenData = JSON.parse(tokenStr)

    // 检查token是否过期 (2小时)
    const now = Date.now()
    const tokenAge = now - tokenData.timestamp
    const twoHours = 2 * 60 * 60 * 1000

    if (tokenAge > twoHours) {
      localStorage.removeItem('auth_token')
      return null
    }

    return {
      token: tokenData.token,
      username: tokenData.username
    }

  } catch (error) {
    console.error('Get token error:', error)
    localStorage.removeItem('auth_token')
    return null
  }
}

// 清除Token
export function clearTokenFromStorage() {
  try {
    localStorage.removeItem('auth_token')
  } catch (error) {
    console.error('Clear token error:', error)
  }
}

// 健康检查
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await apiRequest('/health')
    return response.ok
  } catch (error) {
    console.error('Health check error:', error)
    return false
  }
}