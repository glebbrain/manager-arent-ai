# Load Balancing System v4.0 - Advanced load balancing and auto-scaling
# Universal Project Manager v4.0 - Advanced Performance & Security

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("setup", "start", "stop", "status", "scale", "analyze", "test", "monitor")]
    [string]$Action = "setup",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("round-robin", "least-connections", "weighted", "ip-hash", "ai-optimized")]
    [string]$Algorithm = "ai-optimized",
    
    [Parameter(Mandatory=$false)]
    [string[]]$BackendServers = @("localhost:8080", "localhost:8081", "localhost:8082"),
    
    [Parameter(Mandatory=$false)]
    [int]$MinInstances = 2,
    
    [Parameter(Mandatory=$false)]
    [int]$MaxInstances = 10,
    
    [Parameter(Mandatory=$false)]
    [int]$ScaleUpThreshold = 80,
    
    [Parameter(Mandatory=$false)]
    [int]$ScaleDownThreshold = 30,
    
    [Parameter(Mandatory=$false)]
    [int]$HealthCheckInterval = 30,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableAI,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableAutoScaling,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableMonitoring,
    
    [Parameter(Mandatory=$false)]
    [string]$LogPath = "logs/loadbalancing",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Global variables
$Script:LoadBalancerConfig = @{
    Version = "4.0.0"
    Status = "Initializing"
    StartTime = Get-Date
    BackendServers = @{}
    HealthChecks = @{}
    Metrics = @{}
    AIEnabled = $EnableAI
    AutoScalingEnabled = $EnableAutoScaling
    MonitoringEnabled = $EnableMonitoring
}

# Color output functions
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Backend server class
class BackendServer {
    [string]$Id
    [string]$Address
    [int]$Port
    [int]$Weight
    [bool]$IsHealthy
    [int]$ActiveConnections
    [int]$TotalRequests
    [double]$ResponseTime
    [datetime]$LastHealthCheck
    [datetime]$LastRequest
    [hashtable]$Metrics = @{
        RequestsPerMinute = 0
        AverageResponseTime = 0
        ErrorRate = 0
        Uptime = 0
    }
    
    BackendServer([string]$address, [int]$port, [int]$weight = 1) {
        $this.Id = "$address`:$port"
        $this.Address = $address
        $this.Port = $port
        $this.Weight = $weight
        $this.IsHealthy = $true
        $this.ActiveConnections = 0
        $this.TotalRequests = 0
        $this.ResponseTime = 0
        $this.LastHealthCheck = Get-Date
        $this.LastRequest = Get-Date
    }
    
    [bool]HealthCheck() {
        try {
            $uri = "http://$($this.Address):$($this.Port)/health"
            $response = Invoke-WebRequest -Uri $uri -Method GET -TimeoutSec 5 -ErrorAction Stop
            $this.IsHealthy = $response.StatusCode -eq 200
            $this.LastHealthCheck = Get-Date
            return $this.IsHealthy
        } catch {
            $this.IsHealthy = $false
            $this.LastHealthCheck = Get-Date
            return $false
        }
    }
    
    [void]UpdateMetrics([int]$responseTime, [bool]$isError = $false) {
        $this.TotalRequests++
        $this.ResponseTime = $responseTime
        $this.LastRequest = Get-Date
        
        if ($isError) {
            $this.Metrics.ErrorRate = [math]::Round((($this.Metrics.ErrorRate * ($this.TotalRequests - 1)) + 1) / $this.TotalRequests * 100, 2)
        } else {
            $this.Metrics.ErrorRate = [math]::Round(($this.Metrics.ErrorRate * ($this.TotalRequests - 1)) / $this.TotalRequests * 100, 2)
        }
        
        # Update average response time
        $this.Metrics.AverageResponseTime = [math]::Round((($this.Metrics.AverageResponseTime * ($this.TotalRequests - 1)) + $responseTime) / $this.TotalRequests, 2)
        
        # Update uptime
        $this.Metrics.Uptime = [math]::Round(((Get-Date) - $this.StartTime).TotalSeconds, 2)
    }
    
    [hashtable]GetStats() {
        return @{
            Id = $this.Id
            Address = $this.Address
            Port = $this.Port
            Weight = $this.Weight
            IsHealthy = $this.IsHealthy
            ActiveConnections = $this.ActiveConnections
            TotalRequests = $this.TotalRequests
            ResponseTime = $this.ResponseTime
            LastHealthCheck = $this.LastHealthCheck
            LastRequest = $this.LastRequest
            Metrics = $this.Metrics
        }
    }
}

# Load balancing algorithms
class LoadBalancingAlgorithm {
    [string]$Name
    [hashtable]$Servers = @{}
    
    LoadBalancingAlgorithm([string]$name, [hashtable]$servers) {
        $this.Name = $name
        $this.Servers = $servers
    }
    
    [BackendServer]SelectServer([string]$clientIp = "") {
        $healthyServers = $this.Servers.Values | Where-Object { $_.IsHealthy }
        
        if ($healthyServers.Count -eq 0) {
            return $null
        }
        
        switch ($this.Name) {
            "round-robin" {
                return $this.RoundRobinSelection($healthyServers)
            }
            "least-connections" {
                return $this.LeastConnectionsSelection($healthyServers)
            }
            "weighted" {
                return $this.WeightedSelection($healthyServers)
            }
            "ip-hash" {
                return $this.IPHashSelection($healthyServers, $clientIp)
            }
            "ai-optimized" {
                return $this.AIOptimizedSelection($healthyServers, $clientIp)
            }
            default {
                return $this.RoundRobinSelection($healthyServers)
            }
        }
    }
    
    [BackendServer]RoundRobinSelection([array]$servers) {
        $index = (Get-Random -Minimum 0 -Maximum $servers.Count)
        return $servers[$index]
    }
    
    [BackendServer]LeastConnectionsSelection([array]$servers) {
        return $servers | Sort-Object ActiveConnections | Select-Object -First 1
    }
    
    [BackendServer]WeightedSelection([array]$servers) {
        $totalWeight = ($servers | Measure-Object -Property Weight -Sum).Sum
        $random = Get-Random -Minimum 0 -Maximum $totalWeight
        
        $currentWeight = 0
        foreach ($server in $servers) {
            $currentWeight += $server.Weight
            if ($random -lt $currentWeight) {
                return $server
            }
        }
        
        return $servers[0]
    }
    
    [BackendServer]IPHashSelection([array]$servers, [string]$clientIp) {
        if ([string]::IsNullOrEmpty($clientIp)) {
            return $this.RoundRobinSelection($servers)
        }
        
        $hash = $clientIp.GetHashCode()
        $index = [math]::Abs($hash) % $servers.Count
        return $servers[$index]
    }
    
    [BackendServer]AIOptimizedSelection([array]$servers, [string]$clientIp) {
        if (-not $Script:LoadBalancerConfig.AIEnabled) {
            return $this.RoundRobinSelection($servers)
        }
        
        # AI-powered server selection based on multiple factors
        $scores = @{}
        
        foreach ($server in $servers) {
            $score = 0
            
            # Factor 1: Response time (lower is better)
            $responseTimeScore = 100 - [math]::Min($server.Metrics.AverageResponseTime, 100)
            $score += $responseTimeScore * 0.3
            
            # Factor 2: Error rate (lower is better)
            $errorRateScore = 100 - $server.Metrics.ErrorRate
            $score += $errorRateScore * 0.2
            
            # Factor 3: Active connections (lower is better)
            $connectionScore = 100 - [math]::Min($server.ActiveConnections * 10, 100)
            $score += $connectionScore * 0.2
            
            # Factor 4: Server weight
            $weightScore = $server.Weight * 10
            $score += $weightScore * 0.1
            
            # Factor 5: Recent activity (more recent is better)
            $timeSinceLastRequest = ((Get-Date) - $server.LastRequest).TotalSeconds
            $activityScore = [math]::Max(0, 100 - $timeSinceLastRequest)
            $score += $activityScore * 0.1
            
            # Factor 6: Uptime (higher is better)
            $uptimeScore = [math]::Min($server.Metrics.Uptime / 3600, 100) # Convert to hours, max 100
            $score += $uptimeScore * 0.1
            
            $scores[$server.Id] = $score
        }
        
        # Select server with highest score
        $bestServer = $scores.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1
        return $servers | Where-Object { $_.Id -eq $bestServer.Key }
    }
}

# Auto-scaling manager
class AutoScalingManager {
    [int]$MinInstances
    [int]$MaxInstances
    [int]$ScaleUpThreshold
    [int]$ScaleDownThreshold
    [hashtable]$Servers = @{}
    [datetime]$LastScaleCheck = Get-Date
    
    AutoScalingManager([int]$minInstances, [int]$maxInstances, [int]$scaleUpThreshold, [int]$scaleDownThreshold) {
        $this.MinInstances = $minInstances
        $this.MaxInstances = $maxInstances
        $this.ScaleUpThreshold = $scaleUpThreshold
        $this.ScaleDownThreshold = $scaleDownThreshold
    }
    
    [void]CheckAndScale([hashtable]$servers) {
        if (-not $Script:LoadBalancerConfig.AutoScalingEnabled) {
            return
        }
        
        $now = Get-Date
        if (($now - $this.LastScaleCheck).TotalSeconds -lt 60) {
            return
        }
        
        $this.LastScaleCheck = $now
        
        # Calculate current load
        $totalLoad = 0
        $healthyServers = 0
        
        foreach ($server in $servers.Values) {
            if ($server.IsHealthy) {
                $healthyServers++
                $serverLoad = $server.ActiveConnections + ($server.Metrics.RequestsPerMinute / 10)
                $totalLoad += $serverLoad
            }
        }
        
        if ($healthyServers -eq 0) {
            return
        }
        
        $averageLoad = $totalLoad / $healthyServers
        $loadPercentage = [math]::Min(($averageLoad / 100) * 100, 100)
        
        Write-ColorOutput "Current load: $([math]::Round($loadPercentage, 2))% (Thresholds: Up=$($this.ScaleUpThreshold)%, Down=$($this.ScaleDownThreshold)%)" "Yellow"
        
        # Scale up if load is too high
        if ($loadPercentage -gt $this.ScaleUpThreshold -and $healthyServers -lt $this.MaxInstances) {
            $this.ScaleUp($servers)
        }
        # Scale down if load is too low
        elseif ($loadPercentage -lt $this.ScaleDownThreshold -and $healthyServers -gt $this.MinInstances) {
            $this.ScaleDown($servers)
        }
    }
    
    [void]ScaleUp([hashtable]$servers) {
        Write-ColorOutput "Scaling UP - Adding new server instance..." "Green"
        
        # Find next available port
        $maxPort = ($servers.Values | Measure-Object -Property Port -Maximum).Maximum
        $newPort = $maxPort + 1
        
        # Create new server instance
        $newServer = [BackendServer]::new("localhost", $newPort, 1)
        $servers[$newServer.Id] = $newServer
        
        Write-ColorOutput "Added new server: $($newServer.Id)" "Green"
    }
    
    [void]ScaleDown([hashtable]$servers) {
        Write-ColorOutput "Scaling DOWN - Removing server instance..." "Yellow"
        
        # Find server with lowest activity
        $leastActiveServer = $servers.Values | 
            Where-Object { $_.IsHealthy } | 
            Sort-Object { $_.ActiveConnections + $_.Metrics.RequestsPerMinute } | 
            Select-Object -First 1
        
        if ($leastActiveServer) {
            $servers.Remove($leastActiveServer.Id)
            Write-ColorOutput "Removed server: $($leastActiveServer.Id)" "Yellow"
        }
    }
}

# Health check manager
class HealthCheckManager {
    [int]$Interval
    [hashtable]$Servers = @{}
    [System.Timers.Timer]$Timer
    
    HealthCheckManager([int]$interval, [hashtable]$servers) {
        $this.Interval = $interval
        $this.Servers = $servers
        $this.Timer = New-Object System.Timers.Timer
        $this.Timer.Interval = $interval * 1000
        $this.Timer.Add_Elapsed($this.HealthCheckCallback)
    }
    
    [void]Start() {
        $this.Timer.Start()
        Write-ColorOutput "Health check monitoring started (interval: $($this.Interval)s)" "Green"
    }
    
    [void]Stop() {
        $this.Timer.Stop()
        Write-ColorOutput "Health check monitoring stopped" "Yellow"
    }
    
    [void]HealthCheckCallback([object]$sender, [System.Timers.ElapsedEventArgs]$e) {
        foreach ($server in $this.Servers.Values) {
            $wasHealthy = $server.IsHealthy
            $isHealthy = $server.HealthCheck()
            
            if ($wasHealthy -ne $isHealthy) {
                $status = if ($isHealthy) { "HEALTHY" } else { "UNHEALTHY" }
                Write-ColorOutput "Server $($server.Id) status changed to $status" "Yellow"
            }
        }
    }
}

# Load balancer main class
class LoadBalancer {
    [LoadBalancingAlgorithm]$Algorithm
    [AutoScalingManager]$AutoScaler
    [HealthCheckManager]$HealthChecker
    [hashtable]$Servers = @{}
    [hashtable]$Metrics = @{
        TotalRequests = 0
        SuccessfulRequests = 0
        FailedRequests = 0
        AverageResponseTime = 0
        StartTime = Get-Date
    }
    
    LoadBalancer([string]$algorithm, [string[]]$backendServers, [int]$minInstances, [int]$maxInstances, [int]$scaleUpThreshold, [int]$scaleDownThreshold, [int]$healthCheckInterval) {
        # Initialize servers
        foreach ($serverAddress in $backendServers) {
            $parts = $serverAddress.Split(':')
            $address = $parts[0]
            $port = [int]$parts[1]
            $server = [BackendServer]::new($address, $port, 1)
            $this.Servers[$server.Id] = $server
        }
        
        # Initialize components
        $this.Algorithm = [LoadBalancingAlgorithm]::new($algorithm, $this.Servers)
        $this.AutoScaler = [AutoScalingManager]::new($minInstances, $maxInstances, $scaleUpThreshold, $scaleDownThreshold)
        $this.HealthChecker = [HealthCheckManager]::new($healthCheckInterval, $this.Servers)
    }
    
    [BackendServer]RouteRequest([string]$clientIp = "") {
        $this.Metrics.TotalRequests++
        
        # Update algorithm servers reference
        $this.Algorithm.Servers = $this.Servers
        
        # Select server
        $selectedServer = $this.Algorithm.SelectServer($clientIp)
        
        if ($selectedServer -eq $null) {
            $this.Metrics.FailedRequests++
            Write-ColorOutput "No healthy servers available for request" "Red"
            return $null
        }
        
        # Simulate request processing
        $startTime = Get-Date
        $selectedServer.ActiveConnections++
        
        # Simulate response time
        $responseTime = Get-Random -Minimum 10 -Maximum 200
        Start-Sleep -Milliseconds $responseTime
        
        $endTime = Get-Date
        $actualResponseTime = ($endTime - $startTime).TotalMilliseconds
        
        # Update server metrics
        $isError = (Get-Random -Minimum 1 -Maximum 100) -lt 5 # 5% error rate
        $selectedServer.UpdateMetrics($actualResponseTime, $isError)
        
        # Update load balancer metrics
        if ($isError) {
            $this.Metrics.FailedRequests++
        } else {
            $this.Metrics.SuccessfulRequests++
        }
        
        # Update average response time
        $this.Metrics.AverageResponseTime = [math]::Round((($this.Metrics.AverageResponseTime * ($this.Metrics.TotalRequests - 1)) + $actualResponseTime) / $this.Metrics.TotalRequests, 2)
        
        $selectedServer.ActiveConnections--
        
        return $selectedServer
    }
    
    [void]Start() {
        Write-ColorOutput "Starting load balancer..." "Green"
        
        # Start health checking
        $this.HealthChecker.Start()
        
        # Start auto-scaling monitoring
        if ($Script:LoadBalancerConfig.AutoScalingEnabled) {
            $this.StartAutoScaling()
        }
        
        Write-ColorOutput "Load balancer started successfully!" "Green"
    }
    
    [void]Stop() {
        Write-ColorOutput "Stopping load balancer..." "Yellow"
        
        # Stop health checking
        $this.HealthChecker.Stop()
        
        # Stop auto-scaling
        if ($Script:LoadBalancerConfig.AutoScalingEnabled) {
            $this.StopAutoScaling()
        }
        
        Write-ColorOutput "Load balancer stopped" "Yellow"
    }
    
    [void]StartAutoScaling() {
        $autoScalingJob = Start-Job -ScriptBlock {
            param($loadBalancer, $autoScaler)
            
            while ($true) {
                $autoScaler.CheckAndScale($loadBalancer.Servers)
                Start-Sleep -Seconds 30
            }
        } -ArgumentList $this, $this.AutoScaler
        
        $Script:LoadBalancerConfig.AutoScalingJob = $autoScalingJob
        Write-ColorOutput "Auto-scaling started (Job ID: $($autoScalingJob.Id))" "Green"
    }
    
    [void]StopAutoScaling() {
        if ($Script:LoadBalancerConfig.AutoScalingJob) {
            Stop-Job -Id $Script:LoadBalancerConfig.AutoScalingJob.Id
            Remove-Job -Id $Script:LoadBalancerConfig.AutoScalingJob.Id
            Write-ColorOutput "Auto-scaling stopped" "Yellow"
        }
    }
    
    [hashtable]GetStats() {
        $serverStats = @{}
        foreach ($serverId in $this.Servers.Keys) {
            $serverStats[$serverId] = $this.Servers[$serverId].GetStats()
        }
        
        $successRate = if ($this.Metrics.TotalRequests -gt 0) { 
            [math]::Round(($this.Metrics.SuccessfulRequests / $this.Metrics.TotalRequests) * 100, 2) 
        } else { 0 }
        
        return @{
            Algorithm = $this.Algorithm.Name
            TotalServers = $this.Servers.Count
            HealthyServers = ($this.Servers.Values | Where-Object { $_.IsHealthy }).Count
            ServerStats = $serverStats
            LoadBalancerMetrics = $this.Metrics
            SuccessRate = $successRate
            Uptime = (Get-Date) - $this.Metrics.StartTime
        }
    }
}

# AI-powered load balancing optimization
function Optimize-LoadBalancingWithAI {
    param([LoadBalancer]$loadBalancer)
    
    if (-not $Script:LoadBalancerConfig.AIEnabled) {
        return
    }
    
    try {
        Write-ColorOutput "Running AI-powered load balancing optimization..." "Cyan"
        
        $stats = $loadBalancer.GetStats()
        
        # Analyze performance patterns
        $analysis = @{
            Algorithm = $stats.Algorithm
            SuccessRate = $stats.SuccessRate
            AverageResponseTime = $stats.LoadBalancerMetrics.AverageResponseTime
            Recommendations = @()
        }
        
        # AI recommendations based on performance
        if ($stats.SuccessRate -lt 95) {
            $analysis.Recommendations += "Consider switching to least-connections algorithm"
            $analysis.Recommendations += "Check server health and connectivity"
        }
        
        if ($stats.LoadBalancerMetrics.AverageResponseTime -gt 100) {
            $analysis.Recommendations += "Consider adding more server instances"
            $analysis.Recommendations += "Optimize server response times"
        }
        
        if ($stats.HealthyServers -lt $stats.TotalServers) {
            $analysis.Recommendations += "Investigate unhealthy servers"
            $analysis.Recommendations += "Check health check configuration"
        }
        
        Write-ColorOutput "AI Load Balancing Analysis:" "Green"
        Write-ColorOutput "  Success Rate: $($analysis.SuccessRate)%" "White"
        Write-ColorOutput "  Average Response Time: $($analysis.AverageResponseTime)ms" "White"
        Write-ColorOutput "  Recommendations:" "White"
        foreach ($rec in $analysis.Recommendations) {
            Write-ColorOutput "    - $rec" "White"
        }
        
        # Predict optimal configuration
        $prediction = @{
            OptimalAlgorithm = if ($stats.SuccessRate -gt 95) { "ai-optimized" } else { "least-connections" }
            RecommendedInstances = [math]::Max($stats.HealthyServers + 1, 3)
            OptimalThresholds = @{
                ScaleUp = 75
                ScaleDown = 25
            }
        }
        
        Write-ColorOutput "AI Predictions:" "Green"
        Write-ColorOutput "  Optimal Algorithm: $($prediction.OptimalAlgorithm)" "White"
        Write-ColorOutput "  Recommended Instances: $($prediction.RecommendedInstances)" "White"
        Write-ColorOutput "  Optimal Thresholds: Up=$($prediction.OptimalThresholds.ScaleUp)%, Down=$($prediction.OptimalThresholds.ScaleDown)%" "White"
        
    } catch {
        Write-ColorOutput "Error in AI optimization: $($_.Exception.Message)" "Red"
    }
}

# Performance monitoring
function Start-LoadBalancingMonitoring {
    param([LoadBalancer]$loadBalancer)
    
    if (-not $Script:LoadBalancerConfig.MonitoringEnabled) {
        return
    }
    
    Write-ColorOutput "Starting load balancing performance monitoring..." "Cyan"
    
    $monitoringJob = Start-Job -ScriptBlock {
        param($loadBalancer)
        
        while ($true) {
            $stats = $loadBalancer.GetStats()
            
            # Log performance metrics
            $logEntry = @{
                Timestamp = Get-Date
                SuccessRate = $stats.SuccessRate
                AverageResponseTime = $stats.LoadBalancerMetrics.AverageResponseTime
                TotalRequests = $stats.LoadBalancerMetrics.TotalRequests
                HealthyServers = $stats.HealthyServers
                TotalServers = $stats.TotalServers
                Uptime = $stats.Uptime
            }
            
            $logPath = "logs/loadbalancing/performance-$(Get-Date -Format 'yyyy-MM-dd').json"
            $logEntry | ConvertTo-Json | Add-Content -Path $logPath
            
            Start-Sleep -Seconds 60
        }
    } -ArgumentList $loadBalancer
    
    return $monitoringJob
}

# Main execution
try {
    Write-ColorOutput "=== Load Balancing System v4.0 ===" "Cyan"
    Write-ColorOutput "Action: $Action" "White"
    Write-ColorOutput "Algorithm: $Algorithm" "White"
    Write-ColorOutput "Backend Servers: $($BackendServers -join ', ')" "White"
    Write-ColorOutput "Auto-scaling: $($Script:LoadBalancerConfig.AutoScalingEnabled)" "White"
    Write-ColorOutput "AI Enabled: $($Script:LoadBalancerConfig.AIEnabled)" "White"
    
    # Create load balancer
    $loadBalancer = [LoadBalancer]::new($Algorithm, $BackendServers, $MinInstances, $MaxInstances, $ScaleUpThreshold, $ScaleDownThreshold, $HealthCheckInterval)
    
    switch ($Action) {
        "setup" {
            Write-ColorOutput "Setting up load balancing system..." "Green"
            
            # Create log directory
            if (-not (Test-Path $LogPath)) {
                New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
            }
            
            # Initialize health checks for all servers
            foreach ($server in $loadBalancer.Servers.Values) {
                $server.HealthCheck()
            }
            
            Write-ColorOutput "Load balancing system setup completed!" "Green"
        }
        
        "start" {
            Write-ColorOutput "Starting load balancing system..." "Green"
            
            $loadBalancer.Start()
            
            # Start monitoring if enabled
            if ($Script:LoadBalancerConfig.MonitoringEnabled) {
                $monitoringJob = Start-LoadBalancingMonitoring -loadBalancer $loadBalancer
                Write-ColorOutput "Performance monitoring started (Job ID: $($monitoringJob.Id))" "Green"
            }
            
            # Run AI optimization if enabled
            if ($Script:LoadBalancerConfig.AIEnabled) {
                Optimize-LoadBalancingWithAI -loadBalancer $loadBalancer
            }
            
            Write-ColorOutput "Load balancing system started successfully!" "Green"
        }
        
        "test" {
            Write-ColorOutput "Testing load balancing system..." "Yellow"
            
            # Simulate requests
            $testRequests = 50
            $successfulRequests = 0
            
            for ($i = 1; $i -le $testRequests; $i++) {
                $clientIp = "192.168.1.$((Get-Random -Minimum 1 -Maximum 255))"
                $selectedServer = $loadBalancer.RouteRequest($clientIp)
                
                if ($selectedServer -ne $null) {
                    $successfulRequests++
                    Write-ColorOutput "Request $i routed to $($selectedServer.Id)" "Green"
                } else {
                    Write-ColorOutput "Request $i failed - no healthy servers" "Red"
                }
                
                Start-Sleep -Milliseconds 100
            }
            
            $successRate = [math]::Round(($successfulRequests / $testRequests) * 100, 2)
            Write-ColorOutput "Test completed: $successfulRequests/$testRequests requests successful ($successRate%)" "Green"
        }
        
        "status" {
            Write-ColorOutput "Load Balancing System Status:" "Cyan"
            $stats = $loadBalancer.GetStats()
            
            Write-ColorOutput "Overall Status:" "White"
            Write-ColorOutput "  Algorithm: $($stats.Algorithm)" "White"
            Write-ColorOutput "  Total Servers: $($stats.TotalServers)" "White"
            Write-ColorOutput "  Healthy Servers: $($stats.HealthyServers)" "White"
            Write-ColorOutput "  Success Rate: $($stats.SuccessRate)%" "White"
            Write-ColorOutput "  Average Response Time: $($stats.LoadBalancerMetrics.AverageResponseTime)ms" "White"
            Write-ColorOutput "  Total Requests: $($stats.LoadBalancerMetrics.TotalRequests)" "White"
            Write-ColorOutput "  Uptime: $($stats.Uptime)" "White"
            
            Write-ColorOutput "Server Details:" "White"
            foreach ($serverId in $stats.ServerStats.Keys) {
                $server = $stats.ServerStats[$serverId]
                $status = if ($server.IsHealthy) { "HEALTHY" } else { "UNHEALTHY" }
                Write-ColorOutput "  $($server.Id): $status (Connections: $($server.ActiveConnections), Requests: $($server.TotalRequests))" "White"
            }
        }
        
        "scale" {
            Write-ColorOutput "Manual scaling operation..." "Yellow"
            
            if ($Script:LoadBalancerConfig.AutoScalingEnabled) {
                $loadBalancer.AutoScaler.CheckAndScale($loadBalancer.Servers)
                Write-ColorOutput "Scaling check completed" "Green"
            } else {
                Write-ColorOutput "Auto-scaling is disabled" "Yellow"
            }
        }
        
        "analyze" {
            Write-ColorOutput "Analyzing load balancing performance..." "Cyan"
            
            $stats = $loadBalancer.GetStats()
            
            # Performance analysis
            $analysis = @{
                SuccessRate = $stats.SuccessRate
                Performance = if ($stats.SuccessRate -gt 95) { "Excellent" } elseif ($stats.SuccessRate -gt 85) { "Good" } elseif ($stats.SuccessRate -gt 70) { "Fair" } else { "Poor" }
                Recommendations = @()
            }
            
            if ($stats.SuccessRate -lt 90) {
                $analysis.Recommendations += "Check server health and connectivity"
                $analysis.Recommendations += "Consider adjusting load balancing algorithm"
                $analysis.Recommendations += "Review server capacity and resources"
            }
            
            if ($stats.LoadBalancerMetrics.AverageResponseTime -gt 200) {
                $analysis.Recommendations += "Optimize server response times"
                $analysis.Recommendations += "Consider adding more server instances"
                $analysis.Recommendations += "Review network latency"
            }
            
            if ($stats.HealthyServers -lt $stats.TotalServers) {
                $analysis.Recommendations += "Investigate unhealthy servers"
                $analysis.Recommendations += "Check health check configuration"
                $analysis.Recommendations += "Review server logs for errors"
            }
            
            Write-ColorOutput "Performance Analysis:" "Green"
            Write-ColorOutput "  Success Rate: $($analysis.SuccessRate)%" "White"
            Write-ColorOutput "  Performance: $($analysis.Performance)" "White"
            Write-ColorOutput "  Recommendations:" "White"
            foreach ($rec in $analysis.Recommendations) {
                Write-ColorOutput "    - $rec" "White"
            }
            
            # Run AI optimization
            if ($Script:LoadBalancerConfig.AIEnabled) {
                Optimize-LoadBalancingWithAI -loadBalancer $loadBalancer
            }
        }
        
        "monitor" {
            Write-ColorOutput "Starting real-time monitoring..." "Cyan"
            
            $loadBalancer.Start()
            
            if ($Script:LoadBalancerConfig.MonitoringEnabled) {
                $monitoringJob = Start-LoadBalancingMonitoring -loadBalancer $loadBalancer
                Write-ColorOutput "Monitoring started (Job ID: $($monitoringJob.Id))" "Green"
            }
            
            # Simulate continuous load
            Write-ColorOutput "Simulating continuous load..." "Yellow"
            for ($i = 1; $i -le 100; $i++) {
                $clientIp = "192.168.1.$((Get-Random -Minimum 1 -Maximum 255))"
                $loadBalancer.RouteRequest($clientIp)
                Start-Sleep -Milliseconds 500
            }
            
            Write-ColorOutput "Monitoring completed" "Green"
        }
        
        default {
            Write-ColorOutput "Unknown action: $Action" "Red"
            Write-ColorOutput "Available actions: setup, start, stop, status, scale, analyze, test, monitor" "Yellow"
        }
    }
    
    $Script:LoadBalancerConfig.Status = "Completed"
    
} catch {
    Write-ColorOutput "Error in Load Balancing System: $($_.Exception.Message)" "Red"
    Write-ColorOutput "Stack Trace: $($_.ScriptStackTrace)" "Red"
    $Script:LoadBalancerConfig.Status = "Error"
} finally {
    $endTime = Get-Date
    $duration = $endTime - $Script:LoadBalancerConfig.StartTime
    
    Write-ColorOutput "=== Load Balancing System v4.0 Completed ===" "Cyan"
    Write-ColorOutput "Duration: $($duration.TotalSeconds) seconds" "White"
    Write-ColorOutput "Status: $($Script:LoadBalancerConfig.Status)" "White"
}
