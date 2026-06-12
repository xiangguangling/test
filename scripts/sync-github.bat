@echo off
chcp 65001 >nul
title GitHub 自动同步 - dashboard

cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   dashboard 文件夹 - GitHub 自动同步         ║
echo  ║   远程: github.com/xiangguangling/test       ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  文件变更后约 8 秒会自动提交并推送到 GitHub
echo  请勿关闭此窗口
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-to-github.ps1" -Watch

pause
