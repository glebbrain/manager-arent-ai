# Production Security Audit Checklist for LearnEnglishBot
# Comprehensive security validation before deployment

param(
    [switch]$Detailed,
    [switch]$Fix,
    [string]$LogFile = "security_audit.log"
)

# Initialize logging
function Write-SecurityLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

Write-SecurityLog "🔐 Starting Production Security Audit for LearnEnglishBot" "INFO"
Write-SecurityLog "==================================================" "INFO"

# 1. Environment Variables Security Check
Write-SecurityLog "Checking environment variables security..." "INFO"
$envIssues = 0

# Check for .env file
if (Test-Path ".env") {
    Write-SecurityLog "⚠️  .env file found - ensure it's in .gitignore" "WARNING"
    $envIssues++
} else {
    Write-SecurityLog "✅ No .env file found in root directory" "INFO"
}

# Check for hardcoded secrets
Write-SecurityLog "Scanning for hardcoded secrets..." "INFO"
$secretPatterns = @(
    "sk-[a-zA-Z0-9]{48}",
    "bot[0-9]+:[a-zA-Z0-9_-]{35}",
    "ghp_[a-zA-Z0-9]{36}",
    "gho_[a-zA-Z0-9]{36}",
    "ghu_[a-zA-Z0-9]{36}",
    "ghs_[a-zA-Z0-9]{36}",
    "ghr_[a-zA-Z0-9]{36}"
)

$filesToScan = @(
    "*.py",
    "*.ps1",
    "*.json",
    "*.yml",
    "*.yaml",
    "*.md"
)

$secretsFound = 0
foreach ($pattern in $secretPatterns) {
    $results = Get-ChildItem -Recurse -Include $filesToScan | Select-String -Pattern $pattern -AllMatches
    if ($results) {
        Write-SecurityLog "❌ Potential secrets found with pattern: $pattern" "ERROR"
        $secretsFound++
        $envIssues++
    }
}

if ($secretsFound -eq 0) {
    Write-SecurityLog "✅ No hardcoded secrets found" "INFO"
}

# 2. File Permissions Check
Write-SecurityLog "Checking file permissions..." "INFO"
$permissionIssues = 0

$criticalFiles = @(
    ".env",
    "config/*.json",
    "data/*.json",
    "*.py"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        $acl = Get-Acl $file
        $permissions = $acl.Access | Where-Object { $_.FileSystemRights -match "FullControl|Modify" }
        if ($permissions) {
            Write-SecurityLog "⚠️  File $file has elevated permissions" "WARNING"
            $permissionIssues++
        }
    }
}

if ($permissionIssues -eq 0) {
    Write-SecurityLog "✅ File permissions are secure" "INFO"
}

# 3. Configuration Security Check
Write-SecurityLog "Checking configuration security..." "INFO"
$configIssues = 0

# Check config files
$configFiles = @("config/user_info.json", "config/referrals.json")
foreach ($configFile in $configFiles) {
    if (Test-Path $configFile) {
        try {
            $content = Get-Content $configFile -Raw | ConvertFrom-Json
            if ($content -and (Get-Member -InputObject $content -Name "password" -MemberType Properties)) {
                Write-SecurityLog "❌ Password found in plain text in $configFile" "ERROR"
                $configIssues++
            }
        } catch {
            Write-SecurityLog "⚠️  Could not parse $configFile" "WARNING"
        }
    }
}

# 4. Dependencies Security Check
Write-SecurityLog "Checking dependencies for security vulnerabilities..." "INFO"
$dependencyIssues = 0

if (Test-Path "requirements.txt") {
    Write-SecurityLog "Installing safety for dependency checking..." "INFO"
    try {
        pip install safety
        $safetyOutput = python -m safety check --json 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-SecurityLog "❌ Security vulnerabilities found in dependencies" "ERROR"
            Write-SecurityLog $safetyOutput "ERROR"
            $dependencyIssues++
        } else {
            Write-SecurityLog "✅ No security vulnerabilities in dependencies" "INFO"
        }
    } catch {
        Write-SecurityLog "⚠️  Could not run safety check" "WARNING"
    }
}

# 5. Code Quality Security Check
Write-SecurityLog "Running code security analysis..." "INFO"
$codeIssues = 0

try {
    pip install bandit
    $banditOutput = python -m bandit -r bot/ -f json 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-SecurityLog "❌ Security issues found in code" "ERROR"
        Write-SecurityLog $banditOutput "ERROR"
        $codeIssues++
    } else {
        Write-SecurityLog "✅ No security issues found in code" "INFO"
    }
} catch {
    Write-SecurityLog "⚠️  Could not run bandit security analysis" "WARNING"
}

# 6. Network Security Check
Write-SecurityLog "Checking network security configuration..." "INFO"
$networkIssues = 0

# Check for hardcoded URLs
$urlPatterns = @(
    "http://localhost",
    "http://127.0.0.1",
    "http://0.0.0.0"
)

foreach ($pattern in $urlPatterns) {
    $results = Get-ChildItem -Recurse -Include "*.py", "*.yml", "*.yaml" | Select-String -Pattern $pattern
    if ($results) {
        Write-SecurityLog "⚠️  Hardcoded localhost URLs found" "WARNING"
        $networkIssues++
    }
}

# 7. Logging Security Check
Write-SecurityLog "Checking logging security..." "INFO"
$loggingIssues = 0

# Check for sensitive data in logs
$logFiles = Get-ChildItem -Path "logs" -Filter "*.log" -ErrorAction SilentlyContinue
foreach ($logFile in $logFiles) {
    $sensitiveContent = Get-Content $logFile | Select-String -Pattern "password|token|key|secret" -CaseSensitive:$false
    if ($sensitiveContent) {
        Write-SecurityLog "⚠️  Sensitive data found in logs: $($logFile.Name)" "WARNING"
        $loggingIssues++
    }
}

# 8. Production Environment Check
Write-SecurityLog "Checking production environment readiness..." "INFO"
$productionIssues = 0

# Check for debug flags
$debugPatterns = @(
    "debug=True",
    "DEBUG=True",
    "development",
    "test"
)

foreach ($pattern in $debugPatterns) {
    $results = Get-ChildItem -Recurse -Include "*.py" | Select-String -Pattern $pattern
    if ($results) {
        Write-SecurityLog "⚠️  Debug/development flags found: $pattern" "WARNING"
        $productionIssues++
    }
}

# 9. Summary and Recommendations
Write-SecurityLog "==================================================" "INFO"
Write-SecurityLog "🔐 SECURITY AUDIT SUMMARY" "INFO"
Write-SecurityLog "==================================================" "INFO"

$totalIssues = $envIssues + $permissionIssues + $configIssues + $dependencyIssues + $codeIssues + $networkIssues + $loggingIssues + $productionIssues

if ($totalIssues -eq 0) {
    Write-SecurityLog "🎉 ALL CHECKS PASSED! Your bot is ready for production!" "INFO"
    Write-SecurityLog "✅ Security audit completed successfully" "INFO"
} else {
    Write-SecurityLog "❌ Security audit found $totalIssues issues that need attention" "ERROR"
    Write-SecurityLog "Please review and fix the issues above before deployment" "ERROR"
}

Write-SecurityLog "==================================================" "INFO"
Write-SecurityLog "📋 DETAILED BREAKDOWN:" "INFO"
Write-SecurityLog "  • Environment Variables: $envIssues issues" "INFO"
Write-SecurityLog "  • File Permissions: $permissionIssues issues" "INFO"
Write-SecurityLog "  • Configuration: $configIssues issues" "INFO"
Write-SecurityLog "  • Dependencies: $dependencyIssues issues" "INFO"
Write-SecurityLog "  • Code Quality: $codeIssues issues" "INFO"
Write-SecurityLog "  • Network Security: $networkIssues issues" "INFO"
Write-SecurityLog "  • Logging: $loggingIssues issues" "INFO"
Write-SecurityLog "  • Production Ready: $productionIssues issues" "INFO"

# 10. Recommendations
Write-SecurityLog "==================================================" "INFO"
Write-SecurityLog "💡 SECURITY RECOMMENDATIONS:" "INFO"
Write-SecurityLog "==================================================" "INFO"

if ($envIssues -gt 0) {
    Write-SecurityLog "  • Move all secrets to environment variables" "INFO"
    Write-SecurityLog "  • Ensure .env is in .gitignore" "INFO"
    Write-SecurityLog "  • Use secure secret management in production" "INFO"
}

if ($permissionIssues -gt 0) {
    Write-SecurityLog "  • Restrict file permissions to minimum required" "INFO"
    Write-SecurityLog "  • Use principle of least privilege" "INFO"
}

if ($dependencyIssues -gt 0) {
    Write-SecurityLog "  • Update vulnerable dependencies" "INFO"
    Write-SecurityLog "  • Regularly run security scans" "INFO"
}

if ($codeIssues -gt 0) {
    Write-SecurityLog "  • Review and fix security issues in code" "INFO"
    Write-SecurityLog "  • Implement secure coding practices" "INFO"
}

if ($productionIssues -gt 0) {
    Write-SecurityLog "  • Remove all debug/development flags" "INFO"
    Write-SecurityLog "  • Ensure production configuration is used" "INFO"
}

Write-SecurityLog "==================================================" "INFO"
Write-SecurityLog "🔐 Security audit completed at $(Get-Date)" "INFO"
Write-SecurityLog "Log saved to: $LogFile" "INFO"

# Return exit code for CI/CD integration
if ($totalIssues -gt 0) {
    exit 1
} else {
    exit 0
}
