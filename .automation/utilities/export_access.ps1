param(
    [string]$Quarter = "2025-Q3"
)

$ErrorActionPreference = 'Stop'

# Prepare output directory
$outDir = Join-Path -Path "docs/access-reviews" -ChildPath $Quarter
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

# RBAC export (skeleton)
$rbac = @{ roles = @{ admin = @(); editor = @(); viewer = @() }; metadata = @{ generatedAt = (Get-Date).ToString('o') } } | ConvertTo-Json -Depth 4
$rbacPath = Join-Path $outDir "rbac-export-$Quarter.json"
$rbac | Out-File -FilePath $rbacPath -Encoding UTF8

# Repo admins CSV (skeleton)
$repoAdminsPath = Join-Path $outDir "repo-admins-$Quarter.csv"
"repo,admin" | Out-File -FilePath $repoAdminsPath -Encoding UTF8

# Cloud admins CSV (skeleton)
$cloudAdminsPath = Join-Path $outDir "cloud-admins-$Quarter.csv"
"cloud,principal" | Out-File -FilePath $cloudAdminsPath -Encoding UTF8

# Vendors CSV (skeleton)
$vendorsPath = Join-Path $outDir "vendors-$Quarter.csv"
"vendor,access,owner" | Out-File -FilePath $vendorsPath -Encoding UTF8

Write-Host "✅ Access review artifacts generated in $outDir"
