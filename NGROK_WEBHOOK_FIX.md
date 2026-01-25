# ngrok Webhook 警告页面问题解决方案

## 🔴 问题描述

从 Creem 控制台看到，webhook 返回的是 HTML 页面（ngrok 的警告页面）而不是 JSON 响应。这是因为：

- ngrok 免费版会在首次访问时显示警告页面
- Creem 的 webhook 请求是自动的，无法手动点击"Visit Site"
- 导致 webhook 请求被拦截，返回 HTML 而不是 API 响应

## ✅ 解决方案

### 方案 1：使用 ngrok 配置跳过警告（推荐）

1. **创建 ngrok 配置文件** `ngrok.yml`（在项目根目录）：

```yaml
version: "2"
authtoken: 你的ngrok_authtoken  # 从 https://dashboard.ngrok.com/get-started/your-authtoken 获取
tunnels:
  webhook:
    proto: http
    addr: 3000
    inspect: true
    request_header:
      add:
        - "ngrok-skip-browser-warning:true"
```

2. **启动 ngrok**：

```bash
ngrok start webhook
```

### 方案 2：使用命令行参数（简单但每次都要输入）

```bash
ngrok http 3000 --request-header-add "ngrok-skip-browser-warning:true"
```

### 方案 3：使用 ngrok 的静态域名（需要付费版）

如果你有 ngrok 付费版，可以使用静态域名：

```bash
ngrok http 3000 --domain=your-static-domain.ngrok-free.app
```

静态域名不会显示警告页面。

### 方案 4：手动访问一次 ngrok URL（临时方案）

1. 在浏览器中访问你的 ngrok URL：`https://untranscendentally-diplomatic-elizbeth.ngrok-free.app`
2. 点击"Visit Site"按钮
3. 这样会在你的浏览器中设置 cookie，后续请求可能不会显示警告

**注意**：这个方法不可靠，因为 Creem 的请求可能来自不同的 IP。

## 🔧 获取 ngrok Authtoken

1. 访问 https://dashboard.ngrok.com/get-started/your-authtoken
2. 登录或注册 ngrok 账户
3. 复制你的 authtoken
4. 运行：`ngrok config add-authtoken 你的authtoken`

## 📝 完整配置示例

### 1. 创建 `ngrok.yml`

```yaml
version: "2"
authtoken: 你的ngrok_authtoken
tunnels:
  webhook:
    proto: http
    addr: 3000
    inspect: true
    request_header:
      add:
        - "ngrok-skip-browser-warning:true"
```

### 2. 启动 ngrok

```bash
ngrok start webhook
```

### 3. 更新 `.env.local`

```env
NEXT_PUBLIC_BASE_URL=https://你的ngrok域名.ngrok-free.app
```

### 4. 更新 Creem Webhook URL

在 Creem 控制台中，将 Webhook URL 设置为：
```
https://你的ngrok域名.ngrok-free.app/api/payment/creem/webhook
```

## 🧪 测试

1. 在 Creem 控制台点击"Send test event"
2. 查看 ngrok 终端，应该能看到请求日志
3. 查看 Next.js 终端，应该能看到 webhook 处理日志
4. 在 Creem 控制台查看事件详情，应该显示 JSON 响应而不是 HTML

## ⚠️ 注意事项

- ngrok 免费版的 URL 每次重启都会变化
- 每次 URL 变化后，需要更新 `.env.local` 和 Creem 控制台
- 如果使用配置文件，URL 仍然会变化（除非使用付费版的静态域名）

## 🎯 推荐方案

**最佳实践**：使用方案 1（ngrok 配置文件），这样可以：
- ✅ 跳过警告页面
- ✅ 配置更清晰
- ✅ 可以添加其他配置（如 inspect、region 等）
