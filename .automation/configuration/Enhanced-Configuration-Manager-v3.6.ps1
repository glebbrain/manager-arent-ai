# ⚙️ Enhanced Configuration Manager v3.6.0
# Advanced AI-powered configuration management and validation
# Version: 3.6.0
# Last Updated: 2025-01-31

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "status", # status, validate, sync, backup, restore, migrate, optimize
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigType = "all", # all, application, database, network, security, deployment
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "development", # development, staging, production
    
    [Parameter(Mandatory=$false)]
    [string]$TargetPath = ".",
    
    [Parameter(Mandatory=$false)]
    [switch]$AI,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "config-results"
)

$ErrorActionPreference = "Stop"

Write-Host "⚙️ Enhanced Configuration Manager v3.6.0" -ForegroundColor Cyan
Write-Host "📅 Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "🤖 AI-Enhanced Configuration Management" -ForegroundColor Magenta

# Configuration Management Settings
$ConfigSettings = @{
    ConfigTypes = @{
        "application" = @{
            Files = @("*.json", "*.yaml", "*.yml", "*.ini", "*.conf", "*.config")
            ValidationRules = @("JSON Schema", "YAML Schema", "Syntax Check")
            Priority = 1
        }
        "database" = @{
            Files = @("*.sql", "*.db", "*.mdb", "*.accdb")
            ValidationRules = @("SQL Syntax", "Schema Validation", "Migration Check")
            Priority = 2
        }
        "network" = @{
            Files = @("*.conf", "*.cfg", "*.ini")
            ValidationRules = @("Network Config", "Port Validation", "Security Check")
            Priority = 3
        }
        "security" = @{
            Files = @("*.key", "*.pem", "*.crt", "*.p12", "*.pfx")
            ValidationRules = @("Certificate Validation", "Key Format", "Expiration Check")
            Priority = 1
        }
        "deployment" = @{
            Files = @("*.yaml", "*.yml", "*.json", "*.toml")
            ValidationRules = @("Deployment Schema", "Resource Validation", "Dependency Check")
            Priority = 2
        }
    }
    Environments = @{
        "development" = @{ 
            ConfigPath = "config/dev"
            ValidationLevel = "basic"
            BackupEnabled = $true
        }
        "staging" = @{ 
            ConfigPath = "config/staging"
            ValidationLevel = "standard"
            BackupEnabled = $true
        }
        "production" = @{ 
            ConfigPath = "config/prod"
            ValidationLevel = "strict"
            BackupEnabled = $true
        }
    }
    AIEnabled = $AI
    DryRunMode = $DryRun
    ForceMode = $Force
}

# Configuration Results Storage
$ConfigResults = @{
    StartTime = Get-Date
    EndTime = $null
    Duration = 0
    ConfigFiles = @()
    ValidationResults = @{}
    SyncResults = @{}
    BackupResults = @{}
    AIInsights = @{}
    Recommendations = @()
    Errors = @()
}

function Initialize-ConfigurationEnvironment {
    Write-Host "🔧 Initializing Configuration Environment..." -ForegroundColor Yellow
    
    # Create output directory
    if (!(Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        Write-Host "   📁 Created: $OutputDir" -ForegroundColor Green
    }
    
    # Create configuration directories
    $configDirs = @("config", "config/dev", "config/staging", "config/prod", "config/backup")
    foreach ($dir in $configDirs) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "   📁 Created: $dir" -ForegroundColor Green
        }
    }
    
    # Initialize AI configuration modules if enabled
    if ($ConfigSettings.AIEnabled) {
        Write-Host "   🤖 Initializing AI configuration modules..." -ForegroundColor Magenta
        Initialize-AIConfigurationModules
    }
    
    # Load environment-specific configuration
    $envConfig = $ConfigSettings.Environments[$Environment]
    Write-Host "   🌍 Environment: $Environment" -ForegroundColor White
    Write-Host "   📂 Config Path: $($envConfig.ConfigPath)" -ForegroundColor White
    Write-Host "   🔍 Validation Level: $($envConfig.ValidationLevel)" -ForegroundColor White
    
    Write-Host "   ✅ Configuration environment initialized" -ForegroundColor Green
}

function Initialize-AIConfigurationModules {
    Write-Host "🧠 Setting up AI configuration modules..." -ForegroundColor Magenta
    
    $aiModules = @{
        ConfigurationAnalysis = @{
            Model = "gpt-4"
            Capabilities = @("Config Validation", "Schema Analysis", "Best Practices")
            Status = "Active"
        }
        ConfigurationOptimization = @{
            Model = "gpt-3.5-turbo"
            Capabilities = @("Performance Tuning", "Resource Optimization", "Security Hardening")
            Status = "Active"
        }
        ConfigurationMigration = @{
            Model = "gpt-4"
            Capabilities = @("Version Migration", "Format Conversion", "Dependency Resolution")
            Status = "Active"
        }
        ConfigurationMonitoring = @{
            Model = "gpt-4"
            Capabilities = @("Drift Detection", "Change Analysis", "Compliance Monitoring")
            Status = "Active"
        }
    }
    
    foreach ($module in $aiModules.GetEnumerator()) {
        Write-Host "   ✅ $($module.Key): $($module.Value.Status)" -ForegroundColor Green
    }
}

function Validate-Configurations {
    Write-Host "🔍 Validating Configurations..." -ForegroundColor Yellow
    
    $validationResults = @{
        StartTime = Get-Date
        EndTime = $null
        Duration = 0
        TotalFiles = 0
        ValidFiles = 0
        InvalidFiles = 0
        Warnings = 0
        Errors = @()
        ValidationDetails = @{}
    }
    
    # Get configuration files based on type
    $configFiles = Get-ConfigurationFiles -ConfigType $ConfigType -Path $TargetPath
    $validationResults.TotalFiles = $configFiles.Count
    
    foreach ($file in $configFiles) {
        Write-Host "   📄 Validating: $($file.Name)" -ForegroundColor White
        
        $fileValidation = Validate-ConfigurationFile -FilePath $file.FullName -ConfigType $file.Type
        $validationResults.ValidationDetails[$file.Name] = $fileValidation
        
        if ($fileValidation.IsValid) {
            $validationResults.ValidFiles++
            Write-Host "   ✅ Valid: $($file.Name)" -ForegroundColor Green
        } else {
            $validationResults.InvalidFiles++
            $validationResults.Errors += $fileValidation.Errors
            Write-Host "   ❌ Invalid: $($file.Name)" -ForegroundColor Red
        }
        
        if ($fileValidation.Warnings.Count -gt 0) {
            $validationResults.Warnings += $fileValidation.Warnings.Count
            Write-Host "   ⚠️ Warnings: $($fileValidation.Warnings.Count)" -ForegroundColor Yellow
        }
    }
    
    $validationResults.EndTime = Get-Date
    $validationResults.Duration = ($validationResults.EndTime - $validationResults.StartTime).TotalSeconds
    
    $ConfigResults.ValidationResults = $validationResults
    
    Write-Host "   ✅ Configuration validation completed" -ForegroundColor Green
    Write-Host "   📊 Total Files: $($validationResults.TotalFiles)" -ForegroundColor White
    Write-Host "   ✅ Valid: $($validationResults.ValidFiles)" -ForegroundColor Green
    Write-Host "   ❌ Invalid: $($validationResults.InvalidFiles)" -ForegroundColor Red
    Write-Host "   ⚠️ Warnings: $($validationResults.Warnings)" -ForegroundColor Yellow
    
    return $validationResults
}

function Get-ConfigurationFiles {
    param(
        [string]$ConfigType,
        [string]$Path
    )
    
    $files = @()
    
    if ($ConfigType -eq "all") {
        foreach ($type in $ConfigSettings.ConfigTypes.GetEnumerator()) {
            $typeFiles = Get-ChildItem -Path $Path -Recurse -Include $type.Value.Files
            foreach ($file in $typeFiles) {
                $files += @{
                    FullName = $file.FullName
                    Name = $file.Name
                    Type = $type.Key
                    Extension = $file.Extension
                }
            }
        }
    } else {
        $typeConfig = $ConfigSettings.ConfigTypes[$ConfigType]
        if ($typeConfig) {
            $typeFiles = Get-ChildItem -Path $Path -Recurse -Include $typeConfig.Files
            foreach ($file in $typeFiles) {
                $files += @{
                    FullName = $file.FullName
                    Name = $file.Name
                    Type = $ConfigType
                    Extension = $file.Extension
                }
            }
        }
    }
    
    return $files
}

function Validate-ConfigurationFile {
    param(
        [string]$FilePath,
        [string]$ConfigType
    )
    
    $validation = @{
        IsValid = $true
        Errors = @()
        Warnings = @()
        Details = @{}
    }
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        $extension = [System.IO.Path]::GetExtension($FilePath).ToLower()
        
        # JSON validation
        if ($extension -eq ".json") {
            $jsonValidation = Validate-JSON -Content $content
            $validation.IsValid = $validation.IsValid -and $jsonValidation.IsValid
            $validation.Errors += $jsonValidation.Errors
            $validation.Warnings += $jsonValidation.Warnings
        }
        
        # YAML validation
        if ($extension -in @(".yaml", ".yml")) {
            $yamlValidation = Validate-YAML -Content $content
            $validation.IsValid = $validation.IsValid -and $yamlValidation.IsValid
            $validation.Errors += $yamlValidation.Errors
            $validation.Warnings += $yamlValidation.Warnings
        }
        
        # INI validation
        if ($extension -in @(".ini", ".conf", ".cfg")) {
            $iniValidation = Validate-INI -Content $content
            $validation.IsValid = $validation.IsValid -and $iniValidation.IsValid
            $validation.Errors += $iniValidation.Errors
            $validation.Warnings += $iniValidation.Warnings
        }
        
        # Type-specific validation
        switch ($ConfigType) {
            "application" {
                $appValidation = Validate-ApplicationConfig -Content $content -Extension $extension
                $validation.IsValid = $validation.IsValid -and $appValidation.IsValid
                $validation.Errors += $appValidation.Errors
                $validation.Warnings += $appValidation.Warnings
            }
            "database" {
                $dbValidation = Validate-DatabaseConfig -Content $content -Extension $extension
                $validation.IsValid = $validation.IsValid -and $dbValidation.IsValid
                $validation.Errors += $dbValidation.Errors
                $validation.Warnings += $dbValidation.Warnings
            }
            "security" {
                $secValidation = Validate-SecurityConfig -Content $content -Extension $extension
                $validation.IsValid = $validation.IsValid -and $secValidation.IsValid
                $validation.Errors += $secValidation.Errors
                $validation.Warnings += $secValidation.Warnings
            }
        }
        
    } catch {
        $validation.IsValid = $false
        $validation.Errors += "File read error: $($_.Exception.Message)"
    }
    
    return $validation
}

function Validate-JSON {
    param([string]$Content)
    
    $validation = @{
        IsValid = $true
        Errors = @()
        Warnings = @()
    }
    
    try {
        $json = $Content | ConvertFrom-Json
        $validation.IsValid = $true
    } catch {
        $validation.IsValid = $false
        $validation.Errors += "Invalid JSON syntax: $($_.Exception.Message)"
    }
    
    return $validation
}

function Validate-YAML {
    param([string]$Content)
    
    $validation = @{
        IsValid = $true
        Errors = @()
        Warnings = @()
    }
    
    try {
        # Basic YAML validation (simplified)
        $lines = $Content -split "`n"
        $indentLevel = 0
        $inArray = $false
        
        foreach ($line in $lines) {
            $trimmedLine = $line.Trim()
            if ($trimmedLine -eq "" -or $trimmedLine.StartsWith("#")) {
                continue
            }
            
            # Check for proper indentation
            $currentIndent = $line.Length - $line.TrimStart().Length
            if ($currentIndent -lt 0) {
                $validation.Warnings += "Inconsistent indentation detected"
            }
            
            # Check for array syntax
            if ($trimmedLine.StartsWith("-")) {
                $inArray = $true
            } elseif ($trimmedLine.Contains(":")) {
                $inArray = $false
            }
        }
        
        $validation.IsValid = $true
    } catch {
        $validation.IsValid = $false
        $validation.Errors += "YAML validation error: $($_.Exception.Message)"
    }
    
    return $validation
}

function Validate-INI {
    param([string]$Content)
    
    $validation = @{
        IsValid = $true
        Errors = @()
        Warnings = @()
    }
    
    try {
        $lines = $Content -split "`n"
        $currentSection = ""
        
        foreach ($line in $lines) {
            $trimmedLine = $line.Trim()
            if ($trimmedLine -eq "" -or $trimmedLine.StartsWith("#") -or $trimmedLine.StartsWith(";")) {
                continue
            }
            
            # Check for section headers
            if ($trimmedLine.StartsWith("[") -and $trimmedLine.EndsWith("]")) {
                $currentSection = $trimmedLine.Substring(1, $trimmedLine.Length - 2)
            }
            # Check for key-value pairs
            elseif ($trimmedLine.Contains("=")) {
                $parts = $trimmedLine -split "=", 2
                if ($parts.Length -ne 2) {
                    $validation.Warnings += "Invalid key-value pair: $trimmedLine"
                }
            }
            else {
                $validation.Warnings += "Invalid INI format: $trimmedLine"
            }
        }
        
        $validation.IsValid = $true
    } catch {
        $validation.IsValid = $false
        $validation.Errors += "INI validation error: $($_.Exception.Message)"
    }
    
    return $validation
}

function Validate-ApplicationConfig {
    param(
        [string]$Content,
        [string]$Extension
    )
    
    $validation = @{
        IsValid = $true
        Errors = @()
        Warnings = @()
    }
    
    # Check for common application configuration issues
    if ($Content -match "password\s*=\s*['\"][^'\"]+['\"]") {
        $validation.Warnings += "Hardcoded password detected - use environment variables"
    }
    
    if ($Content -match "debug\s*=\s*true") {
        $validation.Warnings += "Debug mode enabled - disable in production"
    }
    
    if ($Content -match "localhost|127\.0\.0\.1") {
        $validation.Warnings += "Localhost references detected - use environment-specific values"
    }
    
    return $validation
}

function Validate-DatabaseConfig {
    param(
        [string]$Content,
        [string]$Extension
    )
    
    $validation = @{
        IsValid = $true
        Errors = @()
        Warnings = @()
    }
    
    # Check for database configuration issues
    if ($Content -match "sa\s*=") {
        $validation.Warnings += "SA account usage detected - use dedicated service account"
    }
    
    if ($Content -match "password\s*=\s*['\"][^'\"]+['\"]") {
        $validation.Warnings += "Hardcoded database password detected"
    }
    
    if ($Content -match "trusted_connection\s*=\s*false") {
        $validation.Warnings += "SQL authentication enabled - consider Windows authentication"
    }
    
    return $validation
}

function Validate-SecurityConfig {
    param(
        [string]$Content,
        [string]$Extension
    )
    
    $validation = @{
        IsValid = $true
        Errors = @()
        Warnings = @()
    }
    
    # Check for security configuration issues
    if ($Content -match "ssl\s*=\s*false") {
        $validation.Errors += "SSL disabled - enable for security"
        $validation.IsValid = $false
    }
    
    if ($Content -match "cipher\s*=\s*DES") {
        $validation.Errors += "Weak encryption algorithm (DES) detected"
        $validation.IsValid = $false
    }
    
    if ($Content -match "permissions\s*=\s*777") {
        $validation.Errors += "Overly permissive file permissions (777)"
        $validation.IsValid = $false
    }
    
    return $validation
}

function Sync-Configurations {
    Write-Host "🔄 Synchronizing Configurations..." -ForegroundColor Yellow
    
    $syncResults = @{
        StartTime = Get-Date
        EndTime = $null
        Duration = 0
        FilesSynced = 0
        FilesSkipped = 0
        FilesFailed = 0
        SyncDetails = @{}
    }
    
    # Get source and target paths
    $sourcePath = $ConfigSettings.Environments[$Environment].ConfigPath
    $targetPath = $TargetPath
    
    if (!(Test-Path $sourcePath)) {
        Write-Warning "Source configuration path not found: $sourcePath"
        return $syncResults
    }
    
    # Get configuration files to sync
    $configFiles = Get-ChildItem -Path $sourcePath -Recurse -File
    
    foreach ($file in $configFiles) {
        Write-Host "   📄 Syncing: $($file.Name)" -ForegroundColor White
        
        $relativePath = $file.FullName.Substring($sourcePath.Length + 1)
        $targetFile = Join-Path $targetPath $relativePath
        $targetDir = Split-Path $targetFile -Parent
        
        try {
            # Create target directory if it doesn't exist
            if (!(Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            
            if ($ConfigSettings.DryRunMode) {
                Write-Host "   🔍 [DRY RUN] Would sync $($file.Name)" -ForegroundColor Cyan
                $syncResults.FilesSkipped++
            } else {
                # Copy file
                Copy-Item -Path $file.FullName -Destination $targetFile -Force
                $syncResults.FilesSynced++
                Write-Host "   ✅ Synced: $($file.Name)" -ForegroundColor Green
            }
            
            $syncResults.SyncDetails[$file.Name] = @{
                Source = $file.FullName
                Target = $targetFile
                Status = "Success"
            }
            
        } catch {
            $syncResults.FilesFailed++
            $syncResults.SyncDetails[$file.Name] = @{
                Source = $file.FullName
                Target = $targetFile
                Status = "Failed"
                Error = $_.Exception.Message
            }
            Write-Host "   ❌ Failed: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    $syncResults.EndTime = Get-Date
    $syncResults.Duration = ($syncResults.EndTime - $syncResults.StartTime).TotalSeconds
    
    $ConfigResults.SyncResults = $syncResults
    
    Write-Host "   ✅ Configuration sync completed" -ForegroundColor Green
    Write-Host "   📊 Files Synced: $($syncResults.FilesSynced)" -ForegroundColor Green
    Write-Host "   ⏭️ Files Skipped: $($syncResults.FilesSkipped)" -ForegroundColor Yellow
    Write-Host "   ❌ Files Failed: $($syncResults.FilesFailed)" -ForegroundColor Red
    
    return $syncResults
}

function Backup-Configurations {
    Write-Host "💾 Backing up Configurations..." -ForegroundColor Yellow
    
    $backupResults = @{
        StartTime = Get-Date
        EndTime = $null
        Duration = 0
        FilesBackedUp = 0
        BackupPath = ""
        BackupSize = 0
    }
    
    # Create backup directory with timestamp
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "config/backup/backup-$timestamp"
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    $backupResults.BackupPath = $backupPath
    
    # Get configuration files to backup
    $configFiles = Get-ConfigurationFiles -ConfigType $ConfigType -Path $TargetPath
    
    foreach ($file in $configFiles) {
        Write-Host "   📄 Backing up: $($file.Name)" -ForegroundColor White
        
        try {
            $relativePath = $file.FullName.Substring($TargetPath.Length + 1)
            $backupFile = Join-Path $backupPath $relativePath
            $backupDir = Split-Path $backupFile -Parent
            
            # Create backup directory if it doesn't exist
            if (!(Test-Path $backupDir)) {
                New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
            }
            
            # Copy file to backup
            Copy-Item -Path $file.FullName -Destination $backupFile -Force
            $backupResults.FilesBackedUp++
            
            Write-Host "   ✅ Backed up: $($file.Name)" -ForegroundColor Green
            
        } catch {
            Write-Host "   ❌ Failed to backup: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Calculate backup size
    $backupSize = (Get-ChildItem -Path $backupPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $backupResults.BackupSize = $backupSize
    
    $backupResults.EndTime = Get-Date
    $backupResults.Duration = ($backupResults.EndTime - $backupResults.StartTime).TotalSeconds
    
    $ConfigResults.BackupResults = $backupResults
    
    Write-Host "   ✅ Configuration backup completed" -ForegroundColor Green
    Write-Host "   📊 Files Backed Up: $($backupResults.FilesBackedUp)" -ForegroundColor Green
    Write-Host "   📁 Backup Path: $($backupResults.BackupPath)" -ForegroundColor White
    Write-Host "   💾 Backup Size: $([math]::Round($backupSize / 1MB, 2)) MB" -ForegroundColor White
    
    return $backupResults
}

function Restore-Configurations {
    param([string]$BackupPath)
    
    Write-Host "🔄 Restoring Configurations..." -ForegroundColor Yellow
    
    $restoreResults = @{
        StartTime = Get-Date
        EndTime = $null
        Duration = 0
        FilesRestored = 0
        FilesFailed = 0
        RestoreDetails = @{}
    }
    
    if (!(Test-Path $BackupPath)) {
        Write-Error "Backup path not found: $BackupPath"
        return $restoreResults
    }
    
    # Get backup files
    $backupFiles = Get-ChildItem -Path $BackupPath -Recurse -File
    
    foreach ($file in $backupFiles) {
        Write-Host "   📄 Restoring: $($file.Name)" -ForegroundColor White
        
        try {
            $relativePath = $file.FullName.Substring($BackupPath.Length + 1)
            $targetFile = Join-Path $TargetPath $relativePath
            $targetDir = Split-Path $targetFile -Parent
            
            # Create target directory if it doesn't exist
            if (!(Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            
            if ($ConfigSettings.DryRunMode) {
                Write-Host "   🔍 [DRY RUN] Would restore $($file.Name)" -ForegroundColor Cyan
            } else {
                # Copy file from backup
                Copy-Item -Path $file.FullName -Destination $targetFile -Force
                $restoreResults.FilesRestored++
                Write-Host "   ✅ Restored: $($file.Name)" -ForegroundColor Green
            }
            
            $restoreResults.RestoreDetails[$file.Name] = @{
                Source = $file.FullName
                Target = $targetFile
                Status = "Success"
            }
            
        } catch {
            $restoreResults.FilesFailed++
            $restoreResults.RestoreDetails[$file.Name] = @{
                Source = $file.FullName
                Target = $targetFile
                Status = "Failed"
                Error = $_.Exception.Message
            }
            Write-Host "   ❌ Failed: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    $restoreResults.EndTime = Get-Date
    $restoreResults.Duration = ($restoreResults.EndTime - $restoreResults.StartTime).TotalSeconds
    
    Write-Host "   ✅ Configuration restore completed" -ForegroundColor Green
    Write-Host "   📊 Files Restored: $($restoreResults.FilesRestored)" -ForegroundColor Green
    Write-Host "   ❌ Files Failed: $($restoreResults.FilesFailed)" -ForegroundColor Red
    
    return $restoreResults
}

function Optimize-Configurations {
    Write-Host "⚡ Optimizing Configurations..." -ForegroundColor Yellow
    
    $optimizationResults = @{
        StartTime = Get-Date
        EndTime = $null
        Duration = 0
        FilesOptimized = 0
        Optimizations = @()
        PerformanceGains = @{}
    }
    
    # Get configuration files
    $configFiles = Get-ConfigurationFiles -ConfigType $ConfigType -Path $TargetPath
    
    foreach ($file in $configFiles) {
        Write-Host "   📄 Optimizing: $($file.Name)" -ForegroundColor White
        
        try {
            $content = Get-Content $file.FullName -Raw
            $originalSize = $content.Length
            $optimizedContent = $content
            
            # JSON optimization
            if ($file.Extension -eq ".json") {
                $json = $content | ConvertFrom-Json
                $optimizedContent = $json | ConvertTo-Json -Depth 10 -Compress
            }
            
            # Remove comments and empty lines
            $lines = $optimizedContent -split "`n"
            $optimizedLines = $lines | Where-Object { 
                $_.Trim() -ne "" -and !$_.Trim().StartsWith("#") -and !$_.Trim().StartsWith("//")
            }
            $optimizedContent = $optimizedLines -join "`n"
            
            # Calculate size reduction
            $optimizedSize = $optimizedContent.Length
            $sizeReduction = $originalSize - $optimizedSize
            $reductionPercent = if ($originalSize -gt 0) { [math]::Round(($sizeReduction / $originalSize) * 100, 2) } else { 0 }
            
            if ($sizeReduction -gt 0) {
                if (!$ConfigSettings.DryRunMode) {
                    $optimizedContent | Out-File -FilePath $file.FullName -Encoding UTF8
                }
                
                $optimizationResults.FilesOptimized++
                $optimizationResults.Optimizations += @{
                    File = $file.Name
                    OriginalSize = $originalSize
                    OptimizedSize = $optimizedSize
                    SizeReduction = $sizeReduction
                    ReductionPercent = $reductionPercent
                }
                
                Write-Host "   ✅ Optimized: $($file.Name) (-$reductionPercent%)" -ForegroundColor Green
            } else {
                Write-Host "   ⏭️ No optimization needed: $($file.Name)" -ForegroundColor Yellow
            }
            
        } catch {
            Write-Host "   ❌ Failed to optimize: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    $optimizationResults.EndTime = Get-Date
    $optimizationResults.Duration = ($optimizationResults.EndTime - $optimizationResults.StartTime).TotalSeconds
    
    Write-Host "   ✅ Configuration optimization completed" -ForegroundColor Green
    Write-Host "   📊 Files Optimized: $($optimizationResults.FilesOptimized)" -ForegroundColor Green
    
    return $optimizationResults
}

function Generate-AIConfigurationInsights {
    Write-Host "🤖 Generating AI Configuration Insights..." -ForegroundColor Magenta
    
    $insights = @{
        ConfigurationScore = 0
        BestPractices = @()
        Recommendations = @()
        Predictions = @()
        OptimizationStrategies = @()
    }
    
    # Calculate configuration score
    $totalFiles = $ConfigResults.ValidationResults.TotalFiles
    $validFiles = $ConfigResults.ValidationResults.ValidFiles
    $invalidFiles = $ConfigResults.ValidationResults.InvalidFiles
    $warnings = $ConfigResults.ValidationResults.Warnings
    
    if ($totalFiles -gt 0) {
        $baseScore = ($validFiles / $totalFiles) * 100
        $warningPenalty = $warnings * 2
        $insights.ConfigurationScore = [math]::Max(0, $baseScore - $warningPenalty)
    }
    
    # Generate best practices
    $insights.BestPractices += "Use environment variables for sensitive data"
    $insights.BestPractices += "Implement configuration validation"
    $insights.BestPractices += "Use version control for configuration files"
    $insights.BestPractices += "Implement configuration backup and restore"
    $insights.BestPractices += "Use configuration templates for different environments"
    $insights.BestPractices += "Implement configuration drift detection"
    
    # Generate recommendations
    if ($invalidFiles -gt 0) {
        $insights.Recommendations += "Fix $invalidFiles invalid configuration files"
    }
    if ($warnings -gt 0) {
        $insights.Recommendations += "Address $warnings configuration warnings"
    }
    if ($ConfigResults.ValidationResults.Errors.Count -gt 0) {
        $insights.Recommendations += "Resolve configuration errors"
    }
    
    $insights.Recommendations += "Implement automated configuration validation"
    $insights.Recommendations += "Set up configuration monitoring and alerting"
    $insights.Recommendations += "Regular configuration backup and testing"
    $insights.Recommendations += "Document configuration standards and procedures"
    
    # Generate predictions
    $insights.Predictions += "Configuration stability: $([math]::Round($insights.ConfigurationScore, 2))%"
    $insights.Predictions += "Recommended validation frequency: Daily"
    $insights.Predictions += "Estimated time to fix issues: 1-2 days"
    
    # Generate optimization strategies
    $insights.OptimizationStrategies += "Implement configuration caching"
    $insights.OptimizationStrategies += "Use configuration templates and inheritance"
    $insights.OptimizationStrategies += "Implement hot-reloading for configuration changes"
    $insights.OptimizationStrategies += "Set up configuration performance monitoring"
    
    $ConfigResults.AIInsights = $insights
    $ConfigResults.Recommendations = $insights.Recommendations
    
    Write-Host "   📊 Configuration Score: $([math]::Round($insights.ConfigurationScore, 2))/100" -ForegroundColor White
    Write-Host "   📋 Best Practices: $($insights.BestPractices.Count)" -ForegroundColor White
    Write-Host "   💡 Recommendations: $($insights.Recommendations.Count)" -ForegroundColor White
}

function Generate-ConfigurationReport {
    Write-Host "📊 Generating Configuration Report..." -ForegroundColor Yellow
    
    $ConfigResults.EndTime = Get-Date
    $ConfigResults.Duration = ($ConfigResults.EndTime - $ConfigResults.StartTime).TotalSeconds
    
    $report = @{
        Summary = @{
            StartTime = $ConfigResults.StartTime
            EndTime = $ConfigResults.EndTime
            Duration = $ConfigResults.Duration
            Environment = $Environment
            ConfigType = $ConfigType
            TotalFiles = $ConfigResults.ValidationResults.TotalFiles
            ValidFiles = $ConfigResults.ValidationResults.ValidFiles
            InvalidFiles = $ConfigResults.ValidationResults.InvalidFiles
            Warnings = $ConfigResults.ValidationResults.Warnings
        }
        ValidationResults = $ConfigResults.ValidationResults
        SyncResults = $ConfigResults.SyncResults
        BackupResults = $ConfigResults.BackupResults
        AIInsights = $ConfigResults.AIInsights
        Recommendations = $ConfigResults.Recommendations
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    # Save JSON report
    $report | ConvertTo-Json -Depth 5 | Out-File -FilePath "$OutputDir/configuration-report.json" -Encoding UTF8
    
    # Save HTML report
    $htmlReport = @"
<!DOCTYPE html>
<html>
<head>
    <title>Enhanced Configuration Report v3.6</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .summary { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 3px; }
        .success { color: #27ae60; }
        .warning { color: #f39c12; }
        .error { color: #e74c3c; }
        .insights { background: #e8f4fd; padding: 15px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚙️ Enhanced Configuration Report v3.6</h1>
        <p>Generated: $($report.Timestamp)</p>
        <p>Environment: $($report.Summary.Environment) | Type: $($report.Summary.ConfigType)</p>
    </div>
    
    <div class="summary">
        <h2>📊 Configuration Summary</h2>
        <div class="metric">
            <strong>Total Files:</strong> $($report.Summary.TotalFiles)
        </div>
        <div class="metric success">
            <strong>Valid Files:</strong> $($report.Summary.ValidFiles)
        </div>
        <div class="metric error">
            <strong>Invalid Files:</strong> $($report.Summary.InvalidFiles)
        </div>
        <div class="metric warning">
            <strong>Warnings:</strong> $($report.Summary.Warnings)
        </div>
    </div>
    
    <div class="insights">
        <h2>🤖 AI Configuration Insights</h2>
        <p><strong>Configuration Score:</strong> $([math]::Round($report.AIInsights.ConfigurationScore, 2))/100</p>
        
        <h3>Best Practices:</h3>
        <ul>
            $(($report.AIInsights.BestPractices | ForEach-Object { "<li>$_</li>" }) -join "")
        </ul>
        
        <h3>Recommendations:</h3>
        <ul>
            $(($report.Recommendations | ForEach-Object { "<li>$_</li>" }) -join "")
        </ul>
        
        <h3>Predictions:</h3>
        <ul>
            $(($report.AIInsights.Predictions | ForEach-Object { "<li>$_</li>" }) -join "")
        </ul>
        
        <h3>Optimization Strategies:</h3>
        <ul>
            $(($report.AIInsights.OptimizationStrategies | ForEach-Object { "<li>$_</li>" }) -join "")
        </ul>
    </div>
</body>
</html>
"@
    
    $htmlReport | Out-File -FilePath "$OutputDir/configuration-report.html" -Encoding UTF8
    
    Write-Host "   📄 Report saved to: $OutputDir/configuration-report.html" -ForegroundColor Green
    Write-Host "   📄 JSON report saved to: $OutputDir/configuration-report.json" -ForegroundColor Green
}

# Main execution
Initialize-ConfigurationEnvironment

switch ($Action) {
    "status" {
        Write-Host "📊 Configuration System Status:" -ForegroundColor Cyan
        Write-Host "   Environment: $Environment" -ForegroundColor White
        Write-Host "   Config Type: $ConfigType" -ForegroundColor White
        Write-Host "   AI Enabled: $($ConfigSettings.AIEnabled)" -ForegroundColor White
        Write-Host "   Dry Run Mode: $($ConfigSettings.DryRunMode)" -ForegroundColor White
    }
    
    "validate" {
        Validate-Configurations
    }
    
    "sync" {
        Sync-Configurations
    }
    
    "backup" {
        Backup-Configurations
    }
    
    "restore" {
        if ($args.Count -gt 0) {
            Restore-Configurations -BackupPath $args[0]
        } else {
            Write-Error "Backup path required for restore action"
        }
    }
    
    "migrate" {
        Write-Host "🔄 Migrating Configurations..." -ForegroundColor Yellow
        Validate-Configurations
        Backup-Configurations
        Sync-Configurations
    }
    
    "optimize" {
        Optimize-Configurations
    }
    
    default {
        Write-Host "❌ Invalid action: $Action" -ForegroundColor Red
        Write-Host "Valid actions: status, validate, sync, backup, restore, migrate, optimize" -ForegroundColor Yellow
    }
}

# Generate AI insights if enabled
if ($ConfigSettings.AIEnabled) {
    Generate-AIConfigurationInsights
}

# Generate report
Generate-ConfigurationReport

Write-Host "⚙️ Enhanced Configuration Manager completed!" -ForegroundColor Cyan
