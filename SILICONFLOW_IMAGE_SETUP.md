# SiliconFlow 图片生成配置指南

## 📋 环境变量配置

在项目根目录的 `.env.local` 文件中添加以下配置：

```env
SILICONFLOW_API_KEY=sk-xcpusufhnjocxoceonkbwskbjktghlwuliiuwuegtiyuqhjl
```

## 🔧 配置步骤

### 1. 打开 `.env.local` 文件

在项目根目录找到 `.env.local` 文件（如果不存在，请创建它）。

### 2. 添加 API Key

在文件末尾添加：

```env
SILICONFLOW_API_KEY=sk-xcpusufhnjocxoceonkbwskbjktghlwuliiuwuegtiyuqhjl
```

### 3. 重启开发服务器

修改 `.env.local` 后，需要重启 Next.js 开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
npm run dev
```

## ✅ 验证配置

配置完成后，测试图片生成功能：

1. 访问你的网站
2. 点击 **"🎨 图片生成"** 按钮
3. 输入图片描述
4. 点击 **"生成图片"**
5. 应该能正常生成图片

如果仍然报错，检查：

- ✅ `.env.local` 文件是否在项目根目录
- ✅ `SILICONFLOW_API_KEY` 是否正确（没有多余空格）
- ✅ 是否已重启开发服务器
- ✅ Next.js 终端是否有错误信息

## 🚀 生产环境配置

如果部署到 Vercel，需要在 Vercel 环境变量中添加：

1. 访问 https://vercel.com 并登录
2. 进入你的项目
3. 点击 **Settings** → **Environment Variables**
4. 添加：
   - **Key**: `SILICONFLOW_API_KEY`
   - **Value**: `sk-xcpusufhnjocxoceonkbwskbjktghlwuliiuwuegtiyuqhjl`
   - **Environment**: Production, Preview, Development（全选）
5. 重新部署项目

## 🔒 安全提示

- ⚠️ **不要**将 `.env.local` 文件提交到 Git
- ⚠️ **不要**在代码中硬编码 API Key
- ✅ 只在环境变量中配置敏感信息
- ✅ 确保 `.env.local` 在 `.gitignore` 中
