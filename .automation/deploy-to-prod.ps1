# Deploy to PROD Environment Script
# Version: 1.0
# Description: Deploys project from PROM to PROD environment on remote server

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    [Parameter(Mandatory=$true)]
    [string]$Server = "u0488409@37.140.195.19",
    [string]$PROM_PATH = "G:\OSPanel\home",
    [string]$PROD_PATH = "/var/www/u0488409/data/www",
    [switch]$Force = $false,
    [switch]$Backup = $true,
    [switch]$DryRun = $false
)

# Configuration
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
    Add-Content -Path "$LOG_PATH\deployment-prod.log" -Value $logMessage
}

Write-Log "🚀 Starting PROD deployment for project: $ProjectName" "INFO"
Write-Log "Server: $Server" "INFO"
Write-Log "PROM Path: $PROM_PATH\$ProjectName" "INFO"
Write-Log "PROD Path: $PROD_PATH/$ProjectName" "INFO"

try {
    # Validate PROM source path
    $PROMProjectPath = Join-Path $PROM_PATH $ProjectName
    if (-not (Test-Path $PROMProjectPath)) {
        Write-Log "❌ PROM project path does not exist: $PROMProjectPath" "ERROR"
        Write-Log "Please deploy to PROM first using: .\deploy-to-prom.ps1 -ProjectName $ProjectName" "ERROR"
        exit 1
    }

    # Test SSH connection
    Write-Log "🔍 Testing SSH connection to $Server" "INFO"
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $Server "echo 'SSH connection test successful'"
    if ($LASTEXITCODE -ne 0) {
        Write-Log "❌ SSH connection failed to $Server" "ERROR"
        Write-Log "Please check SSH configuration and server availability" "ERROR"
        exit 1
    }
    Write-Log "✅ SSH connection successful" "SUCCESS"

    # Create PROD directory on server
    Write-Log "📁 Creating PROD directory on server: $PROD_PATH/$ProjectName" "INFO"
    if ($DryRun) {
        Write-Log "DRY RUN: ssh $Server `"mkdir -p $PROD_PATH/$ProjectName`"" "INFO"
    } else {
        ssh $Server "mkdir -p $PROD_PATH/$ProjectName"
        if ($LASTEXITCODE -ne 0) {
            Write-Log "❌ Failed to create PROD directory on server" "ERROR"
            exit 1
        }
    }

    # Create backup on server if requested
    if ($Backup -and -not $DryRun) {
        Write-Log "📦 Creating backup on server" "INFO"
        $backupName = "$ProjectName.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        ssh $Server "if [ -d '$PROD_PATH/$ProjectName' ]; then cp -r '$PROD_PATH/$ProjectName' '$PROD_PATH/$backupName'; fi"
    }

    # Sync files to server using rsync
    Write-Log "📋 Syncing project files to server" "INFO"
    $rsyncCommand = "rsync -avz --delete `"$PROMProjectPath/`" `"$Server`:$PROD_PATH/$ProjectName/`""
    
    if ($DryRun) {
        Write-Log "DRY RUN: $rsyncCommand" "INFO"
    } else {
        # Check if rsync is available
        if (-not (Get-Command rsync -ErrorAction SilentlyContinue)) {
            Write-Log "⚠️ rsync not available, using scp instead" "WARNING"
            
            # Create temporary archive
            $tempArchive = "$env:TEMP\$ProjectName-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"
            Write-Log "📦 Creating temporary archive: $tempArchive" "INFO"
            
            # Create tar archive
            tar -czf $tempArchive -C $PROMProjectPath .
            
            # Upload archive
            Write-Log "⬆️ Uploading archive to server" "INFO"
            scp $tempArchive "$Server`:$PROD_PATH/$ProjectName.tar.gz"
            
            # Extract on server
            Write-Log "📤 Extracting archive on server" "INFO"
            ssh $Server "cd $PROD_PATH/$ProjectName && tar -xzf $ProjectName.tar.gz && rm $ProjectName.tar.gz"
            
            # Cleanup
            Remove-Item $tempArchive -Force
        } else {
            # Use rsync
            Invoke-Expression $rsyncCommand
            if ($LASTEXITCODE -ne 0) {
                Write-Log "❌ Failed to sync files to server" "ERROR"
                exit 1
            }
        }
    }

    # Set proper permissions on server
    Write-Log "🔐 Setting proper permissions on server" "INFO"
    if ($DryRun) {
        Write-Log "DRY RUN: ssh $Server `"chmod -R 755 $PROD_PATH/$ProjectName`"" "INFO"
    } else {
        ssh $Server "chmod -R 755 $PROD_PATH/$ProjectName"
        ssh $Server "chown -R u0488409:u0488409 $PROD_PATH/$ProjectName"
    }

    # Create PROD-specific configuration
    $PRODConfig = @{
        environment = "PROD"
        projectName = $ProjectName
        deployedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        server = $Server
        prodPath = "$PROD_PATH/$ProjectName"
        promPath = $PROMProjectPath
    }

    # Save config locally
    $PRODConfig | ConvertTo-Json | Out-File -FilePath "$PROMProjectPath\prod-config.json" -Encoding UTF8

    # Upload config to server
    if (-not $DryRun) {
        scp "$PROMProjectPath\prod-config.json" "$Server`:$PROD_PATH/$ProjectName/"
    }

    # Create deployment info file
    $DeploymentInfo = @"
# PROD Deployment Information
Project: $ProjectName
Deployed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Server: $Server
PROD Path: $PROD_PATH/$ProjectName
Environment: PROD (Production)

## Server Information
- Host: 37.140.195.19
- User: u0488409
- Path: $PROD_PATH/$ProjectName

## Next Steps
1. Verify deployment: ssh $Server "ls -la $PROD_PATH/$ProjectName"
2. Check logs: ssh $Server "tail -f $PROD_PATH/$ProjectName/logs/*.log"
3. Start services: ssh $Server "cd $PROD_PATH/$ProjectName && ./start.sh"
4. Monitor status: ssh $Server "ps aux | grep $ProjectName"

## Configuration
- Environment: PROD
- Server: $Server
- Path: $PROD_PATH/$ProjectName
- Logs: $PROD_PATH/$ProjectName/logs/
- Backup: $PROD_PATH/$ProjectName.backup.*
"@

    $DeploymentInfo | Out-File -FilePath "$PROMProjectPath\PROD-DEPLOYMENT-INFO.md" -Encoding UTF8

    # Upload deployment info to server
    if (-not $DryRun) {
        scp "$PROMProjectPath\PROD-DEPLOYMENT-INFO.md" "$Server`:$PROD_PATH/$ProjectName/"
    }

    Write-Log "✅ PROD deployment completed successfully" "SUCCESS"
    Write-Log "🌐 Project deployed to: $Server`:$PROD_PATH/$ProjectName" "INFO"
    Write-Log "📋 Deployment info: $PROMProjectPath\PROD-DEPLOYMENT-INFO.md" "INFO"

    # Display next steps
    Write-Host "`n🎉 PROD Deployment Completed Successfully!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "Project: $ProjectName" -ForegroundColor Yellow
    Write-Host "Server: $Server" -ForegroundColor Yellow
    Write-Host "PROD Path: $PROD_PATH/$ProjectName" -ForegroundColor Yellow
    Write-Host "Environment: PROD (Production)" -ForegroundColor Yellow
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Verify deployment: ssh $Server `"ls -la $PROD_PATH/$ProjectName`"" -ForegroundColor White
    Write-Host "2. Check logs: ssh $Server `"tail -f $PROD_PATH/$ProjectName/logs/*.log`"" -ForegroundColor White
    Write-Host "3. Start services: ssh $Server `"cd $PROD_PATH/$ProjectName && ./start.sh`"" -ForegroundColor White
    Write-Host "4. Monitor status: ssh $Server `"ps aux | grep $ProjectName`"" -ForegroundColor White

} catch {
    Write-Log "❌ PROD deployment failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    exit 1
}
