Write-Host "🌐 Starting CyberSyn dashboard (web)..." -ForegroundColor Cyan
if (!(Test-Path "web")) { Write-Host "❌ web/ directory not found" -ForegroundColor Red; exit 1 }
Set-Location web
if (!(Test-Path "node_modules")) {
  Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
  npm install | Out-Null
}
Write-Host "▶️ Running dev server on http://localhost:3000" -ForegroundColor Green
npm run dev

