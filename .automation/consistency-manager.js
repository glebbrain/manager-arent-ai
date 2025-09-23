#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ConsistencyManager {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'configs');
    this.templatesPath = path.join(__dirname, '..', 'templates');
    this.scriptsPath = path.join(__dirname);
    this.ensureDirectories();
    this.standards = this.loadStandards();
  }

  ensureDirectories() {
    const dirs = [this.configPath, this.templatesPath, this.scriptsPath];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadStandards() {
    return {
      naming: {
        files: {
          kebabCase: true,
          extensions: {
            javascript: '.js',
            typescript: '.ts',
            json: '.json',
            markdown: '.md',
            yaml: '.yaml',
            yml: '.yml'
          }
        },
        variables: {
          camelCase: true,
          constants: 'UPPER_SNAKE_CASE'
        },
        functions: {
          camelCase: true,
          prefix: {
            private: '_',
            async: 'async',
            getter: 'get',
            setter: 'set'
          }
        },
        classes: {
          PascalCase: true,
          suffix: {
            manager: 'Manager',
            service: 'Service',
            controller: 'Controller',
            model: 'Model',
            view: 'View',
            component: 'Component'
          }
        }
      },
      structure: {
        directories: {
          src: 'source code',
          tests: 'test files',
          docs: 'documentation',
          scripts: 'build and utility scripts',
          config: 'configuration files',
          assets: 'static assets',
          public: 'public files',
          dist: 'build output',
          node_modules: 'dependencies'
        },
        files: {
          required: ['README.md', '.gitignore', 'package.json'],
          recommended: ['.env.example', 'LICENSE', 'CHANGELOG.md'],
          config: ['tsconfig.json', '.eslintrc.json', '.prettierrc.json']
        }
      },
      code: {
        formatting: {
          indent: 2,
          quotes: 'single',
          semicolons: true,
          trailingCommas: true,
          lineEndings: 'lf'
        },
        imports: {
          order: ['external', 'internal', 'relative'],
          grouping: true,
          sorting: 'alphabetical'
        },
        comments: {
          required: ['file headers', 'function descriptions', 'complex logic'],
          format: 'JSDoc',
          language: 'English'
        }
      },
      documentation: {
        format: 'Markdown',
        structure: {
          required: ['README.md', 'API.md', 'CHANGELOG.md'],
          sections: ['Overview', 'Installation', 'Usage', 'API', 'Contributing', 'License']
        },
        style: {
          headers: 'ATX',
          lists: 'ordered',
          links: 'reference',
          code: 'fenced'
        }
      },
      testing: {
        framework: 'Jest',
        structure: {
          unit: 'tests/unit',
          integration: 'tests/integration',
          e2e: 'tests/e2e'
        },
        naming: {
          files: '*.test.js',
          describe: 'Component/Function name',
          it: 'should behavior description'
        }
      },
      git: {
        branches: {
          main: 'main',
          develop: 'develop',
          feature: 'feature/',
          hotfix: 'hotfix/',
          release: 'release/'
        },
        commits: {
          format: 'conventional',
          types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
          scope: 'optional',
          subject: 'lowercase'
        }
      }
    };
  }

  // Validation Methods
  validateProject(projectPath) {
    const issues = [];
    const project = this.analyzeProject(projectPath);
    
    // Validate structure
    issues.push(...this.validateStructure(project));
    
    // Validate naming conventions
    issues.push(...this.validateNaming(project));
    
    // Validate code style
    issues.push(...this.validateCodeStyle(project));
    
    // Validate documentation
    issues.push(...this.validateDocumentation(project));
    
    // Validate configuration
    issues.push(...this.validateConfiguration(project));
    
    return {
      project,
      issues,
      score: this.calculateScore(issues),
      recommendations: this.generateRecommendations(issues)
    };
  }

  analyzeProject(projectPath) {
    const project = {
      path: projectPath,
      type: this.detectProjectType(projectPath),
      structure: this.analyzeStructure(projectPath),
      files: this.analyzeFiles(projectPath),
      dependencies: this.analyzeDependencies(projectPath),
      configuration: this.analyzeConfiguration(projectPath)
    };
    
    return project;
  }

  detectProjectType(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    const unityPath = path.join(projectPath, 'Assets');
    const solidityPath = path.join(projectPath, 'contracts');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.dependencies && packageJson.dependencies['react-native']) {
        return 'mobile';
      }
      if (packageJson.dependencies && packageJson.dependencies.electron) {
        return 'desktop';
      }
      if (packageJson.dependencies && packageJson.dependencies.express) {
        return 'api';
      }
      if (packageJson.dependencies && packageJson.dependencies.react) {
        return 'web';
      }
      if (packageJson.main && !packageJson.dependencies) {
        return 'library';
      }
    }
    
    if (fs.existsSync(requirementsPath)) return 'ai-ml';
    if (fs.existsSync(unityPath)) return 'game';
    if (fs.existsSync(solidityPath)) return 'blockchain';
    
    return 'unknown';
  }

  analyzeStructure(projectPath) {
    const structure = {
      directories: [],
      files: [],
      depth: 0
    };
    
    this.walkDirectory(projectPath, (itemPath, stats) => {
      const relativePath = path.relative(projectPath, itemPath);
      const depth = relativePath.split(path.sep).length - 1;
      structure.depth = Math.max(structure.depth, depth);
      
      if (stats.isDirectory()) {
        structure.directories.push(relativePath);
      } else {
        structure.files.push(relativePath);
      }
    });
    
    return structure;
  }

  analyzeFiles(projectPath) {
    const files = {
      byExtension: {},
      byType: {},
      total: 0,
      totalSize: 0
    };
    
    this.walkDirectory(projectPath, (itemPath, stats) => {
      if (stats.isFile()) {
        const ext = path.extname(itemPath);
        const relativePath = path.relative(projectPath, itemPath);
        
        files.total++;
        files.totalSize += stats.size;
        
        if (!files.byExtension[ext]) {
          files.byExtension[ext] = [];
        }
        files.byExtension[ext].push(relativePath);
        
        const fileType = this.getFileType(ext);
        if (!files.byType[fileType]) {
          files.byType[fileType] = [];
        }
        files.byType[fileType].push(relativePath);
      }
    });
    
    return files;
  }

  analyzeDependencies(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return {
        production: packageJson.dependencies || {},
        development: packageJson.devDependencies || {},
        scripts: packageJson.scripts || {}
      };
    }
    return null;
  }

  analyzeConfiguration(projectPath) {
    const configFiles = [
      'tsconfig.json',
      '.eslintrc.json',
      '.prettierrc.json',
      'jest.config.js',
      'webpack.config.js',
      '.gitignore',
      '.env.example'
    ];
    
    const config = {};
    configFiles.forEach(file => {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          config[file] = JSON.parse(content);
        } catch (e) {
          config[file] = { error: 'Invalid JSON' };
        }
      }
    });
    
    return config;
  }

  // Validation Methods
  validateStructure(project) {
    const issues = [];
    const standards = this.standards.structure;
    
    // Check required directories
    Object.entries(standards.directories).forEach(([dir, description]) => {
      if (!project.structure.directories.includes(dir)) {
        issues.push({
          type: 'structure',
          severity: 'warning',
          message: `Missing recommended directory: ${dir} (${description})`,
          suggestion: `Create directory: mkdir ${dir}`
        });
      }
    });
    
    // Check required files
    standards.files.required.forEach(file => {
      if (!project.structure.files.includes(file)) {
        issues.push({
          type: 'structure',
          severity: 'error',
          message: `Missing required file: ${file}`,
          suggestion: `Create file: touch ${file}`
        });
      }
    });
    
    // Check directory depth
    if (project.structure.depth > 5) {
      issues.push({
        type: 'structure',
        severity: 'warning',
        message: `Deep directory structure detected (${project.structure.depth} levels)`,
        suggestion: 'Consider flattening the directory structure'
      });
    }
    
    return issues;
  }

  validateNaming(project) {
    const issues = [];
    const standards = this.standards.naming;
    
    // Validate file names
    project.structure.files.forEach(file => {
      const ext = path.extname(file);
      const name = path.basename(file, ext);
      
      // Check kebab-case for file names
      if (standards.files.kebabCase && !this.isKebabCase(name)) {
        issues.push({
          type: 'naming',
          severity: 'warning',
          message: `File name should be kebab-case: ${file}`,
          suggestion: `Rename to: ${this.toKebabCase(name)}${ext}`
        });
      }
    });
    
    // Validate directory names
    project.structure.directories.forEach(dir => {
      if (!this.isKebabCase(dir)) {
        issues.push({
          type: 'naming',
          severity: 'warning',
          message: `Directory name should be kebab-case: ${dir}`,
          suggestion: `Rename to: ${this.toKebabCase(dir)}`
        });
      }
    });
    
    return issues;
  }

  validateCodeStyle(project) {
    const issues = [];
    const standards = this.standards.code;
    
    // Check JavaScript/TypeScript files
    const jsFiles = [
      ...(project.files.byExtension['.js'] || []),
      ...(project.files.byExtension['.ts'] || []),
      ...(project.files.byExtension['.tsx'] || [])
    ];
    
    jsFiles.forEach(file => {
      const filePath = path.join(project.path, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check indentation
      if (standards.formatting.indent === 2) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.match(/^[ ]{1,3}[^ ]/) && !line.match(/^[ ]{2}[^ ]/)) {
            issues.push({
              type: 'code-style',
              severity: 'warning',
              message: `Inconsistent indentation in ${file}:${index + 1}`,
              suggestion: 'Use 2 spaces for indentation'
            });
          }
        });
      }
      
      // Check quotes
      if (standards.formatting.quotes === 'single') {
        const doubleQuotes = (content.match(/"/g) || []).length;
        const singleQuotes = (content.match(/'/g) || []).length;
        if (doubleQuotes > singleQuotes) {
          issues.push({
            type: 'code-style',
            severity: 'warning',
            message: `Use single quotes in ${file}`,
            suggestion: 'Replace double quotes with single quotes'
          });
        }
      }
    });
    
    return issues;
  }

  validateDocumentation(project) {
    const issues = [];
    const standards = this.standards.documentation;
    
    // Check required documentation files
    standards.structure.required.forEach(file => {
      if (!project.structure.files.includes(file)) {
        issues.push({
          type: 'documentation',
          severity: 'warning',
          message: `Missing documentation file: ${file}`,
          suggestion: `Create ${file} with proper structure`
        });
      }
    });
    
    // Check README.md content
    const readmePath = path.join(project.path, 'README.md');
    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      const sections = standards.structure.sections;
      
      sections.forEach(section => {
        if (!readmeContent.includes(`# ${section}`) && !readmeContent.includes(`## ${section}`)) {
          issues.push({
            type: 'documentation',
            severity: 'info',
            message: `README.md missing section: ${section}`,
            suggestion: `Add ## ${section} section to README.md`
          });
        }
      });
    }
    
    return issues;
  }

  validateConfiguration(project) {
    const issues = [];
    const standards = this.standards;
    
    // Check TypeScript configuration
    if (project.configuration['tsconfig.json']) {
      const tsconfig = project.configuration['tsconfig.json'];
      if (!tsconfig.compilerOptions) {
        issues.push({
          type: 'configuration',
          severity: 'error',
          message: 'tsconfig.json missing compilerOptions',
          suggestion: 'Add compilerOptions to tsconfig.json'
        });
      }
    }
    
    // Check ESLint configuration
    if (project.configuration['.eslintrc.json']) {
      const eslint = project.configuration['.eslintrc.json'];
      if (!eslint.rules) {
        issues.push({
          type: 'configuration',
          severity: 'warning',
          message: 'ESLint configuration missing rules',
          suggestion: 'Add rules to .eslintrc.json'
        });
      }
    }
    
    return issues;
  }

  // Utility Methods
  walkDirectory(dir, callback) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      callback(itemPath, stats);
      
      if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        this.walkDirectory(itemPath, callback);
      }
    });
  }

  getFileType(extension) {
    const types = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.json': 'json',
      '.md': 'markdown',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less'
    };
    return types[extension] || 'unknown';
  }

  isKebabCase(str) {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
  }

  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  calculateScore(issues) {
    const totalIssues = issues.length;
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;
    
    const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5) - (infoCount * 2));
    return Math.round(score);
  }

  generateRecommendations(issues) {
    const recommendations = [];
    const groupedIssues = this.groupIssuesByType(issues);
    
    Object.entries(groupedIssues).forEach(([type, typeIssues]) => {
      const count = typeIssues.length;
      const severity = typeIssues[0].severity;
      
      recommendations.push({
        type,
        count,
        severity,
        priority: this.getPriority(severity),
        actions: this.getActionsForType(type, typeIssues)
      });
    });
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  groupIssuesByType(issues) {
    return issues.reduce((groups, issue) => {
      if (!groups[issue.type]) {
        groups[issue.type] = [];
      }
      groups[issue.type].push(issue);
      return groups;
    }, {});
  }

  getPriority(severity) {
    const priorities = { error: 3, warning: 2, info: 1 };
    return priorities[severity] || 0;
  }

  getActionsForType(type, issues) {
    const actions = {
      structure: [
        'Create missing directories and files',
        'Reorganize directory structure',
        'Follow standard project layout'
      ],
      naming: [
        'Rename files and directories to kebab-case',
        'Use consistent naming conventions',
        'Follow language-specific naming standards'
      ],
      'code-style': [
        'Run code formatter (Prettier)',
        'Fix indentation and quotes',
        'Follow consistent coding style'
      ],
      documentation: [
        'Create missing documentation files',
        'Add required sections to README',
        'Improve code comments and documentation'
      ],
      configuration: [
        'Add missing configuration files',
        'Configure linting and formatting',
        'Set up proper build configuration'
      ]
    };
    
    return actions[type] || ['Review and fix issues'];
  }

  // Fix Methods
  fixProject(projectPath, options = {}) {
    const validation = this.validateProject(projectPath);
    const fixes = [];
    
    if (options.autoFix) {
      fixes.push(...this.autoFixIssues(projectPath, validation.issues));
    }
    
    if (options.createMissing) {
      fixes.push(...this.createMissingFiles(projectPath, validation.issues));
    }
    
    if (options.formatCode) {
      fixes.push(...this.formatCode(projectPath));
    }
    
    return {
      validation,
      fixes,
      summary: this.generateFixSummary(fixes)
    };
  }

  autoFixIssues(projectPath, issues) {
    const fixes = [];
    
    issues.forEach(issue => {
      if (issue.type === 'naming' && issue.suggestion) {
        const oldPath = path.join(projectPath, issue.message.split(': ')[1]);
        const newPath = path.join(projectPath, issue.suggestion.split(': ')[1]);
        
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          fixes.push({
            type: 'rename',
            oldPath,
            newPath,
            message: `Renamed ${path.basename(oldPath)} to ${path.basename(newPath)}`
          });
        }
      }
    });
    
    return fixes;
  }

  createMissingFiles(projectPath, issues) {
    const fixes = [];
    
    issues.forEach(issue => {
      if (issue.type === 'structure' && issue.suggestion) {
        const filePath = path.join(projectPath, issue.message.split(': ')[1]);
        
        if (issue.suggestion.startsWith('Create file:')) {
          const fileName = issue.suggestion.split('touch ')[1];
          const fullPath = path.join(projectPath, fileName);
          
          if (!fs.existsSync(fullPath)) {
            this.createDefaultFile(fullPath, fileName);
            fixes.push({
              type: 'create',
              path: fullPath,
              message: `Created ${fileName}`
            });
          }
        } else if (issue.suggestion.startsWith('Create directory:')) {
          const dirName = issue.suggestion.split('mkdir ')[1];
          const fullPath = path.join(projectPath, dirName);
          
          if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            fixes.push({
              type: 'create',
              path: fullPath,
              message: `Created directory ${dirName}`
            });
          }
        }
      }
    });
    
    return fixes;
  }

  createDefaultFile(filePath, fileName) {
    const content = this.getDefaultFileContent(fileName);
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content);
  }

  getDefaultFileContent(fileName) {
    const templates = {
      'README.md': `# Project Name

Project description here.

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## License

MIT
`,
      '.gitignore': `# Dependencies
node_modules/
npm-debug.log*

# Build output
dist/
build/

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
`,
      '.env.example': `# Environment Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://localhost:27017/app

# API Keys
API_KEY=your_api_key_here
`
    };
    
    return templates[fileName] || `# ${fileName}\n\nContent here.\n`;
  }

  formatCode(projectPath) {
    const fixes = [];
    
    try {
      // Run Prettier if available
      execSync('npx prettier --write .', { cwd: projectPath, stdio: 'pipe' });
      fixes.push({
        type: 'format',
        message: 'Code formatted with Prettier'
      });
    } catch (error) {
      // Prettier not available or failed
    }
    
    try {
      // Run ESLint fix if available
      execSync('npx eslint --fix .', { cwd: projectPath, stdio: 'pipe' });
      fixes.push({
        type: 'lint-fix',
        message: 'Code linted and fixed with ESLint'
      });
    } catch (error) {
      // ESLint not available or failed
    }
    
    return fixes;
  }

  generateFixSummary(fixes) {
    const summary = {
      total: fixes.length,
      byType: {},
      success: true
    };
    
    fixes.forEach(fix => {
      if (!summary.byType[fix.type]) {
        summary.byType[fix.type] = 0;
      }
      summary.byType[fix.type]++;
    });
    
    return summary;
  }

  // Report Generation
  generateReport(projectPath, options = {}) {
    const validation = this.validateProject(projectPath);
    const report = {
      project: {
        name: path.basename(projectPath),
        path: projectPath,
        type: validation.project.type,
        score: validation.score
      },
      analysis: {
        files: validation.project.files.total,
        directories: validation.project.structure.directories.length,
        size: this.formatBytes(validation.project.files.totalSize)
      },
      issues: validation.issues,
      recommendations: validation.recommendations,
      generated: new Date().toISOString()
    };
    
    if (options.output) {
      this.saveReport(report, options.output);
    }
    
    return report;
  }

  saveReport(report, outputPath) {
    const reportContent = JSON.stringify(report, null, 2);
    fs.writeFileSync(outputPath, reportContent);
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const manager = new ConsistencyManager();

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
🔧 ManagerAgentAI Consistency Manager

Usage:
  node consistency-manager.js <command> [options]

Commands:
  validate <path>              Validate project consistency
  fix <path> [options]         Fix consistency issues
  report <path> [options]      Generate consistency report
  check <path>                 Quick consistency check

Options:
  --auto-fix                  Automatically fix issues
  --create-missing            Create missing files
  --format-code               Format code with Prettier/ESLint
  --output <file>             Output report to file

Examples:
  node consistency-manager.js validate ./my-project
  node consistency-manager.js fix ./my-project --auto-fix --create-missing
  node consistency-manager.js report ./my-project --output report.json
`);
    process.exit(0);
  }

  const command = args[0];
  const projectPath = args[1];
  const options = {};

  // Parse options
  args.slice(2).forEach(arg => {
    switch (arg) {
      case '--auto-fix':
        options.autoFix = true;
        break;
      case '--create-missing':
        options.createMissing = true;
        break;
      case '--format-code':
        options.formatCode = true;
        break;
      case '--output':
        const outputIndex = args.indexOf('--output');
        if (outputIndex + 1 < args.length) {
          options.output = args[outputIndex + 1];
        }
        break;
    }
  });

  if (!projectPath) {
    console.error('❌ Project path is required');
    process.exit(1);
  }

  if (!fs.existsSync(projectPath)) {
    console.error(`❌ Project path '${projectPath}' does not exist`);
    process.exit(1);
  }

  try {
    switch (command) {
      case 'validate':
        const validation = manager.validateProject(projectPath);
        console.log(`\n📊 Consistency Validation Report\n`);
        console.log(`Project: ${path.basename(projectPath)}`);
        console.log(`Type: ${validation.project.type}`);
        console.log(`Score: ${validation.score}/100`);
        console.log(`Issues: ${validation.issues.length}\n`);
        
        if (validation.issues.length > 0) {
          console.log('Issues found:');
          validation.issues.forEach(issue => {
            console.log(`  ${issue.severity.toUpperCase()}: ${issue.message}`);
            if (issue.suggestion) {
              console.log(`    → ${issue.suggestion}`);
            }
          });
        } else {
          console.log('✅ No issues found!');
        }
        break;

      case 'fix':
        const fixResult = manager.fixProject(projectPath, options);
        console.log(`\n🔧 Consistency Fix Report\n`);
        console.log(`Project: ${path.basename(projectPath)}`);
        console.log(`Score: ${fixResult.validation.score}/100`);
        console.log(`Fixes applied: ${fixResult.fixes.length}\n`);
        
        if (fixResult.fixes.length > 0) {
          console.log('Fixes applied:');
          fixResult.fixes.forEach(fix => {
            console.log(`  ✅ ${fix.message}`);
          });
        } else {
          console.log('No fixes applied');
        }
        break;

      case 'report':
        const report = manager.generateReport(projectPath, options);
        console.log(`\n📋 Consistency Report Generated\n`);
        console.log(`Project: ${report.project.name}`);
        console.log(`Score: ${report.project.score}/100`);
        console.log(`Files: ${report.analysis.files}`);
        console.log(`Size: ${report.analysis.size}\n`);
        
        if (options.output) {
          console.log(`Report saved to: ${options.output}`);
        }
        break;

      case 'check':
        const checkResult = manager.validateProject(projectPath);
        const status = checkResult.score >= 80 ? '✅' : checkResult.score >= 60 ? '⚠️' : '❌';
        console.log(`${status} Consistency Score: ${checkResult.score}/100 (${checkResult.issues.length} issues)`);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Use --help for available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = ConsistencyManager;
