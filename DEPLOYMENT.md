# 项目部署指南

本指南将帮助你部署"娱乐中心"项目到生产环境。

## 📋 部署前准备

### 1. 环境变量清单

部署前需要准备以下环境变量：

#### 必需的环境变量
- `MONGODB_URI` - MongoDB 数据库连接字符串
- `JWT_SECRET` - JWT 令牌密钥（用于用户认证）

#### 可选的环境变量
- `OPENROUTER_API_KEY` - OpenRouter API 密钥（用于 AI 聊天）
- `SISIF_API_KEY` - Sisif API 密钥（用于视频生成）
- `VEO_API_KEY` - Veo API 密钥（用于视频生成）
- `CREEM_API_KEY` - Creem 支付 API 密钥
- `CREEM_WEBHOOK_SECRET` - Creem Webhook 密钥
- `NEXT_PUBLIC_BASE_URL` - 网站基础 URL（用于支付回调）

## 🚀 部署方案

### 方案一：Vercel（推荐，最简单）

Vercel 是 Next.js 官方推荐的部署平台，提供免费套餐。

#### 步骤：

1. **注册 Vercel 账号**
   - 访问 https://vercel.com
   - 使用 GitHub/GitLab/Bitbucket 账号登录

2. **准备代码仓库**
   ```bash
   # 初始化 Git（如果还没有）
   git init
   git add .
   git commit -m "Initial commit"
   
   # 推送到 GitHub/GitLab
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

3. **在 Vercel 部署**
   - 登录 Vercel
   - 点击 "New Project"
   - 导入你的 Git 仓库
   - 配置环境变量（在项目设置中添加所有必需的环境变量）
   - 点击 "Deploy"

4. **配置环境变量**
   在 Vercel 项目设置中添加：
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   OPENROUTER_API_KEY=your_openrouter_key (可选)
   SISIF_API_KEY=your_sisif_key (可选)
   VEO_API_KEY=your_veo_key (可选)
   CREEM_API_KEY=your_creem_key (可选)
   CREEM_WEBHOOK_SECRET=your_webhook_secret (可选)
   NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
   ```

5. **完成**
   - 部署完成后，Vercel 会提供一个 URL
   - 访问该 URL 即可使用你的应用

#### Vercel 优势：
- ✅ 完全免费（个人项目）
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动部署（Git push 后自动部署）
- ✅ 零配置

---

### 方案二：Railway（推荐，支持数据库）

Railway 提供完整的应用和数据库托管服务。

#### 步骤：

1. **注册 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 账号登录

2. **创建项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库

3. **配置 MongoDB**
   - 在 Railway 中添加 MongoDB 服务
   - 或使用 MongoDB Atlas（免费）
   - 获取连接字符串

4. **配置环境变量**
   在 Railway 项目设置中添加所有环境变量

5. **部署**
   - Railway 会自动检测 Next.js 项目并部署
   - 部署完成后会提供一个 URL

#### Railway 优势：
- ✅ 提供 MongoDB 托管
- ✅ 简单易用
- ✅ 有免费额度

---

### 方案三：Render（免费，适合小型项目）

#### 步骤：

1. **注册 Render 账号**
   - 访问 https://render.com
   - 使用 GitHub 账号登录

2. **创建 Web Service**
   - 点击 "New +" → "Web Service"
   - 连接你的 GitHub 仓库

3. **配置部署**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

4. **配置环境变量**
   在 Environment 标签页添加所有环境变量

5. **部署**
   - 点击 "Create Web Service"
   - 等待部署完成

---

### 方案四：自己的服务器（VPS）

如果你有自己的服务器，可以手动部署。

#### 步骤：

1. **服务器要求**
   - Node.js 18+ 
   - PM2（进程管理）
   - Nginx（反向代理，可选）

2. **安装依赖**
   ```bash
   # 克隆项目
   git clone <your-repo-url>
   cd cursor
   
   # 安装依赖
   npm install
   ```

3. **配置环境变量**
   ```bash
   # 创建 .env.local 文件
   nano .env.local
   # 添加所有环境变量
   ```

4. **构建项目**
   ```bash
   npm run build
   ```

5. **使用 PM2 运行**
   ```bash
   # 安装 PM2
   npm install -g pm2
   
   # 启动应用
   pm2 start npm --name "entertainment-center" -- start
   
   # 设置开机自启
   pm2 startup
   pm2 save
   ```

6. **配置 Nginx（可选）**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 🗄️ MongoDB 数据库设置

### 选项 1：MongoDB Atlas（推荐，免费）

1. **注册账号**
   - 访问 https://www.mongodb.com/cloud/atlas
   - 注册免费账号

2. **创建集群**
   - 选择免费套餐（M0）
   - 选择区域（建议选择离你最近的）
   - 创建集群

3. **配置网络访问**
   - 在 Network Access 中添加 IP 地址
   - 开发环境可以添加 `0.0.0.0/0`（允许所有 IP）

4. **创建数据库用户**
   - 在 Database Access 中创建用户
   - 记住用户名和密码

5. **获取连接字符串**
   - 点击 "Connect" → "Connect your application"
   - 复制连接字符串
   - 格式：`mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - 替换 `<username>` 和 `<password>`

6. **设置环境变量**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/gold_miner?retryWrites=true&w=majority
   ```

### 选项 2：本地 MongoDB

如果你在本地运行 MongoDB：
```
MONGODB_URI=mongodb://localhost:27017/gold_miner
```

---

## 🔐 生成 JWT_SECRET

JWT_SECRET 应该是一个随机字符串，用于加密 JWT 令牌。

```bash
# 在终端运行（生成随机字符串）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将生成的字符串设置为 `JWT_SECRET` 环境变量。

---

## ✅ 部署检查清单

部署前请确认：

- [ ] MongoDB 数据库已配置并可以连接
- [ ] 所有必需的环境变量已设置
- [ ] JWT_SECRET 已生成并设置
- [ ] 代码已推送到 Git 仓库
- [ ] 项目可以本地构建成功（`npm run build`）

---

## 🐛 常见问题

### 1. 构建失败
- 检查 Node.js 版本（需要 18+）
- 检查所有依赖是否安装（`npm install`）
- 查看构建日志中的错误信息

### 2. 数据库连接失败
- 检查 `MONGODB_URI` 是否正确
- 检查 MongoDB Atlas 的网络访问设置
- 检查数据库用户名和密码是否正确

### 3. 环境变量未生效
- 确认环境变量名称正确（区分大小写）
- 在 Vercel/Railway 等平台，需要重新部署才能生效
- 检查 `.env.local` 文件是否在 `.gitignore` 中（应该被忽略）

### 4. API 路由返回 500 错误
- 检查服务器日志
- 确认数据库连接正常
- 确认所有必需的环境变量已设置

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. 服务器日志
2. 浏览器控制台错误
3. 数据库连接状态
4. 环境变量配置

祝部署顺利！🎉
