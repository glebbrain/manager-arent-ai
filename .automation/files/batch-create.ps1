# =============================================================================
# Batch File and Directory Creator
# Creates multiple files and directories from a configuration file
# =============================================================================

# Source English rules
. "$PSScriptRoot\auto-english-rules.ps1"

param(
    [Parameter(Mandatory=$true)]
    [string]$ConfigFile,
    
    [Parameter(Mandatory=$false)]
    [string]$BasePath = ".",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

# Get path to main script
$ScriptPath = Join-Path $PSScriptRoot "file-manager.ps1"

# Check that main script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Error "Main script file-manager.ps1 not found in $ScriptPath"
    exit 1
}

# Check that config file exists
if (-not (Test-Path $ConfigFile)) {
    Write-Error "Config file not found: $ConfigFile"
    exit 1
}

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
        default { "Cyan" }
    }
    
    Write-Host $LogMessage -ForegroundColor $Color
}

function Process-Item {
    param(
        [PSObject]$Item,
        [string]$CurrentPath
    )
    
    $ItemPath = Join-Path $CurrentPath $Item.Name
    
    if ($Item.Type -eq "directory") {
        Write-Log "Creating directory: $ItemPath" "Info"
        
        if (-not $DryRun) {
            try {
                & $ScriptPath -Action create-dir -Path $CurrentPath -Name $Item.Name -Recursive -Force:$Force
                Write-Log "Directory created: $ItemPath" "Success"
            }
            catch {
                Write-Log "Error creating directory $ItemPath : $($_.Exception.Message)" "Error"
                return $false
            }
        } else {
            Write-Log "DRY RUN: Would create directory: $ItemPath" "Warning"
        }
        
        # Process children if they exist
        if ($Item.Children) {
            foreach ($Child in $Item.Children) {
                Process-Item -Item $Child -CurrentPath $ItemPath
            }
        }
    }
    elseif ($Item.Type -eq "file") {
        Write-Log "Creating file: $ItemPath" "Info"
        
        if (-not $DryRun) {
            try {
                $Content = if ($Item.Content) { $Item.Content } else { "" }
                & $ScriptPath -Action create-file -Path $CurrentPath -Name $Item.Name -Content $Content -Force:$Force
                Write-Log "File created: $ItemPath" "Success"
            }
            catch {
                Write-Log "Error creating file $ItemPath : $($_.Exception.Message)" "Error"
                return $false
            }
        } else {
            Write-Log "DRY RUN: Would create file: $ItemPath" "Warning"
        }
    }
    
    return $true
}

# Main execution
try {
    Write-Log "Starting batch creation from config: $ConfigFile" "Info"
    
    if ($DryRun) {
        Write-Log "DRY RUN MODE - No actual files will be created" "Warning"
    }
    
    # Read and parse config file
    $ConfigContent = Get-Content $ConfigFile -Raw -Encoding UTF8
    $Config = $ConfigContent | ConvertFrom-Json
    
    # Process each item in the config
    foreach ($Item in $Config.Items) {
        Process-Item -Item $Item -CurrentPath $BasePath
    }
    
    Write-Log "Batch creation completed" "Success"
}
catch {
    Write-Log "Critical error: $($_.Exception.Message)" "Error"
    exit 1
}
