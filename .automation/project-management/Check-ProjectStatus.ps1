# FreeRPA Enterprise Project Status Checker
# Enhanced with comprehensive status checking and health monitoring

param(
    [switch]$Detailed,
    [switch]$Health,
    [switch]$Performance,
    [switch]$Security,
    [switch]$All,
    [switch]$Json,
    [string]$OutputFile = ""
)

Write-Host "📊 FreeRPA Enterprise Project Status Check - Starting..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Continue"

# Status results
$statusResults = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Project = @{
        Name = "FreeRPASite"
        Version = "1.0.0"
        Environment = $env:NODE_ENV ?? "development"
        Status = "Unknown"
    }
    Health = @{
        Overall = "Unknown"
        Services = @{}
        Database = "Unknown"
        Cache = "Unknown"
        API = "Unknown"
    }
    Performance = @{
        ResponseTime = 0
        MemoryUsage = 0
        CPUUsage = 0
        DiskUsage = 0
    }
    Security = @{
        Vulnerabilities = 0
        SecurityHeaders = "Unknown"
        Authentication = "Unknown"
        Authorization = "Unknown"
    }
    Dependencies = @{
        NodeModules = "Unknown"
        Database = "Unknown"
        Cache = "Unknown"
        Monitoring = "Unknown"
    }
    Tests = @{
        Unit = "Unknown"
        Integration = "Unknown"
        E2E = "Unknown"
        Coverage = 0
    }
    Deployment = @{
        Status = "Unknown"
        LastDeploy = "Unknown"
        Version = "Unknown"
    }
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
    
    # Store in results
    if ($Details) {
        $statusResults[$Category][$Item] = @{
            Status = $Status
            Message = $Message
            Details = $Details
            Timestamp = $timestamp
        }
    } else {
        $statusResults[$Category][$Item] = @{
            Status = $Status
            Message = $Message
            Timestamp = $timestamp
        }
    }
}

# Function to check project files
function Test-ProjectFiles {
    Write-Host "`n📁 Checking project files..." -ForegroundColor Cyan
    
    $requiredFiles = @(
        @{ Path = "package.json"; Critical = $true },
        @{ Path = "README.md"; Critical = $true },
        @{ Path = "next.config.mjs"; Critical = $true },
        @{ Path = "tsconfig.json"; Critical = $true },
        @{ Path = "prisma/schema.prisma"; Critical = $true },
        @{ Path = "src/app"; Critical = $true },
        @{ Path = "src/components"; Critical = $true },
        @{ Path = "src/lib"; Critical = $true }
    )
    
    $missingFiles = 0
    $totalFiles = $requiredFiles.Count
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file.Path) {
            Write-Status "Project" "Files" "OK" "$($file.Path) exists"
        } else {
            $status = if ($file.Critical) { "ERROR" } else { "WARNING" }
            Write-Status "Project" "Files" $status "$($file.Path) missing"
            if ($file.Critical) { $missingFiles++ }
        }
    }
    
    if ($missingFiles -eq 0) {
        $statusResults.Project.Status = "OK"
    } else {
        $statusResults.Project.Status = "ERROR"
    }
}

# Function to check dependencies
function Test-Dependencies {
    Write-Host "`n📦 Checking dependencies..." -ForegroundColor Cyan
    
    # Check Node.js dependencies
    if (Test-Path "node_modules") {
        $nodeModulesCount = (Get-ChildItem "node_modules" -Directory).Count
        Write-Status "Dependencies" "NodeModules" "OK" "$nodeModulesCount packages installed"
        $statusResults.Dependencies.NodeModules = "OK"
    } else {
        Write-Status "Dependencies" "NodeModules" "ERROR" "node_modules not found"
        $statusResults.Dependencies.NodeModules = "ERROR"
    }
    
    # Check package.json
    if (Test-Path "package.json") {
        try {
            $packageJson = Get-Content "package.json" | ConvertFrom-Json
            $depCount = if ($packageJson.dependencies) { ($packageJson.dependencies | Get-Member -MemberType NoteProperty).Count } else { 0 }
            $devDepCount = if ($packageJson.devDependencies) { ($packageJson.devDependencies | Get-Member -MemberType NoteProperty).Count } else { 0 }
            Write-Status "Dependencies" "PackageJson" "OK" "$depCount dependencies, $devDepCount dev dependencies"
        } catch {
            Write-Status "Dependencies" "PackageJson" "ERROR" "Invalid package.json format"
        }
    }
    
    # Check mobile dependencies
    if (Test-Path "mobile") {
        if (Test-Path "mobile/node_modules") {
            Write-Status "Dependencies" "Mobile" "OK" "Mobile dependencies installed"
        } else {
            Write-Status "Dependencies" "Mobile" "WARNING" "Mobile dependencies not installed"
        }
    }
}

# Function to check database
function Test-Database {
    Write-Host "`n🗄️ Checking database..." -ForegroundColor Cyan
    
    # Check Prisma schema
    if (Test-Path "prisma/schema.prisma") {
        Write-Status "Health" "Database" "OK" "Prisma schema found"
        $statusResults.Health.Database = "OK"
    } else {
        Write-Status "Health" "Database" "ERROR" "Prisma schema not found"
        $statusResults.Health.Database = "ERROR"
    }
    
    # Check for database connection (if possible)
    try {
        if (Get-Command "npx" -ErrorAction SilentlyContinue) {
            $result = npx prisma db pull --preview-feature 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Status "Health" "DatabaseConnection" "OK" "Database connection successful"
            } else {
                Write-Status "Health" "DatabaseConnection" "WARNING" "Database connection failed or not configured"
            }
        }
    } catch {
        Write-Status "Health" "DatabaseConnection" "WARNING" "Cannot test database connection"
    }
}

# Function to check cache
function Test-Cache {
    Write-Host "`n💾 Checking cache..." -ForegroundColor Cyan
    
    # Check Redis (if Docker is available)
    if (Get-Command "docker" -ErrorAction SilentlyContinue) {
        try {
            $redisRunning = docker ps --filter "name=freerpa-redis" --format "table {{.Names}}" | Select-String "freerpa-redis"
            if ($redisRunning) {
                Write-Status "Health" "Cache" "OK" "Redis container running"
                $statusResults.Health.Cache = "OK"
            } else {
                Write-Status "Health" "Cache" "WARNING" "Redis container not running"
                $statusResults.Health.Cache = "WARNING"
            }
        } catch {
            Write-Status "Health" "Cache" "WARNING" "Cannot check Redis status"
            $statusResults.Health.Cache = "WARNING"
        }
    } else {
        Write-Status "Health" "Cache" "INFO" "Docker not available, cannot check Redis"
        $statusResults.Health.Cache = "INFO"
    }
}

# Function to check API health
function Test-APIHealth {
    Write-Host "`n🌐 Checking API health..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Status "Health" "API" "OK" "API responding successfully"
            $statusResults.Health.API = "OK"
        } else {
            Write-Status "Health" "API" "WARNING" "API responding with status $($response.StatusCode)"
            $statusResults.Health.API = "WARNING"
        }
    } catch {
        Write-Status "Health" "API" "WARNING" "API not responding or not started"
        $statusResults.Health.API = "WARNING"
    }
}

# Function to check performance
function Test-Performance {
    Write-Host "`n⚡ Checking performance..." -ForegroundColor Cyan
    
    # Check bundle size
    if (Test-Path ".next") {
        $bundleSize = (Get-ChildItem ".next" -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $bundleSizeMB = [math]::Round($bundleSize / 1MB, 2)
        
        if ($bundleSizeMB -lt 50) {
            Write-Status "Performance" "BundleSize" "OK" "Bundle size: ${bundleSizeMB}MB"
        } elseif ($bundleSizeMB -lt 100) {
            Write-Status "Performance" "BundleSize" "WARNING" "Bundle size: ${bundleSizeMB}MB (consider optimization)"
        } else {
            Write-Status "Performance" "BundleSize" "ERROR" "Bundle size: ${bundleSizeMB}MB (too large)"
        }
        
        $statusResults.Performance.BundleSize = $bundleSizeMB
    }
    
    # Check for performance monitoring
    if (Test-Path "src/lib/performance") {
        Write-Status "Performance" "Monitoring" "OK" "Performance monitoring configured"
    } else {
        Write-Status "Performance" "Monitoring" "WARNING" "Performance monitoring not configured"
    }
}

# Function to check security
function Test-Security {
    Write-Host "`n🔐 Checking security..." -ForegroundColor Cyan
    
    # Check for security middleware
    if (Test-Path "src/middleware.ts") {
        $middlewareContent = Get-Content "src/middleware.ts" -Raw
        if ($middlewareContent -match "helmet|security|headers") {
            Write-Status "Security" "Headers" "OK" "Security headers configured"
            $statusResults.Security.SecurityHeaders = "OK"
        } else {
            Write-Status "Security" "Headers" "WARNING" "Security headers not found"
            $statusResults.Security.SecurityHeaders = "WARNING"
        }
    } else {
        Write-Status "Security" "Headers" "WARNING" "Middleware not found"
        $statusResults.Security.SecurityHeaders = "WARNING"
    }
    
    # Check for authentication
    if (Test-Path "src/lib/auth") {
        Write-Status "Security" "Authentication" "OK" "Authentication configured"
        $statusResults.Security.Authentication = "OK"
    } else {
        Write-Status "Security" "Authentication" "WARNING" "Authentication not configured"
        $statusResults.Security.Authentication = "WARNING"
    }
    
    # Check for environment variables
    if (Test-Path ".env") {
        $envContent = Get-Content ".env" -Raw
        if ($envContent -match "NEXTAUTH_SECRET") {
            Write-Status "Security" "Environment" "OK" "Required environment variables found"
        } else {
            Write-Status "Security" "Environment" "WARNING" "Some required environment variables missing"
        }
    } else {
        Write-Status "Security" "Environment" "WARNING" ".env file not found"
    }
}

# Function to check tests
function Test-Tests {
    Write-Host "`n🧪 Checking tests..." -ForegroundColor Cyan
    
    # Check test files
    $testFiles = Get-ChildItem -Recurse -Filter "*.test.*" | Measure-Object
    $specFiles = Get-ChildItem -Recurse -Filter "*.spec.*" | Measure-Object
    $totalTestFiles = $testFiles.Count + $specFiles.Count
    
    if ($totalTestFiles -gt 0) {
        Write-Status "Tests" "TestFiles" "OK" "$totalTestFiles test files found"
    } else {
        Write-Status "Tests" "TestFiles" "WARNING" "No test files found"
    }
    
    # Check test configuration
    if (Test-Path "jest.config.ts") {
        Write-Status "Tests" "Configuration" "OK" "Jest configuration found"
    } else {
        Write-Status "Tests" "Configuration" "WARNING" "Jest configuration not found"
    }
    
    # Check Playwright configuration
    if (Test-Path "playwright.config.ts") {
        Write-Status "Tests" "E2E" "OK" "Playwright configuration found"
        $statusResults.Tests.E2E = "OK"
    } else {
        Write-Status "Tests" "E2E" "WARNING" "Playwright configuration not found"
        $statusResults.Tests.E2E = "WARNING"
    }
}

# Function to generate summary
function New-StatusSummary {
    Write-Host "`n📊 Status Summary:" -ForegroundColor Yellow
    
    # Calculate overall health
    $healthChecks = @($statusResults.Health.Database, $statusResults.Health.Cache, $statusResults.Health.API)
    $okCount = ($healthChecks | Where-Object { $_ -eq "OK" }).Count
    $totalCount = $healthChecks.Count
    
    if ($okCount -eq $totalCount) {
        $statusResults.Health.Overall = "OK"
        Write-Host "  🟢 Overall Health: EXCELLENT" -ForegroundColor Green
    } elseif ($okCount -gt 0) {
        $statusResults.Health.Overall = "WARNING"
        Write-Host "  🟡 Overall Health: GOOD" -ForegroundColor Yellow
    } else {
        $statusResults.Health.Overall = "ERROR"
        Write-Host "  🔴 Overall Health: NEEDS ATTENTION" -ForegroundColor Red
    }
    
    # Project status
    Write-Host "`n📋 Project Status:" -ForegroundColor Cyan
    Write-Host "  Name: $($statusResults.Project.Name)" -ForegroundColor White
    Write-Host "  Version: $($statusResults.Project.Version)" -ForegroundColor White
    Write-Host "  Environment: $($statusResults.Project.Environment)" -ForegroundColor White
    Write-Host "  Status: $($statusResults.Project.Status)" -ForegroundColor White
    
    # Health status
    Write-Host "`n🏥 Health Status:" -ForegroundColor Cyan
    Write-Host "  Database: $($statusResults.Health.Database)" -ForegroundColor White
    Write-Host "  Cache: $($statusResults.Health.Cache)" -ForegroundColor White
    Write-Host "  API: $($statusResults.Health.API)" -ForegroundColor White
    
    # Dependencies status
    Write-Host "`n📦 Dependencies Status:" -ForegroundColor Cyan
    Write-Host "  Node Modules: $($statusResults.Dependencies.NodeModules)" -ForegroundColor White
    Write-Host "  Database: $($statusResults.Dependencies.Database)" -ForegroundColor White
    Write-Host "  Cache: $($statusResults.Dependencies.Cache)" -ForegroundColor White
    
    # Save to file if requested
    if ($OutputFile) {
        $statusResults | ConvertTo-Json -Depth 10 | Out-File $OutputFile
        Write-Host "`n📄 Status report saved to: $OutputFile" -ForegroundColor Green
    }
    
    # Return JSON if requested
    if ($Json) {
        return $statusResults | ConvertTo-Json -Depth 10
    }
}

# Main execution
try {
    Write-Host "Starting FreeRPA Enterprise Project Status Check..." -ForegroundColor Green
    
    # Determine which checks to run
    $runAll = $All
    $runHealth = $Health -or $runAll
    $runPerformance = $Performance -or $runAll
    $runSecurity = $Security -or $runAll
    
    # Always run basic checks
    Test-ProjectFiles
    Test-Dependencies
    
    # Run specific checks
    if ($runHealth) {
        Test-Database
        Test-Cache
        Test-APIHealth
    }
    
    if ($runPerformance) {
        Test-Performance
    }
    
    if ($runSecurity) {
        Test-Security
    }
    
    # Always check tests
    Test-Tests
    
    # Generate summary
    $result = New-StatusSummary
    
    if ($Json) {
        Write-Output $result
    } else {
        Write-Host "`n✅ Status check completed!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Status check failed with error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}