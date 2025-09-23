@{
    RootModule        = 'AutomationToolkit.psm1'
    ModuleVersion     = '3.0.0'
    GUID              = 'b8f8a37a-5d16-4e06-9d8a-6a9fd2c9b6a3'
    Author            = 'UniversalProjectTemplates'
    CompanyName       = 'UniversalProjectTemplates'
    Copyright         = '(c) UniversalProjectTemplates'
    Description       = 'Universal Project Manager automation toolkit v3.0 - Advanced AI & Enterprise Integration automation functions for validation, testing, and maintenance. Status: MISSION ACCOMPLISHED - All Systems Operational v3.0.'
    PowerShellVersion = '7.0'
    FunctionsToExport = @(
        'Invoke-ValidateProject',
        'Invoke-RunTests',
        'New-MissingFiles',
        'Invoke-FixProjectIssues'
    )
    CmdletsToExport   = @()
    AliasesToExport   = @()
    PrivateData       = @{}
}
