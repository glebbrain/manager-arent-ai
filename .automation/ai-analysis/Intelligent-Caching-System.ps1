# 🗄️ Intelligent Caching System
# Smart caching system for accelerating repeated operations

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$CacheDirectory = ".\cache",
    
    [Parameter(Mandatory=$false)]
    [int]$MaxCacheSize = 1024, # MB
    
    [Parameter(Mandatory=$false)]
    [int]$CacheExpiryDays = 7,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableCompression = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableEncryption = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport = $true,
    
    [Parameter(Mandatory=$false)]
    [string]$Action = "help" # help, setup, clean, analyze, optimize
)

# 🎯 Configuration
$Config = @{
    Version = "1.0.0"
    CacheDirectory = $CacheDirectory
    MaxCacheSize = $MaxCacheSize * 1MB
    CacheExpiryDays = $CacheExpiryDays
    EnableCompression = $EnableCompression
    EnableEncryption = $EnableEncryption
    CompressionLevel = "Optimal"
    CacheTypes = @{
        "script_results" = "Script execution results"
        "file_analysis" = "File analysis results"
        "ai_responses" = "AI API responses"
        "build_artifacts" = "Build artifacts and outputs"
        "test_results" = "Test execution results"
        "validation_results" = "Validation results"
        "dependencies" = "Dependency analysis results"
        "metrics" = "Performance metrics"
    }
    CachePolicies = @{
        "script_results" = @{
            ExpiryDays = 3
            Compression = $true
            Encryption = $false
            Priority = "High"
        }
        "ai_responses" = @{
            ExpiryDays = 1
            Compression = $true
            Encryption = $true
            Priority = "High"
        }
        "build_artifacts" = @{
            ExpiryDays = 7
            Compression = $true
            Encryption = $false
            Priority = "Medium"
        }
        "test_results" = @{
            ExpiryDays = 2
            Compression = $true
            Encryption = $false
            Priority = "Medium"
        }
        "validation_results" = @{
            ExpiryDays = 1
            Compression = $true
            Encryption = $false
            Priority = "High"
        }
    }
}

# 🚀 Main Caching Function
function Start-IntelligentCaching {
    Write-Host "🗄️ Starting Intelligent Caching System v$($Config.Version)" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    
    switch ($Action.ToLower()) {
        "help" {
            Show-CachingHelp
        }
        "setup" {
            Setup-CachingSystem -ProjectPath $ProjectPath
        }
        "clean" {
            Clean-Cache -ProjectPath $ProjectPath
        }
        "analyze" {
            Analyze-CacheUsage -ProjectPath $ProjectPath
        }
        "optimize" {
            Optimize-Cache -ProjectPath $ProjectPath
        }
        "status" {
            Show-CacheStatus -ProjectPath $ProjectPath
        }
        default {
            Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
            Show-CachingHelp
        }
    }
}

# 📋 Show Caching Help
function Show-CachingHelp {
    Write-Host "`n🎯 Available Actions:" -ForegroundColor Yellow
    Write-Host "===================" -ForegroundColor Yellow
    
    Write-Host "`n🔹 SETUP" -ForegroundColor Green
    Write-Host "   Name: Setup Caching System" -ForegroundColor White
    Write-Host "   Description: Initialize caching system and directories" -ForegroundColor Gray
    
    Write-Host "`n🔹 CLEAN" -ForegroundColor Green
    Write-Host "   Name: Clean Cache" -ForegroundColor White
    Write-Host "   Description: Remove expired and unnecessary cache entries" -ForegroundColor Gray
    
    Write-Host "`n🔹 ANALYZE" -ForegroundColor Green
    Write-Host "   Name: Analyze Cache Usage" -ForegroundColor White
    Write-Host "   Description: Analyze cache usage patterns and efficiency" -ForegroundColor Gray
    
    Write-Host "`n🔹 OPTIMIZE" -ForegroundColor Green
    Write-Host "   Name: Optimize Cache" -ForegroundColor White
    Write-Host "   Description: Optimize cache performance and storage" -ForegroundColor Gray
    
    Write-Host "`n🔹 STATUS" -ForegroundColor Green
    Write-Host "   Name: Cache Status" -ForegroundColor White
    Write-Host "   Description: Show current cache status and statistics" -ForegroundColor Gray
    
    Write-Host "`n📖 Usage Examples:" -ForegroundColor Yellow
    Write-Host "==================" -ForegroundColor Yellow
    Write-Host "`n# Setup caching system" -ForegroundColor White
    Write-Host ".\Intelligent-Caching-System.ps1 -Action setup -ProjectPath ." -ForegroundColor Gray
    
    Write-Host "`n# Clean expired cache" -ForegroundColor White
    Write-Host ".\Intelligent-Caching-System.ps1 -Action clean -ProjectPath ." -ForegroundColor Gray
    
    Write-Host "`n# Analyze cache usage" -ForegroundColor White
    Write-Host ".\Intelligent-Caching-System.ps1 -Action analyze -ProjectPath ." -ForegroundColor Gray
    
    Write-Host "`n# Optimize cache" -ForegroundColor White
    Write-Host ".\Intelligent-Caching-System.ps1 -Action optimize -ProjectPath ." -ForegroundColor Gray
}

# 🔧 Setup Caching System
function Setup-CachingSystem {
    param([string]$ProjectPath)
    
    Write-Host "`n🔧 Setting up Intelligent Caching System..." -ForegroundColor Cyan
    
    # Create cache directory structure
    $CacheDir = Join-Path $ProjectPath $Config.CacheDirectory
    if (-not (Test-Path $CacheDir)) {
        New-Item -ItemType Directory -Path $CacheDir -Force | Out-Null
        Write-Host "📁 Created cache directory: $CacheDir" -ForegroundColor Green
    }
    
    # Create subdirectories for each cache type
    foreach ($CacheType in $Config.CacheTypes.Keys) {
        $TypeDir = Join-Path $CacheDir $CacheType
        if (-not (Test-Path $TypeDir)) {
            New-Item -ItemType Directory -Path $TypeDir -Force | Out-Null
            Write-Host "📁 Created cache type directory: $CacheType" -ForegroundColor Green
        }
    }
    
    # Create cache configuration file
    $ConfigPath = Join-Path $CacheDir "cache-config.json"
    $CacheConfig = @{
        Version = $Config.Version
        Created = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        MaxCacheSize = $Config.MaxCacheSize
        CacheExpiryDays = $Config.CacheExpiryDays
        EnableCompression = $Config.EnableCompression
        EnableEncryption = $Config.EnableEncryption
        CacheTypes = $Config.CacheTypes
        CachePolicies = $Config.CachePolicies
    }
    
    $CacheConfig | ConvertTo-Json -Depth 3 | Out-File -FilePath $ConfigPath -Encoding UTF8
    Write-Host "⚙️ Created cache configuration: $ConfigPath" -ForegroundColor Green
    
    # Create cache index
    $IndexPath = Join-Path $CacheDir "cache-index.json"
    $CacheIndex = @{
        Entries = @()
        Statistics = @{
            TotalEntries = 0
            TotalSize = 0
            LastUpdated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        }
    }
    
    $CacheIndex | ConvertTo-Json -Depth 3 | Out-File -FilePath $IndexPath -Encoding UTF8
    Write-Host "📋 Created cache index: $IndexPath" -ForegroundColor Green
    
    Write-Host "✅ Caching system setup completed!" -ForegroundColor Green
}

# 🧹 Clean Cache
function Clean-Cache {
    param([string]$ProjectPath)
    
    Write-Host "`n🧹 Cleaning cache..." -ForegroundColor Cyan
    
    $CacheDir = Join-Path $ProjectPath $Config.CacheDirectory
    if (-not (Test-Path $CacheDir)) {
        Write-Host "❌ Cache directory not found: $CacheDir" -ForegroundColor Red
        return
    }
    
    $CleanedEntries = 0
    $FreedSpace = 0
    $CurrentTime = Get-Date
    
    # Load cache index
    $IndexPath = Join-Path $CacheDir "cache-index.json"
    $CacheIndex = @{}
    
    if (Test-Path $IndexPath) {
        $CacheIndex = Get-Content -Path $IndexPath -Raw | ConvertFrom-Json
    }
    
    # Clean expired entries
    foreach ($Entry in $CacheIndex.Entries) {
        $EntryPath = Join-Path $CacheDir $Entry.Path
        $EntryTime = [DateTime]::Parse($Entry.Created)
        $ExpiryDays = $Config.CachePolicies[$Entry.Type].ExpiryDays
        
        if ($CurrentTime -gt $EntryTime.AddDays($ExpiryDays)) {
            if (Test-Path $EntryPath) {
                $EntrySize = (Get-Item $EntryPath).Length
                Remove-Item -Path $EntryPath -Force
                $CleanedEntries++
                $FreedSpace += $EntrySize
                Write-Host "🗑️ Removed expired entry: $($Entry.Key)" -ForegroundColor Yellow
            }
        }
    }
    
    # Clean oversized cache
    $TotalSize = (Get-ChildItem -Path $CacheDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
    if ($TotalSize -gt $Config.MaxCacheSize) {
        $EntriesToRemove = $CacheIndex.Entries | Sort-Object LastAccessed | Select-Object -First 10
        foreach ($Entry in $EntriesToRemove) {
            $EntryPath = Join-Path $CacheDir $Entry.Path
            if (Test-Path $EntryPath) {
                $EntrySize = (Get-Item $EntryPath).Length
                Remove-Item -Path $EntryPath -Force
                $CleanedEntries++
                $FreedSpace += $EntrySize
                Write-Host "🗑️ Removed old entry: $($Entry.Key)" -ForegroundColor Yellow
            }
        }
    }
    
    # Update cache index
    $CacheIndex.Entries = $CacheIndex.Entries | Where-Object { Test-Path (Join-Path $CacheDir $_.Path) }
    $CacheIndex.Statistics.TotalEntries = $CacheIndex.Entries.Count
    $CacheIndex.Statistics.TotalSize = (Get-ChildItem -Path $CacheDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $CacheIndex.Statistics.LastUpdated = $CurrentTime.ToString("yyyy-MM-dd HH:mm:ss")
    
    $CacheIndex | ConvertTo-Json -Depth 3 | Out-File -FilePath $IndexPath -Encoding UTF8
    
    Write-Host "✅ Cache cleaning completed!" -ForegroundColor Green
    Write-Host "📊 Cleaned entries: $CleanedEntries" -ForegroundColor Blue
    Write-Host "💾 Freed space: $([Math]::Round($FreedSpace / 1MB, 2)) MB" -ForegroundColor Blue
}

# 📊 Analyze Cache Usage
function Analyze-CacheUsage {
    param([string]$ProjectPath)
    
    Write-Host "`n📊 Analyzing cache usage..." -ForegroundColor Cyan
    
    $CacheDir = Join-Path $ProjectPath $Config.CacheDirectory
    if (-not (Test-Path $CacheDir)) {
        Write-Host "❌ Cache directory not found: $CacheDir" -ForegroundColor Red
        return
    }
    
    $Analysis = @{
        TotalEntries = 0
        TotalSize = 0
        ByType = @{}
        ByAge = @{}
        HitRate = 0
        Efficiency = 0
        Recommendations = @()
    }
    
    # Load cache index
    $IndexPath = Join-Path $CacheDir "cache-index.json"
    $CacheIndex = @{}
    
    if (Test-Path $IndexPath) {
        $CacheIndex = Get-Content -Path $IndexPath -Raw | ConvertFrom-Json
    }
    
    # Analyze entries
    foreach ($Entry in $CacheIndex.Entries) {
        $EntryPath = Join-Path $CacheDir $Entry.Path
        if (Test-Path $EntryPath) {
            $EntrySize = (Get-Item $EntryPath).Length
            $Analysis.TotalEntries++
            $Analysis.TotalSize += $EntrySize
            
            # By type
            if (-not $Analysis.ByType.ContainsKey($Entry.Type)) {
                $Analysis.ByType[$Entry.Type] = @{
                    Count = 0
                    Size = 0
                    HitRate = 0
                }
            }
            $Analysis.ByType[$Entry.Type].Count++
            $Analysis.ByType[$Entry.Type].Size += $EntrySize
            $Analysis.ByType[$Entry.Type].HitRate += $Entry.HitCount
            
            # By age
            $EntryAge = ([DateTime]::Now - [DateTime]::Parse($Entry.Created)).Days
            $AgeGroup = if ($EntryAge -lt 1) { "Today" } elseif ($EntryAge -lt 7) { "This Week" } elseif ($EntryAge -lt 30) { "This Month" } else { "Older" }
            
            if (-not $Analysis.ByAge.ContainsKey($AgeGroup)) {
                $Analysis.ByAge[$AgeGroup] = @{
                    Count = 0
                    Size = 0
                }
            }
            $Analysis.ByAge[$AgeGroup].Count++
            $Analysis.ByAge[$AgeGroup].Size += $EntrySize
        }
    }
    
    # Calculate hit rate
    $TotalHits = ($CacheIndex.Entries | Measure-Object -Property HitCount -Sum).Sum
    $TotalAccesses = ($CacheIndex.Entries | Measure-Object -Property AccessCount -Sum).Sum
    if ($TotalAccesses -gt 0) {
        $Analysis.HitRate = [Math]::Round(($TotalHits / $TotalAccesses) * 100, 2)
    }
    
    # Calculate efficiency
    $Analysis.Efficiency = [Math]::Round(($Analysis.TotalSize / $Config.MaxCacheSize) * 100, 2)
    
    # Generate recommendations
    if ($Analysis.Efficiency -gt 80) {
        $Analysis.Recommendations += "Cache is nearly full - consider increasing max size or cleaning old entries"
    }
    
    if ($Analysis.HitRate -lt 50) {
        $Analysis.Recommendations += "Low hit rate - consider adjusting cache policies or entry selection"
    }
    
    if ($Analysis.ByAge.ContainsKey("Older") -and $Analysis.ByAge["Older"].Count -gt $Analysis.TotalEntries * 0.5) {
        $Analysis.Recommendations += "Many old entries - consider reducing expiry times"
    }
    
    # Display analysis
    Write-Host "`n📊 Cache Usage Analysis" -ForegroundColor Yellow
    Write-Host "=======================" -ForegroundColor Yellow
    Write-Host "Total Entries: $($Analysis.TotalEntries)" -ForegroundColor White
    Write-Host "Total Size: $([Math]::Round($Analysis.TotalSize / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "Hit Rate: $($Analysis.HitRate)%" -ForegroundColor White
    Write-Host "Efficiency: $($Analysis.Efficiency)%" -ForegroundColor White
    
    Write-Host "`nBy Type:" -ForegroundColor Yellow
    foreach ($Type in $Analysis.ByType.Keys) {
        $TypeData = $Analysis.ByType[$Type]
        Write-Host "- $Type : $($TypeData.Count) entries, $([Math]::Round($TypeData.Size / 1MB, 2)) MB" -ForegroundColor Gray
    }
    
    Write-Host "`nBy Age:" -ForegroundColor Yellow
    foreach ($Age in $Analysis.ByAge.Keys) {
        $AgeData = $Analysis.ByAge[$Age]
        Write-Host "- $Age : $($AgeData.Count) entries, $([Math]::Round($AgeData.Size / 1MB, 2)) MB" -ForegroundColor Gray
    }
    
    if ($Analysis.Recommendations.Count -gt 0) {
        Write-Host "`nRecommendations:" -ForegroundColor Yellow
        foreach ($Recommendation in $Analysis.Recommendations) {
            Write-Host "- $Recommendation" -ForegroundColor Blue
        }
    }
    
    return $Analysis
}

# ⚡ Optimize Cache
function Optimize-Cache {
    param([string]$ProjectPath)
    
    Write-Host "`n⚡ Optimizing cache..." -ForegroundColor Cyan
    
    $CacheDir = Join-Path $ProjectPath $Config.CacheDirectory
    if (-not (Test-Path $CacheDir)) {
        Write-Host "❌ Cache directory not found: $CacheDir" -ForegroundColor Red
        return
    }
    
    $Optimizations = @{
        CompressedEntries = 0
        RemovedDuplicates = 0
        ReorganizedEntries = 0
        SpaceSaved = 0
    }
    
    # Load cache index
    $IndexPath = Join-Path $CacheDir "cache-index.json"
    $CacheIndex = @{}
    
    if (Test-Path $IndexPath) {
        $CacheIndex = Get-Content -Path $IndexPath -Raw | ConvertFrom-Json
    }
    
    # Compress entries that should be compressed
    foreach ($Entry in $CacheIndex.Entries) {
        $EntryPath = Join-Path $CacheDir $Entry.Path
        if (Test-Path $EntryPath) {
            $Policy = $Config.CachePolicies[$Entry.Type]
            if ($Policy.Compression -and -not $Entry.Compressed) {
                $OriginalSize = (Get-Item $EntryPath).Length
                $CompressedPath = $EntryPath + ".gz"
                
                # Compress file
                $Content = Get-Content -Path $EntryPath -Raw -Encoding UTF8
                $CompressedContent = [System.IO.Compression.GzipStream]::new(
                    [System.IO.File]::Create($CompressedPath),
                    [System.IO.Compression.CompressionMode]::Compress
                )
                $Writer = [System.IO.StreamWriter]::new($CompressedContent)
                $Writer.Write($Content)
                $Writer.Close()
                $CompressedContent.Close()
                
                $CompressedSize = (Get-Item $CompressedPath).Length
                if ($CompressedSize -lt $OriginalSize) {
                    Remove-Item -Path $EntryPath
                    $Entry.Compressed = $true
                    $Entry.Path = $Entry.Path + ".gz"
                    $Optimizations.CompressedEntries++
                    $Optimizations.SpaceSaved += ($OriginalSize - $CompressedSize)
                } else {
                    Remove-Item -Path $CompressedPath
                }
            }
        }
    }
    
    # Remove duplicate entries
    $DuplicateGroups = $CacheIndex.Entries | Group-Object Key | Where-Object { $_.Count -gt 1 }
    foreach ($Group in $DuplicateGroups) {
        $Entries = $Group.Group | Sort-Object LastAccessed -Descending
        $KeepEntry = $Entries[0]
        $RemoveEntries = $Entries[1..($Entries.Count - 1)]
        
        foreach ($Entry in $RemoveEntries) {
            $EntryPath = Join-Path $CacheDir $Entry.Path
            if (Test-Path $EntryPath) {
                $EntrySize = (Get-Item $EntryPath).Length
                Remove-Item -Path $EntryPath -Force
                $Optimizations.RemovedDuplicates++
                $Optimizations.SpaceSaved += $EntrySize
            }
        }
        
        $CacheIndex.Entries = $CacheIndex.Entries | Where-Object { $_.Key -ne $Group.Name -or $_.Id -eq $KeepEntry.Id }
    }
    
    # Reorganize entries by type
    foreach ($Entry in $CacheIndex.Entries) {
        $TypeDir = Join-Path $CacheDir $Entry.Type
        $CurrentPath = Join-Path $CacheDir $Entry.Path
        $NewPath = Join-Path $TypeDir (Split-Path $Entry.Path -Leaf)
        
        if (Test-Path $CurrentPath -and $CurrentPath -ne $NewPath) {
            if (-not (Test-Path $TypeDir)) {
                New-Item -ItemType Directory -Path $TypeDir -Force | Out-Null
            }
            
            Move-Item -Path $CurrentPath -Destination $NewPath
            $Entry.Path = Join-Path $Entry.Type (Split-Path $Entry.Path -Leaf)
            $Optimizations.ReorganizedEntries++
        }
    }
    
    # Update cache index
    $CacheIndex.Statistics.TotalEntries = $CacheIndex.Entries.Count
    $CacheIndex.Statistics.TotalSize = (Get-ChildItem -Path $CacheDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $CacheIndex.Statistics.LastUpdated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    
    $CacheIndex | ConvertTo-Json -Depth 3 | Out-File -FilePath $IndexPath -Encoding UTF8
    
    Write-Host "✅ Cache optimization completed!" -ForegroundColor Green
    Write-Host "📊 Compressed entries: $($Optimizations.CompressedEntries)" -ForegroundColor Blue
    Write-Host "🗑️ Removed duplicates: $($Optimizations.RemovedDuplicates)" -ForegroundColor Blue
    Write-Host "📁 Reorganized entries: $($Optimizations.ReorganizedEntries)" -ForegroundColor Blue
    Write-Host "💾 Space saved: $([Math]::Round($Optimizations.SpaceSaved / 1MB, 2)) MB" -ForegroundColor Blue
}

# 📊 Show Cache Status
function Show-CacheStatus {
    param([string]$ProjectPath)
    
    Write-Host "`n📊 Cache Status" -ForegroundColor Cyan
    Write-Host "===============" -ForegroundColor Cyan
    
    $CacheDir = Join-Path $ProjectPath $Config.CacheDirectory
    if (-not (Test-Path $CacheDir)) {
        Write-Host "❌ Cache directory not found: $CacheDir" -ForegroundColor Red
        return
    }
    
    # Load cache index
    $IndexPath = Join-Path $CacheDir "cache-index.json"
    $CacheIndex = @{}
    
    if (Test-Path $IndexPath) {
        $CacheIndex = Get-Content -Path $IndexPath -Raw | ConvertFrom-Json
    }
    
    $TotalSize = (Get-ChildItem -Path $CacheDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $MaxSize = $Config.MaxCacheSize
    $UsagePercent = [Math]::Round(($TotalSize / $MaxSize) * 100, 2)
    
    Write-Host "Cache Directory: $CacheDir" -ForegroundColor White
    Write-Host "Total Entries: $($CacheIndex.Entries.Count)" -ForegroundColor White
    Write-Host "Total Size: $([Math]::Round($TotalSize / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "Max Size: $([Math]::Round($MaxSize / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "Usage: $UsagePercent%" -ForegroundColor White
    
    if ($UsagePercent -gt 80) {
        Write-Host "⚠️ Cache is nearly full!" -ForegroundColor Yellow
    } elseif ($UsagePercent -lt 20) {
        Write-Host "✅ Cache has plenty of space" -ForegroundColor Green
    } else {
        Write-Host "✅ Cache usage is normal" -ForegroundColor Green
    }
    
    Write-Host "`nCache Types:" -ForegroundColor Yellow
    foreach ($Type in $Config.CacheTypes.Keys) {
        $TypeEntries = $CacheIndex.Entries | Where-Object { $_.Type -eq $Type }
        $TypeSize = ($TypeEntries | ForEach-Object { 
            $EntryPath = Join-Path $CacheDir $_.Path
            if (Test-Path $EntryPath) { (Get-Item $EntryPath).Length } else { 0 }
        } | Measure-Object -Sum).Sum
        
        Write-Host "- $Type : $($TypeEntries.Count) entries, $([Math]::Round($TypeSize / 1MB, 2)) MB" -ForegroundColor Gray
    }
}

# 🚀 Execute Caching System
if ($MyInvocation.InvocationName -ne '.') {
    Start-IntelligentCaching
}
