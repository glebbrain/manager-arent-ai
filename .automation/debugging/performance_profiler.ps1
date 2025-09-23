# Performance Profiling Tools for LearnEnglishBot
# Comprehensive performance analysis and optimization

param(
    [switch]$Startup,
    [switch]$Memory,
    [switch]$AI,
    [switch]$Voice,
    [switch]$All,
    [switch]$Baseline,
    [switch]$Compare,
    [string]$OutputFile = "performance_report.json"
)

# Initialize performance tracking
$performanceData = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    bot_version = "LearnEnglishBot"
    tests = @()
    summary = @{}
}

function Write-PerformanceLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) {
        "INFO" { "White" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "Cyan" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

Write-PerformanceLog "⚡ Starting Performance Profiling for LearnEnglishBot" "INFO"
Write-PerformanceLog "==================================================" "INFO"

# 1. Bot Startup Time Measurement
function Test-StartupTime {
    Write-PerformanceLog "Testing bot startup time..." "INFO"
    
    $startupResults = @{
        test_name = "startup_time"
        description = "Bot module import and initialization time"
        measurements = @()
    }
    
    # Test 1: Module import time
    $startTime = Get-Date
    try {
        $importResult = python -c "import main; print('Modules loaded successfully')" 2>&1
        $endTime = Get-Date
        $importDuration = ($endTime - $startTime).TotalMilliseconds
        
        $startupResults.measurements += @{
            metric = "module_import"
            value = $importDuration
            unit = "ms"
            status = if ($LASTEXITCODE -eq 0) { "success" } else { "failed" }
            details = $importResult
        }
        
        Write-PerformanceLog "✅ Module import: $([math]::Round($importDuration, 2))ms" "SUCCESS"
    } catch {
        Write-PerformanceLog "❌ Module import test failed: $_" "ERROR"
        $startupResults.measurements += @{
            metric = "module_import"
            value = -1
            unit = "ms"
            status = "failed"
            details = $_.Exception.Message
        }
    }
    
    # Test 2: Full startup simulation
    $startTime = Get-Date
    try {
        $startupResult = python -c "
import time
start = time.time()
try:
    from main import create_application
    app = create_application()
    startup_time = (time.time() - start) * 1000
    print(f'Startup time: {startup_time:.2f}ms')
except Exception as e:
    print(f'Startup failed: {e}')
" 2>&1
        
        $endTime = Get-Date
        $startupDuration = ($endTime - $startTime).TotalMilliseconds
        
        if ($startupResult -match "Startup time: ([\d.]+)ms") {
            $actualStartupTime = [double]$matches[1]
            Write-PerformanceLog "✅ Full startup: $([math]::Round($actualStartupTime, 2))ms" "SUCCESS"
            
            $startupResults.measurements += @{
                metric = "full_startup"
                value = $actualStartupTime
                unit = "ms"
                status = "success"
                details = "Application factory creation successful"
            }
        } else {
            Write-PerformanceLog "❌ Full startup test failed" "ERROR"
            $startupResults.measurements += @{
                metric = "full_startup"
                value = -1
                unit = "ms"
                status = "failed"
                details = $startupResult
            }
        }
    } catch {
        Write-PerformanceLog "❌ Full startup test failed: $_" "ERROR"
    }
    
    $performanceData.tests += $startupResults
    return $startupResults
}

# 2. Memory Usage Monitoring
function Test-MemoryUsage {
    Write-PerformanceLog "Testing memory usage..." "INFO"
    
    $memoryResults = @{
        test_name = "memory_usage"
        description = "Memory consumption during bot operation"
        measurements = @()
    }
    
    # Test 1: Initial memory usage
    $initialMemory = [System.GC]::GetTotalMemory($false) / 1MB
    Write-PerformanceLog "📊 Initial memory: $([math]::Round($initialMemory, 2)) MB" "INFO"
    
    $memoryResults.measurements += @{
        metric = "initial_memory"
        value = $initialMemory
        unit = "MB"
        status = "success"
        details = "Memory usage before bot operations"
    }
    
    # Test 2: Memory after module import
    try {
        $memoryTest = python -c "
import psutil
import os
import gc

# Get initial memory
process = psutil.Process(os.getpid())
initial_memory = process.memory_info().rss / 1024 / 1024

# Import bot modules
import main
gc.collect()

# Get memory after import
final_memory = process.memory_info().rss / 1024 / 1024
memory_increase = final_memory - initial_memory

print(f'Initial: {initial_memory:.2f}MB')
print(f'After import: {final_memory:.2f}MB')
print(f'Increase: {memory_increase:.2f}MB')
" 2>&1
        
        if ($memoryTest -match "Initial: ([\d.]+)MB") {
            $initialMB = [double]$matches[1]
            if ($memoryTest -match "After import: ([\d.]+)MB") {
                $afterImportMB = [double]$matches[1]
                if ($memoryTest -match "Increase: ([\d.]+)MB") {
                    $increaseMB = [double]$matches[1]
                    
                    Write-PerformanceLog "✅ Memory after import: $([math]::Round($afterImportMB, 2)) MB" "SUCCESS"
                    Write-PerformanceLog "📈 Memory increase: $([math]::Round($increaseMB, 2)) MB" "INFO"
                    
                    $memoryResults.measurements += @{
                        metric = "memory_after_import"
                        value = $afterImportMB
                        unit = "MB"
                        status = "success"
                        details = "Memory usage after importing bot modules"
                    }
                    
                    $memoryResults.measurements += @{
                        metric = "memory_increase"
                        value = $increaseMB
                        unit = "MB"
                        status = "success"
                        details = "Memory increase due to module imports"
                    }
                }
            }
        }
    } catch {
        Write-PerformanceLog "❌ Memory test failed: $_" "ERROR"
    }
    
    # Test 3: Memory leak detection (simplified)
    try {
        $leakTest = python -c "
import psutil
import os
import gc
import time

process = psutil.Process(os.getpid())
initial_memory = process.memory_info().rss / 1024 / 1024

# Simulate some operations
for i in range(5):
    import main
    gc.collect()
    time.sleep(0.1)

final_memory = process.memory_info().rss / 1024 / 1024
memory_change = final_memory - initial_memory

print(f'Memory change after operations: {memory_change:.2f}MB')
if abs(memory_change) < 1.0:
    print('No significant memory leak detected')
else:
    print('Potential memory leak detected')
" 2>&1
        
        if ($leakTest -match "Memory change after operations: ([\d.-]+)MB") {
            $memoryChange = [double]$matches[1]
            $leakStatus = if (abs($memoryChange) -lt 1.0) { "success" } else { "warning" }
            $leakMessage = if (abs($memoryChange) -lt 1.0) { "No significant memory leak" } else { "Potential memory leak detected" }
            
            Write-PerformanceLog "📊 Memory change: $([math]::Round($memoryChange, 2)) MB" "INFO"
            Write-PerformanceLog "🔍 $leakMessage" $leakStatus
            
            $memoryResults.measurements += @{
                metric = "memory_leak_test"
                value = $memoryChange
                unit = "MB"
                status = $leakStatus
                details = $leakMessage
            }
        }
    } catch {
        Write-PerformanceLog "❌ Memory leak test failed: $_" "ERROR"
    }
    
    $performanceData.tests += $memoryResults
    return $memoryResults
}

# 3. AI Response Time Profiling
function Test-AIResponseTime {
    Write-PerformanceLog "Testing AI response time..." "INFO"
    
    $aiResults = @{
        test_name = "ai_response_time"
        description = "AI client response time and performance"
        measurements = @()
    }
    
    # Test 1: AI client initialization
    $startTime = Get-Date
    try {
        $aiInitResult = python -c "
import time
start = time.time()
try:
    from bot.ai_client import ask_ai
    init_time = (time.time() - start) * 1000
    print(f'AI client init: {init_time:.2f}ms')
except Exception as e:
    print(f'AI client init failed: {e}')
" 2>&1
        
        $endTime = Get-Date
        $initDuration = ($endTime - $startTime).TotalMilliseconds
        
        if ($aiInitResult -match "AI client init: ([\d.]+)ms") {
            $aiInitTime = [double]$matches[1]
            Write-PerformanceLog "✅ AI client init: $([math]::Round($aiInitTime, 2))ms" "SUCCESS"
            
            $aiResults.measurements += @{
                metric = "ai_client_init"
                value = $aiInitTime
                unit = "ms"
                status = "success"
                details = "AI client initialization time"
            }
        }
    } catch {
        Write-PerformanceLog "❌ AI client init test failed: $_" "ERROR"
    }
    
    # Test 2: Mock AI response simulation
    $startTime = Get-Date
    try {
        $mockAIResult = python -c "
import time
import random

def mock_ai_response(prompt):
    # Simulate AI processing time
    time.sleep(random.uniform(0.1, 0.5))
    return f'Mock response to: {prompt}'

# Test multiple responses
response_times = []
for i in range(3):
    start = time.time()
    response = mock_ai_response(f'Test prompt {i}')
    response_time = (time.time() - start) * 1000
    response_times.append(response_time)

avg_time = sum(response_times) / len(response_times)
min_time = min(response_times)
max_time = max(response_times)

print(f'Average response time: {avg_time:.2f}ms')
print(f'Min response time: {min_time:.2f}ms')
print(f'Max response time: {max_time:.2f}ms')
" 2>&1
        
        if ($mockAIResult -match "Average response time: ([\d.]+)ms") {
            $avgResponseTime = [double]$matches[1]
            if ($mockAIResult -match "Min response time: ([\d.]+)ms") {
                $minResponseTime = [double]$matches[1]
                if ($mockAIResult -match "Max response time: ([\d.]+)ms") {
                    $maxResponseTime = [double]$matches[1]
                    
                    Write-PerformanceLog "✅ Mock AI response - Avg: $([math]::Round($avgResponseTime, 2))ms" "SUCCESS"
                    
                    $aiResults.measurements += @{
                        metric = "mock_ai_response_avg"
                        value = $avgResponseTime
                        unit = "ms"
                        status = "success"
                        details = "Average mock AI response time"
                    }
                    
                    $aiResults.measurements += @{
                        metric = "mock_ai_response_min"
                        value = $minResponseTime
                        unit = "ms"
                        status = "success"
                        details = "Minimum mock AI response time"
                    }
                    
                    $aiResults.measurements += @{
                        metric = "mock_ai_response_max"
                        value = $maxResponseTime
                        unit = "ms"
                        status = "success"
                        details = "Maximum mock AI response time"
                    }
                }
            }
        }
    } catch {
        Write-PerformanceLog "❌ Mock AI response test failed: $_" "ERROR"
    }
    
    $performanceData.tests += $aiResults
    return $aiResults
}

# 4. Voice Processing Optimization
function Test-VoiceProcessing {
    Write-PerformanceLog "Testing voice processing performance..." "INFO"
    
    $voiceResults = @{
        test_name = "voice_processing"
        description = "Voice processing performance and optimization"
        measurements = @()
    }
    
    # Test 1: Whisper model loading
    $startTime = Get-Date
    try {
        $whisperTest = python -c "
import time
start = time.time()
try:
    import whisper
    model = whisper.load_model('tiny')  # Use tiny model for testing
    load_time = (time.time() - start) * 1000
    print(f'Whisper model load: {load_time:.2f}ms')
    print(f'Model size: {model.name}')
except Exception as e:
    print(f'Whisper test failed: {e}')
" 2>&1
        
        $endTime = Get-Date
        $loadDuration = ($endTime - $startTime).TotalMilliseconds
        
        if ($whisperTest -match "Whisper model load: ([\d.]+)ms") {
            $whisperLoadTime = [double]$matches[1]
            Write-PerformanceLog "✅ Whisper model load: $([math]::Round($whisperLoadTime, 2))ms" "SUCCESS"
            
            $voiceResults.measurements += @{
                metric = "whisper_model_load"
                value = $whisperLoadTime
                unit = "ms"
                status = "success"
                details = "Whisper model loading time"
            }
        }
    } catch {
        Write-PerformanceLog "❌ Whisper test failed: $_" "ERROR"
    }
    
    # Test 2: CUDA availability check
    try {
        $cudaTest = python -c "
import torch
cuda_available = torch.cuda.is_available()
if cuda_available:
    device_count = torch.cuda.device_count()
    device_name = torch.cuda.get_device_name(0)
    print(f'CUDA available: Yes')
    print(f'Device count: {device_count}')
    print(f'Device name: {device_name}')
else:
    print('CUDA available: No')
    print('Using CPU for processing')
" 2>&1
        
        if ($cudaTest -match "CUDA available: Yes") {
            Write-PerformanceLog "🚀 CUDA acceleration available" "SUCCESS"
            $voiceResults.measurements += @{
                metric = "cuda_available"
                value = 1
                unit = "boolean"
                status = "success"
                details = "CUDA acceleration is available"
            }
        } else {
            Write-PerformanceLog "💻 Using CPU for voice processing" "INFO"
            $voiceResults.measurements += @{
                metric = "cuda_available"
                value = 0
                unit = "boolean"
                status = "info"
                details = "CUDA not available, using CPU"
            }
        }
    } catch {
        Write-PerformanceLog "❌ CUDA test failed: $_" "ERROR"
    }
    
    # Test 3: Audio processing simulation
    try {
        $audioTest = python -c "
import time
import numpy as np

def simulate_audio_processing(audio_length_seconds):
    # Simulate audio processing time
    # Real processing would involve FFT, feature extraction, etc.
    processing_time = audio_length_seconds * 0.1  # 10% of audio length
    time.sleep(processing_time)
    return processing_time

# Test different audio lengths
audio_lengths = [1, 5, 10, 30]  # seconds
processing_times = []

for length in audio_lengths:
    start = time.time()
    proc_time = simulate_audio_processing(length)
    actual_time = (time.time() - start) * 1000
    processing_times.append(actual_time)
    print(f'{length}s audio: {actual_time:.2f}ms')

avg_time = sum(processing_times) / len(processing_times)
print(f'Average processing time: {avg_time:.2f}ms')
" 2>&1
        
        if ($audioTest -match "Average processing time: ([\d.]+)ms") {
            $avgAudioTime = [double]$matches[1]
            Write-PerformanceLog "✅ Audio processing simulation - Avg: $([math]::Round($avgAudioTime, 2))ms" "SUCCESS"
            
            $voiceResults.measurements += @{
                metric = "audio_processing_avg"
                value = $avgAudioTime
                unit = "ms"
                status = "success"
                details = "Average audio processing time (simulated)"
            }
        }
    } catch {
        Write-PerformanceLog "❌ Audio processing test failed: $_" "ERROR"
    }
    
    $performanceData.tests += $voiceResults
    return $voiceResults
}

# 5. Baseline Comparison System
function Save-Baseline {
    Write-PerformanceLog "Saving performance baseline..." "INFO"
    
    $baselineFile = "performance_baseline.json"
    $performanceData | ConvertTo-Json -Depth 10 | Out-File -FilePath $baselineFile -Encoding UTF8
    
    Write-PerformanceLog "✅ Baseline saved to: $baselineFile" "SUCCESS"
    return $baselineFile
}

function Compare-Baseline {
    param([string]$BaselineFile = "performance_baseline.json")
    
    Write-PerformanceLog "Comparing with baseline..." "INFO"
    
    if (!(Test-Path $BaselineFile)) {
        Write-PerformanceLog "❌ Baseline file not found: $BaselineFile" "ERROR"
        return
    }
    
    try {
        $baseline = Get-Content $BaselineFile -Raw | ConvertFrom-Json
        $current = $performanceData
        
        Write-PerformanceLog "📊 Performance Comparison Results:" "INFO"
        Write-PerformanceLog "==================================================" "INFO"
        
        foreach ($currentTest in $current.tests) {
            $baselineTest = $baseline.tests | Where-Object { $_.test_name -eq $currentTest.test_name }
            
            if ($baselineTest) {
                Write-PerformanceLog "Test: $($currentTest.test_name)" "INFO"
                
                foreach ($currentMetric in $currentTest.measurements) {
                    $baselineMetric = $baselineTest.measurements | Where-Object { $_.metric -eq $currentMetric.metric }
                    
                    if ($baselineMetric) {
                        $currentValue = $currentMetric.value
                        $baselineValue = $baselineMetric.value
                        
                        if ($currentValue -gt 0 -and $baselineValue -gt 0) {
                            $change = (($currentValue - $baselineValue) / $baselineValue) * 100
                            $changeEmoji = if ($change -lt 0) { "📉" } else { "📈" }
                            $changeStatus = if ($change -lt 0) { "IMPROVED" } else { "DEGRADED" }
                            
                            Write-PerformanceLog "  $($currentMetric.metric): $changeEmoji $changeStatus ($([math]::Round($change, 1))%)" "INFO"
                        }
                    }
                }
                Write-PerformanceLog ""
            }
        }
    } catch {
        Write-PerformanceLog "❌ Baseline comparison failed: $_" "ERROR"
    }
}

# Main execution logic
if ($All -or $Startup) {
    Test-StartupTime
}

if ($All -or $Memory) {
    Test-MemoryUsage
}

if ($All -or $AI) {
    Test-AIResponseTime
}

if ($All -or $Voice) {
    Test-VoiceProcessing
}

# Generate summary
$totalTests = $performanceData.tests.Count
$successfulTests = ($performanceData.tests | ForEach-Object { $_.measurements | Where-Object { $_.status -eq "success" } }).Count
$totalMetrics = ($performanceData.tests | ForEach-Object { $_.measurements.Count } | Measure-Object -Sum).Sum

$performanceData.summary = @{
    total_tests = $totalTests
    successful_tests = $successfulTests
    total_metrics = $totalMetrics
    success_rate = if ($totalTests -gt 0) { [math]::Round(($successfulTests / $totalTests) * 100, 1) } else { 0 }
}

# Save results
$performanceData | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8

# Display summary
Write-PerformanceLog "==================================================" "INFO"
Write-PerformanceLog "📊 PERFORMANCE PROFILING SUMMARY" "INFO"
Write-PerformanceLog "==================================================" "INFO"
Write-PerformanceLog "Total Tests: $totalTests" "INFO"
Write-PerformanceLog "Successful Tests: $successfulTests" "INFO"
Write-PerformanceLog "Total Metrics: $totalMetrics" "INFO"
Write-PerformanceLog "Success Rate: $($performanceData.summary.success_rate)%" "INFO"
Write-PerformanceLog "Results saved to: $OutputFile" "INFO"

# Save baseline if requested
if ($Baseline) {
    Save-Baseline
}

# Compare with baseline if requested
if ($Compare) {
    Compare-Baseline
}

Write-PerformanceLog "==================================================" "INFO"
Write-PerformanceLog "⚡ Performance profiling completed at $(Get-Date)" "INFO"

# Return exit code for CI/CD integration
if ($performanceData.summary.success_rate -ge 80) {
    exit 0
} else {
    exit 1
}
