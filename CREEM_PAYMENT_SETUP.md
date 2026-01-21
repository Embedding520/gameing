# Creem 支付配置指南

## 📋 必需的环境变量

在 Vercel 中配置以下环境变量，充值功能才能正常工作：

### 1. 必需的环境变量

```
CREEM_API_KEY=你的Creem API密钥
CREEM_API_URL=https://test-api.creem.io  (测试环境)
或
CREEM_API_URL=https://api.creem.io  (生产环境)
CREEM_WEBHOOK_SECRET=你的Webhook密钥
NEXT_PUBLIC_BASE_URL=https://你的域名.vercel.app
```

### 2. 可选的环境变量

```
CREEM_PRODUCT_ID=你的产品ID  (如果使用产品ID方式)
```

## 🔧 在 Vercel 中配置步骤

### 步骤 1：获取 Creem API 密钥

1. 登录 Creem 控制台：https://dashboard.creem.io
2. 进入 **API Keys** 或 **Settings** 页面
3. 复制你的 **API Key**（格式类似：`creem_test_xxxxx` 或 `creem_live_xxxxx`）

### 步骤 2：获取 Webhook Secret

1. 在 Creem 控制台进入 **Webhooks** 设置
2. 创建或查看 Webhook
3. 复制 **Webhook Secret**（格式类似：`whsec_xxxxx`）

### 步骤 3：在 Vercel 中配置环境变量

1. 访问 https://vercel.com 并登录
2. 进入你的项目（`gameing`）
3. 点击 **Settings** → **Environment Variables**
4. 添加以下变量：

#### Production 环境变量：

| Key | Value | 说明 |
|-----|-------|------|
| `CREEM_API_KEY` | `你的Creem API Key` | Creem API 密钥 |
| `CREEM_API_URL` | `https://test-api.creem.io` | 测试环境 API 地址（或生产环境地址） |
| `CREEM_WEBHOOK_SECRET` | `你的Webhook Secret` | Webhook 验证密钥 |
| `NEXT_PUBLIC_BASE_URL` | `https://你的域名.vercel.app` | 你的网站域名（用于支付回调） |

#### 示例：

```
CREEM_API_KEY=creem_test_5KZutiMLpVvMUzccqwLrG9
CREEM_API_URL=https://test-api.creem.io
CREEM_WEBHOOK_SECRET=whsec_2dnZpB6kbizyl2vNBCGw6b
NEXT_PUBLIC_BASE_URL=https://gameing-6nc1.vercel.app
```

### 步骤 4：配置 Webhook URL

1. 在 Creem 控制台进入 **Webhooks** 设置
2. 添加新的 Webhook：
   - **URL**: `https://你的域名.vercel.app/api/payment/creem/webhook`
   - **事件**: 选择 `checkout.completed` 或 `payment.succeeded`
   - **Secret**: 使用上面配置的 `CREEM_WEBHOOK_SECRET`

### 步骤 5：重新部署

1. 在 Vercel 项目页面
2. 点击 **Deployments** 标签
3. 找到最新的部署，点击 **"..."** → **"Redeploy"**
4. 或者等待自动重新部署（环境变量更改后会自动触发）

## ✅ 验证配置

配置完成后，测试充值功能：

1. 访问你的网站
2. 点击 **"充值金币"** 按钮
3. 输入充值金额
4. 点击 **"确认充值"**
5. 应该会跳转到 Creem 支付页面

如果仍然报错，检查：

- ✅ 环境变量是否已保存
- ✅ 是否已重新部署
- ✅ API Key 是否正确
- ✅ API URL 是否匹配（测试环境 vs 生产环境）
- ✅ Webhook URL 是否正确配置

## 🐛 常见错误

### 错误 1：403 Forbidden

**原因**：API Key 不正确或账户权限不足

**解决方案**：
- 检查 API Key 是否正确复制（不要有多余空格）
- 确认账户是否已完全激活
- 联系 Creem 支持确认账户权限

### 错误 2：API 密钥未配置

**原因**：环境变量未正确设置

**解决方案**：
- 检查 Vercel 环境变量是否已添加
- 确认环境变量名称正确（区分大小写）
- 重新部署项目

### 错误 3：Webhook 验证失败

**原因**：Webhook Secret 不匹配

**解决方案**：
- 检查 `CREEM_WEBHOOK_SECRET` 是否正确
- 确认 Creem 控制台中的 Webhook Secret 与 Vercel 中的一致

## 📞 需要帮助？

如果遇到问题：

1. 查看 Vercel 部署日志中的错误信息
2. 检查 Creem 控制台的 API 使用日志
3. 联系 Creem 支持：support@creem.io

## 🔒 安全提示

- ⚠️ **不要**在代码中硬编码 API Key
- ⚠️ **不要**将 `.env.local` 文件提交到 Git
- ✅ 只在 Vercel 环境变量中配置敏感信息
- ✅ 使用测试环境的 API Key 进行开发测试
