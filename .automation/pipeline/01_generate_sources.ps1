Write-Host "📝 [01] Generate/Collect C/C++ sources" -ForegroundColor Cyan
$roots = @("sources/c","sources/cpp")
foreach ($r in $roots) { if (-not (Test-Path $r)) { New-Item -ItemType Directory -Path $r | Out-Null; Write-Host "📁 Created $r" -ForegroundColor Green } }
$existing = Get-ChildItem "sources" -Recurse -Include *.c,*.cpp -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "✅ Sources present: $($existing.Count) file(s). Skipping templates." -ForegroundColor Green
  return
}
# Seed minimal example in C when empty
$seedPath = "sources/c/strings.c"
$seedContent = @"
#include <stddef.h>
size_t my_strlen(const char* s){ size_t n=0; while(s && *s++){ ++n; } return n; }
"@
$parent=[System.IO.Path]::GetDirectoryName($seedPath)
if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent | Out-Null }
$seedContent | Out-File -FilePath $seedPath -Encoding UTF8
Write-Host "✍️  Seeded $seedPath" -ForegroundColor Yellow
