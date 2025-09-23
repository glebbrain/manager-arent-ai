// Universal Automation Platform - Performance Metrics System
// Version: 2.2 - AI Enhanced

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class PerformanceMetricsCollector {
    constructor(options = {}) {
        this.options = {
            interval: options.interval || 5000, // 5 seconds
            historySize: options.historySize || 1000,
            outputFile: options.outputFile || 'performance-metrics.json',
            enableSystemMetrics: options.enableSystemMetrics !== false,
            enableProjectMetrics: options.enableProjectMetrics !== false,
            enableGitMetrics: options.enableGitMetrics !== false,
            enableBuildMetrics: options.enableBuildMetrics !== false,
            ...options
        };
        
        this.metrics = {
            system: {},
            project: {},
            git: {},
            build: {},
            development: {},
            quality: {}
        };
        
        this.history = [];
        this.isRunning = false;
        this.intervalId = null;
        
        this.init();
    }

    init() {
        console.log('📊 Initializing Performance Metrics Collector...');
        this.loadHistory();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping Performance Metrics Collector...');
            this.stop();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 Stopping Performance Metrics Collector...');
            this.stop();
            process.exit(0);
        });
    }

    async start() {
        if (this.isRunning) {
            console.log('⚠️ Performance Metrics Collector is already running');
            return;
        }

        console.log('🚀 Starting Performance Metrics Collection...');
        this.isRunning = true;

        // Collect initial metrics
        await this.collectAllMetrics();

        // Start periodic collection
        this.intervalId = setInterval(async () => {
            await this.collectAllMetrics();
        }, this.options.interval);

        console.log(`✅ Performance Metrics Collection started (interval: ${this.options.interval}ms)`);
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('🛑 Stopping Performance Metrics Collection...');
        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.saveHistory();
        console.log('✅ Performance Metrics Collection stopped');
    }

    async collectAllMetrics() {
        try {
            const timestamp = new Date().toISOString();
            const collectedMetrics = { timestamp };

            if (this.options.enableSystemMetrics) {
                collectedMetrics.system = await this.collectSystemMetrics();
            }

            if (this.options.enableProjectMetrics) {
                collectedMetrics.project = await this.collectProjectMetrics();
            }

            if (this.options.enableGitMetrics) {
                collectedMetrics.git = await this.collectGitMetrics();
            }

            if (this.options.enableBuildMetrics) {
                collectedMetrics.build = await this.collectBuildMetrics();
            }

            collectedMetrics.development = await this.collectDevelopmentMetrics();
            collectedMetrics.quality = await this.collectQualityMetrics();

            // Update current metrics
            this.metrics = { ...this.metrics, ...collectedMetrics };

            // Add to history
            this.history.push(collectedMetrics);

            // Maintain history size
            if (this.history.length > this.options.historySize) {
                this.history = this.history.slice(-this.options.historySize);
            }

            // Save to file
            this.saveMetrics();

            console.log(`📊 Metrics collected at ${timestamp}`);

        } catch (error) {
            console.error('❌ Error collecting metrics:', error);
        }
    }

    async collectSystemMetrics() {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        return {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            uptime: process.uptime(),
            cpu: {
                model: cpus[0].model,
                cores: cpus.length,
                usage: await this.getCpuUsage()
            },
            memory: {
                total: totalMem,
                used: usedMem,
                free: freeMem,
                usage: Math.round((usedMem / totalMem) * 100)
            },
            loadAverage: os.loadavg(),
            networkInterfaces: Object.keys(os.networkInterfaces()).length
        };
    }

    async getCpuUsage() {
        return new Promise((resolve) => {
            const startMeasure = this.cpuAverage();
            
            setTimeout(() => {
                const endMeasure = this.cpuAverage();
                const idleDifference = endMeasure.idle - startMeasure.idle;
                const totalDifference = endMeasure.total - startMeasure.total;
                const percentage = 100 - ~~(100 * idleDifference / totalDifference);
                resolve(Math.round(percentage));
            }, 100);
        });
    }

    cpuAverage() {
        let totalIdle = 0;
        let totalTick = 0;
        const cpus = os.cpus();

        for (let i = 0; i < cpus.length; i++) {
            const cpu = cpus[i];
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }

        return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
    }

    async collectProjectMetrics() {
        const projectPath = process.cwd();
        const stats = await this.getDirectoryStats(projectPath);

        return {
            path: projectPath,
            size: stats.size,
            fileCount: stats.fileCount,
            directoryCount: stats.directoryCount,
            languages: await this.detectLanguages(projectPath),
            dependencies: await this.getDependencies(),
            lastModified: stats.lastModified
        };
    }

    async getDirectoryStats(dirPath) {
        let totalSize = 0;
        let fileCount = 0;
        let directoryCount = 0;
        let lastModified = 0;

        const processDirectory = async (currentPath) => {
            try {
                const items = await fs.promises.readdir(currentPath, { withFileTypes: true });
                
                for (const item of items) {
                    const itemPath = path.join(currentPath, item.name);
                    
                    // Skip node_modules, .git, and other common directories
                    if (['node_modules', '.git', 'dist', 'build', '.next'].includes(item.name)) {
                        continue;
                    }

                    if (item.isDirectory()) {
                        directoryCount++;
                        await processDirectory(itemPath);
                    } else {
                        fileCount++;
                        const stats = await fs.promises.stat(itemPath);
                        totalSize += stats.size;
                        lastModified = Math.max(lastModified, stats.mtime.getTime());
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        await processDirectory(dirPath);

        return {
            size: totalSize,
            fileCount,
            directoryCount,
            lastModified: new Date(lastModified).toISOString()
        };
    }

    async detectLanguages(projectPath) {
        const languages = {};
        const extensions = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'React',
            '.tsx': 'React TypeScript',
            '.py': 'Python',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.scala': 'Scala',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.sass': 'Sass',
            '.less': 'Less',
            '.json': 'JSON',
            '.xml': 'XML',
            '.yaml': 'YAML',
            '.yml': 'YAML',
            '.md': 'Markdown',
            '.sql': 'SQL',
            '.sh': 'Shell',
            '.ps1': 'PowerShell',
            '.bat': 'Batch'
        };

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
                        if (extensions[ext]) {
                            languages[extensions[ext]] = (languages[extensions[ext]] || 0) + 1;
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        await processDirectory(projectPath);
        return languages;
    }

    async getDependencies() {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        
        try {
            const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
            return {
                dependencies: Object.keys(packageJson.dependencies || {}).length,
                devDependencies: Object.keys(packageJson.devDependencies || {}).length,
                total: Object.keys(packageJson.dependencies || {}).length + 
                       Object.keys(packageJson.devDependencies || {}).length
            };
        } catch (error) {
            return { dependencies: 0, devDependencies: 0, total: 0 };
        }
    }

    async collectGitMetrics() {
        try {
            const { stdout: branch } = await execAsync('git branch --show-current');
            const { stdout: commitCount } = await execAsync('git rev-list --count HEAD');
            const { stdout: lastCommit } = await execAsync('git log -1 --format=%H');
            const { stdout: lastCommitDate } = await execAsync('git log -1 --format=%ci');
            const { stdout: status } = await execAsync('git status --porcelain');
            
            const statusLines = status.trim().split('\n').filter(line => line.length > 0);
            const modifiedFiles = statusLines.filter(line => line.startsWith('M')).length;
            const addedFiles = statusLines.filter(line => line.startsWith('A')).length;
            const deletedFiles = statusLines.filter(line => line.startsWith('D')).length;
            const untrackedFiles = statusLines.filter(line => line.startsWith('??')).length;

            return {
                branch: branch.trim(),
                commitCount: parseInt(commitCount.trim()),
                lastCommit: lastCommit.trim(),
                lastCommitDate: lastCommitDate.trim(),
                workingDirectory: {
                    modified: modifiedFiles,
                    added: addedFiles,
                    deleted: deletedFiles,
                    untracked: untrackedFiles,
                    total: statusLines.length
                }
            };
        } catch (error) {
            return {
                branch: 'unknown',
                commitCount: 0,
                lastCommit: 'unknown',
                lastCommitDate: 'unknown',
                workingDirectory: {
                    modified: 0,
                    added: 0,
                    deleted: 0,
                    untracked: 0,
                    total: 0
                }
            };
        }
    }

    async collectBuildMetrics() {
        const buildMetrics = {
            lastBuild: null,
            buildCount: 0,
            averageBuildTime: 0,
            successRate: 0,
            lastBuildTime: 0
        };

        try {
            // Check for common build artifacts
            const buildArtifacts = ['dist', 'build', '.next', 'out', 'target'];
            const projectPath = process.cwd();
            
            for (const artifact of buildArtifacts) {
                const artifactPath = path.join(projectPath, artifact);
                try {
                    const stats = await fs.promises.stat(artifactPath);
                    if (stats.isDirectory()) {
                        buildMetrics.lastBuild = stats.mtime.toISOString();
                        break;
                    }
                } catch (error) {
                    // Artifact doesn't exist
                }
            }

            // Try to get build history from logs or package.json scripts
            const packageJsonPath = path.join(projectPath, 'package.json');
            try {
                const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
                const scripts = packageJson.scripts || {};
                buildMetrics.hasBuildScript = !!scripts.build;
                buildMetrics.hasTestScript = !!scripts.test;
                buildMetrics.hasLintScript = !!scripts.lint;
            } catch (error) {
                // No package.json
            }

        } catch (error) {
            console.warn('⚠️ Could not collect build metrics:', error.message);
        }

        return buildMetrics;
    }

    async collectDevelopmentMetrics() {
        const projectPath = process.cwd();
        const metrics = {
            activeFiles: 0,
            recentChanges: 0,
            codeComplexity: 0,
            testCoverage: 0,
            documentation: 0
        };

        try {
            // Count active files (modified in last 24 hours)
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const activeFiles = await this.countRecentFiles(projectPath, oneDayAgo);
            metrics.activeFiles = activeFiles;

            // Count recent changes (commits in last 7 days)
            try {
                const { stdout: recentCommits } = await execAsync(
                    `git log --since="7 days ago" --oneline | wc -l`
                );
                metrics.recentChanges = parseInt(recentCommits.trim()) || 0;
            } catch (error) {
                metrics.recentChanges = 0;
            }

            // Estimate code complexity (simplified)
            metrics.codeComplexity = await this.estimateCodeComplexity(projectPath);

            // Check for test files
            metrics.testCoverage = await this.estimateTestCoverage(projectPath);

            // Check for documentation
            metrics.documentation = await this.estimateDocumentation(projectPath);

        } catch (error) {
            console.warn('⚠️ Could not collect development metrics:', error.message);
        }

        return metrics;
    }

    async countRecentFiles(dirPath, since) {
        let count = 0;

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
                        const stats = await fs.promises.stat(itemPath);
                        if (stats.mtime.getTime() > since) {
                            count++;
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        await processDirectory(dirPath);
        return count;
    }

    async estimateCodeComplexity(projectPath) {
        let totalLines = 0;
        let functionCount = 0;

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
                        if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs'].includes(ext)) {
                            try {
                                const content = await fs.promises.readFile(itemPath, 'utf8');
                                const lines = content.split('\n').length;
                                totalLines += lines;

                                // Simple function counting (very basic)
                                const functions = content.match(/(function|def|public|private|protected)\s+\w+/gi);
                                if (functions) {
                                    functionCount += functions.length;
                                }
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

        await processDirectory(projectPath);
        
        // Simple complexity score
        return functionCount > 0 ? Math.round(totalLines / functionCount) : 0;
    }

    async estimateTestCoverage(projectPath) {
        let testFiles = 0;
        let sourceFiles = 0;

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
                        const fileName = item.name.toLowerCase();
                        const ext = path.extname(item.name).toLowerCase();
                        
                        if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs'].includes(ext)) {
                            if (fileName.includes('test') || fileName.includes('spec')) {
                                testFiles++;
                            } else {
                                sourceFiles++;
                            }
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        await processDirectory(projectPath);
        
        return sourceFiles > 0 ? Math.round((testFiles / sourceFiles) * 100) : 0;
    }

    async estimateDocumentation(projectPath) {
        let docFiles = 0;
        let sourceFiles = 0;

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
                        const fileName = item.name.toLowerCase();
                        const ext = path.extname(item.name).toLowerCase();
                        
                        if (['.md', '.txt', '.rst', '.doc', '.docx', '.pdf'].includes(ext)) {
                            docFiles++;
                        } else if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs'].includes(ext)) {
                            sourceFiles++;
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        await processDirectory(projectPath);
        
        return sourceFiles > 0 ? Math.round((docFiles / sourceFiles) * 100) : 0;
    }

    async collectQualityMetrics() {
        const quality = {
            linting: false,
            testing: false,
            typeChecking: false,
            security: false,
            performance: false,
            accessibility: false
        };

        try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
            const scripts = packageJson.scripts || {};
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

            // Check for linting tools
            quality.linting = !!(
                scripts.lint || 
                dependencies.eslint || 
                dependencies.prettier || 
                dependencies.tslint
            );

            // Check for testing tools
            quality.testing = !!(
                scripts.test || 
                dependencies.jest || 
                dependencies.mocha || 
                dependencies.jasmine || 
                dependencies.vitest
            );

            // Check for type checking
            quality.typeChecking = !!(
                dependencies.typescript || 
                dependencies['@types/node'] ||
                scripts['type-check']
            );

            // Check for security tools
            quality.security = !!(
                dependencies.audit || 
                dependencies['npm-audit'] || 
                dependencies.snyk ||
                scripts.audit
            );

            // Check for performance tools
            quality.performance = !!(
                dependencies.webpack || 
                dependencies.rollup || 
                dependencies.vite ||
                dependencies['bundle-analyzer']
            );

            // Check for accessibility tools
            quality.accessibility = !!(
                dependencies['eslint-plugin-jsx-a11y'] || 
                dependencies['axe-core'] ||
                dependencies['@testing-library/jest-dom']
            );

        } catch (error) {
            console.warn('⚠️ Could not collect quality metrics:', error.message);
        }

        return quality;
    }

    saveMetrics() {
        try {
            const data = {
                current: this.metrics,
                history: this.history,
                summary: this.generateSummary()
            };

            fs.writeFileSync(this.options.outputFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Error saving metrics:', error);
        }
    }

    loadHistory() {
        try {
            if (fs.existsSync(this.options.outputFile)) {
                const data = JSON.parse(fs.readFileSync(this.options.outputFile, 'utf8'));
                this.history = data.history || [];
                this.metrics = data.current || this.metrics;
                console.log(`📊 Loaded ${this.history.length} historical metrics`);
            }
        } catch (error) {
            console.warn('⚠️ Could not load metrics history:', error.message);
        }
    }

    generateSummary() {
        if (this.history.length === 0) {
            return {};
        }

        const latest = this.history[this.history.length - 1];
        const oldest = this.history[0];
        const timeSpan = new Date(latest.timestamp) - new Date(oldest.timestamp);

        return {
            collectionPeriod: {
                start: oldest.timestamp,
                end: latest.timestamp,
                duration: timeSpan,
                dataPoints: this.history.length
            },
            averages: this.calculateAverages(),
            trends: this.calculateTrends(),
            alerts: this.generateAlerts()
        };
    }

    calculateAverages() {
        if (this.history.length === 0) return {};

        const sums = {};
        const counts = {};

        this.history.forEach(metric => {
            this.flattenObject(metric, sums, counts, '');
        });

        const averages = {};
        Object.keys(sums).forEach(key => {
            averages[key] = Math.round(sums[key] / counts[key] * 100) / 100;
        });

        return averages;
    }

    flattenObject(obj, sums, counts, prefix) {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'number') {
                sums[fullKey] = (sums[fullKey] || 0) + value;
                counts[fullKey] = (counts[fullKey] || 0) + 1;
            } else if (typeof value === 'object' && value !== null) {
                this.flattenObject(value, sums, counts, fullKey);
            }
        });
    }

    calculateTrends() {
        if (this.history.length < 2) return {};

        const trends = {};
        const recent = this.history.slice(-10); // Last 10 data points
        const older = this.history.slice(-20, -10); // Previous 10 data points

        if (older.length === 0) return trends;

        // Calculate trends for key metrics
        const metrics = ['system.cpu.usage', 'system.memory.usage', 'development.activeFiles'];
        
        metrics.forEach(metric => {
            const recentAvg = this.getAverageValue(recent, metric);
            const olderAvg = this.getAverageValue(older, metric);
            
            if (recentAvg !== null && olderAvg !== null) {
                trends[metric] = {
                    change: recentAvg - olderAvg,
                    changePercent: Math.round(((recentAvg - olderAvg) / olderAvg) * 100),
                    direction: recentAvg > olderAvg ? 'up' : 'down'
                };
            }
        });

        return trends;
    }

    getAverageValue(data, path) {
        const values = data.map(item => {
            const keys = path.split('.');
            let value = item;
            for (const key of keys) {
                if (value && typeof value === 'object') {
                    value = value[key];
                } else {
                    return null;
                }
            }
            return typeof value === 'number' ? value : null;
        }).filter(v => v !== null);

        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
    }

    generateAlerts() {
        const alerts = [];
        const latest = this.history[this.history.length - 1];

        if (!latest) return alerts;

        // High CPU usage alert
        if (latest.system?.cpu?.usage > 80) {
            alerts.push({
                type: 'warning',
                metric: 'CPU Usage',
                value: latest.system.cpu.usage,
                threshold: 80,
                message: `High CPU usage: ${latest.system.cpu.usage}%`
            });
        }

        // High memory usage alert
        if (latest.system?.memory?.usage > 85) {
            alerts.push({
                type: 'warning',
                metric: 'Memory Usage',
                value: latest.system.memory.usage,
                threshold: 85,
                message: `High memory usage: ${latest.system.memory.usage}%`
            });
        }

        // Low test coverage alert
        if (latest.development?.testCoverage < 50) {
            alerts.push({
                type: 'info',
                metric: 'Test Coverage',
                value: latest.development.testCoverage,
                threshold: 50,
                message: `Low test coverage: ${latest.development.testCoverage}%`
            });
        }

        return alerts;
    }

    getCurrentMetrics() {
        return this.metrics;
    }

    getHistory() {
        return this.history;
    }

    getSummary() {
        return this.generateSummary();
    }

    exportMetrics(format = 'json') {
        const data = {
            current: this.metrics,
            history: this.history,
            summary: this.generateSummary()
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(data);
        } else {
            throw new Error(`Unsupported format: ${format}`);
        }
    }

    convertToCSV(data) {
        // Simple CSV conversion for key metrics
        const headers = ['timestamp', 'cpu_usage', 'memory_usage', 'active_files', 'test_coverage'];
        const rows = [headers.join(',')];

        data.history.forEach(metric => {
            const row = [
                metric.timestamp,
                metric.system?.cpu?.usage || 0,
                metric.system?.memory?.usage || 0,
                metric.development?.activeFiles || 0,
                metric.development?.testCoverage || 0
            ];
            rows.push(row.join(','));
        });

        return rows.join('\n');
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'start';

    const collector = new PerformanceMetricsCollector({
        interval: 10000, // 10 seconds
        outputFile: 'performance-metrics.json'
    });

    switch (command) {
        case 'start':
            collector.start();
            break;
        case 'stop':
            collector.stop();
            break;
        case 'status':
            console.log('📊 Performance Metrics Status:');
            console.log(`Running: ${collector.isRunning}`);
            console.log(`History size: ${collector.history.length}`);
            console.log(`Current metrics:`, JSON.stringify(collector.getCurrentMetrics(), null, 2));
            break;
        case 'export':
            const format = args[1] || 'json';
            console.log(collector.exportMetrics(format));
            break;
        default:
            console.log('Usage: node performance-metrics.js [start|stop|status|export] [format]');
    }
}

module.exports = PerformanceMetricsCollector;
