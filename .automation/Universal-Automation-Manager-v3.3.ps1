# Universal Automation Manager v3.4 - Universal Project Manager
# Comprehensive automation management with AI integration
# Version: 3.4.0
# Date: 2025-01-31

param(
    [string]$Action = "help",
    [string]$ProjectPath = ".",
    [switch]$Verbose,
    [switch]$Force
)

# Enhanced automation manager with v3.3 features
Write-Host "🚀 Universal Automation Manager v3.3" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# AI-powered automation recommendations
function Get-AIAutomationRecommendations {
    param([string]$Path)
    
    Write-Host "🤖 AI Automation Analysis..." -ForegroundColor Yellow
    
    $recommendations = @()
    
    # Analyze project structure for automation opportunities
    $codeFiles = Get-ChildItem -Path $Path -Recurse -Include "*.ps1", "*.js", "*.py", "*.ts" | Measure-Object
    $configFiles = Get-ChildItem -Path $Path -Recurse -Include "*.json", "*.yaml", "*.yml" | Measure-Object
    
    if ($codeFiles.Count -gt 50) {
        $recommendations += "Consider implementing automated testing for better code quality"
    }
    
    if ($configFiles.Count -gt 10) {
        $recommendations += "Implement configuration validation automation"
    }
    
    # Check for automation opportunities
    $hasTests = Get-ChildItem -Path $Path -Recurse -Include "*test*", "*spec*" | Measure-Object
    if ($hasTests.Count -eq 0) {
        $recommendations += "Add automated testing framework"
    }
    
    $hasCI = Get-ChildItem -Path $Path -Recurse -Include ".github", ".gitlab-ci.yml", "azure-pipelines.yml" | Measure-Object
    if ($hasCI.Count -eq 0) {
        $recommendations += "Implement CI/CD pipeline automation"
    }
    
    return $recommendations
}

# Enhanced automation execution
function Invoke-EnhancedAutomation {
    param(
        [string]$Action,
        [string]$Path
    )
    
    switch ($Action.ToLower()) {
        "scan" {
            Write-Host "🔍 Running enhanced project scan..." -ForegroundColor Green
            & "$PSScriptRoot\Project-Scanner-Enhanced-v3.3.ps1" -ProjectPath $Path -Verbose
        }
        
        "test" {
            Write-Host "🧪 Running comprehensive tests..." -ForegroundColor Green
            # Run all test scripts
            Get-ChildItem -Path "$PSScriptRoot\testing" -Filter "*.ps1" | ForEach-Object {
                Write-Host "Running: $($_.Name)" -ForegroundColor Yellow
                & $_.FullName -ProjectPath $Path
            }
        }
        
        "build" {
            Write-Host "🔨 Building project..." -ForegroundColor Green
            # Run build automation
            Get-ChildItem -Path "$PSScriptRoot\build" -Filter "*.ps1" | ForEach-Object {
                Write-Host "Building: $($_.Name)" -ForegroundColor Yellow
                & $_.FullName -ProjectPath $Path
            }
        }
        
        "deploy" {
            Write-Host "🚀 Deploying project..." -ForegroundColor Green
            # Run deployment automation
            Get-ChildItem -Path "$PSScriptRoot\deployment" -Filter "*.ps1" | ForEach-Object {
                Write-Host "Deploying: $($_.Name)" -ForegroundColor Yellow
                & $_.FullName -ProjectPath $Path
            }
        }
        
        "optimize" {
            Write-Host "⚡ Optimizing project..." -ForegroundColor Green
            # Run optimization scripts
            Get-ChildItem -Path "$PSScriptRoot\optimization" -Filter "*.ps1" | ForEach-Object {
                Write-Host "Optimizing: $($_.Name)" -ForegroundColor Yellow
                & $_.FullName -ProjectPath $Path
            }
        }
        
        "ai-analysis" {
            Write-Host "🤖 Running AI analysis..." -ForegroundColor Green
            # Run AI analysis scripts
            Get-ChildItem -Path "$PSScriptRoot\ai-analysis" -Filter "*.ps1" | ForEach-Object {
                Write-Host "AI Analysis: $($_.Name)" -ForegroundColor Yellow
                & $_.FullName -ProjectPath $Path
            }
        }
        
        "all" {
            Write-Host "🔄 Running complete automation pipeline..." -ForegroundColor Green
            Invoke-EnhancedAutomation -Action "scan" -Path $Path
            Invoke-EnhancedAutomation -Action "test" -Path $Path
            Invoke-EnhancedAutomation -Action "build" -Path $Path
            Invoke-EnhancedAutomation -Action "optimize" -Path $Path
            Invoke-EnhancedAutomation -Action "ai-analysis" -Path $Path
        }
        
        "help" {
            Show-Help
        }
        
        default {
            Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
            Show-Help
        }
    }
}

# Show help information
function Show-Help {
    Write-Host "`n📖 Universal Automation Manager v3.3 Help" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "`nAvailable Actions:" -ForegroundColor Yellow
    Write-Host "  scan         - Run enhanced project scan" -ForegroundColor White
    Write-Host "  test         - Run comprehensive tests" -ForegroundColor White
    Write-Host "  build        - Build project" -ForegroundColor White
    Write-Host "  deploy       - Deploy project" -ForegroundColor White
    Write-Host "  optimize     - Optimize project" -ForegroundColor White
    Write-Host "  ai-analysis  - Run AI analysis" -ForegroundColor White
    Write-Host "  all          - Run complete automation pipeline" -ForegroundColor White
    Write-Host "  help         - Show this help" -ForegroundColor White
    Write-Host "`nUsage Examples:" -ForegroundColor Yellow
    Write-Host "  .\Universal-Automation-Manager-v3.3.ps1 -Action scan -ProjectPath ." -ForegroundColor White
    Write-Host "  .\Universal-Automation-Manager-v3.3.ps1 -Action all -Verbose" -ForegroundColor White
    Write-Host "  .\Universal-Automation-Manager-v3.3.ps1 -Action test -Force" -ForegroundColor White
}

# Main execution
try {
    if ($Verbose) {
        Write-Host "🔧 Configuration:" -ForegroundColor Cyan
        Write-Host "  Action: $Action" -ForegroundColor White
        Write-Host "  Project Path: $ProjectPath" -ForegroundColor White
        Write-Host "  Force: $Force" -ForegroundColor White
        Write-Host ""
    }
    
    # Get AI recommendations
    $recommendations = Get-AIAutomationRecommendations -Path $ProjectPath
    
    if ($recommendations.Count -gt 0) {
        Write-Host "🤖 AI Recommendations:" -ForegroundColor Yellow
        $recommendations | ForEach-Object {
            Write-Host "  • $_" -ForegroundColor White
        }
        Write-Host ""
    }
    
    # Execute automation
    Invoke-EnhancedAutomation -Action $Action -Path $ProjectPath
    
    Write-Host "`n✅ Automation completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Error "❌ Error during automation: $($_.Exception.Message)"
    exit 1
}
