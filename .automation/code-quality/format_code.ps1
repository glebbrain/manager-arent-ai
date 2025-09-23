# Code Quality Automation Script for LearnEnglishBot
# Automates code formatting, linting, and type checking

param(
    [switch]$Format,
    [switch]$Lint,
    [switch]$TypeCheck,
    [switch]$Security,
    [switch]$All,
    [switch]$Fix,
    [switch]$CheckOnly,
    [string]$Target = "bot/",
    [string]$LogFile = "code_quality.log"
)

function Write-QualityLog {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    Write-Host $logMessage -ForegroundColor $(if ($Level -eq "ERROR") { "Red" } elseif ($Level -eq "WARNING") { "Yellow" } else { "Green" })
    
    if ($LogFile) {
        Add-Content -Path $LogFile -Value $logMessage
    }
}

function Test-Command {
    param([string]$Command)
    
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Install-DevDependencies {
    Write-QualityLog "Installing development dependencies..." "INFO"
    
    $devDeps = @(
        "black",
        "flake8", 
        "mypy",
        "isort",
        "bandit",
        "safety",
        "pre-commit"
    )
    
    foreach ($dep in $devDeps) {
        if (-not (Test-Command $dep)) {
            Write-QualityLog "Installing $dep..." "INFO"
            pip install $dep
        } else {
            Write-QualityLog "$dep is already installed" "INFO"
        }
    }
}

function Format-Code {
    param([string]$Path)
    
    Write-QualityLog "Formatting code with Black..." "INFO"
    
    if (-not (Test-Command "black")) {
        Write-QualityLog "Black not found. Installing..." "WARNING"
        pip install black
    }
    
    try {
        $blackArgs = @($Path, "--line-length=88", "--target-version=py38")
        
        if ($CheckOnly) {
            $blackArgs += "--check"
            Write-QualityLog "Running Black in check-only mode..." "INFO"
        }
        
        $result = & black @blackArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-QualityLog "Black formatting completed successfully" "INFO"
            return $true
        } else {
            Write-QualityLog "Black formatting failed: $result" "ERROR"
            return $false
        }
    }
    catch {
        Write-QualityLog "Error running Black: $_" "ERROR"
        return $false
    }
}

function Sort-Imports {
    param([string]$Path)
    
    Write-QualityLog "Sorting imports with isort..." "INFO"
    
    if (-not (Test-Command "isort")) {
        Write-QualityLog "isort not found. Installing..." "WARNING"
        pip install isort
    }
    
    try {
        $isortArgs = @($Path, "--profile=black", "--line-length=88")
        
        if ($CheckOnly) {
            $isortArgs += "--check-only"
            Write-QualityLog "Running isort in check-only mode..." "INFO"
        }
        
        $result = & isort @isortArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-QualityLog "Import sorting completed successfully" "INFO"
            return $true
        } else {
            Write-QualityLog "Import sorting failed: $result" "ERROR"
            return $false
        }
    }
    catch {
        Write-QualityLog "Error running isort: $_" "ERROR"
        return $false
    }
}

function Lint-Code {
    param([string]$Path)
    
    Write-QualityLog "Linting code with Flake8..." "INFO"
    
    if (-not (Test-Command "flake8")) {
        Write-QualityLog "Flake8 not found. Installing..." "WARNING"
        pip install flake8
    }
    
    try {
        $flake8Args = @(
            $Path,
            "--max-line-length=88",
            "--extend-ignore=E203,W503",
            "--exclude=.git,__pycache__,.pytest_cache,.mypy_cache,.coverage,htmlcov,dist,build,.eggs,.tox,.venv,venv,env,ENV,env.bak,venv.bak,.env.local"
        )
        
        $result = & flake8 @flake8Args 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-QualityLog "Flake8 linting passed - no issues found" "INFO"
            return $true
        } else {
            Write-QualityLog "Flake8 found issues:" "WARNING"
            Write-Host $result -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-QualityLog "Error running Flake8: $_" "ERROR"
        return $false
    }
}

function Check-Types {
    param([string]$Path)
    
    Write-QualityLog "Checking types with MyPy..." "INFO"
    
    if (-not (Test-Command "mypy")) {
        Write-QualityLog "MyPy not found. Installing..." "WARNING"
        pip install mypy
    }
    
    try {
        $mypyArgs = @(
            $Path,
            "--ignore-missing-imports",
            "--no-strict-optional",
            "--warn-redundant-casts",
            "--warn-unused-ignores",
            "--warn-return-any",
            "--warn-unreachable",
            "--show-error-codes"
        )
        
        $result = & mypy @mypyArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-QualityLog "MyPy type checking passed" "INFO"
            return $true
        } else {
            Write-QualityLog "MyPy found type issues:" "WARNING"
            Write-Host $result -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-QualityLog "Error running MyPy: $_" "ERROR"
        return $false
    }
}

function Check-Security {
    param([string]$Path)
    
    Write-QualityLog "Checking security with Bandit..." "INFO"
    
    if (-not (Test-Command "bandit")) {
        Write-QualityLog "Bandit not found. Installing..." "WARNING"
        pip install bandit
    }
    
    try {
        $banditArgs = @(
            "-r",
            $Path,
            "-f",
            "json",
            "-o",
            "bandit-report.json",
            "--exclude=.git,__pycache__,.pytest_cache,.mypy_cache,.coverage,htmlcov,dist,build,.eggs,.tox,.venv,venv,env,ENV,env.bak,venv.bak,.env.local"
        )
        
        $result = & bandit @banditArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-QualityLog "Bandit security check passed" "INFO"
            return $true
        } else {
            Write-QualityLog "Bandit found security issues:" "WARNING"
            Write-Host $result -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-QualityLog "Error running Bandit: $_" "ERROR"
        return $false
    }
}

function Check-Dependencies {
    Write-QualityLog "Checking dependencies with Safety..." "INFO"
    
    if (-not (Test-Command "safety")) {
        Write-QualityLog "Safety not found. Installing..." "WARNING"
        pip install safety
    }
    
    try {
        $safetyArgs = @(
            "check",
            "--full-report",
            "--output",
            "json",
            "--save",
            "safety-report.json"
        )
        
        $result = & safety @safetyArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-QualityLog "Safety dependency check passed" "INFO"
            return $true
        } else {
            Write-QualityLog "Safety found dependency issues:" "WARNING"
            Write-Host $result -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-QualityLog "Error running Safety: $_" "ERROR"
        return $false
    }
}

function Install-PreCommitHooks {
    Write-QualityLog "Installing pre-commit hooks..." "INFO"
    
    if (-not (Test-Command "pre-commit")) {
        Write-QualityLog "pre-commit not found. Installing..." "WARNING"
        pip install pre-commit
    }
    
    try {
        if (Test-Path ".pre-commit-config.yaml") {
            & pre-commit install
            Write-QualityLog "Pre-commit hooks installed successfully" "INFO"
            return $true
        } else {
            Write-QualityLog ".pre-commit-config.yaml not found" "WARNING"
            return $false
        }
    }
    catch {
        Write-QualityLog "Error installing pre-commit hooks: $_" "ERROR"
        return $false
    }
}

function Run-PreCommit {
    Write-QualityLog "Running pre-commit hooks..." "INFO"
    
    try {
        $result = & pre-commit run --all-files 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-QualityLog "Pre-commit hooks passed" "INFO"
            return $true
        } else {
            Write-QualityLog "Pre-commit hooks failed:" "WARNING"
            Write-Host $result -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-QualityLog "Error running pre-commit hooks: $_" "ERROR"
        return $false
    }
}

function Show-QualityReport {
    Write-QualityLog "=== Code Quality Report ===" "INFO"
    
    $reports = @(
        @{Name="Black Formatting"; File=""; Status="Not Run"},
        @{Name="Import Sorting"; File=""; Status="Not Run"},
        @{Name="Flake8 Linting"; File=""; Status="Not Run"},
        @{Name="MyPy Type Checking"; File=""; Status="Not Run"},
        @{Name="Bandit Security"; File="bandit-report.json"; Status="Not Run"},
        @{Name="Safety Dependencies"; File="safety-report.json"; Status="Not Run"}
    )
    
    foreach ($report in $reports) {
        if ($report.File -and (Test-Path $report.File)) {
            $report.Status = "Completed - Report available"
        }
        
        Write-Host "$($report.Name): $($report.Status)" -ForegroundColor $(if ($report.Status -eq "Completed - Report available") { "Green" } else { "Yellow" })
    }
}

# Main execution
Write-QualityLog "🔧 Starting Code Quality Automation for LearnEnglishBot" "INFO"

# Install dependencies if needed
if ($All -or $Format -or $Lint -or $TypeCheck -or $Security) {
    Install-DevDependencies
}

$successCount = 0
$totalChecks = 0

# Run selected operations
if ($All -or $Format) {
    $totalChecks++
    if (Format-Code -Path $Target) { $successCount++ }
    
    $totalChecks++
    if (Sort-Imports -Path $Target) { $successCount++ }
}

if ($All -or $Lint) {
    $totalChecks++
    if (Lint-Code -Path $Target) { $successCount++ }
}

if ($All -or $TypeCheck) {
    $totalChecks++
    if (Check-Types -Path $Target) { $successCount++ }
}

if ($All -or $Security) {
    $totalChecks++
    if (Check-Security -Path $Target) { $successCount++ }
    
    $totalChecks++
    if (Check-Dependencies) { $successCount++ }
}

# Install and run pre-commit hooks
if ($All) {
    $totalChecks++
    if (Install-PreCommitHooks) { $successCount++ }
    
    $totalChecks++
    if (Run-PreCommit) { $successCount++ }
}

# Show results
Write-QualityLog "=== Summary ===" "INFO"
Write-QualityLog "Completed: $successCount/$totalChecks checks" "INFO"

if ($successCount -eq $totalChecks) {
    Write-QualityLog "🎉 All code quality checks passed!" "INFO"
    Show-QualityReport
    exit 0
} else {
    Write-QualityLog "⚠️  Some checks failed. Please review the issues above." "WARNING"
    Show-QualityReport
    exit 1
}
