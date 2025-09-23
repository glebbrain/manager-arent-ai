# Deploy to PROM Environment Script
# Version: 1.0
# Description: Deploys project from DEV to PROM environment for local testing

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    [switch]$Force = $false,
    [switch]$Backup = $true
)

# Configuration
$DEV_PATH = "F:\ProjectsAI"
$PROM_PATH = "G:\OSPanel\home"
$LOG_PATH = "F:\ProjectsAI\logs"

# Create logs directory if it doesn't exist
if (-not (Test-Path $LOG_PATH)) {
    New-Item -ItemType Directory -Path $LOG_PATH -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path "$LOG_PATH\deployment-prom.log" -Value $logMessage
}

Write-Log "🚀 Starting PROM deployment for project: $ProjectName" "INFO"

try {
    # Validate source path
    if (-not (Test-Path $SourcePath)) {
        Write-Log "❌ Source path does not exist: $SourcePath" "ERROR"
        exit 1
    }

    # Set target path
    $TargetPath = Join-Path $PROM_PATH $ProjectName

    # Check if target already exists
    if ((Test-Path $TargetPath) -and -not $Force) {
        Write-Log "⚠️ Target path already exists: $TargetPath" "WARNING"
        Write-Log "Use -Force to overwrite existing deployment" "WARNING"
        exit 1
    }

    # Create backup if requested
    if ($Backup -and (Test-Path $TargetPath)) {
        $BackupPath = "$TargetPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Write-Log "📦 Creating backup: $BackupPath" "INFO"
        Copy-Item -Path $TargetPath -Destination $BackupPath -Recurse -Force
    }

    # Create target directory
    if (-not (Test-Path $TargetPath)) {
        Write-Log "📁 Creating target directory: $TargetPath" "INFO"
        New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
    }

    # Copy project files
    Write-Log "📋 Copying project files from $SourcePath to $TargetPath" "INFO"
    
    # Get all files except common exclusions
    $ExcludePatterns = @(
        "node_modules",
        ".git",
        "*.log",
        "*.tmp",
        ".vscode",
        "coverage",
        "dist",
        "build"
    )

    $SourceFiles = Get-ChildItem -Path $SourcePath -Recurse | Where-Object {
        $file = $_
        $shouldExclude = $false
        foreach ($pattern in $ExcludePatterns) {
            if ($file.FullName -like "*$pattern*") {
                $shouldExclude = $true
                break
            }
        }
        -not $shouldExclude
    }

    foreach ($file in $SourceFiles) {
        $relativePath = $file.FullName.Substring($SourcePath.Length + 1)
        $targetFile = Join-Path $TargetPath $relativePath
        $targetDir = Split-Path $targetFile -Parent

        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }

        Copy-Item -Path $file.FullName -Destination $targetFile -Force
    }

    # Create PROM-specific configuration
    $PROMConfig = @{
        environment = "PROM"
        projectName = $ProjectName
        deployedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        sourcePath = $SourcePath
        targetPath = $TargetPath
    }

    $PROMConfig | ConvertTo-Json | Out-File -FilePath "$TargetPath\prom-config.json" -Encoding UTF8

    # Create deployment info file
    $DeploymentInfo = @"
# PROM Deployment Information
Project: $ProjectName
Deployed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Source: $SourcePath
Target: $TargetPath
Environment: PROM (Local Testing)

## Next Steps
1. Navigate to project directory: cd `"$TargetPath`"
2. Install dependencies: npm install (if Node.js project)
3. Run tests: npm test (if available)
4. Start development server: npm start (if available)
5. Test functionality in browser

## Configuration
- Environment: PROM
- Testing: Local OSPanel environment
- Database: Local (if applicable)
- Logs: $TargetPath\logs\
"@

    $DeploymentInfo | Out-File -FilePath "$TargetPath\DEPLOYMENT-INFO.md" -Encoding UTF8

    Write-Log "✅ PROM deployment completed successfully" "SUCCESS"
    Write-Log "📁 Project deployed to: $TargetPath" "INFO"
    Write-Log "📋 Deployment info: $TargetPath\DEPLOYMENT-INFO.md" "INFO"

    # Display next steps
    Write-Host "`n🎉 PROM Deployment Completed Successfully!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "Project: $ProjectName" -ForegroundColor Yellow
    Write-Host "Target Path: $TargetPath" -ForegroundColor Yellow
    Write-Host "Environment: PROM (Local Testing)" -ForegroundColor Yellow
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. cd `"$TargetPath`"" -ForegroundColor White
    Write-Host "2. Install dependencies (if needed)" -ForegroundColor White
    Write-Host "3. Run tests" -ForegroundColor White
    Write-Host "4. Test functionality" -ForegroundColor White
    Write-Host "5. Deploy to PROD when ready" -ForegroundColor White

} catch {
    Write-Log "❌ PROM deployment failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    exit 1
}
