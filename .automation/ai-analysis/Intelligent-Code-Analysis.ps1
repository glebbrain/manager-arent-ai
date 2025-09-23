# 🧠 Intelligent Code Analysis System
# AI-powered code quality analysis and improvement suggestions

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$Language = "auto",
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$SuggestImprovements = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$PerformanceAnalysis = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$SecurityAnalysis = $true
)

# 🎯 Configuration
$Config = @{
    SupportedLanguages = @("python", "javascript", "typescript", "csharp", "java", "go", "rust", "php", "powershell", "bash")
    AnalysisDepth = "comprehensive"
    ReportFormat = "markdown"
    AIProvider = "openai" # or "anthropic", "local"
    MaxFileSize = 1MB
    ExcludePatterns = @("node_modules", ".git", "bin", "obj", "dist", "build", "__pycache__")
}

# 🚀 Main Analysis Function
function Start-IntelligentCodeAnalysis {
    Write-Host "🧠 Starting Intelligent Code Analysis..." -ForegroundColor Cyan
    
    # 1. Project Discovery
    $ProjectFiles = Get-ProjectFiles -Path $ProjectPath -Language $Language
    Write-Host "📁 Found $($ProjectFiles.Count) files to analyze" -ForegroundColor Green
    
    # 2. Language Detection
    $DetectedLanguages = Get-DetectedLanguages -Files $ProjectFiles
    Write-Host "🔍 Detected languages: $($DetectedLanguages -join ', ')" -ForegroundColor Yellow
    
    # 3. Code Quality Analysis
    $QualityMetrics = Get-CodeQualityMetrics -Files $ProjectFiles -Languages $DetectedLanguages
    Write-Host "📊 Quality analysis completed" -ForegroundColor Green
    
    # 4. AI-Powered Analysis
    $AIAnalysis = Invoke-AIAnalysis -Files $ProjectFiles -Metrics $QualityMetrics
    Write-Host "🤖 AI analysis completed" -ForegroundColor Magenta
    
    # 5. Performance Analysis
    if ($PerformanceAnalysis) {
        $PerformanceMetrics = Get-PerformanceMetrics -Files $ProjectFiles
        Write-Host "⚡ Performance analysis completed" -ForegroundColor Blue
    }
    
    # 6. Security Analysis
    if ($SecurityAnalysis) {
        $SecurityIssues = Get-SecurityAnalysis -Files $ProjectFiles
        Write-Host "🔒 Security analysis completed" -ForegroundColor Red
    }
    
    # 7. Generate Report
    if ($GenerateReport) {
        $ReportPath = Generate-AnalysisReport -QualityMetrics $QualityMetrics -AIAnalysis $AIAnalysis -PerformanceMetrics $PerformanceMetrics -SecurityIssues $SecurityIssues
        Write-Host "📋 Report generated: $ReportPath" -ForegroundColor Green
    }
    
    # 8. Suggest Improvements
    if ($SuggestImprovements) {
        $Improvements = Get-ImprovementSuggestions -AIAnalysis $AIAnalysis -QualityMetrics $QualityMetrics
        Show-ImprovementSuggestions -Suggestions $Improvements
    }
    
    Write-Host "✅ Intelligent Code Analysis completed successfully!" -ForegroundColor Green
}

# 📁 Project File Discovery
function Get-ProjectFiles {
    param(
        [string]$Path,
        [string]$Language
    )
    
    $Files = @()
    $Extensions = Get-LanguageExtensions -Language $Language
    
    foreach ($Ext in $Extensions) {
        $FoundFiles = Get-ChildItem -Path $Path -Recurse -Include "*.$Ext" | Where-Object {
            $Exclude = $false
            foreach ($Pattern in $Config.ExcludePatterns) {
                if ($_.FullName -like "*$Pattern*") {
                    $Exclude = $true
                    break
                }
            }
            return -not $Exclude -and $_.Length -lt $Config.MaxFileSize
        }
        $Files += $FoundFiles
    }
    
    return $Files
}

# 🔍 Language Detection
function Get-DetectedLanguages {
    param([array]$Files)
    
    $LanguageCounts = @{}
    
    foreach ($File in $Files) {
        $Ext = $File.Extension.TrimStart('.')
        $Language = Get-LanguageFromExtension -Extension $Ext
        
        if ($Language -and $Config.SupportedLanguages -contains $Language) {
            if ($LanguageCounts.ContainsKey($Language)) {
                $LanguageCounts[$Language]++
            } else {
                $LanguageCounts[$Language] = 1
            }
        }
    }
    
    return $LanguageCounts.Keys | Sort-Object
}

# 📊 Code Quality Metrics
function Get-CodeQualityMetrics {
    param(
        [array]$Files,
        [array]$Languages
    )
    
    $Metrics = @{
        TotalFiles = $Files.Count
        TotalLines = 0
        TotalCharacters = 0
        Languages = $Languages
        Complexity = @{}
        Maintainability = @{}
        Readability = @{}
        Documentation = @{}
        TestCoverage = @{}
    }
    
    foreach ($File in $Files) {
        $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue
        if ($Content) {
            $Metrics.TotalLines += ($Content -split "`n").Count
            $Metrics.TotalCharacters += $Content.Length
            
            # Language-specific analysis
            $Language = Get-LanguageFromExtension -Extension $File.Extension.TrimStart('.')
            if ($Language) {
                $FileMetrics = Analyze-FileQuality -Content $Content -Language $Language -FilePath $File.FullName
                Merge-FileMetrics -Metrics $Metrics -FileMetrics $FileMetrics -Language $Language
            }
        }
    }
    
    return $Metrics
}

# 🤖 AI-Powered Analysis
function Invoke-AIAnalysis {
    param(
        [array]$Files,
        [hashtable]$Metrics
    )
    
    $AIAnalysis = @{
        CodePatterns = @()
        AntiPatterns = @()
        ImprovementSuggestions = @()
        ArchitectureIssues = @()
        PerformanceBottlenecks = @()
        SecurityConcerns = @()
        BestPractices = @()
        RefactoringOpportunities = @()
    }
    
    # Analyze code patterns using AI
    foreach ($File in $Files) {
        $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue
        if ($Content) {
            $FileAnalysis = Analyze-FileWithAI -Content $Content -FilePath $File.FullName
            Merge-AIAnalysis -AIAnalysis $AIAnalysis -FileAnalysis $FileAnalysis
        }
    }
    
    return $AIAnalysis
}

# ⚡ Performance Analysis
function Get-PerformanceMetrics {
    param([array]$Files)
    
    $PerformanceMetrics = @{
        LargeFiles = @()
        ComplexFunctions = @()
        PotentialBottlenecks = @()
        MemoryUsage = @()
        ExecutionTime = @()
    }
    
    foreach ($File in $Files) {
        $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue
        if ($Content) {
            $FilePerf = Analyze-FilePerformance -Content $Content -FilePath $File.FullName
            Merge-PerformanceMetrics -PerformanceMetrics $PerformanceMetrics -FilePerf $FilePerf
        }
    }
    
    return $PerformanceMetrics
}

# 🔒 Security Analysis
function Get-SecurityAnalysis {
    param([array]$Files)
    
    $SecurityIssues = @{
        Vulnerabilities = @()
        HardcodedSecrets = @()
        InsecurePatterns = @()
        DependencyIssues = @()
        AccessControlIssues = @()
    }
    
    foreach ($File in $Files) {
        $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue
        if ($Content) {
            $FileSecurity = Analyze-FileSecurity -Content $Content -FilePath $File.FullName
            Merge-SecurityIssues -SecurityIssues $SecurityIssues -FileSecurity $FileSecurity
        }
    }
    
    return $SecurityIssues
}

# 📋 Generate Analysis Report
function Generate-AnalysisReport {
    param(
        [hashtable]$QualityMetrics,
        [hashtable]$AIAnalysis,
        [hashtable]$PerformanceMetrics,
        [hashtable]$SecurityIssues
    )
    
    $ReportPath = ".\reports\intelligent-code-analysis-$(Get-Date -Format 'yyyy-MM-dd-HHmm').md"
    $ReportDir = Split-Path -Parent $ReportPath
    
    if (-not (Test-Path $ReportDir)) {
        New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
    }
    
    $Report = @"
# 🧠 Intelligent Code Analysis Report

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Project**: $ProjectPath  
**Analysis Type**: $($Config.AnalysisDepth)

## 📊 Executive Summary

- **Total Files Analyzed**: $($QualityMetrics.TotalFiles)
- **Total Lines of Code**: $($QualityMetrics.TotalLines)
- **Languages Detected**: $($QualityMetrics.Languages -join ', ')
- **Issues Found**: $($AIAnalysis.AntiPatterns.Count + $SecurityIssues.Vulnerabilities.Count)

## 🔍 Code Quality Metrics

### Overall Metrics
- **Average Complexity**: $(Get-AverageComplexity -Metrics $QualityMetrics)
- **Maintainability Score**: $(Get-MaintainabilityScore -Metrics $QualityMetrics)
- **Readability Score**: $(Get-ReadabilityScore -Metrics $QualityMetrics)

### Language Breakdown
"@

    foreach ($Language in $QualityMetrics.Languages) {
        $Report += "`n#### $Language`n"
        $Report += "- Files: $($QualityMetrics.Complexity[$Language].Files)`n"
        $Report += "- Average Complexity: $($QualityMetrics.Complexity[$Language].Average)`n"
        $Report += "- Maintainability: $($QualityMetrics.Maintainability[$Language].Score)`n"
    }

    $Report += @"

## 🤖 AI Analysis Results

### Code Patterns Found
"@

    foreach ($Pattern in $AIAnalysis.CodePatterns) {
        $Report += "`n- **$($Pattern.Name)**: $($Pattern.Description)`n"
    }

    $Report += @"

### Anti-Patterns Detected
"@

    foreach ($AntiPattern in $AIAnalysis.AntiPatterns) {
        $Report += "`n- **$($AntiPattern.Name)**: $($AntiPattern.Description)`n"
        $Report += "  - File: $($AntiPattern.File)`n"
        $Report += "  - Line: $($AntiPattern.Line)`n"
        $Report += "  - Severity: $($AntiPattern.Severity)`n"
    }

    $Report += @"

### Improvement Suggestions
"@

    foreach ($Suggestion in $AIAnalysis.ImprovementSuggestions) {
        $Report += "`n- **$($Suggestion.Title)**: $($Suggestion.Description)`n"
        $Report += "  - Priority: $($Suggestion.Priority)`n"
        $Report += "  - Impact: $($Suggestion.Impact)`n"
    }

    if ($PerformanceAnalysis) {
        $Report += @"

## ⚡ Performance Analysis

### Performance Issues
"@

        foreach ($Issue in $PerformanceMetrics.PotentialBottlenecks) {
            $Report += "`n- **$($Issue.Type)**: $($Issue.Description)`n"
            $Report += "  - File: $($Issue.File)`n"
            $Report += "  - Impact: $($Issue.Impact)`n"
        }
    }

    if ($SecurityAnalysis) {
        $Report += @"

## 🔒 Security Analysis

### Security Issues
"@

        foreach ($Issue in $SecurityIssues.Vulnerabilities) {
            $Report += "`n- **$($Issue.Type)**: $($Issue.Description)`n"
            $Report += "  - File: $($Issue.File)`n"
            $Report += "  - Severity: $($Issue.Severity)`n"
        }
    }

    $Report += @"

## 🎯 Recommendations

1. **Immediate Actions**: Focus on high-priority security and performance issues
2. **Code Quality**: Implement suggested refactoring opportunities
3. **Architecture**: Address identified architectural concerns
4. **Testing**: Improve test coverage based on analysis results
5. **Documentation**: Enhance documentation for complex functions

## 📈 Next Steps

1. Review and prioritize improvement suggestions
2. Implement critical security fixes
3. Refactor code based on AI recommendations
4. Set up continuous monitoring
5. Schedule follow-up analysis

---
*Report generated by Intelligent Code Analysis System v1.0*
"@

    $Report | Out-File -FilePath $ReportPath -Encoding UTF8
    return $ReportPath
}

# 🛠️ Helper Functions
function Get-LanguageExtensions {
    param([string]$Language)
    
    $Extensions = @{
        "python" = @("py", "pyw")
        "javascript" = @("js", "jsx", "mjs")
        "typescript" = @("ts", "tsx")
        "csharp" = @("cs")
        "java" = @("java")
        "go" = @("go")
        "rust" = @("rs")
        "php" = @("php")
        "powershell" = @("ps1", "psm1", "psd1")
        "bash" = @("sh", "bash")
        "auto" = @("py", "js", "ts", "cs", "java", "go", "rs", "php", "ps1", "sh")
    }
    
    return $Extensions[$Language]
}

function Get-LanguageFromExtension {
    param([string]$Extension)
    
    $LanguageMap = @{
        "py" = "python"
        "pyw" = "python"
        "js" = "javascript"
        "jsx" = "javascript"
        "mjs" = "javascript"
        "ts" = "typescript"
        "tsx" = "typescript"
        "cs" = "csharp"
        "java" = "java"
        "go" = "go"
        "rs" = "rust"
        "php" = "php"
        "ps1" = "powershell"
        "psm1" = "powershell"
        "psd1" = "powershell"
        "sh" = "bash"
        "bash" = "bash"
    }
    
    return $LanguageMap[$Extension]
}

# 🚀 Execute Analysis
if ($MyInvocation.InvocationName -ne '.') {
    Start-IntelligentCodeAnalysis
}
