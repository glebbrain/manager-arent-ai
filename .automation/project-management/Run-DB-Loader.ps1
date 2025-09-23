Write-Host "🗄️ Running DB loader..." -ForegroundColor Cyan

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
  Write-Host "⚠️ Python not found in PATH. Skipping DB loader execution." -ForegroundColor Yellow
  exit 0
}

$cmd = @"
import os, sys
sys.path.append('src')
from etl.db_loader_real import load_events_clickhouse_http, load_payments_postgres
from etl.db_loader_stub import load_ads_costs_to_postgres
print(load_events_clickhouse_http('temp/etl_out/posthog_ga4.json'))
print(load_payments_postgres('temp/etl_out/stripe_payments.json'))
print(load_ads_costs_to_postgres('temp/etl_out/ads_costs.csv'))
"@
& python -c $cmd

Write-Host "✅ DB loader finished" -ForegroundColor Green


