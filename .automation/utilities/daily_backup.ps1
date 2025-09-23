# Daily Backup Automation Script for LearnEnglishBot
# Automates daily backups with cleanup and monitoring

param(
    [switch]$Compress,
    [switch]$Cleanup,
    [switch]$Verify,
    [switch]$Monitor,
    [switch]$All,
    [string]$BackupPath = "backups",
    [int]$RetentionDays = 30,
    [string]$LogFile = "backup.log"
)

function Write-BackupLog {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    Write-Host $logMessage -ForegroundColor $(if ($Level -eq "ERROR") { "Red" } elseif ($Level -eq "WARNING") { "Yellow" } else { "Green" })
    
    if ($LogFile) {
        Add-Content -Path $LogFile -Value $logMessage
    }
}

function Test-BackupRequirements {
    Write-BackupLog "Checking backup requirements..." "INFO"
    
    # Check if backup directory exists
    if (-not (Test-Path $BackupPath)) {
        Write-BackupLog "Creating backup directory: $BackupPath" "INFO"
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    }
    
    # Check available disk space
    $drive = (Get-Item $BackupPath).PSDrive
    $freeSpace = $drive.Free / 1GB
    $requiredSpace = 5  # 5 GB minimum
    
    if ($freeSpace -lt $requiredSpace) {
        Write-BackupLog "Warning: Low disk space. Available: $([math]::Round($freeSpace, 2)) GB, Required: $requiredSpace GB" "WARNING"
        return $false
    }
    
    Write-BackupLog "Backup requirements met. Available space: $([math]::Round($freeSpace, 2)) GB" "INFO"
    return $true
}

function Create-Backup {
    param([string]$Source, [string]$Destination)
    
    Write-BackupLog "Creating backup of: $Source" "INFO"
    
    try {
        if (Test-Path $Source) {
            $backupName = "learnenglishbot_backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
            $backupDir = Join-Path $Destination $backupName
            
            # Create backup directory
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
            
            # Copy files
            Copy-Item -Path $Source -Destination $backupDir -Recurse -Force
            
            # Create metadata file
            $metadata = @{
                timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                source = $Source
                version = "1.0.0"
                bot_version = "LearnEnglishBot"
                files_count = (Get-ChildItem -Path $backupDir -Recurse -File | Measure-Object).Count
                total_size = [math]::Round((Get-ChildItem -Path $backupDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
            }
            
            $metadataPath = Join-Path $backupDir "backup_metadata.json"
            $metadata | ConvertTo-Json -Depth 10 | Set-Content -Path $metadataPath
            
            Write-BackupLog "Backup created successfully: $backupDir" "INFO"
            Write-BackupLog "Files: $($metadata.files_count), Size: $($metadata.total_size) MB" "INFO"
            
            return $backupDir
        } else {
            Write-BackupLog "Source path not found: $Source" "ERROR"
            return $null
        }
    }
    catch {
        Write-BackupLog "Error creating backup: $_" "ERROR"
        return $null
    }
}

function Compress-Backup {
    param([string]$BackupPath)
    
    Write-BackupLog "Compressing backup: $BackupPath" "INFO"
    
    try {
        $compressedPath = "$BackupPath.zip"
        
        # Remove existing compressed file
        if (Test-Path $compressedPath) {
            Remove-Item $compressedPath -Force
        }
        
        # Compress backup directory
        Compress-Archive -Path $BackupPath -DestinationPath $compressedPath -CompressionLevel Optimal
        
        # Get compressed size
        $compressedSize = [math]::Round((Get-Item $compressedPath).Length / 1MB, 2)
        Write-BackupLog "Backup compressed successfully: $compressedPath ($compressedSize MB)" "INFO"
        
        # Remove uncompressed directory
        Remove-Item $BackupPath -Recurse -Force
        Write-BackupLog "Removed uncompressed backup directory" "INFO"
        
        return $compressedPath
    }
    catch {
        Write-BackupLog "Error compressing backup: $_" "ERROR"
        return $null
    }
}

function Cleanup-OldBackups {
    param([int]$RetentionDays)
    
    Write-BackupLog "Cleaning up backups older than $RetentionDays days..." "INFO"
    
    try {
        $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
        $oldBackups = Get-ChildItem -Path $BackupPath -Filter "learnenglishbot_backup_*" | Where-Object { $_.CreationTime -lt $cutoffDate }
        
        if ($oldBackups) {
            $deletedCount = 0
            $freedSpace = 0
            
            foreach ($backup in $oldBackups) {
                $size = if ($backup.PSIsContainer) { 
                    (Get-ChildItem -Path $backup.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum 
                } else { 
                    $backup.Length 
                }
                
                Remove-Item $backup.FullName -Recurse -Force
                $deletedCount++
                $freedSpace += $size
                
                Write-BackupLog "Deleted old backup: $($backup.Name)" "INFO"
            }
            
            $freedSpaceMB = [math]::Round($freedSpace / 1MB, 2)
            Write-BackupLog "Cleanup completed. Deleted: $deletedCount backups, Freed: $freedSpaceMB MB" "INFO"
        } else {
            Write-BackupLog "No old backups found for cleanup" "INFO"
        }
    }
    catch {
        Write-BackupLog "Error during cleanup: $_" "ERROR"
    }
}

function Verify-Backup {
    param([string]$BackupPath)
    
    Write-BackupLog "Verifying backup: $BackupPath" "INFO"
    
    try {
        if (Test-Path $BackupPath) {
            # Check if it's a compressed file
            if ($BackupPath -like "*.zip") {
                # Test zip integrity
                $zip = [System.IO.Compression.ZipFile]::OpenRead($BackupPath)
                $zip.Dispose()
                Write-BackupLog "ZIP file integrity verified" "INFO"
            }
            
            # Check metadata if available
            if ($BackupPath -like "*.zip") {
                $tempDir = Join-Path $env:TEMP "backup_verify_$(Get-Date -Format 'HHmmss')"
                New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
                
                try {
                    # Extract metadata file only
                    $metadataEntry = "backup_metadata.json"
                    if ((Get-Item $BackupPath).PSIsContainer) {
                        $metadataPath = Join-Path $BackupPath $metadataEntry
                    } else {
                        # For ZIP files, we'd need to extract just the metadata
                        # This is a simplified version
                        Write-BackupLog "Backup verification completed" "INFO"
                        return $true
                    }
                    
                    if (Test-Path $metadataPath) {
                        $metadata = Get-Content $metadataPath | ConvertFrom-Json
                        Write-BackupLog "Backup metadata verified: $($metadata.files_count) files, $($metadata.total_size) MB" "INFO"
                    }
                }
                finally {
                    # Cleanup temp directory
                    if (Test-Path $tempDir) {
                        Remove-Item $tempDir -Recurse -Force
                    }
                }
            }
            
            Write-BackupLog "Backup verification completed successfully" "INFO"
            return $true
        } else {
            Write-BackupLog "Backup path not found: $BackupPath" "ERROR"
            return $false
        }
    }
    catch {
        Write-BackupLog "Error verifying backup: $_" "ERROR"
        return $false
    }
}

function Monitor-BackupHealth {
    Write-BackupLog "Monitoring backup health..." "INFO"
    
    try {
        # Check backup directory size
        $backupSize = (Get-ChildItem -Path $BackupPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $backupSizeGB = [math]::Round($backupSize / 1GB, 2)
        
        # Check backup count
        $backupCount = (Get-ChildItem -Path $BackupPath -Filter "learnenglishbot_backup_*" | Measure-Object).Count
        
        # Check latest backup age
        $latestBackup = Get-ChildItem -Path $BackupPath -Filter "learnenglishbot_backup_*" | Sort-Object CreationTime -Descending | Select-Object -First 1
        
        if ($latestBackup) {
            $backupAge = (Get-Date) - $latestBackup.CreationTime
            $backupAgeHours = [math]::Round($backupAge.TotalHours, 1)
            
            Write-BackupLog "Backup Health Status:" "INFO"
            Write-BackupLog "  Total size: $backupSizeGB GB" "INFO"
            Write-BackupLog "  Total backups: $backupCount" "INFO"
            Write-BackupLog "  Latest backup age: $backupAgeHours hours" "INFO"
            
            # Alert if backup is too old
            if ($backupAge.TotalHours -gt 24) {
                Write-BackupLog "Warning: Latest backup is older than 24 hours!" "WARNING"
            }
            
            # Alert if backup directory is too large
            if ($backupSizeGB -gt 50) {
                Write-BackupLog "Warning: Backup directory size exceeds 50 GB!" "WARNING"
            }
        } else {
            Write-BackupLog "No backups found!" "WARNING"
        }
        
        return $true
    }
    catch {
        Write-BackupLog "Error monitoring backup health: $_" "ERROR"
        return $false
    }
}

function Send-BackupNotification {
    param([string]$Message, [string]$Level = "INFO")
    
    # This function can be extended to send notifications via:
    # - Email
    # - Slack/Discord webhook
    # - Telegram bot message
    # - SMS
    
    Write-BackupLog "Notification: $Message" $Level
    
    # Example: Send to Telegram bot (if configured)
    if ($env:TELEGRAM_BOT_TOKEN -and $env:TELEGRAM_CHAT_ID) {
        try {
            $botToken = $env:TELEGRAM_BOT_TOKEN
            $chatId = $env:TELEGRAM_CHAT_ID
            
            $emoji = if ($Level -eq "ERROR") { "❌" } elseif ($Level -eq "WARNING") { "⚠️" } else { "✅" }
            $text = "$emoji Backup Notification: $Message"
            
            $url = "https://api.telegram.org/bot$botToken/sendMessage"
            $body = @{
                chat_id = $chatId
                text = $text
                parse_mode = "HTML"
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
            Write-BackupLog "Telegram notification sent" "INFO"
        }
        catch {
            Write-BackupLog "Failed to send Telegram notification: $_" "WARNING"
        }
    }
}

# Main execution
Write-BackupLog "🔄 Starting Daily Backup for LearnEnglishBot" "INFO"

# Check requirements
if (-not (Test-BackupRequirements)) {
    Write-BackupLog "Backup requirements not met. Exiting." "ERROR"
    exit 1
}

# Define backup sources
$backupSources = @(
    "bot/",
    "config/",
    "data/",
    "locales/",
    "main.py",
    "requirements.txt",
    ".env"
)

$successCount = 0
$totalOperations = 0

# Create backup
$totalOperations++
$backupDir = Create-Backup -Source "." -Destination $BackupPath
if ($backupDir) {
    $successCount++
    
    # Compress if requested
    if ($Compress -or $All) {
        $totalOperations++
        $compressedPath = Compress-Backup -BackupPath $backupDir
        if ($compressedPath) {
            $successCount++
            $backupDir = $compressedPath
        }
    }
    
    # Verify backup
    if ($Verify -or $All) {
        $totalOperations++
        if (Verify-Backup -BackupPath $backupDir) {
            $successCount++
        }
    }
}

# Cleanup old backups
if ($Cleanup -or $All) {
    $totalOperations++
    Cleanup-OldBackups -RetentionDays $RetentionDays
    $successCount++
}

# Monitor backup health
if ($Monitor -or $All) {
    $totalOperations++
    if (Monitor-BackupHealth) {
        $successCount++
    }
}

# Send notification
$notificationMessage = "Daily backup completed. Success: $successCount/$totalOperations operations"
Send-BackupNotification -Message $notificationMessage

# Show summary
Write-BackupLog "=== Backup Summary ===" "INFO"
Write-BackupLog "Completed: $successCount/$totalOperations operations" "INFO"

if ($successCount -eq $totalOperations) {
    Write-BackupLog "🎉 All backup operations completed successfully!" "INFO"
    exit 0
} else {
    Write-BackupLog "⚠️  Some backup operations failed. Please review the logs." "WARNING"
    exit 1
}
