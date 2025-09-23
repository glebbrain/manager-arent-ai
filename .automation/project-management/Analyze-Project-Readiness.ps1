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

Write-Info "Project Readiness Analysis"

# Initialize readiness analysis
$readiness = @{
  Overall = @{
    Total = 0
    Completed = 0
    Percentage = 0
  }
  Components = @{}
  Tasks = @{
    Critical = @{ Total = 0; Completed = 0; Percentage = 0 }
    High = @{ Total = 0; Completed = 0; Percentage = 0 }
    Medium = @{ Total = 0; Completed = 0; Percentage = 0 }
    Low = @{ Total = 0; Completed = 0; Percentage = 0 }
  }
  Issues = @()
  Recommendations = @()
}

# Analyze TODO.md for task completion
Write-Info "Analyzing task completion..."

if (Test-Path ".manager/TODO.md") {
  $todoContent = Get-Content ".manager/TODO.md"

  # Count tasks by priority and completion status
  foreach ($line in $todoContent) {
    if ($line -match '^\s*-\s*\[([xX])\]\s*') {
      # Completed task
      $readiness.Overall.Completed++

      # Determine priority based on context
      $context = $todoContent | Select-Object -Skip ([array]::IndexOf($todoContent, $line) - 10) -First 20
      $priorityContext = $context | Where-Object { $_ -match 'CRITICAL|HIGH|MEDIUM|LOW' }

      if ($priorityContext -match 'CRITICAL') {
        $readiness.Tasks.Critical.Completed++
      } elseif ($priorityContext -match 'HIGH') {
        $readiness.Tasks.High.Completed++
      } elseif ($priorityContext -match 'MEDIUM') {
        $readiness.Tasks.Medium.Completed++
      } elseif ($priorityContext -match 'LOW') {
        $readiness.Tasks.Low.Completed++
      }
    } elseif ($line -match '^\s*-\s*\[\s*\]\s*') {
      # Open task
      $readiness.Overall.Total++

      # Determine priority based on context
      $context = $todoContent | Select-Object -Skip ([array]::IndexOf($todoContent, $line) - 10) -First 20
      $priorityContext = $context | Where-Object { $_ -match 'CRITICAL|HIGH|MEDIUM|LOW' }

      if ($priorityContext -match 'CRITICAL') {
        $readiness.Tasks.Critical.Total++
      } elseif ($priorityContext -match 'HIGH') {
        $readiness.Tasks.High.Total++
      } elseif ($priorityContext -match 'MEDIUM') {
        $readiness.Tasks.Medium.Total++
      } elseif ($priorityContext -match 'LOW') {
        $readiness.Tasks.Low.Total++
      }
    }
  }

  # Calculate percentages
  if ($readiness.Overall.Total -gt 0) {
    $readiness.Overall.Percentage = [math]::Round(($readiness.Overall.Completed / $readiness.Overall.Total) * 100, 1)
  }

  foreach ($priority in @('Critical', 'High', 'Medium', 'Low')) {
    if ($readiness.Tasks.$priority.Total -gt 0) {
      $readiness.Tasks.$priority.Percentage = [math]::Round(($readiness.Tasks.$priority.Completed / $readiness.Tasks.$priority.Total) * 100, 1)
    }
  }
}

# Analyze COMPLETED.md for additional completed tasks
Write-Info "Analyzing completed tasks..."

if (Test-Path ".manager/COMPLETED.md") {
  $completedContent = Get-Content ".manager/COMPLETED.md"
  $completedTasks = ($completedContent | Where-Object { $_ -match '^\s*-\s*\[([xX])\]\s*' }).Count
  $readiness.Overall.Completed += $completedTasks
  $readiness.Overall.Total += $completedTasks
}

# Analyze component readiness
Write-Info "Analyzing component readiness..."

# Frontend readiness
$frontendReadiness = @{ Total = 0; Completed = 0; Percentage = 0 }
if (Test-Path "web/components") {
  $frontendComponents = Get-ChildItem "web/components" -Recurse -Filter "*.tsx" | ForEach-Object { $_.Name }
  $frontendReadiness.Total = $frontendComponents.Count

  # Check if components are implemented (basic check)
  foreach ($component in $frontendComponents) {
    $componentPath = "web/components/$component"
    if (Test-Path $componentPath) {
      $content = Get-Content $componentPath -Raw -ErrorAction SilentlyContinue
      if ($content -and $content.Length -gt 100) { # Basic implementation check
        $frontendReadiness.Completed++
      }
    }
  }

  if ($frontendReadiness.Total -gt 0) {
    $frontendReadiness.Percentage = [math]::Round(($frontendReadiness.Completed / $frontendReadiness.Total) * 100, 1)
  }
}
$readiness.Components.Frontend = $frontendReadiness

# Backend readiness
$backendReadiness = @{ Total = 0; Completed = 0; Percentage = 0 }
if (Test-Path "src/etl") {
  $etlFiles = Get-ChildItem "src/etl" -Filter "*.py" | ForEach-Object { $_.Name }
  $backendReadiness.Total = $etlFiles.Count

  foreach ($file in $etlFiles) {
    $filePath = "src/etl/$file"
    if (Test-Path $filePath) {
      $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
      if ($content -and $content.Length -gt 50) { # Basic implementation check
        $backendReadiness.Completed++
      }
    }
  }

  if ($backendReadiness.Total -gt 0) {
    $backendReadiness.Percentage = [math]::Round(($backendReadiness.Completed / $backendReadiness.Total) * 100, 1)
  }
}
$readiness.Components.Backend = $backendReadiness

# Database readiness
$dbReadiness = @{ Total = 0; Completed = 0; Percentage = 0 }
if (Test-Path "src/sql") {
  $sqlFiles = Get-ChildItem "src/sql" -Filter "*.sql" | ForEach-Object { $_.Name }
  $dbReadiness.Total = $sqlFiles.Count

  foreach ($file in $sqlFiles) {
    $filePath = "src/sql/$file"
    if (Test-Path $filePath) {
      $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
      if ($content -and $content.Length -gt 20) { # Basic implementation check
        $dbReadiness.Completed++
      }
    }
  }

  if ($dbReadiness.Total -gt 0) {
    $dbReadiness.Percentage = [math]::Round(($dbReadiness.Completed / $dbReadiness.Total) * 100, 1)
  }
}
$readiness.Components.Database = $dbReadiness

# API readiness
$apiReadiness = @{ Total = 0; Completed = 0; Percentage = 0 }
if (Test-Path "web/pages/api") {
  $apiFiles = Get-ChildItem "web/pages/api" -Recurse -Filter "*.ts" | ForEach-Object { $_.Name }
  $apiReadiness.Total = $apiFiles.Count

  foreach ($file in $apiFiles) {
    $filePath = "web/pages/api/$file"
    if (Test-Path $filePath) {
      $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
      if ($content -and $content.Length -gt 50) { # Basic implementation check
        $apiReadiness.Completed++
      }
    }
  }

  if ($apiReadiness.Total -gt 0) {
    $apiReadiness.Percentage = [math]::Round(($apiReadiness.Completed / $apiReadiness.Total) * 100, 1)
  }
}
$readiness.Components.API = $apiReadiness

# Tests readiness
$testsReadiness = @{ Total = 0; Completed = 0; Percentage = 0 }
if (Test-Path "tests") {
  $testFiles = Get-ChildItem "tests" -Recurse -Filter "test_*.py" | ForEach-Object { $_.Name }
  $testsReadiness.Total = $testFiles.Count

  foreach ($file in $testFiles) {
    $filePath = "tests/$file"
    if (Test-Path $filePath) {
      $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
      if ($content -and $content.Length -gt 30) { # Basic implementation check
        $testsReadiness.Completed++
      }
    }
  }

  if ($testsReadiness.Total -gt 0) {
    $testsReadiness.Percentage = [math]::Round(($testsReadiness.Completed / $testsReadiness.Total) * 100, 1)
  }
}
$readiness.Components.Tests = $testsReadiness

# Configuration readiness
$configReadiness = @{ Total = 0; Completed = 0; Percentage = 0 }
$configFiles = @("package.json", "requirements.txt", "docker-compose.yml", ".env.example", "tsconfig.json")
foreach ($file in $configFiles) {
  $configReadiness.Total++
  if (Test-Path $file) {
    $configReadiness.Completed++
  }
}
if ($configReadiness.Total -gt 0) {
  $configReadiness.Percentage = [math]::Round(($configReadiness.Completed / $configReadiness.Total) * 100, 1)
}
$readiness.Components.Configuration = $configReadiness

# Calculate overall component readiness
$totalComponents = 0
$completedComponents = 0
foreach ($component in $readiness.Components.GetEnumerator()) {
  $totalComponents += $component.Value.Total
  $completedComponents += $component.Value.Completed
}

if ($totalComponents -gt 0) {
  $readiness.Components.Overall = @{
    Total = $totalComponents
    Completed = $completedComponents
    Percentage = [math]::Round(($completedComponents / $totalComponents) * 100, 1)
  }
}

# Identify issues and recommendations
Write-Info "Identifying issues and recommendations..."

$issues = @()
$recommendations = @()

# Check for low completion rates
if ($readiness.Overall.Percentage -lt 20) {
  $issues += "Very low overall project completion rate ($($readiness.Overall.Percentage)%)"
  $recommendations += "Focus on completing critical tasks first"
}

if ($readiness.Tasks.Critical.Percentage -lt 50) {
  $issues += "Low critical task completion rate ($($readiness.Tasks.Critical.Percentage)%)"
  $recommendations += "Prioritize critical tasks to ensure project stability"
}

# Check component readiness
foreach ($component in $readiness.Components.GetEnumerator()) {
  if ($component.Key -ne "Overall" -and $component.Value.Percentage -lt 30) {
    $issues += "Low $($component.Key) component readiness ($($component.Value.Percentage)%)"
    $recommendations += "Focus on completing $($component.Key) components"
  }
}

$readiness.Issues = $issues
$readiness.Recommendations = $recommendations

# Display results
if (-not $Quiet) {
  Write-Host "`nProject Readiness Analysis:" -ForegroundColor Cyan

  Write-Host "`nOverall Progress:" -ForegroundColor Yellow
  Write-Host ("  Total Tasks: {0}" -f $readiness.Overall.Total)
  Write-Host ("  Completed: {0}" -f $readiness.Overall.Completed)
  Write-Host ("  Completion Rate: {0}%" -f $readiness.Overall.Percentage)

  Write-Host "`nTask Progress by Priority:" -ForegroundColor Yellow
  foreach ($priority in @('Critical', 'High', 'Medium', 'Low')) {
    $task = $readiness.Tasks.$priority
    if ($task.Total -gt 0) {
      Write-Host ("  {0}: {1}/{2} ({3}%)" -f $priority, $task.Completed, $task.Total, $task.Percentage)
    }
  }

  Write-Host "`nComponent Readiness:" -ForegroundColor Yellow
  foreach ($component in $readiness.Components.GetEnumerator()) {
    if ($component.Key -ne "Overall") {
      Write-Host ("  {0}: {1}/{2} ({3}%)" -f $component.Key, $component.Value.Completed, $component.Value.Total, $component.Value.Percentage)
    }
  }

  if ($readiness.Components.Overall) {
    Write-Host ("`nOverall Component Readiness: {0}%" -f $readiness.Components.Overall.Percentage) -ForegroundColor Green
  }

  if ($readiness.Issues.Count -gt 0) {
    Write-Host "`nIssues:" -ForegroundColor Red
    foreach ($issue in $readiness.Issues) {
      Write-Host ("  - {0}" -f $issue)
    }
  }

  if ($readiness.Recommendations.Count -gt 0) {
    Write-Host "`nRecommendations:" -ForegroundColor Green
    foreach ($rec in $readiness.Recommendations) {
      Write-Host ("  - {0}" -f $rec)
    }
  }
}

if ($Detailed) {
  Write-Host "`nDetailed Component Analysis:" -ForegroundColor Cyan

  foreach ($component in $readiness.Components.GetEnumerator()) {
    if ($component.Key -ne "Overall") {
      Write-Host "`n$($component.Key) Component:" -ForegroundColor Yellow
      Write-Host ("  Total Files: {0}" -f $component.Value.Total)
      Write-Host ("  Implemented: {0}" -f $component.Value.Completed)
      Write-Host ("  Readiness: {0}%" -f $component.Value.Percentage)
    }
  }
}

# Generate report if requested
if ($GenerateReport) {
  $dateStr = Get-Date -Format "yyyy-MM-dd"
  $reportPath = "docs/project-readiness-$dateStr.json"
  if (-not (Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" -Force | Out-Null
  }

  $readiness | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
  Write-Ok "Project readiness report saved to: $reportPath"
}

# Exit with appropriate code
if ($readiness.Issues.Count -gt 0) {
  exit 1
} else {
  exit 0
}
