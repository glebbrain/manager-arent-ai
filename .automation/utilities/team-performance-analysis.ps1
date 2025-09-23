# Universal Automation Platform - Team Performance Analysis Management
# Version: 2.2 - AI Enhanced

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("analyze", "report", "status", "config", "members")]
    [string]$Action = "analyze",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "team-analysis",
    
    [Parameter(Mandatory=$false)]
    [int]$AnalysisPeriod = 30,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("html", "json", "csv")]
    [string]$Format = "html",
    
    [Parameter(Mandatory=$false)]
    [string]$TeamMembers = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Team-Performance-Analysis"
$Version = "2.2.0"
$LogFile = "team-analysis.log"

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "DEBUG")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    if ($Verbose -or $Level -eq "ERROR") {
        Write-Host $logEntry
    }
    
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..." "INFO"
    
    $prerequisites = @{
        NodeJS = $false
        Git = $false
        AnalysisScript = $false
        GitRepo = $false
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.NodeJS = $true
            Write-Log "✅ Node.js found: $nodeVersion" "INFO"
        } else {
            Write-Log "❌ Node.js not found" "ERROR"
        }
    }
    catch {
        Write-Log "❌ Node.js not found" "ERROR"
    }
    
    # Check Git
    try {
        $gitVersion = git --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.Git = $true
            Write-Log "✅ Git found: $gitVersion" "INFO"
        } else {
            Write-Log "❌ Git not found" "ERROR"
        }
    }
    catch {
        Write-Log "❌ Git not found" "ERROR"
    }
    
    # Check analysis script
    if (Test-Path "scripts/team-performance-analysis.js") {
        $prerequisites.AnalysisScript = $true
        Write-Log "✅ Team analysis script found" "INFO"
    } else {
        Write-Log "❌ Team analysis script not found" "ERROR"
    }
    
    # Check if we're in a git repository
    try {
        $gitStatus = git status 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.GitRepo = $true
            Write-Log "✅ Git repository detected" "INFO"
        } else {
            Write-Log "❌ Not in a git repository" "ERROR"
        }
    }
    catch {
        Write-Log "❌ Not in a git repository" "ERROR"
    }
    
    return $prerequisites
}

# Run team performance analysis
function Start-TeamAnalysis {
    Write-Log "Starting team performance analysis..." "INFO"
    
    if (-not (Test-Prerequisites).NodeJS) {
        Write-Log "Cannot start analysis without Node.js" "ERROR"
        return $false
    }
    
    try {
        $processArgs = @(
            "scripts/team-performance-analysis.js",
            "analyze"
        )
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "node"
        $processInfo.Arguments = $processArgs -join " "
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.CreateNoWindow = $true
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        $process.WaitForExit()
        
        if ($process.ExitCode -eq 0) {
            Write-Log "Team analysis completed successfully" "INFO"
            return $true
        } else {
            Write-Log "Team analysis failed with exit code: $($process.ExitCode)" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Failed to run team analysis: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Generate team performance report
function Generate-TeamReport {
    Write-Log "Generating team performance report..." "INFO"
    
    try {
        $processArgs = @(
            "scripts/team-performance-analysis.js",
            "report"
        )
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "node"
        $processInfo.Arguments = $processArgs -join " "
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.CreateNoWindow = $true
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        $output = $process.StandardOutput.ReadToEnd()
        $process.WaitForExit()
        
        if ($process.ExitCode -eq 0) {
            # Save report to file
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $reportFile = "$OutputDir/team-report-$timestamp.html"
            
            if (-not (Test-Path $OutputDir)) {
                New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
            }
            
            $output | Set-Content $reportFile -Encoding UTF8
            Write-Log "Team report generated: $reportFile" "INFO"
            
            # Try to open the report
            try {
                Start-Process $reportFile
            }
            catch {
                Write-Log "Could not open report automatically: $($_.Exception.Message)" "WARN"
            }
            
            return $true
        } else {
            Write-Log "Failed to generate team report" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Failed to generate team report: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Get analysis status
function Get-TeamAnalysisStatus {
    Write-Log "Checking team analysis status..." "INFO"
    
    $status = @{
        OutputDir = $OutputDir
        AnalysisFiles = 0
        LatestAnalysis = $null
        TeamMembers = 0
    }
    
    try {
        # Check output directory
        if (Test-Path $OutputDir) {
            $analysisFiles = Get-ChildItem -Path $OutputDir -Filter "team-analysis-*.json" -ErrorAction SilentlyContinue
            $status.AnalysisFiles = $analysisFiles.Count
            
            if ($analysisFiles.Count -gt 0) {
                $latestFile = $analysisFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                $status.LatestAnalysis = $latestFile.LastWriteTime
                
                # Try to read team member count from latest analysis
                try {
                    $content = Get-Content $latestFile.FullName -Raw | ConvertFrom-Json
                    $status.TeamMembers = $content.teamData.Count
                }
                catch {
                    Write-Log "Could not read team member count from analysis file" "WARN"
                }
            }
        }
        
        # Display status
        Write-Host "`n👥 Team Analysis Status:" -ForegroundColor Cyan
        Write-Host "Output Directory: $($status.OutputDir)" -ForegroundColor Yellow
        Write-Host "Analysis Files: $($status.AnalysisFiles)" -ForegroundColor Yellow
        Write-Host "Latest Analysis: $($status.LatestAnalysis)" -ForegroundColor Yellow
        Write-Host "Team Members: $($status.TeamMembers)" -ForegroundColor Yellow
        
        return $status
    }
    catch {
        Write-Log "Failed to get analysis status: $($_.Exception.Message)" "ERROR"
        return $status
    }
}

# Configure team analysis
function Set-TeamAnalysisConfig {
    Write-Log "Configuring team analysis..." "INFO"
    
    try {
        $config = @{
            version = "2.2.0"
            outputDir = $OutputDir
            analysisPeriod = $AnalysisPeriod
            teamMembers = if ($TeamMembers) { $TeamMembers.Split(',') } else { @() }
            metrics = @{
                commits = $true
                codeReview = $true
                testing = $true
                documentation = $true
                collaboration = $true
                productivity = $true
            }
            gitRepoPath = (Get-Location).Path
        }
        
        $config | ConvertTo-Json -Depth 10 | Set-Content "team-analysis-config.json"
        Write-Log "Configuration saved to team-analysis-config.json" "INFO"
        
        Write-Host "`n📋 Team Analysis Configuration:" -ForegroundColor Cyan
        Write-Host "Output Directory: $($config.outputDir)" -ForegroundColor White
        Write-Host "Analysis Period: $($config.analysisPeriod) days" -ForegroundColor White
        Write-Host "Team Members: $($config.teamMembers.Count)" -ForegroundColor White
        Write-Host "Git Repository: $($config.gitRepoPath)" -ForegroundColor White
        Write-Host "Metrics Enabled:" -ForegroundColor White
        Write-Host "  Commits: $($config.metrics.commits)" -ForegroundColor White
        Write-Host "  Code Review: $($config.metrics.codeReview)" -ForegroundColor White
        Write-Host "  Testing: $($config.metrics.testing)" -ForegroundColor White
        Write-Host "  Documentation: $($config.metrics.documentation)" -ForegroundColor White
        Write-Host "  Collaboration: $($config.metrics.collaboration)" -ForegroundColor White
        Write-Host "  Productivity: $($config.metrics.productivity)" -ForegroundColor White
        
        return $true
    }
    catch {
        Write-Log "Failed to configure team analysis: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Show team members
function Show-TeamMembers {
    Write-Log "Detecting team members..." "INFO"
    
    try {
        # Get git contributors
        $contributors = git log --pretty=format:"%an|%ae" --since="1 year ago" | Sort-Object | Get-Unique
        
        if ($contributors.Count -eq 0) {
            Write-Host "No team members found in git history" -ForegroundColor Yellow
            return
        }
        
        Write-Host "`n👥 Team Members:" -ForegroundColor Cyan
        Write-Host "=" * 50 -ForegroundColor Cyan
        
        $memberCount = 0
        foreach ($contributor in $contributors) {
            if ($contributor.Trim()) {
                $memberCount++
                $parts = $contributor.Split('|')
                $name = $parts[0].Trim()
                $email = $parts[1].Trim()
                
                Write-Host "👤 $name" -ForegroundColor White
                Write-Host "   Email: $email" -ForegroundColor Gray
                Write-Host ""
            }
        }
        
        Write-Host "Total Team Members: $memberCount" -ForegroundColor Green
    }
    catch {
        Write-Log "Failed to detect team members: $($_.Exception.Message)" "ERROR"
    }
}

# Show available reports
function Show-AvailableReports {
    Write-Log "Showing available reports..." "INFO"
    
    if (-not (Test-Path $OutputDir)) {
        Write-Host "No reports directory found" -ForegroundColor Yellow
        return
    }
    
    $reports = Get-ChildItem -Path $OutputDir -Filter "*.html" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    
    if ($reports.Count -eq 0) {
        Write-Host "No reports found in $OutputDir" -ForegroundColor Yellow
        return
    }
    
    Write-Host "`n📊 Available Team Reports:" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    foreach ($report in $reports) {
        $size = [math]::Round($report.Length / 1KB, 2)
        Write-Host "📄 $($report.Name)" -ForegroundColor White
        Write-Host "   Size: ${size}KB" -ForegroundColor Gray
        Write-Host "   Created: $($report.CreationTime)" -ForegroundColor Gray
        Write-Host "   Modified: $($report.LastWriteTime)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "Total Reports: $($reports.Count)" -ForegroundColor Green
}

# Main execution
Write-Log "Starting $ScriptName v$Version" "INFO"

switch ($Action.ToLower()) {
    "analyze" {
        if (Start-TeamAnalysis) {
            Write-Host "✅ Team performance analysis completed successfully" -ForegroundColor Green
            Show-AvailableReports
        } else {
            Write-Host "❌ Failed to complete team performance analysis" -ForegroundColor Red
            exit 1
        }
    }
    "report" {
        if (Generate-TeamReport) {
            Write-Host "✅ Team performance report generated successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to generate team performance report" -ForegroundColor Red
            exit 1
        }
    }
    "status" {
        Get-TeamAnalysisStatus
        Show-AvailableReports
    }
    "config" {
        if (Set-TeamAnalysisConfig) {
            Write-Host "✅ Team analysis configuration saved successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to save team analysis configuration" -ForegroundColor Red
            exit 1
        }
    }
    "members" {
        Show-TeamMembers
    }
    default {
        Write-Host "Usage: .\team-performance-analysis.ps1 -Action [analyze|report|status|config|members]" -ForegroundColor Yellow
        Write-Host "`nAvailable actions:" -ForegroundColor Cyan
        Write-Host "  analyze - Run team performance analysis" -ForegroundColor White
        Write-Host "  report  - Generate team performance report" -ForegroundColor White
        Write-Host "  status  - Show analysis status and available reports" -ForegroundColor White
        Write-Host "  config  - Configure team analysis settings" -ForegroundColor White
        Write-Host "  members - Show detected team members" -ForegroundColor White
        Write-Host "`nExamples:" -ForegroundColor Cyan
        Write-Host "  .\team-performance-analysis.ps1 -Action analyze" -ForegroundColor White
        Write-Host "  .\team-performance-analysis.ps1 -Action report -Format html" -ForegroundColor White
        Write-Host "  .\team-performance-analysis.ps1 -Action status -Verbose" -ForegroundColor White
        Write-Host "  .\team-performance-analysis.ps1 -Action config -AnalysisPeriod 60" -ForegroundColor White
    }
}

Write-Log "Script execution completed" "INFO"
