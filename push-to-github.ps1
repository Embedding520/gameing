# GitHub 推送脚本
# 使用方法：在 PowerShell 中运行此脚本，然后输入你的 GitHub 仓库 URL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  推送代码到 GitHub 仓库" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否已配置远程仓库
$remote = git remote get-url origin 2>$null
if ($remote) {
    Write-Host "检测到已配置的远程仓库: $remote" -ForegroundColor Yellow
    $confirm = Read-Host "是否使用此仓库？(Y/N)"
    if ($confirm -eq "Y" -or $confirm -eq "y") {
        Write-Host "正在推送到 GitHub..." -ForegroundColor Green
        git push -u origin main
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ 代码已成功推送到 GitHub！" -ForegroundColor Green
            Write-Host "仓库地址: $remote" -ForegroundColor Cyan
        } else {
            Write-Host ""
            Write-Host "❌ 推送失败，请检查网络连接和仓库权限" -ForegroundColor Red
        }
        exit
    }
}

# 如果没有远程仓库或用户选择不使用，则要求输入新的 URL
Write-Host "请提供你的 GitHub 仓库 URL" -ForegroundColor Yellow
Write-Host "格式示例: https://github.com/用户名/仓库名.git" -ForegroundColor Gray
Write-Host "或者: git@github.com:用户名/仓库名.git" -ForegroundColor Gray
Write-Host ""

$repoUrl = Read-Host "请输入仓库 URL"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ 未输入仓库 URL，操作已取消" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "正在添加远程仓库..." -ForegroundColor Green
git remote add origin $repoUrl 2>$null
if ($LASTEXITCODE -ne 0) {
    # 如果添加失败，可能是已存在，尝试更新
    Write-Host "远程仓库已存在，正在更新..." -ForegroundColor Yellow
    git remote set-url origin $repoUrl
}

Write-Host "正在推送到 GitHub..." -ForegroundColor Green
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 代码已成功推送到 GitHub！" -ForegroundColor Green
    Write-Host "仓库地址: $repoUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "下一步：" -ForegroundColor Yellow
    Write-Host "1. 访问 https://vercel.com 并登录" -ForegroundColor White
    Write-Host "2. 点击 'New Project'" -ForegroundColor White
    Write-Host "3. 导入你的 GitHub 仓库" -ForegroundColor White
    Write-Host "4. 配置环境变量并部署" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ 推送失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因：" -ForegroundColor Yellow
    Write-Host "1. 仓库 URL 不正确" -ForegroundColor White
    Write-Host "2. 未在 GitHub 创建仓库" -ForegroundColor White
    Write-Host "3. 未配置 GitHub 认证" -ForegroundColor White
    Write-Host "4. 网络连接问题" -ForegroundColor White
    Write-Host ""
    Write-Host "请检查：" -ForegroundColor Yellow
    Write-Host "- 确保已在 GitHub 创建仓库" -ForegroundColor White
    Write-Host "- 仓库 URL 格式正确" -ForegroundColor White
    Write-Host "- 如果使用 HTTPS，可能需要输入 GitHub 用户名和密码/Token" -ForegroundColor White
}
