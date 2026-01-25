# 修复 /api/payment/creem/verify 404 错误

## 问题
前端调用 `/api/payment/creem/verify` 返回 404，但文件确实存在。

## 解决方案

### 步骤 1：清除 Next.js 缓存

```powershell
# 删除 .next 文件夹
Remove-Item -Recurse -Force .next
```

### 步骤 2：重启 Next.js 开发服务器

1. 停止当前服务器（在运行 `npm run dev` 的终端按 `Ctrl+C`）
2. 重新启动：
   ```bash
   npm run dev
   ```

### 步骤 3：验证路由是否加载

在浏览器中访问：
```
http://localhost:3000/api/payment/creem/verify
```

如果返回 405 (Method Not Allowed) 而不是 404，说明路由已加载（只是需要 POST 方法）。

### 步骤 4：如果仍然 404

检查 Next.js 终端是否有编译错误或警告。

## 临时解决方案

如果路由仍然无法加载，可以使用手动完成支付功能：

1. 在支付成功页面，点击"手动完成支付"按钮
2. 这会调用 `/api/payment/manual-complete` 端点（这个应该可以工作）
