# DeploymentConfig.psm1 - Модуль для работы с конфигурацией деплоя
# Версия: 4.8

# Импорт конфигурации
$Config = $null

function Import-DeploymentConfig {
    param(
        [string]$ConfigPath = ".\deployment-config.json"
    )
    
    if (Test-Path $ConfigPath) {
        try {
            $script:Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
            Write-Host "✅ Конфигурация деплоя загружена: $ConfigPath" -ForegroundColor Green
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

function Get-EnvironmentConfig {
    param(
        [string]$Environment = "prom"
    )
    
    if ($Config -eq $null) {
        Import-DeploymentConfig
    }
    
    if ($Config.environments.$Environment) {
        return $Config.environments.$Environment
    } else {
        Write-Host "❌ Среда '$Environment' не найдена в конфигурации" -ForegroundColor Red
        return $null
    }
}

function Get-DeploymentConfig {
    if ($Config -eq $null) {
        Import-DeploymentConfig
    }
    
    return $Config.deployment
}

function Get-SSHConfig {
    if ($Config -eq $null) {
        Import-DeploymentConfig
    }
    
    return $Config.ssh
}

function Get-ScriptPaths {
    if ($Config -eq $null) {
        Import-DeploymentConfig
    }
    
    return $Config.scripts.paths
}

function Get-EnvironmentPath {
    param(
        [string]$Environment = "prom"
    )
    
    $envConfig = Get-EnvironmentConfig -Environment $Environment
    if ($envConfig) {
        return $envConfig.path
    }
    return $null
}

function Get-EnvironmentServer {
    param(
        [string]$Environment = "prod"
    )
    
    $envConfig = Get-EnvironmentConfig -Environment $Environment
    if ($envConfig) {
        return $envConfig.server
    }
    return $null
}

function Get-ArchivePath {
    $deployConfig = Get-DeploymentConfig
    if ($deployConfig) {
        return $deployConfig.archivePath
    }
    return ".\deploy-archives"
}

function Get-ExcludePatterns {
    $deployConfig = Get-DeploymentConfig
    if ($deployConfig) {
        return $deployConfig.excludePatterns
    }
    return @("node_modules", ".git", "*.log")
}

function Test-EnvironmentPath {
    param(
        [string]$Environment = "prom"
    )
    
    $path = Get-EnvironmentPath -Environment $Environment
    if ($path) {
        return Test-Path $path
    }
    return $false
}

function Test-SSHConnection {
    param(
        [string]$Environment = "prod"
    )
    
    $server = Get-EnvironmentServer -Environment $Environment
    if ($server) {
        try {
            $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $server "echo 'SSH connection test successful'" 2>&1
            return $LASTEXITCODE -eq 0
        } catch {
            return $false
        }
    }
    return $false
}

function Write-ConfigLog {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $deployConfig = Get-DeploymentConfig
    if ($deployConfig -and $Config.logging.enabled) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $logMessage = "[$timestamp] [$Level] $Message"
        
        try {
            Add-Content -Path $Config.logging.file -Value $logMessage -Encoding UTF8
        } catch {
            # Игнорируем ошибки логирования
        }
    }
}

function Get-FeatureEnabled {
    param(
        [string]$Feature
    )
    
    if ($Config -eq $null) {
        Import-DeploymentConfig
    }
    
    if ($Config.features.$Feature) {
        return $Config.features.$Feature
    }
    return $false
}

# Автоматически загружаем конфигурацию при импорте модуля
Import-DeploymentConfig

# Экспорт функций
Export-ModuleMember -Function @(
    'Import-DeploymentConfig',
    'Get-EnvironmentConfig',
    'Get-DeploymentConfig',
    'Get-SSHConfig',
    'Get-ScriptPaths',
    'Get-EnvironmentPath',
    'Get-EnvironmentServer',
    'Get-ArchivePath',
    'Get-ExcludePatterns',
    'Test-EnvironmentPath',
    'Test-SSHConnection',
    'Write-ConfigLog',
    'Get-FeatureEnabled'
)
