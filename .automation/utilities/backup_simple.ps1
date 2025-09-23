# Simple Backup Script for LearnEnglishBot
# Basic backup functionality

param(
    [switch]$ConfigOnly,
    [switch]$UserDataOnly,
    [string]$BackupPath = "backups"
)

Write-Host "Simple Backup Script for LearnEnglishBot" -ForegroundColor Green
Write-Host "Basic backup functionality" -ForegroundColor Cyan

# Create backup directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $BackupPath "backup_$timestamp"

if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
}

$backupStats = @{
    "files_copied" = 0
    "total_size" = 0
    "errors" = @()
}

# Function to backup configuration
function Backup-Config {
    Write-Host "`nBacking up configuration..." -ForegroundColor Yellow
    
    $configDir = Join-Path $backupDir "config"
    if (-not (Test-Path $configDir)) {
        New-Item -Path $configDir -ItemType Directory -Force | Out-Null
    }
    
    $configFiles = @(".env", "pyproject.toml", "requirements.txt", "docker-compose.yml", "Dockerfile")
    
    foreach ($configFile in $configFiles) {
        if (Test-Path $configFile) {
            try {
                $destPath = Join-Path $configDir $configFile
                Copy-Item -Path $configFile -Destination $destPath -Force
                $backupStats.files_copied++
                $backupStats.total_size += (Get-Item $configFile).Length
                Write-Host "  Backed up: $configFile" -ForegroundColor Green
            } catch {
                $errorMsg = "Failed to backup $configFile : $($_.Exception.Message)"
                $backupStats.errors += $errorMsg
                Write-Host "  Failed: $errorMsg" -ForegroundColor Red
            }
        }
    }
    
    # Backup config directory
    if (Test-Path "config") {
        try {
            $destPath = Join-Path $configDir "config"
            Copy-Item -Path "config" -Destination $destPath -Recurse -Force
            $backupStats.files_copied += (Get-ChildItem "config" -Recurse -File).Count
            $backupStats.total_size += (Get-ChildItem "config" -Recurse -File | Measure-Object -Property Length -Sum).Sum
            Write-Host "  Backed up: config directory" -ForegroundColor Green
        } catch {
            $errorMsg = "Failed to backup config directory: $($_.Exception.Message)"
            $backupStats.errors += $errorMsg
            Write-Host "  Failed: $errorMsg" -ForegroundColor Red
        }
    }
}

# Function to backup user data
function Backup-UserData {
    Write-Host "`nBacking up user data..." -ForegroundColor Yellow
    
    $userDataDir = Join-Path $backupDir "userdata"
    if (-not (Test-Path $userDataDir)) {
        New-Item -Path $userDataDir -ItemType Directory -Force | Out-Null
    }
    
    $dataSources = @("data", "config", "logs")
    
    foreach ($source in $dataSources) {
        if (Test-Path $source) {
            try {
                $destPath = Join-Path $userDataDir (Split-Path $source -Leaf)
                
                if (Test-Path $source -PathType Container) {
                    Copy-Item -Path $source -Destination $destPath -Recurse -Force
                    $backupStats.files_copied += (Get-ChildItem $source -Recurse -File).Count
                } else {
                    Copy-Item -Path $source -Destination $destPath -Force
                    $backupStats.files_copied++
                }
                
                $backupStats.total_size += (Get-ChildItem $source -Recurse -File | Measure-Object -Property Length -Sum).Sum
                Write-Host "  Backed up: $source" -ForegroundColor Green
                
            } catch {
                $errorMsg = "Failed to backup $source : $($_.Exception.Message)"
                $backupStats.errors += $errorMsg
                Write-Host "  Failed: $errorMsg" -ForegroundColor Red
            }
        } else {
            Write-Host "  Source not found: $source" -ForegroundColor Yellow
        }
    }
}

# Main execution
Write-Host "Starting backup process..." -ForegroundColor Yellow

if ($ConfigOnly) {
    Backup-Config
} elseif ($UserDataOnly) {
    Backup-UserData
} else {
    Backup-Config
    Backup-UserData
}

# Final report
Write-Host "`nBackup Summary" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "Backup Location: $backupDir" -ForegroundColor White
Write-Host "Total Files: $($backupStats.files_copied)" -ForegroundColor White
Write-Host "Total Size: $([math]::Round($backupStats.total_size / 1MB, 2)) MB" -ForegroundColor White
Write-Host "Errors: $($backupStats.errors.Count)" -ForegroundColor White

if ($backupStats.errors.Count -eq 0) {
    Write-Host "`nBackup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`nBackup completed with errors" -ForegroundColor Yellow
}

Write-Host "`nBackup script completed" -ForegroundColor Green
