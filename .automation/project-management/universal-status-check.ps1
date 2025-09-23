# Universal Project Status Checker
# Supports multiple project types: Node.js, Python, C++, .NET, Java, Go, Rust, PHP
# Enhanced with comprehensive status checking and health monitoring

param(
    [string]$ProjectType = "auto",
    [string]$ProjectPath = ".",
    [switch]$Detailed,
    [switch]$Health,
    [switch]$Performance,
    [switch]$Security,
    [switch]$All,
    [switch]$Json,
    [string]$OutputFile = "",
    [switch]$Quiet
)

# Load project configuration
$configPath = Join-Path $PSScriptRoot "..\config\project-config.json"
$projectConfig = Get-Content $configPath | ConvertFrom-Json

Write-Host "📊 Universal Project Status Check - Starting..." -ForegroundColor Green

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
        Write-Host "❌ Failed to detect project type: $($projectInfo.Error)" -ForegroundColor Red
        return "unknown"
    }
    
    return $projectInfo.Type
}

# Function to log status
function Write-Status {
    param(
        [string]$Category,
        [string]$Item,
        [string]$Status,
        [string]$Message = "",
        [object]$Details = $null
    )
    
    if (-not $Quiet) {
        $timestamp = Get-Date -Format "HH:mm:ss"
        
        switch ($Status) {
            "OK" { 
                Write-Host "[$timestamp] ✅ $Category - $Item" -ForegroundColor Green
                if ($Message) { Write-Host "    $Message" -ForegroundColor Green }
            }
            "WARNING" { 
                Write-Host "[$timestamp] ⚠️ $Category - $Item" -ForegroundColor Yellow
                if ($Message) { Write-Host "    $Message" -ForegroundColor Yellow }
            }
            "ERROR" { 
                Write-Host "[$timestamp] ❌ $Category - $Item" -ForegroundColor Red
                if ($Message) { Write-Host "    $Message" -ForegroundColor Red }
            }
            "INFO" { 
                Write-Host "[$timestamp] ℹ️ $Category - $Item" -ForegroundColor Blue
                if ($Message) { Write-Host "    $Message" -ForegroundColor Blue }
            }
        }
    }
}

# Function to check project files
function Test-ProjectFiles {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n📁 Checking project files..." -ForegroundColor Cyan
    
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
    
    $missingFiles = 0
    $totalFiles = $requiredFiles.Count
    
    foreach ($file in $requiredFiles) {
        if (Test-Path (Join-Path $Path $file.Path)) {
            Write-Status "Project" "Files" "OK" "$($file.Path) exists"
        } else {
            $status = if ($file.Critical) { "ERROR" } else { "WARNING" }
            Write-Status "Project" "Files" $status "$($file.Path) missing"
            if ($file.Critical) { $missingFiles++ }
        }
    }
    
    return @{
        MissingFiles = $missingFiles
        TotalFiles = $totalFiles
        Status = if ($missingFiles -eq 0) { "OK" } else { "ERROR" }
    }
}

# Function to check dependencies
function Test-Dependencies {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n📦 Checking dependencies..." -ForegroundColor Cyan
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    $missingDeps = @()
    $availableDeps = @()
    
    # Check required dependencies
    foreach ($dep in $typeConfig.dependencies.required) {
        try {
            $version = Invoke-Expression "$dep --version" 2>$null
            if ($LASTEXITCODE -eq 0) {
                $availableDeps += $dep
                Write-Status "Dependencies" $dep "OK" "Version: $version"
            } else {
                $missingDeps += $dep
                Write-Status "Dependencies" $dep "ERROR" "Not installed"
            }
        } catch {
            $missingDeps += $dep
            Write-Status "Dependencies" $dep "ERROR" "Not installed"
        }
    }
    
    # Check optional dependencies
    foreach ($dep in $typeConfig.dependencies.optional) {
        try {
            $version = Invoke-Expression "$dep --version" 2>$null
            if ($LASTEXITCODE -eq 0) {
                $availableDeps += $dep
                Write-Status "Dependencies" $dep "OK" "Version: $version (optional)"
            } else {
                Write-Status "Dependencies" $dep "WARNING" "Not installed (optional)"
            }
        } catch {
            Write-Status "Dependencies" $dep "WARNING" "Not installed (optional)"
        }
    }
    
    return @{
        Available = $availableDeps
        Missing = $missingDeps
        Status = if ($missingDeps.Count -eq 0) { "OK" } else { "ERROR" }
    }
}

# Function to check build status
function Test-BuildStatus {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n🔨 Checking build status..." -ForegroundColor Cyan
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    $buildDir = Join-Path $Path $typeConfig.buildDir
    
    if (Test-Path $buildDir) {
        $buildFiles = Get-ChildItem $buildDir -Recurse -File | Measure-Object
        Write-Status "Build" "Build Directory" "OK" "$($buildFiles.Count) files in build directory"
        
        # Check for specific build artifacts based on project type
        switch ($ProjectType) {
            "nodejs" {
                if (Test-Path (Join-Path $Path ".next")) {
                    Write-Status "Build" "Next.js Build" "OK" "Next.js build found"
                } else {
                    Write-Status "Build" "Next.js Build" "WARNING" "Next.js build not found"
                }
            }
            "cpp" {
                $exeFiles = Get-ChildItem $buildDir -Filter "*.exe" -Recurse
                if ($exeFiles) {
                    Write-Status "Build" "Executable" "OK" "$($exeFiles.Count) executable(s) found"
                } else {
                    Write-Status "Build" "Executable" "WARNING" "No executables found"
                }
            }
            "python" {
                $pycFiles = Get-ChildItem $Path -Filter "*.pyc" -Recurse
                if ($pycFiles) {
                    Write-Status "Build" "Python Cache" "OK" "Python cache files found"
                }
            }
        }
        
        return "OK"
    } else {
        Write-Status "Build" "Build Directory" "WARNING" "Build directory not found"
        return "WARNING"
    }
}

# Function to check test status
function Test-TestStatus {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n🧪 Checking test status..." -ForegroundColor Cyan
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    $testDirs = $typeConfig.testDirs
    $testFiles = @()
    
    foreach ($testDir in $testDirs) {
        $testPath = Join-Path $Path $testDir
        if (Test-Path $testPath) {
            $files = Get-ChildItem $testPath -Recurse -File | Where-Object { $_.Name -match "test|spec" }
            $testFiles += $files
        }
    }
    
    if ($testFiles.Count -gt 0) {
        Write-Status "Tests" "Test Files" "OK" "$($testFiles.Count) test files found"
        return "OK"
    } else {
        Write-Status "Tests" "Test Files" "WARNING" "No test files found"
        return "WARNING"
    }
}

# Function to check performance
function Test-Performance {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n⚡ Checking performance..." -ForegroundColor Cyan
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    $buildDir = Join-Path $Path $typeConfig.buildDir
    
    if (Test-Path $buildDir) {
        $buildSize = (Get-ChildItem $buildDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
        
        if ($buildSizeMB -lt 50) {
            Write-Status "Performance" "Build Size" "OK" "Build size: ${buildSizeMB}MB"
        } elseif ($buildSizeMB -lt 100) {
            Write-Status "Performance" "Build Size" "WARNING" "Build size: ${buildSizeMB}MB (consider optimization)"
        } else {
            Write-Status "Performance" "Build Size" "ERROR" "Build size: ${buildSizeMB}MB (too large)"
        }
        
        return "OK"
    } else {
        Write-Status "Performance" "Build Size" "WARNING" "Build directory not found"
        return "WARNING"
    }
}

# Function to check security
function Test-Security {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n🔐 Checking security..." -ForegroundColor Cyan
    
    $securityIssues = 0
    
    # Check for common security files
    $securityFiles = @(".env", "SECURITY.md", ".gitignore")
    foreach ($file in $securityFiles) {
        if (Test-Path (Join-Path $Path $file)) {
            Write-Status "Security" $file "OK" "Security file found"
        } else {
            Write-Status "Security" $file "WARNING" "Security file not found"
            $securityIssues++
        }
    }
    
    # Project-specific security checks
    switch ($ProjectType) {
        "nodejs" {
            if (Test-Path (Join-Path $Path "package.json")) {
                $packageJson = Get-Content (Join-Path $Path "package.json") | ConvertFrom-Json
                if ($packageJson.scripts -and $packageJson.scripts.audit) {
                    Write-Status "Security" "NPM Audit" "OK" "NPM audit script found"
                } else {
                    Write-Status "Security" "NPM Audit" "WARNING" "NPM audit script not found"
                    $securityIssues++
                }
            }
        }
        "python" {
            if (Test-Path (Join-Path $Path "requirements.txt")) {
                Write-Status "Security" "Requirements" "OK" "Requirements file found"
            } else {
                Write-Status "Security" "Requirements" "WARNING" "Requirements file not found"
                $securityIssues++
            }
        }
    }
    
    return if ($securityIssues -eq 0) { "OK" } else { "WARNING" }
}

# Function to generate summary
function New-StatusSummary {
    param([object]$Results)
    
    Write-Host "`n📊 Status Summary:" -ForegroundColor Yellow
    
    # Calculate overall health
    $healthChecks = @($Results.Project.Status, $Results.Dependencies.Status, $Results.Build.Status, $Results.Tests.Status)
    $okCount = ($healthChecks | Where-Object { $_ -eq "OK" }).Count
    $totalCount = $healthChecks.Count
    
    if ($okCount -eq $totalCount) {
        Write-Host "  🟢 Overall Health: EXCELLENT" -ForegroundColor Green
    } elseif ($okCount -gt 0) {
        Write-Host "  🟡 Overall Health: GOOD" -ForegroundColor Yellow
    } else {
        Write-Host "  🔴 Overall Health: NEEDS ATTENTION" -ForegroundColor Red
    }
    
    # Project status
    Write-Host "`n📋 Project Status:" -ForegroundColor Cyan
    Write-Host "  Type: $($Results.Project.Type)" -ForegroundColor White
    Write-Host "  Path: $($Results.Project.Path)" -ForegroundColor White
    Write-Host "  Status: $($Results.Project.Status)" -ForegroundColor White
    
    # Detailed status
    Write-Host "`n📈 Detailed Status:" -ForegroundColor Cyan
    Write-Host "  Dependencies: $($Results.Dependencies.Status)" -ForegroundColor White
    Write-Host "  Build: $($Results.Build.Status)" -ForegroundColor White
    Write-Host "  Tests: $($Results.Tests.Status)" -ForegroundColor White
    Write-Host "  Performance: $($Results.Performance.Status)" -ForegroundColor White
    Write-Host "  Security: $($Results.Security.Status)" -ForegroundColor White
    
    # Save to file if requested
    if ($OutputFile) {
        $Results | ConvertTo-Json -Depth 10 | Out-File $OutputFile
        Write-Host "`n📄 Status report saved to: $OutputFile" -ForegroundColor Green
    }
    
    # Return JSON if requested
    if ($Json) {
        return $Results | ConvertTo-Json -Depth 10
    }
}

# Main execution
try {
    Write-Host "Starting Universal Project Status Check..." -ForegroundColor Green
    
    # Detect project type
    $detectedType = Get-ProjectType -Path $ProjectPath
    if ($detectedType -eq "unknown") {
        Write-Host "❌ Could not detect project type" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Detected project type: $detectedType" -ForegroundColor Green
    
    # Initialize results
    $statusResults = @{
        Project = @{
            Type = $detectedType
            Path = (Resolve-Path $ProjectPath).Path
            Status = "Unknown"
        }
        Dependencies = @{ Status = "Unknown" }
        Build = @{ Status = "Unknown" }
        Tests = @{ Status = "Unknown" }
        Performance = @{ Status = "Unknown" }
        Security = @{ Status = "Unknown" }
    }
    
    # Determine which checks to run
    $runAll = $All
    $runHealth = $Health -or $runAll
    $runPerformance = $Performance -or $runAll
    $runSecurity = $Security -or $runAll
    
    # Always run basic checks
    $fileCheck = Test-ProjectFiles -ProjectType $detectedType -Path $ProjectPath
    $statusResults.Project.Status = $fileCheck.Status
    
    $depCheck = Test-Dependencies -ProjectType $detectedType -Path $ProjectPath
    $statusResults.Dependencies = $depCheck
    
    $buildCheck = Test-BuildStatus -ProjectType $detectedType -Path $ProjectPath
    $statusResults.Build.Status = $buildCheck
    
    $testCheck = Test-TestStatus -ProjectType $detectedType -Path $ProjectPath
    $statusResults.Tests.Status = $testCheck
    
    # Run specific checks
    if ($runPerformance) {
        $perfCheck = Test-Performance -ProjectType $detectedType -Path $ProjectPath
        $statusResults.Performance.Status = $perfCheck
    }
    
    if ($runSecurity) {
        $secCheck = Test-Security -ProjectType $detectedType -Path $ProjectPath
        $statusResults.Security.Status = $secCheck
    }
    
    # Generate summary
    $result = New-StatusSummary -Results $statusResults
    
    if ($Json) {
        Write-Output $result
    } else {
        Write-Host "`n✅ Status check completed!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Status check failed with error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
