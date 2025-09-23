#Requires -Version 5.1

<#
.SYNOPSIS
    project-manager.ps1

.DESCRIPTION
    Автор: GlebBrain
    Создан: 04.09.2025
    Последнее изменение: 04.09.2025
    Copyright (c) 2025 GlebBrain. All rights reserved.
#>

# ManagerAgentAI Project Manager - PowerShell Version
# Universal project management system with templates and auto-configuration

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$ProjectName,
    
    [Parameter(Position=2)]
    [string]$TemplateId,
    
    [Parameter(Position=3)]
    [string]$ProjectPath,
    
    [switch]$NoInstall,
    [switch]$NoGit,
    [switch]$NoTools,
    [switch]$Help
)

$TemplatesPath = Join-Path $PSScriptRoot ".." "templates"
$ScriptsPath = $PSScriptRoot

function Show-Help {
    Write-Host @"
🚀 ManagerAgentAI Project Manager

Universal project management system with templates and auto-configuration.

Commands:
  create <name> <template>    Create new project from template
  configure <path>            Auto-configure existing project
  list                        List available templates
  scan <path>                 Scan project and suggest configuration
  init                        Initialize project manager
  update                      Update templates and configurations
  status                      Show system status

Templates:
  web                         Web application (React, TypeScript, Node.js)
  mobile                      Mobile app (React Native, Expo)
  ai-ml                       AI/ML project (Python, TensorFlow, PyTorch)
  api                         API service (Express, TypeScript, MongoDB)
  library                     Library package (TypeScript, Rollup, Jest)
  game                        Game development (Unity, C#)
  blockchain                  Blockchain project (Solidity, Hardhat, Web3)
  desktop                     Desktop app (Electron, TypeScript, React)

Options:
  -NoInstall                 Skip dependency installation
  -NoGit                     Skip Git repository initialization
  -NoTools                   Skip development tools setup
  -Help                      Show this help message

Examples:
  .\project-manager.ps1 create my-app web
  .\project-manager.ps1 configure ./my-project
  .\project-manager.ps1 list
  .\project-manager.ps1 scan ./my-project
"@
}

function Ensure-Directories {
    $dirs = @($TemplatesPath, $ScriptsPath)
    $dirs | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
        }
    }
}

function New-Project {
    param(
        [string]$ProjectName,
        [string]$TemplateId,
        [hashtable]$Options = @{}
    )
    
    try {
        Write-Host "`n🚀 Creating project '$ProjectName' with template '$TemplateId'...`n"
        
        # Use template generator
        $templateGeneratorScript = Join-Path $ScriptsPath "template-generator.ps1"
        if (Test-Path $templateGeneratorScript) {
            $args = @("create", $ProjectName, $TemplateId)
            if ($Options.InstallDependencies -eq $false) { $args += "-NoInstall" }
            if ($Options.InitGit -eq $false) { $args += "-NoGit" }
            
            & $templateGeneratorScript @args
        } else {
            throw "Template generator script not found"
        }
        
        Write-Host "`n✅ Project '$ProjectName' created successfully!"
        
    } catch {
        Write-Error "❌ Error creating project: $($_.Exception.Message)"
        exit 1
    }
}

function Set-ProjectConfiguration {
    param(
        [string]$ProjectPath,
        [hashtable]$Options = @{}
    )
    
    try {
        Write-Host "`n🔧 Auto-configuring project at $ProjectPath...`n"
        
        # Use auto-configurator
        $autoConfiguratorScript = Join-Path $ScriptsPath "auto-configurator.ps1"
        if (Test-Path $autoConfiguratorScript) {
            $args = @($ProjectPath)
            if ($Options.InstallDependencies -eq $false) { $args += "-NoInstall" }
            if ($Options.SetupTools -eq $false) { $args += "-NoTools" }
            
            & $autoConfiguratorScript @args
        } else {
            throw "Auto-configurator script not found"
        }
        
        Write-Host "`n✅ Project auto-configured successfully!"
        
    } catch {
        Write-Error "❌ Error auto-configuring project: $($_.Exception.Message)"
        exit 1
    }
}

function Show-Templates {
    try {
        $templateGeneratorScript = Join-Path $ScriptsPath "template-generator.ps1"
        if (Test-Path $templateGeneratorScript) {
            & $templateGeneratorScript list
        } else {
            throw "Template generator script not found"
        }
    } catch {
        Write-Error "❌ Error listing templates: $($_.Exception.Message)"
        exit 1
    }
}

function Scan-Project {
    param([string]$ProjectPath)
    
    try {
        Write-Host "`n🔍 Scanning project at $ProjectPath...`n"
        
        if (-not (Test-Path $ProjectPath)) {
            throw "Project path '$ProjectPath' does not exist"
        }

        # Use auto-configurator to detect project type
        $autoConfiguratorScript = Join-Path $ScriptsPath "auto-configurator.ps1"
        if (Test-Path $autoConfiguratorScript) {
            # Create a temporary script to get project type
            $tempScript = @"
# Temporary script to get project type
`$TemplatesPath = Join-Path `$PSScriptRoot ".." "templates"
`$ConfigsPath = Join-Path `$PSScriptRoot ".." "configs"

function Get-ProjectType {
    param([string]`$ProjectPath)
    
    `$packageJsonPath = Join-Path `$ProjectPath "package.json"
    `$requirementsPath = Join-Path `$ProjectPath "requirements.txt"
    `$unityPath = Join-Path `$ProjectPath "Assets"
    `$solidityPath = Join-Path `$ProjectPath "contracts"
    
    if (Test-Path `$packageJsonPath) {
        `$packageJson = Get-Content `$packageJsonPath | ConvertFrom-Json
        
        if (`$packageJson.dependencies -and `$packageJson.dependencies.'react-native') { return 'mobile' }
        if (`$packageJson.dependencies -and `$packageJson.dependencies.electron) { return 'desktop' }
        if (`$packageJson.dependencies -and `$packageJson.dependencies.express) { return 'api' }
        if (`$packageJson.dependencies -and `$packageJson.dependencies.react) { return 'web' }
        if (`$packageJson.main -and -not `$packageJson.dependencies) { return 'library' }
    }
    
    if (Test-Path `$requirementsPath) { return 'ai-ml' }
    if (Test-Path `$unityPath) { return 'game' }
    if (Test-Path `$solidityPath) { return 'blockchain' }
    
    return 'unknown'
}

`$projectType = Get-ProjectType -ProjectPath '$ProjectPath'
Write-Host "Project Type: `$projectType"
"@
            
            $tempScriptPath = Join-Path $env:TEMP "project-scanner.ps1"
            Set-Content $tempScriptPath $tempScript
            $projectType = & $tempScriptPath
            Remove-Item $tempScriptPath -Force
            
            Write-Host "📋 Project Analysis:"
            Write-Host "   Type: $projectType"
            
            Write-Host "`n💡 Suggestions:"
            if ($projectType -eq "unknown") {
                Write-Host "   - This project type is not recognized"
                Write-Host "   - Consider using 'configure' command to set up manually"
            } else {
                Write-Host "   - Run 'configure' command to auto-configure this project"
                Write-Host "   - Use 'create' command to start fresh with a template"
            }
        } else {
            throw "Auto-configurator script not found"
        }
        
    } catch {
        Write-Error "❌ Error scanning project: $($_.Exception.Message)"
        exit 1
    }
}

function Initialize-Manager {
    try {
        Write-Host "`n🔧 Initializing ManagerAgentAI Project Manager...`n"
        
        # Create necessary directories
        $dirs = @("templates", "configs", "scripts", "projects", "logs")
        
        $dirs | ForEach-Object {
            $dirPath = Join-Path (Get-Location) $_
            if (-not (Test-Path $dirPath)) {
                New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
                Write-Host "✅ Created directory: $_"
            } else {
                Write-Host "📁 Directory exists: $_"
            }
        }
        
        # Create configuration files
        New-ManagerConfig
        
        Write-Host "`n✅ Project Manager initialized successfully!"
        Write-Host "📁 Templates: ./templates/"
        Write-Host "📁 Configs: ./configs/"
        Write-Host "📁 Scripts: ./scripts/"
        Write-Host "📁 Projects: ./projects/"
        
    } catch {
        Write-Error "❌ Error initializing manager: $($_.Exception.Message)"
        exit 1
    }
}

function New-ManagerConfig {
    $config = @{
        manager = @{
            name = "ManagerAgentAI Project Manager"
            version = "1.0.0"
            description = "Universal project management system"
            author = "ManagerAgentAI"
            created = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
        settings = @{
            autoInstall = $true
            autoGit = $true
            autoTools = $true
            defaultTemplate = "web"
            logLevel = "info"
        }
        templates = @{
            enabled = $true
            autoUpdate = $true
            customTemplates = @()
        }
        features = @{
            templateGeneration = $true
            autoConfiguration = $true
            projectScanning = $true
            dependencyManagement = $true
            toolSetup = $true
        }
    }
    
    $configPath = Join-Path (Get-Location) "manager-config.json"
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
    Write-Host "✅ Created configuration: manager-config.json"
}

function Update-System {
    try {
        Write-Host "`n🔄 Updating ManagerAgentAI system...`n"
        
        # Update templates
        Write-Host "📦 Updating templates..."
        # This would typically pull from a repository or update service
        
        # Update configurations
        Write-Host "⚙️  Updating configurations..."
        # This would update default configurations
        
        # Update scripts
        Write-Host "🔧 Updating scripts..."
        # This would update management scripts
        
        Write-Host "`n✅ System updated successfully!"
        
    } catch {
        Write-Error "❌ Error updating system: $($_.Exception.Message)"
        exit 1
    }
}

function Show-Status {
    try {
        Write-Host "`n📊 ManagerAgentAI System Status`n"
        
        # Check templates
        $templatesPath = Join-Path $TemplatesPath "templates.json"
        if (Test-Path $templatesPath) {
            $templates = Get-Content $templatesPath | ConvertFrom-Json
            Write-Host "📋 Templates: $($templates.templates.available.Count) available"
            $templates.templates.available | ForEach-Object {
                Write-Host "   - $($_.name) ($($_.type))"
            }
        } else {
            Write-Host "❌ Templates: Not found"
        }
        
        # Check scripts
        $scripts = @("template-generator.ps1", "auto-configurator.ps1", "project-manager.ps1")
        Write-Host "`n🔧 Scripts:"
        $scripts | ForEach-Object {
            $scriptPath = Join-Path $ScriptsPath $_
            if (Test-Path $scriptPath) {
                Write-Host "   ✅ $_"
            } else {
                Write-Host "   ❌ $_"
            }
        }
        
        # Check configurations
        $configsPath = Join-Path (Get-Location) "configs"
        if (Test-Path $configsPath) {
            $configFiles = Get-ChildItem $configsPath -Filter "*.json" | Select-Object -ExpandProperty Name
            Write-Host "`n⚙️  Configurations: $($configFiles.Count) files"
            $configFiles | ForEach-Object {
                Write-Host "   - $_"
            }
        } else {
            Write-Host "`n❌ Configurations: Not found"
        }
        
        # System info
        Write-Host "`n💻 System Information:"
        Write-Host "   PowerShell: $($PSVersionTable.PSVersion)"
        Write-Host "   Platform: $($PSVersionTable.Platform)"
        Write-Host "   OS: $($PSVersionTable.OS)"
        Write-Host "   Working Directory: $(Get-Location)"
        
    } catch {
        Write-Error "❌ Error showing status: $($_.Exception.Message)"
        exit 1
    }
}

function Get-ParsedOptions {
    return @{
        InstallDependencies = -not $NoInstall
        InitGit = -not $NoGit
        SetupTools = -not $NoTools
    }
}

# Main execution
Ensure-Directories

if ($Help -or $Command -eq "help" -or $Command -eq "--help" -or $Command -eq "-h") {
    Show-Help
} elseif ($Command -eq "create") {
    if (-not $ProjectName -or -not $TemplateId) {
        Write-Error "❌ Project name and template are required for create command"
        exit 1
    }
    $options = Get-ParsedOptions
    New-Project -ProjectName $ProjectName -TemplateId $TemplateId -Options $options
} elseif ($Command -eq "configure") {
    if (-not $ProjectPath) {
        Write-Error "❌ Project path is required for configure command"
        exit 1
    }
    $options = Get-ParsedOptions
    Set-ProjectConfiguration -ProjectPath $ProjectPath -Options $options
} elseif ($Command -eq "list") {
    Show-Templates
} elseif ($Command -eq "scan") {
    if (-not $ProjectPath) {
        Write-Error "❌ Project path is required for scan command"
        exit 1
    }
    Scan-Project -ProjectPath $ProjectPath
} elseif ($Command -eq "init") {
    Initialize-Manager
} elseif ($Command -eq "update") {
    Update-System
} elseif ($Command -eq "status") {
    Show-Status
} else {
    Write-Error "❌ Unknown command: $Command"
    Write-Host "Use -Help for available commands"
    exit 1
}
