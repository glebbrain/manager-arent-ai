# =============================================================================
# Auto English Rules PowerShell Script
# Automatically applies English-only rules when creating files
# =============================================================================

# This script should be sourced by other scripts to ensure English-only content

# =============================================================================
# Global rules and translations
# =============================================================================

# Common Russian to English translations for code comments
$CommentTranslations = @{
    # File operations
    "Создаем файл" = "Creating file"
    "Создаем папку" = "Creating directory"
    "Удаляем файл" = "Removing file"
    "Удаляем папку" = "Removing directory"
    "Проверяем существование" = "Checking existence"
    "Проверяем путь" = "Validating path"
    "Формируем путь" = "Building path"
    "Получаем информацию" = "Getting information"
    
    # Error handling
    "Ошибка при создании" = "Error creating"
    "Ошибка при удалении" = "Error removing"
    "Ошибка при получении" = "Error getting"
    "Ошибка при обработке" = "Error processing"
    "Критическая ошибка" = "Critical error"
    "Не удается" = "Cannot"
    "Не найдено" = "Not found"
    "Не существует" = "Does not exist"
    "Недопустимый" = "Invalid"
    "Необходимо указать" = "Must specify"
    
    # Success messages
    "Успешно создано" = "Successfully created"
    "Успешно удалено" = "Successfully removed"
    "Операция завершена" = "Operation completed"
    "Файл создан" = "File created"
    "Папка создана" = "Directory created"
    "Файл удален" = "File removed"
    "Папка удалена" = "Directory removed"
    
    # Status messages
    "Начинаем" = "Starting"
    "Завершаем" = "Completing"
    "Продолжаем" = "Continuing"
    "Останавливаем" = "Stopping"
    "Запускаем" = "Running"
    "Выполняем" = "Executing"
    "Обрабатываем" = "Processing"
    "Валидируем" = "Validating"
    "Инициализируем" = "Initializing"
    
    # Common actions
    "Сохраняем" = "Saving"
    "Загружаем" = "Loading"
    "Обновляем" = "Updating"
    "Добавляем" = "Adding"
    "Изменяем" = "Modifying"
    "Копируем" = "Copying"
    "Перемещаем" = "Moving"
    "Переименовываем" = "Renaming"
    "Создаем" = "Creating"
    "Проверяем" = "Checking"
    "Получаем" = "Getting"
    "Устанавливаем" = "Setting"
    "Вычисляем" = "Calculating"
    "Обрабатываем" = "Processing"
    "Валидируем" = "Validating"
    "Инициализируем" = "Initializing"
    "Завершаем" = "Completing"
    
    # File types and names
    "файл" = "file"
    "папка" = "directory"
    "директория" = "directory"
    "скрипт" = "script"
    "конфигурация" = "configuration"
    "настройки" = "settings"
    "параметры" = "parameters"
    "опции" = "options"
    "свойства" = "properties"
    "атрибуты" = "attributes"
    
    # Technical terms
    "кодировка" = "encoding"
    "кодирование" = "encoding"
    "декодирование" = "decoding"
    "шифрование" = "encryption"
    "расшифровка" = "decryption"
    "сжатие" = "compression"
    "распаковка" = "decompression"
    "архивирование" = "archiving"
    "разархивирование" = "extracting"
    
    # Common phrases
    "по умолчанию" = "by default"
    "в случае" = "in case"
    "при условии" = "provided that"
    "если" = "if"
    "когда" = "when"
    "где" = "where"
    "как" = "how"
    "что" = "what"
    "кто" = "who"
    "почему" = "why"
    "зачем" = "why"
    "откуда" = "from where"
    "куда" = "where to"
    "когда" = "when"
    "сколько" = "how much"
    "какой" = "which"
    "какая" = "which"
    "какое" = "which"
    "какие" = "which"
}

# Common Russian to English translations for variable names
$VariableTranslations = @{
    "файл" = "file"
    "папка" = "directory"
    "директория" = "directory"
    "путь" = "path"
    "имя" = "name"
    "содержимое" = "content"
    "размер" = "size"
    "тип" = "type"
    "статус" = "status"
    "состояние" = "state"
    "результат" = "result"
    "ответ" = "response"
    "запрос" = "request"
    "данные" = "data"
    "информация" = "information"
    "настройки" = "settings"
    "конфигурация" = "configuration"
    "параметры" = "parameters"
    "опции" = "options"
    "свойства" = "properties"
    "атрибуты" = "attributes"
    "список" = "list"
    "массив" = "array"
    "объект" = "object"
    "класс" = "class"
    "функция" = "function"
    "метод" = "method"
    "процедура" = "procedure"
    "алгоритм" = "algorithm"
    "логика" = "logic"
    "правило" = "rule"
    "условие" = "condition"
    "проверка" = "check"
    "валидация" = "validation"
    "ошибка" = "error"
    "исключение" = "exception"
    "предупреждение" = "warning"
    "сообщение" = "message"
    "уведомление" = "notification"
    "логирование" = "logging"
    "отладка" = "debugging"
    "тестирование" = "testing"
    "проверка" = "testing"
}

# =============================================================================
# Helper functions
# =============================================================================

function Convert-TextToEnglish {
    param(
        [string]$Text,
        [string]$Type = "comment"
    )
    
    $Result = $Text
    
    if ($Type -eq "comment") {
        foreach ($Translation in $CommentTranslations.GetEnumerator()) {
            $Result = $Result -replace [regex]::Escape($Translation.Key), $Translation.Value
        }
    }
    elseif ($Type -eq "variable") {
        foreach ($Translation in $VariableTranslations.GetEnumerator()) {
            $Result = $Result -replace [regex]::Escape($Translation.Key), $Translation.Value
        }
    }
    
    return $Result
}

function New-EnglishComment {
    param(
        [string]$Text
    )
    
    $EnglishText = Convert-TextToEnglish -Text $Text -Type "comment"
    return "// $EnglishText"
}

function New-EnglishVariable {
    param(
        [string]$Name
    )
    
    $EnglishName = Convert-TextToEnglish -Text $Name -Type "variable"
    return $EnglishName
}

function New-EnglishLogMessage {
    param(
        [string]$Message,
        [string]$Level = "Info"
    )
    
    $EnglishMessage = Convert-TextToEnglish -Text $Message -Type "comment"
    return "[$Level] $EnglishMessage"
}

function New-EnglishErrorMessage {
    param(
        [string]$Message
    )
    
    $EnglishMessage = Convert-TextToEnglish -Text $Message -Type "comment"
    return "Error: $EnglishMessage"
}

function New-EnglishSuccessMessage {
    param(
        [string]$Message
    )
    
    $EnglishMessage = Convert-TextToEnglish -Text $Message -Type "comment"
    return "Success: $EnglishMessage"
}

# =============================================================================
# Validation functions
# =============================================================================

function Test-IsEnglishText {
    param([string]$Text)
    
    # Check for Cyrillic characters
    if ($Text -match "[а-яёА-ЯЁ]") {
        return $false
    }
    
    # Check for other non-English characters
    if ($Text -match "[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]") {
        return $false
    }
    
    return $true
}

function Test-IsEnglishFileName {
    param([string]$FileName)
    
    # Check for Cyrillic characters in filename
    if ($FileName -match "[а-яёА-ЯЁ]") {
        return $false
    }
    
    return $true
}

# =============================================================================
# Auto-correction functions
# =============================================================================

function Convert-FileContentToEnglish {
    param(
        [string]$FilePath,
        [string]$Content
    )
    
    $Lines = $Content -split "`n"
    $ConvertedLines = @()
    
    foreach ($Line in $Lines) {
        $ConvertedLine = $Line
        
        # Convert comments
        if ($Line -match "^(\s*)//\s*(.+)") {
            $Indent = $Matches[1]
            $Comment = $Matches[2]
            $EnglishComment = Convert-TextToEnglish -Text $Comment -Type "comment"
            $ConvertedLine = "$Indent// $EnglishComment"
        }
        
        # Convert string literals in quotes
        if ($Line -match '"[^"]*[а-яёА-ЯЁ][^"]*"') {
            $ConvertedLine = Convert-TextToEnglish -Text $Line -Type "comment"
        }
        
        $ConvertedLines += $ConvertedLine
    }
    
    return $ConvertedLines -join "`n"
}

# =============================================================================
# Export functions for use in other scripts
# =============================================================================

# Export all functions so they can be used by other scripts
Export-ModuleMember -Function @(
    "Convert-TextToEnglish",
    "New-EnglishComment",
    "New-EnglishVariable",
    "New-EnglishLogMessage",
    "New-EnglishErrorMessage",
    "New-EnglishSuccessMessage",
    "Test-IsEnglishText",
    "Test-IsEnglishFileName",
    "Convert-FileContentToEnglish"
)

# =============================================================================
# Usage example
# =============================================================================

<#
# To use this script in other PowerShell scripts:

# Source this script
. .\auto-english-rules.ps1

# Use the functions
$Comment = New-EnglishComment "Создаем файл"
# Result: "// Creating file"

$Variable = New-EnglishVariable "имя_файла"
# Result: "file_name"

$LogMessage = New-EnglishLogMessage "Ошибка при создании" "Error"
# Result: "[Error] Error creating"

# Check if text is English
$IsEnglish = Test-IsEnglishText "Creating file"
# Result: $true

# Convert file content
$ConvertedContent = Convert-FileContentToEnglish -FilePath "script.ps1" -Content $OriginalContent
#>
