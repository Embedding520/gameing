# 本地开发测试指南

## 🏠 本地测试 Creem 支付

### 为什么需要 ngrok？

Creem 支付系统需要通过 **Webhook** 回调你的服务器来更新支付状态。但是：

- ❌ 本地 `localhost:3000` 无法接收来自 Creem 服务器的请求
- ✅ ngrok 可以将本地端口暴露到公网，让 Creem 能够访问你的本地服务器

### 📦 安装 ngrok

#### Windows (PowerShell)

```powershell
# 使用 Chocolatey
choco install ngrok

# 或下载安装包
# 访问 https://ngrok.com/download 下载 Windows 版本
```

#### macOS

```bash
# 使用 Homebrew
brew install ngrok/ngrok/ngrok

# 或下载安装包
# 访问 https://ngrok.com/download 下载 macOS 版本
```

### 🚀 使用步骤

#### 1. 启动 Next.js 开发服务器

```bash
npm run dev
```

服务器会在 `http://localhost:3000` 启动

#### 2. 启动 ngrok

打开新的终端窗口，运行：

```bash
# 方式 1：普通启动（免费版会显示警告页面）
ngrok http 3000

# 方式 2：跳过警告页面（推荐，但需要 ngrok 账户）
ngrok http 3000 --request-header-add "ngrok-skip-browser-warning:true"
```

你会看到类似这样的输出：

```
Forwarding    https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:3000
```

**重要**：复制这个 `https://xxxx-xxxx-xxxx.ngrok-free.app` URL（这是你的公网地址）

**⚠️ ngrok 免费版警告页面问题：**

ngrok 免费版会在首次访问时显示一个警告页面，要求用户点击"Visit Site"按钮。这会导致 **Creem 的 webhook 请求被拦截**，返回 HTML 页面而不是 API 响应。

**解决方案：**

1. **使用 ngrok 配置跳过警告（推荐）**：
   - 创建 `ngrok.yml` 配置文件：
   ```yaml
   version: "2"
   authtoken: 你的ngrok_token
   tunnels:
     webhook:
       proto: http
       addr: 3000
       request_header:
         add:
           - "ngrok-skip-browser-warning:true"
   ```
   - 然后使用：`ngrok start webhook`

2. **或者使用 ngrok 的 API 设置**：
   ```bash
   ngrok http 3000 --request-header-add "ngrok-skip-browser-warning:true"
   ```

3. **或者升级到 ngrok 付费版**（有固定域名，无警告页面）

#### 3. 配置本地环境变量

在项目根目录创建或更新 `.env.local` 文件：

```env
# Creem API 配置
CREEM_API_KEY=你的Creem测试API密钥
CREEM_API_URL=https://test-api.creem.io
CREEM_WEBHOOK_SECRET=你的Webhook密钥

# 重要：使用 ngrok 提供的 URL
NEXT_PUBLIC_BASE_URL=https://xxxx-xxxx-xxxx.ngrok-free.app

# 其他配置
OPENROUTER_API_KEY=你的OpenRouter API密钥
```

**注意**：每次重启 ngrok，URL 都会变化（免费版），需要更新 `.env.local` 中的 `NEXT_PUBLIC_BASE_URL`

#### 4. 在 Creem 控制台配置 Webhook

1. 登录 Creem 控制台：https://dashboard.creem.io
2. 进入 **Webhooks** 设置
3. 添加或编辑 Webhook：
   - **URL**: `https://xxxx-xxxx-xxxx.ngrok-free.app/api/payment/creem/webhook`
   - **事件**: 选择 `checkout.completed` 和 `payment.succeeded`
   - **Secret**: 使用你在 `.env.local` 中配置的 `CREEM_WEBHOOK_SECRET`

#### 5. 重启 Next.js 开发服务器

更新 `.env.local` 后，需要重启开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

### 🧪 测试流程

1. **访问本地应用**：`http://localhost:3000`
2. **点击充值**：输入金额并确认
3. **完成支付**：在 Creem 测试支付页面完成支付
4. **检查回调**：
   - 查看 ngrok 终端窗口，应该能看到 webhook 请求
   - 查看 Next.js 终端窗口，应该能看到处理日志
   - 检查数据库，支付状态应该更新为 "completed"

### ⚠️ 注意事项

#### ngrok 免费版限制

- **URL 会变化**：每次重启 ngrok，URL 都会改变
- **需要更新配置**：每次 URL 变化后，需要：
  1. 更新 `.env.local` 中的 `NEXT_PUBLIC_BASE_URL`
  2. 更新 Creem 控制台中的 Webhook URL
  3. 重启 Next.js 开发服务器

#### ngrok 付费版优势

如果经常需要本地测试，可以考虑 ngrok 付费版：
- ✅ 固定域名（不会变化）
- ✅ 更快的连接速度
- ✅ 更多功能

#### 替代方案

如果不想使用 ngrok，也可以：

1. **直接部署到 Vercel 测试**：每次修改后推送到 GitHub，Vercel 会自动部署
2. **使用其他内网穿透工具**：
   - [localtunnel](https://localtunnel.github.io/www/)
   - [serveo](https://serveo.net/)
   - [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

### 🔍 调试技巧

#### 查看 ngrok 请求日志

ngrok 提供了一个 Web 界面查看所有请求：

访问：`http://127.0.0.1:4040`（ngrok 启动后自动打开）

在这里你可以：
- 查看所有进入的请求
- 查看请求和响应内容
- 重放请求进行测试

#### 检查 Webhook 是否到达

在 `app/api/payment/creem/webhook/route.ts` 中添加日志：

```typescript
console.log('Webhook received:', {
  headers: request.headers,
  body: await request.json()
})
```

#### 测试 Webhook 端点

可以使用 curl 或 Postman 测试：

```bash
curl -X POST https://xxxx-xxxx-xxxx.ngrok-free.app/api/payment/creem/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 📝 快速检查清单

- [ ] ngrok 已安装
- [ ] Next.js 开发服务器运行在 `localhost:3000`
- [ ] ngrok 已启动并转发到 `localhost:3000`
- [ ] `.env.local` 中配置了 `NEXT_PUBLIC_BASE_URL`（使用 ngrok URL）
- [ ] Creem 控制台中配置了 Webhook URL（使用 ngrok URL）
- [ ] 已重启 Next.js 开发服务器（加载新的环境变量）

### 🎯 常见问题

**Q: ngrok URL 总是变化怎么办？**

A: 使用 ngrok 付费版可以获得固定域名，或者使用其他内网穿透工具。

**Q: Webhook 没有收到请求？**

A: 
- 检查 ngrok 是否正在运行
- 检查 Creem 控制台中的 Webhook URL 是否正确
- 查看 ngrok Web 界面 (`http://127.0.0.1:4040`) 确认是否有请求进入

**Q: 支付完成后数据库没有更新？**

A:
- 检查 webhook 是否到达（查看 ngrok 和 Next.js 日志）
- 检查 `CREEM_WEBHOOK_SECRET` 是否正确
- 使用手动验证功能：`/api/payment/creem/verify`
