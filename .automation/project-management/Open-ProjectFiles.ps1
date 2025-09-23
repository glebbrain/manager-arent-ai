# FreeRPA Enterprise Project Files Management Script
# Enhanced with comprehensive file management and enterprise features

param(
    [switch]$RPA,
    [switch]$Enterprise,
    [switch]$Mobile,
    [switch]$All,
    [switch]$Core,
    [switch]$Documentation,
    [switch]$Configuration,
    [switch]$Testing,
    [switch]$Security,
    [switch]$Performance,
    [switch]$Verbose,
    [string]$Editor = "code"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "FreeRPA Project Files Management"
$Version = "1.0.0"
$LogFile = ".automation/logs/project-files-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Create logs directory if it doesn't exist
if (!(Test-Path ".automation/logs")) {
    New-Item -ItemType Directory -Path ".automation/logs" -Force | Out-Null
}

# File management results
$FileResults = @{
    "Overall" = "PENDING"
    "Files" = @()
    "Errors" = @()
    "Warnings" = @()
    "Success" = @()
}

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
    
    if ($Verbose) {
        Write-Verbose $LogEntry
    }
}

# Function to add file result
function Add-FileResult {
    param(
        [string]$File,
        [string]$Status,
        [string]$Message,
        [string]$Category = "INFO"
    )
    
    $Result = @{
        "File" = $File
        "Status" = $Status
        "Message" = $Message
        "Category" = $Category
        "Timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $FileResults.Files += $Result
    
    switch ($Status) {
        "SUCCESS" { $FileResults.Success += $Result }
        "WARNING" { $FileResults.Warnings += $Result }
        "ERROR" { $FileResults.Errors += $Result }
    }
}

# Function to open file with editor
function Open-File {
    param(
        [string]$FilePath,
        [string]$Description = ""
    )
    
    if (Test-Path $FilePath) {
        try {
            Write-Log "Opening $FilePath" "INFO"
            
            # Check if editor is available
            if (Get-Command $Editor -ErrorAction SilentlyContinue) {
                & $Editor $FilePath
                Add-FileResult $FilePath "SUCCESS" "File opened successfully" "FILE_OPEN"
            } else {
                Write-Log "Editor '$Editor' not found, trying default editor..." "WARNING"
                Start-Process $FilePath
                Add-FileResult $FilePath "SUCCESS" "File opened with default editor" "FILE_OPEN"
            }
        } catch {
            Add-FileResult $FilePath "ERROR" "Failed to open file: $($_.Exception.Message)" "FILE_OPEN"
        }
    } else {
        Add-FileResult $FilePath "WARNING" "File not found" "FILE_OPEN"
    }
}

# Function to open core project files
function Open-CoreFiles {
    Write-Log "Opening core project files..." "INFO"
    
    $CoreFiles = @(
        @{Path=".manager/IDEA.md"; Description="Project definition and architecture"},
        @{Path=".manager/TODO.md"; Description="Task management and roadmap"},
        @{Path=".manager/COMPLETED.md"; Description="Completed tasks log"},
        @{Path=".manager/ERRORS.md"; Description="Error tracking and solutions"},
        @{Path=".manager/start.md"; Description="Project startup guide"},
        @{Path="README.md"; Description="Main project documentation"},
        @{Path="cursor.json"; Description="Cursor IDE configuration"},
        @{Path="package.json"; Description="Project dependencies and scripts"}
    )
    
    foreach ($FileInfo in $CoreFiles) {
        Open-File $FileInfo.Path $FileInfo.Description
    }
}

# Function to open documentation files
function Open-DocumentationFiles {
    Write-Log "Opening documentation files..." "INFO"
    
    $DocFiles = @(
        @{Path="docs/CORE_PLATFORM.md"; Description="Core platform architecture"},
        @{Path="docs/SECURITY.md"; Description="Security implementation guide"},
        @{Path="docs/PERFORMANCE_OPTIMIZATION.md"; Description="Performance optimization guide"},
        @{Path="docs/MICROSERVICES_ARCHITECTURE.md"; Description="Microservices architecture"},
        @{Path="docs/MACHINE_LEARNING_SYSTEM.md"; Description="AI/ML system documentation"},
        @{Path="docs/MOBILE_APP_ARCHITECTURE.md"; Description="Mobile app architecture"},
        @{Path="SECURITY.md"; Description="Security policy"},
        @{Path="INSTALL.md"; Description="Installation guide"}
    )
    
    foreach ($FileInfo in $DocFiles) {
        Open-File $FileInfo.Path $FileInfo.Description
    }
}

# Function to open configuration files
function Open-ConfigurationFiles {
    Write-Log "Opening configuration files..." "INFO"
    
    $ConfigFiles = @(
        @{Path="next.config.mjs"; Description="Next.js configuration"},
        @{Path="tsconfig.json"; Description="TypeScript configuration"},
        @{Path="tailwind.config.ts"; Description="Tailwind CSS configuration"},
        @{Path="jest.config.ts"; Description="Jest testing configuration"},
        @{Path="playwright.config.ts"; Description="Playwright E2E testing configuration"},
        @{Path="docker-compose.yml"; Description="Docker Compose configuration"},
        @{Path=".env.example"; Description="Environment variables template"},
        @{Path="prisma/schema.prisma"; Description="Database schema"}
    )
    
    foreach ($FileInfo in $ConfigFiles) {
        Open-File $FileInfo.Path $FileInfo.Description
    }
}

# Function to open RPA specific files
function Open-RPAFiles {
    Write-Log "Opening RPA specific files..." "INFO"
    
    $RPAFiles = @(
        @{Path="src/lib/modules/rpa/"; Description="RPA modules directory"},
        @{Path="src/lib/core/rpa/"; Description="RPA core services"},
        @{Path="docs/RPA_MODULES.md"; Description="RPA modules documentation"},
        @{Path="src/app/api/rpa/"; Description="RPA API endpoints"}
    )
    
    foreach ($FileInfo in $RPAFiles) {
        Open-File $FileInfo.Path $FileInfo.Description
    }
}

# Function to open enterprise files
function Open-EnterpriseFiles {
    Write-Log "Opening enterprise files..." "INFO"
    
    $EnterpriseFiles = @(
        @{Path="src/"; Description="Main source code directory"},
        @{Path="microservices/"; Description="Microservices directory"},
        @{Path="k8s/"; Description="Kubernetes manifests"},
        @{Path="docs/MICROSERVICES_ARCHITECTURE.md"; Description="Microservices architecture"},
        @{Path="docs/SOC2_PREPARATION.md"; Description="SOC 2 compliance preparation"},
        @{Path="docs/RBAC_EVIDENCE.md"; Description="RBAC implementation evidence"},
        @{Path="monitoring/"; Description="Monitoring configuration"}
    )
    
    foreach ($FileInfo in $EnterpriseFiles) {
        Open-File $FileInfo.Path $FileInfo.Description
    }
}

# Function to open mobile files
function Open-MobileFiles {
    Write-Log "Opening mobile files..." "INFO"
    
    $MobileFiles = @(
        @{Path="mobile/"; Description="Mobile app directory"},
        @{Path="docs/MOBILE_APP_ARCHITECTURE.md"; Description="Mobile app architecture"},
        @{Path="mobile/package.json"; Description="Mobile app dependencies"},
        @{Path="mobile/App.tsx"; Description="Mobile app main component"}
    )
    
    foreach ($FileInfo in $MobileFiles) {
        Open-File $FileInfo.Path $FileInfo.Description
    }
}

# Function to open testing files
function Open-TestingFiles {
    Write-Log "Opening testing files..." "INFO"
    
    $TestingFiles = @(
        @{Path="tests/"; Description="Test files directory"},
        @{Path="e2e/"; Description="E2E test files"},
        @{Path="jest.config.ts"; Description="Jest configuration"},
        @{Path="playwright.config.ts"; Description="Playwright configuration"},
        @{Path="docs/TESTING_ANALYSIS_REPORT.md"; Description="Testing analysis report"},
        @{Path="docs/TESTING_OPTIMIZATION_GUIDE.md"; Description="Testing optimization guide"}
    )
    
    foreach ($FileInfo in $TestingFiles) {
        Open-File $FileInfo.Path $FileInfo.Description
    }
}

# Function to open security files
function Open-SecurityFiles {
    Write-Log "Opening security files..." "INFO"
    
    $SecurityFiles = @(
        @{Path="SECURITY.md"; Description="Security policy"},
        @{Path="docs/SECURITY.md"; Description="Security documentation"},
        @{Path="docs/SOC2_PREPARATION.md"; Description="SOC 2 compliance"},
        @{Path="docs/RBAC_EVIDENCE.md"; Description="RBAC implementation"},
        @{Path="docs/MFA_SSO_ENFORCEMENT.md"; Description="MFA/SSO enforcement"},
        @{Path="docs/ANTIFRAUD_SYSTEM.md"; Description="Anti-fraud system"},
        @{Path="docs/SECRET_MANAGEMENT.md"; Description="Secret management"}
    )
    
    foreach ($FileInfo in $SecurityFiles) {
        Open-File $FileInfo.Path $FileInfo.Description
    }
}

# Function to open performance files
function Open-PerformanceFiles {
    Write-Log "Opening performance files..." "INFO"
    
    $PerformanceFiles = @(
        @{Path="docs/PERFORMANCE_OPTIMIZATION.md"; Description="Performance optimization guide"},
        @{Path="docs/PERFORMANCE_TESTING_ENHANCEMENT.md"; Description="Performance testing"},
        @{Path="load-testing/"; Description="Load testing scripts"},
        @{Path="monitoring/"; Description="Monitoring configuration"},
        @{Path="docs/HPA_SETUP_GUIDE.md"; Description="HPA setup guide"},
        @{Path="docs/REDIS_CACHING.md"; Description="Redis caching documentation"}
    )
    
    foreach ($FileInfo in $PerformanceFiles) {
        Open-File $FileInfo.Path $FileInfo.Description
    }
}

# Function to generate file management report
function New-FileManagementReport {
    Write-Log "Generating file management report..." "INFO"
    
    # Calculate overall status
    if ($FileResults.Errors.Count -eq 0) {
        if ($FileResults.Warnings.Count -eq 0) {
            $FileResults.Overall = "SUCCESS"
        } else {
            $FileResults.Overall = "WARNING"
        }
    } else {
        $FileResults.Overall = "ERROR"
    }
    
    # Display summary
    Write-Log "===============================================" "INFO"
    Write-Log "File Management Summary" "INFO"
    Write-Log "===============================================" "INFO"
    Write-Log "Overall Status: $($FileResults.Overall)" $FileResults.Overall
    Write-Log "Total Files: $($FileResults.Files.Count)" "INFO"
    Write-Log "Success: $($FileResults.Success.Count)" "SUCCESS"
    Write-Log "Warnings: $($FileResults.Warnings.Count)" "WARNING"
    Write-Log "Errors: $($FileResults.Errors.Count)" "ERROR"
    Write-Log "===============================================" "INFO"
    
    # Save report to file
    $ReportFile = ".automation/logs/file-management-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $FileResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $ReportFile -Encoding UTF8
    Write-Log "Report saved to: $ReportFile" "INFO"
    
    return $FileResults.Overall
}

# Main execution
try {
    Write-Log "Starting $ScriptName v$Version" "INFO"
    Write-Log "Editor: $Editor" "INFO"
    Write-Log "Enterprise Mode: $Enterprise" "INFO"
    Write-Log "RPA Mode: $RPA" "INFO"
    Write-Log "Mobile Mode: $Mobile" "INFO"
    Write-Log "===============================================" "INFO"
    
    # Determine which files to open
    if ($All) {
        Open-CoreFiles
        Open-DocumentationFiles
        Open-ConfigurationFiles
        Open-TestingFiles
        Open-SecurityFiles
        Open-PerformanceFiles
        Open-EnterpriseFiles
        Open-RPAFiles
        Open-MobileFiles
    } else {
        if ($Core) { Open-CoreFiles }
        if ($Documentation) { Open-DocumentationFiles }
        if ($Configuration) { Open-ConfigurationFiles }
        if ($Testing) { Open-TestingFiles }
        if ($Security) { Open-SecurityFiles }
        if ($Performance) { Open-PerformanceFiles }
        if ($Enterprise) { Open-EnterpriseFiles }
        if ($RPA) { Open-RPAFiles }
        if ($Mobile) { Open-MobileFiles }
        
        # If no specific flags are set, open core files by default
        if (!$Core -and !$Documentation -and !$Configuration -and !$Testing -and !$Security -and !$Performance -and !$Enterprise -and !$RPA -and !$Mobile) {
            Open-CoreFiles
        }
    }
    
    $OverallStatus = New-FileManagementReport
    
    if ($OverallStatus -eq "ERROR") {
        Write-Log "File management completed with errors. Please check the issues and try again." "ERROR"
        exit 1
    } elseif ($OverallStatus -eq "WARNING") {
        Write-Log "File management completed with warnings. Some files may not have been opened." "WARNING"
        exit 0
    } else {
        Write-Log "File management completed successfully!" "SUCCESS"
        exit 0
    }
    
} catch {
    Write-Log "✗ File management failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Check the log file for details: $LogFile" "ERROR"
    exit 1
}