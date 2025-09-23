# GPT-4 Code Analysis Module
# Advanced code analysis using GPT-4 API integration
# Version: 2.5.0
# Author: Universal Automation Platform

param(
    [Parameter(Mandatory = $false)]
    [string]$CodePath = ".",
    
    [Parameter(Mandatory = $false)]
    [string]$Language = "auto",
    
    [Parameter(Mandatory = $false)]
    [string]$AnalysisType = "comprehensive",
    
    [Parameter(Mandatory = $false)]
    [string]$OutputFormat = "json",
    
    [Parameter(Mandatory = $false)]
    [string]$ApiKey = $env:OPENAI_API_KEY,
    
    [Parameter(Mandatory = $false)]
    [switch]$Verbose
)

# Import required modules
Import-Module -Name "$PSScriptRoot\..\module\UniversalAutomation.psm1" -Force -ErrorAction SilentlyContinue

# Configuration
$Config = @{
    ApiEndpoint = "https://api.openai.com/v1/chat/completions"
    Model = "gpt-4"
    MaxTokens = 4000
    Temperature = 0.1
    Timeout = 30
    RetryAttempts = 3
    SupportedLanguages = @("powershell", "python", "javascript", "typescript", "csharp", "java", "cpp", "go", "rust", "php", "ruby", "swift", "kotlin")
    AnalysisTypes = @("comprehensive", "security", "performance", "quality", "architecture", "documentation")
}

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    
    if ($Verbose) {
        Write-Host $LogMessage
    }
    
    # Log to file
    $LogFile = "$PSScriptRoot\..\..\logs\gpt4-analysis.log"
    Add-Content -Path $LogFile -Value $LogMessage -ErrorAction SilentlyContinue
}

# Validate API key
function Test-ApiKey {
    if (-not $ApiKey) {
        Write-Log "OpenAI API key not found. Please set OPENAI_API_KEY environment variable." "ERROR"
        return $false
    }
    
    if ($ApiKey.Length -lt 20) {
        Write-Log "Invalid API key format." "ERROR"
        return $false
    }
    
    return $true
}

# Detect code language
function Get-CodeLanguage {
    param([string]$FilePath)
    
    $Extension = [System.IO.Path]::GetExtension($FilePath).ToLower()
    
    $LanguageMap = @{
        ".ps1" = "powershell"
        ".py" = "python"
        ".js" = "javascript"
        ".ts" = "typescript"
        ".cs" = "csharp"
        ".java" = "java"
        ".cpp" = "cpp"
        ".c" = "cpp"
        ".go" = "go"
        ".rs" = "rust"
        ".php" = "php"
        ".rb" = "ruby"
        ".swift" = "swift"
        ".kt" = "kotlin"
    }
    
    if ($LanguageMap.ContainsKey($Extension)) {
        return $LanguageMap[$Extension]
    }
    
    return "unknown"
}

# Read and prepare code content
function Get-CodeContent {
    param([string]$FilePath)
    
    try {
        $Content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        $Language = Get-CodeLanguage -FilePath $FilePath
        
        return @{
            Content = $Content
            Language = $Language
            FileName = [System.IO.Path]::GetFileName($FilePath)
            FilePath = $FilePath
        }
    }
    catch {
        Write-Log "Error reading file $FilePath : $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Create GPT-4 analysis prompt
function New-AnalysisPrompt {
    param(
        [string]$CodeContent,
        [string]$Language,
        [string]$AnalysisType,
        [string]$FileName
    )
    
    $SystemPrompt = @"
You are an expert code analyst with deep knowledge of $Language and software engineering best practices. 
Analyze the provided code and provide comprehensive insights.

Analysis Type: $AnalysisType
File: $FileName
Language: $Language

Please provide analysis in the following JSON format:
{
    "overview": {
        "complexity": "low|medium|high",
        "quality_score": 0-100,
        "maintainability": "excellent|good|fair|poor",
        "readability": "excellent|good|fair|poor"
    },
    "issues": [
        {
            "type": "error|warning|suggestion",
            "severity": "critical|high|medium|low",
            "line": number,
            "message": "description",
            "suggestion": "fix recommendation"
        }
    ],
    "strengths": [
        "positive aspect 1",
        "positive aspect 2"
    ],
    "recommendations": [
        {
            "category": "performance|security|maintainability|readability",
            "priority": "high|medium|low",
            "description": "recommendation",
            "implementation": "how to implement"
        }
    ],
    "metrics": {
        "lines_of_code": number,
        "cyclomatic_complexity": number,
        "cognitive_complexity": number,
        "maintainability_index": number
    },
    "security_analysis": {
        "vulnerabilities": [
            {
                "type": "vulnerability type",
                "severity": "critical|high|medium|low",
                "description": "vulnerability description",
                "fix": "how to fix"
            }
        ],
        "security_score": 0-100
    },
    "performance_analysis": {
        "bottlenecks": [
            {
                "type": "bottleneck type",
                "severity": "high|medium|low",
                "description": "bottleneck description",
                "optimization": "optimization suggestion"
            }
        ],
        "performance_score": 0-100
    }
}
"@

    $UserPrompt = @"
Please analyze the following $Language code:

```$Language
$CodeContent
```

Provide a comprehensive analysis focusing on $AnalysisType aspects.
"@

    return @{
        SystemPrompt = $SystemPrompt
        UserPrompt = $UserPrompt
    }
}

# Call GPT-4 API
function Invoke-GPT4Analysis {
    param(
        [string]$SystemPrompt,
        [string]$UserPrompt
    )
    
    $Headers = @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    }
    
    $Body = @{
        model = $Config.Model
        messages = @(
            @{
                role = "system"
                content = $SystemPrompt
            },
            @{
                role = "user"
                content = $UserPrompt
            }
        )
        max_tokens = $Config.MaxTokens
        temperature = $Config.Temperature
    } | ConvertTo-Json -Depth 10
    
    $RetryCount = 0
    $MaxRetries = $Config.RetryAttempts
    
    do {
        try {
            Write-Log "Calling GPT-4 API (attempt $($RetryCount + 1))"
            
            $Response = Invoke-RestMethod -Uri $Config.ApiEndpoint -Method Post -Headers $Headers -Body $Body -TimeoutSec $Config.Timeout
            
            if ($Response.choices -and $Response.choices[0].message.content) {
                $AnalysisResult = $Response.choices[0].message.content
                Write-Log "GPT-4 analysis completed successfully"
                return $AnalysisResult
            }
            else {
                Write-Log "Unexpected API response format" "WARNING"
                return $null
            }
        }
        catch {
            $RetryCount++
            Write-Log "API call failed (attempt $RetryCount): $($_.Exception.Message)" "WARNING"
            
            if ($RetryCount -ge $MaxRetries) {
                Write-Log "Max retry attempts reached. API call failed." "ERROR"
                return $null
            }
            
            Start-Sleep -Seconds (2 * $RetryCount) # Exponential backoff
        }
    } while ($RetryCount -lt $MaxRetries)
    
    return $null
}

# Process analysis results
function Process-AnalysisResults {
    param(
        [string]$AnalysisResult,
        [string]$OutputFormat
    )
    
    try {
        # Try to parse as JSON
        $JsonResult = $AnalysisResult | ConvertFrom-Json -ErrorAction Stop
        
        if ($OutputFormat -eq "json") {
            return $JsonResult | ConvertTo-Json -Depth 10
        }
        elseif ($OutputFormat -eq "html") {
            return ConvertTo-HtmlReport -AnalysisResult $JsonResult
        }
        else {
            return ConvertTo-TextReport -AnalysisResult $JsonResult
        }
    }
    catch {
        Write-Log "Failed to parse JSON result: $($_.Exception.Message)" "WARNING"
        
        # Return raw result if JSON parsing fails
        return $AnalysisResult
    }
}

# Convert to HTML report
function ConvertTo-HtmlReport {
    param($AnalysisResult)
    
    $Html = @"
<!DOCTYPE html>
<html>
<head>
    <title>GPT-4 Code Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .issue { background: #fff3cd; padding: 10px; margin: 5px 0; border-left: 4px solid #ffc107; }
        .strength { background: #d4edda; padding: 10px; margin: 5px 0; border-left: 4px solid #28a745; }
        .recommendation { background: #d1ecf1; padding: 10px; margin: 5px 0; border-left: 4px solid #17a2b8; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #e9ecef; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>GPT-4 Code Analysis Report</h1>
        <p>Generated: $(Get-Date)</p>
    </div>
    
    <div class="section">
        <h2>Overview</h2>
        <p><strong>Quality Score:</strong> $($AnalysisResult.overview.quality_score)/100</p>
        <p><strong>Complexity:</strong> $($AnalysisResult.overview.complexity)</p>
        <p><strong>Maintainability:</strong> $($AnalysisResult.overview.maintainability)</p>
        <p><strong>Readability:</strong> $($AnalysisResult.overview.readability)</p>
    </div>
    
    <div class="section">
        <h2>Issues</h2>
        $(if ($AnalysisResult.issues) {
            $AnalysisResult.issues | ForEach-Object {
                "<div class='issue'><strong>$($_.type.ToUpper())</strong> (Line $($_.line)): $($_.message)<br><em>Suggestion: $($_.suggestion)</em></div>"
            }
        })
    </div>
    
    <div class="section">
        <h2>Strengths</h2>
        $(if ($AnalysisResult.strengths) {
            $AnalysisResult.strengths | ForEach-Object {
                "<div class='strength'>$_</div>"
            }
        })
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        $(if ($AnalysisResult.recommendations) {
            $AnalysisResult.recommendations | ForEach-Object {
                "<div class='recommendation'><strong>$($_.category.ToUpper())</strong> ($($_.priority)): $($_.description)<br><em>Implementation: $($_.implementation)</em></div>"
            }
        })
    </div>
    
    <div class="section">
        <h2>Metrics</h2>
        <div class="metric"><strong>Lines of Code:</strong> $($AnalysisResult.metrics.lines_of_code)</div>
        <div class="metric"><strong>Cyclomatic Complexity:</strong> $($AnalysisResult.metrics.cyclomatic_complexity)</div>
        <div class="metric"><strong>Cognitive Complexity:</strong> $($AnalysisResult.metrics.cognitive_complexity)</div>
        <div class="metric"><strong>Maintainability Index:</strong> $($AnalysisResult.metrics.maintainability_index)</div>
    </div>
</body>
</html>
"@
    
    return $Html
}

# Convert to text report
function ConvertTo-TextReport {
    param($AnalysisResult)
    
    $Report = @"
GPT-4 Code Analysis Report
==========================
Generated: $(Get-Date)

OVERVIEW
--------
Quality Score: $($AnalysisResult.overview.quality_score)/100
Complexity: $($AnalysisResult.overview.complexity)
Maintainability: $($AnalysisResult.overview.maintainability)
Readability: $($AnalysisResult.overview.readability)

ISSUES
------
$(if ($AnalysisResult.issues) {
    $AnalysisResult.issues | ForEach-Object {
        "$($_.type.ToUpper()) (Line $($_.line)): $($_.message)"
        "  Suggestion: $($_.suggestion)"
        ""
    }
})

STRENGTHS
---------
$(if ($AnalysisResult.strengths) {
    $AnalysisResult.strengths | ForEach-Object {
        "• $_"
    }
})

RECOMMENDATIONS
---------------
$(if ($AnalysisResult.recommendations) {
    $AnalysisResult.recommendations | ForEach-Object {
        "$($_.category.ToUpper()) ($($_.priority)): $($_.description)"
        "  Implementation: $($_.implementation)"
        ""
    }
})

METRICS
-------
Lines of Code: $($AnalysisResult.metrics.lines_of_code)
Cyclomatic Complexity: $($AnalysisResult.metrics.cyclomatic_complexity)
Cognitive Complexity: $($AnalysisResult.metrics.cognitive_complexity)
Maintainability Index: $($AnalysisResult.metrics.maintainability_index)
"@
    
    return $Report
}

# Main analysis function
function Start-GPT4CodeAnalysis {
    Write-Log "Starting GPT-4 Code Analysis"
    Write-Log "Code Path: $CodePath"
    Write-Log "Language: $Language"
    Write-Log "Analysis Type: $AnalysisType"
    
    # Validate API key
    if (-not (Test-ApiKey)) {
        return $null
    }
    
    # Get code files
    $CodeFiles = @()
    
    if (Test-Path $CodePath -PathType Leaf) {
        $CodeFiles += $CodePath
    }
    elseif (Test-Path $CodePath -PathType Container) {
        $Extensions = @("*.ps1", "*.py", "*.js", "*.ts", "*.cs", "*.java", "*.cpp", "*.c", "*.go", "*.rs", "*.php", "*.rb", "*.swift", "*.kt")
        
        foreach ($Ext in $Extensions) {
            $CodeFiles += Get-ChildItem -Path $CodePath -Filter $Ext -Recurse | Select-Object -ExpandProperty FullName
        }
    }
    else {
        Write-Log "Invalid code path: $CodePath" "ERROR"
        return $null
    }
    
    if ($CodeFiles.Count -eq 0) {
        Write-Log "No code files found in $CodePath" "WARNING"
        return $null
    }
    
    Write-Log "Found $($CodeFiles.Count) code files to analyze"
    
    $Results = @()
    
    foreach ($File in $CodeFiles) {
        Write-Log "Analyzing file: $File"
        
        $CodeInfo = Get-CodeContent -FilePath $File
        if (-not $CodeInfo) {
            continue
        }
        
        # Skip if language filter is specified
        if ($Language -ne "auto" -and $CodeInfo.Language -ne $Language) {
            continue
        }
        
        $Prompts = New-AnalysisPrompt -CodeContent $CodeInfo.Content -Language $CodeInfo.Language -AnalysisType $AnalysisType -FileName $CodeInfo.FileName
        
        $AnalysisResult = Invoke-GPT4Analysis -SystemPrompt $Prompts.SystemPrompt -UserPrompt $Prompts.UserPrompt
        
        if ($AnalysisResult) {
            $ProcessedResult = Process-AnalysisResults -AnalysisResult $AnalysisResult -OutputFormat $OutputFormat
            
            $FileResult = @{
                File = $File
                Language = $CodeInfo.Language
                Analysis = $ProcessedResult
                Timestamp = Get-Date
            }
            
            $Results += $FileResult
            
            # Save individual file analysis
            $OutputFile = "$PSScriptRoot\..\..\reports\gpt4-analysis-$(Get-Date -Format 'yyyyMMdd-HHmmss')-$($CodeInfo.FileName).$($OutputFormat)"
            $ProcessedResult | Out-File -FilePath $OutputFile -Encoding UTF8
            
            Write-Log "Analysis saved to: $OutputFile"
        }
        else {
            Write-Log "Failed to analyze file: $File" "WARNING"
        }
    }
    
    # Generate summary report
    $SummaryReport = @{
        TotalFiles = $CodeFiles.Count
        AnalyzedFiles = $Results.Count
        AnalysisResults = $Results
        GeneratedAt = Get-Date
        AnalysisType = $AnalysisType
    }
    
    $SummaryFile = "$PSScriptRoot\..\..\reports\gpt4-analysis-summary-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $SummaryReport | ConvertTo-Json -Depth 10 | Out-File -FilePath $SummaryFile -Encoding UTF8
    
    Write-Log "Summary report saved to: $SummaryFile"
    Write-Log "GPT-4 Code Analysis completed successfully"
    
    return $SummaryReport
}

# Main execution
try {
    # Create reports directory
    $ReportsDir = "$PSScriptRoot\..\..\reports"
    if (-not (Test-Path $ReportsDir)) {
        New-Item -Path $ReportsDir -ItemType Directory -Force | Out-Null
    }
    
    # Create logs directory
    $LogsDir = "$PSScriptRoot\..\..\logs"
    if (-not (Test-Path $LogsDir)) {
        New-Item -Path $LogsDir -ItemType Directory -Force | Out-Null
    }
    
    # Start analysis
    $Result = Start-GPT4CodeAnalysis
    
    if ($Result) {
        Write-Host "GPT-4 Code Analysis completed successfully!" -ForegroundColor Green
        Write-Host "Analyzed $($Result.AnalyzedFiles) out of $($Result.TotalFiles) files" -ForegroundColor Yellow
        Write-Host "Reports saved to: $PSScriptRoot\..\..\reports\" -ForegroundColor Cyan
    }
    else {
        Write-Host "GPT-4 Code Analysis failed!" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Log "Fatal error: $($_.Exception.Message)" "ERROR"
    Write-Host "Fatal error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

