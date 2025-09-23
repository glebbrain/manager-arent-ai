# 🔧 AI-Powered Error Fixing System
# Automated error detection and fixing with AI assistance

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$Language = "auto",
    
    [Parameter(Mandatory=$false)]
    [string]$ErrorType = "all", # all, syntax, logic, performance, security
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoFix = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateBackup = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

# 🎯 Configuration
$Config = @{
    AIProvider = "openai"
    Model = "gpt-4"
    MaxTokens = 4000
    Temperature = 0.1
    ErrorTypes = @{
        "syntax" = "Syntax errors and typos"
        "logic" = "Logic errors and bugs"
        "performance" = "Performance issues"
        "security" = "Security vulnerabilities"
        "style" = "Code style violations"
        "all" = "All types of errors"
    }
    FixableErrorPatterns = @{
        "python" = @{
            "IndentationError" = "Fix indentation issues"
            "SyntaxError" = "Fix syntax errors"
            "NameError" = "Fix undefined variable references"
            "TypeError" = "Fix type mismatches"
            "AttributeError" = "Fix attribute access errors"
        }
        "javascript" = @{
            "ReferenceError" = "Fix undefined variable references"
            "TypeError" = "Fix type errors"
            "SyntaxError" = "Fix syntax errors"
            "UncaughtException" = "Fix unhandled exceptions"
        }
        "typescript" = @{
            "TypeError" = "Fix TypeScript type errors"
            "CompileError" = "Fix compilation errors"
            "InterfaceError" = "Fix interface mismatches"
        }
        "csharp" = @{
            "CompilationError" = "Fix compilation errors"
            "NullReferenceException" = "Fix null reference issues"
            "ArgumentException" = "Fix argument validation"
        }
        "powershell" = @{
            "ParseError" = "Fix PowerShell parsing errors"
            "RuntimeException" = "Fix runtime errors"
            "ParameterBindingException" = "Fix parameter binding issues"
        }
    }
    BackupDirectory = ".\backups"
}

# 🚀 Main Error Fixing Function
function Start-AIErrorFixing {
    Write-Host "🔧 Starting AI Error Fixing..." -ForegroundColor Cyan
    
    # 1. Create backup if requested
    if ($CreateBackup) {
        Create-ProjectBackup -ProjectPath $ProjectPath
    }
    
    # 2. Discover project files
    $ProjectFiles = Get-ProjectFiles -Path $ProjectPath -Language $Language
    Write-Host "📁 Found $($ProjectFiles.Count) files to analyze" -ForegroundColor Green
    
    # 3. Detect errors
    $Errors = Detect-Errors -Files $ProjectFiles -ErrorType $ErrorType
    Write-Host "🔍 Found $($Errors.Count) errors to fix" -ForegroundColor Yellow
    
    # 4. Categorize errors
    $CategorizedErrors = Categorize-Errors -Errors $Errors
    Write-Host "📊 Categorized errors by type and severity" -ForegroundColor Blue
    
    # 5. AI-powered error analysis
    $ErrorAnalysis = Invoke-AIErrorAnalysis -Errors $CategorizedErrors
    Write-Host "🤖 AI error analysis completed" -ForegroundColor Magenta
    
    # 6. Generate fixes
    $Fixes = Generate-ErrorFixes -Errors $CategorizedErrors -Analysis $ErrorAnalysis
    Write-Host "🛠️ Generated $($Fixes.Count) potential fixes" -ForegroundColor Green
    
    # 7. Apply fixes
    if ($AutoFix -and -not $DryRun) {
        $FixResults = Apply-Fixes -Fixes $Fixes -ProjectPath $ProjectPath
        Write-Host "✅ Applied $($FixResults.Successful) fixes successfully" -ForegroundColor Green
        if ($FixResults.Failed -gt 0) {
            Write-Host "⚠️ $($FixResults.Failed) fixes failed" -ForegroundColor Yellow
        }
    } elseif ($DryRun) {
        Write-Host "🔍 Dry run mode - no fixes applied" -ForegroundColor Blue
    }
    
    # 8. Generate report
    if ($GenerateReport) {
        $ReportPath = Generate-ErrorFixReport -Errors $CategorizedErrors -Fixes $Fixes -FixResults $FixResults
        Write-Host "📋 Error fix report generated: $ReportPath" -ForegroundColor Green
    }
    
    Write-Host "✅ AI Error Fixing completed!" -ForegroundColor Green
}

# 🔍 Detect Errors
function Detect-Errors {
    param(
        [array]$Files,
        [string]$ErrorType
    )
    
    $Errors = @()
    
    foreach ($File in $Files) {
        $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $Content) { continue }
        
        $Language = Get-FileLanguage -FilePath $File.FullName
        
        # Language-specific error detection
        $FileErrors = @()
        switch ($Language) {
            "python" {
                $FileErrors += Detect-PythonErrors -Content $Content -FilePath $File.FullName
            }
            "javascript" {
                $FileErrors += Detect-JavaScriptErrors -Content $Content -FilePath $File.FullName
            }
            "typescript" {
                $FileErrors += Detect-TypeScriptErrors -Content $Content -FilePath $File.FullName
            }
            "csharp" {
                $FileErrors += Detect-CSharpErrors -Content $Content -FilePath $File.FullName
            }
            "powershell" {
                $FileErrors += Detect-PowerShellErrors -Content $Content -FilePath $File.FullName
            }
        }
        
        # General error patterns
        $FileErrors += Detect-GeneralErrors -Content $Content -FilePath $File.FullName -Language $Language
        
        $Errors += $FileErrors
    }
    
    return $Errors
}

# 🐍 Detect Python Errors
function Detect-PythonErrors {
    param(
        [string]$Content,
        [string]$FilePath
    )
    
    $Errors = @()
    $Lines = $Content -split "`n"
    
    # Indentation errors
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $Line = $Lines[$i]
        if ($Line -match "^\s*[^#\s]") {
            $IndentLevel = ($Line -replace "^(\s*).*", '$1').Length
            if ($i -gt 0) {
                $PrevLine = $Lines[$i - 1]
                if ($PrevLine -match ":\s*$") {
                    $ExpectedIndent = ($PrevLine -replace "^(\s*).*", '$1').Length + 4
                    if ($IndentLevel -lt $ExpectedIndent) {
                        $Errors += @{
                            Type = "IndentationError"
                            Severity = "Error"
                            Line = $i + 1
                            Message = "Expected indentation of $ExpectedIndent spaces"
                            File = $FilePath
                            Fixable = $true
                        }
                    }
                }
            }
        }
    }
    
    # Syntax errors
    $SyntaxPatterns = @{
        "MissingColon" = "if\s+.*[^:]$"
        "InvalidIndentation" = "^\s*[^#\s].*:\s*$"
        "UnclosedString" = '"[^"]*$|''[^'']*$'
    }
    
    foreach ($Pattern in $SyntaxPatterns.Keys) {
        for ($i = 0; $i -lt $Lines.Count; $i++) {
            $Line = $Lines[$i]
            if ($Line -match $SyntaxPatterns[$Pattern]) {
                $Errors += @{
                    Type = "SyntaxError"
                    Severity = "Error"
                    Line = $i + 1
                    Message = "Syntax error: $Pattern"
                    File = $FilePath
                    Fixable = $true
                }
            }
        }
    }
    
    # Name errors (undefined variables)
    $NamePatterns = @(
        "undefined_variable",
        "name.*is not defined"
    )
    
    foreach ($Pattern in $NamePatterns) {
        for ($i = 0; $i -lt $Lines.Count; $i++) {
            $Line = $Lines[$i]
            if ($Line -match $Pattern) {
                $Errors += @{
                    Type = "NameError"
                    Severity = "Error"
                    Line = $i + 1
                    Message = "Undefined variable: $Pattern"
                    File = $FilePath
                    Fixable = $true
                }
            }
        }
    }
    
    return $Errors
}

# 🟨 Detect JavaScript Errors
function Detect-JavaScriptErrors {
    param(
        [string]$Content,
        [string]$FilePath
    )
    
    $Errors = @()
    $Lines = $Content -split "`n"
    
    # Missing semicolons
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $Line = $Lines[$i].Trim()
        if ($Line -and $Line -notmatch "[{};]$" -and $Line -notmatch "^//" -and $Line -notmatch "^/\*") {
            $Errors += @{
                Type = "MissingSemicolon"
                Severity = "Warning"
                Line = $i + 1
                Message = "Missing semicolon"
                File = $FilePath
                Fixable = $true
            }
        }
    }
    
    # Undefined variables
    $UndefinedPatterns = @(
        "console\.log\(undefined_variable\)",
        "var.*undefined.*="
    )
    
    foreach ($Pattern in $UndefinedPatterns) {
        for ($i = 0; $i -lt $Lines.Count; $i++) {
            $Line = $Lines[$i]
            if ($Line -match $Pattern) {
                $Errors += @{
                    Type = "ReferenceError"
                    Severity = "Error"
                    Line = $i + 1
                    Message = "Undefined variable reference"
                    File = $FilePath
                    Fixable = $true
                }
            }
        }
    }
    
    return $Errors
}

# 📝 Detect TypeScript Errors
function Detect-TypeScriptErrors {
    param(
        [string]$Content,
        [string]$FilePath
    )
    
    $Errors = @()
    $Lines = $Content -split "`n"
    
    # Type errors
    $TypePatterns = @{
        "ImplicitAny" = ":\s*any\s*="
        "MissingType" = "function\s+\w+\s*\([^)]*\)\s*\{"
        "TypeMismatch" = "string.*number|number.*string"
    }
    
    foreach ($Pattern in $TypePatterns.Keys) {
        for ($i = 0; $i -lt $Lines.Count; $i++) {
            $Line = $Lines[$i]
            if ($Line -match $TypePatterns[$Pattern]) {
                $Errors += @{
                    Type = "TypeError"
                    Severity = "Warning"
                    Line = $i + 1
                    Message = "TypeScript type issue: $Pattern"
                    File = $FilePath
                    Fixable = $true
                }
            }
        }
    }
    
    return $Errors
}

# 🔷 Detect C# Errors
function Detect-CSharpErrors {
    param(
        [string]$Content,
        [string]$FilePath
    )
    
    $Errors = @()
    $Lines = $Content -split "`n"
    
    # Missing semicolons
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $Line = $Lines[$i].Trim()
        if ($Line -and $Line -notmatch "[{};]$" -and $Line -notmatch "^//" -and $Line -notmatch "^using" -and $Line -notmatch "^namespace") {
            $Errors += @{
                Type = "MissingSemicolon"
                Severity = "Error"
                Line = $i + 1
                Message = "Missing semicolon"
                File = $FilePath
                Fixable = $true
            }
        }
    }
    
    return $Errors
}

# 💙 Detect PowerShell Errors
function Detect-PowerShellErrors {
    param(
        [string]$Content,
        [string]$FilePath
    )
    
    $Errors = @()
    $Lines = $Content -split "`n"
    
    # Missing parameter validation
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $Line = $Lines[$i]
        if ($Line -match "param\s*\(" -and $Line -notmatch "Mandatory") {
            $Errors += @{
                Type = "ParameterValidation"
                Severity = "Warning"
                Line = $i + 1
                Message = "Consider adding parameter validation"
                File = $FilePath
                Fixable = $true
            }
        }
    }
    
    return $Errors
}

# 🔍 Detect General Errors
function Detect-GeneralErrors {
    param(
        [string]$Content,
        [string]$FilePath,
        [string]$Language
    )
    
    $Errors = @()
    $Lines = $Content -split "`n"
    
    # Common patterns
    $GeneralPatterns = @{
        "TODO" = "TODO|FIXME|HACK|XXX"
        "ConsoleLog" = "console\.log|print\s*\("
        "HardcodedValues" = '"[^"]{20,}"|''[^'']{20,}'''
        "LongLines" = "^.{120,}$"
        "EmptyCatch" = "catch\s*\([^)]*\)\s*\{\s*\}"
    }
    
    foreach ($Pattern in $GeneralPatterns.Keys) {
        for ($i = 0; $i -lt $Lines.Count; $i++) {
            $Line = $Lines[$i]
            if ($Line -match $GeneralPatterns[$Pattern]) {
                $Severity = switch ($Pattern) {
                    "TODO" { "Info" }
                    "ConsoleLog" { "Warning" }
                    "HardcodedValues" { "Warning" }
                    "LongLines" { "Warning" }
                    "EmptyCatch" { "Error" }
                    default { "Info" }
                }
                
                $Errors += @{
                    Type = $Pattern
                    Severity = $Severity
                    Line = $i + 1
                    Message = "Code quality issue: $Pattern"
                    File = $FilePath
                    Fixable = $true
                }
            }
        }
    }
    
    return $Errors
}

# 📊 Categorize Errors
function Categorize-Errors {
    param([array]$Errors)
    
    $Categorized = @{
        ByType = @{}
        BySeverity = @{}
        ByFile = @{}
        Fixable = @()
        NonFixable = @()
    }
    
    foreach ($Error in $Errors) {
        # By type
        if (-not $Categorized.ByType.ContainsKey($Error.Type)) {
            $Categorized.ByType[$Error.Type] = @()
        }
        $Categorized.ByType[$Error.Type] += $Error
        
        # By severity
        if (-not $Categorized.BySeverity.ContainsKey($Error.Severity)) {
            $Categorized.BySeverity[$Error.Severity] = @()
        }
        $Categorized.BySeverity[$Error.Severity] += $Error
        
        # By file
        if (-not $Categorized.ByFile.ContainsKey($Error.File)) {
            $Categorized.ByFile[$Error.File] = @()
        }
        $Categorized.ByFile[$Error.File] += $Error
        
        # Fixable/Non-fixable
        if ($Error.Fixable) {
            $Categorized.Fixable += $Error
        } else {
            $Categorized.NonFixable += $Error
        }
    }
    
    return $Categorized
}

# 🤖 AI Error Analysis
function Invoke-AIErrorAnalysis {
    param([hashtable]$CategorizedErrors)
    
    $Analysis = @{
        ErrorPatterns = @{}
        FixSuggestions = @{}
        RiskAssessment = @{}
        PriorityOrder = @()
    }
    
    foreach ($ErrorType in $CategorizedErrors.ByType.Keys) {
        $Errors = $CategorizedErrors.ByType[$ErrorType]
        
        $AIPrompt = @"
Analyze these $($ErrorType) errors and provide fixing suggestions:

Error Type: $ErrorType
Error Count: $($Errors.Count)

Errors:
$($Errors | ConvertTo-Json -Depth 2)

Please provide:
1. Common patterns in these errors
2. Root cause analysis
3. Fixing strategies
4. Risk assessment
5. Priority for fixing

Format as JSON:
{
  "patterns": ["pattern1", "pattern2"],
  "rootCauses": ["cause1", "cause2"],
  "fixStrategies": ["strategy1", "strategy2"],
  "riskLevel": "Low|Medium|High",
  "priority": 1-10
}
"@

        try {
            $AIResponse = Invoke-AIAPI -Content $AIPrompt -Provider $Config.AIProvider -Model $Config.Model
            $ErrorAnalysis = $AIResponse | ConvertFrom-Json
            
            $Analysis.ErrorPatterns[$ErrorType] = $ErrorAnalysis.patterns
            $Analysis.FixSuggestions[$ErrorType] = $ErrorAnalysis.fixStrategies
            $Analysis.RiskAssessment[$ErrorType] = $ErrorAnalysis.riskLevel
            $Analysis.PriorityOrder += @{
                Type = $ErrorType
                Priority = $ErrorAnalysis.priority
                Count = $Errors.Count
            }
        }
        catch {
            Write-Warning "AI analysis failed for error type $ErrorType : $($_.Exception.Message)"
        }
    }
    
    # Sort by priority
    $Analysis.PriorityOrder = $Analysis.PriorityOrder | Sort-Object Priority -Descending
    
    return $Analysis
}

# 🛠️ Generate Error Fixes
function Generate-ErrorFixes {
    param(
        [hashtable]$CategorizedErrors,
        [hashtable]$Analysis
    )
    
    $Fixes = @()
    
    foreach ($Error in $CategorizedErrors.Fixable) {
        $Fix = Generate-SingleFix -Error $Error -Analysis $Analysis
        if ($Fix) {
            $Fixes += $Fix
        }
    }
    
    return $Fixes
}

# 🔧 Generate Single Fix
function Generate-SingleFix {
    param(
        [hashtable]$Error,
        [hashtable]$Analysis
    )
    
    $Fix = @{
        Error = $Error
        FixType = "Unknown"
        OriginalCode = ""
        FixedCode = ""
        Confidence = 0
        Description = ""
    }
    
    # Get original code
    $Content = Get-Content -Path $Error.File -Raw
    $Lines = $Content -split "`n"
    $Fix.OriginalCode = $Lines[$Error.Line - 1]
    
    # Generate fix based on error type
    switch ($Error.Type) {
        "IndentationError" {
            $Fix.FixType = "Indentation"
            $Fix.FixedCode = Fix-IndentationError -Line $Fix.OriginalCode -Error $Error
            $Fix.Confidence = 90
            $Fix.Description = "Fix indentation"
        }
        "MissingSemicolon" {
            $Fix.FixType = "Syntax"
            $Fix.FixedCode = $Fix.OriginalCode + ";"
            $Fix.Confidence = 95
            $Fix.Description = "Add missing semicolon"
        }
        "SyntaxError" {
            $Fix.FixType = "Syntax"
            $Fix.FixedCode = Fix-SyntaxError -Line $Fix.OriginalCode -Error $Error
            $Fix.Confidence = 70
            $Fix.Description = "Fix syntax error"
        }
        "NameError" {
            $Fix.FixType = "Logic"
            $Fix.FixedCode = Fix-NameError -Line $Fix.OriginalCode -Error $Error
            $Fix.Confidence = 60
            $Fix.Description = "Fix undefined variable"
        }
        "TypeError" {
            $Fix.FixType = "Type"
            $Fix.FixedCode = Fix-TypeError -Line $Fix.OriginalCode -Error $Error
            $Fix.Confidence = 65
            $Fix.Description = "Fix type error"
        }
        "ConsoleLog" {
            $Fix.FixType = "CodeQuality"
            $Fix.FixedCode = Fix-ConsoleLog -Line $Fix.OriginalCode -Error $Error
            $Fix.Confidence = 80
            $Fix.Description = "Remove or replace console.log"
        }
        "EmptyCatch" {
            $Fix.FixType = "Logic"
            $Fix.FixedCode = Fix-EmptyCatch -Line $Fix.OriginalCode -Error $Error
            $Fix.Confidence = 85
            $Fix.Description = "Add proper error handling"
        }
        "LongLines" {
            $Fix.FixType = "Style"
            $Fix.FixedCode = Fix-LongLines -Line $Fix.OriginalCode -Error $Error
            $Fix.Confidence = 75
            $Fix.Description = "Break long line"
        }
    }
    
    return $Fix
}

# 🔧 Apply Fixes
function Apply-Fixes {
    param(
        [array]$Fixes,
        [string]$ProjectPath
    )
    
    $Results = @{
        Successful = 0
        Failed = 0
        AppliedFixes = @()
        FailedFixes = @()
    }
    
    foreach ($Fix in $Fixes) {
        try {
            # Apply the fix
            $Content = Get-Content -Path $Fix.Error.File -Raw
            $Lines = $Content -split "`n"
            $Lines[$Fix.Error.Line - 1] = $Fix.FixedCode
            $NewContent = $Lines -join "`n"
            
            $NewContent | Out-File -FilePath $Fix.Error.File -Encoding UTF8
            $Results.Successful++
            $Results.AppliedFixes += $Fix
            
            Write-Host "✅ Applied fix: $($Fix.Description) in $($Fix.Error.File):$($Fix.Error.Line)" -ForegroundColor Green
        }
        catch {
            $Results.Failed++
            $Results.FailedFixes += $Fix
            Write-Warning "Failed to apply fix: $($Fix.Description) - $($_.Exception.Message)"
        }
    }
    
    return $Results
}

# 📋 Generate Error Fix Report
function Generate-ErrorFixReport {
    param(
        [hashtable]$Errors,
        [array]$Fixes,
        [hashtable]$FixResults
    )
    
    $ReportPath = ".\reports\ai-error-fix-$(Get-Date -Format 'yyyy-MM-dd-HHmm').md"
    $ReportDir = Split-Path -Parent $ReportPath
    
    if (-not (Test-Path $ReportDir)) {
        New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
    }
    
    $Report = @"
# 🔧 AI Error Fix Report

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Total Errors Found**: $($Errors.Fixable.Count + $Errors.NonFixable.Count)  
**Fixes Applied**: $($FixResults.Successful)  
**Fixes Failed**: $($FixResults.Failed)

## 📊 Error Summary

### By Type
"@

    foreach ($Type in $Errors.ByType.Keys) {
        $ErrorCount = $Errors.ByType[$Type].Count
        $Report += "`n- **$Type**: $ErrorCount errors" -ForegroundColor White
    }

    $Report += @"

### By Severity
"@

    foreach ($Severity in $Errors.BySeverity.Keys) {
        $ErrorCount = $Errors.BySeverity[$Severity].Count
        $Report += "`n- **$Severity**: $ErrorCount errors" -ForegroundColor White
    }

    $Report += @"

## 🛠️ Applied Fixes

"@

    foreach ($Fix in $FixResults.AppliedFixes) {
        $Report += "`n- **$($Fix.Description)**`n"
        $Report += "  - File: $($Fix.Error.File)`n"
        $Report += "  - Line: $($Fix.Error.Line)`n"
        $Report += "  - Type: $($Fix.FixType)`n"
        $Report += "  - Confidence: $($Fix.Confidence)%`n"
    }

    if ($FixResults.FailedFixes.Count -gt 0) {
        $Report += @"

## ❌ Failed Fixes

"@

        foreach ($Fix in $FixResults.FailedFixes) {
            $Report += "`n- **$($Fix.Description)**`n"
            $Report += "  - File: $($Fix.Error.File)`n"
            $Report += "  - Line: $($Fix.Error.Line)`n"
            $Report += "  - Reason: Manual intervention required`n"
        }
    }

    $Report += @"

## 🎯 Recommendations

1. **Review Applied Fixes**: Verify all applied fixes work correctly
2. **Manual Review**: Address failed fixes manually
3. **Testing**: Run tests to ensure fixes don't break functionality
4. **Code Quality**: Implement linting to prevent similar errors
5. **Documentation**: Update documentation if needed

## 📈 Next Steps

1. Test the fixed code
2. Commit changes if tests pass
3. Set up automated error detection
4. Schedule regular code quality checks
5. Monitor for new error patterns

---
*Generated by AI Error Fixer v1.0*
"@

    $Report | Out-File -FilePath $ReportPath -Encoding UTF8
    return $ReportPath
}

# 🛠️ Helper Functions
function Get-FileLanguage {
    param([string]$FilePath)
    
    $Extension = [System.IO.Path]::GetExtension($FilePath).TrimStart('.')
    $LanguageMap = @{
        "py" = "python"
        "js" = "javascript"
        "ts" = "typescript"
        "cs" = "csharp"
        "ps1" = "powershell"
    }
    
    return $LanguageMap[$Extension]
}

function Create-ProjectBackup {
    param([string]$ProjectPath)
    
    $BackupPath = Join-Path $ProjectPath $Config.BackupDirectory
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $BackupDir = Join-Path $BackupPath "backup-$Timestamp"
    
    if (-not (Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    }
    
    Copy-Item -Path $ProjectPath -Destination $BackupDir -Recurse -Exclude $Config.BackupDirectory
    Write-Host "📦 Backup created: $BackupDir" -ForegroundColor Green
}

# 🚀 Execute Error Fixing
if ($MyInvocation.InvocationName -ne '.') {
    Start-AIErrorFixing
}
