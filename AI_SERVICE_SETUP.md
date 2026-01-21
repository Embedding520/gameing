# AI 助手服务配置指南

## 📋 问题诊断

如果 AI 助手显示"AI服务暂时不可用"，可能是以下原因：

1. **API Key 未配置或已过期**
2. **API Key 无效**
3. **请求频率限制**
4. **网络连接问题**

## 🔧 配置步骤

### 步骤 1：获取 OpenRouter API Key

1. 访问 OpenRouter 官网：https://openrouter.ai
2. 注册或登录账户
3. 进入 **Keys** 页面：https://openrouter.ai/keys
4. 创建新的 API Key 或复制现有的 API Key
5. API Key 格式类似：`sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 步骤 2：在 Vercel 中配置环境变量

1. 访问 https://vercel.com 并登录
2. 进入你的项目（`gameing`）
3. 点击 **Settings** → **Environment Variables**
4. 添加以下变量：

| Key | Value | 说明 |
|-----|-------|------|
| `OPENROUTER_API_KEY` | `你的OpenRouter API Key` | OpenRouter API 密钥 |

**配置建议**：
- **Environments**: 选择 "Production" 或 "All Environments"
- **Sensitive**: 打开（这是敏感信息）

### 步骤 3：重新部署

1. 在 Vercel 项目页面
2. 点击 **Deployments** 标签
3. 找到最新部署，点击 **"..."** → **"Redeploy"**
4. 等待部署完成（通常 1-2 分钟）

## ✅ 验证配置

配置完成后，访问诊断工具检查配置：

```
https://你的域名.vercel.app/api/ai/test
```

诊断工具会显示：
- ✅ API Key 是否已配置
- ✅ API Key 是否有效
- ✅ API 连接测试结果
- ✅ 具体的问题和建议

## 🐛 常见错误

### 错误 1：401 Unauthorized

**原因**：API Key 无效或已过期

**解决方案**：
1. 检查 API Key 是否正确复制（不要有多余空格）
2. 访问 https://openrouter.ai/keys 确认 API Key 是否仍然有效
3. 如果已过期，创建新的 API Key 并更新环境变量
4. 重新部署项目

### 错误 2：429 Too Many Requests

**原因**：请求频率超过限制

**解决方案**：
1. 等待一段时间后重试
2. 升级 OpenRouter 账户以获得更高的请求限制
3. 检查是否有其他应用在使用同一个 API Key

### 错误 3：500 Internal Server Error

**原因**：OpenRouter 服务器错误或模型不可用

**解决方案**：
1. 检查 OpenRouter 服务状态：https://status.openrouter.ai
2. 等待一段时间后重试
3. 如果问题持续，联系 OpenRouter 支持

### 错误 4：AI服务配置错误

**原因**：环境变量未正确配置

**解决方案**：
1. 确认 `OPENROUTER_API_KEY` 已在 Vercel 环境变量中配置
2. 确认环境变量名称正确（区分大小写）
3. 确认已重新部署项目

## 📝 当前使用的模型

- **模型**: `xiaomi/mimo-v2-flash:free`
- **特点**: 免费模型，支持推理（reasoning）
- **提供商**: OpenRouter

如果需要更换模型，可以修改 `app/api/ai/chat/route.ts` 中的 `model` 参数。

## 🔒 安全提示

- ⚠️ **不要**在代码中硬编码 API Key
- ⚠️ **不要**将 `.env.local` 文件提交到 Git
- ✅ 只在 Vercel 环境变量中配置敏感信息
- ✅ 定期轮换 API Key 以提高安全性

## 📞 需要帮助？

如果遇到问题：

1. 访问诊断工具：`https://你的域名.vercel.app/api/ai/test`
2. 查看 Vercel 部署日志中的错误信息
3. 检查 OpenRouter 控制台的 API 使用日志
4. 联系 OpenRouter 支持：support@openrouter.ai
