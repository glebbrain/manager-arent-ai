# CI/CD Enhancement Script for ManagerAgentAI v2.5
# Automated packaging and distribution

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "github-actions", "azure-devops", "jenkins", "gitlab-ci", "circleci", "travis-ci")]
    [string]$Platform = "all",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "build", "test", "deploy", "release", "monitor")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigPath = "ci-cd",
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "2.5.0",
    
    [Parameter(Mandatory=$false)]
    [string]$Branch = "main"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Script configuration
$ScriptName = "CI-CD-Enhancement"
$Version = "2.5.0"
$LogFile = "cicd-enhancement.log"

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

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    if ($Verbose -or $Level -eq "ERROR") {
        Write-ColorOutput $logEntry -Color $Level.ToLower()
    }
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

function Show-Header {
    Write-ColorOutput "🚀 ManagerAgentAI CI/CD Enhancement v2.5" -Color Header
    Write-ColorOutput "=====================================" -Color Header
    Write-ColorOutput "Automated packaging and distribution" -Color Info
    Write-ColorOutput ""
}

function Create-GitHubActionsWorkflows {
    Write-ColorOutput "Creating GitHub Actions workflows..." -Color Info
    Write-Log "Creating GitHub Actions workflows" "INFO"
    
    $workflowResults = @()
    
    try {
        # Create .github/workflows directory
        $workflowsDir = Join-Path $ConfigPath ".github/workflows"
        if (-not (Test-Path $workflowsDir)) {
            New-Item -ItemType Directory -Path $workflowsDir -Force
            Write-ColorOutput "✅ GitHub Actions directory created: $workflowsDir" -Color Success
            Write-Log "GitHub Actions directory created: $workflowsDir" "INFO"
        }
        
        # Main CI/CD workflow
        $mainWorkflow = @"
name: ManagerAgentAI CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  release:
    types: [ published ]

env:
  NODE_VERSION: '18'
  POWERSHELL_VERSION: '7.3'
  PYTHON_VERSION: '3.9'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: `${{ env.NODE_VERSION }}
        cache: 'npm'
        
    - name: Setup PowerShell
      uses: actions/setup-powershell@v1
      with:
        version: `${{ env.POWERSHELL_VERSION }}
        
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: `${{ env.PYTHON_VERSION }}
        
    - name: Install dependencies
      run: |
        npm install
        pip install -r requirements.txt
        
    - name: Run tests
      run: |
        npm test
        pwsh -File scripts/cross-platform-testing.ps1 -Platform all
        
    - name: Run linting
      run: |
        npm run lint
        pwsh -File scripts/lint-check.ps1
        
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results-`${{ matrix.os }}
        path: test-results/

  build:
    needs: test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        platform: [windows, linux, macos]
        
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: `${{ env.NODE_VERSION }}
        cache: 'npm'
        
    - name: Setup PowerShell
      uses: actions/setup-powershell@v1
      with:
        version: `${{ env.POWERSHELL_VERSION }}
        
    - name: Install dependencies
      run: |
        npm install
        pip install -r requirements.txt
        
    - name: Build application
      run: |
        npm run build
        pwsh -File scripts/build-platform.ps1 -Platform `${{ matrix.platform }}
        
    - name: Create package
      run: |
        pwsh -File scripts/package-managers.ps1 -PackageManager all -Action install
        
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-`${{ matrix.platform }}
        path: dist/

  docker:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
      
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: `${{ secrets.DOCKER_USERNAME }}
        password: `${{ secrets.DOCKER_PASSWORD }}
        
    - name: Build and push Docker images
      run: |
        pwsh -File scripts/docker-containerization.ps1 -Action all
        
    - name: Deploy to Kubernetes
      run: |
        pwsh -File scripts/kubernetes-orchestration.ps1 -Action deploy

  release:
    needs: [test, build, docker]
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        path: artifacts/
        
    - name: Create release packages
      run: |
        pwsh -File scripts/create-release-packages.ps1 -Version `${{ github.event.release.tag_name }}
        
    - name: Upload release assets
      uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: `${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: `${{ github.event.release.upload_url }}
        asset_path: ./release-packages/
        asset_name: manageragent-`${{ github.event.release.tag_name }}.zip
        asset_content_type: application/zip

  monitor:
    runs-on: ubuntu-latest
    if: always()
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup monitoring
      run: |
        pwsh -File scripts/monitoring-setup.ps1 -Action deploy
        
    - name: Send notifications
      run: |
        pwsh -File scripts/notification-manager.ps1 -Action send -Type deployment
"@
        
        $mainWorkflowFile = Join-Path $workflowsDir "main.yml"
        $mainWorkflow | Out-File -FilePath $mainWorkflowFile -Encoding UTF8
        $workflowResults += @{ Platform = "GitHub Actions"; File = $mainWorkflowFile; Status = "Created" }
        Write-ColorOutput "✅ Main workflow created: $mainWorkflowFile" -Color Success
        Write-Log "Main workflow created: $mainWorkflowFile" "INFO"
        
        # Security scanning workflow
        $securityWorkflow = @"
name: Security Scanning

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday at 2 AM

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
        
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
        
    - name: Run CodeQL Analysis
      uses: github/codeql-action/analyze@v2
      with:
        languages: javascript, powershell, python
"@
        
        $securityWorkflowFile = Join-Path $workflowsDir "security.yml"
        $securityWorkflow | Out-File -FilePath $securityWorkflowFile -Encoding UTF8
        $workflowResults += @{ Platform = "GitHub Actions"; File = $securityWorkflowFile; Status = "Created" }
        Write-ColorOutput "✅ Security workflow created: $securityWorkflowFile" -Color Success
        Write-Log "Security workflow created: $securityWorkflowFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create GitHub Actions workflows" -Color Error
        Write-Log "Failed to create GitHub Actions workflows: $($_.Exception.Message)" "ERROR"
    }
    
    return $workflowResults
}

function Create-AzureDevOpsPipelines {
    Write-ColorOutput "Creating Azure DevOps pipelines..." -Color Info
    Write-Log "Creating Azure DevOps pipelines" "INFO"
    
    $pipelineResults = @()
    
    try {
        # Create azure-pipelines directory
        $pipelinesDir = Join-Path $ConfigPath "azure-pipelines"
        if (-not (Test-Path $pipelinesDir)) {
            New-Item -ItemType Directory -Path $pipelinesDir -Force
            Write-ColorOutput "✅ Azure DevOps directory created: $pipelinesDir" -Color Success
            Write-Log "Azure DevOps directory created: $pipelinesDir" "INFO"
        }
        
        # Main pipeline
        $mainPipeline = @"
trigger:
- main
- develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'
  powershellVersion: '7.3'
  pythonVersion: '3.9'

stages:
- stage: Test
  displayName: 'Test Stage'
  jobs:
  - job: Test
    displayName: 'Run Tests'
    strategy:
      matrix:
        OS: [ubuntu-latest, windows-latest, macos-latest]
    pool:
      vmImage: `$(OS)
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: `$(nodeVersion)
      displayName: 'Install Node.js'
      
    - task: PowerShell@2
      inputs:
        targetType: 'inline'
        script: |
          Install-Module -Name Pester -Force -Scope CurrentUser
          pwsh -File scripts/cross-platform-testing.ps1 -Platform all
      displayName: 'Run PowerShell Tests'
      
    - task: PythonScript@0
      inputs:
        scriptSource: 'inline'
        script: |
          import subprocess
          subprocess.run(['pip', 'install', '-r', 'requirements.txt'])
          subprocess.run(['python', '-m', 'pytest', 'tests/'])
      displayName: 'Run Python Tests'
      
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: '**/test-results.xml'
        failTaskOnFailedTests: true
      displayName: 'Publish Test Results'

- stage: Build
  displayName: 'Build Stage'
  dependsOn: Test
  jobs:
  - job: Build
    displayName: 'Build Application'
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: `$(nodeVersion)
      displayName: 'Install Node.js'
      
    - task: PowerShell@2
      inputs:
        targetType: 'inline'
        script: |
          pwsh -File scripts/build-platform.ps1 -Platform all
      displayName: 'Build Application'
      
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: 'dist'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/manageragent-$(Build.BuildNumber).zip'
      displayName: 'Archive Build Artifacts'
      
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: '$(Build.ArtifactStagingDirectory)'
        artifactName: 'drop'
      displayName: 'Publish Build Artifacts'

- stage: Deploy
  displayName: 'Deploy Stage'
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: Deploy
    displayName: 'Deploy to Production'
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: DownloadBuildArtifacts@0
            inputs:
              buildType: 'current'
              downloadPath: '$(System.ArtifactsDirectory)'
            displayName: 'Download Build Artifacts'
            
          - task: PowerShell@2
            inputs:
              targetType: 'inline'
              script: |
                pwsh -File scripts/docker-containerization.ps1 -Action deploy
                pwsh -File scripts/kubernetes-orchestration.ps1 -Action deploy
            displayName: 'Deploy to Production'
"@
        
        $mainPipelineFile = Join-Path $pipelinesDir "azure-pipelines.yml"
        $mainPipeline | Out-File -FilePath $mainPipelineFile -Encoding UTF8
        $pipelineResults += @{ Platform = "Azure DevOps"; File = $mainPipelineFile; Status = "Created" }
        Write-ColorOutput "✅ Main pipeline created: $mainPipelineFile" -Color Success
        Write-Log "Main pipeline created: $mainPipelineFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create Azure DevOps pipelines" -Color Error
        Write-Log "Failed to create Azure DevOps pipelines: $($_.Exception.Message)" "ERROR"
    }
    
    return $pipelineResults
}

function Create-JenkinsPipeline {
    Write-ColorOutput "Creating Jenkins pipeline..." -Color Info
    Write-Log "Creating Jenkins pipeline" "INFO"
    
    $pipelineResults = @()
    
    try {
        # Create jenkins directory
        $jenkinsDir = Join-Path $ConfigPath "jenkins"
        if (-not (Test-Path $jenkinsDir)) {
            New-Item -ItemType Directory -Path $jenkinsDir -Force
            Write-ColorOutput "✅ Jenkins directory created: $jenkinsDir" -Color Success
            Write-Log "Jenkins directory created: $jenkinsDir" "INFO"
        }
        
        # Jenkinsfile
        $jenkinsfile = @"
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        POWERSHELL_VERSION = '7.3'
        PYTHON_VERSION = '3.9'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup') {
            parallel {
                stage('Setup Node.js') {
                    steps {
                        sh 'curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -'
                        sh 'sudo apt-get install -y nodejs'
                    }
                }
                stage('Setup PowerShell') {
                    steps {
                        sh 'wget -q https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb'
                        sh 'sudo dpkg -i packages-microsoft-prod.deb'
                        sh 'sudo apt-get update'
                        sh 'sudo apt-get install -y powershell'
                    }
                }
                stage('Setup Python') {
                    steps {
                        sh 'sudo apt-get install -y python${PYTHON_VERSION} python${PYTHON_VERSION}-pip'
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
                sh 'pip${PYTHON_VERSION} install -r requirements.txt'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm test'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'pwsh -File scripts/cross-platform-testing.ps1 -Platform all'
                    }
                }
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                        sh 'pwsh -File scripts/lint-check.ps1'
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
                sh 'pwsh -File scripts/build-platform.ps1 -Platform all'
            }
        }
        
        stage('Package') {
            steps {
                sh 'pwsh -File scripts/package-managers.ps1 -PackageManager all -Action install'
            }
        }
        
        stage('Docker') {
            steps {
                sh 'pwsh -File scripts/docker-containerization.ps1 -Action all'
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'pwsh -File scripts/kubernetes-orchestration.ps1 -Action deploy'
            }
        }
    }
    
    post {
        always {
            publishTestResults testResultsPattern: '**/test-results.xml'
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'coverage',
                reportFiles: 'index.html',
                reportName: 'Coverage Report'
            ])
        }
        success {
            emailext (
                subject: "Build Successful: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build ${env.BUILD_NUMBER} of ${env.JOB_NAME} was successful!",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
        failure {
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build ${env.BUILD_NUMBER} of ${env.JOB_NAME} failed!",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
"@
        
        $jenkinsfilePath = Join-Path $jenkinsDir "Jenkinsfile"
        $jenkinsfile | Out-File -FilePath $jenkinsfilePath -Encoding UTF8
        $pipelineResults += @{ Platform = "Jenkins"; File = $jenkinsfilePath; Status = "Created" }
        Write-ColorOutput "✅ Jenkinsfile created: $jenkinsfilePath" -Color Success
        Write-Log "Jenkinsfile created: $jenkinsfilePath" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create Jenkins pipeline" -Color Error
        Write-Log "Failed to create Jenkins pipeline: $($_.Exception.Message)" "ERROR"
    }
    
    return $pipelineResults
}

function Create-GitLabCIConfig {
    Write-ColorOutput "Creating GitLab CI configuration..." -Color Info
    Write-Log "Creating GitLab CI configuration" "INFO"
    
    $configResults = @()
    
    try {
        # Create gitlab-ci directory
        $gitlabDir = Join-Path $ConfigPath "gitlab-ci"
        if (-not (Test-Path $gitlabDir)) {
            New-Item -ItemType Directory -Path $gitlabDir -Force
            Write-ColorOutput "✅ GitLab CI directory created: $gitlabDir" -Color Success
            Write-Log "GitLab CI directory created: $gitlabDir" "INFO"
        }
        
        # GitLab CI configuration
        $gitlabConfig = @"
image: node:18

variables:
  NODE_VERSION: "18"
  POWERSHELL_VERSION: "7.3"
  PYTHON_VERSION: "3.9"

stages:
  - setup
  - test
  - build
  - package
  - deploy

before_script:
  - apt-get update -qq && apt-get install -y -qq git curl wget
  - curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  - apt-get install -y nodejs
  - wget -q https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
  - dpkg -i packages-microsoft-prod.deb
  - apt-get update
  - apt-get install -y powershell
  - apt-get install -y python${PYTHON_VERSION} python${PYTHON_VERSION}-pip
  - npm install
  - pip${PYTHON_VERSION} install -r requirements.txt

test:
  stage: test
  script:
    - npm test
    - pwsh -File scripts/cross-platform-testing.ps1 -Platform all
    - npm run lint
    - pwsh -File scripts/lint-check.ps1
  artifacts:
    reports:
      junit: test-results.xml
    paths:
      - coverage/
    expire_in: 1 week

build:
  stage: build
  script:
    - npm run build
    - pwsh -File scripts/build-platform.ps1 -Platform all
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

package:
  stage: package
  script:
    - pwsh -File scripts/package-managers.ps1 -PackageManager all -Action install
    - pwsh -File scripts/docker-containerization.ps1 -Action build
  artifacts:
    paths:
      - packages/
    expire_in: 1 week

deploy:
  stage: deploy
  script:
    - pwsh -File scripts/kubernetes-orchestration.ps1 -Action deploy
  only:
    - main
  when: manual
"@
        
        $gitlabConfigFile = Join-Path $gitlabDir ".gitlab-ci.yml"
        $gitlabConfig | Out-File -FilePath $gitlabConfigFile -Encoding UTF8
        $configResults += @{ Platform = "GitLab CI"; File = $gitlabConfigFile; Status = "Created" }
        Write-ColorOutput "✅ GitLab CI config created: $gitlabConfigFile" -Color Success
        Write-Log "GitLab CI config created: $gitlabConfigFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create GitLab CI configuration" -Color Error
        Write-Log "Failed to create GitLab CI configuration: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Create-CircleCIConfig {
    Write-ColorOutput "Creating CircleCI configuration..." -Color Info
    Write-Log "Creating CircleCI configuration" "INFO"
    
    $configResults = @()
    
    try {
        # Create circleci directory
        $circleciDir = Join-Path $ConfigPath "circleci"
        if (-not (Test-Path $circleciDir)) {
            New-Item -ItemType Directory -Path $circleciDir -Force
            Write-ColorOutput "✅ CircleCI directory created: $circleciDir" -Color Success
            Write-Log "CircleCI directory created: $circleciDir" "INFO"
        }
        
        # CircleCI configuration
        $circleciConfig = @"
version: 2.1

orbs:
  node: circleci/node@5.0.0
  powershell: circleci/powershell@1.0.0

jobs:
  test:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Install PowerShell
          command: |
            wget -q https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
            sudo dpkg -i packages-microsoft-prod.deb
            sudo apt-get update
            sudo apt-get install -y powershell
      - run:
          name: Install Python
          command: |
            sudo apt-get install -y python3.9 python3.9-pip
      - run:
          name: Install Dependencies
          command: |
            npm install
            pip3 install -r requirements.txt
      - run:
          name: Run Tests
          command: |
            npm test
            pwsh -File scripts/cross-platform-testing.ps1 -Platform all
      - run:
          name: Run Lint
          command: |
            npm run lint
            pwsh -File scripts/lint-check.ps1
      - store_test_results:
          path: test-results
      - store_artifacts:
          path: coverage

  build:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Install PowerShell
          command: |
            wget -q https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
            sudo dpkg -i packages-microsoft-prod.deb
            sudo apt-get update
            sudo apt-get install -y powershell
      - run:
          name: Build Application
          command: |
            npm run build
            pwsh -File scripts/build-platform.ps1 -Platform all
      - store_artifacts:
          path: dist

  package:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Install PowerShell
          command: |
            wget -q https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
            sudo dpkg -i packages-microsoft-prod.deb
            sudo apt-get update
            sudo apt-get install -y powershell
      - run:
          name: Create Packages
          command: |
            pwsh -File scripts/package-managers.ps1 -PackageManager all -Action install
            pwsh -File scripts/docker-containerization.ps1 -Action build
      - store_artifacts:
          path: packages

  deploy:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run:
          name: Install PowerShell
          command: |
            wget -q https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
            sudo dpkg -i packages-microsoft-prod.deb
            sudo apt-get update
            sudo apt-get install -y powershell
      - run:
          name: Deploy Application
          command: |
            pwsh -File scripts/kubernetes-orchestration.ps1 -Action deploy

workflows:
  version: 2
  test-build-package-deploy:
    jobs:
      - test
      - build:
          requires:
            - test
      - package:
          requires:
            - build
      - deploy:
          requires:
            - package
          filters:
            branches:
              only: main
"@
        
        $circleciConfigFile = Join-Path $circleciDir "config.yml"
        $circleciConfig | Out-File -FilePath $circleciConfigFile -Encoding UTF8
        $configResults += @{ Platform = "CircleCI"; File = $circleciConfigFile; Status = "Created" }
        Write-ColorOutput "✅ CircleCI config created: $circleciConfigFile" -Color Success
        Write-Log "CircleCI config created: $circleciConfigFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create CircleCI configuration" -Color Error
        Write-Log "Failed to create CircleCI configuration: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Create-TravisCIConfig {
    Write-ColorOutput "Creating Travis CI configuration..." -Color Info
    Write-Log "Creating Travis CI configuration" "INFO"
    
    $configResults = @()
    
    try {
        # Create travis-ci directory
        $travisDir = Join-Path $ConfigPath "travis-ci"
        if (-not (Test-Path $travisDir)) {
            New-Item -ItemType Directory -Path $travisDir -Force
            Write-ColorOutput "✅ Travis CI directory created: $travisDir" -Color Success
            Write-Log "Travis CI directory created: $travisDir" "INFO"
        }
        
        # Travis CI configuration
        $travisConfig = @"
language: node_js
node_js:
  - 18

os:
  - linux
  - osx
  - windows

matrix:
  include:
    - os: linux
      dist: focal
    - os: osx
      osx_image: xcode12
    - os: windows
      language: shell

before_install:
  - if [ "$TRAVIS_OS_NAME" = "linux" ]; then
      wget -q https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb;
      sudo dpkg -i packages-microsoft-prod.deb;
      sudo apt-get update;
      sudo apt-get install -y powershell;
      sudo apt-get install -y python3.9 python3.9-pip;
    fi
  - if [ "$TRAVIS_OS_NAME" = "osx" ]; then
      brew install powershell;
      brew install python@3.9;
    fi
  - if [ "$TRAVIS_OS_NAME" = "windows" ]; then
      choco install powershell-core -y;
      choco install python -y;
    fi

install:
  - npm install
  - if [ "$TRAVIS_OS_NAME" = "linux" ]; then pip3 install -r requirements.txt; fi
  - if [ "$TRAVIS_OS_NAME" = "osx" ]; then pip3 install -r requirements.txt; fi
  - if [ "$TRAVIS_OS_NAME" = "windows" ]; then pip install -r requirements.txt; fi

script:
  - npm test
  - pwsh -File scripts/cross-platform-testing.ps1 -Platform all
  - npm run lint
  - pwsh -File scripts/lint-check.ps1

after_success:
  - npm run build
  - pwsh -File scripts/build-platform.ps1 -Platform all

deploy:
  provider: script
  script: pwsh -File scripts/kubernetes-orchestration.ps1 -Action deploy
  on:
    branch: main
    condition: "$TRAVIS_OS_NAME = linux"
"@
        
        $travisConfigFile = Join-Path $travisDir ".travis.yml"
        $travisConfig | Out-File -FilePath $travisConfigFile -Encoding UTF8
        $configResults += @{ Platform = "Travis CI"; File = $travisConfigFile; Status = "Created" }
        Write-ColorOutput "✅ Travis CI config created: $travisConfigFile" -Color Success
        Write-Log "Travis CI config created: $travisConfigFile" "INFO"
        
    } catch {
        Write-ColorOutput "❌ Failed to create Travis CI configuration" -Color Error
        Write-Log "Failed to create Travis CI configuration: $($_.Exception.Message)" "ERROR"
    }
    
    return $configResults
}

function Show-Usage {
    Write-ColorOutput "Usage: .\cicd-enhancement.ps1 -Platform <platform> [options]" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Platforms:" -Color Info
    Write-ColorOutput "  all           - All CI/CD platforms" -Color Info
    Write-ColorOutput "  github-actions - GitHub Actions" -Color Info
    Write-ColorOutput "  azure-devops  - Azure DevOps" -Color Info
    Write-ColorOutput "  jenkins       - Jenkins" -Color Info
    Write-ColorOutput "  gitlab-ci     - GitLab CI" -Color Info
    Write-ColorOutput "  circleci      - CircleCI" -Color Info
    Write-ColorOutput "  travis-ci     - Travis CI" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Actions:" -Color Info
    Write-ColorOutput "  all      - All actions" -Color Info
    Write-ColorOutput "  build    - Build configurations" -Color Info
    Write-ColorOutput "  test     - Test configurations" -Color Info
    Write-ColorOutput "  deploy   - Deploy configurations" -Color Info
    Write-ColorOutput "  release  - Release configurations" -Color Info
    Write-ColorOutput "  monitor  - Monitor configurations" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Options:" -Color Info
    Write-ColorOutput "  -Verbose     - Show detailed output" -Color Info
    Write-ColorOutput "  -ConfigPath  - Path for configuration files" -Color Info
    Write-ColorOutput "  -Version     - Version number" -Color Info
    Write-ColorOutput "  -Branch      - Git branch" -Color Info
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" -Color Info
    Write-ColorOutput "  .\cicd-enhancement.ps1 -Platform all" -Color Info
    Write-ColorOutput "  .\cicd-enhancement.ps1 -Platform github-actions -Action build" -Color Info
    Write-ColorOutput "  .\cicd-enhancement.ps1 -Platform azure-devops -Action deploy" -Color Info
    Write-ColorOutput "  .\cicd-enhancement.ps1 -Platform jenkins -Action test" -Color Info
}

# Main execution
function Main {
    Show-Header
    
    # Create configuration directory
    if (-not (Test-Path $ConfigPath)) {
        New-Item -ItemType Directory -Path $ConfigPath -Force
        Write-ColorOutput "✅ Configuration directory created: $ConfigPath" -Color Success
        Write-Log "Configuration directory created: $ConfigPath" "INFO"
    }
    
    $allResults = @()
    
    # Execute action based on platform parameter
    switch ($Platform) {
        "all" {
            Write-ColorOutput "Creating CI/CD configurations for all platforms..." -Color Info
            Write-Log "Creating CI/CD configurations for all platforms" "INFO"
            
            $githubResults = Create-GitHubActionsWorkflows
            $azureResults = Create-AzureDevOpsPipelines
            $jenkinsResults = Create-JenkinsPipeline
            $gitlabResults = Create-GitLabCIConfig
            $circleciResults = Create-CircleCIConfig
            $travisResults = Create-TravisCIConfig
            
            $allResults += $githubResults
            $allResults += $azureResults
            $allResults += $jenkinsResults
            $allResults += $gitlabResults
            $allResults += $circleciResults
            $allResults += $travisResults
        }
        "github-actions" {
            Write-ColorOutput "Creating GitHub Actions workflows..." -Color Info
            Write-Log "Creating GitHub Actions workflows" "INFO"
            $allResults += Create-GitHubActionsWorkflows
        }
        "azure-devops" {
            Write-ColorOutput "Creating Azure DevOps pipelines..." -Color Info
            Write-Log "Creating Azure DevOps pipelines" "INFO"
            $allResults += Create-AzureDevOpsPipelines
        }
        "jenkins" {
            Write-ColorOutput "Creating Jenkins pipeline..." -Color Info
            Write-Log "Creating Jenkins pipeline" "INFO"
            $allResults += Create-JenkinsPipeline
        }
        "gitlab-ci" {
            Write-ColorOutput "Creating GitLab CI configuration..." -Color Info
            Write-Log "Creating GitLab CI configuration" "INFO"
            $allResults += Create-GitLabCIConfig
        }
        "circleci" {
            Write-ColorOutput "Creating CircleCI configuration..." -Color Info
            Write-Log "Creating CircleCI configuration" "INFO"
            $allResults += Create-CircleCIConfig
        }
        "travis-ci" {
            Write-ColorOutput "Creating Travis CI configuration..." -Color Info
            Write-Log "Creating Travis CI configuration" "INFO"
            $allResults += Create-TravisCIConfig
        }
        default {
            Write-ColorOutput "Unknown platform: $Platform" -Color Error
            Write-Log "Unknown platform: $Platform" "ERROR"
            Show-Usage
        }
    }
    
    # Show summary
    Write-ColorOutput ""
    Write-ColorOutput "CI/CD Enhancement Summary:" -Color Header
    Write-ColorOutput "=========================" -Color Header
    
    $successfulConfigs = ($allResults | Where-Object { $_.Status -eq "Created" }).Count
    $totalConfigs = $allResults.Count
    Write-ColorOutput "Configurations: $successfulConfigs/$totalConfigs created" -Color $(if ($successfulConfigs -eq $totalConfigs) { "Success" } else { "Warning" })
    
    $platforms = $allResults | Group-Object Platform
    foreach ($platform in $platforms) {
        $platformSuccess = ($platform.Group | Where-Object { $_.Status -eq "Created" }).Count
        $platformTotal = $platform.Group.Count
        Write-ColorOutput "$($platform.Name): $platformSuccess/$platformTotal successful" -Color $(if ($platformSuccess -eq $platformTotal) { "Success" } else { "Warning" })
    }
    
    Write-Log "CI/CD enhancement completed for platform: $Platform" "INFO"
}

# Run main function
Main
