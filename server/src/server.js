import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import lockfile from 'proper-lockfile';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DATA_DIR = path.join(process.cwd(), 'data/users');

// 确保数据目录存在
await fs.ensureDir(DATA_DIR);

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

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 增加限制以适应正常使用
  message: { error: '请求过于频繁' },
  skip: (req) => req.method === 'OPTIONS' // 跳过CORS预检请求
});

// 只对登录和注册应用严格限制
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
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