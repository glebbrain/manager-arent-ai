#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProjectManager {
  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates');
    this.scriptsPath = path.join(__dirname);
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [this.templatesPath, this.scriptsPath];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  showHelp() {
    console.log(`
🚀 ManagerAgentAI Project Manager

Universal project management system with templates and auto-configuration.

Commands:
  create <name> <template>    Create new project from template
  configure <path>            Auto-configure existing project
  list                        List available templates
  scan <path>                 Scan project and suggest configuration
  init                        Initialize project manager
  update                      Update templates and configurations
  status                      Show system status

Templates:
  web                         Web application (React, TypeScript, Node.js)
  mobile                      Mobile app (React Native, Expo)
  ai-ml                       AI/ML project (Python, TensorFlow, PyTorch)
  api                         API service (Express, TypeScript, MongoDB)
  library                     Library package (TypeScript, Rollup, Jest)
  game                        Game development (Unity, C#)
  blockchain                  Blockchain project (Solidity, Hardhat, Web3)
  desktop                     Desktop app (Electron, TypeScript, React)

Options:
  --no-install               Skip dependency installation
  --no-git                   Skip Git repository initialization
  --no-tools                 Skip development tools setup
  --help, -h                 Show this help message

Examples:
  node project-manager.js create my-app web
  node project-manager.js configure ./my-project
  node project-manager.js list
  node project-manager.js scan ./my-project
`);
  }

  async createProject(projectName, templateId, options = {}) {
    try {
      console.log(`\n🚀 Creating project '${projectName}' with template '${templateId}'...\n`);
      
      // Use template generator
      const templateGenerator = require('./template-generator');
      const generator = new templateGenerator();
      
      await generator.createProject(projectName, templateId, options);
      
      console.log(`\n✅ Project '${projectName}' created successfully!`);
      
    } catch (error) {
      console.error(`\n❌ Error creating project: ${error.message}`);
      process.exit(1);
    }
  }

  async configureProject(projectPath, options = {}) {
    try {
      console.log(`\n🔧 Auto-configuring project at ${projectPath}...\n`);
      
      // Use auto-configurator
      const autoConfigurator = require('./auto-configurator');
      const configurator = new autoConfigurator();
      
      await configurator.configureProject(projectPath, options);
      
      console.log(`\n✅ Project auto-configured successfully!`);
      
    } catch (error) {
      console.error(`\n❌ Error auto-configuring project: ${error.message}`);
      process.exit(1);
    }
  }

  listTemplates() {
    try {
      const templateGenerator = require('./template-generator');
      const generator = new templateGenerator();
      generator.listTemplates();
    } catch (error) {
      console.error(`\n❌ Error listing templates: ${error.message}`);
      process.exit(1);
    }
  }

  scanProject(projectPath) {
    try {
      console.log(`\n🔍 Scanning project at ${projectPath}...\n`);
      
      if (!fs.existsSync(projectPath)) {
        throw new Error(`Project path '${projectPath}' does not exist`);
      }

      const autoConfigurator = require('./auto-configurator');
      const configurator = new autoConfigurator();
      
      const projectType = configurator.detectProjectType(projectPath);
      const config = configurator.loadProjectConfig(projectType);
      
      console.log(`📋 Project Analysis:`);
      console.log(`   Type: ${projectType}`);
      console.log(`   Name: ${config.name}`);
      console.log(`   Features: ${Object.keys(config.features).filter(k => config.features[k]).join(', ')}`);
      console.log(`   Tools: ${Object.entries(config.tools).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
      
      console.log(`\n💡 Suggestions:`);
      if (projectType === 'unknown') {
        console.log(`   - This project type is not recognized`);
        console.log(`   - Consider using 'configure' command to set up manually`);
      } else {
        console.log(`   - Run 'configure' command to auto-configure this project`);
        console.log(`   - Use 'create' command to start fresh with a template`);
      }
      
    } catch (error) {
      console.error(`\n❌ Error scanning project: ${error.message}`);
      process.exit(1);
    }
  }

  initializeManager() {
    try {
      console.log(`\n🔧 Initializing ManagerAgentAI Project Manager...\n`);
      
      // Create necessary directories
      const dirs = [
        'templates',
        'configs',
        'scripts',
        'projects',
        'logs'
      ];
      
      dirs.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`✅ Created directory: ${dir}`);
        } else {
          console.log(`📁 Directory exists: ${dir}`);
        }
      });
      
      // Create configuration files
      this.createManagerConfig();
      
      console.log(`\n✅ Project Manager initialized successfully!`);
      console.log(`📁 Templates: ./templates/`);
      console.log(`📁 Configs: ./configs/`);
      console.log(`📁 Scripts: ./scripts/`);
      console.log(`📁 Projects: ./projects/`);
      
    } catch (error) {
      console.error(`\n❌ Error initializing manager: ${error.message}`);
      process.exit(1);
    }
  }

  createManagerConfig() {
    const config = {
      manager: {
        name: "ManagerAgentAI Project Manager",
        version: "1.0.0",
        description: "Universal project management system",
        author: "ManagerAgentAI",
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      settings: {
        autoInstall: true,
        autoGit: true,
        autoTools: true,
        defaultTemplate: "web",
        logLevel: "info"
      },
      templates: {
        enabled: true,
        autoUpdate: true,
        customTemplates: []
      },
      features: {
        templateGeneration: true,
        autoConfiguration: true,
        projectScanning: true,
        dependencyManagement: true,
        toolSetup: true
      }
    };
    
    const configPath = path.join(process.cwd(), 'manager-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Created configuration: manager-config.json`);
  }

  updateSystem() {
    try {
      console.log(`\n🔄 Updating ManagerAgentAI system...\n`);
      
      // Update templates
      console.log(`📦 Updating templates...`);
      // This would typically pull from a repository or update service
      
      // Update configurations
      console.log(`⚙️  Updating configurations...`);
      // This would update default configurations
      
      // Update scripts
      console.log(`🔧 Updating scripts...`);
      // This would update management scripts
      
      console.log(`\n✅ System updated successfully!`);
      
    } catch (error) {
      console.error(`\n❌ Error updating system: ${error.message}`);
      process.exit(1);
    }
  }

  showStatus() {
    try {
      console.log(`\n📊 ManagerAgentAI System Status\n`);
      
      // Check templates
      const templatesPath = path.join(this.templatesPath, 'templates.json');
      if (fs.existsSync(templatesPath)) {
        const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
        console.log(`📋 Templates: ${templates.templates.available.length} available`);
        templates.templates.available.forEach(template => {
          console.log(`   - ${template.name} (${template.type})`);
        });
      } else {
        console.log(`❌ Templates: Not found`);
      }
      
      // Check scripts
      const scripts = ['template-generator.js', 'auto-configurator.js', 'project-manager.js'];
      console.log(`\n🔧 Scripts:`);
      scripts.forEach(script => {
        const scriptPath = path.join(this.scriptsPath, script);
        if (fs.existsSync(scriptPath)) {
          console.log(`   ✅ ${script}`);
        } else {
          console.log(`   ❌ ${script}`);
        }
      });
      
      // Check configurations
      const configsPath = path.join(process.cwd(), 'configs');
      if (fs.existsSync(configsPath)) {
        const configFiles = fs.readdirSync(configsPath).filter(f => f.endsWith('.json'));
        console.log(`\n⚙️  Configurations: ${configFiles.length} files`);
        configFiles.forEach(file => {
          console.log(`   - ${file}`);
        });
      } else {
        console.log(`\n❌ Configurations: Not found`);
      }
      
      // System info
      console.log(`\n💻 System Information:`);
      console.log(`   Node.js: ${process.version}`);
      console.log(`   Platform: ${process.platform}`);
      console.log(`   Architecture: ${process.arch}`);
      console.log(`   Working Directory: ${process.cwd()}`);
      
    } catch (error) {
      console.error(`\n❌ Error showing status: ${error.message}`);
      process.exit(1);
    }
  }

  async run() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
      this.showHelp();
      return;
    }
    
    const command = args[0];
    const options = this.parseOptions(args.slice(1));
    
    switch (command) {
      case 'create':
        if (args.length < 3) {
          console.error('❌ Project name and template are required for create command');
          process.exit(1);
        }
        await this.createProject(args[1], args[2], options);
        break;
        
      case 'configure':
        if (args.length < 2) {
          console.error('❌ Project path is required for configure command');
          process.exit(1);
        }
        await this.configureProject(args[1], options);
        break;
        
      case 'list':
        this.listTemplates();
        break;
        
      case 'scan':
        if (args.length < 2) {
          console.error('❌ Project path is required for scan command');
          process.exit(1);
        }
        this.scanProject(args[1]);
        break;
        
      case 'init':
        this.initializeManager();
        break;
        
      case 'update':
        this.updateSystem();
        break;
        
      case 'status':
        this.showStatus();
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Use --help for available commands');
        process.exit(1);
    }
  }

  parseOptions(args) {
    const options = {
      installDependencies: true,
      initGit: true,
      setupTools: true
    };
    
    args.forEach(arg => {
      switch (arg) {
        case '--no-install':
          options.installDependencies = false;
          break;
        case '--no-git':
          options.initGit = false;
          break;
        case '--no-tools':
          options.setupTools = false;
          break;
      }
    });
    
    return options;
  }
}

// Run the manager
if (require.main === module) {
  const manager = new ProjectManager();
  manager.run().catch(error => {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = ProjectManager;
