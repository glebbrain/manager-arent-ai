const EventEmitter = require('events');

/**
 * User Preferences v2.4
 * Manages user preferences and settings
 */
class UserPreferences extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            enablePersonalization: true,
            enableSync: true,
            maxPreferences: 10000,
            ...options
        };
        
        this.preferences = new Map();
        this.defaultPreferences = this.initializeDefaultPreferences();
    }

    /**
     * Initialize default preferences
     */
    initializeDefaultPreferences() {
        return {
            dashboard: {
                defaultLayout: 'grid',
                defaultTheme: 'default',
                gridSize: 20,
                enableDragDrop: true,
                enableResize: true,
                enableSnapToGrid: true,
                autoRefresh: false,
                refreshInterval: 30000
            },
            display: {
                language: 'en',
                timezone: 'UTC',
                dateFormat: 'YYYY-MM-DD',
                timeFormat: '24h',
                numberFormat: 'en-US',
                currency: 'USD'
            },
            notifications: {
                enableNotifications: true,
                enableEmail: true,
                enablePush: true,
                enableSound: true,
                notificationTypes: {
                    dashboardUpdates: true,
                    systemAlerts: true,
                    dataChanges: true,
                    sharing: true
                }
            },
            accessibility: {
                highContrast: false,
                largeText: false,
                reducedMotion: false,
                screenReader: false,
                keyboardNavigation: true
            },
            privacy: {
                shareUsageData: false,
                shareAnalytics: false,
                allowTracking: false,
                dataRetention: '1y'
            },
            performance: {
                enableCaching: true,
                cacheSize: '100MB',
                enableCompression: true,
                enableLazyLoading: true,
                maxConcurrentRequests: 10
            }
        };
    }

    /**
     * Get user preferences
     */
    async getPreferences(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            let preferences = this.preferences.get(userId);
            
            // If no preferences exist, create default ones
            if (!preferences) {
                preferences = await this.createDefaultPreferences(userId);
            }

            return preferences;
        } catch (error) {
            throw new Error(`Failed to get user preferences: ${error.message}`);
        }
    }

    /**
     * Update user preferences
     */
    async updatePreferences(userId, updateData) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            // Validate update data
            const validation = this.validatePreferencesData(updateData);
            if (!validation.isValid) {
                throw new Error(`Preferences validation failed: ${validation.errors.join(', ')}`);
            }

            // Get existing preferences
            let preferences = this.preferences.get(userId);
            if (!preferences) {
                preferences = await this.createDefaultPreferences(userId);
            }

            // Deep merge preferences
            const updatedPreferences = this.deepMerge(preferences, updateData);
            
            // Add metadata
            updatedPreferences.metadata = {
                ...preferences.metadata,
                updated: new Date().toISOString(),
                version: this.incrementVersion(preferences.metadata?.version || '1.0.0')
            };

            // Store updated preferences
            this.preferences.set(userId, updatedPreferences);
            
            this.emit('preferencesUpdated', { userId, preferences: updatedPreferences });
            return updatedPreferences;
        } catch (error) {
            throw new Error(`Failed to update user preferences: ${error.message}`);
        }
    }

    /**
     * Reset user preferences to default
     */
    async resetPreferences(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            // Create new default preferences
            const preferences = await this.createDefaultPreferences(userId);
            
            // Store preferences
            this.preferences.set(userId, preferences);
            
            this.emit('preferencesReset', { userId, preferences });
            return preferences;
        } catch (error) {
            throw new Error(`Failed to reset user preferences: ${error.message}`);
        }
    }

    /**
     * Create default preferences for user
     */
    async createDefaultPreferences(userId) {
        try {
            const preferences = {
                userId,
                ...JSON.parse(JSON.stringify(this.defaultPreferences)), // Deep clone
                metadata: {
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    version: '1.0.0'
                }
            };

            // Store preferences
            this.preferences.set(userId, preferences);
            
            this.emit('preferencesCreated', { userId, preferences });
            return preferences;
        } catch (error) {
            throw new Error(`Failed to create default preferences: ${error.message}`);
        }
    }

    /**
     * Get specific preference value
     */
    async getPreference(userId, path) {
        try {
            const preferences = await this.getPreferences(userId);
            return this.getNestedValue(preferences, path);
        } catch (error) {
            throw new Error(`Failed to get preference: ${error.message}`);
        }
    }

    /**
     * Set specific preference value
     */
    async setPreference(userId, path, value) {
        try {
            const preferences = await this.getPreferences(userId);
            this.setNestedValue(preferences, path, value);
            
            // Update preferences
            await this.updatePreferences(userId, preferences);
            
            return value;
        } catch (error) {
            throw new Error(`Failed to set preference: ${error.message}`);
        }
    }

    /**
     * Export user preferences
     */
    async exportPreferences(userId, exportOptions = {}) {
        try {
            const preferences = await this.getPreferences(userId);
            
            const exportData = {
                preferences: {
                    dashboard: preferences.dashboard,
                    display: preferences.display,
                    notifications: preferences.notifications,
                    accessibility: preferences.accessibility,
                    privacy: preferences.privacy,
                    performance: preferences.performance
                },
                metadata: {
                    exported: new Date().toISOString(),
                    version: '2.4.0',
                    format: exportOptions.format || 'json',
                    includeMetadata: exportOptions.includeMetadata || false
                }
            };

            if (exportOptions.includeMetadata) {
                exportData.metadata.userMetadata = preferences.metadata;
            }

            return exportData;
        } catch (error) {
            throw new Error(`Failed to export preferences: ${error.message}`);
        }
    }

    /**
     * Import user preferences
     */
    async importPreferences(userId, importData) {
        try {
            if (!importData.preferences) {
                throw new Error('Invalid import data: missing preferences');
            }

            // Validate imported preferences
            const validation = this.validatePreferencesData(importData.preferences);
            if (!validation.isValid) {
                throw new Error(`Import validation failed: ${validation.errors.join(', ')}`);
            }

            // Merge with existing preferences
            const existingPreferences = await this.getPreferences(userId);
            const mergedPreferences = this.deepMerge(existingPreferences, importData.preferences);
            
            // Update preferences
            await this.updatePreferences(userId, mergedPreferences);
            
            this.emit('preferencesImported', { userId, preferences: mergedPreferences });
            return mergedPreferences;
        } catch (error) {
            throw new Error(`Failed to import preferences: ${error.message}`);
        }
    }

    /**
     * Get all users with preferences
     */
    async getAllUsers() {
        try {
            const users = Array.from(this.preferences.keys()).map(userId => ({
                userId,
                lastUpdated: this.preferences.get(userId)?.metadata?.updated,
                version: this.preferences.get(userId)?.metadata?.version
            }));

            return users;
        } catch (error) {
            throw new Error(`Failed to get all users: ${error.message}`);
        }
    }

    /**
     * Delete user preferences
     */
    async deletePreferences(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const preferences = this.preferences.get(userId);
            if (!preferences) {
                throw new Error('User preferences not found');
            }

            // Remove preferences
            this.preferences.delete(userId);
            
            this.emit('preferencesDeleted', { userId });
            return true;
        } catch (error) {
            throw new Error(`Failed to delete user preferences: ${error.message}`);
        }
    }

    /**
     * Sync preferences across devices
     */
    async syncPreferences(userId, deviceId, preferences) {
        try {
            if (!this.options.enableSync) {
                throw new Error('Preferences sync is disabled');
            }

            // Get existing preferences
            const existingPreferences = await this.getPreferences(userId);
            
            // Add sync metadata
            const syncedPreferences = {
                ...preferences,
                metadata: {
                    ...preferences.metadata,
                    lastSynced: new Date().toISOString(),
                    syncedFrom: deviceId,
                    version: this.incrementVersion(existingPreferences.metadata?.version || '1.0.0')
                }
            };

            // Store synced preferences
            this.preferences.set(userId, syncedPreferences);
            
            this.emit('preferencesSynced', { userId, deviceId, preferences: syncedPreferences });
            return syncedPreferences;
        } catch (error) {
            throw new Error(`Failed to sync preferences: ${error.message}`);
        }
    }

    /**
     * Get preference statistics
     */
    async getPreferenceStats() {
        try {
            const stats = {
                totalUsers: this.preferences.size,
                preferencesByCategory: {
                    dashboard: 0,
                    display: 0,
                    notifications: 0,
                    accessibility: 0,
                    privacy: 0,
                    performance: 0
                },
                mostUsedThemes: {},
                mostUsedLayouts: {},
                averagePreferencesPerUser: 0
            };

            let totalPreferences = 0;

            for (const [userId, preferences] of this.preferences) {
                totalPreferences += this.countPreferences(preferences);
                
                // Count by category
                Object.keys(stats.preferencesByCategory).forEach(category => {
                    if (preferences[category]) {
                        stats.preferencesByCategory[category]++;
                    }
                });

                // Count themes
                if (preferences.dashboard?.defaultTheme) {
                    const theme = preferences.dashboard.defaultTheme;
                    stats.mostUsedThemes[theme] = (stats.mostUsedThemes[theme] || 0) + 1;
                }

                // Count layouts
                if (preferences.dashboard?.defaultLayout) {
                    const layout = preferences.dashboard.defaultLayout;
                    stats.mostUsedLayouts[layout] = (stats.mostUsedLayouts[layout] || 0) + 1;
                }
            }

            stats.averagePreferencesPerUser = this.preferences.size > 0 ? 
                totalPreferences / this.preferences.size : 0;

            return stats;
        } catch (error) {
            throw new Error(`Failed to get preference statistics: ${error.message}`);
        }
    }

    /**
     * Count preferences in object
     */
    countPreferences(obj) {
        let count = 0;
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                count += this.countPreferences(obj[key]);
            } else {
                count++;
            }
        }
        return count;
    }

    /**
     * Deep merge objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Get nested value from object
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Set nested value in object
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    /**
     * Validate preferences data
     */
    validatePreferencesData(data) {
        const errors = [];

        // Validate dashboard preferences
        if (data.dashboard) {
            if (data.dashboard.defaultLayout && typeof data.dashboard.defaultLayout !== 'string') {
                errors.push('Default layout must be a string');
            }
            if (data.dashboard.defaultTheme && typeof data.dashboard.defaultTheme !== 'string') {
                errors.push('Default theme must be a string');
            }
            if (data.dashboard.gridSize && typeof data.dashboard.gridSize !== 'number') {
                errors.push('Grid size must be a number');
            }
        }

        // Validate display preferences
        if (data.display) {
            if (data.display.language && typeof data.display.language !== 'string') {
                errors.push('Language must be a string');
            }
            if (data.display.timezone && typeof data.display.timezone !== 'string') {
                errors.push('Timezone must be a string');
            }
        }

        // Validate notifications preferences
        if (data.notifications) {
            if (data.notifications.enableNotifications !== undefined && typeof data.notifications.enableNotifications !== 'boolean') {
                errors.push('Enable notifications must be a boolean');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Helper methods
     */
    incrementVersion(version) {
        const parts = version.split('.');
        const patch = parseInt(parts[2]) + 1;
        return `${parts[0]}.${parts[1]}.${patch}`;
    }

    /**
     * Get system status
     */
    getStatus() {
        return {
            isRunning: true,
            totalUsers: this.preferences.size,
            personalizationEnabled: this.options.enablePersonalization,
            syncEnabled: this.options.enableSync,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = UserPreferences;
