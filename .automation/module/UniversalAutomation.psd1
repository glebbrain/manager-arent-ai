@{
    RootModule        = 'UniversalAutomation.psm1'
    ModuleVersion     = '2.0.0'
    GUID              = 'b8f8a37a-5d16-4e06-9d8a-6a9fd2c9b6a3'
    Author            = 'UniversalProjectTemplates'
    CompanyName       = 'UniversalProjectTemplates'
    Copyright         = '(c) UniversalProjectTemplates'
    Description       = 'Universal Automation Toolkit - Cross-platform project management automation functions for validation, testing, and maintenance. Supports Node.js, Python, C++, .NET, Java, Go, Rust, PHP. Status: MISSION ACCOMPLISHED - All Systems Operational.'
    PowerShellVersion = '7.0'
    FunctionsToExport = @(
        'Get-ProjectType',
        'Invoke-UniversalBuild',
        'Invoke-UniversalStatusCheck',
        'Invoke-UniversalSetup',
        'Invoke-UniversalTests',
        'Invoke-UniversalValidation',
        'Invoke-ValidateProject',
        'Invoke-RunTests',
        'New-MissingFiles',
        'Invoke-FixProjectIssues',
        'Invoke-LogAnalyzer',
        'Invoke-ErrorTracker',
        'Invoke-EmergencyTriage',
        'Invoke-ProjectConsistencyCheck',
        'Invoke-DistributeCommands',
        'Invoke-PerformanceTest',
        'Invoke-IntegrationTest'
    )
    CmdletsToExport   = @()
    AliasesToExport   = @()
    PrivateData       = @{}
}