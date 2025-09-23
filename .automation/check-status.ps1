# Simple Project Status Check
Write-Host "=== ManagerAgentAI Project Status ===" -ForegroundColor Green

# Check if we're in the right directory
if (Test-Path ".manager") {
    Write-Host "Project structure found" -ForegroundColor Green
} else {
    Write-Host "Project structure not found" -ForegroundColor Red
    exit 1
}

# Check TODO.md
if (Test-Path ".manager/control-files/TODO.md") {
    Write-Host "TODO.md found" -ForegroundColor Green
    
    # Count completed tasks
    $todoContent = Get-Content ".manager/control-files/TODO.md" -Raw
    $completedTasks = ($todoContent | Select-String -Pattern '\[x\]' -AllMatches).Matches.Count
    $pendingTasks = ($todoContent | Select-String -Pattern '\[ \]' -AllMatches).Matches.Count
    
    Write-Host "Tasks Status:" -ForegroundColor Cyan
    Write-Host "  Completed: $completedTasks" -ForegroundColor Green
    Write-Host "  Pending: $pendingTasks" -ForegroundColor Yellow
} else {
    Write-Host "TODO.md not found" -ForegroundColor Red
}

# Check scripts directory
if (Test-Path "scripts") {
    $scriptCount = (Get-ChildItem "scripts" -Filter "*.ps1").Count
    Write-Host "Scripts directory found with $scriptCount PowerShell scripts" -ForegroundColor Green
} else {
    Write-Host "Scripts directory not found" -ForegroundColor Red
}

# Check automation directory
if (Test-Path ".automation") {
    Write-Host "Automation directory found" -ForegroundColor Green
} else {
    Write-Host "Automation directory not found" -ForegroundColor Red
}

Write-Host "Status Check Complete" -ForegroundColor Green