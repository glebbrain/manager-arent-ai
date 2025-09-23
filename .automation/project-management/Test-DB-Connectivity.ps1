Write-Host "🔌 Testing DB connectivity (stubs)..." -ForegroundColor Cyan

# This is a stub: performs HTTP GET to ClickHouse and checks env for Postgres

$envVars = @("PG_HOST","PG_PORT","PG_DB","PG_USER","PG_PASSWORD","CH_HOST","CH_PORT","CH_DB","CH_USER","CH_PASSWORD")
foreach ($v in $envVars) { Write-Host ("$v=" + [System.Environment]::GetEnvironmentVariable($v)) }

try {
  $chHost = [System.Environment]::GetEnvironmentVariable("CH_HOST"); if (-not $chHost) { $chHost = "localhost" }
  $chPort = [System.Environment]::GetEnvironmentVariable("CH_PORT"); if (-not $chPort) { $chPort = "8123" }
  $url = "http://$($chHost):$($chPort)/?query=SELECT%201"
  Write-Host ("CH HTTP: " + $url) -ForegroundColor Yellow
  $resp = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 3 -ErrorAction Stop
  Write-Host ("CH OK: " + $resp.StatusCode) -ForegroundColor Green
} catch {
  Write-Host ("CH ERROR: " + $_.Exception.Message) -ForegroundColor Red
}

Write-Host "ℹ️ Postgres connectivity not executed (requires psql or client)." -ForegroundColor Yellow
Write-Host "✅ DB connectivity test (stubs) finished" -ForegroundColor Green


