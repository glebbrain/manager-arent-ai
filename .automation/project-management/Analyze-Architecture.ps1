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

Write-Info "CyberSyn Architecture Analysis"

# Initialize analysis results
$analysis = @{
  ProjectType = "Unknown"
  Architecture = @{}
  Components = @{}
  Dependencies = @{}
  Issues = @()
  Recommendations = @()
}

# Detect project type from IDEA.md
if (Test-Path ".manager/IDEA.md") {
  $ideaContent = Get-Content ".manager/IDEA.md" -Raw
  if ($ideaContent -match "CyberSyn|Analytics|Web Application") {
    $analysis.ProjectType = "Analytics Web Application"
  }
}

# Analyze frontend components
Write-Info "Analyzing frontend components..."
$frontendComponents = @()
if (Test-Path "web/components") {
  $components = Get-ChildItem "web/components" -Recurse -Filter "*.tsx" | ForEach-Object { $_.Name }
  $frontendComponents += $components
  $analysis.Components.Frontend = $components
}

# Analyze backend structure
Write-Info "Analyzing backend structure..."
$backendStructure = @{}
if (Test-Path "src") {
  $srcDirs = Get-ChildItem "src" -Directory | ForEach-Object { $_.Name }
  $backendStructure.Directories = $srcDirs

  if (Test-Path "src/etl") {
    $etlFiles = Get-ChildItem "src/etl" -Filter "*.py" | ForEach-Object { $_.Name }
    $backendStructure.ETL = $etlFiles
  }

  $analysis.Components.Backend = $backendStructure
}

# Analyze database structure
Write-Info "Analyzing database structure..."
$dbStructure = @{}
if (Test-Path "src/sql") {
  $sqlFiles = Get-ChildItem "src/sql" -Filter "*.sql" | ForEach-Object { $_.Name }
  $dbStructure.SQLFiles = $sqlFiles
  $analysis.Components.Database = $dbStructure
}

# Analyze API structure
Write-Info "Analyzing API structure..."
$apiStructure = @{}
if (Test-Path "web/pages/api") {
  $apiFiles = Get-ChildItem "web/pages/api" -Recurse -Filter "*.ts" | ForEach-Object { $_.Name }
  $apiStructure.APIFiles = $apiFiles
  $analysis.Components.API = $apiStructure
}

# Analyze dependencies
Write-Info "Analyzing dependencies..."
$dependencies = @{}

# Python dependencies
if (Test-Path "requirements.txt") {
  $pythonDeps = Get-Content "requirements.txt" | Where-Object { $_ -notmatch "^#" -and $_ -ne "" }
  $dependencies.Python = $pythonDeps
}

# Node.js dependencies
if (Test-Path "web/package.json") {
  $packageJson = Get-Content "web/package.json" | ConvertFrom-Json
  $dependencies.NodeJS = @{
    Dependencies = $packageJson.dependencies
    DevDependencies = $packageJson.devDependencies
  }
}

$analysis.Dependencies = $dependencies

# Analyze configuration files
Write-Info "Analyzing configuration files..."
$configFiles = @()
$configPatterns = @("*.json", "*.yaml", "*.yml", "*.toml", "*.ini", "*.config.*")
foreach ($pattern in $configPatterns) {
  $files = Get-ChildItem -Path "." -Filter $pattern -Recurse | Where-Object {
    $_.FullName -notmatch "node_modules|\.git|\.next|__pycache__"
  } | ForEach-Object { $_.Name }
  $configFiles += $files
}
$analysis.Components.Configuration = $configFiles

# Analyze test structure
Write-Info "Analyzing test structure..."
$testStructure = @{}
if (Test-Path "tests") {
  $testDirs = Get-ChildItem "tests" -Directory | ForEach-Object { $_.Name }
  $testStructure.Directories = $testDirs

  $testFiles = Get-ChildItem "tests" -Recurse -Filter "test_*.py" | ForEach-Object { $_.Name }
  $testStructure.PythonTests = $testFiles

  $jsTestFiles = Get-ChildItem "web/tests" -Recurse -Filter "*.test.*" -ErrorAction SilentlyContinue | ForEach-Object { $_.Name }
  $testStructure.JavaScriptTests = $jsTestFiles
}
$analysis.Components.Tests = $testStructure

# Check for architecture issues
Write-Info "Checking for architecture issues..."

# Check for missing components
$missingComponents = @()
if ($frontendComponents.Count -eq 0) {
  $missingComponents += "Frontend components not found"
}
if (-not (Test-Path "src/etl")) {
  $missingComponents += "ETL directory not found"
}
if (-not (Test-Path "src/sql")) {
  $missingComponents += "SQL scripts not found"
}

if ($missingComponents.Count -gt 0) {
  $analysis.Issues += $missingComponents
}

# Check for configuration completeness
$configIssues = @()
if (-not (Test-Path "docker-compose.yml")) {
  $configIssues += "Docker Compose configuration missing"
}
if (-not (Test-Path ".env.example")) {
  $configIssues += "Environment variables example missing"
}

if ($configIssues.Count -gt 0) {
  $analysis.Issues += $configIssues
}

# Generate recommendations
Write-Info "Generating recommendations..."
$recommendations = @()

if ($frontendComponents.Count -lt 5) {
  $recommendations += "Consider adding more React components for better modularity"
}

if (-not (Test-Path "docs")) {
  $recommendations += "Create documentation directory for better project documentation"
}

if (-not (Test-Path ".github/workflows")) {
  $recommendations += "Add GitHub Actions workflows for CI/CD"
}

$analysis.Recommendations = $recommendations

# Display results
if (-not $Quiet) {
  Write-Host "`n📊 Architecture Analysis Results:" -ForegroundColor Cyan
  Write-Host ("Project Type: {0}" -f $analysis.ProjectType)

  Write-Host "`n🏗️ Components:" -ForegroundColor Yellow
  Write-Host ("  Frontend: {0} components" -f $frontendComponents.Count)
  Write-Host ("  Backend: {0} directories" -f $backendStructure.Directories.Count)
  Write-Host ("  Database: {0} SQL files" -f $dbStructure.SQLFiles.Count)
  Write-Host ("  API: {0} endpoints" -f $apiStructure.APIFiles.Count)
  Write-Host ("  Tests: {0} test directories" -f $testStructure.Directories.Count)
  Write-Host ("  Config: {0} config files" -f $configFiles.Count)

  if ($analysis.Issues.Count -gt 0) {
    Write-Host "`n🚨 Issues Found:" -ForegroundColor Red
    foreach ($issue in $analysis.Issues) {
      Write-Host ("  - {0}" -f $issue)
    }
  }

  if ($analysis.Recommendations.Count -gt 0) {
    Write-Host "`n💡 Recommendations:" -ForegroundColor Green
    foreach ($rec in $analysis.Recommendations) {
      Write-Host ("  - {0}" -f $rec)
    }
  }
}

if ($Detailed) {
  Write-Host "`n🔍 Detailed Analysis:" -ForegroundColor Cyan

  if ($frontendComponents.Count -gt 0) {
    Write-Host "`nFrontend Components:" -ForegroundColor Yellow
    foreach ($component in $frontendComponents) {
      Write-Host ("  - {0}" -f $component)
    }
  }

  if ($backendStructure.Directories.Count -gt 0) {
    Write-Host "`nBackend Structure:" -ForegroundColor Yellow
    foreach ($dir in $backendStructure.Directories) {
      Write-Host ("  - {0}" -f $dir)
    }
  }

  if ($dependencies.Python.Count -gt 0) {
    Write-Host "`nPython Dependencies:" -ForegroundColor Yellow
    foreach ($dep in $dependencies.Python) {
      Write-Host ("  - {0}" -f $dep)
    }
  }
}

# Generate report if requested
if ($GenerateReport) {
  $dateStr = Get-Date -Format "yyyy-MM-dd"
  $reportPath = "docs/architecture-analysis-$dateStr.json"
  if (-not (Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" -Force | Out-Null
  }

  $analysis | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
  Write-Ok "Architecture analysis report saved to: $reportPath"
}

# Exit with appropriate code
if ($analysis.Issues.Count -gt 0) {
  exit 1
} else {
  exit 0
}
