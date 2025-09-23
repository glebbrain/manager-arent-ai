/**
 * Intelligent Router
 * AI-powered routing of notifications to appropriate recipients and channels
 */

class IntelligentRouter {
    constructor(options = {}) {
        this.intelligentRouting = options.intelligentRouting || true;
        this.userPreferences = options.userPreferences || true;
        this.escalationRules = options.escalationRules || true;
        this.deduplication = options.deduplication || true;
        
        this.rules = new Map();
        this.userProfiles = new Map();
        this.escalationChains = new Map();
        this.deliveryHistory = [];
        this.efficiency = 0.5;
        
        this.initializeDefaultRules();
        this.initializeEscalationChains();
    }

    /**
     * Determine recipients for a notification
     */
    async determineRecipients(event, context) {
        let recipients = [];
        
        // Start with basic recipient determination
        recipients = this.getBasicRecipients(event, context);
        
        // Apply intelligent routing if enabled
        if (this.intelligentRouting) {
            recipients = await this.applyIntelligentRouting(recipients, event, context);
        }
        
        // Apply user preferences if enabled
        if (this.userPreferences) {
            recipients = this.applyUserPreferences(recipients, event, context);
        }
        
        // Apply escalation rules if enabled
        if (this.escalationRules) {
            recipients = this.applyEscalationRules(recipients, event, context);
        }
        
        // Apply deduplication if enabled
        if (this.deduplication) {
            recipients = this.applyDeduplication(recipients);
        }
        
        return recipients;
    }

    /**
     * Get basic recipients based on event type
     */
    getBasicRecipients(event, context) {
        const recipients = [];
        
        // Add direct recipients from context
        if (context.recipients) {
            recipients.push(...context.recipients);
        }
        
        // Add user-specific recipients
        if (context.userId) {
            recipients.push({
                id: context.userId,
                type: 'user',
                channels: ['email', 'push']
            });
        }
        
        // Add team members for team events
        if (context.teamId) {
            const teamMembers = this.getTeamMembers(context.teamId);
            recipients.push(...teamMembers);
        }
        
        // Add project stakeholders for project events
        if (context.projectId) {
            const stakeholders = this.getProjectStakeholders(context.projectId);
            recipients.push(...stakeholders);
        }
        
        // Add default recipients based on event type
        const defaultRecipients = this.getDefaultRecipients(event);
        recipients.push(...defaultRecipients);
        
        return recipients;
    }

    /**
     * Apply intelligent routing
     */
    async applyIntelligentRouting(recipients, event, context) {
        const enhancedRecipients = [];
        
        for (const recipient of recipients) {
            const profile = this.getUserProfile(recipient.id);
            const routingScore = this.calculateRoutingScore(recipient, event, context, profile);
            
            if (routingScore > 0.5) {
                enhancedRecipients.push({
                    ...recipient,
                    routingScore,
                    channels: this.selectOptimalChannels(recipient, event, context, profile),
                    priority: this.calculateRecipientPriority(recipient, event, context)
                });
            }
        }
        
        // Sort by routing score
        return enhancedRecipients.sort((a, b) => b.routingScore - a.routingScore);
    }

    /**
     * Apply user preferences
     */
    applyUserPreferences(recipients, event, context) {
        return recipients.map(recipient => {
            const profile = this.getUserProfile(recipient.id);
            if (!profile || !profile.preferences) return recipient;
            
            const prefs = profile.preferences;
            
            // Filter channels based on user preferences
            let channels = recipient.channels || ['email'];
            if (prefs.preferredChannels) {
                channels = channels.filter(channel => prefs.preferredChannels.includes(channel));
            }
            
            // Apply quiet hours
            if (prefs.quietHours && this.isQuietHours()) {
                channels = channels.filter(channel => prefs.quietHours.allowedChannels?.includes(channel) || false);
            }
            
            // Apply frequency limits
            if (prefs.frequency === 'low' && this.isHighFrequency(recipient.id)) {
                channels = channels.filter(channel => channel === 'email'); // Only email for low frequency
            }
            
            return {
                ...recipient,
                channels,
                preferences: prefs
            };
        });
    }

    /**
     * Apply escalation rules
     */
    applyEscalationRules(recipients, event, context) {
        const escalatedRecipients = [...recipients];
        
        // Check if escalation is needed
        if (this.shouldEscalate(event, context)) {
            const escalationChain = this.getEscalationChain(event, context);
            
            for (const level of escalationChain) {
                const escalationRecipients = this.getEscalationRecipients(level, event, context);
                escalatedRecipients.push(...escalationRecipients);
            }
        }
        
        return escalatedRecipients;
    }

    /**
     * Apply deduplication
     */
    applyDeduplication(recipients) {
        const uniqueRecipients = new Map();
        
        for (const recipient of recipients) {
            const key = `${recipient.id}_${recipient.type}`;
            if (!uniqueRecipients.has(key)) {
                uniqueRecipients.set(key, recipient);
            } else {
                // Merge channels if duplicate
                const existing = uniqueRecipients.get(key);
                existing.channels = [...new Set([...existing.channels, ...recipient.channels])];
            }
        }
        
        return Array.from(uniqueRecipients.values());
    }

    /**
     * Calculate routing score
     */
    calculateRoutingScore(recipient, event, context, profile) {
        let score = 0.5; // Base score
        
        if (!profile) return score;
        
        // Event relevance
        const eventRelevance = this.getEventRelevance(recipient, event, profile);
        score += eventRelevance * 0.3;
        
        // Context relevance
        const contextRelevance = this.getContextRelevance(recipient, context, profile);
        score += contextRelevance * 0.2;
        
        // User activity
        const activityScore = this.getActivityScore(recipient, profile);
        score += activityScore * 0.2;
        
        // Time relevance
        const timeScore = this.getTimeRelevance(recipient, profile);
        score += timeScore * 0.1;
        
        // Priority match
        const priorityScore = this.getPriorityMatch(recipient, event, context, profile);
        score += priorityScore * 0.2;
        
        return Math.min(1.0, Math.max(0.0, score));
    }

    /**
     * Select optimal channels
     */
    selectOptimalChannels(recipient, event, context, profile) {
        const availableChannels = recipient.channels || ['email'];
        const optimalChannels = [];
        
        // Priority-based channel selection
        const priority = this.calculateRecipientPriority(recipient, event, context);
        
        if (priority >= 0.8) {
            // High priority - use multiple channels
            optimalChannels.push('email', 'push', 'sms');
        } else if (priority >= 0.6) {
            // Medium priority - use email and push
            optimalChannels.push('email', 'push');
        } else {
            // Low priority - use email only
            optimalChannels.push('email');
        }
        
        // Filter by available channels
        return optimalChannels.filter(channel => availableChannels.includes(channel));
    }

    /**
     * Calculate recipient priority
     */
    calculateRecipientPriority(recipient, event, context) {
        let priority = 0.5;
        
        // Event-based priority
        const eventPriority = this.getEventPriority(event);
        priority += eventPriority * 0.3;
        
        // Context-based priority
        if (context.urgent) priority += 0.2;
        if (context.critical) priority += 0.3;
        if (context.important) priority += 0.1;
        
        // Recipient role priority
        const rolePriority = this.getRolePriority(recipient);
        priority += rolePriority * 0.2;
        
        return Math.min(1.0, Math.max(0.0, priority));
    }

    /**
     * Get user profile
     */
    getUserProfile(userId) {
        if (!this.userProfiles.has(userId)) {
            this.userProfiles.set(userId, {
                id: userId,
                preferences: {
                    preferredChannels: ['email'],
                    quietHours: { start: 22, end: 8 },
                    priorityThreshold: 0.5,
                    frequency: 'normal'
                },
                activity: {
                    lastActive: new Date(),
                    notificationCount: 0,
                    responseRate: 0.5
                },
                roles: ['user'],
                skills: [],
                timezone: 'UTC'
            });
        }
        
        return this.userProfiles.get(userId);
    }

    /**
     * Get team members
     */
    getTeamMembers(teamId) {
        // This would typically query a database
        return [
            { id: 'team_lead', type: 'user', channels: ['email', 'slack'] },
            { id: 'senior_dev', type: 'user', channels: ['email', 'push'] }
        ];
    }

    /**
     * Get project stakeholders
     */
    getProjectStakeholders(projectId) {
        // This would typically query a database
        return [
            { id: 'project_manager', type: 'user', channels: ['email', 'slack'] },
            { id: 'product_owner', type: 'user', channels: ['email'] }
        ];
    }

    /**
     * Get default recipients
     */
    getDefaultRecipients(event) {
        const defaultRecipients = {
            'system_error': [
                { id: 'admin', type: 'user', channels: ['email', 'sms'] },
                { id: 'devops', type: 'user', channels: ['email', 'slack'] }
            ],
            'deadline_approaching': [
                { id: 'project_manager', type: 'user', channels: ['email', 'push'] }
            ],
            'task_completed': [
                { id: 'team_lead', type: 'user', channels: ['email'] }
            ]
        };
        
        return defaultRecipients[event] || [];
    }

    /**
     * Check if should escalate
     */
    shouldEscalate(event, context) {
        if (context.severity === 'critical') return true;
        if (context.urgent && context.priority > 0.8) return true;
        if (event === 'system_error') return true;
        if (event === 'deadline_approaching' && context.timeRemaining < 2) return true;
        
        return false;
    }

    /**
     * Get escalation chain
     */
    getEscalationChain(event, context) {
        const chains = {
            'system_error': ['level1', 'level2', 'level3'],
            'deadline_approaching': ['level1', 'level2'],
            'task_failed': ['level1']
        };
        
        return chains[event] || ['level1'];
    }

    /**
     * Get escalation recipients
     */
    getEscalationRecipients(level, event, context) {
        const escalationRecipients = {
            'level1': [
                { id: 'team_lead', type: 'user', channels: ['email', 'push'] }
            ],
            'level2': [
                { id: 'manager', type: 'user', channels: ['email', 'sms'] }
            ],
            'level3': [
                { id: 'director', type: 'user', channels: ['email', 'sms', 'phone'] }
            ]
        };
        
        return escalationRecipients[level] || [];
    }

    /**
     * Get event relevance
     */
    getEventRelevance(recipient, event, profile) {
        const eventRelevance = {
            'system_error': { admin: 0.9, devops: 0.8, developer: 0.6 },
            'deadline_approaching': { project_manager: 0.9, team_lead: 0.8, developer: 0.7 },
            'task_completed': { team_lead: 0.8, developer: 0.9, project_manager: 0.6 }
        };
        
        const relevance = eventRelevance[event] || {};
        return relevance[profile.roles[0]] || 0.5;
    }

    /**
     * Get context relevance
     */
    getContextRelevance(recipient, context, profile) {
        let relevance = 0.5;
        
        // Check if recipient is involved in the context
        if (context.userId === recipient.id) relevance += 0.3;
        if (context.teamId && profile.teams?.includes(context.teamId)) relevance += 0.2;
        if (context.projectId && profile.projects?.includes(context.projectId)) relevance += 0.2;
        
        return Math.min(1.0, relevance);
    }

    /**
     * Get activity score
     */
    getActivityScore(recipient, profile) {
        const lastActive = new Date(profile.activity.lastActive);
        const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceActive < 1) return 1.0;
        if (hoursSinceActive < 24) return 0.8;
        if (hoursSinceActive < 72) return 0.6;
        return 0.3;
    }

    /**
     * Get time relevance
     */
    getTimeRelevance(recipient, profile) {
        const now = new Date();
        const hour = now.getHours();
        const timezone = profile.timezone || 'UTC';
        
        // Check if it's business hours in recipient's timezone
        if (hour >= 9 && hour <= 17) return 1.0;
        if (hour >= 8 && hour <= 20) return 0.8;
        return 0.5;
    }

    /**
     * Get priority match
     */
    getPriorityMatch(recipient, event, context, profile) {
        const recipientPriority = this.getRolePriority(recipient);
        const eventPriority = this.getEventPriority(event);
        
        return Math.abs(recipientPriority - eventPriority) < 0.3 ? 1.0 : 0.5;
    }

    /**
     * Get event priority
     */
    getEventPriority(event) {
        const priorities = {
            'system_error': 0.9,
            'deadline_approaching': 0.8,
            'task_failed': 0.7,
            'performance_alert': 0.6,
            'task_completed': 0.4,
            'team_update': 0.3
        };
        
        return priorities[event] || 0.5;
    }

    /**
     * Get role priority
     */
    getRolePriority(recipient) {
        const rolePriorities = {
            'admin': 0.9,
            'director': 0.8,
            'manager': 0.7,
            'team_lead': 0.6,
            'senior_dev': 0.5,
            'developer': 0.4,
            'user': 0.3
        };
        
        return rolePriorities[recipient.type] || 0.5;
    }

    /**
     * Check if it's quiet hours
     */
    isQuietHours() {
        const hour = new Date().getHours();
        return hour >= 22 || hour <= 8;
    }

    /**
     * Check if high frequency for user
     */
    isHighFrequency(userId) {
        const recentNotifications = this.deliveryHistory.filter(h => 
            h.recipientId === userId && 
            Date.now() - new Date(h.timestamp).getTime() < 3600000 // 1 hour
        );
        
        return recentNotifications.length > 5;
    }

    /**
     * Initialize default rules
     */
    initializeDefaultRules() {
        this.rules.set('system_error', {
            id: 'system_error',
            name: 'System Error Rule',
            event: 'system_error',
            conditions: {
                severity: ['critical', 'high']
            },
            actions: {
                channels: ['email', 'sms'],
                escalation: true,
                priority: 'high'
            }
        });
        
        this.rules.set('deadline_approaching', {
            id: 'deadline_approaching',
            name: 'Deadline Approaching Rule',
            event: 'deadline_approaching',
            conditions: {
                timeRemaining: { operator: '<', value: 24 }
            },
            actions: {
                channels: ['email', 'push'],
                escalation: true,
                priority: 'high'
            }
        });
    }

    /**
     * Initialize escalation chains
     */
    initializeEscalationChains() {
        this.escalationChains.set('system_error', [
            { level: 1, delay: 0, recipients: ['admin', 'devops'] },
            { level: 2, delay: 300000, recipients: ['manager'] },
            { level: 3, delay: 900000, recipients: ['director'] }
        ]);
        
        this.escalationChains.set('deadline_approaching', [
            { level: 1, delay: 0, recipients: ['project_manager', 'team_lead'] },
            { level: 2, delay: 1800000, recipients: ['manager'] }
        ]);
    }

    /**
     * Get rules
     */
    getRules() {
        return Array.from(this.rules.values());
    }

    /**
     * Create rule
     */
    createRule(rule) {
        this.rules.set(rule.id, rule);
        return rule;
    }

    /**
     * Get efficiency
     */
    getEfficiency() {
        return this.efficiency;
    }

    /**
     * Stop the intelligent router
     */
    stop() {
        // Cleanup resources
    }
}

module.exports = IntelligentRouter;
