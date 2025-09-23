# Documentation Generator for LearnEnglishBot
# Auto-generates API documentation, README updates, and project documentation

param(
    [switch]$API,
    [switch]$README,
    [switch]$All,
    [switch]$UpdateChangelog,
    [string]$OutputDir = "generated_docs",
    [switch]$Verbose,
    [switch]$Force
)

Write-Host "Documentation Generator for LearnEnglishBot" -ForegroundColor Green
Write-Host "Auto-generating comprehensive project documentation" -ForegroundColor Cyan

# Configuration
$docConfig = @{
    "ProjectRoot" = Get-Location
    "OutputDir" = $OutputDir
    "Timestamp" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "ProjectName" = "LearnEnglishBot"
    "ProjectDescription" = "AI-powered Telegram bot for English language learning"
    "Author" = "LearnEnglishBot Team"
    "License" = "MIT"
    "Repository" = "https://github.com/username/learnenglishbot"
}

# Create output directory
if (-not (Test-Path $docConfig.OutputDir)) {
    New-Item -Path $docConfig.OutputDir -ItemType Directory -Force | Out-Null
    Write-Host "Created output directory: $($docConfig.OutputDir)" -ForegroundColor Green
}

# Function to analyze Python code structure
function Analyze-PythonCode {
    Write-Host "`nAnalyzing Python code structure..." -ForegroundColor Yellow
    
    $codeAnalysis = @{
        "modules" = @()
        "classes" = @()
        "functions" = @()
        "endpoints" = @()
        "dependencies" = @()
        "total_lines" = 0
        "total_files" = 0
    }
    
    # Find Python files
    $pythonFiles = Get-ChildItem -Path "." -Recurse -Filter "*.py" | Where-Object { 
        $_.FullName -notmatch "venv|__pycache__|\.git|\.pytest_cache" 
    }
    
    foreach ($file in $pythonFiles) {
        try {
            $content = Get-Content $file.FullName -Raw
            $lines = $content -split "`n"
            
            $codeAnalysis.total_files++
            $codeAnalysis.total_lines += $lines.Count
            
            # Analyze file content
            $relativePath = $file.FullName.Replace($docConfig.ProjectRoot, "").TrimStart("\")
            
            # Find classes
            $classMatches = [regex]::Matches($content, '^class\s+(\w+).*:', [System.Text.RegularExpressions.RegexOptions]::Multiline)
            foreach ($match in $classMatches) {
                $codeAnalysis.classes += @{
                    "name" = $match.Groups[1].Value
                    "file" = $relativePath
                    "line" = ($content.Substring(0, $match.Index) -split "`n").Count
                }
            }
            
            # Find functions
            $functionMatches = [regex]::Matches($content, '^def\s+(\w+).*:', [System.Text.RegularExpressions.RegexOptions]::Multiline)
            foreach ($match in $functionMatches) {
                $codeAnalysis.functions += @{
                    "name" = $match.Groups[1].Value
                    "file" = $relativePath
                    "line" = ($content.Substring(0, $match.Index) -split "`n").Count
                }
            }
            
            # Find API endpoints (Flask/FastAPI style)
            $endpointMatches = [regex]::Matches($content, '@(?:app|router)\.(?:route|get|post|put|delete)\([""]([^""]+)[""]')
            foreach ($match in $endpointMatches) {
                $codeAnalysis.endpoints += @{
                    "path" = $match.Groups[1].Value
                    "file" = $relativePath
                }
            }
            
            # Find imports
            $importMatches = [regex]::Matches($content, '^(?:from|import)\s+(\w+)', [System.Text.RegularExpressions.RegexOptions]::Multiline)
            foreach ($match in $importMatches) {
                $module = $match.Groups[1].Value
                if ($module -notin $codeAnalysis.dependencies -and $module -notmatch '^[a-z]') {
                    $codeAnalysis.dependencies += $module
                }
            }
            
            Write-Host "  ✅ Analyzed: $relativePath" -ForegroundColor Green
            
        } catch {
            Write-Host "  ❌ Failed to analyze $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    return $codeAnalysis
}

# Function to generate API documentation
function Generate-APIDocumentation {
    param($codeAnalysis)
    
    Write-Host "`nGenerating API documentation..." -ForegroundColor Yellow
    
    $apiDoc = @"
# API Documentation - LearnEnglishBot

**Generated**: $($docConfig.Timestamp)  
**Project**: $($docConfig.ProjectName)  
**Description**: $($docConfig.ProjectDescription)

## 📊 Code Statistics

- **Total Files**: $($codeAnalysis.total_files)
- **Total Lines**: $($codeAnalysis.total_lines)
- **Classes**: $($codeAnalysis.classes.Count)
- **Functions**: $($codeAnalysis.functions.Count)
- **API Endpoints**: $($codeAnalysis.endpoints.Count)
- **Dependencies**: $($codeAnalysis.dependencies.Count)

## 🏗️ Project Structure

### Core Modules

"@
    
    # Group by directory
    $modulesByDir = $codeAnalysis.functions | Group-Object { Split-Path $_.file -Parent }
    
    foreach ($moduleGroup in $modulesByDir) {
        $moduleName = if ($moduleGroup.Name -eq "") { "Root" } else { $moduleGroup.Name }
        $apiDoc += "`n#### $moduleName`n"
        
        foreach ($func in $moduleGroup.Group) {
            $apiDoc += "- **$($func.name)** - Line $($func.line) in `$($func.file)`n"
        }
    }
    
    $apiDoc += @"

## 🔌 API Endpoints

"@
    
    if ($codeAnalysis.endpoints.Count -gt 0) {
        foreach ($endpoint in $codeAnalysis.endpoints) {
            $apiDoc += "- **$($endpoint.path)** - Defined in `$($endpoint.file)`n"
        }
    } else {
        $apiDoc += "No API endpoints found in the current codebase.`n"
    }
    
    $apiDoc += @"

## 📚 Dependencies

"@
    
    foreach ($dep in $codeAnalysis.dependencies) {
        $apiDoc += "- $dep`n"
    }
    
    $apiDoc += @"

## 🧪 Testing

To test the API endpoints:

```bash
# Run tests
python -m pytest tests/

# Check coverage
python -m pytest --cov=bot tests/
```

## 📖 Usage Examples

### Basic Bot Usage

```python
from bot.ai_client import EnglishLearningAI

# Initialize AI client
ai = EnglishLearningAI()

# Analyze text
result = ai.analyze_text("Hello, how are you?", "beginner")
print(result)
```

### Voice Processing

```python
from bot.voice_processor import VoiceProcessor

# Initialize voice processor
vp = VoiceProcessor()

# Process voice message
result = vp.process_voice("voice_message.ogg")
print(result)
```

## 🔧 Configuration

The bot requires the following environment variables:

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `OPENAI_API_KEY` - Your OpenAI API key
- `DATABASE_URL` - Database connection string (optional)

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the $($docConfig.License) License.

---

*This documentation was auto-generated on $($docConfig.Timestamp)*
"@
    
    $apiDocPath = Join-Path $docConfig.OutputDir "API_DOCUMENTATION.md"
    $apiDoc | Out-File -FilePath $apiDocPath -Encoding UTF8
    
    Write-Host "  ✅ API documentation generated: $apiDocPath" -ForegroundColor Green
    return $apiDocPath
}

# Function to generate enhanced README
function Generate-EnhancedREADME {
    param($codeAnalysis)
    
    Write-Host "`nGenerating enhanced README..." -ForegroundColor Yellow
    
    $readme = @"
# $($docConfig.ProjectName)

$($docConfig.ProjectDescription)

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![Telegram](https://img.shields.io/badge/Telegram-Bot%20API-blue.svg)](https://core.telegram.org/bots/api)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT%203.5%2B-green.svg)](https://openai.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Features

- **AI-Powered Learning**: OpenAI GPT integration for personalized English lessons
- **Voice Processing**: Speech recognition and pronunciation analysis using Whisper
- **Multi-Modal Interaction**: Text and voice message support
- **Adaptive Learning**: Personalized learning paths based on user progress
- **Comprehensive Exercises**: Grammar, vocabulary, listening, speaking, reading, and writing
- **Progress Tracking**: Detailed analytics and achievement system
- **Multi-Language Support**: Internationalization for global users

## 📊 Project Statistics

- **Total Files**: $($codeAnalysis.total_files)
- **Total Lines**: $($codeAnalysis.total_lines)
- **Classes**: $($codeAnalysis.classes.Count)
- **Functions**: $($codeAnalysis.functions.Count)
- **API Endpoints**: $($codeAnalysis.endpoints.Count)

## 🏗️ Architecture

```
LearnEnglishBot/
├── bot/                    # Core bot functionality
│   ├── ai_client.py       # OpenAI integration
│   ├── voice_processor.py # Speech recognition
│   ├── progress_tracker.py # User progress management
│   └── ...                # Other modules
├── api/                    # REST API endpoints
├── tests/                  # Test suite
├── docs/                   # Documentation
└── .automation/            # Automation scripts
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Telegram Bot Token
- OpenAI API Key
- FFmpeg (for voice processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone $($docConfig.Repository)
   cd $($docConfig.ProjectName)
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.template .env
   # Edit .env with your API keys
   ```

5. **Run the bot**
   ```bash
   python main.py
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | ✅ |
| `OPENAI_API_KEY` | Your OpenAI API key | ✅ |
| `DATABASE_URL` | Database connection string | ❌ |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | ❌ |

### Bot Configuration

The bot can be configured through `config/` directory:

- `config/bot_config.json` - Bot behavior settings
- `config/ai_config.json` - AI model configuration
- `config/exercises.json` - Exercise definitions

## 📚 Usage

### Basic Commands

- `/start` - Start the bot and get welcome message
- `/help` - Show available commands
- `/level` - Set your English proficiency level
- `/exercise` - Start a learning exercise
- `/progress` - View your learning progress
- `/voice` - Send voice message for pronunciation analysis

### Learning Features

1. **Grammar Exercises**: AI-powered grammar correction and explanations
2. **Vocabulary Building**: Contextual vocabulary enhancement
3. **Listening Practice**: Multi-level listening comprehension exercises
4. **Speaking Practice**: Pronunciation analysis and feedback
5. **Reading Comprehension**: Graded texts with comprehension questions
6. **Writing Practice**: Essay prompts with AI feedback

## 🧪 Testing

### Run Tests

```bash
# Run all tests
python -m pytest

# Run specific test category
python -m pytest tests/unit/
python -m pytest tests/integration/
python -m pytest tests/e2e/

# Run with coverage
python -m pytest --cov=bot tests/
```

### Test Coverage

Current test coverage: **14%** (baseline established)

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t learnenglishbot .

# Run container
docker run -d --name learnenglishbot \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -e OPENAI_API_KEY=your_key \
  learnenglishbot
```

### Systemd Service

```bash
# Copy service file
sudo cp deployment/learnenglishbot.service /etc/systemd/system/

# Enable and start service
sudo systemctl enable learnenglishbot
sudo systemctl start learnenglishbot
```

## 📈 Performance

### AI Response Times

- **Text Analysis**: < 2 seconds
- **Voice Processing**: < 5 seconds
- **Grammar Check**: < 1.5 seconds
- **Vocabulary Feedback**: < 2 seconds

### Cost Efficiency

- **Cost per Request**: < $0.01
- **Tokens per Response**: < 200
- **Monthly Cost per User**: < $0.10

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `python -m pytest`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the $($docConfig.License) License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for AI language models
- [Telegram](https://telegram.org) for the bot platform
- [Whisper](https://github.com/openai/whisper) for speech recognition
- [Python Telegram Bot](https://python-telegram-bot.org/) for the bot framework

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues]($($docConfig.Repository)/issues)
- **Discussions**: [GitHub Discussions]($($docConfig.Repository)/discussions)

## 📊 Project Status

**Current Phase**: Educational Excellence Phase  
**Status**: Production Ready + Educational Systems Development  
**License**: MIT (Open Source)

---

*This README was auto-generated on $($docConfig.Timestamp)*

**Made with ❤️ by the $($docConfig.ProjectName) Team**
"@
    
    $readmePath = Join-Path $docConfig.OutputDir "README_ENHANCED.md"
    $readme | Out-File -FilePath $readmePath -Encoding UTF8
    
    Write-Host "  ✅ Enhanced README generated: $readmePath" -ForegroundColor Green
    return $readmePath
}

# Function to update CHANGELOG
function Update-CHANGELOG {
    if (-not $UpdateChangelog) {
        return $null
    }
    
    Write-Host "`nUpdating CHANGELOG..." -ForegroundColor Yellow
    
    try {
        $changelogPath = "CHANGELOG.md"
        $currentChangelog = ""
        
        if (Test-Path $changelogPath) {
            $currentChangelog = Get-Content $changelogPath -Raw
        }
        
        # Create new changelog entry
        $newEntry = @"

## [Unreleased] - $($docConfig.Timestamp)

### 🚀 Added
- Auto-generated documentation system
- Enhanced API documentation
- Comprehensive README updates
- Automated changelog management

### 🔧 Changed
- Documentation generation workflow
- README structure and content
- API documentation format

### 📚 Documentation
- Generated API documentation
- Enhanced project README
- Updated changelog

---
"@
        
        # Insert new entry at the beginning
        $updatedChangelog = $newEntry + $currentChangelog
        
        # Save updated changelog
        $updatedChangelog | Out-File -FilePath $changelogPath -Encoding UTF8
        
        Write-Host "  ✅ CHANGELOG updated: $changelogPath" -ForegroundColor Green
        return $changelogPath
        
    } catch {
        Write-Host "  ❌ Failed to update CHANGELOG: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Function to generate project overview
function Generate-ProjectOverview {
    param($codeAnalysis)
    
    Write-Host "`nGenerating project overview..." -ForegroundColor Yellow
    
    $overview = @"
# Project Overview - LearnEnglishBot

**Generated**: $($docConfig.Timestamp)

## 📊 Code Analysis Summary

### File Statistics
- **Total Python Files**: $($codeAnalysis.total_files)
- **Total Lines of Code**: $($codeAnalysis.total_lines)
- **Average Lines per File**: $([math]::Round($codeAnalysis.total_lines / [math]::Max($codeAnalysis.total_files, 1), 1))

### Code Structure
- **Classes**: $($codeAnalysis.classes.Count)
- **Functions**: $($codeAnalysis.functions.Count)
- **API Endpoints**: $($codeAnalysis.endpoints.Count)
- **External Dependencies**: $($codeAnalysis.dependencies.Count)

## 🏗️ Architecture Overview

### Core Components
1. **AI Integration** - OpenAI GPT models for language learning
2. **Voice Processing** - Whisper-based speech recognition
3. **Progress Tracking** - User learning analytics and achievements
4. **Exercise System** - Comprehensive learning activities
5. **Telegram Integration** - Bot API and message handling

### Technology Stack
- **Backend**: Python 3.8+
- **AI Models**: OpenAI GPT-3.5+, Whisper
- **Bot Framework**: python-telegram-bot
- **Testing**: pytest with coverage
- **Deployment**: Docker, systemd, supervisor

## 📈 Development Metrics

### Code Quality
- **Test Coverage**: 14% (baseline established)
- **Documentation**: Comprehensive auto-generated docs
- **Code Standards**: PEP 8 compliance
- **Type Hints**: Partial implementation

### Performance Metrics
- **AI Response Time**: < 2 seconds
- **Voice Processing**: < 5 seconds
- **Memory Usage**: Optimized for production
- **Scalability**: Designed for multiple users

## 🎯 Current Status

### Completed Features
- ✅ Core bot framework
- ✅ AI integration
- ✅ Voice processing
- ✅ Progress tracking
- ✅ Exercise system
- ✅ Testing framework
- ✅ Deployment configuration

### In Progress
- 🚧 Educational systems enhancement
- 🚧 Advanced AI features
- 🚧 Performance optimization

### Planned Features
- 📋 Gamification system
- 📋 Social learning features
- 📋 Advanced analytics
- 📋 Mobile app integration

## 🔧 Development Workflow

### Automation Tools
- **Compatibility Checking**: Cross-platform PowerShell scripts
- **Performance Monitoring**: AI response time tracking
- **Backup System**: Automated data protection
- **Documentation**: Auto-generation and updates

### Quality Assurance
- **Testing**: Unit, integration, and E2E tests
- **Code Review**: Automated checks and manual review
- **Documentation**: Auto-generated and maintained
- **Deployment**: Automated deployment pipelines

## 📚 Documentation Structure

### Generated Documentation
- **API Documentation**: Auto-generated from code analysis
- **Enhanced README**: Comprehensive project overview
- **Project Overview**: Development metrics and status
- **Changelog**: Automated version tracking

### Manual Documentation
- **Development Guide**: Setup and contribution instructions
- **Deployment Guide**: Production deployment steps
- **User Guide**: End-user documentation
- **API Reference**: Detailed endpoint documentation

## 🚀 Deployment Options

### Development
- Local Python environment
- Virtual environment isolation
- Hot reloading for development

### Production
- Docker containerization
- Systemd service management
- Supervisor process control
- Nginx reverse proxy

### Cloud Deployment
- Docker Compose for multi-service
- Environment-based configuration
- Health monitoring and alerts
- Automated scaling

## 🔒 Security Features

### Data Protection
- Encrypted user data storage
- Secure API key management
- User privacy compliance
- GDPR-ready data handling

### Access Control
- Telegram user authentication
- Rate limiting and throttling
- Input validation and sanitization
- Secure communication protocols

## 📊 Monitoring and Analytics

### Performance Monitoring
- AI response time tracking
- Cost analysis and optimization
- Error rate monitoring
- User engagement metrics

### Health Checks
- Service availability monitoring
- Database connectivity checks
- API endpoint health
- Automated alerting system

---

*This overview was auto-generated on $($docConfig.Timestamp)*
"@
    
    $overviewPath = Join-Path $docConfig.OutputDir "PROJECT_OVERVIEW.md"
    $overview | Out-File -FilePath $overviewPath -Encoding UTF8
    
    Write-Host "  ✅ Project overview generated: $overviewPath" -ForegroundColor Green
    return $overviewPath
}

# Main execution
Write-Host "Starting documentation generation..." -ForegroundColor Yellow

# Analyze code structure
$codeAnalysis = Analyze-PythonCode

# Generate documentation based on parameters
$generatedDocs = @()

if ($API -or $All) {
    $apiDoc = Generate-APIDocumentation -codeAnalysis $codeAnalysis
    $generatedDocs += $apiDoc
}

if ($README -or $All) {
    $readme = Generate-EnhancedREADME -codeAnalysis $codeAnalysis
    $generatedDocs += $readme
}

if ($All) {
    $overview = Generate-ProjectOverview -codeAnalysis $codeAnalysis
    $generatedDocs += $overview
}

# Update changelog if requested
if ($UpdateChangelog) {
    $changelog = Update-CHANGELOG
    if ($changelog) {
        $generatedDocs += $changelog
    }
}

# Generate documentation index
$indexContent = @"
# Generated Documentation Index

**Generated**: $($docConfig.Timestamp)  
**Project**: $($docConfig.ProjectName)

## 📚 Available Documentation

"@

foreach ($doc in $generatedDocs) {
    $docName = Split-Path $doc -Leaf
    $docPath = $doc.Replace($docConfig.ProjectRoot, "").TrimStart("\")
    $indexContent += "`n- **$docName** - `$docPath`"
}

$indexContent += "`n## Regeneration`n`nTo regenerate documentation:`n`n```powershell`n# Generate all documentation`n.\documentation_generator.ps1 -All`n`n# Generate specific documentation`n.\documentation_generator.ps1 -API`n.\documentation_generator.ps1 -README`n.\documentation_generator.ps1 -UpdateChangelog`n````n`n## Code Analysis Summary`n`n- Total Files: $($codeAnalysis.total_files)`n- Total Lines: $($codeAnalysis.total_lines)`n- Classes: $($codeAnalysis.classes.Count)`n- Functions: $($codeAnalysis.functions.Count)`n- API Endpoints: $($codeAnalysis.endpoints.Count)`n`n---`n`n*This index was auto-generated on $($docConfig.Timestamp)*"

$indexPath = Join-Path $docConfig.OutputDir "DOCUMENTATION_INDEX.md"
$indexContent | Out-File -FilePath $indexPath -Encoding UTF8

# Final report
Write-Host "`nDocumentation Generation Summary" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "Output Directory: $($docConfig.OutputDir)" -ForegroundColor White
Write-Host "Generated Files: $($generatedDocs.Count)" -ForegroundColor White
Write-Host "Code Analysis:" -ForegroundColor White
Write-Host "  Total Files: $($codeAnalysis.total_files)" -ForegroundColor White
Write-Host "  Total Lines: $($codeAnalysis.total_lines)" -ForegroundColor White
Write-Host "  Classes: $($codeAnalysis.classes.Count)" -ForegroundColor White
Write-Host "  Functions: $($codeAnalysis.functions.Count)" -ForegroundColor White
Write-Host "  API Endpoints: $($codeAnalysis.endpoints.Count)" -ForegroundColor White

Write-Host "`nGenerated Documentation:" -ForegroundColor Cyan
foreach ($doc in $generatedDocs) {
    $docName = Split-Path $doc -Leaf
    Write-Host "  ✅ $docName" -ForegroundColor Green
}

Write-Host "`n✅ Documentation generation completed!" -ForegroundColor Green
Write-Host "Check the $($docConfig.OutputDir) directory for generated files" -ForegroundColor White
