# Custom AI Training Script v2.5
# Project-specific AI model training

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$TrainingType = "code-generation",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseModel = "microsoft/codebert-base",
    
    [Parameter(Mandatory=$false)]
    [string]$DatasetPath = "",
    
    [Parameter(Mandatory=$false)]
    [int]$Epochs = 3,
    
    [Parameter(Mandatory=$false)]
    [int]$BatchSize = 4,
    
    [Parameter(Mandatory=$false)]
    [float]$LearningRate = 5e-5,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "trained_models",
    
    [Parameter(Mandatory=$false)]
    [switch]$FineTune,
    
    [Parameter(Mandatory=$false)]
    [switch]$Evaluate,
    
    [Parameter(Mandatory=$false)]
    [switch]$Export,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Training Configuration
$TrainingConfig = @{
    SupportedTypes = @{
        "code-generation" = @{
            Description = "Code generation and completion"
            BaseModels = @("microsoft/codebert-base", "microsoft/graphcodebert-base", "codellama/CodeLlama-7b-Python-hf")
            DatasetFormat = "jsonl"
            RequiredFields = @("input", "output")
        }
        "code-analysis" = @{
            Description = "Code analysis and review"
            BaseModels = @("microsoft/codebert-base", "microsoft/graphcodebert-base")
            DatasetFormat = "jsonl"
            RequiredFields = @("code", "analysis", "quality_score")
        }
        "documentation" = @{
            Description = "Documentation generation"
            BaseModels = @("microsoft/codebert-base", "microsoft/graphcodebert-base")
            DatasetFormat = "jsonl"
            RequiredFields = @("code", "documentation")
        }
        "bug-detection" = @{
            Description = "Bug detection and fixing"
            BaseModels = @("microsoft/codebert-base", "microsoft/graphcodebert-base")
            DatasetFormat = "jsonl"
            RequiredFields = @("code", "bug_description", "fix")
        }
    }
    TrainingParams = @{
        MaxLength = 512
        WarmupSteps = 100
        WeightDecay = 0.01
        GradientAccumulationSteps = 1
        SaveSteps = 500
        EvalSteps = 500
        LoggingSteps = 100
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
    $logFile = Join-Path $ProjectPath "logs\custom-ai-training.log"
    $logDir = Split-Path $logFile -Parent
    if (!(Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    Add-Content -Path $logFile -Value $logMessage
}

function Initialize-TrainingEnvironment {
    param(
        [string]$ProjectPath
    )
    
    Write-Log "Initializing training environment"
    
    # Create necessary directories
    $dirs = @("datasets", "trained_models", "logs", "checkpoints", "evaluations")
    foreach ($dir in $dirs) {
        $dirPath = Join-Path $ProjectPath $dir
        if (!(Test-Path $dirPath)) {
            New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
            Write-Log "Created directory: $dirPath"
        }
    }
    
    # Install required packages
    $packages = @(
        "transformers>=4.30.0",
        "torch>=2.0.0",
        "datasets>=2.12.0",
        "accelerate>=0.20.0",
        "evaluate>=0.4.0",
        "rouge-score>=0.1.2",
        "sacrebleu>=2.3.0",
        "nltk>=3.8.0",
        "scikit-learn>=1.3.0"
    )
    
    foreach ($package in $packages) {
        try {
            Write-Log "Installing package: $package"
            pip install $package --quiet
        } catch {
            Write-Log "Failed to install $package : $($_.Exception.Message)" "WARNING"
        }
    }
}

function Prepare-Dataset {
    param(
        [string]$DatasetPath,
        [string]$TrainingType,
        [string]$ProjectPath
    )
    
    Write-Log "Preparing dataset for training type: $TrainingType"
    
    $typeConfig = $TrainingConfig.SupportedTypes[$TrainingType]
    if (!$typeConfig) {
        throw "Unsupported training type: $TrainingType"
    }
    
    # If no dataset path provided, create a sample dataset
    if (!$DatasetPath -or !(Test-Path $DatasetPath)) {
        Write-Log "No dataset provided, creating sample dataset"
        $DatasetPath = Create-SampleDataset -TrainingType $TrainingType -ProjectPath $ProjectPath
    }
    
    # Validate dataset format
    $dataset = Get-Content $DatasetPath | ConvertFrom-Json
    $requiredFields = $typeConfig.RequiredFields
    
    foreach ($field in $requiredFields) {
        if (!($dataset[0].PSObject.Properties.Name -contains $field)) {
            throw "Dataset missing required field: $field"
        }
    }
    
    Write-Log "Dataset validation passed"
    return $DatasetPath
}

function Create-SampleDataset {
    param(
        [string]$TrainingType,
        [string]$ProjectPath
    )
    
    $datasetsDir = Join-Path $ProjectPath "datasets"
    $sampleData = @()
    
    switch ($TrainingType) {
        "code-generation" {
            $sampleData = @(
                @{
                    input = "def calculate_fibonacci(n):"
                    output = "def calculate_fibonacci(n):`n    if n <= 1:`n        return n`n    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)"
                },
                @{
                    input = "class User:"
                    output = "class User:`n    def __init__(self, name, email):`n        self.name = name`n        self.email = email`n    `n    def get_info(self):`n        return f'Name: {self.name}, Email: {self.email}'"
                }
            )
        }
        "code-analysis" {
            $sampleData = @(
                @{
                    code = "def add(a, b): return a + b"
                    analysis = "Simple addition function with good readability"
                    quality_score = 8
                },
                @{
                    code = "def complex_function(x,y,z):return x*y+z"
                    analysis = "Function lacks proper formatting and variable names"
                    quality_score = 4
                }
            )
        }
        "documentation" {
            $sampleData = @(
                @{
                    code = "def calculate_area(radius): return 3.14 * radius * radius"
                    documentation = "Calculates the area of a circle given its radius. Returns the area as a float."
                },
                @{
                    code = "class Database: def connect(self): pass"
                    documentation = "Database class with a connect method for establishing database connections."
                }
            )
        }
        "bug-detection" {
            $sampleData = @(
                @{
                    code = "def divide(a, b): return a / b"
                    bug_description = "Division by zero error not handled"
                    fix = "def divide(a, b): return a / b if b != 0 else 0"
                }
            )
        }
    }
    
    $datasetPath = Join-Path $datasetsDir "sample_$TrainingType.jsonl"
    $sampleData | ForEach-Object { $_ | ConvertTo-Json -Compress } | Set-Content -Path $datasetPath -Encoding UTF8
    
    Write-Log "Sample dataset created: $datasetPath"
    return $datasetPath
}

function Start-Training {
    param(
        [string]$DatasetPath,
        [string]$BaseModel,
        [string]$TrainingType,
        [string]$ProjectPath,
        [hashtable]$TrainingParams
    )
    
    Write-Log "Starting training process"
    Write-Log "Base Model: $BaseModel"
    Write-Log "Training Type: $TrainingType"
    Write-Log "Epochs: $Epochs"
    Write-Log "Batch Size: $BatchSize"
    Write-Log "Learning Rate: $LearningRate"
    
    $outputDir = Join-Path $ProjectPath $OutputDir
    $checkpointDir = Join-Path $ProjectPath "checkpoints"
    
    $trainingScript = @"
import os
import json
import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    TrainingArguments, 
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
import evaluate

# Configuration
BASE_MODEL = "$BaseModel"
DATASET_PATH = "$DatasetPath"
OUTPUT_DIR = "$outputDir"
CHECKPOINT_DIR = "$checkpointDir"
TRAINING_TYPE = "$TrainingType"
EPOCHS = $Epochs
BATCH_SIZE = $BatchSize
LEARNING_RATE = $LearningRate

def load_dataset(dataset_path, training_type):
    with open(dataset_path, 'r', encoding='utf-8') as f:
        data = [json.loads(line) for line in f]
    
    # Convert to training format based on type
    if training_type == "code-generation":
        texts = [f"{item['input']} {item['output']}" for item in data]
    elif training_type == "code-analysis":
        texts = [f"Code: {item['code']} Analysis: {item['analysis']}" for item in data]
    elif training_type == "documentation":
        texts = [f"Code: {item['code']} Documentation: {item['documentation']}" for item in data]
    elif training_type == "bug-detection":
        texts = [f"Code: {item['code']} Bug: {item['bug_description']} Fix: {item['fix']}" for item in data]
    
    return Dataset.from_dict({"text": texts})

def tokenize_function(examples, tokenizer):
    return tokenizer(
        examples["text"],
        truncation=True,
        padding=True,
        max_length=512,
        return_tensors="pt"
    )

def main():
    print("Loading model and tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    model = AutoModelForCausalLM.from_pretrained(BASE_MODEL)
    
    # Add padding token if it doesn't exist
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    print("Loading dataset...")
    dataset = load_dataset(DATASET_PATH, TRAINING_TYPE)
    
    print("Tokenizing dataset...")
    tokenized_dataset = dataset.map(
        lambda x: tokenize_function(x, tokenizer),
        batched=True,
        remove_columns=dataset.column_names
    )
    
    # Split dataset
    train_size = int(0.8 * len(tokenized_dataset))
    train_dataset = tokenized_dataset.select(range(train_size))
    eval_dataset = tokenized_dataset.select(range(train_size, len(tokenized_dataset)))
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        learning_rate=LEARNING_RATE,
        warmup_steps=100,
        weight_decay=0.01,
        logging_dir=CHECKPOINT_DIR,
        logging_steps=100,
        save_steps=500,
        eval_steps=500,
        evaluation_strategy="steps",
        save_strategy="steps",
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        report_to=None
    )
    
    # Data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False
    )
    
    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        data_collator=data_collator,
        tokenizer=tokenizer
    )
    
    print("Starting training...")
    trainer.train()
    
    print("Saving model...")
    trainer.save_model()
    tokenizer.save_pretrained(OUTPUT_DIR)
    
    print("Training completed successfully!")

if __name__ == "__main__":
    main()
"@
    
    $scriptPath = Join-Path $ProjectPath "temp_training_script.py"
    Set-Content -Path $scriptPath -Value $trainingScript -Encoding UTF8
    
    try {
        Write-Log "Running training script..."
        python $scriptPath
        
        Write-Log "Training completed successfully"
        Write-Log "Model saved to: $outputDir"
        
    } catch {
        Write-Log "Training failed: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Remove-Item $scriptPath -Force
    }
}

function Evaluate-Model {
    param(
        [string]$ModelPath,
        [string]$TestDatasetPath,
        [string]$ProjectPath
    )
    
    Write-Log "Evaluating trained model"
    
    $evaluationScript = @"
import os
import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from datasets import Dataset
import evaluate

MODEL_PATH = "$ModelPath"
TEST_DATASET_PATH = "$TestDatasetPath"

def load_test_dataset(dataset_path):
    with open(dataset_path, 'r', encoding='utf-8') as f:
        data = [json.loads(line) for line in f]
    return data

def evaluate_model(model, tokenizer, test_data):
    model.eval()
    results = []
    
    for item in test_data:
        input_text = item.get('input', '')
        expected_output = item.get('output', '')
        
        # Tokenize input
        inputs = tokenizer(input_text, return_tensors="pt", truncation=True, max_length=512)
        
        # Generate output
        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                max_length=512,
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        results.append({
            'input': input_text,
            'expected': expected_output,
            'generated': generated_text
        })
    
    return results

def main():
    print("Loading model and tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForCausalLM.from_pretrained(MODEL_PATH)
    
    print("Loading test dataset...")
    test_data = load_test_dataset(TEST_DATASET_PATH)
    
    print("Evaluating model...")
    results = evaluate_model(model, tokenizer, test_data)
    
    # Save results
    output_path = os.path.join("$ProjectPath", "evaluations", "evaluation_results.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"Evaluation completed. Results saved to: {output_path}")
    print(f"Evaluated {len(results)} samples")

if __name__ == "__main__":
    main()
"@
    
    $scriptPath = Join-Path $ProjectPath "temp_evaluation_script.py"
    Set-Content -Path $scriptPath -Value $evaluationScript -Encoding UTF8
    
    try {
        Write-Log "Running evaluation script..."
        python $scriptPath
        Write-Log "Evaluation completed successfully"
    } catch {
        Write-Log "Evaluation failed: $($_.Exception.Message)" "ERROR"
    } finally {
        Remove-Item $scriptPath -Force
    }
}

# Main execution
try {
    Write-Log "Starting Custom AI Training" "INFO"
    
    # Initialize training environment
    Initialize-TrainingEnvironment -ProjectPath $ProjectPath
    
    # Prepare dataset
    $datasetPath = Prepare-Dataset -DatasetPath $DatasetPath -TrainingType $TrainingType -ProjectPath $ProjectPath
    
    # Start training
    if ($FineTune) {
        Start-Training -DatasetPath $datasetPath -BaseModel $BaseModel -TrainingType $TrainingType -ProjectPath $ProjectPath -TrainingParams $TrainingConfig.TrainingParams
    }
    
    # Evaluate model
    if ($Evaluate) {
        $modelPath = Join-Path $ProjectPath $OutputDir
        Evaluate-Model -ModelPath $modelPath -TestDatasetPath $datasetPath -ProjectPath $ProjectPath
    }
    
    Write-Log "Custom AI Training completed successfully" "INFO"
    
} catch {
    Write-Log "Error in Custom AI Training: $($_.Exception.Message)" "ERROR"
    throw
}
