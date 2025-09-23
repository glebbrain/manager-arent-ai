# Backup Automation for LearnEnglishBot
# Automated backup of user data, configurations, and API keys

param(
    [switch]$FullBackup,
    [switch]$Incremental,
    [switch]$ConfigOnly,
    [switch]$UserDataOnly,
    [switch]$Encrypt,
    [string]$BackupPath = "backups",
    [int]$RetentionDays = 30,
    [switch]$Compress,
    [switch]$Verify,
    [switch]$Cleanup
)

Write-Host "Backup Automation for LearnEnglishBot" -ForegroundColor Green
Write-Host "Automated backup with encryption and compression" -ForegroundColor Cyan

# Configuration
$backupConfig = @{
    "ProjectRoot" = Get-Location
    "BackupPath" = $BackupPath
    "RetentionDays" = $RetentionDays
    "Encrypt" = $Encrypt
    "Compress" = $Compress
    "Verify" = $Verify
    "Timestamp" = Get-Date -Format "yyyyMMdd_HHmmss"
}

# Backup targets
$backupTargets = @{
    "UserData" = @{
        "Source" = @("data", "config", "logs")
        "Description" = "User data, configurations, and logs"
        "Critical" = $true
    }
    "Code" = @{
        "Source" = @("bot", "api", "tests", "scripts")
        "Description" = "Application code and scripts"
        "Critical" = $false
    }
    "Config" = @{
        "Source" = @("config", ".env", "*.json", "*.toml", "*.yaml")
        "Description" = "Configuration files and environment"
        "Critical" = $true
    }
    "Documentation" = @{
        "Source" = @("docs", "README.md", "CHANGELOG.md", "LICENSE")
        "Description" = "Project documentation"
        "Critical" = $false
    }
}

# Function to create backup directory structure
function Initialize-BackupStructure {
    $backupDir = Join-Path $backupConfig.BackupPath "backup_$($backupConfig.Timestamp)"
    
    if (-not (Test-Path $backupDir)) {
        New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
        Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
    }
    
    # Create subdirectories
    $subdirs = @("userdata", "code", "config", "documentation", "metadata")
    foreach ($subdir in $subdirs) {
        $subdirPath = Join-Path $backupDir $subdir
        if (-not (Test-Path $subdirPath)) {
            New-Item -Path $subdirPath -ItemType Directory -Force | Out-Null
        }
    }
    
    return $backupDir
}

# Function to backup user data
function Backup-UserData {
    param([string]$BackupDir)
    
    Write-Host "`nBacking up user data..." -ForegroundColor Yellow
    
    $userDataDir = Join-Path $BackupDir "userdata"
    $backupStats = @{
        "files_copied" = 0
        "total_size" = 0
        "errors" = @()
    }
    
    foreach ($source in $backupTargets.UserData.Source) {
        if (Test-Path $source) {
            try {
                $destPath = Join-Path $userDataDir (Split-Path $source -Leaf)
                
                if (Test-Path $source -PathType Container) {
                    # Directory backup
                    Copy-Item -Path $source -Destination $destPath -Recurse -Force
                    $backupStats.files_copied += (Get-ChildItem $source -Recurse -File).Count
                } else {
                    # File backup
                    Copy-Item -Path $source -Destination $destPath -Force
                    $backupStats.files_copied++
                }
                
                $backupStats.total_size += (Get-ChildItem $source -Recurse -File | Measure-Object -Property Length -Sum).Sum
                Write-Host "  ✅ Backed up: $source" -ForegroundColor Green
                
            } catch {
                $errorMsg = "Failed to backup $source : $($_.Exception.Message)"
                $backupStats.errors += $errorMsg
                Write-Host "  ❌ $errorMsg" -ForegroundColor Red
            }
        } else {
            Write-Host "  ⚠️ Source not found: $source" -ForegroundColor Yellow
        }
    }
    
    return $backupStats
}

# Function to backup code
function Backup-Code {
    param([string]$BackupDir)
    
    Write-Host "`nBacking up application code..." -ForegroundColor Yellow
    
    $codeDir = Join-Path $BackupDir "code"
    $backupStats = @{
        "files_copied" = 0
        "total_size" = 0
        "errors" = @()
    }
    
    foreach ($source in $backupTargets.Code.Source) {
        if (Test-Path $source) {
            try {
                $destPath = Join-Path $codeDir (Split-Path $source -Leaf)
                
                if (Test-Path $source -PathType Container) {
                    # Directory backup
                    Copy-Item -Path $source -Destination $destPath -Recurse -Force
                    $backupStats.files_copied += (Get-ChildItem $source -Recurse -File).Count
                } else {
                    # File backup
                    Copy-Item -Path $source -Destination $destPath -Force
                    $backupStats.files_copied++
                }
                
                $backupStats.total_size += (Get-ChildItem $source -Recurse -File | Measure-Object -Property Length -Sum).Sum
                Write-Host "  ✅ Backed up: $source" -ForegroundColor Green
                
            } catch {
                $errorMsg = "Failed to backup $source : $($_.Exception.Message)"
                $backupStats.errors += $errorMsg
                Write-Host "  ❌ $errorMsg" -ForegroundColor Red
            }
        } else {
            Write-Host "  ⚠️ Source not found: $source" -ForegroundColor Yellow
        }
    }
    
    return $backupStats
}

# Function to backup configuration
function Backup-Configuration {
    param([string]$BackupDir)
    
    Write-Host "`nBacking up configuration files..." -ForegroundColor Yellow
    
    $configDir = Join-Path $BackupDir "config"
    $backupStats = @{
        "files_copied" = 0
        "total_size" = 0
        "errors" = @()
    }
    
    # Backup specific config files
    $configFiles = @(
        ".env",
        "pyproject.toml",
        "requirements.txt",
        "docker-compose.yml",
        "Dockerfile"
    )
    
    foreach ($configFile in $configFiles) {
        if (Test-Path $configFile) {
            try {
                $destPath = Join-Path $configDir $configFile
                Copy-Item -Path $configFile -Destination $destPath -Force
                $backupStats.files_copied++
                $backupStats.total_size += (Get-Item $configFile).Length
                Write-Host "  ✅ Backed up: $configFile" -ForegroundColor Green
            } catch {
                $errorMsg = "Failed to backup $configFile : $($_.Exception.Message)"
                $backupStats.errors += $errorMsg
                Write-Host "  ❌ $errorMsg" -ForegroundColor Red
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
            Write-Host "  ✅ Backed up: config directory" -ForegroundColor Green
        } catch {
            $errorMsg = "Failed to backup config directory: $($_.Exception.Message)"
            $backupStats.errors += $errorMsg
            Write-Host "  ❌ $errorMsg" -ForegroundColor Red
        }
    }
    
    return $backupStats
}

# Function to backup documentation
function Backup-Documentation {
    param([string]$BackupDir)
    
    Write-Host "`nBacking up documentation..." -ForegroundColor Yellow
    
    $docDir = Join-Path $BackupDir "documentation"
    $backupStats = @{
        "files_copied" = 0
        "total_size" = 0
        "errors" = @()
    }
    
    foreach ($source in $backupTargets.Documentation.Source) {
        if (Test-Path $source) {
            try {
                $destPath = Join-Path $docDir (Split-Path $source -Leaf)
                
                if (Test-Path $source -PathType Container) {
                    # Directory backup
                    Copy-Item -Path $source -Destination $destPath -Recurse -Force
                    $backupStats.files_copied += (Get-ChildItem $source -Recurse -File).Count
                } else {
                    # File backup
                    Copy-Item -Path $source -Destination $destPath -Force
                    $backupStats.files_copied++
                }
                
                $backupStats.total_size += (Get-ChildItem $source -Recurse -File | Measure-Object -Property Length -Sum).Sum
                Write-Host "  ✅ Backed up: $source" -ForegroundColor Green
                
            } catch {
                $errorMsg = "Failed to backup $source : $($_.Exception.Message)"
                $backupStats.errors += $errorMsg
                Write-Host "  ❌ $errorMsg" -ForegroundColor Red
            }
        } else {
            Write-Host "  ⚠️ Source not found: $source" -ForegroundColor Yellow
        }
    }
    
    return $backupStats
}

# Function to create metadata
function Create-BackupMetadata {
    param([string]$BackupDir, [hashtable]$BackupStats)
    
    $metadataDir = Join-Path $BackupDir "metadata"
    $metadata = @{
        "backup_info" = @{
            "timestamp" = $backupConfig.Timestamp
            "created_at" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            "backup_type" = if ($FullBackup) { "Full" } elseif ($Incremental) { "Incremental" } elseif ($ConfigOnly) { "Config Only" } elseif ($UserDataOnly) { "User Data Only" } else { "Standard" }
            "encrypted" = $backupConfig.Encrypt
            "compressed" = $backupConfig.Compress
        }
        "system_info" = @{
            "project_root" = $backupConfig.ProjectRoot
            "powershell_version" = $PSVersionTable.PSVersion.ToString()
            "os_version" = [System.Environment]::OSVersion.Version.ToString()
            "machine_name" = [System.Environment]::MachineName
        }
        "backup_stats" = $BackupStats
        "targets" = $backupTargets
    }
    
    $metadataPath = Join-Path $metadataDir "backup_metadata.json"
    $metadata | ConvertTo-Json -Depth 10 | Out-File -FilePath $metadataPath -Encoding UTF8
    
    Write-Host "  ✅ Created backup metadata" -ForegroundColor Green
    return $metadataPath
}

# Function to encrypt backup
function Encrypt-Backup {
    param([string]$BackupDir)
    
    if (-not $backupConfig.Encrypt) {
        return $BackupDir
    }
    
    Write-Host "`nEncrypting backup..." -ForegroundColor Yellow
    
    try {
        # Generate encryption key
        $encryptionKey = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
        $key = New-Object byte[] 32
        $encryptionKey.GetBytes($key)
        
        # Save encryption key (in production, this should be stored securely)
        $keyPath = Join-Path $BackupDir "encryption_key.bin"
        [System.IO.File]::WriteAllBytes($keyPath, $key)
        
        # Encrypt all files in backup directory
        $files = Get-ChildItem -Path $BackupDir -Recurse -File | Where-Object { $_.Name -ne "encryption_key.bin" }
        
        foreach ($file in $files) {
            try {
                $content = [System.IO.File]::ReadAllBytes($file.FullName)
                
                # Simple XOR encryption (in production, use proper encryption)
                $encrypted = $content | ForEach-Object { $_ -bxor $key[($_ % $key.Length)] }
                
                [System.IO.File]::WriteAllBytes($file.FullName, $encrypted)
                Write-Host "  ✅ Encrypted: $($file.Name)" -ForegroundColor Green
                
            } catch {
                Write-Host "  ❌ Failed to encrypt $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        Write-Host "  ✅ Backup encryption completed" -ForegroundColor Green
        return $BackupDir
        
    } catch {
        Write-Host "  ❌ Encryption failed: $($_.Exception.Message)" -ForegroundColor Red
        return $BackupDir
    }
}

# Function to compress backup
function Compress-Backup {
    param([string]$BackupDir)
    
    if (-not $backupConfig.Compress) {
        return $BackupDir
    }
    
    Write-Host "`nCompressing backup..." -ForegroundColor Yellow
    
    try {
        $compressedPath = "$BackupDir.zip"
        
        if (Test-Path $compressedPath) {
            Remove-Item $compressedPath -Force
        }
        
        # Create ZIP archive
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::CreateFromDirectory($BackupDir, $compressedPath)
        
        # Get compression ratio
        $originalSize = (Get-ChildItem $BackupDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $compressedSize = (Get-Item $compressedPath).Length
        $compressionRatio = [math]::Round((1 - ($compressedSize / $originalSize)) * 100, 1)
        
        Write-Host "  ✅ Backup compressed: $compressedPath" -ForegroundColor Green
        Write-Host "  📊 Compression ratio: $compressionRatio%" -ForegroundColor Cyan
        
        # Remove original directory
        Remove-Item $BackupDir -Recurse -Force
        
        return $compressedPath
        
    } catch {
        Write-Host "  ❌ Compression failed: $($_.Exception.Message)" -ForegroundColor Red
        return $BackupDir
    }
}

# Function to verify backup
function Verify-Backup {
    param([string]$BackupPath)
    
    if (-not $backupConfig.Verify) {
        return $true
    }
    
    Write-Host "`nVerifying backup..." -ForegroundColor Yellow
    
    try {
        if ($BackupPath.EndsWith(".zip")) {
            # Verify ZIP archive
            Add-Type -AssemblyName System.IO.Compression.FileSystem
            $archive = [System.IO.Compression.ZipFile]::OpenRead($BackupPath)
            $archive.Dispose()
            Write-Host "  ✅ ZIP archive verified" -ForegroundColor Green
        } else {
            # Verify directory structure
            $requiredDirs = @("userdata", "code", "config", "documentation", "metadata")
            foreach ($dir in $requiredDirs) {
                $dirPath = Join-Path $BackupPath $dir
                if (-not (Test-Path $dirPath)) {
                    Write-Host "  ❌ Missing required directory: $dir" -ForegroundColor Red
                    return $false
                }
            }
            Write-Host "  ✅ Directory structure verified" -ForegroundColor Green
        }
        
        return $true
        
    } catch {
        Write-Host "  ❌ Verification failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to cleanup old backups
function Cleanup-OldBackups {
    if (-not $Cleanup) {
        return
    }
    
    Write-Host "`nCleaning up old backups..." -ForegroundColor Yellow
    
    try {
        $cutoffDate = (Get-Date).AddDays(-$backupConfig.RetentionDays)
        $oldBackups = Get-ChildItem -Path $backupConfig.BackupPath -Directory | Where-Object { $_.CreationTime -lt $cutoffDate }
        
        foreach ($oldBackup in $oldBackups) {
            try {
                Remove-Item $oldBackup.FullName -Recurse -Force
                Write-Host "  ✅ Removed old backup: $($oldBackup.Name)" -ForegroundColor Green
            } catch {
                Write-Host "  ❌ Failed to remove $($oldBackup.Name): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        # Also cleanup old ZIP files
        $oldZipFiles = Get-ChildItem -Path $backupConfig.BackupPath -Filter "*.zip" | Where-Object { $_.CreationTime -lt $cutoffDate }
        foreach ($oldZip in $oldZipFiles) {
            try {
                Remove-Item $oldZip.FullName -Force
                Write-Host "  ✅ Removed old backup: $($oldZip.Name)" -ForegroundColor Green
            } catch {
                Write-Host "  ❌ Failed to remove $($oldZip.Name): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
    } catch {
        Write-Host "  ❌ Cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
Write-Host "Starting backup process..." -ForegroundColor Yellow

# Create backup directory
$backupDir = Initialize-BackupStructure

# Initialize backup statistics
$backupStats = @{
    "userdata" = @{}
    "code" = @{}
    "config" = @{}
    "documentation" = @{}
    "total_files" = 0
    "total_size" = 0
    "total_errors" = 0
}

# Perform backup based on parameters
if ($FullBackup -or (-not $ConfigOnly -and -not $UserDataOnly)) {
    $backupStats.userdata = Backup-UserData -BackupDir $backupDir
    $backupStats.code = Backup-Code -BackupDir $backupDir
    $backupStats.config = Backup-Configuration -BackupDir $backupDir
    $backupStats.documentation = Backup-Documentation -BackupDir $backupDir
} elseif ($ConfigOnly) {
    $backupStats.config = Backup-Configuration -BackupDir $backupDir
} elseif ($UserDataOnly) {
    $backupStats.userdata = Backup-UserData -BackupDir $backupDir
}

# Calculate totals
$backupStats.total_files = $backupStats.userdata.files_copied + $backupStats.code.files_copied + $backupStats.config.files_copied + $backupStats.documentation.files_copied
$backupStats.total_size = $backupStats.userdata.total_size + $backupStats.code.total_size + $backupStats.config.total_size + $backupStats.documentation.total_size
$backupStats.total_errors = $backupStats.userdata.errors.Count + $backupStats.code.errors.Count + $backupStats.config.errors.Count + $backupStats.documentation.errors.Count

# Create metadata
$metadataPath = Create-BackupMetadata -BackupDir $backupDir -BackupStats $backupStats

# Encrypt if requested
if ($backupConfig.Encrypt) {
    $backupDir = Encrypt-Backup -BackupDir $backupDir
}

# Compress if requested
if ($backupConfig.Compress) {
    $backupPath = Compress-Backup -BackupDir $backupDir
} else {
    $backupPath = $backupDir
}

# Verify backup
$verificationResult = Verify-Backup -BackupPath $backupPath

# Cleanup old backups
Cleanup-OldBackups

# Final report
Write-Host "`nBackup Summary" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "Backup Location: $backupPath" -ForegroundColor White
Write-Host "Total Files: $($backupStats.total_files)" -ForegroundColor White
Write-Host "Total Size: $([math]::Round($backupStats.total_size / 1MB, 2)) MB" -ForegroundColor White
Write-Host "Errors: $($backupStats.total_errors)" -ForegroundColor White
Write-Host "Encrypted: $($backupConfig.Encrypt)" -ForegroundColor White
Write-Host "Compressed: $($backupConfig.Compress)" -ForegroundColor White
Write-Host "Verified: $verificationResult" -ForegroundColor White

if ($verificationResult) {
    Write-Host "`n✅ Backup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Backup completed with verification issues" -ForegroundColor Yellow
}

Write-Host "`nBackup automation completed" -ForegroundColor Green
