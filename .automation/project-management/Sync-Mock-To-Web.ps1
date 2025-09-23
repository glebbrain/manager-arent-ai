Write-Host "🔄 Syncing mock ETL outputs to web/public/mock..." -ForegroundColor Cyan
if (!(Test-Path "web/public/mock")) { New-Item -ItemType Directory -Path "web/public/mock" -Force | Out-Null }
Copy-Item -Path "temp/etl_out/posthog_ga4.json" -Destination "web/public/mock/posthog_ga4.json" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "temp/etl_out/stripe_payments.json" -Destination "web/public/mock/stripe_payments.json" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "temp/etl_out/ads_costs.csv" -Destination "web/public/mock/ads_costs.csv" -Force -ErrorAction SilentlyContinue
Write-Host "✅ Sync complete" -ForegroundColor Green

