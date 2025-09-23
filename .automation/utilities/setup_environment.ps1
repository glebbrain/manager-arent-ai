param(
    [switch]$CreateEnv,
    [switch]$InstallDeps,
    [switch]$TestSetup
)

Write-Host "🎓 LearnEnglishBot Environment Setup" -ForegroundColor Cyan
Write-Host "Helping set up development environment..." -ForegroundColor Yellow

# 1. Create .env file from example if requested
if ($CreateEnv) {
    Write-Host "`n🔧 Setting up environment file..." -ForegroundColor Green
    
    if (Test-Path ".env.example") {
        if (!(Test-Path ".env")) {
            try {
                Copy-Item ".env.example" ".env"
                Write-Host "✅ .env file created from template" -ForegroundColor Green
                Write-Host "⚠️ Please edit .env file and add your API keys" -ForegroundColor Yellow
            } catch {
                Write-Host "❌ Failed to create .env file" -ForegroundColor Red
            }
        } else {
            Write-Host "⚠️ .env file already exists" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ .env.example not found" -ForegroundColor Red
        Write-Host "Creating basic .env template..." -ForegroundColor Blue
        
        $envTemplate = @"
# LearnEnglishBot Environment Configuration
# Get your tokens and fill in the values below

# Telegram Bot Token (get from @BotFather)
TELEGRAM_TOKEN=your_telegram_bot_token_here

# OpenAI API Key (get from https://platform.openai.com/)
OPENAI_API_KEY=your_openai_api_key_here

# Bot Configuration
BOT_USERNAME=your_bot_username
DEBUG_MODE=false
LOG_LEVEL=INFO

# Voice Processing
WHISPER_MODEL=base
MAX_AUDIO_SIZE_MB=20

# Features
ENABLE_VOICE_PROCESSING=true
ENABLE_AI_RESPONSES=true
ENABLE_EXERCISES=true
"@
        
        try {
            $envTemplate | Out-File -FilePath ".env" -Encoding UTF8
            Write-Host "✅ Basic .env template created" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to create .env template" -ForegroundColor Red
        }
    }
}

# 2. Install dependencies if requested
if ($InstallDeps) {
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Green
    
    # Check if virtual environment exists
    if (!(Test-Path "venv")) {
        Write-Host "🐍 Creating Python virtual environment..." -ForegroundColor Blue
        try {
            & python -m venv venv
            Write-Host "✅ Virtual environment created" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
            return 1
        }
    }
    
    # Activate virtual environment
    if (Test-Path "venv\Scripts\Activate.ps1") {
        try {
            & .\venv\Scripts\Activate.ps1
            Write-Host "✅ Virtual environment activated" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Could not activate virtual environment" -ForegroundColor Yellow
        }
    }
    
    # Install requirements
    if (Test-Path "requirements.txt") {
        Write-Host "📦 Installing Python packages..." -ForegroundColor Blue
        try {
            & pip install -r requirements.txt
            Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
            return 1
        }
    } else {
        Write-Host "❌ requirements.txt not found" -ForegroundColor Red
    }
}

# 3. Test setup if requested
if ($TestSetup) {
    Write-Host "`n🧪 Testing setup..." -ForegroundColor Green
    
    # Run validation scripts
    if (Test-Path ".automation\validation\validate_learnenglish_features.ps1") {
        Write-Host "🔍 Running feature validation..." -ForegroundColor Blue
        & .\.automation\validation\validate_learnenglish_features.ps1
    }
    
    if (Test-Path ".automation\validation\validate_ai_configuration.ps1") {
        Write-Host "🔍 Running AI configuration validation..." -ForegroundColor Blue
        & .\.automation\validation\validate_ai_configuration.ps1
    }
}

# Summary and next steps
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your actual API keys" -ForegroundColor White
Write-Host "2. Get Telegram bot token from @BotFather" -ForegroundColor White
Write-Host "3. Get OpenAI API key from https://platform.openai.com/" -ForegroundColor White
Write-Host "4. Run 'python main.py' to start the bot" -ForegroundColor White
Write-Host "5. Use automation scripts for development workflow" -ForegroundColor White

Write-Host "`n🎓 LearnEnglishBot environment setup completed!" -ForegroundColor Green
