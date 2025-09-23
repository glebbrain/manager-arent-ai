param(
    [switch]$Emergency,
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

try {
    $repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

    # Basic quick fixes (best-effort)
    $out = Join-Path $repoRoot 'out'
    if (-not (Test-Path -LiteralPath $out)) { New-Item -ItemType Directory -Force -Path $out | Out-Null }

    # Ensure control files exist
    $ctrl = @('.manager/TODO.md','.manager/ERRORS.md','.manager/COMPLETED.md')
    foreach ($c in $ctrl) {
        $abs = Join-Path $repoRoot $c
        if (-not (Test-Path -LiteralPath $abs)) {
            New-Item -ItemType File -Force -Path $abs | Out-Null
            if (-not $Quiet) { Write-Host "[FIX] Created missing $c" }
        }
    }

    if (-not $Quiet) {
        if ($Emergency) { Write-Host 'quick_fix: Emergency mode applied' } else { Write-Host 'quick_fix: Standard mode applied' }
    }
    exit 0
}
catch {
    if (-not $Quiet) { Write-Error $_ }
    exit 1
}
