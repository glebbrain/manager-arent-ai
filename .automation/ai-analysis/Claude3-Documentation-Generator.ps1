# Claude-3 Documentation Generator Script v2.5
# Advanced documentation generation with Claude-3 integration

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$DocumentationType = "comprehensive",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFormat = "markdown",
    
    [Parameter(Mandatory=$false)]
    [string]$Language = "auto",
    
    [Parameter(Mandatory=$false)]
    [switch]$IncludeCodeExamples,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateAPI,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateUserGuide,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Claude-3 Configuration
$Claude3Config = @{
    Model = "claude-3-sonnet-20240229"
    Temperature = 0.2
    MaxTokens = 4000
    TopP = 0.9
}

# API Configuration
$APIConfig = @{
    BaseURL = "https://api.anthropic.com/v1"
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
    $logFile = Join-Path $ProjectPath "logs\claude3-documentation.log"
    $logDir = Split-Path $logFile -Parent
    if (!(Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    Add-Content -Path $logFile -Value $logMessage
}

function Get-APIKey {
    # Try to get API key from environment variables
    $apiKey = $env:ANTHROPIC_API_KEY
    
    if (!$apiKey) {
        # Try to get from config file
        $configFile = Join-Path $ProjectPath ".env"
        if (Test-Path $configFile) {
            $config = Get-Content $configFile | Where-Object { $_ -match "^ANTHROPIC_API_KEY=" }
            if ($config) {
                $apiKey = $config.Split("=")[1].Trim()
            }
        }
    }
    
    if (!$apiKey) {
        throw "Anthropic API key not found. Please set ANTHROPIC_API_KEY environment variable or add it to .env file."
    }
    
    return $apiKey
}

function Invoke-Claude3Request {
    param(
        [string]$Prompt,
        [hashtable]$Config = $Claude3Config
    )
    
    try {
        $apiKey = Get-APIKey
        
        $headers = @{
            "x-api-key" = $apiKey
            "Content-Type" = "application/json"
            "anthropic-version" = "2023-06-01"
        }
        
        $body = @{
            model = $Config.Model
            max_tokens = $Config.MaxTokens
            temperature = $Config.Temperature
            top_p = $Config.TopP
            messages = @(
                @{
                    role = "user"
                    content = $Prompt
                }
            )
        } | ConvertTo-Json -Depth 10
        
        Write-Log "Sending request to Claude-3 API" "DEBUG"
        
        $response = Invoke-RestMethod -Uri "$($APIConfig.BaseURL)/messages" -Method Post -Headers $headers -Body $body -TimeoutSec $APIConfig.Timeout
        
        return $response.content[0].text
        
    } catch {
        Write-Log "Error calling Claude-3 API: $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Analyze-ProjectStructure {
    param(
        [string]$ProjectPath
    )
    
    Write-Log "Analyzing project structure for documentation generation"
    
    $projectInfo = @{
        Name = Split-Path $ProjectPath -Leaf
        Path = $ProjectPath
        Files = @()
        Directories = @()
        ConfigFiles = @()
        Documentation = @()
        CodeFiles = @()
    }
    
    # Get all files and directories
    $items = Get-ChildItem -Path $ProjectPath -Recurse | Where-Object { $_.FullName -notmatch "node_modules|\.git|\.vs|bin|obj|logs" }
    
    foreach ($item in $items) {
        if ($item.PSIsContainer) {
            $projectInfo.Directories += $item.Name
        } else {
            $projectInfo.Files += @{
                Name = $item.Name
                Extension = $item.Extension
                Size = $item.Length
                Path = $item.FullName.Replace($ProjectPath, "").TrimStart("\")
            }
            
            # Categorize files
            if ($item.Extension -in @(".json", ".yaml", ".yml", ".xml", ".config")) {
                $projectInfo.ConfigFiles += $item.Name
            } elseif ($item.Extension -in @(".md", ".txt", ".rst")) {
                $projectInfo.Documentation += $item.Name
            } elseif ($item.Extension -in @(".ps1", ".js", ".ts", ".py", ".cs", ".java", ".go", ".rs", ".php")) {
                $projectInfo.CodeFiles += $item.Name
            }
        }
    }
    
    return $projectInfo
}

function Generate-ProjectOverview {
    param(
        [hashtable]$ProjectInfo
    )
    
    $prompt = @"
Generate a comprehensive project overview documentation for this project:

Project Name: $($ProjectInfo.Name)
Project Path: $($ProjectInfo.Path)

Project Structure:
- Total Files: $($ProjectInfo.Files.Count)
- Total Directories: $($ProjectInfo.Directories.Count)
- Configuration Files: $($ProjectInfo.ConfigFiles -join ", ")
- Existing Documentation: $($ProjectInfo.Documentation -join ", ")
- Code Files: $($ProjectInfo.CodeFiles.Count)

Please generate:
1. Project Overview and Description
2. Architecture Overview
3. Technology Stack Analysis
4. Key Features and Capabilities
5. Installation and Setup Instructions
6. Usage Examples
7. API Documentation (if applicable)
8. Configuration Guide
9. Troubleshooting Guide
10. Contributing Guidelines

Format the output as comprehensive markdown documentation with clear sections, code examples, and practical guidance.
"@
    
    return Invoke-Claude3Request -Prompt $prompt
}

function Generate-APIDocumentation {
    param(
        [string]$ProjectPath
    )
    
    Write-Log "Generating API documentation"
    
    # Find API-related files
    $apiFiles = Get-ChildItem -Path $ProjectPath -Recurse -Include "*.ps1", "*.js", "*.ts", "*.py", "*.cs", "*.java", "*.go", "*.rs", "*.php" | Where-Object { 
        $_.FullName -notmatch "node_modules|\.git|\.vs|bin|obj" -and 
        (Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue) -match "(function|def|class|public|private|export|api|endpoint)"
    }
    
    $apiContent = @()
    foreach ($file in $apiFiles) {
        try {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if ($content) {
                $apiContent += "File: $($file.Name)`n```$($file.Extension.TrimStart('.'))`n$($content.Substring(0, [Math]::Min($content.Length, 1000)))`n```"
            }
        } catch {
            Write-Log "Error reading file $($file.FullName): $($_.Exception.Message)" "WARNING"
        }
    }
    
    $prompt = @"
Generate comprehensive API documentation based on this code:

$($apiContent -join "`n`n")

Please provide:
1. API Overview and Architecture
2. Endpoint Documentation
3. Request/Response Examples
4. Authentication and Authorization
5. Error Handling
6. Rate Limiting
7. SDK Examples
8. Integration Guides
9. Testing Examples
10. Best Practices

Format as professional API documentation with clear examples and comprehensive coverage.
"@
    
    return Invoke-Claude3Request -Prompt $prompt
}

function Generate-UserGuide {
    param(
        [hashtable]$ProjectInfo
    )
    
    $prompt = @"
Generate a comprehensive user guide for this project:

Project: $($ProjectInfo.Name)
Files: $($ProjectInfo.Files.Count)
Code Files: $($ProjectInfo.CodeFiles.Count)

Please create:
1. Getting Started Guide
2. Installation Instructions
3. Basic Usage Examples
4. Advanced Features
5. Configuration Options
6. Common Use Cases
7. Troubleshooting
8. FAQ
9. Tips and Best Practices
10. Support and Community

Make it user-friendly with step-by-step instructions, screenshots descriptions, and practical examples.
"@
    
    return Invoke-Claude3Request -Prompt $prompt
}

function Generate-DeveloperDocumentation {
    param(
        [hashtable]$ProjectInfo
    )
    
    $prompt = @"
Generate comprehensive developer documentation for this project:

Project: $($ProjectInfo.Name)
Technology Stack: Based on file extensions and structure

Please provide:
1. Development Setup
2. Code Architecture
3. Coding Standards
4. Testing Guidelines
5. Build Process
6. Deployment Instructions
7. Contributing Guidelines
8. Code Review Process
9. Performance Guidelines
10. Security Guidelines

Format as technical documentation for developers with code examples and detailed explanations.
"@
    
    return Invoke-Claude3Request -Prompt $prompt
}

function Save-Documentation {
    param(
        [string]$Content,
        [string]$FileName,
        [string]$ProjectPath,
        [string]$Format = "markdown"
    )
    
    $docsDir = Join-Path $ProjectPath "docs"
    if (!(Test-Path $docsDir)) {
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
    }
    
    $extension = switch ($Format) {
        "markdown" { ".md" }
        "html" { ".html" }
        "rst" { ".rst" }
        default { ".md" }
    }
    
    $filePath = Join-Path $docsDir "$FileName$extension"
    Set-Content -Path $filePath -Value $Content -Encoding UTF8
    
    Write-Log "Documentation saved: $filePath"
    return $filePath
}

# Main execution
try {
    Write-Log "Starting Claude-3 Documentation Generation" "INFO"
    
    # Analyze project structure
    $projectInfo = Analyze-ProjectStructure -ProjectPath $ProjectPath
    
    # Generate project overview
    $overview = Generate-ProjectOverview -ProjectInfo $projectInfo
    $overviewPath = Save-Documentation -Content $overview -FileName "project-overview" -ProjectPath $ProjectPath -Format $OutputFormat
    
    # Generate API documentation if requested
    if ($GenerateAPI) {
        $apiDoc = Generate-APIDocumentation -ProjectPath $ProjectPath
        $apiPath = Save-Documentation -Content $apiDoc -FileName "api-documentation" -ProjectPath $ProjectPath -Format $OutputFormat
    }
    
    # Generate user guide if requested
    if ($GenerateUserGuide) {
        $userGuide = Generate-UserGuide -ProjectInfo $projectInfo
        $userGuidePath = Save-Documentation -Content $userGuide -FileName "user-guide" -ProjectPath $ProjectPath -Format $OutputFormat
    }
    
    # Generate developer documentation
    $devDoc = Generate-DeveloperDocumentation -ProjectInfo $projectInfo
    $devDocPath = Save-Documentation -Content $devDoc -FileName "developer-documentation" -ProjectPath $ProjectPath -Format $OutputFormat
    
    Write-Host "Documentation generation complete!" -ForegroundColor Green
    Write-Host "Generated files:" -ForegroundColor Yellow
    Write-Host "- Project Overview: $overviewPath" -ForegroundColor White
    if ($GenerateAPI) { Write-Host "- API Documentation: $apiPath" -ForegroundColor White }
    if ($GenerateUserGuide) { Write-Host "- User Guide: $userGuidePath" -ForegroundColor White }
    Write-Host "- Developer Documentation: $devDocPath" -ForegroundColor White
    
    Write-Log "Claude-3 Documentation Generation completed successfully" "INFO"
    
} catch {
    Write-Log "Error during documentation generation: $($_.Exception.Message)" "ERROR"
    throw
}