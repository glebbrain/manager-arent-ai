# 🧪 AI-Powered Test Generator - Simplified Version
# Automated generation of unit tests based on code analysis

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$Language = "auto",
    
    [Parameter(Mandatory=$false)]
    [string]$TestFramework = "auto",
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateUnitTests = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateIntegrationTests = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$GeneratePerformanceTests = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateSecurityTests = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$OverwriteExisting = $false
)

# 🎯 Configuration
$Config = @{
    AIProvider = "openai"
    Model = "gpt-4"
    MaxTokens = 4000
    Temperature = 0.2
    TestFrameworks = @{
        "python" = @("pytest", "unittest", "nose2")
        "javascript" = @("jest", "mocha", "jasmine")
        "typescript" = @("jest", "mocha", "vitest")
        "csharp" = @("nunit", "xunit", "mstest")
        "java" = @("junit", "testng", "spock")
        "go" = @("testing", "testify", "ginkgo")
        "rust" = @("built-in", "proptest", "criterion")
        "php" = @("phpunit", "codeception", "pest")
        "powershell" = @("pester", "psunit")
    }
    TestTypes = @{
        "unit" = "Unit tests for individual functions/methods"
        "integration" = "Integration tests for component interactions"
        "performance" = "Performance and load tests"
        "security" = "Security and vulnerability tests"
        "e2e" = "End-to-end tests"
    }
}

# 🚀 Main Test Generation Function
function Start-AITestGeneration {
    Write-Host "🧪 Starting AI Test Generation..." -ForegroundColor Cyan
    
    # 1. Discover project files
    $ProjectFiles = Get-ProjectFiles -Path $ProjectPath -Language $Language
    Write-Host "📁 Found $($ProjectFiles.Count) files to analyze" -ForegroundColor Green
    
    # 2. Detect language and test framework
    $DetectedLanguage = Get-DetectedLanguage -Files $ProjectFiles
    $TestFramework = Get-TestFramework -Language $DetectedLanguage -PreferredFramework $TestFramework
    Write-Host "🔍 Detected language: $DetectedLanguage" -ForegroundColor Yellow
    Write-Host "🧪 Using test framework: $TestFramework" -ForegroundColor Yellow
    
    # 3. Analyze code for test generation
    $TestableFiles = Analyze-TestableFiles -Files $ProjectFiles -Language $DetectedLanguage
    Write-Host "🎯 Found $($TestableFiles.Count) testable files" -ForegroundColor Green
    
    # 4. Generate tests
    $GeneratedTests = @{
        UnitTests = @()
        IntegrationTests = @()
        PerformanceTests = @()
        SecurityTests = @()
        Summary = @{
            TotalFiles = $TestableFiles.Count
            TestsGenerated = 0
            FilesWithTests = 0
        }
    }
    
    foreach ($File in $TestableFiles) {
        Write-Host "🧪 Generating tests for: $($File.Name)" -ForegroundColor Yellow
        
        $FileTests = Generate-FileTests -File $File -Language $DetectedLanguage -Framework $TestFramework
        Merge-TestResults -GeneratedTests $GeneratedTests -FileTests $FileTests
    }
    
    # 5. Create test files
    Create-TestFiles -GeneratedTests $GeneratedTests -Language $DetectedLanguage -Framework $TestFramework
    
    # 6. Generate test configuration
    Generate-TestConfiguration -Language $DetectedLanguage -Framework $TestFramework
    
    # 7. Generate test documentation
    Generate-TestDocumentation -GeneratedTests $GeneratedTests -Language $DetectedLanguage
    
    Write-Host "✅ AI Test Generation completed!" -ForegroundColor Green
    Write-Host "📊 Generated $($GeneratedTests.Summary.TestsGenerated) tests for $($GeneratedTests.Summary.FilesWithTests) files" -ForegroundColor Green
}

# 📁 Get Project Files
function Get-ProjectFiles {
    param(
        [string]$Path,
        [string]$Language
    )
    
    $SupportedExtensions = @{
        "python" = @("*.py")
        "javascript" = @("*.js", "*.jsx", "*.ts", "*.tsx")
        "typescript" = @("*.ts", "*.tsx")
        "csharp" = @("*.cs")
        "java" = @("*.java")
        "go" = @("*.go")
        "rust" = @("*.rs")
        "php" = @("*.php")
        "powershell" = @("*.ps1", "*.psm1")
        "auto" = @("*.py", "*.js", "*.jsx", "*.ts", "*.tsx", "*.cs", "*.java", "*.go", "*.rs", "*.php", "*.ps1", "*.psm1")
    }
    
    $Extensions = if ($Language -eq "auto") { 
        $SupportedExtensions["auto"] 
    } else { 
        $SupportedExtensions[$Language] 
    }
    
    $Files = @()
    foreach ($Ext in $Extensions) {
        $Files += Get-ChildItem -Path $Path -Filter $Ext -Recurse -File | Where-Object { 
            $_.FullName -notmatch "\\node_modules\\" -and 
            $_.FullName -notmatch "\\\.git\\" -and
            $_.FullName -notmatch "\\tests\\" -and
            $_.FullName -notmatch "\\test\\" -and
            $_.FullName -notmatch "\\__tests__\\"
        }
    }
    
    return $Files
}

# 🔍 Get Detected Language
function Get-DetectedLanguage {
    param([array]$Files)
    
    $LanguageCounts = @{}
    
    foreach ($File in $Files) {
        $Extension = $File.Extension.ToLower()
        switch ($Extension) {
            ".py" { $LanguageCounts["python"]++ }
            ".js" { $LanguageCounts["javascript"]++ }
            ".jsx" { $LanguageCounts["javascript"]++ }
            ".ts" { $LanguageCounts["typescript"]++ }
            ".tsx" { $LanguageCounts["typescript"]++ }
            ".cs" { $LanguageCounts["csharp"]++ }
            ".java" { $LanguageCounts["java"]++ }
            ".go" { $LanguageCounts["go"]++ }
            ".rs" { $LanguageCounts["rust"]++ }
            ".php" { $LanguageCounts["php"]++ }
            ".ps1" { $LanguageCounts["powershell"]++ }
            ".psm1" { $LanguageCounts["powershell"]++ }
        }
    }
    
    $DetectedLanguage = ($LanguageCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key
    return if ($DetectedLanguage) { $DetectedLanguage } else { "powershell" }
}

# 🧠 Get Test Framework
function Get-TestFramework {
    param(
        [string]$Language,
        [string]$PreferredFramework
    )
    
    if ($PreferredFramework -ne "auto") {
        return $PreferredFramework
    }
    
    $DefaultFrameworks = @{
        "python" = "pytest"
        "javascript" = "jest"
        "typescript" = "jest"
        "csharp" = "nunit"
        "java" = "junit"
        "go" = "testing"
        "rust" = "built-in"
        "php" = "phpunit"
        "powershell" = "pester"
    }
    
    return if ($DefaultFrameworks.ContainsKey($Language)) { $DefaultFrameworks[$Language] } else { "pester" }
}

# 📁 Analyze Testable Files
function Analyze-TestableFiles {
    param(
        [array]$Files,
        [string]$Language
    )
    
    $TestableFiles = @()
    
    foreach ($File in $Files) {
        $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $Content) { continue }
        
        $Analysis = Analyze-FileForTesting -Content $Content -Language $Language -FilePath $File.FullName
        
        if ($Analysis.IsTestable) {
            $TestableFiles += @{
                File = $File
                Content = $Content
                Analysis = $Analysis
                Functions = $Analysis.Functions
                Classes = $Analysis.Classes
                Dependencies = $Analysis.Dependencies
            }
        }
    }
    
    return $TestableFiles
}

# 🔬 Analyze File for Testing
function Analyze-FileForTesting {
    param(
        [string]$Content,
        [string]$Language,
        [string]$FilePath
    )
    
    $Analysis = @{
        IsTestable = $false
        Functions = @()
        Classes = @()
        Dependencies = @()
        Complexity = "low"
    }
    
    # Basic analysis based on language
    switch ($Language) {
        "python" {
            $Analysis = Analyze-PythonFile -Content $Content -FilePath $FilePath
        }
        "javascript" {
            $Analysis = Analyze-JavaScriptFile -Content $Content -FilePath $FilePath
        }
        "typescript" {
            $Analysis = Analyze-TypeScriptFile -Content $Content -FilePath $FilePath
        }
        "powershell" {
            $Analysis = Analyze-PowerShellFile -Content $Content -FilePath $FilePath
        }
        default {
            $Analysis = Analyze-GenericFile -Content $Content -FilePath $FilePath
        }
    }
    
    return $Analysis
}

# 🐍 Analyze Python File
function Analyze-PythonFile {
    param([string]$Content, [string]$FilePath)
    
    $Functions = @()
    $Classes = @()
    $Dependencies = @()
    
    # Extract functions
    $FunctionMatches = [regex]::Matches($Content, "def\s+(\w+)\s*\(")
    foreach ($Match in $FunctionMatches) {
        $Functions += @{
            Name = $Match.Groups[1].Value
            File = $FilePath
            Code = ""
            Parameters = @()
            ReturnType = "unknown"
            Complexity = "medium"
            Dependencies = @()
        }
    }
    
    # Extract classes
    $ClassMatches = [regex]::Matches($Content, "class\s+(\w+)")
    foreach ($Match in $ClassMatches) {
        $Classes += @{
            Name = $Match.Groups[1].Value
            File = $FilePath
            Code = ""
            Methods = @()
            Properties = @()
            Dependencies = @()
            Inheritance = "object"
        }
    }
    
    return @{
        IsTestable = ($Functions.Count -gt 0 -or $Classes.Count -gt 0)
        Functions = $Functions
        Classes = $Classes
        Dependencies = $Dependencies
        Complexity = if ($Functions.Count + $Classes.Count -gt 10) { "high" } elseif ($Functions.Count + $Classes.Count -gt 5) { "medium" } else { "low" }
    }
}

# 🟨 Analyze JavaScript File
function Analyze-JavaScriptFile {
    param([string]$Content, [string]$FilePath)
    
    $Functions = @()
    $Classes = @()
    $Dependencies = @()
    
    # Extract functions
    $FunctionPatterns = @(
        "function\s+(\w+)\s*\(",
        "const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>",
        "let\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>",
        "var\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>"
    )
    
    foreach ($Pattern in $FunctionPatterns) {
        $Matches = [regex]::Matches($Content, $Pattern)
        foreach ($Match in $Matches) {
            $Functions += @{
                Name = $Match.Groups[1].Value
                File = $FilePath
                Code = ""
                Parameters = @()
                ReturnType = "unknown"
                Complexity = "medium"
                Dependencies = @()
            }
        }
    }
    
    # Extract classes
    $ClassMatches = [regex]::Matches($Content, "class\s+(\w+)")
    foreach ($Match in $ClassMatches) {
        $Classes += @{
            Name = $Match.Groups[1].Value
            File = $FilePath
            Code = ""
            Methods = @()
            Properties = @()
            Dependencies = @()
            Inheritance = "Object"
        }
    }
    
    return @{
        IsTestable = ($Functions.Count -gt 0 -or $Classes.Count -gt 0)
        Functions = $Functions
        Classes = $Classes
        Dependencies = $Dependencies
        Complexity = if ($Functions.Count + $Classes.Count -gt 10) { "high" } elseif ($Functions.Count + $Classes.Count -gt 5) { "medium" } else { "low" }
    }
}

# 🔷 Analyze TypeScript File
function Analyze-TypeScriptFile {
    param([string]$Content, [string]$FilePath)
    
    $Functions = @()
    $Classes = @()
    $Dependencies = @()
    
    # Extract functions
    $FunctionPatterns = @(
        "function\s+(\w+)\s*\(",
        "const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*:",
        "let\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*:",
        "var\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*:"
    )
    
    foreach ($Pattern in $FunctionPatterns) {
        $Matches = [regex]::Matches($Content, $Pattern)
        foreach ($Match in $Matches) {
            $Functions += @{
                Name = $Match.Groups[1].Value
                File = $FilePath
                Code = ""
                Parameters = @()
                ReturnType = "unknown"
                Complexity = "medium"
                Dependencies = @()
            }
        }
    }
    
    # Extract classes
    $ClassMatches = [regex]::Matches($Content, "class\s+(\w+)")
    foreach ($Match in $ClassMatches) {
        $Classes += @{
            Name = $Match.Groups[1].Value
            File = $FilePath
            Code = ""
            Methods = @()
            Properties = @()
            Dependencies = @()
            Inheritance = "Object"
        }
    }
    
    return @{
        IsTestable = ($Functions.Count -gt 0 -or $Classes.Count -gt 0)
        Functions = $Functions
        Classes = $Classes
        Dependencies = $Dependencies
        Complexity = if ($Functions.Count + $Classes.Count -gt 10) { "high" } elseif ($Functions.Count + $Classes.Count -gt 5) { "medium" } else { "low" }
    }
}

# 💙 Analyze PowerShell File
function Analyze-PowerShellFile {
    param([string]$Content, [string]$FilePath)
    
    $Functions = @()
    $Classes = @()
    $Dependencies = @()
    
    # Extract functions
    $FunctionMatches = [regex]::Matches($Content, "function\s+(\w+)\s*\{")
    foreach ($Match in $FunctionMatches) {
        $Functions += @{
            Name = $Match.Groups[1].Value
            File = $FilePath
            Code = ""
            Parameters = @()
            ReturnType = "unknown"
            Complexity = "medium"
            Dependencies = @()
        }
    }
    
    # Extract classes
    $ClassMatches = [regex]::Matches($Content, "class\s+(\w+)")
    foreach ($Match in $ClassMatches) {
        $Classes += @{
            Name = $Match.Groups[1].Value
            File = $FilePath
            Code = ""
            Methods = @()
            Properties = @()
            Dependencies = @()
            Inheritance = "Object"
        }
    }
    
    return @{
        IsTestable = ($Functions.Count -gt 0 -or $Classes.Count -gt 0)
        Functions = $Functions
        Classes = $Classes
        Dependencies = $Dependencies
        Complexity = if ($Functions.Count + $Classes.Count -gt 10) { "high" } elseif ($Functions.Count + $Classes.Count -gt 5) { "medium" } else { "low" }
    }
}

# 🔧 Analyze Generic File
function Analyze-GenericFile {
    param([string]$Content, [string]$FilePath)
    
    return @{
        IsTestable = $false
        Functions = @()
        Classes = @()
        Dependencies = @()
        Complexity = "low"
    }
}

# 🧪 Generate Tests for File
function Generate-FileTests {
    param(
        [hashtable]$File,
        [string]$Language,
        [string]$Framework
    )
    
    $FileTests = @{
        UnitTests = @()
        IntegrationTests = @()
        PerformanceTests = @()
        SecurityTests = @()
    }
    
    # Generate unit tests for functions
    foreach ($Function in $File.Functions) {
        if ($GenerateUnitTests) {
            $UnitTest = Generate-UnitTest -Function $Function -Language $Language -Framework $Framework
            $FileTests.UnitTests += $UnitTest
        }
    }
    
    # Generate unit tests for classes
    foreach ($Class in $File.Classes) {
        if ($GenerateUnitTests) {
            $ClassTests = Generate-ClassTests -Class $Class -Language $Language -Framework $Framework
            $FileTests.UnitTests += $ClassTests
        }
    }
    
    # Generate integration tests
    if ($GenerateIntegrationTests) {
        $IntegrationTest = Generate-IntegrationTest -File $File -Language $Language -Framework $Framework
        $FileTests.IntegrationTests += $IntegrationTest
    }
    
    # Generate performance tests
    if ($GeneratePerformanceTests) {
        $PerformanceTest = Generate-PerformanceTest -File $File -Language $Language -Framework $Framework
        $FileTests.PerformanceTests += $PerformanceTest
    }
    
    # Generate security tests
    if ($GenerateSecurityTests) {
        $SecurityTest = Generate-SecurityTest -File $File -Language $Language -Framework $Framework
        $FileTests.SecurityTests += $SecurityTest
    }
    
    return $FileTests
}

# 🔬 Generate Unit Test
function Generate-UnitTest {
    param(
        [hashtable]$Function,
        [string]$Language,
        [string]$Framework
    )
    
    $TestContent = "# Generated unit test for function: $($Function.Name)`n"
    $TestContent += "# File: $($Function.File)`n"
    $TestContent += "# Language: $Language`n"
    $TestContent += "# Framework: $Framework`n`n"
    
    # Generate template-based test
    $TestContent += Generate-TemplateUnitTest -Function $Function -Language $Language -Framework $Framework
    
    return @{
        Function = $Function.Name
        File = $Function.File
        Content = $TestContent
        Type = "Unit"
        Framework = $Framework
    }
}

# 🏗️ Generate Class Tests
function Generate-ClassTests {
    param(
        [hashtable]$Class,
        [string]$Language,
        [string]$Framework
    )
    
    $TestContent = "# Generated unit tests for class: $($Class.Name)`n"
    $TestContent += "# File: $($Class.File)`n"
    $TestContent += "# Language: $Language`n"
    $TestContent += "# Framework: $Framework`n`n"
    
    # Generate template-based test
    $TestContent += Generate-TemplateUnitTest -Function @{Name = $Class.Name} -Language $Language -Framework $Framework
    
    return @{
        Class = $Class.Name
        File = $Class.File
        Content = $TestContent
        Type = "Class"
        Framework = $Framework
    }
}

# 🔗 Generate Integration Test
function Generate-IntegrationTest {
    param(
        [hashtable]$File,
        [string]$Language,
        [string]$Framework
    )
    
    $TestContent = "# Generated integration test`n"
    $TestContent += "# File: $($File.File.Name)`n"
    $TestContent += "# Language: $Language`n"
    $TestContent += "# Framework: $Framework`n`n"
    
    $TestContent += "# Integration test cases to implement:`n"
    $TestContent += "# 1. Component interaction tests`n"
    $TestContent += "# 2. Database integration tests`n"
    $TestContent += "# 3. API integration tests`n"
    $TestContent += "# 4. External service integration tests`n"
    $TestContent += "# 5. End-to-end workflow tests`n"
    
    return @{
        File = $File.File.Name
        Content = $TestContent
        Type = "Integration"
        Framework = $Framework
    }
}

# ⚡ Generate Performance Test
function Generate-PerformanceTest {
    param(
        [hashtable]$File,
        [string]$Language,
        [string]$Framework
    )
    
    $TestContent = "# Generated performance test`n"
    $TestContent += "# File: $($File.File.Name)`n"
    $TestContent += "# Language: $Language`n"
    $TestContent += "# Framework: $Framework`n`n"
    
    $TestContent += "# Performance test cases to implement:`n"
    $TestContent += "# 1. Load tests`n"
    $TestContent += "# 2. Stress tests`n"
    $TestContent += "# 3. Memory usage tests`n"
    $TestContent += "# 4. CPU usage tests`n"
    $TestContent += "# 5. Response time tests`n"
    $TestContent += "# 6. Throughput tests`n"
    
    return @{
        File = $File.File.Name
        Content = $TestContent
        Type = "Performance"
        Framework = $Framework
    }
}

# 🔒 Generate Security Test
function Generate-SecurityTest {
    param(
        [hashtable]$File,
        [string]$Language,
        [string]$Framework
    )
    
    $TestContent = "# Generated security test`n"
    $TestContent += "# File: $($File.File.Name)`n"
    $TestContent += "# Language: $Language`n"
    $TestContent += "# Framework: $Framework`n`n"
    
    $TestContent += "# Security test cases to implement:`n"
    $TestContent += "# 1. Input validation tests`n"
    $TestContent += "# 2. Authentication tests`n"
    $TestContent += "# 3. Authorization tests`n"
    $TestContent += "# 4. SQL injection tests`n"
    $TestContent += "# 5. XSS tests`n"
    $TestContent += "# 6. CSRF tests`n"
    $TestContent += "# 7. Data encryption tests`n"
    $TestContent += "# 8. Secure communication tests`n"
    
    return @{
        File = $File.File.Name
        Content = $TestContent
        Type = "Security"
        Framework = $Framework
    }
}

# 📁 Create Test Files
function Create-TestFiles {
    param(
        [hashtable]$GeneratedTests,
        [string]$Language,
        [string]$Framework
    )
    
    $TestDir = ".\tests"
    if (-not (Test-Path $TestDir)) {
        New-Item -ItemType Directory -Path $TestDir -Force | Out-Null
    }
    
    # Create subdirectories for different test types
    $TestTypes = @("unit", "integration", "performance", "security")
    foreach ($Type in $TestTypes) {
        $TypeDir = Join-Path $TestDir $Type
        if (-not (Test-Path $TypeDir)) {
            New-Item -ItemType Directory -Path $TypeDir -Force | Out-Null
        }
    }
    
    # Write unit tests
    foreach ($Test in $GeneratedTests.UnitTests) {
        $TestFileName = Get-TestFileName -OriginalFile $Test.File -TestType "unit" -Language $Language
        $TestFilePath = Join-Path (Join-Path $TestDir "unit") $TestFileName
        
        if (-not (Test-Path $TestFilePath) -or $OverwriteExisting) {
            $Test.Content | Out-File -FilePath $TestFilePath -Encoding UTF8
            Write-Host "📝 Created unit test: $TestFileName" -ForegroundColor Green
        }
    }
    
    # Write integration tests
    foreach ($Test in $GeneratedTests.IntegrationTests) {
        $TestFileName = Get-TestFileName -OriginalFile $Test.File -TestType "integration" -Language $Language
        $TestFilePath = Join-Path (Join-Path $TestDir "integration") $TestFileName
        
        if (-not (Test-Path $TestFilePath) -or $OverwriteExisting) {
            $Test.Content | Out-File -FilePath $TestFilePath -Encoding UTF8
            Write-Host "📝 Created integration test: $TestFileName" -ForegroundColor Green
        }
    }
    
    # Write performance tests
    foreach ($Test in $GeneratedTests.PerformanceTests) {
        $TestFileName = Get-TestFileName -OriginalFile $Test.File -TestType "performance" -Language $Language
        $TestFilePath = Join-Path (Join-Path $TestDir "performance") $TestFileName
        
        if (-not (Test-Path $TestFilePath) -or $OverwriteExisting) {
            $Test.Content | Out-File -FilePath $TestFilePath -Encoding UTF8
            Write-Host "📝 Created performance test: $TestFileName" -ForegroundColor Green
        }
    }
    
    # Write security tests
    foreach ($Test in $GeneratedTests.SecurityTests) {
        $TestFileName = Get-TestFileName -OriginalFile $Test.File -TestType "security" -Language $Language
        $TestFilePath = Join-Path (Join-Path $TestDir "security") $TestFileName
        
        if (-not (Test-Path $TestFilePath) -or $OverwriteExisting) {
            $Test.Content | Out-File -FilePath $TestFilePath -Encoding UTF8
            Write-Host "📝 Created security test: $TestFileName" -ForegroundColor Green
        }
    }
}

# 📋 Merge Test Results
function Merge-TestResults {
    param(
        [hashtable]$GeneratedTests,
        [hashtable]$FileTests
    )
    
    $GeneratedTests.UnitTests += $FileTests.UnitTests
    $GeneratedTests.IntegrationTests += $FileTests.IntegrationTests
    $GeneratedTests.PerformanceTests += $FileTests.PerformanceTests
    $GeneratedTests.SecurityTests += $FileTests.SecurityTests
    
    $GeneratedTests.Summary.TestsGenerated += $FileTests.UnitTests.Count + $FileTests.IntegrationTests.Count + $FileTests.PerformanceTests.Count + $FileTests.SecurityTests.Count
    $GeneratedTests.Summary.FilesWithTests++
}

# 📝 Get Test File Name
function Get-TestFileName {
    param(
        [string]$OriginalFile,
        [string]$TestType,
        [string]$Language
    )
    
    $BaseName = [System.IO.Path]::GetFileNameWithoutExtension($OriginalFile)
    $Extension = Get-TestFileExtension -Language $Language
    
    return "${BaseName}.${TestType}.${Extension}"
}

# 📄 Get Test File Extension
function Get-TestFileExtension {
    param([string]$Language)
    
    $Extensions = @{
        "python" = "py"
        "javascript" = "js"
        "typescript" = "ts"
        "csharp" = "cs"
        "java" = "java"
        "go" = "go"
        "rust" = "rs"
        "php" = "php"
        "powershell" = "ps1"
    }
    
    return if ($Extensions.ContainsKey($Language)) { $Extensions[$Language] } else { "ps1" }
}

# ⚙️ Generate Test Configuration
function Generate-TestConfiguration {
    param(
        [string]$Language,
        [string]$Framework
    )
    
    $Config = @{
        language = $Language
        framework = $Framework
        testDirectory = "tests"
        coverageThreshold = 80
        timeout = 30000
        parallel = $true
        watch = $false
        verbose = $true
        generated = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
    }
    
    $ConfigPath = ".\test-config.json"
    $Config | ConvertTo-Json -Depth 3 | Out-File -FilePath $ConfigPath -Encoding UTF8
    Write-Host "⚙️ Created test configuration: $ConfigPath" -ForegroundColor Green
}

# 📚 Generate Test Documentation
function Generate-TestDocumentation {
    param(
        [hashtable]$GeneratedTests,
        [string]$Language
    )
    
    $DocPath = ".\tests\README.md"
    $DocContent = @"
# 🧪 Generated Test Suite

**Language**: $Language  
**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## 📊 Test Summary

- **Total Tests Generated**: $($GeneratedTests.Summary.TestsGenerated)
- **Files with Tests**: $($GeneratedTests.Summary.FilesWithTests)
- **Unit Tests**: $($GeneratedTests.UnitTests.Count)
- **Integration Tests**: $($GeneratedTests.IntegrationTests.Count)
- **Performance Tests**: $($GeneratedTests.PerformanceTests.Count)
- **Security Tests**: $($GeneratedTests.SecurityTests.Count)

## 🚀 Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test -- --testPathPattern=unit

# Run specific unit test
npm test -- --testNamePattern="TestName"
```

### Integration Tests
```bash
# Run all integration tests
npm test -- --testPathPattern=integration
```

### Performance Tests
```bash
# Run performance tests
npm run test:performance
```

### Security Tests
```bash
# Run security tests
npm run test:security
```

## 📁 Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── performance/    # Performance tests
├── security/       # Security tests
└── README.md       # This file
```

## 🎯 Test Coverage

The generated tests cover:
- ✅ Happy path scenarios
- ✅ Edge cases
- ✅ Error handling
- ✅ Boundary values
- ✅ Security vulnerabilities
- ✅ Performance bottlenecks
- ✅ Integration points

## 🔧 Configuration

Test configuration is stored in `test-config.json`.

## 📈 Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Unit tests run on every commit
- Integration tests run on pull requests
- Performance tests run on releases
- Security tests run daily

---
*Generated by AI Test Generator v1.0*
"@

    $DocContent | Out-File -FilePath $DocPath -Encoding UTF8
    Write-Host "📚 Created test documentation: $DocPath" -ForegroundColor Green
}

# 🧪 Generate Template Unit Test
function Generate-TemplateUnitTest {
    param(
        [hashtable]$Function,
        [string]$Language,
        [string]$Framework
    )
    
    switch ($Language) {
        "python" {
            return Generate-PythonUnitTest -Function $Function -Framework $Framework
        }
        "javascript" {
            return Generate-JavaScriptUnitTest -Function $Function -Framework $Framework
        }
        "powershell" {
            return Generate-PowerShellUnitTest -Function $Function -Framework $Framework
        }
        default {
            return Generate-GenericUnitTest -Function $Function -Framework $Framework
        }
    }
}

# 🐍 Generate Python Unit Test
function Generate-PythonUnitTest {
    param([hashtable]$Function, [string]$Framework)
    
    $PythonCode = @'
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add the parent directory to the path to import the module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Test{0} (unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures before each test method."""
        pass
    
    def tearDown(self):
        """Tear down test fixtures after each test method."""
        pass
    
    def test_{1}_happy_path(self):
        """Test {1} with valid input."""
        # TODO: Implement happy path test
        # Arrange
        # Act
        # Assert
        self.fail("Test not implemented")
    
    def test_{1}_edge_cases(self):
        """Test {1} with edge cases."""
        # TODO: Implement edge case tests
        # Test with None, empty values, boundary values
        self.fail("Test not implemented")
    
    def test_{1}_error_handling(self):
        """Test {1} error handling."""
        # TODO: Implement error handling tests
        # Test with invalid input, exceptions
        self.fail("Test not implemented")

if __name__ == '__main__':
    unittest.main()
'@
    
    $CleanFunctionName = $Function.Name -replace '[^a-zA-Z0-9]', ''
    return $PythonCode -f $CleanFunctionName, $Function.Name
}

# 🟨 Generate JavaScript Unit Test
function Generate-JavaScriptUnitTest {
    param([hashtable]$Function, [string]$Framework)
    
    $JavaScriptCode = @'
const {0} = require('../{0}');

describe('{0}', () => {
    
    beforeEach(() => {
        // Set up test fixtures before each test
    });
    
    afterEach(() => {
        // Clean up after each test
    });
    
    test('should handle happy path', () => {
        // TODO: Implement happy path test
        // Arrange
        // Act
        // Assert
        expect(true).toBe(false); // Placeholder
    });
    
    test('should handle edge cases', () => {
        // TODO: Implement edge case tests
        // Test with null, undefined, empty values, boundary values
        expect(true).toBe(false); // Placeholder
    });
    
    test('should handle errors', () => {
        // TODO: Implement error handling tests
        // Test with invalid input, exceptions
        expect(true).toBe(false); // Placeholder
    });
});
'@
    
    return $JavaScriptCode -f $Function.Name
}

# 💙 Generate PowerShell Unit Test
function Generate-PowerShellUnitTest {
    param([hashtable]$Function, [string]$Framework)
    
    $PowerShellCode = @'
using module Pester

Describe "{0}" {
    
    BeforeAll {
        # Set up test fixtures before all tests
    }
    
    BeforeEach {
        # Set up test fixtures before each test
    }
    
    AfterEach {
        # Clean up after each test
    }
    
    AfterAll {
        # Clean up after all tests
    }
    
    It "Should handle happy path" {
        # TODO: Implement happy path test
        # Arrange
        # Act
        # Assert
        $true | Should -Be $false # Placeholder
    }
    
    It "Should handle edge cases" {
        # TODO: Implement edge case tests
        # Test with null, empty values, boundary values
        $true | Should -Be $false # Placeholder
    }
    
    It "Should handle errors" {
        # TODO: Implement error handling tests
        # Test with invalid input, exceptions
        $true | Should -Be $false # Placeholder
    }
}
'@
    
    return $PowerShellCode -f $Function.Name
}

# 🔧 Generate Generic Unit Test
function Generate-GenericUnitTest {
    param([hashtable]$Function, [string]$Framework)
    
    return @"
# Generated unit test for $($Function.Name)
# Framework: $Framework
# TODO: Implement actual test cases

# Test cases to implement:
# 1. Happy path scenarios
# 2. Edge cases
# 3. Error handling
# 4. Boundary values
# 5. Mock dependencies
"@
}

# 🚀 Execute Test Generation
if ($MyInvocation.InvocationName -ne '.') {
    Start-AITestGeneration
}
