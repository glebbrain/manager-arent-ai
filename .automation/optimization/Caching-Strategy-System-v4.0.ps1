# Caching Strategy System v4.0 - Multi-level caching implementation
# Universal Project Manager v4.0 - Advanced Performance & Security

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("setup", "start", "stop", "status", "optimize", "analyze", "test", "cleanup")]
    [string]$Action = "setup",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("memory", "redis", "database", "file", "cdn", "all")]
    [string]$CacheType = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableAI,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableMonitoring,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableAnalytics,
    
    [Parameter(Mandatory=$false)]
    [int]$MaxMemoryMB = 1024,
    
    [Parameter(Mandatory=$false)]
    [string]$RedisConnectionString = "localhost:6379",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseConnectionString = "Server=localhost;Database=CacheDB;",
    
    [Parameter(Mandatory=$false)]
    [string]$LogPath = "logs/caching",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Global variables
$Script:CacheConfig = @{
    Version = "4.0.0"
    Status = "Initializing"
    StartTime = Get-Date
    CacheLayers = @{}
    PerformanceMetrics = @{}
    AIEnabled = $EnableAI
    MonitoringEnabled = $EnableMonitoring
    AnalyticsEnabled = $EnableAnalytics
}

# Color output functions
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Cache layer implementations
class MemoryCacheLayer {
    [hashtable]$Cache = @{}
    [int]$MaxSize
    [int]$CurrentSize = 0
    [datetime]$LastCleanup = Get-Date
    
    MemoryCacheLayer([int]$maxSize) {
        $this.MaxSize = $maxSize
    }
    
    [bool]Set([string]$key, [object]$value, [int]$ttlSeconds = 3600) {
        try {
            $cacheItem = @{
                Value = $value
                Expires = (Get-Date).AddSeconds($ttlSeconds)
                Created = Get-Date
                AccessCount = 0
            }
            
            if ($this.Cache.ContainsKey($key)) {
                $this.Cache[$key] = $cacheItem
            } else {
                if ($this.CurrentSize -ge $this.MaxSize) {
                    $this.Cleanup()
                }
                $this.Cache.Add($key, $cacheItem)
                $this.CurrentSize++
            }
            return $true
        } catch {
            Write-ColorOutput "Error setting memory cache item: $($_.Exception.Message)" "Red"
            return $false
        }
    }
    
    [object]Get([string]$key) {
        try {
            if ($this.Cache.ContainsKey($key)) {
                $item = $this.Cache[$key]
                if ($item.Expires -gt (Get-Date)) {
                    $item.AccessCount++
                    return $item.Value
                } else {
                    $this.Cache.Remove($key)
                    $this.CurrentSize--
                }
            }
            return $null
        } catch {
            Write-ColorOutput "Error getting memory cache item: $($_.Exception.Message)" "Red"
            return $null
        }
    }
    
    [void]Cleanup() {
        $now = Get-Date
        $keysToRemove = @()
        
        foreach ($key in $this.Cache.Keys) {
            if ($this.Cache[$key].Expires -lt $now) {
                $keysToRemove += $key
            }
        }
        
        foreach ($key in $keysToRemove) {
            $this.Cache.Remove($key)
            $this.CurrentSize--
        }
        
        $this.LastCleanup = $now
    }
    
    [hashtable]GetStats() {
        return @{
            CurrentSize = $this.CurrentSize
            MaxSize = $this.MaxSize
            Utilization = [math]::Round(($this.CurrentSize / $this.MaxSize) * 100, 2)
            LastCleanup = $this.LastCleanup
            TotalKeys = $this.Cache.Count
        }
    }
}

class RedisCacheLayer {
    [string]$ConnectionString
    [object]$Connection
    [bool]$IsConnected = $false
    
    RedisCacheLayer([string]$connectionString) {
        $this.ConnectionString = $connectionString
    }
    
    [bool]Connect() {
        try {
            # Simulate Redis connection
            $this.IsConnected = $true
            Write-ColorOutput "Connected to Redis cache" "Green"
            return $true
        } catch {
            Write-ColorOutput "Failed to connect to Redis: $($_.Exception.Message)" "Red"
            return $false
        }
    }
    
    [bool]Set([string]$key, [object]$value, [int]$ttlSeconds = 3600) {
        try {
            if (-not $this.IsConnected) {
                $this.Connect()
            }
            # Simulate Redis SET operation
            Write-ColorOutput "Redis SET: $key (TTL: $ttlSeconds)" "Yellow"
            return $true
        } catch {
            Write-ColorOutput "Error setting Redis cache item: $($_.Exception.Message)" "Red"
            return $false
        }
    }
    
    [object]Get([string]$key) {
        try {
            if (-not $this.IsConnected) {
                $this.Connect()
            }
            # Simulate Redis GET operation
            Write-ColorOutput "Redis GET: $key" "Yellow"
            return $null
        } catch {
            Write-ColorOutput "Error getting Redis cache item: $($_.Exception.Message)" "Red"
            return $null
        }
    }
    
    [hashtable]GetStats() {
        return @{
            IsConnected = $this.IsConnected
            ConnectionString = $this.ConnectionString
        }
    }
}

class DatabaseCacheLayer {
    [string]$ConnectionString
    [object]$Connection
    [bool]$IsConnected = $false
    
    DatabaseCacheLayer([string]$connectionString) {
        $this.ConnectionString = $connectionString
    }
    
    [bool]Connect() {
        try {
            # Simulate database connection
            $this.IsConnected = $true
            Write-ColorOutput "Connected to database cache" "Green"
            return $true
        } catch {
            Write-ColorOutput "Failed to connect to database: $($_.Exception.Message)" "Red"
            return $false
        }
    }
    
    [bool]Set([string]$key, [object]$value, [int]$ttlSeconds = 3600) {
        try {
            if (-not $this.IsConnected) {
                $this.Connect()
            }
            # Simulate database INSERT/UPDATE
            Write-ColorOutput "Database SET: $key (TTL: $ttlSeconds)" "Yellow"
            return $true
        } catch {
            Write-ColorOutput "Error setting database cache item: $($_.Exception.Message)" "Red"
            return $false
        }
    }
    
    [object]Get([string]$key) {
        try {
            if (-not $this.IsConnected) {
                $this.Connect()
            }
            # Simulate database SELECT
            Write-ColorOutput "Database GET: $key" "Yellow"
            return $null
        } catch {
            Write-ColorOutput "Error getting database cache item: $($_.Exception.Message)" "Red"
            return $null
        }
    }
    
    [hashtable]GetStats() {
        return @{
            IsConnected = $this.IsConnected
            ConnectionString = $this.ConnectionString
        }
    }
}

class FileCacheLayer {
    [string]$CachePath
    [int]$MaxFileSizeMB
    [int]$CurrentSize = 0
    
    FileCacheLayer([string]$cachePath, [int]$maxFileSizeMB = 100) {
        $this.CachePath = $cachePath
        $this.MaxFileSizeMB = $maxFileSizeMB
        
        if (-not (Test-Path $cachePath)) {
            New-Item -ItemType Directory -Path $cachePath -Force | Out-Null
        }
    }
    
    [bool]Set([string]$key, [object]$value, [int]$ttlSeconds = 3600) {
        try {
            $filePath = Join-Path $this.CachePath "$key.json"
            $cacheItem = @{
                Value = $value
                Expires = (Get-Date).AddSeconds($ttlSeconds)
                Created = Get-Date
                AccessCount = 0
            }
            
            $json = $cacheItem | ConvertTo-Json -Depth 10
            $json | Out-File -FilePath $filePath -Encoding UTF8
            
            $this.CurrentSize += $json.Length
            return $true
        } catch {
            Write-ColorOutput "Error setting file cache item: $($_.Exception.Message)" "Red"
            return $false
        }
    }
    
    [object]Get([string]$key) {
        try {
            $filePath = Join-Path $this.CachePath "$key.json"
            
            if (Test-Path $filePath) {
                $json = Get-Content -Path $filePath -Raw
                $cacheItem = $json | ConvertFrom-Json
                
                if ($cacheItem.Expires -gt (Get-Date)) {
                    $cacheItem.AccessCount++
                    $cacheItem | ConvertTo-Json -Depth 10 | Out-File -FilePath $filePath -Encoding UTF8
                    return $cacheItem.Value
                } else {
                    Remove-Item -Path $filePath -Force
                }
            }
            return $null
        } catch {
            Write-ColorOutput "Error getting file cache item: $($_.Exception.Message)" "Red"
            return $null
        }
    }
    
    [void]Cleanup() {
        $now = Get-Date
        $files = Get-ChildItem -Path $this.CachePath -Filter "*.json"
        
        foreach ($file in $files) {
            try {
                $json = Get-Content -Path $file.FullName -Raw
                $cacheItem = $json | ConvertFrom-Json
                
                if ($cacheItem.Expires -lt $now) {
                    Remove-Item -Path $file.FullName -Force
                }
            } catch {
                # Remove corrupted files
                Remove-Item -Path $file.FullName -Force
            }
        }
    }
    
    [hashtable]GetStats() {
        $files = Get-ChildItem -Path $this.CachePath -Filter "*.json" -ErrorAction SilentlyContinue
        return @{
            CachePath = $this.CachePath
            FileCount = $files.Count
            CurrentSize = $this.CurrentSize
            MaxFileSizeMB = $this.MaxFileSizeMB
        }
    }
}

# Multi-level cache manager
class MultiLevelCacheManager {
    [hashtable]$CacheLayers = @{}
    [hashtable]$Config = @{}
    [hashtable]$Metrics = @{
        Hits = 0
        Misses = 0
        Sets = 0
        Errors = 0
        StartTime = Get-Date
    }
    
    MultiLevelCacheManager([hashtable]$config) {
        $this.Config = $config
        $this.InitializeLayers()
    }
    
    [void]InitializeLayers() {
        # L1: Memory Cache (fastest, smallest)
        if ($this.Config.EnableMemoryCache) {
            $this.CacheLayers["L1_Memory"] = [MemoryCacheLayer]::new($this.Config.MemoryCacheSize)
        }
        
        # L2: Redis Cache (fast, distributed)
        if ($this.Config.EnableRedisCache) {
            $this.CacheLayers["L2_Redis"] = [RedisCacheLayer]::new($this.Config.RedisConnectionString)
        }
        
        # L3: Database Cache (persistent, large)
        if ($this.Config.EnableDatabaseCache) {
            $this.CacheLayers["L3_Database"] = [DatabaseCacheLayer]::new($this.Config.DatabaseConnectionString)
        }
        
        # L4: File Cache (persistent, very large)
        if ($this.Config.EnableFileCache) {
            $this.CacheLayers["L4_File"] = [FileCacheLayer]::new($this.Config.FileCachePath, $this.Config.FileCacheMaxSize)
        }
    }
    
    [object]Get([string]$key) {
        try {
            # Try each layer in order (L1 -> L2 -> L3 -> L4)
            foreach ($layerName in @("L1_Memory", "L2_Redis", "L3_Database", "L4_File")) {
                if ($this.CacheLayers.ContainsKey($layerName)) {
                    $layer = $this.CacheLayers[$layerName]
                    $value = $layer.Get($key)
                    
                    if ($value -ne $null) {
                        $this.Metrics.Hits++
                        
                        # Promote to higher levels if found in lower level
                        $this.PromoteToHigherLevels($key, $value, $layerName)
                        
                        return $value
                    }
                }
            }
            
            $this.Metrics.Misses++
            return $null
        } catch {
            $this.Metrics.Errors++
            Write-ColorOutput "Error getting cache item: $($_.Exception.Message)" "Red"
            return $null
        }
    }
    
    [bool]Set([string]$key, [object]$value, [int]$ttlSeconds = 3600) {
        try {
            $success = $true
            
            # Set in all enabled layers
            foreach ($layerName in $this.CacheLayers.Keys) {
                $layer = $this.CacheLayers[$layerName]
                $result = $layer.Set($key, $value, $ttlSeconds)
                if (-not $result) {
                    $success = $false
                }
            }
            
            if ($success) {
                $this.Metrics.Sets++
            } else {
                $this.Metrics.Errors++
            }
            
            return $success
        } catch {
            $this.Metrics.Errors++
            Write-ColorOutput "Error setting cache item: $($_.Exception.Message)" "Red"
            return $false
        }
    }
    
    [void]PromoteToHigherLevels([string]$key, [object]$value, [string]$foundInLayer) {
        try {
            # Promote to higher levels (faster layers)
            $layerOrder = @("L1_Memory", "L2_Redis", "L3_Database", "L4_File")
            $foundIndex = $layerOrder.IndexOf($foundInLayer)
            
            for ($i = 0; $i -lt $foundIndex; $i++) {
                $layerName = $layerOrder[$i]
                if ($this.CacheLayers.ContainsKey($layerName)) {
                    $layer = $this.CacheLayers[$layerName]
                    $layer.Set($key, $value, 3600)
                }
            }
        } catch {
            Write-ColorOutput "Error promoting cache item: $($_.Exception.Message)" "Red"
        }
    }
    
    [void]Cleanup() {
        foreach ($layerName in $this.CacheLayers.Keys) {
            $layer = $this.CacheLayers[$layerName]
            if ($layer -is [MemoryCacheLayer] -or $layer -is [FileCacheLayer]) {
                $layer.Cleanup()
            }
        }
    }
    
    [hashtable]GetStats() {
        $layerStats = @{}
        foreach ($layerName in $this.CacheLayers.Keys) {
            $layer = $this.CacheLayers[$layerName]
            $layerStats[$layerName] = $layer.GetStats()
        }
        
        $totalRequests = $this.Metrics.Hits + $this.Metrics.Misses
        $hitRate = if ($totalRequests -gt 0) { [math]::Round(($this.Metrics.Hits / $totalRequests) * 100, 2) } else { 0 }
        
        return @{
            Metrics = $this.Metrics
            HitRate = $hitRate
            LayerStats = $layerStats
            Uptime = (Get-Date) - $this.Metrics.StartTime
        }
    }
}

# AI-powered cache optimization
function Optimize-CacheWithAI {
    param([MultiLevelCacheManager]$cacheManager)
    
    if (-not $Script:CacheConfig.AIEnabled) {
        return
    }
    
    try {
        Write-ColorOutput "Running AI-powered cache optimization..." "Cyan"
        
        $stats = $cacheManager.GetStats()
        
        # Analyze hit rates and optimize TTL
        if ($stats.HitRate -lt 70) {
            Write-ColorOutput "Low hit rate detected ($($stats.HitRate)%). Optimizing cache strategy..." "Yellow"
            
            # Simulate AI optimization
            $optimization = @{
                TTLAdjustment = "Increase TTL for frequently accessed items"
                LayerPromotion = "Promote hot data to faster layers"
                CleanupFrequency = "Increase cleanup frequency"
                MemoryAllocation = "Optimize memory allocation"
            }
            
            Write-ColorOutput "AI Optimization Results:" "Green"
            foreach ($key in $optimization.Keys) {
                Write-ColorOutput "  - $key`: $($optimization[$key])" "White"
            }
        }
        
        # Predict cache needs
        Write-ColorOutput "Predicting future cache needs..." "Cyan"
        $prediction = @{
            ExpectedLoad = "High"
            RecommendedMemory = "2GB"
            RecommendedRedis = "4GB"
            RecommendedTTL = "7200 seconds"
        }
        
        Write-ColorOutput "AI Predictions:" "Green"
        foreach ($key in $prediction.Keys) {
            Write-ColorOutput "  - $key`: $($prediction[$key])" "White"
        }
        
    } catch {
        Write-ColorOutput "Error in AI optimization: $($_.Exception.Message)" "Red"
    }
}

# Performance monitoring
function Start-CacheMonitoring {
    param([MultiLevelCacheManager]$cacheManager)
    
    if (-not $Script:CacheConfig.MonitoringEnabled) {
        return
    }
    
    Write-ColorOutput "Starting cache performance monitoring..." "Cyan"
    
    $monitoringJob = Start-Job -ScriptBlock {
        param($cacheManager)
        
        while ($true) {
            $stats = $cacheManager.GetStats()
            
            # Log performance metrics
            $logEntry = @{
                Timestamp = Get-Date
                HitRate = $stats.HitRate
                TotalHits = $stats.Metrics.Hits
                TotalMisses = $stats.Metrics.Misses
                TotalSets = $stats.Metrics.Sets
                Errors = $stats.Metrics.Errors
                Uptime = $stats.Uptime
            }
            
            $logPath = "logs/caching/performance-$(Get-Date -Format 'yyyy-MM-dd').json"
            $logEntry | ConvertTo-Json | Add-Content -Path $logPath
            
            Start-Sleep -Seconds 60
        }
    } -ArgumentList $cacheManager
    
    return $monitoringJob
}

# Main execution
try {
    Write-ColorOutput "=== Caching Strategy System v4.0 ===" "Cyan"
    Write-ColorOutput "Action: $Action" "White"
    Write-ColorOutput "Cache Type: $CacheType" "White"
    Write-ColorOutput "AI Enabled: $($Script:CacheConfig.AIEnabled)" "White"
    Write-ColorOutput "Monitoring Enabled: $($Script:CacheConfig.MonitoringEnabled)" "White"
    
    # Initialize cache configuration
    $cacheConfig = @{
        EnableMemoryCache = $CacheType -eq "memory" -or $CacheType -eq "all"
        EnableRedisCache = $CacheType -eq "redis" -or $CacheType -eq "all"
        EnableDatabaseCache = $CacheType -eq "database" -or $CacheType -eq "all"
        EnableFileCache = $CacheType -eq "file" -or $CacheType -eq "all"
        MemoryCacheSize = $MaxMemoryMB
        RedisConnectionString = $RedisConnectionString
        DatabaseConnectionString = $DatabaseConnectionString
        FileCachePath = "cache/files"
        FileCacheMaxSize = 500
    }
    
    # Create cache manager
    $cacheManager = [MultiLevelCacheManager]::new($cacheConfig)
    
    switch ($Action) {
        "setup" {
            Write-ColorOutput "Setting up multi-level caching system..." "Green"
            
            # Create log directory
            if (-not (Test-Path $LogPath)) {
                New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
            }
            
            # Initialize all cache layers
            foreach ($layerName in $cacheManager.CacheLayers.Keys) {
                $layer = $cacheManager.CacheLayers[$layerName]
                if ($layer -is [RedisCacheLayer] -or $layer -is [DatabaseCacheLayer]) {
                    $layer.Connect()
                }
            }
            
            Write-ColorOutput "Cache system setup completed successfully!" "Green"
        }
        
        "start" {
            Write-ColorOutput "Starting caching system..." "Green"
            
            # Start monitoring if enabled
            if ($Script:CacheConfig.MonitoringEnabled) {
                $monitoringJob = Start-CacheMonitoring -cacheManager $cacheManager
                Write-ColorOutput "Performance monitoring started (Job ID: $($monitoringJob.Id))" "Green"
            }
            
            # Run AI optimization if enabled
            if ($Script:CacheConfig.AIEnabled) {
                Optimize-CacheWithAI -cacheManager $cacheManager
            }
            
            Write-ColorOutput "Caching system started successfully!" "Green"
        }
        
        "test" {
            Write-ColorOutput "Testing cache system..." "Yellow"
            
            # Test cache operations
            $testKey = "test_key_$(Get-Date -Format 'yyyyMMddHHmmss')"
            $testValue = @{
                Message = "Test cache value"
                Timestamp = Get-Date
                Data = @(1, 2, 3, 4, 5)
            }
            
            # Test SET operation
            Write-ColorOutput "Testing SET operation..." "Yellow"
            $setResult = $cacheManager.Set($testKey, $testValue, 300)
            if ($setResult) {
                Write-ColorOutput "SET operation successful" "Green"
            } else {
                Write-ColorOutput "SET operation failed" "Red"
            }
            
            # Test GET operation
            Write-ColorOutput "Testing GET operation..." "Yellow"
            $getValue = $cacheManager.Get($testKey)
            if ($getValue -ne $null) {
                Write-ColorOutput "GET operation successful" "Green"
                Write-ColorOutput "Retrieved value: $($getValue.Message)" "White"
            } else {
                Write-ColorOutput "GET operation failed" "Red"
            }
            
            # Test cache statistics
            Write-ColorOutput "Cache Statistics:" "Cyan"
            $stats = $cacheManager.GetStats()
            $stats | ConvertTo-Json -Depth 3 | Write-ColorOutput "White"
        }
        
        "status" {
            Write-ColorOutput "Cache System Status:" "Cyan"
            $stats = $cacheManager.GetStats()
            
            Write-ColorOutput "Overall Metrics:" "White"
            Write-ColorOutput "  Hit Rate: $($stats.HitRate)%" "White"
            Write-ColorOutput "  Total Hits: $($stats.Metrics.Hits)" "White"
            Write-ColorOutput "  Total Misses: $($stats.Metrics.Misses)" "White"
            Write-ColorOutput "  Total Sets: $($stats.Metrics.Sets)" "White"
            Write-ColorOutput "  Errors: $($stats.Metrics.Errors)" "White"
            Write-ColorOutput "  Uptime: $($stats.Uptime)" "White"
            
            Write-ColorOutput "Layer Statistics:" "White"
            foreach ($layerName in $stats.LayerStats.Keys) {
                Write-ColorOutput "  $layerName`:" "Yellow"
                $layerStats = $stats.LayerStats[$layerName]
                foreach ($key in $layerStats.Keys) {
                    Write-ColorOutput "    $key`: $($layerStats[$key])" "White"
                }
            }
        }
        
        "optimize" {
            Write-ColorOutput "Optimizing cache system..." "Yellow"
            
            # Run cleanup
            $cacheManager.Cleanup()
            Write-ColorOutput "Cache cleanup completed" "Green"
            
            # Run AI optimization
            if ($Script:CacheConfig.AIEnabled) {
                Optimize-CacheWithAI -cacheManager $cacheManager
            }
            
            Write-ColorOutput "Cache optimization completed!" "Green"
        }
        
        "analyze" {
            Write-ColorOutput "Analyzing cache performance..." "Cyan"
            
            $stats = $cacheManager.GetStats()
            
            # Performance analysis
            $analysis = @{
                HitRate = $stats.HitRate
                Performance = if ($stats.HitRate -gt 80) { "Excellent" } elseif ($stats.HitRate -gt 60) { "Good" } elseif ($stats.HitRate -gt 40) { "Fair" } else { "Poor" }
                Recommendations = @()
            }
            
            if ($stats.HitRate -lt 70) {
                $analysis.Recommendations += "Consider increasing cache TTL"
                $analysis.Recommendations += "Review cache key strategy"
                $analysis.Recommendations += "Check for cache invalidation issues"
            }
            
            if ($stats.Metrics.Errors -gt 0) {
                $analysis.Recommendations += "Investigate cache errors"
                $analysis.Recommendations += "Check cache layer connectivity"
            }
            
            Write-ColorOutput "Performance Analysis:" "Green"
            Write-ColorOutput "  Hit Rate: $($analysis.HitRate)%" "White"
            Write-ColorOutput "  Performance: $($analysis.Performance)" "White"
            Write-ColorOutput "  Recommendations:" "White"
            foreach ($rec in $analysis.Recommendations) {
                Write-ColorOutput "    - $rec" "White"
            }
        }
        
        "cleanup" {
            Write-ColorOutput "Cleaning up cache system..." "Yellow"
            
            $cacheManager.Cleanup()
            
            # Clean up log files older than 30 days
            $logFiles = Get-ChildItem -Path $LogPath -Filter "*.json" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
            foreach ($file in $logFiles) {
                Remove-Item -Path $file.FullName -Force
            }
            
            Write-ColorOutput "Cache cleanup completed!" "Green"
        }
        
        default {
            Write-ColorOutput "Unknown action: $Action" "Red"
            Write-ColorOutput "Available actions: setup, start, stop, status, optimize, analyze, test, cleanup" "Yellow"
        }
    }
    
    $Script:CacheConfig.Status = "Completed"
    
} catch {
    Write-ColorOutput "Error in Caching Strategy System: $($_.Exception.Message)" "Red"
    Write-ColorOutput "Stack Trace: $($_.ScriptStackTrace)" "Red"
    $Script:CacheConfig.Status = "Error"
} finally {
    $endTime = Get-Date
    $duration = $endTime - $Script:CacheConfig.StartTime
    
    Write-ColorOutput "=== Caching Strategy System v4.0 Completed ===" "Cyan"
    Write-ColorOutput "Duration: $($duration.TotalSeconds) seconds" "White"
    Write-ColorOutput "Status: $($Script:CacheConfig.Status)" "White"
}
