#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class WorkflowOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.workflows = new Map();
    this.activeWorkflows = new Map();
    this.workflowPath = path.join(__dirname, '..', 'workflows');
    this.ensureWorkflowDirectory();
  }

  ensureWorkflowDirectory() {
    if (!fs.existsSync(this.workflowPath)) {
      fs.mkdirSync(this.workflowPath, { recursive: true });
    }
  }

  // Workflow Definition Methods
  defineWorkflow(name, definition) {
    const workflow = {
      name,
      id: this.generateId(),
      definition,
      status: 'defined',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.workflows.set(name, workflow);
    this.saveWorkflow(workflow);
    
    this.emit('workflow:defined', workflow);
    return workflow;
  }

  loadWorkflow(name) {
    const workflowFile = path.join(this.workflowPath, `${name}.json`);
    if (fs.existsSync(workflowFile)) {
      const workflow = JSON.parse(fs.readFileSync(workflowFile, 'utf8'));
      this.workflows.set(name, workflow);
      return workflow;
    }
    return null;
  }

  saveWorkflow(workflow) {
    const workflowFile = path.join(this.workflowPath, `${workflow.name}.json`);
    fs.writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));
  }

  // Workflow Execution Methods
  async executeWorkflow(name, context = {}) {
    const workflow = this.workflows.get(name) || this.loadWorkflow(name);
    if (!workflow) {
      throw new Error(`Workflow '${name}' not found`);
    }

    const executionId = this.generateId();
    const execution = {
      id: executionId,
      workflowName: name,
      status: 'running',
      context: { ...context },
      steps: [],
      startTime: new Date().toISOString(),
      endTime: null,
      error: null
    };

    this.activeWorkflows.set(executionId, execution);
    this.emit('workflow:started', execution);

    try {
      await this.executeSteps(workflow.definition.steps, execution);
      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      this.emit('workflow:completed', execution);
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = new Date().toISOString();
      this.emit('workflow:failed', execution);
      throw error;
    } finally {
      this.activeWorkflows.delete(executionId);
    }

    return execution;
  }

  async executeSteps(steps, execution) {
    for (const step of steps) {
      const stepExecution = {
        id: this.generateId(),
        name: step.name,
        type: step.type,
        status: 'running',
        startTime: new Date().toISOString(),
        endTime: null,
        result: null,
        error: null
      };

      execution.steps.push(stepExecution);
      this.emit('step:started', stepExecution);

      try {
        stepExecution.result = await this.executeStep(step, execution.context);
        stepExecution.status = 'completed';
        stepExecution.endTime = new Date().toISOString();
        this.emit('step:completed', stepExecution);
      } catch (error) {
        stepExecution.status = 'failed';
        stepExecution.error = error.message;
        stepExecution.endTime = new Date().toISOString();
        this.emit('step:failed', stepExecution);
        
        if (step.onError === 'stop') {
          throw error;
        } else if (step.onError === 'continue') {
          continue;
        } else if (step.onError === 'retry') {
          // Implement retry logic
          const retryCount = stepExecution.retryCount || 0;
          if (retryCount < (step.maxRetries || 3)) {
            stepExecution.retryCount = retryCount + 1;
            stepExecution.status = 'retrying';
            this.emit('step:retrying', stepExecution);
            await this.delay(step.retryDelay || 1000);
            continue;
          } else {
            throw error;
          }
        }
      }
    }
  }

  async executeStep(step, context) {
    switch (step.type) {
      case 'command':
        return await this.executeCommand(step.command, context);
      case 'script':
        return await this.executeScript(step.script, context);
      case 'condition':
        return await this.evaluateCondition(step.condition, context);
      case 'parallel':
        return await this.executeParallel(step.steps, context);
      case 'sequential':
        return await this.executeSequential(step.steps, context);
      case 'wait':
        return await this.wait(step.duration, context);
      case 'http':
        return await this.executeHttpRequest(step.request, context);
      case 'file':
        return await this.executeFileOperation(step.operation, context);
      case 'database':
        return await this.executeDatabaseOperation(step.operation, context);
      case 'notification':
        return await this.sendNotification(step.notification, context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  // Step Execution Methods
  async executeCommand(command, context) {
    const { execSync } = require('child_process');
    const processedCommand = this.processTemplate(command, context);
    
    try {
      const result = execSync(processedCommand, { 
        encoding: 'utf8',
        cwd: context.workingDirectory || process.cwd()
      });
      return { success: true, output: result.trim() };
    } catch (error) {
      return { success: false, error: error.message, output: error.stdout };
    }
  }

  async executeScript(script, context) {
    const scriptPath = path.resolve(script);
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script not found: ${scriptPath}`);
    }

    const { spawn } = require('child_process');
    return new Promise((resolve, reject) => {
      const child = spawn('node', [scriptPath], {
        cwd: context.workingDirectory || process.cwd(),
        env: { ...process.env, ...context.env }
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output: output.trim() });
        } else {
          reject(new Error(`Script failed with code ${code}: ${error}`));
        }
      });
    });
  }

  async evaluateCondition(condition, context) {
    const processedCondition = this.processTemplate(condition, context);
    const result = eval(processedCondition);
    return { success: true, result };
  }

  async executeParallel(steps, context) {
    const promises = steps.map(step => this.executeStep(step, context));
    const results = await Promise.allSettled(promises);
    
    return {
      success: results.every(r => r.status === 'fulfilled'),
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    };
  }

  async executeSequential(steps, context) {
    const results = [];
    for (const step of steps) {
      const result = await this.executeStep(step, context);
      results.push(result);
    }
    return { success: true, results };
  }

  async wait(duration, context) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, message: `Waited ${duration}ms` });
      }, duration);
    });
  }

  async executeHttpRequest(request, context) {
    const axios = require('axios');
    const processedRequest = this.processTemplate(JSON.stringify(request), context);
    const requestConfig = JSON.parse(processedRequest);
    
    try {
      const response = await axios(requestConfig);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.message, status: error.response?.status };
    }
  }

  async executeFileOperation(operation, context) {
    const { operation: op, path: filePath, content, encoding = 'utf8' } = operation;
    const processedPath = this.processTemplate(filePath, context);
    const processedContent = content ? this.processTemplate(content, context) : null;

    switch (op) {
      case 'read':
        if (!fs.existsSync(processedPath)) {
          throw new Error(`File not found: ${processedPath}`);
        }
        return { success: true, content: fs.readFileSync(processedPath, encoding) };
      
      case 'write':
        fs.writeFileSync(processedPath, processedContent, encoding);
        return { success: true, message: `File written: ${processedPath}` };
      
      case 'append':
        fs.appendFileSync(processedPath, processedContent, encoding);
        return { success: true, message: `File appended: ${processedPath}` };
      
      case 'delete':
        if (fs.existsSync(processedPath)) {
          fs.unlinkSync(processedPath);
          return { success: true, message: `File deleted: ${processedPath}` };
        }
        return { success: true, message: `File not found: ${processedPath}` };
      
      case 'copy':
        const destPath = this.processTemplate(operation.destination, context);
        fs.copyFileSync(processedPath, destPath);
        return { success: true, message: `File copied: ${processedPath} -> ${destPath}` };
      
      case 'move':
        const moveDestPath = this.processTemplate(operation.destination, context);
        fs.renameSync(processedPath, moveDestPath);
        return { success: true, message: `File moved: ${processedPath} -> ${moveDestPath}` };
      
      default:
        throw new Error(`Unknown file operation: ${op}`);
    }
  }

  async executeDatabaseOperation(operation, context) {
    // This would integrate with actual database drivers
    // For now, return a mock response
    return { success: true, message: `Database operation: ${operation.type}` };
  }

  async sendNotification(notification, context) {
    const processedNotification = this.processTemplate(JSON.stringify(notification), context);
    const notificationData = JSON.parse(processedNotification);
    
    // This would integrate with actual notification services
    console.log(`📢 Notification: ${notificationData.message}`);
    return { success: true, message: 'Notification sent' };
  }

  // Utility Methods
  processTemplate(template, context) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] || match;
    });
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Workflow Management Methods
  listWorkflows() {
    return Array.from(this.workflows.values());
  }

  getWorkflow(name) {
    return this.workflows.get(name);
  }

  deleteWorkflow(name) {
    const workflow = this.workflows.get(name);
    if (workflow) {
      this.workflows.delete(name);
      const workflowFile = path.join(this.workflowPath, `${name}.json`);
      if (fs.existsSync(workflowFile)) {
        fs.unlinkSync(workflowFile);
      }
      this.emit('workflow:deleted', workflow);
      return true;
    }
    return false;
  }

  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }

  stopWorkflow(executionId) {
    const execution = this.activeWorkflows.get(executionId);
    if (execution) {
      execution.status = 'stopped';
      execution.endTime = new Date().toISOString();
      this.activeWorkflows.delete(executionId);
      this.emit('workflow:stopped', execution);
      return true;
    }
    return false;
  }

  // Predefined Workflows
  createPredefinedWorkflows() {
    // Project Creation Workflow
    this.defineWorkflow('create-project', {
      name: 'Create Project',
      description: 'Complete project creation workflow',
      steps: [
        {
          name: 'Create Directory',
          type: 'command',
          command: 'mkdir -p {{projectName}}',
          onError: 'stop'
        },
        {
          name: 'Initialize Git',
          type: 'command',
          command: 'cd {{projectName}} && git init',
          onError: 'continue'
        },
        {
          name: 'Create Package.json',
          type: 'file',
          operation: {
            operation: 'write',
            path: '{{projectName}}/package.json',
            content: JSON.stringify({
              name: '{{projectName}}',
              version: '1.0.0',
              description: '{{projectDescription}}',
              main: 'index.js',
              scripts: {
                start: 'node index.js',
                test: 'jest'
              }
            }, null, 2)
          }
        },
        {
          name: 'Install Dependencies',
          type: 'command',
          command: 'cd {{projectName}} && npm install',
          onError: 'continue'
        },
        {
          name: 'Create README',
          type: 'file',
          operation: {
            operation: 'write',
            path: '{{projectName}}/README.md',
            content: '# {{projectName}}\n\n{{projectDescription}}\n\n## Getting Started\n\n```bash\nnpm install\nnpm start\n```'
          }
        }
      ]
    });

    // Build and Deploy Workflow
    this.defineWorkflow('build-deploy', {
      name: 'Build and Deploy',
      description: 'Build and deploy application',
      steps: [
        {
          name: 'Install Dependencies',
          type: 'command',
          command: 'npm install',
          onError: 'stop'
        },
        {
          name: 'Run Tests',
          type: 'command',
          command: 'npm test',
          onError: 'stop'
        },
        {
          name: 'Build Application',
          type: 'command',
          command: 'npm run build',
          onError: 'stop'
        },
        {
          name: 'Deploy to Server',
          type: 'command',
          command: 'scp -r dist/* {{deployUser}}@{{deployHost}}:{{deployPath}}',
          onError: 'retry',
          maxRetries: 3,
          retryDelay: 5000
        },
        {
          name: 'Restart Service',
          type: 'command',
          command: 'ssh {{deployUser}}@{{deployHost}} "sudo systemctl restart {{serviceName}}"',
          onError: 'continue'
        }
      ]
    });

    // Code Quality Workflow
    this.defineWorkflow('code-quality', {
      name: 'Code Quality Check',
      description: 'Run code quality checks and fixes',
      steps: [
        {
          name: 'Lint Code',
          type: 'command',
          command: 'npm run lint',
          onError: 'continue'
        },
        {
          name: 'Format Code',
          type: 'command',
          command: 'npm run format',
          onError: 'continue'
        },
        {
          name: 'Type Check',
          type: 'command',
          command: 'npm run type-check',
          onError: 'continue'
        },
        {
          name: 'Security Audit',
          type: 'command',
          command: 'npm audit',
          onError: 'continue'
        },
        {
          name: 'Generate Report',
          type: 'file',
          operation: {
            operation: 'write',
            path: 'quality-report.md',
            content: '# Code Quality Report\n\nGenerated on {{date}}\n\n## Results\n\n- Linting: {{lintResult}}\n- Formatting: {{formatResult}}\n- Type Check: {{typeCheckResult}}\n- Security: {{securityResult}}'
          }
        }
      ]
    });
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const orchestrator = new WorkflowOrchestrator();

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
🔄 ManagerAgentAI Workflow Orchestrator

Usage:
  node workflow-orchestrator.js <command> [options]

Commands:
  define <name> <file>        Define workflow from JSON file
  execute <name> [context]    Execute workflow with optional context
  list                        List all workflows
  stop <execution-id>         Stop running workflow
  status                      Show active workflows
  init                        Initialize with predefined workflows

Examples:
  node workflow-orchestrator.js define my-workflow workflow.json
  node workflow-orchestrator.js execute create-project '{"projectName":"my-app"}'
  node workflow-orchestrator.js list
  node workflow-orchestrator.js init
`);
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'define':
      if (args.length < 3) {
        console.error('❌ Workflow name and file are required for define command');
        process.exit(1);
      }
      const workflowName = args[1];
      const workflowFile = args[2];
      const workflowDefinition = JSON.parse(fs.readFileSync(workflowFile, 'utf8'));
      orchestrator.defineWorkflow(workflowName, workflowDefinition);
      console.log(`✅ Workflow '${workflowName}' defined successfully`);
      break;

    case 'execute':
      if (args.length < 2) {
        console.error('❌ Workflow name is required for execute command');
        process.exit(1);
      }
      const execWorkflowName = args[1];
      const context = args[2] ? JSON.parse(args[2]) : {};
      orchestrator.executeWorkflow(execWorkflowName, context)
        .then(result => {
          console.log(`✅ Workflow '${execWorkflowName}' completed successfully`);
          console.log('Result:', JSON.stringify(result, null, 2));
        })
        .catch(error => {
          console.error(`❌ Workflow '${execWorkflowName}' failed:`, error.message);
          process.exit(1);
        });
      break;

    case 'list':
      const workflows = orchestrator.listWorkflows();
      console.log('\n📋 Available Workflows:\n');
      workflows.forEach(workflow => {
        console.log(`- ${workflow.name} (${workflow.status})`);
        console.log(`  ID: ${workflow.id}`);
        console.log(`  Created: ${workflow.createdAt}\n`);
      });
      break;

    case 'stop':
      if (args.length < 2) {
        console.error('❌ Execution ID is required for stop command');
        process.exit(1);
      }
      const executionId = args[1];
      if (orchestrator.stopWorkflow(executionId)) {
        console.log(`✅ Workflow execution '${executionId}' stopped`);
      } else {
        console.log(`❌ Workflow execution '${executionId}' not found`);
      }
      break;

    case 'status':
      const activeWorkflows = orchestrator.getActiveWorkflows();
      console.log('\n🔄 Active Workflows:\n');
      if (activeWorkflows.length === 0) {
        console.log('No active workflows');
      } else {
        activeWorkflows.forEach(workflow => {
          console.log(`- ${workflow.workflowName} (${workflow.status})`);
          console.log(`  ID: ${workflow.id}`);
          console.log(`  Started: ${workflow.startTime}\n`);
        });
      }
      break;

    case 'init':
      orchestrator.createPredefinedWorkflows();
      console.log('✅ Predefined workflows initialized');
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Use --help for available commands');
      process.exit(1);
  }
}

module.exports = WorkflowOrchestrator;
