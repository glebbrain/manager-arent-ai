# Universal Project Validation Script
# Supports multiple project types: Node.js, Python, C++, .NET, Java, Go, Rust, PHP
# Enhanced with enterprise validation and security checks

param(
    [string]$ProjectType = "auto",
    [string]$ProjectPath = ".",
    [switch]$Security,
    [switch]$Performance,
    [switch]$Compliance,
    [switch]$All,
    [switch]$Detailed,
    [string]$OutputFormat = "console",
    [switch]$Quiet
)

# Load project configuration
$configPath = Join-Path $PSScriptRoot "..\config\project-config.json"
$projectConfig = Get-Content $configPath | ConvertFrom-Json

Write-Host "[VALIDATE] Universal Project Validation - Starting..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Continue"

# Function to detect project type
function Get-ProjectType {
    param([string]$Path)
    
    if ($ProjectType -ne "auto") {
        return $ProjectType
    }
    
    $detectScript = Join-Path $PSScriptRoot "..\utilities\detect-project-type.ps1"
    $result = & $detectScript -ProjectPath $Path -Json -Quiet
    $projectInfo = $result | ConvertFrom-Json
    
    if ($projectInfo.Error) {
        Write-Host "[FAIL] Failed to detect project type: $($projectInfo.Error)" -ForegroundColor Red
        return "unknown"
    }
    
    return $projectInfo.Type
}

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
    
    if (-not $Quiet) {
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
}

# Function to validate file structure
function Test-FileStructure {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n📁 Validating file structure..." -ForegroundColor Cyan
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    $requiredFiles = @()
    
    # Add detection files as required
    foreach ($file in $typeConfig.detectionFiles) {
        $requiredFiles += @{ Path = $file; Critical = $true }
    }
    
    # Add config files as required
    foreach ($file in $typeConfig.configFiles) {
        $requiredFiles += @{ Path = $file; Critical = $true }
    }
    
    # Add source directories
    foreach ($dir in $typeConfig.sourceDirs) {
        $requiredFiles += @{ Path = $dir; Critical = $true; Type = "Directory" }
    }
    
    foreach ($file in $requiredFiles) {
        if (Test-Path (Join-Path $Path $file.Path)) {
            Add-ValidationResult "General" "File Structure" "PASS" "$($file.Path) exists" "Required $($file.Type)"
        } else {
            $status = if ($file.Critical) { "FAIL" } else { "WARN" }
            Add-ValidationResult "General" "File Structure" $status "$($file.Path) missing" "Required $($file.Type)"
        }
    }
}

# Function to validate project configuration
function Test-ProjectConfiguration {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n[CONFIG] Validating project configuration..." -ForegroundColor Cyan
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    
    switch ($ProjectType) {
        "nodejs" {
            Test-NodeJSConfiguration -Path $Path
        }
        "python" {
            Test-PythonConfiguration -Path $Path
        }
        "cpp" {
            Test-CPPConfiguration -Path $Path
        }
        "dotnet" {
            Test-DotNetConfiguration -Path $Path
        }
        "java" {
            Test-JavaConfiguration -Path $Path
        }
        "go" {
            Test-GoConfiguration -Path $Path
        }
        "rust" {
            Test-RustConfiguration -Path $Path
        }
        "php" {
            Test-PHPConfiguration -Path $Path
        }
    }
}

# Function to validate Node.js configuration
function Test-NodeJSConfiguration {
    param([string]$Path)
    
    if (-not (Test-Path (Join-Path $Path "package.json"))) {
        Add-ValidationResult "General" "Package.json" "FAIL" "package.json not found"
        return
    }
    
    try {
        $packageJson = Get-Content (Join-Path $Path "package.json") | ConvertFrom-Json
        
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
        
    } catch {
        Add-ValidationResult "General" "Package.json" "FAIL" "Invalid JSON format: $($_.Exception.Message)"
    }
}

# Function to validate Python configuration
function Test-PythonConfiguration {
    param([string]$Path)
    
    $configFiles = @("requirements.txt", "pyproject.toml", "setup.py", "Pipfile")
    $foundConfig = $false
    
    foreach ($file in $configFiles) {
        if (Test-Path (Join-Path $Path $file)) {
            Add-ValidationResult "General" "Python Config" "PASS" "$file found"
            $foundConfig = $true
        }
    }
    
    if (-not $foundConfig) {
        Add-ValidationResult "General" "Python Config" "FAIL" "No Python configuration file found"
    }
}

# Function to validate C++ configuration
function Test-CPPConfiguration {
    param([string]$Path)
    
    $configFiles = @("CMakeLists.txt", "Makefile", "vcpkg.json", "conanfile.txt")
    $foundConfig = $false
    
    foreach ($file in $configFiles) {
        if (Test-Path (Join-Path $Path $file)) {
            Add-ValidationResult "General" "C++ Config" "PASS" "$file found"
            $foundConfig = $true
        }
    }
    
    if (-not $foundConfig) {
        Add-ValidationResult "General" "C++ Config" "FAIL" "No C++ configuration file found"
    }
}

# Function to validate .NET configuration
function Test-DotNetConfiguration {
    param([string]$Path)
    
    $projectFiles = Get-ChildItem $Path -Filter "*.csproj" -Recurse
    $slnFiles = Get-ChildItem $Path -Filter "*.sln" -Recurse
    
    if ($projectFiles) {
        Add-ValidationResult "General" ".NET Project" "PASS" "$($projectFiles.Count) project file(s) found"
    } else {
        Add-ValidationResult "General" ".NET Project" "FAIL" "No .NET project files found"
    }
    
    if ($slnFiles) {
        Add-ValidationResult "General" ".NET Solution" "PASS" "$($slnFiles.Count) solution file(s) found"
    } else {
        Add-ValidationResult "General" ".NET Solution" "WARN" "No .NET solution files found"
    }
}

# Function to validate Java configuration
function Test-JavaConfiguration {
    param([string]$Path)
    
    $configFiles = @("pom.xml", "build.gradle", "build.gradle.kts")
    $foundConfig = $false
    
    foreach ($file in $configFiles) {
        if (Test-Path (Join-Path $Path $file)) {
            Add-ValidationResult "General" "Java Config" "PASS" "$file found"
            $foundConfig = $true
        }
    }
    
    if (-not $foundConfig) {
        Add-ValidationResult "General" "Java Config" "FAIL" "No Java configuration file found"
    }
}

# Function to validate Go configuration
function Test-GoConfiguration {
    param([string]$Path)
    
    if (Test-Path (Join-Path $Path "go.mod")) {
        Add-ValidationResult "General" "Go Module" "PASS" "go.mod found"
    } else {
        Add-ValidationResult "General" "Go Module" "FAIL" "go.mod not found"
    }
    
    if (Test-Path (Join-Path $Path "go.sum")) {
        Add-ValidationResult "General" "Go Sum" "PASS" "go.sum found"
    } else {
        Add-ValidationResult "General" "Go Sum" "WARN" "go.sum not found"
    }
}

# Function to validate Rust configuration
function Test-RustConfiguration {
    param([string]$Path)
    
    if (Test-Path (Join-Path $Path "Cargo.toml")) {
        Add-ValidationResult "General" "Cargo Config" "PASS" "Cargo.toml found"
    } else {
        Add-ValidationResult "General" "Cargo Config" "FAIL" "Cargo.toml not found"
    }
    
    if (Test-Path (Join-Path $Path "Cargo.lock")) {
        Add-ValidationResult "General" "Cargo Lock" "PASS" "Cargo.lock found"
    } else {
        Add-ValidationResult "General" "Cargo Lock" "WARN" "Cargo.lock not found"
    }
}

# Function to validate PHP configuration
function Test-PHPConfiguration {
    param([string]$Path)
    
    if (Test-Path (Join-Path $Path "composer.json")) {
        Add-ValidationResult "General" "Composer Config" "PASS" "composer.json found"
    } else {
        Add-ValidationResult "General" "Composer Config" "FAIL" "composer.json not found"
    }
    
    if (Test-Path (Join-Path $Path "composer.lock")) {
        Add-ValidationResult "General" "Composer Lock" "PASS" "composer.lock found"
    } else {
        Add-ValidationResult "General" "Composer Lock" "WARN" "composer.lock not found"
    }
}

# Function to validate security
function Test-Security {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n🔐 Validating security configuration..." -ForegroundColor Cyan
    
    # Check for common security files
    $securityFiles = @(".env", "SECURITY.md", ".gitignore")
    foreach ($file in $securityFiles) {
        if (Test-Path (Join-Path $Path $file)) {
            Add-ValidationResult "Security" $file "PASS" "Security file found"
        } else {
            Add-ValidationResult "Security" $file "WARN" "Security file not found"
        }
    }
    
    # Project-specific security checks
    switch ($ProjectType) {
        "nodejs" {
            Test-NodeJSSecurity -Path $Path
        }
        "python" {
            Test-PythonSecurity -Path $Path
        }
        "cpp" {
            Test-CPPSecurity -Path $Path
        }
        "dotnet" {
            Test-DotNetSecurity -Path $Path
        }
        "java" {
            Test-JavaSecurity -Path $Path
        }
        "go" {
            Test-GoSecurity -Path $Path
        }
        "rust" {
            Test-RustSecurity -Path $Path
        }
        "php" {
            Test-PHPSecurity -Path $Path
        }
    }
}

# Function to validate Node.js security
function Test-NodeJSSecurity {
    param([string]$Path)
    
    if (Test-Path (Join-Path $Path "package.json")) {
        $packageJson = Get-Content (Join-Path $Path "package.json") | ConvertFrom-Json
        if ($packageJson.scripts -and $packageJson.scripts.audit) {
            Add-ValidationResult "Security" "NPM Audit" "PASS" "NPM audit script found"
        } else {
            Add-ValidationResult "Security" "NPM Audit" "WARN" "NPM audit script not found"
        }
    }
}

# Function to validate Python security
function Test-PythonSecurity {
    param([string]$Path)
    
    if (Test-Path (Join-Path $Path "requirements.txt")) {
        Add-ValidationResult "Security" "Requirements" "PASS" "Requirements file found"
    } else {
        Add-ValidationResult "Security" "Requirements" "WARN" "Requirements file not found"
    }
}

# Function to validate C++ security
function Test-CPPSecurity {
    param([string]$Path)
    
    # Check for security-related compiler flags
    if (Test-Path (Join-Path $Path "CMakeLists.txt")) {
        $cmakeContent = Get-Content (Join-Path $Path "CMakeLists.txt") -Raw
        if ($cmakeContent -match "-Wall|-Wextra|-Wpedantic") {
            Add-ValidationResult "Security" "Compiler Flags" "PASS" "Security compiler flags found"
        } else {
            Add-ValidationResult "Security" "Compiler Flags" "WARN" "Security compiler flags not found"
        }
    }
}

# Function to validate .NET security
function Test-DotNetSecurity {
    param([string]$Path)
    
    # Check for security packages
    $projectFiles = Get-ChildItem $Path -Filter "*.csproj" -Recurse
    foreach ($file in $projectFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "Microsoft.AspNetCore.Authentication|System.Security") {
            Add-ValidationResult "Security" "Security Packages" "PASS" "Security packages found"
            return
        }
    }
    Add-ValidationResult "Security" "Security Packages" "WARN" "Security packages not found"
}

# Function to validate Java security
function Test-JavaSecurity {
    param([string]$Path)
    
    if (Test-Path (Join-Path $Path "pom.xml")) {
        $pomContent = Get-Content (Join-Path $Path "pom.xml") -Raw
        if ($pomContent -match "spring-security|shiro") {
            Add-ValidationResult "Security" "Security Framework" "PASS" "Security framework found"
        } else {
            Add-ValidationResult "Security" "Security Framework" "WARN" "Security framework not found"
        }
    }
}

# Function to validate Go security
function Test-GoSecurity {
    param([string]$Path)
    
    # Check for security-related imports
    $goFiles = Get-ChildItem $Path -Filter "*.go" -Recurse
    foreach ($file in $goFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "crypto/|golang.org/x/crypto") {
            Add-ValidationResult "Security" "Crypto Packages" "PASS" "Crypto packages found"
            return
        }
    }
    Add-ValidationResult "Security" "Crypto Packages" "WARN" "Crypto packages not found"
}

# Function to validate Rust security
function Test-RustSecurity {
    param([string]$Path)
    
    if (Test-Path (Join-Path $Path "Cargo.toml")) {
        $cargoContent = Get-Content (Join-Path $Path "Cargo.toml") -Raw
        if ($cargoContent -match "ring|openssl|rustls") {
            Add-ValidationResult "Security" "Crypto Crates" "PASS" "Crypto crates found"
        } else {
            Add-ValidationResult "Security" "Crypto Crates" "WARN" "Crypto crates not found"
        }
    }
}

# Function to validate PHP security
function Test-PHPSecurity {
    param([string]$Path)
    
    if (Test-Path (Join-Path $Path "composer.json")) {
        $composerContent = Get-Content (Join-Path $Path "composer.json") -Raw
        if ($composerContent -match "symfony/security|laravel/framework") {
            Add-ValidationResult "Security" "Security Framework" "PASS" "Security framework found"
        } else {
            Add-ValidationResult "Security" "Security Framework" "WARN" "Security framework not found"
        }
    }
}

# Function to validate performance
function Test-Performance {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n⚡ Validating performance configuration..." -ForegroundColor Cyan
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    $buildDir = Join-Path $Path $typeConfig.buildDir
    
    if (Test-Path $buildDir) {
        $buildSize = (Get-ChildItem $buildDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
        
        if ($buildSizeMB -lt 50) {
            Add-ValidationResult "Performance" "Build Size" "PASS" "Build size: ${buildSizeMB}MB"
        } elseif ($buildSizeMB -lt 100) {
            Add-ValidationResult "Performance" "Build Size" "WARN" "Build size: ${buildSizeMB}MB (consider optimization)"
        } else {
            Add-ValidationResult "Performance" "Build Size" "FAIL" "Build size: ${buildSizeMB}MB (too large)"
        }
    } else {
        Add-ValidationResult "Performance" "Build Size" "WARN" "Build directory not found"
    }
    
    # Project-specific performance checks
    switch ($ProjectType) {
        "nodejs" {
            Test-NodeJSPerformance -Path $Path
        }
        "python" {
            Test-PythonPerformance -Path $Path
        }
        "cpp" {
            Test-CPPPerformance -Path $Path
        }
    }
}

# Function to validate Node.js performance
function Test-NodeJSPerformance {
    param([string]$Path)
    
    if (Test-Path (Join-Path $Path "next.config.mjs")) {
        $nextConfig = Get-Content (Join-Path $Path "next.config.mjs") -Raw
        if ($nextConfig -match "images|optimization") {
            Add-ValidationResult "Performance" "Image Optimization" "PASS" "Image optimization configured"
        } else {
            Add-ValidationResult "Performance" "Image Optimization" "WARN" "Image optimization not configured"
        }
    }
}

# Function to validate Python performance
function Test-PythonPerformance {
    param([string]$Path)
    
    if (Test-Path (Join-Path $Path "requirements.txt")) {
        $requirements = Get-Content (Join-Path $Path "requirements.txt") -Raw
        if ($requirements -match "gunicorn|uvicorn|fastapi") {
            Add-ValidationResult "Performance" "WSGI Server" "PASS" "WSGI server found"
        } else {
            Add-ValidationResult "Performance" "WSGI Server" "WARN" "WSGI server not found"
        }
    }
}

# Function to validate C++ performance
function Test-CPPPerformance {
    param([string]$Path)
    
    if (Test-Path (Join-Path $Path "CMakeLists.txt")) {
        $cmakeContent = Get-Content (Join-Path $Path "CMakeLists.txt") -Raw
        if ($cmakeContent -match "-O2|-O3|-Ofast") {
            Add-ValidationResult "Performance" "Optimization Flags" "PASS" "Optimization flags found"
        } else {
            Add-ValidationResult "Performance" "Optimization Flags" "WARN" "Optimization flags not found"
        }
    }
}

# Function to validate compliance
function Test-Compliance {
    param([string]$Path)
    
    Write-Host "`n📋 Validating compliance..." -ForegroundColor Cyan
    
    # Check for documentation
    if (Test-Path (Join-Path $Path "README.md")) {
        $readmeContent = Get-Content (Join-Path $Path "README.md") -Raw
        if ($readmeContent.Length -gt 1000) {
            Add-ValidationResult "Compliance" "Documentation" "PASS" "Comprehensive README found"
        } else {
            Add-ValidationResult "Compliance" "Documentation" "WARN" "README could be more comprehensive"
        }
    } else {
        Add-ValidationResult "Compliance" "Documentation" "FAIL" "README.md not found"
    }
    
    # Check for license
    if (Test-Path (Join-Path $Path "LICENSE")) {
        Add-ValidationResult "Compliance" "License" "PASS" "License file found"
    } else {
        Add-ValidationResult "Compliance" "License" "WARN" "License file not found"
    }
    
    # Check for security policy
    if (Test-Path (Join-Path $Path "SECURITY.md")) {
        Add-ValidationResult "Compliance" "Security Policy" "PASS" "Security policy found"
    } else {
        Add-ValidationResult "Compliance" "Security Policy" "WARN" "Security policy not found"
    }
    
    # Check for contributing guidelines
    if (Test-Path (Join-Path $Path "CONTRIBUTING.md")) {
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
    
    Write-Host "  [RATE] Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
    
    # Save report to file if requested
    if ($OutputFormat -eq "json") {
        $reportPath = "validation-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        $validationResults | ConvertTo-Json -Depth 10 | Out-File $reportPath
        Write-Host "`n📄 Report saved to: $reportPath" -ForegroundColor Green
    }
}

# Main execution
try {
    Write-Host "Starting Universal Project Validation..." -ForegroundColor Green
    
    # Detect project type
    $detectedType = Get-ProjectType -Path $ProjectPath
    if ($detectedType -eq "unknown") {
        Write-Host "[FAIL] Could not detect project type" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Detected project type: $detectedType" -ForegroundColor Green
    
    # Determine which validations to run
    $runSecurity = $Security -or $All
    $runPerformance = $Performance -or $All
    $runCompliance = $Compliance -or $All
    
    # Always run general validations
    Test-FileStructure -ProjectType $detectedType -Path $ProjectPath
    Test-ProjectConfiguration -ProjectType $detectedType -Path $ProjectPath
    
    # Run specific validations
    if ($runSecurity) {
        Test-Security -ProjectType $detectedType -Path $ProjectPath
    }
    
    if ($runPerformance) {
        Test-Performance -ProjectType $detectedType -Path $ProjectPath
    }
    
    if ($runCompliance) {
        Test-Compliance -Path $ProjectPath
    }
    
    # Generate report
    New-ValidationReport
    
    Write-Host "`n[COMPLETE] Universal validation completed!" -ForegroundColor Green
    
} catch {
    Write-Host "[ERROR] Validation failed with error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
