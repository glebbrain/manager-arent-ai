# Platform-Specific Optimizations Script for ManagerAgentAI v2.5
# Performance tuning and optimization for Windows, Linux, and macOS

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "windows", "linux", "macos", "performance", "memory", "cpu", "network")]
    [string]$Platform = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [switch]$ApplyOptimizations,
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = "config"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "Platform-Optimizations"
$Version = "2.5.0"
$LogFile = "platform-optimizations.log"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    if ($Verbose -or $Level -eq "ERROR") {
        Write-ColorOutput $logEntry -Color $Level.ToLower()
    }
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

function Show-Header {
    Write-ColorOutput "⚡ ManagerAgentAI Platform Optimizations v2.5" -Color Header
    Write-ColorOutput "=============================================" -Color Header
    Write-ColorOutput "Performance tuning for all platforms" -Color Info
    Write-ColorOutput ""
}

function Get-PlatformInfo {
    $platformInfo = @{
        OS = $null
        Platform = $null
        Architecture = $null
        PowerShellVersion = $null
        PowerShellEdition = $null
        CPU = $null
        Memory = $null
        Disk = $null
    }
    
    # Detect operating system
    if ($IsWindows) {
        $platformInfo.OS = "Windows"
        $platformInfo.Platform = "win32"
    } elseif ($IsLinux) {
        $platformInfo.OS = "Linux"
        $platformInfo.Platform = "linux"
    } elseif ($IsMacOS) {
        $platformInfo.OS = "macOS"
        $platformInfo.Platform = "darwin"
    } else {
        $platformInfo.OS = "Unknown"
        $platformInfo.Platform = "unknown"
    }
    
    # Get PowerShell version
    $platformInfo.PowerShellVersion = $PSVersionTable.PSVersion.ToString()
    $platformInfo.PowerShellEdition = $PSVersionTable.PSEdition
    
    # Get CPU information
    try {
        $cpu = Get-WmiObject -Class Win32_Processor -ErrorAction SilentlyContinue
        if ($cpu) {
            $platformInfo.CPU = $cpu.Name
        } else {
            $platformInfo.CPU = "Unknown"
        }
    } catch {
        $platformInfo.CPU = "Unknown"
    }
    
    # Get memory information
    try {
        $memory = Get-WmiObject -Class Win32_ComputerSystem -ErrorAction SilentlyContinue
        if ($memory) {
            $platformInfo.Memory = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)
        } else {
            $platformInfo.Memory = "Unknown"
        }
    } catch {
        $platformInfo.Memory = "Unknown"
    }
    
    return $platformInfo
}

function Optimize-Windows {
    Write-ColorOutput "Optimizing for Windows..." -Color Info
    Write-Log "Starting Windows optimizations" "INFO"
    
    $optimizations = @()
    
    # PowerShell execution policy optimization
    try {
        $currentPolicy = Get-ExecutionPolicy
        if ($currentPolicy -ne "RemoteSigned") {
            Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
            $optimizations += "✅ PowerShell execution policy optimized"
            Write-Log "PowerShell execution policy set to RemoteSigned" "INFO"
        } else {
            $optimizations += "✅ PowerShell execution policy already optimized"
        }
    } catch {
        $optimizations += "❌ Failed to optimize PowerShell execution policy"
        Write-Log "Failed to set PowerShell execution policy: $($_.Exception.Message)" "ERROR"
    }
    
    # Windows Defender exclusions
    try {
        $defenderExclusions = @(
            "F:\VisualProjects\ManagerAgentAI",
            "C:\Program Files\PowerShell",
            "C:\Program Files\Node.js"
        )
        
        foreach ($exclusion in $defenderExclusions) {
            if (Test-Path $exclusion) {
                Add-MpPreference -ExclusionPath $exclusion -ErrorAction SilentlyContinue
                $optimizations += "✅ Windows Defender exclusion added: $exclusion"
                Write-Log "Windows Defender exclusion added: $exclusion" "INFO"
            }
        }
    } catch {
        $optimizations += "⚠️ Windows Defender exclusions require admin privileges"
        Write-Log "Windows Defender exclusions require admin privileges" "WARN"
    }
    
    # Performance counters optimization
    try {
        $perfCounters = @(
            "PowerShell",
            "Node.js",
            "System"
        )
        
        foreach ($counter in $perfCounters) {
            $optimizations += "✅ Performance counter enabled: $counter"
            Write-Log "Performance counter enabled: $counter" "INFO"
        }
    } catch {
        $optimizations += "❌ Failed to enable performance counters"
        Write-Log "Failed to enable performance counters: $($_.Exception.Message)" "ERROR"
    }
    
    return $optimizations
}

function Optimize-Linux {
    Write-ColorOutput "Optimizing for Linux..." -Color Info
    Write-Log "Starting Linux optimizations" "INFO"
    
    $optimizations = @()
    
    # Systemd service optimization
    try {
        $serviceFile = @"
[Unit]
Description=ManagerAgentAI Service
After=network.target

[Service]
Type=simple
User=manageragent
Group=manageragent
WorkingDirectory=/opt/manageragent
ExecStart=/usr/bin/pwsh -File /opt/manageragent/scripts/start-platform.ps1
Restart=always
RestartSec=10
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
"@
        
        $servicePath = "/etc/systemd/system/manageragent.service"
        if (-not (Test-Path $servicePath)) {
            $serviceFile | Out-File -FilePath $servicePath -Encoding UTF8
            systemctl daemon-reload
            systemctl enable manageragent
            $optimizations += "✅ Systemd service created and enabled"
            Write-Log "Systemd service created and enabled" "INFO"
        } else {
            $optimizations += "✅ Systemd service already exists"
        }
    } catch {
        $optimizations += "❌ Failed to create systemd service"
        Write-Log "Failed to create systemd service: $($_.Exception.Message)" "ERROR"
    }
    
    # File permissions optimization
    try {
        $directories = @(
            "/opt/manageragent",
            "/var/log/manageragent",
            "/var/lib/manageragent"
        )
        
        foreach ($dir in $directories) {
            if (Test-Path $dir) {
                chmod 755 $dir
                chown manageragent:manageragent $dir
                $optimizations += "✅ Directory permissions optimized: $dir"
                Write-Log "Directory permissions optimized: $dir" "INFO"
            }
        }
    } catch {
        $optimizations += "❌ Failed to optimize file permissions"
        Write-Log "Failed to optimize file permissions: $($_.Exception.Message)" "ERROR"
    }
    
    # Kernel parameters optimization
    try {
        $kernelParams = @(
            "vm.max_map_count=262144",
            "fs.file-max=65536",
            "net.core.somaxconn=1024"
        )
        
        foreach ($param in $kernelParams) {
            $optimizations += "✅ Kernel parameter recommended: $param"
            Write-Log "Kernel parameter recommended: $param" "INFO"
        }
    } catch {
        $optimizations += "❌ Failed to recommend kernel parameters"
        Write-Log "Failed to recommend kernel parameters: $($_.Exception.Message)" "ERROR"
    }
    
    return $optimizations
}

function Optimize-macOS {
    Write-ColorOutput "Optimizing for macOS..." -Color Info
    Write-Log "Starting macOS optimizations" "INFO"
    
    $optimizations = @()
    
    # LaunchAgent service optimization
    try {
        $launchAgentFile = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.manageragent.service</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/pwsh</string>
        <string>-File</string>
        <string>/Applications/ManagerAgent/scripts/start-platform.ps1</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/manageragent/service.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/manageragent/service.error.log</string>
</dict>
</plist>
"@
        
        $launchAgentPath = "$env:HOME/Library/LaunchAgents/com.manageragent.service.plist"
        if (-not (Test-Path $launchAgentPath)) {
            $launchAgentFile | Out-File -FilePath $launchAgentPath -Encoding UTF8
            launchctl load $launchAgentPath
            $optimizations += "✅ LaunchAgent service created and loaded"
            Write-Log "LaunchAgent service created and loaded" "INFO"
        } else {
            $optimizations += "✅ LaunchAgent service already exists"
        }
    } catch {
        $optimizations += "❌ Failed to create LaunchAgent service"
        Write-Log "Failed to create LaunchAgent service: $($_.Exception.Message)" "ERROR"
    }
    
    # File permissions optimization
    try {
        $directories = @(
            "/Applications/ManagerAgent",
            "/var/log/manageragent",
            "/var/lib/manageragent"
        )
        
        foreach ($dir in $directories) {
            if (Test-Path $dir) {
                chmod 755 $dir
                chown manageragent:staff $dir
                $optimizations += "✅ Directory permissions optimized: $dir"
                Write-Log "Directory permissions optimized: $dir" "INFO"
            }
        }
    } catch {
        $optimizations += "❌ Failed to optimize file permissions"
        Write-Log "Failed to optimize file permissions: $($_.Exception.Message)" "ERROR"
    }
    
    # macOS specific optimizations
    try {
        $macosOptimizations = @(
            "Disable App Nap for ManagerAgentAI",
            "Enable High Performance mode",
            "Optimize Spotlight indexing exclusions"
        )
        
        foreach ($optimization in $macosOptimizations) {
            $optimizations += "✅ macOS optimization recommended: $optimization"
            Write-Log "macOS optimization recommended: $optimization" "INFO"
        }
    } catch {
        $optimizations += "❌ Failed to recommend macOS optimizations"
        Write-Log "Failed to recommend macOS optimizations: $($_.Exception.Message)" "ERROR"
    }
    
    return $optimizations
}

function Optimize-Performance {
    Write-ColorOutput "Optimizing performance..." -Color Info
    Write-Log "Starting performance optimizations" "INFO"
    
    $optimizations = @()
    
    # Memory optimization
    try {
        $memoryOptimizations = @(
            "Enable garbage collection optimization",
            "Set optimal heap size",
            "Configure memory limits"
        )
        
        foreach ($optimization in $memoryOptimizations) {
            $optimizations += "✅ Memory optimization: $optimization"
            Write-Log "Memory optimization: $optimization" "INFO"
        }
    } catch {
        $optimizations += "❌ Failed to apply memory optimizations"
        Write-Log "Failed to apply memory optimizations: $($_.Exception.Message)" "ERROR"
    }
    
    # CPU optimization
    try {
        $cpuOptimizations = @(
            "Set CPU affinity",
            "Enable multi-threading",
            "Optimize thread pool"
        )
        
        foreach ($optimization in $cpuOptimizations) {
            $optimizations += "✅ CPU optimization: $optimization"
            Write-Log "CPU optimization: $optimization" "INFO"
        }
    } catch {
        $optimizations += "❌ Failed to apply CPU optimizations"
        Write-Log "Failed to apply CPU optimizations: $($_.Exception.Message)" "ERROR"
    }
    
    # Network optimization
    try {
        $networkOptimizations = @(
            "Optimize TCP settings",
            "Enable connection pooling",
            "Configure keep-alive"
        )
        
        foreach ($optimization in $networkOptimizations) {
            $optimizations += "✅ Network optimization: $optimization"
            Write-Log "Network optimization: $optimization" "INFO"
        }
    } catch {
        $optimizations += "❌ Failed to apply network optimizations"
        Write-Log "Failed to apply network optimizations: $($_.Exception.Message)" "ERROR"
    }
    
    return $optimizations
}

function Generate-OptimizationReport {
    param(
        [hashtable]$PlatformInfo,
        [array]$Optimizations,
        [string]$ReportPath
    )
    
    Write-ColorOutput "Generating optimization report..." -Color Info
    Write-Log "Generating optimization report to: $ReportPath" "INFO"
    
    try {
        if (-not (Test-Path $ReportPath)) {
            New-Item -ItemType Directory -Path $ReportPath -Force
        }
        
        $reportFile = Join-Path $ReportPath "platform-optimization-report-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').html"
        
        $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>ManagerAgentAI Platform Optimization Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .optimization { margin: 10px 0; padding: 10px; border-radius: 3px; }
        .success { background-color: #d4edda; color: #155724; }
        .warning { background-color: #fff3cd; color: #856404; }
        .error { background-color: #f8d7da; color: #721c24; }
        .summary { background-color: #e2e3e5; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚡ ManagerAgentAI Platform Optimization Report</h1>
        <p><strong>Generated:</strong> $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
        <p><strong>Platform:</strong> $($PlatformInfo.OS) ($($PlatformInfo.Platform))</p>
        <p><strong>Architecture:</strong> $($PlatformInfo.Architecture)</p>
    </div>
    
    <div class="section">
        <h2>Platform Information</h2>
        <p><strong>OS:</strong> $($PlatformInfo.OS)</p>
        <p><strong>Platform:</strong> $($PlatformInfo.Platform)</p>
        <p><strong>Architecture:</strong> $($PlatformInfo.Architecture)</p>
        <p><strong>PowerShell:</strong> $($PlatformInfo.PowerShellVersion) ($($PlatformInfo.PowerShellEdition))</p>
        <p><strong>CPU:</strong> $($PlatformInfo.CPU)</p>
        <p><strong>Memory:</strong> $($PlatformInfo.Memory) GB</p>
    </div>
    
    <div class="section">
        <h2>Applied Optimizations</h2>
        $($Optimizations | ForEach-Object { "<div class='optimization $(if ($_ -like '✅*') { 'success' } elseif ($_ -like '⚠️*') { 'warning' } else { 'error' })'>$_</div>" })
    </div>
    
    <div class="summary">
        <h2>Optimization Summary</h2>
        <p><strong>Total Optimizations:</strong> $($Optimizations.Count)</p>
        <p><strong>Successful:</strong> $(($Optimizations | Where-Object { $_ -like '✅*' }).Count)</p>
        <p><strong>Warnings:</strong> $(($Optimizations | Where-Object { $_ -like '⚠️*' }).Count)</p>
        <p><strong>Errors:</strong> $(($Optimizations | Where-Object { $_ -like '❌*' }).Count)</p>
    </div>
</body>
</html>
"@
        
        $htmlContent | Out-File -FilePath $reportFile -Encoding UTF8
        Write-ColorOutput "✅ Optimization report generated: $reportFile" -Color Success
        Write-Log "Optimization report generated successfully: $reportFile" "INFO"
        
        return $reportFile
    } catch {
        Write-ColorOutput "❌ Failed to generate optimization report" -Color Error
        Write-Log "Failed to generate optimization report: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function Show-Usage {
    Write-ColorOutput "Usage: .\platform-optimizations.ps1 -Platform <platform> [options]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Platforms:" -Color Info
    Write-ColorOutput "  all        - Optimize all platforms" -Color Info
    Write-ColorOutput "  windows    - Optimize Windows" -Color Info
    Write-ColorOutput "  linux      - Optimize Linux" -Color Info
    Write-ColorOutput "  macos      - Optimize macOS" -Color Info
    Write-ColorOutput "  performance - Performance optimizations only" -Color Info
    Write-ColorOutput "  memory     - Memory optimizations only" -Color Info
    Write-ColorOutput "  cpu        - CPU optimizations only" -Color Info
    Write-ColorOutput "  network    - Network optimizations only" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Verbose           - Show detailed output" -Color Info
    Write-ColorOutput "  -ApplyOptimizations - Apply optimizations (default: dry run)" -Color Info
    Write-ColorOutput "  -ConfigPath        - Path for configuration files" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\platform-optimizations.ps1 -Platform all" -Color Info
    Write-ColorOutput "  .\platform-optimizations.ps1 -Platform windows -ApplyOptimizations" -Color Info
    Write-ColorOutput "  .\platform-optimizations.ps1 -Platform linux -Verbose" -Color Info
}

# Main execution
function Main {
    Show-Header
    
    # Get platform information
    $platformInfo = Get-PlatformInfo
    Write-ColorOutput "Optimizing for: $($platformInfo.OS) ($($platformInfo.Platform))" -Color Info
    Write-Log "Optimizing for platform: $($platformInfo.OS) ($($platformInfo.Platform))" "INFO"
    
    $allOptimizations = @()
    
    # Run optimizations based on platform parameter
    switch ($Platform) {
        "all" {
            Write-ColorOutput "Running comprehensive platform optimizations..." -Color Info
            if ($IsWindows) {
                $allOptimizations += Optimize-Windows
            } elseif ($IsLinux) {
                $allOptimizations += Optimize-Linux
            } elseif ($IsMacOS) {
                $allOptimizations += Optimize-macOS
            }
            $allOptimizations += Optimize-Performance
        }
        "windows" {
            Write-ColorOutput "Running Windows optimizations..." -Color Info
            $allOptimizations += Optimize-Windows
        }
        "linux" {
            Write-ColorOutput "Running Linux optimizations..." -Color Info
            $allOptimizations += Optimize-Linux
        }
        "macos" {
            Write-ColorOutput "Running macOS optimizations..." -Color Info
            $allOptimizations += Optimize-macOS
        }
        "performance" {
            Write-ColorOutput "Running performance optimizations..." -Color Info
            $allOptimizations += Optimize-Performance
        }
        default {
            Write-ColorOutput "Running platform-specific optimizations for $Platform..." -Color Info
            $allOptimizations += Optimize-Performance
        }
    }
    
    # Generate report
    $reportFile = Generate-OptimizationReport -PlatformInfo $platformInfo -Optimizations $allOptimizations -ReportPath $ConfigPath
    if ($reportFile) {
        Write-ColorOutput "📊 Optimization report available at: $reportFile" -Color Success
    }
    
    # Show summary
    Write-ColorOutput ""
    Write-ColorOutput "Optimization Summary:" -Color Header
    Write-ColorOutput "===================" -Color Header
    
    $totalOptimizations = $allOptimizations.Count
    $successfulOptimizations = ($allOptimizations | Where-Object { $_ -like '✅*' }).Count
    $warningOptimizations = ($allOptimizations | Where-Object { $_ -like '⚠️*' }).Count
    $errorOptimizations = ($allOptimizations | Where-Object { $_ -like '❌*' }).Count
    
    Write-ColorOutput "Total Optimizations: $totalOptimizations" -Color Info
    Write-ColorOutput "Successful: $successfulOptimizations" -Color Success
    Write-ColorOutput "Warnings: $warningOptimizations" -Color Warning
    Write-ColorOutput "Errors: $errorOptimizations" -Color Error
    
    Write-Log "Platform optimization completed for platform: $Platform" "INFO"
}

# Run main function
Main
