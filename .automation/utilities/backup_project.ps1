$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dest = Join-Path -Path "backups" -ChildPath "project_$timestamp.zip"
if (!(Test-Path "backups")) { New-Item -ItemType Directory -Path "backups" | Out-Null }
Write-Host "💾 Creating backup: $dest" -ForegroundColor Cyan
Compress-Archive -Path * -DestinationPath $dest -Force -CompressionLevel Optimal
Write-Host "✅ Backup created" -ForegroundColor Green
