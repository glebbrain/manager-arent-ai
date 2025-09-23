# =============================================================================
# English Converter PowerShell Script
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

# Set UTF-8 encoding for proper Russian character handling
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

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
    $Result = $Result -replace "`u0421`u043E`u0437`u0434`u0430`u0435`u043C", "Creating"
    $Result = $Result -replace "`u041F`u0440`u043E`u0432`u0435`u0440`u044F`u0435`u043C", "Checking"
    $Result = $Result -replace "`u041F`u043E`u043B`u0443`u0447`u0430`u0435`u043C", "Getting"
    $Result = $Result -replace "`u0423`u0441`u0442`u0430`u043D`u0430`u0432`u043B`u0438`u0432`u0430`u0435`u043C", "Setting"
    $Result = $Result -replace "`u0412`u044B`u0447`u0438`u0441`u043B`u044F`u0435`u043C", "Calculating"
    $Result = $Result -replace "`u041E`u0431`u0440`u0430`u0431`u0430`u0442`u044B`u0432`u0430`u0435`u043C", "Processing"
    $Result = $Result -replace "`u0412`u0430`u043B`u0438`u0434`u0438`u0440`u0443`u0435`u043C", "Validating"
    $Result = $Result -replace "`u0418`u043D`u0438`u0446`u0438`u0430`u043B`u0438`u0437`u0438`u0440`u0443`u0435`u043C", "Initializing"
    $Result = $Result -replace "`u0417`u0430`u0432`u0435`u0440`u0448`u0430`u0435`u043C", "Completing"
    
    # Status messages
    $Result = $Result -replace "`u041E`u0448`u0438`u0431`u043A`u0430", "Error"
    $Result = $Result -replace "`u041F`u0440`u0435`u0434`u0443`u043F`u0440`u0435`u0436`u0434`u0435`u043D`u0438`u0435", "Warning"
    $Result = $Result -replace "`u0418`u043D`u0444`u043E`u0440`u043C`u0430`u0446`u0438`u044F", "Info"
    $Result = $Result -replace "`u0423`u0441`u043F`u0435`u0448`u043D`u043E", "Success"
    $Result = $Result -replace "`u041D`u0430`u0447`u0438`u043D`u0430`u0435`u043C", "Starting"
    $Result = $Result -replace "`u0417`u0430`u043A`u0430`u043D`u0447`u0438`u0432`u0430`u0435`u043C", "Ending"
    $Result = $Result -replace "`u041F`u0440`u043E`u0434`u043E`u043B`u0436`u0430`u0435`u043C", "Continuing"
    $Result = $Result -replace "`u041E`u0441`u0442`u0430`u043D`u0430`u0432`u043B`u0438`u0432`u0430`u0435`u043C", "Stopping"
    $Result = $Result -replace "`u0417`u0430`u043F`u0443`u0441`u043A`u0430`u0435`u043C", "Running"
    $Result = $Result -replace "`u0412`u044B`u043F`u043E`u043B`u043D`u044F`u0435`u043C", "Executing"
    
    # Actions
    $Result = $Result -replace "`u0421`u043E`u0445`u0440`u0430`u043D`u044F`u0435`u043C", "Saving"
    $Result = $Result -replace "`u0417`u0430`u0433`u0440`u0443`u0436`u0430`u0435`u043C", "Loading"
    $Result = $Result -replace "`u041E`u0431`u043D`u043E`u0432`u043B`u044F`u0435`u043C", "Updating"
    $Result = $Result -replace "`u0423`u0434`u0430`u043B`u044F`u0435`u043C", "Removing"
    $Result = $Result -replace "`u0414`u043E`u0431`u0430`u0432`u043B`u044F`u0435`u043C", "Adding"
    $Result = $Result -replace "`u0418`u0437`u043C`u0435`u043D`u044F`u0435`u043C", "Modifying"
    $Result = $Result -replace "`u041A`u043E`u043F`u0438`u0440`u0443`u0435`u043C", "Copying"
    $Result = $Result -replace "`u041F`u0435`u0440`u0435`u043C`u0435`u0449`u0430`u0435`u043C", "Moving"
    $Result = $Result -replace "`u041F`u0435`u0440`u0435`u0438`u043C`u0435`u043D`u043E`u0432`u044B`u0432`u0430`u0435`u043C", "Renaming"
    
    # Common terms
    $Result = $Result -replace "`u0444`u0430`u0439`u043B", "file"
    $Result = $Result -replace "`u043F`u0430`u043F`u043A`u0430", "directory"
    $Result = $Result -replace "`u0434`u0438`u0440`u0435`u043A`u0442`u043E`u0440`u0438`u044F", "directory"
    $Result = $Result -replace "`u043F`u0443`u0442`u044C", "path"
    $Result = $Result -replace "`u0438`u043C`u044F", "name"
    $Result = $Result -replace "`u0441`u043E`u0434`u0435`u0440`u0436`u0438`u043C`u043E`u0435", "content"
    $Result = $Result -replace "`u0440`u0430`u0437`u043C`u0435`u0440", "size"
    $Result = $Result -replace "`u0442`u0438`u043F", "type"
    $Result = $Result -replace "`u0441`u0442`u0430`u0442`u0443`u0441", "status"
    $Result = $Result -replace "`u0441`u043E`u0441`u0442`u043E`u044F`u043D`u0438`u0435", "state"
    $Result = $Result -replace "`u0440`u0435`u0437`u0443`u043B`u044C`u0442`u0430`u0442", "result"
    $Result = $Result -replace "`u043E`u0442`u0432`u0435`u0442", "response"
    $Result = $Result -replace "`u0437`u0430`u043F`u0440`u043E`u0441", "request"
    $Result = $Result -replace "`u0434`u0430`u043D`u043D`u044B`u0435", "data"
    $Result = $Result -replace "`u0438`u043D`u0444`u043E`u0440`u043C`u0430`u0446`u0438`u044F", "information"
    $Result = $Result -replace "`u043D`u0430`u0441`u0442`u0440`u043E`u0439`u043A`u0438", "settings"
    $Result = $Result -replace "`u043A`u043E`u043D`u0444`u0438`u0433`u0443`u0440`u0430`u0446`u0438`u044F", "configuration"
    $Result = $Result -replace "`u043F`u0430`u0440`u0430`u043C`u0435`u0442`u0440`u044B", "parameters"
    $Result = $Result -replace "`u043E`u043F`u0446`u0438`u0438", "options"
    $Result = $Result -replace "`u0441`u0432`u043E`u0439`u0441`u0442`u0432`u0430", "properties"
    $Result = $Result -replace "`u0430`u0442`u0440`u0438`u0431`u0443`u0442`u044B", "attributes"
    
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