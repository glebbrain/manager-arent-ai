# ⚡ Parallel Execution Manager
# Optimized parallel execution of PowerShell scripts with intelligent load balancing

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$ScriptPattern = "*.ps1",
    
    [Parameter(Mandatory=$false)]
    [int]$MaxConcurrency = 0, # 0 = auto-detect
    
    [Parameter(Mandatory=$false)]
    [int]$MaxMemoryPerJob = 512, # MB
    
    [Parameter(Mandatory=$false)]
    [int]$TimeoutMinutes = 30,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableCaching = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableRetry = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

# 🎯 Configuration
$Config = @{
    Version = "1.0.0"
    MaxConcurrency = if ($MaxConcurrency -eq 0) { [Environment]::ProcessorCount } else { $MaxConcurrency }
    MaxMemoryPerJob = $MaxMemoryPerJob * 1MB
    TimeoutMinutes = $TimeoutMinutes
    CacheDirectory = ".\cache"
    LogDirectory = ".\logs"
    ReportDirectory = ".\reports"
    RetryAttempts = 3
    RetryDelaySeconds = 5
    ScriptCategories = @{
        "validation" = @("validate_", "check_", "verify_")
        "testing" = @("test_", "run_tests", "unit_test")
        "build" = @("build_", "compile_", "package_")
        "deployment" = @("deploy_", "install_", "setup_")
        "analysis" = @("analyze_", "scan_", "audit_")
        "ai" = @("ai-", "intelligent-", "smart-")
    }
    ExecutionOrder = @("validation", "testing", "build", "deployment", "analysis", "ai")
}

# 🚀 Main Parallel Execution Function
function Start-ParallelExecution {
    Write-Host "⚡ Starting Parallel Execution Manager v$($Config.Version)" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    
    # 1. Discover scripts
    $Scripts = Discover-Scripts -ProjectPath $ProjectPath -Pattern $ScriptPattern
    Write-Host "📁 Found $($Scripts.Count) scripts to execute" -ForegroundColor Green
    
    # 2. Categorize scripts
    $CategorizedScripts = Categorize-Scripts -Scripts $Scripts
    Write-Host "📊 Categorized scripts by type and priority" -ForegroundColor Yellow
    
    # 3. Analyze dependencies
    $Dependencies = Analyze-ScriptDependencies -Scripts $Scripts
    Write-Host "🔗 Analyzed script dependencies" -ForegroundColor Blue
    
    # 4. Create execution plan
    $ExecutionPlan = Create-ExecutionPlan -CategorizedScripts $CategorizedScripts -Dependencies $Dependencies
    Write-Host "📋 Created optimized execution plan" -ForegroundColor Magenta
    
    # 5. Execute scripts in parallel
    if (-not $DryRun) {
        $ExecutionResults = Execute-ScriptsInParallel -ExecutionPlan $ExecutionPlan
        Write-Host "🚀 Parallel execution completed" -ForegroundColor Green
    } else {
        Write-Host "🔍 Dry run mode - no scripts executed" -ForegroundColor Blue
        $ExecutionResults = @{
            Successful = 0
            Failed = 0
            Skipped = 0
            TotalTime = 0
            Results = @()
        }
    }
    
    # 6. Generate execution report
    if ($GenerateReport) {
        $ReportPath = Generate-ExecutionReport -Scripts $Scripts -ExecutionPlan $ExecutionPlan -Results $ExecutionResults
        Write-Host "📊 Execution report generated: $ReportPath" -ForegroundColor Green
    }
    
    Write-Host "✅ Parallel Execution Manager completed!" -ForegroundColor Green
    return $ExecutionResults
}

# 📁 Discover Scripts
function Discover-Scripts {
    param(
        [string]$ProjectPath,
        [string]$Pattern
    )
    
    $Scripts = @()
    $SearchPaths = @(
        Join-Path $ProjectPath ".automation"
        Join-Path $ProjectPath "scripts"
        Join-Path $ProjectPath "tools"
        $ProjectPath
    )
    
    foreach ($SearchPath in $SearchPaths) {
        if (Test-Path $SearchPath) {
            $FoundScripts = Get-ChildItem -Path $SearchPath -Recurse -Include $Pattern | Where-Object {
                $_.Extension -eq ".ps1" -and $_.Name -notlike "*test*" -and $_.Name -notlike "*example*"
            }
            
            foreach ($Script in $FoundScripts) {
                $Scripts += @{
                    Path = $Script.FullName
                    Name = $Script.Name
                    Directory = $Script.DirectoryName
                    Size = $Script.Length
                    LastModified = $Script.LastWriteTime
                    Category = "unknown"
                    Priority = 5
                    Dependencies = @()
                    EstimatedDuration = 0
                    MemoryUsage = 0
                }
            }
        }
    }
    
    return $Scripts
}

# 📊 Categorize Scripts
function Categorize-Scripts {
    param([array]$Scripts)
    
    $Categorized = @{}
    
    foreach ($Category in $Config.ScriptCategories.Keys) {
        $Categorized[$Category] = @()
    }
    
    foreach ($Script in $Scripts) {
        $Category = "unknown"
        $Priority = 5
        
        # Determine category based on name patterns
        foreach ($Cat in $Config.ScriptCategories.Keys) {
            $Patterns = $Config.ScriptCategories[$Cat]
            foreach ($Pattern in $Patterns) {
                if ($Script.Name -like "*$Pattern*") {
                    $Category = $Cat
                    break
                }
            }
            if ($Category -ne "unknown") { break }
        }
        
        # Determine priority based on category
        $Priority = switch ($Category) {
            "validation" { 1 }
            "testing" { 2 }
            "build" { 3 }
            "deployment" { 4 }
            "analysis" { 5 }
            "ai" { 6 }
            default { 7 }
        }
        
        $Script.Category = $Category
        $Script.Priority = $Priority
        
        # Estimate duration and memory usage
        $Script.EstimatedDuration = Estimate-ScriptDuration -Script $Script
        $Script.MemoryUsage = Estimate-ScriptMemory -Script $Script
        
        $Categorized[$Category] += $Script
    }
    
    # Sort each category by priority
    foreach ($Category in $Categorized.Keys) {
        $Categorized[$Category] = $Categorized[$Category] | Sort-Object Priority, EstimatedDuration
    }
    
    return $Categorized
}

# 🔗 Analyze Script Dependencies
function Analyze-ScriptDependencies {
    param([array]$Scripts)
    
    $Dependencies = @{}
    
    foreach ($Script in $Scripts) {
        $ScriptDependencies = @()
        $Content = Get-Content -Path $Script.Path -Raw -ErrorAction SilentlyContinue
        
        if ($Content) {
            # Look for script calls
            $ScriptCalls = [regex]::Matches($Content, '\.\\[^"\s]+\.ps1|\.\\[^"\s]+\.psm1')
            foreach ($Call in $ScriptCalls) {
                $CalledScript = $Call.Value.TrimStart('.\')
                $ScriptDependencies += $CalledScript
            }
            
            # Look for module imports
            $ModuleImports = [regex]::Matches($Content, 'Import-Module\s+["\']?([^"\'\s]+)["\']?')
            foreach ($Import in $ModuleImports) {
                $ModuleName = $Import.Groups[1].Value
                $ScriptDependencies += $ModuleName
            }
        }
        
        $Dependencies[$Script.Name] = $ScriptDependencies
        $Script.Dependencies = $ScriptDependencies
    }
    
    return $Dependencies
}

# 📋 Create Execution Plan
function Create-ExecutionPlan {
    param(
        [hashtable]$CategorizedScripts,
        [hashtable]$Dependencies
    )
    
    $ExecutionPlan = @{
        Phases = @()
        TotalScripts = 0
        EstimatedDuration = 0
        MaxConcurrency = $Config.MaxConcurrency
    }
    
    # Create phases based on execution order
    foreach ($PhaseName in $Config.ExecutionOrder) {
        if ($CategorizedScripts.ContainsKey($PhaseName) -and $CategorizedScripts[$PhaseName].Count -gt 0) {
            $Phase = @{
                Name = $PhaseName
                Scripts = $CategorizedScripts[$PhaseName]
                Concurrency = Calculate-PhaseConcurrency -Scripts $CategorizedScripts[$PhaseName]
                EstimatedDuration = ($CategorizedScripts[$PhaseName] | Measure-Object -Property EstimatedDuration -Sum).Sum
                Dependencies = @()
            }
            
            $ExecutionPlan.Phases += $Phase
            $ExecutionPlan.TotalScripts += $Phase.Scripts.Count
            $ExecutionPlan.EstimatedDuration += $Phase.EstimatedDuration
        }
    }
    
    # Add unknown category scripts to the end
    if ($CategorizedScripts.ContainsKey("unknown") -and $CategorizedScripts["unknown"].Count -gt 0) {
        $Phase = @{
            Name = "unknown"
            Scripts = $CategorizedScripts["unknown"]
            Concurrency = Calculate-PhaseConcurrency -Scripts $CategorizedScripts["unknown"]
            EstimatedDuration = ($CategorizedScripts["unknown"] | Measure-Object -Property EstimatedDuration -Sum).Sum
            Dependencies = @()
        }
        
        $ExecutionPlan.Phases += $Phase
        $ExecutionPlan.TotalScripts += $Phase.Scripts.Count
        $ExecutionPlan.EstimatedDuration += $Phase.EstimatedDuration
    }
    
    return $ExecutionPlan
}

# ⚡ Execute Scripts in Parallel
function Execute-ScriptsInParallel {
    param([hashtable]$ExecutionPlan)
    
    $Results = @{
        Successful = 0
        Failed = 0
        Skipped = 0
        TotalTime = 0
        Results = @()
        StartTime = Get-Date
    }
    
    # Create necessary directories
    Create-ExecutionDirectories
    
    foreach ($Phase in $ExecutionPlan.Phases) {
        Write-Host "`n🚀 Executing phase: $($Phase.Name)" -ForegroundColor Yellow
        Write-Host "Scripts: $($Phase.Scripts.Count), Concurrency: $($Phase.Concurrency)" -ForegroundColor Gray
        
        $PhaseResults = Execute-PhaseInParallel -Phase $Phase
        $Results.Results += $PhaseResults
        $Results.Successful += ($PhaseResults | Where-Object { $_.Status -eq "Success" }).Count
        $Results.Failed += ($PhaseResults | Where-Object { $_.Status -eq "Failed" }).Count
        $Results.Skipped += ($PhaseResults | Where-Object { $_.Status -eq "Skipped" }).Count
    }
    
    $Results.EndTime = Get-Date
    $Results.TotalTime = ($Results.EndTime - $Results.StartTime).TotalSeconds
    
    return $Results
}

# 🔄 Execute Phase in Parallel
function Execute-PhaseInParallel {
    param([hashtable]$Phase)
    
    $Results = @()
    $Jobs = @()
    $MaxJobs = $Phase.Concurrency
    
    foreach ($Script in $Phase.Scripts) {
        # Wait for available job slot
        while ($Jobs.Count -ge $MaxJobs) {
            $CompletedJobs = $Jobs | Where-Object { $_.State -eq "Completed" -or $_.State -eq "Failed" }
            foreach ($Job in $CompletedJobs) {
                $Jobs = $Jobs | Where-Object { $_.Id -ne $Job.Id }
            }
            Start-Sleep -Milliseconds 100
        }
        
        # Start new job
        $Job = Start-Job -ScriptBlock {
            param($ScriptPath, $ScriptName, $TimeoutMinutes, $MaxMemoryPerJob)
            
            $JobResult = @{
                Name = $ScriptName
                Path = $ScriptPath
                StartTime = Get-Date
                Status = "Running"
                Output = ""
                Error = ""
                ExitCode = 0
                Duration = 0
                MemoryUsage = 0
            }
            
            try {
                # Set up job timeout
                $Timeout = [TimeSpan]::FromMinutes($TimeoutMinutes)
                $JobTimer = [System.Diagnostics.Stopwatch]::StartNew()
                
                # Execute script
                $Output = & $ScriptPath 2>&1
                $JobResult.Output = $Output -join "`n"
                $JobResult.ExitCode = $LASTEXITCODE
                
                if ($JobTimer.Elapsed -gt $Timeout) {
                    $JobResult.Status = "Timeout"
                    $JobResult.Error = "Script execution timed out after $TimeoutMinutes minutes"
                } elseif ($JobResult.ExitCode -eq 0) {
                    $JobResult.Status = "Success"
                } else {
                    $JobResult.Status = "Failed"
                    $JobResult.Error = "Script exited with code $($JobResult.ExitCode)"
                }
            }
            catch {
                $JobResult.Status = "Failed"
                $JobResult.Error = $_.Exception.Message
            }
            finally {
                $JobTimer.Stop()
                $JobResult.Duration = $JobTimer.Elapsed.TotalSeconds
                $JobResult.EndTime = Get-Date
            }
            
            return $JobResult
        } -ArgumentList $Script.Path, $Script.Name, $Config.TimeoutMinutes, $Config.MaxMemoryPerJob
        
        $Jobs += $Job
        Write-Host "  ▶️ Started: $($Script.Name)" -ForegroundColor Green
    }
    
    # Wait for all jobs to complete
    $Jobs | Wait-Job | Out-Null
    
    # Collect results
    foreach ($Job in $Jobs) {
        $JobResult = Receive-Job -Job $Job
        $Results += $JobResult
        
        $StatusColor = switch ($JobResult.Status) {
            "Success" { "Green" }
            "Failed" { "Red" }
            "Timeout" { "Yellow" }
            default { "Gray" }
        }
        
        Write-Host "  $($JobResult.Status): $($JobResult.Name) ($([Math]::Round($JobResult.Duration, 2))s)" -ForegroundColor $StatusColor
        
        Remove-Job -Job $Job
    }
    
    return $Results
}

# 📊 Generate Execution Report
function Generate-ExecutionReport {
    param(
        [array]$Scripts,
        [hashtable]$ExecutionPlan,
        [hashtable]$Results
    )
    
    $ReportPath = Join-Path $Config.ReportDirectory "parallel-execution-$(Get-Date -Format 'yyyy-MM-dd-HHmm').md"
    
    $Report = @"
# ⚡ Parallel Execution Report

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Total Scripts**: $($Results.TotalScripts)  
**Successful**: $($Results.Successful)  
**Failed**: $($Results.Failed)  
**Skipped**: $($Results.Skipped)  
**Total Time**: $([Math]::Round($Results.TotalTime, 2)) seconds

## 📊 Execution Summary

- **Success Rate**: $([Math]::Round(($Results.Successful / $Results.TotalScripts) * 100, 1))%
- **Average Time per Script**: $([Math]::Round($Results.TotalTime / $Results.TotalScripts, 2)) seconds
- **Max Concurrency**: $($ExecutionPlan.MaxConcurrency)
- **Estimated Duration**: $([Math]::Round($ExecutionPlan.EstimatedDuration, 2)) seconds

## 🚀 Execution Phases

"@

    foreach ($Phase in $ExecutionPlan.Phases) {
        $PhaseResults = $Results.Results | Where-Object { $_.Phase -eq $Phase.Name }
        $PhaseSuccess = ($PhaseResults | Where-Object { $_.Status -eq "Success" }).Count
        $PhaseFailed = ($PhaseResults | Where-Object { $_.Status -eq "Failed" }).Count
        
        $Report += "`n### $($Phase.Name) Phase`n"
        $Report += "- **Scripts**: $($Phase.Scripts.Count)`n"
        $Report += "- **Concurrency**: $($Phase.Concurrency)`n"
        $Report += "- **Successful**: $PhaseSuccess`n"
        $Report += "- **Failed**: $PhaseFailed`n"
        $Report += "- **Estimated Duration**: $([Math]::Round($Phase.EstimatedDuration, 2))s`n"
    }

    $Report += @"

## 📋 Detailed Results

### Successful Scripts
"@

    foreach ($Result in ($Results.Results | Where-Object { $_.Status -eq "Success" })) {
        $Report += "`n- **$($Result.Name)**`n"
        $Report += "  - Duration: $([Math]::Round($Result.Duration, 2))s`n"
        $Report += "  - Path: $($Result.Path)`n"
    }

    if (($Results.Results | Where-Object { $_.Status -eq "Failed" }).Count -gt 0) {
        $Report += @"

### Failed Scripts
"@

        foreach ($Result in ($Results.Results | Where-Object { $_.Status -eq "Failed" })) {
            $Report += "`n- **$($Result.Name)**`n"
            $Report += "  - Error: $($Result.Error)`n"
            $Report += "  - Duration: $([Math]::Round($Result.Duration, 2))s`n"
            $Report += "  - Path: $($Result.Path)`n"
        }
    }

    $Report += @"

## 🎯 Performance Analysis

### Execution Efficiency
- **Parallel Efficiency**: $([Math]::Round(($ExecutionPlan.EstimatedDuration / $Results.TotalTime) * 100, 1))%
- **Time Saved**: $([Math]::Round($ExecutionPlan.EstimatedDuration - $Results.TotalTime, 2)) seconds
- **Speed Improvement**: $([Math]::Round($ExecutionPlan.EstimatedDuration / $Results.TotalTime, 2))x

### Resource Utilization
- **Max Concurrency Used**: $($ExecutionPlan.MaxConcurrency)
- **Average Memory per Job**: $([Math]::Round(($Results.Results | Measure-Object -Property MemoryUsage -Average).Average, 2)) MB
- **Total Memory Peak**: $([Math]::Round(($Results.Results | Measure-Object -Property MemoryUsage -Sum).Sum, 2)) MB

## 🔧 Recommendations

1. **Optimization**: Review failed scripts and optimize slow ones
2. **Concurrency**: Adjust max concurrency based on system resources
3. **Caching**: Enable caching for frequently executed scripts
4. **Monitoring**: Set up monitoring for long-running scripts
5. **Retry Logic**: Implement retry logic for transient failures

## 📈 Next Steps

1. Review and fix failed scripts
2. Optimize script performance
3. Adjust concurrency settings
4. Implement caching system
5. Set up continuous monitoring

---
*Generated by Parallel Execution Manager v$($Config.Version)*
"@

    $Report | Out-File -FilePath $ReportPath -Encoding UTF8
    return $ReportPath
}

# 🛠️ Helper Functions
function Estimate-ScriptDuration {
    param([hashtable]$Script)
    
    # Simple estimation based on file size and complexity
    $BaseDuration = 5 # seconds
    $SizeFactor = $Script.Size / 1KB
    $ComplexityFactor = if ($Script.Name -like "*ai-*" -or $Script.Name -like "*intelligent-*") { 3 } else { 1 }
    
    return [Math]::Max($BaseDuration, $SizeFactor * $ComplexityFactor)
}

function Estimate-ScriptMemory {
    param([hashtable]$Script)
    
    # Simple estimation based on file size
    $BaseMemory = 64 # MB
    $SizeFactor = $Script.Size / 1MB
    
    return [Math]::Max($BaseMemory, $BaseMemory + ($SizeFactor * 32))
}

function Calculate-PhaseConcurrency {
    param([array]$Scripts)
    
    $TotalMemory = ($Scripts | Measure-Object -Property MemoryUsage -Sum).Sum
    $MaxConcurrency = [Math]::Min($Config.MaxConcurrency, [Math]::Floor(2GB / $TotalMemory))
    
    return [Math]::Max(1, $MaxConcurrency)
}

function Create-ExecutionDirectories {
    $Directories = @($Config.CacheDirectory, $Config.LogDirectory, $Config.ReportDirectory)
    
    foreach ($Dir in $Directories) {
        if (-not (Test-Path $Dir)) {
            New-Item -ItemType Directory -Path $Dir -Force | Out-Null
        }
    }
}

# 🚀 Execute Parallel Execution
if ($MyInvocation.InvocationName -ne '.') {
    Start-ParallelExecution
}
