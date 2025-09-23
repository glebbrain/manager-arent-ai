param(
    [string]$Path = ".",
    [switch]$Recursive,
    [switch]$Fix,
    [switch]$Verbose
)

Write-Host "📝 Markdown Formatting Tool for Creative Writing Project..." -ForegroundColor Cyan

$markdownFiles = @()
if ($Recursive) {
    $markdownFiles = Get-ChildItem -Path $Path -Filter "*.md" -Recurse
} else {
    $markdownFiles = Get-ChildItem -Path $Path -Filter "*.md"
}

$issues = @()
$fixed = 0

foreach ($file in $markdownFiles) {
    if ($Verbose) {
        Write-Host "Processing: $($file.FullName)" -ForegroundColor White
    }
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileIssues = @()
    
    # Fix 1: Remove trailing whitespace
    if ($content -match '\s+$') {
        $content = $content -replace '\s+$', ''
        $fileIssues += "Trailing whitespace"
    }
    
    # Fix 2: Ensure single newline at end of file
    if ($content -notmatch '\n$') {
        $content += "`n"
        $fileIssues += "Missing newline at end"
    }
    
    # Fix 3: Fix multiple consecutive newlines (max 2)
    if ($content -match '\n{3,}') {
        $content = $content -replace '\n{3,}', "`n`n"
        $fileIssues += "Multiple consecutive newlines"
    }
    
    # Fix 4: Ensure proper spacing around headers
    $content = $content -replace '(\S)\n(#+)', '$1`n`n$2'
    $content = $content -replace '(#+)\n(\S)', '$1`n`n$2'
    
    # Fix 5: Fix list formatting
    $content = $content -replace '(\S)\n(\s*[-*+])', '$1`n`n$2'
    $content = $content -replace '(\s*[-*+])\n(\S)', '$1`n`n$2'
    
    # Fix 6: Fix code block formatting
    $content = $content -replace '(\S)\n(```)', '$1`n`n$2'
    $content = $content -replace '(```)\n(\S)', '$1`n`n$2'
    
    # Fix 7: Ensure proper spacing around tables
    $content = $content -replace '(\S)\n(\|)', '$1`n`n$2'
    $content = $content -replace '(\|)\n(\S)', '$1`n`n$2'
    
    # Fix 8: Fix common Russian text issues
    $content = $content -replace '(\w)\s+([,.!?;:])', '$1$2'  # Remove space before punctuation
    $content = $content -replace '([,.!?;:])\s*([,.!?;:])', '$1$2'  # Fix double punctuation
    
    # Fix 9: Ensure proper spacing after punctuation
    $content = $content -replace '([,.!?;:])(\w)', '$1 $2'
    
    # Fix 10: Fix common typos in Russian
    $content = $content -replace '\bочень очень\b', 'очень'
    $content = $content -replace '\bи и\b', 'и'
    $content = $content -replace '\bа а\b', 'а'
    $content = $content -replace '\bно но\b', 'но'
    
    if ($fileIssues.Count -gt 0) {
        $issues += @{
            File = $file.Name
            Issues = $fileIssues
        }
        
        if ($Fix) {
            $content | Out-File $file.FullName -Encoding UTF8 -NoNewline
            $fixed++
            Write-Host "✅ Fixed $($file.Name): $($fileIssues -join ', ')" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Issues in $($file.Name): $($fileIssues -join ', ')" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n📊 Formatting Report:" -ForegroundColor Yellow
Write-Host "Files processed: $($markdownFiles.Count)" -ForegroundColor White
Write-Host "Files with issues: $($issues.Count)" -ForegroundColor White

if ($Fix) {
    Write-Host "Files fixed: $fixed" -ForegroundColor Green
} else {
    Write-Host "`n💡 Use -Fix parameter to automatically fix issues" -ForegroundColor Cyan
}

if ($issues.Count -gt 0) {
    Write-Host "`n🔍 Issues found:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "  $($issue.File): $($issue.Issues -join ', ')" -ForegroundColor White
    }
} else {
    Write-Host "`n✅ No formatting issues found!" -ForegroundColor Green
}
