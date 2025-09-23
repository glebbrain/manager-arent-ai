# Project Scanner Simple v2.9
# Автоматическое сканирование проекта с AI-анализом

param(
    [string]$ProjectPath = ".",
    [switch]$UpdateTodo,
    [switch]$EnableAI,
    [switch]$Verbose
)

# Цвета для вывода
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-ProjectType {
    param([string]$Path)
    
    $projectFiles = @{
        "nodejs" = @("package.json", "node_modules")
        "python" = @("requirements.txt", "setup.py", "pyproject.toml")
        "cpp" = @("CMakeLists.txt", "Makefile", "*.cpp", "*.h")
        "dotnet" = @("*.csproj", "*.sln", "*.cs")
        "java" = @("pom.xml", "build.gradle", "*.java")
        "go" = @("go.mod", "go.sum", "*.go")
        "rust" = @("Cargo.toml", "Cargo.lock", "*.rs")
        "php" = @("composer.json", "*.php")
    }
    
    foreach ($type in $projectFiles.Keys) {
        $found = $false
        foreach ($file in $projectFiles[$type]) {
            if (Get-ChildItem -Path $Path -Filter $file -Recurse -ErrorAction SilentlyContinue) {
                $found = $true
                break
            }
        }
        if ($found) {
            return $type
        }
    }
    
    return "unknown"
}

function Get-ProjectStats {
    param([string]$Path)
    
    $stats = @{
        TotalFiles = 0
        CodeFiles = 0
        TestFiles = 0
        ConfigFiles = 0
        DocumentationFiles = 0
        TotalLines = 0
        CodeLines = 0
        TestLines = 0
    }
    
    $codeExtensions = @("*.ps1", "*.js", "*.ts", "*.py", "*.cpp", "*.h", "*.cs", "*.java", "*.go", "*.rs", "*.php")
    $testExtensions = @("*test*", "*spec*", "*test.ps1", "*test.js", "*test.py")
    $configExtensions = @("*.json", "*.yaml", "*.yml", "*.xml", "*.toml", "*.ini", "*.cfg")
    $docExtensions = @("*.md", "*.txt", "*.rst", "*.doc", "*.docx")
    
    $allFiles = Get-ChildItem -Path $Path -File -Recurse -ErrorAction SilentlyContinue
    $stats.TotalFiles = $allFiles.Count
    
    foreach ($file in $allFiles) {
        # Подсчет строк
        try {
            $content = Get-Content -Path $file.FullName -ErrorAction SilentlyContinue
            $lineCount = $content.Count
            $stats.TotalLines += $lineCount
        } catch {
            $lineCount = 0
        }
        
        # Классификация файлов
        $isCode = $false
        $isTest = $false
        $isConfig = $false
        $isDoc = $false
        
        foreach ($ext in $codeExtensions) {
            if ($file.Name -like $ext) {
                $isCode = $true
                $stats.CodeFiles++
                $stats.CodeLines += $lineCount
                break
            }
        }
        
        foreach ($ext in $testExtensions) {
            if ($file.Name -like $ext) {
                $isTest = $true
                $stats.TestFiles++
                $stats.TestLines += $lineCount
                break
            }
        }
        
        foreach ($ext in $configExtensions) {
            if ($file.Name -like $ext) {
                $isConfig = $true
                $stats.ConfigFiles++
                break
            }
        }
        
        foreach ($ext in $docExtensions) {
            if ($file.Name -like $ext) {
                $isDoc = $true
                $stats.DocumentationFiles++
                break
            }
        }
    }
    
    return $stats
}

function Update-TodoFile {
    param([string]$ProjectPath, [hashtable]$Stats, [string]$ProjectType)
    
    $todoPath = Join-Path $ProjectPath "TODO.md"
    if (Test-Path $todoPath) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $newEntry = @"

## Project Scan Results ($timestamp)
- **Project Type**: $ProjectType
- **Total Files**: $($Stats.TotalFiles)
- **Code Files**: $($Stats.CodeFiles)
- **Test Files**: $($Stats.TestFiles)
- **Total Lines**: $($Stats.TotalLines)
- **Code Lines**: $($Stats.CodeLines)
- **Test Coverage**: $(if ($Stats.CodeLines -gt 0) { [math]::Round(($Stats.TestLines / $Stats.CodeLines) * 100, 2) } else { 0 })%
"@
        
        $content = Get-Content -Path $todoPath -Raw
        if ($content -notmatch "## Project Scan Results") {
            $content += $newEntry
            Set-Content -Path $todoPath -Value $content
        }
    }
}

# Основная логика
Write-ColorOutput "🔍 Project Scanner Simple v2.9" -Color $Colors.Header
Write-ColorOutput "Scanning project: $ProjectPath" -Color $Colors.Info

# Определение типа проекта
$projectType = Get-ProjectType -Path $ProjectPath
Write-ColorOutput "Project Type: $projectType" -Color $Colors.Success

# Получение статистики
$stats = Get-ProjectStats -Path $ProjectPath

# Вывод результатов
Write-ColorOutput "`n📊 Project Statistics:" -Color $Colors.Header
Write-ColorOutput "  Total Files: $($stats.TotalFiles)" -Color $Colors.Info
Write-ColorOutput "  Code Files: $($stats.CodeFiles)" -Color $Colors.Info
Write-ColorOutput "  Test Files: $($stats.TestFiles)" -Color $Colors.Info
Write-ColorOutput "  Config Files: $($stats.ConfigFiles)" -Color $Colors.Info
Write-ColorOutput "  Documentation Files: $($stats.DocumentationFiles)" -Color $Colors.Info
Write-ColorOutput "  Total Lines: $($stats.TotalLines)" -Color $Colors.Info
Write-ColorOutput "  Code Lines: $($stats.CodeLines)" -Color $Colors.Info
Write-ColorOutput "  Test Lines: $($stats.TestLines)" -Color $Colors.Info

if ($stats.CodeLines -gt 0) {
    $testCoverage = [math]::Round(($stats.TestLines / $stats.CodeLines) * 100, 2)
    Write-ColorOutput "  Test Coverage: $testCoverage%" -Color $(if ($testCoverage -ge 80) { $Colors.Success } else { $Colors.Warning })
}

# Обновление TODO файла
if ($UpdateTodo) {
    Update-TodoFile -ProjectPath $ProjectPath -Stats $stats -ProjectType $projectType
    Write-ColorOutput "`n✅ TODO.md updated" -Color $Colors.Success
}

Write-ColorOutput "`n🎯 Scan completed successfully!" -Color $Colors.Success