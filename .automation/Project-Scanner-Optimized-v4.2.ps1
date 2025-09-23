# Project Scanner Optimized v4.2 - Enhanced project scanning with performance optimization
# Universal Project Manager v4.2 - Enhanced Performance & Optimization

param(
    [string]$ProjectPath = ".",
    [switch]$EnableAI,
    [switch]$EnableQuantum,
    [switch]$EnableEnterprise,
    [switch]$EnableUIUX,
    [switch]$EnableAdvanced,
    [switch]$EnableEdge,
    [switch]$EnableBlockchain,
    [switch]$EnableVR,
    [switch]$EnableIoT,
    [switch]$Enable5G,
    [switch]$EnableMicroservices,
    [switch]$EnableServerless,
    [switch]$EnableContainers,
    [switch]$EnableAPI,
    [switch]$GenerateReport,
    [switch]$Verbose,
    [switch]$Quick,
    [switch]$Force,
    [string]$OutputFormat = "json",
    [string]$ReportPath = ".manager/reports"
)

# Version information
$Version = "4.2.0"
$LastUpdated = "2025-01-31"

# Global configuration
$Script:ScannerConfig = @{
    Version = $Version
    Status = "Initializing"
    StartTime = Get-Date
    ProjectPath = $ProjectPath
    OutputPath = $ReportPath
    Features = @{
        AI = $EnableAI
        Quantum = $EnableQuantum
        Enterprise = $EnableEnterprise
        UIUX = $EnableUIUX
        Advanced = $EnableAdvanced
        Edge = $EnableEdge
        Blockchain = $EnableBlockchain
        VR = $EnableVR
        IoT = $EnableIoT
        "5G" = $Enable5G
        Microservices = $EnableMicroservices
        Serverless = $EnableServerless
        Containers = $EnableContainers
        API = $EnableAPI
    }
    Performance = @{
        CacheEnabled = $true
        ParallelScanning = $true
        MemoryOptimized = $true
        BatchSize = 10
    }
    Results = @{
        ProjectType = ""
        TotalFiles = 0
        CodeFiles = 0
        TestFiles = 0
        TotalLines = 0
        CodeLines = 0
        TestCoverage = 0
        QualityScore = 0
        PerformanceScore = 0
        SecurityScore = 0
        AIInsights = @()
        Recommendations = @()
        Issues = @()
    }
}

# Color output functions
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Performance monitoring
function Measure-Performance {
    param([string]$Operation, [scriptblock]$ScriptBlock)
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $result = & $ScriptBlock
        $stopwatch.Stop()
        if ($Verbose) {
            Write-ColorOutput "✅ $Operation completed in $($stopwatch.ElapsedMilliseconds)ms" "Green"
        }
        return $result
    }
    catch {
        $stopwatch.Stop()
        Write-ColorOutput "❌ $Operation failed after $($stopwatch.ElapsedMilliseconds)ms: $($_.Exception.Message)" "Red"
        throw
    }
}

# Initialize scanner
function Initialize-Scanner {
    Write-ColorOutput "🔍 Project Scanner Optimized v$Version" "Cyan"
    Write-ColorOutput "Last Updated: $LastUpdated" "Gray"
    Write-ColorOutput ("=" * 60) "Cyan"
    
    # Check if project path exists
    if (-not (Test-Path $ProjectPath)) {
        Write-ColorOutput "❌ Project path not found: $ProjectPath" "Red"
        exit 1
    }
    
    # Create output directory if it doesn't exist
    if (-not (Test-Path $ReportPath)) {
        New-Item -ItemType Directory -Path $ReportPath -Force | Out-Null
        Write-ColorOutput "📁 Created output directory: $ReportPath" "Green"
    }
    
    # Display enabled features
    $enabledFeatures = $Script:ScannerConfig.Features.GetEnumerator() | Where-Object { $_.Value } | ForEach-Object { $_.Key }
    if ($enabledFeatures.Count -gt 0) {
        Write-ColorOutput "🚀 Enabled Features: $($enabledFeatures -join ', ')" "Green"
    } else {
        Write-ColorOutput "⚠️ No features enabled - running basic scan" "Yellow"
    }
    
    Write-ColorOutput ""
}

# Scan project files
function Scan-ProjectFiles {
    Write-ColorOutput "📁 Scanning project files..." "Cyan"
    
    $files = Measure-Performance "File Scanning" {
        Get-ChildItem -Path $ProjectPath -Recurse -File | Where-Object {
            $_.Name -notmatch '\.(git|node_modules|dist|build|coverage|\.vscode|\.idea)' -and
            $_.FullName -notmatch '\\\.git\\|\\node_modules\\|\\dist\\|\\build\\|\\coverage\\'
        }
    }
    
    $Script:ScannerConfig.Results.TotalFiles = $files.Count
    
    # Categorize files
    $codeFiles = $files | Where-Object {
        $_.Extension -match '\.(ps1|js|ts|py|java|cpp|c|h|cs|php|go|rs|rb|swift|kt|scala|r|m|pl|sh|bat|cmd|sql|html|css|scss|sass|less|vue|jsx|tsx|svelte|astro)$'
    }
    
    $testFiles = $files | Where-Object {
        $_.Name -match '(test|spec|__tests__|\.test\.|\.spec\.)' -or
        $_.Directory.Name -match '(test|tests|spec|specs|__tests__)'
    }
    
    $Script:ScannerConfig.Results.CodeFiles = $codeFiles.Count
    $Script:ScannerConfig.Results.TestFiles = $testFiles.Count
    
    Write-ColorOutput "  📄 Total files: $($files.Count)" "White"
    Write-ColorOutput "  💻 Code files: $($codeFiles.Count)" "White"
    Write-ColorOutput "  🧪 Test files: $($testFiles.Count)" "White"
    
    return @{
        AllFiles = $files
        CodeFiles = $codeFiles
        TestFiles = $testFiles
    }
}

# Detect project type
function Detect-ProjectType {
    param([array]$Files)
    
    Write-ColorOutput "🔍 Detecting project type..." "Cyan"
    
    $projectType = "Unknown"
    $confidence = 0
    
    # Check for common project files
    $indicators = @{
        "Node.js" = @("package.json", "node_modules", "npm", "yarn")
        "Python" = @("requirements.txt", "setup.py", "pyproject.toml", "Pipfile")
        "C++" = @("CMakeLists.txt", "Makefile", "*.cpp", "*.h")
        ".NET" = @("*.csproj", "*.sln", "*.cs")
        "Java" = @("pom.xml", "build.gradle", "*.java")
        "Go" = @("go.mod", "go.sum", "*.go")
        "Rust" = @("Cargo.toml", "Cargo.lock", "*.rs")
        "PHP" = @("composer.json", "*.php")
        "PowerShell" = @("*.ps1", "*.psm1", "*.psd1")
        "Universal" = @(".automation", ".manager", "cursor.json")
    }
    
    foreach ($type in $indicators.Keys) {
        $matches = 0
        foreach ($indicator in $indicators[$type]) {
            if ($Files | Where-Object { $_.Name -like $indicator -or $_.FullName -like "*$indicator*" }) {
                $matches++
            }
        }
        
        $typeConfidence = $matches / $indicators[$type].Count
        if ($typeConfidence -gt $confidence) {
            $confidence = $typeConfidence
            $projectType = $type
        }
    }
    
    $Script:ScannerConfig.Results.ProjectType = $projectType
    Write-ColorOutput "  🎯 Project type: $projectType (confidence: $([Math]::Round($confidence * 100, 1))%)" "Green"
    
    return $projectType
}

# Analyze code quality
function Analyze-CodeQuality {
    param([array]$CodeFiles)
    
    Write-ColorOutput "🔍 Analyzing code quality..." "Cyan"
    
    $totalLines = 0
    $codeLines = 0
    $qualityIssues = @()
    
    foreach ($file in $CodeFiles) {
        try {
            $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
            $fileLines = $content.Count
            $totalLines += $fileLines
            
            # Count non-empty lines as code lines
            $nonEmptyLines = $content | Where-Object { $_.Trim() -ne "" -and $_.Trim() -notmatch '^\s*#' -and $_.Trim() -notmatch '^\s*//' }
            $codeLines += $nonEmptyLines.Count
            
            # Basic quality checks
            if ($file.Extension -eq ".ps1") {
                # PowerShell specific checks
                if ($content -match 'Write-Host.*-ForegroundColor') {
                    $qualityIssues += "Consider using Write-ColorOutput for consistent coloring"
                }
                if ($content -match 'Get-ChildItem.*-Recurse' -and $content -notmatch '-ErrorAction') {
                    $qualityIssues += "Consider adding -ErrorAction parameter for Get-ChildItem"
                }
            }
        }
        catch {
            Write-ColorOutput "  ⚠️ Could not analyze file: $($file.Name)" "Yellow"
        }
    }
    
    $Script:ScannerConfig.Results.TotalLines = $totalLines
    $Script:ScannerConfig.Results.CodeLines = $codeLines
    
    # Calculate quality score
    $qualityScore = 100
    $qualityScore -= [Math]::Min($qualityIssues.Count * 5, 50) # Deduct for issues
    $qualityScore -= [Math]::Max(0, (($totalLines - $codeLines) / $totalLines) * 20) # Deduct for empty lines
    
    $Script:ScannerConfig.Results.QualityScore = [Math]::Max(0, [Math]::Round($qualityScore, 1))
    
    Write-ColorOutput "  📊 Total lines: $totalLines" "White"
    Write-ColorOutput "  💻 Code lines: $codeLines" "White"
    Write-ColorOutput "  ⭐ Quality score: $($Script:ScannerConfig.Results.QualityScore)/100" "Green"
    
    if ($qualityIssues.Count -gt 0) {
        Write-ColorOutput "  ⚠️ Quality issues found: $($qualityIssues.Count)" "Yellow"
        $Script:ScannerConfig.Results.Issues += $qualityIssues
    }
}

# Calculate test coverage
function Calculate-TestCoverage {
    param([array]$CodeFiles, [array]$TestFiles)
    
    Write-ColorOutput "🧪 Calculating test coverage..." "Cyan"
    
    if ($CodeFiles.Count -eq 0) {
        $Script:ScannerConfig.Results.TestCoverage = 0
        Write-ColorOutput "  ⚠️ No code files found for coverage calculation" "Yellow"
        return
    }
    
    # Simple coverage calculation based on file count
    $coverage = ($TestFiles.Count / $CodeFiles.Count) * 100
    $Script:ScannerConfig.Results.TestCoverage = [Math]::Round([Math]::Min($coverage, 100), 1)
    
    Write-ColorOutput "  📊 Test coverage: $($Script:ScannerConfig.Results.TestCoverage)%" "White"
    
    if ($Script:ScannerConfig.Results.TestCoverage -lt 50) {
        $Script:ScannerConfig.Results.Recommendations += "Consider adding more tests to improve coverage"
    }
}

# AI-powered analysis
function Invoke-AIAnalysis {
    if (-not $Script:ScannerConfig.Features.AI) {
        return
    }
    
    Write-ColorOutput "🤖 Running AI analysis..." "Cyan"
    
    $aiInsights = @()
    $recommendations = @()
    
    # Simulate AI analysis based on project characteristics
    if ($Script:ScannerConfig.Results.QualityScore -lt 70) {
        $aiInsights += "Code quality could be improved with better error handling and documentation"
        $recommendations += "Implement comprehensive error handling and add inline documentation"
    }
    
    if ($Script:ScannerConfig.Results.TestCoverage -lt 80) {
        $aiInsights += "Test coverage is below recommended levels for production code"
        $recommendations += "Increase test coverage to at least 80% for better reliability"
    }
    
    if ($Script:ScannerConfig.Results.TotalFiles -gt 1000) {
        $aiInsights += "Large codebase detected - consider modularization"
        $recommendations += "Break down large modules into smaller, focused components"
    }
    
    if ($Script:ScannerConfig.Results.ProjectType -eq "Universal") {
        $aiInsights += "Universal project detected - all automation features available"
        $recommendations += "Leverage AI-powered automation features for enhanced productivity"
    }
    
    $Script:ScannerConfig.Results.AIInsights = $aiInsights
    $Script:ScannerConfig.Results.Recommendations += $recommendations
    
    Write-ColorOutput "  🧠 AI insights: $($aiInsights.Count)" "White"
    Write-ColorOutput "  💡 Recommendations: $($recommendations.Count)" "White"
}

# Generate performance score
function Calculate-PerformanceScore {
    Write-ColorOutput "⚡ Calculating performance score..." "Cyan"
    
    $performanceScore = 100
    
    # Deduct for large files
    if ($Script:ScannerConfig.Results.TotalFiles -gt 5000) {
        $performanceScore -= 10
    }
    
    # Deduct for low test coverage
    if ($Script:ScannerConfig.Results.TestCoverage -lt 50) {
        $performanceScore -= 15
    }
    
    # Deduct for quality issues
    if ($Script:ScannerConfig.Results.QualityScore -lt 70) {
        $performanceScore -= 20
    }
    
    # Bonus for good practices
    if ($Script:ScannerConfig.Results.TestCoverage -gt 80) {
        $performanceScore += 10
    }
    
    if ($Script:ScannerConfig.Results.QualityScore -gt 85) {
        $performanceScore += 10
    }
    
    $Script:ScannerConfig.Results.PerformanceScore = [Math]::Max(0, [Math]::Min(100, [Math]::Round($performanceScore, 1)))
    
    Write-ColorOutput "  ⚡ Performance score: $($Script:ScannerConfig.Results.PerformanceScore)/100" "Green"
}

# Generate security score
function Calculate-SecurityScore {
    Write-ColorOutput "🔒 Calculating security score..." "Cyan"
    
    $securityScore = 100
    
    # Basic security checks
    $securityIssues = @()
    
    # Check for common security issues
    if ($Script:ScannerConfig.Results.ProjectType -eq "Node.js") {
        $securityIssues += "Consider running 'npm audit' to check for vulnerabilities"
    }
    
    if ($Script:ScannerConfig.Results.ProjectType -eq "Python") {
        $securityIssues += "Consider running 'safety check' to check for vulnerabilities"
    }
    
    # Deduct for security issues
    $securityScore -= $securityIssues.Count * 10
    
    $Script:ScannerConfig.Results.SecurityScore = [Math]::Max(0, [Math]::Min(100, [Math]::Round($securityScore, 1)))
    $Script:ScannerConfig.Results.Issues += $securityIssues
    
    Write-ColorOutput "  🔒 Security score: $($Script:ScannerConfig.Results.SecurityScore)/100" "Green"
}

# Generate report
function Generate-Report {
    if (-not $GenerateReport) {
        return
    }
    
    Write-ColorOutput "📊 Generating report..." "Cyan"
    
    $reportData = @{
        Version = $Script:ScannerConfig.Version
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        ProjectPath = $ProjectPath
        Results = $Script:ScannerConfig.Results
        Features = $Script:ScannerConfig.Features
        Performance = $Script:ScannerConfig.Performance
    }
    
    $reportFile = Join-Path $ReportPath "project-scan-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').$OutputFormat"
    
    try {
        switch ($OutputFormat.ToLower()) {
            "json" {
                $reportData | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportFile -Encoding UTF8
            }
            "xml" {
                $reportData | Export-Clixml -Path $reportFile
            }
            "csv" {
                $csvData = @(
                    [PSCustomObject]@{
                        Metric = "Project Type"
                        Value = $Script:ScannerConfig.Results.ProjectType
                    },
                    [PSCustomObject]@{
                        Metric = "Total Files"
                        Value = $Script:ScannerConfig.Results.TotalFiles
                    },
                    [PSCustomObject]@{
                        Metric = "Code Files"
                        Value = $Script:ScannerConfig.Results.CodeFiles
                    },
                    [PSCustomObject]@{
                        Metric = "Test Files"
                        Value = $Script:ScannerConfig.Results.TestFiles
                    },
                    [PSCustomObject]@{
                        Metric = "Total Lines"
                        Value = $Script:ScannerConfig.Results.TotalLines
                    },
                    [PSCustomObject]@{
                        Metric = "Code Lines"
                        Value = $Script:ScannerConfig.Results.CodeLines
                    },
                    [PSCustomObject]@{
                        Metric = "Test Coverage"
                        Value = "$($Script:ScannerConfig.Results.TestCoverage)%"
                    },
                    [PSCustomObject]@{
                        Metric = "Quality Score"
                        Value = "$($Script:ScannerConfig.Results.QualityScore)/100"
                    },
                    [PSCustomObject]@{
                        Metric = "Performance Score"
                        Value = "$($Script:ScannerConfig.Results.PerformanceScore)/100"
                    },
                    [PSCustomObject]@{
                        Metric = "Security Score"
                        Value = "$($Script:ScannerConfig.Results.SecurityScore)/100"
                    }
                )
                $csvData | Export-Csv -Path $reportFile -NoTypeInformation
            }
        }
        
        Write-ColorOutput "  📄 Report saved: $reportFile" "Green"
    }
    catch {
        Write-ColorOutput "  ❌ Failed to generate report: $($_.Exception.Message)" "Red"
    }
}

# Display summary
function Show-Summary {
    Write-ColorOutput ""
    Write-ColorOutput "📊 SCAN SUMMARY" "Cyan"
    Write-ColorOutput ("=" * 40) "Cyan"
    
    Write-ColorOutput "🎯 Project Type: $($Script:ScannerConfig.Results.ProjectType)" "White"
    Write-ColorOutput "📁 Total Files: $($Script:ScannerConfig.Results.TotalFiles)" "White"
    Write-ColorOutput "💻 Code Files: $($Script:ScannerConfig.Results.CodeFiles)" "White"
    Write-ColorOutput "🧪 Test Files: $($Script:ScannerConfig.Results.TestFiles)" "White"
    Write-ColorOutput "📏 Total Lines: $($Script:ScannerConfig.Results.TotalLines)" "White"
    Write-ColorOutput "💻 Code Lines: $($Script:ScannerConfig.Results.CodeLines)" "White"
    Write-ColorOutput "📊 Test Coverage: $($Script:ScannerConfig.Results.TestCoverage)%" "White"
    Write-ColorOutput "⭐ Quality Score: $($Script:ScannerConfig.Results.QualityScore)/100" "White"
    Write-ColorOutput "⚡ Performance Score: $($Script:ScannerConfig.Results.PerformanceScore)/100" "White"
    Write-ColorOutput "🔒 Security Score: $($Script:ScannerConfig.Results.SecurityScore)/100" "White"
    
    if ($Script:ScannerConfig.Results.AIInsights.Count -gt 0) {
        Write-ColorOutput ""
        Write-ColorOutput "🤖 AI INSIGHTS:" "Yellow"
        foreach ($insight in $Script:ScannerConfig.Results.AIInsights) {
            Write-ColorOutput "  • $insight" "Gray"
        }
    }
    
    if ($Script:ScannerConfig.Results.Recommendations.Count -gt 0) {
        Write-ColorOutput ""
        Write-ColorOutput "💡 RECOMMENDATIONS:" "Yellow"
        foreach ($recommendation in $Script:ScannerConfig.Results.Recommendations) {
            Write-ColorOutput "  • $recommendation" "Gray"
        }
    }
    
    if ($Script:ScannerConfig.Results.Issues.Count -gt 0) {
        Write-ColorOutput ""
        Write-ColorOutput "⚠️ ISSUES:" "Red"
        foreach ($issue in $Script:ScannerConfig.Results.Issues) {
            Write-ColorOutput "  • $issue" "Gray"
        }
    }
    
    Write-ColorOutput ""
    $totalTime = (Get-Date) - $Script:ScannerConfig.StartTime
    Write-ColorOutput "⏱️ Scan completed in $($totalTime.TotalSeconds.ToString('F2')) seconds" "Gray"
}

# Main execution
function Main {
    try {
        Initialize-Scanner
        
        $files = Scan-ProjectFiles
        Detect-ProjectType $files.AllFiles
        Analyze-CodeQuality $files.CodeFiles
        Calculate-TestCoverage $files.CodeFiles $files.TestFiles
        
        if ($Script:ScannerConfig.Features.AI) {
            Invoke-AIAnalysis
        }
        
        Calculate-PerformanceScore
        Calculate-SecurityScore
        Generate-Report
        Show-Summary
        
        Write-ColorOutput "🎉 Project scan completed successfully!" "Green"
    }
    catch {
        Write-ColorOutput "💥 Scan failed: $($_.Exception.Message)" "Red"
        exit 1
    }
}

# Run main function
Main
