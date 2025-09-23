# Universal Deployment Manager
# Version: 1.0
# Description: Manages complete DEV->PROM->PROD deployment workflow

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prom", "prod", "all", "status")]
    [string]$Action,
    [string]$SourcePath = "F:\ProjectsAI",
    [string]$PROM_PATH = "G:\OSPanel\home",
    [string]$PROD_SERVER = "u0488409@37.140.195.19",
    [string]$PROD_PATH = "/var/www/u0488409/data/www",
    [switch]$Force = $false,
    [switch]$Backup = $true,
    [switch]$DryRun = $false
)

# Configuration
$LOG_PATH = "F:\ProjectsAI\logs"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

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
    Add-Content -Path "$LOG_PATH\deployment-manager.log" -Value $logMessage
}

# Display banner
function Show-Banner {
    Write-Host "`n🚀 Universal Deployment Manager v1.0" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Project: $ProjectName" -ForegroundColor Yellow
    Write-Host "Action: $Action" -ForegroundColor Yellow
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
    Write-Host ""
}

# Function to deploy to PROM
function Deploy-ToPROM {
    Write-Log "🔄 Starting PROM deployment for $ProjectName" "INFO"
    
    $promScript = Join-Path $SCRIPT_DIR "deploy-to-prom.ps1"
    if (-not (Test-Path $promScript)) {
        Write-Log "❌ PROM deployment script not found: $promScript" "ERROR"
        return $false
    }

    $promArgs = @(
        "-ProjectName", $ProjectName,
        "-SourcePath", (Join-Path $SourcePath $ProjectName),
        "-Force:`$$Force",
        "-Backup:`$$Backup",
        "-Verbose:`$$Verbose"
    )

    if ($DryRun) {
        Write-Log "DRY RUN: Would execute: $promScript $($promArgs -join ' ')" "INFO"
        return $true
    }

    try {
        & $promScript @promArgs
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ PROM deployment completed successfully" "SUCCESS"
            return $true
        } else {
            Write-Log "❌ PROM deployment failed with exit code $LASTEXITCODE" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ PROM deployment failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to deploy to PROD
function Deploy-ToPROD {
    Write-Log "🌐 Starting PROD deployment for $ProjectName" "INFO"
    
    $prodScript = Join-Path $SCRIPT_DIR "deploy-to-prod.ps1"
    if (-not (Test-Path $prodScript)) {
        Write-Log "❌ PROD deployment script not found: $prodScript" "ERROR"
        return $false
    }

    $prodArgs = @(
        "-ProjectName", $ProjectName,
        "-Server", $PROD_SERVER,
        "-PROM_PATH", $PROM_PATH,
        "-PROD_PATH", $PROD_PATH,
        "-Force:`$$Force",
        "-Backup:`$$Backup",
        "-Verbose:`$$Verbose",
        "-DryRun:`$$DryRun"
    )

    if ($DryRun) {
        Write-Log "DRY RUN: Would execute: $prodScript $($prodArgs -join ' ')" "INFO"
        return $true
    }

    try {
        & $prodScript @prodArgs
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ PROD deployment completed successfully" "SUCCESS"
            return $true
        } else {
            Write-Log "❌ PROD deployment failed with exit code $LASTEXITCODE" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ PROD deployment failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to check deployment status
function Get-DeploymentStatus {
    Write-Log "📊 Checking deployment status for $ProjectName" "INFO"
    
    $status = @{
        ProjectName = $ProjectName
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        DEV = @{}
        PROM = @{}
        PROD = @{}
    }

    # Check DEV environment
    $devPath = Join-Path $SourcePath $ProjectName
    if (Test-Path $devPath) {
        $devInfo = Get-Item $devPath
        $status.DEV = @{
            Exists = $true
            LastModified = $devInfo.LastWriteTime
            Size = (Get-ChildItem $devPath -Recurse | Measure-Object -Property Length -Sum).Sum
            Files = (Get-ChildItem $devPath -Recurse -File).Count
        }
        Write-Log "✅ DEV environment found: $devPath" "SUCCESS"
    } else {
        $status.DEV = @{ Exists = $false }
        Write-Log "❌ DEV environment not found: $devPath" "WARNING"
    }

    # Check PROM environment
    $promPath = Join-Path $PROM_PATH $ProjectName
    if (Test-Path $promPath) {
        $promInfo = Get-Item $promPath
        $status.PROM = @{
            Exists = $true
            LastModified = $promInfo.LastWriteTime
            Size = (Get-ChildItem $promPath -Recurse | Measure-Object -Property Length -Sum).Sum
            Files = (Get-ChildItem $promPath -Recurse -File).Count
        }
        Write-Log "✅ PROM environment found: $promPath" "SUCCESS"
    } else {
        $status.PROM = @{ Exists = $false }
        Write-Log "❌ PROM environment not found: $promPath" "WARNING"
    }

    # Check PROD environment
    try {
        $prodCheck = ssh -o ConnectTimeout=10 $PROD_SERVER "if [ -d '$PROD_PATH/$ProjectName' ]; then echo 'EXISTS'; else echo 'NOT_FOUND'; fi"
        if ($prodCheck -eq "EXISTS") {
            $prodInfo = ssh $PROD_SERVER "ls -la '$PROD_PATH/$ProjectName' | head -1"
            $status.PROD = @{
                Exists = $true
                LastModified = "Unknown"
                Size = "Unknown"
                Files = "Unknown"
            }
            Write-Log "✅ PROD environment found: $PROD_SERVER`:$PROD_PATH/$ProjectName" "SUCCESS"
        } else {
            $status.PROD = @{ Exists = $false }
            Write-Log "❌ PROD environment not found: $PROD_SERVER`:$PROD_PATH/$ProjectName" "WARNING"
        }
    } catch {
        $status.PROD = @{ Exists = $false; Error = $_.Exception.Message }
        Write-Log "❌ Failed to check PROD environment: $($_.Exception.Message)" "ERROR"
    }

    # Display status
    Write-Host "`n📊 Deployment Status for $ProjectName" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    
    Write-Host "`n🔧 DEV Environment:" -ForegroundColor Yellow
    if ($status.DEV.Exists) {
        Write-Host "  ✅ Exists: $devPath" -ForegroundColor Green
        Write-Host "  📅 Last Modified: $($status.DEV.LastModified)" -ForegroundColor White
        Write-Host "  📁 Files: $($status.DEV.Files)" -ForegroundColor White
        Write-Host "  💾 Size: $([math]::Round($status.DEV.Size / 1MB, 2)) MB" -ForegroundColor White
    } else {
        Write-Host "  ❌ Not Found" -ForegroundColor Red
    }

    Write-Host "`n🧪 PROM Environment:" -ForegroundColor Yellow
    if ($status.PROM.Exists) {
        Write-Host "  ✅ Exists: $promPath" -ForegroundColor Green
        Write-Host "  📅 Last Modified: $($status.PROM.LastModified)" -ForegroundColor White
        Write-Host "  📁 Files: $($status.PROM.Files)" -ForegroundColor White
        Write-Host "  💾 Size: $([math]::Round($status.PROM.Size / 1MB, 2)) MB" -ForegroundColor White
    } else {
        Write-Host "  ❌ Not Found" -ForegroundColor Red
    }

    Write-Host "`n🌐 PROD Environment:" -ForegroundColor Yellow
    if ($status.PROD.Exists) {
        Write-Host "  ✅ Exists: $PROD_SERVER`:$PROD_PATH/$ProjectName" -ForegroundColor Green
        Write-Host "  📅 Last Modified: $($status.PROD.LastModified)" -ForegroundColor White
        Write-Host "  📁 Files: $($status.PROD.Files)" -ForegroundColor White
        Write-Host "  💾 Size: $($status.PROD.Size)" -ForegroundColor White
    } else {
        Write-Host "  ❌ Not Found" -ForegroundColor Red
        if ($status.PROD.Error) {
            Write-Host "  ⚠️ Error: $($status.PROD.Error)" -ForegroundColor Red
        }
    }

    # Save status to file
    $status | ConvertTo-Json -Depth 3 | Out-File -FilePath "$LOG_PATH\deployment-status-$ProjectName.json" -Encoding UTF8
    Write-Log "📋 Status saved to: $LOG_PATH\deployment-status-$ProjectName.json" "INFO"

    return $status
}

# Main execution
Show-Banner

try {
    switch ($Action.ToLower()) {
        "dev" {
            Write-Log "🔧 DEV action selected - no deployment needed" "INFO"
            Write-Host "🔧 DEV Environment" -ForegroundColor Green
            Write-Host "Project path: $SourcePath\$ProjectName" -ForegroundColor Yellow
            Write-Host "Ready for development!" -ForegroundColor Green
        }
        
        "prom" {
            Write-Log "🧪 PROM deployment selected" "INFO"
            if (Deploy-ToPROM) {
                Write-Host "`n🎉 PROM deployment completed successfully!" -ForegroundColor Green
            } else {
                Write-Host "`n❌ PROM deployment failed!" -ForegroundColor Red
                exit 1
            }
        }
        
        "prod" {
            Write-Log "🌐 PROD deployment selected" "INFO"
            if (Deploy-ToPROD) {
                Write-Host "`n🎉 PROD deployment completed successfully!" -ForegroundColor Green
            } else {
                Write-Host "`n❌ PROD deployment failed!" -ForegroundColor Red
                exit 1
            }
        }
        
        "all" {
            Write-Log "🔄 Full deployment workflow selected" "INFO"
            Write-Host "`n🔄 Starting full deployment workflow: DEV → PROM → PROD" -ForegroundColor Cyan
            
            # Step 1: Deploy to PROM
            Write-Host "`n📋 Step 1: Deploying to PROM..." -ForegroundColor Yellow
            if (-not (Deploy-ToPROM)) {
                Write-Host "❌ PROM deployment failed. Stopping workflow." -ForegroundColor Red
                exit 1
            }
            
            # Step 2: Deploy to PROD
            Write-Host "`n📋 Step 2: Deploying to PROD..." -ForegroundColor Yellow
            if (-not (Deploy-ToPROD)) {
                Write-Host "❌ PROD deployment failed. Stopping workflow." -ForegroundColor Red
                exit 1
            }
            
            Write-Host "`n🎉 Full deployment workflow completed successfully!" -ForegroundColor Green
        }
        
        "status" {
            Write-Log "📊 Status check selected" "INFO"
            Get-DeploymentStatus | Out-Null
        }
        
        default {
            Write-Log "❌ Unknown action: $Action" "ERROR"
            Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
            Write-Host "Valid actions: dev, prom, prod, all, status" -ForegroundColor Yellow
            exit 1
        }
    }

    Write-Log "✅ Deployment manager completed successfully" "SUCCESS"

} catch {
    Write-Log "❌ Deployment manager failed: $($_.Exception.Message)" "ERROR"
    Write-Host "`n❌ Deployment manager failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
