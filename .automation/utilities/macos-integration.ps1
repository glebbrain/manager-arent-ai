# macOS Integration Script for ManagerAgentAI v2.5
# NSAccessibility implementation and macOS-specific features

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "accessibility", "permissions", "services", "notifications", "ui", "testing")]
    [string]$Feature = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport,
    
    [Parameter(Mandatory=$false)]
    [string]$ReportPath = "macos-integration-reports"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "macOS-Integration"
$Version = "2.5.0"
$LogFile = "macos-integration.log"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "DEBUG")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    Add-Content -Path $LogFile -Value $logEntry
    
    if ($Verbose -or $Level -eq "ERROR" -or $Level -eq "WARN") {
        Write-Host $logEntry
    }
}

function Initialize-Logging {
    Write-ColorOutput "Initializing macOS Integration Script v$Version" -Color Header
    Write-Log "macOS Integration Script started" "INFO"
}

function Test-macOSCompatibility {
    Write-ColorOutput "Testing macOS compatibility..." -Color Info
    Write-Log "Testing macOS compatibility" "INFO"
    
    $compatibility = @{
        OSVersion = $null
        Architecture = $null
        PowerShellVersion = $null
        AccessibilitySupport = $false
        PermissionsGranted = $false
        ServicesAvailable = $false
    }
    
    try {
        # Check macOS version
        $osVersion = sw_vers -productVersion
        $compatibility.OSVersion = $osVersion
        Write-ColorOutput "✅ macOS Version: $osVersion" -Color Success
        Write-Log "macOS Version: $osVersion" "INFO"
        
        # Check architecture
        $arch = uname -m
        $compatibility.Architecture = $arch
        Write-ColorOutput "✅ Architecture: $arch" -Color Success
        Write-Log "Architecture: $arch" "INFO"
        
        # Check PowerShell version
        $psVersion = $PSVersionTable.PSVersion.ToString()
        $compatibility.PowerShellVersion = $psVersion
        Write-ColorOutput "✅ PowerShell Version: $psVersion" -Color Success
        Write-Log "PowerShell Version: $psVersion" "INFO"
        
        # Check if running on macOS
        if ($IsMacOS -or $env:OS -eq "Darwin") {
            Write-ColorOutput "✅ Running on macOS" -Color Success
            Write-Log "Running on macOS" "INFO"
        } else {
            Write-ColorOutput "⚠️ Not running on macOS - some features may not work" -Color Warning
            Write-Log "Not running on macOS - some features may not work" "WARN"
        }
        
    } catch {
        Write-ColorOutput "❌ Error checking macOS compatibility: $($_.Exception.Message)" -Color Error
        Write-Log "Error checking macOS compatibility: $($_.Exception.Message)" "ERROR"
    }
    
    return $compatibility
}

function Test-AccessibilityPermissions {
    Write-ColorOutput "Testing accessibility permissions..." -Color Info
    Write-Log "Testing accessibility permissions" "INFO"
    
    $permissions = @{
        AccessibilityEnabled = $false
        ScreenRecordingEnabled = $false
        InputMonitoringEnabled = $false
        FullDiskAccessEnabled = $false
        AutomationEnabled = $false
    }
    
    try {
        # Check accessibility permissions
        $accessibilityCheck = osascript -e 'tell application "System Events" to get accessibility enabled'
        if ($accessibilityCheck -eq "true") {
            $permissions.AccessibilityEnabled = $true
            Write-ColorOutput "✅ Accessibility permissions granted" -Color Success
            Write-Log "Accessibility permissions granted" "INFO"
        } else {
            Write-ColorOutput "⚠️ Accessibility permissions not granted" -Color Warning
            Write-Log "Accessibility permissions not granted" "WARN"
        }
        
        # Check screen recording permissions
        $screenRecordingCheck = osascript -e 'tell application "System Events" to get screen recording enabled'
        if ($screenRecordingCheck -eq "true") {
            $permissions.ScreenRecordingEnabled = $true
            Write-ColorOutput "✅ Screen recording permissions granted" -Color Success
            Write-Log "Screen recording permissions granted" "INFO"
        } else {
            Write-ColorOutput "⚠️ Screen recording permissions not granted" -Color Warning
            Write-Log "Screen recording permissions not granted" "WARN"
        }
        
        # Check input monitoring permissions
        $inputMonitoringCheck = osascript -e 'tell application "System Events" to get input monitoring enabled'
        if ($inputMonitoringCheck -eq "true") {
            $permissions.InputMonitoringEnabled = $true
            Write-ColorOutput "✅ Input monitoring permissions granted" -Color Success
            Write-Log "Input monitoring permissions granted" "INFO"
        } else {
            Write-ColorOutput "⚠️ Input monitoring permissions not granted" -Color Warning
            Write-Log "Input monitoring permissions not granted" "WARN"
        }
        
    } catch {
        Write-ColorOutput "❌ Error checking permissions: $($_.Exception.Message)" -Color Error
        Write-Log "Error checking permissions: $($_.Exception.Message)" "ERROR"
    }
    
    return $permissions
}

function Install-AccessibilitySupport {
    Write-ColorOutput "Installing accessibility support..." -Color Info
    Write-Log "Installing accessibility support" "INFO"
    
    try {
        # Create accessibility support directory
        $accessibilityDir = "/opt/manageragentai/accessibility"
        if (-not (Test-Path $accessibilityDir)) {
            New-Item -ItemType Directory -Path $accessibilityDir -Force
            Write-ColorOutput "✅ Accessibility directory created: $accessibilityDir" -Color Success
            Write-Log "Accessibility directory created: $accessibilityDir" "INFO"
        }
        
        # Create NSAccessibility wrapper script
        $nsAccessibilityScript = @"
#!/bin/bash
# NSAccessibility wrapper for ManagerAgentAI

# Check if accessibility is enabled
if ! osascript -e 'tell application "System Events" to get accessibility enabled' | grep -q "true"; then
    echo "Accessibility permissions not granted. Please enable in System Preferences > Security & Privacy > Privacy > Accessibility"
    exit 1
fi

# Run the main accessibility module
python3 /opt/manageragentai/accessibility/nsaccessibility.py "$@"
"@
        
        $nsAccessibilityScript | Out-File -FilePath "$accessibilityDir/nsaccessibility.sh" -Encoding UTF8
        chmod +x "$accessibilityDir/nsaccessibility.sh"
        Write-ColorOutput "✅ NSAccessibility wrapper script created" -Color Success
        Write-Log "NSAccessibility wrapper script created" "INFO"
        
        # Create Python NSAccessibility module
        $pythonModule = @"
#!/usr/bin/env python3
"""
NSAccessibility Python module for ManagerAgentAI
Provides macOS accessibility features using PyObjC
"""

import sys
import os
from Foundation import NSWorkspace, NSRunningApplication, NSApplicationActivationPolicyRegular
from AppKit import NSWorkspace, NSRunningApplication, NSApplicationActivationPolicyRegular
from Quartz import CGWindowListCopyWindowInfo, kCGWindowListOptionOnScreenOnly, kCGNullWindowID
import subprocess
import json

class NSAccessibilityManager:
    def __init__(self):
        self.workspace = NSWorkspace.sharedWorkspace()
    
    def get_running_applications(self):
        """Get list of running applications"""
        try:
            apps = self.workspace.runningApplications()
            app_list = []
            for app in apps:
                if app.localizedName():
                    app_info = {
                        'name': str(app.localizedName()),
                        'bundle_id': str(app.bundleIdentifier()) if app.bundleIdentifier() else None,
                        'pid': app.processIdentifier(),
                        'is_active': app.isActive(),
                        'is_hidden': app.isHidden()
                    }
                    app_list.append(app_info)
            return app_list
        except Exception as e:
            print(f"Error getting running applications: {e}")
            return []
    
    def get_window_list(self):
        """Get list of windows"""
        try:
            window_list = CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly, kCGNullWindowID)
            windows = []
            for window in window_list:
                window_info = {
                    'window_id': window.get('kCGWindowNumber'),
                    'owner_name': window.get('kCGWindowOwnerName'),
                    'window_name': window.get('kCGWindowName'),
                    'bounds': window.get('kCGWindowBounds'),
                    'layer': window.get('kCGWindowLayer'),
                    'owner_pid': window.get('kCGWindowOwnerPID')
                }
                windows.append(window_info)
            return windows
        except Exception as e:
            print(f"Error getting window list: {e}")
            return []
    
    def activate_application(self, bundle_id):
        """Activate an application by bundle ID"""
        try:
            apps = self.workspace.runningApplications()
            for app in apps:
                if app.bundleIdentifier() == bundle_id:
                    app.activateWithOptions_(NSApplicationActivationPolicyRegular)
                    return True
            return False
        except Exception as e:
            print(f"Error activating application: {e}")
            return False
    
    def get_frontmost_application(self):
        """Get the frontmost application"""
        try:
            frontmost_app = self.workspace.frontmostApplication()
            if frontmost_app:
                return {
                    'name': str(frontmost_app.localizedName()),
                    'bundle_id': str(frontmost_app.bundleIdentifier()),
                    'pid': frontmost_app.processIdentifier()
                }
            return None
        except Exception as e:
            print(f"Error getting frontmost application: {e}")
            return None
    
    def simulate_click(self, x, y):
        """Simulate a click at coordinates (x, y)"""
        try:
            # Use osascript to simulate click
            script = f'tell application "System Events" to click at {{{x}, {y}}}'
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            return result.returncode == 0
        except Exception as e:
            print(f"Error simulating click: {e}")
            return False
    
    def simulate_key(self, key):
        """Simulate a key press"""
        try:
            script = f'tell application "System Events" to key code {key}'
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            return result.returncode == 0
        except Exception as e:
            print(f"Error simulating key: {e}")
            return False
    
    def get_screen_info(self):
        """Get screen information"""
        try:
            script = 'tell application "System Events" to get properties of every desktop'
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            return result.stdout.strip()
        except Exception as e:
            print(f"Error getting screen info: {e}")
            return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 nsaccessibility.py <command> [args...]")
        sys.exit(1)
    
    command = sys.argv[1]
    manager = NSAccessibilityManager()
    
    if command == "apps":
        apps = manager.get_running_applications()
        print(json.dumps(apps, indent=2))
    elif command == "windows":
        windows = manager.get_window_list()
        print(json.dumps(windows, indent=2))
    elif command == "frontmost":
        app = manager.get_frontmost_application()
        print(json.dumps(app, indent=2))
    elif command == "activate":
        if len(sys.argv) < 3:
            print("Usage: python3 nsaccessibility.py activate <bundle_id>")
            sys.exit(1)
        bundle_id = sys.argv[2]
        success = manager.activate_application(bundle_id)
        print(f"Activation successful: {success}")
    elif command == "click":
        if len(sys.argv) < 4:
            print("Usage: python3 nsaccessibility.py click <x> <y>")
            sys.exit(1)
        x, y = int(sys.argv[2]), int(sys.argv[3])
        success = manager.simulate_click(x, y)
        print(f"Click successful: {success}")
    elif command == "key":
        if len(sys.argv) < 3:
            print("Usage: python3 nsaccessibility.py key <key_code>")
            sys.exit(1)
        key_code = int(sys.argv[2])
        success = manager.simulate_key(key_code)
        print(f"Key press successful: {success}")
    elif command == "screen":
        screen_info = manager.get_screen_info()
        print(screen_info)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
"@
        
        $pythonModule | Out-File -FilePath "$accessibilityDir/nsaccessibility.py" -Encoding UTF8
        chmod +x "$accessibilityDir/nsaccessibility.py"
        Write-ColorOutput "✅ NSAccessibility Python module created" -Color Success
        Write-Log "NSAccessibility Python module created" "INFO"
        
        # Install required Python packages
        Write-ColorOutput "Installing required Python packages..." -Color Info
        Write-Log "Installing required Python packages" "INFO"
        
        $packages = @("pyobjc-framework-Cocoa", "pyobjc-framework-Quartz", "pyobjc-framework-ApplicationServices")
        foreach ($package in $packages) {
            try {
                pip3 install $package
                Write-ColorOutput "✅ Installed $package" -Color Success
                Write-Log "Installed $package" "INFO"
            } catch {
                Write-ColorOutput "⚠️ Failed to install $package: $($_.Exception.Message)" -Color Warning
                Write-Log "Failed to install $package: $($_.Exception.Message)" "WARN"
            }
        }
        
    } catch {
        Write-ColorOutput "❌ Error installing accessibility support: $($_.Exception.Message)" -Color Error
        Write-Log "Error installing accessibility support: $($_.Exception.Message)" "ERROR"
    }
}

function Test-macOSServices {
    Write-ColorOutput "Testing macOS services..." -Color Info
    Write-Log "Testing macOS services" "INFO"
    
    $services = @{
        LaunchAgent = $false
        LaunchDaemon = $false
        NotificationCenter = $false
        AccessibilityServices = $false
    }
    
    try {
        # Check LaunchAgent service
        $launchAgentPath = "$env:HOME/Library/LaunchAgents/com.manageragentai.plist"
        if (Test-Path $launchAgentPath) {
            $services.LaunchAgent = $true
            Write-ColorOutput "✅ LaunchAgent service found" -Color Success
            Write-Log "LaunchAgent service found" "INFO"
        } else {
            Write-ColorOutput "⚠️ LaunchAgent service not found" -Color Warning
            Write-Log "LaunchAgent service not found" "WARN"
        }
        
        # Check LaunchDaemon service
        $launchDaemonPath = "/Library/LaunchDaemons/com.manageragentai.plist"
        if (Test-Path $launchDaemonPath) {
            $services.LaunchDaemon = $true
            Write-ColorOutput "✅ LaunchDaemon service found" -Color Success
            Write-Log "LaunchDaemon service found" "INFO"
        } else {
            Write-ColorOutput "⚠️ LaunchDaemon service not found" -Color Warning
            Write-Log "LaunchDaemon service not found" "WARN"
        }
        
        # Check Notification Center
        $notificationCheck = osascript -e 'tell application "System Events" to get notification center enabled'
        if ($notificationCheck -eq "true") {
            $services.NotificationCenter = $true
            Write-ColorOutput "✅ Notification Center enabled" -Color Success
            Write-Log "Notification Center enabled" "INFO"
        } else {
            Write-ColorOutput "⚠️ Notification Center not enabled" -Color Warning
            Write-Log "Notification Center not enabled" "WARN"
        }
        
        # Check accessibility services
        $accessibilityServices = @("com.apple.accessibility", "com.apple.assistive")
        foreach ($service in $accessibilityServices) {
            $serviceCheck = launchctl list | Select-String $service
            if ($serviceCheck) {
                $services.AccessibilityServices = $true
                Write-ColorOutput "✅ Accessibility service $service found" -Color Success
                Write-Log "Accessibility service $service found" "INFO"
                break
            }
        }
        
    } catch {
        Write-ColorOutput "❌ Error checking macOS services: $($_.Exception.Message)" -Color Error
        Write-Log "Error checking macOS services: $($_.Exception.Message)" "ERROR"
    }
    
    return $services
}

function Install-macOSNotifications {
    Write-ColorOutput "Installing macOS notifications..." -Color Info
    Write-Log "Installing macOS notifications" "INFO"
    
    try {
        # Create notification directory
        $notificationDir = "/opt/manageragentai/notifications"
        if (-not (Test-Path $notificationDir)) {
            New-Item -ItemType Directory -Path $notificationDir -Force
            Write-ColorOutput "✅ Notification directory created: $notificationDir" -Color Success
            Write-Log "Notification directory created: $notificationDir" "INFO"
        }
        
        # Create notification script
        $notificationScript = @"
#!/bin/bash
# macOS Notification script for ManagerAgentAI

# Function to send notification
send_notification() {
    local title="$1"
    local message="$2"
    local subtitle="$3"
    
    osascript -e "display notification \"$message\" with title \"$title\" subtitle \"$subtitle\""
}

# Function to send alert
send_alert() {
    local title="$1"
    local message="$2"
    
    osascript -e "display alert \"$title\" message \"$message\""
}

# Main function
case "$1" in
    "notify")
        send_notification "$2" "$3" "$4"
        ;;
    "alert")
        send_alert "$2" "$3"
        ;;
    *)
        echo "Usage: $0 {notify|alert} [title] [message] [subtitle]"
        exit 1
        ;;
esac
"@
        
        $notificationScript | Out-File -FilePath "$notificationDir/macos-notify.sh" -Encoding UTF8
        chmod +x "$notificationDir/macos-notify.sh"
        Write-ColorOutput "✅ macOS notification script created" -Color Success
        Write-Log "macOS notification script created" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Error installing macOS notifications: $($_.Exception.Message)" -Color Error
        Write-Log "Error installing macOS notifications: $($_.Exception.Message)" "ERROR"
    }
}

function Test-macOSUI {
    Write-ColorOutput "Testing macOS UI integration..." -Color Info
    Write-Log "Testing macOS UI integration" "INFO"
    
    $uiTests = @{
        MenuBarSupport = $false
        DockIntegration = $false
        SpotlightIntegration = $false
        FinderIntegration = $false
    }
    
    try {
        # Test MenuBar support
        $menuBarTest = osascript -e 'tell application "System Events" to get properties of menu bar 1 of process "SystemUIServer"'
        if ($menuBarTest) {
            $uiTests.MenuBarSupport = $true
            Write-ColorOutput "✅ MenuBar support available" -Color Success
            Write-Log "MenuBar support available" "INFO"
        } else {
            Write-ColorOutput "⚠️ MenuBar support not available" -Color Warning
            Write-Log "MenuBar support not available" "WARN"
        }
        
        # Test Dock integration
        $dockTest = osascript -e 'tell application "System Events" to get properties of dock'
        if ($dockTest) {
            $uiTests.DockIntegration = $true
            Write-ColorOutput "✅ Dock integration available" -Color Success
            Write-Log "Dock integration available" "INFO"
        } else {
            Write-ColorOutput "⚠️ Dock integration not available" -Color Warning
            Write-Log "Dock integration not available" "WARN"
        }
        
        # Test Spotlight integration
        $spotlightTest = osascript -e 'tell application "System Events" to get properties of process "Spotlight"'
        if ($spotlightTest) {
            $uiTests.SpotlightIntegration = $true
            Write-ColorOutput "✅ Spotlight integration available" -Color Success
            Write-Log "Spotlight integration available" "INFO"
        } else {
            Write-ColorOutput "⚠️ Spotlight integration not available" -Color Warning
            Write-Log "Spotlight integration not available" "WARN"
        }
        
        # Test Finder integration
        $finderTest = osascript -e 'tell application "System Events" to get properties of process "Finder"'
        if ($finderTest) {
            $uiTests.FinderIntegration = $true
            Write-ColorOutput "✅ Finder integration available" -Color Success
            Write-Log "Finder integration available" "INFO"
        } else {
            Write-ColorOutput "⚠️ Finder integration not available" -Color Warning
            Write-Log "Finder integration not available" "WARN"
        }
        
    } catch {
        Write-ColorOutput "❌ Error testing macOS UI: $($_.Exception.Message)" -Color Error
        Write-Log "Error testing macOS UI: $($_.Exception.Message)" "ERROR"
    }
    
    return $uiTests
}

function Generate-macOSReport {
    param(
        [hashtable]$CompatibilityResults,
        [hashtable]$PermissionResults,
        [hashtable]$ServiceResults,
        [hashtable]$UITestResults,
        [string]$ReportPath
    )
    
    Write-ColorOutput "Generating macOS integration report..." -Color Info
    Write-Log "Generating macOS integration report" "INFO"
    
    try {
        # Create report directory
        if (-not (Test-Path $ReportPath)) {
            New-Item -ItemType Directory -Path $ReportPath -Force
        }
        
        $reportFile = Join-Path $ReportPath "macos-integration-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
        
        $htmlReport = @"
<!DOCTYPE html>
<html>
<head>
    <title>macOS Integration Report - ManagerAgentAI v$Version</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        .info { color: blue; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>macOS Integration Report</h1>
        <p><strong>ManagerAgentAI v$Version</strong></p>
        <p>Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
    </div>
    
    <div class="section">
        <h2>System Compatibility</h2>
        <table>
            <tr><th>Component</th><th>Status</th><th>Value</th></tr>
            <tr><td>macOS Version</td><td class="success">✅</td><td>$($CompatibilityResults.OSVersion)</td></tr>
            <tr><td>Architecture</td><td class="success">✅</td><td>$($CompatibilityResults.Architecture)</td></tr>
            <tr><td>PowerShell Version</td><td class="success">✅</td><td>$($CompatibilityResults.PowerShellVersion)</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Permissions</h2>
        <table>
            <tr><th>Permission</th><th>Status</th></tr>
            <tr><td>Accessibility</td><td class="$(if ($PermissionResults.AccessibilityEnabled) { 'success' } else { 'warning' })">$(if ($PermissionResults.AccessibilityEnabled) { '✅ Granted' } else { '⚠️ Not Granted' })</td></tr>
            <tr><td>Screen Recording</td><td class="$(if ($PermissionResults.ScreenRecordingEnabled) { 'success' } else { 'warning' })">$(if ($PermissionResults.ScreenRecordingEnabled) { '✅ Granted' } else { '⚠️ Not Granted' })</td></tr>
            <tr><td>Input Monitoring</td><td class="$(if ($PermissionResults.InputMonitoringEnabled) { 'success' } else { 'warning' })">$(if ($PermissionResults.InputMonitoringEnabled) { '✅ Granted' } else { '⚠️ Not Granted' })</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Services</h2>
        <table>
            <tr><th>Service</th><th>Status</th></tr>
            <tr><td>LaunchAgent</td><td class="$(if ($ServiceResults.LaunchAgent) { 'success' } else { 'warning' })">$(if ($ServiceResults.LaunchAgent) { '✅ Available' } else { '⚠️ Not Available' })</td></tr>
            <tr><td>LaunchDaemon</td><td class="$(if ($ServiceResults.LaunchDaemon) { 'success' } else { 'warning' })">$(if ($ServiceResults.LaunchDaemon) { '✅ Available' } else { '⚠️ Not Available' })</td></tr>
            <tr><td>Notification Center</td><td class="$(if ($ServiceResults.NotificationCenter) { 'success' } else { 'warning' })">$(if ($ServiceResults.NotificationCenter) { '✅ Enabled' } else { '⚠️ Not Enabled' })</td></tr>
            <tr><td>Accessibility Services</td><td class="$(if ($ServiceResults.AccessibilityServices) { 'success' } else { 'warning' })">$(if ($ServiceResults.AccessibilityServices) { '✅ Available' } else { '⚠️ Not Available' })</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>UI Integration</h2>
        <table>
            <tr><th>Feature</th><th>Status</th></tr>
            <tr><td>MenuBar Support</td><td class="$(if ($UITestResults.MenuBarSupport) { 'success' } else { 'warning' })">$(if ($UITestResults.MenuBarSupport) { '✅ Available' } else { '⚠️ Not Available' })</td></tr>
            <tr><td>Dock Integration</td><td class="$(if ($UITestResults.DockIntegration) { 'success' } else { 'warning' })">$(if ($UITestResults.DockIntegration) { '✅ Available' } else { '⚠️ Not Available' })</td></tr>
            <tr><td>Spotlight Integration</td><td class="$(if ($UITestResults.SpotlightIntegration) { 'success' } else { 'warning' })">$(if ($UITestResults.SpotlightIntegration) { '✅ Available' } else { '⚠️ Not Available' })</td></tr>
            <tr><td>Finder Integration</td><td class="$(if ($UITestResults.FinderIntegration) { 'success' } else { 'warning' })">$(if ($UITestResults.FinderIntegration) { '✅ Available' } else { '⚠️ Not Available' })</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Ensure all required permissions are granted in System Preferences > Security & Privacy > Privacy</li>
            <li>Install required Python packages for NSAccessibility support</li>
            <li>Configure LaunchAgent service for automatic startup</li>
            <li>Test accessibility features with actual applications</li>
        </ul>
    </div>
</body>
</html>
"@
        
        $htmlReport | Out-File -FilePath $reportFile -Encoding UTF8
        Write-ColorOutput "✅ macOS integration report generated: $reportFile" -Color Success
        Write-Log "macOS integration report generated: $reportFile" "INFO"
        
        return $reportFile
        
    } catch {
        Write-ColorOutput "❌ Error generating macOS report: $($_.Exception.Message)" -Color Error
        Write-Log "Error generating macOS report: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function Show-Usage {
    Write-ColorOutput "macOS Integration Script for ManagerAgentAI v$Version" -Color Info
    Write-ColorOutput "=================================================" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\macos-integration.ps1 [OPTIONS]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Feature <string>    Feature to test/install (all, accessibility, permissions, services, notifications, ui, testing)" -Color Info
    Write-ColorOutput "  -Verbose            Enable verbose output" -Color Info
    Write-ColorOutput "  -GenerateReport     Generate HTML report" -Color Info
    Write-ColorOutput "  -ReportPath <string> Path for report output (default: macos-integration-reports)" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\macos-integration.ps1 -Feature all" -Color Info
    Write-ColorOutput "  .\macos-integration.ps1 -Feature accessibility -Verbose" -Color Info
    Write-ColorOutput "  .\macos-integration.ps1 -Feature permissions -GenerateReport" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Available Features:" -Color Info
    Write-ColorOutput "  all           - Test all features" -Color Info
    Write-ColorOutput "  accessibility - Test and install accessibility support" -Color Info
    Write-ColorOutput "  permissions   - Test macOS permissions" -Color Info
    Write-ColorOutput "  services      - Test macOS services" -Color Info
    Write-ColorOutput "  notifications - Install notification support" -Color Info
    Write-ColorOutput "  ui            - Test UI integration" -Color Info
    Write-ColorOutput "  testing       - Run comprehensive tests" -Color Info
}

function Main {
    # Initialize logging
    Initialize-Logging
    
    Write-ColorOutput "macOS Integration Script v$Version" -Color Header
    Write-ColorOutput "=================================" -Color Header
    Write-ColorOutput "Feature: $Feature" -Color Info
    Write-ColorOutput "Verbose: $Verbose" -Color Info
    Write-ColorOutput "Generate Report: $GenerateReport" -Color Info
    Write-ColorOutput "Report Path: $ReportPath" -Color Info
    Write-ColorOutput ""
    
    try {
        $results = @{}
        
        switch ($Feature.ToLower()) {
            "all" {
                Write-ColorOutput "Running all macOS integration tests..." -Color Info
                Write-Log "Running all macOS integration tests" "INFO"
                
                $results.Compatibility = Test-macOSCompatibility
                $results.Permissions = Test-AccessibilityPermissions
                $results.Services = Test-macOSServices
                $results.UI = Test-macOSUI
                
                Install-AccessibilitySupport
                Install-macOSNotifications
            }
            
            "accessibility" {
                Write-ColorOutput "Testing and installing accessibility support..." -Color Info
                Write-Log "Testing and installing accessibility support" "INFO"
                
                $results.Compatibility = Test-macOSCompatibility
                $results.Permissions = Test-AccessibilityPermissions
                Install-AccessibilitySupport
            }
            
            "permissions" {
                Write-ColorOutput "Testing macOS permissions..." -Color Info
                Write-Log "Testing macOS permissions" "INFO"
                
                $results.Permissions = Test-AccessibilityPermissions
            }
            
            "services" {
                Write-ColorOutput "Testing macOS services..." -Color Info
                Write-Log "Testing macOS services" "INFO"
                
                $results.Services = Test-macOSServices
            }
            
            "notifications" {
                Write-ColorOutput "Installing notification support..." -Color Info
                Write-Log "Installing notification support" "INFO"
                
                Install-macOSNotifications
            }
            
            "ui" {
                Write-ColorOutput "Testing UI integration..." -Color Info
                Write-Log "Testing UI integration" "INFO"
                
                $results.UI = Test-macOSUI
            }
            
            "testing" {
                Write-ColorOutput "Running comprehensive tests..." -Color Info
                Write-Log "Running comprehensive tests" "INFO"
                
                $results.Compatibility = Test-macOSCompatibility
                $results.Permissions = Test-AccessibilityPermissions
                $results.Services = Test-macOSServices
                $results.UI = Test-macOSUI
            }
            
            default {
                Write-ColorOutput "Unknown feature: $Feature" -Color Error
                Write-Log "Unknown feature: $Feature" "ERROR"
                Show-Usage
                return
            }
        }
        
        # Generate report if requested
        if ($GenerateReport) {
            $reportFile = Generate-macOSReport -CompatibilityResults $results.Compatibility -PermissionResults $results.Permissions -ServiceResults $results.Services -UITestResults $results.UI -ReportPath $ReportPath
            if ($reportFile) {
                Write-ColorOutput "📊 macOS integration report available at: $reportFile" -Color Success
            }
        }
        
        # Show summary
        Write-ColorOutput ""
        Write-ColorOutput "macOS Integration Summary:" -Color Header
        Write-ColorOutput "=========================" -Color Header
        
        if ($results.Compatibility) {
            Write-ColorOutput "System: $($results.Compatibility.OSVersion) ($($results.Compatibility.Architecture))" -Color Info
        }
        
        if ($results.Permissions) {
            $grantedPermissions = ($results.Permissions.Values | Where-Object { $_ -eq $true }).Count
            $totalPermissions = $results.Permissions.Count
            Write-ColorOutput "Permissions: $grantedPermissions/$totalPermissions granted" -Color $(if ($grantedPermissions -eq $totalPermissions) { "Success" } else { "Warning" })
        }
        
        if ($results.Services) {
            $availableServices = ($results.Services.Values | Where-Object { $_ -eq $true }).Count
            $totalServices = $results.Services.Count
            Write-ColorOutput "Services: $availableServices/$totalServices available" -Color $(if ($availableServices -gt 0) { "Success" } else { "Warning" })
        }
        
        if ($results.UI) {
            $availableUIFeatures = ($results.UI.Values | Where-Object { $_ -eq $true }).Count
            $totalUIFeatures = $results.UI.Count
            Write-ColorOutput "UI Features: $availableUIFeatures/$totalUIFeatures available" -Color $(if ($availableUIFeatures -gt 0) { "Success" } else { "Warning" })
        }
        
        Write-ColorOutput ""
        Write-ColorOutput "macOS integration completed successfully!" -Color Success
        Write-Log "macOS integration completed successfully" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Error: $($_.Exception.Message)" -Color Error
        Write-Log "Error: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Main execution
if ($MyInvocation.InvocationName -ne '.') {
    Main
}
