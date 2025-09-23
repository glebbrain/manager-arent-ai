# Universal Automation Platform - Code Quality Analysis Management
# Version: 2.2 - AI Enhanced

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("analyze", "report", "status", "config", "fix")]
    [string]$Action = "analyze",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "code-quality-analysis",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("html", "json", "csv")]
    [string]$Format = "html",
    
    [Parameter(Mandatory=$false)]
    [string]$Languages = "javascript,typescript,python,java",
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoFix,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Code-Quality-Analysis"
$Version = "2.2.0"
$LogFile = "code-quality-analysis.log"

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
        AnalysisScript = $false
        ProjectPath = $false
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
    
    # Check analysis script
    if (Test-Path "scripts/code-quality-analysis.js") {
        $prerequisites.AnalysisScript = $true
        Write-Log "✅ Code quality analysis script found" "INFO"
    } else {
        Write-Log "❌ Code quality analysis script not found" "ERROR"
    }
    
    # Check project path
    if (Test-Path $ProjectPath) {
        $prerequisites.ProjectPath = $true
        Write-Log "✅ Project path exists: $ProjectPath" "INFO"
    } else {
        Write-Log "❌ Project path not found: $ProjectPath" "ERROR"
    }
    
    # Check if we're in a git repository
    try {
        $gitStatus = git status 2>$null
        if ($LASTEXITCODE -eq 0) {
            $prerequisites.GitRepo = $true
            Write-Log "✅ Git repository detected" "INFO"
        } else {
            Write-Log "⚠️ Not in a git repository" "WARN"
        }
    }
    catch {
        Write-Log "⚠️ Not in a git repository" "WARN"
    }
    
    return $prerequisites
}

# Run code quality analysis
function Start-CodeQualityAnalysis {
    Write-Log "Starting code quality analysis..." "INFO"
    
    if (-not (Test-Prerequisites).NodeJS) {
        Write-Log "Cannot start analysis without Node.js" "ERROR"
        return $false
    }
    
    try {
        $processArgs = @(
            "scripts/code-quality-analysis.js",
            "analyze"
        )
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "node"
        $processInfo.Arguments = $processArgs -join " "
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.CreateNoWindow = $true
        $processInfo.WorkingDirectory = $ProjectPath
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        $process.WaitForExit()
        
        if ($process.ExitCode -eq 0) {
            Write-Log "Code quality analysis completed successfully" "INFO"
            return $true
        } else {
            Write-Log "Code quality analysis failed with exit code: $($process.ExitCode)" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Failed to run code quality analysis: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Generate code quality report
function Generate-CodeQualityReport {
    Write-Log "Generating code quality report..." "INFO"
    
    try {
        $processArgs = @(
            "scripts/code-quality-analysis.js",
            "report"
        )
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "node"
        $processInfo.Arguments = $processArgs -join " "
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.CreateNoWindow = $true
        $processInfo.WorkingDirectory = $ProjectPath
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        $output = $process.StandardOutput.ReadToEnd()
        $process.WaitForExit()
        
        if ($process.ExitCode -eq 0) {
            # Save report to file
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $reportFile = "$OutputDir/code-quality-report-$timestamp.html"
            
            if (-not (Test-Path $OutputDir)) {
                New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
            }
            
            $output | Set-Content $reportFile -Encoding UTF8
            Write-Log "Code quality report generated: $reportFile" "INFO"
            
            # Try to open the report
            try {
                Start-Process $reportFile
            }
            catch {
                Write-Log "Could not open report automatically: $($_.Exception.Message)" "WARN"
            }
            
            return $true
        } else {
            Write-Log "Failed to generate code quality report" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Failed to generate code quality report: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Get analysis status
function Get-CodeQualityStatus {
    Write-Log "Checking code quality analysis status..." "INFO"
    
    $status = @{
        OutputDir = $OutputDir
        AnalysisFiles = 0
        LatestAnalysis = $null
        QualityScore = 0
        Issues = 0
    }
    
    try {
        # Check output directory
        if (Test-Path $OutputDir) {
            $analysisFiles = Get-ChildItem -Path $OutputDir -Filter "code-quality-analysis-*.json" -ErrorAction SilentlyContinue
            $status.AnalysisFiles = $analysisFiles.Count
            
            if ($analysisFiles.Count -gt 0) {
                $latestFile = $analysisFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                $status.LatestAnalysis = $latestFile.LastWriteTime
                
                # Try to read quality score from latest analysis
                try {
                    $content = Get-Content $latestFile.FullName -Raw | ConvertFrom-Json
                    $status.QualityScore = $content.qualityScore || 0
                    $status.Issues = $content.issues?.Count || 0
                }
                catch {
                    Write-Log "Could not read quality score from analysis file" "WARN"
                }
            }
        }
        
        # Display status
        Write-Host "`n🔍 Code Quality Analysis Status:" -ForegroundColor Cyan
        Write-Host "Output Directory: $($status.OutputDir)" -ForegroundColor Yellow
        Write-Host "Analysis Files: $($status.AnalysisFiles)" -ForegroundColor Yellow
        Write-Host "Latest Analysis: $($status.LatestAnalysis)" -ForegroundColor Yellow
        Write-Host "Quality Score: $($status.QualityScore)%" -ForegroundColor $(if ($status.QualityScore -ge 80) { "Green" } elseif ($status.QualityScore -ge 60) { "Yellow" } else { "Red" })
        Write-Host "Issues Found: $($status.Issues)" -ForegroundColor $(if ($status.Issues -eq 0) { "Green" } else { "Red" })
        
        return $status
    }
    catch {
        Write-Log "Failed to get analysis status: $($_.Exception.Message)" "ERROR"
        return $status
    }
}

# Configure code quality analysis
function Set-CodeQualityConfig {
    Write-Log "Configuring code quality analysis..." "INFO"
    
    try {
        $config = @{
            version = "2.2.0"
            outputDir = $OutputDir
            projectPath = $ProjectPath
            languages = $Languages.Split(',')
            tools = @{
                eslint = $true
                prettier = $true
                sonarjs = $true
                complexity = $true
                security = $true
                performance = $true
                maintainability = $true
            }
            thresholds = @{
                complexity = 10
                maintainability = 70
                security = 80
                performance = 80
                coverage = 80
            }
        }
        
        $config | ConvertTo-Json -Depth 10 | Set-Content "code-quality-config.json"
        Write-Log "Configuration saved to code-quality-config.json" "INFO"
        
        Write-Host "`n📋 Code Quality Analysis Configuration:" -ForegroundColor Cyan
        Write-Host "Output Directory: $($config.outputDir)" -ForegroundColor White
        Write-Host "Project Path: $($config.projectPath)" -ForegroundColor White
        Write-Host "Languages: $($config.languages -join ', ')" -ForegroundColor White
        Write-Host "Tools Enabled:" -ForegroundColor White
        Write-Host "  ESLint: $($config.tools.eslint)" -ForegroundColor White
        Write-Host "  Prettier: $($config.tools.prettier)" -ForegroundColor White
        Write-Host "  SonarJS: $($config.tools.sonarjs)" -ForegroundColor White
        Write-Host "  Complexity: $($config.tools.complexity)" -ForegroundColor White
        Write-Host "  Security: $($config.tools.security)" -ForegroundColor White
        Write-Host "  Performance: $($config.tools.performance)" -ForegroundColor White
        Write-Host "  Maintainability: $($config.tools.maintainability)" -ForegroundColor White
        
        return $true
    }
    catch {
        Write-Log "Failed to configure code quality analysis: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Auto-fix code quality issues
function Start-CodeQualityFix {
    Write-Log "Starting code quality auto-fix..." "INFO"
    
    try {
        # Check if we have analysis results
        $analysisFiles = Get-ChildItem -Path $OutputDir -Filter "code-quality-analysis-*.json" -ErrorAction SilentlyContinue
        if ($analysisFiles.Count -eq 0) {
            Write-Log "No analysis results found. Run analysis first." "ERROR"
            return $false
        }
        
        $latestFile = $analysisFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $content = Get-Content $latestFile.FullName -Raw | ConvertFrom-Json
        
        # Apply auto-fixes based on issues
        $fixesApplied = 0
        
        foreach ($issue in $content.issues) {
            if ($issue.type -eq "style" -and $issue.severity -eq "low") {
                # Apply style fixes
                if (Test-Path "package.json") {
                    # Try to run prettier
                    try {
                        $result = & "npx" "prettier" "--write" $issue.file 2>$null
                        if ($LASTEXITCODE -eq 0) {
                            $fixesApplied++
                            Write-Log "Fixed style issue in $($issue.file)" "INFO"
                        }
                    }
                    catch {
                        Write-Log "Could not fix style issue in $($issue.file)" "WARN"
                    }
                }
            }
        }
        
        Write-Log "Applied $fixesApplied fixes" "INFO"
        Write-Host "🔧 Applied $fixesApplied auto-fixes" -ForegroundColor Green
        
        return $true
    }
    catch {
        Write-Log "Failed to apply auto-fixes: $($_.Exception.Message)" "ERROR"
        return $false
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
    
    Write-Host "`n📊 Available Code Quality Reports:" -ForegroundColor Cyan
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

# Install code quality tools
function Install-CodeQualityTools {
    Write-Log "Installing code quality tools..." "INFO"
    
    try {
        if (Test-Path "package.json") {
            # Install ESLint
            Write-Log "Installing ESLint..." "INFO"
            $result = & "npm" "install" "--save-dev" "eslint" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ ESLint installed" "INFO"
            }
            
            # Install Prettier
            Write-Log "Installing Prettier..." "INFO"
            $result = & "npm" "install" "--save-dev" "prettier" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ Prettier installed" "INFO"
            }
            
            # Install SonarJS
            Write-Log "Installing SonarJS..." "INFO"
            $result = & "npm" "install" "--save-dev" "eslint-plugin-sonarjs" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ SonarJS installed" "INFO"
            }
            
            Write-Host "✅ Code quality tools installed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Log "No package.json found. Cannot install tools." "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Failed to install code quality tools: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Main execution
Write-Log "Starting $ScriptName v$Version" "INFO"

switch ($Action.ToLower()) {
    "analyze" {
        if (Start-CodeQualityAnalysis) {
            Write-Host "✅ Code quality analysis completed successfully" -ForegroundColor Green
            Show-AvailableReports
        } else {
            Write-Host "❌ Failed to complete code quality analysis" -ForegroundColor Red
            exit 1
        }
    }
    "report" {
        if (Generate-CodeQualityReport) {
            Write-Host "✅ Code quality report generated successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to generate code quality report" -ForegroundColor Red
            exit 1
        }
    }
    "status" {
        Get-CodeQualityStatus
        Show-AvailableReports
    }
    "config" {
        if (Set-CodeQualityConfig) {
            Write-Host "✅ Code quality analysis configuration saved successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to save code quality analysis configuration" -ForegroundColor Red
            exit 1
        }
    }
    "fix" {
        if (Start-CodeQualityFix) {
            Write-Host "✅ Code quality auto-fix completed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to complete code quality auto-fix" -ForegroundColor Red
            exit 1
        }
    }
    "install" {
        if (Install-CodeQualityTools) {
            Write-Host "✅ Code quality tools installed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install code quality tools" -ForegroundColor Red
            exit 1
        }
    }
    default {
        Write-Host "Usage: .\code-quality-analysis.ps1 -Action [analyze|report|status|config|fix|install]" -ForegroundColor Yellow
        Write-Host "`nAvailable actions:" -ForegroundColor Cyan
        Write-Host "  analyze - Run code quality analysis" -ForegroundColor White
        Write-Host "  report  - Generate code quality report" -ForegroundColor White
        Write-Host "  status  - Show analysis status and available reports" -ForegroundColor White
        Write-Host "  config  - Configure code quality analysis settings" -ForegroundColor White
        Write-Host "  fix     - Apply auto-fixes for code quality issues" -ForegroundColor White
        Write-Host "  install - Install code quality tools" -ForegroundColor White
        Write-Host "`nExamples:" -ForegroundColor Cyan
        Write-Host "  .\code-quality-analysis.ps1 -Action analyze" -ForegroundColor White
        Write-Host "  .\code-quality-analysis.ps1 -Action report -Format html" -ForegroundColor White
        Write-Host "  .\code-quality-analysis.ps1 -Action status -Verbose" -ForegroundColor White
        Write-Host "  .\code-quality-analysis.ps1 -Action config -Languages 'javascript,typescript'" -ForegroundColor White
        Write-Host "  .\code-quality-analysis.ps1 -Action fix -AutoFix" -ForegroundColor White
    }
}

Write-Log "Script execution completed" "INFO"
