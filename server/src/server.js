import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import lockfile from 'proper-lockfile';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DATA_DIR = path.join(process.cwd(), 'data/users');

// 确保数据目录存在
await fs.ensureDir(DATA_DIR);

// 信任代理设置 - 用于正确获取客户端IP
app.set('trust proxy', true);

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 限流中间件 - 只针对敏感操作
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 增加到10次以适应正常流程
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' // 跳过CORS预检请求
});

// Admin专用严格限流
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // admin操作相对宽松但仍有限制
  message: { error: 'Admin请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS'
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 增加限制以适应正常使用
  message: { error: '请求过于频繁' },
  skip: (req) => req.method === 'OPTIONS' // 跳过CORS预检请求
});

// Admin操作日志记录
function logAdminAction(action, user, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    admin: user.username,
    userId: user.userId,
    details,
    ip: details.ip || 'unknown'
  };

  console.log(`[ADMIN-AUDIT] ${timestamp} - ${user.username} - ${action}`,
    Object.keys(details).length > 0 ? details : '');
}

// 只对登录和注册应用严格限制
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
// Admin路由专用限流
app.use('/api/admin', adminLimiter);
app.use('/api', generalLimiter);

// 用户登录失败计数（内存存储，重启清零）
const loginAttempts = new Map();

// 工具函数
function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

function generateChallenge() {
  return crypto.randomBytes(16).toString('hex');
}

// 统一的密码哈希函数 - 与前端保持一致 (SHA-256)
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function getUserFilePath(username) {
  // 对用户名进行hash以避免文件系统问题
  const hashedUsername = crypto.createHash('sha256').update(username).digest('hex');
  return path.join(DATA_DIR, `${hashedUsername}.json`);
}

function getUserMetaFilePath(username) {
  const hashedUsername = crypto.createHash('sha256').update(username).digest('hex');
  return path.join(DATA_DIR, `${hashedUsername}.meta.json`);
}

// JWT验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '访问令牌无效' });
    }
    req.user = user;
    next();
  });
}

// Admin权限验证中间件 - 重构避免回调嵌套
async function authenticateAdmin(req, res, next) {
  try {
    // 记录访问信息
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    // 先进行基础JWT验证
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log(`[ADMIN-SECURITY] Admin access attempt without token from ${clientIP}`);
      return res.status(401).json({ error: '访问令牌缺失' });
    }

    // 验证JWT token
    let user;
    try {
      user = jwt.verify(token, JWT_SECRET);
      req.user = user;
    } catch (jwtError) {
      console.log(`[ADMIN-SECURITY] Invalid token from ${clientIP}: ${jwtError.message}`);
      return res.status(403).json({ error: '访问令牌无效' });
    }

    const { username } = user;

    // 检查是否为admin用户名
    if (username !== 'admin') {
      console.log(`[ADMIN-SECURITY] Access denied for user ${username} from ${clientIP} - Not admin user`);
      return res.status(403).json({ error: '需要管理员权限' });
    }

    // 读取用户元数据验证角色
    const userMetaFile = getUserMetaFilePath(username);

    if (!await fs.pathExists(userMetaFile)) {
      console.log(`[ADMIN-SECURITY] Admin account not found for ${username} from ${clientIP}`);
      return res.status(403).json({ error: '管理员账户不存在' });
    }

    const userMeta = await fs.readJSON(userMetaFile);

    // 验证角色和账户状态
    if (userMeta.role !== 'admin' || userMeta.isSystemAccount !== true) {
      console.log(`[ADMIN-SECURITY] Invalid admin role for ${username} from ${clientIP}`);
      return res.status(403).json({ error: '需要管理员权限' });
    }

    if (userMeta.disabled) {
      console.log(`[ADMIN-SECURITY] Disabled admin account access attempt by ${username} from ${clientIP}`);
      return res.status(403).json({ error: '管理员账户已被禁用' });
    }

    // 记录成功的admin访问并添加到req对象
    req.adminContext = {
      ip: clientIP,
      userAgent,
      timestamp: new Date().toISOString()
    };

    console.log(`[ADMIN-ACCESS] Successful admin access by ${username} from ${clientIP} to ${req.method} ${req.path}`);

    next();
  } catch (error) {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    console.error(`[ADMIN-ERROR] Admin authentication error from ${clientIP}:`, error);
    res.status(500).json({ error: '权限验证失败' });
  }
}

// API路由

// 1. 获取认证挑战
app.get('/api/auth/challenge/:username', async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: '用户名格式无效' });
    }

    const userMetaFile = getUserMetaFilePath(username);
    const challenge = generateChallenge();

    // 检查用户是否存在
    const userExists = await fs.pathExists(userMetaFile);

    let salt;
    if (userExists) {
      // 用户存在，读取真实salt
      const meta = await fs.readJSON(userMetaFile);
      salt = meta.salt;
    } else {
      // 用户不存在，生成假salt（防止用户枚举）
      salt = generateSalt();
    }

    res.json({
      salt,
      challenge,
      exists: userExists // 这里可以返回，因为注册需要知道
    });

  } catch (error) {
    console.error('Challenge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 2. 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, passwordHash, salt, initialEncryptedData } = req.body;

    if (!username || !passwordHash || !salt) {
      return res.status(400).json({ error: '用户名、密码和salt不能为空' });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: '用户名长度应在3-50字符之间' });
    }

    // 禁止注册admin账户
    if (username.toLowerCase() === 'admin') {
      return res.status(400).json({ error: '此用户名为系统保留，不允许注册' });
    }

    const userFile = getUserFilePath(username);
    const userMetaFile = getUserMetaFilePath(username);

    // 检查用户是否已存在
    if (await fs.pathExists(userMetaFile)) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 使用前端传递的salt，确保前后端使用相同的salt

    // 创建用户元数据（存储密码hash和salt）
    const userMeta = {
      username,
      passwordHash, // 直接存储前端发送的hash，不再次hash
      salt, // 使用前端传递的salt
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      dataVersion: 1
    };

    // 创建用户数据文件 - 如果提供了初始加密数据则使用，否则为空
    const initialUserData = {
      encryptedData: initialEncryptedData || null,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 原子写入
    await fs.writeJSON(userMetaFile, userMeta);
    await fs.writeJSON(userFile, initialUserData);

    res.json({
      success: true,
      message: '注册成功',
      salt
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 3. 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, passwordHash, challenge } = req.body;

    if (!username || !passwordHash) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const userMetaFile = getUserMetaFilePath(username);

    // 检查用户是否存在
    if (!await fs.pathExists(userMetaFile)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 检查登录尝试次数
    const attemptKey = `${req.ip}-${username}`;
    const attempts = loginAttempts.get(attemptKey) || 0;

    if (attempts >= 3) {
      return res.status(429).json({ error: '登录尝试次数过多，请10分钟后再试' });
    }

    // 验证密码
    const userMeta = await fs.readJSON(userMetaFile);
    const isValidPassword = passwordHash === userMeta.passwordHash;

    if (!isValidPassword) {
      // 增加失败计数
      loginAttempts.set(attemptKey, attempts + 1);
      // 10分钟后清除
      setTimeout(() => {
        loginAttempts.delete(attemptKey);
      }, 10 * 60 * 1000);

      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 检查账户是否被禁用
    if (userMeta.disabled) {
      return res.status(401).json({ error: '账户已被禁用，请联系管理员' });
    }

    // 登录成功，清除失败计数
    loginAttempts.delete(attemptKey);

    // 更新最后登录时间
    userMeta.lastLoginAt = new Date().toISOString();
    await fs.writeJSON(userMetaFile, userMeta);

    // 生成JWT token
    const token = jwt.sign(
      { username: username, userId: userMeta.username },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // 读取用户数据文件
    const userFile = getUserFilePath(username);
    const userData = await fs.readJSON(userFile);

    res.json({
      success: true,
      token,
      encryptedData: userData.encryptedData,
      dataVersion: userData.version,
      message: '登录成功'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 4. 保存用户数据
app.post('/api/data/user', authenticateToken, async (req, res) => {
  try {
    // 更详细的调试信息
    console.log('🔍 详细请求信息:', {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      method: req.method,
      url: req.url,
      hasRawBody: !!req.rawBody,
      bodyExists: !!req.body,
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body || {}),
      bodyStringified: JSON.stringify(req.body),
      username: req.user?.username
    });

    console.log('🔍 后端接收请求:', {
      hasBody: !!req.body,
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body || {}),
      encryptedDataExists: 'encryptedData' in (req.body || {}),
      encryptedDataType: typeof req.body?.encryptedData,
      encryptedDataLength: req.body?.encryptedData?.length,
      currentVersion: req.body?.currentVersion,
      username: req.user?.username
    });

    const { encryptedData, currentVersion } = req.body;
    const { username } = req.user;

    if (!encryptedData) {
      console.error('❌ encryptedData验证失败:', {
        encryptedData,
        typeofEncryptedData: typeof encryptedData,
        isFalsy: !encryptedData
      });
      return res.status(400).json({ error: '数据不能为空' });
    }

    const userFile = getUserFilePath(username);

    // 文件锁防止并发写入
    const release = await lockfile.lock(userFile, {
      retries: 3,
      minTimeout: 100,
      maxTimeout: 500
    });

    try {
      // 读取当前数据检查版本冲突
      const currentData = await fs.readJSON(userFile);

      if (currentVersion && currentData.version !== currentVersion) {
        return res.status(409).json({
          error: '数据版本冲突，请刷新后重试',
          currentVersion: currentData.version
        });
      }

      // 更新数据
      const newVersion = currentData.version + 1;
      const updatedData = {
        encryptedData,
        version: newVersion,
        createdAt: currentData.createdAt,
        updatedAt: new Date().toISOString()
      };

      await fs.writeJSON(userFile, updatedData);

      res.json({
        success: true,
        version: newVersion,
        message: '数据保存成功'
      });

    } finally {
      await release();
    }

  } catch (error) {
    console.error('Save data error:', error);
    res.status(500).json({ error: '保存失败' });
  }
});

// 5. 获取用户数据
app.get('/api/data/user', authenticateToken, async (req, res) => {
  try {
    const { username } = req.user;
    const userFile = getUserFilePath(username);

    if (!await fs.pathExists(userFile)) {
      return res.status(404).json({ error: '用户数据不存在' });
    }

    const userData = await fs.readJSON(userFile);

    res.json({
      encryptedData: userData.encryptedData,
      version: userData.version,
      updatedAt: userData.updatedAt
    });

  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 6. Token刷新
app.post('/api/auth/refresh', authenticateToken, (req, res) => {
  const { username } = req.user;

  const newToken = jwt.sign(
    { username: username, userId: username },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({
    success: true,
    token: newToken
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =================================
// Admin 管理接口
// =================================

// 获取所有用户列表 (Admin专用)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    // 记录审计日志
    logAdminAction('VIEW_USERS', req.user, {
      ip: req.adminContext.ip,
      parameters: { page: req.query.page, limit: req.query.limit, search: req.query.search, status: req.query.status }
    });

    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;

    // 读取所有用户的meta文件
    const files = await fs.readdir(DATA_DIR);
    const metaFiles = files.filter(file => file.endsWith('.meta.json'));

    const users = [];

    for (const metaFile of metaFiles) {
      try {
        const metaPath = path.join(DATA_DIR, metaFile);
        const userPath = path.join(DATA_DIR, metaFile.replace('.meta.json', '.json'));

        const meta = await fs.readJSON(metaPath);
        const userData = await fs.pathExists(userPath) ? await fs.readJSON(userPath) : null;

        // 搜索过滤
        if (search && !meta.username.toLowerCase().includes(search.toLowerCase())) {
          continue;
        }

        // 状态过滤 (如果有禁用字段)
        if (status !== 'all' && meta.disabled !== (status === 'disabled')) {
          continue;
        }

        users.push({
          username: meta.username,
          createdAt: meta.createdAt,
          lastLoginAt: meta.lastLoginAt,
          disabled: meta.disabled || false,
          dataVersion: userData?.version || 0,
          toolsCount: userData?.encryptedData ? '已加密' : 0, // 无法直接统计加密数据
          storageSize: userData?.encryptedData ? userData.encryptedData.length : 0
        });
      } catch (error) {
        console.error(`Error reading user meta file ${metaFile}:`, error);
      }
    }

    // 排序
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 分页
    const total = users.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      users: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 获取系统统计信息 (Admin专用)
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    // 记录审计日志
    logAdminAction('VIEW_STATS', req.user, {
      ip: req.adminContext.ip
    });

    const files = await fs.readdir(DATA_DIR);
    const metaFiles = files.filter(file => file.endsWith('.meta.json'));

    let totalUsers = 0;
    let activeUsers = 0; // 30天内登录过的用户
    let disabledUsers = 0;
    let totalStorageSize = 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const metaFile of metaFiles) {
      try {
        const metaPath = path.join(DATA_DIR, metaFile);
        const userPath = path.join(DATA_DIR, metaFile.replace('.meta.json', '.json'));

        const meta = await fs.readJSON(metaPath);
        const userData = await fs.pathExists(userPath) ? await fs.readJSON(userPath) : null;

        totalUsers++;

        if (meta.disabled) {
          disabledUsers++;
        } else if (meta.lastLoginAt && new Date(meta.lastLoginAt) > thirtyDaysAgo) {
          activeUsers++;
        }

        if (userData?.encryptedData) {
          totalStorageSize += userData.encryptedData.length;
        }
      } catch (error) {
        console.error(`Error reading stats for ${metaFile}:`, error);
      }
    }

    res.json({
      totalUsers,
      activeUsers,
      disabledUsers,
      totalStorageSize,
      storageFormatted: `${(totalStorageSize / 1024 / 1024).toFixed(2)} MB`,
      systemStatus: 'healthy'
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: '获取系统统计失败' });
  }
});

// 禁用/启用用户 (Admin专用)
app.post('/api/admin/users/:username/toggle-status', authenticateAdmin, async (req, res) => {
  try {
    const { username } = req.params;

    if (username === 'admin') {
      return res.status(400).json({ error: '不能禁用管理员账户' });
    }

    const userMetaFile = getUserMetaFilePath(username);

    if (!await fs.pathExists(userMetaFile)) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const meta = await fs.readJSON(userMetaFile);
    const oldStatus = meta.disabled;
    meta.disabled = !meta.disabled;
    meta.updatedAt = new Date().toISOString();

    await fs.writeJSON(userMetaFile, meta);

    // 记录审计日志
    logAdminAction(meta.disabled ? 'DISABLE_USER' : 'ENABLE_USER', req.user, {
      ip: req.adminContext.ip,
      targetUser: username,
      previousStatus: oldStatus ? 'disabled' : 'enabled',
      newStatus: meta.disabled ? 'disabled' : 'enabled'
    });

    res.json({
      success: true,
      message: `用户已${meta.disabled ? '禁用' : '启用'}`,
      disabled: meta.disabled
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: '修改用户状态失败' });
  }
});

// 删除用户 (Admin专用)
app.delete('/api/admin/users/:username', authenticateAdmin, async (req, res) => {
  try {
    const { username } = req.params;

    if (username === 'admin') {
      return res.status(400).json({ error: '不能删除管理员账户' });
    }

    const userMetaFile = getUserMetaFilePath(username);
    const userFile = getUserFilePath(username);

    if (!await fs.pathExists(userMetaFile)) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 读取用户信息用于审计
    const userMeta = await fs.readJSON(userMetaFile);

    // 删除用户文件
    await fs.remove(userMetaFile);
    if (await fs.pathExists(userFile)) {
      await fs.remove(userFile);
    }

    // 记录审计日志
    logAdminAction('DELETE_USER', req.user, {
      ip: req.adminContext.ip,
      targetUser: username,
      userInfo: {
        createdAt: userMeta.createdAt,
        lastLoginAt: userMeta.lastLoginAt,
        dataVersion: userMeta.dataVersion
      }
    });

    res.json({
      success: true,
      message: '用户已删除'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '删除用户失败' });
  }
});

// 重置用户密码 (Admin专用)
app.post('/api/admin/users/:username/reset-password', authenticateAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度至少6位' });
    }

    if (username === 'admin') {
      return res.status(400).json({ error: '不能重置管理员密码' });
    }

    const userMetaFile = getUserMetaFilePath(username);

    if (!await fs.pathExists(userMetaFile)) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const meta = await fs.readJSON(userMetaFile);

    // 使用相同的salt生成新密码hash (与前端一致的SHA-256)
    const passwordHash = hashPassword(newPassword, meta.salt);

    meta.passwordHash = passwordHash;
    meta.updatedAt = new Date().toISOString();

    await fs.writeJSON(userMetaFile, meta);

    // 记录审计日志 (不记录新密码内容)
    logAdminAction('RESET_PASSWORD', req.user, {
      ip: req.adminContext.ip,
      targetUser: username,
      timestamp: meta.updatedAt
    });

    res.json({
      success: true,
      message: '密码重置成功'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: '重置密码失败' });
  }
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});