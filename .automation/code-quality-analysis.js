// Universal Automation Platform - Code Quality Analysis
// Version: 2.2 - AI Enhanced

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CodeQualityAnalyzer {
    constructor(options = {}) {
        this.options = {
            projectPath: options.projectPath || process.cwd(),
            outputDir: options.outputDir || 'code-quality-analysis',
            languages: options.languages || ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp'],
            tools: options.tools || {
                eslint: true,
                prettier: true,
                sonarjs: true,
                complexity: true,
                security: true,
                performance: true,
                maintainability: true
            },
            thresholds: options.thresholds || {
                complexity: 10,
                maintainability: 70,
                security: 80,
                performance: 80,
                coverage: 80
            },
            ...options
        };
        
        this.analysisResults = {};
        this.qualityMetrics = {};
        this.trends = {};
        this.issues = [];
        
        this.init();
    }

    init() {
        console.log('🔍 Initializing Code Quality Analyzer...');
        this.createOutputDirectory();
        this.detectProjectType();
    }

    createOutputDirectory() {
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
            console.log(`✅ Created code quality analysis directory: ${this.options.outputDir}`);
        }
    }

    async detectProjectType() {
        try {
            const packageJsonPath = path.join(this.options.projectPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                this.projectType = 'nodejs';
                this.projectConfig = packageJson;
            } else if (fs.existsSync(path.join(this.options.projectPath, 'requirements.txt'))) {
                this.projectType = 'python';
            } else if (fs.existsSync(path.join(this.options.projectPath, 'pom.xml'))) {
                this.projectType = 'java';
            } else if (fs.existsSync(path.join(this.options.projectPath, 'CMakeLists.txt'))) {
                this.projectType = 'cpp';
            } else {
                this.projectType = 'unknown';
            }
            
            console.log(`📁 Detected project type: ${this.projectType}`);
        } catch (error) {
            console.warn('⚠️ Could not detect project type:', error.message);
            this.projectType = 'unknown';
        }
    }

    async analyzeCodeQuality() {
        console.log('🔍 Starting code quality analysis...');
        
        try {
            // Analyze different aspects of code quality
            this.analysisResults = {
                timestamp: new Date().toISOString(),
                projectType: this.projectType,
                projectPath: this.options.projectPath,
                metrics: {},
                issues: [],
                trends: {},
                recommendations: []
            };

            // File analysis
            this.analysisResults.metrics.files = await this.analyzeFiles();
            
            // Language analysis
            this.analysisResults.metrics.languages = await this.analyzeLanguages();
            
            // Complexity analysis
            if (this.options.tools.complexity) {
                this.analysisResults.metrics.complexity = await this.analyzeComplexity();
            }
            
            // Maintainability analysis
            if (this.options.tools.maintainability) {
                this.analysisResults.metrics.maintainability = await this.analyzeMaintainability();
            }
            
            // Security analysis
            if (this.options.tools.security) {
                this.analysisResults.metrics.security = await this.analyzeSecurity();
            }
            
            // Performance analysis
            if (this.options.tools.performance) {
                this.analysisResults.metrics.performance = await this.analyzePerformance();
            }
            
            // Code style analysis
            this.analysisResults.metrics.style = await this.analyzeCodeStyle();
            
            // Test coverage analysis
            this.analysisResults.metrics.coverage = await this.analyzeTestCoverage();
            
            // Documentation analysis
            this.analysisResults.metrics.documentation = await this.analyzeDocumentation();
            
            // Dependencies analysis
            this.analysisResults.metrics.dependencies = await this.analyzeDependencies();
            
            // Generate quality score
            this.analysisResults.qualityScore = this.calculateQualityScore();
            
            // Identify issues
            this.analysisResults.issues = this.identifyIssues();
            
            // Generate recommendations
            this.analysisResults.recommendations = this.generateRecommendations();
            
            // Save results
            await this.saveAnalysisResults();
            
            console.log('✅ Code quality analysis completed');
            return this.analysisResults;
            
        } catch (error) {
            console.error('❌ Error analyzing code quality:', error);
            throw error;
        }
    }

    async analyzeFiles() {
        const files = {
            total: 0,
            byLanguage: {},
            byType: {},
            size: 0,
            lines: 0
        };

        try {
            const fileStats = await this.getFileStatistics(this.options.projectPath);
            files.total = fileStats.totalFiles;
            files.byLanguage = fileStats.byLanguage;
            files.byType = fileStats.byType;
            files.size = fileStats.totalSize;
            files.lines = fileStats.totalLines;
        } catch (error) {
            console.warn('⚠️ Error analyzing files:', error.message);
        }

        return files;
    }

    async getFileStatistics(dirPath) {
        let totalFiles = 0;
        let totalSize = 0;
        let totalLines = 0;
        const byLanguage = {};
        const byType = {};

        const processDirectory = async (currentPath) => {
            try {
                const items = await fs.promises.readdir(currentPath, { withFileTypes: true });
                
                for (const item of items) {
                    const itemPath = path.join(currentPath, item.name);
                    
                    // Skip common directories
                    if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(item.name)) {
                        continue;
                    }

                    if (item.isDirectory()) {
                        await processDirectory(itemPath);
                    } else {
                        const ext = path.extname(item.name).toLowerCase();
                        const language = this.getLanguageFromExtension(ext);
                        
                        if (language) {
                            totalFiles++;
                            
                            // Count by language
                            byLanguage[language] = (byLanguage[language] || 0) + 1;
                            
                            // Count by type
                            const fileType = this.getFileType(item.name);
                            byType[fileType] = (byType[fileType] || 0) + 1;
                            
                            // Get file size and line count
                            try {
                                const stats = await fs.promises.stat(itemPath);
                                totalSize += stats.size;
                                
                                const content = await fs.promises.readFile(itemPath, 'utf8');
                                const lines = content.split('\n').length;
                                totalLines += lines;
                            } catch (error) {
                                // Skip files we can't read
                            }
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        await processDirectory(dirPath);

        return {
            totalFiles,
            totalSize,
            totalLines,
            byLanguage,
            byType
        };
    }

    getLanguageFromExtension(ext) {
        const languageMap = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala'
        };
        
        return languageMap[ext] || null;
    }

    getFileType(filename) {
        if (filename.includes('test') || filename.includes('spec')) {
            return 'test';
        } else if (filename.includes('config') || filename.includes('setup')) {
            return 'config';
        } else if (filename.endsWith('.md') || filename.endsWith('.txt')) {
            return 'documentation';
        } else {
            return 'source';
        }
    }

    async analyzeLanguages() {
        const languages = {};
        
        for (const language of this.options.languages) {
            languages[language] = {
                files: 0,
                lines: 0,
                complexity: 0,
                quality: 'unknown'
            };
        }

        return languages;
    }

    async analyzeComplexity() {
        const complexity = {
            average: 0,
            max: 0,
            distribution: {},
            hotspots: []
        };

        try {
            // This would integrate with tools like ESLint, SonarJS, etc.
            // For now, we'll use a simplified analysis
            
            const files = await this.findSourceFiles();
            let totalComplexity = 0;
            let fileCount = 0;

            for (const file of files) {
                const fileComplexity = await this.calculateFileComplexity(file);
                totalComplexity += fileComplexity;
                fileCount++;
                
                if (fileComplexity > complexity.max) {
                    complexity.max = fileComplexity;
                }
                
                // Categorize complexity
                const category = this.categorizeComplexity(fileComplexity);
                complexity.distribution[category] = (complexity.distribution[category] || 0) + 1;
                
                // Identify hotspots
                if (fileComplexity > this.options.thresholds.complexity) {
                    complexity.hotspots.push({
                        file: path.relative(this.options.projectPath, file),
                        complexity: fileComplexity
                    });
                }
            }

            complexity.average = fileCount > 0 ? totalComplexity / fileCount : 0;

        } catch (error) {
            console.warn('⚠️ Error analyzing complexity:', error.message);
        }

        return complexity;
    }

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
            
            // Simple complexity calculation based on control structures
            const complexityKeywords = [
                'if', 'else', 'for', 'while', 'do', 'switch', 'case',
                'catch', 'try', '&&', '||', '?', ':', 'return'
            ];
            
            let complexity = 1; // Base complexity
            
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

    categorizeComplexity(complexity) {
        if (complexity <= 5) return 'low';
        if (complexity <= 10) return 'medium';
        if (complexity <= 20) return 'high';
        return 'very-high';
    }

    async analyzeMaintainability() {
        const maintainability = {
            score: 0,
            factors: {
                complexity: 0,
                documentation: 0,
                naming: 0,
                structure: 0,
                testing: 0
            },
            issues: []
        };

        try {
            // Analyze various maintainability factors
            maintainability.factors.complexity = await this.analyzeComplexityFactor();
            maintainability.factors.documentation = await this.analyzeDocumentationFactor();
            maintainability.factors.naming = await this.analyzeNamingFactor();
            maintainability.factors.structure = await this.analyzeStructureFactor();
            maintainability.factors.testing = await this.analyzeTestingFactor();
            
            // Calculate overall maintainability score
            const weights = {
                complexity: 0.3,
                documentation: 0.2,
                naming: 0.2,
                structure: 0.15,
                testing: 0.15
            };
            
            maintainability.score = Object.keys(weights).reduce((score, factor) => {
                return score + (maintainability.factors[factor] * weights[factor]);
            }, 0);
            
        } catch (error) {
            console.warn('⚠️ Error analyzing maintainability:', error.message);
        }

        return maintainability;
    }

    async analyzeComplexityFactor() {
        // This would analyze code complexity and return a score 0-100
        // For now, return a placeholder score
        return 75;
    }

    async analyzeDocumentationFactor() {
        // This would analyze documentation coverage and quality
        // For now, return a placeholder score
        return 60;
    }

    async analyzeNamingFactor() {
        // This would analyze variable and function naming conventions
        // For now, return a placeholder score
        return 80;
    }

    async analyzeStructureFactor() {
        // This would analyze code organization and structure
        // For now, return a placeholder score
        return 70;
    }

    async analyzeTestingFactor() {
        // This would analyze test coverage and quality
        // For now, return a placeholder score
        return 65;
    }

    async analyzeSecurity() {
        const security = {
            score: 0,
            vulnerabilities: [],
            recommendations: []
        };

        try {
            // This would integrate with security scanning tools
            // For now, we'll do basic analysis
            
            const files = await this.findSourceFiles();
            
            for (const file of files) {
                const content = await fs.promises.readFile(file, 'utf8');
                
                // Check for common security issues
                const securityPatterns = [
                    { pattern: /eval\s*\(/, severity: 'high', message: 'Use of eval() function' },
                    { pattern: /innerHTML\s*=/, severity: 'medium', message: 'Direct innerHTML assignment' },
                    { pattern: /document\.write\s*\(/, severity: 'medium', message: 'Use of document.write()' },
                    { pattern: /password\s*=\s*['"]/, severity: 'high', message: 'Hardcoded password' },
                    { pattern: /console\.log\s*\(/, severity: 'low', message: 'Console.log statements in production code' }
                ];
                
                for (const { pattern, severity, message } of securityPatterns) {
                    const matches = content.match(pattern);
                    if (matches) {
                        security.vulnerabilities.push({
                            file: path.relative(this.options.projectPath, file),
                            severity,
                            message,
                            line: this.findLineNumber(content, matches[0])
                        });
                    }
                }
            }
            
            // Calculate security score based on vulnerabilities
            const highVulns = security.vulnerabilities.filter(v => v.severity === 'high').length;
            const mediumVulns = security.vulnerabilities.filter(v => v.severity === 'medium').length;
            const lowVulns = security.vulnerabilities.filter(v => v.severity === 'low').length;
            
            security.score = Math.max(0, 100 - (highVulns * 20) - (mediumVulns * 10) - (lowVulns * 5));
            
        } catch (error) {
            console.warn('⚠️ Error analyzing security:', error.message);
        }

        return security;
    }

    findLineNumber(content, searchText) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchText)) {
                return i + 1;
            }
        }
        return 0;
    }

    async analyzePerformance() {
        const performance = {
            score: 0,
            issues: [],
            recommendations: []
        };

        try {
            // This would analyze performance-related code patterns
            const files = await this.findSourceFiles();
            
            for (const file of files) {
                const content = await fs.promises.readFile(file, 'utf8');
                
                // Check for performance anti-patterns
                const performancePatterns = [
                    { pattern: /for\s*\([^)]*\.length[^)]*\)/, severity: 'medium', message: 'Cache array length in loops' },
                    { pattern: /document\.getElementById\s*\([^)]*\)[^.]*\.getElementById/, severity: 'low', message: 'Multiple DOM queries' },
                    { pattern: /setTimeout\s*\(\s*function/, severity: 'low', message: 'Consider using arrow functions' }
                ];
                
                for (const { pattern, severity, message } of performancePatterns) {
                    const matches = content.match(pattern);
                    if (matches) {
                        performance.issues.push({
                            file: path.relative(this.options.projectPath, file),
                            severity,
                            message,
                            line: this.findLineNumber(content, matches[0])
                        });
                    }
                }
            }
            
            // Calculate performance score
            const highIssues = performance.issues.filter(i => i.severity === 'high').length;
            const mediumIssues = performance.issues.filter(i => i.severity === 'medium').length;
            const lowIssues = performance.issues.filter(i => i.severity === 'low').length;
            
            performance.score = Math.max(0, 100 - (highIssues * 15) - (mediumIssues * 10) - (lowIssues * 5));
            
        } catch (error) {
            console.warn('⚠️ Error analyzing performance:', error.message);
        }

        return performance;
    }

    async analyzeCodeStyle() {
        const style = {
            score: 0,
            issues: [],
            tools: {
                eslint: false,
                prettier: false,
                configured: false
            }
        };

        try {
            // Check for style tools configuration
            if (this.projectType === 'nodejs') {
                style.tools.eslint = fs.existsSync(path.join(this.options.projectPath, '.eslintrc.js')) ||
                                   fs.existsSync(path.join(this.options.projectPath, '.eslintrc.json')) ||
                                   this.projectConfig?.eslintConfig;
                
                style.tools.prettier = fs.existsSync(path.join(this.options.projectPath, '.prettierrc')) ||
                                      fs.existsSync(path.join(this.options.projectPath, 'prettier.config.js')) ||
                                      this.projectConfig?.prettier;
            }
            
            style.tools.configured = style.tools.eslint || style.tools.prettier;
            
            // Calculate style score based on tool configuration
            style.score = style.tools.configured ? 80 : 40;
            
        } catch (error) {
            console.warn('⚠️ Error analyzing code style:', error.message);
        }

        return style;
    }

    async analyzeTestCoverage() {
        const coverage = {
            score: 0,
            percentage: 0,
            files: 0,
            lines: 0,
            functions: 0,
            branches: 0
        };

        try {
            // This would integrate with test coverage tools
            // For now, we'll do basic analysis
            
            if (this.projectType === 'nodejs') {
                // Try to run test coverage if available
                try {
                    const { stdout } = await execAsync('npm test -- --coverage 2>/dev/null');
                    // Parse coverage output (simplified)
                    const coverageMatch = stdout.match(/(\d+)% coverage/);
                    if (coverageMatch) {
                        coverage.percentage = parseInt(coverageMatch[1]);
                        coverage.score = coverage.percentage;
                    }
                } catch (error) {
                    // Coverage not available
                }
            }
            
            // Count test files
            const testFiles = await this.findTestFiles();
            coverage.files = testFiles.length;
            
        } catch (error) {
            console.warn('⚠️ Error analyzing test coverage:', error.message);
        }

        return coverage;
    }

    async findTestFiles() {
        const testFiles = [];
        
        const processDirectory = async (currentPath) => {
            try {
                const items = await fs.promises.readdir(currentPath, { withFileTypes: true });
                
                for (const item of items) {
                    const itemPath = path.join(currentPath, item.name);
                    
                    if (['node_modules', '.git', 'dist', 'build'].includes(item.name)) {
                        continue;
                    }

                    if (item.isDirectory()) {
                        await processDirectory(itemPath);
                    } else {
                        const filename = item.name.toLowerCase();
                        if (filename.includes('test') || filename.includes('spec')) {
                            testFiles.push(itemPath);
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        await processDirectory(this.options.projectPath);
        return testFiles;
    }

    async analyzeDocumentation() {
        const documentation = {
            score: 0,
            files: 0,
            coverage: 0,
            quality: 0
        };

        try {
            // Count documentation files
            const docFiles = await this.findDocumentationFiles();
            documentation.files = docFiles.length;
            
            // Analyze source code documentation
            const sourceFiles = await this.findSourceFiles();
            let documentedFiles = 0;
            
            for (const file of sourceFiles) {
                const content = await fs.promises.readFile(file, 'utf8');
                
                // Check for documentation patterns
                const hasComments = content.includes('//') || content.includes('/*') || content.includes('#');
                const hasJSDoc = content.includes('/**') || content.includes('@param') || content.includes('@return');
                
                if (hasComments || hasJSDoc) {
                    documentedFiles++;
                }
            }
            
            documentation.coverage = sourceFiles.length > 0 ? (documentedFiles / sourceFiles.length) * 100 : 0;
            documentation.score = Math.min(documentation.coverage, 100);
            
        } catch (error) {
            console.warn('⚠️ Error analyzing documentation:', error.message);
        }

        return documentation;
    }

    async findDocumentationFiles() {
        const docFiles = [];
        
        const processDirectory = async (currentPath) => {
            try {
                const items = await fs.promises.readdir(currentPath, { withFileTypes: true });
                
                for (const item of items) {
                    const itemPath = path.join(currentPath, item.name);
                    
                    if (['node_modules', '.git', 'dist', 'build'].includes(item.name)) {
                        continue;
                    }

                    if (item.isDirectory()) {
                        await processDirectory(itemPath);
                    } else {
                        const ext = path.extname(item.name).toLowerCase();
                        if (['.md', '.rst', '.txt', '.doc', '.docx'].includes(ext)) {
                            docFiles.push(itemPath);
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        await processDirectory(this.options.projectPath);
        return docFiles;
    }

    async analyzeDependencies() {
        const dependencies = {
            total: 0,
            outdated: 0,
            vulnerabilities: 0,
            security: 0,
            performance: 0
        };

        try {
            if (this.projectType === 'nodejs' && this.projectConfig?.dependencies) {
                dependencies.total = Object.keys(this.projectConfig.dependencies).length;
                
                // Check for outdated dependencies (simplified)
                try {
                    const { stdout } = await execAsync('npm outdated --json 2>/dev/null');
                    const outdated = JSON.parse(stdout);
                    dependencies.outdated = Object.keys(outdated).length;
                } catch (error) {
                    // No outdated dependencies or npm not available
                }
                
                // Check for security vulnerabilities
                try {
                    const { stdout } = await execAsync('npm audit --json 2>/dev/null');
                    const audit = JSON.parse(stdout);
                    dependencies.vulnerabilities = audit.vulnerabilities?.total || 0;
                } catch (error) {
                    // Audit not available
                }
            }
            
            // Calculate dependency scores
            dependencies.security = Math.max(0, 100 - (dependencies.vulnerabilities * 10));
            dependencies.performance = Math.max(0, 100 - (dependencies.outdated * 5));
            
        } catch (error) {
            console.warn('⚠️ Error analyzing dependencies:', error.message);
        }

        return dependencies;
    }

    calculateQualityScore() {
        const weights = {
            maintainability: 0.25,
            security: 0.25,
            performance: 0.20,
            style: 0.15,
            coverage: 0.15
        };
        
        let totalScore = 0;
        let totalWeight = 0;
        
        for (const [metric, weight] of Object.entries(weights)) {
            if (this.analysisResults.metrics[metric]?.score !== undefined) {
                totalScore += this.analysisResults.metrics[metric].score * weight;
                totalWeight += weight;
            }
        }
        
        return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    }

    identifyIssues() {
        const issues = [];
        
        // Complexity issues
        if (this.analysisResults.metrics.complexity?.hotspots) {
            this.analysisResults.metrics.complexity.hotspots.forEach(hotspot => {
                issues.push({
                    type: 'complexity',
                    severity: 'high',
                    message: `High complexity in ${hotspot.file} (${hotspot.complexity})`,
                    file: hotspot.file
                });
            });
        }
        
        // Security issues
        if (this.analysisResults.metrics.security?.vulnerabilities) {
            this.analysisResults.metrics.security.vulnerabilities.forEach(vuln => {
                issues.push({
                    type: 'security',
                    severity: vuln.severity,
                    message: vuln.message,
                    file: vuln.file,
                    line: vuln.line
                });
            });
        }
        
        // Performance issues
        if (this.analysisResults.metrics.performance?.issues) {
            this.analysisResults.metrics.performance.issues.forEach(issue => {
                issues.push({
                    type: 'performance',
                    severity: issue.severity,
                    message: issue.message,
                    file: issue.file,
                    line: issue.line
                });
            });
        }
        
        return issues;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Based on quality score
        if (this.analysisResults.qualityScore < 60) {
            recommendations.push('Overall code quality needs improvement. Focus on maintainability and testing.');
        }
        
        // Based on specific metrics
        if (this.analysisResults.metrics.maintainability?.score < 70) {
            recommendations.push('Improve code maintainability by reducing complexity and improving documentation.');
        }
        
        if (this.analysisResults.metrics.security?.score < 80) {
            recommendations.push('Address security vulnerabilities and follow secure coding practices.');
        }
        
        if (this.analysisResults.metrics.coverage?.score < 80) {
            recommendations.push('Increase test coverage to improve code reliability.');
        }
        
        if (this.analysisResults.metrics.style?.score < 80) {
            recommendations.push('Configure and use code formatting tools like ESLint and Prettier.');
        }
        
        return recommendations;
    }

    async saveAnalysisResults() {
        const filename = `code-quality-analysis-${new Date().toISOString().slice(0, 10)}.json`;
        const filepath = path.join(this.options.outputDir, filename);
        
        await fs.promises.writeFile(filepath, JSON.stringify(this.analysisResults, null, 2));
        console.log(`💾 Analysis results saved to: ${filepath}`);
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
            title: 'Code Quality Analysis Report',
            generated: new Date().toISOString(),
            project: {
                type: this.projectType,
                path: this.options.projectPath
            },
            summary: {
                qualityScore: this.analysisResults.qualityScore,
                totalFiles: this.analysisResults.metrics.files?.total || 0,
                totalLines: this.analysisResults.metrics.files?.lines || 0,
                issues: this.analysisResults.issues?.length || 0
            },
            metrics: this.analysisResults.metrics,
            issues: this.analysisResults.issues,
            recommendations: this.analysisResults.recommendations
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
        .score-high { color: #28a745; }
        .score-medium { color: #ffc107; }
        .score-low { color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
        .issue-high { background: #f8d7da; }
        .issue-medium { background: #fff3cd; }
        .issue-low { background: #d1ecf1; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 ${report.title}</h1>
        <p>Generated: ${report.generated}</p>
        <p>Project: ${report.project.path}</p>
        <p>Type: ${report.project.type}</p>
    </div>

    <div class="section">
        <h2>📊 Quality Overview</h2>
        <div class="metric">
            <div class="metric-value score-${report.summary.qualityScore >= 80 ? 'high' : report.summary.qualityScore >= 60 ? 'medium' : 'low'}">${report.summary.qualityScore}%</div>
            <div class="metric-label">Overall Quality Score</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.totalFiles}</div>
            <div class="metric-label">Total Files</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.totalLines}</div>
            <div class="metric-label">Total Lines</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.issues}</div>
            <div class="metric-label">Issues Found</div>
        </div>
    </div>

    <div class="section">
        <h2>📈 Quality Metrics</h2>
        <table>
            <tr><th>Metric</th><th>Score</th><th>Status</th></tr>
            ${report.metrics.maintainability ? `
            <tr>
                <td>Maintainability</td>
                <td>${report.metrics.maintainability.score}%</td>
                <td class="score-${report.metrics.maintainability.score >= 80 ? 'high' : report.metrics.maintainability.score >= 60 ? 'medium' : 'low'}">
                    ${report.metrics.maintainability.score >= 80 ? 'Good' : report.metrics.maintainability.score >= 60 ? 'Fair' : 'Poor'}
                </td>
            </tr>
            ` : ''}
            ${report.metrics.security ? `
            <tr>
                <td>Security</td>
                <td>${report.metrics.security.score}%</td>
                <td class="score-${report.metrics.security.score >= 80 ? 'high' : report.metrics.security.score >= 60 ? 'medium' : 'low'}">
                    ${report.metrics.security.score >= 80 ? 'Good' : report.metrics.security.score >= 60 ? 'Fair' : 'Poor'}
                </td>
            </tr>
            ` : ''}
            ${report.metrics.performance ? `
            <tr>
                <td>Performance</td>
                <td>${report.metrics.performance.score}%</td>
                <td class="score-${report.metrics.performance.score >= 80 ? 'high' : report.metrics.performance.score >= 60 ? 'medium' : 'low'}">
                    ${report.metrics.performance.score >= 80 ? 'Good' : report.metrics.performance.score >= 60 ? 'Fair' : 'Poor'}
                </td>
            </tr>
            ` : ''}
            ${report.metrics.coverage ? `
            <tr>
                <td>Test Coverage</td>
                <td>${report.metrics.coverage.score}%</td>
                <td class="score-${report.metrics.coverage.score >= 80 ? 'high' : report.metrics.coverage.score >= 60 ? 'medium' : 'low'}">
                    ${report.metrics.coverage.score >= 80 ? 'Good' : report.metrics.coverage.score >= 60 ? 'Fair' : 'Poor'}
                </td>
            </tr>
            ` : ''}
        </table>
    </div>

    <div class="section">
        <h2>🚨 Issues Found</h2>
        ${report.issues.length > 0 ? `
        <table>
            <tr><th>Type</th><th>Severity</th><th>Message</th><th>File</th></tr>
            ${report.issues.map(issue => `
                <tr class="issue-${issue.severity}">
                    <td>${issue.type}</td>
                    <td>${issue.severity}</td>
                    <td>${issue.message}</td>
                    <td>${issue.file || 'N/A'}</td>
                </tr>
            `).join('')}
        </table>
        ` : '<p>No issues found! 🎉</p>'}
    </div>

    <div class="section">
        <h2>💡 Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    <footer style="margin-top: 40px; padding: 20px; background: #f0f0f0; border-radius: 5px; text-align: center;">
        <p>Generated by Universal Automation Platform v2.2</p>
        <p>Code Quality Analysis</p>
    </footer>
</body>
</html>`;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'analyze';

    const analyzer = new CodeQualityAnalyzer({
        outputDir: 'code-quality-analysis'
    });

    switch (command) {
        case 'analyze':
            analyzer.analyzeCodeQuality().then(() => {
                console.log('✅ Code quality analysis completed');
            });
            break;
        case 'report':
            analyzer.analyzeCodeQuality().then(() => {
                const report = analyzer.generateReport('html');
                console.log(report);
            });
            break;
        default:
            console.log('Usage: node code-quality-analysis.js [analyze|report]');
    }
}

module.exports = CodeQualityAnalyzer;
