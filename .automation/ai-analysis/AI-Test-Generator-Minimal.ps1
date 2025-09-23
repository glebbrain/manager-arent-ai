# 🧪 AI-Powered Test Generator - Minimal Working Version
# Automated generation of unit tests based on code analysis

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$Language = "auto"
)

# 🚀 Main Test Generation Function
function Start-AITestGeneration {
    Write-Host "🧪 Starting AI Test Generation..." -ForegroundColor Cyan
    
    # 1. Discover project files
    $ProjectFiles = Get-ProjectFiles -Path $ProjectPath -Language $Language
    Write-Host "📁 Found $($ProjectFiles.Count) files to analyze" -ForegroundColor Green
    
    # 2. Detect language and test framework
    $DetectedLanguage = Get-DetectedLanguage -Files $ProjectFiles
    Write-Host "🔍 Detected language: $DetectedLanguage" -ForegroundColor Yellow
    
    # 3. Analyze code for test generation
    $TestableFiles = Analyze-TestableFiles -Files $ProjectFiles -Language $DetectedLanguage
    Write-Host "🎯 Found $($TestableFiles.Count) testable files" -ForegroundColor Green
    
    # 4. Generate tests
    $GeneratedTests = @{
        UnitTests = @()
        Summary = @{
            TotalFiles = $TestableFiles.Count
            TestsGenerated = 0
            FilesWithTests = 0
        }
    }
    
    foreach ($File in $TestableFiles) {
        Write-Host "🧪 Generating tests for: $($File.Name)" -ForegroundColor Yellow
        
        $FileTests = Generate-FileTests -File $File -Language $DetectedLanguage
        $GeneratedTests.UnitTests += $FileTests.UnitTests
        $GeneratedTests.Summary.TestsGenerated += $FileTests.UnitTests.Count
        $GeneratedTests.Summary.FilesWithTests++
    }
    
    # 5. Create test files
    Create-TestFiles -GeneratedTests $GeneratedTests -Language $DetectedLanguage
    
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
        [string]$Language
    )
    
    $FileTests = @{
        UnitTests = @()
    }
    
    # Generate unit tests for functions
    foreach ($Function in $File.Functions) {
        $UnitTest = Generate-UnitTest -Function $Function -Language $Language
        $FileTests.UnitTests += $UnitTest
    }
    
    # Generate unit tests for classes
    foreach ($Class in $File.Classes) {
        $ClassTests = Generate-ClassTests -Class $Class -Language $Language
        $FileTests.UnitTests += $ClassTests
    }
    
    return $FileTests
}

# 🔬 Generate Unit Test
function Generate-UnitTest {
    param(
        [hashtable]$Function,
        [string]$Language
    )
    
    $TestContent = "# Generated unit test for function: $($Function.Name)`n"
    $TestContent += "# File: $($Function.File)`n"
    $TestContent += "# Language: $Language`n`n"
    
    # Generate template-based test
    $TestContent += Generate-TemplateUnitTest -Function $Function -Language $Language
    
    return @{
        Function = $Function.Name
        File = $Function.File
        Content = $TestContent
        Type = "Unit"
    }
}

# 🏗️ Generate Class Tests
function Generate-ClassTests {
    param(
        [hashtable]$Class,
        [string]$Language
    )
    
    $TestContent = "# Generated unit tests for class: $($Class.Name)`n"
    $TestContent += "# File: $($Class.File)`n"
    $TestContent += "# Language: $Language`n`n"
    
    # Generate template-based test
    $TestContent += Generate-TemplateUnitTest -Function @{Name = $Class.Name} -Language $Language
    
    return @{
        Class = $Class.Name
        File = $Class.File
        Content = $TestContent
        Type = "Class"
    }
}

# 📁 Create Test Files
function Create-TestFiles {
    param(
        [hashtable]$GeneratedTests,
        [string]$Language
    )
    
    $TestDir = ".\tests"
    if (-not (Test-Path $TestDir)) {
        New-Item -ItemType Directory -Path $TestDir -Force | Out-Null
    }
    
    # Create subdirectories for different test types
    $TestTypes = @("unit")
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
        
        $Test.Content | Out-File -FilePath $TestFilePath -Encoding UTF8
        Write-Host "📝 Created unit test: $TestFileName" -ForegroundColor Green
    }
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

# 🧪 Generate Template Unit Test
function Generate-TemplateUnitTest {
    param(
        [hashtable]$Function,
        [string]$Language
    )
    
    switch ($Language) {
        "python" {
            return Generate-PythonUnitTest -Function $Function
        }
        "javascript" {
            return Generate-JavaScriptUnitTest -Function $Function
        }
        "powershell" {
            return Generate-PowerShellUnitTest -Function $Function
        }
        default {
            return Generate-GenericUnitTest -Function $Function
        }
    }
}

# 🐍 Generate Python Unit Test
function Generate-PythonUnitTest {
    param([hashtable]$Function)
    
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
    param([hashtable]$Function)
    
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
    param([hashtable]$Function)
    
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
    param([hashtable]$Function)
    
    return @"
# Generated unit test for $($Function.Name)
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
