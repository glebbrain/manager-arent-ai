#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TemplateGenerator {
  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates');
    this.templatesConfig = this.loadTemplatesConfig();
  }

  loadTemplatesConfig() {
    const configPath = path.join(this.templatesPath, 'templates.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  listTemplates() {
    console.log('\n📋 Available Templates:\n');
    this.templatesConfig.templates.available.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name}`);
      console.log(`   Description: ${template.description}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Tags: ${template.tags.join(', ')}`);
      console.log(`   Complexity: ${template.complexity}`);
      console.log(`   Popularity: ${template.popularity}%\n`);
    });
  }

  getTemplateById(templateId) {
    return this.templatesConfig.templates.available.find(t => t.id === templateId);
  }

  loadTemplateConfig(templateId) {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template with id '${templateId}' not found`);
    }

    const templatePath = path.join(this.templatesPath, template.path);
    return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  }

  createProject(projectName, templateId, options = {}) {
    try {
      console.log(`\n🚀 Creating project '${projectName}' with template '${templateId}'...\n`);

      const template = this.getTemplateById(templateId);
      const templateConfig = this.loadTemplateConfig(templateId);

      // Create project directory
      const projectPath = path.join(process.cwd(), projectName);
      if (fs.existsSync(projectPath)) {
        throw new Error(`Directory '${projectName}' already exists`);
      }

      fs.mkdirSync(projectPath, { recursive: true });

      // Create directory structure
      this.createDirectoryStructure(projectPath, templateConfig.structure.directories);

      // Create files
      this.createFiles(projectPath, templateConfig, projectName);

      // Install dependencies
      if (options.installDependencies !== false) {
        this.installDependencies(projectPath, templateConfig);
      }

      // Initialize git repository
      if (options.initGit !== false) {
        this.initializeGit(projectPath);
      }

      console.log(`\n✅ Project '${projectName}' created successfully!`);
      console.log(`📁 Location: ${projectPath}`);
      console.log(`\n📝 Next steps:`);
      console.log(`   cd ${projectName}`);
      if (templateConfig.scripts.dev) {
        console.log(`   npm run dev`);
      }
      console.log(`\n🎉 Happy coding!`);

    } catch (error) {
      console.error(`\n❌ Error creating project: ${error.message}`);
      process.exit(1);
    }
  }

  createDirectoryStructure(projectPath, directories) {
    directories.forEach(dir => {
      const dirPath = path.join(projectPath, dir);
      fs.mkdirSync(dirPath, { recursive: true });
    });
  }

  createFiles(projectPath, templateConfig, projectName) {
    const files = templateConfig.structure.files;
    
    files.forEach(file => {
      const filePath = path.join(projectPath, file);
      const fileDir = path.dirname(filePath);
      
      // Ensure directory exists
      fs.mkdirSync(fileDir, { recursive: true });

      // Create file with appropriate content
      this.createFileContent(filePath, file, templateConfig, projectName);
    });
  }

  createFileContent(filePath, fileName, templateConfig, projectName) {
    const ext = path.extname(fileName);
    let content = '';

    switch (ext) {
      case '.json':
        content = this.generateJsonFile(fileName, templateConfig, projectName);
        break;
      case '.ts':
      case '.tsx':
        content = this.generateTypeScriptFile(fileName, templateConfig, projectName);
        break;
      case '.js':
        content = this.generateJavaScriptFile(fileName, templateConfig, projectName);
        break;
      case '.css':
        content = this.generateCssFile(fileName, templateConfig, projectName);
        break;
      case '.html':
        content = this.generateHtmlFile(fileName, templateConfig, projectName);
        break;
      case '.md':
        content = this.generateMarkdownFile(fileName, templateConfig, projectName);
        break;
      case '.py':
        content = this.generatePythonFile(fileName, templateConfig, projectName);
        break;
      case '.sol':
        content = this.generateSolidityFile(fileName, templateConfig, projectName);
        break;
      case '.cs':
        content = this.generateCSharpFile(fileName, templateConfig, projectName);
        break;
      default:
        content = this.generateDefaultFile(fileName, templateConfig, projectName);
    }

    fs.writeFileSync(filePath, content);
  }

  generateJsonFile(fileName, templateConfig, projectName) {
    if (fileName === 'package.json') {
      return JSON.stringify({
        name: projectName.toLowerCase().replace(/\s+/g, '-'),
        version: "1.0.0",
        description: `${projectName} - Generated from ${templateConfig.template.name}`,
        main: templateConfig.structure.files.find(f => f.includes('index')) || "index.js",
        scripts: templateConfig.scripts || {},
        dependencies: this.formatDependencies(templateConfig.dependencies.production || []),
        devDependencies: this.formatDependencies(templateConfig.dependencies.development || []),
        keywords: templateConfig.template.tags || [],
        author: "Generated by ManagerAgentAI",
        license: "MIT"
      }, null, 2);
    }
    return '{}';
  }

  generateTypeScriptFile(fileName, templateConfig, projectName) {
    const baseName = path.basename(fileName, '.tsx');
    const baseNameWithoutExt = path.basename(fileName, '.ts');
    
    if (fileName.includes('index')) {
      return `// ${projectName} - Main entry point
export * from './${baseNameWithoutExt}';
`;
    }
    
    if (fileName.includes('App')) {
      return `import React from 'react';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to ${projectName}</h1>
        <p>Generated from ${templateConfig.template.name}</p>
      </header>
    </div>
  );
};

export default App;
`;
    }
    
    return `// ${fileName} - Generated file
export const ${baseNameWithoutExt} = () => {
  // Implementation here
};
`;
  }

  generateJavaScriptFile(fileName, templateConfig, projectName) {
    return `// ${fileName} - Generated file
// ${projectName} - Generated from ${templateConfig.template.name}

module.exports = {
  // Implementation here
};
`;
  }

  generateCssFile(fileName, templateConfig, projectName) {
    if (fileName.includes('global')) {
      return `/* Global styles for ${projectName} */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
}

.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
}
`;
    }
    return `/* ${fileName} - Generated styles */`;
  }

  generateHtmlFile(fileName, templateConfig, projectName) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="root"></div>
  <script src="./index.js"></script>
</body>
</html>
`;
  }

  generateMarkdownFile(fileName, templateConfig, projectName) {
    if (fileName === 'README.md') {
      return `# ${projectName}

${templateConfig.template.description}

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
${templateConfig.structure.directories.map(dir => `- \`${dir}\``).join('\n')}

## Technologies Used
${templateConfig.template.tags.map(tag => `- ${tag}`).join('\n')}

## License
MIT

---
Generated by ManagerAgentAI Template System
`;
    }
    return `# ${fileName}\n\nGenerated content for ${projectName}`;
  }

  generatePythonFile(fileName, templateConfig, projectName) {
    return `# ${fileName} - Generated Python file
# ${projectName} - Generated from ${templateConfig.template.name}

def main():
    """Main function for ${projectName}"""
    print("Hello from ${projectName}!")

if __name__ == "__main__":
    main()
`;
  }

  generateSolidityFile(fileName, templateConfig, projectName) {
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ${fileName} - Generated Solidity file
// ${projectName} - Generated from ${templateConfig.template.name}

contract ${projectName.replace(/\s+/g, '')} {
    // Contract implementation here
}
`;
  }

  generateCSharpFile(fileName, templateConfig, projectName) {
    return `// ${fileName} - Generated C# file
// ${projectName} - Generated from ${templateConfig.template.name}

using UnityEngine;

public class ${path.basename(fileName, '.cs')} : MonoBehaviour
{
    // Implementation here
}
`;
  }

  generateDefaultFile(fileName, templateConfig, projectName) {
    return `# ${fileName}
# Generated file for ${projectName}
# Template: ${templateConfig.template.name}

# Implementation here
`;
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

  installDependencies(projectPath, templateConfig) {
    console.log('📦 Installing dependencies...');
    try {
      process.chdir(projectPath);
      execSync('npm install', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Failed to install dependencies automatically. Please run "npm install" manually.');
    }
  }

  initializeGit(projectPath) {
    console.log('🔧 Initializing Git repository...');
    try {
      process.chdir(projectPath);
      execSync('git init', { stdio: 'inherit' });
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "Initial commit"', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Failed to initialize Git repository. Please run "git init" manually.');
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const generator = new TemplateGenerator();

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
🚀 ManagerAgentAI Template Generator

Usage:
  node template-generator.js list                    # List available templates
  node template-generator.js create <name> <template> [options]  # Create new project

Options:
  --no-install     Skip dependency installation
  --no-git         Skip Git repository initialization

Examples:
  node template-generator.js list
  node template-generator.js create my-app web
  node template-generator.js create my-mobile-app mobile --no-install
`);
    process.exit(0);
  }

  if (args[0] === 'list') {
    generator.listTemplates();
  } else if (args[0] === 'create' && args.length >= 3) {
    const projectName = args[1];
    const templateId = args[2];
    const options = {
      installDependencies: !args.includes('--no-install'),
      initGit: !args.includes('--no-git')
    };
    
    generator.createProject(projectName, templateId, options);
  } else {
    console.error('❌ Invalid command. Use --help for usage information.');
    process.exit(1);
  }
}

module.exports = TemplateGenerator;
