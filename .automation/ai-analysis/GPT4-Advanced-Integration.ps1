# GPT-4 Advanced Integration Script v2.5
# Advanced code analysis with GPT-4 integration

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$AnalysisType = "comprehensive",
    
    [Parameter(Mandatory=$false)]
    [string]$Language = "auto",
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableOptimization,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# GPT-4 Configuration
$GPT4Config = @{
    Model = "gpt-4"
    Temperature = 0.1
    MaxTokens = 4000
    TopP = 0.9
    FrequencyPenalty = 0.0
    PresencePenalty = 0.0
}

# API Configuration
$APIConfig = @{
    BaseURL = "https://api.openai.com/v1"
    Timeout = 300
    RetryAttempts = 3
    RetryDelay = 1000
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    if ($Verbose) {
        Write-Host $logMessage
    }
    
    # Log to file
    $logFile = Join-Path $ProjectPath "logs\gpt4-integration.log"
    $logDir = Split-Path $logFile -Parent
    if (!(Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    Add-Content -Path $logFile -Value $logMessage
}

function Get-APIKey {
    # Try to get API key from environment variables
    $apiKey = $env:OPENAI_API_KEY
    
    if (!$apiKey) {
        # Try to get from config file
        $configFile = Join-Path $ProjectPath ".env"
        if (Test-Path $configFile) {
            $config = Get-Content $configFile | Where-Object { $_ -match "^OPENAI_API_KEY=" }
            if ($config) {
                $apiKey = $config.Split("=")[1].Trim()
            }
        }
    }
    
    if (!$apiKey) {
        throw "OpenAI API key not found. Please set OPENAI_API_KEY environment variable or add it to .env file."
    }
    
    return $apiKey
}

function Invoke-GPT4Request {
    param(
        [string]$Prompt,
        [hashtable]$Config = $GPT4Config
    )
    
    try {
        $apiKey = Get-APIKey
        
        $headers = @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type" = "application/json"
        }
        
        $body = @{
            model = $Config.Model
            messages = @(
                @{
                    role = "system"
                    content = "You are an expert code analyst and software architect. Provide detailed, actionable analysis and recommendations."
                },
                @{
                    role = "user"
                    content = $Prompt
                }
            )
            temperature = $Config.Temperature
            max_tokens = $Config.MaxTokens
            top_p = $Config.TopP
            frequency_penalty = $Config.FrequencyPenalty
            presence_penalty = $Config.PresencePenalty
        } | ConvertTo-Json -Depth 10
        
        Write-Log "Sending request to GPT-4 API" "DEBUG"
        
        $response = Invoke-RestMethod -Uri "$($APIConfig.BaseURL)/chat/completions" -Method Post -Headers $headers -Body $body -TimeoutSec $APIConfig.Timeout
        
        return $response.choices[0].message.content
        
    } catch {
        Write-Log "Error calling GPT-4 API: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Analyze-CodeStructure {
    param(
        [string]$ProjectPath
    )
    
    Write-Log "Analyzing code structure for project: $ProjectPath"
    
    # Get project files
    $files = Get-ChildItem -Path $ProjectPath -Recurse -Include "*.ps1", "*.js", "*.ts", "*.py", "*.cs", "*.java", "*.go", "*.rs", "*.php" | Where-Object { $_.FullName -notmatch "node_modules|\.git|\.vs|bin|obj" }
    
    $codeAnalysis = @{
        TotalFiles = $files.Count
        Languages = @{}
        FileSizes = @()
        Complexity = @{}
        Dependencies = @()
        Architecture = @{}
    }
    
    foreach ($file in $files) {
        $extension = $file.Extension.ToLower()
        $language = switch ($extension) {
            ".ps1" { "PowerShell" }
            ".js" { "JavaScript" }
            ".ts" { "TypeScript" }
            ".py" { "Python" }
            ".cs" { "C#" }
            ".java" { "Java" }
            ".go" { "Go" }
            ".rs" { "Rust" }
            ".php" { "PHP" }
            default { "Unknown" }
        }
        
        if ($codeAnalysis.Languages.ContainsKey($language)) {
            $codeAnalysis.Languages[$language]++
        } else {
            $codeAnalysis.Languages[$language] = 1
        }
        
        $codeAnalysis.FileSizes += $file.Length
        
        # Analyze file content
        try {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if ($content) {
                $lines = $content.Split("`n").Count
                $codeAnalysis.Complexity[$file.Name] = @{
                    Lines = $lines
                    Size = $file.Length
                    Language = $language
                }
            }
        } catch {
            Write-Log "Error reading file $($file.FullName): $($_.Exception.Message)" "WARNING"
        }
    }
    
    return $codeAnalysis
}

function Get-ProjectInsights {
    param(
        [hashtable]$CodeAnalysis
    )
    
    $prompt = @"
Analyze this project structure and provide detailed insights:

Project Statistics:
- Total Files: $($CodeAnalysis.TotalFiles)
- Languages: $($CodeAnalysis.Languages | ConvertTo-Json -Compress)
- Average File Size: $([math]::Round(($CodeAnalysis.FileSizes | Measure-Object -Average).Average, 2)) bytes

Please provide:
1. Architecture assessment and recommendations
2. Code quality analysis
3. Performance optimization suggestions
4. Security considerations
5. Best practices recommendations
6. Technology stack evaluation
7. Scalability considerations
8. Maintenance recommendations

Format the response as a structured analysis with clear sections and actionable recommendations.
"@
    
    return Invoke-GPT4Request -Prompt $prompt
}

function Analyze-CodeQuality {
    param(
        [string]$ProjectPath,
        [string]$Language = "auto"
    )
    
    Write-Log "Analyzing code quality for language: $Language"
    
    $files = Get-ChildItem -Path $ProjectPath -Recurse -Include "*.ps1", "*.js", "*.ts", "*.py", "*.cs", "*.java", "*.go", "*.rs", "*.php" | Where-Object { $_.FullName -notmatch "node_modules|\.git|\.vs|bin|obj" }
    
    $qualityIssues = @()
    $bestPractices = @()
    
    foreach ($file in $files) {
        try {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if ($content) {
                $prompt = @"
Analyze this code file for quality issues and best practices:

File: $($file.Name)
Language: $($file.Extension)
Content:
```
$($content.Substring(0, [Math]::Min($content.Length, 2000)))
```

Please identify:
1. Code quality issues
2. Security vulnerabilities
3. Performance problems
4. Best practices violations
5. Refactoring opportunities
6. Documentation needs

Provide specific, actionable recommendations.
"@
                
                $analysis = Invoke-GPT4Request -Prompt $prompt
                $qualityIssues += @{
                    File = $file.Name
                    Analysis = $analysis
                }
            }
        } catch {
            Write-Log "Error analyzing file $($file.FullName): $($_.Exception.Message)" "WARNING"
        }
    }
    
    return @{
        QualityIssues = $qualityIssues
        BestPractices = $bestPractices
    }
}

function Generate-OptimizationRecommendations {
    param(
        [hashtable]$CodeAnalysis,
        [hashtable]$QualityAnalysis
    )
    
    $prompt = @"
Based on the code analysis, provide optimization recommendations:

Code Analysis:
$($CodeAnalysis | ConvertTo-Json -Depth 3)

Quality Analysis:
$($QualityAnalysis | ConvertTo-Json -Depth 3)

Please provide:
1. Performance optimization strategies
2. Memory usage improvements
3. Code structure optimizations
4. Build process improvements
5. Testing strategy enhancements
6. Security hardening recommendations
7. Scalability improvements
8. Maintenance optimizations

Format as actionable recommendations with priority levels.
"@
    
    return Invoke-GPT4Request -Prompt $prompt
}

function Generate-Report {
    param(
        [hashtable]$CodeAnalysis,
        [hashtable]$QualityAnalysis,
        [string]$Insights,
        [string]$Optimizations
    )
    
    $reportPath = Join-Path $ProjectPath "reports\gpt4-analysis-report-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').md"
    $reportDir = Split-Path $reportPath -Parent
    
    if (!(Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }
    
    $report = @"
# GPT-4 Advanced Code Analysis Report

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Project**: $ProjectPath
**Analysis Type**: $AnalysisType

## Executive Summary

This report contains a comprehensive analysis of the project codebase using GPT-4 advanced AI capabilities.

## Project Statistics

- **Total Files**: $($CodeAnalysis.TotalFiles)
- **Languages**: $($CodeAnalysis.Languages | ConvertTo-Json -Compress)
- **Average File Size**: $([math]::Round(($CodeAnalysis.FileSizes | Measure-Object -Average).Average, 2)) bytes

## Architecture Insights

$Insights

## Code Quality Analysis

$($QualityAnalysis | ConvertTo-Json -Depth 3)

## Optimization Recommendations

$Optimizations

## Next Steps

1. Review and prioritize recommendations
2. Implement high-priority optimizations
3. Schedule regular code quality reviews
4. Monitor performance improvements
5. Update documentation

---
*Report generated by GPT-4 Advanced Integration Script v2.5*
"@
    
    Set-Content -Path $reportPath -Value $report -Encoding UTF8
    Write-Log "Report generated: $reportPath"
    
    return $reportPath
}

# Main execution
try {
    Write-Log "Starting GPT-4 Advanced Integration Analysis" "INFO"
    
    # Analyze code structure
    $codeAnalysis = Analyze-CodeStructure -ProjectPath $ProjectPath
    
    # Get project insights
    $insights = Get-ProjectInsights -CodeAnalysis $codeAnalysis
    
    # Analyze code quality
    $qualityAnalysis = Analyze-CodeQuality -ProjectPath $ProjectPath -Language $Language
    
    # Generate optimization recommendations
    $optimizations = Generate-OptimizationRecommendations -CodeAnalysis $codeAnalysis -QualityAnalysis $qualityAnalysis
    
    # Generate report if requested
    if ($GenerateReport) {
        $reportPath = Generate-Report -CodeAnalysis $codeAnalysis -QualityAnalysis $qualityAnalysis -Insights $insights -Optimizations $optimizations
        Write-Host "Analysis complete. Report saved to: $reportPath" -ForegroundColor Green
    } else {
        Write-Host "Analysis complete. Insights:" -ForegroundColor Green
        Write-Host $insights
    }
    
    Write-Log "GPT-4 Advanced Integration Analysis completed successfully" "INFO"
    
} catch {
    Write-Log "Error during GPT-4 analysis: $($_.Exception.Message)" "ERROR"
    throw
}
