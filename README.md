# 娱乐中心 🎮

一个集休闲、策略、棋牌、益智、动作于一体的综合娱乐中心，包含20+款小游戏。

## ✨ 功能特性

### 🎮 游戏系统
- **20+ 款游戏**：涵盖休闲、策略、棋牌、益智、动作五大类别
- **游戏分类**：按区域组织，方便查找
- **道具系统**：每个游戏都有独特的道具和强化
- **商店系统**：购买和使用游戏道具

### 👤 用户系统
- 用户注册和登录
- 个人中心（等级、成就、统计）
- 头像上传
- 金币系统

### 🏆 排行榜系统
- 全站排行榜（总分、金币、等级）
- 游戏排行榜（按游戏分类）
- 时间筛选（全部、本周、本月）

### 💬 社区功能
- 论坛评论系统
- AI 聊天助手
- AI 视频生成

### 💰 支付系统
- 充值功能
- 金币购买道具

## 🛠️ 技术栈

- **前端**: Next.js 14, React, TypeScript, Canvas
- **后端**: Next.js API Routes
- **数据库**: MongoDB
- **认证**: JWT
- **支付**: Creem API

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 环境变量

创建 `.env.local` 文件：

```bash
# 必需
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# 可选
OPENROUTER_API_KEY=your_openrouter_api_key
SISIF_API_KEY=your_sisif_api_key
VEO_API_KEY=your_veo_api_key
CREEM_API_KEY=your_creem_api_key
CREEM_WEBHOOK_SECRET=your_creem_webhook_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

生成 JWT_SECRET：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📦 部署

### 快速部署（推荐使用 Vercel）

1. 将代码推送到 GitHub
2. 访问 [Vercel](https://vercel.com) 并登录
3. 导入你的 GitHub 仓库
4. 配置环境变量
5. 点击部署

**详细部署指南请查看：**
- [快速部署指南](./DEPLOY_QUICK_START.md) - 5分钟快速部署
- [完整部署文档](./DEPLOYMENT.md) - 详细部署说明

### 其他部署平台

- **Railway**: 支持数据库托管
- **Render**: 免费套餐
- **VPS**: 自己的服务器

## 🎮 游戏列表

### 休闲区
- 贪吃蛇
- 消消乐
- 黄金矿工
- 像素鸟
- 水果忍者

### 战争策略
- 飞机大战
- 塔防
- 战舰
- 象棋大战

### 棋牌
- 德州扑克
- 21点
- 麻将
- 纸牌接龙

### 益智
- 俄罗斯方块
- 2048
- 数独
- 记忆翻牌

### 动作
- 打砖块
- 赛车
- 平台跳跃

## 📝 项目结构

```
├── app/
│   ├── api/          # API 路由
│   ├── components/   # React 组件
│   ├── games/        # 游戏页面
│   └── profile/      # 个人中心
├── lib/              # 工具函数
└── game/             # 游戏逻辑
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
