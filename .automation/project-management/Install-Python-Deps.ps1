Write-Host "🐍 Installing Python dependencies from requirements.txt..." -ForegroundColor Cyan
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Host "❌ Python not found in PATH" -ForegroundColor Red
  exit 1
}
if (!(Test-Path "requirements.txt")) {
  Write-Host "❌ requirements.txt not found" -ForegroundColor Red
  exit 1
}
& python -m pip install --upgrade pip
& python -m pip install -r requirements.txt
Write-Host "✅ Python dependencies installed" -ForegroundColor Green

