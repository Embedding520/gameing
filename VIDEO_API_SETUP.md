# 视频生成API配置指南

## 常见问题排查

### 1. 检查API密钥是否正确配置

确保 `.env.local` 文件格式正确：
```bash
SISIF_API_KEY=your_api_key_here
```
或
```bash
VEO_API_KEY=your_api_key_here
```

**注意：**
- 不要有引号
- 不要有前后空格
- 确保密钥完整

### 2. 重启开发服务器

修改 `.env.local` 后必须重启：
```bash
# 停止服务器 (Ctrl+C)
# 然后重新运行
npm run dev
```

### 3. 检查API端点

不同API提供商的端点可能不同。如果遇到错误，请：

1. **打开浏览器开发者工具（F12）**
2. **查看 Console 标签页** - 查看前端错误
3. **查看 Network 标签页** - 查看API请求和响应
4. **查看服务器控制台** - 查看后端错误日志

### 4. Sisif API 可能的问题

Sisif API的实际端点格式可能与文档不同。如果遇到404或401错误：

1. 确认API密钥是否正确
2. 检查API文档：https://sisif.ai/docs
3. 端点可能是：
   - `https://api.sisif.ai/v1/videos/generate`
   - `https://api.sisif.ai/videos/generate`
   - 或其他格式

### 5. 测试API配置

可以在服务器控制台查看详细的错误信息。如果看到：
- "SISIF_API_KEY 未配置" - 说明环境变量没有正确加载
- "API调用失败: 401" - 说明API密钥无效
- "API调用失败: 404" - 说明端点URL不正确

## 推荐的免费API

### Veo 3.1 API（推荐）
- 每月100免费credits
- 文档完善
- 官网：https://veo3api.com

### 其他选项
- deAPI：注册送$5免费额度
- HeyGen：每月10 credits（带水印）

## 获取帮助

如果仍然遇到问题：
1. 检查服务器控制台的完整错误信息
2. 查看浏览器Network标签页的API响应
3. 确认API提供商的文档和端点格式
