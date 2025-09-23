# ManagerAgentAI Auto-Configurator - PowerShell Version
# Automatic project configuration based on detected project type

param(
    [Parameter(Position=0, Mandatory=$true)]
    [string]$ProjectPath,
    
    [switch]$NoInstall,
    [switch]$NoTools,
    [switch]$Help
)

$TemplatesPath = Join-Path $PSScriptRoot ".." "templates"
$ConfigsPath = Join-Path $PSScriptRoot ".." "configs"

function Show-Help {
    Write-Host @"
🔧 ManagerAgentAI Auto-Configurator

Usage:
  .\auto-configurator.ps1 <project-path> [options]

Options:
  -NoInstall     Skip dependency installation
  -NoTools       Skip development tools setup
  -Help          Show this help message

Examples:
  .\auto-configurator.ps1 ./my-project
  .\auto-configurator.ps1 ./my-project -NoInstall
"@
}

function Ensure-ConfigsDirectory {
    if (-not (Test-Path $ConfigsPath)) {
        New-Item -ItemType Directory -Path $ConfigsPath -Force | Out-Null
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
        
        # Check for React Native
        if ($packageJson.dependencies -and $packageJson.dependencies.'react-native') {
            return 'mobile'
        }
        
        # Check for Electron
        if ($packageJson.dependencies -and $packageJson.dependencies.electron) {
            return 'desktop'
        }
        
        # Check for Express/API
        if ($packageJson.dependencies -and $packageJson.dependencies.express) {
            return 'api'
        }
        
        # Check for React
        if ($packageJson.dependencies -and $packageJson.dependencies.react) {
            return 'web'
        }
        
        # Check for library indicators
        if ($packageJson.main -and -not $packageJson.dependencies) {
            return 'library'
        }
    }
    
    if (Test-Path $requirementsPath) {
        return 'ai-ml'
    }
    
    if (Test-Path $unityPath) {
        return 'game'
    }
    
    if (Test-Path $solidityPath) {
        return 'blockchain'
    }
    
    return 'unknown'
}

function Get-ProjectConfig {
    param([string]$ProjectType)
    
    $configPath = Join-Path $ConfigsPath "$ProjectType-config.json"
    
    if (Test-Path $configPath) {
        return Get-Content $configPath | ConvertFrom-Json
    }
    
    # Return default configuration
    return Get-DefaultConfig -ProjectType $ProjectType
}

function Get-DefaultConfig {
    param([string]$ProjectType)
    
    $configs = @{
        'web' = @{
            name = 'Web Application Configuration'
            type = 'web'
            features = @{
                typescript = $true
                testing = $true
                linting = $true
                formatting = $true
                hotReload = $true
                pwa = $false
                ssr = $false
            }
            tools = @{
                bundler = 'webpack'
                testFramework = 'jest'
                linter = 'eslint'
                formatter = 'prettier'
                cssPreprocessor = 'css'
            }
            scripts = @{
                dev = 'webpack serve --mode development'
                build = 'webpack --mode production'
                test = 'jest'
                lint = 'eslint src --ext .ts,.tsx'
                format = 'prettier --write src/**/*.{ts,tsx,css}'
            }
            dependencies = @{
                production = @('react', 'react-dom', 'typescript')
                development = @('@testing-library/react', 'jest', 'webpack', 'eslint', 'prettier')
            }
        }
        'mobile' = @{
            name = 'Mobile Application Configuration'
            type = 'mobile'
            features = @{
                typescript = $true
                testing = $true
                linting = $true
                formatting = $true
                hotReload = $true
                navigation = $true
                stateManagement = 'redux'
            }
            tools = @{
                framework = 'react-native'
                bundler = 'metro'
                testFramework = 'jest'
                linter = 'eslint'
                formatter = 'prettier'
            }
            scripts = @{
                start = 'expo start'
                android = 'expo start --android'
                ios = 'expo start --ios'
                test = 'jest'
                lint = 'eslint src --ext .ts,.tsx'
                format = 'prettier --write src/**/*.{ts,tsx}'
            }
            dependencies = @{
                production = @('react-native', 'expo', 'typescript', '@react-navigation/native')
                development = @('@testing-library/react-native', 'jest', 'eslint', 'prettier')
            }
        }
        'api' = @{
            name = 'API Service Configuration'
            type = 'api'
            features = @{
                typescript = $true
                testing = $true
                linting = $true
                formatting = $true
                authentication = $true
                validation = $true
                documentation = $true
            }
            tools = @{
                framework = 'express'
                database = 'mongodb'
                testFramework = 'jest'
                linter = 'eslint'
                formatter = 'prettier'
                documentation = 'swagger'
            }
            scripts = @{
                dev = 'nodemon src/server.ts'
                build = 'tsc'
                start = 'node dist/server.js'
                test = 'jest'
                lint = 'eslint src --ext .ts'
                format = 'prettier --write src/**/*.ts'
            }
            dependencies = @{
                production = @('express', 'typescript', 'mongoose', 'jsonwebtoken', 'cors')
                development = @('jest', 'supertest', 'nodemon', 'eslint', 'prettier')
            }
        }
        'ai-ml' = @{
            name = 'AI/ML Project Configuration'
            type = 'ai-ml'
            features = @{
                python = $true
                jupyter = $true
                testing = $true
                linting = $true
                formatting = $true
                dataVisualization = $true
                experimentTracking = $true
            }
            tools = @{
                language = 'python'
                framework = 'tensorflow'
                notebook = 'jupyter'
                testFramework = 'pytest'
                linter = 'flake8'
                formatter = 'black'
            }
            scripts = @{
                train = 'python scripts/train.py'
                predict = 'python scripts/predict.py'
                test = 'pytest tests/'
                lint = 'flake8 src tests'
                format = 'black src tests'
                jupyter = 'jupyter notebook'
            }
            dependencies = @{
                production = @('numpy', 'pandas', 'tensorflow', 'matplotlib', 'jupyter')
                development = @('pytest', 'black', 'flake8', 'mypy')
            }
        }
        'library' = @{
            name = 'Library Package Configuration'
            type = 'library'
            features = @{
                typescript = $true
                testing = $true
                linting = $true
                formatting = $true
                bundling = $true
                documentation = $true
            }
            tools = @{
                bundler = 'rollup'
                testFramework = 'jest'
                linter = 'eslint'
                formatter = 'prettier'
                documentation = 'typedoc'
            }
            scripts = @{
                build = 'rollup -c'
                dev = 'rollup -c -w'
                test = 'jest'
                lint = 'eslint src --ext .ts'
                format = 'prettier --write src/**/*.ts'
            }
            dependencies = @{
                production = @('typescript')
                development = @('rollup', 'jest', 'eslint', 'prettier', 'typedoc')
            }
        }
        'game' = @{
            name = 'Game Development Configuration'
            type = 'game'
            features = @{
                unity = $true
                csharp = $true
                testing = $true
                versionControl = $true
                buildAutomation = $true
            }
            tools = @{
                engine = 'unity'
                language = 'csharp'
                testFramework = 'unity-test-framework'
                versionControl = 'git'
            }
            scripts = @{
                'build:windows' = 'Unity -batchmode -quit -projectPath . -buildTarget Win64'
                'build:android' = 'Unity -batchmode -quit -projectPath . -buildTarget Android'
                test = 'Unity -batchmode -quit -projectPath . -runTests'
            }
            dependencies = @{
                production = @('Unity Engine 2022.3 LTS')
                development = @('Unity Test Framework')
            }
        }
        'blockchain' = @{
            name = 'Blockchain Project Configuration'
            type = 'blockchain'
            features = @{
                solidity = $true
                testing = $true
                deployment = $true
                verification = $true
                frontend = $true
            }
            tools = @{
                framework = 'hardhat'
                language = 'solidity'
                testFramework = 'chai'
                frontend = 'react'
            }
            scripts = @{
                compile = 'hardhat compile'
                test = 'hardhat test'
                deploy = 'hardhat run scripts/deploy.ts'
                verify = 'hardhat verify'
            }
            dependencies = @{
                production = @('hardhat', '@openzeppelin/contracts', 'ethers')
                development = @('@nomicfoundation/hardhat-toolbox', 'chai')
            }
        }
        'desktop' = @{
            name = 'Desktop Application Configuration'
            type = 'desktop'
            features = @{
                electron = $true
                typescript = $true
                testing = $true
                linting = $true
                formatting = $true
                autoUpdater = $true
            }
            tools = @{
                framework = 'electron'
                bundler = 'webpack'
                testFramework = 'jest'
                linter = 'eslint'
                formatter = 'prettier'
            }
            scripts = @{
                dev = 'concurrently "npm run dev:main" "npm run dev:renderer"'
                build = 'npm run build:main && npm run build:renderer'
                test = 'jest'
                lint = 'eslint src --ext .ts,.tsx'
                format = 'prettier --write src/**/*.{ts,tsx}'
            }
            dependencies = @{
                production = @('electron', 'typescript', 'react')
                development = @('electron-builder', 'webpack', 'jest', 'eslint', 'prettier')
            }
        }
    }
    
    return $configs[$ProjectType] ?? $configs['web']
}

function Set-ProjectConfiguration {
    param(
        [string]$ProjectPath,
        [object]$Config,
        [hashtable]$Options = @{}
    )
    
    try {
        Write-Host "`n🔧 Auto-configuring project at $ProjectPath...`n"
        
        $projectType = Get-ProjectType -ProjectPath $ProjectPath
        Write-Host "📋 Detected project type: $projectType"
        
        $config = Get-ProjectConfig -ProjectType $projectType
        
        # Apply configuration
        Set-Configuration -ProjectPath $ProjectPath -Config $config -Options $Options
        
        # Install dependencies
        if ($Options.InstallDependencies -ne $false) {
            Install-Dependencies -ProjectPath $ProjectPath -Config $config
        }
        
        # Setup development tools
        if ($Options.SetupTools -ne $false) {
            Set-DevelopmentTools -ProjectPath $ProjectPath -Config $config
        }
        
        # Create configuration files
        New-ConfigFiles -ProjectPath $ProjectPath -Config $config
        
        Write-Host "`n✅ Project auto-configured successfully!"
        Write-Host "📁 Project type: $($config.name)"
        $enabledFeatures = $config.features.PSObject.Properties | Where-Object { $_.Value -eq $true } | ForEach-Object { $_.Name }
        Write-Host "🛠️  Features enabled: $($enabledFeatures -join ', ')"
        
    } catch {
        Write-Error "❌ Error auto-configuring project: $($_.Exception.Message)"
        exit 1
    }
}

function Set-Configuration {
    param(
        [string]$ProjectPath,
        [object]$Config,
        [hashtable]$Options
    )
    
    # Update package.json if it exists
    $packageJsonPath = Join-Path $ProjectPath "package.json"
    if (Test-Path $packageJsonPath) {
        Set-PackageJson -PackageJsonPath $packageJsonPath -Config $Config
    }
    
    # Create or update tsconfig.json
    if ($Config.features.typescript) {
        New-TypeScriptConfig -ProjectPath $ProjectPath -Config $Config
    }
    
    # Create or update other config files
    New-ToolConfigs -ProjectPath $ProjectPath -Config $Config
}

function Set-PackageJson {
    param(
        [string]$PackageJsonPath,
        [object]$Config
    )
    
    $packageJson = Get-Content $PackageJsonPath | ConvertFrom-Json
    
    # Update scripts
    if ($Config.scripts) {
        $Config.scripts.PSObject.Properties | ForEach-Object {
            $packageJson.scripts | Add-Member -Name $_.Name -Value $_.Value -Force
        }
    }
    
    # Update dependencies
    if ($Config.dependencies) {
        $Config.dependencies.production | ForEach-Object {
            $packageJson.dependencies | Add-Member -Name $_ -Value "latest" -Force
        }
        $Config.dependencies.development | ForEach-Object {
            $packageJson.devDependencies | Add-Member -Name $_ -Value "latest" -Force
        }
    }
    
    # Update other fields
    if ($Config.name) {
        $packageJson.name = $packageJson.name ?? ($Config.name.ToLower() -replace '\s+', '-')
    }
    
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $PackageJsonPath
}

function New-TypeScriptConfig {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    $tsconfigPath = Join-Path $ProjectPath "tsconfig.json"
    
    $tsconfig = @{
        compilerOptions = @{
            target = "ES2020"
            lib = @("DOM", "DOM.Iterable", "ES6")
            allowJs = $true
            skipLibCheck = $true
            esModuleInterop = $true
            allowSyntheticDefaultImports = $true
            strict = $true
            forceConsistentCasingInFileNames = $true
            module = "esnext"
            moduleResolution = "node"
            resolveJsonModule = $true
            isolatedModules = $true
            noEmit = $true
            jsx = "react-jsx"
        }
        include = @("src/**/*")
        exclude = @("node_modules", "dist", "build")
    }
    
    $tsconfig | ConvertTo-Json -Depth 10 | Set-Content $tsconfigPath
}

function New-ToolConfigs {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    # ESLint configuration
    if ($Config.tools.linter -eq "eslint") {
        New-ESLintConfig -ProjectPath $ProjectPath -Config $Config
    }
    
    # Prettier configuration
    if ($Config.tools.formatter -eq "prettier") {
        New-PrettierConfig -ProjectPath $ProjectPath -Config $Config
    }
    
    # Jest configuration
    if ($Config.tools.testFramework -eq "jest") {
        New-JestConfig -ProjectPath $ProjectPath -Config $Config
    }
    
    # Webpack configuration
    if ($Config.tools.bundler -eq "webpack") {
        New-WebpackConfig -ProjectPath $ProjectPath -Config $Config
    }
}

function New-ESLintConfig {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    $eslintConfig = @{
        env = @{
            browser = $true
            es2021 = $true
            node = $true
        }
        extends = @(
            "eslint:recommended",
            "@typescript-eslint/recommended"
        )
        parser = "@typescript-eslint/parser"
        parserOptions = @{
            ecmaVersion = "latest"
            sourceType = "module"
        }
        plugins = @("@typescript-eslint")
        rules = @{
            indent = @("error", 2)
            linebreak_style = @("error", "unix")
            quotes = @("error", "single")
            semi = @("error", "always")
        }
    }
    
    $eslintConfig | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $ProjectPath ".eslintrc.json")
}

function New-PrettierConfig {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    $prettierConfig = @{
        semi = $true
        trailingComma = "es5"
        singleQuote = $true
        printWidth = 80
        tabWidth = 2
        useTabs = $false
    }
    
    $prettierConfig | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $ProjectPath ".prettierrc.json")
}

function New-JestConfig {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    $jestConfig = @{
        preset = "ts-jest"
        testEnvironment = "node"
        roots = @("<rootDir>/src", "<rootDir>/tests")
        testMatch = @("**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts")
        transform = @{
            "^.+\\.ts$" = "ts-jest"
        }
        collectCoverageFrom = @(
            "src/**/*.ts",
            "!src/**/*.d.ts"
        )
    }
    
    $jestConfigContent = "module.exports = $($jestConfig | ConvertTo-Json -Depth 10);"
    Set-Content (Join-Path $ProjectPath "jest.config.js") $jestConfigContent
}

function New-WebpackConfig {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    $webpackConfig = @{
        entry = "./src/index.ts"
        module = @{
            rules = @(
                @{
                    test = "\.tsx?$"
                    use = "ts-loader"
                    exclude = "/node_modules/"
                },
                @{
                    test = "\.css$i"
                    use = @("style-loader", "css-loader")
                }
            )
        }
        resolve = @{
            extensions = @(".tsx", ".ts", ".js")
        }
        output = @{
            filename = "bundle.js"
            path = "path.resolve(__dirname, 'dist')"
        }
    }
    
    $webpackConfigContent = "module.exports = $($webpackConfig | ConvertTo-Json -Depth 10);"
    Set-Content (Join-Path $ProjectPath "webpack.config.js") $webpackConfigContent
}

function New-ConfigFiles {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    # Create .gitignore
    New-Gitignore -ProjectPath $ProjectPath -Config $Config
    
    # Create .env.example
    New-EnvExample -ProjectPath $ProjectPath -Config $Config
    
    # Create README.md if it doesn't exist
    $readmePath = Join-Path $ProjectPath "README.md"
    if (-not (Test-Path $readmePath)) {
        New-README -ProjectPath $ProjectPath -Config $Config
    }
}

function New-Gitignore {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    $gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/
*.tgz

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port
"@
    
    Set-Content (Join-Path $ProjectPath ".gitignore") $gitignoreContent
}

function New-EnvExample {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    $envExampleContent = @"
# Environment Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://localhost:27017/app

# API Keys
API_KEY=your_api_key_here

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000
"@
    
    Set-Content (Join-Path $ProjectPath ".env.example") $envExampleContent
}

function New-README {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    $enabledFeatures = $Config.features.PSObject.Properties | Where-Object { $_.Value -eq $true } | ForEach-Object { "- $($_.Name)" }
    $tools = $Config.tools.PSObject.Properties | ForEach-Object { "- **$($_.Name)**: $($_.Value)" }
    
    $readmeContent = @"
# $($Config.name)

$($Config.description ?? 'Auto-configured project')

## Features

$($enabledFeatures -join "`n")

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
``````bash
npm install
``````

### Development
``````bash
npm run dev
``````

### Building
``````bash
npm run build
``````

### Testing
``````bash
npm test
``````

## Project Structure

``````
src/
├── components/     # Reusable components
├── pages/         # Page components
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
└── assets/        # Static assets
``````

## Technologies Used

$($tools -join "`n")

## License

MIT

---

Auto-configured by ManagerAgentAI
"@
    
    Set-Content (Join-Path $ProjectPath "README.md") $readmeContent
}

function Install-Dependencies {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    Write-Host "📦 Installing dependencies..."
    try {
        Push-Location $ProjectPath
        npm install
        Pop-Location
    } catch {
        Write-Warning "⚠️  Failed to install dependencies automatically. Please run 'npm install' manually."
    }
}

function Set-DevelopmentTools {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    Write-Host "🛠️  Setting up development tools..."
    
    # Create test directory if it doesn't exist
    $testDir = Join-Path $ProjectPath "tests"
    if (-not (Test-Path $testDir)) {
        New-Item -ItemType Directory -Path $testDir -Force | Out-Null
    }
    
    # Create example test file
    if ($Config.tools.testFramework -eq "jest") {
        New-ExampleTest -ProjectPath $ProjectPath -Config $Config
    }
}

function New-ExampleTest {
    param(
        [string]$ProjectPath,
        [object]$Config
    )
    
    $testContent = @"
// Example test file
describe('Example Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
"@
    
    Set-Content (Join-Path $ProjectPath "tests" "example.test.ts") $testContent
}

# Main execution
if ($Help) {
    Show-Help
} elseif (-not $ProjectPath) {
    Write-Error "❌ Project path is required. Use -Help for usage information."
    exit 1
} elseif (-not (Test-Path $ProjectPath)) {
    Write-Error "❌ Project path '$ProjectPath' does not exist."
    exit 1
} else {
    Ensure-ConfigsDirectory
    $options = @{
        InstallDependencies = -not $NoInstall
        SetupTools = -not $NoTools
    }
    Set-ProjectConfiguration -ProjectPath $ProjectPath -Options $options
}
