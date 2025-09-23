# Local AI Models Manager Script v2.5
# Offline AI capabilities for enhanced privacy

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$Action = "status",
    
    [Parameter(Mandatory=$false)]
    [string]$ModelType = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$ModelName = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Download,
    
    [Parameter(Mandatory=$false)]
    [switch]$Install,
    
    [Parameter(Mandatory=$false)]
    [switch]$Update,
    
    [Parameter(Mandatory=$false)]
    [switch]$Remove,
    
    [Parameter(Mandatory=$false)]
    [switch]$List,
    
    [Parameter(Mandatory=$false)]
    [switch]$Test,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Local AI Models Configuration
$LocalAIConfig = @{
    ModelsDir = "models"
    CacheDir = "cache"
    LogsDir = "logs"
    SupportedModels = @{
        "llama2" = @{
            Name = "Llama 2"
            Size = "7GB"
            Type = "text-generation"
            Description = "Meta's Llama 2 model for text generation"
            DownloadUrl = "https://huggingface.co/meta-llama/Llama-2-7b-chat-hf"
        }
        "codellama" = @{
            Name = "Code Llama"
            Size = "7GB"
            Type = "code-generation"
            Description = "Meta's Code Llama model for code generation"
            DownloadUrl = "https://huggingface.co/codellama/CodeLlama-7b-Python-hf"
        }
        "starcoder" = @{
            Name = "StarCoder"
            Size = "15GB"
            Type = "code-generation"
            Description = "BigCode's StarCoder model for code generation"
            DownloadUrl = "https://huggingface.co/bigcode/starcoder"
        }
        "wizardcoder" = @{
            Name = "WizardCoder"
            Size = "7GB"
            Type = "code-generation"
            Description = "WizardCoder model for code generation and analysis"
            DownloadUrl = "https://huggingface.co/WizardLM/WizardCoder-15B-V1.0"
        }
        "phind-codellama" = @{
            Name = "Phind CodeLlama"
            Size = "7GB"
            Type = "code-generation"
            Description = "Phind's fine-tuned CodeLlama model"
            DownloadUrl = "https://huggingface.co/Phind/Phind-CodeLlama-34B-v2"
        }
    }
    Requirements = @{
        Python = "3.8+"
        Pip = "latest"
        Transformers = "4.30+"
        Torch = "2.0+"
        Accelerate = "latest"
        BitsAndBytes = "latest"
    }
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    if ($Verbose) {
        Write-Host $logMessage
    }
    
    # Log to file
    $logFile = Join-Path $ProjectPath "logs\local-ai-models.log"
    $logDir = Split-Path $logFile -Parent
    if (!(Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    Add-Content -Path $logFile -Value $logMessage
}

function Initialize-Directories {
    param(
        [string]$ProjectPath
    )
    
    $modelsDir = Join-Path $ProjectPath $LocalAIConfig.ModelsDir
    $cacheDir = Join-Path $ProjectPath $LocalAIConfig.CacheDir
    $logsDir = Join-Path $ProjectPath $LocalAIConfig.LogsDir
    
    @($modelsDir, $cacheDir, $logsDir) | ForEach-Object {
        if (!(Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
            Write-Log "Created directory: $_"
        }
    }
}

function Test-Requirements {
    Write-Log "Testing system requirements for local AI models"
    
    $requirements = $LocalAIConfig.Requirements
    $issues = @()
    
    # Check Python
    try {
        $pythonVersion = python --version 2>&1
        if ($pythonVersion -match "Python (\d+\.\d+)") {
            $version = [version]$matches[1]
            $requiredVersion = [version]$requirements.Python
            if ($version -lt $requiredVersion) {
                $issues += "Python version $version is below required $($requirements.Python)"
            } else {
                Write-Log "Python version check passed: $pythonVersion"
            }
        } else {
            $issues += "Python not found or version could not be determined"
        }
    } catch {
        $issues += "Python not installed or not in PATH"
    }
    
    # Check pip
    try {
        $pipVersion = pip --version 2>&1
        Write-Log "Pip version check passed: $pipVersion"
    } catch {
        $issues += "Pip not installed or not in PATH"
    }
    
    # Check required packages
    $requiredPackages = @("transformers", "torch", "accelerate", "bitsandbytes")
    foreach ($package in $requiredPackages) {
        try {
            $packageInfo = pip show $package 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Package $package is installed"
            } else {
                $issues += "Required package $package is not installed"
            }
        } catch {
            $issues += "Could not check package $package"
        }
    }
    
    if ($issues.Count -gt 0) {
        Write-Log "Requirements issues found:" "WARNING"
        $issues | ForEach-Object { Write-Log "  - $_" "WARNING" }
        return $false
    } else {
        Write-Log "All requirements satisfied"
        return $true
    }
}

function Install-Requirements {
    Write-Log "Installing required packages for local AI models"
    
    $packages = @(
        "transformers>=4.30.0",
        "torch>=2.0.0",
        "accelerate",
        "bitsandbytes",
        "sentencepiece",
        "protobuf",
        "huggingface_hub"
    )
    
    foreach ($package in $packages) {
        try {
            Write-Log "Installing package: $package"
            pip install $package --quiet
            Write-Log "Successfully installed: $package"
        } catch {
            Write-Log "Failed to install $package : $($_.Exception.Message)" "ERROR"
        }
    }
}

function Get-ModelStatus {
    param(
        [string]$ProjectPath
    )
    
    $modelsDir = Join-Path $ProjectPath $LocalAIConfig.ModelsDir
    $installedModels = @()
    
    if (Test-Path $modelsDir) {
        $modelDirs = Get-ChildItem -Path $modelsDir -Directory
        foreach ($dir in $modelDirs) {
            $modelInfo = @{
                Name = $dir.Name
                Path = $dir.FullName
                Size = (Get-ChildItem -Path $dir.FullName -Recurse | Measure-Object -Property Length -Sum).Sum
                LastModified = $dir.LastWriteTime
                Status = "Installed"
            }
            $installedModels += $modelInfo
        }
    }
    
    return $installedModels
}

function Download-Model {
    param(
        [string]$ModelName,
        [string]$ProjectPath
    )
    
    if (!$LocalAIConfig.SupportedModels.ContainsKey($ModelName)) {
        throw "Model $ModelName is not supported. Supported models: $($LocalAIConfig.SupportedModels.Keys -join ', ')"
    }
    
    $modelConfig = $LocalAIConfig.SupportedModels[$ModelName]
    $modelsDir = Join-Path $ProjectPath $LocalAIConfig.ModelsDir
    $modelDir = Join-Path $modelsDir $ModelName
    
    Write-Log "Downloading model: $($modelConfig.Name)"
    Write-Log "Size: $($modelConfig.Size)"
    Write-Log "Description: $($modelConfig.Description)"
    
    try {
        # Create model directory
        if (!(Test-Path $modelDir)) {
            New-Item -ItemType Directory -Path $modelDir -Force | Out-Null
        }
        
        # Download using huggingface_hub
        $pythonScript = @"
import os
from huggingface_hub import snapshot_download

model_name = "$($modelConfig.DownloadUrl)"
local_dir = "$modelDir"

try:
    snapshot_download(
        repo_id=model_name,
        local_dir=local_dir,
        local_dir_use_symlinks=False
    )
    print("Model downloaded successfully")
except Exception as e:
    print(f"Error downloading model: {e}")
    exit(1)
"@
        
        $scriptPath = Join-Path $ProjectPath "temp_download_script.py"
        Set-Content -Path $scriptPath -Value $pythonScript -Encoding UTF8
        
        Write-Log "Running download script..."
        python $scriptPath
        
        # Clean up
        Remove-Item $scriptPath -Force
        
        Write-Log "Model $ModelName downloaded successfully"
        
    } catch {
        Write-Log "Error downloading model $ModelName : $($_.Exception.Message)" "ERROR"
        throw
    }
}

function Test-Model {
    param(
        [string]$ModelName,
        [string]$ProjectPath
    )
    
    $modelsDir = Join-Path $ProjectPath $LocalAIConfig.ModelsDir
    $modelDir = Join-Path $modelsDir $ModelName
    
    if (!(Test-Path $modelDir)) {
        throw "Model $ModelName is not installed"
    }
    
    Write-Log "Testing model: $ModelName"
    
    $testScript = @"
import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

model_path = "$modelDir"

try:
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    print("✓ Tokenizer loaded successfully")
    
    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch.float16,
        device_map="auto"
    )
    print("✓ Model loaded successfully")
    
    # Test inference
    test_prompt = "def hello_world():"
    inputs = tokenizer(test_prompt, return_tensors="pt")
    
    with torch.no_grad():
        outputs = model.generate(
            inputs.input_ids,
            max_length=50,
            num_return_sequences=1,
            temperature=0.7,
            do_sample=True
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"✓ Test inference successful")
    print(f"Input: {test_prompt}")
    print(f"Output: {response}")
    
except Exception as e:
    print(f"✗ Model test failed: {e}")
    exit(1)
"@
    
    $scriptPath = Join-Path $ProjectPath "temp_test_script.py"
    Set-Content -Path $scriptPath -Value $testScript -Encoding UTF8
    
    try {
        Write-Log "Running model test..."
        python $scriptPath
        Write-Log "Model $ModelName test completed successfully"
    } catch {
        Write-Log "Model test failed: $($_.Exception.Message)" "ERROR"
    } finally {
        Remove-Item $scriptPath -Force
    }
}

function Remove-Model {
    param(
        [string]$ModelName,
        [string]$ProjectPath
    )
    
    $modelsDir = Join-Path $ProjectPath $LocalAIConfig.ModelsDir
    $modelDir = Join-Path $modelsDir $ModelName
    
    if (Test-Path $modelDir) {
        Write-Log "Removing model: $ModelName"
        Remove-Item -Path $modelDir -Recurse -Force
        Write-Log "Model $ModelName removed successfully"
    } else {
        Write-Log "Model $ModelName not found" "WARNING"
    }
}

function Show-ModelList {
    param(
        [string]$ProjectPath
    )
    
    Write-Host "`nLocal AI Models Status" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    
    $installedModels = Get-ModelStatus -ProjectPath $ProjectPath
    
    if ($installedModels.Count -eq 0) {
        Write-Host "No models installed" -ForegroundColor Yellow
    } else {
        foreach ($model in $installedModels) {
            $sizeGB = [math]::Round($model.Size / 1GB, 2)
            Write-Host "`nModel: $($model.Name)" -ForegroundColor Green
            Write-Host "  Path: $($model.Path)" -ForegroundColor White
            Write-Host "  Size: $sizeGB GB" -ForegroundColor White
            Write-Host "  Status: $($model.Status)" -ForegroundColor White
            Write-Host "  Last Modified: $($model.LastModified)" -ForegroundColor White
        }
    }
    
    Write-Host "`nSupported Models:" -ForegroundColor Cyan
    foreach ($modelName in $LocalAIConfig.SupportedModels.Keys) {
        $modelConfig = $LocalAIConfig.SupportedModels[$modelName]
        Write-Host "  - $modelName ($($modelConfig.Name)) - $($modelConfig.Size)" -ForegroundColor White
    }
}

# Main execution
try {
    Write-Log "Starting Local AI Models Manager" "INFO"
    
    # Initialize directories
    Initialize-Directories -ProjectPath $ProjectPath
    
    switch ($Action.ToLower()) {
        "status" {
            Show-ModelList -ProjectPath $ProjectPath
        }
        "install" {
            if ($ModelName) {
                if (Test-Requirements) {
                    Download-Model -ModelName $ModelName -ProjectPath $ProjectPath
                } else {
                    Write-Log "Installing requirements first..." "INFO"
                    Install-Requirements
                    Download-Model -ModelName $ModelName -ProjectPath $ProjectPath
                }
            } else {
                Write-Log "Installing requirements..." "INFO"
                Install-Requirements
            }
        }
        "download" {
            if ($ModelName) {
                Download-Model -ModelName $ModelName -ProjectPath $ProjectPath
            } else {
                throw "Model name is required for download action"
            }
        }
        "test" {
            if ($ModelName) {
                Test-Model -ModelName $ModelName -ProjectPath $ProjectPath
            } else {
                throw "Model name is required for test action"
            }
        }
        "remove" {
            if ($ModelName) {
                Remove-Model -ModelName $ModelName -ProjectPath $ProjectPath
            } else {
                throw "Model name is required for remove action"
            }
        }
        "list" {
            Show-ModelList -ProjectPath $ProjectPath
        }
        default {
            Write-Host "Available actions: status, install, download, test, remove, list" -ForegroundColor Yellow
        }
    }
    
    Write-Log "Local AI Models Manager completed successfully" "INFO"
    
} catch {
    Write-Log "Error in Local AI Models Manager: $($_.Exception.Message)" "ERROR"
    throw
}
