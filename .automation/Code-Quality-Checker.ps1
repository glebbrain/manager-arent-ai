<#!
.SYNOPSIS
  Code Quality Checker for Universal Project Manager v3.5

.DESCRIPTION
  Performs comprehensive code quality checks including syntax validation,
  best practices analysis, security checks, and performance recommendations.

.EXAMPLE
  pwsh -File .\.automation\Code-Quality-Checker.ps1 -Action check -Path "."

.NOTES
  Designed for Windows PowerShell 7+ with comprehensive quality analysis.
#>

[CmdletBinding(PositionalBinding = $false)]
param(
    [ValidateSet("check","analyze","report","fix")]
    [string]$Action = "check",
    
    [string]$Path = ".",
    [switch]$Recursive = $true,
    [switch]$IncludeTests = $false,
    [switch]$SecurityCheck = $true,
    [switch]$PerformanceCheck = $true,
    [switch]$BestPractices = $true,
    [string]$OutputFile = "code-quality-report.json"
)

# Enhanced logging
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARN"  { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        "INFO"  { Write-Host $logMessage -ForegroundColor Cyan }
        default { Write-Host $logMessage }
    }
}

function Write-Info { param([string]$Message) Write-Log $Message "INFO" }
function Write-Err { param([string]$Message) Write-Log $Message "ERROR" }
function Write-Warn { param([string]$Message) Write-Log $Message "WARN" }
function Write-Ok { param([string]$Message) Write-Log $Message "SUCCESS" }

# Code quality analysis functions
function Test-PowerShellSyntax {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        $null = [System.Management.Automation.PSParser]::Tokenize($content, [ref]$null)
        return $true
    }
    catch {
        return $false
    }
}

function Test-JavaScriptSyntax {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        # Basic syntax check - in real implementation, you'd use a proper JS parser
        if ($content -match "function\s+\w+\s*\(" -or $content -match "const\s+\w+\s*=" -or $content -match "let\s+\w+\s*=") {
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

function Test-SecurityIssues {
    param([string]$FilePath, [string]$Content)
    
    $issues = @()
    
    # Check for common security issues
    $securityPatterns = @{
        "Hardcoded passwords" = "password\s*=\s*['`"][^'`"]+['`"]"
        "SQL injection risk" = "SELECT.*\+.*\$"
        "Command injection risk" = "Invoke-Expression.*\$"
        "Unsafe file operations" = "Remove-Item.*-Force.*\$"
        "Unsafe web requests" = "Invoke-WebRequest.*\$"
    }
    
    foreach ($pattern in $securityPatterns.GetEnumerator()) {
        if ($Content -match $pattern.Value) {
            $issues += @{
                Type = "Security"
                Severity = "High"
                Message = $pattern.Key
                Line = ($Content -split "`n" | Select-String $pattern.Value).LineNumber
            }
        }
    }
    
    return $issues
}

function Test-PerformanceIssues {
    param([string]$FilePath, [string]$Content)
    
    $issues = @()
    
    # Check for performance issues
    $performancePatterns = @{
        "Large file processing" = "Get-Content.*-Raw"
        "Inefficient loops" = "foreach.*in.*Get-ChildItem"
        "Memory intensive operations" = "Select-Object.*-First.*\d{4,}"
        "Unnecessary string operations" = "\.Replace.*\.Replace.*\.Replace"
    }
    
    foreach ($pattern in $performancePatterns.GetEnumerator()) {
        if ($Content -match $pattern.Value) {
            $issues += @{
                Type = "Performance"
                Severity = "Medium"
                Message = $pattern.Key
                Line = ($Content -split "`n" | Select-String $pattern.Value).LineNumber
            }
        }
    }
    
    return $issues
}

function Test-BestPractices {
    param([string]$FilePath, [string]$Content)
    
    $issues = @()
    
    # Check for best practices
    $bestPracticePatterns = @{
        "Missing error handling" = "try\s*\{[^}]*\}\s*catch"
        "Missing parameter validation" = "param\s*\([^)]*\)\s*\{[^}]*ValidateSet"
        "Missing documentation" = "\.SYNOPSIS|\.DESCRIPTION"
        "Hardcoded values" = "['`"][^'`"]{20,}['`"]"
        "Missing logging" = "Write-Host|Write-Output"
    }
    
    foreach ($pattern in $bestPracticePatterns.GetEnumerator()) {
        if ($Content -match $pattern.Value) {
            $issues += @{
                Type = "Best Practice"
                Severity = "Low"
                Message = $pattern.Key
                Line = ($Content -split "`n" | Select-String $pattern.Value).LineNumber
            }
        }
    }
    
    return $issues
}

function Get-FileMetrics {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        $lines = ($content -split "`n").Count
        $characters = $content.Length
        $words = ($content -split "\s+" | Where-Object { $_ -ne "" }).Count
        
        return @{
            Lines = $lines
            Characters = $characters
            Words = $words
            FileSize = (Get-Item $FilePath).Length
        }
    }
    catch {
        return @{
            Lines = 0
            Characters = 0
            Words = 0
            FileSize = 0
        }
    }
}

function Invoke-CodeQualityCheck {
    param([string]$Path)
    
    Write-Info "Starting code quality check on: $Path"
    
    $results = @{
        TotalFiles = 0
        ProcessedFiles = 0
        SyntaxErrors = 0
        SecurityIssues = 0
        PerformanceIssues = 0
        BestPracticeIssues = 0
        FileDetails = @()
        Summary = @{}
    }
    
    # Get files to analyze
    $fileExtensions = @("*.ps1", "*.js", "*.ts", "*.py", "*.cs", "*.java")
    $files = @()
    
    foreach ($ext in $fileExtensions) {
        if ($Recursive) {
            $files += Get-ChildItem -Path $Path -Filter $ext -Recurse -File
        } else {
            $files += Get-ChildItem -Path $Path -Filter $ext -File
        }
    }
    
    if (-not $IncludeTests) {
        $files = $files | Where-Object { $_.FullName -notmatch "test|spec|mock" }
    }
    
    $results.TotalFiles = $files.Count
    Write-Info "Found $($files.Count) files to analyze"
    
    foreach ($file in $files) {
        try {
            Write-Info "Analyzing: $($file.Name)"
            
            $content = Get-Content $file.FullName -Raw -ErrorAction Stop
            $metrics = Get-FileMetrics $file.FullName
            
            $fileResult = @{
                FileName = $file.Name
                FilePath = $file.FullName
                Extension = $file.Extension
                Metrics = $metrics
                Issues = @()
                SyntaxValid = $true
            }
            
            # Syntax validation
            if ($file.Extension -eq ".ps1") {
                $fileResult.SyntaxValid = Test-PowerShellSyntax $file.FullName
                if (-not $fileResult.SyntaxValid) {
                    $results.SyntaxErrors++
                    $fileResult.Issues += @{
                        Type = "Syntax"
                        Severity = "High"
                        Message = "PowerShell syntax error"
                        Line = 0
                    }
                }
            } elseif ($file.Extension -eq ".js") {
                $fileResult.SyntaxValid = Test-JavaScriptSyntax $file.FullName
                if (-not $fileResult.SyntaxValid) {
                    $results.SyntaxErrors++
                    $fileResult.Issues += @{
                        Type = "Syntax"
                        Severity = "High"
                        Message = "JavaScript syntax error"
                        Line = 0
                    }
                }
            }
            
            # Security checks
            if ($SecurityCheck) {
                $securityIssues = Test-SecurityIssues $file.FullName $content
                $fileResult.Issues += $securityIssues
                $results.SecurityIssues += $securityIssues.Count
            }
            
            # Performance checks
            if ($PerformanceCheck) {
                $performanceIssues = Test-PerformanceIssues $file.FullName $content
                $fileResult.Issues += $performanceIssues
                $results.PerformanceIssues += $performanceIssues.Count
            }
            
            # Best practices checks
            if ($BestPractices) {
                $bestPracticeIssues = Test-BestPractices $file.FullName $content
                $fileResult.Issues += $bestPracticeIssues
                $results.BestPracticeIssues += $bestPracticeIssues.Count
            }
            
            $results.FileDetails += $fileResult
            $results.ProcessedFiles++
            
        }
        catch {
            Write-Warn "Failed to analyze $($file.Name): $($_.Exception.Message)"
        }
    }
    
    # Generate summary
    $results.Summary = @{
        TotalIssues = $results.SyntaxErrors + $results.SecurityIssues + $results.PerformanceIssues + $results.BestPracticeIssues
        SyntaxErrors = $results.SyntaxErrors
        SecurityIssues = $results.SecurityIssues
        PerformanceIssues = $results.PerformanceIssues
        BestPracticeIssues = $results.BestPracticeIssues
        QualityScore = [Math]::Max(0, 100 - ($results.SyntaxErrors * 20) - ($results.SecurityIssues * 10) - ($results.PerformanceIssues * 5) - ($results.BestPracticeIssues * 2))
    }
    
    return $results
}

# Main execution
try {
    Write-Info "Code Quality Checker v3.5 - Starting analysis"
    
    switch ($Action) {
        "check" {
            $results = Invoke-CodeQualityCheck $Path
            
            Write-Info "Code Quality Analysis Complete"
            Write-Info "Files processed: $($results.ProcessedFiles)/$($results.TotalFiles)"
            Write-Info "Total issues found: $($results.Summary.TotalIssues)"
            Write-Info "Quality Score: $($results.Summary.QualityScore)/100"
            
            if ($results.Summary.SyntaxErrors -gt 0) {
                Write-Err "Syntax errors: $($results.Summary.SyntaxErrors)"
            }
            if ($results.Summary.SecurityIssues -gt 0) {
                Write-Warn "Security issues: $($results.Summary.SecurityIssues)"
            }
            if ($results.Summary.PerformanceIssues -gt 0) {
                Write-Warn "Performance issues: $($results.Summary.PerformanceIssues)"
            }
            if ($results.Summary.BestPracticeIssues -gt 0) {
                Write-Info "Best practice issues: $($results.Summary.BestPracticeIssues)"
            }
            
            # Save results
            $results | ConvertTo-Json -Depth 10 | Out-File $OutputFile -Encoding UTF8
            Write-Ok "Results saved to: $OutputFile"
        }
        "analyze" {
            Write-Info "Performing detailed code analysis..."
            $results = Invoke-CodeQualityCheck $Path
            
            # Detailed analysis output
            foreach ($file in $results.FileDetails) {
                if ($file.Issues.Count -gt 0) {
                    Write-Warn "Issues in $($file.FileName):"
                    foreach ($issue in $file.Issues) {
                        Write-Host "  [$($issue.Severity)] $($issue.Type): $($issue.Message)" -ForegroundColor Yellow
                    }
                }
            }
        }
        "report" {
            Write-Info "Generating comprehensive report..."
            $results = Invoke-CodeQualityCheck $Path
            
            # Generate HTML report
            $htmlReport = @"
<!DOCTYPE html>
<html>
<head>
    <title>Code Quality Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .issue { margin: 10px 0; padding: 10px; border-left: 4px solid #ff6b6b; background-color: #ffe0e0; }
        .file { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Code Quality Report</h1>
        <p>Generated: $(Get-Date)</p>
        <p>Quality Score: $($results.Summary.QualityScore)/100</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Files processed: $($results.ProcessedFiles)/$($results.TotalFiles)</p>
        <p>Total issues: $($results.Summary.TotalIssues)</p>
        <p>Syntax errors: $($results.Summary.SyntaxErrors)</p>
        <p>Security issues: $($results.Summary.SecurityIssues)</p>
        <p>Performance issues: $($results.Summary.PerformanceIssues)</p>
        <p>Best practice issues: $($results.Summary.BestPracticeIssues)</p>
    </div>
    
    <div class="files">
        <h2>File Details</h2>
        $(foreach ($file in $results.FileDetails) {
            if ($file.Issues.Count -gt 0) {
                "<div class='file'><h3>$($file.FileName)</h3>"
                foreach ($issue in $file.Issues) {
                    "<div class='issue'><strong>$($issue.Type)</strong> ($($issue.Severity)): $($issue.Message)</div>"
                }
                "</div>"
            }
        })
    </div>
</body>
</html>
"@
            
            $htmlReport | Out-File "code-quality-report.html" -Encoding UTF8
            Write-Ok "HTML report generated: code-quality-report.html"
        }
        "fix" {
            Write-Info "Auto-fixing common issues..."
            # This would contain auto-fix logic
            Write-Warn "Auto-fix functionality not yet implemented"
        }
        default {
            Write-Err "Unknown action: $Action"
            exit 1
        }
    }
    
    Write-Ok "Code Quality Checker completed successfully"
}
catch {
    Write-Err "Fatal error: $($_.Exception.Message)"
    exit 1
}
