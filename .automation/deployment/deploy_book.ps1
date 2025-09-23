param(
    [string]$Target = "local",
    [string]$Version = "1.0.0",
    [switch]$Build,
    [switch]$Test,
    [switch]$Publish,
    [switch]$Verbose
)

Write-Host "🚀 Book Deployment Pipeline..." -ForegroundColor Cyan

$deploymentSteps = @()
$errors = @()

# Step 1: Build
if ($Build) {
    Write-Host "`n📚 Step 1: Building Book..." -ForegroundColor Yellow
    try {
        & .\.automation\deployment\build_book.ps1 -OutputFormat "all" -Clean
        $deploymentSteps += @{
            Step = "Build"
            Status = "✅ Success"
            Details = "Book built successfully"
        }
    } catch {
        $error = "Build failed: $($_.Exception.Message)"
        $errors += $error
        $deploymentSteps += @{
            Step = "Build"
            Status = "❌ Failed"
            Details = $error
        }
    }
}

# Step 2: Test
if ($Test) {
    Write-Host "`n🧪 Step 2: Running Tests..." -ForegroundColor Yellow
    try {
        & .\.automation\testing\run_tests.ps1
        $deploymentSteps += @{
            Step = "Test"
            Status = "✅ Success"
            Details = "All tests passed"
        }
    } catch {
        $error = "Tests failed: $($_.Exception.Message)"
        $errors += $error
        $deploymentSteps += @{
            Step = "Test"
            Status = "❌ Failed"
            Details = $error
        }
    }
}

# Step 3: Quality Check
Write-Host "`n🔍 Step 3: Quality Check..." -ForegroundColor Yellow
try {
    # Run content quality analysis
    & .\.automation\testing\content-quality\analyze_content.ps1 -Export
    $deploymentSteps += @{
        Step = "Quality Check"
        Status = "✅ Success"
        Details = "Content quality analyzed"
    }
} catch {
    $error = "Quality check failed: $($_.Exception.Message)"
    $errors += $error
    $deploymentSteps += @{
        Step = "Quality Check"
        Status = "❌ Failed"
        Details = $error
    }
}

# Step 4: Format Check
Write-Host "`n📝 Step 4: Format Check..." -ForegroundColor Yellow
try {
    & .\.automation\utilities\format_markdown.ps1 -Path "chapters" -Recursive
    $deploymentSteps += @{
        Step = "Format Check"
        Status = "✅ Success"
        Details = "Format check completed"
    }
} catch {
    $error = "Format check failed: $($_.Exception.Message)"
    $errors += $error
    $deploymentSteps += @{
        Step = "Format Check"
        Status = "❌ Failed"
        Details = $error
    }
}

# Step 5: Deploy based on target
if ($Publish) {
    Write-Host "`n📤 Step 5: Publishing..." -ForegroundColor Yellow
    
    switch ($Target.ToLower()) {
        "local" {
            try {
                # Local deployment - copy to local directory
                $localPath = "C:\Books\MarsBook"
                if (!(Test-Path $localPath)) {
                    New-Item -ItemType Directory -Path $localPath -Force | Out-Null
                }
                
                Copy-Item "print_output\*" $localPath -Recurse -Force
                $deploymentSteps += @{
                    Step = "Local Deploy"
                    Status = "✅ Success"
                    Details = "Deployed to $localPath"
                }
            } catch {
                $error = "Local deployment failed: $($_.Exception.Message)"
                $errors += $error
                $deploymentSteps += @{
                    Step = "Local Deploy"
                    Status = "❌ Failed"
                    Details = $error
                }
            }
        }
        "github" {
            try {
                # GitHub deployment - commit and push
                git add .
                git commit -m "Deploy version $Version"
                git push origin main
                $deploymentSteps += @{
                    Step = "GitHub Deploy"
                    Status = "✅ Success"
                    Details = "Pushed to GitHub"
                }
            } catch {
                $error = "GitHub deployment failed: $($_.Exception.Message)"
                $errors += $error
                $deploymentSteps += @{
                    Step = "GitHub Deploy"
                    Status = "❌ Failed"
                    Details = $error
                }
            }
        }
        "website" {
            try {
                # Website deployment - upload to web server
                Write-Host "🌐 Website deployment not implemented yet" -ForegroundColor Yellow
                $deploymentSteps += @{
                    Step = "Website Deploy"
                    Status = "⚠️ Not Implemented"
                    Details = "Website deployment not configured"
                }
            } catch {
                $error = "Website deployment failed: $($_.Exception.Message)"
                $errors += $error
                $deploymentSteps += @{
                    Step = "Website Deploy"
                    Status = "❌ Failed"
                    Details = $error
                }
            }
        }
        default {
            $error = "Unknown deployment target: $Target"
            $errors += $error
            $deploymentSteps += @{
                Step = "Deploy"
                Status = "❌ Failed"
                Details = $error
            }
        }
    }
}

# Generate deployment report
$reportPath = ".automation/deployment/deployment-report-$(Get-Date -Format 'yyyy-MM-dd-HHmm').json"
$report = @{
    Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Version = $Version
    Target = $Target
    Steps = $deploymentSteps
    Errors = $errors
    Success = $errors.Count -eq 0
}

$report | ConvertTo-Json -Depth 3 | Out-File $reportPath -Encoding UTF8

# Display results
Write-Host "`n📊 Deployment Report:" -ForegroundColor Yellow
Write-Host "Version: $Version" -ForegroundColor White
Write-Host "Target: $Target" -ForegroundColor White
Write-Host "Success: $($report.Success)" -ForegroundColor $(if ($report.Success) { "Green" } else { "Red" })

Write-Host "`n📋 Steps:" -ForegroundColor Yellow
foreach ($step in $deploymentSteps) {
    Write-Host "  $($step.Step): $($step.Status)" -ForegroundColor White
    if ($step.Details) {
        Write-Host "    $($step.Details)" -ForegroundColor Gray
    }
}

if ($errors.Count -gt 0) {
    Write-Host "`n❌ Errors:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  $error" -ForegroundColor White
    }
}

Write-Host "`n📄 Full report saved to: $reportPath" -ForegroundColor Cyan

if ($report.Success) {
    Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n💥 Deployment failed. Check errors above." -ForegroundColor Red
    exit 1
}
