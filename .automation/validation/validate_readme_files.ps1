# FreeRPA Enterprise README Files Validation Script
# Enhanced with comprehensive documentation validation and enterprise standards

param(
    [switch]$Detailed,
    [switch]$Enterprise,
    [switch]$Compliance,
    [switch]$Verbose,
    [string]$OutputFormat = "console"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "FreeRPA README Validation"
$Version = "1.0.0"
$LogFile = ".automation/logs/readme-validation-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Create logs directory if it doesn't exist
if (!(Test-Path ".automation/logs")) {
    New-Item -ItemType Directory -Path ".automation/logs" -Force | Out-Null
}

# Validation results
$ValidationResults = @{
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

# Function to add validation result
function Add-ValidationResult {
    param(
        [string]$File,
        [string]$Check,
        [string]$Status,
        [string]$Message,
        [string]$Category = "INFO"
    )
    
    $Result = @{
        "File" = $File
        "Check" = $Check
        "Status" = $Status
        "Message" = $Message
        "Category" = $Category
        "Timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $ValidationResults.Files += $Result
    
    switch ($Status) {
        "SUCCESS" { $ValidationResults.Success += $Result }
        "WARNING" { $ValidationResults.Warnings += $Result }
        "ERROR" { $ValidationResults.Errors += $Result }
    }
}

# Function to validate README structure
function Test-ReadmeStructure {
    param(
        [string]$FilePath,
        [string]$Content
    )
    
    $FileName = Split-Path $FilePath -Leaf
    
    # Check for required sections
    $RequiredSections = @(
        @{Pattern="# .*"; Name="Main Title"; Required=$true},
        @{Pattern="## .*"; Name="Section Headers"; Required=$true},
        @{Pattern="### .*"; Name="Subsections"; Required=$false},
        @{Pattern="```"; Name="Code Blocks"; Required=$false}
    )
    
    foreach ($Section in $RequiredSections) {
        if ($Content -match $Section.Pattern) {
            $MatchCount = ([regex]::Matches($Content, $Section.Pattern)).Count
            if ($Section.Required) {
                Add-ValidationResult $FilePath "Structure: $($Section.Name)" "SUCCESS" "Found $MatchCount instances" "STRUCTURE"
            } else {
                Add-ValidationResult $FilePath "Structure: $($Section.Name)" "SUCCESS" "Found $MatchCount instances" "STRUCTURE"
            }
        } else {
            if ($Section.Required) {
                Add-ValidationResult $FilePath "Structure: $($Section.Name)" "ERROR" "Required section missing" "STRUCTURE"
            } else {
                Add-ValidationResult $FilePath "Structure: $($Section.Name)" "WARNING" "Optional section missing" "STRUCTURE"
            }
        }
    }
}

# Function to validate enterprise documentation standards
function Test-EnterpriseStandards {
    param(
        [string]$FilePath,
        [string]$Content
    )
    
    if (!$Enterprise) {
        return
    }
    
    $FileName = Split-Path $FilePath -Leaf
    
    # Check for enterprise-specific content
    $EnterpriseChecks = @(
        @{Pattern="Enterprise|enterprise"; Name="Enterprise References"; Required=$true},
        @{Pattern="Security|security"; Name="Security Documentation"; Required=$true},
        @{Pattern="API|api"; Name="API Documentation"; Required=$true},
        @{Pattern="Testing|test"; Name="Testing Information"; Required=$true},
        @{Pattern="Deployment|deploy"; Name="Deployment Instructions"; Required=$true}
    )
    
    foreach ($Check in $EnterpriseChecks) {
        if ($Content -match $Check.Pattern) {
            Add-ValidationResult $FilePath "Enterprise: $($Check.Name)" "SUCCESS" "Enterprise content found" "ENTERPRISE"
        } else {
            if ($Check.Required) {
                Add-ValidationResult $FilePath "Enterprise: $($Check.Name)" "WARNING" "Enterprise content missing" "ENTERPRISE"
            }
        }
    }
}

# Function to validate compliance requirements
function Test-ComplianceRequirements {
    param(
        [string]$FilePath,
        [string]$Content
    )
    
    if (!$Compliance) {
        return
    }
    
    $FileName = Split-Path $FilePath -Leaf
    
    # Check for compliance-related content
    $ComplianceChecks = @(
        @{Pattern="SOC 2|SOC2"; Name="SOC 2 Compliance"; Required=$false},
        @{Pattern="GDPR|gdpr"; Name="GDPR Compliance"; Required=$false},
        @{Pattern="License|license"; Name="License Information"; Required=$true},
        @{Pattern="Security|security"; Name="Security Policy"; Required=$true}
    )
    
    foreach ($Check in $ComplianceChecks) {
        if ($Content -match $Check.Pattern) {
            Add-ValidationResult $FilePath "Compliance: $($Check.Name)" "SUCCESS" "Compliance content found" "COMPLIANCE"
        } else {
            if ($Check.Required) {
                Add-ValidationResult $FilePath "Compliance: $($Check.Name)" "WARNING" "Compliance content missing" "COMPLIANCE"
            }
        }
    }
}

# Function to validate file quality
function Test-FileQuality {
    param(
        [string]$FilePath,
        [string]$Content
    )
    
    $FileName = Split-Path $FilePath -Leaf
    $LineCount = ($Content -split "`n").Count
    $WordCount = ($Content -split "\s+" | Where-Object { $_ -ne "" }).Count
    
    # Check file size
    if ($LineCount -lt 10) {
        Add-ValidationResult $FilePath "Quality: File Size" "WARNING" "File is very short ($LineCount lines)" "QUALITY"
    } elseif ($LineCount -gt 1000) {
        Add-ValidationResult $FilePath "Quality: File Size" "WARNING" "File is very long ($LineCount lines)" "QUALITY"
    } else {
        Add-ValidationResult $FilePath "Quality: File Size" "SUCCESS" "Appropriate file size ($LineCount lines)" "QUALITY"
    }
    
    # Check for broken links
    $LinkPattern = "\[([^\]]+)\]\(([^)]+)\)"
    $Links = [regex]::Matches($Content, $LinkPattern)
    
    if ($Links.Count -gt 0) {
        Add-ValidationResult $FilePath "Quality: Links" "SUCCESS" "Found $($Links.Count) markdown links" "QUALITY"
        
        # Check for broken internal links
        foreach ($Link in $Links) {
            $LinkPath = $Link.Groups[2].Value
            if ($LinkPath -notmatch "^https?://" -and $LinkPath -notmatch "^#") {
                # Internal link - check if file exists
                $FullPath = Join-Path (Split-Path $FilePath -Parent) $LinkPath
                if (!(Test-Path $FullPath)) {
                    Add-ValidationResult $FilePath "Quality: Broken Link" "WARNING" "Broken internal link: $LinkPath" "QUALITY"
                }
            }
        }
    }
    
    # Check for images
    $ImagePattern = "!\[([^\]]*)\]\(([^)]+)\)"
    $Images = [regex]::Matches($Content, $ImagePattern)
    
    if ($Images.Count -gt 0) {
        Add-ValidationResult $FilePath "Quality: Images" "SUCCESS" "Found $($Images.Count) images" "QUALITY"
    }
}

# Main validation function
function Start-ReadmeValidation {
    Write-Log "Starting $ScriptName v$Version" "INFO"
    Write-Log "Enterprise Mode: $Enterprise" "INFO"
    Write-Log "Compliance Check: $Compliance" "INFO"
    Write-Log "Detailed Mode: $Detailed" "INFO"
    Write-Log "===============================================" "INFO"
    
    # Define files to validate
    $ReadmeFiles = @(
        @{Path="README.md"; Name="Main README"; Critical=$true},
        @{Path=".manager/README.md"; Name="Manager README"; Critical=$true},
        @{Path=".automation/README.md"; Name="Automation README"; Critical=$true},
        @{Path=".manager/start.md"; Name="Start Guide"; Critical=$false},
        @{Path="SECURITY.md"; Name="Security Policy"; Critical=$false},
        @{Path="docs/CORE_PLATFORM.md"; Name="Core Platform Docs"; Critical=$false}
    )
    
    foreach ($FileInfo in $ReadmeFiles) {
        $FilePath = $FileInfo.Path
        $FileName = $FileInfo.Name
        $IsCritical = $FileInfo.Critical
        
        Write-Log "Validating $FileName..." "INFO"
        
        if (Test-Path $FilePath) {
            try {
                $Content = Get-Content $FilePath -Raw -Encoding UTF8
                $LineCount = ($Content -split "`n").Count
                
                Add-ValidationResult $FilePath "File Exists" "SUCCESS" "File found with $LineCount lines" "BASIC"
                
                # Run validation checks
                Test-ReadmeStructure $FilePath $Content
                Test-FileQuality $FilePath $Content
                
                if ($Enterprise) {
                    Test-EnterpriseStandards $FilePath $Content
                }
                
                if ($Compliance) {
                    Test-ComplianceRequirements $FilePath $Content
                }
                
            } catch {
                Add-ValidationResult $FilePath "File Read" "ERROR" "Failed to read file: $($_.Exception.Message)" "BASIC"
            }
        } else {
            if ($IsCritical) {
                Add-ValidationResult $FilePath "File Exists" "ERROR" "Critical file missing" "BASIC"
            } else {
                Add-ValidationResult $FilePath "File Exists" "WARNING" "Optional file missing" "BASIC"
            }
        }
    }
}

# Function to generate validation report
function New-ValidationReport {
    Write-Log "Generating validation report..." "INFO"
    
    # Calculate overall status
    if ($ValidationResults.Errors.Count -eq 0) {
        if ($ValidationResults.Warnings.Count -eq 0) {
            $ValidationResults.Overall = "SUCCESS"
        } else {
            $ValidationResults.Overall = "WARNING"
        }
    } else {
        $ValidationResults.Overall = "ERROR"
    }
    
    # Display summary
    Write-Log "===============================================" "INFO"
    Write-Log "README Validation Summary" "INFO"
    Write-Log "===============================================" "INFO"
    Write-Log "Overall Status: $($ValidationResults.Overall)" $ValidationResults.Overall
    Write-Log "Total Checks: $($ValidationResults.Files.Count)" "INFO"
    Write-Log "Success: $($ValidationResults.Success.Count)" "SUCCESS"
    Write-Log "Warnings: $($ValidationResults.Warnings.Count)" "WARNING"
    Write-Log "Errors: $($ValidationResults.Errors.Count)" "ERROR"
    Write-Log "===============================================" "INFO"
    
    # Display detailed results if requested
    if ($Detailed) {
        Write-Log "Detailed Results:" "INFO"
        foreach ($Check in $ValidationResults.Files) {
            $Status = $Check.Status
            $Message = "[$($Check.Category)] $($Check.File) - $($Check.Check): $($Check.Message)"
            Write-Log $Message $Status
        }
    }
    
    # Save report to file
    $ReportFile = ".automation/logs/readme-validation-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $ValidationResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $ReportFile -Encoding UTF8
    Write-Log "Report saved to: $ReportFile" "INFO"
    
    return $ValidationResults.Overall
}

# Main execution
try {
    Start-ReadmeValidation
    $OverallStatus = New-ValidationReport
    
    if ($OverallStatus -eq "ERROR") {
        Write-Log "README validation completed with errors. Please fix the issues and run again." "ERROR"
        exit 1
    } elseif ($OverallStatus -eq "WARNING") {
        Write-Log "README validation completed with warnings. Review the warnings and consider fixing them." "WARNING"
        exit 0
    } else {
        Write-Log "README validation completed successfully!" "SUCCESS"
        exit 0
    }
    
} catch {
    Write-Log "✗ README validation failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Check the log file for details: $LogFile" "ERROR"
    exit 1
}
