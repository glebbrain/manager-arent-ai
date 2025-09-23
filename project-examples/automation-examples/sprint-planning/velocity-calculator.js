/**
 * Velocity Calculator
 * Calculates team velocity for sprint planning
 */

class VelocityCalculator {
    constructor(options = {}) {
        this.velocityWindow = options.velocityWindow || 3; // sprints
        this.minSprintsForCalculation = 2;
        this.outlierThreshold = 0.3; // 30% deviation from average
        this.trendWeight = 0.3; // Weight for trend analysis
        this.isRunning = true;
    }

    /**
     * Calculate team velocity
     */
    async calculateVelocity(teamId, projectId, sprintCount = null) {
        try {
            // Get historical sprint data
            const historicalData = await this.getHistoricalSprintData(teamId, projectId);
            
            if (historicalData.length < this.minSprintsForCalculation) {
                return this.getDefaultVelocity(teamId);
            }
            
            // Calculate different velocity metrics
            const velocities = this.extractVelocities(historicalData);
            const filteredVelocities = this.filterOutliers(velocities);
            
            const averageVelocity = this.calculateAverage(filteredVelocities);
            const medianVelocity = this.calculateMedian(filteredVelocities);
            const trendVelocity = this.calculateTrendVelocity(filteredVelocities);
            const weightedVelocity = this.calculateWeightedVelocity(filteredVelocities);
            
            // Calculate confidence based on data quality
            const confidence = this.calculateConfidence(historicalData, filteredVelocities);
            
            // Predict next sprint velocity
            const predictedVelocity = this.predictNextVelocity(
                filteredVelocities,
                trendVelocity,
                confidence
            );
            
            return {
                teamId,
                projectId,
                average: averageVelocity,
                median: medianVelocity,
                trend: trendVelocity,
                weighted: weightedVelocity,
                predicted: predictedVelocity,
                confidence,
                dataPoints: filteredVelocities.length,
                totalDataPoints: velocities.length,
                outliers: velocities.length - filteredVelocities.length,
                trendDirection: this.getTrendDirection(filteredVelocities),
                stability: this.calculateStability(filteredVelocities),
                recommendations: this.generateRecommendations(
                    averageVelocity,
                    trendVelocity,
                    confidence,
                    filteredVelocities
                )
            };
        } catch (error) {
            console.error('Error calculating velocity:', error);
            return this.getDefaultVelocity(teamId);
        }
    }

    /**
     * Get historical sprint data
     */
    async getHistoricalSprintData(teamId, projectId) {
        // This would typically query a database
        // For now, return mock data
        const mockData = [
            {
                sprintId: 'sprint_1',
                teamId,
                projectId,
                sprintNumber: 1,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-14'),
                plannedStoryPoints: 20,
                completedStoryPoints: 18,
                plannedHours: 160,
                completedHours: 150,
                velocity: 18,
                capacity: 160,
                successRate: 0.9
            },
            {
                sprintId: 'sprint_2',
                teamId,
                projectId,
                sprintNumber: 2,
                startDate: new Date('2024-01-15'),
                endDate: new Date('2024-01-28'),
                plannedStoryPoints: 22,
                completedStoryPoints: 20,
                plannedHours: 160,
                completedHours: 155,
                velocity: 20,
                capacity: 160,
                successRate: 0.91
            },
            {
                sprintId: 'sprint_3',
                teamId,
                projectId,
                sprintNumber: 3,
                startDate: new Date('2024-01-29'),
                endDate: new Date('2024-02-11'),
                plannedStoryPoints: 25,
                completedStoryPoints: 22,
                plannedHours: 160,
                completedHours: 158,
                velocity: 22,
                capacity: 160,
                successRate: 0.88
            },
            {
                sprintId: 'sprint_4',
                teamId,
                projectId,
                sprintNumber: 4,
                startDate: new Date('2024-02-12'),
                endDate: new Date('2024-02-25'),
                plannedStoryPoints: 24,
                completedStoryPoints: 21,
                plannedHours: 160,
                completedHours: 152,
                velocity: 21,
                capacity: 160,
                successRate: 0.875
            }
        ];
        
        // Filter by team and project if specified
        let filteredData = mockData;
        if (teamId) {
            filteredData = filteredData.filter(d => d.teamId === teamId);
        }
        if (projectId) {
            filteredData = filteredData.filter(d => d.projectId === projectId);
        }
        
        return filteredData;
    }

    /**
     * Extract velocities from historical data
     */
    extractVelocities(historicalData) {
        return historicalData
            .map(data => data.velocity)
            .filter(velocity => velocity !== null && velocity !== undefined);
    }

    /**
     * Filter outliers from velocity data
     */
    filterOutliers(velocities) {
        if (velocities.length < 3) return velocities;
        
        const average = this.calculateAverage(velocities);
        const threshold = average * this.outlierThreshold;
        
        return velocities.filter(velocity => 
            Math.abs(velocity - average) <= threshold
        );
    }

    /**
     * Calculate average velocity
     */
    calculateAverage(velocities) {
        if (velocities.length === 0) return 0;
        return velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    }

    /**
     * Calculate median velocity
     */
    calculateMedian(velocities) {
        if (velocities.length === 0) return 0;
        
        const sorted = [...velocities].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
            return sorted[mid];
        }
    }

    /**
     * Calculate trend velocity
     */
    calculateTrendVelocity(velocities) {
        if (velocities.length < 2) return this.calculateAverage(velocities);
        
        // Simple linear regression for trend
        const n = velocities.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = velocities;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Predict next value
        return Math.max(0, slope * n + intercept);
    }

    /**
     * Calculate weighted velocity (recent sprints weighted more)
     */
    calculateWeightedVelocity(velocities) {
        if (velocities.length === 0) return 0;
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        velocities.forEach((velocity, index) => {
            const weight = Math.pow(1.2, index); // More recent = higher weight
            weightedSum += velocity * weight;
            totalWeight += weight;
        });
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    /**
     * Calculate confidence score
     */
    calculateConfidence(historicalData, velocities) {
        let confidence = 0.5; // Base confidence
        
        // Data quantity factor
        if (velocities.length >= 5) {
            confidence += 0.2;
        } else if (velocities.length >= 3) {
            confidence += 0.1;
        }
        
        // Data consistency factor
        const stability = this.calculateStability(velocities);
        confidence += stability * 0.2;
        
        // Recent data factor
        const recentData = this.getRecentDataFactor(historicalData);
        confidence += recentData * 0.1;
        
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Calculate velocity stability
     */
    calculateStability(velocities) {
        if (velocities.length < 2) return 0;
        
        const average = this.calculateAverage(velocities);
        const variance = velocities.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / velocities.length;
        const standardDeviation = Math.sqrt(variance);
        
        // Lower coefficient of variation = higher stability
        const coefficientOfVariation = standardDeviation / average;
        return Math.max(0, 1 - coefficientOfVariation);
    }

    /**
     * Get recent data factor
     */
    getRecentDataFactor(historicalData) {
        if (historicalData.length === 0) return 0;
        
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const recentSprints = historicalData.filter(data => 
            new Date(data.endDate) >= thirtyDaysAgo
        );
        
        return Math.min(1, recentSprints.length / 3); // 3 sprints = full factor
    }

    /**
     * Predict next sprint velocity
     */
    predictNextVelocity(velocities, trendVelocity, confidence) {
        const averageVelocity = this.calculateAverage(velocities);
        const weightedVelocity = this.calculateWeightedVelocity(velocities);
        
        // Combine different velocity metrics based on confidence
        let predictedVelocity = averageVelocity;
        
        if (confidence > 0.7) {
            // High confidence: use weighted average of trend and weighted velocity
            predictedVelocity = (trendVelocity * this.trendWeight) + 
                               (weightedVelocity * (1 - this.trendWeight));
        } else if (confidence > 0.5) {
            // Medium confidence: use average of all metrics
            predictedVelocity = (averageVelocity + trendVelocity + weightedVelocity) / 3;
        } else {
            // Low confidence: use conservative average
            predictedVelocity = averageVelocity * 0.9; // 10% conservative
        }
        
        return Math.max(0, Math.round(predictedVelocity));
    }

    /**
     * Get trend direction
     */
    getTrendDirection(velocities) {
        if (velocities.length < 2) return 'stable';
        
        const firstHalf = velocities.slice(0, Math.floor(velocities.length / 2));
        const secondHalf = velocities.slice(Math.floor(velocities.length / 2));
        
        const firstHalfAvg = this.calculateAverage(firstHalf);
        const secondHalfAvg = this.calculateAverage(secondHalf);
        
        const difference = secondHalfAvg - firstHalfAvg;
        const threshold = firstHalfAvg * 0.1; // 10% threshold
        
        if (difference > threshold) return 'increasing';
        if (difference < -threshold) return 'decreasing';
        return 'stable';
    }

    /**
     * Generate velocity recommendations
     */
    generateRecommendations(averageVelocity, trendVelocity, confidence, velocities) {
        const recommendations = [];
        
        // Confidence recommendations
        if (confidence < 0.5) {
            recommendations.push({
                type: 'data_quality',
                priority: 'high',
                message: 'Low confidence in velocity calculation',
                suggestion: 'Collect more historical sprint data to improve accuracy'
            });
        }
        
        // Stability recommendations
        const stability = this.calculateStability(velocities);
        if (stability < 0.7) {
            recommendations.push({
                type: 'stability',
                priority: 'medium',
                message: 'Velocity is inconsistent across sprints',
                suggestion: 'Investigate factors causing velocity variation and standardize processes'
            });
        }
        
        // Trend recommendations
        const trendDirection = this.getTrendDirection(velocities);
        if (trendDirection === 'increasing') {
            recommendations.push({
                type: 'trend',
                priority: 'low',
                message: 'Velocity is trending upward',
                suggestion: 'Consider gradually increasing sprint capacity'
            });
        } else if (trendDirection === 'decreasing') {
            recommendations.push({
                type: 'trend',
                priority: 'high',
                message: 'Velocity is trending downward',
                suggestion: 'Investigate blockers and team capacity issues'
            });
        }
        
        // Capacity recommendations
        if (averageVelocity < 10) {
            recommendations.push({
                type: 'capacity',
                priority: 'medium',
                message: 'Low average velocity',
                suggestion: 'Review team capacity and task estimation accuracy'
            });
        } else if (averageVelocity > 30) {
            recommendations.push({
                type: 'capacity',
                priority: 'low',
                message: 'High average velocity',
                suggestion: 'Ensure quality is maintained with high velocity'
            });
        }
        
        return recommendations;
    }

    /**
     * Get default velocity when no historical data
     */
    getDefaultVelocity(teamId) {
        return {
            teamId,
            projectId: null,
            average: 15, // Default story points per sprint
            median: 15,
            trend: 15,
            weighted: 15,
            predicted: 15,
            confidence: 0.3, // Low confidence for default
            dataPoints: 0,
            totalDataPoints: 0,
            outliers: 0,
            trendDirection: 'stable',
            stability: 0.5,
            recommendations: [{
                type: 'data_quality',
                priority: 'high',
                message: 'No historical data available',
                suggestion: 'Use conservative estimates and collect data for future sprints'
            }]
        };
    }

    /**
     * Calculate sprint duration in days
     */
    calculateSprintDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }

    /**
     * Calculate velocity per day
     */
    calculateVelocityPerDay(velocity, sprintDuration) {
        return sprintDuration > 0 ? velocity / sprintDuration : 0;
    }

    /**
     * Calculate velocity per hour
     */
    calculateVelocityPerHour(velocity, totalHours) {
        return totalHours > 0 ? velocity / totalHours : 0;
    }

    /**
     * Stop the velocity calculator
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = VelocityCalculator;
