# FreeRPA Enterprise Dependencies Installation Script
# Enhanced with comprehensive dependency management and enterprise features

param(
    [string]$ProjectType = "auto",
    [switch]$Force,
    [switch]$Enterprise,
    [switch]$Production,
    [switch]$Development,
    [switch]$Verbose,
    [switch]$SkipOptional
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "FreeRPA Dependencies Installation"
$Version = "1.0.0"
$LogFile = ".automation/logs/dependencies-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Create logs directory if it doesn't exist
if (!(Test-Path ".automation/logs")) {
    New-Item -ItemType Directory -Path ".automation/logs" -Force | Out-Null
}

# Installation results
$InstallationResults = @{
    "Overall" = "PENDING"
    "Packages" = @()
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

# Function to add installation result
function Add-InstallationResult {
    param(
        [string]$Package,
        [string]$Status,
        [string]$Message,
        [string]$Category = "INFO"
    )
    
    $Result = @{
        "Package" = $Package
        "Status" = $Status
        "Message" = $Message
        "Category" = $Category
        "Timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $InstallationResults.Packages += $Result
    
    switch ($Status) {
        "SUCCESS" { $InstallationResults.Success += $Result }
        "WARNING" { $InstallationResults.Warnings += $Result }
        "ERROR" { $InstallationResults.Errors += $Result }
    }
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Log "Checking installation prerequisites..." "INFO"
    
    # Check if we're in the correct directory
    if (!(Test-Path "package.json") -and !(Test-Path "requirements.txt") -and !(Test-Path "*.sln")) {
        Write-Log "⚠ Not in a recognized project directory" "WARNING"
        Write-Log "Continuing with auto-detection..." "INFO"
    }
    
    # Check available package managers
    $AvailableManagers = @()
    
        if (Get-Command npm -ErrorAction SilentlyContinue) {
        $AvailableManagers += "npm"
        Write-Log "✓ npm available" "SUCCESS"
    }
    
    if (Get-Command pip -ErrorAction SilentlyContinue) {
        $AvailableManagers += "pip"
        Write-Log "✓ pip available" "SUCCESS"
    }
    
    if (Get-Command dotnet -ErrorAction SilentlyContinue) {
        $AvailableManagers += "dotnet"
        Write-Log "✓ dotnet available" "SUCCESS"
    }
    
    if (Get-Command flutter -ErrorAction SilentlyContinue) {
        $AvailableManagers += "flutter"
        Write-Log "✓ flutter available" "SUCCESS"
    }
    
    if ($AvailableManagers.Count -eq 0) {
        Write-Log "❌ No package managers found" "ERROR"
        Write-Log "Please install at least one package manager (npm, pip, dotnet, flutter)" "ERROR"
        exit 1
    }
    
    return $AvailableManagers
}

# Function to auto-detect project type
function Get-ProjectType {
    Write-Log "Auto-detecting project type..." "INFO"
    
    if (Test-Path "package.json") {
        $PackageJson = Get-Content "package.json" | ConvertFrom-Json
        
        # Check for React Native
        if (Test-Path "mobile/package.json") {
            Add-InstallationResult "Project Type" "SUCCESS" "React Native project detected" "DETECTION"
            return "react-native"
        }
        
        # Check for Next.js
        if ($PackageJson.dependencies."next" -or $PackageJson.devDependencies."next") {
            Add-InstallationResult "Project Type" "SUCCESS" "Next.js project detected" "DETECTION"
            return "nextjs"
        }
        
        # Check for Node.js
        Add-InstallationResult "Project Type" "SUCCESS" "Node.js project detected" "DETECTION"
        return "node"
    }
    elseif (Test-Path "requirements.txt") {
        Add-InstallationResult "Project Type" "SUCCESS" "Python project detected" "DETECTION"
        return "python"
    }
    elseif (Test-Path "*.sln") {
        Add-InstallationResult "Project Type" "SUCCESS" ".NET project detected" "DETECTION"
        return "dotnet"
    }
    elseif (Test-Path "pom.xml") {
        Add-InstallationResult "Project Type" "SUCCESS" "Java project detected" "DETECTION"
        return "java"
    }
    elseif (Test-Path "mobile/pubspec.yaml") {
        Add-InstallationResult "Project Type" "SUCCESS" "Flutter project detected" "DETECTION"
        return "flutter"
    }
    else {
        Add-InstallationResult "Project Type" "WARNING" "Unknown project type, defaulting to Node.js" "DETECTION"
        return "node"
    }
}

# Function to install Node.js dependencies
function Install-NodeDependencies {
    Write-Log "Installing Node.js dependencies..." "INFO"
    
    try {
        # Install main dependencies
        Write-Log "Installing main dependencies..." "INFO"
        $Result = & npm install 2>&1
        if ($LASTEXITCODE -eq 0) {
            Add-InstallationResult "npm install" "SUCCESS" "Main dependencies installed" "NODE"
        } else {
            Add-InstallationResult "npm install" "ERROR" "Failed to install main dependencies" "NODE"
            return
        }
        
        # Install development dependencies for enterprise projects
        if ($Enterprise -or $Development) {
            Write-Log "Installing enterprise development dependencies..." "INFO"
            $DevDeps = @(
                "jest", "@testing-library/jest-dom", "@testing-library/react",
                "eslint", "prettier", "playwright", "@playwright/test",
                "typescript", "@types/node", "@types/react", "@types/react-dom"
            )
            
            foreach ($Dep in $DevDeps) {
                try {
                    $Result = & npm install --save-dev $Dep 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Add-InstallationResult "Dev Dep: $Dep" "SUCCESS" "Development dependency installed" "NODE"
                    } else {
                        Add-InstallationResult "Dev Dep: $Dep" "WARNING" "Failed to install development dependency" "NODE"
                    }
                } catch {
                    Add-InstallationResult "Dev Dep: $Dep" "WARNING" "Error installing development dependency: $($_.Exception.Message)" "NODE"
                }
            }
        }
        
        # Install production dependencies for enterprise projects
        if ($Enterprise -or $Production) {
            Write-Log "Installing enterprise production dependencies..." "INFO"
            $ProdDeps = @(
                "next", "react", "react-dom", "typescript",
                "@prisma/client", "prisma", "next-auth",
                "redis", "bullmq", "meilisearch"
            )
            
            foreach ($Dep in $ProdDeps) {
                try {
                    $Result = & npm install $Dep 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Add-InstallationResult "Prod Dep: $Dep" "SUCCESS" "Production dependency installed" "NODE"
                    } else {
                        Add-InstallationResult "Prod Dep: $Dep" "WARNING" "Failed to install production dependency" "NODE"
                    }
                } catch {
                    Add-InstallationResult "Prod Dep: $Dep" "WARNING" "Error installing production dependency: $($_.Exception.Message)" "NODE"
                }
            }
        }
        
        # Generate Prisma client if schema exists
        if (Test-Path "prisma/schema.prisma") {
            Write-Log "Generating Prisma client..." "INFO"
            $Result = & npx prisma generate 2>&1
            if ($LASTEXITCODE -eq 0) {
                Add-InstallationResult "Prisma Client" "SUCCESS" "Prisma client generated" "NODE"
            } else {
                Add-InstallationResult "Prisma Client" "WARNING" "Failed to generate Prisma client" "NODE"
            }
        }
        
    } catch {
        Add-InstallationResult "Node.js Installation" "ERROR" "Failed to install Node.js dependencies: $($_.Exception.Message)" "NODE"
    }
}

# Function to install Python dependencies
function Install-PythonDependencies {
    Write-Log "Installing Python dependencies..." "INFO"
    
    try {
        # Upgrade pip
        Write-Log "Upgrading pip..." "INFO"
        $Result = & python -m pip install --upgrade pip 2>&1
        if ($LASTEXITCODE -eq 0) {
            Add-InstallationResult "pip upgrade" "SUCCESS" "pip upgraded successfully" "PYTHON"
        } else {
            Add-InstallationResult "pip upgrade" "WARNING" "Failed to upgrade pip" "PYTHON"
        }
        
        # Install requirements.txt if exists
            if (Test-Path "requirements.txt") {
            Write-Log "Installing requirements.txt..." "INFO"
            $Result = & pip install -r requirements.txt 2>&1
            if ($LASTEXITCODE -eq 0) {
                Add-InstallationResult "requirements.txt" "SUCCESS" "Requirements installed" "PYTHON"
            } else {
                Add-InstallationResult "requirements.txt" "ERROR" "Failed to install requirements" "PYTHON"
            }
        }
        
        # Install development dependencies for ML projects
        if ($Enterprise -or $Development) {
            Write-Log "Installing development dependencies..." "INFO"
            $DevDeps = @("pytest", "pytest-cov", "jupyter", "black", "flake8", "mypy")
            
            foreach ($Dep in $DevDeps) {
                try {
                    $Result = & pip install $Dep 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Add-InstallationResult "Dev Dep: $Dep" "SUCCESS" "Development dependency installed" "PYTHON"
        } else {
                        Add-InstallationResult "Dev Dep: $Dep" "WARNING" "Failed to install development dependency" "PYTHON"
                    }
                } catch {
                    Add-InstallationResult "Dev Dep: $Dep" "WARNING" "Error installing development dependency: $($_.Exception.Message)" "PYTHON"
                }
            }
        }
        
    } catch {
        Add-InstallationResult "Python Installation" "ERROR" "Failed to install Python dependencies: $($_.Exception.Message)" "PYTHON"
    }
}

# Function to install .NET dependencies
function Install-DotNetDependencies {
    Write-Log "Installing .NET dependencies..." "INFO"
    
    try {
        # Restore packages
        Write-Log "Restoring .NET packages..." "INFO"
        $Result = & dotnet restore 2>&1
        if ($LASTEXITCODE -eq 0) {
            Add-InstallationResult "dotnet restore" "SUCCESS" ".NET packages restored" "DOTNET"
        } else {
            Add-InstallationResult "dotnet restore" "ERROR" "Failed to restore .NET packages" "DOTNET"
        }
        
        # Install global tools
        if ($Enterprise -or $Development) {
            Write-Log "Installing .NET tools..." "INFO"
            $Tools = @("dotnet-format", "dotnet-outdated", "dotnet-reportgenerator-globaltool")
            
            foreach ($Tool in $Tools) {
                try {
                    $Result = & dotnet tool install --global $Tool 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Add-InstallationResult "Tool: $Tool" "SUCCESS" ".NET tool installed" "DOTNET"
                    } else {
                        Add-InstallationResult "Tool: $Tool" "WARNING" "Failed to install .NET tool" "DOTNET"
                    }
                } catch {
                    Add-InstallationResult "Tool: $Tool" "WARNING" "Error installing .NET tool: $($_.Exception.Message)" "DOTNET"
                }
            }
        }
        
    } catch {
        Add-InstallationResult ".NET Installation" "ERROR" "Failed to install .NET dependencies: $($_.Exception.Message)" "DOTNET"
    }
}

# Function to install Flutter dependencies
function Install-FlutterDependencies {
    Write-Log "Installing Flutter dependencies..." "INFO"
    
    try {
        if (Test-Path "mobile") {
            Set-Location mobile
        }
        
        # Get Flutter dependencies
        Write-Log "Getting Flutter dependencies..." "INFO"
        $Result = & flutter pub get 2>&1
        if ($LASTEXITCODE -eq 0) {
            Add-InstallationResult "flutter pub get" "SUCCESS" "Flutter dependencies installed" "FLUTTER"
        } else {
            Add-InstallationResult "flutter pub get" "ERROR" "Failed to install Flutter dependencies" "FLUTTER"
        }
        
        # Run Flutter doctor
        Write-Log "Running Flutter doctor..." "INFO"
        $Result = & flutter doctor 2>&1
        if ($LASTEXITCODE -eq 0) {
            Add-InstallationResult "flutter doctor" "SUCCESS" "Flutter environment validated" "FLUTTER"
        } else {
            Add-InstallationResult "flutter doctor" "WARNING" "Flutter environment issues detected" "FLUTTER"
        }
        
        if (Test-Path "mobile") {
            Set-Location ..
        }
        
    } catch {
        Add-InstallationResult "Flutter Installation" "ERROR" "Failed to install Flutter dependencies: $($_.Exception.Message)" "FLUTTER"
    }
}

# Function to install enterprise dependencies
function Install-EnterpriseDependencies {
    Write-Log "Installing enterprise dependencies..." "INFO"
    
    # Main application
    if (Test-Path "package.json") {
        Install-NodeDependencies
    }
    
    # Mobile app
    if (Test-Path "mobile/package.json") {
        Write-Log "Installing mobile app dependencies..." "INFO"
        $OriginalLocation = Get-Location
        Set-Location mobile
        Install-NodeDependencies
        Set-Location $OriginalLocation
    }
    
    # Microservices
    if (Test-Path "microservices") {
        Write-Log "Installing microservices dependencies..." "INFO"
        $Microservices = Get-ChildItem "microservices" -Directory
        
        foreach ($Service in $Microservices) {
            if (Test-Path "$($Service.FullName)/package.json") {
                Write-Log "Installing dependencies for $($Service.Name)..." "INFO"
                $OriginalLocation = Get-Location
                Set-Location $Service.FullName
                Install-NodeDependencies
                Set-Location $OriginalLocation
            }
        }
    }
    
    # Browser extension
    if (Test-Path "browser-extension/package.json") {
        Write-Log "Installing browser extension dependencies..." "INFO"
        $OriginalLocation = Get-Location
        Set-Location browser-extension
        Install-NodeDependencies
        Set-Location $OriginalLocation
    }
    
    # Desktop app
    if (Test-Path "desktop/package.json") {
        Write-Log "Installing desktop app dependencies..." "INFO"
        $OriginalLocation = Get-Location
        Set-Location desktop
        Install-NodeDependencies
        Set-Location $OriginalLocation
    }
}

# Function to generate installation report
function New-InstallationReport {
    Write-Log "Generating installation report..." "INFO"
    
    # Calculate overall status
    if ($InstallationResults.Errors.Count -eq 0) {
        if ($InstallationResults.Warnings.Count -eq 0) {
            $InstallationResults.Overall = "SUCCESS"
        } else {
            $InstallationResults.Overall = "WARNING"
        }
    } else {
        $InstallationResults.Overall = "ERROR"
    }
    
    # Display summary
    Write-Log "===============================================" "INFO"
    Write-Log "Dependencies Installation Summary" "INFO"
    Write-Log "===============================================" "INFO"
    Write-Log "Overall Status: $($InstallationResults.Overall)" $InstallationResults.Overall
    Write-Log "Total Packages: $($InstallationResults.Packages.Count)" "INFO"
    Write-Log "Success: $($InstallationResults.Success.Count)" "SUCCESS"
    Write-Log "Warnings: $($InstallationResults.Warnings.Count)" "WARNING"
    Write-Log "Errors: $($InstallationResults.Errors.Count)" "ERROR"
    Write-Log "===============================================" "INFO"
    
    # Save report to file
    $ReportFile = ".automation/logs/dependencies-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $InstallationResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $ReportFile -Encoding UTF8
    Write-Log "Report saved to: $ReportFile" "INFO"
    
    return $InstallationResults.Overall
}

# Main execution
try {
    Write-Log "Starting $ScriptName v$Version" "INFO"
    Write-Log "Project Type: $ProjectType" "INFO"
    Write-Log "Enterprise Mode: $Enterprise" "INFO"
    Write-Log "Production Mode: $Production" "INFO"
    Write-Log "Development Mode: $Development" "INFO"
    Write-Log "===============================================" "INFO"
    
    # Check prerequisites
    $AvailableManagers = Test-Prerequisites
    
    # Auto-detect project type if needed
    if ($ProjectType -eq "auto") {
        $ProjectType = Get-ProjectType
    }
    
    # Install dependencies based on project type
    switch ($ProjectType.ToLower()) {
        "node" { Install-NodeDependencies }
        "nextjs" { Install-NodeDependencies }
        "react-native" { Install-NodeDependencies }
        "python" { Install-PythonDependencies }
        "dotnet" { Install-DotNetDependencies }
        "java" { 
            Add-InstallationResult "Java" "WARNING" "Java dependency installation not implemented" "JAVA"
        }
        "flutter" { Install-FlutterDependencies }
        "enterprise" { Install-EnterpriseDependencies }
        default { 
            Add-InstallationResult "Project Type" "ERROR" "Unknown project type: $ProjectType" "DETECTION"
        }
    }
    
    $OverallStatus = New-InstallationReport
    
    if ($OverallStatus -eq "ERROR") {
        Write-Log "Dependencies installation completed with errors. Please fix the issues and run again." "ERROR"
        exit 1
    } elseif ($OverallStatus -eq "WARNING") {
        Write-Log "Dependencies installation completed with warnings. Review the warnings and consider fixing them." "WARNING"
        exit 0
    } else {
        Write-Log "Dependencies installation completed successfully!" "SUCCESS"
        exit 0
    }
    
} catch {
    Write-Log "✗ Dependencies installation failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Check the log file for details: $LogFile" "ERROR"
    exit 1
}
