# Claude-3 API Integration Service
# Centralized Claude-3 API management and integration
# Version: 2.5.0
# Author: Universal Automation Platform

param(
    [Parameter(Mandatory = $false)]
    [string]$Action = "status",
    
    [Parameter(Mandatory = $false)]
    [string]$ApiKey = $env:ANTHROPIC_API_KEY,
    
    [Parameter(Mandatory = $false)]
    [string]$Model = "claude-3-sonnet-20240229",
    
    [Parameter(Mandatory = $false)]
    [string]$Prompt = "",
    
    [Parameter(Mandatory = $false)]
    [int]$MaxTokens = 4000,
    
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = "",
    
    [Parameter(Mandatory = $false)]
    [switch]$Verbose
)

# Configuration
$Config = @{
    ApiEndpoint = "https://api.anthropic.com/v1/messages"
    Models = @{
        "claude-3-opus-20240229" = @{
            MaxTokens = 200000
            CostPerToken = 0.000015
            Description = "Most powerful Claude-3 model"
        }
        "claude-3-sonnet-20240229" = @{
            MaxTokens = 200000
            CostPerToken = 0.000003
            Description = "Balanced Claude-3 model"
        }
        "claude-3-haiku-20240307" = @{
            MaxTokens = 200000
            CostPerToken = 0.00000025
            Description = "Fastest Claude-3 model"
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
    $LogMessage = "[$Timestamp] [$Level] Claude3-API: $Message"
    
    if ($Verbose) {
        Write-Host $LogMessage
    }
    
    # Log to file
    $LogFile = "$PSScriptRoot\..\logs\claude3-api.log"
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
    
    if (-not $Key.StartsWith("sk-ant-")) {
        Write-Log "API key does not start with 'sk-ant-'" "WARNING"
    }
    
    return $true
}

# Test API connection
function Test-ApiConnection {
    param([string]$ApiKey)
    
    try {
        $Headers = @{
            "x-api-key" = $ApiKey
            "Content-Type" = "application/json"
            "anthropic-version" = "2023-06-01"
        }
        
        $Body = @{
            model = "claude-3-haiku-20240307"
            max_tokens = 10
            messages = @(
                @{
                    role = "user"
                    content = "Test connection"
                }
            )
        } | ConvertTo-Json -Depth 10
        
        Write-Log "Testing API connection..."
        
        $Response = Invoke-RestMethod -Uri $Config.ApiEndpoint -Method Post -Headers $Headers -Body $Body -TimeoutSec 10
        
        if ($Response.content -and $Response.content[0].text) {
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

# Call Claude-3 API
function Invoke-Claude3Call {
    param(
        [string]$ApiKey,
        [string]$Model,
        [string]$SystemPrompt = "",
        [string]$UserPrompt,
        [int]$MaxTokens
    )
    
    $Headers = @{
        "x-api-key" = $ApiKey
        "Content-Type" = "application/json"
        "anthropic-version" = "2023-06-01"
    }
    
    $Content = $UserPrompt
    if ($SystemPrompt) {
        $Content = "$SystemPrompt`n`n$UserPrompt"
    }
    
    $Body = @{
        model = $Model
        max_tokens = $MaxTokens
        messages = @(
            @{
                role = "user"
                content = $Content
            }
        )
    } | ConvertTo-Json -Depth 10
    
    $RetryCount = 0
    $MaxRetries = $Config.RetryAttempts
    
    do {
        try {
            Write-Log "Calling Claude-3 API (attempt $($RetryCount + 1))"
            
            $Response = Invoke-RestMethod -Uri $Config.ApiEndpoint -Method Post -Headers $Headers -Body $Body -TimeoutSec $Config.DefaultTimeout
            
            if ($Response.content -and $Response.content[0].text) {
                $Result = $Response.content[0].text
                Write-Log "API call successful"
                
                # Log usage information
                if ($Response.usage) {
                    Write-Log "Tokens used: $($Response.usage.input_tokens) input + $($Response.usage.output_tokens) output = $($Response.usage.input_tokens + $Response.usage.output_tokens) total"
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

# Generate documentation with Claude-3
function Generate-Documentation {
    param(
        [string]$CodeContent,
        [string]$Language = "auto",
        [string]$DocType = "comprehensive"
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
- Configuration options
- Dependencies
- Performance notes
- Security considerations
- Troubleshooting guide

Format the documentation in clean, professional markdown with proper headings, code blocks, and formatting.
"@

    $UserPrompt = @"
Please generate $DocType documentation for the following $Language code:

```$Language
$CodeContent
```

Make the documentation professional, comprehensive, and easy to understand.
"@

    $Result = Invoke-Claude3Call -ApiKey $ApiKey -Model $Model -SystemPrompt $SystemPrompt -UserPrompt $UserPrompt -MaxTokens $MaxTokens
    
    return $Result
}

# Generate user guides with Claude-3
function Generate-UserGuide {
    param(
        [string]$CodeContent,
        [string]$Language = "auto",
        [string]$GuideType = "tutorial"
    )
    
    $SystemPrompt = @"
You are an expert technical writer specializing in creating user guides and tutorials for $Language.
Generate a comprehensive $GuideType user guide for the provided code.

Create a step-by-step guide that includes:
- Introduction and overview
- Prerequisites and setup
- Installation instructions
- Basic usage examples
- Advanced features
- Common use cases
- Best practices
- Troubleshooting
- FAQ section

Make the guide beginner-friendly while also providing advanced information for experienced users.
"@

    $UserPrompt = @"
Please generate a $GuideType user guide for the following $Language code:

```$Language
$CodeContent
```

Create a comprehensive, easy-to-follow guide that will help users understand and use this code effectively.
"@

    $Result = Invoke-Claude3Call -ApiKey $ApiKey -Model $Model -SystemPrompt $SystemPrompt -UserPrompt $UserPrompt -MaxTokens $MaxTokens
    
    return $Result
}

# Generate API documentation with Claude-3
function Generate-ApiDocumentation {
    param(
        [string]$CodeContent,
        [string]$Language = "auto"
    )
    
    $SystemPrompt = @"
You are an expert API documentation specialist for $Language.
Generate comprehensive API documentation for the provided code.

Create detailed API documentation that includes:
- API overview and architecture
- Authentication and authorization
- Endpoints and methods
- Request/response schemas
- Status codes and error handling
- Rate limiting and quotas
- SDK examples in multiple languages
- Integration examples
- Webhook documentation
- Changelog and versioning

Format the documentation in OpenAPI/Swagger style with clear examples and schemas.
"@

    $UserPrompt = @"
Please generate comprehensive API documentation for the following $Language code:

```$Language
$CodeContent
```

Create professional API documentation that developers can use to integrate with this code.
"@

    $Result = Invoke-Claude3Call -ApiKey $ApiKey -Model $Model -SystemPrompt $SystemPrompt -UserPrompt $UserPrompt -MaxTokens $MaxTokens
    
    return $Result
}

# Generate technical documentation with Claude-3
function Generate-TechnicalDocumentation {
    param(
        [string]$CodeContent,
        [string]$Language = "auto"
    )
    
    $SystemPrompt = @"
You are an expert technical documentation specialist for $Language.
Generate comprehensive technical documentation for the provided code.

Create detailed technical documentation that includes:
- Architecture overview
- Design patterns and principles
- Data flow diagrams
- Database schema
- Configuration management
- Security implementation
- Performance considerations
- Scalability design
- Monitoring and logging
- Deployment procedures
- Maintenance guidelines

Format the documentation for technical audiences with diagrams, code examples, and detailed explanations.
"@

    $UserPrompt = @"
Please generate comprehensive technical documentation for the following $Language code:

```$Language
$CodeContent
```

Create detailed technical documentation that will help developers understand the architecture and implementation.
"@

    $Result = Invoke-Claude3Call -ApiKey $ApiKey -Model $Model -SystemPrompt $SystemPrompt -UserPrompt $UserPrompt -MaxTokens $MaxTokens
    
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
        $OutputPath = "$PSScriptRoot\..\reports\claude3-result-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
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
    Write-Log "Starting Claude-3 API Integration Service"
    
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
            Write-Host "Claude-3 API Integration Service Status" -ForegroundColor Cyan
            Write-Host "=========================================" -ForegroundColor Cyan
            
            $Status = Get-ApiStatus -ApiKey $ApiKey
            
            Write-Host "API Key Valid: $($Status.ApiKeyValid)" -ForegroundColor $(if ($Status.ApiKeyValid) { "Green" } else { "Red" })
            Write-Host "Connection Test: $($Status.ConnectionTest)" -ForegroundColor $(if ($Status.ConnectionTest) { "Green" } else { "Red" })
            Write-Host "Available Models: $($Status.AvailableModels -join ', ')" -ForegroundColor Yellow
            Write-Host "Last Check: $($Status.LastCheck)" -ForegroundColor Gray
        }
        
        "document" {
            if (-not $Prompt) {
                Write-Host "Error: Code content is required for documentation generation" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Generating documentation with Claude-3..." -ForegroundColor Yellow
            
            $Result = Generate-Documentation -CodeContent $Prompt -Language "auto" -DocType "comprehensive"
            
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
        
        "guide" {
            if (-not $Prompt) {
                Write-Host "Error: Code content is required for user guide generation" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Generating user guide with Claude-3..." -ForegroundColor Yellow
            
            $Result = Generate-UserGuide -CodeContent $Prompt -Language "auto" -GuideType "tutorial"
            
            if ($Result.Success) {
                Write-Host "User guide generated successfully!" -ForegroundColor Green
                Write-Host $Result.Content
                
                if ($OutputPath) {
                    Save-Result -Result $Result -OutputPath $OutputPath
                }
            }
            else {
                Write-Host "User guide generation failed: $($Result.Error)" -ForegroundColor Red
                exit 1
            }
        }
        
        "api" {
            if (-not $Prompt) {
                Write-Host "Error: Code content is required for API documentation generation" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Generating API documentation with Claude-3..." -ForegroundColor Yellow
            
            $Result = Generate-ApiDocumentation -CodeContent $Prompt -Language "auto"
            
            if ($Result.Success) {
                Write-Host "API documentation generated successfully!" -ForegroundColor Green
                Write-Host $Result.Content
                
                if ($OutputPath) {
                    Save-Result -Result $Result -OutputPath $OutputPath
                }
            }
            else {
                Write-Host "API documentation generation failed: $($Result.Error)" -ForegroundColor Red
                exit 1
            }
        }
        
        "technical" {
            if (-not $Prompt) {
                Write-Host "Error: Code content is required for technical documentation generation" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Generating technical documentation with Claude-3..." -ForegroundColor Yellow
            
            $Result = Generate-TechnicalDocumentation -CodeContent $Prompt -Language "auto"
            
            if ($Result.Success) {
                Write-Host "Technical documentation generated successfully!" -ForegroundColor Green
                Write-Host $Result.Content
                
                if ($OutputPath) {
                    Save-Result -Result $Result -OutputPath $OutputPath
                }
            }
            else {
                Write-Host "Technical documentation generation failed: $($Result.Error)" -ForegroundColor Red
                exit 1
            }
        }
        
        "call" {
            if (-not $Prompt) {
                Write-Host "Error: Prompt is required for API call" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Calling Claude-3 API..." -ForegroundColor Yellow
            
            $Result = Invoke-Claude3Call -ApiKey $ApiKey -Model $Model -UserPrompt $Prompt -MaxTokens $MaxTokens
            
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
            Write-Host "Claude-3 API Integration Service" -ForegroundColor Cyan
            Write-Host "Usage: .\claude3-api-integration.ps1 -Action <action> [options]" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Actions:" -ForegroundColor Yellow
            Write-Host "  status     - Check API status and connection" -ForegroundColor White
            Write-Host "  document   - Generate comprehensive documentation" -ForegroundColor White
            Write-Host "  guide      - Generate user guide/tutorial" -ForegroundColor White
            Write-Host "  api        - Generate API documentation" -ForegroundColor White
            Write-Host "  technical  - Generate technical documentation" -ForegroundColor White
            Write-Host "  call       - Make direct API call" -ForegroundColor White
            Write-Host ""
            Write-Host "Options:" -ForegroundColor Yellow
            Write-Host "  -ApiKey      - Anthropic API key (or set ANTHROPIC_API_KEY env var)" -ForegroundColor White
            Write-Host "  -Model       - Claude model to use (default: claude-3-sonnet-20240229)" -ForegroundColor White
            Write-Host "  -Prompt      - Input prompt or code content" -ForegroundColor White
            Write-Host "  -MaxTokens   - Maximum tokens to generate (default: 4000)" -ForegroundColor White
            Write-Host "  -OutputPath  - Output file path" -ForegroundColor White
            Write-Host "  -Verbose     - Enable verbose logging" -ForegroundColor White
        }
    }
    
    Write-Log "Claude-3 API Integration Service completed"
}
catch {
    Write-Log "Fatal error: $($_.Exception.Message)" "ERROR"
    Write-Host "Fatal error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
