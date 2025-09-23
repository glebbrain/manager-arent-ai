param(
    [string]$TestFile = "examples/simple_automation.frdl",
    [string]$OutputFormat = "json",
    [switch]$Verbose,
    [switch]$All
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 Testing Production-Ready FRDL Compiler..." -ForegroundColor Cyan

# Check if main.py exists
if (-not (Test-Path "main.py")) {
    Write-Host "❌ main.py not found. Are you in the FRDL project root?" -ForegroundColor Red
    exit 1
}

# Check if test file exists
if (-not (Test-Path $TestFile)) {
    Write-Host "❌ Test file $TestFile not found" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Testing with file: $TestFile" -ForegroundColor Yellow
Write-Host "🎯 Output format: $OutputFormat" -ForegroundColor Yellow

# Test basic compilation
try {
    $outputFile = "test_output.$OutputFormat"
    $cmd = "python main.py compile `"$TestFile`" -o `"$outputFile`" --format $OutputFormat"
    
    if ($Verbose) {
        $cmd += " --verbose"
        Write-Host "🔍 Running: $cmd" -ForegroundColor Gray
    }
    
    Invoke-Expression $cmd
    
    if (Test-Path $outputFile) {
        Write-Host "✅ Compilation successful! Output: $outputFile" -ForegroundColor Green
        
        # Show output file size
        $size = (Get-Item $outputFile).Length
        Write-Host "📊 Output file size: $size bytes" -ForegroundColor Cyan
        
        # Show first few lines of output
        if ($OutputFormat -eq "json") {
            Write-Host "📄 Output preview:" -ForegroundColor Yellow
            Get-Content $outputFile -Head 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
        }
        
        # Clean up test output
        Remove-Item $outputFile -Force
        Write-Host "🧹 Test output cleaned up" -ForegroundColor Gray
    } else {
        Write-Host "❌ Compilation failed - no output file generated" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Compilation error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test help command
Write-Host "`n📖 Testing help command..." -ForegroundColor Yellow
try {
    $helpOutput = python main.py --help 2>&1
    if ($helpOutput -match "FRDL|usage|compile") {
        Write-Host "✅ Help command working" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Help command output unexpected" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Help command failed" -ForegroundColor Red
}

# Test with all example files if requested
if ($All) {
    Write-Host "`n🔄 Testing all example files..." -ForegroundColor Yellow
    $exampleFiles = Get-ChildItem "examples/*.frdl" -ErrorAction SilentlyContinue
    
    if ($exampleFiles) {
        foreach ($file in $exampleFiles) {
            Write-Host "📝 Testing: $($file.Name)" -ForegroundColor Cyan
            try {
                $testOutput = "test_$($file.BaseName).$OutputFormat"
                python main.py compile $file.FullName -o $testOutput --format $OutputFormat
                
                if (Test-Path $testOutput) {
                    Write-Host "  ✅ $($file.Name) compiled successfully" -ForegroundColor Green
                    Remove-Item $testOutput -Force
                } else {
                    Write-Host "  ❌ $($file.Name) compilation failed" -ForegroundColor Red
                }
            } catch {
                Write-Host "  ❌ $($file.Name) error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "⚠️ No .frdl files found in examples/ directory" -ForegroundColor Yellow
    }
}

# Test VS Code extension if available
Write-Host "`n🔌 Testing VS Code Extension..." -ForegroundColor Yellow
if (Test-Path "vscode-extension") {
    Write-Host "📁 VS Code extension directory found" -ForegroundColor Green
    
    # Check if extension files exist
    $extensionFiles = @(
        "vscode-extension/package.json",
        "vscode-extension/src/extension.ts",
        "vscode-extension/syntaxes/frdl.tmLanguage.json",
        "vscode-extension/snippets/frdl.json"
    )
    
    $missingFiles = @()
    foreach ($file in $extensionFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -eq 0) {
        Write-Host "✅ All VS Code extension files present" -ForegroundColor Green
        
        # Check package.json version
        try {
            $packageJson = Get-Content "vscode-extension/package.json" | ConvertFrom-Json
            Write-Host "📦 Extension version: $($packageJson.version)" -ForegroundColor Cyan
            
            # Check if it's v2.0.0 or higher
            if ([version]$packageJson.version -ge [version]"2.0.0") {
                Write-Host "🚀 Advanced VS Code Extension v2.0+ detected!" -ForegroundColor Green
                Write-Host "  ✨ Features: Formatting, Testing, Debugging, Advanced Snippets" -ForegroundColor Cyan
            }
        } catch {
            Write-Host "⚠️ Could not parse package.json" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Missing VS Code extension files:" -ForegroundColor Yellow
        foreach ($file in $missingFiles) {
            Write-Host "  - $file" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠️ VS Code extension directory not found" -ForegroundColor Yellow
}

Write-Host "`n🎉 FRDL Compiler testing completed!" -ForegroundColor Green
exit 0
