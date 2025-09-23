Write-Host "⚙️ Configuring DB env variables in .env..." -ForegroundColor Cyan

$envPath = ".env"
if (!(Test-Path $envPath)) {
  Write-Host "❌ .env not found. Run .\\.automation\\installation\\setup_environment.ps1 first." -ForegroundColor Red
  exit 1
}

$content = Get-Content $envPath -Raw

function Ensure-Line {
  param([string]$Key, [string]$Default)
  if ($content -notmatch "(?m)^$Key=") {
    Add-Content -Path $envPath -Value "$Key=$Default"
    Write-Host "➕ Added $Key" -ForegroundColor Green
  } else {
    Write-Host "✅ Exists $Key" -ForegroundColor Green
  }
}

Ensure-Line -Key "PG_HOST" -Default "localhost"
Ensure-Line -Key "PG_PORT" -Default "5432"
Ensure-Line -Key "PG_DB" -Default "cybersyn"
Ensure-Line -Key "PG_USER" -Default "postgres"
Ensure-Line -Key "PG_PASSWORD" -Default "postgres"

Ensure-Line -Key "CH_HOST" -Default "localhost"
Ensure-Line -Key "CH_PORT" -Default "8123"
Ensure-Line -Key "CH_DB" -Default "cybersyn"
Ensure-Line -Key "CH_USER" -Default "default"
Ensure-Line -Key "CH_PASSWORD" -Default ""

Write-Host "✅ DB env configuration complete" -ForegroundColor Green


