Write-Host "🔧 [02] Build and extract ASM (stub)" -ForegroundColor Cyan
$srcC   = "sources/c"
$srcCPP = "sources/cpp"
$asm = "data/asm_raw"
if (-not (Test-Path $asm)) { New-Item -ItemType Directory -Path $asm | Out-Null; Write-Host "📁 Created $asm" -ForegroundColor Green }
$files = @()
if (Test-Path $srcC)   { $files += Get-ChildItem $srcC -Recurse -Include *.c -ErrorAction SilentlyContinue }
if (Test-Path $srcCPP) { $files += Get-ChildItem $srcCPP -Recurse -Include *.cpp -ErrorAction SilentlyContinue }
if (-not $files -or $files.Count -eq 0) { Write-Host "⚠️ No sources found in sources/c or sources/cpp" -ForegroundColor Yellow; return }
foreach ($f in $files) {
  $out = Join-Path $asm ($f.BaseName + ".s")
  $lang = ($f.Extension -eq ".c") ? "C" : "C++"
  Write-Host "⛏️  [$lang] Compile and dump ASM: $($f.FullName) -> $out (todo)" -ForegroundColor Yellow
}
