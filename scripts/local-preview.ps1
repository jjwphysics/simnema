$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$indexPath = Join-Path $projectRoot "index.html"

& (Join-Path $PSScriptRoot "sync-library.ps1")
Start-Process -FilePath $indexPath

Write-Host ""
Write-Host "Simnema 미리보기를 열었습니다." -ForegroundColor Green
Write-Host "이 창은 닫아도 됩니다."
