# Huxy Server - Node.js 服务器模板

[![npm version](https://badge.fury.io/js/huxy-node-server.svg)](https://badge.fury.io/js/huxy-node-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个精炼、高性能、全面的 Express.js 服务器模板，基于 [huxy-node-server](https://www.npmjs.com/package/huxy-node-server) 构建，添加了 API 代理服务和 JWT 鉴权功能。

## 特性

- ✅ **API 代理服务**：内置 HTTP 代理中间件，支持多目标代理
- ✅ **JWT 鉴权**：完整的 JWT 认证解决方案
- ✅ **灵活配置**：支持环境变量和自定义配置
- ✅ **安全头处理**：自动处理请求和响应头
- ✅ **白名单机制**：支持 API 密钥和路径白名单
- ✅ **ESM 支持**：原生 ES 模块支持
- ✅ **生产就绪**：适用于生产环境部署

## 安装

```bash
npm install huxy-server
```

## 快速开始

### 基本使用

```javascript
import startApp from 'huxy-server';

const config = {
  port: 3000,
  host: 'localhost',
  apiPrefix: '/api',
  // proxy config
  proxys: [
    {
      name: 'ollama',
      target: 'http://localhost:11434'
    }
  ],
  whiteAuthKeys: ['your-api-key'],
  whitePathList: ['/health'],
  // jwt config
  secret: 'your-secret-key',
  expiresIn: '30d',
  issuer: 'your-app',
};

startApp(config, (huxyConfig, app, httpServer) => {
  console.log('服务器启动成功:', huxyConfig);
});
```

### 直接使用 `appProxy`

也可直接使用 `appProxy`，只需传入你的服务 `app` 和代理 `config` 即可。

```javascript
import {appProxy} from 'huxy-server';

appProxy(app, config);

```

### API 鉴权配置

包含 2 种鉴权方式：

- apiKey：在请求头中 `x-api-key`或`x-huxy-auth` 里设置 `authToken` 值。
- jwt：在请求头中 `authorization` 里设置 `Bearer ${token}` 进行用户验证。

默认不需要鉴权 `authToken: false` ，设置环境变量 `AUTH_TOKEN=false` 或 `config = {authToken: false}` 即可。如需鉴权选择上述 2 种方式中的一种即可，优先进行 `authToken` 认证。

可配置免认证路由，如：`whitePathList: ['/health', '/status']` 。

也可配置免认证 `authKeys` ：如：`whiteAuthKeys: ['1234', '2234']` 。

配置示例：

```javascript
const config = {
  // apiKey
  authToken: '1234',
  // jwt
  secret: 'your-secret-key',
  expiresIn: '30d',
  issuer: 'your-app',
  // white list
  whiteAuthKeys: ['1234', '2234'],
  whitePathList: ['/health', '/status'],
};
```

### 环境变量

项目支持以下环境变量：

```env
# 服务器配置
PORT=2345
HOST=localhost
API_PREFIX=/

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=30d
JWT_ISSUER=huxyApp

# 认证
AUTH_TOKEN=your-auth-token
```

## API 代理

### 代理配置

```javascript
const proxyConfig = {
  proxys: [
    {
      name: 'service1',           // 服务名称
      target: 'http://localhost:3001', // 目标服务地址
      prefix: '/api/service1'     // 可选：自定义前缀，默认为 /api/{name}
    },
    {
      name: 'service2',
      target: 'http://localhost:3002'
    }
  ],
  whiteAuthKeys: ['api-key-1', 'api-key-2'], // API 密钥白名单
  whitePathList: ['/health', '/status'],      // 路径白名单
  preserve: false                              // 是否保留原始请求头
};
```

### 请求示例

```bash
# 直接代理请求
curl http://localhost:2345/api/ollama/v1/models

# 使用 API 密钥
curl -H "X-Huxy-Auth: your-api-key" http://localhost:2345/api/ollama/v1/models

# 使用 JWT 令牌
curl -H "Authorization: Bearer your-jwt-token" http://localhost:2345/api/ollama/v1/models
```

## JWT 鉴权

### 创建令牌

```javascript
import {createToken} from 'huxy-server';

const payload = {
  userId: '123',
  username: 'admin',
  roles: ['admin']
};

const token = createToken(payload, jwtConfig);
console.log('JWT Token:', token);
```

### 验证令牌

```javascript
import {jwtDecode} from 'huxy-server';

try {
  const decoded = jwtDecode(token, jwtConfig);
  console.log('Decoded:', decoded);
} catch (error) {
  console.error('Invalid token:', error.message);
}
```

## 安全特性

### 请求头处理

自动移除以下请求头以保护隐私：

- `origin`
- `referer`
- `x-forwarded-for`
- `x-real-ip`
- `cf-connecting-ip`
- `cf-ipcountry`
- `cf-ray`
- `x-huxy-auth`
- `x-api-key`
- `authorization`

### 响应头处理

自动移除以下响应头并添加安全头：

- 移除：`x-powered-by`, `server`
- 添加：`Access-Control-Allow-Origin: *`
- 添加：`X-Content-Type-Options: nosniff`
- 对于流响应，添加缓存控制头

## 高级配置

### 自定义中间件

```javascript
import {startApp} from 'huxy-server';

const callback = (huxyConfig, app, httpServer) => {
  // 添加自定义路由
  app.get('/custom', (req, res) => {
    res.json({message: 'Custom endpoint'});
  });

  // 添加自定义中间件
  app.use((req, res, next) => {
    console.log('Custom middleware');
    next();
  });
};

startApp({config, proxyConfig, jwtConfig}, callback);
```

### 多环境配置

```javascript
const developmentConfig = {
  port: 3000,
  host: 'localhost',
  apiPrefix: '/dev'
};

const productionConfig = {
  port: 80,
  host: '0.0.0.0',
  apiPrefix: '/api'
};

const config = process.env.NODE_ENV === 'production'
  ? productionConfig
  : developmentConfig;

startApp({config, proxyConfig, jwtConfig});
```

## 部署

### 生产环境

```bash
# 使用 PM2 部署
npm install -g pm2
pm2 start src/index.js --name "huxy-server"

# 或者使用 Node.js 直接运行
NODE_ENV=production node src/index.js
```

### Docker 部署

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 2345
CMD ["node", "src/index.js"]
```

## API 文档

### 健康检查

```bash
GET /health
```

响应：

```json
{
  "message": "API 服务器运行中 -> /api",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

### 根路径

```bash
GET /
```

响应：

```json
{
  "message": "API 服务器运行中 -> /api",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

## 错误处理

### 认证错误

```json
{
  "error": "缺少认证信息"
}
```

状态码：401

### 令牌过期

```json
{
  "error": "令牌已过期"
}
```

状态码：401

### 无效令牌

```json
{
  "error": "无效的令牌"
}
```

状态码：403

### 代理错误

```json
{
  "error": "网关错误"
}
```

状态码：502

## 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情见 [LICENSE](LICENSE) 文件。

## 联系方式

- 作者: ahyiru
- 问题反馈: https://github.com/ahyiru/huxy-server/issues
- 仓库地址: https://github.com/ahyiru/huxy-server
