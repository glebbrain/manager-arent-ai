#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class AIPlanner {
  constructor() {
    this.tasksPath = path.join(__dirname, '..', 'tasks');
    this.plansPath = path.join(__dirname, '..', 'plans');
    this.ensureDirectories();
    this.priorities = this.loadPriorities();
    this.dependencies = this.loadDependencies();
  }

  ensureDirectories() {
    const dirs = [this.tasksPath, this.plansPath];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadPriorities() {
    return {
      critical: { weight: 10, color: 'red', description: 'Critical - Must be done immediately' },
      high: { weight: 8, color: 'orange', description: 'High - Should be done soon' },
      medium: { weight: 5, color: 'yellow', description: 'Medium - Important but not urgent' },
      low: { weight: 2, color: 'green', description: 'Low - Nice to have' },
      optional: { weight: 1, color: 'gray', description: 'Optional - Can be done later' }
    };
  }

  loadDependencies() {
    return {
      'setup-environment': ['install-dependencies', 'configure-tools'],
      'run-tests': ['setup-environment', 'write-tests'],
      'deploy': ['run-tests', 'build-application'],
      'documentation': ['implement-features', 'write-tests'],
      'code-review': ['implement-features', 'write-tests'],
      'performance-optimization': ['implement-features', 'run-tests'],
      'security-audit': ['implement-features', 'run-tests'],
      'user-testing': ['implement-features', 'deploy'],
      'monitoring-setup': ['deploy', 'performance-optimization'],
      'backup-strategy': ['deploy', 'monitoring-setup']
    };
  }

  // Task Management
  createTask(taskData) {
    const task = {
      id: this.generateId(),
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      category: taskData.category || 'general',
      estimatedHours: taskData.estimatedHours || 1,
      complexity: taskData.complexity || 'medium',
      dependencies: taskData.dependencies || [],
      tags: taskData.tags || [],
      assignee: taskData.assignee || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: taskData.dueDate || null,
      actualHours: 0,
      progress: 0,
      notes: []
    };

    this.saveTask(task);
    return task;
  }

  updateTask(taskId, updates) {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveTask(updatedTask);
    return updatedTask;
  }

  getTask(taskId) {
    const taskFile = path.join(this.tasksPath, `${taskId}.json`);
    if (fs.existsSync(taskFile)) {
      return JSON.parse(fs.readFileSync(taskFile, 'utf8'));
    }
    return null;
  }

  getAllTasks() {
    const tasks = [];
    const files = fs.readdirSync(this.tasksPath);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const task = JSON.parse(fs.readFileSync(path.join(this.tasksPath, file), 'utf8'));
        tasks.push(task);
      }
    });

    return tasks;
  }

  saveTask(task) {
    const taskFile = path.join(this.tasksPath, `${task.id}.json`);
    fs.writeFileSync(taskFile, JSON.stringify(task, null, 2));
  }

  deleteTask(taskId) {
    const taskFile = path.join(this.tasksPath, `${taskId}.json`);
    if (fs.existsSync(taskFile)) {
      fs.unlinkSync(taskFile);
      return true;
    }
    return false;
  }

  // AI Planning Methods
  generatePlan(projectData, options = {}) {
    const plan = {
      id: this.generateId(),
      projectName: projectData.name,
      projectType: projectData.type,
      description: projectData.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      phases: [],
      timeline: {
        startDate: new Date().toISOString(),
        endDate: null,
        totalDuration: 0
      },
      resources: {
        team: projectData.team || [],
        budget: projectData.budget || 0,
        tools: projectData.tools || []
      },
      risks: [],
      assumptions: []
    };

    // Generate phases based on project type
    plan.phases = this.generatePhases(projectData, options);
    
    // Calculate timeline
    plan.timeline = this.calculateTimeline(plan.phases);
    
    // Identify risks
    plan.risks = this.identifyRisks(projectData, plan);
    
    // Generate assumptions
    plan.assumptions = this.generateAssumptions(projectData, plan);

    this.savePlan(plan);
    return plan;
  }

  generatePhases(projectData, options) {
    const phases = [];
    const projectType = projectData.type || 'web';
    
    // Common phases for all project types
    const commonPhases = [
      {
        name: 'Planning & Setup',
        description: 'Project planning, environment setup, and initial configuration',
        tasks: [
          'project-analysis',
          'requirements-gathering',
          'architecture-design',
          'environment-setup',
          'tool-configuration'
        ],
        duration: 3,
        priority: 'high'
      },
      {
        name: 'Development',
        description: 'Core development and implementation',
        tasks: [
          'core-implementation',
          'feature-development',
          'integration',
          'testing'
        ],
        duration: 14,
        priority: 'high'
      },
      {
        name: 'Testing & Quality',
        description: 'Comprehensive testing and quality assurance',
        tasks: [
          'unit-testing',
          'integration-testing',
          'user-testing',
          'performance-testing',
          'security-testing'
        ],
        duration: 7,
        priority: 'high'
      },
      {
        name: 'Deployment & Launch',
        description: 'Deployment, launch, and initial monitoring',
        tasks: [
          'deployment-preparation',
          'production-deployment',
          'monitoring-setup',
          'launch-verification'
        ],
        duration: 3,
        priority: 'critical'
      }
    ];

    // Add type-specific phases
    const typeSpecificPhases = this.getTypeSpecificPhases(projectType);
    
    phases.push(...commonPhases);
    phases.push(...typeSpecificPhases);

    // Add optional phases based on options
    if (options.includeDocumentation) {
      phases.push({
        name: 'Documentation',
        description: 'Create comprehensive documentation',
        tasks: ['api-documentation', 'user-guide', 'technical-docs'],
        duration: 2,
        priority: 'medium'
      });
    }

    if (options.includeMaintenance) {
      phases.push({
        name: 'Maintenance & Support',
        description: 'Ongoing maintenance and support',
        tasks: ['bug-fixes', 'feature-updates', 'performance-optimization'],
        duration: 30,
        priority: 'low'
      });
    }

    return phases;
  }

  getTypeSpecificPhases(projectType) {
    const typePhases = {
      'web': [
        {
          name: 'Frontend Development',
          description: 'User interface and user experience development',
          tasks: ['ui-design', 'frontend-implementation', 'responsive-design'],
          duration: 10,
          priority: 'high'
        },
        {
          name: 'Backend Development',
          description: 'Server-side logic and API development',
          tasks: ['api-development', 'database-design', 'authentication'],
          duration: 8,
          priority: 'high'
        }
      ],
      'mobile': [
        {
          name: 'Mobile Development',
          description: 'Native or cross-platform mobile app development',
          tasks: ['mobile-ui', 'platform-integration', 'device-testing'],
          duration: 12,
          priority: 'high'
        },
        {
          name: 'App Store Preparation',
          description: 'Prepare app for app store submission',
          tasks: ['app-store-optimization', 'screenshots', 'metadata'],
          duration: 2,
          priority: 'medium'
        }
      ],
      'ai-ml': [
        {
          name: 'Data Preparation',
          description: 'Data collection, cleaning, and preprocessing',
          tasks: ['data-collection', 'data-cleaning', 'feature-engineering'],
          duration: 7,
          priority: 'high'
        },
        {
          name: 'Model Development',
          description: 'Machine learning model development and training',
          tasks: ['model-design', 'training', 'validation', 'optimization'],
          duration: 10,
          priority: 'high'
        },
        {
          name: 'Model Deployment',
          description: 'Deploy model to production environment',
          tasks: ['model-serving', 'api-integration', 'monitoring'],
          duration: 5,
          priority: 'high'
        }
      ],
      'api': [
        {
          name: 'API Development',
          description: 'RESTful API development and documentation',
          tasks: ['endpoint-development', 'authentication', 'rate-limiting'],
          duration: 8,
          priority: 'high'
        },
        {
          name: 'API Testing',
          description: 'Comprehensive API testing and validation',
          tasks: ['unit-tests', 'integration-tests', 'load-tests'],
          duration: 4,
          priority: 'high'
        }
      ],
      'library': [
        {
          name: 'Core Development',
          description: 'Core library functionality development',
          tasks: ['core-implementation', 'api-design', 'type-definitions'],
          duration: 6,
          priority: 'high'
        },
        {
          name: 'Package Preparation',
          description: 'Prepare package for distribution',
          tasks: ['build-configuration', 'documentation', 'examples'],
          duration: 3,
          priority: 'medium'
        }
      ]
    };

    return typePhases[projectType] || [];
  }

  calculateTimeline(phases) {
    const startDate = new Date();
    let currentDate = new Date(startDate);
    const timeline = {
      startDate: startDate.toISOString(),
      endDate: null,
      totalDuration: 0,
      phases: []
    };

    phases.forEach(phase => {
      const phaseStart = new Date(currentDate);
      const phaseEnd = new Date(currentDate);
      phaseEnd.setDate(phaseEnd.getDate() + phase.duration);
      
      timeline.phases.push({
        name: phase.name,
        startDate: phaseStart.toISOString(),
        endDate: phaseEnd.toISOString(),
        duration: phase.duration
      });

      currentDate = new Date(phaseEnd);
      timeline.totalDuration += phase.duration;
    });

    timeline.endDate = currentDate.toISOString();
    return timeline;
  }

  identifyRisks(projectData, plan) {
    const risks = [];
    
    // Technical risks
    if (projectData.complexity === 'high') {
      risks.push({
        type: 'technical',
        severity: 'high',
        description: 'High complexity may lead to technical challenges',
        mitigation: 'Break down complex tasks into smaller, manageable pieces',
        probability: 0.7
      });
    }

    // Resource risks
    if (plan.resources.team.length < 2) {
      risks.push({
        type: 'resource',
        severity: 'medium',
        description: 'Limited team size may impact delivery timeline',
        mitigation: 'Consider additional resources or adjust timeline',
        probability: 0.6
      });
    }

    // Timeline risks
    if (plan.timeline.totalDuration > 30) {
      risks.push({
        type: 'timeline',
        severity: 'medium',
        description: 'Long project duration increases risk of scope creep',
        mitigation: 'Implement regular milestone reviews and scope control',
        probability: 0.5
      });
    }

    // Dependencies risks
    const externalDependencies = this.identifyExternalDependencies(projectData);
    if (externalDependencies.length > 0) {
      risks.push({
        type: 'dependency',
        severity: 'medium',
        description: 'External dependencies may cause delays',
        mitigation: 'Identify backup solutions and maintain communication',
        probability: 0.4
      });
    }

    return risks;
  }

  generateAssumptions(projectData, plan) {
    const assumptions = [
      'Team members have the necessary skills and availability',
      'Required tools and technologies are available',
      'Stakeholder requirements are stable and well-defined',
      'External dependencies will be available as expected',
      'No major changes in project scope during development'
    ];

    // Add project-specific assumptions
    if (projectData.type === 'ai-ml') {
      assumptions.push('Data quality is sufficient for model training');
      assumptions.push('Computational resources are available for training');
    }

    if (projectData.type === 'mobile') {
      assumptions.push('Target devices and platforms are clearly defined');
      assumptions.push('App store approval process will be smooth');
    }

    return assumptions;
  }

  identifyExternalDependencies(projectData) {
    const dependencies = [];
    
    // Technology dependencies
    if (projectData.technologies) {
      projectData.technologies.forEach(tech => {
        if (tech.type === 'external') {
          dependencies.push(tech.name);
        }
      });
    }

    // Third-party services
    if (projectData.services) {
      dependencies.push(...projectData.services);
    }

    return dependencies;
  }

  // Task Prioritization
  prioritizeTasks(tasks, criteria = {}) {
    const prioritizedTasks = tasks.map(task => {
      const score = this.calculateTaskScore(task, criteria);
      return {
        ...task,
        priorityScore: score,
        calculatedPriority: this.getPriorityFromScore(score)
      };
    });

    return prioritizedTasks.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  calculateTaskScore(task, criteria) {
    let score = 0;
    
    // Priority weight
    const priorityWeight = this.priorities[task.priority]?.weight || 5;
    score += priorityWeight * 10;

    // Due date urgency
    if (task.dueDate) {
      const daysUntilDue = this.getDaysUntilDue(task.dueDate);
      if (daysUntilDue < 0) {
        score += 50; // Overdue tasks get high priority
      } else if (daysUntilDue < 3) {
        score += 30; // Due soon
      } else if (daysUntilDue < 7) {
        score += 15; // Due this week
      }
    }

    // Complexity factor
    const complexityWeights = { low: 1, medium: 2, high: 3 };
    score += complexityWeights[task.complexity] || 2;

    // Dependencies factor
    if (task.dependencies && task.dependencies.length > 0) {
      const completedDependencies = this.getCompletedDependencies(task.dependencies);
      const dependencyRatio = completedDependencies / task.dependencies.length;
      score += dependencyRatio * 20; // Higher score for tasks with completed dependencies
    }

    // Progress factor
    if (task.progress > 0) {
      score += task.progress * 5; // Slight boost for tasks in progress
    }

    // Custom criteria
    if (criteria.category && task.category === criteria.category) {
      score += 10;
    }

    if (criteria.assignee && task.assignee === criteria.assignee) {
      score += 5;
    }

    return Math.round(score);
  }

  getPriorityFromScore(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'optional';
  }

  getDaysUntilDue(dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getCompletedDependencies(dependencyIds) {
    let completed = 0;
    dependencyIds.forEach(id => {
      const task = this.getTask(id);
      if (task && task.status === 'completed') {
        completed++;
      }
    });
    return completed;
  }

  // Plan Management
  savePlan(plan) {
    const planFile = path.join(this.plansPath, `${plan.id}.json`);
    fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));
  }

  getPlan(planId) {
    const planFile = path.join(this.plansPath, `${planId}.json`);
    if (fs.existsSync(planFile)) {
      return JSON.parse(fs.readFileSync(planFile, 'utf8'));
    }
    return null;
  }

  getAllPlans() {
    const plans = [];
    const files = fs.readdirSync(this.plansPath);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const plan = JSON.parse(fs.readFileSync(path.join(this.plansPath, file), 'utf8'));
        plans.push(plan);
      }
    });

    return plans;
  }

  updatePlan(planId, updates) {
    const plan = this.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const updatedPlan = {
      ...plan,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.savePlan(updatedPlan);
    return updatedPlan;
  }

  // Smart Recommendations
  generateRecommendations(projectData, currentTasks = []) {
    const recommendations = [];

    // Analyze project type and suggest tasks
    const suggestedTasks = this.suggestTasksForProjectType(projectData.type);
    recommendations.push({
      type: 'tasks',
      priority: 'high',
      title: 'Suggested Tasks for Project Type',
      description: `Based on ${projectData.type} project, consider these tasks:`,
      items: suggestedTasks
    });

    // Analyze current tasks and suggest improvements
    const taskRecommendations = this.analyzeCurrentTasks(currentTasks);
    if (taskRecommendations.length > 0) {
      recommendations.push({
        type: 'improvements',
        priority: 'medium',
        title: 'Task Improvements',
        description: 'Suggestions to improve your current tasks:',
        items: taskRecommendations
      });
    }

    // Suggest timeline optimizations
    const timelineRecommendations = this.suggestTimelineOptimizations(projectData, currentTasks);
    if (timelineRecommendations.length > 0) {
      recommendations.push({
        type: 'timeline',
        priority: 'medium',
        title: 'Timeline Optimizations',
        description: 'Ways to optimize your project timeline:',
        items: timelineRecommendations
      });
    }

    return recommendations;
  }

  suggestTasksForProjectType(projectType) {
    const taskSuggestions = {
      'web': [
        'Set up development environment',
        'Create responsive design system',
        'Implement user authentication',
        'Set up API endpoints',
        'Configure database',
        'Implement testing framework',
        'Set up CI/CD pipeline',
        'Configure monitoring and logging'
      ],
      'mobile': [
        'Set up mobile development environment',
        'Design mobile UI/UX',
        'Implement navigation structure',
        'Add offline functionality',
        'Implement push notifications',
        'Set up app analytics',
        'Prepare for app store submission',
        'Implement security measures'
      ],
      'ai-ml': [
        'Collect and prepare data',
        'Set up ML development environment',
        'Choose and implement algorithms',
        'Train and validate models',
        'Implement model serving',
        'Set up monitoring for model performance',
        'Create data pipelines',
        'Implement A/B testing framework'
      ],
      'api': [
        'Design API architecture',
        'Implement authentication and authorization',
        'Add rate limiting and throttling',
        'Implement API documentation',
        'Set up API testing',
        'Configure API monitoring',
        'Implement API versioning',
        'Set up API security measures'
      ]
    };

    return taskSuggestions[projectType] || [];
  }

  analyzeCurrentTasks(tasks) {
    const recommendations = [];

    // Check for overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      return this.getDaysUntilDue(task.dueDate) < 0;
    });

    if (overdueTasks.length > 0) {
      recommendations.push(`You have ${overdueTasks.length} overdue tasks. Consider reprioritizing or adjusting deadlines.`);
    }

    // Check for tasks without dependencies
    const tasksWithoutDeps = tasks.filter(task => !task.dependencies || task.dependencies.length === 0);
    if (tasksWithoutDeps.length > 0) {
      recommendations.push(`Consider adding dependencies to ${tasksWithoutDeps.length} tasks to better organize your workflow.`);
    }

    // Check for high complexity tasks
    const highComplexityTasks = tasks.filter(task => task.complexity === 'high');
    if (highComplexityTasks.length > 0) {
      recommendations.push(`You have ${highComplexityTasks.length} high complexity tasks. Consider breaking them down into smaller tasks.`);
    }

    return recommendations;
  }

  suggestTimelineOptimizations(projectData, tasks) {
    const recommendations = [];

    // Check for parallel execution opportunities
    const parallelTasks = this.findParallelExecutionOpportunities(tasks);
    if (parallelTasks.length > 0) {
      recommendations.push(`Consider running these tasks in parallel: ${parallelTasks.join(', ')}`);
    }

    // Check for critical path optimization
    const criticalPath = this.findCriticalPath(tasks);
    if (criticalPath.length > 0) {
      recommendations.push(`Focus on critical path tasks: ${criticalPath.join(', ')}`);
    }

    return recommendations;
  }

  findParallelExecutionOpportunities(tasks) {
    // This is a simplified implementation
    // In a real system, this would use graph algorithms to find independent tasks
    const independentTasks = tasks.filter(task => 
      !task.dependencies || task.dependencies.length === 0
    );
    
    return independentTasks.slice(0, 3).map(task => task.title);
  }

  findCriticalPath(tasks) {
    // This is a simplified implementation
    // In a real system, this would use critical path method (CPM)
    const highPriorityTasks = tasks
      .filter(task => task.priority === 'critical' || task.priority === 'high')
      .sort((a, b) => this.priorities[b.priority].weight - this.priorities[a.priority].weight);
    
    return highPriorityTasks.slice(0, 3).map(task => task.title);
  }

  // Utility Methods
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Export/Import
  exportPlan(planId, format = 'json') {
    const plan = this.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    if (format === 'json') {
      return JSON.stringify(plan, null, 2);
    } else if (format === 'markdown') {
      return this.planToMarkdown(plan);
    } else if (format === 'csv') {
      return this.planToCSV(plan);
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  planToMarkdown(plan) {
    let markdown = `# ${plan.projectName}\n\n`;
    markdown += `**Project Type:** ${plan.projectType}\n`;
    markdown += `**Status:** ${plan.status}\n`;
    markdown += `**Duration:** ${plan.timeline.totalDuration} days\n\n`;
    
    markdown += `## Timeline\n\n`;
    markdown += `- **Start Date:** ${new Date(plan.timeline.startDate).toLocaleDateString()}\n`;
    markdown += `- **End Date:** ${new Date(plan.timeline.endDate).toLocaleDateString()}\n\n`;
    
    markdown += `## Phases\n\n`;
    plan.phases.forEach((phase, index) => {
      markdown += `### ${index + 1}. ${phase.name}\n`;
      markdown += `${phase.description}\n\n`;
      markdown += `**Duration:** ${phase.duration} days\n`;
      markdown += `**Priority:** ${phase.priority}\n\n`;
      
      if (phase.tasks && phase.tasks.length > 0) {
        markdown += `**Tasks:**\n`;
        phase.tasks.forEach(task => {
          markdown += `- ${task}\n`;
        });
        markdown += `\n`;
      }
    });

    if (plan.risks && plan.risks.length > 0) {
      markdown += `## Risks\n\n`;
      plan.risks.forEach(risk => {
        markdown += `### ${risk.description}\n`;
        markdown += `**Severity:** ${risk.severity}\n`;
        markdown += `**Probability:** ${Math.round(risk.probability * 100)}%\n`;
        markdown += `**Mitigation:** ${risk.mitigation}\n\n`;
      });
    }

    return markdown;
  }

  planToCSV(plan) {
    let csv = 'Phase,Description,Duration,Priority\n';
    plan.phases.forEach(phase => {
      csv += `"${phase.name}","${phase.description}",${phase.duration},"${phase.priority}"\n`;
    });
    return csv;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const planner = new AIPlanner();

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
🤖 ManagerAgentAI AI Planner

Usage:
  node ai-planner.js <command> [options]

Commands:
  create-task <data>           Create a new task
  create-plan <data>           Create a new project plan
  prioritize <criteria>        Prioritize tasks based on criteria
  recommend <project>          Generate recommendations for project
  export <plan-id> [format]    Export plan in specified format
  list [type]                  List tasks or plans
  update <id> <updates>        Update task or plan

Examples:
  node ai-planner.js create-task '{"title":"Setup environment","priority":"high"}'
  node ai-planner.js create-plan '{"name":"My Project","type":"web"}'
  node ai-planner.js prioritize '{"category":"development"}'
  node ai-planner.js recommend '{"type":"web","complexity":"medium"}'
  node ai-planner.js export plan123 markdown
  node ai-planner.js list tasks
`);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'create-task':
        if (args.length < 2) {
          console.error('❌ Task data is required');
          process.exit(1);
        }
        const taskData = JSON.parse(args[1]);
        const task = planner.createTask(taskData);
        console.log(`✅ Task created: ${task.id}`);
        console.log(JSON.stringify(task, null, 2));
        break;

      case 'create-plan':
        if (args.length < 2) {
          console.error('❌ Project data is required');
          process.exit(1);
        }
        const projectData = JSON.parse(args[1]);
        const plan = planner.generatePlan(projectData);
        console.log(`✅ Plan created: ${plan.id}`);
        console.log(JSON.stringify(plan, null, 2));
        break;

      case 'prioritize':
        const criteria = args.length > 1 ? JSON.parse(args[1]) : {};
        const tasks = planner.getAllTasks();
        const prioritizedTasks = planner.prioritizeTasks(tasks, criteria);
        console.log('📋 Prioritized Tasks:');
        prioritizedTasks.forEach((task, index) => {
          console.log(`${index + 1}. ${task.title} (Score: ${task.priorityScore})`);
        });
        break;

      case 'recommend':
        if (args.length < 2) {
          console.error('❌ Project data is required');
          process.exit(1);
        }
        const projectDataForRec = JSON.parse(args[1]);
        const currentTasks = planner.getAllTasks();
        const recommendations = planner.generateRecommendations(projectDataForRec, currentTasks);
        console.log('💡 Recommendations:');
        recommendations.forEach(rec => {
          console.log(`\n${rec.title}:`);
          rec.items.forEach(item => {
            console.log(`  - ${item}`);
          });
        });
        break;

      case 'export':
        if (args.length < 2) {
          console.error('❌ Plan ID is required');
          process.exit(1);
        }
        const planId = args[1];
        const format = args[2] || 'json';
        const exported = planner.exportPlan(planId, format);
        console.log(exported);
        break;

      case 'list':
        const type = args[1] || 'tasks';
        if (type === 'tasks') {
          const tasks = planner.getAllTasks();
          console.log('📋 Tasks:');
          tasks.forEach(task => {
            console.log(`${task.id}: ${task.title} (${task.priority})`);
          });
        } else if (type === 'plans') {
          const plans = planner.getAllPlans();
          console.log('📋 Plans:');
          plans.forEach(plan => {
            console.log(`${plan.id}: ${plan.projectName} (${plan.status})`);
          });
        }
        break;

      case 'update':
        if (args.length < 3) {
          console.error('❌ ID and updates are required');
          process.exit(1);
        }
        const id = args[1];
        const updates = JSON.parse(args[2]);
        const updated = planner.updateTask(id, updates) || planner.updatePlan(id, updates);
        if (updated) {
          console.log(`✅ Updated: ${id}`);
        } else {
          console.log(`❌ Not found: ${id}`);
        }
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

module.exports = AIPlanner;
