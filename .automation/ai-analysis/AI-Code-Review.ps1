# 🔍 AI-Powered Code Review System
# Automated code review with AI suggestions and quality assessment

param(
    [Parameter(Mandatory=$false)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$false)]
    [string]$PullRequestId,
    
    [Parameter(Mandatory=$false)]
    [string]$Branch = "main",
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateComments = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$CheckStyle = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$SecurityCheck = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$PerformanceCheck = $true
)

# 🎯 Configuration
$Config = @{
    AIProvider = "openai"
    Model = "gpt-4"
    MaxTokens = 4000
    Temperature = 0.1
    ReviewDepth = "comprehensive"
    StyleRules = @{
        "python" = "PEP8"
        "javascript" = "ESLint"
        "typescript" = "TypeScript-ESLint"
        "csharp" = "Microsoft"
        "java" = "Google"
        "go" = "gofmt"
        "rust" = "rustfmt"
    }
}

# 🚀 Main Review Function
function Start-AICodeReview {
    Write-Host "🔍 Starting AI Code Review..." -ForegroundColor Cyan
    
    if ($FilePath) {
        $Files = @(Get-Item $FilePath)
    } elseif ($PullRequestId) {
        $Files = Get-PullRequestFiles -PullRequestId $PullRequestId
    } else {
        $Files = Get-ChangedFiles -Branch $Branch
    }
    
    Write-Host "📁 Reviewing $($Files.Count) files" -ForegroundColor Green
    
    $ReviewResults = @{
        Files = @()
        Summary = @{
            TotalFiles = $Files.Count
            IssuesFound = 0
            CriticalIssues = 0
            Warnings = 0
            Suggestions = 0
        }
        Recommendations = @()
    }
    
    foreach ($File in $Files) {
        Write-Host "🔍 Reviewing: $($File.Name)" -ForegroundColor Yellow
        
        $FileReview = Review-File -FilePath $File.FullName
        $ReviewResults.Files += $FileReview
        $ReviewResults.Summary.IssuesFound += $FileReview.Issues.Count
        $ReviewResults.Summary.CriticalIssues += ($FileReview.Issues | Where-Object { $_.Severity -eq "Critical" }).Count
        $ReviewResults.Summary.Warnings += ($FileReview.Issues | Where-Object { $_.Severity -eq "Warning" }).Count
        $ReviewResults.Summary.Suggestions += ($FileReview.Issues | Where-Object { $_.Severity -eq "Suggestion" }).Count
    }
    
    # Generate overall recommendations
    $ReviewResults.Recommendations = Generate-OverallRecommendations -FileReviews $ReviewResults.Files
    
    # Display results
    Show-ReviewResults -Results $ReviewResults
    
    # Generate comments if requested
    if ($GenerateComments) {
        Generate-ReviewComments -Results $ReviewResults
    }
    
    Write-Host "✅ AI Code Review completed!" -ForegroundColor Green
    return $ReviewResults
}

# 📄 Review Individual File
function Review-File {
    param([string]$FilePath)
    
    $Content = Get-Content -Path $FilePath -Raw -ErrorAction SilentlyContinue
    if (-not $Content) {
        return @{
            File = $FilePath
            Status = "Error"
            Issues = @()
            Score = 0
        }
    }
    
    $Language = Get-FileLanguage -FilePath $FilePath
    $FileReview = @{
        File = $FilePath
        Language = $Language
        Lines = ($Content -split "`n").Count
        Characters = $Content.Length
        Issues = @()
        Score = 100
        Metrics = @{}
    }
    
    # Style checking
    if ($CheckStyle) {
        $StyleIssues = Check-CodeStyle -Content $Content -Language $Language -FilePath $FilePath
        $FileReview.Issues += $StyleIssues
    }
    
    # Security checking
    if ($SecurityCheck) {
        $SecurityIssues = Check-Security -Content $Content -Language $Language -FilePath $FilePath
        $FileReview.Issues += $SecurityIssues
    }
    
    # Performance checking
    if ($PerformanceCheck) {
        $PerformanceIssues = Check-Performance -Content $Content -Language $Language -FilePath $FilePath
        $FileReview.Issues += $PerformanceIssues
    }
    
    # AI-powered analysis
    $AIIssues = Invoke-AIReview -Content $Content -Language $Language -FilePath $FilePath
    $FileReview.Issues += $AIIssues
    
    # Calculate score
    $FileReview.Score = Calculate-ReviewScore -Issues $FileReview.Issues -Lines $FileReview.Lines
    
    return $FileReview
}

# 🎨 Code Style Checking
function Check-CodeStyle {
    param(
        [string]$Content,
        [string]$Language,
        [string]$FilePath
    )
    
    $Issues = @()
    $Lines = $Content -split "`n"
    
    # Language-specific style checks
    switch ($Language) {
        "python" {
            $Issues += Check-PythonStyle -Lines $Lines -FilePath $FilePath
        }
        "javascript" {
            $Issues += Check-JavaScriptStyle -Lines $Lines -FilePath $FilePath
        }
        "typescript" {
            $Issues += Check-TypeScriptStyle -Lines $Lines -FilePath $FilePath
        }
        "csharp" {
            $Issues += Check-CSharpStyle -Lines $Lines -FilePath $FilePath
        }
        "powershell" {
            $Issues += Check-PowerShellStyle -Lines $Lines -FilePath $FilePath
        }
    }
    
    return $Issues
}

# 🔒 Security Checking
function Check-Security {
    param(
        [string]$Content,
        [string]$Language,
        [string]$FilePath
    )
    
    $Issues = @()
    $Lines = $Content -split "`n"
    
    # Common security patterns
    $SecurityPatterns = @{
        "HardcodedSecrets" = @(
            "password\s*=\s*['""][^'""]+['""]",
            "api_key\s*=\s*['""][^'""]+['""]",
            "secret\s*=\s*['""][^'""]+['""]",
            "token\s*=\s*['""][^'""]+['""]"
        )
        "SQLInjection" = @(
            "SELECT.*\+.*['""]",
            "INSERT.*\+.*['""]",
            "UPDATE.*\+.*['""]",
            "DELETE.*\+.*['""]"
        )
        "XSS" = @(
            "innerHTML\s*=",
            "document\.write\s*\(",
            "eval\s*\("
        )
        "PathTraversal" = @(
            "\.\./",
            "\.\.\\",
            "File\.ReadAllText\s*\(",
            "File\.ReadAllBytes\s*\("
        )
    }
    
    foreach ($PatternType in $SecurityPatterns.Keys) {
        foreach ($Pattern in $SecurityPatterns[$PatternType]) {
            for ($i = 0; $i -lt $Lines.Count; $i++) {
                if ($Lines[$i] -match $Pattern) {
                    $Issues += @{
                        Type = "Security"
                        Category = $PatternType
                        Severity = "Critical"
                        Line = $i + 1
                        Message = "Potential security vulnerability: $PatternType"
                        Suggestion = Get-SecuritySuggestion -PatternType $PatternType
                        File = $FilePath
                    }
                }
            }
        }
    }
    
    return $Issues
}

# ⚡ Performance Checking
function Check-Performance {
    param(
        [string]$Content,
        [string]$Language,
        [string]$FilePath
    )
    
    $Issues = @()
    $Lines = $Content -split "`n"
    
    # Performance anti-patterns
    $PerformancePatterns = @{
        "NPlusOne" = @(
            "for.*in.*:.*\.find\(",
            "foreach.*in.*:.*\.Where\("
        )
        "InefficientLoops" = @(
            "for.*in.*range\(len\(",
            "\.append\(.*\)\s*$"
        )
        "MemoryLeaks" = @(
            "new\s+.*\(\)\s*;",
            "malloc\s*\("
        )
        "InefficientQueries" = @(
            "SELECT\s+\*\s+FROM",
            "\.Where\(.*\)\.Where\("
        )
    }
    
    foreach ($PatternType in $PerformancePatterns.Keys) {
        foreach ($Pattern in $PerformancePatterns[$PatternType]) {
            for ($i = 0; $i -lt $Lines.Count; $i++) {
                if ($Lines[$i] -match $Pattern) {
                    $Issues += @{
                        Type = "Performance"
                        Category = $PatternType
                        Severity = "Warning"
                        Line = $i + 1
                        Message = "Potential performance issue: $PatternType"
                        Suggestion = Get-PerformanceSuggestion -PatternType $PatternType
                        File = $FilePath
                    }
                }
            }
        }
    }
    
    return $Issues
}

# 🤖 AI-Powered Review
function Invoke-AIReview {
    param(
        [string]$Content,
        [string]$Language,
        [string]$FilePath
    )
    
    $Issues = @()
    
    # Prepare content for AI analysis
    $AnalysisContent = @"
File: $FilePath
Language: $Language
Content:
```$Language
$Content
```

Please analyze this code and provide:
1. Code quality issues
2. Potential bugs
3. Improvement suggestions
4. Best practices violations
5. Architecture concerns

Format your response as JSON with the following structure:
{
  "issues": [
    {
      "type": "Quality|Bug|Performance|Security|Architecture",
      "severity": "Critical|Warning|Suggestion",
      "line": number,
      "message": "description",
      "suggestion": "improvement suggestion"
    }
  ]
}
"@

    try {
        $AIResponse = Invoke-AIAPI -Content $AnalysisContent -Provider $Config.AIProvider -Model $Config.Model
        $AIResult = $AIResponse | ConvertFrom-Json
        
        foreach ($Issue in $AIResult.issues) {
            $Issues += @{
                Type = $Issue.type
                Severity = $Issue.severity
                Line = $Issue.line
                Message = $Issue.message
                Suggestion = $Issue.suggestion
                File = $FilePath
                Source = "AI"
            }
        }
    }
    catch {
        Write-Warning "AI analysis failed for $FilePath : $($_.Exception.Message)"
    }
    
    return $Issues
}

# 📊 Calculate Review Score
function Calculate-ReviewScore {
    param(
        [array]$Issues,
        [int]$Lines
    )
    
    $Score = 100
    $CriticalPenalty = 10
    $WarningPenalty = 5
    $SuggestionPenalty = 1
    
    foreach ($Issue in $Issues) {
        switch ($Issue.Severity) {
            "Critical" { $Score -= $CriticalPenalty }
            "Warning" { $Score -= $WarningPenalty }
            "Suggestion" { $Score -= $SuggestionPenalty }
        }
    }
    
    # Normalize by file size
    $SizeFactor = [Math]::Min(1.0, $Lines / 100)
    $Score = [Math]::Max(0, $Score * $SizeFactor)
    
    return [Math]::Round($Score, 1)
}

# 📋 Generate Review Comments
function Generate-ReviewComments {
    param([hashtable]$Results)
    
    $CommentsPath = ".\reports\code-review-comments-$(Get-Date -Format 'yyyy-MM-dd-HHmm').md"
    $CommentsDir = Split-Path -Parent $CommentsPath
    
    if (-not (Test-Path $CommentsDir)) {
        New-Item -ItemType Directory -Path $CommentsDir -Force | Out-Null
    }
    
    $Comments = @"
# 🔍 AI Code Review Comments

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Files Reviewed**: $($Results.Summary.TotalFiles)  
**Issues Found**: $($Results.Summary.IssuesFound)

## 📊 Summary

- **Critical Issues**: $($Results.Summary.CriticalIssues)
- **Warnings**: $($Results.Summary.Warnings)
- **Suggestions**: $($Results.Summary.Suggestions)

## 📁 File Reviews

"@

    foreach ($FileReview in $Results.Files) {
        $Comments += "`n### $($FileReview.File)`n"
        $Comments += "**Score**: $($FileReview.Score)/100`n"
        $Comments += "**Language**: $($FileReview.Language)`n"
        $Comments += "**Lines**: $($FileReview.Lines)`n"
        
        if ($FileReview.Issues.Count -gt 0) {
            $Comments += "`n#### Issues:`n"
            foreach ($Issue in $FileReview.Issues) {
                $Comments += "- **Line $($Issue.Line)**: $($Issue.Message)`n"
                $Comments += "  - Severity: $($Issue.Severity)`n"
                $Comments += "  - Suggestion: $($Issue.Suggestion)`n"
            }
        } else {
            $Comments += "`n✅ No issues found!`n"
        }
    }
    
    $Comments += "`n## 🎯 Overall Recommendations`n"
    foreach ($Recommendation in $Results.Recommendations) {
        $Comments += "- $Recommendation`n"
    }
    
    $Comments | Out-File -FilePath $CommentsPath -Encoding UTF8
    Write-Host "📋 Comments generated: $CommentsPath" -ForegroundColor Green
}

# 🚀 Execute Review
if ($MyInvocation.InvocationName -ne '.') {
    Start-AICodeReview
}
