# SmartCopyConfig.psm1 - Модуль для работы с конфигурацией умного копирования
# Версия: 4.8

# Импорт конфигурации
$SmartConfig = $null

function Import-SmartCopyConfig {
    param(
        [string]$ConfigPath = ".\start-smart-config.json"
    )
    
    if (Test-Path $ConfigPath) {
        try {
            $script:SmartConfig = Get-Content $ConfigPath -Raw | ConvertFrom-Json
            Write-Host "✅ Конфигурация умного копирования загружена: $ConfigPath" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ Ошибка загрузки конфигурации: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "❌ Файл конфигурации не найден: $ConfigPath" -ForegroundColor Red
        return $false
    }
}

function Get-SmartCopyConfig {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig
}

function Get-SourcePath {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.source.defaultPath
}

function Get-TargetPaths {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.target
}

function Get-ExcludeFiles {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.excludeFiles
}

function Get-MergeFiles {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.mergeFiles
}

function Get-ReplaceFiles {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.replaceFiles
}

function Get-BackupSettings {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.backupSettings
}

function Get-MergeSettings {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.mergeSettings
}

function Get-LoggingSettings {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.logging
}

function Get-FeatureEnabled {
    param(
        [string]$Feature
    )
    
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    if ($SmartConfig.features.$Feature) {
        return $SmartConfig.features.$Feature
    }
    return $false
}

function Get-ScriptAliases {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.scripts.aliases
}

function Get-ScriptPaths {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.scripts.paths
}

function Test-SourcePath {
    param(
        [string]$SourcePath = ""
    )
    
    if ([string]::IsNullOrEmpty($SourcePath)) {
        $SourcePath = Get-SourcePath
    }
    
    return Test-Path $SourcePath
}

function Test-TargetPaths {
    $targetPaths = Get-TargetPaths
    $results = @{}
    
    foreach ($path in $targetPaths.PSObject.Properties) {
        $results[$path.Name] = Test-Path $path.Value
    }
    
    return $results
}

function Should-ExcludeFile {
    param(
        [string]$FilePath,
        [array]$ExcludePatterns = @()
    )
    
    if ($ExcludePatterns.Count -eq 0) {
        $ExcludePatterns = Get-ExcludeFiles
    }
    
    foreach ($pattern in $ExcludePatterns) {
        if ($FilePath -like "*\$pattern" -or $FilePath -like "*\$pattern\*" -or $FilePath -like $pattern) {
            return $true
        }
    }
    return $false
}

function Get-MergeFileConfig {
    param(
        [string]$FilePath
    )
    
    $mergeFiles = Get-MergeFiles
    if ($mergeFiles.$FilePath) {
        return $mergeFiles.$FilePath
    }
    return $null
}

function Get-ReplaceFileConfig {
    param(
        [string]$FilePath
    )
    
    $replaceFiles = Get-ReplaceFiles
    if ($replaceFiles.$FilePath) {
        return $replaceFiles.$FilePath
    }
    return $null
}

function Write-SmartLog {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $loggingSettings = Get-LoggingSettings
    if ($loggingSettings.enabled) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $logMessage = "[$timestamp] [$Level] $Message"
        
        try {
            Add-Content -Path $loggingSettings.file -Value $logMessage -Encoding UTF8
        } catch {
            # Игнорируем ошибки логирования
        }
    }
}

function Get-ValidationSettings {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.validation
}

function Test-DiskSpace {
    param(
        [string]$Path = ".",
        [int]$MinSpaceGB = 1
    )
    
    try {
        $drive = (Get-Item $Path).PSDrive
        $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
        return $freeSpaceGB -ge $MinSpaceGB
    } catch {
        return $true  # Если не можем проверить, считаем что места достаточно
    }
}

function Get-PerformanceSettings {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.performance
}

function Get-SecuritySettings {
    if ($SmartConfig -eq $null) {
        Import-SmartCopyConfig
    }
    
    return $SmartConfig.security
}

# Автоматически загружаем конфигурацию при импорте модуля
Import-SmartCopyConfig

# Экспорт функций
Export-ModuleMember -Function @(
    'Import-SmartCopyConfig',
    'Get-SmartCopyConfig',
    'Get-SourcePath',
    'Get-TargetPaths',
    'Get-ExcludeFiles',
    'Get-MergeFiles',
    'Get-ReplaceFiles',
    'Get-BackupSettings',
    'Get-MergeSettings',
    'Get-LoggingSettings',
    'Get-FeatureEnabled',
    'Get-ScriptAliases',
    'Get-ScriptPaths',
    'Test-SourcePath',
    'Test-TargetPaths',
    'Should-ExcludeFile',
    'Get-MergeFileConfig',
    'Get-ReplaceFileConfig',
    'Write-SmartLog',
    'Get-ValidationSettings',
    'Test-DiskSpace',
    'Get-PerformanceSettings',
    'Get-SecuritySettings'
)
