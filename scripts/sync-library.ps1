param(
  [string]$OutputFile
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $OutputFile = Join-Path $projectRoot "library-data.js"
}

$folderPattern = "^(.*?) - (.*?) \((\d{4})-(\d{2})\)$"
$folders = Get-ChildItem -LiteralPath $projectRoot -Directory |
  Where-Object { $_.Name -match $folderPattern }

$films = @()
foreach ($folder in $folders) {
  $match = [regex]::Match($folder.Name, $folderPattern)
  $author = $match.Groups[1].Value.Trim()
  $title = $match.Groups[2].Value.Trim()
  $year = $match.Groups[3].Value
  $month = $match.Groups[4].Value

  $videoFiles = @(
    Get-ChildItem -LiteralPath $folder.FullName -File |
      Where-Object { $_.Extension -ieq ".mp4" }
  )
  if ($videoFiles.Count -gt 1) {
    throw "$($folder.Name): MP4 영상은 하나만 넣어 주세요. 현재 $($videoFiles.Count)개입니다."
  }

  $transcriptPath = Join-Path $folder.FullName "본문.txt"
  $informationPath = Join-Path $folder.FullName "정보.txt"
  $transcript = if (Test-Path -LiteralPath $transcriptPath) {
    (Get-Content -Raw -Encoding UTF8 -LiteralPath $transcriptPath).Trim()
  } else {
    ""
  }
  $information = if (Test-Path -LiteralPath $informationPath) {
    (Get-Content -Raw -Encoding UTF8 -LiteralPath $informationPath).Trim()
  } else {
    ""
  }

  $excerptSource = ([regex]::Replace($transcript, "\s+", " ")).Trim()
  if ($excerptSource.Length -gt 170) {
    $excerpt = $excerptSource.Substring(0, 170) + "…"
  } elseif ($excerptSource.Length -gt 0) {
    $excerpt = $excerptSource
  } else {
    $excerpt = "기출 지문과 영상이 준비되는 대로 이 상영관에 공개됩니다."
  }

  $sha1 = [System.Security.Cryptography.SHA1]::Create()
  try {
    $hashBytes = $sha1.ComputeHash(
      [System.Text.Encoding]::UTF8.GetBytes($folder.Name)
    )
  } finally {
    $sha1.Dispose()
  }
  $id = ([System.BitConverter]::ToString($hashBytes) -replace "-", "").
    ToLowerInvariant().Substring(0, 10)

  $video = $null
  $durationLabel = "상영 준비 중"
  if ($videoFiles.Count -eq 1) {
    $encodedFolder = [System.Uri]::EscapeDataString($folder.Name)
    $encodedVideo = [System.Uri]::EscapeDataString($videoFiles[0].Name)
    $video = "./$encodedFolder/$encodedVideo"
    $durationLabel = "단편 상영"
  }

  $examLabel = if ($month -eq "11") {
    "${year}학년도 대학수학능력시험"
  } else {
    "${year}학년도 $([int]$month)월 모의평가"
  }
  $examShort = if ($month -eq "11") {
    "$year 수능"
  } else {
    "$year.$month"
  }

  $films += [PSCustomObject]@{
    id = $id
    title = $title
    author = $author
    year = $year
    month = $month
    examLabel = $examLabel
    examShort = $examShort
    durationLabel = $durationLabel
    video = $video
    transcript = $(if ($transcript) { $transcript } else { $null })
    info = $(if ($information) { $information } else { $null })
    excerpt = $excerpt
  }
}

$films = @(
  $films |
    Sort-Object `
      @{ Expression = { "$($_.year)$($_.month)" }; Descending = $true },
      @{ Expression = { $_.title }; Descending = $false }
)

if ($films.Count -eq 0) {
  throw "작품 폴더를 찾지 못했습니다."
}

$json = ConvertTo-Json -InputObject @($films) -Depth 6
$content = "window.SIMNEMA_FILMS = $json;`r`n"
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText(
  [System.IO.Path]::GetFullPath($OutputFile),
  $content,
  $utf8WithoutBom
)

Write-Host "작품 $($films.Count)개를 불러왔습니다."
