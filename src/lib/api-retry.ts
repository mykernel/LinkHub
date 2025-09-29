/**
 * API 重试工具函数
 * 处理网络错误和服务暂时不可用的情况
 */

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  retryDelayMultiplier?: number
  retryableErrors?: readonly number[]
  onRetry?: (attempt: number, error: any) => void
}

const DEFAULT_OPTIONS = {
  maxRetries: 3,
  retryDelay: 100, // ms
  retryDelayMultiplier: 2, // 指数退避
  retryableErrors: [502, 503, 504, 0] as const, // 网关错误和网络错误
  onRetry: () => {}
} as const

/**
 * 延迟函数
 */
const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * 检查是否应该重试
 */
function shouldRetry(error: any, retryableErrors: readonly number[]): boolean {
  // 网络错误（fetch 失败）
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }

  // HTTP 状态码错误
  if (error.status && retryableErrors.includes(error.status)) {
    return true
  }

  // 特定错误消息
  if (error.message) {
    const message = error.message.toLowerCase()
    if (message.includes('network') ||
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('bad gateway') ||
        message.includes('service unavailable')) {
      return true
    }
  }

  return false
}

/**
 * 带重试的 fetch 请求
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...retryOptions }
  let lastError: any

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // 成功响应或非重试错误，直接返回
      if (response.ok || !shouldRetry({ status: response.status }, opts.retryableErrors)) {
        return response
      }

      // 创建错误对象用于重试判断
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
      lastError.status = response.status
      lastError.response = response

      // 如果是最后一次尝试，返回响应（让调用者处理）
      if (attempt === opts.maxRetries) {
        return response
      }

    } catch (error) {
      lastError = error

      // 如果是最后一次尝试或不应该重试，抛出错误
      if (attempt === opts.maxRetries || !shouldRetry(error, opts.retryableErrors)) {
        throw error
      }
    }

    // 不是最后一次尝试，准备重试
    if (attempt < opts.maxRetries) {
      const delayMs = opts.retryDelay * Math.pow(opts.retryDelayMultiplier, attempt)

      opts.onRetry(attempt + 1, lastError)

      if (import.meta.env.DEV) {
        console.warn(`API请求失败，${delayMs}ms后重试 (${attempt + 1}/${opts.maxRetries}):`, {
          url,
          error: lastError?.message || lastError,
          attempt: attempt + 1
        })
      }

      await delay(delayMs)
    }
  }

  // 理论上不应该到达这里
  throw lastError
}

/**
 * 带重试的 JSON API 请求
 */
export async function fetchJsonWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, options, retryOptions)

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
    ;(error as any).status = response.status
    ;(error as any).response = response
    throw error
  }

  try {
    return await response.json()
  } catch (error) {
    throw new Error(`JSON解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 预设的重试配置
 */
export const retryPresets = {
  // 快速重试 - 适用于轻量级操作
  fast: {
    maxRetries: 2,
    retryDelay: 50,
    retryDelayMultiplier: 1.5
  },

  // 标准重试 - 适用于一般API调用
  standard: {
    maxRetries: 3,
    retryDelay: 100,
    retryDelayMultiplier: 2
  },

  // 患者重试 - 适用于重要的数据操作
  patient: {
    maxRetries: 5,
    retryDelay: 200,
    retryDelayMultiplier: 1.8
  },

  // 关键操作 - 适用于关键的管理操作
  critical: {
    maxRetries: 4,
    retryDelay: 150,
    retryDelayMultiplier: 2,
    retryableErrors: [502, 503, 504, 0, 408, 429] // 包含超时和限流
  }
} as const