param(
    [string]$Scope = "all"  # all|c|cpp|file:path
)

Write-Host "🩺 [FASM-30] Fix common FASM errors (stub)" -ForegroundColor Cyan

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
    # Placeholder fixes: replace tabs with spaces, ensure newline at EOF, fix CRLF
    $content = $content -replace "\t", "    "
    if (-not $content.EndsWith("`r`n")) { $content += "`r`n" }
    $content = $content -replace "\r?\n", "`r`n"

    # Ensure label format valid for fasm (basic check)
    $content = $content -replace "^(\s*)([A-Za-z_][A-Za-z0-9_]*):\s*;?\s*$", "$1$2:`r`n", 'Multiline'

    $content | Out-File -FilePath $file.FullName -Encoding UTF8
    Write-Host "🧩 Fixed: $($file.FullName)" -ForegroundColor Green
}
