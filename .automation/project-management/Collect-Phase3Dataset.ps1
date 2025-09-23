param(
    [switch]$Export,
    [string]$ExportDir = "data/ml/finetuning"
)

Write-Host "📦 Collecting Phase 3 dataset..." -ForegroundColor Cyan

# Ensure UTF-8 console to avoid emoji issues
if ($PSVersionTable.PSEdition -eq 'Core') {
    $PSStyle.OutputRendering = 'PlainText'
}

# Run collection with Python UTF-8 mode
python -X utf8 .\scripts\ml\collect_browser_dataset.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dataset collection failed" -ForegroundColor Red
    exit 1
}

if ($Export) {
    Write-Host "🚀 Exporting dataset..." -ForegroundColor Cyan
    python -X utf8 .\scripts\ml\export_llm_finetuning.py --output-dir $ExportDir --formats jsonl huggingface openai
}

Write-Host "✅ Phase 3 dataset collection complete." -ForegroundColor Green

