Write-Host "🔄 Running CyberSyn ETL Pipeline..." -ForegroundColor Cyan

# Ensure output directory
if (!(Test-Path "temp/etl_out")) { New-Item -ItemType Directory -Path "temp/etl_out" -Force | Out-Null }

$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
  $cmd = "import sys, os; sys.path.append('src'); from etl.posthog_ga4_stub import ingest_posthog_ga4; from etl.stripe_stub import ingest_stripe; from etl.ads_csv_stub import ingest_ads_csv; ingest_posthog_ga4('sample_source'); ingest_stripe('sk_test_xxx'); ingest_ads_csv('ads.csv'); print('ETL outputs generated')"
  & python -c $cmd
} else {
  Write-Host "⚠️ Python not found in PATH. Generating placeholder outputs via PowerShell." -ForegroundColor Yellow
  $now = (Get-Date).ToUniversalTime().ToString("s") + "Z"
  # posthog_ga4.json
  @{
    source = 'sample_source';
    generated_at = $now;
    events = @(@{ user_id = '00000000-0000-0000-0000-000000000000'; event_type = 'signup'; timestamp = $now })
  } | ConvertTo-Json -Depth 4 | Out-File -FilePath "temp/etl_out/posthog_ga4.json" -Encoding UTF8
  # stripe_payments.json
  @{
    provider = 'stripe';
    generated_at = $now;
    payments = @(@{ user_id = '00000000-0000-0000-0000-000000000000'; amount = 9.99; currency = 'USD'; status = 'succeeded'; timestamp = $now })
  } | ConvertTo-Json -Depth 4 | Out-File -FilePath "temp/etl_out/stripe_payments.json" -Encoding UTF8
  # ads_costs.csv
  @("source,campaign,cost,clicks,impressions,created_at", "google,brand,12.34,100,5000,$now") | Out-File -FilePath "temp/etl_out/ads_costs.csv" -Encoding UTF8
}

Write-Host "📂 temp/etl_out contents:" -ForegroundColor Yellow
Get-ChildItem "temp/etl_out" | Select-Object Name,Length | Format-Table

Write-Host "✅ ETL run finished" -ForegroundColor Green


