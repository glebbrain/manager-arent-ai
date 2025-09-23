param(
  [switch]$Quiet,
  [switch]$Detailed,
  [switch]$GenerateReport
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) { if (-not $Quiet) { Write-Host $msg -ForegroundColor Cyan } }
function Write-Ok($msg)   { if (-not $Quiet) { Write-Host $msg -ForegroundColor Green } }
function Write-Warn($msg) { if (-not $Quiet) { Write-Host $msg -ForegroundColor Yellow } }
function Write-Err($msg)  { if (-not $Quiet) { Write-Host $msg -ForegroundColor Red } }

Write-Info "🔒 CyberSyn Security Analysis"

# Initialize security analysis
$security = @{
  Authentication = @{}
  Authorization = @{}
  DataProtection = @{}
  NetworkSecurity = @{}
  Dependencies = @{}
  Configuration = @{}
  Issues = @()
  Recommendations = @()
}

# Analyze authentication
Write-Info "Analyzing authentication..."

# Check for authentication libraries
$authLibraries = @()
if (Test-Path "web/package.json") {
  $packageJson = Get-Content "web/package.json" | ConvertFrom-Json
  $authDeps = @("next-auth", "passport", "jwt", "bcrypt", "argon2")

  foreach ($dep in $authDeps) {
    if ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep) {
      $authLibraries += $dep
    }
  }
}

$security.Authentication.Libraries = $authLibraries
$security.Authentication.HasAuthLibraries = $authLibraries.Count -gt 0

# Check for authentication configuration
$authConfigFiles = @()
if (Test-Path "web/pages/api/auth") { $authConfigFiles += "API auth endpoints" }
if (Test-Path "web/lib/auth.ts") { $authConfigFiles += "auth.ts" }
if (Test-Path "web/middleware.ts") { $authConfigFiles += "middleware.ts" }

$security.Authentication.ConfigFiles = $authConfigFiles

# Analyze authorization
Write-Info "Analyzing authorization..."

# Check for RBAC implementation
$rbacFiles = @()
$rbacPatterns = @("role", "permission", "rbac", "access", "authorize")

if (Test-Path "src") {
  $srcFiles = Get-ChildItem "src" -Recurse -Filter "*.py" | ForEach-Object { $_.FullName }
  foreach ($file in $srcFiles) {
    $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
    if ($content) {
      foreach ($pattern in $rbacPatterns) {
        if ($content -match $pattern) {
          $rbacFiles += $file
          break
        }
      }
    }
  }
}

if (Test-Path "web") {
  $webFiles = Get-ChildItem "web" -Recurse -Filter "*.ts" | ForEach-Object { $_.FullName }
  foreach ($file in $webFiles) {
    $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
    if ($content) {
      foreach ($pattern in $rbacPatterns) {
        if ($content -match $pattern) {
          $rbacFiles += $file
          break
        }
      }
    }
  }
}

$security.Authorization.RBACFiles = $rbacFiles
$security.Authorization.HasRBAC = $rbacFiles.Count -gt 0

# Analyze data protection
Write-Info "Analyzing data protection..."

# Check for encryption libraries
$encryptionLibraries = @()
if (Test-Path "requirements.txt") {
  $pythonDeps = Get-Content "requirements.txt"
  $encryptionDeps = @("cryptography", "pycryptodome", "bcrypt", "argon2-cffi")

  foreach ($dep in $encryptionDeps) {
    if ($pythonDeps -match $dep) {
      $encryptionLibraries += $dep
    }
  }
}

if (Test-Path "web/package.json") {
  $packageJson = Get-Content "web/package.json" | ConvertFrom-Json
  $jsEncryptionDeps = @("crypto-js", "bcryptjs", "argon2-browser")

  foreach ($dep in $jsEncryptionDeps) {
    if ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep) {
      $encryptionLibraries += $dep
    }
  }
}

$security.DataProtection.EncryptionLibraries = $encryptionLibraries
$security.DataProtection.HasEncryption = $encryptionLibraries.Count -gt 0

# Check for environment variable protection
$envFiles = @()
if (Test-Path ".env.example") { $envFiles += ".env.example" }
if (Test-Path ".env.local") { $envFiles += ".env.local" }
if (Test-Path "config") {
  $configEnvFiles = Get-ChildItem "config" -Filter "*.env*" | ForEach-Object { $_.Name }
  $envFiles += $configEnvFiles
}

$security.DataProtection.EnvFiles = $envFiles

# Analyze network security
Write-Info "Analyzing network security..."

# Check for HTTPS configuration
$httpsConfig = @()
if (Test-Path "web/next.config.mjs") {
  $nextConfig = Get-Content "web/next.config.mjs" -Raw
  if ($nextConfig -match "https|ssl|tls") {
    $httpsConfig += "Next.js HTTPS config"
  }
}

if (Test-Path "docker-compose.yml") {
  $dockerConfig = Get-Content "docker-compose.yml" -Raw
  if ($dockerConfig -match "443|https|ssl") {
    $httpsConfig += "Docker HTTPS config"
  }
}

$security.NetworkSecurity.HTTPSConfig = $httpsConfig
$security.NetworkSecurity.HasHTTPS = $httpsConfig.Count -gt 0

# Check for CORS configuration
$corsConfig = @()
if (Test-Path "web/next.config.mjs") {
  $nextConfig = Get-Content "web/next.config.mjs" -Raw
  if ($nextConfig -match "cors|headers") {
    $corsConfig += "Next.js CORS config"
  }
}

$security.NetworkSecurity.CORSConfig = $corsConfig

# Analyze dependencies for vulnerabilities
Write-Info "Analyzing dependencies for vulnerabilities..."

$vulnerabilityChecks = @{}

# Check Python dependencies
if (Test-Path "requirements.txt") {
  $vulnerabilityChecks.Python = "requirements.txt found - run 'pip audit' for vulnerability check"
}

# Check Node.js dependencies
if (Test-Path "web/package.json") {
  $vulnerabilityChecks.NodeJS = "package.json found - run 'npm audit' for vulnerability check"
}

$security.Dependencies.VulnerabilityChecks = $vulnerabilityChecks

# Analyze security configuration
Write-Info "Analyzing security configuration..."

$securityConfig = @{}

# Check for security headers
$securityHeaders = @()
if (Test-Path "web/next.config.mjs") {
  $nextConfig = Get-Content "web/next.config.mjs" -Raw
  $headerPatterns = @("csp", "x-frame-options", "x-content-type-options", "referrer-policy")

  foreach ($pattern in $headerPatterns) {
    if ($nextConfig -match $pattern) {
      $securityHeaders += $pattern
    }
  }
}

$securityConfig.SecurityHeaders = $securityHeaders

# Check for security middleware
$securityMiddleware = @()
if (Test-Path "web/middleware.ts") {
  $middleware = Get-Content "web/middleware.ts" -Raw
  $middlewarePatterns = @("helmet", "cors", "rate-limit", "security")

  foreach ($pattern in $middlewarePatterns) {
    if ($middleware -match $pattern) {
      $securityMiddleware += $pattern
    }
  }
}

$securityConfig.SecurityMiddleware = $securityMiddleware

$security.Configuration = $securityConfig

# Check for security tests
Write-Info "Checking security tests..."

$securityTests = @()
if (Test-Path "tests/security") {
  $secTestFiles = Get-ChildItem "tests/security" -Filter "*.py" | ForEach-Object { $_.Name }
  $securityTests += $secTestFiles
}

if (Test-Path "web/tests") {
  $webSecTests = Get-ChildItem "web/tests" -Recurse -Filter "*security*" | ForEach-Object { $_.Name }
  $securityTests += $webSecTests
}

$security.Tests = @{
  SecurityTests = $securityTests
  HasSecurityTests = $securityTests.Count -gt 0
}

# Identify security issues
Write-Info "Identifying security issues..."

$issues = @()

# Authentication issues
if (-not $security.Authentication.HasAuthLibraries) {
  $issues += "Authentication: No authentication libraries found"
}

if ($security.Authentication.ConfigFiles.Count -eq 0) {
  $issues += "Authentication: No authentication configuration found"
}

# Authorization issues
if (-not $security.Authorization.HasRBAC) {
  $issues += "Authorization: No RBAC implementation found"
}

# Data protection issues
if (-not $security.DataProtection.HasEncryption) {
  $issues += "Data Protection: No encryption libraries found"
}

if ($security.DataProtection.EnvFiles.Count -eq 0) {
  $issues += "Data Protection: No environment variable configuration found"
}

# Network security issues
if (-not $security.NetworkSecurity.HasHTTPS) {
  $issues += "Network Security: No HTTPS configuration found"
}

if ($security.NetworkSecurity.CORSConfig.Count -eq 0) {
  $issues += "Network Security: No CORS configuration found"
}

# Configuration issues
if ($security.Configuration.SecurityHeaders.Count -eq 0) {
  $issues += "Configuration: No security headers configured"
}

if ($security.Configuration.SecurityMiddleware.Count -eq 0) {
  $issues += "Configuration: No security middleware found"
}

# Test issues
if (-not $security.Tests.HasSecurityTests) {
  $issues += "Testing: No security tests found"
}

$security.Issues = $issues

# Generate recommendations
Write-Info "Generating security recommendations..."

$recommendations = @()

# Authentication recommendations
if (-not $security.Authentication.HasAuthLibraries) {
  $recommendations += "Implement NextAuth.js for authentication"
  $recommendations += "Add JWT token management"
  $recommendations += "Implement password hashing with bcrypt"
}

# Authorization recommendations
if (-not $security.Authorization.HasRBAC) {
  $recommendations += "Implement Role-Based Access Control (RBAC)"
  $recommendations += "Add permission-based authorization"
  $recommendations += "Implement API route protection"
}

# Data protection recommendations
if (-not $security.DataProtection.HasEncryption) {
  $recommendations += "Add encryption for sensitive data"
  $recommendations += "Implement secure password storage"
  $recommendations += "Add data encryption at rest"
}

if ($security.DataProtection.EnvFiles.Count -eq 0) {
  $recommendations += "Create .env.example file for environment variables"
  $recommendations += "Implement secure secrets management"
}

# Network security recommendations
if (-not $security.NetworkSecurity.HasHTTPS) {
  $recommendations += "Configure HTTPS for all environments"
  $recommendations += "Implement SSL/TLS certificates"
  $recommendations += "Add HSTS headers"
}

if ($security.NetworkSecurity.CORSConfig.Count -eq 0) {
  $recommendations += "Configure CORS policies"
  $recommendations += "Implement origin validation"
}

# Configuration recommendations
if ($security.Configuration.SecurityHeaders.Count -eq 0) {
  $recommendations += "Add security headers (CSP, X-Frame-Options, etc.)"
  $recommendations += "Implement Content Security Policy"
  $recommendations += "Add X-Content-Type-Options header"
}

if ($security.Configuration.SecurityMiddleware.Count -eq 0) {
  $recommendations += "Add security middleware (helmet, rate limiting)"
  $recommendations += "Implement request validation"
  $recommendations += "Add input sanitization"
}

# Test recommendations
if (-not $security.Tests.HasSecurityTests) {
  $recommendations += "Add security tests for authentication"
  $recommendations += "Implement authorization tests"
  $recommendations += "Add input validation tests"
  $recommendations += "Implement SQL injection tests"
}

# General recommendations
$recommendations += "Run dependency vulnerability scans regularly"
$recommendations += "Implement security monitoring and alerting"
$recommendations += "Add security audit logging"
$recommendations += "Implement rate limiting and DDoS protection"

$security.Recommendations = $recommendations

# Display results
if (-not $Quiet) {
  Write-Host "`n🔒 Security Analysis Results:" -ForegroundColor Cyan

  Write-Host "`n🛡️ Security Status:" -ForegroundColor Yellow
  Write-Host ("  Authentication: {0}" -f $(if ($security.Authentication.HasAuthLibraries) { "✅" } else { "❌" }))
  Write-Host ("  Authorization: {0}" -f $(if ($security.Authorization.HasRBAC) { "✅" } else { "❌" }))
  Write-Host ("  Data Protection: {0}" -f $(if ($security.DataProtection.HasEncryption) { "✅" } else { "❌" }))
  Write-Host ("  Network Security: {0}" -f $(if ($security.NetworkSecurity.HasHTTPS) { "✅" } else { "❌" }))
  Write-Host ("  Security Tests: {0}" -f $(if ($security.Tests.HasSecurityTests) { "✅" } else { "❌" }))

  if ($security.Issues.Count -gt 0) {
    Write-Host "`n🚨 Security Issues:" -ForegroundColor Red
    foreach ($issue in $security.Issues) {
      Write-Host ("  - {0}" -f $issue)
    }
  }

  if ($security.Recommendations.Count -gt 0) {
    Write-Host "`nSecurity Recommendations:" -ForegroundColor Green
    foreach ($rec in $security.Recommendations) {
      Write-Host ("  - {0}" -f $rec)
    }
  }
}

if ($Detailed) {
  Write-Host "`n🔍 Detailed Security Analysis:" -ForegroundColor Cyan

  Write-Host "`nAuthentication:" -ForegroundColor Yellow
  Write-Host ("  Libraries: {0}" -f $security.Authentication.Libraries.Count)
  if ($security.Authentication.Libraries.Count -gt 0) {
    foreach ($lib in $security.Authentication.Libraries) {
      Write-Host ("    - {0}" -f $lib)
    }
  }
  Write-Host ("  Config Files: {0}" -f $security.Authentication.ConfigFiles.Count)

  Write-Host "`nAuthorization:" -ForegroundColor Yellow
  Write-Host ("  RBAC Files: {0}" -f $security.Authorization.RBACFiles.Count)

  Write-Host "`nData Protection:" -ForegroundColor Yellow
  Write-Host ("  Encryption Libraries: {0}" -f $security.DataProtection.EncryptionLibraries.Count)
  Write-Host ("  Environment Files: {0}" -f $security.DataProtection.EnvFiles.Count)

  Write-Host "`nNetwork Security:" -ForegroundColor Yellow
  Write-Host ("  HTTPS Config: {0}" -f $security.NetworkSecurity.HTTPSConfig.Count)
  Write-Host ("  CORS Config: {0}" -f $security.NetworkSecurity.CORSConfig.Count)

  Write-Host "`nSecurity Configuration:" -ForegroundColor Yellow
  Write-Host ("  Security Headers: {0}" -f $security.Configuration.SecurityHeaders.Count)
  Write-Host ("  Security Middleware: {0}" -f $security.Configuration.SecurityMiddleware.Count)

  Write-Host "`nSecurity Tests:" -ForegroundColor Yellow
  Write-Host ("  Security Tests: {0}" -f $security.Tests.SecurityTests.Count)
  if ($security.Tests.SecurityTests.Count -gt 0) {
    foreach ($test in $security.Tests.SecurityTests) {
      Write-Host ("    - {0}" -f $test)
    }
  }
}

# Generate report if requested
if ($GenerateReport) {
  $dateStr = Get-Date -Format "yyyy-MM-dd"
  $reportPath = "docs/security-analysis-$dateStr.json"
  if (-not (Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" -Force | Out-Null
  }

  $security | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
  Write-Ok "Security analysis report saved to: $reportPath"
}

# Exit with appropriate code
if ($security.Issues.Count -gt 0) {
  exit 1
} else {
  exit 0
}
