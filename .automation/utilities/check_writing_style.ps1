param(
    [string]$Path = "chapters",
    [switch]$Detailed,
    [switch]$Export
)

Write-Host "✍️ Writing Style Analysis..." -ForegroundColor Cyan

$styleIssues = @()
$styleStats = @{
    TotalFiles = 0
    AverageSentenceLength = 0
    LongSentences = 0
    ShortSentences = 0
    PassiveVoice = 0
    RepetitiveWords = @()
    StyleScore = 0
}

# Common repetitive words to check
$repetitiveWords = @(
    @{ Word = "очень"; MaxCount = 3 },
    @{ Word = "и"; MaxCount = 5 },
    @{ Word = "а"; MaxCount = 3 },
    @{ Word = "но"; MaxCount = 3 },
    @{ Word = "что"; MaxCount = 4 },
    @{ Word = "как"; MaxCount = 3 },
    @{ Word = "так"; MaxCount = 3 },
    @{ Word = "это"; MaxCount = 4 },
    @{ Word = "был"; MaxCount = 3 },
    @{ Word = "была"; MaxCount = 3 },
    @{ Word = "было"; MaxCount = 3 }
)

# Passive voice indicators
$passiveIndicators = @(
    "был сделан", "была сделана", "было сделано",
    "был создан", "была создана", "было создано",
    "был построен", "была построена", "было построено",
    "был найден", "была найдена", "было найдено"
)

if (Test-Path $Path) {
    $files = Get-ChildItem $Path -Filter "*.md" -Recurse
    $styleStats.TotalFiles = $files.Count
    
    $totalSentences = 0
    $totalWords = 0
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        
        # Count sentences
        $sentences = $content -split '[.!?]+' | Where-Object { $_.Trim() -ne '' }
        $totalSentences += $sentences.Count
        
        # Count words
        $words = $content -split '\s+' | Where-Object { $_ -ne '' }
        $totalWords += $words.Count
        
        # Check sentence length
        foreach ($sentence in $sentences) {
            $wordCount = ($sentence -split '\s+' | Where-Object { $_ -ne '' }).Count
            if ($wordCount -gt 25) {
                $styleStats.LongSentences++
                $styleIssues += "Long sentence in $($file.Name): $($sentence.Substring(0, [Math]::Min(50, $sentence.Length)))..."
            } elseif ($wordCount -lt 5) {
                $styleStats.ShortSentences++
            }
        }
        
        # Check for passive voice
        foreach ($indicator in $passiveIndicators) {
            if ($content -match $indicator) {
                $styleStats.PassiveVoice++
                $styleIssues += "Passive voice in $($file.Name): '$indicator'"
            }
        }
        
        # Check for repetitive words
        foreach ($wordInfo in $repetitiveWords) {
            $word = $wordInfo.Word
            $maxCount = $wordInfo.MaxCount
            $matches = [regex]::Matches($content, "\b$word\b", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            if ($matches.Count -gt $maxCount) {
                $styleStats.RepetitiveWords += @{
                    Word = $word
                    Count = $matches.Count
                    File = $file.Name
                    MaxAllowed = $maxCount
                }
                $styleIssues += "Overuse of '$word' in $($file.Name): $($matches.Count) times (max: $maxCount)"
            }
        }
    }
    
    # Calculate average sentence length
    if ($totalSentences -gt 0) {
        $styleStats.AverageSentenceLength = [math]::Round($totalWords / $totalSentences, 1)
    }
    
    # Calculate style score (0-100)
    $score = 100
    $score -= [Math]::Min(20, $styleStats.LongSentences * 2)  # Penalty for long sentences
    $score -= [Math]::Min(15, $styleStats.PassiveVoice * 3)  # Penalty for passive voice
    $score -= [Math]::Min(25, $styleStats.RepetitiveWords.Count * 5)  # Penalty for repetitive words
    
    if ($styleStats.AverageSentenceLength -gt 20) {
        $score -= 10  # Penalty for long average sentences
    } elseif ($styleStats.AverageSentenceLength -lt 10) {
        $score -= 5   # Small penalty for very short sentences
    }
    
    $styleStats.StyleScore = [Math]::Max(0, $score)
}

# Display results
Write-Host "`n📊 Writing Style Report:" -ForegroundColor Yellow
Write-Host "Total Files Analyzed: $($styleStats.TotalFiles)" -ForegroundColor White
Write-Host "Average Sentence Length: $($styleStats.AverageSentenceLength) words" -ForegroundColor White
Write-Host "Long Sentences (>25 words): $($styleStats.LongSentences)" -ForegroundColor White
Write-Host "Short Sentences (<5 words): $($styleStats.ShortSentences)" -ForegroundColor White
Write-Host "Passive Voice Instances: $($styleStats.PassiveVoice)" -ForegroundColor White
Write-Host "Repetitive Word Issues: $($styleStats.RepetitiveWords.Count)" -ForegroundColor White

# Style score with color coding
$scoreColor = if ($styleStats.StyleScore -ge 80) { "Green" }
              elseif ($styleStats.StyleScore -ge 60) { "Yellow" }
              else { "Red" }
Write-Host "Overall Style Score: $($styleStats.StyleScore)/100" -ForegroundColor $scoreColor

if ($styleIssues.Count -gt 0) {
    Write-Host "`n🔍 Style Issues Found:" -ForegroundColor Yellow
    foreach ($issue in $styleIssues) {
        Write-Host "  $issue" -ForegroundColor White
    }
} else {
    Write-Host "`n✅ No major style issues found!" -ForegroundColor Green
}

# Recommendations
Write-Host "`n💡 Recommendations:" -ForegroundColor Cyan
if ($styleStats.AverageSentenceLength -gt 20) {
    Write-Host "  • Consider shortening some sentences for better readability" -ForegroundColor White
}
if ($styleStats.PassiveVoice -gt 5) {
    Write-Host "  • Try to use more active voice instead of passive" -ForegroundColor White
}
if ($styleStats.RepetitiveWords.Count -gt 0) {
    Write-Host "  • Replace repetitive words with synonyms" -ForegroundColor White
}
if ($styleStats.StyleScore -lt 70) {
    Write-Host "  • Overall writing style needs improvement" -ForegroundColor White
}

if ($Export) {
    $reportPath = ".automation/utilities/style-report-$(Get-Date -Format 'yyyy-MM-dd').json"
    $report = @{
        Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Statistics = $styleStats
        Issues = $styleIssues
    }
    $report | ConvertTo-Json -Depth 3 | Out-File $reportPath -Encoding UTF8
    Write-Host "`n📄 Style report exported to: $reportPath" -ForegroundColor Cyan
}
