# Universal Automation Toolkit - Usage Examples
# Demonstrates how to use the universal automation scripts for different project types

# Import the universal automation module
Import-Module .\module\UniversalAutomation.psd1 -Force

Write-Host "🌐 Universal Automation Toolkit - Usage Examples" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Example 1: Detect project type
Write-Host "`n1. Detecting Project Type" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan

# Auto-detect project type
$projectType = Get-ProjectType -ProjectPath "."
Write-Host "Detected project type: $projectType" -ForegroundColor Yellow

# Get detailed project information
$projectInfo = Get-ProjectType -ProjectPath "." -Json | ConvertFrom-Json
Write-Host "Project details:" -ForegroundColor Yellow
Write-Host "  Name: $($projectInfo.Name)" -ForegroundColor White
Write-Host "  Build Command: $($projectInfo.BuildCommand)" -ForegroundColor White
Write-Host "  Test Command: $($projectInfo.TestCommand)" -ForegroundColor White

# Example 2: Universal Setup
Write-Host "`n2. Universal Project Setup" -ForegroundColor Cyan
Write-Host "--------------------------" -ForegroundColor Cyan

# Setup for different project types
Write-Host "Setting up Node.js project..." -ForegroundColor Yellow
# Invoke-UniversalSetup -ProjectType "nodejs" -ProjectPath "C:\MyNodeProject"

Write-Host "Setting up Python project..." -ForegroundColor Yellow
# Invoke-UniversalSetup -ProjectType "python" -ProjectPath "C:\MyPythonProject"

Write-Host "Setting up C++ project..." -ForegroundColor Yellow
# Invoke-UniversalSetup -ProjectType "cpp" -ProjectPath "C:\MyCppProject"

# Example 3: Universal Build
Write-Host "`n3. Universal Project Build" -ForegroundColor Cyan
Write-Host "-------------------------" -ForegroundColor Cyan

# Build different project types
Write-Host "Building Node.js project..." -ForegroundColor Yellow
# Invoke-UniversalBuild -ProjectType "nodejs" -Test -Package

Write-Host "Building Python project..." -ForegroundColor Yellow
# Invoke-UniversalBuild -ProjectType "python" -Test

Write-Host "Building C++ project..." -ForegroundColor Yellow
# Invoke-UniversalBuild -ProjectType "cpp" -Test -Package -BuildType "Release"

# Example 4: Universal Testing
Write-Host "`n4. Universal Project Testing" -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Cyan

# Run tests for different project types
Write-Host "Running Node.js tests..." -ForegroundColor Yellow
# Invoke-UniversalTests -ProjectType "nodejs" -All -Coverage

Write-Host "Running Python tests..." -ForegroundColor Yellow
# Invoke-UniversalTests -ProjectType "python" -Unit -Integration

Write-Host "Running C++ tests..." -ForegroundColor Yellow
# Invoke-UniversalTests -ProjectType "cpp" -Unit -Performance

# Example 5: Universal Validation
Write-Host "`n5. Universal Project Validation" -ForegroundColor Cyan
Write-Host "-------------------------------" -ForegroundColor Cyan

# Validate different project types
Write-Host "Validating Node.js project..." -ForegroundColor Yellow
# Invoke-UniversalValidation -ProjectType "nodejs" -All

Write-Host "Validating Python project..." -ForegroundColor Yellow
# Invoke-UniversalValidation -ProjectType "python" -Security -Performance

Write-Host "Validating C++ project..." -ForegroundColor Yellow
# Invoke-UniversalValidation -ProjectType "cpp" -All -Detailed

# Example 6: Universal Status Check
Write-Host "`n6. Universal Project Status Check" -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan

# Check status for different project types
Write-Host "Checking Node.js project status..." -ForegroundColor Yellow
# Invoke-UniversalStatusCheck -ProjectType "nodejs" -All -Health

Write-Host "Checking Python project status..." -ForegroundColor Yellow
# Invoke-UniversalStatusCheck -ProjectType "python" -Performance -Security

Write-Host "Checking C++ project status..." -ForegroundColor Yellow
# Invoke-UniversalStatusCheck -ProjectType "cpp" -All -Json -OutputFile "status.json"

# Example 7: CI/CD Pipeline
Write-Host "`n7. CI/CD Pipeline Example" -ForegroundColor Cyan
Write-Host "-------------------------" -ForegroundColor Cyan

function Invoke-CICDPipeline {
    param([string]$ProjectType, [string]$ProjectPath)
    
    Write-Host "Starting CI/CD pipeline for $ProjectType project..." -ForegroundColor Green
    
    # 1. Detect project type
    $detectedType = Get-ProjectType -ProjectPath $ProjectPath -Quiet
    Write-Host "Detected type: $detectedType" -ForegroundColor Yellow
    
    # 2. Validate project
    Write-Host "Validating project..." -ForegroundColor Yellow
    $validationResult = Invoke-UniversalValidation -ProjectType $detectedType -ProjectPath $ProjectPath -All -Quiet
    if ($validationResult -ne 0) {
        Write-Host "Validation failed!" -ForegroundColor Red
        return $false
    }
    
    # 3. Run tests
    Write-Host "Running tests..." -ForegroundColor Yellow
    $testResult = Invoke-UniversalTests -ProjectType $detectedType -ProjectPath $ProjectPath -All -CI -Quiet
    if ($testResult -ne 0) {
        Write-Host "Tests failed!" -ForegroundColor Red
        return $false
    }
    
    # 4. Build project
    Write-Host "Building project..." -ForegroundColor Yellow
    $buildResult = Invoke-UniversalBuild -ProjectType $detectedType -ProjectPath $ProjectPath -Test -Package -Quiet
    if ($buildResult -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        return $false
    }
    
    # 5. Check status
    Write-Host "Checking final status..." -ForegroundColor Yellow
    $statusResult = Invoke-UniversalStatusCheck -ProjectType $detectedType -ProjectPath $ProjectPath -All -Quiet
    
    Write-Host "CI/CD pipeline completed successfully!" -ForegroundColor Green
    return $true
}

# Example usage of CI/CD pipeline
# Invoke-CICDPipeline -ProjectType "nodejs" -ProjectPath "C:\MyProject"

# Example 8: Batch Processing
Write-Host "`n8. Batch Processing Example" -ForegroundColor Cyan
Write-Host "---------------------------" -ForegroundColor Cyan

function Invoke-BatchProcessing {
    param([string[]]$ProjectPaths)
    
    foreach ($path in $ProjectPaths) {
        Write-Host "`nProcessing project: $path" -ForegroundColor Green
        
        # Detect project type
        $projectType = Get-ProjectType -ProjectPath $path -Quiet
        Write-Host "  Type: $projectType" -ForegroundColor Yellow
        
        # Quick status check
        $status = Invoke-UniversalStatusCheck -ProjectType $projectType -ProjectPath $path -Quiet
        Write-Host "  Status: $status" -ForegroundColor Yellow
        
        # Run validation
        $validation = Invoke-UniversalValidation -ProjectType $projectType -ProjectPath $path -Quiet
        Write-Host "  Validation: $validation" -ForegroundColor Yellow
    }
}

# Example usage of batch processing
# $projects = @("C:\Project1", "C:\Project2", "C:\Project3")
# Invoke-BatchProcessing -ProjectPaths $projects

# Example 9: Custom Workflow
Write-Host "`n9. Custom Workflow Example" -ForegroundColor Cyan
Write-Host "--------------------------" -ForegroundColor Cyan

function Invoke-CustomWorkflow {
    param(
        [string]$ProjectType,
        [string]$ProjectPath,
        [string[]]$Steps
    )
    
    Write-Host "Starting custom workflow for $ProjectType project..." -ForegroundColor Green
    
    foreach ($step in $Steps) {
        Write-Host "`nExecuting step: $step" -ForegroundColor Yellow
        
        switch ($step.ToLower()) {
            "detect" {
                Get-ProjectType -ProjectPath $ProjectPath
            }
            "setup" {
                Invoke-UniversalSetup -ProjectType $ProjectType -ProjectPath $ProjectPath
            }
            "validate" {
                Invoke-UniversalValidation -ProjectType $ProjectType -ProjectPath $ProjectPath -All
            }
            "test" {
                Invoke-UniversalTests -ProjectType $ProjectType -ProjectPath $ProjectPath -All
            }
            "build" {
                Invoke-UniversalBuild -ProjectType $ProjectType -ProjectPath $ProjectPath -Test
            }
            "status" {
                Invoke-UniversalStatusCheck -ProjectType $ProjectType -ProjectPath $ProjectPath -All
            }
            default {
                Write-Host "Unknown step: $step" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "`nCustom workflow completed!" -ForegroundColor Green
}

# Example usage of custom workflow
# $workflowSteps = @("detect", "validate", "test", "build", "status")
# Invoke-CustomWorkflow -ProjectType "nodejs" -ProjectPath "C:\MyProject" -Steps $workflowSteps

Write-Host "`n✅ Usage examples completed!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host "`nFor more information, see the README.md file." -ForegroundColor Yellow
Write-Host "For specific project type examples, check the examples directory." -ForegroundColor Yellow
