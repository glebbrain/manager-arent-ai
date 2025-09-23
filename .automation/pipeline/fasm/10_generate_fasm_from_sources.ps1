param(
    [switch]$Force
)

Write-Host "🛠️ [FASM-10] Generate FASM from C/C++ sources" -ForegroundColor Cyan

function Get-LangForFile([string]$path) {
    switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
        ".c"   { return "c" }
        ".cpp" { return "cpp" }
        default { return "c" }
    }
}

$srcRoots = @("sources/c","sources/cpp")
$created = 0
foreach ($root in $srcRoots) {
    if (-not (Test-Path $root)) { continue }
    $files = Get-ChildItem $root -Recurse -Include *.c,*.cpp -ErrorAction SilentlyContinue
    foreach ($f in $files) {
        $lang = Get-LangForFile $f.FullName
        $destDir = if ($lang -eq "cpp") { "knowledge/cpp" } else { "knowledge/c" }
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
        $base = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
        $dest = Join-Path $destDir ($base + ".asm")
        if ((Test-Path $dest) -and -not $Force) {
            Write-Host "↷ Skip existing: $dest (use -Force to overwrite)" -ForegroundColor DarkYellow
            continue
        }
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        $fasm = @"
; ==============================================
; Auto-generated FASM skeleton
; Source: $($f.FullName)
; Language: $lang
; Generated: $timestamp
; NOTE: Replace body with optimized implementation for MenuetOS64
; ==============================================

use64

; Public symbol (adjust if needed)
public $base

$base:
    ; TODO: translate from C/C++ to FASM with proper calling convention
    ; placeholder epilogue
    ret
"@
        $fasm | Out-File -FilePath $dest -Encoding UTF8
        Write-Host "✍️  Created $dest" -ForegroundColor Yellow
        $created++
    }
}

Write-Host "✅ Generated $created FASM skeleton file(s)" -ForegroundColor Green
