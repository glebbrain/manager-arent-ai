# AI Model Lifecycle Manager Script v2.5
# Centralized AI model lifecycle management

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$Action = "status",
    
    [Parameter(Mandatory=$false)]
    [string]$ModelName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ModelType = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "latest",
    
    [Parameter(Mandatory=$false)]
    [switch]$List,
    
    [Parameter(Mandatory=$false)]
    [switch]$Deploy,
    
    [Parameter(Mandatory=$false)]
    [switch]$Monitor,
    
    [Parameter(Mandatory=$false)]
    [switch]$Update,
    
    [Parameter(Mandatory=$false)]
    [switch]$Rollback,
    
    [Parameter(Mandatory=$false)]
    [switch]$Cleanup,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Model Lifecycle Configuration
$LifecycleConfig = @{
    ModelRegistry = "model_registry.json"
    DeploymentConfig = "deployment_config.json"
    MonitoringConfig = "monitoring_config.json"
    ModelTypes = @{
        "gpt4" = @{
            Description = "GPT-4 based models"
            BasePath = "models/gpt4"
            DeploymentType = "api"
            MonitoringEnabled = $true
        }
        "claude3" = @{
            Description = "Claude-3 based models"
            BasePath = "models/claude3"
            DeploymentType = "api"
            MonitoringEnabled = $true
        }
        "local" = @{
            Description = "Local AI models"
            BasePath = "models/local"
            DeploymentType = "local"
            MonitoringEnabled = $true
        }
        "custom" = @{
            Description = "Custom trained models"
            BasePath = "models/custom"
            DeploymentType = "local"
            MonitoringEnabled = $true
        }
    }
    DeploymentTypes = @{
        "api" = @{
            Description = "API-based deployment"
            Port = 8000
            HealthCheck = "/health"
            MetricsEndpoint = "/metrics"
        }
        "local" = @{
            Description = "Local model deployment"
            CacheDir = "cache"
            ConfigFile = "model_config.json"
        }
    }
    MonitoringMetrics = @{
        "performance" = @("inference_time", "throughput", "memory_usage")
        "quality" = @("accuracy", "precision", "recall", "f1_score")
        "reliability" = @("uptime", "error_rate", "availability")
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
    $logFile = Join-Path $ProjectPath "logs\ai-model-lifecycle.log"
    $logDir = Split-Path $logFile -Parent
    if (!(Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    Add-Content -Path $logFile -Value $logMessage
}

function Initialize-LifecycleEnvironment {
    param(
        [string]$ProjectPath
    )
    
    Write-Log "Initializing AI model lifecycle environment"
    
    # Create necessary directories
    $dirs = @("models", "deployments", "monitoring", "logs", "config", "cache")
    foreach ($dir in $dirs) {
        $dirPath = Join-Path $ProjectPath $dir
        if (!(Test-Path $dirPath)) {
            New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
            Write-Log "Created directory: $dirPath"
        }
    }
    
    # Initialize model registry if it doesn't exist
    $registryPath = Join-Path $ProjectPath $LifecycleConfig.ModelRegistry
    if (!(Test-Path $registryPath)) {
        $registry = @{
            models = @{}
            deployments = @{}
            versions = @{}
            last_updated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        }
        $registry | ConvertTo-Json -Depth 10 | Set-Content -Path $registryPath -Encoding UTF8
        Write-Log "Created model registry: $registryPath"
    }
}

function Get-ModelRegistry {
    param(
        [string]$ProjectPath
    )
    
    $registryPath = Join-Path $ProjectPath $LifecycleConfig.ModelRegistry
    if (Test-Path $registryPath) {
        $content = Get-Content $registryPath -Raw -Encoding UTF8
        return $content | ConvertFrom-Json
    } else {
        return @{ models = @{}; deployments = @{}; versions = @{} }
    }
}

function Update-ModelRegistry {
    param(
        [hashtable]$Registry,
        [string]$ProjectPath
    )
    
    $registryPath = Join-Path $ProjectPath $LifecycleConfig.ModelRegistry
    $Registry.last_updated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $Registry | ConvertTo-Json -Depth 10 | Set-Content -Path $registryPath -Encoding UTF8
    Write-Log "Updated model registry"
}

function Register-Model {
    param(
        [string]$ModelName,
        [string]$ModelType,
        [string]$Version,
        [string]$ModelPath,
        [string]$ProjectPath,
        [hashtable]$Metadata = @{}
    )
    
    Write-Log "Registering model: $ModelName (Type: $ModelType, Version: $Version)"
    
    $registry = Get-ModelRegistry -ProjectPath $ProjectPath
    
    $modelInfo = @{
        name = $ModelName
        type = $ModelType
        version = $Version
        path = $ModelPath
        registered_at = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        status = "registered"
        metadata = $Metadata
    }
    
    if (!$registry.models.ContainsKey($ModelName)) {
        $registry.models[$ModelName] = @{}
    }
    
    $registry.models[$ModelName][$Version] = $modelInfo
    Update-ModelRegistry -Registry $registry -ProjectPath $ProjectPath
    
    Write-Log "Model registered successfully"
}

function List-Models {
    param(
        [string]$ProjectPath,
        [string]$ModelType = "all"
    )
    
    Write-Log "Listing models (Type: $ModelType)"
    
    $registry = Get-ModelRegistry -ProjectPath $ProjectPath
    
    Write-Host "`nAI Model Registry" -ForegroundColor Cyan
    Write-Host "=================" -ForegroundColor Cyan
    
    if ($registry.models.Count -eq 0) {
        Write-Host "No models registered" -ForegroundColor Yellow
        return
    }
    
    foreach ($modelName in $registry.models.Keys) {
        $model = $registry.models[$modelName]
        
        if ($ModelType -ne "all" -and $model.Values[0].type -ne $ModelType) {
            continue
        }
        
        Write-Host "`nModel: $modelName" -ForegroundColor Green
        Write-Host "  Type: $($model.Values[0].type)" -ForegroundColor White
        Write-Host "  Versions: $($model.Keys -join ', ')" -ForegroundColor White
        Write-Host "  Status: $($model.Values[0].status)" -ForegroundColor White
        Write-Host "  Registered: $($model.Values[0].registered_at)" -ForegroundColor White
    }
}

function Deploy-Model {
    param(
        [string]$ModelName,
        [string]$Version,
        [string]$ProjectPath
    )
    
    Write-Log "Deploying model: $ModelName (Version: $Version)"
    
    $registry = Get-ModelRegistry -ProjectPath $ProjectPath
    
    if (!$registry.models.ContainsKey($ModelName)) {
        throw "Model $ModelName not found in registry"
    }
    
    if (!$registry.models[$ModelName].ContainsKey($Version)) {
        throw "Version $Version not found for model $ModelName"
    }
    
    $modelInfo = $registry.models[$ModelName][$Version]
    $modelType = $modelInfo.type
    $modelPath = $modelInfo.path
    
    # Create deployment configuration
    $deploymentConfig = @{
        model_name = $ModelName
        version = $Version
        type = $modelType
        path = $modelPath
        deployed_at = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        status = "deployed"
        deployment_type = $LifecycleConfig.ModelTypes[$modelType].DeploymentType
    }
    
    # Deploy based on type
    switch ($LifecycleConfig.ModelTypes[$modelType].DeploymentType) {
        "api" {
            Deploy-APIModel -ModelInfo $modelInfo -ProjectPath $ProjectPath
        }
        "local" {
            Deploy-LocalModel -ModelInfo $modelInfo -ProjectPath $ProjectPath
        }
    }
    
    # Update registry
    if (!$registry.deployments.ContainsKey($ModelName)) {
        $registry.deployments[$ModelName] = @{}
    }
    $registry.deployments[$ModelName][$Version] = $deploymentConfig
    Update-ModelRegistry -Registry $registry -ProjectPath $ProjectPath
    
    Write-Log "Model deployed successfully"
}

function Deploy-APIModel {
    param(
        [hashtable]$ModelInfo,
        [string]$ProjectPath
    )
    
    Write-Log "Deploying API model: $($ModelInfo.name)"
    
    $deploymentScript = @"
import os
import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

app = FastAPI(title="AI Model API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and tokenizer
model = None
tokenizer = None

@app.on_event("startup")
async def load_model():
    global model, tokenizer
    model_path = "$($ModelInfo.path)"
    
    print(f"Loading model from {model_path}")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(model_path)
    print("Model loaded successfully")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "$($ModelInfo.name)"}

@app.get("/metrics")
async def get_metrics():
    return {
        "model_name": "$($ModelInfo.name)",
        "version": "$($ModelInfo.version)",
        "status": "running"
    }

@app.post("/predict")
async def predict(request: dict):
    try:
        input_text = request.get("text", "")
        max_length = request.get("max_length", 100)
        temperature = request.get("temperature", 0.7)
        
        if not input_text:
            raise HTTPException(status_code=400, detail="Input text is required")
        
        # Tokenize input
        inputs = tokenizer(input_text, return_tensors="pt", truncation=True, max_length=512)
        
        # Generate output
        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                max_length=max_length,
                num_return_sequences=1,
                temperature=temperature,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        return {
            "input": input_text,
            "output": response_text,
            "model": "$($ModelInfo.name)",
            "version": "$($ModelInfo.version)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
"@
    
    $scriptPath = Join-Path $ProjectPath "deployments\api_server.py"
    Set-Content -Path $scriptPath -Value $deploymentScript -Encoding UTF8
    
    Write-Log "API deployment script created: $scriptPath"
    Write-Log "To start the API server, run: python $scriptPath"
}

function Deploy-LocalModel {
    param(
        [hashtable]$ModelInfo,
        [string]$ProjectPath
    )
    
    Write-Log "Deploying local model: $($ModelInfo.name)"
    
    $cacheDir = Join-Path $ProjectPath "cache"
    $modelCacheDir = Join-Path $cacheDir $ModelInfo.name
    
    if (!(Test-Path $modelCacheDir)) {
        New-Item -ItemType Directory -Path $modelCacheDir -Force | Out-Null
    }
    
    # Create model configuration
    $config = @{
        model_name = $ModelInfo.name
        version = $ModelInfo.version
        path = $ModelInfo.path
        cache_dir = $modelCacheDir
        deployed_at = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    
    $configPath = Join-Path $modelCacheDir "model_config.json"
    $config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath -Encoding UTF8
    
    Write-Log "Local model deployed to: $modelCacheDir"
}

function Monitor-Model {
    param(
        [string]$ModelName,
        [string]$ProjectPath
    )
    
    Write-Log "Starting monitoring for model: $ModelName"
    
    $monitoringScript = @"
import os
import json
import time
import psutil
import requests
from datetime import datetime

MODEL_NAME = "$ModelName"
PROJECT_PATH = "$ProjectPath"

def check_api_health(url):
    try:
        response = requests.get(f"{url}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def get_api_metrics(url):
    try:
        response = requests.get(f"{url}/metrics", timeout=5)
        return response.json()
    except:
        return {}

def monitor_model():
    # Check if model is deployed as API
    api_url = "http://localhost:8000"
    
    if check_api_health(api_url):
        print(f"API model {MODEL_NAME} is healthy")
        metrics = get_api_metrics(api_url)
        print(f"Metrics: {metrics}")
    else:
        print(f"API model {MODEL_NAME} is not responding")
    
    # System metrics
    cpu_percent = psutil.cpu_percent()
    memory_percent = psutil.virtual_memory().percent
    disk_percent = psutil.disk_usage('/').percent
    
    print(f"System metrics - CPU: {cpu_percent}%, Memory: {memory_percent}%, Disk: {disk_percent}%")
    
    # Save monitoring data
    monitoring_data = {
        "timestamp": datetime.now().isoformat(),
        "model_name": MODEL_NAME,
        "api_healthy": check_api_health(api_url),
        "system_metrics": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory_percent,
            "disk_percent": disk_percent
        }
    }
    
    monitoring_file = os.path.join(PROJECT_PATH, "monitoring", f"{MODEL_NAME}_monitoring.json")
    with open(monitoring_file, 'w') as f:
        json.dump(monitoring_data, f, indent=2)

if __name__ == "__main__":
    monitor_model()
"@
    
    $scriptPath = Join-Path $ProjectPath "monitoring\model_monitor.py"
    Set-Content -Path $scriptPath -Value $monitoringScript -Encoding UTF8
    
    Write-Log "Monitoring script created: $scriptPath"
    Write-Log "To start monitoring, run: python $scriptPath"
}

function Update-Model {
    param(
        [string]$ModelName,
        [string]$NewVersion,
        [string]$ProjectPath
    )
    
    Write-Log "Updating model: $ModelName to version $NewVersion"
    
    $registry = Get-ModelRegistry -ProjectPath $ProjectPath
    
    if (!$registry.models.ContainsKey($ModelName)) {
        throw "Model $ModelName not found in registry"
    }
    
    if (!$registry.models[$ModelName].ContainsKey($NewVersion)) {
        throw "Version $NewVersion not found for model $ModelName"
    }
    
    # Deploy new version
    Deploy-Model -ModelName $ModelName -Version $NewVersion -ProjectPath $ProjectPath
    
    Write-Log "Model updated successfully"
}

function Rollback-Model {
    param(
        [string]$ModelName,
        [string]$PreviousVersion,
        [string]$ProjectPath
    )
    
    Write-Log "Rolling back model: $ModelName to version $PreviousVersion"
    
    $registry = Get-ModelRegistry -ProjectPath $ProjectPath
    
    if (!$registry.models.ContainsKey($ModelName)) {
        throw "Model $ModelName not found in registry"
    }
    
    if (!$registry.models[$ModelName].ContainsKey($PreviousVersion)) {
        throw "Version $PreviousVersion not found for model $ModelName"
    }
    
    # Deploy previous version
    Deploy-Model -ModelName $ModelName -Version $PreviousVersion -ProjectPath $ProjectPath
    
    Write-Log "Model rolled back successfully"
}

function Cleanup-Models {
    param(
        [string]$ProjectPath
    )
    
    Write-Log "Cleaning up old models and deployments"
    
    $registry = Get-ModelRegistry -ProjectPath $ProjectPath
    
    # Clean up old versions (keep only latest 3 versions per model)
    foreach ($modelName in $registry.models.Keys) {
        $versions = $registry.models[$modelName].Keys | Sort-Object -Descending
        if ($versions.Count -gt 3) {
            $versionsToRemove = $versions[3..($versions.Count-1)]
            foreach ($version in $versionsToRemove) {
                Write-Log "Removing old version: $modelName v$version"
                $registry.models[$modelName].Remove($version)
            }
        }
    }
    
    Update-ModelRegistry -Registry $registry -ProjectPath $ProjectPath
    
    Write-Log "Cleanup completed"
}

# Main execution
try {
    Write-Log "Starting AI Model Lifecycle Manager" "INFO"
    
    # Initialize environment
    Initialize-LifecycleEnvironment -ProjectPath $ProjectPath
    
    switch ($Action.ToLower()) {
        "status" {
            List-Models -ProjectPath $ProjectPath -ModelType $ModelType
        }
        "list" {
            List-Models -ProjectPath $ProjectPath -ModelType $ModelType
        }
        "deploy" {
            if ($ModelName -and $Version) {
                Deploy-Model -ModelName $ModelName -Version $Version -ProjectPath $ProjectPath
            } else {
                throw "Model name and version are required for deployment"
            }
        }
        "monitor" {
            if ($ModelName) {
                Monitor-Model -ModelName $ModelName -ProjectPath $ProjectPath
            } else {
                throw "Model name is required for monitoring"
            }
        }
        "update" {
            if ($ModelName -and $Version) {
                Update-Model -ModelName $ModelName -NewVersion $Version -ProjectPath $ProjectPath
            } else {
                throw "Model name and version are required for update"
            }
        }
        "rollback" {
            if ($ModelName -and $Version) {
                Rollback-Model -ModelName $ModelName -PreviousVersion $Version -ProjectPath $ProjectPath
            } else {
                throw "Model name and version are required for rollback"
            }
        }
        "cleanup" {
            Cleanup-Models -ProjectPath $ProjectPath
        }
        default {
            Write-Host "Available actions: status, list, deploy, monitor, update, rollback, cleanup" -ForegroundColor Yellow
        }
    }
    
    Write-Log "AI Model Lifecycle Manager completed successfully" "INFO"
    
} catch {
    Write-Log "Error in AI Model Lifecycle Manager: $($_.Exception.Message)" "ERROR"
    throw
}
