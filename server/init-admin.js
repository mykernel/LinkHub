#!/usr/bin/env node

/**
 * Admin账户初始化脚本
 * 用于创建系统管理员账户，不能通过普通注册流程创建
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data/users');

// 确保数据目录存在
await fs.ensureDir(DATA_DIR);

// 生成安全的随机密码 - 使用密码学安全的随机数生成器
function generateSecurePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += chars.charAt(randomBytes[i] % chars.length);
  }
  return password;
}

// 使用SHA-256生成密码哈希（与前端一致）
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// 生成用户文件路径
function getUserFilePath(username) {
  const hashedUsername = crypto.createHash('sha256').update(username).digest('hex');
  return path.join(DATA_DIR, `${hashedUsername}.json`);
}

function getUserMetaFilePath(username) {
  const hashedUsername = crypto.createHash('sha256').update(username).digest('hex');
  return path.join(DATA_DIR, `${hashedUsername}.meta.json`);
}

async function initializeAdmin() {
  const username = 'admin';
  const password = generateSecurePassword(16);
  const salt = crypto.randomBytes(32).toString('hex');

  console.log('🔧 正在初始化Admin账户...');
  console.log('📁 数据目录:', DATA_DIR);

  const userFile = getUserFilePath(username);
  const userMetaFile = getUserMetaFilePath(username);

  // 检查是否已存在admin账户
  if (await fs.pathExists(userMetaFile)) {
    console.log('⚠️  Admin账户已存在！');
    console.log('如需重置，请先删除现有账户文件：');
    console.log(`   - ${userMetaFile}`);
    console.log(`   - ${userFile}`);
    process.exit(1);
  }

  try {
    // 生成密码哈希
    const passwordHash = hashPassword(password, salt);

    // 创建用户元数据
    const userMeta = {
      username,
      passwordHash,
      salt,
      role: 'admin', // 添加角色标识
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      dataVersion: 1,
      disabled: false,
      isSystemAccount: true // 标记为系统账户
    };

    // 创建空的用户数据文件
    const initialUserData = {
      encryptedData: null,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 写入文件
    await fs.writeJSON(userMetaFile, userMeta, { spaces: 2 });
    await fs.writeJSON(userFile, initialUserData, { spaces: 2 });

    console.log('✅ Admin账户创建成功！');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🔑 Admin登录凭据');
    console.log('═══════════════════════════════════════');
    console.log(`用户名: ${username}`);
    console.log(`密码: ${password}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('⚠️  请妥善保管上述凭据，密码不会再次显示！');
    console.log('💾 账户信息已保存到:');
    console.log(`   Meta: ${userMetaFile}`);
    console.log(`   Data: ${userFile}`);
    console.log('');
    console.log('🚀 现在可以使用上述凭据登录管理后台');

  } catch (error) {
    console.error('❌ 创建Admin账户失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initializeAdmin().catch(console.error);