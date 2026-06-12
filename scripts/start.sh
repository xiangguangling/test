#!/usr/bin/env bash
# 教育可视化仪表盘 - 一键启动脚本 (macOS/Linux)
set -e
cd "$(dirname "$0")/.."

echo ""
echo " ╔══════════════════════════════════════════════╗"
echo " ║      📊 教育可视化仪表盘 - 启动中...         ║"
echo " ╚══════════════════════════════════════════════╝"
echo ""

# ========== 1. 检查 Node.js ==========
echo " [1/3] 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo " [✗] 未检测到 Node.js，请先安装 Node.js"
    echo "     下载地址: https://nodejs.org/"
    exit 1
fi
echo " [✓] Node.js 已安装 ($(node -v))"

# ========== 2. 安装依赖 ==========
echo ""
echo " [2/3] 检查项目依赖..."

if [ ! -d "node_modules" ]; then
    echo " [!] 首次运行，正在安装依赖，请稍候..."
    npm install
    echo " [✓] 依赖安装完成"
else
    echo " [✓] 依赖已就绪"
fi

# ========== 3. 启动开发服务器 ==========
echo ""
echo " [3/3] 启动开发服务器..."
echo " ─────────────────────────────────────────────"
echo ""
echo " 🚀 服务启动后浏览器将自动打开"
echo " 📍 本地地址: http://localhost:5173"
echo " 🛑 按 Ctrl+C 停止服务"
echo " ─────────────────────────────────────────────"
echo ""

npx vite --open
