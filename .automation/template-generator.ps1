# ManagerAgentAI Template Generator - PowerShell Version
# Universal project template generator for Windows

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$ProjectName,
    
    [Parameter(Position=2)]
    [string]$TemplateId,
    
    [switch]$NoInstall,
    [switch]$NoGit,
    [switch]$Help
)

$TemplatesPath = Join-Path $PSScriptRoot ".." "templates"
$TemplatesConfigPath = Join-Path $TemplatesPath "templates.json"

function Show-Help {
    Write-Host @"
🚀 ManagerAgentAI Template Generator

Usage:
  .\template-generator.ps1 list                    # List available templates
  .\template-generator.ps1 create <name> <template> [options]  # Create new project

Options:
  -NoInstall     Skip dependency installation
  -NoGit         Skip Git repository initialization
  -Help          Show this help message

Examples:
  .\template-generator.ps1 list
  .\template-generator.ps1 create my-app web
  .\template-generator.ps1 create my-mobile-app mobile -NoInstall
"@
}

function Get-TemplatesConfig {
    if (Test-Path $TemplatesConfigPath) {
        return Get-Content $TemplatesConfigPath | ConvertFrom-Json
    } else {
        Write-Error "Templates configuration not found at $TemplatesConfigPath"
        exit 1
    }
}

function Show-Templates {
    $config = Get-TemplatesConfig
    
    Write-Host "`n📋 Available Templates:`n"
    
    $config.templates.available | ForEach-Object {
        Write-Host "$($_.name)" -ForegroundColor Green
        Write-Host "   Description: $($_.description)"
        Write-Host "   Category: $($_.category)"
        Write-Host "   Tags: $($_.tags -join ', ')"
        Write-Host "   Complexity: $($_.complexity)"
        Write-Host "   Popularity: $($_.popularity)%`n"
    }
}

function Get-TemplateById {
    param([string]$TemplateId)
    
    $config = Get-TemplatesConfig
    return $config.templates.available | Where-Object { $_.id -eq $TemplateId }
}

function Get-TemplateConfig {
    param([string]$TemplateId)
    
    $template = Get-TemplateById -TemplateId $TemplateId
    if (-not $template) {
        throw "Template with id '$TemplateId' not found"
    }
    
    $templatePath = Join-Path $TemplatesPath $template.path
    if (Test-Path $templatePath) {
        return Get-Content $templatePath | ConvertFrom-Json
    } else {
        throw "Template configuration not found at $templatePath"
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
        
        $template = Get-TemplateById -TemplateId $TemplateId
        $templateConfig = Get-TemplateConfig -TemplateId $TemplateId
        
        # Create project directory
        $projectPath = Join-Path (Get-Location) $ProjectName
        if (Test-Path $projectPath) {
            throw "Directory '$ProjectName' already exists"
        }
        
        New-Item -ItemType Directory -Path $projectPath -Force | Out-Null
        
        # Create directory structure
        New-DirectoryStructure -ProjectPath $projectPath -Directories $templateConfig.structure.directories
        
        # Create files
        New-Files -ProjectPath $projectPath -TemplateConfig $templateConfig -ProjectName $ProjectName
        
        # Install dependencies
        if ($Options.InstallDependencies -ne $false) {
            Install-Dependencies -ProjectPath $projectPath -TemplateConfig $templateConfig
        }
        
        # Initialize git repository
        if ($Options.InitGit -ne $false) {
            Initialize-Git -ProjectPath $projectPath
        }
        
        Write-Host "`n✅ Project '$ProjectName' created successfully!"
        Write-Host "📁 Location: $projectPath"
        Write-Host "`n📝 Next steps:"
        Write-Host "   cd $ProjectName"
        if ($templateConfig.scripts.dev) {
            Write-Host "   npm run dev"
        }
        Write-Host "`n🎉 Happy coding!"
        
    } catch {
        Write-Error "❌ Error creating project: $($_.Exception.Message)"
        exit 1
    }
}

function New-DirectoryStructure {
    param(
        [string]$ProjectPath,
        [array]$Directories
    )
    
    $Directories | ForEach-Object {
        $dirPath = Join-Path $ProjectPath $_
        New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
    }
}

function New-Files {
    param(
        [string]$ProjectPath,
        [object]$TemplateConfig,
        [string]$ProjectName
    )
    
    $TemplateConfig.structure.files | ForEach-Object {
        $filePath = Join-Path $ProjectPath $_
        $fileDir = Split-Path $filePath -Parent
        
        # Ensure directory exists
        if ($fileDir) {
            New-Item -ItemType Directory -Path $fileDir -Force | Out-Null
        }
        
        # Create file with appropriate content
        $content = Get-FileContent -FileName $_ -TemplateConfig $TemplateConfig -ProjectName $ProjectName
        Set-Content -Path $filePath -Value $content -Encoding UTF8
    }
}

function Get-FileContent {
    param(
        [string]$FileName,
        [object]$TemplateConfig,
        [string]$ProjectName
    )
    
    $ext = [System.IO.Path]::GetExtension($FileName)
    
    switch ($ext) {
        ".json" {
            if ($FileName -eq "package.json") {
                $dependencies = @{}
                $devDependencies = @{}
                
                $TemplateConfig.dependencies.production | ForEach-Object { $dependencies[$_] = "latest" }
                $TemplateConfig.dependencies.development | ForEach-Object { $devDependencies[$_] = "latest" }
                
                $packageJson = @{
                    name = $ProjectName.ToLower() -replace '\s+', '-'
                    version = "1.0.0"
                    description = "$ProjectName - Generated from $($TemplateConfig.template.name)"
                    main = ($TemplateConfig.structure.files | Where-Object { $_ -like "*index*" } | Select-Object -First 1) ?? "index.js"
                    scripts = $TemplateConfig.scripts
                    dependencies = $dependencies
                    devDependencies = $devDependencies
                    keywords = $TemplateConfig.template.tags
                    author = "Generated by ManagerAgentAI"
                    license = "MIT"
                }
                
                return ($packageJson | ConvertTo-Json -Depth 10)
            }
            return "{}"
        }
        ".ts" {
            return Get-TypeScriptContent -FileName $FileName -TemplateConfig $TemplateConfig -ProjectName $ProjectName
        }
        ".tsx" {
            return Get-TypeScriptContent -FileName $FileName -TemplateConfig $TemplateConfig -ProjectName $ProjectName
        }
        ".js" {
            return Get-JavaScriptContent -FileName $FileName -TemplateConfig $TemplateConfig -ProjectName $ProjectName
        }
        ".css" {
            return Get-CssContent -FileName $FileName -TemplateConfig $TemplateConfig -ProjectName $ProjectName
        }
        ".html" {
            return Get-HtmlContent -FileName $FileName -TemplateConfig $TemplateConfig -ProjectName $ProjectName
        }
        ".md" {
            return Get-MarkdownContent -FileName $FileName -TemplateConfig $TemplateConfig -ProjectName $ProjectName
        }
        ".py" {
            return Get-PythonContent -FileName $FileName -TemplateConfig $TemplateConfig -ProjectName $ProjectName
        }
        ".sol" {
            return Get-SolidityContent -FileName $FileName -TemplateConfig $TemplateConfig -ProjectName $ProjectName
        }
        ".cs" {
            return Get-CSharpContent -FileName $FileName -TemplateConfig $TemplateConfig -ProjectName $ProjectName
        }
        default {
            return Get-DefaultContent -FileName $FileName -TemplateConfig $TemplateConfig -ProjectName $ProjectName
        }
    }
}

function Get-TypeScriptContent {
    param([string]$FileName, [object]$TemplateConfig, [string]$ProjectName)
    
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    
    if ($FileName -like "*index*") {
        return "// $ProjectName - Main entry point`nexport * from './$baseName';`n"
    }
    
    if ($FileName -like "*App*") {
        return @"
import React from 'react';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to $ProjectName</h1>
        <p>Generated from $($TemplateConfig.template.name)</p>
      </header>
    </div>
  );
};

export default App;
"@
    }
    
    return "// $FileName - Generated file`nexport const $baseName = () => {`n  // Implementation here`n};`n"
}

function Get-JavaScriptContent {
    param([string]$FileName, [object]$TemplateConfig, [string]$ProjectName)
    
    return @"
// $FileName - Generated file
// $ProjectName - Generated from $($TemplateConfig.template.name)

module.exports = {
  // Implementation here
};
"@
}

function Get-CssContent {
    param([string]$FileName, [object]$TemplateConfig, [string]$ProjectName)
    
    if ($FileName -like "*global*") {
        return @"
/* Global styles for $ProjectName */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
}

.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
}
"@
    }
    return "/* $FileName - Generated styles */"
}

function Get-HtmlContent {
    param([string]$FileName, [object]$TemplateConfig, [string]$ProjectName)
    
    return @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$ProjectName</title>
</head>
<body>
  <div id="root"></div>
  <script src="./index.js"></script>
</body>
</html>
"@
}

function Get-MarkdownContent {
    param([string]$FileName, [object]$TemplateConfig, [string]$ProjectName)
    
    if ($FileName -eq "README.md") {
        $directories = $TemplateConfig.structure.directories | ForEach-Object { "- ``$_``" }
        $tags = $TemplateConfig.template.tags | ForEach-Object { "- $_" }
        
        return @"
# $ProjectName

$($TemplateConfig.template.description)

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
$($directories -join "`n")

## Technologies Used
$($tags -join "`n")

## License
MIT

---
Generated by ManagerAgentAI Template System
"@
    }
    return "# $FileName`n`nGenerated content for $ProjectName"
}

function Get-PythonContent {
    param([string]$FileName, [object]$TemplateConfig, [string]$ProjectName)
    
    return @"
# $FileName - Generated Python file
# $ProjectName - Generated from $($TemplateConfig.template.name)

def main():
    """Main function for $ProjectName"""
    print("Hello from $ProjectName!")

if __name__ == "__main__":
    main()
"@
}

function Get-SolidityContent {
    param([string]$FileName, [object]$TemplateConfig, [string]$ProjectName)
    
    $contractName = $ProjectName -replace '\s+', ''
    
    return @"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// $FileName - Generated Solidity file
// $ProjectName - Generated from $($TemplateConfig.template.name)

contract $contractName {
    // Contract implementation here
}
"@
}

function Get-CSharpContent {
    param([string]$FileName, [object]$TemplateConfig, [string]$ProjectName)
    
    $className = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    
    return @"
// $FileName - Generated C# file
// $ProjectName - Generated from $($TemplateConfig.template.name)

using UnityEngine;

public class $className : MonoBehaviour
{
    // Implementation here
}
"@
}

function Get-DefaultContent {
    param([string]$FileName, [object]$TemplateConfig, [string]$ProjectName)
    
    return @"
# $FileName
# Generated file for $ProjectName
# Template: $($TemplateConfig.template.name)

# Implementation here
"@
}

function Install-Dependencies {
    param(
        [string]$ProjectPath,
        [object]$TemplateConfig
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

function Initialize-Git {
    param([string]$ProjectPath)
    
    Write-Host "🔧 Initializing Git repository..."
    try {
        Push-Location $ProjectPath
        git init
        git add .
        git commit -m "Initial commit"
        Pop-Location
    } catch {
        Write-Warning "⚠️  Failed to initialize Git repository. Please run 'git init' manually."
    }
}

# Main execution
if ($Help -or $Command -eq "help" -or $Command -eq "--help" -or $Command -eq "-h") {
    Show-Help
} elseif ($Command -eq "list") {
    Show-Templates
} elseif ($Command -eq "create" -and $ProjectName -and $TemplateId) {
    $options = @{
        InstallDependencies = -not $NoInstall
        InitGit = -not $NoGit
    }
    New-Project -ProjectName $ProjectName -TemplateId $TemplateId -Options $options
} else {
    Write-Error "❌ Invalid command. Use -Help for usage information."
    exit 1
}
