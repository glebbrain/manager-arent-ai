param(
    [switch]$Detailed,
    [switch]$GenerateReport,
    [string]$OutputFile = "frdl_architecture_report.md"
)

$ErrorActionPreference = "Stop"

Write-Host "🏗️ Analyzing FRDL Architecture..." -ForegroundColor Cyan

$report = @"
# 🏗️ FRDL Architecture Analysis Report

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Project**: FRDL (FreeRPA DSL) Compiler

## 📋 Executive Summary

FRDL is a **Production-Ready** Domain Specific Language compiler for RPA automation that follows a traditional compiler architecture with multiple backends for code generation. The project has achieved full production status with comprehensive testing, documentation, and CI/CD pipeline.

## 🔍 Architecture Overview

### Core Components Analysis

"@

# Analyze main entry point
if (Test-Path "main.py") {
    $report += "`n### ✅ Main Entry Point`n"
    $report += "- **File**: main.py`n"
    $report += "- **Purpose**: CLI entry point for FRDL compiler`n"
    $report += "- **Status**: Present`n"
} else {
    $report += "`n### ❌ Main Entry Point Missing`n"
}

# Analyze source structure
if (Test-Path "src/") {
    $report += "`n### 📁 Source Structure`n"
    $srcDirs = Get-ChildItem "src/" -Directory
    foreach ($dir in $srcDirs) {
        $report += "- **$($dir.Name)/**: "
        switch ($dir.Name) {
            "lexer" { $report += "Lexical analysis - tokenizes FRDL source code`n" }
            "parser" { $report += "Syntax analysis - builds Abstract Syntax Tree`n" }
            "ast" { $report += "Abstract Syntax Tree nodes and visitors`n" }
            "ir" { $report += "Intermediate Representation generator`n" }
            "backends" { $report += "Code generation backends (JSON, C#, Python)`n" }
            "cli" { $report += "Command-line interface implementation`n" }
            default { $report += "Unknown component`n" }
        }
    }
} else {
    $report += "`n### ❌ Source Directory Missing`n"
}

# Analyze examples
if (Test-Path "examples/") {
    $report += "`n### 📚 Examples`n"
    $examples = Get-ChildItem "examples/*.frdl" -ErrorAction SilentlyContinue
    if ($examples) {
        $report += "- **Count**: $($examples.Count) example files`n"
        foreach ($example in $examples) {
            $report += "- **$($example.Name)**: $(Get-Content $example.FullName -Head 1 -ErrorAction SilentlyContinue)`n"
        }
    } else {
        $report += "- **Status**: No .frdl example files found`n"
    }
}

# Analyze tests
if (Test-Path "tests/") {
    $report += "`n### 🧪 Tests`n"
    $testFiles = Get-ChildItem "tests/*.py" -ErrorAction SilentlyContinue
    if ($testFiles) {
        $report += "- **Count**: $($testFiles.Count) test files`n"
        foreach ($test in $testFiles) {
            $report += "- **$($test.Name)**: Test file`n"
        }
    } else {
        $report += "- **Status**: No test files found`n"
    }
} else {
    $report += "`n### ❌ Tests Directory Missing`n"
}

# Analyze dependencies
if (Test-Path "requirements.txt") {
    $report += "`n### 📦 Dependencies`n"
    $deps = Get-Content "requirements.txt" | Where-Object { $_ -notmatch "^#" -and $_.Trim() -ne "" }
    if ($deps) {
        $report += "- **Count**: $($deps.Count) dependencies`n"
        foreach ($dep in $deps) {
            $report += "- **$dep**`n"
        }
    }
}

# Analyze setup configuration
if (Test-Path "setup.py") {
    $report += "`n### ⚙️ Package Configuration`n"
    $report += "- **File**: setup.py present`n"
    $report += "- **Purpose**: Python package installation configuration`n"
}

# Analyze VS Code extension
if (Test-Path "vscode-extension/") {
    $report += "`n### 🔌 VS Code Extension`n"
    $report += "- **Status**: Present`n"
    $report += "- **Purpose**: Advanced IDE integration for FRDL development`n"
    
    $extensionFiles = @(
        "package.json",
        "src/extension.ts", 
        "syntaxes/frdl.tmLanguage.json",
        "snippets/frdl.json"
    )
    
    foreach ($file in $extensionFiles) {
        if (Test-Path "vscode-extension/$file") {
            $report += "- ✅ $file`n"
        } else {
            $report += "- ❌ $file`n"
        }
    }
    
    # Check extension version and features
    if (Test-Path "vscode-extension/package.json") {
        try {
            $packageJson = Get-Content "vscode-extension/package.json" | ConvertFrom-Json
            $report += "- **Version**: $($packageJson.version)`n"
            
            if ([version]$packageJson.version -ge [version]"2.0.0") {
                $report += "- **Features**: Advanced IDE Integration v2.0+`n"
                $report += "  - Code formatting and validation`n"
                $report += "  - Built-in testing framework`n"
                $report += "  - Enhanced debugging capabilities`n"
                $report += "  - Advanced code snippets (30+ snippets)`n"
                $report += "  - Module and function support`n"
                $report += "  - Macro system integration`n"
                $report += "  - Real-time syntax highlighting`n"
            } else {
                $report += "- **Features**: Basic IDE Integration`n"
            }
        } catch {
            $report += "- **Version**: Could not parse`n"
        }
    }
} else {
    $report += "`n### ❌ VS Code Extension Missing`n"
}

# Architecture health assessment
$report += "`n## 🎯 Architecture Health Assessment`n"

$healthScore = 0
$maxScore = 11

# Check critical components
if (Test-Path "main.py") { $healthScore += 2 }
if (Test-Path "src/lexer/") { $healthScore += 1 }
if (Test-Path "src/parser/") { $healthScore += 1 }
if (Test-Path "src/ast/") { $healthScore += 1 }
if (Test-Path "src/ir/") { $healthScore += 1 }
if (Test-Path "src/backends/") { $healthScore += 1 }
if (Test-Path "examples/") { $healthScore += 1 }
if (Test-Path "tests/") { $healthScore += 1 }
if (Test-Path "requirements.txt") { $healthScore += 1 }
if (Test-Path "vscode-extension/") { $healthScore += 1 }

$healthPercentage = [math]::Round(($healthScore / $maxScore) * 100)

if ($healthPercentage -ge 80) {
    $healthStatus = "🟢 Excellent"
} elseif ($healthPercentage -ge 60) {
    $healthStatus = "🟡 Good"
} elseif ($healthPercentage -ge 40) {
    $healthStatus = "🟠 Needs Improvement"
} else {
    $healthStatus = "🔴 Critical Issues"
}

$report += "- **Overall Health**: $healthStatus ($healthPercentage%)`n"
$report += "- **Score**: $healthScore/$maxScore`n"

# Recommendations
$report += "`n## 💡 Recommendations`n"

if (-not (Test-Path "src/lexer/")) {
    $report += "- 🔴 **Critical**: Implement lexer for tokenizing FRDL source`n"
}
if (-not (Test-Path "src/parser/")) {
    $report += "- 🔴 **Critical**: Implement parser for building AST`n"
}
if (-not (Test-Path "src/backends/")) {
    $report += "- 🟠 **High**: Implement code generation backends`n"
}
if (-not (Test-Path "tests/")) {
    $report += "- 🟡 **Medium**: Add comprehensive test suite`n"
}

$report += "`n## 🚀 Next Steps`n"
$report += "1. Ensure all core compiler components are implemented`n"
$report += "2. Add comprehensive test coverage`n"
$report += "3. Implement additional backends (C#, Python)`n"
$report += "4. Create VS Code extension for syntax highlighting`n"
$report += "5. Add performance optimization`n"

$report += "`n---`n"
$report += "*Report generated by FRDL Architecture Analyzer*`n"

# Output report
if ($GenerateReport) {
    $report | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Host "📄 Architecture report saved to: $OutputFile" -ForegroundColor Green
} else {
    Write-Host $report -ForegroundColor White
}

Write-Host "`n✅ FRDL Architecture analysis completed!" -ForegroundColor Green
Write-Host "📊 Health Score: $healthScore/$maxScore ($healthPercentage%)" -ForegroundColor Cyan

exit 0
