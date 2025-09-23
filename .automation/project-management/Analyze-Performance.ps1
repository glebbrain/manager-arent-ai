param(
  [switch]$Quiet,
  [switch]$Detailed,
  [switch]$GenerateReport
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { if (-not $Quiet) { Write-Host $msg -ForegroundColor Cyan } }
function Write-Ok($msg)   { if (-not $Quiet) { Write-Host $msg -ForegroundColor Green } }
function Write-Warn($msg) { if (-not $Quiet) { Write-Host $msg -ForegroundColor Yellow } }
function Write-Err($msg)  { if (-not $Quiet) { Write-Host $msg -ForegroundColor Red } }

Write-Info "⚡ CyberSyn Performance Analysis"

# Initialize performance metrics
$performance = @{
  Frontend = @{}
  Backend = @{}
  Database = @{}
  Infrastructure = @{}
  Issues = @()
  Recommendations = @()
}

# Analyze frontend performance
Write-Info "Analyzing frontend performance..."

# Check bundle size and optimization
if (Test-Path "web/package.json") {
  $packageJson = Get-Content "web/package.json" | ConvertFrom-Json

  # Check for performance-related dependencies
  $performanceDeps = @("next", "react", "typescript")
  $hasPerformanceDeps = $false
  foreach ($dep in $performanceDeps) {
    if ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep) {
      $hasPerformanceDeps = $true
      break
    }
  }

  $performance.Frontend.HasPerformanceDeps = $hasPerformanceDeps
  $performance.Frontend.Dependencies = $packageJson.dependencies
}

# Check for performance optimization files
$perfFiles = @()
if (Test-Path "web/next.config.mjs") { $perfFiles += "next.config.mjs" }
if (Test-Path "web/.lighthouserc.json") { $perfFiles += ".lighthouserc.json" }
if (Test-Path "web/vitest.config.ts") { $perfFiles += "vitest.config.ts" }

$performance.Frontend.PerformanceFiles = $perfFiles

# Analyze backend performance
Write-Info "Analyzing backend performance..."

# Check ETL performance
if (Test-Path "src/etl") {
  $etlFiles = Get-ChildItem "src/etl" -Filter "*.py" | ForEach-Object { $_.Name }
  $performance.Backend.ETLFiles = $etlFiles

  # Check for performance-related ETL patterns
  $perfPatterns = @("async", "concurrent", "batch", "chunk", "optimize")
  $hasPerfPatterns = $false

  foreach ($file in $etlFiles) {
    $content = Get-Content "src/etl/$file" -Raw -ErrorAction SilentlyContinue
    if ($content) {
      foreach ($pattern in $perfPatterns) {
        if ($content -match $pattern) {
          $hasPerfPatterns = $true
          break
        }
      }
    }
  }

  $performance.Backend.HasPerformancePatterns = $hasPerfPatterns
}

# Analyze database performance
Write-Info "Analyzing database performance..."

# Check SQL files for performance optimizations
if (Test-Path "src/sql") {
  $sqlFiles = Get-ChildItem "src/sql" -Filter "*.sql" | ForEach-Object { $_.Name }
  $performance.Database.SQLFiles = $sqlFiles

  # Check for performance-related SQL patterns
  $sqlPerfPatterns = @("INDEX", "INDEXED", "PARTITION", "OPTIMIZE", "ANALYZE")
  $hasSQLPerfPatterns = $false

  foreach ($file in $sqlFiles) {
    $content = Get-Content "src/sql/$file" -Raw -ErrorAction SilentlyContinue
    if ($content) {
      foreach ($pattern in $sqlPerfPatterns) {
        if ($content -match $pattern) {
          $hasSQLPerfPatterns = $true
          break
        }
      }
    }
  }

  $performance.Database.HasPerformancePatterns = $hasSQLPerfPatterns
}

# Analyze infrastructure performance
Write-Info "Analyzing infrastructure performance..."

# Check Docker configuration
if (Test-Path "docker-compose.yml") {
  $dockerContent = Get-Content "docker-compose.yml" -Raw
  $performance.Infrastructure.HasDocker = $true

  # Check for performance-related Docker settings
  $dockerPerfPatterns = @("mem_limit", "cpus", "shm_size", "ulimits")
  $hasDockerPerfSettings = $false

  foreach ($pattern in $dockerPerfPatterns) {
    if ($dockerContent -match $pattern) {
      $hasDockerPerfSettings = $true
      break
    }
  }

  $performance.Infrastructure.HasPerformanceSettings = $hasDockerPerfSettings
}

# Check for caching configuration
$cacheFiles = @()
if (Test-Path "redis.conf") { $cacheFiles += "redis.conf" }
if (Test-Path "config/redis.conf") { $cacheFiles += "config/redis.conf" }

$performance.Infrastructure.CacheFiles = $cacheFiles

# Analyze test performance
Write-Info "Analyzing test performance..."

# Check for performance tests
$perfTests = @()
if (Test-Path "tests/perf") {
  $perfTestFiles = Get-ChildItem "tests/perf" -Filter "*.py" | ForEach-Object { $_.Name }
  $perfTests += $perfTestFiles
}

if (Test-Path "web/tests") {
  $webPerfTests = Get-ChildItem "web/tests" -Recurse -Filter "*perf*" | ForEach-Object { $_.Name }
  $perfTests += $webPerfTests
}

$performance.Tests = @{
  PerformanceTests = $perfTests
  HasPerformanceTests = $perfTests.Count -gt 0
}

# Check for performance monitoring
Write-Info "Checking performance monitoring..."

$monitoringFiles = @()
if (Test-Path "config/metrics_config.json") { $monitoringFiles += "metrics_config.json" }
if (Test-Path "config/scaling_config.json") { $monitoringFiles += "scaling_config.json" }

$performance.Monitoring = @{
  ConfigFiles = $monitoringFiles
  HasMonitoring = $monitoringFiles.Count -gt 0
}

# Identify performance issues
Write-Info "Identifying performance issues..."

$issues = @()

# Frontend issues
if (-not $performance.Frontend.HasPerformanceDeps) {
  $issues += "Frontend: Missing performance optimization dependencies"
}

if ($performance.Frontend.PerformanceFiles.Count -eq 0) {
  $issues += "Frontend: No performance configuration files found"
}

# Backend issues
if (-not $performance.Backend.HasPerformancePatterns) {
  $issues += "Backend: ETL processes may lack performance optimizations"
}

# Database issues
if (-not $performance.Database.HasPerformancePatterns) {
  $issues += "Database: SQL queries may lack performance optimizations"
}

# Infrastructure issues
if (-not $performance.Infrastructure.HasPerformanceSettings) {
  $issues += "Infrastructure: Docker configuration lacks performance settings"
}

if ($performance.Infrastructure.CacheFiles.Count -eq 0) {
  $issues += "Infrastructure: No caching configuration found"
}

# Test issues
if (-not $performance.Tests.HasPerformanceTests) {
  $issues += "Testing: No performance tests found"
}

# Monitoring issues
if (-not $performance.Monitoring.HasMonitoring) {
  $issues += "Monitoring: No performance monitoring configuration found"
}

$performance.Issues = $issues

# Generate recommendations
Write-Info "Generating performance recommendations..."

$recommendations = @()

# Frontend recommendations
if (-not $performance.Frontend.HasPerformanceDeps) {
  $recommendations += "Add performance optimization dependencies (next-optimized-images, next-bundle-analyzer)"
}

if ($performance.Frontend.PerformanceFiles.Count -eq 0) {
  $recommendations += "Configure Next.js performance optimizations in next.config.mjs"
  $recommendations += "Add Lighthouse CI configuration for performance monitoring"
}

# Backend recommendations
if (-not $performance.Backend.HasPerformancePatterns) {
  $recommendations += "Implement async/await patterns in ETL processes"
  $recommendations += "Add batch processing for large datasets"
  $recommendations += "Implement connection pooling for database operations"
}

# Database recommendations
if (-not $performance.Database.HasPerformancePatterns) {
  $recommendations += "Add database indexes for frequently queried columns"
  $recommendations += "Implement query optimization and partitioning"
  $recommendations += "Add database performance monitoring"
}

# Infrastructure recommendations
if (-not $performance.Infrastructure.HasPerformanceSettings) {
  $recommendations += "Configure Docker resource limits and performance settings"
  $recommendations += "Implement Redis caching for frequently accessed data"
  $recommendations += "Add load balancing configuration"
}

# Test recommendations
if (-not $performance.Tests.HasPerformanceTests) {
  $recommendations += "Add performance tests for critical paths"
  $recommendations += "Implement load testing with K6 or similar tools"
  $recommendations += "Add performance regression testing"
}

# Monitoring recommendations
if (-not $performance.Monitoring.HasMonitoring) {
  $recommendations += "Implement performance metrics collection"
  $recommendations += "Add auto-scaling configuration"
  $recommendations += "Set up performance alerting"
}

$performance.Recommendations = $recommendations

# Display results
if (-not $Quiet) {
  Write-Host "`n⚡ Performance Analysis Results:" -ForegroundColor Cyan

  Write-Host "`n🎯 Performance Status:" -ForegroundColor Yellow
  Write-Host ("  Frontend Optimization: {0}" -f $(if ($performance.Frontend.HasPerformanceDeps) { "✅" } else { "❌" }))
  Write-Host ("  Backend Optimization: {0}" -f $(if ($performance.Backend.HasPerformancePatterns) { "✅" } else { "❌" }))
  Write-Host ("  Database Optimization: {0}" -f $(if ($performance.Database.HasPerformancePatterns) { "✅" } else { "❌" }))
  Write-Host ("  Infrastructure Tuning: {0}" -f $(if ($performance.Infrastructure.HasPerformanceSettings) { "✅" } else { "❌" }))
  Write-Host ("  Performance Tests: {0}" -f $(if ($performance.Tests.HasPerformanceTests) { "✅" } else { "❌" }))
  Write-Host ("  Performance Monitoring: {0}" -f $(if ($performance.Monitoring.HasMonitoring) { "✅" } else { "❌" }))

  if ($performance.Issues.Count -gt 0) {
    Write-Host "`n🚨 Performance Issues:" -ForegroundColor Red
    foreach ($issue in $performance.Issues) {
      Write-Host ("  - {0}" -f $issue)
    }
  }

  if ($performance.Recommendations.Count -gt 0) {
    Write-Host "`n💡 Performance Recommendations:" -ForegroundColor Green
    foreach ($rec in $performance.Recommendations) {
      Write-Host ("  - {0}" -f $rec)
    }
  }
}

if ($Detailed) {
  Write-Host "`n🔍 Detailed Performance Analysis:" -ForegroundColor Cyan

  Write-Host "`nFrontend Performance:" -ForegroundColor Yellow
  Write-Host ("  Performance Files: {0}" -f $performance.Frontend.PerformanceFiles.Count)
  if ($performance.Frontend.PerformanceFiles.Count -gt 0) {
    foreach ($file in $performance.Frontend.PerformanceFiles) {
      Write-Host ("    - {0}" -f $file)
    }
  }

  Write-Host "`nBackend Performance:" -ForegroundColor Yellow
  Write-Host ("  ETL Files: {0}" -f $performance.Backend.ETLFiles.Count)
  Write-Host ("  Has Performance Patterns: {0}" -f $performance.Backend.HasPerformancePatterns)

  Write-Host "`nDatabase Performance:" -ForegroundColor Yellow
  Write-Host ("  SQL Files: {0}" -f $performance.Database.SQLFiles.Count)
  Write-Host ("  Has Performance Patterns: {0}" -f $performance.Database.HasPerformancePatterns)

  Write-Host "`nInfrastructure Performance:" -ForegroundColor Yellow
  Write-Host ("  Has Docker: {0}" -f $performance.Infrastructure.HasDocker)
  Write-Host ("  Has Performance Settings: {0}" -f $performance.Infrastructure.HasPerformanceSettings)
  Write-Host ("  Cache Files: {0}" -f $performance.Infrastructure.CacheFiles.Count)

  Write-Host "`nPerformance Tests:" -ForegroundColor Yellow
  Write-Host ("  Performance Tests: {0}" -f $performance.Tests.PerformanceTests.Count)
  if ($performance.Tests.PerformanceTests.Count -gt 0) {
    foreach ($test in $performance.Tests.PerformanceTests) {
      Write-Host ("    - {0}" -f $test)
    }
  }

  Write-Host "`nPerformance Monitoring:" -ForegroundColor Yellow
  Write-Host ("  Config Files: {0}" -f $performance.Monitoring.ConfigFiles.Count)
  if ($performance.Monitoring.ConfigFiles.Count -gt 0) {
    foreach ($file in $performance.Monitoring.ConfigFiles) {
      Write-Host ("    - {0}" -f $file)
    }
  }
}

# Generate report if requested
if ($GenerateReport) {
  $dateStr = Get-Date -Format "yyyy-MM-dd"
  $reportPath = "docs/performance-analysis-$dateStr.json"
  if (-not (Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" -Force | Out-Null
  }

  $performance | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
  Write-Ok "Performance analysis report saved to: $reportPath"
}

# Exit with appropriate code
if ($performance.Issues.Count -gt 0) {
  exit 1
} else {
  exit 0
}
