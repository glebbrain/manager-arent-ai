# .automation/validation/validate_cursor_json.ps1
param(
    [switch]$Fix,
    [switch]$Detailed,
    [switch]$Enterprise
)

Write-Host "🔍 Enterprise Cursor Configuration Validation" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Initialize validation results
$validationResults = @{
    Critical = @()
    Warning = @()
    Info = @()
    Passed = @()
}

function Add-ValidationResult {
    param($Type, $Message, $Details = "")
    $validationResults[$Type] += @{
        Message = $Message
        Details = $Details
        Timestamp = Get-Date
    }
}

# Check for cursor.json files
$cursorFiles = @(
    @{Path=".manager/cursor.json"; Description="Manager cursor configuration"},
    @{Path="cursor.json"; Description="Root cursor configuration"}
)

$foundCursorFile = $null
foreach ($file in $cursorFiles) {
    if (Test-Path $file.Path) {
        $foundCursorFile = $file
        Add-ValidationResult "Passed" "✅ $($file.Path)" $file.Description
        break
    }
}

if (-not $foundCursorFile) {
    Add-ValidationResult "Critical" "❌ cursor.json" "No cursor configuration found in .manager/ or root"
    Write-Host "❌ No cursor.json configuration found!" -ForegroundColor Red
    Write-Host "Expected locations: .manager/cursor.json or cursor.json" -ForegroundColor Yellow
    exit 1
}

try {
    $cursorConfig = Get-Content $foundCursorFile.Path -Raw | ConvertFrom-Json
    Add-ValidationResult "Passed" "✅ JSON Format" "Valid JSON structure"
    
    # Enterprise validation fields
    $enterpriseFields = @{
        "rules" = "Development rules and guidelines"
        "include" = "File inclusion patterns"
        "ignore" = "File exclusion patterns"
        "shortcuts" = "Keyboard shortcuts configuration"
        "snippets" = "Code snippets and templates"
        "ai_instructions" = "AI assistant instructions"
        "project_context" = "Project context and architecture"
        "security_rules" = "Security and compliance rules"
        "performance_guidelines" = "Performance optimization guidelines"
        "testing_standards" = "Testing and quality standards"
    }
    
    # Standard validation fields
    $standardFields = @{
        "rules" = "Development rules and guidelines"
        "include" = "File inclusion patterns"
        "ignore" = "File exclusion patterns"
        "shortcuts" = "Keyboard shortcuts configuration"
        "snippets" = "Code snippets and templates"
        "ai_instructions" = "AI assistant instructions"
    }
    
    $fieldsToCheck = if ($Enterprise) { $enterpriseFields } else { $standardFields }
    
    Write-Host "🔍 Validating Configuration Fields..." -ForegroundColor Yellow
    foreach ($field in $fieldsToCheck.Keys) {
        if ($cursorConfig.$field) {
            $fieldType = $cursorConfig.$field.GetType().Name
            $fieldSize = if ($cursorConfig.$field -is [string]) { $cursorConfig.$field.Length } else { "Complex" }
            Add-ValidationResult "Passed" "✅ $field" "$($fieldsToCheck[$field]) - Type: $fieldType, Size: $fieldSize"
        } else {
            if ($Enterprise -and $enterpriseFields.ContainsKey($field)) {
                Add-ValidationResult "Warning" "⚠️ $field" "$($fieldsToCheck[$field]) - Missing (Enterprise feature)"
            } else {
                Add-ValidationResult "Critical" "❌ $field" "$($fieldsToCheck[$field]) - Missing (Required)"
            }
        }
    }
    
    # Enterprise-specific validations
    if ($Enterprise) {
        Write-Host "🏢 Enterprise Configuration Validation..." -ForegroundColor Yellow
        
        # Check for security rules
        if ($cursorConfig.security_rules) {
            $securityRules = $cursorConfig.security_rules
            if ($securityRules.PSObject.Properties.Count -gt 0) {
                Add-ValidationResult "Passed" "✅ Security Rules" "Security configuration present"
            } else {
                Add-ValidationResult "Warning" "⚠️ Security Rules" "Security rules object is empty"
            }
        }
        
        # Check for performance guidelines
        if ($cursorConfig.performance_guidelines) {
            Add-ValidationResult "Passed" "✅ Performance Guidelines" "Performance optimization rules configured"
        }
        
        # Check for testing standards
        if ($cursorConfig.testing_standards) {
            Add-ValidationResult "Passed" "✅ Testing Standards" "Testing and quality standards defined"
        }
        
        # Check for project context
        if ($cursorConfig.project_context) {
            $context = $cursorConfig.project_context
            if ($context.architecture -and $context.modules -and $context.technology_stack) {
                Add-ValidationResult "Passed" "✅ Project Context" "Complete project context defined"
            } else {
                Add-ValidationResult "Warning" "⚠️ Project Context" "Project context incomplete"
            }
        }
    }
    
    # Validate AI instructions quality
    if ($cursorConfig.ai_instructions) {
        $aiInstructions = $cursorConfig.ai_instructions
        if ($aiInstructions.Length -gt 100) {
            Add-ValidationResult "Passed" "✅ AI Instructions" "Comprehensive AI instructions ($($aiInstructions.Length) chars)"
        } else {
            Add-ValidationResult "Warning" "⚠️ AI Instructions" "AI instructions may be too brief ($($aiInstructions.Length) chars)"
        }
    }
    
    # Validate include/ignore patterns
    if ($cursorConfig.include) {
        $includeCount = if ($cursorConfig.include -is [array]) { $cursorConfig.include.Count } else { 1 }
        Add-ValidationResult "Passed" "✅ Include Patterns" "$includeCount inclusion patterns defined"
    }
    
    if ($cursorConfig.ignore) {
        $ignoreCount = if ($cursorConfig.ignore -is [array]) { $cursorConfig.ignore.Count } else { 1 }
        Add-ValidationResult "Passed" "✅ Ignore Patterns" "$ignoreCount exclusion patterns defined"
    }
    
} catch {
    Add-ValidationResult "Critical" "❌ JSON Parse Error" "Invalid JSON format: $($_.Exception.Message)"
    Write-Host "❌ Failed to parse cursor.json: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($Fix) {
        Write-Host "🔧 Attempting to fix JSON format..." -ForegroundColor Yellow
        # Add basic JSON structure if file is corrupted
        $basicConfig = @{
            rules = "Follow enterprise development standards"
            include = @("src/**/*", "docs/**/*", ".manager/**/*")
            ignore = @("node_modules/**/*", "dist/**/*", "*.log")
            shortcuts = @{}
            snippets = @{}
            ai_instructions = "You are an enterprise AI assistant for FreeRPASite platform development."
        } | ConvertTo-Json -Depth 3
        
        try {
            $basicConfig | Out-File -FilePath $foundCursorFile.Path -Encoding UTF8
            Add-ValidationResult "Info" "🔧 JSON Fixed" "Basic configuration restored"
            Write-Host "✅ Basic cursor.json configuration restored" -ForegroundColor Green
        } catch {
            Add-ValidationResult "Critical" "❌ Fix Failed" "Could not restore configuration: $($_.Exception.Message)"
        }
    }
}

# Generate validation report
Write-Host ""
Write-Host "📊 Validation Summary:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

if ($validationResults.Critical.Count -gt 0) {
    Write-Host "🚨 CRITICAL ISSUES ($($validationResults.Critical.Count)):" -ForegroundColor Red
    foreach ($issue in $validationResults.Critical) {
        Write-Host "  $($issue.Message)" -ForegroundColor Red
        if ($Detailed -and $issue.Details) {
            Write-Host "    Details: $($issue.Details)" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

if ($validationResults.Warning.Count -gt 0) {
    Write-Host "⚠️ WARNINGS ($($validationResults.Warning.Count)):" -ForegroundColor Yellow
    foreach ($warning in $validationResults.Warning) {
        Write-Host "  $($warning.Message)" -ForegroundColor Yellow
        if ($Detailed -and $warning.Details) {
            Write-Host "    Details: $($warning.Details)" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

Write-Host "✅ PASSED CHECKS ($($validationResults.Passed.Count)):" -ForegroundColor Green
foreach ($passed in $validationResults.Passed) {
    Write-Host "  $($passed.Message)" -ForegroundColor Green
    if ($Detailed -and $passed.Details) {
        Write-Host "    Details: $($passed.Details)" -ForegroundColor Gray
    }
}

# Final status
Write-Host ""
$totalIssues = $validationResults.Critical.Count + $validationResults.Warning.Count
if ($totalIssues -eq 0) {
    Write-Host "🎉 CURSOR CONFIGURATION VALIDATION PASSED!" -ForegroundColor Green
    Write-Host "Configuration is ready for enterprise development" -ForegroundColor Green
    exit 0
} elseif ($validationResults.Critical.Count -eq 0) {
    Write-Host "⚠️ VALIDATION WARNING - Configuration has minor issues" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "❌ VALIDATION FAILED - Critical configuration issues must be resolved" -ForegroundColor Red
    exit 2
}
