const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * Dashboard Sharing v2.4
 * Manages dashboard sharing and collaboration
 */
class DashboardSharing extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            enableSharing: true,
            enablePublicSharing: true,
            enablePasswordProtection: true,
            enableExpiration: true,
            defaultExpirationDays: 30,
            maxShareLinks: 1000,
            ...options
        };
        
        this.shareLinks = new Map();
        this.collaborators = new Map();
        this.permissions = new Map();
        this.accessLogs = new Map();
    }

    /**
     * Share dashboard
     */
    async shareDashboard(dashboardId, shareOptions = {}) {
        try {
            if (!this.options.enableSharing) {
                throw new Error('Dashboard sharing is disabled');
            }

            // Validate share options
            const validation = this.validateShareOptions(shareOptions);
            if (!validation.isValid) {
                throw new Error(`Share options validation failed: ${validation.errors.join(', ')}`);
            }

            // Generate share token
            const shareToken = this.generateShareToken();
            
            // Calculate expiration date
            const expirationDays = shareOptions.expirationDays || this.options.defaultExpirationDays;
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + expirationDays);

            // Create share link
            const shareLink = {
                id: this.generateId(),
                dashboardId,
                token: shareToken,
                type: shareOptions.type || 'view',
                permissions: {
                    canView: true,
                    canEdit: shareOptions.canEdit || false,
                    canShare: shareOptions.canShare || false,
                    canDownload: shareOptions.canDownload || false,
                    canComment: shareOptions.canComment || false
                },
                access: {
                    isPublic: shareOptions.isPublic || false,
                    password: shareOptions.password || null,
                    allowedEmails: shareOptions.allowedEmails || [],
                    allowedDomains: shareOptions.allowedDomains || [],
                    maxViews: shareOptions.maxViews || null,
                    currentViews: 0
                },
                expiration: {
                    enabled: shareOptions.expirationEnabled !== false,
                    date: expirationDate.toISOString(),
                    days: expirationDays
                },
                metadata: {
                    created: new Date().toISOString(),
                    createdBy: shareOptions.createdBy || 'system',
                    title: shareOptions.title || 'Shared Dashboard',
                    description: shareOptions.description || '',
                    tags: shareOptions.tags || []
                },
                state: {
                    isActive: true,
                    isExpired: false,
                    lastAccessed: null
                }
            };

            // Store share link
            this.shareLinks.set(shareToken, shareLink);
            
            this.emit('dashboardShared', shareLink);
            return shareLink;
        } catch (error) {
            throw new Error(`Failed to share dashboard: ${error.message}`);
        }
    }

    /**
     * Get shared dashboard
     */
    async getSharedDashboard(shareToken, accessInfo = {}) {
        try {
            const shareLink = this.shareLinks.get(shareToken);
            if (!shareLink) {
                throw new Error('Share link not found');
            }

            // Check if share link is active
            if (!shareLink.state.isActive) {
                throw new Error('Share link is not active');
            }

            // Check if share link is expired
            if (shareLink.expiration.enabled && new Date() > new Date(shareLink.expiration.date)) {
                shareLink.state.isExpired = true;
                throw new Error('Share link has expired');
            }

            // Check password if required
            if (shareLink.access.password && shareLink.access.password !== accessInfo.password) {
                throw new Error('Invalid password');
            }

            // Check email restrictions
            if (shareLink.access.allowedEmails.length > 0 && !shareLink.access.allowedEmails.includes(accessInfo.email)) {
                throw new Error('Access denied: email not allowed');
            }

            // Check domain restrictions
            if (shareLink.access.allowedDomains.length > 0) {
                const userDomain = accessInfo.email?.split('@')[1];
                if (!userDomain || !shareLink.access.allowedDomains.includes(userDomain)) {
                    throw new Error('Access denied: domain not allowed');
                }
            }

            // Check view limit
            if (shareLink.access.maxViews && shareLink.access.currentViews >= shareLink.access.maxViews) {
                throw new Error('Maximum views exceeded');
            }

            // Update access information
            shareLink.access.currentViews++;
            shareLink.state.lastAccessed = new Date().toISOString();

            // Log access
            this.logAccess(shareToken, accessInfo);

            this.emit('dashboardAccessed', { shareToken, accessInfo });
            return shareLink;
        } catch (error) {
            throw new Error(`Failed to get shared dashboard: ${error.message}`);
        }
    }

    /**
     * Update share link
     */
    async updateShareLink(shareToken, updateData) {
        try {
            const shareLink = this.shareLinks.get(shareToken);
            if (!shareLink) {
                throw new Error('Share link not found');
            }

            // Validate update data
            const validation = this.validateShareOptions(updateData, true);
            if (!validation.isValid) {
                throw new Error(`Share update validation failed: ${validation.errors.join(', ')}`);
            }

            // Update share link
            const updatedShareLink = {
                ...shareLink,
                ...updateData,
                metadata: {
                    ...shareLink.metadata,
                    updated: new Date().toISOString()
                }
            };

            // Store updated share link
            this.shareLinks.set(shareToken, updatedShareLink);
            
            this.emit('shareLinkUpdated', updatedShareLink);
            return updatedShareLink;
        } catch (error) {
            throw new Error(`Failed to update share link: ${error.message}`);
        }
    }

    /**
     * Revoke share link
     */
    async revokeShareLink(shareToken) {
        try {
            const shareLink = this.shareLinks.get(shareToken);
            if (!shareLink) {
                throw new Error('Share link not found');
            }

            // Deactivate share link
            shareLink.state.isActive = false;
            shareLink.metadata.updated = new Date().toISOString();

            // Store updated share link
            this.shareLinks.set(shareToken, shareLink);
            
            this.emit('shareLinkRevoked', shareLink);
            return true;
        } catch (error) {
            throw new Error(`Failed to revoke share link: ${error.message}`);
        }
    }

    /**
     * Delete share link
     */
    async deleteShareLink(shareToken) {
        try {
            const shareLink = this.shareLinks.get(shareToken);
            if (!shareLink) {
                throw new Error('Share link not found');
            }

            // Remove share link
            this.shareLinks.delete(shareToken);
            
            // Remove related data
            this.collaborators.delete(shareToken);
            this.permissions.delete(shareToken);
            this.accessLogs.delete(shareToken);
            
            this.emit('shareLinkDeleted', shareToken);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete share link: ${error.message}`);
        }
    }

    /**
     * Get share links for dashboard
     */
    async getDashboardShareLinks(dashboardId) {
        try {
            const shareLinks = Array.from(this.shareLinks.values())
                .filter(link => link.dashboardId === dashboardId && link.state.isActive);

            return shareLinks;
        } catch (error) {
            throw new Error(`Failed to get dashboard share links: ${error.message}`);
        }
    }

    /**
     * Add collaborator
     */
    async addCollaborator(shareToken, collaboratorData) {
        try {
            const shareLink = this.shareLinks.get(shareToken);
            if (!shareLink) {
                throw new Error('Share link not found');
            }

            // Validate collaborator data
            const validation = this.validateCollaboratorData(collaboratorData);
            if (!validation.isValid) {
                throw new Error(`Collaborator validation failed: ${validation.errors.join(', ')}`);
            }

            const collaboratorId = this.generateId();
            const collaborator = {
                id: collaboratorId,
                shareToken,
                email: collaboratorData.email,
                name: collaboratorData.name || '',
                role: collaboratorData.role || 'viewer',
                permissions: {
                    canView: collaboratorData.canView !== false,
                    canEdit: collaboratorData.canEdit || false,
                    canShare: collaboratorData.canShare || false,
                    canDownload: collaboratorData.canDownload || false,
                    canComment: collaboratorData.canComment || false
                },
                metadata: {
                    added: new Date().toISOString(),
                    addedBy: collaboratorData.addedBy || 'system',
                    lastAccessed: null
                },
                state: {
                    isActive: true,
                    isInvited: true
                }
            };

            // Store collaborator
            if (!this.collaborators.has(shareToken)) {
                this.collaborators.set(shareToken, []);
            }
            
            const collaborators = this.collaborators.get(shareToken);
            collaborators.push(collaborator);

            this.emit('collaboratorAdded', collaborator);
            return collaborator;
        } catch (error) {
            throw new Error(`Failed to add collaborator: ${error.message}`);
        }
    }

    /**
     * Remove collaborator
     */
    async removeCollaborator(shareToken, collaboratorId) {
        try {
            const collaborators = this.collaborators.get(shareToken);
            if (!collaborators) {
                throw new Error('No collaborators found for this share link');
            }

            const collaboratorIndex = collaborators.findIndex(c => c.id === collaboratorId);
            if (collaboratorIndex === -1) {
                throw new Error('Collaborator not found');
            }

            // Remove collaborator
            const collaborator = collaborators.splice(collaboratorIndex, 1)[0];
            collaborator.state.isActive = false;

            this.emit('collaboratorRemoved', collaborator);
            return true;
        } catch (error) {
            throw new Error(`Failed to remove collaborator: ${error.message}`);
        }
    }

    /**
     * Get collaborators for share link
     */
    async getCollaborators(shareToken) {
        try {
            const collaborators = this.collaborators.get(shareToken) || [];
            return collaborators.filter(c => c.state.isActive);
        } catch (error) {
            throw new Error(`Failed to get collaborators: ${error.message}`);
        }
    }

    /**
     * Log access
     */
    logAccess(shareToken, accessInfo) {
        try {
            const logEntry = {
                id: this.generateId(),
                shareToken,
                timestamp: new Date().toISOString(),
                ip: accessInfo.ip || 'unknown',
                userAgent: accessInfo.userAgent || 'unknown',
                email: accessInfo.email || 'anonymous',
                action: 'view'
            };

            // Store access log
            if (!this.accessLogs.has(shareToken)) {
                this.accessLogs.set(shareToken, []);
            }
            
            const logs = this.accessLogs.get(shareToken);
            logs.push(logEntry);

            // Keep only last 1000 entries
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }

            this.emit('accessLogged', logEntry);
        } catch (error) {
            console.error('Error logging access:', error);
        }
    }

    /**
     * Get access logs
     */
    async getAccessLogs(shareToken, filters = {}) {
        try {
            const logs = this.accessLogs.get(shareToken) || [];
            
            // Apply filters
            let filteredLogs = logs;
            
            if (filters.startDate) {
                filteredLogs = filteredLogs.filter(log => 
                    new Date(log.timestamp) >= new Date(filters.startDate)
                );
            }
            
            if (filters.endDate) {
                filteredLogs = filteredLogs.filter(log => 
                    new Date(log.timestamp) <= new Date(filters.endDate)
                );
            }
            
            if (filters.email) {
                filteredLogs = filteredLogs.filter(log => 
                    log.email.includes(filters.email)
                );
            }

            // Sort by timestamp (newest first)
            filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Pagination
            const page = filters.page || 1;
            const limit = filters.limit || 50;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;

            return {
                logs: filteredLogs.slice(startIndex, endIndex),
                total: filteredLogs.length,
                page,
                limit,
                totalPages: Math.ceil(filteredLogs.length / limit)
            };
        } catch (error) {
            throw new Error(`Failed to get access logs: ${error.message}`);
        }
    }

    /**
     * Get sharing statistics
     */
    async getSharingStats(dashboardId = null) {
        try {
            const stats = {
                totalShareLinks: 0,
                activeShareLinks: 0,
                expiredShareLinks: 0,
                totalViews: 0,
                totalCollaborators: 0,
                shareLinksByType: {},
                viewsByDay: {},
                topCollaborators: []
            };

            let shareLinks = Array.from(this.shareLinks.values());
            
            if (dashboardId) {
                shareLinks = shareLinks.filter(link => link.dashboardId === dashboardId);
            }

            stats.totalShareLinks = shareLinks.length;
            stats.activeShareLinks = shareLinks.filter(link => link.state.isActive && !link.state.isExpired).length;
            stats.expiredShareLinks = shareLinks.filter(link => link.state.isExpired).length;

            // Calculate total views
            shareLinks.forEach(link => {
                stats.totalViews += link.access.currentViews;
                
                // Count by type
                const type = link.type;
                stats.shareLinksByType[type] = (stats.shareLinksByType[type] || 0) + 1;
            });

            // Calculate total collaborators
            for (const [shareToken, collaborators] of this.collaborators) {
                if (!dashboardId || shareLinks.some(link => link.token === shareToken)) {
                    stats.totalCollaborators += collaborators.filter(c => c.state.isActive).length;
                }
            }

            // Calculate views by day (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            for (const [shareToken, logs] of this.accessLogs) {
                if (!dashboardId || shareLinks.some(link => link.token === shareToken)) {
                    logs.forEach(log => {
                        const logDate = new Date(log.timestamp);
                        if (logDate >= thirtyDaysAgo) {
                            const dayKey = logDate.toISOString().split('T')[0];
                            stats.viewsByDay[dayKey] = (stats.viewsByDay[dayKey] || 0) + 1;
                        }
                    });
                }
            }

            return stats;
        } catch (error) {
            throw new Error(`Failed to get sharing statistics: ${error.message}`);
        }
    }

    /**
     * Cleanup expired share links
     */
    async cleanupExpiredLinks() {
        try {
            const now = new Date();
            let cleanedCount = 0;

            for (const [shareToken, shareLink] of this.shareLinks) {
                if (shareLink.expiration.enabled && new Date(shareLink.expiration.date) < now) {
                    shareLink.state.isExpired = true;
                    cleanedCount++;
                }
            }

            this.emit('expiredLinksCleaned', { count: cleanedCount });
            return cleanedCount;
        } catch (error) {
            throw new Error(`Failed to cleanup expired links: ${error.message}`);
        }
    }

    /**
     * Generate share token
     */
    generateShareToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Generate share ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Validate share options
     */
    validateShareOptions(data, isUpdate = false) {
        const errors = [];

        if (!isUpdate) {
            if (data.type && !['view', 'edit', 'comment'].includes(data.type)) {
                errors.push('Invalid share type');
            }
        }

        if (data.expirationDays && (typeof data.expirationDays !== 'number' || data.expirationDays < 1)) {
            errors.push('Expiration days must be a positive number');
        }

        if (data.maxViews && (typeof data.maxViews !== 'number' || data.maxViews < 1)) {
            errors.push('Max views must be a positive number');
        }

        if (data.allowedEmails && !Array.isArray(data.allowedEmails)) {
            errors.push('Allowed emails must be an array');
        }

        if (data.allowedDomains && !Array.isArray(data.allowedDomains)) {
            errors.push('Allowed domains must be an array');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate collaborator data
     */
    validateCollaboratorData(data) {
        const errors = [];

        if (!data.email || typeof data.email !== 'string') {
            errors.push('Email is required');
        }

        if (data.role && !['viewer', 'editor', 'admin'].includes(data.role)) {
            errors.push('Invalid role');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get system status
     */
    getStatus() {
        return {
            isRunning: true,
            totalShareLinks: this.shareLinks.size,
            totalCollaborators: Array.from(this.collaborators.values()).reduce((sum, collabs) => sum + collabs.length, 0),
            totalAccessLogs: Array.from(this.accessLogs.values()).reduce((sum, logs) => sum + logs.length, 0),
            sharingEnabled: this.options.enableSharing,
            publicSharingEnabled: this.options.enablePublicSharing,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = DashboardSharing;
