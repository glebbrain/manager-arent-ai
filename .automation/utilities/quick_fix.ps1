# .automation/utilities/quick_fix.ps1
param(
    [switch]$All,
    [switch]$Emergency,
    [switch]$Quiet
)

$ErrorActionPreference = "Stop"

if (-not $Quiet) { Write-Host "🔧 Quick Fix Starting..." -ForegroundColor Cyan }

$fixesApplied = 0
$totalFixes = 0

# Function to apply a fix
function Apply-Fix {
    param(
        [string]$Name,
        [string]$Description,
        [scriptblock]$FixAction
    )
    
    $script:totalFixes++
    try {
        if (-not $Quiet) { Write-Host "🔧 Applying fix: $Name" -ForegroundColor Yellow }
        & $FixAction
        $script:fixesApplied++
        if (-not $Quiet) { Write-Host "✅ Fixed: $Name" -ForegroundColor Green }
        return $true
    } catch {
        if (-not $Quiet) { Write-Host "❌ Failed to fix: $Name - $_" -ForegroundColor Red }
        return $false
    }
}

# Fix 1: Create missing .manager directory
Apply-Fix -Name "Create .manager directory" -Description "Ensure .manager directory exists" {
    if (!(Test-Path ".manager")) {
        New-Item -ItemType Directory -Path ".manager" -Force | Out-Null
    }
}

# Fix 2: Create missing .automation directory
Apply-Fix -Name "Create .automation directory" -Description "Ensure .automation directory exists" {
    if (!(Test-Path ".automation")) {
        New-Item -ItemType Directory -Path ".automation" -Force | Out-Null
    }
}

# Fix 3: Create missing control files
Apply-Fix -Name "Create missing control files" -Description "Create essential control files if missing" {
    $controlFiles = @(
        @{Path=".manager/IDEA.md"; Content="# IDEA - Project Concept and Description`n`n> **IMPORTANT**: This file is the **heart** of your project. Fill it out in detail.`n`n## 🎯 Main Project Idea`n`n### Project Name`n**[Specify your project name]**`n`n### Тип проекта`n- [ ] 🤖 **Machine Learning / AI**`n- [ ] 🌐 **Web Application**`n- [ ] 📱 **Mobile App**`n- [ ] 🎮 **Game Development**`n- [ ] 🏢 **Enterprise Software**`n`n### Краткое описание`n**[Describe your project in 1-2 sentences]**"},
        @{Path=".manager/TODO.md"; Content="# TODO - Project Task Management`n`n> **Created**: $(Get-Date -Format 'yyyy-MM-dd')`n`n## 🚨 CRITICAL TASKS (🔴)`n`n- [ ] **Fill out IDEA.md completely**`n  - **Priority**: 🔴 Critical`n  - **Description**: Define project type, tech stack, and goals`n`n## 🟠 HIGH PRIORITY TASKS`n`n- [ ] **Set up development environment**`n  - **Priority**: 🟠 High`n  - **Description**: Configure local development tools`n`n## 🟡 MEDIUM PRIORITY TASKS`n`n- [ ] **Write README.md**`n  - **Priority**: 🟡 Medium`n  - **Description**: Project documentation`n`n## 🔵 LOW PRIORITY TASKS`n`n- [ ] **Code formatting setup**`n  - **Priority**: 🔵 Low`n  - **Description**: Prettier, ESLint, or similar tools"},
        @{Path=".manager/COMPLETED.md"; Content="# COMPLETED - Project Achievement Log`n`n> **Last Updated**: $(Get-Date -Format 'yyyy-MM-dd')`n`n## 🏆 Project Milestones`n`n### ✅ Recent Achievements`n`n*No achievements yet*"},
        @{Path=".manager/ERRORS.md"; Content="# ERRORS - Project Issue Registry`n`n> **Last Updated**: $(Get-Date -Format 'yyyy-MM-dd')`n`n## 🚨 Active Issues`n`n*No issues currently identified*"},
        @{Path=".manager/start.md"; Content="# 🚀 PROJECT START GUIDE`n`n> **Last Updated**: $(Get-Date -Format 'yyyy-MM-dd')`n`n## 🎯 QUICK START`n`n1. Fill out .manager/IDEA.md`n2. Review .manager/TODO.md`n3. Start development`n`n## 📋 Control Files`n`n- `IDEA.md` - Project heart`n- `TODO.md` - Task management`n- `COMPLETED.md` - Achievement tracking`n- `ERRORS.md` - Issue registry"}
    )
    
    foreach ($file in $controlFiles) {
        if (!(Test-Path $file.Path)) {
            $file.Content | Out-File -FilePath $file.Path -Encoding UTF8
        }
    }
}

# Fix 4: Create missing automation subdirectories
Apply-Fix -Name "Create automation subdirectories" -Description "Create missing automation subdirectories" {
    $automationDirs = @("validation", "project-management", "utilities", "testing", "debugging", "installation")
    foreach ($dir in $automationDirs) {
        $path = ".automation/$dir"
        if (!(Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
        }
    }
}

# Fix 5: Create basic validation script
Apply-Fix -Name "Create basic validation script" -Description "Create validate_project.ps1 if missing" {
    $validationScript = @"
# .automation/validation/validate_project.ps1
param([switch]`$Quiet)

if (-not `$Quiet) { Write-Host "🔍 Validating project..." -ForegroundColor Green }

# Check control files
`$controlFiles = @("IDEA.md", "TODO.md", "COMPLETED.md", "ERRORS.md", "start.md")
`$missing = @()

foreach (`$file in `$controlFiles) {
    if (!(Test-Path ".manager/`$file")) {
        `$missing += ".manager/`$file"
    }
}

if (`$missing.Count -gt 0) {
    if (-not `$Quiet) { Write-Host "❌ Missing files: `$(`$missing -join ', ')" -ForegroundColor Red }
    exit 1
} else {
    if (-not `$Quiet) { Write-Host "✅ All control files present" -ForegroundColor Green }
    exit 0
}
"@
    
    if (!(Test-Path ".automation/validation/validate_project.ps1")) {
        $validationScript | Out-File -FilePath ".automation/validation/validate_project.ps1" -Encoding UTF8
    }
}

# Fix 6: Clean temporary files
Apply-Fix -Name "Clean temporary files" -Description "Remove temporary and cache files" {
    $tempPatterns = @("*.tmp", "*.log", "*.cache", "__pycache__", "node_modules/.cache", ".DS_Store")
    $cleaned = 0
    
    foreach ($pattern in $tempPatterns) {
        $files = Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            try {
                Remove-Item -Path $file.FullName -Recurse -Force -ErrorAction SilentlyContinue
                $cleaned++
            } catch {
                # Ignore errors for files that can't be deleted
            }
        }
    }
    
    if (-not $Quiet -and $cleaned -gt 0) {
        Write-Host "🧹 Cleaned $cleaned temporary files" -ForegroundColor Green
    }
}

# Emergency fixes
if ($Emergency) {
    if (-not $Quiet) { Write-Host "🚨 Emergency mode - applying critical fixes..." -ForegroundColor Red }
    
    # Emergency Fix 1: Reset to basic structure
    Apply-Fix -Name "Emergency structure reset" -Description "Reset project to basic working structure" {
        # Create minimal working structure
        if (!(Test-Path ".manager")) { New-Item -ItemType Directory -Path ".manager" -Force | Out-Null }
        if (!(Test-Path ".automation")) { New-Item -ItemType Directory -Path ".automation" -Force | Out-Null }
        
        # Create minimal IDEA.md
        if (!(Test-Path ".manager/IDEA.md")) {
            @"
# IDEA - Project Concept

## 🎯 Main Project Idea
### Project Name
**Emergency Recovery Project**

### Краткое описание
Project recovered from emergency state. Please update this file with your actual project details.
"@ | Out-File -FilePath ".manager/IDEA.md" -Encoding UTF8
        }
    }
}

# Summary
if (-not $Quiet) {
    Write-Host "`n📊 Quick Fix Summary:" -ForegroundColor Cyan
    Write-Host "  ✅ Fixes applied: $fixesApplied" -ForegroundColor Green
    Write-Host "  📋 Total fixes attempted: $totalFixes" -ForegroundColor Blue
    
    if ($fixesApplied -eq $totalFixes) {
        Write-Host "  🎯 All fixes successful!" -ForegroundColor Green
    } elseif ($fixesApplied -gt 0) {
        Write-Host "  ⚠️ Some fixes failed" -ForegroundColor Yellow
    } else {
        Write-Host "  ❌ No fixes applied" -ForegroundColor Red
    }
}

# Exit with appropriate code
if ($fixesApplied -gt 0) { exit 0 } else { exit 1 }