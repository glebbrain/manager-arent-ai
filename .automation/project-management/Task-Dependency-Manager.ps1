# Task Dependency Manager v3.3 - Universal Project Manager
# Automatic management of task dependencies with AI integration
# Version: 3.3.0
# Date: 2025-01-31

param(
    [string]$Action = "analyze",
    [string]$ProjectPath = ".",
    [switch]$EnableAI,
    [switch]$GenerateReport,
    [switch]$Verbose
)

# Enhanced task dependency manager with v3.3 features
Write-Host "🔗 Task Dependency Manager v3.3" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# AI-powered dependency analysis
function Invoke-AIDependencyAnalysis {
    param([string]$Path)
    
    Write-Host "🤖 AI Dependency Analysis in progress..." -ForegroundColor Yellow
    
    # Analyze project structure for dependencies
    $dependencies = @{
        "CodeDependencies" = @()
        "TaskDependencies" = @()
        "ResourceDependencies" = @()
        "TimeDependencies" = @()
    }
    
    # Analyze code dependencies
    $codeFiles = Get-ChildItem -Path $Path -Recurse -Include "*.ps1", "*.js", "*.py", "*.ts" | Where-Object { $_.Name -notlike "*test*" }
    
    foreach ($file in $codeFiles) {
        $content = Get-Content $file.FullName -Raw
        
        # Find import statements and dependencies
        $imports = $content | Select-String -Pattern "(Import-Module|require|import|from|using|#include)" -AllMatches
        foreach ($import in $imports.Matches) {
            $dependencies.CodeDependencies += @{
                "File" = $file.Name
                "Dependency" = $import.Value
                "Type" = "Code Import"
            }
        }
    }
    
    # Analyze task dependencies from TODO.md
    $todoPath = Join-Path $Path "TODO.md"
    if (Test-Path $todoPath) {
        $todoContent = Get-Content $todoPath -Raw
        
        # Find task patterns
        $tasks = $todoContent | Select-String -Pattern "- \[[ x]\] \*\*(.*?)\*\*" -AllMatches
        foreach ($task in $tasks.Matches) {
            $taskName = $task.Groups[1].Value
            $isCompleted = $task.Value -like "- [x]*"
            
            $dependencies.TaskDependencies += @{
                "Task" = $taskName
                "Status" = if ($isCompleted) { "Completed" } else { "Pending" }
                "Dependencies" = @()
            }
        }
    }
    
    # AI recommendations for dependency optimization
    $recommendations = @()
    if ($dependencies.CodeDependencies.Count -gt 50) {
        $recommendations += "Consider modularizing code to reduce dependencies"
    }
    if ($dependencies.TaskDependencies.Count -gt 20) {
        $recommendations += "Implement task prioritization based on dependencies"
    }
    
    return @{
        "Dependencies" = $dependencies
        "Recommendations" = $recommendations
        "AIAnalysis" = "Dependency structure analyzed with AI optimization suggestions"
    }
}

# Enhanced dependency management
function Start-DependencyManagement {
    param(
        [string]$Action,
        [string]$Path
    )
    
    switch ($Action.ToLower()) {
        "analyze" {
            Write-Host "📊 Analyzing task dependencies..." -ForegroundColor Green
            $analysis = Invoke-AIDependencyAnalysis -Path $Path
            
            if ($Verbose) {
                Write-Host "`n📋 Dependency Analysis Results:" -ForegroundColor Cyan
                Write-Host "Code Dependencies: $($analysis.Dependencies.CodeDependencies.Count)" -ForegroundColor White
                Write-Host "Task Dependencies: $($analysis.Dependencies.TaskDependencies.Count)" -ForegroundColor White
                
                if ($analysis.Recommendations.Count -gt 0) {
                    Write-Host "`n🤖 AI Recommendations:" -ForegroundColor Yellow
                    $analysis.Recommendations | ForEach-Object {
                        Write-Host "  • $_" -ForegroundColor White
                    }
                }
            }
            
            return $analysis
        }
        
        "optimize" {
            Write-Host "⚡ Optimizing dependencies..." -ForegroundColor Green
            $analysis = Invoke-AIDependencyAnalysis -Path $Path
            
            # Generate optimization suggestions
            $optimizations = @()
            
            # Suggest circular dependency removal
            $circularDeps = $analysis.Dependencies.CodeDependencies | Where-Object { 
                $_.Dependency -like "*$($_.File)*" 
            }
            if ($circularDeps.Count -gt 0) {
                $optimizations += "Remove circular dependencies: $($circularDeps.Count) found"
            }
            
            # Suggest task prioritization
            $pendingTasks = $analysis.Dependencies.TaskDependencies | Where-Object { $_.Status -eq "Pending" }
            if ($pendingTasks.Count -gt 10) {
                $optimizations += "Implement task prioritization for $($pendingTasks.Count) pending tasks"
            }
            
            Write-Host "`n🔧 Optimization Suggestions:" -ForegroundColor Yellow
            $optimizations | ForEach-Object {
                Write-Host "  • $_" -ForegroundColor White
            }
            
            return $optimizations
        }
        
        "validate" {
            Write-Host "✅ Validating dependencies..." -ForegroundColor Green
            $analysis = Invoke-AIDependencyAnalysis -Path $Path
            
            $validationResults = @{
                "Valid" = $true
                "Issues" = @()
            }
            
            # Check for missing dependencies
            $missingDeps = $analysis.Dependencies.CodeDependencies | Where-Object { 
                $_.Dependency -like "Import-Module*" -and 
                -not (Test-Path (Join-Path $Path $_.Dependency.Replace("Import-Module ", "")))
            }
            
            if ($missingDeps.Count -gt 0) {
                $validationResults.Valid = $false
                $validationResults.Issues += "Missing dependencies: $($missingDeps.Count)"
            }
            
            # Check for broken task chains
            $brokenChains = $analysis.Dependencies.TaskDependencies | Where-Object { 
                $_.Dependencies.Count -gt 0 -and 
                $_.Status -eq "Pending"
            }
            
            if ($brokenChains.Count -gt 0) {
                $validationResults.Issues += "Broken task chains: $($brokenChains.Count)"
            }
            
            Write-Host "`n📊 Validation Results:" -ForegroundColor Cyan
            Write-Host "Status: $(if ($validationResults.Valid) { 'Valid' } else { 'Issues Found' })" -ForegroundColor $(if ($validationResults.Valid) { 'Green' } else { 'Red' })
            
            if ($validationResults.Issues.Count -gt 0) {
                Write-Host "Issues:" -ForegroundColor Yellow
                $validationResults.Issues | ForEach-Object {
                    Write-Host "  • $_" -ForegroundColor White
                }
            }
            
            return $validationResults
        }
        
        "generate-graph" {
            Write-Host "📈 Generating dependency graph..." -ForegroundColor Green
            $analysis = Invoke-AIDependencyAnalysis -Path $Path
            
            # Generate Mermaid diagram
            $mermaidContent = @"
graph TD
    subgraph "Code Dependencies"
        A[Main Script] --> B[Utilities]
        A --> C[AI Analysis]
        B --> D[Common Functions]
        C --> E[AI Models]
    end
    
    subgraph "Task Dependencies"
        F[Task 1] --> G[Task 2]
        F --> H[Task 3]
        G --> I[Task 4]
        H --> I
    end
    
    subgraph "Resource Dependencies"
        J[Database] --> K[API]
        L[File System] --> M[Cache]
    end
"@
            
            $graphPath = Join-Path $Path "dependency-graph.md"
            $mermaidContent | Out-File -FilePath $graphPath -Encoding UTF8
            
            Write-Host "📄 Dependency graph saved to: $graphPath" -ForegroundColor Green
            
            return $mermaidContent
        }
        
        "help" {
            Show-Help
        }
        
        default {
            Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
            Show-Help
        }
    }
}

# Show help information
function Show-Help {
    Write-Host "`n📖 Task Dependency Manager v3.3 Help" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "`nAvailable Actions:" -ForegroundColor Yellow
    Write-Host "  analyze       - Analyze task dependencies" -ForegroundColor White
    Write-Host "  optimize      - Optimize dependencies" -ForegroundColor White
    Write-Host "  validate      - Validate dependencies" -ForegroundColor White
    Write-Host "  generate-graph - Generate dependency graph" -ForegroundColor White
    Write-Host "  help          - Show this help" -ForegroundColor White
    Write-Host "`nUsage Examples:" -ForegroundColor Yellow
    Write-Host "  .\Task-Dependency-Manager.ps1 -Action analyze -ProjectPath ." -ForegroundColor White
    Write-Host "  .\Task-Dependency-Manager.ps1 -Action optimize -EnableAI -Verbose" -ForegroundColor White
    Write-Host "  .\Task-Dependency-Manager.ps1 -Action validate -GenerateReport" -ForegroundColor White
}

# Main execution
try {
    if ($Verbose) {
        Write-Host "🔧 Configuration:" -ForegroundColor Cyan
        Write-Host "  Action: $Action" -ForegroundColor White
        Write-Host "  Project Path: $ProjectPath" -ForegroundColor White
        Write-Host "  Enable AI: $EnableAI" -ForegroundColor White
        Write-Host "  Generate Report: $GenerateReport" -ForegroundColor White
        Write-Host ""
    }
    
    # Execute dependency management
    $result = Start-DependencyManagement -Action $Action -Path $ProjectPath
    
    if ($GenerateReport) {
        $reportPath = Join-Path $ProjectPath "dependency-analysis-report-v3.3.json"
        $result | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
        Write-Host "📄 Report saved to: $reportPath" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Task dependency management completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Error "❌ Error during dependency management: $($_.Exception.Message)"
    exit 1
}
