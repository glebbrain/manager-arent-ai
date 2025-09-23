param(
  [string]$Scope = "control-files"
)

Write-Host "🔗 Running integration checks ($Scope)..." -ForegroundColor Cyan

switch ($Scope) {
  "control-files" {
    $required = @(
      ".manager/IDEA.md",
      ".manager/TODO.md",
      ".manager/COMPLETED.md",
      ".manager/ERRORS.md",
      ".manager/start.md",
      ".manager/cursor.json"
    )
    $missing = @()
    foreach ($p in $required) { if (!(Test-Path $p)) { $missing += $p } }
    if ($missing.Count -gt 0) {
      Write-Host "❌ Missing: $($missing -join ', ')" -ForegroundColor Red
      exit 1
    }
    Write-Host "✅ Control files present" -ForegroundColor Green
  }
  default {
    Write-Host "⚠️ Unknown scope: $Scope" -ForegroundColor Yellow
  }
}

exit 0
