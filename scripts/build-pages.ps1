param(
  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$outputPath = [System.IO.Path]::GetFullPath($OutputDirectory)
$rootPath = [System.IO.Path]::GetFullPath($projectRoot)
$driveRoot = [System.IO.Path]::GetPathRoot($outputPath)

if (
  $outputPath.Equals($rootPath, [System.StringComparison]::OrdinalIgnoreCase) -or
  $outputPath.Equals($driveRoot, [System.StringComparison]::OrdinalIgnoreCase)
) {
  throw "출력 폴더가 안전하지 않습니다: $outputPath"
}

& (Join-Path $PSScriptRoot "sync-library.ps1")

if (Test-Path -LiteralPath $outputPath) {
  Remove-Item -LiteralPath $outputPath -Recurse -Force
}
New-Item -ItemType Directory -Path $outputPath | Out-Null

foreach ($fileName in @("index.html", "site.css", "site.js", "library-data.js", "og.png")) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $fileName) -Destination $outputPath
}
[System.IO.File]::WriteAllText(
  (Join-Path $outputPath ".nojekyll"),
  "",
  (New-Object System.Text.UTF8Encoding($false))
)

$folderPattern = "^(.*?) - (.*?) \((\d{4})-(\d{2})\)$"
$folders = Get-ChildItem -LiteralPath $projectRoot -Directory |
  Where-Object { $_.Name -match $folderPattern }

foreach ($folder in $folders) {
  $videos = @(
    Get-ChildItem -LiteralPath $folder.FullName -File |
      Where-Object { $_.Extension -ieq ".mp4" }
  )
  if ($videos.Count -eq 0) {
    continue
  }

  $destination = Join-Path $outputPath $folder.Name
  New-Item -ItemType Directory -Path $destination | Out-Null
  Copy-Item -LiteralPath $videos[0].FullName -Destination $destination
}

Write-Host "GitHub Pages용 파일을 준비했습니다: $outputPath"
