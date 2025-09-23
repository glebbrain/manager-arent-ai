# =============================================================================
# Simple script for creating files and directories
# Wrapper over file-manager.ps1 for easier use
# =============================================================================

# Source English rules
. "$PSScriptRoot\auto-english-rules.ps1"

param(
    [Parameter(Mandatory=$true)]
    [string]$Type,
    
    [Parameter(Mandatory=$true)]
    [string]$Path,
    
    [Parameter(Mandatory=$false)]
    [string]$Name = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Content = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Recursive = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

# Get path to main script
$ScriptPath = Join-Path $PSScriptRoot "file-manager.ps1"

# Check that main script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Error "Main script file-manager.ps1 not found in $ScriptPath"
    exit 1
}

# Define action based on type
$Action = switch ($Type.ToLower()) {
    "dir" { "create-dir" }
    "directory" { "create-dir" }
    "folder" { "create-dir" }
    "file" { "create-file" }
    default { 
        Write-Error "Unknown type: $Type. Use: dir, directory, folder or file"
        exit 1
    }
}

# Build command to call main script
$Arguments = @(
    "-Action", $Action,
    "-Path", $Path
)

if ($Name) {
    $Arguments += "-Name", $Name
}

if ($Content) {
    $Arguments += "-Content", $Content
}

if ($Recursive) {
    $Arguments += "-Recursive"
}

if ($Force) {
    $Arguments += "-Force"
}

# Execute main script
try {
    if ($Content) {
        & $ScriptPath -Action $Action -Path $Path -Name $Name -Content $Content -Recursive:$Recursive -Force:$Force
    } else {
        & $ScriptPath -Action $Action -Path $Path -Name $Name -Recursive:$Recursive -Force:$Force
    }
}
catch {
    Write-Error "Error executing: $($_.Exception.Message)"
    exit 1
}
