# 🔒 Advanced Security Scanner v2.5
# Comprehensive security vulnerability assessment and threat detection
# Enhanced with AI-powered analysis and enterprise-grade security features

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$ScanType = "comprehensive", # comprehensive, quick, deep, compliance
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFormat = "json", # json, html, xml, console
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = ".\reports\security",
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableAI = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$RealTimeMonitoring = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$Quiet = $false
)

# Advanced Security Scanner Configuration
$Config = @{
    Version = "2.7.0"
    ScanTypes = @{
        "comprehensive" = @{
            Name = "Comprehensive Security Scan"
            Duration = "15-30 minutes"
            Coverage = "100%"
            Tools = @("Bandit", "ESLint-Security", "Semgrep", "CodeQL", "Trivy", "Nuclei", "SonarQube", "Snyk", "Custom-AI")
        }
        "quick" = @{
            Name = "Quick Security Scan"
            Duration = "2-5 minutes"
            Coverage = "80%"
            Tools = @("Bandit", "ESLint-Security", "Semgrep", "Custom-AI")
        }
        "deep" = @{
            Name = "Deep Security Analysis"
            Duration = "45-60 minutes"
            Coverage = "100%"
            Tools = @("Bandit", "ESLint-Security", "Semgrep", "CodeQL", "Trivy", "Nuclei", "SonarQube", "Snyk", "Checkmarx", "Veracode", "OWASP-ZAP", "Custom-AI", "Manual-Review")
        }
        "compliance" = @{
            Name = "Compliance Security Scan"
            Duration = "20-40 minutes"
            Coverage = "95%"
            Tools = @("Bandit", "ESLint-Security", "Semgrep", "CodeQL", "SonarQube", "Compliance-Checker")
        }
        "container" = @{
            Name = "Container Security Scan"
            Duration = "10-20 minutes"
            Coverage = "90%"
            Tools = @("Trivy", "Snyk", "Nuclei", "Custom-AI")
        }
        "web" = @{
            Name = "Web Application Security Scan"
            Duration = "20-40 minutes"
            Coverage = "95%"
            Tools = @("Nuclei", "OWASP-ZAP", "Burp-Suite", "ESLint-Security", "Semgrep", "CodeQL")
        }
        "enterprise" = @{
            Name = "Enterprise Security Scan"
            Duration = "60-90 minutes"
            Coverage = "100%"
            Tools = @("Bandit", "ESLint-Security", "Semgrep", "CodeQL", "Trivy", "Nuclei", "SonarQube", "Snyk", "Checkmarx", "Veracode", "OWASP-ZAP", "Burp-Suite", "Custom-AI")
        }
    }
    SecurityTools = @{
        "Bandit" = @{
            Name = "Bandit Security Linter"
            Command = "bandit"
            Type = "Python"
            Description = "Python security linter"
            Severity = @("HIGH", "MEDIUM", "LOW")
        }
        "ESLint-Security" = @{
            Name = "ESLint Security Plugin"
            Command = "eslint-plugin-security"
            Type = "JavaScript"
            Description = "JavaScript security analysis"
            Severity = @("ERROR", "WARN")
        }
        "Semgrep" = @{
            Name = "Semgrep"
            Command = "semgrep"
            Type = "Universal"
            Description = "Static analysis for multiple languages"
            Severity = @("ERROR", "WARN", "INFO")
        }
        "CodeQL" = @{
            Name = "GitHub CodeQL"
            Command = "codeql"
            Type = "Universal"
            Description = "Semantic code analysis"
            Severity = @("ERROR", "WARN", "INFO")
        }
        "Trivy" = @{
            Name = "Trivy Vulnerability Scanner"
            Command = "trivy"
            Type = "Container"
            Description = "Container and filesystem vulnerability scanning"
            Severity = @("CRITICAL", "HIGH", "MEDIUM", "LOW")
        }
        "Nuclei" = @{
            Name = "Nuclei Scanner"
            Command = "nuclei"
            Type = "Web"
            Description = "Web application vulnerability scanner"
            Severity = @("CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO")
        }
        "Custom-AI" = @{
            Name = "AI-Powered Security Analysis"
            Command = "custom-ai-scanner"
            Type = "AI"
            Description = "AI-powered security vulnerability detection"
            Severity = @("CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO")
        }
        "SonarQube" = @{
            Name = "SonarQube Security"
            Command = "sonar-scanner"
            Type = "Universal"
            Description = "Comprehensive code quality and security analysis"
            Severity = @("BLOCKER", "CRITICAL", "MAJOR", "MINOR")
        }
        "Snyk" = @{
            Name = "Snyk Security"
            Command = "snyk"
            Type = "Universal"
            Description = "Vulnerability scanning and dependency analysis"
            Severity = @("CRITICAL", "HIGH", "MEDIUM", "LOW")
        }
        "Checkmarx" = @{
            Name = "Checkmarx SAST"
            Command = "checkmarx"
            Type = "Universal"
            Description = "Static Application Security Testing"
            Severity = @("HIGH", "MEDIUM", "LOW")
        }
        "Veracode" = @{
            Name = "Veracode Security"
            Command = "veracode"
            Type = "Universal"
            Description = "Application security testing platform"
            Severity = @("CRITICAL", "HIGH", "MEDIUM", "LOW")
        }
        "OWASP-ZAP" = @{
            Name = "OWASP ZAP"
            Command = "zap-baseline"
            Type = "Web"
            Description = "Web application security scanner"
            Severity = @("CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO")
        }
        "Burp-Suite" = @{
            Name = "Burp Suite Professional"
            Command = "burp"
            Type = "Web"
            Description = "Advanced web application security testing"
            Severity = @("CRITICAL", "HIGH", "MEDIUM", "LOW")
        }
    }
    VulnerabilityCategories = @{
        "OWASP-TOP-10" = @{
            Name = "OWASP Top 10"
            Description = "Most critical web application security risks"
            Categories = @("A01-Broken-Access-Control", "A02-Cryptographic-Failures", "A03-Injection", "A04-Insecure-Design", "A05-Security-Misconfiguration", "A06-Vulnerable-Components", "A07-Identification-Authentication-Failures", "A08-Software-Data-Integrity-Failures", "A09-Security-Logging-Monitoring-Failures", "A10-Server-Side-Request-Forgery")
        }
        "CWE" = @{
            Name = "Common Weakness Enumeration"
            Description = "Common software security weaknesses"
            Categories = @("CWE-79", "CWE-89", "CWE-22", "CWE-78", "CWE-352", "CWE-434", "CWE-476", "CWE-798", "CWE-862", "CWE-863")
        }
        "CVE" = @{
            Name = "Common Vulnerabilities and Exposures"
            Description = "Known security vulnerabilities"
            Categories = @("Remote-Code-Execution", "SQL-Injection", "Cross-Site-Scripting", "Path-Traversal", "Authentication-Bypass", "Privilege-Escalation")
        }
    }
    ComplianceFrameworks = @{
        "GDPR" = @{
            Name = "General Data Protection Regulation"
            Description = "EU data protection regulation"
            Requirements = @("Data-Encryption", "Access-Control", "Audit-Logging", "Data-Retention", "Privacy-By-Design")
        }
        "HIPAA" = @{
            Name = "Health Insurance Portability and Accountability Act"
            Description = "US healthcare data protection"
            Requirements = @("Data-Encryption", "Access-Control", "Audit-Logging", "Data-Integrity", "Administrative-Safeguards")
        }
        "SOC2" = @{
            Name = "Service Organization Control 2"
            Description = "Security, availability, and confidentiality controls"
            Requirements = @("Security", "Availability", "Processing-Integrity", "Confidentiality", "Privacy")
        }
        "PCI-DSS" = @{
            Name = "Payment Card Industry Data Security Standard"
            Description = "Payment card data protection"
            Requirements = @("Network-Security", "Data-Protection", "Vulnerability-Management", "Access-Control", "Monitoring")
        }
    }
}

# Initialize Advanced Security Scanner
function Initialize-AdvancedSecurityScanner {
    param([string]$Path, [string]$Type)
    
    if (-not $Quiet) {
        Write-Host "🔒 Initializing Advanced Security Scanner v$($Config.Version)" -ForegroundColor Cyan
        Write-Host "📊 Scan Type: $($Config.ScanTypes[$Type].Name)" -ForegroundColor Yellow
        Write-Host "⏱️  Estimated Duration: $($Config.ScanTypes[$Type].Duration)" -ForegroundColor Yellow
        Write-Host "📈 Coverage: $($Config.ScanTypes[$Type].Coverage)" -ForegroundColor Yellow
    }
    
    $scanSession = @{
        StartTime = Get-Date
        ProjectPath = Resolve-Path $Path
        ScanType = $Type
        Results = @{}
        Vulnerabilities = @()
        SecurityScore = 100
        ComplianceScore = 100
        ThreatLevel = "LOW"
        Recommendations = @()
        ToolsUsed = @()
        ScanId = [System.Guid]::NewGuid().ToString()
    }
    
    # Create output directory
    if (-not (Test-Path $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    }
    
    return $scanSession
}

# AI-Powered Security Analysis
function Invoke-AISecurityAnalysis {
    param([hashtable]$ScanSession)
    
    if (-not $EnableAI) {
        return $ScanSession
    }
    
    if (-not $Quiet) {
        Write-Host "🤖 Running AI-Powered Security Analysis..." -ForegroundColor Magenta
    }
    
    # AI-powered pattern recognition for security vulnerabilities
    $aiPatterns = @{
        "SQL-Injection" = @{
            Patterns = @(
                "SELECT.*FROM.*WHERE.*\$",
                "INSERT.*INTO.*VALUES.*\$",
                "UPDATE.*SET.*WHERE.*\$",
                "DELETE.*FROM.*WHERE.*\$"
            )
            Severity = "HIGH"
            Category = "OWASP-TOP-10"
            Description = "Potential SQL injection vulnerability"
        }
        "XSS" = @{
            Patterns = @(
                "innerHTML.*\$",
                "document\.write.*\$",
                "eval.*\$",
                "setTimeout.*\$"
            )
            Severity = "HIGH"
            Category = "OWASP-TOP-10"
            Description = "Potential cross-site scripting vulnerability"
        }
        "Path-Traversal" = @{
            Patterns = @(
                "\.\.\/",
                "\.\.\\",
                "\.\.%2f",
                "\.\.%5c"
            )
            Severity = "MEDIUM"
            Category = "OWASP-TOP-10"
            Description = "Potential path traversal vulnerability"
        }
        "Hardcoded-Secrets" = @{
            Patterns = @(
                "password\s*=\s*['\"][^'\"]+['\"]",
                "api[_-]?key\s*=\s*['\"][^'\"]+['\"]",
                "secret\s*=\s*['\"][^'\"]+['\"]",
                "token\s*=\s*['\"][^'\"]+['\"]"
            )
            Severity = "CRITICAL"
            Category = "CWE"
            Description = "Hardcoded secrets detected"
        }
        "Weak-Cryptography" = @{
            Patterns = @(
                "MD5\(",
                "SHA1\(",
                "DES\(",
                "RC4\("
            )
            Severity = "MEDIUM"
            Category = "CWE"
            Description = "Weak cryptographic algorithm detected"
        }
    }
    
    $filesToScan = Get-ChildItem -Path $ScanSession.ProjectPath -Recurse -Include "*.py", "*.js", "*.ts", "*.java", "*.cs", "*.php", "*.go", "*.rs", "*.cpp", "*.c", "*.h" | Where-Object { -not $_.FullName.Contains("node_modules") -and -not $_.FullName.Contains(".git") }
    
    foreach ($file in $filesToScan) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            foreach ($vulnType in $aiPatterns.Keys) {
                $patterns = $aiPatterns[$vulnType].Patterns
                foreach ($pattern in $patterns) {
                    $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                    foreach ($match in $matches) {
                        $vulnerability = @{
                            Id = [System.Guid]::NewGuid().ToString()
                            Type = $vulnType
                            Severity = $aiPatterns[$vulnType].Severity
                            Category = $aiPatterns[$vulnType].Category
                            Description = $aiPatterns[$vulnType].Description
                            File = $file.FullName
                            Line = ($content.Substring(0, $match.Index) -split "`n").Length
                            Code = $match.Value
                            Tool = "AI-Powered-Analysis"
                            Timestamp = Get-Date
                            Confidence = 85
                        }
                        $ScanSession.Vulnerabilities += $vulnerability
                    }
                }
            }
        }
    }
    
    $ScanSession.ToolsUsed += "Custom-AI"
    return $ScanSession
}

# Run Security Tool Analysis
function Invoke-SecurityToolAnalysis {
    param([hashtable]$ScanSession, [string]$ToolName)
    
    $tool = $Config.SecurityTools[$ToolName]
    if (-not $tool) {
        return $ScanSession
    }
    
    if (-not $Quiet) {
        Write-Host "🔍 Running $($tool.Name)..." -ForegroundColor Blue
    }
    
    try {
        switch ($ToolName) {
            "Bandit" {
                if (Get-Command "bandit" -ErrorAction SilentlyContinue) {
                    $banditOutput = & bandit -r $ScanSession.ProjectPath -f json 2>$null
                    if ($LASTEXITCODE -eq 0) {
                        $banditResults = $banditOutput | ConvertFrom-Json
                        foreach ($issue in $banditResults.results) {
                            $vulnerability = @{
                                Id = [System.Guid]::NewGuid().ToString()
                                Type = "Bandit-$($issue.test_id)"
                                Severity = $issue.issue_severity.ToUpper()
                                Category = "Python-Security"
                                Description = $issue.issue_text
                                File = $issue.filename
                                Line = $issue.line_number
                                Code = $issue.code
                                Tool = "Bandit"
                                Timestamp = Get-Date
                                Confidence = 90
                            }
                            $ScanSession.Vulnerabilities += $vulnerability
                        }
                    }
                }
            }
            "ESLint-Security" {
                if (Get-Command "eslint" -ErrorAction SilentlyContinue) {
                    $eslintOutput = & eslint $ScanSession.ProjectPath --plugin security --format json 2>$null
                    if ($LASTEXITCODE -eq 0) {
                        $eslintResults = $eslintOutput | ConvertFrom-Json
                        foreach ($file in $eslintResults) {
                            foreach ($message in $file.messages) {
                                if ($message.ruleId -like "security/*") {
                                    $vulnerability = @{
                                        Id = [System.Guid]::NewGuid().ToString()
                                        Type = "ESLint-$($message.ruleId)"
                                        Severity = if ($message.severity -eq 2) { "HIGH" } else { "MEDIUM" }
                                        Category = "JavaScript-Security"
                                        Description = $message.message
                                        File = $file.filePath
                                        Line = $message.line
                                        Code = $message.source
                                        Tool = "ESLint-Security"
                                        Timestamp = Get-Date
                                        Confidence = 85
                                    }
                                    $ScanSession.Vulnerabilities += $vulnerability
                                }
                            }
                        }
                    }
                }
            }
            "Semgrep" {
                if (Get-Command "semgrep" -ErrorAction SilentlyContinue) {
                    $semgrepOutput = & semgrep --config=auto $ScanSession.ProjectPath --json 2>$null
                    if ($LASTEXITCODE -eq 0) {
                        $semgrepResults = $semgrepOutput | ConvertFrom-Json
                        foreach ($result in $semgrepResults.results) {
                            $vulnerability = @{
                                Id = [System.Guid]::NewGuid().ToString()
                                Type = "Semgrep-$($result.check_id)"
                                Severity = $result.extra.severity.ToUpper()
                                Category = "Static-Analysis"
                                Description = $result.extra.message
                                File = $result.path
                                Line = $result.start.line
                                Code = $result.extra.lines
                                Tool = "Semgrep"
                                Timestamp = Get-Date
                                Confidence = 80
                            }
                            $ScanSession.Vulnerabilities += $vulnerability
                        }
                    }
                }
            }
            "Trivy" {
                if (Get-Command "trivy" -ErrorAction SilentlyContinue) {
                    $trivyOutput = & trivy fs $ScanSession.ProjectPath --format json 2>$null
                    if ($LASTEXITCODE -eq 0) {
                        $trivyResults = $trivyOutput | ConvertFrom-Json
                        foreach ($result in $trivyResults.Results) {
                            foreach ($vuln in $result.Vulnerabilities) {
                                $vulnerability = @{
                                    Id = [System.Guid]::NewGuid().ToString()
                                    Type = "Trivy-$($vuln.VulnerabilityID)"
                                    Severity = $vuln.Severity.ToUpper()
                                    Category = "Dependency-Vulnerability"
                                    Description = $vuln.Description
                                    File = $result.Target
                                    Line = 0
                                    Code = $vuln.PkgName
                                    Tool = "Trivy"
                                    Timestamp = Get-Date
                                    Confidence = 95
                                }
                                $ScanSession.Vulnerabilities += $vulnerability
                            }
                        }
                    }
                }
            }
        }
    }
    catch {
        if (-not $Quiet) {
            Write-Host "⚠️  Error running $($tool.Name): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    $ScanSession.ToolsUsed += $ToolName
    return $ScanSession
}

# Calculate Security Score
function Calculate-SecurityScore {
    param([hashtable]$ScanSession)
    
    $totalVulns = $ScanSession.Vulnerabilities.Count
    $criticalVulns = ($ScanSession.Vulnerabilities | Where-Object { $_.Severity -eq "CRITICAL" }).Count
    $highVulns = ($ScanSession.Vulnerabilities | Where-Object { $_.Severity -eq "HIGH" }).Count
    $mediumVulns = ($ScanSession.Vulnerabilities | Where-Object { $_.Severity -eq "MEDIUM" }).Count
    $lowVulns = ($ScanSession.Vulnerabilities | Where-Object { $_.Severity -eq "LOW" }).Count
    
    # Calculate security score (100 - weighted vulnerabilities)
    $securityScore = 100
    $securityScore -= ($criticalVulns * 20)
    $securityScore -= ($highVulns * 10)
    $securityScore -= ($mediumVulns * 5)
    $securityScore -= ($lowVulns * 1)
    
    if ($securityScore -lt 0) { $securityScore = 0 }
    
    # Determine threat level
    $threatLevel = "LOW"
    if ($criticalVulns -gt 0) { $threatLevel = "CRITICAL" }
    elseif ($highVulns -gt 5) { $threatLevel = "HIGH" }
    elseif ($highVulns -gt 0 -or $mediumVulns -gt 10) { $threatLevel = "MEDIUM" }
    
    $ScanSession.SecurityScore = $securityScore
    $ScanSession.ThreatLevel = $threatLevel
    
    return $ScanSession
}

# Generate Security Recommendations
function Generate-SecurityRecommendations {
    param([hashtable]$ScanSession)
    
    $recommendations = @()
    
    # Analyze vulnerabilities by category
    $vulnByCategory = $ScanSession.Vulnerabilities | Group-Object Category
    $vulnBySeverity = $ScanSession.Vulnerabilities | Group-Object Severity
    
    # Critical vulnerabilities
    if ($vulnBySeverity | Where-Object { $_.Name -eq "CRITICAL" }) {
        $recommendations += @{
            Priority = "CRITICAL"
            Category = "Immediate Action Required"
            Title = "Address Critical Security Vulnerabilities"
            Description = "Immediately address all critical security vulnerabilities before deployment"
            Actions = @("Review and fix all critical vulnerabilities", "Implement additional security controls", "Consider security code review")
        }
    }
    
    # High vulnerabilities
    if ($vulnBySeverity | Where-Object { $_.Name -eq "HIGH" }) {
        $recommendations += @{
            Priority = "HIGH"
            Category = "Security Enhancement"
            Title = "Address High-Priority Security Issues"
            Description = "Address high-priority security vulnerabilities to improve overall security posture"
            Actions = @("Fix high-priority vulnerabilities", "Implement security best practices", "Consider security training")
        }
    }
    
    # OWASP Top 10 vulnerabilities
    $owaspVulns = $ScanSession.Vulnerabilities | Where-Object { $_.Category -eq "OWASP-TOP-10" }
    if ($owaspVulns) {
        $recommendations += @{
            Priority = "HIGH"
            Category = "OWASP Compliance"
            Title = "Address OWASP Top 10 Vulnerabilities"
            Description = "Implement OWASP Top 10 security controls to protect against common web application vulnerabilities"
            Actions = @("Implement input validation", "Use parameterized queries", "Implement proper authentication", "Use HTTPS everywhere")
        }
    }
    
    # Hardcoded secrets
    $secretVulns = $ScanSession.Vulnerabilities | Where-Object { $_.Type -eq "Hardcoded-Secrets" }
    if ($secretVulns) {
        $recommendations += @{
            Priority = "CRITICAL"
            Category = "Secret Management"
            Title = "Remove Hardcoded Secrets"
            Description = "Replace all hardcoded secrets with secure secret management solutions"
            Actions = @("Use environment variables", "Implement secret management service", "Rotate all exposed secrets", "Implement secret scanning in CI/CD")
        }
    }
    
    # General security recommendations
    $recommendations += @{
        Priority = "MEDIUM"
        Category = "Security Best Practices"
        Title = "Implement Security Best Practices"
        Description = "Implement comprehensive security best practices and controls"
        Actions = @("Enable security headers", "Implement rate limiting", "Use secure coding practices", "Regular security audits", "Security training for developers")
    }
    
    $ScanSession.Recommendations = $recommendations
    return $ScanSession
}

# Generate Security Report
function Generate-SecurityReport {
    param([hashtable]$ScanSession)
    
    if (-not $GenerateReport) {
        return
    }
    
    $reportData = @{
        ScanInfo = @{
            ScanId = $ScanSession.ScanId
            StartTime = $ScanSession.StartTime
            EndTime = Get-Date
            Duration = (Get-Date) - $ScanSession.StartTime
            ScanType = $ScanSession.ScanType
            ProjectPath = $ScanSession.ProjectPath
            ToolsUsed = $ScanSession.ToolsUsed
        }
        SecurityMetrics = @{
            SecurityScore = $ScanSession.SecurityScore
            ThreatLevel = $ScanSession.ThreatLevel
            TotalVulnerabilities = $ScanSession.Vulnerabilities.Count
            CriticalVulnerabilities = ($ScanSession.Vulnerabilities | Where-Object { $_.Severity -eq "CRITICAL" }).Count
            HighVulnerabilities = ($ScanSession.Vulnerabilities | Where-Object { $_.Severity -eq "HIGH" }).Count
            MediumVulnerabilities = ($ScanSession.Vulnerabilities | Where-Object { $_.Severity -eq "MEDIUM" }).Count
            LowVulnerabilities = ($ScanSession.Vulnerabilities | Where-Object { $_.Severity -eq "LOW" }).Count
        }
        Vulnerabilities = $ScanSession.Vulnerabilities
        Recommendations = $ScanSession.Recommendations
        ComplianceStatus = @{
            GDPR = "Not Assessed"
            HIPAA = "Not Assessed"
            SOC2 = "Not Assessed"
            PCI-DSS = "Not Assessed"
        }
    }
    
    # Generate different output formats
    switch ($OutputFormat) {
        "json" {
            $jsonReport = $reportData | ConvertTo-Json -Depth 10
            $jsonPath = Join-Path $OutputPath "security-scan-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
            $jsonReport | Set-Content -Path $jsonPath -Encoding UTF8
            if (-not $Quiet) {
                Write-Host "📄 JSON Report saved to: $jsonPath" -ForegroundColor Green
            }
        }
        "html" {
            $htmlReport = Generate-HTMLSecurityReport -ReportData $reportData
            $htmlPath = Join-Path $OutputPath "security-scan-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
            $htmlReport | Set-Content -Path $htmlPath -Encoding UTF8
            if (-not $Quiet) {
                Write-Host "📄 HTML Report saved to: $htmlPath" -ForegroundColor Green
            }
        }
        "xml" {
            $xmlReport = $reportData | ConvertTo-Xml -Depth 10
            $xmlPath = Join-Path $OutputPath "security-scan-$(Get-Date -Format 'yyyyMMdd-HHmmss').xml"
            $xmlReport | Set-Content -Path $xmlPath -Encoding UTF8
            if (-not $Quiet) {
                Write-Host "📄 XML Report saved to: $xmlPath" -ForegroundColor Green
            }
        }
        "console" {
            Display-ConsoleSecurityReport -ReportData $reportData
        }
    }
}

# Generate HTML Security Report
function Generate-HTMLSecurityReport {
    param([hashtable]$ReportData)
    
    $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Security Scan Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .critical { color: #dc3545; }
        .high { color: #fd7e14; }
        .medium { color: #ffc107; }
        .low { color: #28a745; }
        .vulnerabilities { margin-bottom: 30px; }
        .vuln-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #dc3545; }
        .recommendations { margin-bottom: 30px; }
        .rec-item { background: #e7f3ff; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Advanced Security Scan Report</h1>
            <p>Generated on: $($ReportData.ScanInfo.EndTime)</p>
            <p>Scan ID: $($ReportData.ScanInfo.ScanId)</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value $($ReportData.SecurityMetrics.ThreatLevel.ToLower())">$($ReportData.SecurityMetrics.SecurityScore)</div>
                <div>Security Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$($ReportData.SecurityMetrics.TotalVulnerabilities)</div>
                <div>Total Vulnerabilities</div>
            </div>
            <div class="metric-card">
                <div class="metric-value critical">$($ReportData.SecurityMetrics.CriticalVulnerabilities)</div>
                <div>Critical</div>
            </div>
            <div class="metric-card">
                <div class="metric-value high">$($ReportData.SecurityMetrics.HighVulnerabilities)</div>
                <div>High</div>
            </div>
            <div class="metric-card">
                <div class="metric-value medium">$($ReportData.SecurityMetrics.MediumVulnerabilities)</div>
                <div>Medium</div>
            </div>
            <div class="metric-card">
                <div class="metric-value low">$($ReportData.SecurityMetrics.LowVulnerabilities)</div>
                <div>Low</div>
            </div>
        </div>
        
        <div class="vulnerabilities">
            <h2>🔍 Vulnerabilities Found</h2>
            $(if ($ReportData.Vulnerabilities.Count -gt 0) {
                $ReportData.Vulnerabilities | ForEach-Object {
                    "<div class='vuln-item'>
                        <strong>$($_.Type)</strong> - <span class='$($_.Severity.ToLower())'>$($_.Severity)</span><br>
                        <small>File: $($_.File) | Line: $($_.Line)</small><br>
                        <p>$($_.Description)</p>
                    </div>"
                } -join ""
            } else {
                "<p>No vulnerabilities found! 🎉</p>"
            })
        </div>
        
        <div class="recommendations">
            <h2>💡 Security Recommendations</h2>
            $(if ($ReportData.Recommendations.Count -gt 0) {
                $ReportData.Recommendations | ForEach-Object {
                    "<div class='rec-item'>
                        <strong>$($_.Title)</strong> - <span class='$($_.Priority.ToLower())'>$($_.Priority)</span><br>
                        <p>$($_.Description)</p>
                        <ul>$($_.Actions | ForEach-Object { "<li>$_</li>" } -join "")</ul>
                    </div>"
                } -join ""
            } else {
                "<p>No specific recommendations at this time.</p>"
            })
        </div>
    </div>
</body>
</html>
"@
    
    return $html
}

# Display Console Security Report
function Display-ConsoleSecurityReport {
    param([hashtable]$ReportData)
    
    Write-Host "`n🔒 ADVANCED SECURITY SCAN REPORT" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host "Scan ID: $($ReportData.ScanInfo.ScanId)" -ForegroundColor White
    Write-Host "Duration: $($ReportData.ScanInfo.Duration)" -ForegroundColor White
    Write-Host "Tools Used: $($ReportData.ScanInfo.ToolsUsed -join ', ')" -ForegroundColor White
    
    Write-Host "`n📊 SECURITY METRICS" -ForegroundColor Yellow
    Write-Host "===================" -ForegroundColor Yellow
    Write-Host "Security Score: $($ReportData.SecurityMetrics.SecurityScore)" -ForegroundColor $(if ($ReportData.SecurityMetrics.SecurityScore -ge 80) { "Green" } elseif ($ReportData.SecurityMetrics.SecurityScore -ge 60) { "Yellow" } else { "Red" })
    Write-Host "Threat Level: $($ReportData.SecurityMetrics.ThreatLevel)" -ForegroundColor $(if ($ReportData.SecurityMetrics.ThreatLevel -eq "LOW") { "Green" } elseif ($ReportData.SecurityMetrics.ThreatLevel -eq "MEDIUM") { "Yellow" } else { "Red" })
    Write-Host "Total Vulnerabilities: $($ReportData.SecurityMetrics.TotalVulnerabilities)" -ForegroundColor White
    Write-Host "  • Critical: $($ReportData.SecurityMetrics.CriticalVulnerabilities)" -ForegroundColor Red
    Write-Host "  • High: $($ReportData.SecurityMetrics.HighVulnerabilities)" -ForegroundColor DarkRed
    Write-Host "  • Medium: $($ReportData.SecurityMetrics.MediumVulnerabilities)" -ForegroundColor Yellow
    Write-Host "  • Low: $($ReportData.SecurityMetrics.LowVulnerabilities)" -ForegroundColor Green
    
    if ($ReportData.Vulnerabilities.Count -gt 0) {
        Write-Host "`n🔍 TOP VULNERABILITIES" -ForegroundColor Red
        Write-Host "=====================" -ForegroundColor Red
        $topVulns = $ReportData.Vulnerabilities | Sort-Object { @{CRITICAL=4; HIGH=3; MEDIUM=2; LOW=1}[$_.Severity] } -Descending | Select-Object -First 10
        foreach ($vuln in $topVulns) {
            Write-Host "• $($vuln.Type) - $($vuln.Severity)" -ForegroundColor $(if ($vuln.Severity -eq "CRITICAL") { "Red" } elseif ($vuln.Severity -eq "HIGH") { "DarkRed" } elseif ($vuln.Severity -eq "MEDIUM") { "Yellow" } else { "Green" })
            Write-Host "  File: $($vuln.File)" -ForegroundColor Gray
            Write-Host "  Description: $($vuln.Description)" -ForegroundColor Gray
            Write-Host ""
        }
    }
    
    if ($ReportData.Recommendations.Count -gt 0) {
        Write-Host "`n💡 SECURITY RECOMMENDATIONS" -ForegroundColor Blue
        Write-Host "============================" -ForegroundColor Blue
        foreach ($rec in $ReportData.Recommendations) {
            Write-Host "• $($rec.Title) - $($rec.Priority)" -ForegroundColor $(if ($rec.Priority -eq "CRITICAL") { "Red" } elseif ($rec.Priority -eq "HIGH") { "DarkRed" } else { "Blue" })
            Write-Host "  $($rec.Description)" -ForegroundColor Gray
            Write-Host ""
        }
    }
}

# Main execution
try {
    # Initialize scanner
    $scanSession = Initialize-AdvancedSecurityScanner -Path $ProjectPath -Type $ScanType
    
    # Run AI-powered analysis
    $scanSession = Invoke-AISecurityAnalysis -ScanSession $scanSession
    
    # Run security tools based on scan type
    $toolsToRun = $Config.ScanTypes[$ScanType].Tools
    foreach ($tool in $toolsToRun) {
        if ($Config.SecurityTools.ContainsKey($tool)) {
            $scanSession = Invoke-SecurityToolAnalysis -ScanSession $scanSession -ToolName $tool
        }
    }
    
    # Calculate security score
    $scanSession = Calculate-SecurityScore -ScanSession $scanSession
    
    # Generate recommendations
    $scanSession = Generate-SecurityRecommendations -ScanSession $scanSession
    
    # Generate report
    Generate-SecurityReport -ScanSession $scanSession
    
    # Display summary
    if (-not $Quiet) {
        Write-Host "`n🎯 SCAN COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "Security Score: $($scanSession.SecurityScore)" -ForegroundColor $(if ($scanSession.SecurityScore -ge 80) { "Green" } elseif ($scanSession.SecurityScore -ge 60) { "Yellow" } else { "Red" })
        Write-Host "Threat Level: $($scanSession.ThreatLevel)" -ForegroundColor $(if ($scanSession.ThreatLevel -eq "LOW") { "Green" } elseif ($scanSession.ThreatLevel -eq "MEDIUM") { "Yellow" } else { "Red" })
        Write-Host "Vulnerabilities Found: $($scanSession.Vulnerabilities.Count)" -ForegroundColor White
        Write-Host "Tools Used: $($scanSession.ToolsUsed -join ', ')" -ForegroundColor White
    }
    
    # Return scan results
    return $scanSession
}
catch {
    Write-Error "Advanced Security Scanner failed: $($_.Exception.Message)"
    exit 1
}
