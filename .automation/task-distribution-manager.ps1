# Task Distribution Manager Script
# Manages automatic task distribution among developers

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("init", "add-developer", "add-task", "distribute", "rebalance", "analytics", "optimize", "status", "export", "import")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$DeveloperId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TaskId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Strategy = "hybrid", # skill-based, workload-balanced, learning-optimized, hybrid
    
    [Parameter(Mandatory=$false)]
    [string]$InputFile = "",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Production = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

# Configuration
$TaskDistributionDir = "task-distribution"
$DataDir = "$TaskDistributionDir\data"
$ConfigFile = "$TaskDistributionDir\config.json"
$EngineFile = "$TaskDistributionDir\distribution-engine.js"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Show-Header {
    Write-ColorOutput "👥 ManagerAgentAI Task Distribution Manager v2.4" -Color Header
    Write-ColorOutput "===============================================" -Color Header
}

function Test-NodeInstalled {
    try {
        $null = node --version
        return $true
    }
    catch {
        Write-ColorOutput "❌ Node.js is not installed or not in PATH" -Color Error
        return $false
    }
}

function Initialize-TaskDistribution {
    Write-ColorOutput "🚀 Initializing Task Distribution System..." -Color Info
    
    try {
        # Create directories
        if (-not (Test-Path $TaskDistributionDir)) {
            New-Item -ItemType Directory -Path $TaskDistributionDir -Force | Out-Null
        }
        
        if (-not (Test-Path $DataDir)) {
            New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
        }
        
        # Create package.json
        $packageJson = @{
            name = "manager-agent-ai-task-distribution"
            version = "2.4.0"
            description = "Automatic Task Distribution for ManagerAgentAI"
            main = "distribution-engine.js"
            scripts = @{
                start = "node distribution-engine.js"
                test = "node test-distribution.js"
                analytics = "node analytics.js"
            }
            dependencies = @{
                express = "^4.18.2"
                lodash = "^4.17.21"
                moment = "^2.29.4"
            }
        } | ConvertTo-Json -Depth 10
        
        $packageJson | Out-File -FilePath "$TaskDistributionDir\package.json" -Encoding UTF8
        
        # Create configuration file
        $config = @{
            workloadThreshold = 0.8
            balanceThreshold = 0.2
            learningWeight = 0.3
            efficiencyWeight = 0.7
            strategies = @("skill-based", "workload-balanced", "learning-optimized", "hybrid")
            defaultStrategy = "hybrid"
            autoRebalance = $true
            rebalanceInterval = 3600000
            analytics = @{
                enabled = $true
                retentionDays = 30
                metrics = @("workload", "skills", "performance", "learning")
            }
        } | ConvertTo-Json -Depth 10
        
        $config | Out-File -FilePath $ConfigFile -Encoding UTF8
        
        # Create sample data files
        $sampleDevelopers = @(
            @{
                id = "dev_001"
                name = "John Doe"
                email = "john.doe@company.com"
                skills = @(
                    @{ name = "JavaScript"; level = 8 },
                    @{ name = "React"; level = 7 },
                    @{ name = "Node.js"; level = 6 }
                )
                experience = @{
                    development = 5
                    frontend = 4
                    backend = 3
                }
                availability = 1.0
                learningGoals = @("TypeScript", "GraphQL")
                timezone = "UTC"
                workingHours = @{ start = 9; end = 17 }
            },
            @{
                id = "dev_002"
                name = "Jane Smith"
                email = "jane.smith@company.com"
                skills = @(
                    @{ name = "Python"; level = 9 },
                    @{ name = "Django"; level = 8 },
                    @{ name = "PostgreSQL"; level = 7 }
                )
                experience = @{
                    development = 6
                    backend = 5
                    database = 4
                }
                availability = 0.8
                learningGoals = @("Machine Learning", "Docker")
                timezone = "UTC"
                workingHours = @{ start = 8; end = 16 }
            }
        )
        
        $sampleDevelopers | ConvertTo-Json -Depth 10 | Out-File -FilePath "$DataDir\developers.json" -Encoding UTF8
        
        $sampleTasks = @(
            @{
                id = "task_001"
                title = "Implement user authentication"
                description = "Create JWT-based authentication system"
                priority = "high"
                complexity = "medium"
                estimatedHours = 16
                requiredSkills = @("JavaScript", "Node.js")
                preferredSkills = @("JWT", "Security")
                type = "development"
                difficulty = 6
                learningOpportunity = $true
            },
            @{
                id = "task_002"
                title = "Create API documentation"
                description = "Generate comprehensive API documentation"
                priority = "medium"
                complexity = "low"
                estimatedHours = 8
                requiredSkills = @("Documentation", "API")
                preferredSkills = @("Swagger", "OpenAPI")
                type = "documentation"
                difficulty = 3
                learningOpportunity = $false
            }
        )
        
        $sampleTasks | ConvertTo-Json -Depth 10 | Out-File -FilePath "$DataDir\tasks.json" -Encoding UTF8
        
        Write-ColorOutput "✅ Task Distribution System initialized successfully" -Color Success
        Write-ColorOutput "Configuration: $ConfigFile" -Color Info
        Write-ColorOutput "Data directory: $DataDir" -Color Info
    }
    catch {
        Write-ColorOutput "❌ Error initializing task distribution: $_" -Color Error
    }
}

function Add-Developer {
    param([string]$DeveloperId)
    
    if (-not $DeveloperId) {
        Write-ColorOutput "❌ Developer ID is required" -Color Error
        return
    }
    
    Write-ColorOutput "➕ Adding developer $DeveloperId..." -Color Info
    
    try {
        # Interactive developer creation
        $name = Read-Host "Enter developer name"
        $email = Read-Host "Enter email address"
        
        Write-ColorOutput "Enter skills (comma-separated):" -Color Info
        $skillsInput = Read-Host
        $skills = $skillsInput -split ',' | ForEach-Object { 
            @{ name = $_.Trim(); level = 5 } 
        }
        
        $developer = @{
            id = $DeveloperId
            name = $name
            email = $email
            skills = $skills
            experience = @{
                development = 3
            }
            availability = 1.0
            learningGoals = @()
            timezone = "UTC"
            workingHours = @{ start = 9; end = 17 }
        }
        
        # Load existing developers
        $developers = @()
        if (Test-Path "$DataDir\developers.json") {
            $developers = Get-Content "$DataDir\developers.json" | ConvertFrom-Json
        }
        
        # Add new developer
        $developers += $developer
        
        # Save updated developers
        $developers | ConvertTo-Json -Depth 10 | Out-File -FilePath "$DataDir\developers.json" -Encoding UTF8
        
        Write-ColorOutput "✅ Developer $DeveloperId added successfully" -Color Success
    }
    catch {
        Write-ColorOutput "❌ Error adding developer: $_" -Color Error
    }
}

function Add-Task {
    param([string]$TaskId)
    
    if (-not $TaskId) {
        Write-ColorOutput "❌ Task ID is required" -Color Error
        return
    }
    
    Write-ColorOutput "➕ Adding task $TaskId..." -Color Info
    
    try {
        # Interactive task creation
        $title = Read-Host "Enter task title"
        $description = Read-Host "Enter task description"
        
        Write-ColorOutput "Enter priority (low/medium/high/critical):" -Color Info
        $priority = Read-Host
        
        Write-ColorOutput "Enter complexity (low/medium/high):" -Color Info
        $complexity = Read-Host
        
        $estimatedHours = Read-Host "Enter estimated hours"
        $estimatedHours = [int]$estimatedHours
        
        Write-ColorOutput "Enter required skills (comma-separated):" -Color Info
        $requiredSkillsInput = Read-Host
        $requiredSkills = $requiredSkillsInput -split ',' | ForEach-Object { $_.Trim() }
        
        $task = @{
            id = $TaskId
            title = $title
            description = $description
            priority = $priority
            complexity = $complexity
            estimatedHours = $estimatedHours
            requiredSkills = $requiredSkills
            preferredSkills = @()
            type = "development"
            difficulty = 5
            learningOpportunity = $false
        }
        
        # Load existing tasks
        $tasks = @()
        if (Test-Path "$DataDir\tasks.json") {
            $tasks = Get-Content "$DataDir\tasks.json" | ConvertFrom-Json
        }
        
        # Add new task
        $tasks += $task
        
        # Save updated tasks
        $tasks | ConvertTo-Json -Depth 10 | Out-File -FilePath "$DataDir\tasks.json" -Encoding UTF8
        
        Write-ColorOutput "✅ Task $TaskId added successfully" -Color Success
    }
    catch {
        Write-ColorOutput "❌ Error adding task: $_" -Color Error
    }
}

function Distribute-Tasks {
    param([string]$Strategy)
    
    Write-ColorOutput "🔄 Distributing tasks using strategy: $Strategy..." -Color Info
    
    try {
        $distributeScript = @"
const TaskDistributionEngine = require('./distribution-engine');

// Initialize engine
const engine = new TaskDistributionEngine({
    workloadThreshold: 0.8,
    balanceThreshold: 0.2,
    learningWeight: 0.3,
    efficiencyWeight: 0.7
});

// Load developers
const developers = require('./data/developers.json');
developers.forEach(dev => engine.registerDeveloper(dev));

// Load tasks
const tasks = require('./data/tasks.json');
tasks.forEach(task => engine.registerTask(task));

// Distribute tasks
const result = engine.distributeTasks('$Strategy');

console.log('Distribution Result:');
console.log(JSON.stringify(result, null, 2));

// Get analytics
const analytics = engine.getAnalytics();
console.log('\nAnalytics:');
console.log(JSON.stringify(analytics, null, 2));
"@
        
        $distributeScript | Out-File -FilePath "$TaskDistributionDir\distribute.js" -Encoding UTF8
        
        # Run distribution
        Push-Location $TaskDistributionDir
        node distribute.js
        Pop-Location
        
        Write-ColorOutput "✅ Task distribution completed successfully" -Color Success
    }
    catch {
        Write-ColorOutput "❌ Error distributing tasks: $_" -Color Error
    }
}

function Rebalance-Tasks {
    Write-ColorOutput "⚖️ Rebalancing task distribution..." -Color Info
    
    try {
        $rebalanceScript = @"
const TaskDistributionEngine = require('./distribution-engine');

// Initialize engine
const engine = new TaskDistributionEngine();

// Load data
const developers = require('./data/developers.json');
const tasks = require('./data/tasks.json');

developers.forEach(dev => engine.registerDeveloper(dev));
tasks.forEach(task => engine.registerTask(task));

// Optimize distribution
engine.optimizeDistribution();

console.log('Rebalancing completed');
"@
        
        $rebalanceScript | Out-File -FilePath "$TaskDistributionDir\rebalance.js" -Encoding UTF8
        
        # Run rebalancing
        Push-Location $TaskDistributionDir
        node rebalance.js
        Pop-Location
        
        Write-ColorOutput "✅ Task rebalancing completed successfully" -Color Success
    }
    catch {
        Write-ColorOutput "❌ Error rebalancing tasks: $_" -Color Error
    }
}

function Show-Analytics {
    Write-ColorOutput "📊 Task Distribution Analytics:" -Color Info
    Write-ColorOutput "===============================" -Color Info
    
    try {
        $analyticsScript = @"
const TaskDistributionEngine = require('./distribution-engine');

// Initialize engine
const engine = new TaskDistributionEngine();

// Load data
const developers = require('./data/developers.json');
const tasks = require('./data/tasks.json');

developers.forEach(dev => engine.registerDeveloper(dev));
tasks.forEach(task => engine.registerTask(task));

// Get analytics
const analytics = engine.getAnalytics();

console.log('=== TASK DISTRIBUTION ANALYTICS ===');
console.log('Total Developers:', analytics.totalDevelopers);
console.log('Total Tasks:', analytics.totalTasks);
console.log('Assigned Tasks:', analytics.assignedTasks);
console.log('Average Workload:', analytics.averageWorkload.toFixed(2), 'hours');
console.log('Distribution History:', analytics.distributionHistory, 'distributions');

console.log('\n=== SKILL COVERAGE ===');
Object.entries(analytics.skillCoverage).forEach(([skill, count]) => {
    console.log(\`\${skill}: \${count} developers\`);
});

console.log('\n=== DEVELOPER WORKLOAD ===');
developers.forEach(dev => {
    console.log(\`\${dev.name}: \${dev.currentWorkload || 0} hours\`);
});
"@
        
        $analyticsScript | Out-File -FilePath "$TaskDistributionDir\analytics.js" -Encoding UTF8
        
        # Run analytics
        Push-Location $TaskDistributionDir
        node analytics.js
        Pop-Location
    }
    catch {
        Write-ColorOutput "❌ Error generating analytics: $_" -Color Error
    }
}

function Optimize-Distribution {
    Write-ColorOutput "🎯 Optimizing task distribution..." -Color Info
    
    try {
        $optimizeScript = @"
const TaskDistributionEngine = require('./distribution-engine');

// Initialize engine
const engine = new TaskDistributionEngine();

// Load data
const developers = require('./data/developers.json');
const tasks = require('./data/tasks.json');

developers.forEach(dev => engine.registerDeveloper(dev));
tasks.forEach(task => engine.registerTask(task));

// Optimize distribution
engine.optimizeDistribution();

console.log('Distribution optimization completed');
"@
        
        $optimizeScript | Out-File -FilePath "$TaskDistributionDir\optimize.js" -Encoding UTF8
        
        # Run optimization
        Push-Location $TaskDistributionDir
        node optimize.js
        Pop-Location
        
        Write-ColorOutput "✅ Distribution optimization completed successfully" -Color Success
    }
    catch {
        Write-ColorOutput "❌ Error optimizing distribution: $_" -Color Error
    }
}

function Show-Status {
    Write-ColorOutput "📋 Task Distribution Status:" -Color Info
    Write-ColorOutput "============================" -Color Info
    
    try {
        if (Test-Path "$DataDir\developers.json") {
            $developers = Get-Content "$DataDir\developers.json" | ConvertFrom-Json
            Write-ColorOutput "Developers: $($developers.Count)" -Color Info
        } else {
            Write-ColorOutput "No developers found" -Color Warning
        }
        
        if (Test-Path "$DataDir\tasks.json") {
            $tasks = Get-Content "$DataDir\tasks.json" | ConvertFrom-Json
            Write-ColorOutput "Tasks: $($tasks.Count)" -Color Info
        } else {
            Write-ColorOutput "No tasks found" -Color Warning
        }
        
        if (Test-Path $ConfigFile) {
            $config = Get-Content $ConfigFile | ConvertFrom-Json
            Write-ColorOutput "Default Strategy: $($config.defaultStrategy)" -Color Info
            Write-ColorOutput "Workload Threshold: $($config.workloadThreshold)" -Color Info
            Write-ColorOutput "Balance Threshold: $($config.balanceThreshold)" -Color Info
        }
    }
    catch {
        Write-ColorOutput "❌ Error getting status: $_" -Color Error
    }
}

function Export-Data {
    param([string]$OutputFile)
    
    if (-not $OutputFile) {
        $OutputFile = "task-distribution-export-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    }
    
    Write-ColorOutput "📤 Exporting data to $OutputFile..." -Color Info
    
    try {
        $exportData = @{
            timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ'
            developers = if (Test-Path "$DataDir\developers.json") { Get-Content "$DataDir\developers.json" | ConvertFrom-Json } else { @() }
            tasks = if (Test-Path "$DataDir\tasks.json") { Get-Content "$DataDir\tasks.json" | ConvertFrom-Json } else { @() }
            config = if (Test-Path $ConfigFile) { Get-Content $ConfigFile | ConvertFrom-Json } else { @{} }
        }
        
        $exportData | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
        
        Write-ColorOutput "✅ Data exported successfully to $OutputFile" -Color Success
    }
    catch {
        Write-ColorOutput "❌ Error exporting data: $_" -Color Error
    }
}

function Import-Data {
    param([string]$InputFile)
    
    if (-not $InputFile) {
        Write-ColorOutput "❌ Input file is required" -Color Error
        return
    }
    
    if (-not (Test-Path $InputFile)) {
        Write-ColorOutput "❌ Input file not found: $InputFile" -Color Error
        return
    }
    
    Write-ColorOutput "📥 Importing data from $InputFile..." -Color Info
    
    try {
        $importData = Get-Content $InputFile | ConvertFrom-Json
        
        if ($importData.developers) {
            $importData.developers | ConvertTo-Json -Depth 10 | Out-File -FilePath "$DataDir\developers.json" -Encoding UTF8
            Write-ColorOutput "✅ Developers imported successfully" -Color Success
        }
        
        if ($importData.tasks) {
            $importData.tasks | ConvertTo-Json -Depth 10 | Out-File -FilePath "$DataDir\tasks.json" -Encoding UTF8
            Write-ColorOutput "✅ Tasks imported successfully" -Color Success
        }
        
        if ($importData.config) {
            $importData.config | ConvertTo-Json -Depth 10 | Out-File -FilePath $ConfigFile -Encoding UTF8
            Write-ColorOutput "✅ Configuration imported successfully" -Color Success
        }
    }
    catch {
        Write-ColorOutput "❌ Error importing data: $_" -Color Error
    }
}

# Main execution
Show-Header

# Check prerequisites
if (-not (Test-NodeInstalled)) {
    Write-ColorOutput "❌ Node.js is required but not installed" -Color Error
    exit 1
}

# Execute action
switch ($Action) {
    "init" { Initialize-TaskDistribution }
    "add-developer" { Add-Developer -DeveloperId $DeveloperId }
    "add-task" { Add-Task -TaskId $TaskId }
    "distribute" { Distribute-Tasks -Strategy $Strategy }
    "rebalance" { Rebalance-Tasks }
    "analytics" { Show-Analytics }
    "optimize" { Optimize-Distribution }
    "status" { Show-Status }
    "export" { Export-Data -OutputFile $OutputFile }
    "import" { Import-Data -InputFile $InputFile }
    default {
        Write-ColorOutput "❌ Unknown action: $Action" -Color Error
        exit 1
    }
}

Write-ColorOutput "`n🎉 Operation completed!" -Color Success
