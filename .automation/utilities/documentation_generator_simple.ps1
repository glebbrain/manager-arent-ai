# Simplified Documentation Generator for LearnEnglishBot
# Auto-generates basic project documentation

param(
    [switch]$API,
    [switch]$README,
    [switch]$All,
    [string]$OutputDir = "generated_docs"
)

Write-Host "Simplified Documentation Generator for LearnEnglishBot" -ForegroundColor Green
Write-Host "Auto-generating basic project documentation" -ForegroundColor Cyan

# Configuration
$docConfig = @{
    "ProjectRoot" = Get-Location
    "OutputDir" = $OutputDir
    "Timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "ProjectName" = "LearnEnglishBot"
    "ProjectDescription" = "AI-powered Telegram bot for English language learning"
}

# Create output directory
if (-not (Test-Path $docConfig.OutputDir)) {
    New-Item -Path $docConfig.OutputDir -ItemType Directory -Force | Out-Null
    Write-Host "Created output directory: $($docConfig.OutputDir)" -ForegroundColor Green
}

# Function to analyze Python code structure
function Analyze-PythonCode {
    Write-Host "`nAnalyzing Python code structure..." -ForegroundColor Yellow
    
    $codeAnalysis = @{
        "total_lines" = 0
        "total_files" = 0
        "classes" = @()
        "functions" = @()
    }
    
    # Find Python files
    $pythonFiles = Get-ChildItem -Path "." -Recurse -Filter "*.py" | Where-Object { 
        $_.FullName -notmatch "venv|__pycache__|\.git|\.pytest_cache" 
    }
    
    foreach ($file in $pythonFiles) {
        try {
            $content = Get-Content $file.FullName -Raw
            $lines = $content -split "`n"
            
            $codeAnalysis.total_files++
            $codeAnalysis.total_lines += $lines.Count
            
            # Find classes
            $classMatches = [regex]::Matches($content, '^class\s+(\w+)', [System.Text.RegularExpressions.RegexOptions]::Multiline)
            foreach ($match in $classMatches) {
                $codeAnalysis.classes += $match.Groups[1].Value
            }
            
            # Find functions
            $functionMatches = [regex]::Matches($content, '^def\s+(\w+)', [System.Text.RegularExpressions.RegexOptions]::Multiline)
            foreach ($match in $functionMatches) {
                $codeAnalysis.functions += $match.Groups[1].Value
            }
            
            Write-Host "  Analyzed: $($file.Name)" -ForegroundColor Green
            
        } catch {
            Write-Host "  Failed to analyze $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    return $codeAnalysis
}

# Function to generate simple API documentation
function Generate-SimpleAPIDoc {
    param($codeAnalysis)
    
    Write-Host "`nGenerating simple API documentation..." -ForegroundColor Yellow
    
    $apiDoc = "# API Documentation - LearnEnglishBot`n`n"
    $apiDoc += "Generated: $($docConfig.Timestamp)`n"
    $apiDoc += "Project: $($docConfig.ProjectName)`n"
    $apiDoc += "Description: $($docConfig.ProjectDescription)`n`n"
    
    $apiDoc += "## Code Statistics`n`n"
    $apiDoc += "- Total Files: $($codeAnalysis.total_files)`n"
    $apiDoc += "- Total Lines: $($codeAnalysis.total_lines)`n"
    $apiDoc += "- Classes: $($codeAnalysis.classes.Count)`n"
    $apiDoc += "- Functions: $($codeAnalysis.functions.Count)`n`n"
    
    $apiDoc += "## Classes`n`n"
    foreach ($class in $codeAnalysis.classes) {
        $apiDoc += "- $class`n"
    }
    
    $apiDoc += "`n## Functions`n`n"
    foreach ($func in $codeAnalysis.functions) {
        $apiDoc += "- $func`n"
    }
    
    $apiDocPath = Join-Path $docConfig.OutputDir "API_DOCUMENTATION.md"
    $apiDoc | Out-File -FilePath $apiDocPath -Encoding UTF8
    
    Write-Host "  API documentation generated: $apiDocPath" -ForegroundColor Green
    return $apiDocPath
}

# Function to generate simple README
function Generate-SimpleREADME {
    param($codeAnalysis)
    
    Write-Host "`nGenerating simple README..." -ForegroundColor Yellow
    
    $readme = "# $($docConfig.ProjectName)`n`n"
    $readme += "$($docConfig.ProjectDescription)`n`n"
    
    $readme += "## Project Statistics`n`n"
    $readme += "- Total Files: $($codeAnalysis.total_files)`n"
    $readme += "- Total Lines: $($codeAnalysis.total_lines)`n"
    $readme += "- Classes: $($codeAnalysis.classes.Count)`n"
    $readme += "- Functions: $($codeAnalysis.functions.Count)`n`n"
    
    $readme += "## Quick Start`n`n"
    $readme += "1. Install dependencies: `pip install -r requirements.txt``n"
    $readme += "2. Set environment variables`n"
    $readme += "3. Run: `python main.py``n`n"
    
    $readme += "## Features`n`n"
    $readme += "- AI-powered English learning`n"
    $readme += "- Voice processing with Whisper`n"
    $readme += "- Progress tracking`n"
    $readme += "- Multi-language support`n`n"
    
    $readmePath = Join-Path $docConfig.OutputDir "README_SIMPLE.md"
    $readme | Out-File -FilePath $readmePath -Encoding UTF8
    
    Write-Host "  Simple README generated: $readmePath" -ForegroundColor Green
    return $readmePath
}

# Main execution
Write-Host "Starting simplified documentation generation..." -ForegroundColor Yellow

# Analyze code structure
$codeAnalysis = Analyze-PythonCode

# Generate documentation based on parameters
$generatedDocs = @()

if ($API -or $All) {
    $apiDoc = Generate-SimpleAPIDoc -codeAnalysis $codeAnalysis
    $generatedDocs += $apiDoc
}

if ($README -or $All) {
    $readme = Generate-SimpleREADME -codeAnalysis $codeAnalysis
    $generatedDocs += $readme
}

# Generate simple index
$indexContent = "# Generated Documentation Index`n`n"
$indexContent += "Generated: $($docConfig.Timestamp)`n"
$indexContent += "Project: $($docConfig.ProjectName)`n`n"

$indexContent += "## Available Documentation`n`n"
foreach ($doc in $generatedDocs) {
    $docName = Split-Path $doc -Leaf
    $indexContent += "- $docName`n"
}

$indexContent += "`n## Code Analysis Summary`n`n"
$indexContent += "- Total Files: $($codeAnalysis.total_files)`n"
$indexContent += "- Total Lines: $($codeAnalysis.total_lines)`n"
$indexContent += "- Classes: $($codeAnalysis.classes.Count)`n"
$indexContent += "- Functions: $($codeAnalysis.functions.Count)`n"

$indexPath = Join-Path $docConfig.OutputDir "DOCUMENTATION_INDEX.md"
$indexContent | Out-File -FilePath $indexPath -Encoding UTF8

# Final report
Write-Host "`nDocumentation Generation Summary" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "Output Directory: $($docConfig.OutputDir)" -ForegroundColor White
Write-Host "Generated Files: $($generatedDocs.Count)" -ForegroundColor White
Write-Host "Code Analysis:" -ForegroundColor White
Write-Host "  Total Files: $($codeAnalysis.total_files)" -ForegroundColor White
Write-Host "  Total Lines: $($codeAnalysis.total_lines)" -ForegroundColor White
Write-Host "  Classes: $($codeAnalysis.classes.Count)" -ForegroundColor White
Write-Host "  Functions: $($codeAnalysis.functions.Count)" -ForegroundColor White

Write-Host "`nGenerated Documentation:" -ForegroundColor Cyan
foreach ($doc in $generatedDocs) {
    $docName = Split-Path $doc -Leaf
    Write-Host "  $docName" -ForegroundColor Green
}

Write-Host "`nDocumentation generation completed!" -ForegroundColor Green
Write-Host "Check the $($docConfig.OutputDir) directory for generated files" -ForegroundColor White
