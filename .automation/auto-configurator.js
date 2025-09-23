#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoConfigurator {
  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates');
    this.configsPath = path.join(__dirname, '..', 'configs');
    this.ensureConfigsDirectory();
  }

  ensureConfigsDirectory() {
    if (!fs.existsSync(this.configsPath)) {
      fs.mkdirSync(this.configsPath, { recursive: true });
    }
  }

  detectProjectType(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    const unityPath = path.join(projectPath, 'Assets');
    const solidityPath = path.join(projectPath, 'contracts');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for React Native
      if (packageJson.dependencies && packageJson.dependencies['react-native']) {
        return 'mobile';
      }
      
      // Check for Electron
      if (packageJson.dependencies && packageJson.dependencies.electron) {
        return 'desktop';
      }
      
      // Check for Express/API
      if (packageJson.dependencies && packageJson.dependencies.express) {
        return 'api';
      }
      
      // Check for React
      if (packageJson.dependencies && packageJson.dependencies.react) {
        return 'web';
      }
      
      // Check for library indicators
      if (packageJson.main && !packageJson.dependencies) {
        return 'library';
      }
    }
    
    if (fs.existsSync(requirementsPath)) {
      return 'ai-ml';
    }
    
    if (fs.existsSync(unityPath)) {
      return 'game';
    }
    
    if (fs.existsSync(solidityPath)) {
      return 'blockchain';
    }
    
    return 'unknown';
  }

  loadProjectConfig(projectType) {
    const configPath = path.join(this.configsPath, `${projectType}-config.json`);
    
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    // Return default configuration
    return this.getDefaultConfig(projectType);
  }

  getDefaultConfig(projectType) {
    const configs = {
      'web': {
        name: 'Web Application Configuration',
        type: 'web',
        features: {
          typescript: true,
          testing: true,
          linting: true,
          formatting: true,
          hotReload: true,
          pwa: false,
          ssr: false
        },
        tools: {
          bundler: 'webpack',
          testFramework: 'jest',
          linter: 'eslint',
          formatter: 'prettier',
          cssPreprocessor: 'css'
        },
        scripts: {
          dev: 'webpack serve --mode development',
          build: 'webpack --mode production',
          test: 'jest',
          lint: 'eslint src --ext .ts,.tsx',
          format: 'prettier --write src/**/*.{ts,tsx,css}'
        },
        dependencies: {
          production: ['react', 'react-dom', 'typescript'],
          development: ['@testing-library/react', 'jest', 'webpack', 'eslint', 'prettier']
        }
      },
      'mobile': {
        name: 'Mobile Application Configuration',
        type: 'mobile',
        features: {
          typescript: true,
          testing: true,
          linting: true,
          formatting: true,
          hotReload: true,
          navigation: true,
          stateManagement: 'redux'
        },
        tools: {
          framework: 'react-native',
          bundler: 'metro',
          testFramework: 'jest',
          linter: 'eslint',
          formatter: 'prettier'
        },
        scripts: {
          start: 'expo start',
          android: 'expo start --android',
          ios: 'expo start --ios',
          test: 'jest',
          lint: 'eslint src --ext .ts,.tsx',
          format: 'prettier --write src/**/*.{ts,tsx}'
        },
        dependencies: {
          production: ['react-native', 'expo', 'typescript', '@react-navigation/native'],
          development: ['@testing-library/react-native', 'jest', 'eslint', 'prettier']
        }
      },
      'api': {
        name: 'API Service Configuration',
        type: 'api',
        features: {
          typescript: true,
          testing: true,
          linting: true,
          formatting: true,
          authentication: true,
          validation: true,
          documentation: true
        },
        tools: {
          framework: 'express',
          database: 'mongodb',
          testFramework: 'jest',
          linter: 'eslint',
          formatter: 'prettier',
          documentation: 'swagger'
        },
        scripts: {
          dev: 'nodemon src/server.ts',
          build: 'tsc',
          start: 'node dist/server.js',
          test: 'jest',
          lint: 'eslint src --ext .ts',
          format: 'prettier --write src/**/*.ts'
        },
        dependencies: {
          production: ['express', 'typescript', 'mongoose', 'jsonwebtoken', 'cors'],
          development: ['jest', 'supertest', 'nodemon', 'eslint', 'prettier']
        }
      },
      'ai-ml': {
        name: 'AI/ML Project Configuration',
        type: 'ai-ml',
        features: {
          python: true,
          jupyter: true,
          testing: true,
          linting: true,
          formatting: true,
          dataVisualization: true,
          experimentTracking: true
        },
        tools: {
          language: 'python',
          framework: 'tensorflow',
          notebook: 'jupyter',
          testFramework: 'pytest',
          linter: 'flake8',
          formatter: 'black'
        },
        scripts: {
          train: 'python scripts/train.py',
          predict: 'python scripts/predict.py',
          test: 'pytest tests/',
          lint: 'flake8 src tests',
          format: 'black src tests',
          jupyter: 'jupyter notebook'
        },
        dependencies: {
          production: ['numpy', 'pandas', 'tensorflow', 'matplotlib', 'jupyter'],
          development: ['pytest', 'black', 'flake8', 'mypy']
        }
      },
      'library': {
        name: 'Library Package Configuration',
        type: 'library',
        features: {
          typescript: true,
          testing: true,
          linting: true,
          formatting: true,
          bundling: true,
          documentation: true
        },
        tools: {
          bundler: 'rollup',
          testFramework: 'jest',
          linter: 'eslint',
          formatter: 'prettier',
          documentation: 'typedoc'
        },
        scripts: {
          build: 'rollup -c',
          dev: 'rollup -c -w',
          test: 'jest',
          lint: 'eslint src --ext .ts',
          format: 'prettier --write src/**/*.ts'
        },
        dependencies: {
          production: ['typescript'],
          development: ['rollup', 'jest', 'eslint', 'prettier', 'typedoc']
        }
      },
      'game': {
        name: 'Game Development Configuration',
        type: 'game',
        features: {
          unity: true,
          csharp: true,
          testing: true,
          versionControl: true,
          buildAutomation: true
        },
        tools: {
          engine: 'unity',
          language: 'csharp',
          testFramework: 'unity-test-framework',
          versionControl: 'git'
        },
        scripts: {
          'build:windows': 'Unity -batchmode -quit -projectPath . -buildTarget Win64',
          'build:android': 'Unity -batchmode -quit -projectPath . -buildTarget Android',
          test: 'Unity -batchmode -quit -projectPath . -runTests'
        },
        dependencies: {
          production: ['Unity Engine 2022.3 LTS'],
          development: ['Unity Test Framework']
        }
      },
      'blockchain': {
        name: 'Blockchain Project Configuration',
        type: 'blockchain',
        features: {
          solidity: true,
          testing: true,
          deployment: true,
          verification: true,
          frontend: true
        },
        tools: {
          framework: 'hardhat',
          language: 'solidity',
          testFramework: 'chai',
          frontend: 'react'
        },
        scripts: {
          compile: 'hardhat compile',
          test: 'hardhat test',
          deploy: 'hardhat run scripts/deploy.ts',
          verify: 'hardhat verify'
        },
        dependencies: {
          production: ['hardhat', '@openzeppelin/contracts', 'ethers'],
          development: ['@nomicfoundation/hardhat-toolbox', 'chai']
        }
      },
      'desktop': {
        name: 'Desktop Application Configuration',
        type: 'desktop',
        features: {
          electron: true,
          typescript: true,
          testing: true,
          linting: true,
          formatting: true,
          autoUpdater: true
        },
        tools: {
          framework: 'electron',
          bundler: 'webpack',
          testFramework: 'jest',
          linter: 'eslint',
          formatter: 'prettier'
        },
        scripts: {
          dev: 'concurrently "npm run dev:main" "npm run dev:renderer"',
          build: 'npm run build:main && npm run build:renderer',
          test: 'jest',
          lint: 'eslint src --ext .ts,.tsx',
          format: 'prettier --write src/**/*.{ts,tsx}'
        },
        dependencies: {
          production: ['electron', 'typescript', 'react'],
          development: ['electron-builder', 'webpack', 'jest', 'eslint', 'prettier']
        }
      }
    };
    
    return configs[projectType] || configs['web'];
  }

  configureProject(projectPath, options = {}) {
    try {
      console.log(`\n🔧 Auto-configuring project at ${projectPath}...\n`);
      
      const projectType = this.detectProjectType(projectPath);
      console.log(`📋 Detected project type: ${projectType}`);
      
      const config = this.loadProjectConfig(projectType);
      
      // Apply configuration
      this.applyConfiguration(projectPath, config, options);
      
      // Install dependencies
      if (options.installDependencies !== false) {
        this.installDependencies(projectPath, config);
      }
      
      // Setup development tools
      if (options.setupTools !== false) {
        this.setupDevelopmentTools(projectPath, config);
      }
      
      // Create configuration files
      this.createConfigFiles(projectPath, config);
      
      console.log(`\n✅ Project auto-configured successfully!`);
      console.log(`📁 Project type: ${config.name}`);
      console.log(`🛠️  Features enabled: ${Object.keys(config.features).filter(k => config.features[k]).join(', ')}`);
      
    } catch (error) {
      console.error(`\n❌ Error auto-configuring project: ${error.message}`);
      process.exit(1);
    }
  }

  applyConfiguration(projectPath, config, options) {
    // Update package.json if it exists
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      this.updatePackageJson(packageJsonPath, config);
    }
    
    // Create or update tsconfig.json
    if (config.features.typescript) {
      this.createTypeScriptConfig(projectPath, config);
    }
    
    // Create or update other config files
    this.createToolConfigs(projectPath, config);
  }

  updatePackageJson(packageJsonPath, config) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Update scripts
    if (config.scripts) {
      packageJson.scripts = { ...packageJson.scripts, ...config.scripts };
    }
    
    // Update dependencies
    if (config.dependencies) {
      packageJson.dependencies = { ...packageJson.dependencies, ...this.formatDependencies(config.dependencies.production) };
      packageJson.devDependencies = { ...packageJson.devDependencies, ...this.formatDependencies(config.dependencies.development) };
    }
    
    // Update other fields
    if (config.name) {
      packageJson.name = packageJson.name || config.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  createTypeScriptConfig(projectPath, config) {
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        lib: ['DOM', 'DOM.Iterable', 'ES6'],
        allowJs: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        module: 'esnext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx'
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'build']
    };
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  }

  createToolConfigs(projectPath, config) {
    // ESLint configuration
    if (config.tools.linter === 'eslint') {
      this.createESLintConfig(projectPath, config);
    }
    
    // Prettier configuration
    if (config.tools.formatter === 'prettier') {
      this.createPrettierConfig(projectPath, config);
    }
    
    // Jest configuration
    if (config.tools.testFramework === 'jest') {
      this.createJestConfig(projectPath, config);
    }
    
    // Webpack configuration
    if (config.tools.bundler === 'webpack') {
      this.createWebpackConfig(projectPath, config);
    }
  }

  createESLintConfig(projectPath, config) {
    const eslintConfig = {
      env: {
        browser: true,
        es2021: true,
        node: true
      },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      plugins: ['@typescript-eslint'],
      rules: {
        'indent': ['error', 2],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always']
      }
    };
    
    fs.writeFileSync(path.join(projectPath, '.eslintrc.json'), JSON.stringify(eslintConfig, null, 2));
  }

  createPrettierConfig(projectPath, config) {
    const prettierConfig = {
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false
    };
    
    fs.writeFileSync(path.join(projectPath, '.prettierrc.json'), JSON.stringify(prettierConfig, null, 2));
  }

  createJestConfig(projectPath, config) {
    const jestConfig = {
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src', '<rootDir>/tests'],
      testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest'
      },
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts'
      ]
    };
    
    fs.writeFileSync(path.join(projectPath, 'jest.config.js'), `module.exports = ${JSON.stringify(jestConfig, null, 2)};`);
  }

  createWebpackConfig(projectPath, config) {
    const webpackConfig = {
      entry: './src/index.ts',
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
          },
          {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader']
          }
        ]
      },
      resolve: {
        extensions: ['.tsx', '.ts', '.js']
      },
      output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
      }
    };
    
    fs.writeFileSync(path.join(projectPath, 'webpack.config.js'), `module.exports = ${JSON.stringify(webpackConfig, null, 2)};`);
  }

  createConfigFiles(projectPath, config) {
    // Create .gitignore
    this.createGitignore(projectPath, config);
    
    // Create .env.example
    this.createEnvExample(projectPath, config);
    
    // Create README.md if it doesn't exist
    const readmePath = path.join(projectPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      this.createREADME(projectPath, config);
    }
  }

  createGitignore(projectPath, config) {
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/
*.tgz

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port
`;
    
    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent);
  }

  createEnvExample(projectPath, config) {
    const envExampleContent = `# Environment Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://localhost:27017/app

# API Keys
API_KEY=your_api_key_here

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000
`;
    
    fs.writeFileSync(path.join(projectPath, '.env.example'), envExampleContent);
  }

  createREADME(projectPath, config) {
    const readmeContent = `# ${config.name}

${config.description || 'Auto-configured project'}

## Features

${Object.entries(config.features)
  .filter(([key, value]) => value)
  .map(([key, value]) => `- ${key}`)
  .join('\n')}

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
\`\`\`bash
npm install
\`\`\`

### Development
\`\`\`bash
npm run dev
\`\`\`

### Building
\`\`\`bash
npm run build
\`\`\`

### Testing
\`\`\`bash
npm test
\`\`\`

## Project Structure

\`\`\`
src/
├── components/     # Reusable components
├── pages/         # Page components
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
└── assets/        # Static assets
\`\`\`

## Technologies Used

${Object.entries(config.tools)
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join('\n')}

## License

MIT

---

Auto-configured by ManagerAgentAI
`;
    
    fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);
  }

  formatDependencies(deps) {
    const formatted = {};
    deps.forEach(dep => {
      if (typeof dep === 'string') {
        formatted[dep] = 'latest';
      } else if (typeof dep === 'object') {
        Object.assign(formatted, dep);
      }
    });
    return formatted;
  }

  installDependencies(projectPath, config) {
    console.log('📦 Installing dependencies...');
    try {
      process.chdir(projectPath);
      execSync('npm install', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Failed to install dependencies automatically. Please run "npm install" manually.');
    }
  }

  setupDevelopmentTools(projectPath, config) {
    console.log('🛠️  Setting up development tools...');
    
    // Create test directory if it doesn't exist
    const testDir = path.join(projectPath, 'tests');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create example test file
    if (config.tools.testFramework === 'jest') {
      this.createExampleTest(projectPath, config);
    }
  }

  createExampleTest(projectPath, config) {
    const testContent = `// Example test file
describe('Example Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
`;
    
    fs.writeFileSync(path.join(projectPath, 'tests', 'example.test.ts'), testContent);
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const configurator = new AutoConfigurator();

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
🔧 ManagerAgentAI Auto-Configurator

Usage:
  node auto-configurator.js <project-path> [options]

Options:
  --no-install     Skip dependency installation
  --no-tools       Skip development tools setup

Examples:
  node auto-configurator.js ./my-project
  node auto-configurator.js ./my-project --no-install
`);
    process.exit(0);
  }

  const projectPath = args[0];
  const options = {
    installDependencies: !args.includes('--no-install'),
    setupTools: !args.includes('--no-tools')
  };

  if (!projectPath) {
    console.error('❌ Project path is required. Use --help for usage information.');
    process.exit(1);
  }

  if (!fs.existsSync(projectPath)) {
    console.error(`❌ Project path '${projectPath}' does not exist.`);
    process.exit(1);
  }

  configurator.configureProject(projectPath, options);
}

module.exports = AutoConfigurator;
