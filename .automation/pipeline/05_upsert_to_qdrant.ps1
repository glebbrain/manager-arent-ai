Write-Host "📥 [05] Upsert to Qdrant (stub)" -ForegroundColor Cyan
$env:QDRANT_URL = $env:QDRANT_URL ?? "http://localhost:6333"
# TODO: POST points to Qdrant collection asm_functions with payload
