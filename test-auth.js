// 简单的认证测试脚本
import crypto from 'crypto';

// 模拟前端的密码hash函数
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

const username = 'testuser2';
const password = 'TestPassword123!';
const salt = 'b786b45ab3d2e85eca6dfad47c5434eab81967b51289e2bf99a25f69d0bf362b';
const challenge = '3a420b64a435e5f18ba68764559ca8a5';

const passwordHash = hashPassword(password, salt);

console.log('Username:', username);
console.log('Password:', password);
console.log('Salt:', salt);
console.log('Challenge:', challenge);
console.log('Password Hash:', passwordHash);

// 构建注册请求的JSON
const registerData = {
  username,
  passwordHash
};

console.log('\nRegister data:');
console.log(JSON.stringify(registerData, null, 2));

// 构建curl命令
const curlCommand = `curl -X POST "http://localhost:3001/api/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(registerData)}'`;

console.log('\nCurl command:');
console.log(curlCommand);