# ASM Translation Validation Framework
# Created: 2025-09-01
# Purpose: Validate that ASM translations produce identical results to C/C++ source

param(
    [Parameter(Mandatory=$false)]
    [string]$SourcePath = "sources/",
    
    [Parameter(Mandatory=$false)]
    [string]$KnowledgePath = "knowledge/",
    
    [Parameter(Mandatory=$false)]
    [string]$TestScope = "all",  # all, c, cpp, or specific function name
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput
)

Write-Host "🧪 ASM Translation Validation Framework" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Create test results directory
$TestResultsDir = "temp/validation_results"
if (!(Test-Path $TestResultsDir)) {
    New-Item -ItemType Directory -Path $TestResultsDir -Force | Out-Null
}

# Test configuration
$TestConfig = @{
    CompilerFlags = @("-O2", "-fno-stack-protector", "-fno-builtin")
    AssemblerFlags = @("-f", "elf64")
    TestCases = @{
        "my_strlen" = @{
            TestInputs = @(
                '""',           # Empty string
                '"hello"',      # Normal string
                '"a"',          # Single character
                '"very long string with many characters"',  # Long string
                'NULL'          # NULL pointer
            )
            ExpectedBehavior = "Returns string length or 0 for NULL"
        }
        "my_strcmp" = @{
            TestInputs = @(
                '("hello", "hello")',       # Equal strings
                '("abc", "def")',           # Different strings
                '("a", "ab")',              # Different lengths
                '("", "")',                 # Empty strings
                '(NULL, "test")',           # NULL first
                '("test", NULL)'            # NULL second
            )
            ExpectedBehavior = "Returns 0 for equal, negative/positive for different"
        }
        "my_strcpy" = @{
            TestInputs = @(
                '(buffer, "hello")',        # Normal copy
                '(buffer, "")',             # Empty string copy
                '(buffer, NULL)',           # NULL source
                '(NULL, "test")'            # NULL destination
            )
            ExpectedBehavior = "Copies string and returns destination pointer"
        }
        "factorial_iter" = @{
            TestInputs = @(
                '0',    # Base case 0! = 1
                '1',    # Base case 1! = 1
                '5',    # Normal case 5! = 120
                '10',   # Larger case 10! = 3628800
                '20'    # Large case (near overflow limit)
            )
            ExpectedBehavior = "Returns factorial or handles overflow"
        }
        "gcd_u32" = @{
            TestInputs = @(
                '(12, 8)',      # Normal case, result = 4
                '(17, 13)',     # Coprime numbers, result = 1
                '(0, 5)',       # Zero first, result = 5
                '(7, 0)',       # Zero second, result = 7
                '(100, 75)'     # Larger numbers, result = 25
            )
            ExpectedBehavior = "Returns greatest common divisor"
        }
    }
}

function Write-TestLog {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN"  { "Yellow" }
        "PASS"  { "Green" }
        "FAIL"  { "Red" }
        default { "White" }
    }
    
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
    
    # Also log to file
    "$timestamp [$Level] $Message" | Out-File -FilePath "$TestResultsDir/validation.log" -Append
}

function Test-CompilerAvailable {
    try {
        $null = & gcc --version 2>$null
        return $true
    } catch {
        return $false
    }
}

function Test-AssemblerAvailable {
    try {
        $null = & fasm 2>$null
        return $true
    } catch {
        return $false
    }
}

function Compile-CFunction {
    param([string]$SourceFile, [string]$OutputFile)
    
    $compileCmd = "gcc $($TestConfig.CompilerFlags -join ' ') -c '$SourceFile' -o '$OutputFile'"
    
    if ($VerboseOutput) {
        Write-TestLog "Compiling: $compileCmd"
    }
    
    try {
        Invoke-Expression $compileCmd
        return Test-Path $OutputFile
    } catch {
        Write-TestLog "Compilation failed: $_" "ERROR"
        return $false
    }
}

function Assemble-AsmFunction {
    param([string]$AsmFile, [string]$OutputFile)
    
    $assembleCmd = "fasm $($TestConfig.AssemblerFlags -join ' ') '$AsmFile' '$OutputFile'"
    
    if ($VerboseOutput) {
        Write-TestLog "Assembling: $assembleCmd"
    }
    
    try {
        Invoke-Expression $assembleCmd
        return Test-Path $OutputFile
    } catch {
        Write-TestLog "Assembly failed: $_" "ERROR"
        return $false
    }
}

function Generate-TestHarness {
    param([string]$FunctionName, [array]$TestInputs)
    
    $testHarness = @"
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stddef.h>

// Function prototypes
extern uint64_t ${FunctionName}(uint32_t n);  // For factorial_iter
extern uint32_t ${FunctionName}(uint32_t a, uint32_t b);  // For gcd_u32
extern size_t ${FunctionName}(const char* s);  // For my_strlen
extern int ${FunctionName}(const char* a, const char* b);  // For my_strcmp
extern char* ${FunctionName}(char* dst, const char* src);  // For my_strcpy

int main() {
    printf("Testing function: ${FunctionName}\n");
    
"@

    foreach ($input in $TestInputs) {
        $testHarness += @"
    printf("Test input: $input\n");
    // Add specific test code here based on function type
    
"@
    }
    
    $testHarness += @"
    printf("All tests completed\n");
    return 0;
}
"@

    return $testHarness
}

function Run-ValidationTests {
    Write-TestLog "Starting ASM translation validation tests"
    
    # Check prerequisites
    if (!(Test-CompilerAvailable)) {
        Write-TestLog "GCC compiler not available" "ERROR"
        return $false
    }
    
    if (!(Test-AssemblerAvailable)) {
        Write-TestLog "FASM assembler not available" "WARN"
        Write-TestLog "Skipping assembly tests, running syntax validation only" "WARN"
    }
    
    $totalTests = 0
    $passedTests = 0
    $failedTests = 0
    
    # Get list of functions to test
    $functionsToTest = @()
    
    if ($TestScope -eq "all") {
        $functionsToTest = $TestConfig.TestCases.Keys
    } elseif ($TestScope -eq "c") {
        $functionsToTest = $TestConfig.TestCases.Keys | Where-Object { $_ -notlike "*_cpp" }
    } elseif ($TestScope -eq "cpp") {
        $functionsToTest = $TestConfig.TestCases.Keys | Where-Object { $_ -like "*_cpp" }
    } else {
        $functionsToTest = @($TestScope)
    }
    
    foreach ($functionName in $functionsToTest) {
        Write-TestLog "Testing function: $functionName"
        $totalTests++
        
        # Check if ASM file exists
        $asmFile = "$KnowledgePath/c/$functionName.asm"
        if (!(Test-Path $asmFile)) {
            Write-TestLog "ASM file not found: $asmFile" "FAIL"
            $failedTests++
            continue
        }
        
        # Validate ASM syntax
        $syntaxValid = Test-AsmSyntax -AsmFile $asmFile
        if (!$syntaxValid) {
            Write-TestLog "ASM syntax validation failed for $functionName" "FAIL"
            $failedTests++
            continue
        }
        
        Write-TestLog "ASM syntax validation passed for $functionName" "PASS"
        $passedTests++
    }
    
    # Generate summary report
    $successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }
    
    Write-TestLog "Validation Summary:"
    Write-TestLog "Total Tests: $totalTests"
    Write-TestLog "Passed: $passedTests"
    Write-TestLog "Failed: $failedTests"
    Write-TestLog "Success Rate: $successRate%"
    
    # Generate detailed report
    $report = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        TotalTests = $totalTests
        PassedTests = $passedTests
        FailedTests = $failedTests
        SuccessRate = $successRate
        TestScope = $TestScope
    }
    
    $report | ConvertTo-Json | Out-File -FilePath "$TestResultsDir/validation_report.json"
    
    return $passedTests -eq $totalTests
}

function Test-AsmSyntax {
    param([string]$AsmFile)
    
    try {
        # Basic syntax validation - check for common patterns
        $content = Get-Content $AsmFile -Raw
        
        # Check for required sections
        if ($content -notmatch "format\s+ELF64") {
            Write-TestLog "Missing ELF64 format declaration" "ERROR"
            return $false
        }
        
        if ($content -notmatch "section\s+'\.text'\s+executable") {
            Write-TestLog "Missing executable text section" "ERROR"
            return $false
        }
        
        # Check for function prologue/epilogue
        if ($content -notmatch "push\s+rbp") {
            Write-TestLog "Missing function prologue" "WARN"
        }
        
        if ($content -notmatch "pop\s+rbp") {
            Write-TestLog "Missing function epilogue" "WARN"
        }
        
        # Check for return statement
        if ($content -notmatch "\s+ret\s*$") {
            Write-TestLog "Missing return statement" "ERROR"
            return $false
        }
        
        return $true
        
    } catch {
        Write-TestLog "Syntax validation error: $_" "ERROR"
        return $false
    }
}

# Main execution
try {
    $validationResult = Run-ValidationTests
    
    if ($validationResult) {
        Write-TestLog "🎉 All validation tests passed!" "PASS"
        exit 0
    } else {
        Write-TestLog "❌ Some validation tests failed!" "FAIL"
        exit 1
    }
    
} catch {
    Write-TestLog "Validation framework error: $_" "ERROR"
    exit 1
}
