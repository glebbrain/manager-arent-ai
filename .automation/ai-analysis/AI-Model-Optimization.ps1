# AI Model Optimization Script v2.5
# Performance optimization for AI models

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$ModelPath = "",
    
    [Parameter(Mandatory=$false)]
    [string]$OptimizationType = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "optimized_models",
    
    [Parameter(Mandatory=$false)]
    [int]$QuantizationBits = 8,
    
    [Parameter(Mandatory=$false)]
    [switch]$Quantize,
    
    [Parameter(Mandatory=$false)]
    [switch]$Prune,
    
    [Parameter(Mandatory=$false)]
    [switch]$Distill,
    
    [Parameter(Mandatory=$false)]
    [switch]$Benchmark,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Optimization Configuration
$OptimizationConfig = @{
    SupportedTypes = @{
        "quantization" = @{
            Description = "Model quantization for reduced size and faster inference"
            Methods = @("int8", "int4", "dynamic", "static")
            Benefits = @("Reduced memory usage", "Faster inference", "Smaller model size")
        }
        "pruning" = @{
            Description = "Model pruning to remove unnecessary parameters"
            Methods = @("magnitude", "structured", "unstructured")
            Benefits = @("Reduced model size", "Faster inference", "Lower memory usage")
        }
        "distillation" = @{
            Description = "Knowledge distillation to create smaller models"
            Methods = @("teacher-student", "self-distillation")
            Benefits = @("Smaller model", "Maintained performance", "Faster inference")
        }
        "optimization" = @{
            Description = "General model optimization techniques"
            Methods = @("graph_optimization", "operator_fusion", "memory_optimization")
            Benefits = @("Better performance", "Lower memory usage", "Faster inference")
        }
    }
    BenchmarkConfig = @{
        BatchSizes = @(1, 4, 8, 16)
        SequenceLengths = @(128, 256, 512, 1024)
        Iterations = 100
        WarmupIterations = 10
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
    $logFile = Join-Path $ProjectPath "logs\ai-model-optimization.log"
    $logDir = Split-Path $logFile -Parent
    if (!(Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    Add-Content -Path $logFile -Value $logMessage
}

function Initialize-OptimizationEnvironment {
    param(
        [string]$ProjectPath
    )
    
    Write-Log "Initializing optimization environment"
    
    # Create necessary directories
    $dirs = @("optimized_models", "benchmarks", "logs", "reports")
    foreach ($dir in $dirs) {
        $dirPath = Join-Path $ProjectPath $dir
        if (!(Test-Path $dirPath)) {
            New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
            Write-Log "Created directory: $dirPath"
        }
    }
    
    # Install required packages
    $packages = @(
        "torch>=2.0.0",
        "transformers>=4.30.0",
        "accelerate>=0.20.0",
        "bitsandbytes>=0.41.0",
        "optimum>=1.12.0",
        "onnx>=1.14.0",
        "onnxruntime>=1.15.0",
        "psutil>=5.9.0",
        "memory-profiler>=0.60.0"
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

function Optimize-Quantization {
    param(
        [string]$ModelPath,
        [string]$OutputPath,
        [int]$QuantizationBits
    )
    
    Write-Log "Starting model quantization with $QuantizationBits bits"
    
    $quantizationScript = @"
import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from optimum.bettertransformer import BetterTransformer
import psutil
import time

MODEL_PATH = "$ModelPath"
OUTPUT_PATH = "$OutputPath"
QUANTIZATION_BITS = $QuantizationBits

def quantize_model(model_path, output_path, bits):
    print(f"Loading model from {model_path}")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch.float16,
        device_map="auto"
    )
    
    print(f"Original model size: {get_model_size(model)} MB")
    
    # Quantize model
    if bits == 8:
        from transformers import BitsAndBytesConfig
        quantization_config = BitsAndBytesConfig(
            load_in_8bit=True,
            llm_int8_threshold=6.0
        )
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            quantization_config=quantization_config,
            device_map="auto"
        )
    elif bits == 4:
        from transformers import BitsAndBytesConfig
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4"
        )
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            quantization_config=quantization_config,
            device_map="auto"
        )
    
    print(f"Quantized model size: {get_model_size(model)} MB")
    
    # Save quantized model
    model.save_pretrained(output_path)
    tokenizer.save_pretrained(output_path)
    
    print(f"Quantized model saved to {output_path}")

def get_model_size(model):
    param_size = 0
    for param in model.parameters():
        param_size += param.nelement() * param.element_size()
    buffer_size = 0
    for buffer in model.buffers():
        buffer_size += buffer.nelement() * buffer.element_size()
    size_all_mb = (param_size + buffer_size) / 1024**2
    return size_all_mb

def benchmark_model(model, tokenizer, test_inputs):
    model.eval()
    times = []
    memory_usage = []
    
    for input_text in test_inputs:
        inputs = tokenizer(input_text, return_tensors="pt", truncation=True, max_length=512)
        
        # Measure memory before
        memory_before = psutil.Process().memory_info().rss / 1024**2
        
        # Measure inference time
        start_time = time.time()
        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                max_length=100,
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True
            )
        end_time = time.time()
        
        # Measure memory after
        memory_after = psutil.Process().memory_info().rss / 1024**2
        
        times.append(end_time - start_time)
        memory_usage.append(memory_after - memory_before)
    
    return {
        'avg_inference_time': sum(times) / len(times),
        'avg_memory_usage': sum(memory_usage) / len(memory_usage),
        'total_samples': len(test_inputs)
    }

def main():
    # Create output directory
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    
    # Quantize model
    quantize_model(MODEL_PATH, OUTPUT_PATH, QUANTIZATION_BITS)
    
    # Load quantized model for benchmarking
    tokenizer = AutoTokenizer.from_pretrained(OUTPUT_PATH)
    model = AutoModelForCausalLM.from_pretrained(OUTPUT_PATH)
    
    # Benchmark
    test_inputs = [
        "def calculate_fibonacci(n):",
        "class User:",
        "import pandas as pd",
        "def process_data(data):"
    ]
    
    results = benchmark_model(model, tokenizer, test_inputs)
    
    print(f"Benchmark Results:")
    print(f"Average inference time: {results['avg_inference_time']:.4f} seconds")
    print(f"Average memory usage: {results['avg_memory_usage']:.2f} MB")
    print(f"Total samples tested: {results['total_samples']}")

if __name__ == "__main__":
    main()
"@
    
    $scriptPath = Join-Path $ProjectPath "temp_quantization_script.py"
    Set-Content -Path $scriptPath -Value $quantizationScript -Encoding UTF8
    
    try {
        Write-Log "Running quantization script..."
        python $scriptPath
        Write-Log "Quantization completed successfully"
    } catch {
        Write-Log "Quantization failed: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Remove-Item $scriptPath -Force
    }
}

function Optimize-Pruning {
    param(
        [string]$ModelPath,
        [string]$OutputPath
    )
    
    Write-Log "Starting model pruning"
    
    $pruningScript = @"
import os
import torch
import torch.nn.utils.prune as prune
from transformers import AutoTokenizer, AutoModelForCausalLM
import psutil
import time

MODEL_PATH = "$ModelPath"
OUTPUT_PATH = "$OutputPath"

def prune_model(model_path, output_path, sparsity=0.1):
    print(f"Loading model from {model_path}")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch.float16,
        device_map="auto"
    )
    
    print(f"Original model size: {get_model_size(model)} MB")
    
    # Prune model
    parameters_to_prune = []
    for name, module in model.named_modules():
        if isinstance(module, torch.nn.Linear):
            parameters_to_prune.append((module, 'weight'))
    
    prune.global_unstructured(
        parameters_to_prune,
        pruning_method=prune.L1Unstructured,
        amount=sparsity,
    )
    
    # Remove pruning reparameterization
    for module, param_name in parameters_to_prune:
        prune.remove(module, param_name)
    
    print(f"Pruned model size: {get_model_size(model)} MB")
    
    # Save pruned model
    model.save_pretrained(output_path)
    tokenizer.save_pretrained(output_path)
    
    print(f"Pruned model saved to {output_path}")

def get_model_size(model):
    param_size = 0
    for param in model.parameters():
        param_size += param.nelement() * param.element_size()
    buffer_size = 0
    for buffer in model.buffers():
        buffer_size += buffer.nelement() * buffer.element_size()
    size_all_mb = (param_size + buffer_size) / 1024**2
    return size_all_mb

def benchmark_model(model, tokenizer, test_inputs):
    model.eval()
    times = []
    memory_usage = []
    
    for input_text in test_inputs:
        inputs = tokenizer(input_text, return_tensors="pt", truncation=True, max_length=512)
        
        # Measure memory before
        memory_before = psutil.Process().memory_info().rss / 1024**2
        
        # Measure inference time
        start_time = time.time()
        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                max_length=100,
                num_return_sequences=1,
                temperature=0.7,
                do_sample=True
            )
        end_time = time.time()
        
        # Measure memory after
        memory_after = psutil.Process().memory_info().rss / 1024**2
        
        times.append(end_time - start_time)
        memory_usage.append(memory_after - memory_before)
    
    return {
        'avg_inference_time': sum(times) / len(times),
        'avg_memory_usage': sum(memory_usage) / len(memory_usage),
        'total_samples': len(test_inputs)
    }

def main():
    # Create output directory
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    
    # Prune model
    prune_model(MODEL_PATH, OUTPUT_PATH, sparsity=0.1)
    
    # Load pruned model for benchmarking
    tokenizer = AutoTokenizer.from_pretrained(OUTPUT_PATH)
    model = AutoModelForCausalLM.from_pretrained(OUTPUT_PATH)
    
    # Benchmark
    test_inputs = [
        "def calculate_fibonacci(n):",
        "class User:",
        "import pandas as pd",
        "def process_data(data):"
    ]
    
    results = benchmark_model(model, tokenizer, test_inputs)
    
    print(f"Benchmark Results:")
    print(f"Average inference time: {results['avg_inference_time']:.4f} seconds")
    print(f"Average memory usage: {results['avg_memory_usage']:.2f} MB")
    print(f"Total samples tested: {results['total_samples']}")

if __name__ == "__main__":
    main()
"@
    
    $scriptPath = Join-Path $ProjectPath "temp_pruning_script.py"
    Set-Content -Path $scriptPath -Value $pruningScript -Encoding UTF8
    
    try {
        Write-Log "Running pruning script..."
        python $scriptPath
        Write-Log "Pruning completed successfully"
    } catch {
        Write-Log "Pruning failed: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Remove-Item $scriptPath -Force
    }
}

function Optimize-Distillation {
    param(
        [string]$ModelPath,
        [string]$OutputPath
    )
    
    Write-Log "Starting knowledge distillation"
    
    $distillationScript = @"
import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from datasets import Dataset
import json

TEACHER_MODEL_PATH = "$ModelPath"
OUTPUT_PATH = "$OutputPath"

class DistilledModel(nn.Module):
    def __init__(self, teacher_model, student_hidden_size=256):
        super().__init__()
        self.teacher = teacher_model
        self.student_hidden_size = student_hidden_size
        
        # Create smaller student model
        self.embedding = nn.Embedding(teacher_model.config.vocab_size, student_hidden_size)
        self.transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(student_hidden_size, nhead=8, batch_first=True),
            num_layers=4
        )
        self.lm_head = nn.Linear(student_hidden_size, teacher_model.config.vocab_size)
        
    def forward(self, input_ids, labels=None):
        x = self.embedding(input_ids)
        x = self.transformer(x)
        logits = self.lm_head(x)
        
        if labels is not None:
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), labels.view(-1))
            return {"loss": loss, "logits": logits}
        
        return {"logits": logits}

def distill_model(teacher_path, output_path):
    print(f"Loading teacher model from {teacher_path}")
    tokenizer = AutoTokenizer.from_pretrained(teacher_path)
    teacher_model = AutoModelForCausalLM.from_pretrained(teacher_path)
    
    # Create student model
    student_model = DistilledModel(teacher_model)
    
    # Create sample training data
    sample_texts = [
        "def calculate_fibonacci(n): return n if n <= 1 else calculate_fibonacci(n-1) + calculate_fibonacci(n-2)",
        "class User: def __init__(self, name): self.name = name",
        "import pandas as pd; df = pd.read_csv('data.csv')",
        "def process_data(data): return [x * 2 for x in data if x > 0]"
    ]
    
    # Tokenize data
    tokenized_data = []
    for text in sample_texts:
        tokens = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
        tokenized_data.append({
            "input_ids": tokens["input_ids"].squeeze(),
            "labels": tokens["input_ids"].squeeze()
        })
    
    dataset = Dataset.from_list(tokenized_data)
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=output_path,
        num_train_epochs=3,
        per_device_train_batch_size=2,
        learning_rate=5e-4,
        logging_steps=10,
        save_steps=100,
        evaluation_strategy="no",
        save_strategy="steps",
        report_to=None
    )
    
    # Custom data collator
    def data_collator(features):
        batch = {}
        batch["input_ids"] = torch.stack([f["input_ids"] for f in features])
        batch["labels"] = torch.stack([f["labels"] for f in features])
        return batch
    
    # Trainer
    trainer = Trainer(
        model=student_model,
        args=training_args,
        train_dataset=dataset,
        data_collator=data_collator,
        tokenizer=tokenizer
    )
    
    print("Starting distillation training...")
    trainer.train()
    
    # Save student model
    trainer.save_model()
    tokenizer.save_pretrained(output_path)
    
    print(f"Distilled model saved to {output_path}")

def main():
    # Create output directory
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    
    # Distill model
    distill_model(TEACHER_MODEL_PATH, OUTPUT_PATH)
    
    print("Knowledge distillation completed successfully!")

if __name__ == "__main__":
    main()
"@
    
    $scriptPath = Join-Path $ProjectPath "temp_distillation_script.py"
    Set-Content -Path $scriptPath -Value $distillationScript -Encoding UTF8
    
    try {
        Write-Log "Running distillation script..."
        python $scriptPath
        Write-Log "Distillation completed successfully"
    } catch {
        Write-Log "Distillation failed: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Remove-Item $scriptPath -Force
    }
}

function Benchmark-Model {
    param(
        [string]$ModelPath,
        [string]$ProjectPath
    )
    
    Write-Log "Starting model benchmarking"
    
    $benchmarkScript = @"
import os
import torch
import time
import psutil
import json
from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL_PATH = "$ModelPath"
BENCHMARK_CONFIG = {
    "batch_sizes": [1, 4, 8, 16],
    "sequence_lengths": [128, 256, 512, 1024],
    "iterations": 100,
    "warmup_iterations": 10
}

def benchmark_model(model_path, config):
    print(f"Loading model from {model_path}")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(model_path)
    model.eval()
    
    results = {}
    
    for batch_size in config["batch_sizes"]:
        for seq_len in config["sequence_lengths"]:
            print(f"Benchmarking batch_size={batch_size}, seq_len={seq_len}")
            
            # Create test input
            test_input = "def test_function():"
            inputs = tokenizer(
                [test_input] * batch_size,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=seq_len
            )
            
            # Warmup
            for _ in range(config["warmup_iterations"]):
                with torch.no_grad():
                    _ = model.generate(
                        inputs.input_ids,
                        max_length=seq_len + 50,
                        num_return_sequences=1,
                        temperature=0.7,
                        do_sample=True
                    )
            
            # Benchmark
            times = []
            memory_usage = []
            
            for i in range(config["iterations"]):
                # Measure memory before
                memory_before = psutil.Process().memory_info().rss / 1024**2
                
                # Measure inference time
                start_time = time.time()
                with torch.no_grad():
                    outputs = model.generate(
                        inputs.input_ids,
                        max_length=seq_len + 50,
                        num_return_sequences=1,
                        temperature=0.7,
                        do_sample=True
                    )
                end_time = time.time()
                
                # Measure memory after
                memory_after = psutil.Process().memory_info().rss / 1024**2
                
                times.append(end_time - start_time)
                memory_usage.append(memory_after - memory_before)
            
            # Calculate statistics
            avg_time = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)
            avg_memory = sum(memory_usage) / len(memory_usage)
            
            key = f"batch_{batch_size}_seq_{seq_len}"
            results[key] = {
                "batch_size": batch_size,
                "sequence_length": seq_len,
                "avg_inference_time": avg_time,
                "min_inference_time": min_time,
                "max_inference_time": max_time,
                "avg_memory_usage": avg_memory,
                "iterations": config["iterations"]
            }
    
    return results

def main():
    results = benchmark_model(MODEL_PATH, BENCHMARK_CONFIG)
    
    # Save results
    output_path = os.path.join("$ProjectPath", "benchmarks", "benchmark_results.json")
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Benchmark results saved to {output_path}")
    
    # Print summary
    print("\\nBenchmark Summary:")
    for key, result in results.items():
        print(f"Batch {result['batch_size']}, Seq {result['sequence_length']}: "
              f"{result['avg_inference_time']:.4f}s avg, "
              f"{result['avg_memory_usage']:.2f}MB memory")

if __name__ == "__main__":
    main()
"@
    
    $scriptPath = Join-Path $ProjectPath "temp_benchmark_script.py"
    Set-Content -Path $scriptPath -Value $benchmarkScript -Encoding UTF8
    
    try {
        Write-Log "Running benchmark script..."
        python $scriptPath
        Write-Log "Benchmarking completed successfully"
    } catch {
        Write-Log "Benchmarking failed: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Remove-Item $scriptPath -Force
    }
}

# Main execution
try {
    Write-Log "Starting AI Model Optimization" "INFO"
    
    # Initialize optimization environment
    Initialize-OptimizationEnvironment -ProjectPath $ProjectPath
    
    # Set default model path if not provided
    if (!$ModelPath) {
        $ModelPath = Join-Path $ProjectPath "trained_models"
    }
    
    $outputPath = Join-Path $ProjectPath $OutputPath
    
    # Perform optimizations based on type
    switch ($OptimizationType.ToLower()) {
        "quantization" {
            if ($Quantize) {
                Optimize-Quantization -ModelPath $ModelPath -OutputPath $outputPath -QuantizationBits $QuantizationBits
            }
        }
        "pruning" {
            if ($Prune) {
                Optimize-Pruning -ModelPath $ModelPath -OutputPath $outputPath
            }
        }
        "distillation" {
            if ($Distill) {
                Optimize-Distillation -ModelPath $ModelPath -OutputPath $outputPath
            }
        }
        "all" {
            if ($Quantize) {
                Optimize-Quantization -ModelPath $ModelPath -OutputPath $outputPath -QuantizationBits $QuantizationBits
            }
            if ($Prune) {
                Optimize-Pruning -ModelPath $ModelPath -OutputPath $outputPath
            }
            if ($Distill) {
                Optimize-Distillation -ModelPath $ModelPath -OutputPath $outputPath
            }
        }
    }
    
    # Benchmark model if requested
    if ($Benchmark) {
        Benchmark-Model -ModelPath $outputPath -ProjectPath $ProjectPath
    }
    
    Write-Log "AI Model Optimization completed successfully" "INFO"
    
} catch {
    Write-Log "Error in AI Model Optimization: $($_.Exception.Message)" "ERROR"
    throw
}
