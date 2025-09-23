# New AI/ML Aliases v4.2 - Quick Access Commands for Advanced AI/ML Modules
# Version: 4.2.0
# Date: 2025-01-31
# Description: Quick access aliases for all AI/ML modules v4.2

# AI Advanced ML Manager v4.2 Aliases
Set-Alias -Name "aiml" -Value "pwsh -File .automation/AI-Advanced-ML-Manager-v4.2.ps1"
Set-Alias -Name "aiml-all" -Value "pwsh -File .automation/AI-Advanced-ML-Manager-v4.2.ps1 -Action all"
Set-Alias -Name "aiml-status" -Value "pwsh -File .automation/AI-Advanced-ML-Manager-v4.2.ps1 -Action status"
Set-Alias -Name "aiml-test" -Value "pwsh -File .automation/AI-Advanced-ML-Manager-v4.2.ps1 -Action test"
Set-Alias -Name "aiml-deploy" -Value "pwsh -File .automation/AI-Advanced-ML-Manager-v4.2.ps1 -Action deploy"

# Explainable AI v4.2 Aliases
Set-Alias -Name "xai" -Value "pwsh -File .automation/Explainable-AI-v4.2.ps1"
Set-Alias -Name "xai-analyze" -Value "pwsh -File .automation/Explainable-AI-v4.2.ps1 -Action analyze"
Set-Alias -Name "xai-explain" -Value "pwsh -File .automation/Explainable-AI-v4.2.ps1 -Action explain"
Set-Alias -Name "xai-visualize" -Value "pwsh -File .automation/Explainable-AI-v4.2.ps1 -Action visualize"
Set-Alias -Name "xai-bias" -Value "pwsh -File .automation/Explainable-AI-v4.2.ps1 -Action bias"
Set-Alias -Name "xai-audit" -Value "pwsh -File .automation/Explainable-AI-v4.2.ps1 -Action audit"
Set-Alias -Name "xai-compliance" -Value "pwsh -File .automation/Explainable-AI-v4.2.ps1 -Action compliance"
Set-Alias -Name "xai-report" -Value "pwsh -File .automation/Explainable-AI-v4.2.ps1 -Action report"

# AI Model Versioning v4.2 Aliases
Set-Alias -Name "aimv" -Value "pwsh -File .automation/AI-Model-Versioning-v4.2.ps1"
Set-Alias -Name "aimv-version" -Value "pwsh -File .automation/AI-Model-Versioning-v4.2.ps1 -Action version"
Set-Alias -Name "aimv-deploy" -Value "pwsh -File .automation/AI-Model-Versioning-v4.2.ps1 -Action deploy"
Set-Alias -Name "aimv-rollback" -Value "pwsh -File .automation/AI-Model-Versioning-v4.2.ps1 -Action rollback"
Set-Alias -Name "aimv-compare" -Value "pwsh -File .automation/AI-Model-Versioning-v4.2.ps1 -Action compare"
Set-Alias -Name "aimv-monitor" -Value "pwsh -File .automation/AI-Model-Versioning-v4.2.ps1 -Action monitor"
Set-Alias -Name "aimv-retire" -Value "pwsh -File .automation/AI-Model-Versioning-v4.2.ps1 -Action retire"
Set-Alias -Name "aimv-migrate" -Value "pwsh -File .automation/AI-Model-Versioning-v4.2.ps1 -Action migrate"

# AI Ethics v4.2 Aliases
Set-Alias -Name "aiethics" -Value "pwsh -File .automation/AI-Ethics-v4.2.ps1"
Set-Alias -Name "aiethics-bias" -Value "pwsh -File .automation/AI-Ethics-v4.2.ps1 -Action bias"
Set-Alias -Name "aiethics-fairness" -Value "pwsh -File .automation/AI-Ethics-v4.2.ps1 -Action fairness"
Set-Alias -Name "aiethics-transparency" -Value "pwsh -File .automation/AI-Ethics-v4.2.ps1 -Action transparency"
Set-Alias -Name "aiethics-privacy" -Value "pwsh -File .automation/AI-Ethics-v4.2.ps1 -Action privacy"
Set-Alias -Name "aiethics-accountability" -Value "pwsh -File .automation/AI-Ethics-v4.2.ps1 -Action accountability"
Set-Alias -Name "aiethics-compliance" -Value "pwsh -File .automation/AI-Ethics-v4.2.ps1 -Action compliance"
Set-Alias -Name "aiethics-audit" -Value "pwsh -File .automation/AI-Ethics-v4.2.ps1 -Action audit"

# Quick AI/ML Workflows
Set-Alias -Name "ai-workflow" -Value "pwsh -File .automation/AI-Advanced-ML-Manager-v4.2.ps1 -Action all -Verbose"
Set-Alias -Name "ai-quick" -Value "pwsh -File .automation/AI-Advanced-ML-Manager-v4.2.ps1 -Action status -Verbose"
Set-Alias -Name "ai-test" -Value "pwsh -File .automation/AI-Advanced-ML-Manager-v4.2.ps1 -Action test -Verbose"

# Display available aliases
Write-Host "🤖 AI/ML v4.2 Aliases Loaded Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Available Commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧠 AI Advanced ML Manager:" -ForegroundColor Yellow
Write-Host "  aiml          - AI Advanced ML Manager (main)"
Write-Host "  aiml-all      - Run all AI/ML modules"
Write-Host "  aiml-status   - Check system status"
Write-Host "  aiml-test     - Run system tests"
Write-Host "  aiml-deploy   - Deploy system"
Write-Host ""
Write-Host "🔍 Explainable AI:" -ForegroundColor Yellow
Write-Host "  xai           - Explainable AI (main)"
Write-Host "  xai-analyze   - Run analysis"
Write-Host "  xai-explain   - Generate explanations"
Write-Host "  xai-visualize - Create visualizations"
Write-Host "  xai-bias      - Bias detection"
Write-Host "  xai-audit     - Full audit"
Write-Host "  xai-compliance - Compliance check"
Write-Host "  xai-report    - Generate report"
Write-Host ""
Write-Host "📦 AI Model Versioning:" -ForegroundColor Yellow
Write-Host "  aimv          - AI Model Versioning (main)"
Write-Host "  aimv-version  - Register model version"
Write-Host "  aimv-deploy   - Deploy model"
Write-Host "  aimv-rollback - Rollback model"
Write-Host "  aimv-compare  - Compare versions"
Write-Host "  aimv-monitor  - Monitor performance"
Write-Host "  aimv-retire   - Retire model"
Write-Host "  aimv-migrate  - Migrate model"
Write-Host ""
Write-Host "⚖️ AI Ethics:" -ForegroundColor Yellow
Write-Host "  aiethics      - AI Ethics (main)"
Write-Host "  aiethics-bias - Bias detection"
Write-Host "  aiethics-fairness - Fairness assessment"
Write-Host "  aiethics-transparency - Transparency analysis"
Write-Host "  aiethics-privacy - Privacy assessment"
Write-Host "  aiethics-accountability - Accountability check"
Write-Host "  aiethics-compliance - Compliance check"
Write-Host "  aiethics-audit - Full ethics audit"
Write-Host ""
Write-Host "🚀 Quick Workflows:" -ForegroundColor Yellow
Write-Host "  ai-workflow   - Complete AI/ML workflow"
Write-Host "  ai-quick      - Quick status check"
Write-Host "  ai-test       - Run all tests"
Write-Host ""
Write-Host "💡 Usage Examples:" -ForegroundColor Cyan
Write-Host "  aiml-all -ModelPath 'model.pkl' -DataPath 'data.csv' -Verbose"
Write-Host "  xai-analyze -ModelPath 'model.pkl' -Verbose"
Write-Host "  aimv-deploy -ModelPath 'model.pkl' -Version 'v1.0.0' -Environment 'production'"
Write-Host "  aiethics-bias -ModelPath 'model.pkl' -DataPath 'data.csv' -Verbose"
Write-Host ""
Write-Host "✅ All AI/ML v4.2 aliases are ready to use!" -ForegroundColor Green
