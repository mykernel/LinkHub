/**
 * 加密工具函数
 * 使用Web Crypto API或@noble库实现AES-256-GCM加密
 * 自动检测环境并选择适当的实现
 */

import { sha256 } from '@noble/hashes/sha256'
import { pbkdf2 } from '@noble/hashes/pbkdf2'
import { randomBytes } from '@noble/hashes/utils'
import { gcm } from '@noble/ciphers/aes'

// 环境检测：检查crypto.subtle是否可用
const hasSubtle = typeof crypto !== 'undefined' && crypto.subtle !== undefined

// 调试配置：可通过环境变量强制使用noble fallback
const forceNoble = import.meta.env.VITE_FORCE_NOBLE_FALLBACK === 'true'

const useWebCrypto = hasSubtle && !forceNoble

if (import.meta.env.DEV) {
  console.log('🔐 Crypto Environment:', {
    hasSubtle,
    forceNoble,
    useWebCrypto,
    implementation: useWebCrypto ? 'Web Crypto API' : '@noble libraries'
  })
}

// =============================================================================
// 数据编码工具函数
// =============================================================================

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

// =============================================================================
// 随机数生成
// =============================================================================

function getRandomBytes(length: number): Uint8Array {
  if (useWebCrypto && crypto.getRandomValues) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return array
  } else {
    // fallback to @noble
    return randomBytes(length)
  }
}

// 生成随机salt（32字节 = 64字符hex）
export function generateSalt(): string {
  const bytes = getRandomBytes(32)
  return bytesToHex(bytes)
}

// =============================================================================
// 密码哈希 - 双实现
// =============================================================================

// 生成密码的hash用于服务器验证
export async function hashPassword(password: string, salt: string): Promise<string> {
  if (useWebCrypto) {
    // Web Crypto API实现
    // 确保与Node.js crypto.createHash('sha256').update(password + salt).digest('hex') 一致
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password + salt)

    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))

    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } else {
    // @noble fallback实现
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password + salt)
    const hashBytes = sha256(passwordBuffer)
    return bytesToHex(hashBytes)
  }
}

// =============================================================================
// PBKDF2密钥派生 - 双实现
// =============================================================================

// 使用PBKDF2从密码生成密钥
export async function deriveKey(password: string, salt: string): Promise<CryptoKey | Uint8Array> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  const saltBuffer = hexToBytes(salt)

  if (useWebCrypto) {
    // Web Crypto API实现
    // 导入密码作为密钥材料
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    )

    // 使用PBKDF2派生AES密钥
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000, // 10万次迭代
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    )
  } else {
    // @noble fallback实现
    // 使用pbkdf2生成32字节密钥
    return pbkdf2(sha256, passwordBuffer, saltBuffer, { c: 100000, dkLen: 32 })
  }
}

// =============================================================================
// AES-GCM加解密 - 双实现
// =============================================================================

// AES-GCM加密
export async function encryptData(data: any, password: string, salt: string): Promise<string> {
  try {
    const key = await deriveKey(password, salt)
    const encoder = new TextEncoder()
    const dataString = JSON.stringify(data)
    const dataBuffer = encoder.encode(dataString)

    // 生成随机IV（12字节）
    const iv = getRandomBytes(12)

    if (useWebCrypto && key instanceof CryptoKey) {
      // Web Crypto API实现
      // 加密数据
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        dataBuffer
      )

      // 组合IV和加密数据
      const combined = concatBytes(iv, new Uint8Array(encryptedBuffer))

      // 转换为base64
      return btoa(String.fromCharCode(...combined))
    } else {
      // @noble fallback实现
      const keyBytes = key as Uint8Array
      const cipher = gcm(keyBytes, iv)
      const encryptedBytes = cipher.encrypt(dataBuffer)

      // 组合IV和加密数据
      const combined = concatBytes(iv, encryptedBytes)

      // 转换为base64
      return btoa(String.fromCharCode(...combined))
    }

  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('数据加密失败')
  }
}

// AES-GCM解密
export async function decryptData(encryptedData: string, password: string, salt: string): Promise<any> {
  try {
    const key = await deriveKey(password, salt)

    // 从base64解码
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    )

    // 分离IV和加密数据
    const iv = combined.slice(0, 12)
    const encryptedBuffer = combined.slice(12)

    if (useWebCrypto && key instanceof CryptoKey) {
      // Web Crypto API实现
      // 解密数据
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encryptedBuffer
      )

      // 转换回字符串并解析JSON
      const decoder = new TextDecoder()
      const dataString = decoder.decode(decryptedBuffer)

      return JSON.parse(dataString)
    } else {
      // @noble fallback实现
      const keyBytes = key as Uint8Array
      const cipher = gcm(keyBytes, iv)
      const decryptedBytes = cipher.decrypt(encryptedBuffer)

      // 转换回字符串并解析JSON
      const decoder = new TextDecoder()
      const dataString = decoder.decode(decryptedBytes)

      return JSON.parse(dataString)
    }

  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('数据解密失败，请检查密码')
  }
}

// =============================================================================
// 其他工具函数（保持不变）
// =============================================================================

// 清理内存中的敏感数据（尽力而为，不能完全保证）
export function clearSensitiveData(password: string) {
  // JavaScript中无法真正清零内存，但可以覆盖变量
  if (password) {
    // 这里只是示意，实际效果有限
    password = '\0'.repeat(password.length)
  }
}

// 验证密码强度
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message: string;
  score: number
} {
  let score = 0
  const issues = []

  if (password.length >= 8) score += 1
  else issues.push('至少8个字符')

  if (password.length >= 12) score += 1

  if (/[a-z]/.test(password)) score += 1
  else issues.push('包含小写字母')

  if (/[A-Z]/.test(password)) score += 1
  else issues.push('包含大写字母')

  if (/\d/.test(password)) score += 1
  else issues.push('包含数字')

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  else issues.push('包含特殊字符')

  const isValid = score >= 4
  const message = isValid
    ? '密码强度良好'
    : `密码需要: ${issues.join('、')}`

  return { isValid, message, score }
}