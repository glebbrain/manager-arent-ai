# Universal Project Type Detection Script
# Automatically detects project type based on configuration files and structure

param(
    [string]$ProjectPath = ".",
    [switch]$Json,
    [switch]$Quiet
)

# Load project configuration
$configPath = Join-Path $PSScriptRoot "..\config\project-config.json"
$projectConfig = Get-Content $configPath | ConvertFrom-Json

# Function to log messages
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    if (-not $Quiet) {
        $timestamp = Get-Date -Format "HH:mm:ss"
        $logMessage = "[$timestamp] [$Level] $Message"
        
        switch ($Level) {
            "ERROR" { Write-Host $logMessage -ForegroundColor Red }
            "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
            "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
            "INFO" { Write-Host $logMessage -ForegroundColor Cyan }
            default { Write-Host $logMessage -ForegroundColor White }
        }
    }
}

# Function to detect project type
function Get-ProjectType {
    param([string]$Path)
    
    $detectionResults = @{}
    $maxScore = 0
    $detectedType = "unknown"
    
    # Check each project type
    foreach ($projectType in $projectConfig.projectTypes.PSObject.Properties) {
        $typeName = $projectType.Name
        $typeConfig = $projectType.Value
        $score = 0
        $foundFiles = @()
        
        Write-Log "Checking for $typeName..." "INFO"
        
        # Check detection files
        foreach ($file in $typeConfig.detectionFiles) {
            if (Test-Path (Join-Path $Path $file)) {
                $score += 10
                $foundFiles += $file
                Write-Log "  Found: $file" "SUCCESS"
            }
        }
        
        # Check config files
        foreach ($file in $typeConfig.configFiles) {
            if (Test-Path (Join-Path $Path $file)) {
                $score += 5
                $foundFiles += $file
                Write-Log "  Found config: $file" "SUCCESS"
            }
        }
        
        # Check source directories
        foreach ($dir in $typeConfig.sourceDirs) {
            if (Test-Path (Join-Path $Path $dir)) {
                $score += 3
                $foundFiles += $dir
                Write-Log "  Found source dir: $dir" "SUCCESS"
            }
        }
        
        # Check test directories
        foreach ($dir in $typeConfig.testDirs) {
            if (Test-Path (Join-Path $Path $dir)) {
                $score += 2
                $foundFiles += $dir
                Write-Log "  Found test dir: $dir" "SUCCESS"
            }
        }
        
        $detectionResults[$typeName] = @{
            Score = $score
            FoundFiles = $foundFiles
            Config = $typeConfig
        }
        
        if ($score -gt $maxScore) {
            $maxScore = $score
            $detectedType = $typeName
        }
    }
    
    return @{
        DetectedType = $detectedType
        MaxScore = $maxScore
        AllResults = $detectionResults
        Confidence = if ($maxScore -gt 20) { "High" } elseif ($maxScore -gt 10) { "Medium" } else { "Low" }
    }
}

# Function to check dependencies
function Test-Dependencies {
    param([string]$ProjectType, [string]$Path)
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    $missingDeps = @()
    $availableDeps = @()
    
    Write-Log "Checking dependencies for $ProjectType..." "INFO"
    
    # Check required dependencies
    foreach ($dep in $typeConfig.dependencies.required) {
        try {
            $version = Invoke-Expression "$dep --version" 2>$null
            if ($LASTEXITCODE -eq 0) {
                $availableDeps += $dep
                Write-Log "  [OK] $dep is available" "SUCCESS"
            } else {
                $missingDeps += $dep
                Write-Log "  [FAIL] $dep is missing" "ERROR"
            }
        } catch {
            $missingDeps += $dep
            Write-Log "  [FAIL] $dep is missing" "ERROR"
        }
    }
    
    # Check optional dependencies
    foreach ($dep in $typeConfig.dependencies.optional) {
        try {
            $version = Invoke-Expression "$dep --version" 2>$null
            if ($LASTEXITCODE -eq 0) {
                $availableDeps += $dep
                Write-Log "  [OK] $dep is available (optional)" "SUCCESS"
            } else {
                Write-Log "  ⚠️ $dep is not available (optional)" "WARNING"
            }
        } catch {
            Write-Log "  ⚠️ $dep is not available (optional)" "WARNING"
        }
    }
    
    return @{
        Available = $availableDeps
        Missing = $missingDeps
        AllRequired = $missingDeps.Count -eq 0
    }
}

# Function to generate project info
function Get-ProjectInfo {
    param([string]$Path, [string]$ProjectType)
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    $projectInfo = @{
        Type = $ProjectType
        Name = $typeConfig.name
        Path = (Resolve-Path $Path).Path
        BuildCommand = $typeConfig.buildCommand
        TestCommand = $typeConfig.testCommand
        DevCommand = $typeConfig.devCommand
        InstallCommand = $typeConfig.installCommand
        BuildDir = $typeConfig.buildDir
        SourceDirs = $typeConfig.sourceDirs
        TestDirs = $typeConfig.testDirs
        ConfigFiles = $typeConfig.configFiles
        Dependencies = Test-Dependencies -ProjectType $ProjectType -Path $Path
    }
    
    return $projectInfo
}

# Main execution
try {
    Write-Log "[DETECT] Detecting project type in: $ProjectPath" "INFO"
    
    # Detect project type
    $detection = Get-ProjectType -Path $ProjectPath
    
    if ($detection.DetectedType -eq "unknown") {
        Write-Log "[FAIL] Could not detect project type" "ERROR"
        if ($Json) {
            return @{ Error = "Could not detect project type" } | ConvertTo-Json
        }
        exit 1
    }
    
    Write-Log "[OK] Detected project type: $($detection.DetectedType) (Confidence: $($detection.Confidence))" "SUCCESS"
    
    # Get project info
    $projectInfo = Get-ProjectInfo -Path $ProjectPath -ProjectType $detection.DetectedType
    
    # Add detection details
    $projectInfo.Detection = $detection
    
    if ($Json) {
        return $projectInfo | ConvertTo-Json -Depth 10
    } else {
        Write-Log "`n[INFO] Project Information:" "INFO"
        Write-Log "  Type: $($projectInfo.Name)" "INFO"
        Write-Log "  Path: $($projectInfo.Path)" "INFO"
        Write-Log "  Build Command: $($projectInfo.BuildCommand)" "INFO"
        Write-Log "  Test Command: $($projectInfo.TestCommand)" "INFO"
        Write-Log "  Dev Command: $($projectInfo.DevCommand)" "INFO"
        Write-Log "  Install Command: $($projectInfo.InstallCommand)" "INFO"
        Write-Log "  Build Directory: $($projectInfo.BuildDir)" "INFO"
        
        Write-Log "`n[DEPS] Dependencies:" "INFO"
        Write-Log "  Available: $($projectInfo.Dependencies.Available -join ', ')" "SUCCESS"
        if ($projectInfo.Dependencies.Missing.Count -gt 0) {
            Write-Log "  Missing: $($projectInfo.Dependencies.Missing -join ', ')" "ERROR"
        }
        
        Write-Log "`n[COMPLETE] Project detection completed!" "SUCCESS"
    }
    
} catch {
    Write-Log "[ERROR] Project detection failed: $($_.Exception.Message)" "ERROR"
    if ($Json) {
        return @{ Error = $_.Exception.Message } | ConvertTo-Json
    }
    exit 1
}
