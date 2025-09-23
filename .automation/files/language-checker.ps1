# =============================================================================
# Language Checker PowerShell Script
# Validates that files follow English-only coding rules
# =============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Path = ".",
    
    [Parameter(Mandatory=$false)]
    [string[]]$Extensions = @("*.js", "*.ts", "*.json", "*.md", "*.yml", "*.yaml", "*.xml", "*.html", "*.css", "*.scss", "*.ps1", "*.py", "*.java", "*.cs", "*.cpp", "*.c", "*.h"),
    
    [Parameter(Mandatory=$false)]
    [string[]]$ExcludeDirs = @("node_modules", ".git", "dist", "build", "target", "bin", "obj"),
    
    [Parameter(Mandatory=$false)]
    [switch]$Recursive = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$Fix = $false,
    
    [Parameter(Mandatory=$false)]
    [string]$LogFile = "language-check.log"
)

# Set UTF-8 encoding for proper Russian character handling
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# =============================================================================
# Global variables
# =============================================================================

$ErrorActionPreference = "Continue"
$Issues = @()
$FixedIssues = 0
$TotalFiles = 0

# Translation file patterns (these are allowed)
$TranslationFilePatterns = @(
    ".*_[a-z]{2}\.json$",
    ".*_[a-z]{2}\.xml$",
    ".*_[a-z]{2}\.yml$",
    ".*_[a-z]{2}\.yaml$",
    ".*_[a-z]{2}\.md$",
    "locales/.*",
    "translations/.*",
    "lang/.*",
    "i18n/.*"
)

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
    
    # Write to log file
    try {
        Add-Content -Path $LogFile -Value $LogMessage -Encoding UTF8 -ErrorAction SilentlyContinue
    }
    catch {
        # Ignore log writing errors
    }
}

function Test-IsTranslationFile {
    param([string]$FilePath)
    
    foreach ($pattern in $TranslationFilePatterns) {
        if ($FilePath -match $pattern) {
            return $true
        }
    }
    return $false
}

function Test-IsExcludedDirectory {
    param([string]$DirPath)
    
    foreach ($excludeDir in $ExcludeDirs) {
        if ($DirPath -like "*$excludeDir*") {
            return $true
        }
    }
    return $false
}

function Test-HasNonEnglishContent {
    param([string]$Content)
    
    # Check for Cyrillic characters (Russian, Ukrainian, etc.)
    if ($Content -match "[а-яёА-ЯЁ]") {
        return $true
    }
    
    # Check for other common non-English characters
    if ($Content -match "[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]") {
        return $true
    }
    
    return $false
}

function Get-NonEnglishLines {
    param(
        [string]$FilePath,
        [string]$Content
    )
    
    $Issues = @()
    $Lines = $Content -split "`n"
    
    for ($i = 0; $i -lt $Lines.Length; $i++) {
        $LineNumber = $i + 1
        $Line = $Lines[$i]
        
        if (Test-HasNonEnglishContent $Line) {
            $Issues += @{
                File = $FilePath
                Line = $LineNumber
                Content = $Line.Trim()
            }
        }
    }
    
    return $Issues
}

function Process-File {
    param([string]$FilePath)
    
    try {
        $Content = Get-Content -Path $FilePath -Raw -Encoding UTF8 -ErrorAction Stop
        $FileIssues = Get-NonEnglishLines -FilePath $FilePath -Content $Content
        
        if ($FileIssues.Count -gt 0) {
            foreach ($Issue in $FileIssues) {
                $Issues += $Issue
                Write-Log "Found non-English content in $($Issue.File):$($Issue.Line) - $($Issue.Content)" "Warning"
            }
        }
        
        $script:TotalFiles++
    }
    catch {
        Write-Log "Error processing file $FilePath : $($_.Exception.Message)" "Error"
    }
}

# =============================================================================
# Main execution
# =============================================================================

try {
    Write-Log "Starting language checker on path: $Path" "Info"
    
    if ($Fix) {
        Write-Log "Fix mode enabled - will attempt to fix common issues" "Warning"
    }
    
    # Get all files matching the specified extensions
    $Files = @()
    foreach ($Extension in $Extensions) {
        $SearchPath = if ($Recursive) { Join-Path $Path "**\$Extension" } else { Join-Path $Path $Extension }
        $FoundFiles = Get-ChildItem -Path $SearchPath -File -ErrorAction SilentlyContinue
        $Files += $FoundFiles
    }
    
    # Filter out excluded directories and translation files
    $Files = $Files | Where-Object {
        $File = $_
        $IsExcluded = $false
        $IsTranslation = Test-IsTranslationFile -FilePath $File.FullName
        
        foreach ($ExcludeDir in $ExcludeDirs) {
            if ($File.FullName -like "*$ExcludeDir*") {
                $IsExcluded = $true
                break
            }
        }
        
        return -not $IsExcluded -and -not $IsTranslation
    }
    
    Write-Log "Found $($Files.Count) files to check" "Info"
    
    # Process each file
    foreach ($File in $Files) {
        Process-File -FilePath $File.FullName
    }
    
    # Summary
    Write-Log "Language check completed" "Info"
    Write-Log "Total files processed: $TotalFiles" "Info"
    Write-Log "Total issues found: $($Issues.Count)" "Info"
    
    if ($Issues.Count -gt 0) {
        Write-Log "Issues found:" "Warning"
        foreach ($Issue in $Issues) {
            Write-Log "  $($Issue.File):$($Issue.Line) - $($Issue.Content)" "Warning"
        }
        
        Write-Log "Consider using apply-english-rules.ps1 to fix these issues" "Info"
        exit 1
    } else {
        Write-Log "All files follow English-only coding rules" "Success"
        exit 0
    }
}
catch {
    Write-Log "Critical error: $($_.Exception.Message)" "Error"
    exit 1
}