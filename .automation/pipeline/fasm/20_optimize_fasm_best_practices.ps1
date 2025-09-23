param(
    [string]$Scope = "all"  # all|c|cpp|file:path
)

Write-Host "⚙️ [FASM-20] Optimize FASM with best practices (stub)" -ForegroundColor Cyan

function Get-Targets($scope) {
    if ($scope -eq "c") { return Get-ChildItem "knowledge/c" -Filter *.asm -Recurse -ErrorAction SilentlyContinue }
    if ($scope -eq "cpp") { return Get-ChildItem "knowledge/cpp" -Filter *.asm -Recurse -ErrorAction SilentlyContinue }
    if ($scope -like "file:*") {
        $p = $scope.Substring(5)
        if (Test-Path $p) { return ,(Get-Item $p) }
        else { return @() }
    }
    $all = @()
    if (Test-Path "knowledge/c") { $all += Get-ChildItem "knowledge/c" -Filter *.asm -Recurse }
    if (Test-Path "knowledge/cpp") { $all += Get-ChildItem "knowledge/cpp" -Filter *.asm -Recurse }
    return $all
}

$targets = Get-Targets $Scope
if (-not $targets -or $targets.Count -eq 0) { Write-Host "⚠️ No FASM files found in knowledge/*" -ForegroundColor Yellow; exit 0 }

foreach ($file in $targets) {
    $content = Get-Content $file.FullName -Raw
    # Placeholder: ensure use64 present, remove trailing spaces, standardize ret
    if ($content -notmatch "use64") { $content = "use64`r`n" + $content }
    $content = ($content -split "`n") | ForEach-Object { $_.TrimEnd() } | Out-String
    if ($content -notmatch "\bret\b") { $content += "ret`r`n" }

    # Insert best-practice header if missing
    if ($content -notmatch "; Best Practices:") {
        $bp = @"
; Best Practices:
; - Keep hot path minimal, avoid unnecessary stack usage
; - Use registers wisely, align stack if needed
; - Follow MenuetOS64 calling conventions
; - Document clobbered registers and inputs/outputs
"@
        $content = $bp + $content
    }

    $content | Out-File -FilePath $file.FullName -Encoding UTF8
    Write-Host "✅ Optimized: $($file.FullName)" -ForegroundColor Green
}
