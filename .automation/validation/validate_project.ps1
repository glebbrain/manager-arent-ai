# FreeRPA Enterprise Project Validation Script
# Enhanced with enterprise validation and security checks

param(
    [switch]$Security,
    [switch]$Performance,
    [switch]$Compliance,
    [switch]$All,
    [switch]$Detailed,
    [string]$OutputFormat = "console"
)

Write-Host "[VALIDATE] FreeRPA Enterprise Project Validation - Starting..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Continue"

# Validation results
$validationResults = @{
    Security = @{ Passed = 0; Failed = 0; Warnings = 0; Checks = @() }
    Performance = @{ Passed = 0; Failed = 0; Warnings = 0; Checks = @() }
    Compliance = @{ Passed = 0; Failed = 0; Warnings = 0; Checks = @() }
    General = @{ Passed = 0; Failed = 0; Warnings = 0; Checks = @() }
}

# Function to log validation results
function Add-ValidationResult {
    param(
        [string]$Category,
        [string]$CheckName,
        [string]$Status,
        [string]$Message,
        [string]$Details = ""
    )
    
    $result = @{
        Name = $CheckName
        Status = $Status
        Message = $Message
        Details = $Details
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $validationResults[$Category].Checks += $result
    
    switch ($Status) {
        "PASS" { 
            $validationResults[$Category].Passed++
            Write-Host "[PASS] ${CheckName}: $Message" -ForegroundColor Green
        }
        "FAIL" { 
            $validationResults[$Category].Failed++
            Write-Host "[FAIL] ${CheckName}: $Message" -ForegroundColor Red
        }
        "WARN" { 
            $validationResults[$Category].Warnings++
            Write-Host "[WARN] ${CheckName}: $Message" -ForegroundColor Yellow
        }
    }
    
    if ($Detailed -and $Details) {
        Write-Host "   Details: $Details" -ForegroundColor Gray
    }
}

# Function to validate file structure
function Test-FileStructure {
    Write-Host "`n📁 Validating file structure..." -ForegroundColor Cyan
    
    $requiredFiles = @(
        @{ Path = "package.json"; Type = "File"; Critical = $true },
        @{ Path = "README.md"; Type = "File"; Critical = $true },
        @{ Path = "next.config.mjs"; Type = "File"; Critical = $true },
        @{ Path = "tsconfig.json"; Type = "File"; Critical = $true },
        @{ Path = "prisma/schema.prisma"; Type = "File"; Critical = $true },
        @{ Path = "src/app"; Type = "Directory"; Critical = $true },
        @{ Path = "src/components"; Type = "Directory"; Critical = $true },
        @{ Path = "src/lib"; Type = "Directory"; Critical = $true },
        @{ Path = "docs"; Type = "Directory"; Critical = $false },
        @{ Path = "mobile"; Type = "Directory"; Critical = $false }
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file.Path) {
            Add-ValidationResult "General" "File Structure" "PASS" "$($file.Path) exists" "Required $($file.Type)"
        } else {
            $status = if ($file.Critical) { "FAIL" } else { "WARN" }
            Add-ValidationResult "General" "File Structure" $status "$($file.Path) missing" "Required $($file.Type)"
        }
    }
}

# Function to validate package.json
function Test-PackageJson {
    Write-Host "`n[PACKAGE] Validating package.json..." -ForegroundColor Cyan
    
    if (-not (Test-Path "package.json")) {
        Add-ValidationResult "General" "Package.json" "FAIL" "package.json not found"
        return
    }
    
    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        
        # Check required scripts
        $requiredScripts = @("dev", "build", "start", "test")
        foreach ($script in $requiredScripts) {
            if ($packageJson.scripts.$script) {
                Add-ValidationResult "General" "Package Scripts" "PASS" "Script '$script' exists"
            } else {
                Add-ValidationResult "General" "Package Scripts" "FAIL" "Script '$script' missing"
            }
        }
        
        # Check dependencies
        if ($packageJson.dependencies) {
            $depCount = ($packageJson.dependencies | Get-Member -MemberType NoteProperty).Count
            Add-ValidationResult "General" "Dependencies" "PASS" "$depCount dependencies found"
        } else {
            Add-ValidationResult "General" "Dependencies" "WARN" "No dependencies found"
        }
        
        # Check devDependencies
        if ($packageJson.devDependencies) {
            $devDepCount = ($packageJson.devDependencies | Get-Member -MemberType NoteProperty).Count
            Add-ValidationResult "General" "Dev Dependencies" "PASS" "$devDepCount dev dependencies found"
        } else {
            Add-ValidationResult "General" "Dev Dependencies" "WARN" "No dev dependencies found"
        }
        
    } catch {
        Add-ValidationResult "General" "Package.json" "FAIL" "Invalid JSON format: $($_.Exception.Message)"
    }
}

# Function to validate TypeScript configuration
function Test-TypeScriptConfig {
    Write-Host "`n[TS] Validating TypeScript configuration..." -ForegroundColor Cyan
    
    if (-not (Test-Path "tsconfig.json")) {
        Add-ValidationResult "General" "TypeScript Config" "FAIL" "tsconfig.json not found"
        return
    }
    
    try {
        $tsConfig = Get-Content "tsconfig.json" | ConvertFrom-Json
        
        # Check compiler options
        if ($tsConfig.compilerOptions) {
            $requiredOptions = @("target", "lib", "allowJs", "skipLibCheck", "strict", "forceConsistentCasingInFileNames", "noEmit", "esModuleInterop", "module", "moduleResolution", "resolveJsonModule", "isolatedModules", "jsx", "incremental", "plugins")
            
            foreach ($option in $requiredOptions) {
                if ($tsConfig.compilerOptions.$option -ne $null) {
                    Add-ValidationResult "General" "TypeScript Options" "PASS" "Option '$option' configured"
                } else {
                    Add-ValidationResult "General" "TypeScript Options" "WARN" "Option '$option' not configured"
                }
            }
        } else {
            Add-ValidationResult "General" "TypeScript Config" "FAIL" "No compilerOptions found"
        }
        
    } catch {
        Add-ValidationResult "General" "TypeScript Config" "FAIL" "Invalid JSON format: $($_.Exception.Message)"
    }
}

# Function to validate security
function Test-Security {
    Write-Host "`n🔐 Validating security configuration..." -ForegroundColor Cyan
    
    # Check for security headers
    if (Test-Path "src/middleware.ts") {
        $middlewareContent = Get-Content "src/middleware.ts" -Raw
        if ($middlewareContent -match "helmet|security|headers") {
            Add-ValidationResult "Security" "Security Headers" "PASS" "Security headers configured"
        } else {
            Add-ValidationResult "Security" "Security Headers" "WARN" "Security headers not found in middleware"
        }
    } else {
        Add-ValidationResult "Security" "Security Headers" "WARN" "Middleware file not found"
    }
    
    # Check for environment variables
    if (Test-Path ".env") {
        $envContent = Get-Content ".env" -Raw
        if ($envContent -match "NEXTAUTH_SECRET|NEXTAUTH_URL") {
            Add-ValidationResult "Security" "Environment Variables" "PASS" "Required environment variables found"
        } else {
            Add-ValidationResult "Security" "Environment Variables" "WARN" "Some required environment variables missing"
        }
    } else {
        Add-ValidationResult "Security" "Environment Variables" "WARN" ".env file not found"
    }
    
    # Check for rate limiting
    if (Test-Path "src/lib") {
        $libFiles = Get-ChildItem "src/lib" -Recurse -Filter "*.ts" | Where-Object { $_.Name -match "rate|limit" }
        if ($libFiles) {
            Add-ValidationResult "Security" "Rate Limiting" "PASS" "Rate limiting implementation found"
        } else {
            Add-ValidationResult "Security" "Rate Limiting" "WARN" "Rate limiting not implemented"
        }
    }
    
    # Check for input validation
    if (Test-Path "src/lib/validation") {
        Add-ValidationResult "Security" "Input Validation" "PASS" "Validation library found"
    } else {
        Add-ValidationResult "Security" "Input Validation" "WARN" "Validation library not found"
    }
}

# Function to validate performance
function Test-Performance {
    Write-Host "`n⚡ Validating performance configuration..." -ForegroundColor Cyan
    
    # Check for caching
    if (Test-Path "src/lib/cache") {
        Add-ValidationResult "Performance" "Caching" "PASS" "Caching implementation found"
    } else {
        Add-ValidationResult "Performance" "Caching" "WARN" "Caching not implemented"
    }
    
    # Check for image optimization
    if (Test-Path "next.config.mjs") {
        $nextConfig = Get-Content "next.config.mjs" -Raw
        if ($nextConfig -match "images|optimization") {
            Add-ValidationResult "Performance" "Image Optimization" "PASS" "Image optimization configured"
        } else {
            Add-ValidationResult "Performance" "Image Optimization" "WARN" "Image optimization not configured"
        }
    }
    
    # Check for bundle analysis
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts -and $packageJson.scripts."build:analyze") {
            Add-ValidationResult "Performance" "Bundle Analysis" "PASS" "Bundle analysis script found"
        } else {
            Add-ValidationResult "Performance" "Bundle Analysis" "WARN" "Bundle analysis not configured"
        }
    }
    
    # Check for database optimization
    if (Test-Path "prisma/schema.prisma") {
        $schemaContent = Get-Content "prisma/schema.prisma" -Raw
        if ($schemaContent -match "\@index|\@\@index") {
            Add-ValidationResult "Performance" "Database Indexes" "PASS" "Database indexes found"
        } else {
            Add-ValidationResult "Performance" "Database Indexes" "WARN" "No database indexes found"
        }
    }
}

# Function to validate compliance
function Test-Compliance {
    Write-Host "`n📋 Validating compliance..." -ForegroundColor Cyan
    
    # Check for documentation
    if (Test-Path "README.md") {
        $readmeContent = Get-Content "README.md" -Raw
        if ($readmeContent.Length -gt 1000) {
            Add-ValidationResult "Compliance" "Documentation" "PASS" "Comprehensive README found"
        } else {
            Add-ValidationResult "Compliance" "Documentation" "WARN" "README could be more comprehensive"
        }
    } else {
        Add-ValidationResult "Compliance" "Documentation" "FAIL" "README.md not found"
    }
    
    # Check for license
    if (Test-Path "LICENSE") {
        Add-ValidationResult "Compliance" "License" "PASS" "License file found"
    } else {
        Add-ValidationResult "Compliance" "License" "WARN" "License file not found"
    }
    
    # Check for security policy
    if (Test-Path "SECURITY.md") {
        Add-ValidationResult "Compliance" "Security Policy" "PASS" "Security policy found"
    } else {
        Add-ValidationResult "Compliance" "Security Policy" "WARN" "Security policy not found"
    }
    
    # Check for contributing guidelines
    if (Test-Path "CONTRIBUTING.md") {
        Add-ValidationResult "Compliance" "Contributing Guidelines" "PASS" "Contributing guidelines found"
    } else {
        Add-ValidationResult "Compliance" "Contributing Guidelines" "WARN" "Contributing guidelines not found"
    }
}

# Function to generate report
function New-ValidationReport {
    Write-Host "`n[REPORT] Validation Report Summary:" -ForegroundColor Yellow
    
    $totalPassed = 0
    $totalFailed = 0
    $totalWarnings = 0
    
    foreach ($category in $validationResults.Keys) {
        $categoryResults = $validationResults[$category]
        $totalPassed += $categoryResults.Passed
        $totalFailed += $categoryResults.Failed
        $totalWarnings += $categoryResults.Warnings
        
        Write-Host "`n${category}:" -ForegroundColor Cyan
        Write-Host "  [PASS] Passed: $($categoryResults.Passed)" -ForegroundColor Green
        Write-Host "  [FAIL] Failed: $($categoryResults.Failed)" -ForegroundColor Red
        Write-Host "  [WARN] Warnings: $($categoryResults.Warnings)" -ForegroundColor Yellow
    }
    
    Write-Host "`n📈 Overall Results:" -ForegroundColor Yellow
    Write-Host "  [PASS] Total Passed: $totalPassed" -ForegroundColor Green
    Write-Host "  [FAIL] Total Failed: $totalFailed" -ForegroundColor Red
    Write-Host "  [WARN] Total Warnings: $totalWarnings" -ForegroundColor Yellow
    
    $successRate = if (($totalPassed + $totalFailed + $totalWarnings) -gt 0) {
        [math]::Round(($totalPassed / ($totalPassed + $totalFailed + $totalWarnings)) * 100, 2)
    } else { 0 }
    
    Write-Host "  📊 Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
    
    # Save report to file if requested
    if ($OutputFormat -eq "json") {
        $reportPath = "validation-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        $validationResults | ConvertTo-Json -Depth 10 | Out-File $reportPath
        Write-Host "`n📄 Report saved to: $reportPath" -ForegroundColor Green
    }
}

# Main execution
try {
    Write-Host "Starting FreeRPA Enterprise Project Validation..." -ForegroundColor Green
    
    # Determine which validations to run
    $runSecurity = $Security -or $All
    $runPerformance = $Performance -or $All
    $runCompliance = $Compliance -or $All
    
    # Always run general validations
    Test-FileStructure
    Test-PackageJson
    Test-TypeScriptConfig
    
    # Run specific validations
    if ($runSecurity) {
        Test-Security
    }
    
    if ($runPerformance) {
        Test-Performance
    }
    
    if ($runCompliance) {
        Test-Compliance
    }
    
    # Generate report
    New-ValidationReport
    
    Write-Host "`n[COMPLETE] Validation completed!" -ForegroundColor Green
    
} catch {
    Write-Host "[ERROR] Validation failed with error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}