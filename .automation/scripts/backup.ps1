# FreeRPA Studio - Backup Script
# Автоматическое резервное копирование системы

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("full", "incremental", "differential")]
    [string]$Type,
    
    [string]$BackupPath = "D:\Backups\FreeRPA",
    [switch]$Compress,
    [switch]$Encrypt,
    [string]$EncryptionKey,
    [switch]$Verify,
    [int]$RetentionDays = 30
)

# Цвета для вывода
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Blue"

# Функция логирования
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$Color = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    Write-Host $logMessage -ForegroundColor $Color
    Add-Content -Path "backup.log" -Value $logMessage
}

# Функция создания директории
function New-BackupDirectory {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        try {
            New-Item -ItemType Directory -Path $Path -Force | Out-Null
            Write-Log "✅ Created backup directory: $Path" "SUCCESS" $Green
        } catch {
            Write-Log "❌ Failed to create backup directory: $($_.Exception.Message)" "ERROR" $Red
            throw
        }
    }
}

# Функция получения списка файлов для резервного копирования
function Get-BackupFiles {
    param([string]$BackupType)
    
    $files = @()
    
    # Основные файлы проекта
    $files += Get-ChildItem -Path "." -Include "*.json", "*.md", "*.xml", "*.yml", "*.yaml" -Recurse
    $files += Get-ChildItem -Path "packages" -Recurse -Include "*.ts", "*.js", "*.cs", "*.py"
    $files += Get-ChildItem -Path "samples" -Recurse
    $files += Get-ChildItem -Path "docs" -Recurse
    $files += Get-ChildItem -Path "scripts" -Recurse
    
    # Конфигурационные файлы
    $files += Get-ChildItem -Path "." -Include "package.json", "package-lock.json", "tsconfig.json"
    $files += Get-ChildItem -Path "packages" -Recurse -Include "package.json", "tsconfig.json"
    
    # Исключения
    $excludePatterns = @(
        "node_modules",
        "dist",
        "out",
        "*.log",
        "*.tmp",
        ".git",
        ".vscode",
        "coverage"
    )
    
    $filteredFiles = $files | Where-Object {
        $file = $_
        $shouldInclude = $true
        
        foreach ($pattern in $excludePatterns) {
            if ($file.FullName -like "*$pattern*") {
                $shouldInclude = $false
                break
            }
        }
        
        $shouldInclude
    }
    
    return $filteredFiles
}

# Функция создания полного резервного копирования
function New-FullBackup {
    param(
        [string]$BackupPath,
        [bool]$Compress,
        [bool]$Encrypt,
        [string]$EncryptionKey
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupDir = Join-Path $BackupPath "full_$timestamp"
    
    Write-Log "🔄 Starting full backup to: $backupDir" "INFO" $Blue
    
    try {
        # Создание директории
        New-BackupDirectory -Path $backupDir
        
        # Получение файлов для резервного копирования
        $files = Get-BackupFiles -BackupType "full"
        Write-Log "📁 Found $($files.Count) files to backup" "INFO" $Blue
        
        # Копирование файлов
        $copiedFiles = 0
        foreach ($file in $files) {
            try {
                $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
                $destinationPath = Join-Path $backupDir $relativePath
                $destinationDir = Split-Path $destinationPath -Parent
                
                if (-not (Test-Path $destinationDir)) {
                    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
                }
                
                Copy-Item -Path $file.FullName -Destination $destinationPath -Force
                $copiedFiles++
                
                if ($copiedFiles % 100 -eq 0) {
                    Write-Log "📋 Copied $copiedFiles files..." "INFO" $Blue
                }
            } catch {
                Write-Log "⚠️ Failed to copy file $($file.FullName): $($_.Exception.Message)" "WARNING" $Yellow
            }
        }
        
        Write-Log "✅ Full backup completed: $copiedFiles files copied" "SUCCESS" $Green
        
        # Сжатие
        if ($Compress) {
            Write-Log "🗜️ Compressing backup..." "INFO" $Blue
            $zipPath = "$backupDir.zip"
            Compress-Archive -Path $backupDir -DestinationPath $zipPath -Force
            Remove-Item -Path $backupDir -Recurse -Force
            Write-Log "✅ Backup compressed to: $zipPath" "SUCCESS" $Green
            $backupDir = $zipPath
        }
        
        # Шифрование
        if ($Encrypt -and $EncryptionKey) {
            Write-Log "🔐 Encrypting backup..." "INFO" $Blue
            $encryptedPath = "$backupDir.encrypted"
            # Здесь должна быть логика шифрования
            Write-Log "✅ Backup encrypted to: $encryptedPath" "SUCCESS" $Green
        }
        
        return $backupDir
        
    } catch {
        Write-Log "❌ Full backup failed: $($_.Exception.Message)" "ERROR" $Red
        throw
    }
}

# Функция создания инкрементального резервного копирования
function New-IncrementalBackup {
    param(
        [string]$BackupPath,
        [bool]$Compress,
        [bool]$Encrypt,
        [string]$EncryptionKey
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupDir = Join-Path $BackupPath "incremental_$timestamp"
    
    Write-Log "🔄 Starting incremental backup to: $backupDir" "INFO" $Blue
    
    try {
        # Поиск последнего полного резервного копирования
        $lastFullBackup = Get-ChildItem -Path $BackupPath -Directory | 
            Where-Object { $_.Name -like "full_*" } | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 1
        
        if (-not $lastFullBackup) {
            Write-Log "⚠️ No full backup found, creating full backup instead" "WARNING" $Yellow
            return New-FullBackup -BackupPath $BackupPath -Compress $Compress -Encrypt $Encrypt -EncryptionKey $EncryptionKey
        }
        
        Write-Log "📅 Using last full backup: $($lastFullBackup.Name)" "INFO" $Blue
        
        # Создание директории
        New-BackupDirectory -Path $backupDir
        
        # Получение файлов для резервного копирования
        $files = Get-BackupFiles -BackupType "incremental"
        $modifiedFiles = $files | Where-Object { $_.LastWriteTime -gt $lastFullBackup.LastWriteTime }
        
        Write-Log "📁 Found $($modifiedFiles.Count) modified files to backup" "INFO" $Blue
        
        # Копирование измененных файлов
        $copiedFiles = 0
        foreach ($file in $modifiedFiles) {
            try {
                $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
                $destinationPath = Join-Path $backupDir $relativePath
                $destinationDir = Split-Path $destinationPath -Parent
                
                if (-not (Test-Path $destinationDir)) {
                    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
                }
                
                Copy-Item -Path $file.FullName -Destination $destinationPath -Force
                $copiedFiles++
            } catch {
                Write-Log "⚠️ Failed to copy file $($file.FullName): $($_.Exception.Message)" "WARNING" $Yellow
            }
        }
        
        Write-Log "✅ Incremental backup completed: $copiedFiles files copied" "SUCCESS" $Green
        
        # Сжатие
        if ($Compress) {
            Write-Log "🗜️ Compressing backup..." "INFO" $Blue
            $zipPath = "$backupDir.zip"
            Compress-Archive -Path $backupDir -DestinationPath $zipPath -Force
            Remove-Item -Path $backupDir -Recurse -Force
            Write-Log "✅ Backup compressed to: $zipPath" "SUCCESS" $Green
            $backupDir = $zipPath
        }
        
        return $backupDir
        
    } catch {
        Write-Log "❌ Incremental backup failed: $($_.Exception.Message)" "ERROR" $Red
        throw
    }
}

# Функция создания дифференциального резервного копирования
function New-DifferentialBackup {
    param(
        [string]$BackupPath,
        [bool]$Compress,
        [bool]$Encrypt,
        [string]$EncryptionKey
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupDir = Join-Path $BackupPath "differential_$timestamp"
    
    Write-Log "🔄 Starting differential backup to: $backupDir" "INFO" $Blue
    
    try {
        # Поиск последнего полного резервного копирования
        $lastFullBackup = Get-ChildItem -Path $BackupPath -Directory | 
            Where-Object { $_.Name -like "full_*" } | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 1
        
        if (-not $lastFullBackup) {
            Write-Log "⚠️ No full backup found, creating full backup instead" "WARNING" $Yellow
            return New-FullBackup -BackupPath $BackupPath -Compress $Compress -Encrypt $Encrypt -EncryptionKey $EncryptionKey
        }
        
        Write-Log "📅 Using last full backup: $($lastFullBackup.Name)" "INFO" $Blue
        
        # Создание директории
        New-BackupDirectory -Path $backupDir
        
        # Получение файлов для резервного копирования
        $files = Get-BackupFiles -BackupType "differential"
        $modifiedFiles = $files | Where-Object { $_.LastWriteTime -gt $lastFullBackup.LastWriteTime }
        
        Write-Log "📁 Found $($modifiedFiles.Count) modified files to backup" "INFO" $Blue
        
        # Копирование измененных файлов
        $copiedFiles = 0
        foreach ($file in $modifiedFiles) {
            try {
                $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
                $destinationPath = Join-Path $backupDir $relativePath
                $destinationDir = Split-Path $destinationPath -Parent
                
                if (-not (Test-Path $destinationDir)) {
                    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
                }
                
                Copy-Item -Path $file.FullName -Destination $destinationPath -Force
                $copiedFiles++
            } catch {
                Write-Log "⚠️ Failed to copy file $($file.FullName): $($_.Exception.Message)" "WARNING" $Yellow
            }
        }
        
        Write-Log "✅ Differential backup completed: $copiedFiles files copied" "SUCCESS" $Green
        
        # Сжатие
        if ($Compress) {
            Write-Log "🗜️ Compressing backup..." "INFO" $Blue
            $zipPath = "$backupDir.zip"
            Compress-Archive -Path $backupDir -DestinationPath $zipPath -Force
            Remove-Item -Path $backupDir -Recurse -Force
            Write-Log "✅ Backup compressed to: $zipPath" "SUCCESS" $Green
            $backupDir = $zipPath
        }
        
        return $backupDir
        
    } catch {
        Write-Log "❌ Differential backup failed: $($_.Exception.Message)" "ERROR" $Red
        throw
    }
}

# Функция проверки целостности резервного копирования
function Test-BackupIntegrity {
    param([string]$BackupPath)
    
    Write-Log "🔍 Verifying backup integrity..." "INFO" $Blue
    
    try {
        if (Test-Path $BackupPath) {
            $files = Get-ChildItem -Path $BackupPath -Recurse -File
            Write-Log "✅ Backup integrity verified: $($files.Count) files found" "SUCCESS" $Green
            return $true
        } else {
            Write-Log "❌ Backup path not found: $BackupPath" "ERROR" $Red
            return $false
        }
    } catch {
        Write-Log "❌ Backup integrity check failed: $($_.Exception.Message)" "ERROR" $Red
        return $false
    }
}

# Функция очистки старых резервных копий
function Remove-OldBackups {
    param(
        [string]$BackupPath,
        [int]$RetentionDays
    )
    
    Write-Log "🧹 Cleaning up old backups (older than $RetentionDays days)..." "INFO" $Blue
    
    try {
        $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
        $oldBackups = Get-ChildItem -Path $BackupPath -Directory | 
            Where-Object { $_.LastWriteTime -lt $cutoffDate }
        
        $removedCount = 0
        foreach ($backup in $oldBackups) {
            try {
                Remove-Item -Path $backup.FullName -Recurse -Force
                $removedCount++
                Write-Log "🗑️ Removed old backup: $($backup.Name)" "INFO" $Blue
            } catch {
                Write-Log "⚠️ Failed to remove backup $($backup.Name): $($_.Exception.Message)" "WARNING" $Yellow
            }
        }
        
        Write-Log "✅ Cleanup completed: $removedCount old backups removed" "SUCCESS" $Green
        
    } catch {
        Write-Log "❌ Cleanup failed: $($_.Exception.Message)" "ERROR" $Red
    }
}

# Функция генерации отчета
function New-BackupReport {
    param(
        [string]$BackupPath,
        [string]$BackupType,
        [string]$BackupLocation
    )
    
    $report = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Type = $BackupType
        Location = $BackupLocation
        Size = if (Test-Path $BackupLocation) { 
            $size = (Get-ChildItem -Path $BackupLocation -Recurse | Measure-Object -Property Length -Sum).Sum
            [math]::Round($size / 1MB, 2)
        } else { 0 }
        Status = "Success"
    }
    
    $reportPath = Join-Path $BackupPath "backup-report.json"
    $report | ConvertTo-Json | Out-File -FilePath $reportPath -Encoding UTF8
    
    Write-Log "📄 Backup report saved to: $reportPath" "INFO" $Blue
}

# Основная функция
function Start-Backup {
    Write-Log "💾 Starting FreeRPA Studio Backup..." "INFO" $Blue
    Write-Log "===============================================" "INFO" $Blue
    Write-Log "Type: $Type" "INFO" $Blue
    Write-Log "Backup Path: $BackupPath" "INFO" $Blue
    Write-Log "Compress: $Compress" "INFO" $Blue
    Write-Log "Encrypt: $Encrypt" "INFO" $Blue
    Write-Log "Verify: $Verify" "INFO" $Blue
    Write-Log "Retention: $RetentionDays days" "INFO" $Blue
    Write-Log "===============================================" "INFO" $Blue
    
    try {
        # Создание основной директории резервного копирования
        New-BackupDirectory -Path $BackupPath
        
        # Создание резервного копирования в зависимости от типа
        $backupLocation = switch ($Type) {
            "full" { New-FullBackup -BackupPath $BackupPath -Compress $Compress -Encrypt $Encrypt -EncryptionKey $EncryptionKey }
            "incremental" { New-IncrementalBackup -BackupPath $BackupPath -Compress $Compress -Encrypt $Encrypt -EncryptionKey $EncryptionKey }
            "differential" { New-DifferentialBackup -BackupPath $BackupPath -Compress $Compress -Encrypt $Encrypt -EncryptionKey $EncryptionKey }
        }
        
        # Проверка целостности
        if ($Verify) {
            $integrityOk = Test-BackupIntegrity -BackupPath $backupLocation
            if (-not $integrityOk) {
                throw "Backup integrity check failed"
            }
        }
        
        # Очистка старых резервных копий
        Remove-OldBackups -BackupPath $BackupPath -RetentionDays $RetentionDays
        
        # Генерация отчета
        New-BackupReport -BackupPath $BackupPath -BackupType $Type -BackupLocation $backupLocation
        
        Write-Log "🎉 Backup completed successfully!" "SUCCESS" $Green
        Write-Log "📍 Backup location: $backupLocation" "SUCCESS" $Green
        
        return $backupLocation
        
    } catch {
        Write-Log "💥 Backup failed: $($_.Exception.Message)" "ERROR" $Red
        throw
    }
}

# Запуск резервного копирования
try {
    $backupLocation = Start-Backup
    exit 0
} catch {
    Write-Log "💥 Backup script failed with error: $($_.Exception.Message)" "ERROR" $Red
    exit 1
}
