# .automation/security/security_check.ps1
# Скрипт проверки безопасности проекта

param(
    [string]$OutputDir = "security-reports",
    [switch]$Fix = $false,
    [switch]$Verbose = $false
)

Write-Host "🔒 Запуск проверки безопасности проекта..." -ForegroundColor Cyan

# Создание папки для отчетов
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$issues = @()
$criticalIssues = 0
$warningIssues = 0

# Функция добавления проблемы в TODO.md
function Add-ToTodo {
    param(
        [string]$Issue,
        [string]$Severity = "warning"
    )
    
    $todoFile = "TODO.md"
    $marker = if ($Severity -eq "critical") { "🔴" } else { "🟠" }
    $todoEntry = "- [ ] $marker $Issue"
    
    if (Test-Path $todoFile) {
        $content = Get-Content $todoFile -Raw
        if ($content -notlike "*$Issue*") {
            Add-Content -Path $todoFile -Value "`n$todoEntry"
        }
    } else {
        $todoEntry | Out-File -FilePath $todoFile -Encoding UTF8
    }
}

# 1. Проверка секретов и токенов
Write-Host "`n🔍 Проверка секретов и токенов..." -ForegroundColor Yellow

$secretPatterns = @(
    "password\s*=\s*['""][^'""]+['""]",
    "api[_-]?key\s*=\s*['""][^'""]+['""]",
    "secret\s*=\s*['""][^'""]+['""]",
    "token\s*=\s*['""][^'""]+['""]",
    "private[_-]?key\s*=\s*['""][^'""]+['""]",
    "access[_-]?key\s*=\s*['""][^'""]+['""]",
    "aws[_-]?secret",
    "github[_-]?token",
    "slack[_-]?token",
    "discord[_-]?token"
)

$codeFiles = Get-ChildItem -Path "." -Include "*.py", "*.js", "*.ts", "*.cs", "*.php", "*.java", "*.go", "*.rs" -Recurse -File | 
    Where-Object { $_.DirectoryName -notlike "*node_modules*" -and $_.DirectoryName -notlike "*\.git*" }

foreach ($file in $codeFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        foreach ($pattern in $secretPatterns) {
            if ($content -match $pattern) {
                $issue = "Потенциальный секрет в $($file.FullName): $($matches[0])"
                $issues += $issue
                $criticalIssues++
                Add-ToTodo -Issue $issue -Severity "critical"
                Write-Host "  ❌ $issue" -ForegroundColor Red
            }
        }
    }
}

# 2. Проверка зависимостей (Node.js)
Write-Host "`n📦 Проверка зависимостей Node.js..." -ForegroundColor Yellow

if (Test-Path "package.json") {
    try {
        $auditResult = npm audit --json 2>$null | ConvertFrom-Json
        if ($auditResult.vulnerabilities) {
            foreach ($vuln in $auditResult.vulnerabilities.PSObject.Properties) {
                $vulnData = $vuln.Value
                $issue = "Уязвимость в пакете $($vuln.Name): $($vulnData.title) (Severity: $($vulnData.severity))"
                $issues += $issue
                
                if ($vulnData.severity -in @("high", "critical")) {
                    $criticalIssues++
                    Add-ToTodo -Issue $issue -Severity "critical"
                    Write-Host "  ❌ $issue" -ForegroundColor Red
                } else {
                    $warningIssues++
                    Add-ToTodo -Issue $issue -Severity "warning"
                    Write-Host "  ⚠️ $issue" -ForegroundColor Yellow
                }
            }
            
            if ($Fix) {
                Write-Host "  🔧 Запуск автоматического исправления..." -ForegroundColor Cyan
                npm audit fix --force
            }
        } else {
            Write-Host "  ✅ Уязвимостей не найдено" -ForegroundColor Green
        }
    }
    catch {
        Write-Warning "Не удалось выполнить npm audit: $($_.Exception.Message)"
    }
}

# 3. Проверка зависимостей (Python)
Write-Host "`n🐍 Проверка зависимостей Python..." -ForegroundColor Yellow

if (Test-Path "requirements.txt") {
    try {
        # Проверка через safety (если установлен)
        $safetyResult = safety check --json 2>$null | ConvertFrom-Json
        if ($safetyResult) {
            foreach ($vuln in $safetyResult) {
                $issue = "Уязвимость в пакете $($vuln.package): $($vuln.advisory) (Severity: $($vuln.severity))"
                $issues += $issue
                $criticalIssues++
                Add-ToTodo -Issue $issue -Severity "critical"
                Write-Host "  ❌ $issue" -ForegroundColor Red
            }
        } else {
            Write-Host "  ✅ Уязвимостей не найдено" -ForegroundColor Green
        }
    }
    catch {
        Write-Warning "Safety не установлен. Установите: pip install safety"
    }
}

# 4. Проверка файлов конфигурации
Write-Host "`n⚙️ Проверка файлов конфигурации..." -ForegroundColor Yellow

$configFiles = Get-ChildItem -Path "." -Include "*.json", "*.yaml", "*.yml", "*.conf", "*.config" -Recurse -File |
    Where-Object { $_.DirectoryName -notlike "*node_modules*" -and $_.DirectoryName -notlike "*\.git*" }

foreach ($file in $configFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        # Проверка на хардкод паролей
        if ($content -match "password\s*:\s*['""][^'""]+['""]") {
            $issue = "Хардкод пароля в конфигурации: $($file.FullName)"
            $issues += $issue
            $criticalIssues++
            Add-ToTodo -Issue $issue -Severity "critical"
            Write-Host "  ❌ $issue" -ForegroundColor Red
        }
        
        # Проверка на небезопасные настройки
        if ($content -match "debug\s*:\s*true") {
            $issue = "Включен debug режим в продакшн: $($file.FullName)"
            $issues += $issue
            $warningIssues++
            Add-ToTodo -Issue $issue -Severity "warning"
            Write-Host "  ⚠️ $issue" -ForegroundColor Yellow
        }
    }
}

# 5. Проверка прав доступа к файлам
Write-Host "`n🔐 Проверка прав доступа..." -ForegroundColor Yellow

$sensitiveFiles = Get-ChildItem -Path "." -Include "*.key", "*.pem", "*.p12", "*.pfx", "*.crt", "*.cer" -Recurse -File
foreach ($file in $sensitiveFiles) {
    $acl = Get-Acl $file.FullName
    $hasRestrictivePermissions = $false
    
    foreach ($access in $acl.Access) {
        if ($access.FileSystemRights -like "*FullControl*" -and $access.IdentityReference -like "*Everyone*") {
            $hasRestrictivePermissions = $true
            break
        }
    }
    
    if ($hasRestrictivePermissions) {
        $issue = "Небезопасные права доступа к файлу: $($file.FullName)"
        $issues += $issue
        $criticalIssues++
        Add-ToTodo -Issue $issue -Severity "critical"
        Write-Host "  ❌ $issue" -ForegroundColor Red
    }
}

# 6. Проверка .gitignore
Write-Host "`n📝 Проверка .gitignore..." -ForegroundColor Yellow

if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    $requiredIgnores = @("*.log", "*.env", "*.key", "*.pem", "node_modules/", "__pycache__/", ".venv/")
    
    foreach ($ignore in $requiredIgnores) {
        if ($gitignoreContent -notlike "*$ignore*") {
            $issue = "Отсутствует в .gitignore: $ignore"
            $issues += $issue
            $warningIssues++
            Add-ToTodo -Issue $issue -Severity "warning"
            Write-Host "  ⚠️ $issue" -ForegroundColor Yellow
        }
    }
} else {
    $issue = "Отсутствует файл .gitignore"
    $issues += $issue
    $criticalIssues++
    Add-ToTodo -Issue $issue -Severity "critical"
    Write-Host "  ❌ $issue" -ForegroundColor Red
}

# Создание отчета
$reportPath = Join-Path $OutputDir "security_report_$timestamp.json"
$report = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    criticalIssues = $criticalIssues
    warningIssues = $warningIssues
    totalIssues = $issues.Count
    issues = $issues
    summary = @{
        status = if ($criticalIssues -gt 0) { "FAILED" } elseif ($warningIssues -gt 0) { "WARNING" } else { "PASSED" }
        message = if ($criticalIssues -gt 0) { "Найдены критические проблемы безопасности" } 
                 elseif ($warningIssues -gt 0) { "Найдены предупреждения безопасности" } 
                 else { "Проблем безопасности не найдено" }
    }
}

$report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8

# Вывод итогового отчета
Write-Host "`n📊 ИТОГОВЫЙ ОТЧЕТ БЕЗОПАСНОСТИ" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🔴 Критических проблем: $criticalIssues" -ForegroundColor $(if ($criticalIssues -gt 0) { "Red" } else { "Green" })
Write-Host "🟠 Предупреждений: $warningIssues" -ForegroundColor $(if ($warningIssues -gt 0) { "Yellow" } else { "Green" })
Write-Host "📄 Отчет сохранен: $reportPath" -ForegroundColor Cyan

if ($criticalIssues -gt 0) {
    Write-Host "`n❌ ПРОВЕРКА НЕ ПРОЙДЕНА!" -ForegroundColor Red
    Write-Host "Критические проблемы безопасности должны быть устранены перед деплоем." -ForegroundColor Red
    exit 1
} elseif ($warningIssues -gt 0) {
    Write-Host "`n⚠️ ПРОВЕРКА ПРОЙДЕНА С ПРЕДУПРЕЖДЕНИЯМИ" -ForegroundColor Yellow
    Write-Host "Рекомендуется устранить предупреждения перед деплоем." -ForegroundColor Yellow
} else {
    Write-Host "`n✅ ПРОВЕРКА ПРОЙДЕНА УСПЕШНО!" -ForegroundColor Green
    Write-Host "Проект готов к деплою." -ForegroundColor Green
}

Write-Host "`n📋 Проблемы добавлены в TODO.md для отслеживания" -ForegroundColor Cyan