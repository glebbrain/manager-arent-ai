# Universal Project Setup Script
# Supports multiple project types: Node.js, Python, C++, .NET, Java, Go, Rust, PHP
# Enhanced with comprehensive setup process and enterprise features

param(
    [string]$ProjectType = "auto",
    [string]$ProjectPath = ".",
    [switch]$Enterprise,
    [switch]$Production,
    [switch]$Development,
    [string]$Environment = "development",
    [switch]$Quiet,
    [switch]$Force
)

# Load project configuration
$configPath = Join-Path $PSScriptRoot "..\config\project-config.json"
$projectConfig = Get-Content $configPath | ConvertFrom-Json

Write-Host "🚀 Universal Project Setup - Starting..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to log messages
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    if (-not $Quiet) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $logMessage = "[$timestamp] [$Level] $Message"
        
        switch ($Level) {
            "ERROR" { Write-Host $logMessage -ForegroundColor Red }
            "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
            "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
            "INFO" { Write-Host $logMessage -ForegroundColor Cyan }
            default { Write-Host $logMessage -ForegroundColor White }
        }
    }
}

# Function to detect project type
function Get-ProjectType {
    param([string]$Path)
    
    if ($ProjectType -ne "auto") {
        return $ProjectType
    }
    
    $detectScript = Join-Path $PSScriptRoot "..\utilities\detect-project-type.ps1"
    $result = & $detectScript -ProjectPath $Path -Json -Quiet
    $projectInfo = $result | ConvertFrom-Json
    
    if ($projectInfo.Error) {
        Write-Log "Failed to detect project type: $($projectInfo.Error)" "ERROR"
        return "unknown"
    }
    
    return $projectInfo.Type
}

# Function to check prerequisites
function Test-Prerequisites {
    param([string]$ProjectType)
    
    Write-Log "Checking prerequisites for $ProjectType..." "INFO"
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    $missingDeps = @()
    $availableDeps = @()
    
    # Check required dependencies
    foreach ($dep in $typeConfig.dependencies.required) {
        try {
            $version = Invoke-Expression "$dep --version" 2>$null
            if ($LASTEXITCODE -eq 0) {
                $availableDeps += $dep
                Write-Log "✅ $dep is installed: $version" "SUCCESS"
            } else {
                $missingDeps += $dep
                Write-Log "❌ $dep is required but not installed" "ERROR"
            }
        } catch {
            $missingDeps += $dep
            Write-Log "❌ $dep is required but not installed" "ERROR"
        }
    }
    
    # Check optional dependencies
    foreach ($dep in $typeConfig.dependencies.optional) {
        try {
            $version = Invoke-Expression "$dep --version" 2>$null
            if ($LASTEXITCODE -eq 0) {
                $availableDeps += $dep
                Write-Log "✅ $dep is installed: $version (optional)" "SUCCESS"
            } else {
                Write-Log "⚠️ $dep is optional and not installed" "WARNING"
            }
        } catch {
            Write-Log "⚠️ $dep is optional and not installed" "WARNING"
        }
    }
    
    if ($missingDeps.Count -gt 0) {
        Write-Log "Missing required dependencies: $($missingDeps -join ', ')" "ERROR"
        return $false
    }
    
    return $true
}

# Function to setup environment
function Set-Environment {
    param([string]$ProjectType, [string]$Path, [string]$Environment)
    
    Write-Log "Setting up environment for $ProjectType..." "INFO"
    
    # Create .env file if it doesn't exist
    if (-not (Test-Path (Join-Path $Path ".env"))) {
        Write-Log "Creating .env file..." "INFO"
        
        $envContent = @"
# Environment Configuration
NODE_ENV=$Environment
PROJECT_TYPE=$ProjectType
"@
        
        # Add project-specific environment variables
        switch ($ProjectType) {
            "nodejs" {
                $envContent += @"

# Node.js specific
PORT=3000
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
"@
            }
            "python" {
                $envContent += @"

# Python specific
PYTHONPATH=.
FLASK_ENV=$Environment
"@
            }
            "cpp" {
                $envContent += @"

# C++ specific
CMAKE_BUILD_TYPE=Release
"@
            }
        }
        
        $envContent | Out-File (Join-Path $Path ".env")
        Write-Log "✅ .env file created" "SUCCESS"
    } else {
        Write-Log "✅ .env file already exists" "SUCCESS"
    }
    
    # Set environment variables
    $env:NODE_ENV = $Environment
    $env:PROJECT_TYPE = $ProjectType
    
    if ($Enterprise) {
        $env:ENTERPRISE_MODE = "true"
        Write-Log "✅ Enterprise mode enabled" "SUCCESS"
    }
    
    Write-Log "✅ Environment configured for $Environment mode" "SUCCESS"
}

# Function to install dependencies
function Install-Dependencies {
    param([string]$ProjectType, [string]$Path)
    
    Write-Log "Installing dependencies for $ProjectType..." "INFO"
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    $installCommand = $typeConfig.installCommand
    
    try {
        Push-Location $Path
        
        Write-Log "Running: $installCommand" "INFO"
        Invoke-Expression $installCommand
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Dependencies installed successfully" "SUCCESS"
            return $true
        } else {
            Write-Log "❌ Failed to install dependencies" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Error installing dependencies: $($_.Exception.Message)" "ERROR"
        return $false
    } finally {
        Pop-Location
    }
}

# Function to setup project-specific configuration
function Set-ProjectConfiguration {
    param([string]$ProjectType, [string]$Path)
    
    Write-Log "Setting up project-specific configuration..." "INFO"
    
    switch ($ProjectType) {
        "nodejs" {
            # Create package.json if it doesn't exist
            if (-not (Test-Path (Join-Path $Path "package.json"))) {
                Write-Log "Creating package.json..." "INFO"
                $packageJson = @{
                    name = "universal-project"
                    version = "1.0.0"
                    description = "Universal project"
                    main = "index.js"
                    scripts = @{
                        dev = "next dev"
                        build = "next build"
                        start = "next start"
                        test = "jest"
                    }
                    dependencies = @{}
                    devDependencies = @{}
                }
                $packageJson | ConvertTo-Json -Depth 10 | Out-File (Join-Path $Path "package.json")
                Write-Log "✅ package.json created" "SUCCESS"
            }
            
            # Create tsconfig.json if it doesn't exist
            if (-not (Test-Path (Join-Path $Path "tsconfig.json"))) {
                Write-Log "Creating tsconfig.json..." "INFO"
                $tsConfig = @{
                    compilerOptions = @{
                        target = "es5"
                        lib = @("dom", "dom.iterable", "es6")
                        allowJs = $true
                        skipLibCheck = $true
                        strict = $true
                        forceConsistentCasingInFileNames = $true
                        noEmit = $true
                        esModuleInterop = $true
                        module = "esnext"
                        moduleResolution = "node"
                        resolveJsonModule = $true
                        isolatedModules = $true
                        jsx = "preserve"
                        incremental = $true
                    }
                    include = @("next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts")
                    exclude = @("node_modules")
                }
                $tsConfig | ConvertTo-Json -Depth 10 | Out-File (Join-Path $Path "tsconfig.json")
                Write-Log "✅ tsconfig.json created" "SUCCESS"
            }
        }
        
        "python" {
            # Create requirements.txt if it doesn't exist
            if (-not (Test-Path (Join-Path $Path "requirements.txt"))) {
                Write-Log "Creating requirements.txt..." "INFO"
                @"
# Python dependencies
flask==2.3.3
pytest==7.4.2
black==23.7.0
flake8==6.0.0
"@ | Out-File (Join-Path $Path "requirements.txt")
                Write-Log "✅ requirements.txt created" "SUCCESS"
            }
            
            # Create pyproject.toml if it doesn't exist
            if (-not (Test-Path (Join-Path $Path "pyproject.toml"))) {
                Write-Log "Creating pyproject.toml..." "INFO"
                @"
[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "universal-project"
version = "1.0.0"
description = "Universal project"
dependencies = [
    "flask>=2.3.3",
]

[tool.black]
line-length = 88
target-version = ['py38']

[tool.pytest.ini_options]
testpaths = ["tests"]
"@ | Out-File (Join-Path $Path "pyproject.toml")
                Write-Log "✅ pyproject.toml created" "SUCCESS"
            }
        }
        
        "cpp" {
            # Create CMakeLists.txt if it doesn't exist
            if (-not (Test-Path (Join-Path $Path "CMakeLists.txt"))) {
                Write-Log "Creating CMakeLists.txt..." "INFO"
                @"
cmake_minimum_required(VERSION 3.15)
project(UniversalProject)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add executable
add_executable(universal-project main.cpp)

# Find packages
find_package(PkgConfig REQUIRED)

# Include directories
include_directories(include)

# Compiler flags
set(CMAKE_CXX_FLAGS "-Wall -Wextra -Wpedantic")
"@ | Out-File (Join-Path $Path "CMakeLists.txt")
                Write-Log "✅ CMakeLists.txt created" "SUCCESS"
            }
            
            # Create main.cpp if it doesn't exist
            if (-not (Test-Path (Join-Path $Path "main.cpp"))) {
                Write-Log "Creating main.cpp..." "INFO"
                @"
#include <iostream>

int main() {
    std::cout << "Hello, Universal Project!" << std::endl;
    return 0;
}
"@ | Out-File (Join-Path $Path "main.cpp")
                Write-Log "✅ main.cpp created" "SUCCESS"
            }
        }
    }
}

# Function to create directory structure
function New-DirectoryStructure {
    param([string]$ProjectType, [string]$Path)
    
    Write-Log "Creating directory structure..." "INFO"
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    
    # Create source directories
    foreach ($dir in $typeConfig.sourceDirs) {
        $dirPath = Join-Path $Path $dir
        if (-not (Test-Path $dirPath)) {
            New-Item -ItemType Directory -Path $dirPath | Out-Null
            Write-Log "✅ Created directory: $dir" "SUCCESS"
        }
    }
    
    # Create test directories
    foreach ($dir in $typeConfig.testDirs) {
        $dirPath = Join-Path $Path $dir
        if (-not (Test-Path $dirPath)) {
            New-Item -ItemType Directory -Path $dirPath | Out-Null
            Write-Log "✅ Created directory: $dir" "SUCCESS"
        }
    }
    
    # Create common directories
    $commonDirs = @("docs", "scripts", "config")
    foreach ($dir in $commonDirs) {
        $dirPath = Join-Path $Path $dir
        if (-not (Test-Path $dirPath)) {
            New-Item -ItemType Directory -Path $dirPath | Out-Null
            Write-Log "✅ Created directory: $dir" "SUCCESS"
        }
    }
}

# Function to setup Docker (if available)
function Set-DockerServices {
    param([string]$ProjectType, [string]$Path)
    
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        Write-Log "⚠️ Docker not available, skipping Docker setup" "WARNING"
        return $true
    }
    
    Write-Log "Setting up Docker services..." "INFO"
    
    # Create Dockerfile if it doesn't exist
    if (-not (Test-Path (Join-Path $Path "Dockerfile"))) {
        Write-Log "Creating Dockerfile..." "INFO"
        
        $dockerfileContent = switch ($ProjectType) {
            "nodejs" {
                @"
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
"@
            }
            "python" {
                @"
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
"@
            }
            "cpp" {
                @"
FROM gcc:latest
WORKDIR /app
COPY . .
RUN g++ -o app main.cpp
CMD ["./app"]
"@
            }
            default {
                @"
FROM ubuntu:latest
WORKDIR /app
COPY . .
CMD ["echo", "Universal project container"]
"@
            }
        }
        
        $dockerfileContent | Out-File (Join-Path $Path "Dockerfile")
        Write-Log "✅ Dockerfile created" "SUCCESS"
    }
    
    # Create docker-compose.yml if it doesn't exist
    if (-not (Test-Path (Join-Path $Path "docker-compose.yml"))) {
        Write-Log "Creating docker-compose.yml..." "INFO"
        
        $composeContent = @"
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
    command: npm run dev
"@
        
        $composeContent | Out-File (Join-Path $Path "docker-compose.yml")
        Write-Log "✅ docker-compose.yml created" "SUCCESS"
    }
    
    return $true
}

# Function to validate setup
function Test-Setup {
    param([string]$ProjectType, [string]$Path)
    
    Write-Log "Validating setup..." "INFO"
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    $validationChecks = @()
    
    # Add detection files as validation checks
    foreach ($file in $typeConfig.detectionFiles) {
        $validationChecks += @{ Name = $file; Path = $file; Type = "File" }
    }
    
    # Add config files as validation checks
    foreach ($file in $typeConfig.configFiles) {
        $validationChecks += @{ Name = $file; Path = $file; Type = "File" }
    }
    
    # Add source directories as validation checks
    foreach ($dir in $typeConfig.sourceDirs) {
        $validationChecks += @{ Name = $dir; Path = $dir; Type = "Directory" }
    }
    
    $allValid = $true
    
    foreach ($check in $validationChecks) {
        if (Test-Path (Join-Path $Path $check.Path)) {
            Write-Log "✅ $($check.Name) is present" "SUCCESS"
        } else {
            Write-Log "❌ $($check.Name) is missing" "ERROR"
            $allValid = $false
        }
    }
    
    return $allValid
}

# Function to display next steps
function Show-NextSteps {
    param([string]$ProjectType, [string]$Path)
    
    Write-Host "`n🎉 Universal setup completed successfully!" -ForegroundColor Green
    Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
    
    $typeConfig = $projectConfig.projectTypes.$ProjectType
    
    Write-Host "1. Start development: $($typeConfig.devCommand)" -ForegroundColor White
    Write-Host "2. Build project: $($typeConfig.buildCommand)" -ForegroundColor White
    Write-Host "3. Run tests: $($typeConfig.testCommand)" -ForegroundColor White
    Write-Host "4. Check project status: .\.automation\project-management\universal-status-check.ps1" -ForegroundColor White
    
    if ($Enterprise) {
        Write-Host "`n🏢 Enterprise Features:" -ForegroundColor Cyan
        Write-Host "- Monitoring: Available" -ForegroundColor White
        Write-Host "- Security: Enhanced" -ForegroundColor White
        Write-Host "- Scalability: Enterprise-grade" -ForegroundColor White
    }
    
    Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
    Write-Host "- README.md: Project overview and quick start" -ForegroundColor White
    Write-Host "- docs/: Comprehensive documentation" -ForegroundColor White
    Write-Host "- .automation/: Universal automation scripts" -ForegroundColor White
}

# Main execution
try {
    Write-Log "Starting Universal Project Setup..." "INFO"
    
    # Detect project type
    $detectedType = Get-ProjectType -Path $ProjectPath
    if ($detectedType -eq "unknown") {
        Write-Log "❌ Could not detect project type" "ERROR"
        exit 1
    }
    
    Write-Log "Detected project type: $detectedType" "SUCCESS"
    
    # Check prerequisites
    if (-not (Test-Prerequisites -ProjectType $detectedType)) {
        Write-Log "❌ Prerequisites check failed" "ERROR"
        exit 1
    }
    
    # Setup environment
    Set-Environment -ProjectType $detectedType -Path $ProjectPath -Environment $Environment
    
    # Create directory structure
    New-DirectoryStructure -ProjectType $detectedType -Path $ProjectPath
    
    # Setup project-specific configuration
    Set-ProjectConfiguration -ProjectType $detectedType -Path $ProjectPath
    
    # Install dependencies
    if (-not (Install-Dependencies -ProjectType $detectedType -Path $ProjectPath)) {
        Write-Log "❌ Dependency installation failed" "ERROR"
        exit 1
    }
    
    # Setup Docker services
    Set-DockerServices -ProjectType $detectedType -Path $ProjectPath
    
    # Validate setup
    if (-not (Test-Setup -ProjectType $detectedType -Path $ProjectPath)) {
        Write-Log "❌ Setup validation failed" "ERROR"
        exit 1
    }
    
    # Show next steps
    Show-NextSteps -ProjectType $detectedType -Path $ProjectPath
    
    Write-Log "✅ Universal Project Setup completed successfully!" "SUCCESS"
    
} catch {
    Write-Log "❌ Setup failed with error: $($_.Exception.Message)" "ERROR"
    exit 1
}
