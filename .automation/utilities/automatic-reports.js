// Universal Automation Platform - Automatic Reports System
// Version: 2.2 - AI Enhanced

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class AutomaticReportsGenerator {
    constructor(options = {}) {
        this.options = {
            outputDir: options.outputDir || 'reports',
            schedule: options.schedule || '0 9 * * *', // Daily at 9 AM
            formats: options.formats || ['html', 'json', 'pdf'],
            templates: options.templates || {},
            email: options.email || null,
            webhook: options.webhook || null,
            ...options
        };
        
        this.reports = [];
        this.schedules = new Map();
        this.isRunning = false;
        
        this.init();
    }

    init() {
        console.log('📊 Initializing Automatic Reports Generator...');
        this.createOutputDirectory();
        this.loadTemplates();
        this.setupSchedules();
    }

    createOutputDirectory() {
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
            console.log(`✅ Created reports directory: ${this.options.outputDir}`);
        }
    }

    loadTemplates() {
        const templatesDir = path.join(__dirname, 'templates');
        if (fs.existsSync(templatesDir)) {
            const templateFiles = fs.readdirSync(templatesDir);
            templateFiles.forEach(file => {
                if (file.endsWith('.json')) {
                    const template = JSON.parse(fs.readFileSync(path.join(templatesDir, file), 'utf8'));
                    this.options.templates[file.replace('.json', '')] = template;
                }
            });
        }
    }

    setupSchedules() {
        // Daily report at 9 AM
        this.schedules.set('daily', {
            cron: '0 9 * * *',
            template: 'daily',
            enabled: true
        });

        // Weekly report on Monday at 10 AM
        this.schedules.set('weekly', {
            cron: '0 10 * * 1',
            template: 'weekly',
            enabled: true
        });

        // Monthly report on 1st at 11 AM
        this.schedules.set('monthly', {
            cron: '0 11 1 * *',
            template: 'monthly',
            enabled: true
        });
    }

    async start() {
        if (this.isRunning) {
            console.log('⚠️ Automatic Reports Generator is already running');
            return;
        }

        console.log('🚀 Starting Automatic Reports Generator...');
        this.isRunning = true;

        // Generate initial reports
        await this.generateAllReports();

        // Start scheduled generation
        this.startScheduler();

        console.log('✅ Automatic Reports Generator started');
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('🛑 Stopping Automatic Reports Generator...');
        this.isRunning = false;

        // Clear all intervals
        this.schedules.forEach(schedule => {
            if (schedule.intervalId) {
                clearInterval(schedule.intervalId);
            }
        });

        console.log('✅ Automatic Reports Generator stopped');
    }

    startScheduler() {
        this.schedules.forEach((schedule, name) => {
            if (schedule.enabled) {
                this.scheduleReport(name, schedule);
            }
        });
    }

    scheduleReport(name, schedule) {
        // Simple interval-based scheduling (in production, use node-cron)
        const interval = this.parseCronToInterval(schedule.cron);
        if (interval > 0) {
            schedule.intervalId = setInterval(async () => {
                console.log(`📊 Generating scheduled report: ${name}`);
                await this.generateReport(name, schedule.template);
            }, interval);
        }
    }

    parseCronToInterval(cron) {
        // Simplified cron parsing - in production, use proper cron parser
        const parts = cron.split(' ');
        const minute = parts[0];
        const hour = parts[1];
        const day = parts[2];
        const month = parts[3];
        const weekday = parts[4];

        // For daily reports, return 24 hours in milliseconds
        if (minute === '0' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
            return 24 * 60 * 60 * 1000;
        }

        // For weekly reports, return 7 days in milliseconds
        if (minute === '0' && hour !== '*' && day === '*' && month === '*' && weekday !== '*') {
            return 7 * 24 * 60 * 60 * 1000;
        }

        // For monthly reports, return 30 days in milliseconds
        if (minute === '0' && hour !== '*' && day !== '*' && month === '*' && weekday === '*') {
            return 30 * 24 * 60 * 60 * 1000;
        }

        return 0;
    }

    async generateAllReports() {
        console.log('📊 Generating all reports...');
        
        for (const [name, schedule] of this.schedules) {
            if (schedule.enabled) {
                await this.generateReport(name, schedule.template);
            }
        }
    }

    async generateReport(name, templateName) {
        try {
            console.log(`📊 Generating ${name} report...`);
            
            const template = this.options.templates[templateName] || this.getDefaultTemplate(templateName);
            const data = await this.collectReportData(template);
            const timestamp = new Date().toISOString().slice(0, 10);
            
            const report = {
                name,
                template: templateName,
                timestamp,
                data,
                generated: new Date().toISOString()
            };

            // Generate in all requested formats
            for (const format of this.options.formats) {
                const filename = `${name}-report-${timestamp}.${format}`;
                const filepath = path.join(this.options.outputDir, filename);
                
                switch (format) {
                    case 'html':
                        await this.generateHTMLReport(report, filepath);
                        break;
                    case 'json':
                        await this.generateJSONReport(report, filepath);
                        break;
                    case 'pdf':
                        await this.generatePDFReport(report, filepath);
                        break;
                }
            }

            this.reports.push(report);
            console.log(`✅ ${name} report generated successfully`);

        } catch (error) {
            console.error(`❌ Failed to generate ${name} report:`, error);
        }
    }

    async collectReportData(template) {
        const data = {
            system: await this.getSystemData(),
            project: await this.getProjectData(),
            performance: await this.getPerformanceData(),
            quality: await this.getQualityData(),
            development: await this.getDevelopmentData(),
            git: await this.getGitData(),
            build: await this.getBuildData()
        };

        return data;
    }

    async getSystemData() {
        const os = require('os');
        return {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            uptime: process.uptime(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem()
            },
            cpus: os.cpus().length
        };
    }

    async getProjectData() {
        const projectPath = process.cwd();
        const packageJsonPath = path.join(projectPath, 'package.json');
        
        let packageInfo = {};
        if (fs.existsSync(packageJsonPath)) {
            packageInfo = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        }

        return {
            name: packageInfo.name || path.basename(projectPath),
            version: packageInfo.version || '1.0.0',
            path: projectPath,
            dependencies: Object.keys(packageInfo.dependencies || {}).length,
            devDependencies: Object.keys(packageInfo.devDependencies || {}).length
        };
    }

    async getPerformanceData() {
        const metricsFile = 'performance-metrics.json';
        if (fs.existsSync(metricsFile)) {
            const data = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
            return data.current || {};
        }
        return {};
    }

    async getQualityData() {
        // Check for quality tools and configurations
        const projectPath = process.cwd();
        const quality = {
            linting: false,
            testing: false,
            typeChecking: false,
            security: false
        };

        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
            const scripts = packageJson.scripts || {};
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

            quality.linting = !!(scripts.lint || dependencies.eslint || dependencies.prettier);
            quality.testing = !!(scripts.test || dependencies.jest || dependencies.mocha);
            quality.typeChecking = !!(dependencies.typescript || dependencies['@types/node']);
            quality.security = !!(dependencies.audit || dependencies.snyk);
        } catch (error) {
            // Ignore errors
        }

        return quality;
    }

    async getDevelopmentData() {
        const projectPath = process.cwd();
        const stats = await this.getDirectoryStats(projectPath);
        
        return {
            fileCount: stats.fileCount,
            directoryCount: stats.directoryCount,
            totalSize: stats.size,
            languages: stats.languages,
            lastModified: stats.lastModified
        };
    }

    async getGitData() {
        try {
            const { stdout: branch } = await execAsync('git branch --show-current');
            const { stdout: commitCount } = await execAsync('git rev-list --count HEAD');
            const { stdout: lastCommit } = await execAsync('git log -1 --format=%H');
            const { stdout: lastCommitDate } = await execAsync('git log -1 --format=%ci');
            
            return {
                branch: branch.trim(),
                commitCount: parseInt(commitCount.trim()),
                lastCommit: lastCommit.trim(),
                lastCommitDate: lastCommitDate.trim()
            };
        } catch (error) {
            return {
                branch: 'unknown',
                commitCount: 0,
                lastCommit: 'unknown',
                lastCommitDate: 'unknown'
            };
        }
    }

    async getBuildData() {
        const projectPath = process.cwd();
        const buildArtifacts = ['dist', 'build', '.next', 'out', 'target'];
        
        for (const artifact of buildArtifacts) {
            const artifactPath = path.join(projectPath, artifact);
            if (fs.existsSync(artifactPath)) {
                const stats = fs.statSync(artifactPath);
                return {
                    lastBuild: stats.mtime.toISOString(),
                    artifact: artifact
                };
            }
        }

        return { lastBuild: null, artifact: null };
    }

    async getDirectoryStats(dirPath) {
        let totalSize = 0;
        let fileCount = 0;
        let directoryCount = 0;
        let languages = {};
        let lastModified = 0;

        const processDirectory = async (currentPath) => {
            try {
                const items = await fs.promises.readdir(currentPath, { withFileTypes: true });
                
                for (const item of items) {
                    const itemPath = path.join(currentPath, item.name);
                    
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

                        // Count languages
                        const ext = path.extname(item.name).toLowerCase();
                        const langMap = {
                            '.js': 'JavaScript',
                            '.ts': 'TypeScript',
                            '.py': 'Python',
                            '.java': 'Java',
                            '.cpp': 'C++',
                            '.c': 'C',
                            '.cs': 'C#',
                            '.php': 'PHP',
                            '.rb': 'Ruby',
                            '.go': 'Go',
                            '.rs': 'Rust'
                        };
                        
                        if (langMap[ext]) {
                            languages[langMap[ext]] = (languages[langMap[ext]] || 0) + 1;
                        }
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
            languages,
            lastModified: new Date(lastModified).toISOString()
        };
    }

    async generateHTMLReport(report, filepath) {
        const html = this.generateHTMLTemplate(report);
        await fs.promises.writeFile(filepath, html, 'utf8');
    }

    async generateJSONReport(report, filepath) {
        await fs.promises.writeFile(filepath, JSON.stringify(report, null, 2), 'utf8');
    }

    async generatePDFReport(report, filepath) {
        // In production, use a library like puppeteer or wkhtmltopdf
        console.log('⚠️ PDF generation not implemented - saving as HTML instead');
        const html = this.generateHTMLTemplate(report);
        const htmlPath = filepath.replace('.pdf', '.html');
        await fs.promises.writeFile(htmlPath, html, 'utf8');
    }

    generateHTMLTemplate(report) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.name} Report - ${report.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f9f9f9; border-radius: 3px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007acc; }
        .metric-label { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
        .status-ok { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 ${report.name} Report</h1>
        <p>Generated: ${report.generated}</p>
        <p>Template: ${report.template}</p>
    </div>

    <div class="section">
        <h2>🖥️ System Information</h2>
        <div class="metric">
            <div class="metric-value">${report.data.system.platform}</div>
            <div class="metric-label">Platform</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.data.system.nodeVersion}</div>
            <div class="metric-label">Node.js Version</div>
        </div>
        <div class="metric">
            <div class="metric-value">${Math.round(report.data.system.memory.used / 1024 / 1024 / 1024)}GB</div>
            <div class="metric-label">Memory Used</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.data.system.cpus}</div>
            <div class="metric-label">CPU Cores</div>
        </div>
    </div>

    <div class="section">
        <h2>📁 Project Information</h2>
        <p><strong>Name:</strong> ${report.data.project.name}</p>
        <p><strong>Version:</strong> ${report.data.project.version}</p>
        <p><strong>Dependencies:</strong> ${report.data.project.dependencies}</p>
        <p><strong>Dev Dependencies:</strong> ${report.data.project.devDependencies}</p>
    </div>

    <div class="section">
        <h2>📈 Development Metrics</h2>
        <div class="metric">
            <div class="metric-value">${report.data.development.fileCount}</div>
            <div class="metric-label">Files</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.data.development.directoryCount}</div>
            <div class="metric-label">Directories</div>
        </div>
        <div class="metric">
            <div class="metric-value">${Math.round(report.data.development.totalSize / 1024)}KB</div>
            <div class="metric-label">Total Size</div>
        </div>
    </div>

    <div class="section">
        <h2>🔧 Quality Metrics</h2>
        <p><strong>Linting:</strong> <span class="status-${report.data.quality.linting ? 'ok' : 'error'}">${report.data.quality.linting ? 'Enabled' : 'Disabled'}</span></p>
        <p><strong>Testing:</strong> <span class="status-${report.data.quality.testing ? 'ok' : 'error'}">${report.data.quality.testing ? 'Enabled' : 'Disabled'}</span></p>
        <p><strong>Type Checking:</strong> <span class="status-${report.data.quality.typeChecking ? 'ok' : 'error'}">${report.data.quality.typeChecking ? 'Enabled' : 'Disabled'}</span></p>
        <p><strong>Security:</strong> <span class="status-${report.data.quality.security ? 'ok' : 'error'}">${report.data.quality.security ? 'Enabled' : 'Disabled'}</span></p>
    </div>

    <div class="section">
        <h2>📊 Git Information</h2>
        <p><strong>Branch:</strong> ${report.data.git.branch}</p>
        <p><strong>Commits:</strong> ${report.data.git.commitCount}</p>
        <p><strong>Last Commit:</strong> ${report.data.git.lastCommitDate}</p>
    </div>

    <div class="section">
        <h2>🏗️ Build Information</h2>
        <p><strong>Last Build:</strong> ${report.data.build.lastBuild || 'No build artifacts found'}</p>
        <p><strong>Artifact:</strong> ${report.data.build.artifact || 'None'}</p>
    </div>

    <div class="section">
        <h2>💻 Languages Used</h2>
        <table>
            <tr><th>Language</th><th>Files</th></tr>
            ${Object.entries(report.data.development.languages).map(([lang, count]) => 
                `<tr><td>${lang}</td><td>${count}</td></tr>`
            ).join('')}
        </table>
    </div>

    <div class="section">
        <h2>📋 Performance Data</h2>
        ${report.data.performance.cpu ? `
        <div class="metric">
            <div class="metric-value">${report.data.performance.cpu.usage}%</div>
            <div class="metric-label">CPU Usage</div>
        </div>
        ` : ''}
        ${report.data.performance.memory ? `
        <div class="metric">
            <div class="metric-value">${report.data.performance.memory.usage}%</div>
            <div class="metric-label">Memory Usage</div>
        </div>
        ` : ''}
    </div>

    <footer style="margin-top: 40px; padding: 20px; background: #f0f0f0; border-radius: 5px; text-align: center;">
        <p>Generated by Universal Automation Platform v2.2</p>
        <p>Report ID: ${report.name}-${report.timestamp}</p>
    </footer>
</body>
</html>`;
    }

    getDefaultTemplate(templateName) {
        const templates = {
            daily: {
                name: 'Daily Development Report',
                sections: ['system', 'project', 'performance', 'quality', 'development', 'git'],
                format: 'html'
            },
            weekly: {
                name: 'Weekly Project Summary',
                sections: ['system', 'project', 'performance', 'quality', 'development', 'git', 'build'],
                format: 'html'
            },
            monthly: {
                name: 'Monthly Project Analysis',
                sections: ['system', 'project', 'performance', 'quality', 'development', 'git', 'build'],
                format: 'html'
            }
        };

        return templates[templateName] || templates.daily;
    }

    getReports() {
        return this.reports;
    }

    getSchedules() {
        return Array.from(this.schedules.entries()).map(([name, schedule]) => ({
            name,
            cron: schedule.cron,
            template: schedule.template,
            enabled: schedule.enabled
        }));
    }

    updateSchedule(name, updates) {
        if (this.schedules.has(name)) {
            const schedule = this.schedules.get(name);
            Object.assign(schedule, updates);
            this.schedules.set(name, schedule);
            return true;
        }
        return false;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'start';

    const generator = new AutomaticReportsGenerator({
        outputDir: 'reports',
        formats: ['html', 'json']
    });

    switch (command) {
        case 'start':
            generator.start();
            break;
        case 'stop':
            generator.stop();
            break;
        case 'generate':
            generator.generateAllReports();
            break;
        case 'status':
            console.log('📊 Automatic Reports Generator Status:');
            console.log(`Running: ${generator.isRunning}`);
            console.log(`Reports generated: ${generator.getReports().length}`);
            console.log(`Schedules: ${generator.getSchedules().length}`);
            break;
        default:
            console.log('Usage: node automatic-reports.js [start|stop|generate|status]');
    }
}

module.exports = AutomaticReportsGenerator;
