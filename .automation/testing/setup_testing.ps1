param(
    [switch]$Force
)

Write-Host "🧪 Setting up testing environment - IdealCompany" -ForegroundColor Cyan

# Detect project type
$projectType = "unknown"
if (Test-Path ".manager/IDEA.md") {
    $ideaContent = Get-Content ".manager/IDEA.md" -Raw
    if ($ideaContent -match "Machine Learning|AI") { $projectType = "ml" }
    elseif ($ideaContent -match "Web Application") { $projectType = "web" }
    elseif ($ideaContent -match "Mobile App") { $projectType = "mobile" }
    elseif ($ideaContent -match "Game Development") { $projectType = "game" }
    elseif ($ideaContent -match "IdealCompany") { $projectType = "idealcompany" }
}

Write-Host "🎯 Project type detected: $projectType" -ForegroundColor Yellow

# Create test directories
$testDirs = @("tests", "tests/unit", "tests/integration", "tests/e2e", "tests/automation")
foreach ($dir in $testDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "📁 Created $dir" -ForegroundColor Green
    }
}

# Setup testing frameworks based on project type
switch ($projectType) {
    "idealcompany" {
        Write-Host "🤖 Setting up IdealCompany testing..." -ForegroundColor Cyan
        
        # Create test configuration
        $testConfig = @"
# IdealCompany Test Configuration
# Universal testing setup for AI/RPA/Enterprise ecosystem

[test]
# Test directories
test_dirs = tests
unit_test_dir = tests/unit
integration_test_dir = tests/integration
e2e_test_dir = tests/e2e
automation_test_dir = tests/automation

# Test patterns
unit_pattern = test_*.py
integration_pattern = test_integration_*.py
e2e_pattern = test_e2e_*.py

# Coverage settings
coverage_threshold = 80
coverage_report = html

# Performance settings
performance_threshold = 2.0  # seconds
memory_threshold = 512  # MB
"@
        $testConfig | Out-File -FilePath "test_config.ini" -Encoding UTF8
        Write-Host "📄 Created test_config.ini" -ForegroundColor Green
        
        # Create sample test files
        $unitTest = @"
import pytest
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_project_structure():
    """Test that project structure is correct"""
    assert os.path.exists(".manager/IDEA.md")
    assert os.path.exists(".manager/TODO.md")
    assert os.path.exists(".manager/cursor.json")
    assert os.path.exists(".automation/validation/validate_project.ps1")

def test_automation_scripts():
    """Test that key automation scripts exist"""
    key_scripts = [
        ".automation/validation/validate_project.ps1",
        ".automation/project-management/Start-Project.ps1",
        ".automation/utilities/quick_fix.ps1"
    ]
    
    for script in key_scripts:
        assert os.path.exists(script), f"Missing script: {script}"

def test_control_files():
    """Test that control files are properly formatted"""
    # Test IDEA.md has content
    with open(".manager/IDEA.md", "r", encoding="utf-8") as f:
        content = f.read()
        assert "IdealCompany" in content
        assert "AI-Powered Enterprise Ecosystem" in content
    
    # Test TODO.md has tasks
    with open(".manager/TODO.md", "r", encoding="utf-8") as f:
        content = f.read()
        assert "🔴" in content or "🟠" in content  # Has priority tasks

if __name__ == "__main__":
    pytest.main([__file__])
"@
        $unitTest | Out-File -FilePath "tests/unit/test_project_structure.py" -Encoding UTF8
        Write-Host "📄 Created tests/unit/test_project_structure.py" -ForegroundColor Green
        
        # Create integration test
        $integrationTest = @"
import pytest
import subprocess
import os

def test_validation_script():
    """Test that validation script works"""
    result = subprocess.run([
        "powershell", "-Command", 
        ".\.automation\validation\validate_project.ps1 -Quiet"
    ], capture_output=True, text=True, cwd=os.getcwd())
    
    # Should return 0 for success
    assert result.returncode == 0, f"Validation failed: {result.stderr}"

def test_project_start_script():
    """Test that project start script works"""
    result = subprocess.run([
        "powershell", "-Command", 
        ".\.automation\project-management\Start-Project.ps1 -Quiet"
    ], capture_output=True, text=True, cwd=os.getcwd())
    
    # Should return 0 for success
    assert result.returncode == 0, f"Start script failed: {result.stderr}"

def test_quick_fix_script():
    """Test that quick fix script works"""
    result = subprocess.run([
        "powershell", "-Command", 
        ".\.automation\utilities\quick_fix.ps1 -All"
    ], capture_output=True, text=True, cwd=os.getcwd())
    
    # Should return 0 for success
    assert result.returncode == 0, f"Quick fix failed: {result.stderr}"

if __name__ == "__main__":
    pytest.main([__file__])
"@
        $integrationTest | Out-File -FilePath "tests/integration/test_automation_scripts.py" -Encoding UTF8
        Write-Host "📄 Created tests/integration/test_automation_scripts.py" -ForegroundColor Green
    }
    "ml" {
        Write-Host "🤖 Setting up ML testing..." -ForegroundColor Cyan
        $pytestConfig = @"
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --strict-markers
"@
        $pytestConfig | Out-File -FilePath "pytest.ini" -Encoding UTF8
    }
    "web" {
        Write-Host "🌐 Setting up Web testing..." -ForegroundColor Cyan
        if (Test-Path "package.json") {
            $jestConfig = @"
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"]
  }
}
"@
            $jestConfig | Out-File -FilePath "jest.config.json" -Encoding UTF8
        }
    }
    "mobile" {
        Write-Host "📱 Setting up Mobile testing..." -ForegroundColor Cyan
        if (Test-Path "pubspec.yaml") {
            $flutterTest = @"
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('App should build without errors', (WidgetTester tester) async {
    // Test widget building
  });
  
  group('Unit Tests', () {
    test('Business logic tests', () {
      // Unit tests here
    });
  });
  
  group('Integration Tests', () {
    testWidgets('User flow tests', (WidgetTester tester) async {
      // Integration tests here
    });
  });
}
"@
            $flutterTest | Out-File -FilePath "test/widget_test.dart" -Encoding UTF8
        }
    }
}

Write-Host "✅ Testing environment setup complete!" -ForegroundColor Green
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run tests: .\\.automation\\testing\\run_tests.ps1" -ForegroundColor White
Write-Host "  2. Check coverage: .\\.automation\\testing\\test_coverage.ps1" -ForegroundColor White
Write-Host "  3. Run specific tests: pytest tests/unit/ or npm test" -ForegroundColor White