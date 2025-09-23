/**
 * Status Update Engine
 * Core logic for managing task status updates
 */

class StatusUpdateEngine {
    constructor(options = {}) {
        this.autoDetection = options.autoDetection || true;
        this.smartUpdates = options.smartUpdates || true;
        this.conflictResolution = options.conflictResolution || true;
        this.notificationEnabled = options.notificationEnabled || true;
        this.auditTrail = options.auditTrail || true;
        this.rollbackEnabled = options.rollbackEnabled || true;
        
        this.statusUpdates = new Map();
        this.auditLog = [];
        this.isRunning = true;
    }

    /**
     * Apply status update
     */
    async applyStatusUpdate(statusUpdate) {
        try {
            const { taskId, newStatus, previousStatus, reason, metadata } = statusUpdate;
            
            // Validate update
            this.validateStatusUpdate(statusUpdate);
            
            // Check for conflicts
            const conflicts = this.checkUpdateConflicts(statusUpdate);
            
            // Apply update
            const result = {
                taskId,
                previousStatus,
                newStatus,
                reason,
                metadata,
                timestamp: new Date(),
                conflicts,
                applied: true
            };
            
            // Store update
            this.statusUpdates.set(statusUpdate.id, result);
            
            // Add to audit trail
            if (this.auditTrail) {
                this.addToAuditTrail(statusUpdate, 'applied');
            }
            
            // Send notification if enabled
            if (this.notificationEnabled) {
                await this.sendNotification(statusUpdate);
            }
            
            return result;
        } catch (error) {
            console.error('Error applying status update:', error);
            throw error;
        }
    }

    /**
     * Validate status update
     */
    validateStatusUpdate(statusUpdate) {
        const { taskId, newStatus, previousStatus } = statusUpdate;
        
        if (!taskId) {
            throw new Error('TaskId is required');
        }
        
        if (!newStatus) {
            throw new Error('New status is required');
        }
        
        if (!previousStatus) {
            throw new Error('Previous status is required');
        }
        
        // Validate status values
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }
        
        if (!validStatuses.includes(previousStatus)) {
            throw new Error(`Invalid previous status: ${previousStatus}`);
        }
        
        // Validate status transition
        if (!this.isValidTransition(previousStatus, newStatus)) {
            throw new Error(`Invalid transition from ${previousStatus} to ${newStatus}`);
        }
    }

    /**
     * Check if status transition is valid
     */
    isValidTransition(fromStatus, toStatus) {
        const validTransitions = {
            'pending': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'cancelled', 'on_hold'],
            'on_hold': ['in_progress', 'cancelled'],
            'completed': ['in_progress'], // Reopening
            'cancelled': ['pending', 'in_progress'] // Reactivation
        };
        
        const allowedStatuses = validTransitions[fromStatus] || [];
        return allowedStatuses.includes(toStatus);
    }

    /**
     * Check update conflicts
     */
    checkUpdateConflicts(statusUpdate) {
        const conflicts = [];
        const { taskId, newStatus } = statusUpdate;
        
        // Check for dependency conflicts
        const dependencyConflicts = this.checkDependencyConflicts(taskId, newStatus);
        conflicts.push(...dependencyConflicts);
        
        // Check for resource conflicts
        const resourceConflicts = this.checkResourceConflicts(taskId, newStatus);
        conflicts.push(...resourceConflicts);
        
        // Check for timeline conflicts
        const timelineConflicts = this.checkTimelineConflicts(taskId, newStatus);
        conflicts.push(...timelineConflicts);
        
        return conflicts;
    }

    /**
     * Check dependency conflicts
     */
    checkDependencyConflicts(taskId, newStatus) {
        const conflicts = [];
        
        // This would typically check against a dependency management system
        // For now, simulate some dependency checks
        if (newStatus === 'completed') {
            // Check if all dependencies are completed
            const dependencies = this.getTaskDependencies(taskId);
            const incompleteDependencies = dependencies.filter(dep => 
                this.getTaskStatus(dep) !== 'completed'
            );
            
            if (incompleteDependencies.length > 0) {
                conflicts.push({
                    type: 'dependency',
                    severity: 'high',
                    message: `Cannot complete task with incomplete dependencies: ${incompleteDependencies.join(', ')}`,
                    affectedTasks: incompleteDependencies
                });
            }
        }
        
        return conflicts;
    }

    /**
     * Check resource conflicts
     */
    checkResourceConflicts(taskId, newStatus) {
        const conflicts = [];
        
        // This would typically check resource allocation
        // For now, simulate some resource checks
        if (newStatus === 'in_progress') {
            const requiredResources = this.getTaskResources(taskId);
            const availableResources = this.getAvailableResources();
            
            const unavailableResources = requiredResources.filter(resource => 
                !availableResources.includes(resource)
            );
            
            if (unavailableResources.length > 0) {
                conflicts.push({
                    type: 'resource',
                    severity: 'medium',
                    message: `Required resources not available: ${unavailableResources.join(', ')}`,
                    affectedResources: unavailableResources
                });
            }
        }
        
        return conflicts;
    }

    /**
     * Check timeline conflicts
     */
    checkTimelineConflicts(taskId, newStatus) {
        const conflicts = [];
        
        // This would typically check against project timeline
        // For now, simulate some timeline checks
        if (newStatus === 'in_progress') {
            const taskDeadline = this.getTaskDeadline(taskId);
            const estimatedDuration = this.getTaskEstimatedDuration(taskId);
            const currentDate = new Date();
            
            if (taskDeadline && estimatedDuration) {
                const estimatedCompletion = new Date(currentDate.getTime() + estimatedDuration * 24 * 60 * 60 * 1000);
                
                if (estimatedCompletion > taskDeadline) {
                    conflicts.push({
                        type: 'timeline',
                        severity: 'high',
                        message: `Task cannot be completed before deadline`,
                        deadline: taskDeadline,
                        estimatedCompletion: estimatedCompletion
                    });
                }
            }
        }
        
        return conflicts;
    }

    /**
     * Get task dependencies
     */
    getTaskDependencies(taskId) {
        // This would typically query a dependency management system
        // For now, return mock data
        const mockDependencies = {
            'task_1': ['task_2', 'task_3'],
            'task_2': ['task_4'],
            'task_3': ['task_4'],
            'task_4': ['task_5'],
            'task_5': []
        };
        
        return mockDependencies[taskId] || [];
    }

    /**
     * Get task status
     */
    getTaskStatus(taskId) {
        // This would typically query a task management system
        // For now, return mock data
        const mockStatuses = {
            'task_1': 'pending',
            'task_2': 'in_progress',
            'task_3': 'completed',
            'task_4': 'pending',
            'task_5': 'pending'
        };
        
        return mockStatuses[taskId] || 'unknown';
    }

    /**
     * Get task resources
     */
    getTaskResources(taskId) {
        // This would typically query a resource management system
        // For now, return mock data
        const mockResources = {
            'task_1': ['developer_1', 'designer_1'],
            'task_2': ['developer_2'],
            'task_3': ['developer_1'],
            'task_4': ['developer_3'],
            'task_5': ['developer_2']
        };
        
        return mockResources[taskId] || [];
    }

    /**
     * Get available resources
     */
    getAvailableResources() {
        // This would typically query a resource management system
        // For now, return mock data
        return ['developer_1', 'developer_2', 'developer_3', 'designer_1', 'designer_2'];
    }

    /**
     * Get task deadline
     */
    getTaskDeadline(taskId) {
        // This would typically query a task management system
        // For now, return mock data
        const mockDeadlines = {
            'task_1': new Date('2024-01-15'),
            'task_2': new Date('2024-01-20'),
            'task_3': new Date('2024-01-25'),
            'task_4': new Date('2024-01-30'),
            'task_5': new Date('2024-02-05')
        };
        
        return mockDeadlines[taskId];
    }

    /**
     * Get task estimated duration
     */
    getTaskEstimatedDuration(taskId) {
        // This would typically query a task management system
        // For now, return mock data (in days)
        const mockDurations = {
            'task_1': 5,
            'task_2': 3,
            'task_3': 2,
            'task_4': 4,
            'task_5': 3
        };
        
        return mockDurations[taskId] || 1;
    }

    /**
     * Send notification
     */
    async sendNotification(statusUpdate) {
        try {
            const { taskId, newStatus, previousStatus, reason } = statusUpdate;
            
            // This would typically send notifications via email, Slack, etc.
            console.log(`Notification: Task ${taskId} status changed from ${previousStatus} to ${newStatus}`);
            if (reason) {
                console.log(`Reason: ${reason}`);
            }
            
            // Simulate notification sending
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    /**
     * Add to audit trail
     */
    addToAuditTrail(statusUpdate, action) {
        const auditEntry = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            action,
            statusUpdate,
            timestamp: new Date(),
            user: statusUpdate.metadata?.user || 'system'
        };
        
        this.auditLog.push(auditEntry);
        
        // Keep only last 10000 audit entries
        if (this.auditLog.length > 10000) {
            this.auditLog = this.auditLog.slice(-10000);
        }
    }

    /**
     * Get status update
     */
    getStatusUpdate(updateId) {
        return this.statusUpdates.get(updateId);
    }

    /**
     * Get status updates for task
     */
    getTaskStatusUpdates(taskId) {
        return Array.from(this.statusUpdates.values())
            .filter(update => update.taskId === taskId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Get status updates by status
     */
    getStatusUpdatesByStatus(status) {
        return Array.from(this.statusUpdates.values())
            .filter(update => update.newStatus === status)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Get status updates by date range
     */
    getStatusUpdatesByDateRange(startDate, endDate) {
        return Array.from(this.statusUpdates.values())
            .filter(update => {
                const updateDate = new Date(update.timestamp);
                return updateDate >= startDate && updateDate <= endDate;
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Get audit trail
     */
    getAuditTrail(filters = {}) {
        let auditEntries = [...this.auditLog];
        
        if (filters.taskId) {
            auditEntries = auditEntries.filter(entry => 
                entry.statusUpdate.taskId === filters.taskId
            );
        }
        
        if (filters.action) {
            auditEntries = auditEntries.filter(entry => 
                entry.action === filters.action
            );
        }
        
        if (filters.startDate) {
            auditEntries = auditEntries.filter(entry => 
                new Date(entry.timestamp) >= filters.startDate
            );
        }
        
        if (filters.endDate) {
            auditEntries = auditEntries.filter(entry => 
                new Date(entry.timestamp) <= filters.endDate
            );
        }
        
        if (filters.limit) {
            auditEntries = auditEntries.slice(0, filters.limit);
        }
        
        return auditEntries;
    }

    /**
     * Rollback status update
     */
    async rollbackStatusUpdate(updateId) {
        try {
            const statusUpdate = this.statusUpdates.get(updateId);
            if (!statusUpdate) {
                throw new Error('Status update not found');
            }
            
            // Create rollback update
            const rollbackUpdate = {
                id: `rollback_${updateId}_${Date.now()}`,
                taskId: statusUpdate.taskId,
                previousStatus: statusUpdate.newStatus,
                newStatus: statusUpdate.previousStatus,
                reason: 'Rollback of previous update',
                metadata: {
                    rollbackOf: updateId,
                    originalUpdate: statusUpdate
                },
                timestamp: new Date(),
                conflicts: []
            };
            
            // Apply rollback
            const result = await this.applyStatusUpdate(rollbackUpdate);
            
            // Add to audit trail
            if (this.auditTrail) {
                this.addToAuditTrail(rollbackUpdate, 'rollback');
            }
            
            return result;
        } catch (error) {
            console.error('Error rolling back status update:', error);
            throw error;
        }
    }

    /**
     * Get status update statistics
     */
    getStatusUpdateStatistics() {
        const updates = Array.from(this.statusUpdates.values());
        const totalUpdates = updates.length;
        
        const statusDistribution = {};
        const transitionDistribution = {};
        const conflictCount = updates.filter(u => u.conflicts && u.conflicts.length > 0).length;
        
        for (const update of updates) {
            // Count status distribution
            const status = update.newStatus;
            statusDistribution[status] = (statusDistribution[status] || 0) + 1;
            
            // Count transition distribution
            const transition = `${update.previousStatus} -> ${update.newStatus}`;
            transitionDistribution[transition] = (transitionDistribution[transition] || 0) + 1;
        }
        
        return {
            totalUpdates,
            statusDistribution,
            transitionDistribution,
            conflictCount,
            conflictRate: totalUpdates > 0 ? conflictCount / totalUpdates : 0,
            averageConflictsPerUpdate: totalUpdates > 0 ? 
                updates.reduce((sum, u) => sum + (u.conflicts ? u.conflicts.length : 0), 0) / totalUpdates : 0
        };
    }

    /**
     * Export status updates
     */
    exportStatusUpdates(format = 'json') {
        const updates = Array.from(this.statusUpdates.values());
        
        if (format === 'json') {
            return JSON.stringify(updates, null, 2);
        } else if (format === 'csv') {
            return this.exportToCSV(updates);
        } else if (format === 'xml') {
            return this.exportToXML(updates);
        }
        
        return updates;
    }

    /**
     * Export to CSV
     */
    exportToCSV(updates) {
        let csv = 'TaskId,PreviousStatus,NewStatus,Reason,Timestamp,Conflicts\n';
        
        for (const update of updates) {
            const conflicts = update.conflicts ? update.conflicts.length : 0;
            csv += `${update.taskId},${update.previousStatus},${update.newStatus},"${update.reason || ''}",${update.timestamp},${conflicts}\n`;
        }
        
        return csv;
    }

    /**
     * Export to XML
     */
    exportToXML(updates) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<statusUpdates>\n';
        
        for (const update of updates) {
            xml += '  <statusUpdate>\n';
            xml += `    <taskId>${update.taskId}</taskId>\n`;
            xml += `    <previousStatus>${update.previousStatus}</previousStatus>\n`;
            xml += `    <newStatus>${update.newStatus}</newStatus>\n`;
            xml += `    <reason>${update.reason || ''}</reason>\n`;
            xml += `    <timestamp>${update.timestamp}</timestamp>\n`;
            xml += `    <conflicts>${update.conflicts ? update.conflicts.length : 0}</conflicts>\n`;
            xml += '  </statusUpdate>\n';
        }
        
        xml += '</statusUpdates>';
        return xml;
    }

    /**
     * Clear all status updates
     */
    clearAllStatusUpdates() {
        this.statusUpdates.clear();
        this.auditLog = [];
    }

    /**
     * Stop the status update engine
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = StatusUpdateEngine;
