# GPT-4 API Integration Service
# Centralized GPT-4 API management and integration
# Version: 2.5.0
# Author: Universal Automation Platform

param(
    [Parameter(Mandatory = $false)]
    [string]$Action = "status",
    
    [Parameter(Mandatory = $false)]
    [string]$ApiKey = $env:OPENAI_API_KEY,
    
    [Parameter(Mandatory = $false)]
    [string]$Model = "gpt-4",
    
    [Parameter(Mandatory = $false)]
    [string]$Prompt = "",
    
    [Parameter(Mandatory = $false)]
    [int]$MaxTokens = 4000,
    
    [Parameter(Mandatory = $false)]
    [double]$Temperature = 0.1,
    
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = "",
    
    [Parameter(Mandatory = $false)]
    [switch]$Verbose
)

# Configuration
$Config = @{
    ApiEndpoint = "https://api.openai.com/v1/chat/completions"
    Models = @{
        "gpt-4" = @{
            MaxTokens = 8192
            CostPerToken = 0.00003
            Description = "Most capable GPT-4 model"
        }
        "gpt-4-turbo" = @{
            MaxTokens = 128000
            CostPerToken = 0.00001
            Description = "Faster and cheaper GPT-4 model"
        }
        "gpt-3.5-turbo" = @{
            MaxTokens = 16384
            CostPerToken = 0.000002
            Description = "Fast and cost-effective model"
        }
    }
    DefaultTimeout = 60
    RetryAttempts = 3
    RateLimitDelay = 1
}

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] GPT4-API: $Message"
    
    if ($Verbose) {
        Write-Host $LogMessage
    }
    
    # Log to file
    $LogFile = "$PSScriptRoot\..\logs\gpt4-api.log"
    Add-Content -Path $LogFile -Value $LogMessage -ErrorAction SilentlyContinue
}

# Validate API key
function Test-ApiKey {
    param([string]$Key)
    
    if (-not $Key) {
        Write-Log "API key not provided" "ERROR"
        return $false
    }
    
    if ($Key.Length -lt 20) {
        Write-Log "Invalid API key format" "ERROR"
        return $false
    }
    
    if (-not $Key.StartsWith("sk-")) {
        Write-Log "API key does not start with 'sk-'" "WARNING"
    }
    
    return $true
}

# Test API connection
function Test-ApiConnection {
    param([string]$ApiKey)
    
    try {
        $Headers = @{
            "Authorization" = "Bearer $ApiKey"
            "Content-Type" = "application/json"
        }
        
        $Body = @{
            model = "gpt-3.5-turbo"
            messages = @(
                @{
                    role = "user"
                    content = "Test connection"
                }
            )
            max_tokens = 10
        } | ConvertTo-Json -Depth 10
        
        Write-Log "Testing API connection..."
        
        $Response = Invoke-RestMethod -Uri $Config.ApiEndpoint -Method Post -Headers $Headers -Body $Body -TimeoutSec 10
        
        if ($Response.choices) {
            Write-Log "API connection successful" "SUCCESS"
            return $true
        }
        else {
            Write-Log "Unexpected API response" "WARNING"
            return $false
        }
    }
    catch {
        Write-Log "API connection failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Get model information
function Get-ModelInfo {
    param([string]$ModelName)
    
    if ($Config.Models.ContainsKey($ModelName)) {
        return $Config.Models[$ModelName]
    }
    else {
        Write-Log "Unknown model: $ModelName" "WARNING"
        return $null
    }
}

# Call GPT-4 API
function Invoke-GPT4Call {
    param(
        [string]$ApiKey,
        [string]$Model,
        [string]$SystemPrompt = "",
        [string]$UserPrompt,
        [int]$MaxTokens,
        [double]$Temperature
    )
    
    $Headers = @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    }
    
    $Messages = @()
    
    if ($SystemPrompt) {
        $Messages += @{
            role = "system"
            content = $SystemPrompt
        }
    }
    
    $Messages += @{
        role = "user"
        content = $UserPrompt
    }
    
    $Body = @{
        model = $Model
        messages = $Messages
        max_tokens = $MaxTokens
        temperature = $Temperature
    } | ConvertTo-Json -Depth 10
    
    $RetryCount = 0
    $MaxRetries = $Config.RetryAttempts
    
    do {
        try {
            Write-Log "Calling GPT-4 API (attempt $($RetryCount + 1))"
            
            $Response = Invoke-RestMethod -Uri $Config.ApiEndpoint -Method Post -Headers $Headers -Body $Body -TimeoutSec $Config.DefaultTimeout
            
            if ($Response.choices -and $Response.choices[0].message.content) {
                $Result = $Response.choices[0].message.content
                Write-Log "API call successful"
                
                # Log usage information
                if ($Response.usage) {
                    Write-Log "Tokens used: $($Response.usage.total_tokens) (prompt: $($Response.usage.prompt_tokens), completion: $($Response.usage.completion_tokens))"
                }
                
                return @{
                    Success = $true
                    Content = $Result
                    Usage = $Response.usage
                    Model = $Response.model
                }
            }
            else {
                Write-Log "Unexpected API response format" "WARNING"
                return @{
                    Success = $false
                    Error = "Unexpected response format"
                }
            }
        }
        catch {
            $RetryCount++
            $ErrorMessage = $_.Exception.Message
            
            Write-Log "API call failed (attempt $RetryCount): $ErrorMessage" "WARNING"
            
            if ($RetryCount -ge $MaxRetries) {
                Write-Log "Max retry attempts reached" "ERROR"
                return @{
                    Success = $false
                    Error = $ErrorMessage
                }
            }
            
            # Rate limiting handling
            if ($ErrorMessage -like "*rate limit*" -or $ErrorMessage -like "*429*") {
                $DelayTime = $Config.RateLimitDelay * [Math]::Pow(2, $RetryCount)
                Write-Log "Rate limited, waiting $DelayTime seconds..."
                Start-Sleep -Seconds $DelayTime
            }
            else {
                Start-Sleep -Seconds (2 * $RetryCount) # Exponential backoff
            }
        }
    } while ($RetryCount -lt $MaxRetries)
    
    return @{
        Success = $false
        Error = "Max retries exceeded"
    }
}

# Analyze code with GPT-4
function Analyze-Code {
    param(
        [string]$CodeContent,
        [string]$Language = "auto",
        [string]$AnalysisType = "comprehensive"
    )
    
    $SystemPrompt = @"
You are an expert code analyst with deep knowledge of $Language and software engineering best practices.
Analyze the provided code and provide comprehensive insights focusing on $AnalysisType aspects.

Provide your analysis in JSON format with the following structure:
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
    "strengths": ["positive aspect 1", "positive aspect 2"],
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

    $Result = Invoke-GPT4Call -ApiKey $ApiKey -Model $Model -SystemPrompt $SystemPrompt -UserPrompt $UserPrompt -MaxTokens $MaxTokens -Temperature $Temperature
    
    return $Result
}

# Generate documentation with GPT-4
function Generate-Documentation {
    param(
        [string]$CodeContent,
        [string]$Language = "auto",
        [string]$DocType = "api"
    )
    
    $SystemPrompt = @"
You are an expert technical writer specializing in $Language documentation.
Generate comprehensive $DocType documentation for the provided code.

Create clear, concise, and well-structured documentation that includes:
- Overview and purpose
- Function/class descriptions
- Parameter documentation
- Usage examples
- Return value descriptions
- Error handling information
"@

    $UserPrompt = @"
Please generate $DocType documentation for the following $Language code:

```$Language
$CodeContent
```

Make the documentation professional and easy to understand.
"@

    $Result = Invoke-GPT4Call -ApiKey $ApiKey -Model $Model -SystemPrompt $SystemPrompt -UserPrompt $UserPrompt -MaxTokens $MaxTokens -Temperature $Temperature
    
    return $Result
}

# Generate tests with GPT-4
function Generate-Tests {
    param(
        [string]$CodeContent,
        [string]$Language = "auto",
        [string]$TestFramework = "auto"
    )
    
    $SystemPrompt = @"
You are an expert test engineer specializing in $Language testing.
Generate comprehensive unit tests for the provided code using $TestFramework.

Create tests that cover:
- Happy path scenarios
- Edge cases
- Error conditions
- Boundary values
- Integration points

Use appropriate testing patterns and best practices for $Language.
"@

    $UserPrompt = @"
Please generate unit tests for the following $Language code:

```$Language
$CodeContent
```

Use $TestFramework and follow $Language testing best practices.
"@

    $Result = Invoke-GPT4Call -ApiKey $ApiKey -Model $Model -SystemPrompt $SystemPrompt -UserPrompt $UserPrompt -MaxTokens $MaxTokens -Temperature $Temperature
    
    return $Result
}

# Optimize code with GPT-4
function Optimize-Code {
    param(
        [string]$CodeContent,
        [string]$Language = "auto",
        [string]$OptimizationType = "performance"
    )
    
    $SystemPrompt = @"
You are an expert code optimizer specializing in $Language.
Optimize the provided code focusing on $OptimizationType improvements.

Provide:
1. Original code analysis
2. Optimized code
3. Explanation of optimizations
4. Performance impact assessment
5. Best practices applied
"@

    $UserPrompt = @"
Please optimize the following $Language code for $OptimizationType:

```$Language
$CodeContent
```

Provide the optimized version with detailed explanations.
"@

    $Result = Invoke-GPT4Call -ApiKey $ApiKey -Model $Model -SystemPrompt $SystemPrompt -UserPrompt $UserPrompt -MaxTokens $MaxTokens -Temperature $Temperature
    
    return $Result
}

# Get API status
function Get-ApiStatus {
    param([string]$ApiKey)
    
    $Status = @{
        ApiKeyValid = Test-ApiKey -Key $ApiKey
        ConnectionTest = $false
        AvailableModels = $Config.Models.Keys
        RateLimit = "Unknown"
        LastCheck = Get-Date
    }
    
    if ($Status.ApiKeyValid) {
        $Status.ConnectionTest = Test-ApiConnection -ApiKey $ApiKey
    }
    
    return $Status
}

# Save result to file
function Save-Result {
    param(
        [object]$Result,
        [string]$OutputPath
    )
    
    if (-not $OutputPath) {
        $OutputPath = "$PSScriptRoot\..\reports\gpt4-result-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    }
    
    try {
        $Result | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputPath -Encoding UTF8
        Write-Log "Result saved to: $OutputPath"
        return $true
    }
    catch {
        Write-Log "Failed to save result: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Main execution
try {
    Write-Log "Starting GPT-4 API Integration Service"
    
    # Create logs directory
    $LogsDir = "$PSScriptRoot\..\logs"
    if (-not (Test-Path $LogsDir)) {
        New-Item -Path $LogsDir -ItemType Directory -Force | Out-Null
    }
    
    # Create reports directory
    $ReportsDir = "$PSScriptRoot\..\reports"
    if (-not (Test-Path $ReportsDir)) {
        New-Item -Path $ReportsDir -ItemType Directory -Force | Out-Null
    }
    
    switch ($Action.ToLower()) {
        "status" {
            Write-Host "GPT-4 API Integration Service Status" -ForegroundColor Cyan
            Write-Host "=====================================" -ForegroundColor Cyan
            
            $Status = Get-ApiStatus -ApiKey $ApiKey
            
            Write-Host "API Key Valid: $($Status.ApiKeyValid)" -ForegroundColor $(if ($Status.ApiKeyValid) { "Green" } else { "Red" })
            Write-Host "Connection Test: $($Status.ConnectionTest)" -ForegroundColor $(if ($Status.ConnectionTest) { "Green" } else { "Red" })
            Write-Host "Available Models: $($Status.AvailableModels -join ', ')" -ForegroundColor Yellow
            Write-Host "Last Check: $($Status.LastCheck)" -ForegroundColor Gray
        }
        
        "analyze" {
            if (-not $Prompt) {
                Write-Host "Error: Prompt is required for analysis" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Analyzing code with GPT-4..." -ForegroundColor Yellow
            
            $Result = Analyze-Code -CodeContent $Prompt -Language "auto" -AnalysisType "comprehensive"
            
            if ($Result.Success) {
                Write-Host "Analysis completed successfully!" -ForegroundColor Green
                Write-Host $Result.Content
                
                if ($OutputPath) {
                    Save-Result -Result $Result -OutputPath $OutputPath
                }
            }
            else {
                Write-Host "Analysis failed: $($Result.Error)" -ForegroundColor Red
                exit 1
            }
        }
        
        "document" {
            if (-not $Prompt) {
                Write-Host "Error: Code content is required for documentation generation" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Generating documentation with GPT-4..." -ForegroundColor Yellow
            
            $Result = Generate-Documentation -CodeContent $Prompt -Language "auto" -DocType "api"
            
            if ($Result.Success) {
                Write-Host "Documentation generated successfully!" -ForegroundColor Green
                Write-Host $Result.Content
                
                if ($OutputPath) {
                    Save-Result -Result $Result -OutputPath $OutputPath
                }
            }
            else {
                Write-Host "Documentation generation failed: $($Result.Error)" -ForegroundColor Red
                exit 1
            }
        }
        
        "test" {
            if (-not $Prompt) {
                Write-Host "Error: Code content is required for test generation" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Generating tests with GPT-4..." -ForegroundColor Yellow
            
            $Result = Generate-Tests -CodeContent $Prompt -Language "auto" -TestFramework "auto"
            
            if ($Result.Success) {
                Write-Host "Tests generated successfully!" -ForegroundColor Green
                Write-Host $Result.Content
                
                if ($OutputPath) {
                    Save-Result -Result $Result -OutputPath $OutputPath
                }
            }
            else {
                Write-Host "Test generation failed: $($Result.Error)" -ForegroundColor Red
                exit 1
            }
        }
        
        "optimize" {
            if (-not $Prompt) {
                Write-Host "Error: Code content is required for optimization" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Optimizing code with GPT-4..." -ForegroundColor Yellow
            
            $Result = Optimize-Code -CodeContent $Prompt -Language "auto" -OptimizationType "performance"
            
            if ($Result.Success) {
                Write-Host "Code optimization completed successfully!" -ForegroundColor Green
                Write-Host $Result.Content
                
                if ($OutputPath) {
                    Save-Result -Result $Result -OutputPath $OutputPath
                }
            }
            else {
                Write-Host "Code optimization failed: $($Result.Error)" -ForegroundColor Red
                exit 1
            }
        }
        
        "call" {
            if (-not $Prompt) {
                Write-Host "Error: Prompt is required for API call" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Calling GPT-4 API..." -ForegroundColor Yellow
            
            $Result = Invoke-GPT4Call -ApiKey $ApiKey -Model $Model -UserPrompt $Prompt -MaxTokens $MaxTokens -Temperature $Temperature
            
            if ($Result.Success) {
                Write-Host "API call successful!" -ForegroundColor Green
                Write-Host $Result.Content
                
                if ($OutputPath) {
                    Save-Result -Result $Result -OutputPath $OutputPath
                }
            }
            else {
                Write-Host "API call failed: $($Result.Error)" -ForegroundColor Red
                exit 1
            }
        }
        
        default {
            Write-Host "GPT-4 API Integration Service" -ForegroundColor Cyan
            Write-Host "Usage: .\gpt4-api-integration.ps1 -Action <action> [options]" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Actions:" -ForegroundColor Yellow
            Write-Host "  status     - Check API status and connection" -ForegroundColor White
            Write-Host "  analyze    - Analyze code with GPT-4" -ForegroundColor White
            Write-Host "  document   - Generate documentation with GPT-4" -ForegroundColor White
            Write-Host "  test       - Generate tests with GPT-4" -ForegroundColor White
            Write-Host "  optimize   - Optimize code with GPT-4" -ForegroundColor White
            Write-Host "  call       - Make direct API call" -ForegroundColor White
            Write-Host ""
            Write-Host "Options:" -ForegroundColor Yellow
            Write-Host "  -ApiKey      - OpenAI API key (or set OPENAI_API_KEY env var)" -ForegroundColor White
            Write-Host "  -Model       - GPT model to use (default: gpt-4)" -ForegroundColor White
            Write-Host "  -Prompt      - Input prompt or code content" -ForegroundColor White
            Write-Host "  -MaxTokens   - Maximum tokens to generate (default: 4000)" -ForegroundColor White
            Write-Host "  -Temperature - Response randomness (default: 0.1)" -ForegroundColor White
            Write-Host "  -OutputPath  - Output file path" -ForegroundColor White
            Write-Host "  -Verbose     - Enable verbose logging" -ForegroundColor White
        }
    }
    
    Write-Log "GPT-4 API Integration Service completed"
}
catch {
    Write-Log "Fatal error: $($_.Exception.Message)" "ERROR"
    Write-Host "Fatal error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

