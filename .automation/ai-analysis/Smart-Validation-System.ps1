# 🧠 Smart Validation System
# Intelligent validation that skips already validated components

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$ValidationType = "all", # all, code, tests, security, performance
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableCaching = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableIncremental = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$ForceValidation = $false
)

# 🎯 Configuration
$Config = @{
    Version = "1.0.0"
    ValidationTypes = @{
        "code" = @{
            Name = "Code Quality Validation"
            Scripts = @("validate_code.ps1", "lint_check.ps1", "style_check.ps1")
            Dependencies = @("file_hash", "last_modified")
            CacheKey = "code_validation"
        }
        "tests" = @{
            Name = "Test Validation"
            Scripts = @("run_tests.ps1", "test_coverage.ps1", "test_quality.ps1")
            Dependencies = @("test_files", "test_config")
            CacheKey = "test_validation"
        }
        "security" = @{
            Name = "Security Validation"
            Scripts = @("security_scan.ps1", "vulnerability_check.ps1", "compliance_check.ps1")
            Dependencies = @("security_policies", "threat_models")
            CacheKey = "security_validation"
        }
        "performance" = @{
            Name = "Performance Validation"
            Scripts = @("performance_test.ps1", "load_test.ps1", "benchmark.ps1")
            Dependencies = @("performance_baselines", "load_configs")
            CacheKey = "performance_validation"
        }
    }
    CacheDirectory = ".\cache\validation"
    ValidationHistory = ".\logs\validation-history.json"
    SkipConditions = @{
        "NoChanges" = "No changes detected since last validation"
        "RecentValidation" = "Recently validated (within threshold)"
        "DependencyUnchanged" = "Dependencies unchanged"
        "CachedResult" = "Valid cached result available"
    }
    ValidationThresholds = @{
        "RecentValidation" = 3600 # seconds (1 hour)
        "DependencyCheck" = 1800 # seconds (30 minutes)
        "CacheValidity" = 7200 # seconds (2 hours)
    }
}

# 🚀 Main Smart Validation Function
function Start-SmartValidation {
    Write-Host "🧠 Starting Smart Validation System v$($Config.Version)" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    
    # 1. Initialize validation system
    Initialize-ValidationSystem -ProjectPath $ProjectPath
    
    # 2. Analyze project state
    $ProjectState = Analyze-ProjectState -ProjectPath $ProjectPath
    Write-Host "📊 Analyzed project state" -ForegroundColor Green
    
    # 3. Determine validation scope
    $ValidationScope = Determine-ValidationScope -ProjectState $ProjectState -ValidationType $ValidationType
    Write-Host "🎯 Determined validation scope: $($ValidationScope.Count) components" -ForegroundColor Yellow
    
    # 4. Check validation history
    $ValidationHistory = Load-ValidationHistory -ProjectPath $ProjectPath
    
    # 5. Apply smart skipping logic
    $ValidationPlan = Apply-SmartSkipping -ValidationScope $ValidationScope -ValidationHistory $ValidationHistory -ForceValidation $ForceValidation
    Write-Host "🧠 Applied smart skipping: $($ValidationPlan.Skipped) skipped, $($ValidationPlan.Required) required" -ForegroundColor Blue
    
    # 6. Execute validation
    $ValidationResults = Execute-Validation -ValidationPlan $ValidationPlan -ProjectPath $ProjectPath
    
    # 7. Update validation history
    Update-ValidationHistory -ValidationResults $ValidationResults -ProjectPath $ProjectPath
    
    # 8. Generate report
    if ($GenerateReport) {
        $ReportPath = Generate-ValidationReport -ValidationResults $ValidationResults -ValidationPlan $ValidationPlan
        Write-Host "📊 Validation report generated: $ReportPath" -ForegroundColor Green
    }
    
    Write-Host "✅ Smart Validation completed!" -ForegroundColor Green
    return $ValidationResults
}

# 🔧 Initialize Validation System
function Initialize-ValidationSystem {
    param([string]$ProjectPath)
    
    # Create necessary directories
    $Directories = @($Config.CacheDirectory, ".\logs", ".\reports")
    foreach ($Dir in $Directories) {
        $FullPath = Join-Path $ProjectPath $Dir
        if (-not (Test-Path $FullPath)) {
            New-Item -ItemType Directory -Path $FullPath -Force | Out-Null
        }
    }
    
    # Initialize validation history if not exists
    $HistoryPath = Join-Path $ProjectPath $Config.ValidationHistory
    if (-not (Test-Path $HistoryPath)) {
        $InitialHistory = @{
            Version = $Config.Version
            Created = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            Validations = @()
            Statistics = @{
                TotalValidations = 0
                SkippedValidations = 0
                FailedValidations = 0
                AverageDuration = 0
            }
        }
        
        $InitialHistory | ConvertTo-Json -Depth 3 | Out-File -FilePath $HistoryPath -Encoding UTF8
    }
}

# 📊 Analyze Project State
function Analyze-ProjectState {
    param([string]$ProjectPath)
    
    $ProjectState = @{
        Files = @{}
        Dependencies = @{}
        Configuration = @{}
        LastModified = @{}
        FileHashes = @{}
        ValidationTargets = @()
    }
    
    # Analyze files
    $Files = Get-ChildItem -Path $ProjectPath -Recurse -File | Where-Object {
        $_.Extension -match '\.(ps1|py|js|ts|cs|java|go|rs|php|sh)$' -and
        $_.Name -notlike '*test*' -and
        $_.Name -notlike '*example*'
    }
    
    foreach ($File in $Files) {
        $RelativePath = $File.FullName.Replace($ProjectPath, "").TrimStart('\')
        $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue
        
        $ProjectState.Files[$RelativePath] = @{
            Path = $File.FullName
            Size = $File.Length
            LastModified = $File.LastWriteTime
            Hash = if ($Content) { (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($Content)))).Hash } else { "" }
            Dependencies = @()
        }
        
        $ProjectState.LastModified[$RelativePath] = $File.LastWriteTime
        $ProjectState.FileHashes[$RelativePath] = $ProjectState.Files[$RelativePath].Hash
    }
    
    # Analyze dependencies
    foreach ($File in $Files) {
        $RelativePath = $File.FullName.Replace($ProjectPath, "").TrimStart('\')
        $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue
        
        if ($Content) {
            $Dependencies = @()
            
            # Look for script calls
            $ScriptCalls = [regex]::Matches($Content, '\.\\[^"\s]+\.ps1|\.\\[^"\s]+\.psm1')
            foreach ($Call in $ScriptCalls) {
                $CalledScript = $Call.Value.TrimStart('.\')
                $Dependencies += $CalledScript
            }
            
            # Look for module imports
            $ModuleImports = [regex]::Matches($Content, 'Import-Module\s+["\']?([^"\'\s]+)["\']?')
            foreach ($Import in $ModuleImports) {
                $ModuleName = $Import.Groups[1].Value
                $Dependencies += $ModuleName
            }
            
            $ProjectState.Files[$RelativePath].Dependencies = $Dependencies
            $ProjectState.Dependencies[$RelativePath] = $Dependencies
        }
    }
    
    # Determine validation targets
    foreach ($ValidationType in $Config.ValidationTypes.Keys) {
        $ValidationTarget = @{
            Type = $ValidationType
            Name = $Config.ValidationTypes[$ValidationType].Name
            Scripts = $Config.ValidationTypes[$ValidationType].Scripts
            Dependencies = $Config.ValidationTypes[$ValidationType].Dependencies
            CacheKey = $Config.ValidationTypes[$ValidationType].CacheKey
            Files = @()
            Status = "Pending"
        }
        
        # Find files relevant to this validation type
        foreach ($File in $Files) {
            $RelativePath = $File.FullName.Replace($ProjectPath, "").TrimStart('\')
            $ShouldValidate = $false
            
            switch ($ValidationType) {
                "code" {
                    $ShouldValidate = $File.Extension -match '\.(ps1|py|js|ts|cs|java|go|rs|php|sh)$'
                }
                "tests" {
                    $ShouldValidate = $File.Name -like "*test*" -or $File.DirectoryName -like "*test*"
                }
                "security" {
                    $ShouldValidate = $File.Extension -match '\.(ps1|py|js|ts|cs|java|go|rs|php|sh)$'
                }
                "performance" {
                    $ShouldValidate = $File.Name -like "*perf*" -or $File.Name -like "*benchmark*" -or $File.Name -like "*load*"
                }
            }
            
            if ($ShouldValidate) {
                $ValidationTarget.Files += $RelativePath
            }
        }
        
        if ($ValidationTarget.Files.Count -gt 0) {
            $ProjectState.ValidationTargets += $ValidationTarget
        }
    }
    
    return $ProjectState
}

# 🎯 Determine Validation Scope
function Determine-ValidationScope {
    param(
        [hashtable]$ProjectState,
        [string]$ValidationType
    )
    
    $ValidationScope = @()
    
    if ($ValidationType -eq "all") {
        $ValidationScope = $ProjectState.ValidationTargets
    } else {
        $ValidationScope = $ProjectState.ValidationTargets | Where-Object { $_.Type -eq $ValidationType }
    }
    
    return $ValidationScope
}

# 📚 Load Validation History
function Load-ValidationHistory {
    param([string]$ProjectPath)
    
    $HistoryPath = Join-Path $ProjectPath $Config.ValidationHistory
    $ValidationHistory = @{}
    
    if (Test-Path $HistoryPath) {
        $ValidationHistory = Get-Content -Path $HistoryPath -Raw | ConvertFrom-Json
    }
    
    return $ValidationHistory
}

# 🧠 Apply Smart Skipping Logic
function Apply-SmartSkipping {
    param(
        [array]$ValidationScope,
        [hashtable]$ValidationHistory,
        [switch]$ForceValidation
    )
    
    $ValidationPlan = @{
        Required = @()
        Skipped = @()
        SkippedCount = 0
        RequiredCount = 0
        SkipReasons = @{}
    }
    
    foreach ($ValidationTarget in $ValidationScope) {
        $ShouldSkip = $false
        $SkipReason = ""
        
        if (-not $ForceValidation) {
            # Check if recently validated
            $RecentValidation = $ValidationHistory.Validations | Where-Object {
                $_.Type -eq $ValidationTarget.Type -and
                $_.Status -eq "Success" -and
                ([DateTime]::Now - [DateTime]::Parse($_.Timestamp)).TotalSeconds -lt $Config.ValidationThresholds.RecentValidation
            }
            
            if ($RecentValidation) {
                $ShouldSkip = $true
                $SkipReason = $Config.SkipConditions.RecentValidation
            }
            
            # Check if dependencies unchanged
            if (-not $ShouldSkip) {
                $LastValidation = $ValidationHistory.Validations | Where-Object {
                    $_.Type -eq $ValidationTarget.Type -and
                    $_.Status -eq "Success"
                } | Sort-Object Timestamp -Descending | Select-Object -First 1
                
                if ($LastValidation) {
                    $DependenciesUnchanged = $true
                    foreach ($File in $ValidationTarget.Files) {
                        $FileHash = $ProjectState.FileHashes[$File]
                        $LastFileHash = $LastValidation.FileHashes[$File]
                        
                        if ($FileHash -ne $LastFileHash) {
                            $DependenciesUnchanged = $false
                            break
                        }
                    }
                    
                    if ($DependenciesUnchanged) {
                        $ShouldSkip = $true
                        $SkipReason = $Config.SkipConditions.DependencyUnchanged
                    }
                }
            }
            
            # Check cached results
            if (-not $ShouldSkip -and $EnableCaching) {
                $CachedResult = Get-CachedValidationResult -ValidationTarget $ValidationTarget
                if ($CachedResult -and $CachedResult.Valid) {
                    $ShouldSkip = $true
                    $SkipReason = $Config.SkipConditions.CachedResult
                }
            }
        }
        
        if ($ShouldSkip) {
            $ValidationPlan.Skipped += $ValidationTarget
            $ValidationPlan.SkippedCount++
            $ValidationPlan.SkipReasons[$ValidationTarget.Type] = $SkipReason
        } else {
            $ValidationPlan.Required += $ValidationTarget
            $ValidationPlan.RequiredCount++
        }
    }
    
    return $ValidationPlan
}

# 🚀 Execute Validation
function Execute-Validation {
    param(
        [hashtable]$ValidationPlan,
        [string]$ProjectPath
    )
    
    $ValidationResults = @{
        Successful = 0
        Failed = 0
        Skipped = $ValidationPlan.SkippedCount
        TotalTime = 0
        Results = @()
        StartTime = Get-Date
    }
    
    foreach ($ValidationTarget in $ValidationPlan.Required) {
        Write-Host "🔍 Validating: $($ValidationTarget.Name)" -ForegroundColor Yellow
        
        $ValidationResult = @{
            Type = $ValidationTarget.Type
            Name = $ValidationTarget.Name
            StartTime = Get-Date
            Status = "Running"
            Output = ""
            Error = ""
            Duration = 0
            Files = $ValidationTarget.Files
        }
        
        try {
            # Execute validation scripts
            $ValidationOutput = @()
            foreach ($Script in $ValidationTarget.Scripts) {
                $ScriptPath = Join-Path $ProjectPath ".automation\validation\$Script"
                if (Test-Path $ScriptPath) {
                    $ScriptOutput = & $ScriptPath -ProjectPath $ProjectPath -ValidationType $ValidationTarget.Type 2>&1
                    $ValidationOutput += $ScriptOutput
                }
            }
            
            $ValidationResult.Output = $ValidationOutput -join "`n"
            $ValidationResult.Status = "Success"
            $ValidationResults.Successful++
            
            # Cache result if caching enabled
            if ($EnableCaching) {
                Cache-ValidationResult -ValidationTarget $ValidationTarget -Result $ValidationResult
            }
            
            Write-Host "✅ $($ValidationTarget.Name) validation successful" -ForegroundColor Green
        }
        catch {
            $ValidationResult.Status = "Failed"
            $ValidationResult.Error = $_.Exception.Message
            $ValidationResults.Failed++
            
            Write-Host "❌ $($ValidationTarget.Name) validation failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        finally {
            $ValidationResult.EndTime = Get-Date
            $ValidationResult.Duration = ($ValidationResult.EndTime - $ValidationResult.StartTime).TotalSeconds
            $ValidationResults.Results += $ValidationResult
        }
    }
    
    $ValidationResults.EndTime = Get-Date
    $ValidationResults.TotalTime = ($ValidationResults.EndTime - $ValidationResults.StartTime).TotalSeconds
    
    return $ValidationResults
}

# 📚 Update Validation History
function Update-ValidationHistory {
    param(
        [hashtable]$ValidationResults,
        [string]$ProjectPath
    )
    
    $HistoryPath = Join-Path $ProjectPath $Config.ValidationHistory
    $ValidationHistory = @{}
    
    if (Test-Path $HistoryPath) {
        $ValidationHistory = Get-Content -Path $HistoryPath -Raw | ConvertFrom-Json
    }
    
    # Add new validation results
    foreach ($Result in $ValidationResults.Results) {
        $ValidationEntry = @{
            Type = $Result.Type
            Name = $Result.Name
            Status = $Result.Status
            Timestamp = $Result.StartTime.ToString("yyyy-MM-dd HH:mm:ss")
            Duration = $Result.Duration
            Files = $Result.Files
            FileHashes = @{}
        }
        
        # Store file hashes for dependency checking
        foreach ($File in $Result.Files) {
            $FileHash = $ProjectState.FileHashes[$File]
            if ($FileHash) {
                $ValidationEntry.FileHashes[$File] = $FileHash
            }
        }
        
        $ValidationHistory.Validations += $ValidationEntry
    }
    
    # Update statistics
    $ValidationHistory.Statistics.TotalValidations += $ValidationResults.Results.Count
    $ValidationHistory.Statistics.SkippedValidations += $ValidationResults.Skipped
    $ValidationHistory.Statistics.FailedValidations += $ValidationResults.Failed
    
    $TotalDuration = ($ValidationResults.Results | Measure-Object -Property Duration -Sum).Sum
    $ValidationHistory.Statistics.AverageDuration = if ($ValidationResults.Results.Count -gt 0) {
        $TotalDuration / $ValidationResults.Results.Count
    } else { 0 }
    
    $ValidationHistory.LastUpdated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    
    # Keep only last 100 validations
    $ValidationHistory.Validations = $ValidationHistory.Validations | Sort-Object Timestamp -Descending | Select-Object -First 100
    
    $ValidationHistory | ConvertTo-Json -Depth 3 | Out-File -FilePath $HistoryPath -Encoding UTF8
}

# 📊 Generate Validation Report
function Generate-ValidationReport {
    param(
        [hashtable]$ValidationResults,
        [hashtable]$ValidationPlan
    )
    
    $ReportPath = ".\reports\smart-validation-$(Get-Date -Format 'yyyy-MM-dd-HHmm').md"
    $ReportDir = Split-Path -Parent $ReportPath
    
    if (-not (Test-Path $ReportDir)) {
        New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
    }
    
    $Report = @"
# 🧠 Smart Validation Report

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Total Validations**: $($ValidationResults.Results.Count)  
**Successful**: $($ValidationResults.Successful)  
**Failed**: $($ValidationResults.Failed)  
**Skipped**: $($ValidationResults.Skipped)  
**Total Time**: $([Math]::Round($ValidationResults.TotalTime, 2)) seconds

## 📊 Validation Summary

- **Success Rate**: $([Math]::Round(($ValidationResults.Successful / $ValidationResults.Results.Count) * 100, 1))%
- **Skip Rate**: $([Math]::Round(($ValidationResults.Skipped / ($ValidationResults.Results.Count + $ValidationResults.Skipped)) * 100, 1))%
- **Average Duration**: $([Math]::Round(($ValidationResults.Results | Measure-Object -Property Duration -Average).Average, 2)) seconds
- **Time Saved**: $([Math]::Round($ValidationResults.Skipped * 30, 2)) seconds (estimated)

## 🎯 Validation Results

### Successful Validations
"@

    foreach ($Result in ($ValidationResults.Results | Where-Object { $_.Status -eq "Success" })) {
        $Report += "`n- **$($Result.Name)**`n"
        $Report += "  - Type: $($Result.Type)`n"
        $Report += "  - Duration: $([Math]::Round($Result.Duration, 2))s`n"
        $Report += "  - Files: $($Result.Files.Count)`n"
    }

    if (($ValidationResults.Results | Where-Object { $_.Status -eq "Failed" }).Count -gt 0) {
        $Report += @"

### Failed Validations
"@

        foreach ($Result in ($ValidationResults.Results | Where-Object { $_.Status -eq "Failed" })) {
            $Report += "`n- **$($Result.Name)**`n"
            $Report += "  - Type: $($Result.Type)`n"
            $Report += "  - Error: $($Result.Error)`n"
            $Report += "  - Duration: $([Math]::Round($Result.Duration, 2))s`n"
        }
    }

    $Report += @"

### Skipped Validations
"@

    foreach ($Skipped in $ValidationPlan.Skipped) {
        $SkipReason = $ValidationPlan.SkipReasons[$Skipped.Type]
        $Report += "`n- **$($Skipped.Name)**`n"
        $Report += "  - Type: $($Skipped.Type)`n"
        $Report += "  - Reason: $SkipReason`n"
        $Report += "  - Files: $($Skipped.Files.Count)`n"
    }

    $Report += @"

## 🧠 Smart Skipping Analysis

### Skip Reasons
"@

    foreach ($Reason in $ValidationPlan.SkipReasons.Keys) {
        $Count = ($ValidationPlan.Skipped | Where-Object { $_.Type -eq $Reason }).Count
        $Report += "`n- **$Reason**: $Count validations`n"
    }

    $Report += @"

## 🎯 Recommendations

1. **Optimization**: Review failed validations and fix issues
2. **Caching**: Enable caching for better performance
3. **Scheduling**: Set up regular validation schedules
4. **Monitoring**: Monitor validation patterns and adjust thresholds
5. **Dependencies**: Keep dependency tracking up to date

## 📈 Next Steps

1. Fix failed validations
2. Review skip reasons and adjust thresholds
3. Optimize validation scripts
4. Set up continuous validation
5. Monitor validation performance

---
*Generated by Smart Validation System v$($Config.Version)*
"@

    $Report | Out-File -FilePath $ReportPath -Encoding UTF8
    return $ReportPath
}

# 🛠️ Helper Functions
function Get-CachedValidationResult {
    param([hashtable]$ValidationTarget)
    
    $CachePath = Join-Path $Config.CacheDirectory "$($ValidationTarget.CacheKey).json"
    if (Test-Path $CachePath) {
        $CachedResult = Get-Content -Path $CachePath -Raw | ConvertFrom-Json
        $CacheAge = ([DateTime]::Now - [DateTime]::Parse($CachedResult.Timestamp)).TotalSeconds
        
        if ($CacheAge -lt $Config.ValidationThresholds.CacheValidity) {
            return $CachedResult
        }
    }
    
    return $null
}

function Cache-ValidationResult {
    param(
        [hashtable]$ValidationTarget,
        [hashtable]$Result
    )
    
    $CachePath = Join-Path $Config.CacheDirectory "$($ValidationTarget.CacheKey).json"
    $CachedResult = @{
        Type = $ValidationTarget.Type
        Timestamp = $Result.StartTime.ToString("yyyy-MM-dd HH:mm:ss")
        Valid = $Result.Status -eq "Success"
        Duration = $Result.Duration
        Files = $Result.Files
    }
    
    $CachedResult | ConvertTo-Json -Depth 3 | Out-File -FilePath $CachePath -Encoding UTF8
}

# 🚀 Execute Smart Validation
if ($MyInvocation.InvocationName -ne '.') {
    Start-SmartValidation
}
