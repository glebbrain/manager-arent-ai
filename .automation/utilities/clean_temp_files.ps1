# .automation/utilities/clean_temp_files.ps1
param(
    [switch]$Quiet,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if (-not $Quiet) { Write-Host "🧹 Cleaning temporary files..." -ForegroundColor Cyan }

$cleanedCount = 0
$totalSize = 0

# Define patterns for temporary files
$tempPatterns = @(
    @{Pattern="*.tmp"; Description="Temporary files"},
    @{Pattern="*.temp"; Description="Temporary files"},
    @{Pattern="*.log"; Description="Log files"},
    @{Pattern="*.cache"; Description="Cache files"},
    @{Pattern="*.bak"; Description="Backup files"},
    @{Pattern="*.swp"; Description="Vim swap files"},
    @{Pattern="*.swo"; Description="Vim swap files"},
    @{Pattern="*~"; Description="Backup files"},
    @{Pattern=".DS_Store"; Description="macOS system files"},
    @{Pattern="Thumbs.db"; Description="Windows thumbnail cache"},
    @{Pattern="desktop.ini"; Description="Windows desktop files"}
)

# Define directories to clean
$tempDirectories = @(
    @{Path="__pycache__"; Description="Python cache"},
    @{Path=".pytest_cache"; Description="Pytest cache"},
    @{Path="node_modules/.cache"; Description="Node.js cache"},
    @{Path=".next"; Description="Next.js build cache"},
    @{Path="dist"; Description="Build distribution"},
    @{Path="build"; Description="Build output"},
    @{Path="coverage"; Description="Test coverage reports"},
    @{Path=".coverage"; Description="Coverage data"},
    @{Path="htmlcov"; Description="HTML coverage reports"},
    @{Path=".nyc_output"; Description="NYC coverage output"},
    @{Path="logs"; Description="Log files directory"},
    @{Path="temp"; Description="Temporary files directory"},
    @{Path="tmp"; Description="Temporary files directory"}
)

# Function to clean files by pattern
function Clean-FilesByPattern {
    param(
        [string]$Pattern,
        [string]$Description
    )
    
    $files = Get-ChildItem -Path . -Filter $Pattern -Recurse -File -ErrorAction SilentlyContinue
    $localCleaned = 0
    $localSize = 0
    
    foreach ($file in $files) {
        try {
            $fileSize = $file.Length
            if ($DryRun) {
                if (-not $Quiet) { Write-Host "  🗑️ Would delete: $($file.FullName)" -ForegroundColor Yellow }
            } else {
                Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
                if (-not $Quiet) { Write-Host "  🗑️ Deleted: $($file.Name)" -ForegroundColor Green }
            }
            $localCleaned++
            $localSize += $fileSize
        } catch {
            if (-not $Quiet) { Write-Host "  ❌ Failed to delete: $($file.Name)" -ForegroundColor Red }
        }
    }
    
    if ($localCleaned -gt 0) {
        if (-not $Quiet) { Write-Host "  📁 $Description`: $localCleaned files ($([math]::Round($localSize/1MB, 2)) MB)" -ForegroundColor Blue }
    }
    
    return @{Count=$localCleaned; Size=$localSize}
}

# Function to clean directories
function Clean-Directories {
    param(
        [string]$DirName,
        [string]$Description
    )
    
    $dirs = Get-ChildItem -Path . -Filter $DirName -Recurse -Directory -ErrorAction SilentlyContinue
    $localCleaned = 0
    $localSize = 0
    
    foreach ($dir in $dirs) {
        try {
            $dirSize = (Get-ChildItem -Path $dir.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            if ($DryRun) {
                if (-not $Quiet) { Write-Host "  🗑️ Would delete directory: $($dir.FullName)" -ForegroundColor Yellow }
            } else {
                Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
                if (-not $Quiet) { Write-Host "  🗑️ Deleted directory: $($dir.Name)" -ForegroundColor Green }
            }
            $localCleaned++
            $localSize += $dirSize
        } catch {
            if (-not $Quiet) { Write-Host "  ❌ Failed to delete directory: $($dir.Name)" -ForegroundColor Red }
        }
    }
    
    if ($localCleaned -gt 0) {
        if (-not $Quiet) { Write-Host "  📁 $Description`: $localCleaned directories ($([math]::Round($localSize/1MB, 2)) MB)" -ForegroundColor Blue }
    }
    
    return @{Count=$localCleaned; Size=$localSize}
}

# Clean files by patterns
if (-not $Quiet) { Write-Host "`n📄 Cleaning files by patterns..." -ForegroundColor Yellow }
foreach ($pattern in $tempPatterns) {
    $result = Clean-FilesByPattern -Pattern $pattern.Pattern -Description $pattern.Description
    $cleanedCount += $result.Count
    $totalSize += $result.Size
}

# Clean directories
if (-not $Quiet) { Write-Host "`n📁 Cleaning directories..." -ForegroundColor Yellow }
foreach ($dir in $tempDirectories) {
    $result = Clean-Directories -DirName $dir.Path -Description $dir.Description
    $cleanedCount += $result.Count
    $totalSize += $result.Size
}

# Clean specific project files
if (-not $Quiet) { Write-Host "`n🎯 Cleaning project-specific files..." -ForegroundColor Yellow }

# Python specific
if ((Test-Path "requirements.txt") -or (Test-Path "*.py")) {
    $pythonFiles = @("*.pyc", "*.pyo", "*.pyd", ".Python", "pip-log.txt", "pip-delete-this-directory.txt")
    foreach ($pattern in $pythonFiles) {
        $result = Clean-FilesByPattern -Pattern $pattern -Description "Python $pattern"
        $cleanedCount += $result.Count
        $totalSize += $result.Size
    }
}

# Node.js specific
if (Test-Path "package.json") {
    $nodeFiles = @("npm-debug.log*", "yarn-debug.log*", "yarn-error.log*", ".npm", ".yarn-integrity")
    foreach ($pattern in $nodeFiles) {
        $result = Clean-FilesByPattern -Pattern $pattern -Description "Node.js $pattern"
        $cleanedCount += $result.Count
        $totalSize += $result.Size
    }
}

# .NET specific
if ((Test-Path "*.sln") -or (Test-Path "*.csproj")) {
    $dotnetDirs = @("bin", "obj", "packages")
    foreach ($dir in $dotnetDirs) {
        $result = Clean-Directories -DirName $dir -Description ".NET $dir"
        $cleanedCount += $result.Count
        $totalSize += $result.Size
    }
}

# Summary
if (-not $Quiet) {
    Write-Host "`n📊 Cleanup Summary:" -ForegroundColor Cyan
    if ($DryRun) {
        Write-Host "  🔍 Dry run mode - no files actually deleted" -ForegroundColor Yellow
    }
    Write-Host "  🗑️ Items processed: $cleanedCount" -ForegroundColor Green
    Write-Host "  💾 Space that would be freed: $([math]::Round($totalSize/1MB, 2)) MB" -ForegroundColor Blue
    
    if ($cleanedCount -gt 0) {
        Write-Host "  ✅ Cleanup completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "  ℹ️ No temporary files found to clean" -ForegroundColor Blue
    }
}

# Exit with success
exit 0