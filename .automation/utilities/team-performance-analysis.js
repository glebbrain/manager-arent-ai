// Universal Automation Platform - Team Performance Analysis
// Version: 2.2 - AI Enhanced

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class TeamPerformanceAnalyzer {
    constructor(options = {}) {
        this.options = {
            outputDir: options.outputDir || 'team-analysis',
            gitRepoPath: options.gitRepoPath || process.cwd(),
            analysisPeriod: options.analysisPeriod || 30, // days
            teamMembers: options.teamMembers || [],
            metrics: options.metrics || {
                commits: true,
                codeReview: true,
                testing: true,
                documentation: true,
                collaboration: true,
                productivity: true
            },
            ...options
        };
        
        this.teamData = {};
        this.analysisResults = {};
        this.trends = {};
        
        this.init();
    }

    init() {
        console.log('👥 Initializing Team Performance Analyzer...');
        this.createOutputDirectory();
        this.detectTeamMembers();
    }

    createOutputDirectory() {
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
            console.log(`✅ Created team analysis directory: ${this.options.outputDir}`);
        }
    }

    async detectTeamMembers() {
        try {
            // Get git log to extract contributors
            const { stdout } = await execAsync('git log --pretty=format:"%an|%ae" --since="1 year ago"');
            const contributors = new Set();
            
            stdout.split('\n').forEach(line => {
                if (line.trim()) {
                    const [name, email] = line.split('|');
                    contributors.add(JSON.stringify({ name: name.trim(), email: email.trim() }));
                }
            });

            this.options.teamMembers = Array.from(contributors).map(contributor => JSON.parse(contributor));
            console.log(`👥 Detected ${this.options.teamMembers.length} team members`);
        } catch (error) {
            console.warn('⚠️ Could not detect team members from git:', error.message);
            this.options.teamMembers = [];
        }
    }

    async analyzeTeamPerformance() {
        console.log('📊 Analyzing team performance...');
        
        try {
            // Analyze each team member
            for (const member of this.options.teamMembers) {
                console.log(`👤 Analyzing ${member.name}...`);
                this.teamData[member.email] = await this.analyzeMember(member);
            }

            // Calculate team metrics
            this.analysisResults = await this.calculateTeamMetrics();
            
            // Generate trends
            this.trends = await this.generateTrends();
            
            // Save results
            await this.saveAnalysisResults();
            
            console.log('✅ Team performance analysis completed');
            return this.analysisResults;
            
        } catch (error) {
            console.error('❌ Error analyzing team performance:', error);
            throw error;
        }
    }

    async analyzeMember(member) {
        const memberData = {
            name: member.name,
            email: member.email,
            period: this.options.analysisPeriod,
            metrics: {}
        };

        try {
            // Git metrics
            if (this.options.metrics.commits) {
                memberData.metrics.commits = await this.getCommitMetrics(member);
            }

            // Code review metrics
            if (this.options.metrics.codeReview) {
                memberData.metrics.codeReview = await this.getCodeReviewMetrics(member);
            }

            // Testing metrics
            if (this.options.metrics.testing) {
                memberData.metrics.testing = await this.getTestingMetrics(member);
            }

            // Documentation metrics
            if (this.options.metrics.documentation) {
                memberData.metrics.documentation = await this.getDocumentationMetrics(member);
            }

            // Collaboration metrics
            if (this.options.metrics.collaboration) {
                memberData.metrics.collaboration = await this.getCollaborationMetrics(member);
            }

            // Productivity metrics
            if (this.options.metrics.productivity) {
                memberData.metrics.productivity = await this.getProductivityMetrics(member);
            }

            // Calculate member score
            memberData.score = this.calculateMemberScore(memberData.metrics);

        } catch (error) {
            console.warn(`⚠️ Error analyzing member ${member.name}:`, error.message);
            memberData.error = error.message;
        }

        return memberData;
    }

    async getCommitMetrics(member) {
        try {
            const since = `${this.options.analysisPeriod} days ago`;
            
            // Total commits
            const { stdout: totalCommits } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --oneline | wc -l`
            );

            // Commits by type (feat, fix, docs, etc.)
            const { stdout: commitTypes } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --pretty=format:"%s" | grep -E "^(feat|fix|docs|style|refactor|test|chore)" | cut -d: -f1 | sort | uniq -c`
            );

            // Lines added/removed
            const { stdout: linesChanged } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --pretty=tformat: --numstat | awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "add:%d,subs:%d,loc:%d", add, subs, loc }'`
            );

            // Active days
            const { stdout: activeDays } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --pretty=format:"%ad" --date=short | sort | uniq | wc -l`
            );

            // Average commits per day
            const avgCommitsPerDay = parseInt(totalCommits.trim()) / this.options.analysisPeriod;

            return {
                total: parseInt(totalCommits.trim()),
                avgPerDay: Math.round(avgCommitsPerDay * 100) / 100,
                activeDays: parseInt(activeDays.trim()),
                types: this.parseCommitTypes(commitTypes),
                linesChanged: this.parseLinesChanged(linesChanged)
            };

        } catch (error) {
            return { total: 0, avgPerDay: 0, activeDays: 0, types: {}, linesChanged: { add: 0, subs: 0, loc: 0 } };
        }
    }

    async getCodeReviewMetrics(member) {
        try {
            // This would require integration with code review platforms
            // For now, we'll use git-based heuristics
            
            const since = `${this.options.analysisPeriod} days ago`;
            
            // Commits that mention review keywords
            const { stdout: reviewCommits } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --grep="review\\|feedback\\|suggest" --oneline | wc -l`
            );

            // Commits that are merges (often indicate review process)
            const { stdout: mergeCommits } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --merges --oneline | wc -l`
            );

            return {
                reviewCommits: parseInt(reviewCommits.trim()),
                mergeCommits: parseInt(mergeCommits.trim()),
                reviewParticipation: parseInt(reviewCommits.trim()) > 0
            };

        } catch (error) {
            return { reviewCommits: 0, mergeCommits: 0, reviewParticipation: false };
        }
    }

    async getTestingMetrics(member) {
        try {
            const since = `${this.options.analysisPeriod} days ago`;
            
            // Test-related commits
            const { stdout: testCommits } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --grep="test\\|spec\\|testing" --oneline | wc -l`
            );

            // Test files modified
            const { stdout: testFiles } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --name-only --pretty=format: | grep -E "\\.(test|spec)\\.(js|ts|py|java)$" | sort | uniq | wc -l`
            );

            // Test coverage (if available)
            let testCoverage = 0;
            try {
                const { stdout: coverage } = await execAsync('npm test -- --coverage 2>/dev/null | grep "All files" | awk "{print $4}" | sed "s/%//"');
                testCoverage = parseFloat(coverage.trim()) || 0;
            } catch (error) {
                // Coverage not available
            }

            return {
                testCommits: parseInt(testCommits.trim()),
                testFilesModified: parseInt(testFiles.trim()),
                testCoverage: testCoverage,
                testingActivity: parseInt(testCommits.trim()) > 0
            };

        } catch (error) {
            return { testCommits: 0, testFilesModified: 0, testCoverage: 0, testingActivity: false };
        }
    }

    async getDocumentationMetrics(member) {
        try {
            const since = `${this.options.analysisPeriod} days ago`;
            
            // Documentation commits
            const { stdout: docCommits } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --grep="docs\\|documentation\\|readme" --oneline | wc -l`
            );

            // Documentation files modified
            const { stdout: docFiles } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --name-only --pretty=format: | grep -E "\\.(md|rst|txt|doc)$" | sort | uniq | wc -l`
            );

            // README updates
            const { stdout: readmeUpdates } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --name-only --pretty=format: | grep -i readme | wc -l`
            );

            return {
                docCommits: parseInt(docCommits.trim()),
                docFilesModified: parseInt(docFiles.trim()),
                readmeUpdates: parseInt(readmeUpdates.trim()),
                documentationActivity: parseInt(docCommits.trim()) > 0
            };

        } catch (error) {
            return { docCommits: 0, docFilesModified: 0, readmeUpdates: 0, documentationActivity: false };
        }
    }

    async getCollaborationMetrics(member) {
        try {
            const since = `${this.options.analysisPeriod} days ago`;
            
            // Co-authored commits
            const { stdout: coAuthoredCommits } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --grep="Co-authored-by" --oneline | wc -l`
            );

            // Commits with multiple authors
            const { stdout: multiAuthorCommits } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --pretty=format:"%H" | xargs -I {} git show --format="%an" {} | sort | uniq | wc -l`
            );

            // Issue references in commits
            const { stdout: issueCommits } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --grep="#[0-9]" --oneline | wc -l`
            );

            return {
                coAuthoredCommits: parseInt(coAuthoredCommits.trim()),
                multiAuthorCommits: parseInt(multiAuthorCommits.trim()),
                issueCommits: parseInt(issueCommits.trim()),
                collaborationScore: this.calculateCollaborationScore(member)
            };

        } catch (error) {
            return { coAuthoredCommits: 0, multiAuthorCommits: 0, issueCommits: 0, collaborationScore: 0 };
        }
    }

    async getProductivityMetrics(member) {
        try {
            const since = `${this.options.analysisPeriod} days ago`;
            
            // Feature commits
            const { stdout: featureCommits } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --grep="^feat:" --oneline | wc -l`
            );

            // Bug fix commits
            const { stdout: fixCommits } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --grep="^fix:" --oneline | wc -l`
            );

            // Refactoring commits
            const { stdout: refactorCommits } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --grep="^refactor:" --oneline | wc -l`
            );

            // Average commit size
            const { stdout: avgCommitSize } = await execAsync(
                `git log --author="${member.email}" --since="${since}" --pretty=tformat: --numstat | awk '{ add += $1; subs += $2 } END { printf "%.2f", (add + subs) / NR }'`
            );

            return {
                featureCommits: parseInt(featureCommits.trim()),
                fixCommits: parseInt(fixCommits.trim()),
                refactorCommits: parseInt(refactorCommits.trim()),
                avgCommitSize: parseFloat(avgCommitSize.trim()) || 0,
                productivityScore: this.calculateProductivityScore(member)
            };

        } catch (error) {
            return { featureCommits: 0, fixCommits: 0, refactorCommits: 0, avgCommitSize: 0, productivityScore: 0 };
        }
    }

    calculateMemberScore(metrics) {
        let score = 0;
        let maxScore = 0;

        // Commit activity (30% weight)
        if (metrics.commits) {
            const commitScore = Math.min(metrics.commits.total / 10, 10); // Max 10 points
            score += commitScore * 0.3;
            maxScore += 10 * 0.3;
        }

        // Testing activity (20% weight)
        if (metrics.testing) {
            const testScore = metrics.testing.testingActivity ? 10 : 0;
            score += testScore * 0.2;
            maxScore += 10 * 0.2;
        }

        // Documentation activity (15% weight)
        if (metrics.documentation) {
            const docScore = metrics.documentation.documentationActivity ? 10 : 0;
            score += docScore * 0.15;
            maxScore += 10 * 0.15;
        }

        // Collaboration (20% weight)
        if (metrics.collaboration) {
            const collabScore = Math.min(metrics.collaboration.collaborationScore, 10);
            score += collabScore * 0.2;
            maxScore += 10 * 0.2;
        }

        // Productivity (15% weight)
        if (metrics.productivity) {
            const prodScore = Math.min(metrics.productivity.productivityScore, 10);
            score += prodScore * 0.15;
            maxScore += 10 * 0.15;
        }

        return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    }

    calculateCollaborationScore(member) {
        // This would be more sophisticated in a real implementation
        // For now, return a simple score based on available metrics
        return 5; // Placeholder
    }

    calculateProductivityScore(member) {
        // This would be more sophisticated in a real implementation
        // For now, return a simple score based on available metrics
        return 5; // Placeholder
    }

    async calculateTeamMetrics() {
        const teamMetrics = {
            totalMembers: this.options.teamMembers.length,
            activeMembers: 0,
            averageScore: 0,
            topPerformers: [],
            areasForImprovement: [],
            teamTrends: {}
        };

        let totalScore = 0;
        const memberScores = [];

        Object.values(this.teamData).forEach(member => {
            if (member.score > 0) {
                teamMetrics.activeMembers++;
                totalScore += member.score;
                memberScores.push({ name: member.name, score: member.score });
            }
        });

        teamMetrics.averageScore = teamMetrics.activeMembers > 0 ? 
            Math.round(totalScore / teamMetrics.activeMembers) : 0;

        // Top performers (top 20%)
        teamMetrics.topPerformers = memberScores
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.ceil(memberScores.length * 0.2));

        // Areas for improvement
        teamMetrics.areasForImprovement = this.identifyImprovementAreas();

        return teamMetrics;
    }

    identifyImprovementAreas() {
        const areas = [];
        
        // Analyze team-wide metrics to identify improvement areas
        const teamTesting = Object.values(this.teamData)
            .filter(member => member.metrics.testing)
            .map(member => member.metrics.testing.testingActivity);
        
        const teamDocumentation = Object.values(this.teamData)
            .filter(member => member.metrics.documentation)
            .map(member => member.metrics.documentation.documentationActivity);

        if (teamTesting.filter(Boolean).length / teamTesting.length < 0.5) {
            areas.push('Testing practices need improvement');
        }

        if (teamDocumentation.filter(Boolean).length / teamDocumentation.length < 0.5) {
            areas.push('Documentation practices need improvement');
        }

        return areas;
    }

    async generateTrends() {
        // This would analyze historical data to identify trends
        // For now, return placeholder data
        return {
            commitTrend: 'increasing',
            collaborationTrend: 'stable',
            qualityTrend: 'improving'
        };
    }

    parseCommitTypes(commitTypesOutput) {
        const types = {};
        if (commitTypesOutput.trim()) {
            commitTypesOutput.split('\n').forEach(line => {
                const [count, type] = line.trim().split(/\s+/);
                if (count && type) {
                    types[type] = parseInt(count);
                }
            });
        }
        return types;
    }

    parseLinesChanged(linesChangedOutput) {
        const parts = linesChangedOutput.split(',');
        const result = { add: 0, subs: 0, loc: 0 };
        
        parts.forEach(part => {
            const [key, value] = part.split(':');
            if (key && value) {
                result[key] = parseInt(value);
            }
        });
        
        return result;
    }

    async saveAnalysisResults() {
        const results = {
            timestamp: new Date().toISOString(),
            period: this.options.analysisPeriod,
            teamData: this.teamData,
            analysisResults: this.analysisResults,
            trends: this.trends,
            config: this.options
        };

        const filename = `team-analysis-${new Date().toISOString().slice(0, 10)}.json`;
        const filepath = path.join(this.options.outputDir, filename);
        
        await fs.promises.writeFile(filepath, JSON.stringify(results, null, 2));
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
            title: 'Team Performance Analysis Report',
            generated: new Date().toISOString(),
            period: `${this.options.analysisPeriod} days`,
            summary: this.analysisResults,
            members: Object.values(this.teamData),
            trends: this.trends,
            recommendations: this.generateRecommendations()
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
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
        .score-high { color: #28a745; }
        .score-medium { color: #ffc107; }
        .score-low { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>👥 ${report.title}</h1>
        <p>Generated: ${report.generated}</p>
        <p>Analysis Period: ${report.period}</p>
    </div>

    <div class="section">
        <h2>📊 Team Summary</h2>
        <div class="metric">
            <div class="metric-value">${report.summary.totalMembers}</div>
            <div class="metric-label">Total Members</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.activeMembers}</div>
            <div class="metric-label">Active Members</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.averageScore}%</div>
            <div class="metric-label">Average Score</div>
        </div>
    </div>

    <div class="section">
        <h2>🏆 Top Performers</h2>
        <table>
            <tr><th>Name</th><th>Score</th><th>Performance Level</th></tr>
            ${report.summary.topPerformers.map(performer => `
                <tr>
                    <td>${performer.name}</td>
                    <td>${performer.score}%</td>
                    <td class="score-${performer.score >= 80 ? 'high' : performer.score >= 60 ? 'medium' : 'low'}">
                        ${performer.score >= 80 ? 'High' : performer.score >= 60 ? 'Medium' : 'Low'}
                    </td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>👥 Team Members</h2>
        <table>
            <tr><th>Name</th><th>Email</th><th>Score</th><th>Commits</th><th>Testing</th><th>Documentation</th></tr>
            ${report.members.map(member => `
                <tr>
                    <td>${member.name}</td>
                    <td>${member.email}</td>
                    <td class="score-${member.score >= 80 ? 'high' : member.score >= 60 ? 'medium' : 'low'}">${member.score}%</td>
                    <td>${member.metrics.commits?.total || 0}</td>
                    <td>${member.metrics.testing?.testingActivity ? 'Yes' : 'No'}</td>
                    <td>${member.metrics.documentation?.documentationActivity ? 'Yes' : 'No'}</td>
                </tr>
            `).join('')}
        </table>
    </div>

    <div class="section">
        <h2>📈 Areas for Improvement</h2>
        <ul>
            ${report.summary.areasForImprovement.map(area => `<li>${area}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>💡 Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    <footer style="margin-top: 40px; padding: 20px; background: #f0f0f0; border-radius: 5px; text-align: center;">
        <p>Generated by Universal Automation Platform v2.2</p>
        <p>Team Performance Analysis</p>
    </footer>
</body>
</html>`;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.analysisResults.averageScore < 70) {
            recommendations.push('Consider team training and skill development programs');
        }
        
        if (this.analysisResults.areasForImprovement.includes('Testing practices need improvement')) {
            recommendations.push('Implement mandatory testing requirements and provide testing training');
        }
        
        if (this.analysisResults.areasForImprovement.includes('Documentation practices need improvement')) {
            recommendations.push('Establish documentation standards and regular review processes');
        }
        
        if (this.analysisResults.activeMembers < this.analysisResults.totalMembers * 0.8) {
            recommendations.push('Investigate inactive team members and provide support');
        }
        
        return recommendations;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'analyze';

    const analyzer = new TeamPerformanceAnalyzer({
        outputDir: 'team-analysis',
        analysisPeriod: 30
    });

    switch (command) {
        case 'analyze':
            analyzer.analyzeTeamPerformance().then(() => {
                console.log('✅ Team performance analysis completed');
            });
            break;
        case 'report':
            analyzer.analyzeTeamPerformance().then(() => {
                const report = analyzer.generateReport('html');
                console.log(report);
            });
            break;
        default:
            console.log('Usage: node team-performance-analysis.js [analyze|report]');
    }
}

module.exports = TeamPerformanceAnalyzer;
