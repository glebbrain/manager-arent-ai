# =============================================================================
# Simple English Converter PowerShell Script
# Converts Russian text to English in files
# =============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Path = ".",
    
    [Parameter(Mandatory=$false)]
    [string[]]$Extensions = @("*.ps1", "*.js", "*.ts", "*.md"),
    
    [Parameter(Mandatory=$false)]
    [switch]$Recursive = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

# =============================================================================
# Global variables
# =============================================================================

$ErrorActionPreference = "Continue"
$ProcessedFiles = 0
$ConvertedFiles = 0

# =============================================================================
# Helper functions
# =============================================================================

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "Info"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    
    $Color = switch ($Level) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        "Info" { "Cyan" }
        default { "White" }
    }
    
    Write-Host $LogMessage -ForegroundColor $Color
}

function Test-HasNonEnglishContent {
    param([string]$Content)
    
    # Check for Cyrillic characters
    if ($Content -match "[а-яёА-ЯЁ]") {
        return $true
    }
    
    return $false
}

function Convert-TextToEnglish {
    param([string]$Text)
    
    # Common Russian to English translations
    $Result = $Text
    
    # File operations
    $Result = $Result -replace "Создаем", "Creating"
    $Result = $Result -replace "Проверяем", "Checking"
    $Result = $Result -replace "Получаем", "Getting"
    $Result = $Result -replace "Устанавливаем", "Setting"
    $Result = $Result -replace "Вычисляем", "Calculating"
    $Result = $Result -replace "Обрабатываем", "Processing"
    $Result = $Result -replace "Валидируем", "Validating"
    $Result = $Result -replace "Инициализируем", "Initializing"
    $Result = $Result -replace "Завершаем", "Completing"
    
    # Status messages
    $Result = $Result -replace "Ошибка", "Error"
    $Result = $Result -replace "Предупреждение", "Warning"
    $Result = $Result -replace "Информация", "Info"
    $Result = $Result -replace "Успешно", "Success"
    $Result = $Result -replace "Начинаем", "Starting"
    $Result = $Result -replace "Заканчиваем", "Ending"
    $Result = $Result -replace "Продолжаем", "Continuing"
    $Result = $Result -replace "Останавливаем", "Stopping"
    $Result = $Result -replace "Запускаем", "Running"
    $Result = $Result -replace "Выполняем", "Executing"
    
    # Actions
    $Result = $Result -replace "Сохраняем", "Saving"
    $Result = $Result -replace "Загружаем", "Loading"
    $Result = $Result -replace "Обновляем", "Updating"
    $Result = $Result -replace "Удаляем", "Removing"
    $Result = $Result -replace "Добавляем", "Adding"
    $Result = $Result -replace "Изменяем", "Modifying"
    $Result = $Result -replace "Копируем", "Copying"
    $Result = $Result -replace "Перемещаем", "Moving"
    $Result = $Result -replace "Переименовываем", "Renaming"
    
    # Common terms
    $Result = $Result -replace "файл", "file"
    $Result = $Result -replace "папка", "directory"
    $Result = $Result -replace "директория", "directory"
    $Result = $Result -replace "путь", "path"
    $Result = $Result -replace "имя", "name"
    $Result = $Result -replace "содержимое", "content"
    $Result = $Result -replace "размер", "size"
    $Result = $Result -replace "тип", "type"
    $Result = $Result -replace "статус", "status"
    $Result = $Result -replace "состояние", "state"
    $Result = $Result -replace "результат", "result"
    $Result = $Result -replace "ответ", "response"
    $Result = $Result -replace "запрос", "request"
    $Result = $Result -replace "данные", "data"
    $Result = $Result -replace "информация", "information"
    $Result = $Result -replace "настройки", "settings"
    $Result = $Result -replace "конфигурация", "configuration"
    $Result = $Result -replace "параметры", "parameters"
    $Result = $Result -replace "опции", "options"
    $Result = $Result -replace "свойства", "properties"
    $Result = $Result -replace "атрибуты", "attributes"
    
    return $Result
}

function Convert-File {
    param([string]$FilePath)
    
    try {
        $Content = Get-Content -Path $FilePath -Raw -Encoding UTF8 -ErrorAction Stop
        
        if (-not (Test-HasNonEnglishContent $Content)) {
            return $false
        }
        
        $ConvertedContent = Convert-TextToEnglish $Content
        
        if ($ConvertedContent -ne $Content) {
            if ($DryRun) {
                Write-Log "DRY RUN: Would convert $FilePath" "Warning"
            } else {
                Set-Content -Path $FilePath -Value $ConvertedContent -Encoding UTF8 -NoNewline
                Write-Log "Converted $FilePath" "Success"
                $script:ConvertedFiles++
            }
            return $true
        }
        
        return $false
    }
    catch {
        Write-Log "Error processing file $FilePath : $($_.Exception.Message)" "Error"
        return $false
    }
}

# =============================================================================
# Main execution
# =============================================================================

try {
    Write-Log "Starting English converter on path: $Path" "Info"
    
    if ($DryRun) {
        Write-Log "DRY RUN MODE - No files will be modified" "Warning"
    }
    
    # Get all files matching the specified extensions
    $Files = @()
    foreach ($Extension in $Extensions) {
        $SearchPath = if ($Recursive) { Join-Path $Path "**\$Extension" } else { Join-Path $Path $Extension }
        $FoundFiles = Get-ChildItem -Path $SearchPath -File -ErrorAction SilentlyContinue
        $Files += $FoundFiles
    }
    
    Write-Log "Found $($Files.Count) files to process" "Info"
    
    # Process each file
    foreach ($File in $Files) {
        if (Convert-File -FilePath $File.FullName) {
            $script:ProcessedFiles++
        }
    }
    
    # Summary
    Write-Log "English converter completed" "Info"
    Write-Log "Total files processed: $ProcessedFiles" "Info"
    Write-Log "Files converted: $ConvertedFiles" "Success"
    
    if ($DryRun) {
        Write-Log "Run without -DryRun to apply changes" "Info"
    }
}
catch {
    Write-Log "Critical error: $($_.Exception.Message)" "Error"
    exit 1
}