// Universal Automation Platform - Risk Prediction System
// Version: 2.2 - AI Enhanced

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class RiskPredictionSystem {
    constructor(options = {}) {
        this.options = {
            projectPath: options.projectPath || process.cwd(),
            outputDir: options.outputDir || 'risk-prediction',
            analysisPeriod: options.analysisPeriod || 30, // days
            riskFactors: options.riskFactors || {
                technical: true,
                schedule: true,
                resource: true,
                quality: true,
                security: true,
                dependency: true,
                team: true,
                external: true
            },
            thresholds: options.thresholds || {
                high: 80,
                medium: 60,
                low: 40
            },
            ...options
        };
        
        this.riskData = {};
        this.predictions = {};
        this.mitigationStrategies = {};
        this.riskHistory = [];
        
        this.init();
    }

    init() {
        console.log('⚠️ Initializing Risk Prediction System...');
        this.createOutputDirectory();
        this.loadRiskModels();
    }

    createOutputDirectory() {
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
            console.log(`✅ Created risk prediction directory: ${this.options.outputDir}`);
        }
    }

    loadRiskModels() {
        // Load predefined risk models and patterns
        this.riskModels = {
            technical: {
                name: 'Technical Risk',
                factors: ['complexity', 'dependencies', 'performance', 'maintainability'],
                weight: 0.25
            },
            schedule: {
                name: 'Schedule Risk',
                factors: ['deadlines', 'milestones', 'velocity', 'blockers'],
                weight: 0.20
            },
            resource: {
                name: 'Resource Risk',
                factors: ['team_size', 'availability', 'skills', 'budget'],
                weight: 0.15
            },
            quality: {
                name: 'Quality Risk',
                factors: ['test_coverage', 'bug_density', 'code_review', 'standards'],
                weight: 0.15
            },
            security: {
                name: 'Security Risk',
                factors: ['vulnerabilities', 'compliance', 'access_control', 'data_protection'],
                weight: 0.10
            },
            dependency: {
                name: 'Dependency Risk',
                factors: ['external_deps', 'version_conflicts', 'maintenance', 'support'],
                weight: 0.10
            },
            team: {
                name: 'Team Risk',
                factors: ['turnover', 'knowledge', 'collaboration', 'communication'],
                weight: 0.05
            }
        };
    }

    async analyzeProjectRisks() {
        console.log('⚠️ Analyzing project risks...');
        
        try {
            this.riskData = {
                timestamp: new Date().toISOString(),
                projectPath: this.options.projectPath,
                analysisPeriod: this.options.analysisPeriod,
                risks: {},
                overallRisk: 0,
                recommendations: []
            };

            // Analyze each risk category
            for (const [category, model] of Object.entries(this.riskModels)) {
                if (this.options.riskFactors[category]) {
                    console.log(`🔍 Analyzing ${model.name}...`);
                    this.riskData.risks[category] = await this.analyzeRiskCategory(category, model);
                }
            }

            // Calculate overall risk score
            this.riskData.overallRisk = this.calculateOverallRisk();

            // Generate predictions
            this.predictions = await this.generateRiskPredictions();

            // Generate mitigation strategies
            this.riskData.recommendations = this.generateMitigationStrategies();

            // Save results
            await this.saveRiskAnalysis();

            console.log('✅ Risk analysis completed');
            return this.riskData;

        } catch (error) {
            console.error('❌ Error analyzing project risks:', error);
            throw error;
        }
    }

    async analyzeRiskCategory(category, model) {
        const risk = {
            category,
            name: model.name,
            score: 0,
            level: 'low',
            factors: {},
            indicators: [],
            probability: 0,
            impact: 0
        };

        try {
            switch (category) {
                case 'technical':
                    risk.factors = await this.analyzeTechnicalRisks();
                    break;
                case 'schedule':
                    risk.factors = await this.analyzeScheduleRisks();
                    break;
                case 'resource':
                    risk.factors = await this.analyzeResourceRisks();
                    break;
                case 'quality':
                    risk.factors = await this.analyzeQualityRisks();
                    break;
                case 'security':
                    risk.factors = await this.analyzeSecurityRisks();
                    break;
                case 'dependency':
                    risk.factors = await this.analyzeDependencyRisks();
                    break;
                case 'team':
                    risk.factors = await this.analyzeTeamRisks();
                    break;
            }

            // Calculate risk score
            risk.score = this.calculateRiskScore(risk.factors, model);
            risk.level = this.categorizeRiskLevel(risk.score);
            risk.probability = this.calculateRiskProbability(risk.factors);
            risk.impact = this.calculateRiskImpact(risk.factors);
            risk.indicators = this.identifyRiskIndicators(risk.factors, category);

        } catch (error) {
            console.warn(`⚠️ Error analyzing ${category} risks:`, error.message);
            risk.score = 0;
            risk.level = 'unknown';
        }

        return risk;
    }

    async analyzeTechnicalRisks() {
        const factors = {
            complexity: 0,
            dependencies: 0,
            performance: 0,
            maintainability: 0
        };

        try {
            // Analyze code complexity
            const sourceFiles = await this.findSourceFiles();
            let totalComplexity = 0;
            let fileCount = 0;

            for (const file of sourceFiles) {
                const complexity = await this.calculateFileComplexity(file);
                totalComplexity += complexity;
                fileCount++;
            }

            factors.complexity = fileCount > 0 ? totalComplexity / fileCount : 0;

            // Analyze dependencies
            const dependencies = await this.analyzeDependencies();
            factors.dependencies = dependencies.outdated / Math.max(dependencies.total, 1) * 100;

            // Analyze performance (simplified)
            factors.performance = await this.analyzePerformanceIndicators();

            // Analyze maintainability
            factors.maintainability = await this.analyzeMaintainabilityIndicators();

        } catch (error) {
            console.warn('⚠️ Error analyzing technical risks:', error.message);
        }

        return factors;
    }

    async analyzeScheduleRisks() {
        const factors = {
            deadlines: 0,
            milestones: 0,
            velocity: 0,
            blockers: 0
        };

        try {
            // Analyze git commit patterns for velocity
            const { stdout: commitCount } = await execAsync(
                `git log --since="${this.options.analysisPeriod} days ago" --oneline | wc -l`
            );
            
            const dailyVelocity = parseInt(commitCount.trim()) / this.options.analysisPeriod;
            factors.velocity = Math.min(dailyVelocity * 10, 100); // Scale to 0-100

            // Analyze milestone completion (simplified)
            factors.milestones = await this.analyzeMilestoneCompletion();

            // Analyze potential blockers
            factors.blockers = await this.analyzeBlockers();

            // Analyze deadline pressure
            factors.deadlines = await this.analyzeDeadlinePressure();

        } catch (error) {
            console.warn('⚠️ Error analyzing schedule risks:', error.message);
        }

        return factors;
    }

    async analyzeResourceRisks() {
        const factors = {
            team_size: 0,
            availability: 0,
            skills: 0,
            budget: 0
        };

        try {
            // Analyze team size and availability
            const contributors = await this.getGitContributors();
            factors.team_size = contributors.length;

            // Analyze skill distribution
            factors.skills = await this.analyzeSkillDistribution();

            // Analyze availability (based on commit patterns)
            factors.availability = await this.analyzeTeamAvailability();

            // Budget analysis (placeholder)
            factors.budget = 50; // Default neutral score

        } catch (error) {
            console.warn('⚠️ Error analyzing resource risks:', error.message);
        }

        return factors;
    }

    async analyzeQualityRisks() {
        const factors = {
            test_coverage: 0,
            bug_density: 0,
            code_review: 0,
            standards: 0
        };

        try {
            // Analyze test coverage
            factors.test_coverage = await this.analyzeTestCoverage();

            // Analyze bug density (based on fix commits)
            const { stdout: fixCommits } = await execAsync(
                `git log --since="${this.options.analysisPeriod} days ago" --grep="fix" --oneline | wc -l`
            );
            const totalCommits = await this.getTotalCommits();
            factors.bug_density = totalCommits > 0 ? (parseInt(fixCommits.trim()) / totalCommits) * 100 : 0;

            // Analyze code review practices
            factors.code_review = await this.analyzeCodeReviewPractices();

            // Analyze coding standards
            factors.standards = await this.analyzeCodingStandards();

        } catch (error) {
            console.warn('⚠️ Error analyzing quality risks:', error.message);
        }

        return factors;
    }

    async analyzeSecurityRisks() {
        const factors = {
            vulnerabilities: 0,
            compliance: 0,
            access_control: 0,
            data_protection: 0
        };

        try {
            // Analyze security vulnerabilities
            factors.vulnerabilities = await this.analyzeSecurityVulnerabilities();

            // Analyze compliance (placeholder)
            factors.compliance = 50; // Default neutral score

            // Analyze access control patterns
            factors.access_control = await this.analyzeAccessControl();

            // Analyze data protection
            factors.data_protection = await this.analyzeDataProtection();

        } catch (error) {
            console.warn('⚠️ Error analyzing security risks:', error.message);
        }

        return factors;
    }

    async analyzeDependencyRisks() {
        const factors = {
            external_deps: 0,
            version_conflicts: 0,
            maintenance: 0,
            support: 0
        };

        try {
            // Analyze external dependencies
            const dependencies = await this.analyzeDependencies();
            factors.external_deps = dependencies.total;
            factors.version_conflicts = dependencies.conflicts;
            factors.maintenance = dependencies.maintenance;
            factors.support = dependencies.support;

        } catch (error) {
            console.warn('⚠️ Error analyzing dependency risks:', error.message);
        }

        return factors;
    }

    async analyzeTeamRisks() {
        const factors = {
            turnover: 0,
            knowledge: 0,
            collaboration: 0,
            communication: 0
        };

        try {
            // Analyze team turnover (based on git history)
            factors.turnover = await this.analyzeTeamTurnover();

            // Analyze knowledge distribution
            factors.knowledge = await this.analyzeKnowledgeDistribution();

            // Analyze collaboration patterns
            factors.collaboration = await this.analyzeCollaborationPatterns();

            // Analyze communication (placeholder)
            factors.communication = 50; // Default neutral score

        } catch (error) {
            console.warn('⚠️ Error analyzing team risks:', error.message);
        }

        return factors;
    }

    calculateRiskScore(factors, model) {
        let totalScore = 0;
        let totalWeight = 0;

        for (const factor of model.factors) {
            if (factors[factor] !== undefined) {
                totalScore += factors[factor];
                totalWeight += 1;
            }
        }

        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    categorizeRiskLevel(score) {
        if (score >= this.options.thresholds.high) return 'high';
        if (score >= this.options.thresholds.medium) return 'medium';
        if (score >= this.options.thresholds.low) return 'low';
        return 'very-low';
    }

    calculateRiskProbability(factors) {
        // Calculate probability based on historical patterns and current indicators
        const avgFactor = Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length;
        return Math.min(avgFactor, 100);
    }

    calculateRiskImpact(factors) {
        // Calculate impact based on critical factors
        const criticalFactors = ['complexity', 'dependencies', 'vulnerabilities', 'team_size'];
        let impact = 0;
        let count = 0;

        for (const factor of criticalFactors) {
            if (factors[factor] !== undefined) {
                impact += factors[factor];
                count++;
            }
        }

        return count > 0 ? impact / count : 0;
    }

    identifyRiskIndicators(factors, category) {
        const indicators = [];

        // Common risk indicators
        if (factors.complexity > 15) {
            indicators.push('High code complexity detected');
        }
        if (factors.dependencies > 50) {
            indicators.push('Many outdated dependencies');
        }
        if (factors.vulnerabilities > 5) {
            indicators.push('Security vulnerabilities present');
        }
        if (factors.test_coverage < 50) {
            indicators.push('Low test coverage');
        }
        if (factors.velocity < 1) {
            indicators.push('Low development velocity');
        }

        return indicators;
    }

    calculateOverallRisk() {
        let totalRisk = 0;
        let totalWeight = 0;

        for (const [category, risk] of Object.entries(this.riskData.risks)) {
            const model = this.riskModels[category];
            if (model) {
                totalRisk += risk.score * model.weight;
                totalWeight += model.weight;
            }
        }

        return totalWeight > 0 ? totalRisk / totalWeight : 0;
    }

    async generateRiskPredictions() {
        const predictions = {
            shortTerm: {}, // 1-2 weeks
            mediumTerm: {}, // 1-2 months
            longTerm: {} // 3+ months
        };

        // Generate predictions based on current risk data and trends
        for (const [category, risk] of Object.entries(this.riskData.risks)) {
            predictions.shortTerm[category] = this.predictRiskTrend(risk, 'short');
            predictions.mediumTerm[category] = this.predictRiskTrend(risk, 'medium');
            predictions.longTerm[category] = this.predictRiskTrend(risk, 'long');
        }

        return predictions;
    }

    predictRiskTrend(risk, timeframe) {
        // Simple trend prediction based on current risk level
        const baseScore = risk.score;
        let trend = 'stable';
        let predictedScore = baseScore;

        switch (timeframe) {
            case 'short':
                // Short-term predictions are more conservative
                predictedScore = baseScore * 1.1; // Slight increase
                trend = baseScore > 70 ? 'increasing' : 'stable';
                break;
            case 'medium':
                // Medium-term predictions consider more factors
                predictedScore = baseScore * 1.2; // Moderate increase
                trend = baseScore > 60 ? 'increasing' : 'stable';
                break;
            case 'long':
                // Long-term predictions are more variable
                predictedScore = baseScore * 1.3; // Higher increase
                trend = baseScore > 50 ? 'increasing' : 'stable';
                break;
        }

        return {
            score: Math.min(predictedScore, 100),
            trend,
            confidence: this.calculatePredictionConfidence(risk, timeframe)
        };
    }

    calculatePredictionConfidence(risk, timeframe) {
        // Calculate confidence based on data quality and historical patterns
        let confidence = 50; // Base confidence

        // More data points increase confidence
        if (risk.indicators.length > 3) confidence += 20;
        if (risk.indicators.length > 5) confidence += 10;

        // Shorter timeframes are more predictable
        if (timeframe === 'short') confidence += 20;
        if (timeframe === 'medium') confidence += 10;

        return Math.min(confidence, 95);
    }

    generateMitigationStrategies() {
        const strategies = [];

        for (const [category, risk] of Object.entries(this.riskData.risks)) {
            if (risk.level === 'high' || risk.level === 'medium') {
                strategies.push(...this.getMitigationStrategies(category, risk));
            }
        }

        return strategies;
    }

    getMitigationStrategies(category, risk) {
        const strategies = [];

        switch (category) {
            case 'technical':
                strategies.push('Refactor complex code modules');
                strategies.push('Update outdated dependencies');
                strategies.push('Implement performance monitoring');
                break;
            case 'schedule':
                strategies.push('Review and adjust project timeline');
                strategies.push('Identify and remove blockers');
                strategies.push('Increase team velocity through training');
                break;
            case 'resource':
                strategies.push('Hire additional team members if needed');
                strategies.push('Provide skill development training');
                strategies.push('Improve team collaboration tools');
                break;
            case 'quality':
                strategies.push('Increase test coverage');
                strategies.push('Implement code review process');
                strategies.push('Establish coding standards');
                break;
            case 'security':
                strategies.push('Address security vulnerabilities immediately');
                strategies.push('Implement security best practices');
                strategies.push('Conduct security audits');
                break;
            case 'dependency':
                strategies.push('Update dependencies regularly');
                strategies.push('Implement dependency monitoring');
                strategies.push('Create fallback plans for critical dependencies');
                break;
            case 'team':
                strategies.push('Improve team communication');
                strategies.push('Document knowledge and processes');
                strategies.push('Implement knowledge sharing sessions');
                break;
        }

        return strategies.map(strategy => ({
            category,
            strategy,
            priority: risk.level === 'high' ? 'high' : 'medium',
            effort: this.estimateEffort(strategy)
        }));
    }

    estimateEffort(strategy) {
        // Simple effort estimation
        if (strategy.includes('hire') || strategy.includes('training')) return 'high';
        if (strategy.includes('implement') || strategy.includes('establish')) return 'medium';
        return 'low';
    }

    // Helper methods
    async findSourceFiles() {
        const sourceFiles = [];
        
        const processDirectory = async (currentPath) => {
            try {
                const items = await fs.promises.readdir(currentPath, { withFileTypes: true });
                
                for (const item of items) {
                    const itemPath = path.join(currentPath, item.name);
                    
                    if (['node_modules', '.git', 'dist', 'build', '.next'].includes(item.name)) {
                        continue;
                    }

                    if (item.isDirectory()) {
                        await processDirectory(itemPath);
                    } else {
                        const ext = path.extname(item.name).toLowerCase();
                        if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs'].includes(ext)) {
                            sourceFiles.push(itemPath);
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        await processDirectory(this.options.projectPath);
        return sourceFiles;
    }

    async calculateFileComplexity(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            
            const complexityKeywords = [
                'if', 'else', 'for', 'while', 'do', 'switch', 'case',
                'catch', 'try', '&&', '||', '?', ':', 'return'
            ];
            
            let complexity = 1;
            
            for (const keyword of complexityKeywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                const matches = content.match(regex);
                if (matches) {
                    complexity += matches.length;
                }
            }
            
            return complexity;
        } catch (error) {
            return 0;
        }
    }

    async analyzeDependencies() {
        const dependencies = {
            total: 0,
            outdated: 0,
            conflicts: 0,
            maintenance: 0,
            support: 0
        };

        try {
            const packageJsonPath = path.join(this.options.projectPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                dependencies.total = Object.keys(packageJson.dependencies || {}).length;
                
                // Check for outdated dependencies
                try {
                    const { stdout } = await execAsync('npm outdated --json 2>/dev/null');
                    const outdated = JSON.parse(stdout);
                    dependencies.outdated = Object.keys(outdated).length;
                } catch (error) {
                    // No outdated dependencies
                }
            }
        } catch (error) {
            console.warn('⚠️ Error analyzing dependencies:', error.message);
        }

        return dependencies;
    }

    async getGitContributors() {
        try {
            const { stdout } = await execAsync('git log --pretty=format:"%an|%ae" --since="1 year ago"');
            const contributors = new Set();
            
            stdout.split('\n').forEach(line => {
                if (line.trim()) {
                    const [name, email] = line.split('|');
                    contributors.add(JSON.stringify({ name: name.trim(), email: email.trim() }));
                }
            });

            return Array.from(contributors).map(contributor => JSON.parse(contributor));
        } catch (error) {
            return [];
        }
    }

    async getTotalCommits() {
        try {
            const { stdout } = await execAsync(
                `git log --since="${this.options.analysisPeriod} days ago" --oneline | wc -l`
            );
            return parseInt(stdout.trim());
        } catch (error) {
            return 0;
        }
    }

    // Placeholder methods for complex analyses
    async analyzePerformanceIndicators() { return 50; }
    async analyzeMaintainabilityIndicators() { return 50; }
    async analyzeMilestoneCompletion() { return 50; }
    async analyzeBlockers() { return 50; }
    async analyzeDeadlinePressure() { return 50; }
    async analyzeSkillDistribution() { return 50; }
    async analyzeTeamAvailability() { return 50; }
    async analyzeTestCoverage() { return 50; }
    async analyzeCodeReviewPractices() { return 50; }
    async analyzeCodingStandards() { return 50; }
    async analyzeSecurityVulnerabilities() { return 50; }
    async analyzeAccessControl() { return 50; }
    async analyzeDataProtection() { return 50; }
    async analyzeTeamTurnover() { return 50; }
    async analyzeKnowledgeDistribution() { return 50; }
    async analyzeCollaborationPatterns() { return 50; }

    async saveRiskAnalysis() {
        const filename = `risk-analysis-${new Date().toISOString().slice(0, 10)}.json`;
        const filepath = path.join(this.options.outputDir, filename);
        
        const data = {
            ...this.riskData,
            predictions: this.predictions,
            generated: new Date().toISOString()
        };
        
        await fs.promises.writeFile(filepath, JSON.stringify(data, null, 2));
        console.log(`💾 Risk analysis saved to: ${filepath}`);
    }

    generateReport(format = 'html') {
        const report = this.createReportTemplate();
        
        switch (format) {
            case 'html':
                return this.generateHTMLReport(report);
            case 'json':
                return JSON.stringify(report, null, 2);
            default:
                return report;
        }
    }

    createReportTemplate() {
        return {
            title: 'Project Risk Analysis Report',
            generated: new Date().toISOString(),
            project: {
                path: this.options.projectPath,
                analysisPeriod: this.options.analysisPeriod
            },
            summary: {
                overallRisk: this.riskData.overallRisk,
                riskLevel: this.categorizeRiskLevel(this.riskData.overallRisk),
                totalRisks: Object.keys(this.riskData.risks).length,
                highRisks: Object.values(this.riskData.risks).filter(r => r.level === 'high').length,
                mediumRisks: Object.values(this.riskData.risks).filter(r => r.level === 'medium').length
            },
            risks: this.riskData.risks,
            predictions: this.predictions,
            recommendations: this.riskData.recommendations
        };
    }

    generateHTMLReport(report) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f9f9f9; border-radius: 3px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007acc; }
        .metric-label { font-size: 14px; color: #666; }
        .risk-high { color: #dc3545; background: #f8d7da; }
        .risk-medium { color: #ffc107; background: #fff3cd; }
        .risk-low { color: #28a745; background: #d1ecf1; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
        .recommendation { margin: 10px 0; padding: 10px; border-left: 4px solid #007acc; background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚠️ ${report.title}</h1>
        <p>Generated: ${report.generated}</p>
        <p>Project: ${report.project.path}</p>
        <p>Analysis Period: ${report.project.analysisPeriod} days</p>
    </div>

    <div class="section">
        <h2>📊 Risk Overview</h2>
        <div class="metric">
            <div class="metric-value risk-${report.summary.riskLevel}">${Math.round(report.summary.overallRisk)}%</div>
            <div class="metric-label">Overall Risk Score</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.totalRisks}</div>
            <div class="metric-label">Risk Categories</div>
        </div>
        <div class="metric">
            <div class="metric-value risk-high">${report.summary.highRisks}</div>
            <div class="metric-label">High Risks</div>
        </div>
        <div class="metric">
            <div class="metric-value risk-medium">${report.summary.mediumRisks}</div>
            <div class="metric-label">Medium Risks</div>
        </div>
    </div>

    <div class="section">
        <h2>⚠️ Risk Analysis</h2>
        <table>
            <tr><th>Category</th><th>Score</th><th>Level</th><th>Probability</th><th>Impact</th></tr>
            ${Object.entries(report.risks).map(([category, risk]) => `
                <tr>
                    <td>${risk.name}</td>
                    <td>${Math.round(risk.score)}%</td>
                    <td class="risk-${risk.level}">${risk.level.toUpperCase()}</td>
                    <td>${Math.round(risk.probability)}%</td>
                    <td>${Math.round(risk.impact)}%</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>🔮 Risk Predictions</h2>
        <h3>Short-term (1-2 weeks)</h3>
        <table>
            <tr><th>Category</th><th>Predicted Score</th><th>Trend</th><th>Confidence</th></tr>
            ${Object.entries(report.predictions.shortTerm).map(([category, prediction]) => `
                <tr>
                    <td>${category}</td>
                    <td>${Math.round(prediction.score)}%</td>
                    <td>${prediction.trend}</td>
                    <td>${Math.round(prediction.confidence)}%</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>💡 Mitigation Strategies</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation">
                <strong>${rec.category.toUpperCase()}:</strong> ${rec.strategy}
                <br><small>Priority: ${rec.priority} | Effort: ${rec.effort}</small>
            </div>
        `).join('')}
    </div>

    <footer style="margin-top: 40px; padding: 20px; background: #f0f0f0; border-radius: 5px; text-align: center;">
        <p>Generated by Universal Automation Platform v2.2</p>
        <p>Risk Prediction System</p>
    </footer>
</body>
</html>`;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'analyze';

    const riskSystem = new RiskPredictionSystem({
        outputDir: 'risk-prediction'
    });

    switch (command) {
        case 'analyze':
            riskSystem.analyzeProjectRisks().then(() => {
                console.log('✅ Risk analysis completed');
            });
            break;
        case 'report':
            riskSystem.analyzeProjectRisks().then(() => {
                const report = riskSystem.generateReport('html');
                console.log(report);
            });
            break;
        default:
            console.log('Usage: node risk-prediction.js [analyze|report]');
    }
}

module.exports = RiskPredictionSystem;
