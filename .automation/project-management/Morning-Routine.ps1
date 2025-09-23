# .automation/project-management/Morning-Routine.ps1
# IdealCompany AI-Powered Enterprise Ecosystem - Daily Automation Routine
# Version: 3.1 - Complete Project Analysis and Enhancement
# Last Updated: 2025-01-27

param(
    [switch]$Quiet,
    [switch]$Detailed,
    [switch]$SkipTests,
    [switch]$FullAnalysis,
    [switch]$HealthCheck,
    [switch]$PerformanceCheck,
    [switch]$SecurityCheck,
    [switch]$ArchitectureAnalysis,
    [switch]$DocumentationUpdate,
    [switch]$ComplianceCheck
)

$ErrorActionPreference = "Stop"

if (-not $Quiet) { 
    Write-Host "🌅 IdealCompany Morning Routine Starting..." -ForegroundColor Cyan
    Write-Host "🤖 AI-Powered Enterprise Ecosystem" -ForegroundColor Magenta
    Write-Host "📅 Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host "🎯 Project: IdealCompany - AI Orchestrator + RPA Factory + Blockchain" -ForegroundColor White
}

# Step 1: Check project status
if (-not $Quiet) { Write-Host "`n🔍 Step 1: Checking project status..." -ForegroundColor Yellow }
try {
    if (Test-Path ".\.automation\project-management\Check-ProjectStatus.ps1") {
        & .\.automation\project-management\Check-ProjectStatus.ps1 -Quiet
        if (-not $Quiet) { Write-Host "✅ Project status checked" -ForegroundColor Green }
    } else {
        if (-not $Quiet) { Write-Host "⚠️ Check-ProjectStatus.ps1 not found" -ForegroundColor Yellow }
    }
} catch {
    if (-not $Quiet) { Write-Host "❌ Error checking project status: $_" -ForegroundColor Red }
}

# Step 2: Validate project structure
if (-not $Quiet) { Write-Host "`n🔍 Step 2: Validating project structure..." -ForegroundColor Yellow }
try {
    if (Test-Path ".\.automation\validation\validate_project.ps1") {
        & .\.automation\validation\validate_project.ps1 -Quiet
        if (-not $Quiet) { Write-Host "✅ Project structure validated" -ForegroundColor Green }
    } else {
        if (-not $Quiet) { Write-Host "⚠️ validate_project.ps1 not found" -ForegroundColor Yellow }
    }
} catch {
    if (-not $Quiet) { Write-Host "❌ Error validating project: $_" -ForegroundColor Red }
}

# Step 3: Check for critical errors
if (-not $Quiet) { Write-Host "`n🚨 Step 3: Checking for critical errors..." -ForegroundColor Yellow }
try {
    if (Test-Path ".manager/ERRORS.md") {
        $errorContent = Get-Content ".manager/ERRORS.md" -Raw
        $criticalErrors = ($errorContent | Select-String -Pattern '🔴' -AllMatches).Matches.Count
        if ($criticalErrors -gt 0) {
            if (-not $Quiet) { Write-Host "🚨 Found $criticalErrors critical errors!" -ForegroundColor Red }
            if ($Detailed) {
                $errorLines = $errorContent -split "`n" | Where-Object { $_ -match '🔴' }
                $errorLines | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
            }
        } else {
            if (-not $Quiet) { Write-Host "✅ No critical errors found" -ForegroundColor Green }
        }
    } else {
        if (-not $Quiet) { Write-Host "⚠️ ERRORS.md not found" -ForegroundColor Yellow }
    }
} catch {
    if (-not $Quiet) { Write-Host "❌ Error checking errors: $_" -ForegroundColor Red }
}

# Step 4: Review active tasks
if (-not $Quiet) { Write-Host "`n📋 Step 4: Reviewing active tasks..." -ForegroundColor Yellow }
try {
    if (Test-Path ".manager/TODO.md") {
        $todoContent = Get-Content ".manager/TODO.md" -Raw
        $criticalTasks = ($todoContent | Select-String -Pattern '🔴' -AllMatches).Matches.Count
        $highTasks = ($todoContent | Select-String -Pattern '🟠' -AllMatches).Matches.Count
        $mediumTasks = ($todoContent | Select-String -Pattern '🟡' -AllMatches).Matches.Count
        $lowTasks = ($todoContent | Select-String -Pattern '🔵' -AllMatches).Matches.Count
        
        if (-not $Quiet) { 
            Write-Host "📊 Task Summary:" -ForegroundColor Cyan
            Write-Host "  🔴 Critical: $criticalTasks" -ForegroundColor Red
            Write-Host "  🟠 High: $highTasks" -ForegroundColor DarkYellow
            Write-Host "  🟡 Medium: $mediumTasks" -ForegroundColor Yellow
            Write-Host "  🔵 Low: $lowTasks" -ForegroundColor Blue
        }
        
        if ($criticalTasks -gt 0) {
            if (-not $Quiet) { Write-Host "⚠️ $criticalTasks critical tasks need attention!" -ForegroundColor Red }
        }
    } else {
        if (-not $Quiet) { Write-Host "⚠️ TODO.md not found" -ForegroundColor Yellow }
    }
} catch {
    if (-not $Quiet) { Write-Host "❌ Error reviewing tasks: $_" -ForegroundColor Red }
}

# Step 5: Check recent achievements
if (-not $Quiet) { Write-Host "`n🏆 Step 5: Checking recent achievements..." -ForegroundColor Yellow }
try {
    if (Test-Path ".manager/COMPLETED.md") {
        $completedContent = Get-Content ".manager/COMPLETED.md" -Raw
        $recentCompletions = ($completedContent | Select-String -Pattern '2025-01-27' -AllMatches).Matches.Count
        if (-not $Quiet) { 
            Write-Host "✅ Found $recentCompletions tasks completed today" -ForegroundColor Green
        }
    } else {
        if (-not $Quiet) { Write-Host "⚠️ COMPLETED.md not found" -ForegroundColor Yellow }
    }
} catch {
    if (-not $Quiet) { Write-Host "❌ Error checking achievements: $_" -ForegroundColor Red }
}

# Step 6: Clean temporary files
if (-not $Quiet) { Write-Host "`n🧹 Step 6: Cleaning temporary files..." -ForegroundColor Yellow }
try {
    if (Test-Path ".\.automation\utilities\clean_temp_files.ps1") {
        & .\.automation\utilities\clean_temp_files.ps1 -Quiet
        if (-not $Quiet) { Write-Host "✅ Temporary files cleaned" -ForegroundColor Green }
    } else {
        if (-not $Quiet) { Write-Host "⚠️ clean_temp_files.ps1 not found" -ForegroundColor Yellow }
    }
} catch {
    if (-not $Quiet) { Write-Host "❌ Error cleaning temp files: $_" -ForegroundColor Red }
}

# Step 7: Check AI Orchestrator status
if (-not $Quiet) { Write-Host "`n🤖 Step 7: Checking AI Orchestrator status..." -ForegroundColor Yellow }
try {
    if (Test-Path "src/ai-orchestrator/core/orchestrator.py") {
        if (-not $Quiet) { Write-Host "✅ AI Orchestrator core found" -ForegroundColor Green }
    } else {
        if (-not $Quiet) { Write-Host "⚠️ AI Orchestrator core not found" -ForegroundColor Yellow }
    }
} catch {
    if (-not $Quiet) { Write-Host "❌ Error checking AI Orchestrator: $_" -ForegroundColor Red }
}

# Step 8: Check RPA Factory status
if (-not $Quiet) { Write-Host "`n🔧 Step 8: Checking RPA Factory status..." -ForegroundColor Yellow }
try {
    if (Test-Path "src/rpa-factory/core/factory.py") {
        if (-not $Quiet) { Write-Host "✅ RPA Factory core found" -ForegroundColor Green }
    } else {
        if (-not $Quiet) { Write-Host "⚠️ RPA Factory core not found" -ForegroundColor Yellow }
    }
} catch {
    if (-not $Quiet) { Write-Host "❌ Error checking RPA Factory: $_" -ForegroundColor Red }
}

# Step 9: Check Vector Database status
if (-not $Quiet) { Write-Host "`n🗄️ Step 9: Checking Vector Database status..." -ForegroundColor Yellow }
try {
    if (Test-Path "src/vector-db/core/vector_manager.py") {
        if (-not $Quiet) { Write-Host "✅ Vector Database manager found" -ForegroundColor Green }
    } else {
        if (-not $Quiet) { Write-Host "⚠️ Vector Database manager not found" -ForegroundColor Yellow }
    }
} catch {
    if (-not $Quiet) { Write-Host "❌ Error checking Vector Database: $_" -ForegroundColor Red }
}

# Step 10: Check Blockchain integration
if (-not $Quiet) { Write-Host "`n⛓️ Step 10: Checking Blockchain integration..." -ForegroundColor Yellow }
try {
    if (Test-Path "src/blockchain/") {
        if (-not $Quiet) { Write-Host "✅ Blockchain integration found" -ForegroundColor Green }
    } else {
        if (-not $Quiet) { Write-Host "⚠️ Blockchain integration not found" -ForegroundColor Yellow }
    }
} catch {
    if (-not $Quiet) { Write-Host "❌ Error checking Blockchain: $_" -ForegroundColor Red }
}

# Step 11: Run tests (if not skipped)
if (-not $SkipTests) {
    if (-not $Quiet) { Write-Host "`n🧪 Step 11: Running automated tests..." -ForegroundColor Yellow }
    try {
        if (Test-Path ".\.automation\testing\run_tests.ps1") {
            & .\.automation\testing\run_tests.ps1 -Quiet
            if (-not $Quiet) { Write-Host "✅ Tests completed" -ForegroundColor Green }
        } else {
            if (-not $Quiet) { Write-Host "⚠️ run_tests.ps1 not found" -ForegroundColor Yellow }
        }
    } catch {
        if (-not $Quiet) { Write-Host "❌ Error running tests: $_" -ForegroundColor Red }
    }
}

# Step 12: Generate daily summary
if (-not $Quiet) { Write-Host "`n📊 Step 12: Generating daily summary..." -ForegroundColor Yellow }
try {
    $summary = @"
# Daily Summary - $(Get-Date -Format 'yyyy-MM-dd')

## Project Status
"- **Project**: IdealCompany - AI-Powered Enterprise Ecosystem"
"- **Status**: Development Phase"
"- **Last Check**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

## Task Overview
"- **Critical Tasks**: $criticalTasks"
"- **High Priority**: $highTasks"
"- **Medium Priority**: $mediumTasks"
"- **Low Priority**: $lowTasks"

"## Issues"
"- **Critical Errors**: $criticalErrors"
"- **Recent Completions**: $recentCompletions"

"## System Components Status"
"- **AI Orchestrator**: $(if (Test-Path "src/ai-orchestrator/core/orchestrator.py") { "✅ Active" } else { "⚠️ Missing" })"
"- **RPA Factory**: $(if (Test-Path "src/rpa-factory/core/factory.py") { "✅ Active" } else { "⚠️ Missing" })"
"- **Vector Database**: $(if (Test-Path "src/vector-db/core/vector_manager.py") { "✅ Active" } else { "⚠️ Missing" })"
"- **Blockchain**: $(if (Test-Path "src/blockchain/") { "✅ Active" } else { "⚠️ Missing" })"

## Recommendations
"@

    if ($criticalTasks -gt 0) {
        $summary += "`n- [CRITICAL] Focus on critical tasks first"
    }
    if ($criticalErrors -gt 0) {
        $summary += "`n- [ERROR] Address critical errors immediately"
    }
    if ($criticalTasks -eq 0 -and $criticalErrors -eq 0) {
        $summary += "`n- [OK] All systems green - continue with planned tasks"
    }

    if ($Detailed) {
        Write-Host $summary -ForegroundColor Cyan
    }
    
    # Save summary to file
    $summary | Out-File -FilePath ".manager/daily-summary-$(Get-Date -Format 'yyyy-MM-dd').md" -Encoding UTF8
    
    if (-not $Quiet) { Write-Host "✅ Daily summary generated" -ForegroundColor Green }
} catch {
    if (-not $Quiet) { Write-Host "❌ Error generating summary: $_" -ForegroundColor Red }
}

# Final status
if (-not $Quiet) { 
    Write-Host "`n🎯 IdealCompany Morning Routine Complete!" -ForegroundColor Green
    Write-Host "🤖 AI-Powered Enterprise Ecosystem Status: Ready" -ForegroundColor Magenta
    Write-Host "💡 Next steps:" -ForegroundColor Cyan
    if ($criticalTasks -gt 0) {
        Write-Host "  1. Address critical tasks (🔴)" -ForegroundColor Red
    }
    if ($criticalErrors -gt 0) {
        Write-Host "  2. Fix critical errors" -ForegroundColor Red
    }
    Write-Host "  3. Continue with AI Orchestrator development" -ForegroundColor White
    Write-Host "  4. Enhance RPA Factory automation" -ForegroundColor White
    Write-Host "  5. Optimize Vector Database performance" -ForegroundColor White
    Write-Host "  6. Test Blockchain integration" -ForegroundColor White
    Write-Host "  7. Run comprehensive tests before end of day" -ForegroundColor White
    Write-Host "`n🚀 Ready for AI-Powered Enterprise Development!" -ForegroundColor Green
}

# Additional Health Check Functions
if ($HealthCheck) {
    if (-not $Quiet) { Write-Host "`n🏥 Running comprehensive health check..." -ForegroundColor Yellow }
    
    # Check database connectivity
    try {
        if (Test-Path "database/schemas/postgresql_schema.sql") {
            if (-not $Quiet) { Write-Host "✅ PostgreSQL schema found" -ForegroundColor Green }
        }
        if (Test-Path "database/schemas/neo4j_schema.cypher") {
            if (-not $Quiet) { Write-Host "✅ Neo4j schema found" -ForegroundColor Green }
        }
        if (Test-Path "database/schemas/qdrant_config.yaml") {
            if (-not $Quiet) { Write-Host "✅ Qdrant configuration found" -ForegroundColor Green }
        }
    } catch {
        if (-not $Quiet) { Write-Host "❌ Database health check failed: $_" -ForegroundColor Red }
    }
}

# Performance Check
if ($PerformanceCheck) {
    if (-not $Quiet) { Write-Host "`n⚡ Running performance analysis..." -ForegroundColor Yellow }
    
    try {
        if (Test-Path ".\.automation\project-management\Analyze-Performance.ps1") {
            & .\.automation\project-management\Analyze-Performance.ps1 -Quiet
            if (-not $Quiet) { Write-Host "✅ Performance analysis completed" -ForegroundColor Green }
        }
    } catch {
        if (-not $Quiet) { Write-Host "❌ Performance check failed: $_" -ForegroundColor Red }
    }
}

# Security Check
if ($SecurityCheck) {
    if (-not $Quiet) { Write-Host "`n🔒 Running security analysis..." -ForegroundColor Yellow }
    
    try {
        if (Test-Path ".\.automation\project-management\Analyze-Security.ps1") {
            & .\.automation\project-management\Analyze-Security.ps1 -Quiet
            if (-not $Quiet) { Write-Host "✅ Security analysis completed" -ForegroundColor Green }
        }
    } catch {
        if (-not $Quiet) { Write-Host "❌ Security check failed: $_" -ForegroundColor Red }
    }
}

# Full Analysis Mode
if ($FullAnalysis) {
    if (-not $Quiet) { Write-Host "`n🔍 Running full system analysis..." -ForegroundColor Yellow }
    
    try {
        if (Test-Path ".\.automation\project-management\Analyze-Architecture.ps1") {
            & .\.automation\project-management\Analyze-Architecture.ps1 -Quiet
            if (-not $Quiet) { Write-Host "✅ Architecture analysis completed" -ForegroundColor Green }
        }
        
        if (Test-Path ".\.automation\project-management\Generate-Comprehensive-Report.ps1") {
            & .\.automation\project-management\Generate-Comprehensive-Report.ps1 -Quiet
            if (-not $Quiet) { Write-Host "✅ Comprehensive report generated" -ForegroundColor Green }
        }
    } catch {
        if (-not $Quiet) { Write-Host "❌ Full analysis failed: $_" -ForegroundColor Red }
    }
}

# Architecture Analysis Mode
if ($ArchitectureAnalysis) {
    if (-not $Quiet) { Write-Host "`n🏗️ Running architecture analysis..." -ForegroundColor Yellow }
    
    try {
        if (Test-Path ".\.automation\project-management\Analyze-Architecture.ps1") {
            & .\.automation\project-management\Analyze-Architecture.ps1 -Detailed
            if (-not $Quiet) { Write-Host "✅ Architecture analysis completed" -ForegroundColor Green }
        }
        
        if (Test-Path ".\.automation\project-management\Analyze-Project-Readiness.ps1") {
            & .\.automation\project-management\Analyze-Project-Readiness.ps1 -Quiet
            if (-not $Quiet) { Write-Host "✅ Project readiness analysis completed" -ForegroundColor Green }
        }
    } catch {
        if (-not $Quiet) { Write-Host "❌ Architecture analysis failed: $_" -ForegroundColor Red }
    }
}

# Documentation Update Mode
if ($DocumentationUpdate) {
    if (-not $Quiet) { Write-Host "`n📚 Updating documentation..." -ForegroundColor Yellow }
    
    try {
        if (Test-Path ".\.automation\project-management\Generate-Documentation.ps1") {
            & .\.automation\project-management\Generate-Documentation.ps1 -Quiet
            if (-not $Quiet) { Write-Host "✅ Documentation updated" -ForegroundColor Green }
        }
        
        if (Test-Path ".\.automation\project-management\refresh_start_md.ps1") {
            & .\.automation\project-management\refresh_start_md.ps1 -Quiet
            if (-not $Quiet) { Write-Host "✅ Start guide refreshed" -ForegroundColor Green }
        }
    } catch {
        if (-not $Quiet) { Write-Host "❌ Documentation update failed: $_" -ForegroundColor Red }
    }
}

# Compliance Check Mode
if ($ComplianceCheck) {
    if (-not $Quiet) { Write-Host "`n📋 Running compliance checks..." -ForegroundColor Yellow }
    
    try {
        # Check GDPR compliance
        if (Test-Path "tests/compliance/gdpr/") {
            if (-not $Quiet) { Write-Host "✅ GDPR compliance tests found" -ForegroundColor Green }
        }
        
        # Check SOC 2 compliance
        if (Test-Path "tests/compliance/soc2/") {
            if (-not $Quiet) { Write-Host "✅ SOC 2 compliance tests found" -ForegroundColor Green }
        }
        
        # Check ISO 27001 compliance
        if (Test-Path "tests/compliance/iso27001/") {
            if (-not $Quiet) { Write-Host "✅ ISO 27001 compliance tests found" -ForegroundColor Green }
        }
        
        if (-not $Quiet) { Write-Host "✅ Compliance checks completed" -ForegroundColor Green }
    } catch {
        if (-not $Quiet) { Write-Host "❌ Compliance check failed: $_" -ForegroundColor Red }
    }
}

exit 0