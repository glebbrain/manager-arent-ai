Write-Host "🏗️ Starting local infra (Postgres & ClickHouse) via docker-compose..." -ForegroundColor Cyan
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
  if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
  }
}
Push-Location infra
try {
  if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    docker-compose up -d
  } else {
    docker compose up -d
  }
  Write-Host "✅ Infra running" -ForegroundColor Green
} catch {
  Write-Host ("❌ Error starting infra: {0}" -f $_.Exception.Message) -ForegroundColor Red
} finally { Pop-Location }

