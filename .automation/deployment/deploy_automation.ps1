# FreeRPACapture Deployment Automation Script
# Version: 1.0.1
# Date: 2025-01-31
# Status: Production Ready

param(
    [string]$DeploymentType = "local",
    [string]$BuildType = "Release",
    [string]$Platform = "x64",
    [string]$TargetPath = "",
    [switch]$CreateInstaller,
    [switch]$CreatePackage,
    [switch]$Docker,
    [switch]$Kubernetes,
    [switch]$Verbose
)

# Configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BuildDir = Join-Path $ProjectRoot "build"
$DemoBuildDir = Join-Path $ProjectRoot "demo_build"
$DeployDir = Join-Path $ProjectRoot "deploy"
$PackagingDir = Join-Path $ProjectRoot "packaging"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Initialize-DeploymentEnvironment {
    Write-ColorOutput "🔧 Initializing deployment environment..." "Info"
    
    # Create deployment directory
    if (-not (Test-Path $DeployDir)) {
        New-Item -ItemType Directory -Path $DeployDir | Out-Null
    }
    
    # Set target path if not specified
    if ([string]::IsNullOrEmpty($TargetPath)) {
        $script:TargetPath = Join-Path $DeployDir "FreeRPACapture-v1.0.1"
    }
    
    # Create target directory
    if (-not (Test-Path $TargetPath)) {
        New-Item -ItemType Directory -Path $TargetPath | Out-Null
    }
    
    Write-ColorOutput "✅ Deployment environment initialized" "Success"
    Write-ColorOutput "Target Path: $TargetPath" "Info"
}

function Copy-ApplicationFiles {
    Write-ColorOutput "📁 Copying application files..." "Info"
    
    try {
        # Copy main executable
        $mainExe = Join-Path $BuildDir "$BuildType\freerpacapture.exe"
        if (Test-Path $mainExe) {
            Copy-Item $mainExe $TargetPath -Force
            Write-ColorOutput "✅ Main executable copied" "Success"
        } else {
            Write-ColorOutput "⚠️ Main executable not found: $mainExe" "Warning"
        }
        
        # Copy demo executable
        $demoExe = Join-Path $DemoBuildDir "Release\freerpacapture_demo.exe"
        if (Test-Path $demoExe) {
            Copy-Item $demoExe $TargetPath -Force
            Write-ColorOutput "✅ Demo executable copied" "Success"
        } else {
            Write-ColorOutput "⚠️ Demo executable not found: $demoExe" "Warning"
        }
        
        # Copy libraries
        $libDir = Join-Path $BuildDir "$BuildType"
        if (Test-Path $libDir) {
            $dllFiles = Get-ChildItem -Path $libDir -Filter "*.dll" -Recurse
            foreach ($dll in $dllFiles) {
                Copy-Item $dll.FullName $TargetPath -Force
                Write-ColorOutput "✅ Library copied: $($dll.Name)" "Success"
            }
        }
        
        # Copy configuration files
        $configFiles = @(
            "README.md",
            "LICENSE",
            "vcpkg.json"
        )
        
        foreach ($configFile in $configFiles) {
            $sourcePath = Join-Path $ProjectRoot $configFile
            if (Test-Path $sourcePath) {
                Copy-Item $sourcePath $TargetPath -Force
                Write-ColorOutput "✅ Configuration copied: $configFile" "Success"
            }
        }
        
        # Copy documentation
        $docsDir = Join-Path $ProjectRoot "docs"
        if (Test-Path $docsDir) {
            $targetDocsDir = Join-Path $TargetPath "docs"
            if (-not (Test-Path $targetDocsDir)) {
                New-Item -ItemType Directory -Path $targetDocsDir | Out-Null
            }
            Copy-Item -Path "$docsDir\*" -Destination $targetDocsDir -Recurse -Force
            Write-ColorOutput "✅ Documentation copied" "Success"
        }
        
        # Copy examples
        $examplesDir = Join-Path $ProjectRoot "examples"
        if (Test-Path $examplesDir) {
            $targetExamplesDir = Join-Path $TargetPath "examples"
            if (-not (Test-Path $targetExamplesDir)) {
                New-Item -ItemType Directory -Path $targetExamplesDir | Out-Null
            }
            Copy-Item -Path "$examplesDir\*" -Destination $targetExamplesDir -Recurse -Force
            Write-ColorOutput "✅ Examples copied" "Success"
        }
        
        return $true
    } catch {
        Write-ColorOutput "❌ Error copying application files: $_" "Error"
        return $false
    }
}

function Create-Installer {
    Write-ColorOutput "📦 Creating installer..." "Info"
    
    try {
        # Check if NSIS is available
        $nsisPath = Get-Command "makensis" -ErrorAction SilentlyContinue
        if (-not $nsisPath) {
            Write-ColorOutput "⚠️ NSIS not found. Skipping installer creation." "Warning"
            return $true
        }
        
        # Create NSIS script
        $nsisScript = @"
!define PRODUCT_NAME "FreeRPACapture"
!define PRODUCT_VERSION "1.0.1"
!define PRODUCT_PUBLISHER "FreeRPA"
!define PRODUCT_WEB_SITE "https://github.com/FreeRPA/FreeRPACapture"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\freerpacapture.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

SetCompressor lzma

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "FreeRPACapture-v1.0.1-Setup.exe"
InstallDir "C:\Program Files\FreeRPACapture"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite ifnewer
  File /r "$TargetPath\*"
  
  CreateDirectory "$SMPROGRAMS\FreeRPACapture"
  CreateShortCut "$SMPROGRAMS\FreeRPACapture\FreeRPACapture.lnk" "$INSTDIR\freerpacapture.exe"
  CreateShortCut "$SMPROGRAMS\FreeRPACapture\FreeRPACapture Demo.lnk" "$INSTDIR\freerpacapture_demo.exe"
  CreateShortCut "$DESKTOP\FreeRPACapture.lnk" "$INSTDIR\freerpacapture.exe"
  
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\freerpacapture.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\freerpacapture.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  
  WriteUninstaller "$INSTDIR\uninst.exe"
SectionEnd

Section Uninstall
  Delete "$INSTDIR\uninst.exe"
  Delete "$INSTDIR\*"
  RMDir /r "$INSTDIR"
  
  Delete "$SMPROGRAMS\FreeRPACapture\FreeRPACapture.lnk"
  Delete "$SMPROGRAMS\FreeRPACapture\FreeRPACapture Demo.lnk"
  Delete "$DESKTOP\FreeRPACapture.lnk"
  RMDir "$SMPROGRAMS\FreeRPACapture"
  
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
SectionEnd
"@
        
        $nsisScriptPath = Join-Path $DeployDir "installer.nsi"
        $nsisScript | Out-File -FilePath $nsisScriptPath -Encoding UTF8
        
        # Compile installer
        Push-Location $DeployDir
        & makensis $nsisScriptPath
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Installer created successfully" "Success"
            return $true
        } else {
            Write-ColorOutput "❌ Installer creation failed" "Error"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Installer creation error: $_" "Error"
        return $false
    } finally {
        Pop-Location
    }
}

function Create-Package {
    Write-ColorOutput "📦 Creating package..." "Info"
    
    try {
        # Create ZIP package
        $zipPath = Join-Path $DeployDir "FreeRPACapture-v1.0.1.zip"
        if (Test-Path $zipPath) {
            Remove-Item $zipPath -Force
        }
        
        # Use PowerShell 5+ Compress-Archive
        Compress-Archive -Path "$TargetPath\*" -DestinationPath $zipPath -Force
        
        if (Test-Path $zipPath) {
            Write-ColorOutput "✅ ZIP package created: $zipPath" "Success"
        }
        
        # Create TAR.GZ package (if 7-Zip is available)
        $sevenZipPath = Get-Command "7z" -ErrorAction SilentlyContinue
        if ($sevenZipPath) {
            $tarGzPath = Join-Path $DeployDir "FreeRPACapture-v1.0.1.tar.gz"
            & 7z a -ttar $tarGzPath "$TargetPath\*"
            & 7z a -tgzip "$tarGzPath.tmp" $tarGzPath
            Move-Item "$tarGzPath.tmp" $tarGzPath -Force
            Remove-Item $tarGzPath -Force
            
            if (Test-Path "$tarGzPath") {
                Write-ColorOutput "✅ TAR.GZ package created: $tarGzPath" "Success"
            }
        }
        
        return $true
    } catch {
        Write-ColorOutput "❌ Package creation error: $_" "Error"
        return $false
    }
}

function Deploy-Docker {
    Write-ColorOutput "🐳 Creating Docker deployment..." "Info"
    
    try {
        # Check if Docker is available
        $dockerPath = Get-Command "docker" -ErrorAction SilentlyContinue
        if (-not $dockerPath) {
            Write-ColorOutput "⚠️ Docker not found. Skipping Docker deployment." "Warning"
            return $true
        }
        
        # Create Dockerfile for deployment
        $dockerfile = @"
FROM mcr.microsoft.com/windows/servercore:ltsc2022

# Install Visual C++ Redistributable
ADD https://aka.ms/vs/17/release/vc_redist.x64.exe C:/temp/vc_redist.x64.exe
RUN C:/temp/vc_redist.x64.exe /quiet /install

# Copy application
COPY . C:/freerpacapture/

# Set working directory
WORKDIR C:/freerpacapture

# Expose port for HTTP API
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD freerpacapture.exe version || exit 1

# Entry point
ENTRYPOINT ["freerpacapture.exe"]
"@
        
        $dockerfilePath = Join-Path $TargetPath "Dockerfile"
        $dockerfile | Out-File -FilePath $dockerfilePath -Encoding UTF8
        
        # Build Docker image
        $imageName = "freerpacapture:1.0.1"
        Push-Location $TargetPath
        & docker build -t $imageName .
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Docker image created: $imageName" "Success"
            return $true
        } else {
            Write-ColorOutput "❌ Docker image creation failed" "Error"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Docker deployment error: $_" "Error"
        return $false
    } finally {
        Pop-Location
    }
}

function Deploy-Kubernetes {
    Write-ColorOutput "☸️ Creating Kubernetes deployment..." "Info"
    
    try {
        # Check if kubectl is available
        $kubectlPath = Get-Command "kubectl" -ErrorAction SilentlyContinue
        if (-not $kubectlPath) {
            Write-ColorOutput "⚠️ kubectl not found. Skipping Kubernetes deployment." "Warning"
            return $true
        }
        
        # Create Kubernetes manifests
        $deploymentYaml = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: freerpacapture
  labels:
    app: freerpacapture
spec:
  replicas: 3
  selector:
    matchLabels:
      app: freerpacapture
  template:
    metadata:
      labels:
        app: freerpacapture
    spec:
      containers:
      - name: freerpacapture
        image: freerpacapture:1.0.1
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - freerpacapture.exe
            - version
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - freerpacapture.exe
            - version
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: freerpacapture-service
spec:
  selector:
    app: freerpacapture
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: LoadBalancer
"@
        
        $k8sDir = Join-Path $TargetPath "k8s"
        if (-not (Test-Path $k8sDir)) {
            New-Item -ItemType Directory -Path $k8sDir | Out-Null
        }
        
        $deploymentPath = Join-Path $k8sDir "deployment.yaml"
        $deploymentYaml | Out-File -FilePath $deploymentPath -Encoding UTF8
        
        Write-ColorOutput "✅ Kubernetes manifests created: $deploymentPath" "Success"
        return $true
    } catch {
        Write-ColorOutput "❌ Kubernetes deployment error: $_" "Error"
        return $false
    }
}

function Show-DeploymentInfo {
    Write-ColorOutput "`n🚀 FreeRPACapture Deployment Information" "Header"
    Write-ColorOutput "=======================================" "Header"
    Write-ColorOutput "Project Root: $ProjectRoot" "Info"
    Write-ColorOutput "Build Directory: $BuildDir" "Info"
    Write-ColorOutput "Deployment Type: $DeploymentType" "Info"
    Write-ColorOutput "Build Type: $BuildType" "Info"
    Write-ColorOutput "Platform: $Platform" "Info"
    Write-ColorOutput "Target Path: $TargetPath" "Info"
    Write-ColorOutput "Create Installer: $CreateInstaller" "Info"
    Write-ColorOutput "Create Package: $CreatePackage" "Info"
    Write-ColorOutput "Docker: $Docker" "Info"
    Write-ColorOutput "Kubernetes: $Kubernetes" "Info"
    Write-ColorOutput "Verbose: $Verbose" "Info"
    Write-ColorOutput "`n"
}

# Main execution
function Main {
    Write-ColorOutput "🚀 FreeRPACapture Deployment Automation v1.0.1" "Header"
    Write-ColorOutput "=============================================" "Header"
    
    Show-DeploymentInfo
    
    # Initialize deployment environment
    Initialize-DeploymentEnvironment
    
    # Copy application files
    if (-not (Copy-ApplicationFiles)) {
        Write-ColorOutput "❌ Failed to copy application files" "Error"
        exit 1
    }
    
    # Create installer if requested
    if ($CreateInstaller) {
        if (-not (Create-Installer)) {
            Write-ColorOutput "❌ Failed to create installer" "Error"
            exit 1
        }
    }
    
    # Create package if requested
    if ($CreatePackage) {
        if (-not (Create-Package)) {
            Write-ColorOutput "❌ Failed to create package" "Error"
            exit 1
        }
    }
    
    # Deploy Docker if requested
    if ($Docker) {
        if (-not (Deploy-Docker)) {
            Write-ColorOutput "❌ Failed to deploy Docker" "Error"
            exit 1
        }
    }
    
    # Deploy Kubernetes if requested
    if ($Kubernetes) {
        if (-not (Deploy-Kubernetes)) {
            Write-ColorOutput "❌ Failed to deploy Kubernetes" "Error"
            exit 1
        }
    }
    
    Write-ColorOutput "`n🎉 Deployment completed successfully!" "Success"
    Write-ColorOutput "=====================================" "Success"
    Write-ColorOutput "Deployment location: $TargetPath" "Info"
    
    # Show deployment artifacts
    $artifacts = Get-ChildItem -Path $DeployDir -File
    if ($artifacts.Count -gt 0) {
        Write-ColorOutput "`n📦 Deployment artifacts:" "Info"
        foreach ($artifact in $artifacts) {
            Write-ColorOutput "  - $($artifact.Name)" "Info"
        }
    }
}

# Execute main function
Main
