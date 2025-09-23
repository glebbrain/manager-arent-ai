param(
    [string]$OutputFormat = "html",
    [switch]$OpenReport
)

Write-Host "📊 Analyzing test coverage..." -ForegroundColor Cyan

# Detect project type and run appropriate coverage tool
if (Test-Path "requirements.txt") {
    Write-Host "🐍 Running Python coverage..."
    & python -m pytest --cov=. --cov-report=html --cov-report=term
    if ($OpenReport -and (Test-Path "htmlcov/index.html")) {
        Start-Process "htmlcov/index.html"
    }
}
elseif (Test-Path "package.json") {
    Write-Host "📦 Running JavaScript coverage..."
    & npm run test -- --coverage
    if ($OpenReport -and (Test-Path "coverage/index.html")) {
        Start-Process "coverage/index.html"
    }
}
elseif (Test-Path "*.sln") {
    Write-Host "🔷 Running .NET coverage..."
    & dotnet test --collect:"XPlat Code Coverage"
}

Write-Host "✅ Coverage analysis complete!" -ForegroundColor Green


