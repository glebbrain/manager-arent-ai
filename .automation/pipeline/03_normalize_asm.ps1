Write-Host "🧹 [03] Normalize ASM (stub)" -ForegroundColor Cyan
$raw = "data/asm_raw"
$norm = "data/asm_norm"
if (-not (Test-Path $norm)) { New-Item -ItemType Directory -Path $norm | Out-Null; Write-Host "📁 Created $norm" -ForegroundColor Green }
$files = Get-ChildItem $raw -Recurse -Include *.s -ErrorAction SilentlyContinue
if (-not $files) { Write-Host "⚠️ No raw ASM found in $raw" -ForegroundColor Yellow; return }
foreach ($f in $files) {
  $json = Join-Path $norm ($f.BaseName + ".json")
  Write-Host "📝 Normalize ASM and emit: $json (todo)" -ForegroundColor Yellow
}
Write-Host "💡 After optimization, save FASM per function into 'knowledge/' (e.g., knowledge/my_strlen.asm)" -ForegroundColor DarkCyan
