param(
  [int]$Iterations = 1,
  [switch]$Verbose
)

Write-Host "🚀 Performance test starting..." -ForegroundColor Cyan

$sw = [System.Diagnostics.Stopwatch]::StartNew()
for ($i=1; $i -le $Iterations; $i++) {
  if ($Verbose) { Write-Host "Run #$i: validate_project" -ForegroundColor DarkGray }
  & .\.automation\validation\validate_project.ps1 | Out-Null
}
$sw.Stop()

$avg = [Math]::Round($sw.Elapsed.TotalSeconds / [Math]::Max(1,$Iterations), 3)
Write-Host ("⏱️  Total: {0:N3}s | Avg: {1:N3}s over {2} runs" -f $sw.Elapsed.TotalSeconds, $avg, $Iterations) -ForegroundColor Green

exit 0
