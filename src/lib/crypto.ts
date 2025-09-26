/**
 * 加密工具函数
 * 使用Web Crypto API实现AES-256-GCM加密
 */

// 生成随机salt
export function generateSalt(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// 使用PBKDF2从密码生成密钥
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  const saltBuffer = new Uint8Array(salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))

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
}

// 生成密码的hash用于服务器验证
export async function hashPassword(password: string, salt: string): Promise<string> {
  // 确保与Node.js crypto.createHash('sha256').update(password + salt).digest('hex') 一致
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password + salt)

  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// AES-GCM加密
export async function encryptData(data: any, password: string, salt: string): Promise<string> {
  try {
    const key = await deriveKey(password, salt)
    const encoder = new TextEncoder()
    const dataString = JSON.stringify(data)
    const dataBuffer = encoder.encode(dataString)

    // 生成随机IV
    const iv = new Uint8Array(12)
    crypto.getRandomValues(iv)

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
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedBuffer), iv.length)

    // 转换为base64
    return btoa(String.fromCharCode(...combined))

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

  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('数据解密失败，请检查密码')
  }
}

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