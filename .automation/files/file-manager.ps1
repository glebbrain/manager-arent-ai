# =============================================================================
# File Manager PowerShell Script
# Create folders and files with error handling
# =============================================================================

# Source English rules
. "$PSScriptRoot\auto-english-rules.ps1"

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "help",
    
    [Parameter(Mandatory=$false)]
    [string]$Path = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Name = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Content = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Type = "file",
    
    [Parameter(Mandatory=$false)]
    [switch]$Recursive = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false,
    
    [Parameter(Mandatory=$false)]
    [string]$Encoding = "UTF8"
)

# =============================================================================
# Global variables and settings
# =============================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Debug = "Gray"
}

# =============================================================================
# Logging functions
# =============================================================================

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "Info",
        [string]$Color = $Colors.Info
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    
    Write-Host $LogMessage -ForegroundColor $Color
    
    # Write to log file
    $LogFile = Join-Path $PSScriptRoot "file-manager.log"
    try {
        Add-Content -Path $LogFile -Value $LogMessage -Encoding UTF8 -ErrorAction SilentlyContinue
    }
    catch {
        # Ignore log writing errors
    }
}

# =============================================================================
# Validation functions
# =============================================================================

function Test-PathValid {
    param([string]$Path)
    
    if ([string]::IsNullOrWhiteSpace($Path)) {
        return $false
    }
    
    # Check for invalid characters
    $InvalidChars = [IO.Path]::GetInvalidPathChars()
    foreach ($char in $InvalidChars) {
        if ($Path.Contains($char)) {
            return $false
        }
    }
    
    # Check path length
    if ($Path.Length -gt 260) {
        return $false
    }
    
    return $true
}

function Test-NameValid {
    param([string]$Name)
    
    if ([string]::IsNullOrWhiteSpace($Name)) {
        return $false
    }
    
    # Check for invalid characters in filename
    $InvalidChars = [IO.Path]::GetInvalidFileNameChars()
    foreach ($char in $InvalidChars) {
        if ($Name.Contains($char)) {
            return $false
        }
    }
    
    return $true
}

# =============================================================================
# Main functions
# =============================================================================

function New-Directory {
    param(
        [string]$Path,
        [string]$Name,
        [bool]$Recursive = $false,
        [bool]$Force = $false
    )
    
    try {
        Write-Log "Starting directory creation: $Name in $Path" "Info"
        
        # Parameter validation
        if (-not (Test-PathValid $Path)) {
            throw "Invalid path: $Path"
        }
        
        if (-not (Test-NameValid $Name)) {
            throw "Invalid directory name: $Name"
        }
        
        # Build full path
        $FullPath = Join-Path $Path $Name
        
        # Check if already exists
        if ((Test-Path $FullPath) -and -not $Force) {
            Write-Log "Directory already exists: $FullPath" "Warning" $Colors.Warning
            return $FullPath
        }
        
        # Create directory
        if ($Recursive) {
            New-Item -ItemType Directory -Path $FullPath -Force | Out-Null
        } else {
            # Check that parent directory exists
            $ParentPath = Split-Path $FullPath -Parent
            if (-not (Test-Path $ParentPath)) {
                throw "Parent directory does not exist: $ParentPath"
            }
            New-Item -ItemType Directory -Path $FullPath -Force | Out-Null
        }
        
        Write-Log "Directory created successfully: $FullPath" "Success" $Colors.Success
        return $FullPath
    }
    catch {
        Write-Log "Error creating directory: $($_.Exception.Message)" "Error" $Colors.Error
        throw
    }
}

function New-File {
    param(
        [string]$Path,
        [string]$Name,
        [string]$Content = "",
        [string]$Encoding = "UTF8",
        [bool]$Force = $false
    )
    
    try {
        Write-Log "Starting file creation: $Name in $Path" "Info"
        
        # Parameter validation
        if (-not (Test-PathValid $Path)) {
            throw "Invalid path: $Path"
        }
        
        if (-not (Test-NameValid $Name)) {
            throw "Invalid file name: $Name"
        }
        
        # Build full path
        $FullPath = Join-Path $Path $Name
        
        # Check if already exists
        if ((Test-Path $FullPath) -and -not $Force) {
            Write-Log "File already exists: $FullPath" "Warning" $Colors.Warning
            return $FullPath
        }
        
        # Check that directory exists
        $Directory = Split-Path $FullPath -Parent
        if (-not (Test-Path $Directory)) {
            Write-Log "Creating parent directory: $Directory" "Info"
            New-Item -ItemType Directory -Path $Directory -Force | Out-Null
        }
        
        # Create file
        $EncodingParam = switch ($Encoding.ToUpper()) {
            "UTF8" { "UTF8" }
            "ASCII" { "ASCII" }
            "UNICODE" { "Unicode" }
            "UTF32" { "UTF32" }
            default { "UTF8" }
        }
        
        Set-Content -Path $FullPath -Value $Content -Encoding $EncodingParam -Force
        
        Write-Log "File created successfully: $FullPath" "Success" $Colors.Success
        return $FullPath
    }
    catch {
        Write-Log "Error creating file: $($_.Exception.Message)" "Error" $Colors.Error
        throw
    }
}

function Remove-ItemSafe {
    param(
        [string]$Path,
        [bool]$Recursive = $false,
        [bool]$Force = $false
    )
    
    try {
        Write-Log "Starting removal: $Path" "Info"
        
        if (-not (Test-Path $Path)) {
            Write-Log "Path does not exist: $Path" "Warning" $Colors.Warning
            return
        }
        
        Remove-Item -Path $Path -Recurse:$Recursive -Force:$Force
        
        Write-Log "Successfully removed: $Path" "Success" $Colors.Success
    }
    catch {
        Write-Log "Error during removal: $($_.Exception.Message)" "Error" $Colors.Error
        throw
    }
}

function Get-ItemInfo {
    param([string]$Path)
    
    try {
        if (-not (Test-Path $Path)) {
            Write-Log "Path does not exist: $Path" "Warning" $Colors.Warning
            return $null
        }
        
        $Item = Get-Item $Path
        $Info = @{
            Name = $Item.Name
            FullName = $Item.FullName
            Type = if ($Item.PSIsContainer) { "Directory" } else { "File" }
            Size = if ($Item.PSIsContainer) { "N/A" } else { $Item.Length }
            Created = $Item.CreationTime
            Modified = $Item.LastWriteTime
            Attributes = $Item.Attributes
        }
        
        return $Info
    }
    catch {
        Write-Log "Error getting information: $($_.Exception.Message)" "Error" $Colors.Error
        throw
    }
}

# =============================================================================
# Help function
# =============================================================================

function Show-Help {
    Write-Host "`n=== File Manager PowerShell Script ===" -ForegroundColor $Colors.Info
    Write-Host "`nUsage:" -ForegroundColor $Colors.Info
    Write-Host "  .\file-manager.ps1 -Action <action> -Path <path> -Name <name> [parameters]"
    Write-Host "`nActions:" -ForegroundColor $Colors.Info
    Write-Host "  create-dir    - Create directory"
    Write-Host "  create-file   - Create file"
    Write-Host "  remove        - Remove file or directory"
    Write-Host "  info          - Get information about file/directory"
    Write-Host "  help          - Show this help"
    Write-Host "`nParameters:" -ForegroundColor $Colors.Info
    Write-Host "  -Path         - Path to parent directory"
    Write-Host "  -Name         - Name of file or directory"
    Write-Host "  -Content      - File content (for create-file)"
    Write-Host "  -Type         - Element type (file/directory)"
    Write-Host "  -Recursive    - Recursive directory creation"
    Write-Host "  -Force        - Force execution"
    Write-Host "  -Encoding     - File encoding (UTF8, ASCII, Unicode)"
    Write-Host "`nExamples:" -ForegroundColor $Colors.Info
    Write-Host "  .\file-manager.ps1 -Action create-dir -Path 'C:\Temp' -Name 'NewFolder'"
    Write-Host "  .\file-manager.ps1 -Action create-file -Path 'C:\Temp' -Name 'test.txt' -Content 'Hello World'"
    Write-Host "  .\file-manager.ps1 -Action remove -Path 'C:\Temp\test.txt'"
    Write-Host "  .\file-manager.ps1 -Action info -Path 'C:\Temp\NewFolder'"
    Write-Host ""
}

# =============================================================================
# Main logic
# =============================================================================

try {
    Write-Log "Starting File Manager Script" "Info"
    
    switch ($Action.ToLower()) {
        "create-dir" {
            if ([string]::IsNullOrWhiteSpace($Path) -or [string]::IsNullOrWhiteSpace($Name)) {
                throw "Must specify -Path and -Name for directory creation"
            }
            
            $Result = New-Directory -Path $Path -Name $Name -Recursive $Recursive -Force $Force
            Write-Host "Directory created: $Result" -ForegroundColor $Colors.Success
        }
        
        "create-file" {
            if ([string]::IsNullOrWhiteSpace($Path) -or [string]::IsNullOrWhiteSpace($Name)) {
                throw "Must specify -Path and -Name for file creation"
            }
            
            $Result = New-File -Path $Path -Name $Name -Content $Content -Encoding $Encoding -Force $Force
            Write-Host "File created: $Result" -ForegroundColor $Colors.Success
        }
        
        "remove" {
            if ([string]::IsNullOrWhiteSpace($Path)) {
                throw "Must specify -Path for removal"
            }
            
            $FullPath = if ($Name) { Join-Path $Path $Name } else { $Path }
            Remove-ItemSafe -Path $FullPath -Recursive $Recursive -Force $Force
            Write-Host "Item removed: $FullPath" -ForegroundColor $Colors.Success
        }
        
        "info" {
            if ([string]::IsNullOrWhiteSpace($Path)) {
                throw "Must specify -Path for getting information"
            }
            
            $FullPath = if ($Name) { Join-Path $Path $Name } else { $Path }
            $Info = Get-ItemInfo -Path $FullPath
            
            if ($Info) {
                Write-Host "`nItem information:" -ForegroundColor $Colors.Info
                Write-Host "  Name: $($Info.Name)" -ForegroundColor $Colors.Info
                Write-Host "  Full path: $($Info.FullName)" -ForegroundColor $Colors.Info
                Write-Host "  Type: $($Info.Type)" -ForegroundColor $Colors.Info
                Write-Host "  Size: $($Info.Size)" -ForegroundColor $Colors.Info
                Write-Host "  Created: $($Info.Created)" -ForegroundColor $Colors.Info
                Write-Host "  Modified: $($Info.Modified)" -ForegroundColor $Colors.Info
                Write-Host "  Attributes: $($Info.Attributes)" -ForegroundColor $Colors.Info
            }
        }
        
        "help" {
            Show-Help
        }
        
        default {
            Write-Log "Unknown action: $Action" "Error" $Colors.Error
            Show-Help
            exit 1
        }
    }
    
    Write-Log "Operation completed successfully" "Success" $Colors.Success
}
catch {
    Write-Log "Critical error: $($_.Exception.Message)" "Error" $Colors.Error
    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor $Colors.Error
    exit 1
}