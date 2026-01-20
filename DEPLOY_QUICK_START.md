# 🚀 快速部署指南

## 最简单的方式：使用 Vercel（5分钟部署）

### 第一步：准备代码
```bash
# 1. 确保代码已提交到 Git
git add .
git commit -m "准备部署"

# 2. 推送到 GitHub（如果没有仓库，先在 GitHub 创建）
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 第二步：在 Vercel 部署

1. **访问 https://vercel.com 并登录**（使用 GitHub 账号）

2. **点击 "New Project"**

3. **导入你的 GitHub 仓库**

4. **配置项目**
   - Framework Preset: Next.js（自动检测）
   - Root Directory: `./`（默认）
   - Build Command: `npm run build`（默认）
   - Output Directory: `.next`（默认）

5. **添加环境变量**
   点击 "Environment Variables"，添加以下变量：

   ```
   MONGODB_URI = mongodb+srv://用户名:密码@cluster0.xxxxx.mongodb.net/gold_miner?retryWrites=true&w=majority
   JWT_SECRET = 你的随机密钥（运行下面的命令生成）
   NEXT_PUBLIC_BASE_URL = https://你的项目名.vercel.app
   ```

   **生成 JWT_SECRET：**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

6. **点击 "Deploy"**

7. **等待部署完成**（通常 2-3 分钟）

8. **完成！** 访问 Vercel 提供的 URL

---

## 📝 MongoDB 数据库设置（如果还没有）

### 使用 MongoDB Atlas（免费）

1. **注册账号**
   - 访问 https://www.mongodb.com/cloud/atlas/register
   - 注册免费账号

2. **创建免费集群**
   - 选择 "Free" 套餐
   - 选择区域（建议选择离你最近的，如 `Asia Pacific (Hong Kong)`）
   - 点击 "Create"

3. **配置网络访问**
   - 点击左侧 "Network Access"
   - 点击 "Add IP Address"
   - 选择 "Allow Access from Anywhere"（或添加 `0.0.0.0/0`）
   - 点击 "Confirm"

4. **创建数据库用户**
   - 点击左侧 "Database Access"
   - 点击 "Add New Database User"
   - 选择 "Password" 认证
   - 输入用户名和密码（**记住这些信息！**）
   - 选择 "Read and write to any database"
   - 点击 "Add User"

5. **获取连接字符串**
   - 点击左侧 "Database"
   - 点击 "Connect"
   - 选择 "Connect your application"
   - 复制连接字符串
   - 格式：`mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - **替换 `<username>` 和 `<password>` 为刚才创建的用户名和密码**
   - **在末尾添加数据库名**：`/gold_miner?retryWrites=true&w=majority`

   最终格式：
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/gold_miner?retryWrites=true&w=majority
   ```

6. **在 Vercel 中设置环境变量**
   ```
   MONGODB_URI = 你的完整连接字符串
   ```

---

## ✅ 部署后检查

1. **访问你的网站 URL**
   - 应该能看到登录页面

2. **测试注册功能**
   - 注册一个新账号
   - 应该能成功注册并登录

3. **测试游戏功能**
   - 进入游戏大厅
   - 选择一个游戏
   - 应该能正常游玩

---

## 🔧 可选功能配置

### AI 聊天功能
如果需要使用 AI 聊天，添加：
```
OPENROUTER_API_KEY = sk-or-v1-你的密钥
```

### 视频生成功能
如果需要使用视频生成，添加：
```
SISIF_API_KEY = 你的密钥
# 或
VEO_API_KEY = 你的密钥
```

### 支付功能
如果需要使用支付，添加：
```
CREEM_API_KEY = 你的密钥
CREEM_WEBHOOK_SECRET = 你的密钥
```

---

## 🆘 遇到问题？

### 部署失败
- 检查 Node.js 版本（需要 18+）
- 查看 Vercel 部署日志中的错误信息

### 数据库连接失败
- 确认 MongoDB Atlas 的网络访问已配置（允许所有 IP）
- 确认连接字符串中的用户名和密码正确
- 确认连接字符串格式正确

### 网站无法访问
- 等待几分钟（DNS 传播需要时间）
- 检查 Vercel 部署状态是否为 "Ready"

---

## 📚 更多信息

详细部署指南请查看 `DEPLOYMENT.md`

祝部署顺利！🎉
