# ManagerAgentAI Consistency Manager - PowerShell Version
# System for ensuring consistency between all system components

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$ProjectPath,
    
    [Parameter(Position=2)]
    [string]$OutputFile,
    
    [switch]$AutoFix,
    [switch]$CreateMissing,
    [switch]$FormatCode,
    [switch]$Help
)

$ConfigPath = Join-Path $PSScriptRoot ".." "configs"
$TemplatesPath = Join-Path $PSScriptRoot ".." "templates"
$ScriptsPath = $PSScriptRoot

function Show-Help {
    Write-Host @"
🔧 ManagerAgentAI Consistency Manager

Usage:
  .\consistency-manager.ps1 <command> [options]

Commands:
  validate <path>              Validate project consistency
  fix <path> [options]         Fix consistency issues
  report <path> [options]      Generate consistency report
  check <path>                 Quick consistency check

Options:
  -AutoFix                    Automatically fix issues
  -CreateMissing              Create missing files
  -FormatCode                 Format code with Prettier/ESLint
  -OutputFile <file>          Output report to file

Examples:
  .\consistency-manager.ps1 validate ./my-project
  .\consistency-manager.ps1 fix ./my-project -AutoFix -CreateMissing
  .\consistency-manager.ps1 report ./my-project -OutputFile report.json
"@
}

function Ensure-Directories {
    $dirs = @($ConfigPath, $TemplatesPath, $ScriptsPath)
    $dirs | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
        }
    }
}

function Get-Standards {
    return @{
        naming = @{
            files = @{
                kebabCase = $true
                extensions = @{
                    javascript = '.js'
                    typescript = '.ts'
                    json = '.json'
                    markdown = '.md'
                    yaml = '.yaml'
                    yml = '.yml'
                }
            }
            variables = @{
                camelCase = $true
                constants = 'UPPER_SNAKE_CASE'
            }
            functions = @{
                camelCase = $true
                prefix = @{
                    private = '_'
                    async = 'async'
                    getter = 'get'
                    setter = 'set'
                }
            }
            classes = @{
                PascalCase = $true
                suffix = @{
                    manager = 'Manager'
                    service = 'Service'
                    controller = 'Controller'
                    model = 'Model'
                    view = 'View'
                    component = 'Component'
                }
            }
        }
        structure = @{
            directories = @{
                src = 'source code'
                tests = 'test files'
                docs = 'documentation'
                scripts = 'build and utility scripts'
                config = 'configuration files'
                assets = 'static assets'
                public = 'public files'
                dist = 'build output'
                node_modules = 'dependencies'
            }
            files = @{
                required = @('README.md', '.gitignore', 'package.json')
                recommended = @('.env.example', 'LICENSE', 'CHANGELOG.md')
                config = @('tsconfig.json', '.eslintrc.json', '.prettierrc.json')
            }
        }
        code = @{
            formatting = @{
                indent = 2
                quotes = 'single'
                semicolons = $true
                trailingCommas = $true
                lineEndings = 'lf'
            }
            imports = @{
                order = @('external', 'internal', 'relative')
                grouping = $true
                sorting = 'alphabetical'
            }
            comments = @{
                required = @('file headers', 'function descriptions', 'complex logic')
                format = 'JSDoc'
                language = 'English'
            }
        }
        documentation = @{
            format = 'Markdown'
            structure = @{
                required = @('README.md', 'API.md', 'CHANGELOG.md')
                sections = @('Overview', 'Installation', 'Usage', 'API', 'Contributing', 'License')
            }
            style = @{
                headers = 'ATX'
                lists = 'ordered'
                links = 'reference'
                code = 'fenced'
            }
        }
        testing = @{
            framework = 'Jest'
            structure = @{
                unit = 'tests/unit'
                integration = 'tests/integration'
                e2e = 'tests/e2e'
            }
            naming = @{
                files = '*.test.js'
                describe = 'Component/Function name'
                it = 'should behavior description'
            }
        }
        git = @{
            branches = @{
                main = 'main'
                develop = 'develop'
                feature = 'feature/'
                hotfix = 'hotfix/'
                release = 'release/'
            }
            commits = @{
                format = 'conventional'
                types = @('feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore')
                scope = 'optional'
                subject = 'lowercase'
            }
        }
    }
}

function Test-ProjectConsistency {
    param([string]$ProjectPath)
    
    $issues = @()
    $project = Get-ProjectAnalysis -ProjectPath $ProjectPath
    $standards = Get-Standards
    
    # Validate structure
    $issues += Test-ProjectStructure -Project $project -Standards $standards
    
    # Validate naming conventions
    $issues += Test-NamingConventions -Project $project -Standards $standards
    
    # Validate code style
    $issues += Test-CodeStyle -Project $project -Standards $standards
    
    # Validate documentation
    $issues += Test-Documentation -Project $project -Standards $standards
    
    # Validate configuration
    $issues += Test-Configuration -Project $project -Standards $standards
    
    return @{
        project = $project
        issues = $issues
        score = Get-ConsistencyScore -Issues $issues
        recommendations = Get-Recommendations -Issues $issues
    }
}

function Get-ProjectAnalysis {
    param([string]$ProjectPath)
    
    return @{
        path = $ProjectPath
        type = Get-ProjectType -ProjectPath $ProjectPath
        structure = Get-ProjectStructure -ProjectPath $ProjectPath
        files = Get-ProjectFiles -ProjectPath $ProjectPath
        dependencies = Get-ProjectDependencies -ProjectPath $ProjectPath
        configuration = Get-ProjectConfiguration -ProjectPath $ProjectPath
    }
}

function Get-ProjectType {
    param([string]$ProjectPath)
    
    $packageJsonPath = Join-Path $ProjectPath "package.json"
    $requirementsPath = Join-Path $ProjectPath "requirements.txt"
    $unityPath = Join-Path $ProjectPath "Assets"
    $solidityPath = Join-Path $ProjectPath "contracts"
    
    if (Test-Path $packageJsonPath) {
        $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
        
        if ($packageJson.dependencies -and $packageJson.dependencies.'react-native') { return 'mobile' }
        if ($packageJson.dependencies -and $packageJson.dependencies.electron) { return 'desktop' }
        if ($packageJson.dependencies -and $packageJson.dependencies.express) { return 'api' }
        if ($packageJson.dependencies -and $packageJson.dependencies.react) { return 'web' }
        if ($packageJson.main -and -not $packageJson.dependencies) { return 'library' }
    }
    
    if (Test-Path $requirementsPath) { return 'ai-ml' }
    if (Test-Path $unityPath) { return 'game' }
    if (Test-Path $solidityPath) { return 'blockchain' }
    
    return 'unknown'
}

function Get-ProjectStructure {
    param([string]$ProjectPath)
    
    $structure = @{
        directories = @()
        files = @()
        depth = 0
    }
    
    Get-ChildItem -Path $ProjectPath -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring($ProjectPath.Length + 1)
        $depth = ($relativePath.Split('\').Length) - 1
        $structure.depth = [Math]::Max($structure.depth, $depth)
        
        if ($_.PSIsContainer) {
            $structure.directories += $relativePath
        } else {
            $structure.files += $relativePath
        }
    }
    
    return $structure
}

function Get-ProjectFiles {
    param([string]$ProjectPath)
    
    $files = @{
        byExtension = @{}
        byType = @{}
        total = 0
        totalSize = 0
    }
    
    Get-ChildItem -Path $ProjectPath -Recurse -File | ForEach-Object {
        $ext = $_.Extension
        $relativePath = $_.FullName.Substring($ProjectPath.Length + 1)
        
        $files.total++
        $files.totalSize += $_.Length
        
        if (-not $files.byExtension[$ext]) {
            $files.byExtension[$ext] = @()
        }
        $files.byExtension[$ext] += $relativePath
        
        $fileType = Get-FileType -Extension $ext
        if (-not $files.byType[$fileType]) {
            $files.byType[$fileType] = @()
        }
        $files.byType[$fileType] += $relativePath
    }
    
    return $files
}

function Get-ProjectDependencies {
    param([string]$ProjectPath)
    
    $packageJsonPath = Join-Path $ProjectPath "package.json"
    if (Test-Path $packageJsonPath) {
        $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
        return @{
            production = $packageJson.dependencies ?? @{}
            development = $packageJson.devDependencies ?? @{}
            scripts = $packageJson.scripts ?? @{}
        }
    }
    return $null
}

function Get-ProjectConfiguration {
    param([string]$ProjectPath)
    
    $configFiles = @(
        'tsconfig.json',
        '.eslintrc.json',
        '.prettierrc.json',
        'jest.config.js',
        'webpack.config.js',
        '.gitignore',
        '.env.example'
    )
    
    $config = @{}
    $configFiles | ForEach-Object {
        $filePath = Join-Path $ProjectPath $_
        if (Test-Path $filePath) {
            try {
                $content = Get-Content $filePath -Raw
                $config[$_] = $content | ConvertFrom-Json
            } catch {
                $config[$_] = @{ error = 'Invalid JSON' }
            }
        }
    }
    
    return $config
}

function Test-ProjectStructure {
    param(
        [object]$Project,
        [object]$Standards
    )
    
    $issues = @()
    
    # Check required directories
    $Standards.structure.directories.PSObject.Properties | ForEach-Object {
        if ($Project.structure.directories -notcontains $_.Name) {
            $issues += @{
                type = 'structure'
                severity = 'warning'
                message = "Missing recommended directory: $($_.Name) ($($_.Value))"
                suggestion = "Create directory: mkdir $($_.Name)"
            }
        }
    }
    
    # Check required files
    $Standards.structure.files.required | ForEach-Object {
        if ($Project.structure.files -notcontains $_) {
            $issues += @{
                type = 'structure'
                severity = 'error'
                message = "Missing required file: $_"
                suggestion = "Create file: New-Item $_ -ItemType File"
            }
        }
    }
    
    # Check directory depth
    if ($Project.structure.depth -gt 5) {
        $issues += @{
            type = 'structure'
            severity = 'warning'
            message = "Deep directory structure detected ($($Project.structure.depth) levels)"
            suggestion = 'Consider flattening the directory structure'
        }
    }
    
    return $issues
}

function Test-NamingConventions {
    param(
        [object]$Project,
        [object]$Standards
    )
    
    $issues = @()
    
    # Validate file names
    $Project.structure.files | ForEach-Object {
        $ext = [System.IO.Path]::GetExtension($_)
        $name = [System.IO.Path]::GetFileNameWithoutExtension($_)
        
        # Check kebab-case for file names
        if ($Standards.naming.files.kebabCase -and -not (Test-KebabCase -String $name)) {
            $issues += @{
                type = 'naming'
                severity = 'warning'
                message = "File name should be kebab-case: $_"
                suggestion = "Rename to: $(ConvertTo-KebabCase -String $name)$ext"
            }
        }
    }
    
    # Validate directory names
    $Project.structure.directories | ForEach-Object {
        if (-not (Test-KebabCase -String $_)) {
            $issues += @{
                type = 'naming'
                severity = 'warning'
                message = "Directory name should be kebab-case: $_"
                suggestion = "Rename to: $(ConvertTo-KebabCase -String $_)"
            }
        }
    }
    
    return $issues
}

function Test-CodeStyle {
    param(
        [object]$Project,
        [object]$Standards
    )
    
    $issues = @()
    
    # Check JavaScript/TypeScript files
    $jsFiles = @()
    $jsFiles += $Project.files.byExtension['.js'] ?? @()
    $jsFiles += $Project.files.byExtension['.ts'] ?? @()
    $jsFiles += $Project.files.byExtension['.tsx'] ?? @()
    
    $jsFiles | ForEach-Object {
        $filePath = Join-Path $Project.path $_
        $content = Get-Content $filePath -Raw
        
        # Check indentation
        if ($Standards.code.formatting.indent -eq 2) {
            $lines = $content -split "`n"
            for ($i = 0; $i -lt $lines.Length; $i++) {
                $line = $lines[$i]
                if ($line -match '^[ ]{1,3}[^ ]' -and $line -notmatch '^[ ]{2}[^ ]') {
                    $issues += @{
                        type = 'code-style'
                        severity = 'warning'
                        message = "Inconsistent indentation in $_:$($i + 1)"
                        suggestion = 'Use 2 spaces for indentation'
                    }
                }
            }
        }
        
        # Check quotes
        if ($Standards.code.formatting.quotes -eq 'single') {
            $doubleQuotes = ($content.ToCharArray() | Where-Object { $_ -eq '"' }).Count
            $singleQuotes = ($content.ToCharArray() | Where-Object { $_ -eq "'" }).Count
            if ($doubleQuotes -gt $singleQuotes) {
                $issues += @{
                    type = 'code-style'
                    severity = 'warning'
                    message = "Use single quotes in $_"
                    suggestion = 'Replace double quotes with single quotes'
                }
            }
        }
    }
    
    return $issues
}

function Test-Documentation {
    param(
        [object]$Project,
        [object]$Standards
    )
    
    $issues = @()
    
    # Check required documentation files
    $Standards.documentation.structure.required | ForEach-Object {
        if ($Project.structure.files -notcontains $_) {
            $issues += @{
                type = 'documentation'
                severity = 'warning'
                message = "Missing documentation file: $_"
                suggestion = "Create $_ with proper structure"
            }
        }
    }
    
    # Check README.md content
    $readmePath = Join-Path $Project.path "README.md"
    if (Test-Path $readmePath) {
        $readmeContent = Get-Content $readmePath -Raw
        $sections = $Standards.documentation.structure.sections
        
        $sections | ForEach-Object {
            if ($readmeContent -notmatch "# $_" -and $readmeContent -notmatch "## $_") {
                $issues += @{
                    type = 'documentation'
                    severity = 'info'
                    message = "README.md missing section: $_"
                    suggestion = "Add ## $_ section to README.md"
                }
            }
        }
    }
    
    return $issues
}

function Test-Configuration {
    param(
        [object]$Project,
        [object]$Standards
    )
    
    $issues = @()
    
    # Check TypeScript configuration
    if ($Project.configuration['tsconfig.json']) {
        $tsconfig = $Project.configuration['tsconfig.json']
        if (-not $tsconfig.compilerOptions) {
            $issues += @{
                type = 'configuration'
                severity = 'error'
                message = 'tsconfig.json missing compilerOptions'
                suggestion = 'Add compilerOptions to tsconfig.json'
            }
        }
    }
    
    # Check ESLint configuration
    if ($Project.configuration['.eslintrc.json']) {
        $eslint = $Project.configuration['.eslintrc.json']
        if (-not $eslint.rules) {
            $issues += @{
                type = 'configuration'
                severity = 'warning'
                message = 'ESLint configuration missing rules'
                suggestion = 'Add rules to .eslintrc.json'
            }
        }
    }
    
    return $issues
}

function Test-KebabCase {
    param([string]$String)
    return $String -match '^[a-z0-9]+(-[a-z0-9]+)*$'
}

function ConvertTo-KebabCase {
    param([string]$String)
    return $String -replace '([a-z])([A-Z])', '$1-$2' -replace '[\s_]+', '-' -replace '^[A-Z]', { $_.Value.ToLower() }
}

function Get-FileType {
    param([string]$Extension)
    
    $types = @{
        '.js' = 'javascript'
        '.ts' = 'typescript'
        '.tsx' = 'typescript'
        '.json' = 'json'
        '.md' = 'markdown'
        '.yaml' = 'yaml'
        '.yml' = 'yaml'
        '.html' = 'html'
        '.css' = 'css'
        '.scss' = 'scss'
        '.sass' = 'sass'
        '.less' = 'less'
    }
    
    return $types[$Extension] ?? 'unknown'
}

function Get-ConsistencyScore {
    param([array]$Issues)
    
    $totalIssues = $Issues.Count
    $errorCount = ($Issues | Where-Object { $_.severity -eq 'error' }).Count
    $warningCount = ($Issues | Where-Object { $_.severity -eq 'warning' }).Count
    $infoCount = ($Issues | Where-Object { $_.severity -eq 'info' }).Count
    
    $score = [Math]::Max(0, 100 - ($errorCount * 10) - ($warningCount * 5) - ($infoCount * 2))
    return [Math]::Round($score)
}

function Get-Recommendations {
    param([array]$Issues)
    
    $recommendations = @()
    $groupedIssues = $Issues | Group-Object type
    
    $groupedIssues | ForEach-Object {
        $count = $_.Count
        $severity = $_.Group[0].severity
        
        $recommendations += @{
            type = $_.Name
            count = $count
            severity = $severity
            priority = Get-Priority -Severity $severity
            actions = Get-ActionsForType -Type $_.Name -Issues $_.Group
        }
    }
    
    return $recommendations | Sort-Object priority -Descending
}

function Get-Priority {
    param([string]$Severity)
    
    $priorities = @{ error = 3; warning = 2; info = 1 }
    return $priorities[$Severity] ?? 0
}

function Get-ActionsForType {
    param(
        [string]$Type,
        [array]$Issues
    )
    
    $actions = @{
        structure = @(
            'Create missing directories and files',
            'Reorganize directory structure',
            'Follow standard project layout'
        )
        naming = @(
            'Rename files and directories to kebab-case',
            'Use consistent naming conventions',
            'Follow language-specific naming standards'
        )
        'code-style' = @(
            'Run code formatter (Prettier)',
            'Fix indentation and quotes',
            'Follow consistent coding style'
        )
        documentation = @(
            'Create missing documentation files',
            'Add required sections to README',
            'Improve code comments and documentation'
        )
        configuration = @(
            'Add missing configuration files',
            'Configure linting and formatting',
            'Set up proper build configuration'
        )
    }
    
    return $actions[$Type] ?? @('Review and fix issues')
}

function Repair-ProjectConsistency {
    param(
        [string]$ProjectPath,
        [hashtable]$Options = @{}
    )
    
    $validation = Test-ProjectConsistency -ProjectPath $ProjectPath
    $fixes = @()
    
    if ($Options.AutoFix) {
        $fixes += Repair-AutoFix -ProjectPath $ProjectPath -Issues $validation.issues
    }
    
    if ($Options.CreateMissing) {
        $fixes += Repair-CreateMissing -ProjectPath $ProjectPath -Issues $validation.issues
    }
    
    if ($Options.FormatCode) {
        $fixes += Repair-FormatCode -ProjectPath $ProjectPath
    }
    
    return @{
        validation = $validation
        fixes = $fixes
        summary = Get-FixSummary -Fixes $fixes
    }
}

function Repair-AutoFix {
    param(
        [string]$ProjectPath,
        [array]$Issues
    )
    
    $fixes = @()
    
    $Issues | ForEach-Object {
        if ($_.type -eq 'naming' -and $_.suggestion) {
            $oldPath = Join-Path $ProjectPath ($_.message -split ': ')[1]
            $newPath = Join-Path $ProjectPath ($_.suggestion -split ': ')[1]
            
            if (Test-Path $oldPath) {
                Rename-Item $oldPath $newPath
                $fixes += @{
                    type = 'rename'
                    oldPath = $oldPath
                    newPath = $newPath
                    message = "Renamed $(Split-Path $oldPath -Leaf) to $(Split-Path $newPath -Leaf)"
                }
            }
        }
    }
    
    return $fixes
}

function Repair-CreateMissing {
    param(
        [string]$ProjectPath,
        [array]$Issues
    )
    
    $fixes = @()
    
    $Issues | ForEach-Object {
        if ($_.type -eq 'structure' -and $_.suggestion) {
            if ($_.suggestion -like "Create file:*") {
                $fileName = ($_.suggestion -split ' ')[-1]
                $fullPath = Join-Path $ProjectPath $fileName
                
                if (-not (Test-Path $fullPath)) {
                    New-DefaultFile -FilePath $fullPath -FileName $fileName
                    $fixes += @{
                        type = 'create'
                        path = $fullPath
                        message = "Created $fileName"
                    }
                }
            } elseif ($_.suggestion -like "Create directory:*") {
                $dirName = ($_.suggestion -split ' ')[-1]
                $fullPath = Join-Path $ProjectPath $dirName
                
                if (-not (Test-Path $fullPath)) {
                    New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
                    $fixes += @{
                        type = 'create'
                        path = $fullPath
                        message = "Created directory $dirName"
                    }
                }
            }
        }
    }
    
    return $fixes
}

function New-DefaultFile {
    param(
        [string]$FilePath,
        [string]$FileName
    )
    
    $content = Get-DefaultFileContent -FileName $FileName
    $dir = Split-Path $FilePath -Parent
    
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    Set-Content -Path $FilePath -Value $content
}

function Get-DefaultFileContent {
    param([string]$FileName)
    
    $templates = @{
        'README.md' = @"
# Project Name

Project description here.

## Installation

``````bash
npm install
``````

## Usage

``````bash
npm start
``````

## License

MIT
"@
        '.gitignore' = @"
# Dependencies
node_modules/
npm-debug.log*

# Build output
dist/
build/

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
"@
        '.env.example' = @"
# Environment Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://localhost:27017/app

# API Keys
API_KEY=your_api_key_here
"@
    }
    
    return $templates[$FileName] ?? "# $FileName`n`nContent here.`n"
}

function Repair-FormatCode {
    param([string]$ProjectPath)
    
    $fixes = @()
    
    try {
        # Run Prettier if available
        Push-Location $ProjectPath
        & npx prettier --write . 2>$null
        Pop-Location
        $fixes += @{
            type = 'format'
            message = 'Code formatted with Prettier'
        }
    } catch {
        # Prettier not available or failed
    }
    
    try {
        # Run ESLint fix if available
        Push-Location $ProjectPath
        & npx eslint --fix . 2>$null
        Pop-Location
        $fixes += @{
            type = 'lint-fix'
            message = 'Code linted and fixed with ESLint'
        }
    } catch {
        # ESLint not available or failed
    }
    
    return $fixes
}

function Get-FixSummary {
    param([array]$Fixes)
    
    $summary = @{
        total = $Fixes.Count
        byType = @{}
        success = $true
    }
    
    $Fixes | ForEach-Object {
        if (-not $summary.byType[$_.type]) {
            $summary.byType[$_.type] = 0
        }
        $summary.byType[$_.type]++
    }
    
    return $summary
}

function New-ConsistencyReport {
    param(
        [string]$ProjectPath,
        [hashtable]$Options = @{}
    )
    
    $validation = Test-ProjectConsistency -ProjectPath $ProjectPath
    $report = @{
        project = @{
            name = Split-Path $ProjectPath -Leaf
            path = $ProjectPath
            type = $validation.project.type
            score = $validation.score
        }
        analysis = @{
            files = $validation.project.files.total
            directories = $validation.project.structure.directories.Count
            size = Format-Bytes -Bytes $validation.project.files.totalSize
        }
        issues = $validation.issues
        recommendations = $validation.recommendations
        generated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    
    if ($Options.OutputFile) {
        Save-Report -Report $report -OutputFile $Options.OutputFile
    }
    
    return $report
}

function Save-Report {
    param(
        [object]$Report,
        [string]$OutputFile
    )
    
    $reportContent = $Report | ConvertTo-Json -Depth 10
    Set-Content -Path $OutputFile -Value $reportContent
}

function Format-Bytes {
    param([long]$Bytes)
    
    $sizes = @('Bytes', 'KB', 'MB', 'GB')
    if ($Bytes -eq 0) { return '0 Bytes' }
    $i = [Math]::Floor([Math]::Log($Bytes) / [Math]::Log(1024))
    return [Math]::Round($Bytes / [Math]::Pow(1024, $i) * 100) / 100 + ' ' + $sizes[$i]
}

# Main execution
Ensure-Directories

if ($Help -or $Command -eq "help" -or $Command -eq "--help" -or $Command -eq "-h") {
    Show-Help
} elseif ($Command -eq "validate") {
    if (-not $ProjectPath) {
        Write-Error "❌ Project path is required"
        exit 1
    }
    
    if (-not (Test-Path $ProjectPath)) {
        Write-Error "❌ Project path '$ProjectPath' does not exist"
        exit 1
    }
    
    $validation = Test-ProjectConsistency -ProjectPath $ProjectPath
    Write-Host "`n📊 Consistency Validation Report`n"
    Write-Host "Project: $(Split-Path $ProjectPath -Leaf)"
    Write-Host "Type: $($validation.project.type)"
    Write-Host "Score: $($validation.score)/100"
    Write-Host "Issues: $($validation.issues.Count)`n"
    
    if ($validation.issues.Count -gt 0) {
        Write-Host "Issues found:"
        $validation.issues | ForEach-Object {
            Write-Host "  $($_.severity.ToUpper()): $($_.message)"
            if ($_.suggestion) {
                Write-Host "    → $($_.suggestion)"
            }
        }
    } else {
        Write-Host "✅ No issues found!"
    }
} elseif ($Command -eq "fix") {
    if (-not $ProjectPath) {
        Write-Error "❌ Project path is required"
        exit 1
    }
    
    if (-not (Test-Path $ProjectPath)) {
        Write-Error "❌ Project path '$ProjectPath' does not exist"
        exit 1
    }
    
    $options = @{
        AutoFix = $AutoFix
        CreateMissing = $CreateMissing
        FormatCode = $FormatCode
    }
    
    $fixResult = Repair-ProjectConsistency -ProjectPath $ProjectPath -Options $options
    Write-Host "`n🔧 Consistency Fix Report`n"
    Write-Host "Project: $(Split-Path $ProjectPath -Leaf)"
    Write-Host "Score: $($fixResult.validation.score)/100"
    Write-Host "Fixes applied: $($fixResult.fixes.Count)`n"
    
    if ($fixResult.fixes.Count -gt 0) {
        Write-Host "Fixes applied:"
        $fixResult.fixes | ForEach-Object {
            Write-Host "  ✅ $($_.message)"
        }
    } else {
        Write-Host "No fixes applied"
    }
} elseif ($Command -eq "report") {
    if (-not $ProjectPath) {
        Write-Error "❌ Project path is required"
        exit 1
    }
    
    if (-not (Test-Path $ProjectPath)) {
        Write-Error "❌ Project path '$ProjectPath' does not exist"
        exit 1
    }
    
    $options = @{
        OutputFile = $OutputFile
    }
    
    $report = New-ConsistencyReport -ProjectPath $ProjectPath -Options $options
    Write-Host "`n📋 Consistency Report Generated`n"
    Write-Host "Project: $($report.project.name)"
    Write-Host "Score: $($report.project.score)/100"
    Write-Host "Files: $($report.analysis.files)"
    Write-Host "Size: $($report.analysis.size)`n"
    
    if ($OutputFile) {
        Write-Host "Report saved to: $OutputFile"
    }
} elseif ($Command -eq "check") {
    if (-not $ProjectPath) {
        Write-Error "❌ Project path is required"
        exit 1
    }
    
    if (-not (Test-Path $ProjectPath)) {
        Write-Error "❌ Project path '$ProjectPath' does not exist"
        exit 1
    }
    
    $checkResult = Test-ProjectConsistency -ProjectPath $ProjectPath
    $status = if ($checkResult.score -ge 80) { "✅" } elseif ($checkResult.score -ge 60) { "⚠️" } else { "❌" }
    Write-Host "$status Consistency Score: $($checkResult.score)/100 ($($checkResult.issues.Count) issues)"
} else {
    Write-Error "❌ Unknown command: $Command"
    Write-Host "Use -Help for available commands"
    exit 1
}
