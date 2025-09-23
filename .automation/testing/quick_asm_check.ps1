# Quick ASM Function Check
# Simple validation of ASM files

Write-Host "ASM Function Quick Check" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

$functions = @("my_strlen", "my_strcmp", "my_strcpy", "factorial_iter", "gcd_u32", "lcm_u32", "my_memcpy", "my_memset", "my_memcmp", "my_memmove", "count_bits", "is_power_of_two")
$knowledgeDir = "knowledge/c"

$totalTests = 0
$passedTests = 0

foreach ($func in $functions) {
    $filePath = Join-Path $knowledgeDir "$func.asm"
    $totalTests++
    
    Write-Host "Testing: $func" -ForegroundColor Cyan
    
    if (!(Test-Path $filePath)) {
        Write-Host "  File not found" -ForegroundColor Red
        continue
    }
    
    try {
        $content = Get-Content $filePath -Raw
        
        $checks = @(
            ($content -match "format\s+ELF64"),
            ($content -match "section\s+'\.text'"),
            ($content -match "global\s+$func"),
            ($content -match "${func}:"),
            ($content -match "push\s+rbp"),
            ($content -match "pop\s+rbp"),
            ($content -match "\s+ret")
        )
        
        $passedChecks = ($checks | Where-Object { $_ }).Count
        $totalChecks = $checks.Count
        
        if ($passedChecks -eq $totalChecks) {
            Write-Host "  PASS ($passedChecks/$totalChecks checks)" -ForegroundColor Green
            $passedTests++
        } else {
            Write-Host "  PARTIAL ($passedChecks/$totalChecks checks)" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "  ERROR reading file" -ForegroundColor Red
    }
}

Write-Host "`nSummary:" -ForegroundColor Magenta
Write-Host "Total: $totalTests"
Write-Host "Passed: $passedTests"
Write-Host "Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 1))%"

if ($passedTests -eq $totalTests) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed" -ForegroundColor Yellow
    exit 1
}
