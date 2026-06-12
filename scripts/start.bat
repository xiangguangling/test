@echo off
chcp 65001 >nul
title 教育可视化仪表盘 - 一键启动
cd /d "%~dp0.."

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║      📊 教育可视化仪表盘 - 启动中...         ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ========== 1. 检查 Node.js ==========
echo  [1/3] 检查 Node.js 环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [✗] 未检测到 Node.js，请先安装 Node.js
    echo       下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 显示 Node.js 版本
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo  [✓] Node.js 已安装 (%~NODE_VERSION%)

:: ========== 2. 安装依赖 ==========
echo.
echo  [2/3] 检查项目依赖...

if not exist "node_modules\" (
    echo  [!] 首次运行，正在安装依赖，请稍候...
    call npm install
    if %errorlevel% neq 0 (
        echo  [✗] 依赖安装失败，请检查网络连接后重试
        pause
        exit /b 1
    )
    echo  [✓] 依赖安装完成
) else (
    echo  [✓] 依赖已就绪
)

:: ========== 3. 启动开发服务器 ==========
echo.
echo  [3/3] 启动开发服务器...
echo  ─────────────────────────────────────────────
echo.
echo  🚀 服务启动后浏览器将自动打开
echo  📍 本地地址: http://localhost:5173
echo  🛑 关闭此窗口即可停止服务
echo  ─────────────────────────────────────────────
echo.

:: 启动 Vite（就绪后自动打开浏览器，避免 ERR_INVALID_HTTP_RESPONSE）
echo  正在编译，请稍候...
echo.
call npx vite --host --open

:: 如果 vite 意外退出
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║  ⚠️  开发服务器已停止                        ║
echo  ╚══════════════════════════════════════════════╝
echo.
pause
