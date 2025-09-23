param([string]$ProjectName = "")

Write-Host "🔄 Sync EN-RU documentation (stub) for: $ProjectName" -ForegroundColor Cyan
if (Test-Path "prompts/EN.md" -and Test-Path "prompts/RU.md") {
  Write-Host "✅ Found prompts EN/RU. Manual review recommended." -ForegroundColor Green
} else {
  Write-Host "⚠️ prompts EN/RU not found or incomplete" -ForegroundColor Yellow
}
