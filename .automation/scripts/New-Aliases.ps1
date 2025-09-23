# New-Aliases.ps1
# Create PowerShell aliases for quick access to automation commands

Write-Host "🔗 Creating PowerShell aliases for Universal Project Manager..." -ForegroundColor Cyan

# Function to create alias if it doesn't exist
function New-SafeAlias {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Description
    )
    
    if (-not (Get-Alias -Name $Name -ErrorAction SilentlyContinue)) {
        Set-Alias -Name $Name -Value $Value -Scope Global
        Write-Host "  ✅ Created alias: $Name -> $Value" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Alias already exists: $Name" -ForegroundColor Yellow
    }
}

# Quick access aliases
Write-Host "`n📋 Creating quick access aliases..." -ForegroundColor Yellow

# Main automation aliases
New-SafeAlias "ia" ".\Invoke-Automation.ps1" "Invoke Automation"
New-SafeAlias "qa" ".\Quick-Access.ps1" "Quick Access"

# Quick workflow aliases
New-SafeAlias "iaq" ".\Invoke-Automation.ps1 -Action analyze -AI -Quick" "Analyze + Quick Profile"
New-SafeAlias "iab" ".\Invoke-Automation.ps1 -Action build -AI" "Build with AI"
New-SafeAlias "iat" ".\Invoke-Automation.ps1 -Action test -AI" "Test with AI"
New-SafeAlias "ias" ".\Invoke-Automation.ps1 -Action status" "Show Status"
New-SafeAlias "iad" ".\Invoke-Automation.ps1 -Action dev -AI" "Development Workflow"
New-SafeAlias "iap" ".\Invoke-Automation.ps1 -Action prod -AI -Enterprise" "Production Workflow"

# Quick access aliases
New-SafeAlias "qas" ".\Quick-Access.ps1 -Command status" "Quick Status"
New-SafeAlias "qasc" ".\Quick-Access.ps1 -Command scan -AI" "Quick Scan"
New-SafeAlias "qab" ".\Quick-Access.ps1 -Command build -AI" "Quick Build"
New-SafeAlias "qat" ".\Quick-Access.ps1 -Command test -AI" "Quick Test"
New-SafeAlias "qad" ".\Quick-Access.ps1 -Command dev -AI" "Quick Dev"
New-SafeAlias "qap" ".\Quick-Access.ps1 -Command prod -Enterprise" "Quick Prod"

# Project management aliases
New-SafeAlias "psc" ".\Project-Scanner-Enhanced-v3.5.ps1 -EnableAI -GenerateReport" "Project Scanner"
New-SafeAlias "uam" ".\Universal-Automation-Manager-v3.5.ps1" "Universal Automation Manager"
New-SafeAlias "aefm" ".\AI-Enhanced-Features-Manager-v3.5.ps1" "AI Enhanced Features Manager"

Write-Host "`n✅ Aliases created successfully!" -ForegroundColor Green
Write-Host "`n💡 Usage examples:" -ForegroundColor Cyan
Write-Host "  iaq     # Analyze + Quick Profile" -ForegroundColor Gray
Write-Host "  iad     # Development Workflow" -ForegroundColor Gray
Write-Host "  qasc    # Quick AI Scan" -ForegroundColor Gray
Write-Host "  qad     # Quick Development" -ForegroundColor Gray
Write-Host "  psc     # Project Scanner" -ForegroundColor Gray

Write-Host "`n🔧 To remove aliases, restart PowerShell or run:" -ForegroundColor Yellow
Write-Host "  Remove-Item Alias:ia, Alias:qa, Alias:iaq, Alias:qas -ErrorAction SilentlyContinue" -ForegroundColor Gray