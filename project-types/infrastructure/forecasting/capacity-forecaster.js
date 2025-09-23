const ss = require('simple-statistics');
const regression = require('regression');

/**
 * Capacity Forecaster v2.4
 * Specialized forecasting for team capacity and workload planning
 */
class CapacityForecaster {
    constructor(options = {}) {
        this.options = {
            defaultHorizon: '30d',
            minDataPoints: 20,
            confidenceThreshold: 0.8,
            ...options
        };
        
        this.capacityForecasts = new Map();
        this.capacityModels = new Map();
    }

    /**
     * Forecast team capacity
     */
    async forecastCapacity(projectId, teamId, horizon, options = {}) {
        try {
            const forecastId = this.generateId();
            const startTime = Date.now();

            // Get team capacity data
            const capacityData = await this.getCapacityData(projectId, teamId, options.timeRange);
            
            if (capacityData.length < this.options.minDataPoints) {
                throw new Error(`Insufficient capacity data. Minimum required: ${this.options.minDataPoints}`);
            }

            // Get team member data
            const teamMembers = await this.getTeamMembers(teamId);
            
            // Generate capacity forecast
            const capacityForecast = await this.generateCapacityForecast(
                capacityData,
                teamMembers,
                horizon,
                options
            );
            
            // Calculate workload distribution
            const workloadDistribution = this.calculateWorkloadDistribution(
                capacityForecast,
                teamMembers,
                horizon
            );
            
            // Generate capacity recommendations
            const recommendations = this.generateCapacityRecommendations(
                capacityForecast,
                teamMembers,
                horizon
            );
            
            // Calculate capacity metrics
            const metrics = this.calculateCapacityMetrics(capacityForecast, capacityData);

            const result = {
                forecastId,
                projectId,
                teamId,
                horizon,
                forecast: capacityForecast,
                workloadDistribution,
                recommendations,
                metrics,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };

            this.capacityForecasts.set(forecastId, result);
            return result;
        } catch (error) {
            throw new Error(`Capacity forecasting failed: ${error.message}`);
        }
    }

    /**
     * Generate capacity forecast
     */
    async generateCapacityForecast(capacityData, teamMembers, horizon, options = {}) {
        const values = capacityData.map(d => d.capacity);
        const timestamps = capacityData.map(d => new Date(d.timestamp));

        // Select forecasting method
        const method = this.selectCapacityMethod(values, options);
        
        // Generate base forecast
        const baseForecast = await this.generateBaseForecast(values, timestamps, horizon, method, options);
        
        // Adjust for team changes
        const adjustedForecast = this.adjustForTeamChanges(baseForecast, teamMembers, horizon);
        
        // Apply capacity constraints
        const constrainedForecast = this.applyCapacityConstraints(adjustedForecast, teamMembers);
        
        // Calculate confidence
        const confidence = this.calculateCapacityConfidence(constrainedForecast, capacityData);

        return {
            method,
            values: constrainedForecast.values,
            confidence,
            parameters: constrainedForecast.parameters,
            adjustments: constrainedForecast.adjustments,
            constraints: constrainedForecast.constraints
        };
    }

    /**
     * Generate base forecast
     */
    async generateBaseForecast(values, timestamps, horizon, method, options = {}) {
        let forecast;
        switch (method) {
            case 'linear':
                forecast = this.linearCapacityForecast(values, horizon, options);
                break;
            case 'seasonal':
                forecast = this.seasonalCapacityForecast(values, timestamps, horizon, options);
                break;
            case 'team_based':
                forecast = this.teamBasedForecast(values, horizon, options);
                break;
            case 'workload_driven':
                forecast = this.workloadDrivenForecast(values, horizon, options);
                break;
            default:
                forecast = this.linearCapacityForecast(values, horizon, options);
        }

        return forecast;
    }

    /**
     * Linear capacity forecast
     */
    linearCapacityForecast(values, horizon, options = {}) {
        const xValues = values.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );

        const slope = regressionResult.equation[0];
        const intercept = regressionResult.equation[1];
        const rSquared = regressionResult.r2;

        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            const x = values.length + i;
            const predicted = slope * x + intercept;
            forecast.push(Math.max(0, predicted));

            const confidenceScore = rSquared * 0.9;
            confidence.push(Math.max(0, Math.min(1, confidenceScore)));
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'linear',
            parameters: { slope, intercept, rSquared }
        };
    }

    /**
     * Seasonal capacity forecast
     */
    seasonalCapacityForecast(values, timestamps, horizon, options = {}) {
        const seasonalPeriod = this.detectSeasonalPeriod(values);
        
        if (seasonalPeriod < 2) {
            return this.linearCapacityForecast(values, horizon, options);
        }

        const decomposition = this.decomposeTimeSeries(values, timestamps, seasonalPeriod);
        
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            const trendValue = this.extendTrend(decomposition.trend, i + 1);
            const seasonalIndex = (decomposition.trend.length + i) % decomposition.seasonal.length;
            const seasonalValue = decomposition.seasonal[seasonalIndex];
            
            const predicted = Math.max(0, trendValue + seasonalValue);
            forecast.push(predicted);

            const seasonalStrength = this.calculateSeasonalStrength(decomposition.seasonal);
            confidence.push(Math.max(0.6, seasonalStrength));
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'seasonal',
            parameters: {
                seasonalPeriod,
                seasonalStrength: this.calculateSeasonalStrength(decomposition.seasonal)
            }
        };
    }

    /**
     * Team-based forecast
     */
    teamBasedForecast(values, horizon, options = {}) {
        const teamSize = options.teamSize || 5;
        const averageCapacity = ss.mean(values);
        const capacityPerPerson = averageCapacity / teamSize;
        
        const forecast = [];
        const confidence = [];

        for (let i = 0; i < horizon; i++) {
            // Simple team-based prediction
            const predicted = teamSize * capacityPerPerson;
            forecast.push(predicted);
            confidence.push(0.8);
        }

        return {
            values: forecast,
            confidence: ss.mean(confidence),
            method: 'team_based',
            parameters: { teamSize, capacityPerPerson }
        };
    }

    /**
     * Workload-driven forecast
     */
    workloadDrivenForecast(values, horizon, options = {}) {
        const workloadData = options.workloadData || values;
        const correlation = this.calculateCorrelation(values, workloadData);
        
        if (Math.abs(correlation) < 0.3) {
            return this.linearCapacityForecast(values, horizon, options);
        }

        const workloadForecast = this.linearCapacityForecast(workloadData, horizon, options);
        const capacityForecast = workloadForecast.values.map(v => v * correlation);

        return {
            values: capacityForecast,
            confidence: workloadForecast.confidence * Math.abs(correlation),
            method: 'workload_driven',
            parameters: { correlation, workloadForecast: workloadForecast.parameters }
        };
    }

    /**
     * Adjust for team changes
     */
    adjustForTeamChanges(forecast, teamMembers, horizon) {
        const adjustments = [];
        const adjustedValues = [...forecast.values];

        // Check for planned team changes
        const plannedChanges = this.getPlannedTeamChanges(teamMembers, horizon);
        
        plannedChanges.forEach(change => {
            const adjustmentFactor = change.type === 'add' ? 1.2 : 0.8;
            const startIndex = change.startDay;
            const endIndex = Math.min(startIndex + change.duration, horizon);
            
            for (let i = startIndex; i < endIndex; i++) {
                adjustedValues[i] *= adjustmentFactor;
            }
            
            adjustments.push({
                type: change.type,
                startDay: startIndex,
                duration: change.duration,
                factor: adjustmentFactor
            });
        });

        return {
            ...forecast,
            values: adjustedValues,
            adjustments
        };
    }

    /**
     * Apply capacity constraints
     */
    applyCapacityConstraints(forecast, teamMembers) {
        const constraints = [];
        const constrainedValues = [...forecast.values];
        
        // Maximum capacity constraint
        const maxCapacity = teamMembers.length * 40; // 40 hours per person per week
        
        // Minimum capacity constraint
        const minCapacity = Math.max(1, teamMembers.length * 20); // 20 hours per person per week
        
        constrainedValues.forEach((value, index) => {
            if (value > maxCapacity) {
                constrainedValues[index] = maxCapacity;
                constraints.push({
                    type: 'max_capacity',
                    day: index,
                    originalValue: value,
                    constrainedValue: maxCapacity
                });
            } else if (value < minCapacity) {
                constrainedValues[index] = minCapacity;
                constraints.push({
                    type: 'min_capacity',
                    day: index,
                    originalValue: value,
                    constrainedValue: minCapacity
                });
            }
        });

        return {
            ...forecast,
            values: constrainedValues,
            constraints
        };
    }

    /**
     * Calculate workload distribution
     */
    calculateWorkloadDistribution(forecast, teamMembers, horizon) {
        const distribution = [];
        
        for (let i = 0; i < horizon; i++) {
            const totalCapacity = forecast.values[i];
            const memberCapacity = totalCapacity / teamMembers.length;
            
            const memberDistribution = teamMembers.map(member => ({
                memberId: member.id,
                name: member.name,
                capacity: memberCapacity,
                utilization: Math.min(1, memberCapacity / member.maxCapacity || 40),
                skills: member.skills || []
            }));
            
            distribution.push({
                day: i,
                totalCapacity,
                memberDistribution
            });
        }

        return distribution;
    }

    /**
     * Generate capacity recommendations
     */
    generateCapacityRecommendations(forecast, teamMembers, horizon) {
        const recommendations = [];

        // Capacity utilization recommendations
        const avgCapacity = ss.mean(forecast.values);
        const maxCapacity = Math.max(...forecast.values);
        const minCapacity = Math.min(...forecast.values);
        
        if (maxCapacity - minCapacity > avgCapacity * 0.5) {
            recommendations.push({
                type: 'capacity_variation',
                message: 'High variation in capacity forecast. Consider smoothing workload distribution.',
                priority: 'medium',
                variation: maxCapacity - minCapacity,
                average: avgCapacity
            });
        }

        // Team size recommendations
        const currentTeamSize = teamMembers.length;
        const forecastedCapacity = ss.mean(forecast.values);
        const capacityPerPerson = forecastedCapacity / currentTeamSize;
        
        if (capacityPerPerson > 45) {
            recommendations.push({
                type: 'team_expansion',
                message: 'High capacity per person. Consider expanding team.',
                priority: 'high',
                currentTeamSize,
                capacityPerPerson,
                suggestedTeamSize: Math.ceil(forecastedCapacity / 35)
            });
        } else if (capacityPerPerson < 25) {
            recommendations.push({
                type: 'team_optimization',
                message: 'Low capacity per person. Consider optimizing team size.',
                priority: 'medium',
                currentTeamSize,
                capacityPerPerson,
                suggestedTeamSize: Math.ceil(forecastedCapacity / 35)
            });
        }

        // Skill gap recommendations
        const skillGaps = this.identifySkillGaps(teamMembers, forecast);
        if (skillGaps.length > 0) {
            recommendations.push({
                type: 'skill_gaps',
                message: 'Skill gaps identified. Consider training or hiring.',
                priority: 'high',
                skillGaps
            });
        }

        return recommendations;
    }

    /**
     * Calculate capacity metrics
     */
    calculateCapacityMetrics(forecast, capacityData) {
        const historicalValues = capacityData.map(d => d.capacity);
        const forecastValues = forecast.values;
        
        return {
            currentCapacity: ss.mean(historicalValues),
            forecastedCapacity: ss.mean(forecastValues),
            capacityGrowth: this.calculateGrowthRate(historicalValues, forecastValues),
            capacityEfficiency: this.calculateCapacityEfficiency(historicalValues),
            capacityVariability: this.calculateCapacityVariability(forecastValues),
            utilizationRate: this.calculateUtilizationRate(historicalValues, forecastValues)
        };
    }

    /**
     * Select capacity forecasting method
     */
    selectCapacityMethod(values, options = {}) {
        if (options.method) {
            return options.method;
        }

        // Analyze capacity patterns
        const trend = this.calculateTrend(values);
        const seasonality = this.detectSeasonality(values);
        const variability = this.calculateVariability(values);

        if (seasonality.detected && seasonality.strength > 0.3) {
            return 'seasonal';
        } else if (trend.rSquared > 0.7) {
            return 'linear';
        } else if (variability < 0.2) {
            return 'team_based';
        } else {
            return 'workload_driven';
        }
    }

    /**
     * Helper methods
     */
    async getCapacityData(projectId, teamId, timeRange = '90d') {
        // This would typically fetch from database
        return this.generateMockCapacityData(projectId, teamId, timeRange);
    }

    async getTeamMembers(teamId) {
        // This would typically fetch from database
        return this.generateMockTeamMembers(teamId);
    }

    generateMockCapacityData(projectId, teamId, timeRange) {
        const data = [];
        const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            // Generate capacity data with weekly patterns
            const baseCapacity = 200; // 200 hours per week
            const weeklyPattern = Math.sin(i * 2 * Math.PI / 7) * 20;
            const trend = i * 0.5;
            const noise = (Math.random() - 0.5) * 10;
            const capacity = Math.max(0, baseCapacity + weeklyPattern + trend + noise);

            data.push({
                projectId,
                teamId,
                capacity,
                timestamp: date.toISOString()
            });
        }

        return data;
    }

    generateMockTeamMembers(teamId) {
        return [
            { id: 1, name: 'John Doe', maxCapacity: 40, skills: ['frontend', 'react'] },
            { id: 2, name: 'Jane Smith', maxCapacity: 40, skills: ['backend', 'nodejs'] },
            { id: 3, name: 'Bob Johnson', maxCapacity: 40, skills: ['database', 'sql'] },
            { id: 4, name: 'Alice Brown', maxCapacity: 40, skills: ['devops', 'aws'] },
            { id: 5, name: 'Charlie Wilson', maxCapacity: 40, skills: ['testing', 'qa'] }
        ];
    }

    getPlannedTeamChanges(teamMembers, horizon) {
        // This would typically fetch from database
        return [
            {
                type: 'add',
                startDay: 7,
                duration: 14,
                memberCount: 1
            }
        ];
    }

    identifySkillGaps(teamMembers, forecast) {
        // Simplified skill gap identification
        const requiredSkills = ['frontend', 'backend', 'database', 'devops', 'testing'];
        const availableSkills = teamMembers.flatMap(member => member.skills || []);
        const uniqueSkills = [...new Set(availableSkills)];
        
        return requiredSkills.filter(skill => !uniqueSkills.includes(skill));
    }

    calculateTrend(values) {
        const xValues = values.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );

        return {
            slope: regressionResult.equation[0],
            intercept: regressionResult.equation[1],
            rSquared: regressionResult.r2
        };
    }

    detectSeasonality(values) {
        if (values.length < 14) return { detected: false };

        const autocorrelations = this.calculateAutocorrelations(values);
        const peaks = this.findPeaks(autocorrelations);
        
        return {
            detected: peaks.length > 0 && peaks[0].value > 0.3,
            strength: peaks.length > 0 ? peaks[0].value : 0,
            period: peaks.length > 0 ? peaks[0].lag : 0
        };
    }

    calculateVariability(values) {
        const mean = ss.mean(values);
        const std = ss.standardDeviation(values);
        return std / mean;
    }

    calculateAutocorrelations(values) {
        const n = values.length;
        const mean = ss.mean(values);
        const centered = values.map(v => v - mean);
        const autocorrelations = [];

        for (let lag = 1; lag < Math.min(n / 2, 20); lag++) {
            let numerator = 0;
            let denominator = 0;

            for (let i = lag; i < n; i++) {
                numerator += centered[i] * centered[i - lag];
                denominator += centered[i] * centered[i];
            }

            const autocorr = denominator > 0 ? numerator / denominator : 0;
            autocorrelations.push({ lag, value: autocorr });
        }

        return autocorrelations;
    }

    findPeaks(autocorrelations) {
        const peaks = [];
        
        for (let i = 1; i < autocorrelations.length - 1; i++) {
            const prev = autocorrelations[i - 1].value;
            const curr = autocorrelations[i].value;
            const next = autocorrelations[i + 1].value;

            if (curr > prev && curr > next && curr > 0.2) {
                peaks.push(autocorrelations[i]);
            }
        }

        return peaks.sort((a, b) => b.value - a.value);
    }

    decomposeTimeSeries(values, timestamps, seasonalPeriod = 7) {
        const n = values.length;
        const xValues = values.map((_, i) => i);
        
        const trendRegression = regression.linear(
            xValues.map((x, i) => [x, values[i]])
        );
        const trend = xValues.map(x => trendRegression.equation[0] * x + trendRegression.equation[1]);
        
        const detrended = values.map((v, i) => v - trend[i]);
        const seasonal = this.calculateSeasonalComponent(detrended, seasonalPeriod);
        
        return {
            trend,
            seasonal,
            residual: detrended.map((v, i) => v - seasonal[i % seasonal.length])
        };
    }

    calculateSeasonalComponent(values, period) {
        const seasonal = new Array(period).fill(0);
        const counts = new Array(period).fill(0);

        values.forEach((value, index) => {
            const periodIndex = index % period;
            seasonal[periodIndex] += value;
            counts[periodIndex]++;
        });

        return seasonal.map((sum, index) => sum / counts[index]);
    }

    extendTrend(trend, steps) {
        if (trend.length < 2) return trend[trend.length - 1] || 0;
        
        const xValues = trend.map((_, i) => i);
        const regressionResult = regression.linear(
            xValues.map((x, i) => [x, trend[i]])
        );
        
        const slope = regressionResult.equation[0];
        const intercept = regressionResult.equation[1];
        
        return slope * (trend.length + steps - 1) + intercept;
    }

    calculateSeasonalStrength(seasonal) {
        const mean = ss.mean(seasonal);
        const variance = ss.variance(seasonal);
        return variance / (mean * mean + variance);
    }

    calculateCorrelation(values1, values2) {
        if (values1.length !== values2.length || values1.length < 2) return 0;
        
        const n = values1.length;
        const sum1 = values1.reduce((sum, val) => sum + val, 0);
        const sum2 = values2.reduce((sum, val) => sum + val, 0);
        const sum1Sq = values1.reduce((sum, val) => sum + val * val, 0);
        const sum2Sq = values2.reduce((sum, val) => sum + val * val, 0);
        const sumProduct = values1.reduce((sum, val, i) => sum + val * values2[i], 0);
        
        const numerator = n * sumProduct - sum1 * sum2;
        const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    calculateCapacityConfidence(forecast, capacityData) {
        const historicalValues = capacityData.map(d => d.capacity);
        const historicalVariability = this.calculateVariability(historicalValues);
        const forecastVariability = this.calculateVariability(forecast.values);
        
        // Confidence based on consistency between historical and forecast patterns
        const consistency = 1 - Math.abs(historicalVariability - forecastVariability);
        return Math.max(0.5, Math.min(1, consistency));
    }

    calculateGrowthRate(historical, forecast) {
        const historicalMean = ss.mean(historical);
        const forecastMean = ss.mean(forecast);
        return (forecastMean - historicalMean) / historicalMean;
    }

    calculateCapacityEfficiency(values) {
        const mean = ss.mean(values);
        const std = ss.standardDeviation(values);
        const coefficient = std / mean;
        
        return Math.max(0, 1 - coefficient);
    }

    calculateCapacityVariability(values) {
        return this.calculateVariability(values);
    }

    calculateUtilizationRate(historical, forecast) {
        const historicalMean = ss.mean(historical);
        const forecastMean = ss.mean(forecast);
        return forecastMean / historicalMean;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    getSystemStatus() {
        return {
            isRunning: true,
            totalForecasts: this.capacityForecasts.size,
            modelsLoaded: this.capacityModels.size,
            uptime: process.uptime(),
            lastUpdate: new Date().toISOString(),
            version: '2.4.0'
        };
    }
}

module.exports = CapacityForecaster;
