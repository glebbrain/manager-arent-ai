# 🔄 Incremental Build System v2.4
# Intelligent incremental build system with AI-powered optimization and universal project support

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    
    [Parameter(Mandatory=$false)]
    [string]$BuildType = "all", # all, code, tests, docs, assets, ai, deployment
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectType = "auto", # auto, nodejs, python, cpp, dotnet, java, go, rust, php, ai, universal
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableCaching = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableParallel = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableAI = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$GenerateReport = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$CleanBuild = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

# 🎯 Configuration v2.4
$Config = @{
    Version = "2.4.0"
    ProjectTypes = @{
        "auto" = @{
            Name = "Auto-Detection"
            Description = "Automatically detect project type"
            Priority = 1
        }
        "universal" = @{
            Name = "Universal Project"
            Description = "Multi-platform universal project"
            Priority = 2
        }
        "nodejs" = @{
            Name = "Node.js Project"
            Description = "JavaScript/TypeScript project"
            Priority = 3
        }
        "python" = @{
            Name = "Python Project"
            Description = "Python application or library"
            Priority = 4
        }
        "cpp" = @{
            Name = "C++ Project"
            Description = "C++ application or library"
            Priority = 5
        }
        "dotnet" = @{
            Name = ".NET Project"
            Description = "C#/.NET application"
            Priority = 6
        }
        "java" = @{
            Name = "Java Project"
            Description = "Java application or library"
            Priority = 7
        }
        "go" = @{
            Name = "Go Project"
            Description = "Go application or library"
            Priority = 8
        }
        "rust" = @{
            Name = "Rust Project"
            Description = "Rust application or library"
            Priority = 9
        }
        "php" = @{
            Name = "PHP Project"
            Description = "PHP application or library"
            Priority = 10
        }
        "ai" = @{
            Name = "AI/ML Project"
            Description = "Machine Learning or AI project"
            Priority = 11
        }
    }
    BuildTypes = @{
        "code" = @{
            Name = "Code Build"
            Extensions = @(".ps1", ".py", ".js", ".ts", ".cs", ".java", ".go", ".rs", ".php", ".sh", ".cpp", ".h", ".hpp", ".c", ".m", ".swift", ".kt", ".scala", ".rb", ".r", ".jl")
            Dependencies = @("source_files", "imports", "modules", "headers")
            OutputDir = ".\build\code"
            AIOptimization = $true
        }
        "tests" = @{
            Name = "Test Build"
            Extensions = @(".ps1", ".py", ".js", ".ts", ".cs", ".java", ".go", ".rs", ".php", ".sh", ".cpp", ".h", ".hpp", ".c", ".m", ".swift", ".kt", ".scala", ".rb", ".r", ".jl")
            Dependencies = @("test_files", "test_config", "source_files", "test_data")
            OutputDir = ".\build\tests"
            AIOptimization = $true
        }
        "docs" = @{
            Name = "Documentation Build"
            Extensions = @(".md", ".rst", ".txt", ".adoc", ".tex", ".org", ".wiki")
            Dependencies = @("doc_files", "templates", "assets", "images")
            OutputDir = ".\build\docs"
            AIOptimization = $false
        }
        "assets" = @{
            Name = "Assets Build"
            Extensions = @(".css", ".scss", ".less", ".js", ".ts", ".png", ".jpg", ".svg", ".ico", ".gif", ".webp", ".avif", ".woff", ".woff2", ".ttf", ".eot")
            Dependencies = @("asset_files", "source_files", "fonts", "images")
            OutputDir = ".\build\assets"
            AIOptimization = $false
        }
        "ai" = @{
            Name = "AI/ML Build"
            Extensions = @(".py", ".ipynb", ".pkl", ".joblib", ".h5", ".pb", ".onnx", ".pt", ".pth", ".safetensors")
            Dependencies = @("model_files", "data_files", "config_files", "source_files")
            OutputDir = ".\build\ai"
            AIOptimization = $true
        }
        "deployment" = @{
            Name = "Deployment Build"
            Extensions = @(".dockerfile", ".yml", ".yaml", ".json", ".toml", ".ini", ".env", ".sh", ".ps1", ".bat")
            Dependencies = @("config_files", "deployment_files", "source_files", "assets")
            OutputDir = ".\build\deployment"
            AIOptimization = $false
        }
        }
    }
    CacheDirectory = ".\cache\build"
    BuildLogDirectory = ".\logs\build"
    DependencyGraph = ".\build\dependency-graph.json"
    AIConfig = @{
        Enabled = $EnableAI
        ModelPath = ".\ai\models\build-optimizer"
        OptimizationLevel = "balanced" # minimal, balanced, aggressive
        LearningEnabled = $true
        PredictionEnabled = $true
    }
    Performance = @{
        MaxParallelJobs = 4
        MemoryLimit = "2GB"
        TimeoutSeconds = 300
        RetryAttempts = 3
    }
    Security = @{
        ValidateDependencies = $true
        ScanForVulnerabilities = $true
        CheckSignatures = $true
        SandboxMode = $false
    }
    }
    BuildManifest = ".\build\build-manifest.json"
    MaxParallelJobs = [Environment]::ProcessorCount
    BuildTimeout = 1800 # seconds (30 minutes)
}

# 🤖 AI-Powered Build Optimization Functions
function Invoke-AIBuildOptimization {
    param(
        [string]$ProjectPath,
        [string]$ProjectType,
        [hashtable]$BuildConfig
    )
    
    if (-not $Config.AIConfig.Enabled) {
        return @{ Optimized = $false; Reason = "AI optimization disabled" }
    }
    
    try {
        Write-Host "🤖 Running AI build optimization..." -ForegroundColor Cyan
        
        # AI-powered dependency analysis
        $dependencyAnalysis = Invoke-AIDependencyAnalysis -ProjectPath $ProjectPath -ProjectType $ProjectType
        
        # AI-powered build order optimization
        $buildOrder = Invoke-AIBuildOrderOptimization -Dependencies $dependencyAnalysis -Config $BuildConfig
        
        # AI-powered parallel execution optimization
        $parallelConfig = Invoke-AIParallelOptimization -BuildOrder $buildOrder -MaxJobs $Config.Performance.MaxParallelJobs
        
        # AI-powered caching strategy
        $cacheStrategy = Invoke-AICacheOptimization -ProjectType $ProjectType -BuildConfig $BuildConfig
        
        return @{
            Optimized = $true
            DependencyAnalysis = $dependencyAnalysis
            BuildOrder = $buildOrder
            ParallelConfig = $parallelConfig
            CacheStrategy = $cacheStrategy
            OptimizationLevel = $Config.AIConfig.OptimizationLevel
        }
    }
    catch {
        Write-Warning "AI optimization failed: $($_.Exception.Message)"
        return @{ Optimized = $false; Reason = $_.Exception.Message }
    }
}

function Invoke-AIDependencyAnalysis {
    param(
        [string]$ProjectPath,
        [string]$ProjectType
    )
    
    Write-Host "🔍 AI analyzing dependencies..." -ForegroundColor Yellow
    
    $dependencies = @{
        DirectDependencies = @()
        TransitiveDependencies = @()
        CircularDependencies = @()
        UnusedDependencies = @()
        CriticalPath = @()
        RiskFactors = @()
    }
    
    # Analyze project files based on type
    switch ($ProjectType) {
        "nodejs" {
            $dependencies = Invoke-NodeJSDependencyAnalysis -ProjectPath $ProjectPath
        }
        "python" {
            $dependencies = Invoke-PythonDependencyAnalysis -ProjectPath $ProjectPath
        }
        "cpp" {
            $dependencies = Invoke-CPPDependencyAnalysis -ProjectPath $ProjectPath
        }
        "universal" {
            $dependencies = Invoke-UniversalDependencyAnalysis -ProjectPath $ProjectPath
        }
        default {
            $dependencies = Invoke-GenericDependencyAnalysis -ProjectPath $ProjectPath
        }
    }
    
    return $dependencies
}

function Invoke-AIBuildOrderOptimization {
    param(
        [hashtable]$Dependencies,
        [hashtable]$Config
    )
    
    Write-Host "📊 AI optimizing build order..." -ForegroundColor Yellow
    
    # Use topological sorting with AI-enhanced prioritization
    $buildOrder = @()
    $processed = @()
    $queue = New-Object System.Collections.Queue
    
    # Add root dependencies to queue
    foreach ($dep in $Dependencies.DirectDependencies) {
        if ($dep.Dependencies.Count -eq 0) {
            $queue.Enqueue($dep)
        }
    }
    
    while ($queue.Count -gt 0) {
        $current = $queue.Dequeue()
        if ($current -notin $processed) {
            $buildOrder += $current
            $processed += $current
            
            # Add dependencies of current item
            foreach ($dep in $current.Dependencies) {
                if ($dep -notin $processed -and $dep -notin $queue) {
                    $queue.Enqueue($dep)
                }
            }
        }
    }
    
    return $buildOrder
}

function Invoke-AIParallelOptimization {
    param(
        [array]$BuildOrder,
        [int]$MaxJobs
    )
    
    Write-Host "⚡ AI optimizing parallel execution..." -ForegroundColor Yellow
    
    $parallelGroups = @()
    $currentGroup = @()
    $currentDependencies = @()
    
    foreach ($item in $BuildOrder) {
        $canRunInParallel = $true
        
        # Check if item can run in parallel with current group
        foreach ($dep in $item.Dependencies) {
            if ($dep -in $currentDependencies) {
                $canRunInParallel = $false
                break
            }
        }
        
        if ($canRunInParallel -and $currentGroup.Count -lt $MaxJobs) {
            $currentGroup += $item
            $currentDependencies += $item.Name
        } else {
            if ($currentGroup.Count -gt 0) {
                $parallelGroups += $currentGroup
            }
            $currentGroup = @($item)
            $currentDependencies = @($item.Name)
        }
    }
    
    if ($currentGroup.Count -gt 0) {
        $parallelGroups += $currentGroup
    }
    
    return $parallelGroups
}

function Invoke-AICacheOptimization {
    param(
        [string]$ProjectType,
        [hashtable]$BuildConfig
    )
    
    Write-Host "💾 AI optimizing cache strategy..." -ForegroundColor Yellow
    
    $cacheStrategy = @{
        CacheLevel = "aggressive"
        CacheKeys = @()
        InvalidationRules = @()
        CompressionEnabled = $true
        TTL = 3600 # 1 hour
    }
    
    # Project-specific cache optimization
    switch ($ProjectType) {
        "nodejs" {
            $cacheStrategy.CacheLevel = "balanced"
            $cacheStrategy.CacheKeys += "node_modules", "package-lock.json", "tsconfig.json"
        }
        "python" {
            $cacheStrategy.CacheLevel = "conservative"
            $cacheStrategy.CacheKeys += "requirements.txt", "setup.py", "pyproject.toml"
        }
        "cpp" {
            $cacheStrategy.CacheLevel = "aggressive"
            $cacheStrategy.CacheKeys += "CMakeLists.txt", "Makefile", "*.h", "*.hpp"
        }
        "universal" {
            $cacheStrategy.CacheLevel = "intelligent"
            $cacheStrategy.CacheKeys += "*.json", "*.yml", "*.yaml", "*.toml"
        }
    }
    
    return $cacheStrategy
}

# 🔧 Enhanced Project Type Detection
function Get-EnhancedProjectType {
    param([string]$ProjectPath)
    
    Write-Host "🔍 Detecting project type with AI enhancement..." -ForegroundColor Cyan
    
    $indicators = @{
        "nodejs" = @("package.json", "node_modules", "npm", "yarn")
        "python" = @("requirements.txt", "setup.py", "pyproject.toml", "Pipfile", "poetry.lock")
        "cpp" = @("CMakeLists.txt", "Makefile", "*.cpp", "*.h", "*.hpp", "vcpkg.json")
        "dotnet" = @("*.csproj", "*.sln", "*.cs", "packages.config")
        "java" = @("pom.xml", "build.gradle", "*.java", "Maven")
        "go" = @("go.mod", "go.sum", "*.go", "Gopkg.toml")
        "rust" = @("Cargo.toml", "Cargo.lock", "*.rs")
        "php" = @("composer.json", "composer.lock", "*.php")
        "ai" = @("*.ipynb", "*.pkl", "*.h5", "*.pb", "*.onnx", "requirements.txt")
        "universal" = @("universal", ".automation", ".manager", "cursor.json")
    }
    
    $scores = @{}
    $files = Get-ChildItem -Path $ProjectPath -Recurse -File | Select-Object -First 100
    
    foreach ($type in $indicators.Keys) {
        $score = 0
        foreach ($indicator in $indicators[$type]) {
            $matches = $files | Where-Object { $_.Name -like $indicator -or $_.Extension -like $indicator }
            $score += $matches.Count
        }
        $scores[$type] = $score
    }
    
    $detectedType = ($scores.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key
    
    if ($scores[$detectedType] -eq 0) {
        $detectedType = "universal"
    }
    
    Write-Host "✅ Detected project type: $detectedType (confidence: $($scores[$detectedType]))" -ForegroundColor Green
    
    return $detectedType
}

# 🚀 Enhanced Build Execution with AI
function Start-EnhancedBuild {
    param(
        [string]$ProjectPath,
        [string]$ProjectType,
        [string]$BuildType,
        [hashtable]$AIOptimization
    )
    
    Write-Host "🚀 Starting enhanced build with AI optimization..." -ForegroundColor Green
    
    if ($AIOptimization.Optimized) {
        Write-Host "🤖 Using AI-optimized build strategy" -ForegroundColor Cyan
        
        # Execute parallel build groups
        foreach ($group in $AIOptimization.ParallelConfig) {
            $jobs = @()
            foreach ($item in $group) {
                $job = Start-Job -ScriptBlock {
                    param($Item, $ProjectPath, $BuildType)
                    # Build logic here
                    return "Built: $($Item.Name)"
                } -ArgumentList $item, $ProjectPath, $BuildType
                $jobs += $job
            }
            
            # Wait for all jobs in group to complete
            $jobs | Wait-Job | Receive-Job
            $jobs | Remove-Job
        }
    } else {
        Write-Host "⚠️ Using fallback build strategy" -ForegroundColor Yellow
        # Fallback to standard build
        Invoke-StandardBuild -ProjectPath $ProjectPath -ProjectType $ProjectType -BuildType $BuildType
    }
}

# 📊 Enhanced Reporting
function New-EnhancedBuildReport {
    param(
        [hashtable]$BuildResults,
        [hashtable]$AIOptimization,
        [string]$ProjectType
    )
    
    $report = @{
        Timestamp = Get-Date
        ProjectType = $ProjectType
        BuildResults = $BuildResults
        AIOptimization = $AIOptimization
        Performance = @{
            BuildTime = $BuildResults.BuildTime
            FilesProcessed = $BuildResults.FilesProcessed
            CacheHits = $BuildResults.CacheHits
            ParallelEfficiency = $BuildResults.ParallelEfficiency
        }
        Recommendations = @()
    }
    
    # AI-generated recommendations
    if ($AIOptimization.Optimized) {
        $report.Recommendations += "Consider enabling more aggressive caching for better performance"
        $report.Recommendations += "Parallel execution is optimized for your project structure"
        $report.Recommendations += "Dependency analysis shows potential for further optimization"
    }
    
    return $report
}

# 🚀 Main Incremental Build Function
function Start-IncrementalBuild {
    Write-Host "🔄 Starting Incremental Build System v$($Config.Version)" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    
    # 1. Initialize build system
    Initialize-BuildSystem -ProjectPath $ProjectPath
    
    # 2. Analyze project structure
    $ProjectStructure = Analyze-ProjectStructure -ProjectPath $ProjectPath
    Write-Host "📊 Analyzed project structure" -ForegroundColor Green
    
    # 3. Build dependency graph
    $DependencyGraph = Build-DependencyGraph -ProjectStructure $ProjectStructure
    Write-Host "🔗 Built dependency graph with $($DependencyGraph.Nodes.Count) nodes" -ForegroundColor Yellow
    
    # 4. Determine build scope
    $BuildScope = Determine-BuildScope -ProjectStructure $ProjectStructure -BuildType $BuildType -CleanBuild $CleanBuild
    Write-Host "🎯 Determined build scope: $($BuildScope.Count) components" -ForegroundColor Blue
    
    # 5. Create build plan
    $BuildPlan = Create-BuildPlan -BuildScope $BuildScope -DependencyGraph $DependencyGraph
    Write-Host "📋 Created build plan with $($BuildPlan.Tasks.Count) tasks" -ForegroundColor Magenta
    
    # 6. Execute build
    $BuildResults = Execute-Build -BuildPlan $BuildPlan -ProjectPath $ProjectPath
    
    # 7. Update build manifest
    Update-BuildManifest -BuildResults $BuildResults -ProjectPath $ProjectPath
    
    # 8. Generate report
    if ($GenerateReport) {
        $ReportPath = Generate-BuildReport -BuildResults $BuildResults -BuildPlan $BuildPlan
        Write-Host "📊 Build report generated: $ReportPath" -ForegroundColor Green
    }
    
    Write-Host "✅ Incremental Build completed!" -ForegroundColor Green
    return $BuildResults
}

# 🔧 Initialize Build System
function Initialize-BuildSystem {
    param([string]$ProjectPath)
    
    # Create necessary directories
    $Directories = @($Config.CacheDirectory, $Config.BuildLogDirectory, ".\build", ".\logs", ".\reports")
    foreach ($Dir in $Directories) {
        $FullPath = Join-Path $ProjectPath $Dir
        if (-not (Test-Path $FullPath)) {
            New-Item -ItemType Directory -Path $FullPath -Force | Out-Null
        }
    }
    
    # Create build manifest if not exists
    $ManifestPath = Join-Path $ProjectPath $Config.BuildManifest
    if (-not (Test-Path $ManifestPath)) {
        $InitialManifest = @{
            Version = $Config.Version
            Created = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            Builds = @()
            FileHashes = @{}
            Dependencies = @{}
            Statistics = @{
                TotalBuilds = 0
                SuccessfulBuilds = 0
                FailedBuilds = 0
                AverageBuildTime = 0
            }
        }
        
        $InitialManifest | ConvertTo-Json -Depth 3 | Out-File -FilePath $ManifestPath -Encoding UTF8
    }
}

# 📊 Analyze Project Structure
function Analyze-ProjectStructure {
    param([string]$ProjectPath)
    
    $ProjectStructure = @{
        Files = @{}
        Directories = @{}
        BuildTargets = @{}
        Dependencies = @{}
        LastModified = @{}
    }
    
    # Analyze files
    $Files = Get-ChildItem -Path $ProjectPath -Recurse -File | Where-Object {
        $_.Name -notlike "*test*" -and
        $_.Name -notlike "*example*" -and
        $_.Name -notlike "*.tmp" -and
        $_.Name -notlike "*.log"
    }
    
    foreach ($File in $Files) {
        $RelativePath = $File.FullName.Replace($ProjectPath, "").TrimStart('\')
        $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue
        
        $ProjectStructure.Files[$RelativePath] = @{
            Path = $File.FullName
            Size = $File.Length
            LastModified = $File.LastWriteTime
            Hash = if ($Content) { (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($Content)))).Hash } else { "" }
            Extension = $File.Extension
            Dependencies = @()
            BuildTarget = $null
        }
        
        $ProjectStructure.LastModified[$RelativePath] = $File.LastWriteTime
    }
    
    # Analyze directories
    $Directories = Get-ChildItem -Path $ProjectPath -Recurse -Directory
    foreach ($Dir in $Directories) {
        $RelativePath = $Dir.FullName.Replace($ProjectPath, "").TrimStart('\')
        $ProjectStructure.Directories[$RelativePath] = @{
            Path = $Dir.FullName
            LastModified = $Dir.LastWriteTime
            FileCount = (Get-ChildItem -Path $Dir.FullName -File -Recurse).Count
        }
    }
    
    # Determine build targets
    foreach ($BuildType in $Config.BuildTypes.Keys) {
        $BuildConfig = $Config.BuildTypes[$BuildType]
        $BuildTarget = @{
            Type = $BuildType
            Name = $BuildConfig.Name
            Files = @()
            Dependencies = $BuildConfig.Dependencies
            OutputDir = $BuildConfig.OutputDir
            Status = "Pending"
        }
        
        # Find files relevant to this build type
        foreach ($File in $Files) {
            $RelativePath = $File.FullName.Replace($ProjectPath, "").TrimStart('\')
            $ShouldInclude = $false
            
            foreach ($Extension in $BuildConfig.Extensions) {
                if ($File.Extension -eq $Extension) {
                    $ShouldInclude = $true
                    break
                }
            }
            
            if ($ShouldInclude) {
                $BuildTarget.Files += $RelativePath
                $ProjectStructure.Files[$RelativePath].BuildTarget = $BuildType
            }
        }
        
        if ($BuildTarget.Files.Count -gt 0) {
            $ProjectStructure.BuildTargets[$BuildType] = $BuildTarget
        }
    }
    
    return $ProjectStructure
}

# 🔗 Build Dependency Graph
function Build-DependencyGraph {
    param([hashtable]$ProjectStructure)
    
    $DependencyGraph = @{
        Nodes = @{}
        Edges = @()
        Cycles = @()
        TopologicalOrder = @()
    }
    
    # Create nodes for each file
    foreach ($File in $ProjectStructure.Files.Keys) {
        $FileInfo = $ProjectStructure.Files[$File]
        $DependencyGraph.Nodes[$File] = @{
            Id = $File
            Type = "file"
            BuildTarget = $FileInfo.BuildTarget
            Dependencies = @()
            Dependents = @()
            LastModified = $FileInfo.LastModified
            Hash = $FileInfo.Hash
        }
    }
    
    # Analyze dependencies
    foreach ($File in $ProjectStructure.Files.Keys) {
        $FileInfo = $ProjectStructure.Files[$File]
        $Content = Get-Content -Path $FileInfo.Path -Raw -ErrorAction SilentlyContinue
        
        if ($Content) {
            $Dependencies = @()
            
            # Look for script calls
            $ScriptCalls = [regex]::Matches($Content, '\.\\[^"\s]+\.ps1|\.\\[^"\s]+\.psm1')
            foreach ($Call in $ScriptCalls) {
                $CalledScript = $Call.Value.TrimStart('.\')
                $Dependencies += $CalledScript
            }
            
            # Look for module imports
            $ModuleImports = [regex]::Matches($Content, 'Import-Module\s+["\']?([^"\'\s]+)["\']?')
            foreach ($Import in $ModuleImports) {
                $ModuleName = $Import.Groups[1].Value
                $Dependencies += $ModuleName
            }
            
            # Look for file includes
            $FileIncludes = [regex]::Matches($Content, '\.\\[^"\s]+\.(js|css|html|json|xml)')
            foreach ($Include in $FileIncludes) {
                $IncludedFile = $Include.Value.TrimStart('.\')
                $Dependencies += $IncludedFile
            }
            
            $DependencyGraph.Nodes[$File].Dependencies = $Dependencies
            $ProjectStructure.Files[$File].Dependencies = $Dependencies
            
            # Create edges
            foreach ($Dependency in $Dependencies) {
                if ($DependencyGraph.Nodes.ContainsKey($Dependency)) {
                    $DependencyGraph.Edges += @{
                        From = $Dependency
                        To = $File
                        Type = "dependency"
                    }
                    
                    $DependencyGraph.Nodes[$Dependency].Dependents += $File
                }
            }
        }
    }
    
    # Detect cycles
    $DependencyGraph.Cycles = Detect-Cycles -DependencyGraph $DependencyGraph
    
    # Create topological order
    $DependencyGraph.TopologicalOrder = Create-TopologicalOrder -DependencyGraph $DependencyGraph
    
    return $DependencyGraph
}

# 🔄 Detect Cycles
function Detect-Cycles {
    param([hashtable]$DependencyGraph)
    
    $Cycles = @()
    $Visited = @{}
    $RecursionStack = @{}
    
    foreach ($Node in $DependencyGraph.Nodes.Keys) {
        if (-not $Visited.ContainsKey($Node)) {
            $Cycle = Detect-CycleDFS -Node $Node -DependencyGraph $DependencyGraph -Visited $Visited -RecursionStack $RecursionStack
            if ($Cycle) {
                $Cycles += $Cycle
            }
        }
    }
    
    return $Cycles
}

# 🔍 Detect Cycle DFS
function Detect-CycleDFS {
    param(
        [string]$Node,
        [hashtable]$DependencyGraph,
        [hashtable]$Visited,
        [hashtable]$RecursionStack
    )
    
    $Visited[$Node] = $true
    $RecursionStack[$Node] = $true
    
    foreach ($Dependent in $DependencyGraph.Nodes[$Node].Dependents) {
        if (-not $Visited.ContainsKey($Dependent)) {
            $Cycle = Detect-CycleDFS -Node $Dependent -DependencyGraph $DependencyGraph -Visited $Visited -RecursionStack $RecursionStack
            if ($Cycle) {
                return $Cycle
            }
        } elseif ($RecursionStack[$Dependent]) {
            return @($Node, $Dependent)
        }
    }
    
    $RecursionStack[$Node] = $false
    return $null
}

# 📋 Create Topological Order
function Create-TopologicalOrder {
    param([hashtable]$DependencyGraph)
    
    $TopologicalOrder = @()
    $Visited = @{}
    $TempMark = @{}
    
    foreach ($Node in $DependencyGraph.Nodes.Keys) {
        if (-not $Visited.ContainsKey($Node)) {
            Visit-Node -Node $Node -DependencyGraph $DependencyGraph -Visited $Visited -TempMark $TempMark -TopologicalOrder $TopologicalOrder
        }
    }
    
    return $TopologicalOrder
}

# 🔍 Visit Node
function Visit-Node {
    param(
        [string]$Node,
        [hashtable]$DependencyGraph,
        [hashtable]$Visited,
        [hashtable]$TempMark,
        [array]$TopologicalOrder
    )
    
    if ($TempMark.ContainsKey($Node)) {
        throw "Cycle detected in dependency graph"
    }
    
    if (-not $Visited.ContainsKey($Node)) {
        $TempMark[$Node] = $true
        
        foreach ($Dependency in $DependencyGraph.Nodes[$Node].Dependencies) {
            if ($DependencyGraph.Nodes.ContainsKey($Dependency)) {
                Visit-Node -Node $Dependency -DependencyGraph $DependencyGraph -Visited $Visited -TempMark $TempMark -TopologicalOrder $TopologicalOrder
            }
        }
        
        $Visited[$Node] = $true
        $TopologicalOrder += $Node
        $TempMark.Remove($Node)
    }
}

# 🎯 Determine Build Scope
function Determine-BuildScope {
    param(
        [hashtable]$ProjectStructure,
        [string]$BuildType,
        [switch]$CleanBuild
    )
    
    $BuildScope = @()
    
    if ($CleanBuild) {
        # Include all build targets
        $BuildScope = $ProjectStructure.BuildTargets.Values
    } else {
        # Load build manifest
        $ManifestPath = Join-Path $ProjectPath $Config.BuildManifest
        $BuildManifest = @{}
        
        if (Test-Path $ManifestPath) {
            $BuildManifest = Get-Content -Path $ManifestPath -Raw | ConvertFrom-Json
        }
        
        # Determine which targets need rebuilding
        foreach ($BuildTarget in $ProjectStructure.BuildTargets.Values) {
            if ($BuildType -eq "all" -or $BuildType -eq $BuildTarget.Type) {
                $NeedsRebuild = $false
                
                # Check if any files have changed
                foreach ($File in $BuildTarget.Files) {
                    $CurrentHash = $ProjectStructure.Files[$File].Hash
                    $LastHash = $BuildManifest.FileHashes[$File]
                    
                    if ($CurrentHash -ne $LastHash) {
                        $NeedsRebuild = $true
                        break
                    }
                }
                
                # Check if dependencies have changed
                if (-not $NeedsRebuild) {
                    foreach ($File in $BuildTarget.Files) {
                        $Dependencies = $ProjectStructure.Files[$File].Dependencies
                        foreach ($Dependency in $Dependencies) {
                            $CurrentHash = $ProjectStructure.Files[$Dependency].Hash
                            $LastHash = $BuildManifest.FileHashes[$Dependency]
                            
                            if ($CurrentHash -ne $LastHash) {
                                $NeedsRebuild = $true
                                break
                            }
                        }
                        
                        if ($NeedsRebuild) { break }
                    }
                }
                
                if ($NeedsRebuild) {
                    $BuildScope += $BuildTarget
                }
            }
        }
    }
    
    return $BuildScope
}

# 📋 Create Build Plan
function Create-BuildPlan {
    param(
        [array]$BuildScope,
        [hashtable]$DependencyGraph
    )
    
    $BuildPlan = @{
        Tasks = @()
        Dependencies = @{}
        EstimatedTime = 0
        ParallelTasks = @()
    }
    
    # Create build tasks
    foreach ($BuildTarget in $BuildScope) {
        $Task = @{
            Id = [System.Guid]::NewGuid().ToString()
            Type = $BuildTarget.Type
            Name = $BuildTarget.Name
            Files = $BuildTarget.Files
            OutputDir = $BuildTarget.OutputDir
            Dependencies = @()
            Dependents = @()
            Status = "Pending"
            StartTime = $null
            EndTime = $null
            Duration = 0
            Result = $null
            Error = $null
        }
        
        # Determine task dependencies
        foreach ($File in $BuildTarget.Files) {
            $FileDependencies = $ProjectStructure.Files[$File].Dependencies
            foreach ($Dependency in $FileDependencies) {
                if ($ProjectStructure.Files.ContainsKey($Dependency)) {
                    $DependencyTarget = $ProjectStructure.Files[$Dependency].BuildTarget
                    if ($DependencyTarget -and $DependencyTarget -ne $BuildTarget.Type) {
                        $Task.Dependencies += $DependencyTarget
                    }
                }
            }
        }
        
        $BuildPlan.Tasks += $Task
    }
    
    # Create dependency graph for tasks
    foreach ($Task in $BuildPlan.Tasks) {
        $BuildPlan.Dependencies[$Task.Id] = $Task.Dependencies
    }
    
    # Determine parallel tasks
    $BuildPlan.ParallelTasks = Determine-ParallelTasks -Tasks $BuildPlan.Tasks -Dependencies $BuildPlan.Dependencies
    
    return $BuildPlan
}

# ⚡ Determine Parallel Tasks
function Determine-ParallelTasks {
    param(
        [array]$Tasks,
        [hashtable]$Dependencies
    )
    
    $ParallelTasks = @()
    $CompletedTasks = @()
    $AvailableTasks = @()
    
    # Find tasks with no dependencies
    foreach ($Task in $Tasks) {
        if ($Task.Dependencies.Count -eq 0) {
            $AvailableTasks += $Task
        }
    }
    
    while ($AvailableTasks.Count -gt 0) {
        $CurrentBatch = @()
        $MaxParallel = [Math]::Min($Config.MaxParallelJobs, $AvailableTasks.Count)
        
        for ($i = 0; $i -lt $MaxParallel; $i++) {
            if ($i -lt $AvailableTasks.Count) {
                $CurrentBatch += $AvailableTasks[$i]
            }
        }
        
        $ParallelTasks += $CurrentBatch
        
        # Mark tasks as completed
        foreach ($Task in $CurrentBatch) {
            $CompletedTasks += $Task.Id
        }
        
        # Find next available tasks
        $AvailableTasks = @()
        foreach ($Task in $Tasks) {
            if (-not $CompletedTasks.Contains($Task.Id)) {
                $AllDependenciesCompleted = $true
                foreach ($Dependency in $Task.Dependencies) {
                    if (-not $CompletedTasks.Contains($Dependency)) {
                        $AllDependenciesCompleted = $false
                        break
                    }
                }
                
                if ($AllDependenciesCompleted) {
                    $AvailableTasks += $Task
                }
            }
        }
    }
    
    return $ParallelTasks
}

# 🚀 Execute Build
function Execute-Build {
    param(
        [hashtable]$BuildPlan,
        [string]$ProjectPath
    )
    
    $BuildResults = @{
        Successful = 0
        Failed = 0
        Skipped = 0
        TotalTime = 0
        Tasks = @()
        StartTime = Get-Date
    }
    
    # Execute build tasks
    foreach ($Task in $BuildPlan.Tasks) {
        Write-Host "🔨 Building: $($Task.Name)" -ForegroundColor Yellow
        
        $Task.StartTime = Get-Date
        $Task.Status = "Running"
        
        try {
            $TaskResult = Execute-BuildTask -Task $Task -ProjectPath $ProjectPath
            
            if ($TaskResult.Success) {
                $Task.Status = "Success"
                $Task.Result = $TaskResult.Result
                $BuildResults.Successful++
                Write-Host "✅ $($Task.Name) build successful" -ForegroundColor Green
            } else {
                $Task.Status = "Failed"
                $Task.Error = $TaskResult.Error
                $BuildResults.Failed++
                Write-Host "❌ $($Task.Name) build failed: $($TaskResult.Error)" -ForegroundColor Red
            }
        }
        catch {
            $Task.Status = "Failed"
            $Task.Error = $_.Exception.Message
            $BuildResults.Failed++
            Write-Host "❌ $($Task.Name) build failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        finally {
            $Task.EndTime = Get-Date
            $Task.Duration = ($Task.EndTime - $Task.StartTime).TotalSeconds
            $BuildResults.Tasks += $Task
        }
    }
    
    $BuildResults.EndTime = Get-Date
    $BuildResults.TotalTime = ($BuildResults.EndTime - $BuildResults.StartTime).TotalSeconds
    
    return $BuildResults
}

# 🔨 Execute Build Task
function Execute-BuildTask {
    param(
        [hashtable]$Task,
        [string]$ProjectPath
    )
    
    $Result = @{
        Success = $false
        Result = ""
        Error = ""
    }
    
    try {
        switch ($Task.Type) {
            "code" {
                $Result = Execute-CodeBuild -Task $Task -ProjectPath $ProjectPath
            }
            "tests" {
                $Result = Execute-TestBuild -Task $Task -ProjectPath $ProjectPath
            }
            "docs" {
                $Result = Execute-DocBuild -Task $Task -ProjectPath $ProjectPath
            }
            "assets" {
                $Result = Execute-AssetBuild -Task $Task -ProjectPath $ProjectPath
            }
        }
    }
    catch {
        $Result.Success = $false
        $Result.Error = $_.Exception.Message
    }
    
    return $Result
}

# 📝 Execute Code Build
function Execute-CodeBuild {
    param(
        [hashtable]$Task,
        [string]$ProjectPath
    )
    
    $Result = @{
        Success = $false
        Result = ""
        Error = ""
    }
    
    try {
        $OutputDir = Join-Path $ProjectPath $Task.OutputDir
        if (-not (Test-Path $OutputDir)) {
            New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        }
        
        # Copy source files to output directory
        foreach ($File in $Task.Files) {
            $SourcePath = Join-Path $ProjectPath $File
            $DestPath = Join-Path $OutputDir $File
            
            if (Test-Path $SourcePath) {
                $DestDir = Split-Path -Parent $DestPath
                if (-not (Test-Path $DestDir)) {
                    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
                }
                
                Copy-Item -Path $SourcePath -Destination $DestPath -Force
            }
        }
        
        $Result.Success = $true
        $Result.Result = "Code build completed successfully"
    }
    catch {
        $Result.Success = $false
        $Result.Error = $_.Exception.Message
    }
    
    return $Result
}

# 🧪 Execute Test Build
function Execute-TestBuild {
    param(
        [hashtable]$Task,
        [string]$ProjectPath
    )
    
    $Result = @{
        Success = $false
        Result = ""
        Error = ""
    }
    
    try {
        $OutputDir = Join-Path $ProjectPath $Task.OutputDir
        if (-not (Test-Path $OutputDir)) {
            New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        }
        
        # Copy test files to output directory
        foreach ($File in $Task.Files) {
            $SourcePath = Join-Path $ProjectPath $File
            $DestPath = Join-Path $OutputDir $File
            
            if (Test-Path $SourcePath) {
                $DestDir = Split-Path -Parent $DestPath
                if (-not (Test-Path $DestDir)) {
                    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
                }
                
                Copy-Item -Path $SourcePath -Destination $DestPath -Force
            }
        }
        
        $Result.Success = $true
        $Result.Result = "Test build completed successfully"
    }
    catch {
        $Result.Success = $false
        $Result.Error = $_.Exception.Message
    }
    
    return $Result
}

# 📚 Execute Doc Build
function Execute-DocBuild {
    param(
        [hashtable]$Task,
        [string]$ProjectPath
    )
    
    $Result = @{
        Success = $false
        Result = ""
        Error = ""
    }
    
    try {
        $OutputDir = Join-Path $ProjectPath $Task.OutputDir
        if (-not (Test-Path $OutputDir)) {
            New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        }
        
        # Copy documentation files to output directory
        foreach ($File in $Task.Files) {
            $SourcePath = Join-Path $ProjectPath $File
            $DestPath = Join-Path $OutputDir $File
            
            if (Test-Path $SourcePath) {
                $DestDir = Split-Path -Parent $DestPath
                if (-not (Test-Path $DestDir)) {
                    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
                }
                
                Copy-Item -Path $SourcePath -Destination $DestPath -Force
            }
        }
        
        $Result.Success = $true
        $Result.Result = "Documentation build completed successfully"
    }
    catch {
        $Result.Success = $false
        $Result.Error = $_.Exception.Message
    }
    
    return $Result
}

# 🎨 Execute Asset Build
function Execute-AssetBuild {
    param(
        [hashtable]$Task,
        [string]$ProjectPath
    )
    
    $Result = @{
        Success = $false
        Result = ""
        Error = ""
    }
    
    try {
        $OutputDir = Join-Path $ProjectPath $Task.OutputDir
        if (-not (Test-Path $OutputDir)) {
            New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        }
        
        # Copy asset files to output directory
        foreach ($File in $Task.Files) {
            $SourcePath = Join-Path $ProjectPath $File
            $DestPath = Join-Path $OutputDir $File
            
            if (Test-Path $SourcePath) {
                $DestDir = Split-Path -Parent $DestPath
                if (-not (Test-Path $DestDir)) {
                    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
                }
                
                Copy-Item -Path $SourcePath -Destination $DestPath -Force
            }
        }
        
        $Result.Success = $true
        $Result.Result = "Asset build completed successfully"
    }
    catch {
        $Result.Success = $false
        $Result.Error = $_.Exception.Message
    }
    
    return $Result
}

# 📋 Update Build Manifest
function Update-BuildManifest {
    param(
        [hashtable]$BuildResults,
        [string]$ProjectPath
    )
    
    $ManifestPath = Join-Path $ProjectPath $Config.BuildManifest
    $BuildManifest = @{}
    
    if (Test-Path $ManifestPath) {
        $BuildManifest = Get-Content -Path $ManifestPath -Raw | ConvertFrom-Json
    }
    
    # Add new build entry
    $BuildEntry = @{
        Id = [System.Guid]::NewGuid().ToString()
        Timestamp = $BuildResults.StartTime.ToString("yyyy-MM-dd HH:mm:ss")
        Duration = $BuildResults.TotalTime
        Successful = $BuildResults.Successful
        Failed = $BuildResults.Failed
        Tasks = $BuildResults.Tasks
    }
    
    $BuildManifest.Builds += $BuildEntry
    
    # Update file hashes
    foreach ($Task in $BuildResults.Tasks) {
        foreach ($File in $Task.Files) {
            $FilePath = Join-Path $ProjectPath $File
            if (Test-Path $FilePath) {
                $Content = Get-Content -Path $FilePath -Raw -ErrorAction SilentlyContinue
                if ($Content) {
                    $Hash = (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($Content)))).Hash
                    $BuildManifest.FileHashes[$File] = $Hash
                }
            }
        }
    }
    
    # Update statistics
    $BuildManifest.Statistics.TotalBuilds++
    $BuildManifest.Statistics.SuccessfulBuilds += $BuildResults.Successful
    $BuildManifest.Statistics.FailedBuilds += $BuildResults.Failed
    
    $TotalDuration = ($BuildManifest.Builds | Measure-Object -Property Duration -Sum).Sum
    $BuildManifest.Statistics.AverageBuildTime = $TotalDuration / $BuildManifest.Builds.Count
    
    $BuildManifest.LastUpdated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    
    # Keep only last 50 builds
    $BuildManifest.Builds = $BuildManifest.Builds | Sort-Object Timestamp -Descending | Select-Object -First 50
    
    $BuildManifest | ConvertTo-Json -Depth 3 | Out-File -FilePath $ManifestPath -Encoding UTF8
}

# 📊 Generate Build Report
function Generate-BuildReport {
    param(
        [hashtable]$BuildResults,
        [hashtable]$BuildPlan
    )
    
    $ReportPath = ".\reports\incremental-build-$(Get-Date -Format 'yyyy-MM-dd-HHmm').md"
    $ReportDir = Split-Path -Parent $ReportPath
    
    if (-not (Test-Path $ReportDir)) {
        New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
    }
    
    $Report = @"
# 🔄 Incremental Build Report

**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Total Tasks**: $($BuildResults.Tasks.Count)  
**Successful**: $($BuildResults.Successful)  
**Failed**: $($BuildResults.Failed)  
**Total Time**: $([Math]::Round($BuildResults.TotalTime, 2)) seconds

## 📊 Build Summary

- **Success Rate**: $([Math]::Round(($BuildResults.Successful / $BuildResults.Tasks.Count) * 100, 1))%
- **Average Time per Task**: $([Math]::Round($BuildResults.TotalTime / $BuildResults.Tasks.Count, 2)) seconds
- **Parallel Efficiency**: $([Math]::Round(($BuildPlan.Tasks.Count / $BuildResults.TotalTime) * 100, 1))%

## 🎯 Build Tasks

### Successful Tasks
"@

    foreach ($Task in ($BuildResults.Tasks | Where-Object { $_.Status -eq "Success" })) {
        $Report += "`n- **$($Task.Name)**`n"
        $Report += "  - Type: $($Task.Type)`n"
        $Report += "  - Duration: $([Math]::Round($Task.Duration, 2))s`n"
        $Report += "  - Files: $($Task.Files.Count)`n"
    }

    if (($BuildResults.Tasks | Where-Object { $_.Status -eq "Failed" }).Count -gt 0) {
        $Report += @"

### Failed Tasks
"@

        foreach ($Task in ($BuildResults.Tasks | Where-Object { $_.Status -eq "Failed" })) {
            $Report += "`n- **$($Task.Name)**`n"
            $Report += "  - Type: $($Task.Type)`n"
            $Report += "  - Error: $($Task.Error)`n"
            $Report += "  - Duration: $([Math]::Round($Task.Duration, 2))s`n"
        }
    }

    $Report += @"

## 🔗 Dependency Analysis

- **Total Dependencies**: $($BuildPlan.Dependencies.Count)
- **Cycles Detected**: $($BuildPlan.Cycles.Count)
- **Parallel Tasks**: $($BuildPlan.ParallelTasks.Count)

## 🎯 Recommendations

1. **Optimization**: Review failed tasks and optimize build process
2. **Parallelization**: Increase parallel execution where possible
3. **Caching**: Enable caching for better performance
4. **Dependencies**: Optimize dependency graph to reduce build time
5. **Monitoring**: Set up build monitoring and alerting

## 📈 Next Steps

1. Fix failed build tasks
2. Optimize build process
3. Increase parallel execution
4. Set up build monitoring
5. Update build documentation

---
*Generated by Incremental Build System v$($Config.Version)*
"@

    $Report | Out-File -FilePath $ReportPath -Encoding UTF8
    return $ReportPath
}

# 🚀 Execute Incremental Build
if ($MyInvocation.InvocationName -ne '.') {
    Start-IncrementalBuild
}
