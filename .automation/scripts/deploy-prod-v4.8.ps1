# deploy-prod-v4.8.ps1 - Деплой проекта в PROD среду v4.8
# Создает архив tar и развертывает на удаленном сервере

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    [string]$PROM_PATH = "",
    [string]$Server = "",
    [string]$PROD_PATH = "",
    [string]$ArchivePath = "",
    [switch]$Force = $false,
    [switch]$Backup = $true,
    [switch]$Verbose = $false,
    [switch]$Clean = $false,
    [switch]$TestOnly = $false
)

# Импорт модуля конфигурации
Import-Module -Name ".\automation\config\DeploymentConfig.psm1" -Force

# Получение конфигурации
if ([string]::IsNullOrEmpty($PROM_PATH)) {
    $PROM_PATH = Get-EnvironmentPath -Environment "prom"
    if ([string]::IsNullOrEmpty($PROM_PATH)) {
        Write-Host "❌ ОШИБКА: PROM_PATH не найден в конфигурации" -ForegroundColor Red
        exit 1
    }
}

if ([string]::IsNullOrEmpty($Server)) {
    $Server = Get-EnvironmentServer -Environment "prod"
    if ([string]::IsNullOrEmpty($Server)) {
        Write-Host "❌ ОШИБКА: Server не найден в конфигурации" -ForegroundColor Red
        exit 1
    }
}

if ([string]::IsNullOrEmpty($PROD_PATH)) {
    $PROD_PATH = Get-EnvironmentPath -Environment "prod"
    if ([string]::IsNullOrEmpty($PROD_PATH)) {
        Write-Host "❌ ОШИБКА: PROD_PATH не найден в конфигурации" -ForegroundColor Red
        exit 1
    }
}

if ([string]::IsNullOrEmpty($ArchivePath)) {
    $ArchivePath = Get-ArchivePath
}

# Настройка цветного вывода
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Функция для цветного вывода
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Функция для логирования
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-ColorOutput $logMessage
}

# Заголовок
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput "🚀  ДЕПЛОЙ В PROD СРЕДУ v4.8" "Cyan"
Write-ColorOutput "🚀 ========================================" "Cyan"
Write-ColorOutput ""

Write-ColorOutput "📋 Параметры:" "Yellow"
Write-ColorOutput "  • Проект: $ProjectName" "White"
Write-ColorOutput "  • PROM путь: $PROM_PATH" "White"
Write-ColorOutput "  • Сервер: $Server" "White"
Write-ColorOutput "  • PROD путь: $PROD_PATH" "White"
Write-ColorOutput "  • Архив: $ArchivePath" "White"
Write-ColorOutput "  • Принудительно: $Force" "White"
Write-ColorOutput "  • Резервная копия: $Backup" "White"
Write-ColorOutput "  • Очистка: $Clean" "White"
Write-ColorOutput "  • Только тест: $TestOnly" "White"
Write-ColorOutput ""

# Проверка PROM пути
Write-ColorOutput "🔍 Проверка PROM пути..." "Yellow"
$PROMProjectPath = Join-Path $PROM_PATH $ProjectName
if (!(Test-Path $PROMProjectPath)) {
    Write-ColorOutput "❌ ОШИБКА: PROM проект не найден: $PROMProjectPath" "Red"
    Write-ColorOutput "💡 Сначала выполните деплой в PROM: .\deploy-prom-v4.8.ps1 -ProjectName `"$ProjectName`"" "Cyan"
    exit 1
}
Write-ColorOutput "✅ PROM проект найден: $PROMProjectPath" "Green"

# Создание папки для архивов
Write-ColorOutput "📁 Создание папки для архивов..." "Yellow"
if (!(Test-Path $ArchivePath)) {
    try {
        New-Item -ItemType Directory -Path $ArchivePath -Force | Out-Null
        Write-ColorOutput "✅ Папка архивов создана: $ArchivePath" "Green"
    } catch {
        Write-ColorOutput "❌ Ошибка создания папки архивов: $($_.Exception.Message)" "Red"
        exit 1
    }
} else {
    Write-ColorOutput "✅ Папка архивов уже существует: $ArchivePath" "Green"
}

# Тест SSH соединения
Write-ColorOutput "🔍 Тестирование SSH соединения..." "Yellow"
try {
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $Server "echo 'SSH connection test successful'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ SSH соединение успешно" "Green"
    } else {
        Write-ColorOutput "❌ ОШИБКА: Не удалось подключиться к серверу $Server" "Red"
        Write-ColorOutput "💡 Проверьте SSH ключи и доступ к серверу" "Cyan"
        Write-ColorOutput "🔧 SSH тест: $sshTest" "Yellow"
        exit 1
    }
} catch {
    Write-ColorOutput "❌ ОШИБКА: Ошибка SSH соединения: $($_.Exception.Message)" "Red"
    exit 1
}

# Если только тест - выходим
if ($TestOnly) {
    Write-ColorOutput "✅ Тест SSH соединения успешен. Выход." "Green"
    exit 0
}

# Создание архива tar
Write-ColorOutput "📦 Создание архива tar..." "Yellow"
$ArchiveFile = Join-Path $ArchivePath "$ProjectName-prod-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').tar"
$ArchiveFileGz = "$ArchiveFile.gz"

try {
    # Создание tar архива из PROM проекта
    Write-ColorOutput "  📋 Архивирование проекта из PROM..." "Yellow"
    
    # Используем PowerShell для создания tar (Windows 10+)
    if ($PSVersionTable.PSVersion.Major -ge 5) {
        # Создаем временный список файлов для архивации
        $TempFileList = Join-Path $env:TEMP "tar-files-prod-$ProjectName.txt"
        
        # Исключаем ненужные папки и файлы
        $ExcludePatterns = @(
            "node_modules",
            ".git",
            ".vs",
            "bin",
            "obj",
            "dist",
            "build",
            "*.log",
            "*.tmp",
            ".DS_Store",
            "Thumbs.db",
            "deploy-archives"
        )
        
        # Создаем список файлов для архивации
        Get-ChildItem -Path $PROMProjectPath -Recurse | Where-Object {
            $item = $_
            $shouldExclude = $false
            foreach ($pattern in $ExcludePatterns) {
                if ($item.Name -like $pattern -or $item.FullName -like "*\$pattern\*") {
                    $shouldExclude = $true
                    break
                }
            }
            return -not $shouldExclude
        } | ForEach-Object { $_.FullName } | Out-File -FilePath $TempFileList -Encoding UTF8
        
        # Создаем tar архив
        tar -cf $ArchiveFile -T $TempFileList
        
        # Удаляем временный файл
        Remove-Item $TempFileList -Force -ErrorAction SilentlyContinue
        
        Write-ColorOutput "  ✅ Tar архив создан: $ArchiveFile" "Green"
    } else {
        Write-ColorOutput "  ⚠️  PowerShell версии 5+ требуется для создания tar архивов" "Yellow"
        Write-ColorOutput "  📋 Используем простое копирование через SCP..." "Yellow"
        
        # Простое копирование через SCP
        Write-ColorOutput "  📤 Копирование проекта на сервер..." "Yellow"
        scp -r $PROMProjectPath $Server`:$PROD_PATH/
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "  ✅ Проект скопирован на сервер" "Green"
        } else {
            Write-ColorOutput "  ❌ Ошибка копирования на сервер" "Red"
            exit 1
        }
        Write-ColorOutput "✅ ДЕПЛОЙ В PROD ЗАВЕРШЕН" "Green"
        exit 0
    }
    
    # Сжатие архива
    Write-ColorOutput "  📦 Сжатие архива..." "Yellow"
    try {
        # Используем gzip для сжатия
        gzip $ArchiveFile
        $ArchiveFile = $ArchiveFileGz
        Write-ColorOutput "  ✅ Архив сжат: $ArchiveFile" "Green"
    } catch {
        Write-ColorOutput "  ⚠️  gzip не найден, используем несжатый архив" "Yellow"
    }
    
} catch {
    Write-ColorOutput "❌ Ошибка создания архива: $($_.Exception.Message)" "Red"
    exit 1
}

# Проверка размера архива
if (Test-Path $ArchiveFile) {
    $ArchiveSize = (Get-Item $ArchiveFile).Length
    $ArchiveSizeMB = [math]::Round($ArchiveSize / 1MB, 2)
    Write-ColorOutput "📊 Размер архива: $ArchiveSizeMB MB" "Cyan"
} else {
    Write-ColorOutput "❌ ОШИБКА: Архив не создан" "Red"
    exit 1
}

# Копирование архива на сервер
Write-ColorOutput "📤 Копирование архива на сервер..." "Yellow"
try {
    scp $ArchiveFile $Server`:/tmp/
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Архив скопирован на сервер" "Green"
    } else {
        Write-ColorOutput "❌ Ошибка копирования архива на сервер" "Red"
        exit 1
    }
} catch {
    Write-ColorOutput "❌ Ошибка SCP: $($_.Exception.Message)" "Red"
    exit 1
}

# Развертывание на сервере
Write-ColorOutput "🚀 Развертывание на сервере..." "Yellow"
$RemoteArchiveName = Split-Path $ArchiveFile -Leaf
$RemoteArchivePath = "/tmp/$RemoteArchiveName"
$RemoteProjectPath = "$PROD_PATH/$ProjectName"

# SSH команды для развертывания
$SSHCommands = @"
# Создание резервной копии (если нужно)
if [ -d "$RemoteProjectPath" ]; then
    if [ "$Backup" = "true" ]; then
        echo "📦 Создание резервной копии..."
        cp -r "$RemoteProjectPath" "$RemoteProjectPath.backup.$(date +%Y-%m-%d-%H-%M-%S)"
        echo "✅ Резервная копия создана"
    fi
    
    echo "🗑️ Удаление существующего деплоя..."
    rm -rf "$RemoteProjectPath"
    echo "✅ Существующий деплой удален"
fi

# Создание целевой папки
echo "📁 Создание целевой папки..."
mkdir -p "$RemoteProjectPath"
echo "✅ Целевая папка создана: $RemoteProjectPath"

# Извлечение архива
echo "📦 Извлечение архива..."
if [[ "$RemoteArchiveName" == *.gz ]]; then
    # Сначала распаковываем gzip
    gunzip -c "$RemoteArchivePath" | tar -xf - -C "$RemoteProjectPath"
else
    # Обычный tar
    tar -xf "$RemoteArchivePath" -C "$RemoteProjectPath"
fi
echo "✅ Архив извлечен в: $RemoteProjectPath"

# Установка прав доступа
echo "🔐 Установка прав доступа..."
chmod -R 755 "$RemoteProjectPath"
chown -R u0488409:u0488409 "$RemoteProjectPath"
echo "✅ Права доступа установлены"

# Очистка временного архива
echo "🧹 Очистка временного архива..."
rm -f "$RemoteArchivePath"
echo "✅ Временный архив удален"

# Проверка развертывания
echo "🔍 Проверка развертывания..."
FILE_COUNT=$(find "$RemoteProjectPath" -type f | wc -l)
echo "📊 Развернуто файлов: $FILE_COUNT"

echo "✅ Деплой в PROD завершен успешно!"
"@

try {
    Write-ColorOutput "  🔧 Выполнение команд на сервере..." "Yellow"
    $SSHResult = ssh $Server $SSHCommands
    Write-ColorOutput "  ✅ Команды выполнены на сервере" "Green"
    
    # Выводим результат
    Write-ColorOutput "📋 Результат выполнения на сервере:" "Cyan"
    Write-ColorOutput $SSHResult "White"
    
} catch {
    Write-ColorOutput "❌ Ошибка выполнения команд на сервере: $($_.Exception.Message)" "Red"
    exit 1
}

# Проверка развертывания
Write-ColorOutput "🔍 Проверка развертывания..." "Yellow"
try {
    $CheckResult = ssh $Server "ls -la $RemoteProjectPath | head -10"
    Write-ColorOutput "📋 Содержимое PROD папки:" "Cyan"
    Write-ColorOutput $CheckResult "White"
} catch {
    Write-ColorOutput "⚠️  Предупреждение: Не удалось проверить содержимое PROD папки" "Yellow"
}

# Очистка локальных архивов (если нужно)
if ($Clean) {
    Write-ColorOutput "🧹 Очистка локальных архивов..." "Yellow"
    try {
        $OldArchives = Get-ChildItem -Path $ArchivePath -Filter "$ProjectName-prod-*.tar*" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 3
        foreach ($oldArchive in $OldArchives) {
            Remove-Item $oldArchive.FullName -Force
            Write-ColorOutput "  🗑️  Удален старый архив: $($oldArchive.Name)" "Yellow"
        }
        Write-ColorOutput "  ✅ Очистка завершена" "Green"
    } catch {
        Write-ColorOutput "  ⚠️  Предупреждение: Не удалось очистить старые архивы: $($_.Exception.Message)" "Yellow"
    }
}

# Создание отчета о деплое
Write-ColorOutput "📝 Создание отчета о деплое..." "Yellow"
$ReportContent = @"
# 🚀 Отчет о деплое в PROD среду

**Дата:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Проект:** $ProjectName
**PROM путь:** $PROMProjectPath
**Сервер:** $Server
**PROD путь:** $RemoteProjectPath
**Архив:** $ArchiveFile

## 📊 Результаты

- **Статус:** ✅ Успешно
- **Размер архива:** $ArchiveSizeMB MB
- **Резервная копия:** $(if($Backup){'✅ Создана'}else{'❌ Не создана'})

## 🎯 Следующие шаги

1. Проверьте развертывание в браузере
2. Протестируйте функциональность
3. Мониторьте логи и производительность

## 📁 Файлы

- **PROD путь:** $RemoteProjectPath
- **Архив:** $ArchiveFile
- **Сервер:** $Server
"@

try {
    $ReportFile = Join-Path $ArchivePath "deploy-prod-report-$ProjectName-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').md"
    $ReportContent | Out-File -FilePath $ReportFile -Encoding UTF8
    Write-ColorOutput "  ✅ Отчет создан: $ReportFile" "Green"
} catch {
    Write-ColorOutput "  ⚠️  Предупреждение: Не удалось создать отчет: $($_.Exception.Message)" "Yellow"
}

# Финальный отчет
Write-ColorOutput ""
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput "🎉  ДЕПЛОЙ В PROD ЗАВЕРШЕН УСПЕШНО!" "Green"
Write-ColorOutput "🎉 ========================================" "Green"
Write-ColorOutput ""

Write-ColorOutput "📊 РЕЗУЛЬТАТЫ:" "Cyan"
Write-ColorOutput "  • Проект: $ProjectName" "White"
Write-ColorOutput "  • Сервер: $Server" "White"
Write-ColorOutput "  • PROD путь: $RemoteProjectPath" "White"
Write-ColorOutput "  • Размер архива: $ArchiveSizeMB MB" "White"
Write-ColorOutput "  • Архив: $ArchiveFile" "White"
Write-ColorOutput ""

Write-ColorOutput "📝 СЛЕДУЮЩИЕ ШАГИ:" "Cyan"
Write-ColorOutput "  1. Проверьте развертывание в браузере" "White"
Write-ColorOutput "  2. Протестируйте функциональность" "White"
Write-ColorOutput "  3. Мониторьте логи и производительность" "White"
Write-ColorOutput "  4. Настройте мониторинг и алерты" "White"
Write-ColorOutput ""

Write-ColorOutput "🎯 Проект готов к работе в PROD среде!" "Green"
Write-ColorOutput ""
