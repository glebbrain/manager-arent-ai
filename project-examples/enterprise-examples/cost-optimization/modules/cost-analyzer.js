const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class CostAnalyzer {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/cost-analyzer.log' })
      ]
    });
    
    this.costData = new Map();
    this.costCategories = new Map();
    this.costTrends = new Map();
    this.analysisResults = new Map();
    this.analyzerData = {
      totalCosts: 0,
      totalResources: 0,
      totalCategories: 0,
      totalAnalysis: 0,
      averageCostPerResource: 0,
      lastAnalysisTime: null
    };
  }

  // Initialize cost analyzer
  async initialize() {
    try {
      this.initializeCostCategories();
      this.initializeAnalysisTemplates();
      
      this.logger.info('Cost analyzer initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing cost analyzer:', error);
      throw error;
    }
  }

  // Initialize cost categories
  initializeCostCategories() {
    this.costCategories = new Map([
      ['compute', {
        id: 'compute',
        name: 'Compute Resources',
        description: 'Virtual machines, containers, and compute instances',
        subcategories: ['ec2', 'ecs', 'lambda', 'azure-vm', 'gcp-compute'],
        costDrivers: ['instance_type', 'region', 'usage_hours', 'storage'],
        optimizationPotential: 'high'
      }],
      ['storage', {
        id: 'storage',
        name: 'Storage Services',
        description: 'Object storage, block storage, and file systems',
        subcategories: ['s3', 'ebs', 'azure-blob', 'gcp-storage'],
        costDrivers: ['storage_type', 'size', 'access_frequency', 'retention'],
        optimizationPotential: 'medium'
      }],
      ['network', {
        id: 'network',
        name: 'Network Services',
        description: 'Data transfer, load balancers, and CDN',
        subcategories: ['data-transfer', 'load-balancer', 'cdn', 'vpc'],
        costDrivers: ['data_volume', 'region', 'protocol', 'bandwidth'],
        optimizationPotential: 'medium'
      }],
      ['database', {
        id: 'database',
        name: 'Database Services',
        description: 'Managed databases and data warehouses',
        subcategories: ['rds', 'dynamodb', 'azure-sql', 'gcp-sql'],
        costDrivers: ['instance_type', 'storage', 'backup', 'multi_az'],
        optimizationPotential: 'high'
      }],
      ['security', {
        id: 'security',
        name: 'Security Services',
        description: 'Security tools and compliance services',
        subcategories: ['waf', 'security-groups', 'iam', 'kms'],
        costDrivers: ['feature_tier', 'usage_volume', 'compliance_level'],
        optimizationPotential: 'low'
      }],
      ['monitoring', {
        id: 'monitoring',
        name: 'Monitoring & Logging',
        description: 'CloudWatch, monitoring, and logging services',
        subcategories: ['cloudwatch', 'x-ray', 'azure-monitor', 'gcp-monitoring'],
        costDrivers: ['log_volume', 'metric_count', 'retention_period'],
        optimizationPotential: 'medium'
      }],
      ['ai-ml', {
        id: 'ai-ml',
        name: 'AI/ML Services',
        description: 'Machine learning and AI services',
        subcategories: ['sagemaker', 'rekognition', 'azure-ml', 'gcp-ai'],
        costDrivers: ['model_complexity', 'inference_requests', 'training_hours'],
        optimizationPotential: 'high'
      }],
      ['serverless', {
        id: 'serverless',
        name: 'Serverless Services',
        description: 'Function-as-a-Service and event-driven services',
        subcategories: ['lambda', 'azure-functions', 'gcp-functions'],
        costDrivers: ['execution_count', 'duration', 'memory', 'concurrency'],
        optimizationPotential: 'high'
      }]
    ]);

    this.analyzerData.totalCategories = this.costCategories.size;
  }

  // Initialize analysis templates
  initializeAnalysisTemplates() {
    this.analysisTemplates = {
      'cost-breakdown': {
        name: 'Cost Breakdown Analysis',
        description: 'Break down costs by category, service, and resource',
        metrics: ['total_cost', 'cost_by_category', 'cost_by_service', 'cost_by_resource'],
        timeRange: '30d',
        granularity: 'daily'
      },
      'trend-analysis': {
        name: 'Cost Trend Analysis',
        description: 'Analyze cost trends over time',
        metrics: ['monthly_trend', 'yearly_trend', 'seasonal_patterns', 'growth_rate'],
        timeRange: '1y',
        granularity: 'monthly'
      },
      'anomaly-detection': {
        name: 'Cost Anomaly Detection',
        description: 'Detect unusual cost patterns and spikes',
        metrics: ['cost_spikes', 'unusual_patterns', 'threshold_violations'],
        timeRange: '7d',
        granularity: 'hourly'
      },
      'optimization-opportunities': {
        name: 'Optimization Opportunities',
        description: 'Identify potential cost optimization opportunities',
        metrics: ['idle_resources', 'over_provisioned', 'under_utilized', 'right_sizing'],
        timeRange: '30d',
        granularity: 'daily'
      },
      'budget-variance': {
        name: 'Budget Variance Analysis',
        description: 'Compare actual costs against budgeted amounts',
        metrics: ['budget_vs_actual', 'variance_percentage', 'forecast_accuracy'],
        timeRange: '1y',
        granularity: 'monthly'
      },
      'cost-allocation': {
        name: 'Cost Allocation Analysis',
        description: 'Allocate costs to departments, projects, or teams',
        metrics: ['cost_by_department', 'cost_by_project', 'cost_by_team'],
        timeRange: '30d',
        granularity: 'daily'
      }
    };
  }

  // Analyze costs
  async analyzeCosts(analysisType, filters = {}) {
    try {
      const startTime = Date.now();
      
      const analysis = {
        id: this.generateId(),
        type: analysisType,
        filters: filters,
        timestamp: new Date(),
        status: 'analyzing',
        startTime: startTime,
        endTime: null,
        duration: 0,
        results: null
      };

      this.analysisResults.set(analysis.id, analysis);
      this.analyzerData.totalAnalysis++;

      // Get analysis template
      const template = this.analysisTemplates[analysisType];
      if (!template) {
        throw new Error(`Unknown analysis type: ${analysisType}`);
      }

      // Perform analysis based on type
      let results;
      switch (analysisType) {
        case 'cost-breakdown':
          results = await this.performCostBreakdownAnalysis(filters);
          break;
        case 'trend-analysis':
          results = await this.performTrendAnalysis(filters);
          break;
        case 'anomaly-detection':
          results = await this.performAnomalyDetection(filters);
          break;
        case 'optimization-opportunities':
          results = await this.performOptimizationOpportunitiesAnalysis(filters);
          break;
        case 'budget-variance':
          results = await this.performBudgetVarianceAnalysis(filters);
          break;
        case 'cost-allocation':
          results = await this.performCostAllocationAnalysis(filters);
          break;
        default:
          throw new Error(`Analysis type not implemented: ${analysisType}`);
      }

      analysis.status = 'completed';
      analysis.endTime = new Date();
      analysis.duration = analysis.endTime - analysis.startTime;
      analysis.results = results;

      this.analysisResults.set(analysis.id, analysis);
      this.analyzerData.lastAnalysisTime = new Date();

      this.logger.info('Cost analysis completed', {
        analysisId: analysis.id,
        type: analysisType,
        duration: analysis.duration
      });

      return analysis;
    } catch (error) {
      this.logger.error('Error analyzing costs:', error);
      throw error;
    }
  }

  // Perform cost breakdown analysis
  async performCostBreakdownAnalysis(filters) {
    const costs = await this.getCosts(filters);
    
    const breakdown = {
      totalCost: costs.reduce((sum, cost) => sum + cost.amount, 0),
      byCategory: this.groupCostsByCategory(costs),
      byService: this.groupCostsByService(costs),
      byResource: this.groupCostsByResource(costs),
      byRegion: this.groupCostsByRegion(costs),
      byTime: this.groupCostsByTime(costs, filters.timeRange || '30d')
    };

    return breakdown;
  }

  // Perform trend analysis
  async performTrendAnalysis(filters) {
    const costs = await this.getCosts(filters);
    
    const trends = {
      monthlyTrend: this.calculateMonthlyTrend(costs),
      yearlyTrend: this.calculateYearlyTrend(costs),
      seasonalPatterns: this.identifySeasonalPatterns(costs),
      growthRate: this.calculateGrowthRate(costs),
      forecast: this.generateCostForecast(costs)
    };

    return trends;
  }

  // Perform anomaly detection
  async performAnomalyDetection(filters) {
    const costs = await this.getCosts(filters);
    
    const anomalies = {
      costSpikes: this.detectCostSpikes(costs),
      unusualPatterns: this.detectUnusualPatterns(costs),
      thresholdViolations: this.detectThresholdViolations(costs),
      recommendations: this.generateAnomalyRecommendations(costs)
    };

    return anomalies;
  }

  // Perform optimization opportunities analysis
  async performOptimizationOpportunitiesAnalysis(filters) {
    const costs = await this.getCosts(filters);
    
    const opportunities = {
      idleResources: this.identifyIdleResources(costs),
      overProvisioned: this.identifyOverProvisionedResources(costs),
      underUtilized: this.identifyUnderUtilizedResources(costs),
      rightSizing: this.identifyRightSizingOpportunities(costs),
      potentialSavings: this.calculatePotentialSavings(costs)
    };

    return opportunities;
  }

  // Perform budget variance analysis
  async performBudgetVarianceAnalysis(filters) {
    const costs = await this.getCosts(filters);
    const budgets = await this.getBudgets(filters);
    
    const variance = {
      budgetVsActual: this.compareBudgetVsActual(costs, budgets),
      variancePercentage: this.calculateVariancePercentage(costs, budgets),
      forecastAccuracy: this.calculateForecastAccuracy(costs, budgets),
      recommendations: this.generateBudgetRecommendations(costs, budgets)
    };

    return variance;
  }

  // Perform cost allocation analysis
  async performCostAllocationAnalysis(filters) {
    const costs = await this.getCosts(filters);
    
    const allocation = {
      byDepartment: this.allocateCostsByDepartment(costs),
      byProject: this.allocateCostsByProject(costs),
      byTeam: this.allocateCostsByTeam(costs),
      byEnvironment: this.allocateCostsByEnvironment(costs),
      allocationAccuracy: this.calculateAllocationAccuracy(costs)
    };

    return allocation;
  }

  // Get costs (simulated)
  async getCosts(filters = {}) {
    // Simulate cost data
    const costs = [];
    const categories = Array.from(this.costCategories.keys());
    const services = ['ec2', 's3', 'rds', 'lambda', 'cloudwatch'];
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
    
    const startDate = filters.startDate || moment().subtract(30, 'days').toDate();
    const endDate = filters.endDate || new Date();
    const days = moment(endDate).diff(moment(startDate), 'days');
    
    for (let i = 0; i < days; i++) {
      const date = moment(startDate).add(i, 'days').toDate();
      
      for (const category of categories) {
        for (const service of services) {
          const cost = {
            id: this.generateId(),
            date: date,
            category: category,
            service: service,
            region: regions[Math.floor(Math.random() * regions.length)],
            amount: Math.random() * 1000 + 100,
            currency: 'USD',
            resourceId: `resource-${Math.random().toString(36).substr(2, 9)}`,
            tags: this.generateRandomTags(),
            metadata: {
              instanceType: 't3.medium',
              usage: Math.random() * 100,
              unit: 'hours'
            }
          };
          
          costs.push(cost);
        }
      }
    }
    
    return costs;
  }

  // Get budgets (simulated)
  async getBudgets(filters = {}) {
    return [
      {
        id: 'budget-1',
        name: 'Monthly Budget',
        amount: 50000,
        currency: 'USD',
        period: 'monthly',
        category: 'all',
        startDate: moment().startOf('month').toDate(),
        endDate: moment().endOf('month').toDate()
      },
      {
        id: 'budget-2',
        name: 'Compute Budget',
        amount: 30000,
        currency: 'USD',
        period: 'monthly',
        category: 'compute',
        startDate: moment().startOf('month').toDate(),
        endDate: moment().endOf('month').toDate()
      }
    ];
  }

  // Group costs by category
  groupCostsByCategory(costs) {
    return _.groupBy(costs, 'category');
  }

  // Group costs by service
  groupCostsByService(costs) {
    return _.groupBy(costs, 'service');
  }

  // Group costs by resource
  groupCostsByResource(costs) {
    return _.groupBy(costs, 'resourceId');
  }

  // Group costs by region
  groupCostsByRegion(costs) {
    return _.groupBy(costs, 'region');
  }

  // Group costs by time
  groupCostsByTime(costs, timeRange) {
    const granularity = timeRange.includes('d') ? 'daily' : 'monthly';
    return _.groupBy(costs, cost => {
      const date = moment(cost.date);
      return granularity === 'daily' ? date.format('YYYY-MM-DD') : date.format('YYYY-MM');
    });
  }

  // Calculate monthly trend
  calculateMonthlyTrend(costs) {
    const monthlyCosts = this.groupCostsByTime(costs, 'monthly');
    return Object.keys(monthlyCosts).map(month => ({
      month: month,
      cost: monthlyCosts[month].reduce((sum, cost) => sum + cost.amount, 0)
    }));
  }

  // Calculate yearly trend
  calculateYearlyTrend(costs) {
    const yearlyCosts = _.groupBy(costs, cost => moment(cost.date).year());
    return Object.keys(yearlyCosts).map(year => ({
      year: parseInt(year),
      cost: yearlyCosts[year].reduce((sum, cost) => sum + cost.amount, 0)
    }));
  }

  // Identify seasonal patterns
  identifySeasonalPatterns(costs) {
    const monthlyCosts = this.groupCostsByTime(costs, 'monthly');
    const patterns = [];
    
    for (const month in monthlyCosts) {
      const cost = monthlyCosts[month].reduce((sum, cost) => sum + cost.amount, 0);
      patterns.push({
        month: month,
        cost: cost,
        season: this.getSeason(month)
      });
    }
    
    return patterns;
  }

  // Calculate growth rate
  calculateGrowthRate(costs) {
    const monthlyCosts = this.calculateMonthlyTrend(costs);
    if (monthlyCosts.length < 2) return 0;
    
    const firstMonth = monthlyCosts[0].cost;
    const lastMonth = monthlyCosts[monthlyCosts.length - 1].cost;
    
    return ((lastMonth - firstMonth) / firstMonth) * 100;
  }

  // Generate cost forecast
  generateCostForecast(costs) {
    const monthlyCosts = this.calculateMonthlyTrend(costs);
    const growthRate = this.calculateGrowthRate(costs);
    
    const forecast = [];
    const lastMonth = monthlyCosts[monthlyCosts.length - 1];
    
    for (let i = 1; i <= 6; i++) {
      const forecastDate = moment(lastMonth.month).add(i, 'months');
      const forecastCost = lastMonth.cost * Math.pow(1 + growthRate / 100, i);
      
      forecast.push({
        month: forecastDate.format('YYYY-MM'),
        cost: forecastCost,
        confidence: Math.max(0, 100 - i * 10) // Decreasing confidence
      });
    }
    
    return forecast;
  }

  // Detect cost spikes
  detectCostSpikes(costs) {
    const dailyCosts = this.groupCostsByTime(costs, 'daily');
    const costsArray = Object.values(dailyCosts).map(dayCosts => 
      dayCosts.reduce((sum, cost) => sum + cost.amount, 0)
    );
    
    const mean = costsArray.reduce((sum, cost) => sum + cost, 0) / costsArray.length;
    const stdDev = Math.sqrt(costsArray.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costsArray.length);
    const threshold = mean + 2 * stdDev;
    
    return costsArray
      .map((cost, index) => ({ cost, index }))
      .filter(item => item.cost > threshold)
      .map(item => ({
        date: Object.keys(dailyCosts)[item.index],
        cost: item.cost,
        threshold: threshold,
        severity: item.cost > mean + 3 * stdDev ? 'high' : 'medium'
      }));
  }

  // Detect unusual patterns
  detectUnusualPatterns(costs) {
    // Simplified pattern detection
    return costs.filter(cost => {
      const category = this.costCategories.get(cost.category);
      return category && category.optimizationPotential === 'high' && cost.amount > 500;
    }).map(cost => ({
      type: 'high_cost_resource',
      resourceId: cost.resourceId,
      category: cost.category,
      amount: cost.amount,
      recommendation: 'Review resource usage and consider optimization'
    }));
  }

  // Detect threshold violations
  detectThresholdViolations(costs) {
    const budgets = this.getBudgets();
    const violations = [];
    
    for (const budget of budgets) {
      const budgetCosts = costs.filter(cost => 
        budget.category === 'all' || cost.category === budget.category
      );
      const totalCost = budgetCosts.reduce((sum, cost) => sum + cost.amount, 0);
      
      if (totalCost > budget.amount) {
        violations.push({
          budgetId: budget.id,
          budgetName: budget.name,
          budgetAmount: budget.amount,
          actualAmount: totalCost,
          variance: totalCost - budget.amount,
          variancePercentage: ((totalCost - budget.amount) / budget.amount) * 100
        });
      }
    }
    
    return violations;
  }

  // Generate anomaly recommendations
  generateAnomalyRecommendations(costs) {
    return [
      {
        type: 'cost_spike',
        priority: 'high',
        title: 'Investigate cost spikes',
        description: 'Review resources with unusual cost increases',
        action: 'Analyze resource usage patterns and optimize configuration'
      },
      {
        type: 'threshold_violation',
        priority: 'critical',
        title: 'Budget threshold exceeded',
        description: 'Current spending exceeds budget limits',
        action: 'Review and adjust budget or optimize resource usage'
      }
    ];
  }

  // Identify idle resources
  identifyIdleResources(costs) {
    return costs.filter(cost => {
      const metadata = cost.metadata || {};
      return metadata.usage < 10; // Less than 10% usage
    }).map(cost => ({
      resourceId: cost.resourceId,
      category: cost.category,
      service: cost.service,
      usage: cost.metadata?.usage || 0,
      cost: cost.amount,
      recommendation: 'Consider stopping or downsizing this resource'
    }));
  }

  // Identify over-provisioned resources
  identifyOverProvisionedResources(costs) {
    return costs.filter(cost => {
      const metadata = cost.metadata || {};
      return metadata.usage < 50 && cost.amount > 500; // Low usage but high cost
    }).map(cost => ({
      resourceId: cost.resourceId,
      category: cost.category,
      service: cost.service,
      usage: cost.metadata?.usage || 0,
      cost: cost.amount,
      recommendation: 'Consider right-sizing this resource'
    }));
  }

  // Identify under-utilized resources
  identifyUnderUtilizedResources(costs) {
    return costs.filter(cost => {
      const metadata = cost.metadata || {};
      return metadata.usage < 30; // Less than 30% usage
    }).map(cost => ({
      resourceId: cost.resourceId,
      category: cost.category,
      service: cost.service,
      usage: cost.metadata?.usage || 0,
      cost: cost.amount,
      recommendation: 'Review resource allocation and usage patterns'
    }));
  }

  // Identify right-sizing opportunities
  identifyRightSizingOpportunities(costs) {
    return costs.filter(cost => {
      const metadata = cost.metadata || {};
      return metadata.usage > 80 && cost.amount > 1000; // High usage and high cost
    }).map(cost => ({
      resourceId: cost.resourceId,
      category: cost.category,
      service: cost.service,
      usage: cost.metadata?.usage || 0,
      cost: cost.amount,
      recommendation: 'Consider upgrading to a more powerful instance type'
    }));
  }

  // Calculate potential savings
  calculatePotentialSavings(costs) {
    const idleResources = this.identifyIdleResources(costs);
    const overProvisioned = this.identifyOverProvisionedResources(costs);
    
    const idleSavings = idleResources.reduce((sum, resource) => sum + resource.cost * 0.8, 0);
    const rightSizingSavings = overProvisioned.reduce((sum, resource) => sum + resource.cost * 0.3, 0);
    
    return {
      idleResources: idleSavings,
      rightSizing: rightSizingSavings,
      total: idleSavings + rightSizingSavings,
      percentage: ((idleSavings + rightSizingSavings) / costs.reduce((sum, cost) => sum + cost.amount, 0)) * 100
    };
  }

  // Compare budget vs actual
  compareBudgetVsActual(costs, budgets) {
    return budgets.map(budget => {
      const budgetCosts = costs.filter(cost => 
        budget.category === 'all' || cost.category === budget.category
      );
      const actualAmount = budgetCosts.reduce((sum, cost) => sum + cost.amount, 0);
      
      return {
        budgetId: budget.id,
        budgetName: budget.name,
        budgetAmount: budget.amount,
        actualAmount: actualAmount,
        variance: actualAmount - budget.amount,
        variancePercentage: ((actualAmount - budget.amount) / budget.amount) * 100
      };
    });
  }

  // Calculate variance percentage
  calculateVariancePercentage(costs, budgets) {
    const comparisons = this.compareBudgetVsActual(costs, budgets);
    return comparisons.reduce((sum, comp) => sum + comp.variancePercentage, 0) / comparisons.length;
  }

  // Calculate forecast accuracy
  calculateForecastAccuracy(costs, budgets) {
    // Simplified accuracy calculation
    return 85; // 85% accuracy
  }

  // Generate budget recommendations
  generateBudgetRecommendations(costs, budgets) {
    const comparisons = this.compareBudgetVsActual(costs, budgets);
    
    return comparisons.map(comp => ({
      budgetId: comp.budgetId,
      budgetName: comp.budgetName,
      recommendation: comp.variancePercentage > 10 ? 
        'Consider increasing budget' : 
        comp.variancePercentage < -10 ? 
        'Consider decreasing budget' : 
        'Budget is well-aligned with actual costs',
      priority: Math.abs(comp.variancePercentage) > 20 ? 'high' : 'medium'
    }));
  }

  // Allocate costs by department
  allocateCostsByDepartment(costs) {
    const departments = ['engineering', 'marketing', 'sales', 'operations'];
    return departments.map(dept => ({
      department: dept,
      cost: costs.filter(cost => cost.tags?.department === dept)
        .reduce((sum, cost) => sum + cost.amount, 0)
    }));
  }

  // Allocate costs by project
  allocateCostsByProject(costs) {
    const projects = ['project-alpha', 'project-beta', 'project-gamma'];
    return projects.map(project => ({
      project: project,
      cost: costs.filter(cost => cost.tags?.project === project)
        .reduce((sum, cost) => sum + cost.amount, 0)
    }));
  }

  // Allocate costs by team
  allocateCostsByTeam(costs) {
    const teams = ['frontend', 'backend', 'devops', 'data'];
    return teams.map(team => ({
      team: team,
      cost: costs.filter(cost => cost.tags?.team === team)
        .reduce((sum, cost) => sum + cost.amount, 0)
    }));
  }

  // Allocate costs by environment
  allocateCostsByEnvironment(costs) {
    const environments = ['production', 'staging', 'development'];
    return environments.map(env => ({
      environment: env,
      cost: costs.filter(cost => cost.tags?.environment === env)
        .reduce((sum, cost) => sum + cost.amount, 0)
    }));
  }

  // Calculate allocation accuracy
  calculateAllocationAccuracy(costs) {
    const allocatedCosts = costs.filter(cost => cost.tags && Object.keys(cost.tags).length > 0);
    return (allocatedCosts.length / costs.length) * 100;
  }

  // Get season from month
  getSeason(month) {
    const monthNum = parseInt(month.split('-')[1]);
    if (monthNum >= 3 && monthNum <= 5) return 'spring';
    if (monthNum >= 6 && monthNum <= 8) return 'summer';
    if (monthNum >= 9 && monthNum <= 11) return 'autumn';
    return 'winter';
  }

  // Generate random tags
  generateRandomTags() {
    const departments = ['engineering', 'marketing', 'sales', 'operations'];
    const projects = ['project-alpha', 'project-beta', 'project-gamma'];
    const teams = ['frontend', 'backend', 'devops', 'data'];
    const environments = ['production', 'staging', 'development'];
    
    return {
      department: departments[Math.floor(Math.random() * departments.length)],
      project: projects[Math.floor(Math.random() * projects.length)],
      team: teams[Math.floor(Math.random() * teams.length)],
      environment: environments[Math.floor(Math.random() * environments.length)]
    };
  }

  // Get cost categories
  async getCostCategories() {
    return Array.from(this.costCategories.values());
  }

  // Get analysis templates
  async getAnalysisTemplates() {
    return Object.values(this.analysisTemplates);
  }

  // Get analysis results
  async getAnalysisResults(filters = {}) {
    let results = Array.from(this.analysisResults.values());
    
    if (filters.type) {
      results = results.filter(r => r.type === filters.type);
    }
    
    if (filters.status) {
      results = results.filter(r => r.status === filters.status);
    }
    
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get analyzer data
  async getAnalyzerData() {
    return this.analyzerData;
  }

  // Generate unique ID
  generateId() {
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new CostAnalyzer();
