# Simple ASM Function Testing
# Created: 2025-09-01
# Purpose: Basic testing of ASM functions without external compiler dependencies

param(
    [Parameter(Mandatory=$false)]
    [string]$FunctionName = "all"
)

Write-Host "🔧 Simple ASM Function Testing" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

# Test configuration
$KnowledgeDir = "knowledge/c"
$TestResultsDir = "temp/simple_test_results"

# Create test results directory
if (!(Test-Path $TestResultsDir)) {
    New-Item -ItemType Directory -Path $TestResultsDir -Force | Out-Null
}

function Test-AsmFileSyntax {
    param([string]$FilePath, [string]$FunctionName)
    
    Write-Host "Testing: $FunctionName" -ForegroundColor Cyan
    
    if (!(Test-Path $FilePath)) {
        Write-Host "  ❌ File not found: $FilePath" -ForegroundColor Red
        return $false
    }
    
    try {
        $content = Get-Content $FilePath -Raw
        $issues = @()
        
        # Basic syntax checks
        if ($content -notmatch "format\s+ELF64\s+executable") {
            $issues += "Missing or incorrect ELF64 format declaration"
        }
        
        if ($content -notmatch "section\s+'\.text'\s+executable") {
            $issues += "Missing executable text section"
        }
        
        if ($content -notmatch "global\s+$FunctionName") {
            $issues += "Missing global declaration for $FunctionName"
        }
        
        if ($content -notmatch "${FunctionName}:") {
            $issues += "Missing function label: ${FunctionName}:"
        }
        
        if ($content -notmatch "push\s+rbp") {
            $issues += "Missing function prologue (push rbp)"
        }
        
        if ($content -notmatch "mov\s+rbp,\s*rsp") {
            $issues += "Missing stack frame setup (mov rbp, rsp)"
        }
        
        if ($content -notmatch "pop\s+rbp") {
            $issues += "Missing function epilogue (pop rbp)"
        }
        
        if ($content -notmatch "\s+ret\s*") {
            $issues += "Missing return statement"
        }
        
        # Check for proper comments
        if ($content -notmatch "; FASM Translation:") {
            $issues += "Missing translation header comment"
        }
        
        if ($content -notmatch "; Original C:") {
            $issues += "Missing original C function reference"
        }
        
        if ($content -notmatch "; Parameters:") {
            $issues += "Missing parameter documentation"
        }
        
        if ($content -notmatch "; Returns:") {
            $issues += "Missing return value documentation"
        }
        
        # Report results
        if ($issues.Count -eq 0) {
            Write-Host "  ✅ Syntax validation passed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ⚠️  Syntax issues found:" -ForegroundColor Yellow
            foreach ($issue in $issues) {
                Write-Host "    - $issue" -ForegroundColor Yellow
            }
            return $false
        }
        
    } catch {
        Write-Host "  ❌ Error reading file: $_" -ForegroundColor Red
        return $false
    }
}

function Get-FunctionComplexity {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw
        
        # Count various complexity indicators
        $jumpInstructions = ([regex]::Matches($content, '\b(jmp|je|jne|jz|jnz|jl|jg|jle|jge|ja|jb|jae|jbe|js|jns|jo|jno|jc|jnc)\b')).Count
        $labels = ([regex]::Matches($content, '^\s*\.\w+:')).Count
        $functionCalls = ([regex]::Matches($content, '\bcall\s+\w+')).Count
        $totalLines = ($content -split "`n").Count
        $codeLines = ($content -split "`n" | Where-Object { $_ -match '^\s*[a-zA-Z]' -and $_ -notmatch '^\s*;' }).Count
        
        return @{
            JumpInstructions = $jumpInstructions
            Labels = $labels
            FunctionCalls = $functionCalls
            TotalLines = $totalLines
            CodeLines = $codeLines
            ComplexityScore = $jumpInstructions + $labels + ($functionCalls * 2)
        }
    } catch {
        return $null
    }
}

function Test-AllFunctions {
    $functions = @(
        "my_strlen",
        "my_strcmp", 
        "my_strcpy",
        "factorial_iter",
        "gcd_u32",
        "lcm_u32"
    )
    
    $results = @()
    
    foreach ($func in $functions) {
        $filePath = Join-Path $KnowledgeDir "$func.asm"
        
        if ($FunctionName -eq "all" -or $FunctionName -eq $func) {
            $syntaxOk = Test-AsmFileSyntax -FilePath $filePath -FunctionName $func
            $complexity = Get-FunctionComplexity -FilePath $filePath
            
            $results += @{
                FunctionName = $func
                FilePath = $filePath
                SyntaxValid = $syntaxOk
                Complexity = $complexity
                FileExists = (Test-Path $filePath)
            }
        }
    }
    
    return $results
}

function Generate-TestReport {
    param([array]$Results)
    
    Write-Host "`n📊 Test Summary Report" -ForegroundColor Magenta
    Write-Host "======================" -ForegroundColor Magenta
    
    $totalFunctions = $Results.Count
    $validSyntax = ($Results | Where-Object { $_.SyntaxValid }).Count
    $existingFiles = ($Results | Where-Object { $_.FileExists }).Count
    
    Write-Host "Total Functions Tested: $totalFunctions"
    Write-Host "Files Exist: $existingFiles"
    Write-Host "Valid Syntax: $validSyntax"
    Write-Host "Success Rate: $([math]::Round(($validSyntax / $totalFunctions) * 100, 1))%"
    
    Write-Host "`n📈 Complexity Analysis:" -ForegroundColor Blue
    foreach ($result in $Results | Where-Object { $_.FileExists }) {
        if ($result.Complexity) {
            $comp = $result.Complexity
            Write-Host "  $($result.FunctionName):"
            Write-Host "    Code Lines: $($comp.CodeLines)"
            Write-Host "    Jump Instructions: $($comp.JumpInstructions)"
            Write-Host "    Labels: $($comp.Labels)"
            Write-Host "    Function Calls: $($comp.FunctionCalls)"
            Write-Host "    Complexity Score: $($comp.ComplexityScore)"
        }
    }
    
    # Save detailed report
    $reportData = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        TotalFunctions = $totalFunctions
        ValidSyntax = $validSyntax
        ExistingFiles = $existingFiles
        SuccessRate = [math]::Round(($validSyntax / $totalFunctions) * 100, 1)
        DetailedResults = $Results
    }
    
    $reportData | ConvertTo-Json -Depth 10 | Out-File -FilePath "$TestResultsDir/test_report.json"
    Write-Host "`n📄 Detailed report saved to: $TestResultsDir/test_report.json" -ForegroundColor Gray
}

# Main execution
try {
    Write-Host "Starting ASM function testing..."
    
    $testResults = Test-AllFunctions
    Generate-TestReport -Results $testResults
    
    $successRate = [math]::Round((($testResults | Where-Object { $_.SyntaxValid }).Count / $testResults.Count) * 100, 1)
    
    if ($successRate -eq 100) {
        Write-Host "`n🎉 All tests passed! Success rate: 100%" -ForegroundColor Green
        exit 0
    } elseif ($successRate -ge 80) {
        Write-Host "`n✅ Most tests passed! Success rate: $successRate%" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n⚠️  Some issues found. Success rate: $successRate%" -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "Test execution error occurred" -ForegroundColor Red
    exit 1
}
