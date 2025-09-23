# Migration Script: Old System to DEV->PROM->PROD
# Version: 1.0
# Description: Automatically migrates from old .automation/.manager system to new DEV->PROM->PROD system

param(
    [switch]$Force = $false,
    [switch]$Backup = $true,
    [switch]$DryRun = $false,
    [string]$BackupPath = "F:\ProjectsAI\ManagerAgentAI-Backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
)

# Configuration
$LOG_PATH = "F:\ProjectsAI\logs"
$LEGACY_PATH = ".legacy"

# Create logs directory if it doesn't exist
if (-not (Test-Path $LOG_PATH)) {
    New-Item -ItemType Directory -Path $LOG_PATH -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path "$LOG_PATH\migration.log" -Value $logMessage
}

# Display banner
function Show-Banner {
    Write-Host "`n🔄 Migration Script: Old System → DEV->PROM->PROD" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
    Write-Host "Backup: $Backup" -ForegroundColor Yellow
    Write-Host "Force: $Force" -ForegroundColor Yellow
    Write-Host "DryRun: $DryRun" -ForegroundColor Yellow
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
    Write-Host ""
}

# Function to create backup
function New-Backup {
    if (-not $Backup) {
        Write-Log "⏭️ Backup disabled, skipping..." "INFO"
        return $true
    }

    Write-Log "📦 Creating backup of current system..." "INFO"
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would create backup at $BackupPath" "INFO"
        return $true
    }

    try {
        Copy-Item -Path "." -Destination $BackupPath -Recurse -Force
        Write-Log "✅ Backup created successfully: $BackupPath" "SUCCESS"
        return $true
    } catch {
        Write-Log "❌ Backup failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to analyze old system
function Get-OldSystemAnalysis {
    Write-Log "🔍 Analyzing old system structure..." "INFO"
    
    $analysis = @{
        automationExists = Test-Path ".automation"
        managerExists = Test-Path ".manager"
        oldScripts = @()
        projects = @()
    }

    # Check for old directories
    if ($analysis.automationExists) {
        $analysis.oldScripts += Get-ChildItem -Path ".automation" -Recurse -File -Name
        Write-Log "📁 Found .automation directory with $($analysis.oldScripts.Count) files" "INFO"
    }

    if ($analysis.managerExists) {
        $analysis.oldScripts += Get-ChildItem -Path ".manager" -Recurse -File -Name
        Write-Log "📁 Found .manager directory with $($analysis.oldScripts.Count) files" "INFO"
    }

    # Find existing projects
    $projectDirs = Get-ChildItem -Path "F:\ProjectsAI" -Directory | Where-Object { 
        $_.Name -ne "ManagerAgentAI" -and $_.Name -notlike "ManagerAgentAI*"
    }
    $analysis.projects = $projectDirs | Select-Object Name, FullName

    Write-Log "📋 Found $($analysis.projects.Count) existing projects" "INFO"
    
    return $analysis
}

# Function to create legacy archive
function New-LegacyArchive {
    Write-Log "📦 Creating legacy archive..." "INFO"
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would create .legacy directory and move old system" "INFO"
        return $true
    }

    try {
        # Create legacy directory
        if (-not (Test-Path $LEGACY_PATH)) {
            New-Item -ItemType Directory -Path $LEGACY_PATH -Force | Out-Null
            Write-Log "📁 Created .legacy directory" "INFO"
        }

        # Move old directories to legacy
        if (Test-Path ".automation") {
            Move-Item -Path ".automation" -Destination "$LEGACY_PATH\automation" -Force
            Write-Log "📁 Moved .automation to .legacy\automation" "INFO"
        }

        if (Test-Path ".manager") {
            Move-Item -Path ".manager" -Destination "$LEGACY_PATH\manager" -Force
            Write-Log "📁 Moved .manager to .legacy\manager" "INFO"
        }

        # Create migration index
        $migrationIndex = @{
            migrationDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            originalStructure = @{
                automation = ".legacy\automation"
                manager = ".legacy\manager"
            }
            newStructure = @{
                scripts = "scripts\"
                config = "config\"
                docs = "docs\deployment\"
            }
            migrationNotes = "Migrated from old .automation/.manager system to new DEV->PROM->PROD system"
            backupPath = $BackupPath
        }

        $migrationIndex | ConvertTo-Json -Depth 3 | Out-File -FilePath "$LEGACY_PATH\migration-index.json" -Encoding UTF8
        Write-Log "📋 Created migration index" "INFO"

        return $true
    } catch {
        Write-Log "❌ Legacy archive creation failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to setup new system
function Initialize-NewSystem {
    Write-Log "🚀 Setting up new DEV->PROM->PROD system..." "INFO"
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would setup new system directories and files" "INFO"
        return $true
    }

    try {
        # Create necessary directories
        $newDirs = @(
            "F:\ProjectsAI\logs",
            "config",
            "docs\migration"
        )

        foreach ($dir in $newDirs) {
            if (-not (Test-Path $dir)) {
                New-Item -ItemType Directory -Path $dir -Force | Out-Null
                Write-Log "📁 Created directory: $dir" "INFO"
            }
        }

        # Verify new scripts exist
        $requiredScripts = @(
            "scripts\deploy-to-prom.ps1",
            "scripts\deploy-to-prod.ps1",
            "scripts\deployment-manager.ps1"
        )

        foreach ($script in $requiredScripts) {
            if (Test-Path $script) {
                Write-Log "✅ Found required script: $script" "SUCCESS"
            } else {
                Write-Log "❌ Missing required script: $script" "ERROR"
                return $false
            }
        }

        return $true
    } catch {
        Write-Log "❌ New system setup failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to migrate projects
function Migrate-Projects {
    param([array]$Projects)
    
    Write-Log "🔄 Migrating projects to new system..." "INFO"
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would migrate $($Projects.Count) projects" "INFO"
        return $true
    }

    try {
        foreach ($project in $Projects) {
            Write-Log "📋 Migrating project: $($project.Name)" "INFO"
            
            # Check if project already exists in new structure
            $newProjectPath = "F:\ProjectsAI\$($project.Name)"
            if ((Test-Path $newProjectPath) -and -not $Force) {
                Write-Log "⚠️ Project $($project.Name) already exists, skipping (use -Force to overwrite)" "WARNING"
                continue
            }

            # Create project directory
            if (-not (Test-Path $newProjectPath)) {
                New-Item -ItemType Directory -Path $newProjectPath -Force | Out-Null
            }

            # Copy project files
            Copy-Item -Path "$($project.FullName)\*" -Destination $newProjectPath -Recurse -Force
            Write-Log "✅ Migrated project: $($project.Name)" "SUCCESS"
        }

        return $true
    } catch {
        Write-Log "❌ Project migration failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to update configuration
function Update-Configuration {
    Write-Log "⚙️ Updating configuration files..." "INFO"
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would update configuration files" "INFO"
        return $true
    }

    try {
        # Update cursor.json
        if (Test-Path "cursor.json") {
            $cursorConfig = Get-Content "cursor.json" | ConvertFrom-Json
            
            # Add migration note
            if (-not $cursorConfig.ai_instructions) {
                $cursorConfig | Add-Member -MemberType NoteProperty -Name "ai_instructions" -Value @()
            }
            
            $cursorConfig.ai_instructions += "System migrated from old .automation/.manager to DEV->PROM->PROD on $(Get-Date -Format 'yyyy-MM-dd')"
            $cursorConfig.ai_instructions += "Legacy system archived in .legacy/ directory"
            
            $cursorConfig | ConvertTo-Json -Depth 3 | Out-File -FilePath "cursor.json" -Encoding UTF8
            Write-Log "✅ Updated cursor.json" "SUCCESS"
        }

        # Update README.md
        if (Test-Path "README.md") {
            $migrationNote = @"

## 🔄 System Migration Notice

**Migrated on:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

The project management system has been migrated from the old `.automation/.manager` structure to the new **DEV->PROM->PROD** deployment system.

### What Changed
- **Old system:** `.automation/`, `.manager/` directories
- **New system:** `scripts/`, `config/`, `docs/deployment/` with DEV->PROM->PROD workflow
- **Legacy archive:** Old system moved to `.legacy/` directory

### How to Use New System
```powershell
# Full workflow
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action all

# Individual steps
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action prom
.\scripts\deployment-manager.ps1 -ProjectName "MyProject" -Action prod
```

See `docs/migration/Migration-Guide-Old-to-New.md` for detailed migration information.

"@
            
            Add-Content -Path "README.md" -Value $migrationNote
            Write-Log "✅ Updated README.md" "SUCCESS"
        }

        return $true
    } catch {
        Write-Log "❌ Configuration update failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to validate migration
function Test-Migration {
    Write-Log "🧪 Validating migration..." "INFO"
    
    $validationChecks = @(
        @{Name="Legacy Archive"; Path=".legacy\migration-index.json"},
        @{Name="PROM Script"; Path="scripts\deploy-to-prom.ps1"},
        @{Name="PROD Script"; Path="scripts\deploy-to-prod.ps1"},
        @{Name="Manager Script"; Path="scripts\deployment-manager.ps1"},
        @{Name="Config"; Path="config\deployment-config.json"},
        @{Name="Documentation"; Path="docs\deployment\DEV-PROM-PROD-Workflow.md"}
    )

    $allPassed = $true
    foreach ($check in $validationChecks) {
        if (Test-Path $check.Path) {
            Write-Log "✅ $($check.Name) - OK" "SUCCESS"
        } else {
            Write-Log "❌ $($check.Name) - Missing" "ERROR"
            $allPassed = $false
        }
    }

    return $allPassed
}

# Main migration process
try {
    Show-Banner

    # Step 1: Create backup
    if (-not (New-Backup)) {
        Write-Log "❌ Backup creation failed. Exiting." "ERROR"
        exit 1
    }

    # Step 2: Analyze old system
    $analysis = Get-OldSystemAnalysis
    Write-Log "📊 Analysis complete: $($analysis.oldScripts.Count) old files, $($analysis.projects.Count) projects" "INFO"

    # Step 3: Create legacy archive
    if (-not (New-LegacyArchive)) {
        Write-Log "❌ Legacy archive creation failed. Exiting." "ERROR"
        exit 1
    }

    # Step 4: Setup new system
    if (-not (Initialize-NewSystem)) {
        Write-Log "❌ New system setup failed. Exiting." "ERROR"
        exit 1
    }

    # Step 5: Migrate projects
    if ($analysis.projects.Count -gt 0) {
        if (-not (Migrate-Projects -Projects $analysis.projects)) {
            Write-Log "❌ Project migration failed. Exiting." "ERROR"
            exit 1
        }
    }

    # Step 6: Update configuration
    if (-not (Update-Configuration)) {
        Write-Log "❌ Configuration update failed. Exiting." "ERROR"
        exit 1
    }

    # Step 7: Validate migration
    if (-not (Test-Migration)) {
        Write-Log "❌ Migration validation failed." "ERROR"
        exit 1
    }

    Write-Log "🎉 Migration completed successfully!" "SUCCESS"
    
    Write-Host "`n🎉 Migration Completed Successfully!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Old system archived in: .legacy/" -ForegroundColor Yellow
    Write-Host "New system ready for use!" -ForegroundColor Yellow
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test new system: .\scripts\deployment-manager.ps1 -ProjectName 'TestProject' -Action status" -ForegroundColor White
    Write-Host "2. Read documentation: docs\migration\Migration-Guide-Old-to-New.md" -ForegroundColor White
    Write-Host "3. Start using new workflow!" -ForegroundColor White

} catch {
    Write-Log "❌ Migration failed: $($_.Exception.Message)" "ERROR"
    Write-Host "`n❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
