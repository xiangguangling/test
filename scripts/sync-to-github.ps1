param(
    [switch]$Watch,
    [switch]$Once,
    [int]$DebounceSeconds = 8
)

$ErrorActionPreference = 'Continue'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$DebounceFile = Join-Path $RepoRoot '.git-sync-debounce'

function Test-ShouldIgnore {
    param([string]$RelativePath)
    return ($RelativePath -replace '\\', '/') -match '(^|/)(node_modules|dist|\.git|\.github)(/|$)|tsconfig\.tsbuildinfo$|\.git-sync'
}

function Sync-ToGitHub {
    Set-Location $RepoRoot

    if (Test-Path '.git-sync.lock') {
        Write-Host '[sync] 已有同步任务进行中，跳过'
        return
    }

    New-Item -ItemType File -Path '.git-sync.lock' -Force | Out-Null

    try {
        git add -A

        # .github 需 workflow 权限，自动同步时暂不提交，避免 push 失败
        if (Test-Path '.github') {
            git reset HEAD -- .github 2>$null
        }

        $status = git status --porcelain
        if (-not $status) {
            Write-Host "[sync] $(Get-Date -Format 'HH:mm:ss') 无变更，无需同步"
            return
        }

        $message = "auto-sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git commit -m $message
        if ($LASTEXITCODE -ne 0) {
            Write-Host '[sync] 提交失败'
            return
        }

        Write-Host "[sync] $(Get-Date -Format 'HH:mm:ss') 正在推送到 GitHub..."
        git push origin master 2>&1 | ForEach-Object { Write-Host $_ }

        if ($LASTEXITCODE -eq 0) {
            Write-Host "[sync] $(Get-Date -Format 'HH:mm:ss') 已同步到 https://github.com/xiangguangling/test"
        } else {
            Write-Host '[sync] 推送失败，请检查网络或 GitHub 凭据'
        }
    }
    finally {
        Remove-Item '.git-sync.lock' -Force -ErrorAction SilentlyContinue
    }
}

function Start-WatchMode {
    Write-Host '============================================'
    Write-Host ' GitHub 自动同步已启动'
    Write-Host " 监控目录: $RepoRoot"
    Write-Host " 远程仓库: https://github.com/xiangguangling/test"
    Write-Host " 防抖延迟: ${DebounceSeconds} 秒"
    Write-Host ' 关闭此窗口即可停止同步'
    Write-Host '============================================'
    Write-Host ''

    $pending = $false
    $lastChange = Get-Date

    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $RepoRoot
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true
    $watcher.NotifyFilter = [IO.NotifyFilters]'FileName, LastWrite, Size, CreationTime'

    $onChange = {
        param($sender, $eventArgs)
        $rel = $eventArgs.FullPath.Substring($RepoRoot.Length).TrimStart('\', '/')
        if (Test-ShouldIgnore $rel) { return }
        $script:pending = $true
        $script:lastChange = Get-Date
        Write-Host "[watch] $(Get-Date -Format 'HH:mm:ss') 检测到变更: $rel"
    }

    Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $onChange | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName Created -Action $onChange | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $onChange | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $onChange | Out-Null

    try {
        while ($true) {
            Start-Sleep -Seconds 1
            if ($pending -and ((Get-Date) - $lastChange).TotalSeconds -ge $DebounceSeconds) {
                $pending = $false
                Sync-ToGitHub
            }
        }
    }
    finally {
        $watcher.EnableRaisingEvents = $false
        $watcher.Dispose()
    }
}

if ($Watch) {
    Start-WatchMode
}
elseif ($Once) {
    $token = (Get-Date).ToString('o')
    Set-Content -Path $DebounceFile -Value $token -Encoding UTF8
    Start-Sleep -Seconds $DebounceSeconds
    $latest = Get-Content -Path $DebounceFile -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($latest.Trim() -ne $token) { exit 0 }
    Remove-Item $DebounceFile -Force -ErrorAction SilentlyContinue
    Sync-ToGitHub
}
else {
    Sync-ToGitHub
}
