param(
    [switch]$Quiet,
    [switch]$IncludeCharts,
    [string]$OutputFormat = "html",
    [switch]$IncludeAdvancedSystems,
    [switch]$IncludeInfrastructure
)

$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
    Time = "Gray"
}

function Write-Status {
    param($Message, $Status = "Info", $NoNewline = $false)
    if (-not $Quiet) {
        $color = $Colors[$Status]
        $timestamp = Get-Date -Format "HH:mm:ss"
        $prefix = "[$timestamp]"
        if ($NoNewline) {
            Write-Host "$prefix $Message" -ForegroundColor $color -NoNewline
        } else {
            Write-Host "$prefix $Message" -ForegroundColor $color
        }
    }
}

function Write-Info($msg) { Write-Status $msg "Info" }
function Write-Ok($msg)   { Write-Status $msg "Success" }
function Write-Warn($msg) { Write-Status $msg "Warning" }
function Write-Err($msg)  { Write-Status $msg "Error" }

Write-Info "📊 Generating Comprehensive CyberSyn Project Report"
Write-Info "=================================================="

# Create reports directory if it doesn't exist
if (-not (Test-Path "docs")) {
  New-Item -ItemType Directory -Path "docs" -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportDir = "docs/reports/$timestamp"
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null

# Run all analysis scripts and collect results
Write-Info "Running comprehensive analysis..."

$analyses = @{}

# Project Status
Write-Info "Collecting project status..."
try {
  $statusOutput = & .\.automation\project-management\Check-ProjectStatus.ps1 -Quiet 2>&1
  $analyses.ProjectStatus = @{
    Success = $LASTEXITCODE -eq 0
    Output = $statusOutput
  }
} catch {
  $analyses.ProjectStatus = @{
    Success = $false
    Error = $_.Exception.Message
  }
}

# TODO Priorities
Write-Info "Collecting TODO priorities..."
try {
  $todoOutput = & .\.automation\project-management\Check-TodoPriorities.ps1 -Quiet 2>&1
  $analyses.TodoPriorities = @{
    Success = $LASTEXITCODE -eq 0
    Output = $todoOutput
  }
} catch {
  $analyses.TodoPriorities = @{
    Success = $false
    Error = $_.Exception.Message
  }
}

# Test Status
Write-Info "Collecting test status..."
try {
  $testOutput = & .\.automation\project-management\Check-TestStatus.ps1 -Quiet 2>&1
  $analyses.TestStatus = @{
    Success = $LASTEXITCODE -eq 0
    Output = $testOutput
  }
} catch {
  $analyses.TestStatus = @{
    Success = $false
    Error = $_.Exception.Message
  }
}

# Architecture Analysis
Write-Info "Collecting architecture analysis..."
try {
  $archOutput = & .\.automation\project-management\Analyze-Architecture.ps1 -Quiet -GenerateReport 2>&1
  $analyses.Architecture = @{
    Success = $LASTEXITCODE -eq 0
    Output = $archOutput
  }
} catch {
  $analyses.Architecture = @{
    Success = $false
    Error = $_.Exception.Message
  }
}

# Performance Analysis
Write-Info "Collecting performance analysis..."
try {
  $perfOutput = & .\.automation\project-management\Analyze-Performance.ps1 -Quiet -GenerateReport 2>&1
  $analyses.Performance = @{
    Success = $LASTEXITCODE -eq 0
    Output = $perfOutput
  }
} catch {
  $analyses.Performance = @{
    Success = $false
    Error = $_.Exception.Message
  }
}

# Security Analysis
Write-Info "Collecting security analysis..."
try {
  $secOutput = & .\.automation\project-management\Analyze-Security.ps1 -Quiet -GenerateReport 2>&1
  $analyses.Security = @{
    Success = $LASTEXITCODE -eq 0
    Output = $secOutput
  }
} catch {
  $analyses.Security = @{
    Success = $false
    Error = $_.Exception.Message
  }
}

# Collect project information
Write-Info "Collecting project information..."

$projectInfo = @{
  Name = "CyberSyn"
  Description = "Unified Growth & Operations Intelligence"
  Version = "2.0"
  GeneratedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  ReportId = $timestamp
}

# Read IDEA.md for project details
if (Test-Path ".manager/IDEA.md") {
  $ideaContent = Get-Content ".manager/IDEA.md" -Raw
  $projectInfo.ProjectType = "Analytics Web Application"
  $projectInfo.TechnologyStack = "Next.js, Python, PostgreSQL, ClickHouse"
}

# Read TODO.md for task summary
if (Test-Path ".manager/TODO.md") {
  $todoContent = Get-Content ".manager/TODO.md"
  $criticalTasks = ($todoContent | Select-String "🔴|CRITICAL").Count
  $highTasks = ($todoContent | Select-String "🟠|HIGH").Count
  $mediumTasks = ($todoContent | Select-String "🟡|MEDIUM").Count
  $lowTasks = ($todoContent | Select-String "🔵|LOW").Count

  $projectInfo.TaskSummary = @{
    Critical = $criticalTasks
    High = $highTasks
    Medium = $mediumTasks
    Low = $lowTasks
    Total = $criticalTasks + $highTasks + $mediumTasks + $lowTasks
  }
}

# Generate summary statistics
$summary = @{
  TotalAnalyses = $analyses.Count
  SuccessfulAnalyses = ($analyses.Values | Where-Object { $_.Success }).Count
  FailedAnalyses = ($analyses.Values | Where-Object { -not $_.Success }).Count
  OverallHealth = if (($analyses.Values | Where-Object { $_.Success }).Count -eq $analyses.Count) { "Excellent" }
                  elseif (($analyses.Values | Where-Object { $_.Success }).Count -gt ($analyses.Count / 2)) { "Good" }
                  else { "Needs Attention" }
}

# Generate HTML report
if ($OutputFormat -eq "html") {
  Write-Info "Generating HTML report..."

  $htmlContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CyberSyn Project Report - $timestamp</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .status-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
        .status-card.success { border-left: 4px solid #28a745; }
        .status-card.error { border-left: 4px solid #dc3545; }
        .status-card h3 { margin: 0 0 10px 0; color: #333; }
        .status-card .status { font-weight: bold; }
        .status-card.success .status { color: #28a745; }
        .status-card.error .status { color: #dc3545; }
        .summary { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .summary h3 { margin: 0 0 15px 0; color: #1976d2; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .summary-item { text-align: center; }
        .summary-item .number { font-size: 2em; font-weight: bold; color: #1976d2; }
        .summary-item .label { color: #666; font-size: 0.9em; }
        .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #666; }
        .code { background: #f4f4f4; border-radius: 4px; padding: 15px; font-family: 'Courier New', monospace; white-space: pre-wrap; overflow-x: auto; }
        .health-excellent { color: #28a745; }
        .health-good { color: #ffc107; }
        .health-needs-attention { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 CyberSyn Project Report</h1>
            <p>Generated on $($projectInfo.GeneratedAt) | Report ID: $($projectInfo.ReportId)</p>
        </div>

        <div class="content">
            <div class="section">
                <h2>📊 Project Summary</h2>
                <div class="summary">
                    <h3>Project Overview</h3>
                    <p><strong>Name:</strong> $($projectInfo.Name)</p>
                    <p><strong>Description:</strong> $($projectInfo.Description)</p>
                    <p><strong>Version:</strong> $($projectInfo.Version)</p>
                    <p><strong>Type:</strong> $($projectInfo.ProjectType)</p>
                    <p><strong>Technology Stack:</strong> $($projectInfo.TechnologyStack)</p>
                </div>

                <div class="summary">
                    <h3>Overall Health: <span class="health-$($summary.OverallHealth.ToLower().Replace(' ', '-'))">$($summary.OverallHealth)</span></h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="number">$($summary.SuccessfulAnalyses)</div>
                            <div class="label">Successful Analyses</div>
                        </div>
                        <div class="summary-item">
                            <div class="number">$($summary.FailedAnalyses)</div>
                            <div class="label">Failed Analyses</div>
                        </div>
                        <div class="summary-item">
                            <div class="number">$($summary.TotalAnalyses)</div>
                            <div class="label">Total Analyses</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📋 Task Summary</h2>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="number" style="color: #dc3545;">$($projectInfo.TaskSummary.Critical)</div>
                        <div class="label">Critical Tasks</div>
                    </div>
                    <div class="summary-item">
                        <div class="number" style="color: #fd7e14;">$($projectInfo.TaskSummary.High)</div>
                        <div class="label">High Priority</div>
                    </div>
                    <div class="summary-item">
                        <div class="number" style="color: #ffc107;">$($projectInfo.TaskSummary.Medium)</div>
                        <div class="label">Medium Priority</div>
                    </div>
                    <div class="summary-item">
                        <div class="number" style="color: #20c997;">$($projectInfo.TaskSummary.Low)</div>
                        <div class="label">Low Priority</div>
                    </div>
                    <div class="summary-item">
                        <div class="number" style="color: #6f42c1;">$($projectInfo.TaskSummary.Total)</div>
                        <div class="label">Total Tasks</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🔍 Analysis Results</h2>
                <div class="status-grid">
"@

  foreach ($analysis in $analyses.GetEnumerator()) {
    $statusClass = if ($analysis.Value.Success) { "success" } else { "error" }
    $statusText = if ($analysis.Value.Success) { "✅ Success" } else { "❌ Failed" }

    $htmlContent += @"
                    <div class="status-card $statusClass">
                        <h3>$($analysis.Key)</h3>
                        <div class="status">$statusText</div>
                        <div class="code">$($analysis.Value.Output -join "`n")</div>
                    </div>
"@
  }

  $htmlContent += @"
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Report generated by CyberSyn Project Management System</p>
            <p>For questions or issues, please refer to the project documentation</p>
        </div>
    </div>
</body>
</html>
"@

  $htmlPath = "$reportDir/comprehensive-report.html"
  $htmlContent | Out-File -FilePath $htmlPath -Encoding UTF8
  Write-Ok "HTML report generated: $htmlPath"
}

# Generate JSON report
Write-Info "Generating JSON report..."
$jsonReport = @{
  ProjectInfo = $projectInfo
  Summary = $summary
  Analyses = $analyses
  GeneratedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

$jsonPath = "$reportDir/comprehensive-report.json"
$jsonReport | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonPath -Encoding UTF8
Write-Ok "JSON report generated: $jsonPath"

# Generate Markdown report
Write-Info "Generating Markdown report..."
$markdownContent = @"
# 🚀 CyberSyn Project Report

**Generated:** $($projectInfo.GeneratedAt)
**Report ID:** $($projectInfo.ReportId)

## 📊 Project Summary

- **Name:** $($projectInfo.Name)
- **Description:** $($projectInfo.Description)
- **Version:** $($projectInfo.Version)
- **Type:** $($projectInfo.ProjectType)
- **Technology Stack:** $($projectInfo.TechnologyStack)

## 🏥 Overall Health: $($summary.OverallHealth)

- **Successful Analyses:** $($summary.SuccessfulAnalyses)
- **Failed Analyses:** $($summary.FailedAnalyses)
- **Total Analyses:** $($summary.TotalAnalyses)

## 📋 Task Summary

- **Critical Tasks:** $($projectInfo.TaskSummary.Critical)
- **High Priority:** $($projectInfo.TaskSummary.High)
- **Medium Priority:** $($projectInfo.TaskSummary.Medium)
- **Low Priority:** $($projectInfo.TaskSummary.Low)
- **Total Tasks:** $($projectInfo.TaskSummary.Total)

## 🔍 Analysis Results

"@

foreach ($analysis in $analyses.GetEnumerator()) {
  $status = if ($analysis.Value.Success) { "✅ Success" } else { "❌ Failed" }
  $markdownContent += @"

### $($analysis.Key)

**Status:** $status

``````
$($analysis.Value.Output -join "`n")
``````
"@
}

$markdownPath = "$reportDir/comprehensive-report.md"
$markdownContent | Out-File -FilePath $markdownPath -Encoding UTF8
Write-Ok "Markdown report generated: $markdownPath"

# Create index file
$indexContent = @"
# CyberSyn Project Reports

## Latest Report: $timestamp

- [HTML Report](comprehensive-report.html)
- [JSON Report](comprehensive-report.json)
- [Markdown Report](comprehensive-report.md)

## Report Summary

- **Overall Health:** $($summary.OverallHealth)
- **Successful Analyses:** $($summary.SuccessfulAnalyses)/$($summary.TotalAnalyses)
- **Generated:** $($projectInfo.GeneratedAt)

## Quick Actions

- View HTML report in browser
- Import JSON report for further analysis
- Use Markdown report for documentation
"@

$indexPath = "$reportDir/README.md"
$indexContent | Out-File -FilePath $indexPath -Encoding UTF8

# Create latest symlink
$latestPath = "docs/reports/latest"
if (Test-Path $latestPath) {
  Remove-Item $latestPath -Force
}
New-Item -ItemType SymbolicLink -Path $latestPath -Target $reportDir | Out-Null

Write-Ok "Comprehensive report generated successfully!"
Write-Ok "Report location: $reportDir"
Write-Ok "Latest report: $latestPath"

if (-not $Quiet) {
  Write-Host "`n📊 Report Summary:" -ForegroundColor Cyan
  Write-Host ("  Overall Health: {0}" -f $summary.OverallHealth)
  Write-Host ("  Successful Analyses: {0}/{1}" -f $summary.SuccessfulAnalyses, $summary.TotalAnalyses)
  Write-Host ("  Report Location: {0}" -f $reportDir)
}

exit 0
