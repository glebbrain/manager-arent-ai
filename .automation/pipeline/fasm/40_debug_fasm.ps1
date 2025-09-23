param(
    [string]$Scope = "all",   # all|c|cpp|file:path
    [switch]$AssembleOnly,
    [switch]$RunQemu
)

Write-Host "🐛 [FASM-40] Debug FASM" -ForegroundColor Cyan

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

# Ensure bin dir
if (-not (Test-Path "bin")) { New-Item -ItemType Directory -Path "bin" | Out-Null }

foreach ($file in $targets) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $outBin = Join-Path "bin" $base
    Write-Host "🔨 Assemble: $($file.FullName) -> $outBin" -ForegroundColor Yellow
    try {
        fasm $file.FullName $outBin | ForEach-Object { $_ }
        Write-Host "✅ Assembled: $outBin" -ForegroundColor Green
    } catch {
        Write-Host "❌ FASM error on $($file.FullName)" -ForegroundColor Red
        continue
    }
}

if ($RunQemu -and -not $AssembleOnly) {
    Write-Host "▶️ QEMU run (provide your ISO/IMG to boot MenuetOS64)" -ForegroundColor Cyan
    Write-Host "Example: qemu-system-x86_64 -cdrom .\\menuetos64.iso -m 256 -serial stdio" -ForegroundColor DarkGray
}
