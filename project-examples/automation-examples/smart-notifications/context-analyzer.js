/**
 * Context Analyzer
 * AI-powered analysis of notification context for intelligent routing
 */

class ContextAnalyzer {
    constructor(options = {}) {
        this.analysisInterval = options.analysisInterval || 60000;
        this.contextWindow = options.contextWindow || 300000; // 5 minutes
        this.learningRate = options.learningRate || 0.1;
        this.confidenceThreshold = options.confidenceThreshold || 0.7;
        
        this.contextHistory = [];
        this.patterns = new Map();
        this.userPreferences = new Map();
        this.accuracy = 0.5;
        this.isRunning = true;
        
        this.startAnalysis();
    }

    /**
     * Analyze context for a notification
     */
    async analyzeContext(event, context) {
        const analysis = {
            original: context,
            analyzed: true,
            timestamp: new Date(),
            confidence: 0.5,
            insights: {},
            recommendations: [],
            priority: this.determinePriority(event, context),
            urgency: this.calculateUrgency(event, context),
            relevance: this.calculateRelevance(event, context),
            sentiment: this.analyzeSentiment(context),
            keywords: this.extractKeywords(context),
            patterns: this.identifyPatterns(event, context),
            userContext: this.analyzeUserContext(context),
            timeContext: this.analyzeTimeContext(context)
        };
        
        // Calculate overall confidence
        analysis.confidence = this.calculateConfidence(analysis);
        
        // Generate insights
        analysis.insights = this.generateInsights(analysis);
        
        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);
        
        // Store for learning
        this.contextHistory.push(analysis);
        this.updatePatterns(analysis);
        
        return analysis;
    }

    /**
     * Determine notification priority
     */
    determinePriority(event, context) {
        const priorityFactors = {
            'system_error': 0.9,
            'deadline_approaching': 0.8,
            'task_failed': 0.7,
            'performance_alert': 0.6,
            'task_completed': 0.4,
            'team_update': 0.3,
            'reminder': 0.2
        };
        
        let basePriority = priorityFactors[event] || 0.5;
        
        // Adjust based on context
        if (context.severity === 'critical') basePriority += 0.3;
        if (context.severity === 'high') basePriority += 0.2;
        if (context.severity === 'medium') basePriority += 0.1;
        
        if (context.impact === 'high') basePriority += 0.2;
        if (context.impact === 'medium') basePriority += 0.1;
        
        if (context.urgent) basePriority += 0.2;
        if (context.important) basePriority += 0.1;
        
        return Math.min(1.0, Math.max(0.0, basePriority));
    }

    /**
     * Calculate urgency score
     */
    calculateUrgency(event, context) {
        let urgency = 0.5;
        
        // Time-based urgency
        if (context.deadline) {
            const now = new Date();
            const deadline = new Date(context.deadline);
            const timeDiff = deadline - now;
            const hoursRemaining = timeDiff / (1000 * 60 * 60);
            
            if (hoursRemaining < 1) urgency = 0.9;
            else if (hoursRemaining < 4) urgency = 0.8;
            else if (hoursRemaining < 24) urgency = 0.7;
            else if (hoursRemaining < 72) urgency = 0.6;
        }
        
        // Event-based urgency
        const urgentEvents = ['system_error', 'deadline_approaching', 'task_failed'];
        if (urgentEvents.includes(event)) urgency += 0.3;
        
        // Context-based urgency
        if (context.urgent) urgency += 0.2;
        if (context.critical) urgency += 0.3;
        
        return Math.min(1.0, Math.max(0.0, urgency));
    }

    /**
     * Calculate relevance score
     */
    calculateRelevance(event, context) {
        let relevance = 0.5;
        
        // User-specific relevance
        if (context.userId) {
            const userPrefs = this.userPreferences.get(context.userId);
            if (userPrefs) {
                relevance = userPrefs.getRelevance(event, context);
            }
        }
        
        // Event-specific relevance
        const relevantEvents = ['task_completed', 'deadline_approaching', 'team_update'];
        if (relevantEvents.includes(event)) relevance += 0.2;
        
        // Content relevance
        if (context.keywords && context.keywords.length > 0) {
            relevance += 0.1;
        }
        
        return Math.min(1.0, Math.max(0.0, relevance));
    }

    /**
     * Analyze sentiment
     */
    analyzeSentiment(context) {
        const positiveWords = ['completed', 'success', 'good', 'excellent', 'great', 'done'];
        const negativeWords = ['error', 'failed', 'critical', 'urgent', 'problem', 'issue'];
        
        const text = JSON.stringify(context).toLowerCase();
        let sentiment = 0.5;
        
        positiveWords.forEach(word => {
            if (text.includes(word)) sentiment += 0.1;
        });
        
        negativeWords.forEach(word => {
            if (text.includes(word)) sentiment -= 0.1;
        });
        
        return Math.min(1.0, Math.max(0.0, sentiment));
    }

    /**
     * Extract keywords
     */
    extractKeywords(context) {
        const keywords = [];
        
        // Extract from common fields
        if (context.taskTitle) keywords.push(...this.extractWords(context.taskTitle));
        if (context.message) keywords.push(...this.extractWords(context.message));
        if (context.description) keywords.push(...this.extractWords(context.description));
        
        // Extract from tags
        if (context.tags) keywords.push(...context.tags);
        
        // Remove duplicates and common words
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        return [...new Set(keywords)].filter(word => 
            word.length > 2 && !commonWords.includes(word.toLowerCase())
        );
    }

    /**
     * Extract words from text
     */
    extractWords(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    /**
     * Identify patterns
     */
    identifyPatterns(event, context) {
        const patterns = [];
        
        // Time patterns
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 17) {
            patterns.push('business_hours');
        } else {
            patterns.push('after_hours');
        }
        
        // Frequency patterns
        const recentEvents = this.contextHistory.filter(h => 
            h.original.event === event && 
            Date.now() - new Date(h.timestamp).getTime() < this.contextWindow
        );
        
        if (recentEvents.length > 5) {
            patterns.push('high_frequency');
        } else if (recentEvents.length > 2) {
            patterns.push('medium_frequency');
        } else {
            patterns.push('low_frequency');
        }
        
        // Content patterns
        if (context.severity === 'critical') patterns.push('critical_severity');
        if (context.urgent) patterns.push('urgent_content');
        if (context.userId) patterns.push('user_specific');
        
        return patterns;
    }

    /**
     * Analyze user context
     */
    analyzeUserContext(context) {
        if (!context.userId) return null;
        
        const userPrefs = this.userPreferences.get(context.userId) || {
            preferredChannels: ['email'],
            quietHours: { start: 22, end: 8 },
            priorityThreshold: 0.5,
            frequency: 'normal'
        };
        
        return {
            userId: context.userId,
            preferences: userPrefs,
            lastActive: this.getLastActiveTime(context.userId),
            notificationHistory: this.getUserNotificationHistory(context.userId)
        };
    }

    /**
     * Analyze time context
     */
    analyzeTimeContext(context) {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        
        return {
            timestamp: now,
            hour,
            dayOfWeek,
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            isBusinessHours: hour >= 9 && hour <= 17,
            isQuietHours: hour >= 22 || hour <= 8,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    /**
     * Calculate overall confidence
     */
    calculateConfidence(analysis) {
        let confidence = 0.5;
        
        // Base confidence on data quality
        if (analysis.keywords.length > 0) confidence += 0.1;
        if (analysis.patterns.length > 0) confidence += 0.1;
        if (analysis.userContext) confidence += 0.1;
        
        // Adjust based on consistency
        const similarContexts = this.findSimilarContexts(analysis);
        if (similarContexts.length > 0) {
            const avgConfidence = similarContexts.reduce((sum, c) => sum + c.confidence, 0) / similarContexts.length;
            confidence = (confidence + avgConfidence) / 2;
        }
        
        return Math.min(1.0, Math.max(0.0, confidence));
    }

    /**
     * Generate insights
     */
    generateInsights(analysis) {
        const insights = {};
        
        if (analysis.urgency > 0.8) {
            insights.urgent = 'This notification is highly urgent and should be delivered immediately';
        }
        
        if (analysis.priority > 0.8) {
            insights.highPriority = 'This notification has high priority and should be escalated';
        }
        
        if (analysis.sentiment < 0.3) {
            insights.negative = 'This notification contains negative sentiment and may require attention';
        }
        
        if (analysis.patterns.includes('high_frequency')) {
            insights.frequent = 'This type of notification has been sent frequently recently';
        }
        
        if (analysis.timeContext.isQuietHours) {
            insights.quietHours = 'This notification is being sent during quiet hours';
        }
        
        return insights;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.urgency > 0.8) {
            recommendations.push({
                type: 'delivery',
                action: 'Send immediately via high-priority channels',
                priority: 'high'
            });
        }
        
        if (analysis.priority > 0.8) {
            recommendations.push({
                type: 'escalation',
                action: 'Escalate to management or senior team members',
                priority: 'high'
            });
        }
        
        if (analysis.timeContext.isQuietHours && analysis.priority < 0.7) {
            recommendations.push({
                type: 'timing',
                action: 'Consider delaying until business hours',
                priority: 'medium'
            });
        }
        
        if (analysis.patterns.includes('high_frequency')) {
            recommendations.push({
                type: 'frequency',
                action: 'Consider batching or reducing frequency',
                priority: 'medium'
            });
        }
        
        if (analysis.sentiment < 0.3) {
            recommendations.push({
                type: 'tone',
                action: 'Use empathetic and supportive language',
                priority: 'low'
            });
        }
        
        return recommendations;
    }

    /**
     * Find similar contexts
     */
    findSimilarContexts(analysis) {
        return this.contextHistory.filter(h => {
            const timeDiff = Date.now() - new Date(h.timestamp).getTime();
            return timeDiff < this.contextWindow && 
                   h.original.event === analysis.original.event &&
                   this.calculateSimilarity(h, analysis) > 0.7;
        });
    }

    /**
     * Calculate similarity between contexts
     */
    calculateSimilarity(context1, context2) {
        const keywords1 = new Set(context1.keywords || []);
        const keywords2 = new Set(context2.keywords || []);
        
        const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
        const union = new Set([...keywords1, ...keywords2]);
        
        return intersection.size / union.size;
    }

    /**
     * Update patterns
     */
    updatePatterns(analysis) {
        const patternKey = `${analysis.original.event}_${analysis.patterns.join('_')}`;
        
        if (!this.patterns.has(patternKey)) {
            this.patterns.set(patternKey, {
                count: 0,
                avgConfidence: 0,
                avgUrgency: 0,
                avgPriority: 0
            });
        }
        
        const pattern = this.patterns.get(patternKey);
        pattern.count++;
        pattern.avgConfidence = (pattern.avgConfidence * (pattern.count - 1) + analysis.confidence) / pattern.count;
        pattern.avgUrgency = (pattern.avgUrgency * (pattern.count - 1) + analysis.urgency) / pattern.count;
        pattern.avgPriority = (pattern.avgPriority * (pattern.count - 1) + analysis.priority) / pattern.count;
    }

    /**
     * Get last active time for user
     */
    getLastActiveTime(userId) {
        const userContexts = this.contextHistory.filter(h => h.original.userId === userId);
        if (userContexts.length === 0) return null;
        
        return userContexts[userContexts.length - 1].timestamp;
    }

    /**
     * Get user notification history
     */
    getUserNotificationHistory(userId) {
        return this.contextHistory.filter(h => h.original.userId === userId).length;
    }

    /**
     * Start analysis process
     */
    startAnalysis() {
        setInterval(() => {
            this.updateAnalysis();
        }, this.analysisInterval);
    }

    /**
     * Update analysis
     */
    updateAnalysis() {
        // Clean up old context history
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        this.contextHistory = this.contextHistory.filter(h => 
            new Date(h.timestamp).getTime() > cutoffTime
        );
        
        // Update accuracy based on feedback
        this.updateAccuracy();
    }

    /**
     * Update accuracy
     */
    updateAccuracy() {
        // This would typically be updated based on user feedback
        // For now, we'll simulate some learning
        const recentContexts = this.contextHistory.slice(-10);
        if (recentContexts.length > 0) {
            const avgConfidence = recentContexts.reduce((sum, c) => sum + c.confidence, 0) / recentContexts.length;
            this.accuracy = (this.accuracy + avgConfidence) / 2;
        }
    }

    /**
     * Get current accuracy
     */
    getAccuracy() {
        return this.accuracy;
    }

    /**
     * Stop the context analyzer
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = ContextAnalyzer;
