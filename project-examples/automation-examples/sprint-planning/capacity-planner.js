/**
 * Capacity Planner
 * Calculates team capacity for sprint planning
 */

class CapacityPlanner {
    constructor(options = {}) {
        this.workingDaysPerWeek = options.workingDaysPerWeek || 5;
        this.workingHoursPerDay = options.workingHoursPerDay || 8;
        this.capacityBuffer = options.capacityBuffer || 0.2; // 20% buffer
        this.vacationBuffer = 0.1; // 10% for vacations
        this.meetingBuffer = 0.15; // 15% for meetings and ceremonies
        this.isRunning = true;
    }

    /**
     * Calculate team capacity for a sprint
     */
    async calculateCapacity(teamId, startDate, endDate) {
        try {
            // Get team members
            const teamMembers = await this.getTeamMembers(teamId);
            
            if (teamMembers.length === 0) {
                return this.getDefaultCapacity();
            }
            
            // Calculate sprint duration
            const sprintDuration = this.calculateSprintDuration(startDate, endDate);
            const workingDays = this.calculateWorkingDays(startDate, endDate);
            
            // Calculate individual member capacities
            const memberCapacities = await Promise.all(
                teamMembers.map(member => 
                    this.calculateMemberCapacity(member, startDate, endDate, workingDays)
                )
            );
            
            // Calculate team capacity
            const teamCapacity = this.calculateTeamCapacity(memberCapacities, sprintDuration);
            
            // Apply buffers
            const bufferedCapacity = this.applyBuffers(teamCapacity, sprintDuration);
            
            // Calculate capacity metrics
            const capacityMetrics = this.calculateCapacityMetrics(
                teamCapacity,
                bufferedCapacity,
                memberCapacities,
                sprintDuration
            );
            
            return {
                teamId,
                startDate,
                endDate,
                sprintDuration,
                workingDays,
                teamMembers: memberCapacities,
                totalCapacity: teamCapacity.total,
                bufferedCapacity: bufferedCapacity.total,
                capacityUtilization: capacityMetrics.utilization,
                capacityDistribution: capacityMetrics.distribution,
                capacityTrend: capacityMetrics.trend,
                capacityRisks: capacityMetrics.risks,
                recommendations: capacityMetrics.recommendations,
                metadata: {
                    calculatedAt: new Date(),
                    calculationMethod: 'standard',
                    buffersApplied: {
                        capacity: this.capacityBuffer,
                        vacation: this.vacationBuffer,
                        meetings: this.meetingBuffer
                    }
                }
            };
        } catch (error) {
            console.error('Error calculating capacity:', error);
            return this.getDefaultCapacity();
        }
    }

    /**
     * Get team members
     */
    async getTeamMembers(teamId) {
        // This would typically query a database
        // For now, return mock data
        const mockTeamMembers = [
            {
                id: 'member_1',
                name: 'John Doe',
                role: 'Senior Developer',
                skills: [
                    { name: 'JavaScript', level: 8 },
                    { name: 'Node.js', level: 7 },
                    { name: 'React', level: 6 }
                ],
                availability: 1.0, // 100% available
                efficiency: 0.9, // 90% efficient
                timezone: 'UTC',
                workingHours: { start: 9, end: 17 },
                vacationDays: [],
                partTime: false,
                experience: 5
            },
            {
                id: 'member_2',
                name: 'Jane Smith',
                role: 'Developer',
                skills: [
                    { name: 'Python', level: 7 },
                    { name: 'Django', level: 6 },
                    { name: 'PostgreSQL', level: 5 }
                ],
                availability: 0.8, // 80% available
                efficiency: 0.85, // 85% efficient
                timezone: 'UTC',
                workingHours: { start: 9, end: 17 },
                vacationDays: ['2024-02-15', '2024-02-16'], // 2 vacation days
                partTime: false,
                experience: 3
            },
            {
                id: 'member_3',
                name: 'Bob Johnson',
                role: 'Junior Developer',
                skills: [
                    { name: 'JavaScript', level: 5 },
                    { name: 'CSS', level: 6 },
                    { name: 'HTML', level: 7 }
                ],
                availability: 1.0, // 100% available
                efficiency: 0.7, // 70% efficient
                timezone: 'UTC',
                workingHours: { start: 9, end: 17 },
                vacationDays: [],
                partTime: true, // Part-time
                experience: 1
            }
        ];
        
        return mockTeamMembers;
    }

    /**
     * Calculate individual member capacity
     */
    async calculateMemberCapacity(member, startDate, endDate, workingDays) {
        // Calculate base capacity
        const baseCapacity = workingDays * this.workingHoursPerDay;
        
        // Apply availability factor
        const availableCapacity = baseCapacity * member.availability;
        
        // Apply efficiency factor
        const efficientCapacity = availableCapacity * member.efficiency;
        
        // Calculate vacation impact
        const vacationImpact = this.calculateVacationImpact(member, startDate, endDate);
        
        // Calculate meeting impact
        const meetingImpact = this.calculateMeetingImpact(member, workingDays);
        
        // Calculate final capacity
        const finalCapacity = efficientCapacity - vacationImpact - meetingImpact;
        
        // Calculate capacity per day
        const capacityPerDay = workingDays > 0 ? finalCapacity / workingDays : 0;
        
        return {
            id: member.id,
            name: member.name,
            role: member.role,
            baseCapacity,
            availableCapacity,
            efficientCapacity,
            vacationImpact,
            meetingImpact,
            finalCapacity: Math.max(0, finalCapacity),
            capacityPerDay,
            availability: member.availability,
            efficiency: member.efficiency,
            partTime: member.partTime,
            experience: member.experience,
            skills: member.skills,
            timezone: member.timezone,
            workingHours: member.workingHours,
            vacationDays: member.vacationDays,
            capacityUtilization: this.calculateMemberUtilization(member, finalCapacity),
            capacityRisks: this.identifyMemberRisks(member, finalCapacity),
            recommendations: this.generateMemberRecommendations(member, finalCapacity)
        };
    }

    /**
     * Calculate vacation impact
     */
    calculateVacationImpact(member, startDate, endDate) {
        if (!member.vacationDays || member.vacationDays.length === 0) {
            return 0;
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        let vacationHours = 0;
        
        member.vacationDays.forEach(vacationDay => {
            const vacationDate = new Date(vacationDay);
            if (vacationDate >= start && vacationDate <= end) {
                // Check if it's a working day
                const dayOfWeek = vacationDate.getDay();
                if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
                    vacationHours += this.workingHoursPerDay;
                }
            }
        });
        
        return vacationHours;
    }

    /**
     * Calculate meeting impact
     */
    calculateMeetingImpact(member, workingDays) {
        // Base meeting time per day
        const baseMeetingTime = 1; // 1 hour per day
        
        // Role-based meeting time
        const roleMeetingTime = this.getRoleMeetingTime(member.role);
        
        // Total meeting time
        const totalMeetingTime = (baseMeetingTime + roleMeetingTime) * workingDays;
        
        return totalMeetingTime;
    }

    /**
     * Get role-based meeting time
     */
    getRoleMeetingTime(role) {
        const roleMeetingTimes = {
            'Senior Developer': 0.5,
            'Developer': 0.3,
            'Junior Developer': 0.2,
            'Team Lead': 1.0,
            'Product Manager': 1.5,
            'Scrum Master': 1.0
        };
        
        return roleMeetingTimes[role] || 0.3;
    }

    /**
     * Calculate team capacity
     */
    calculateTeamCapacity(memberCapacities, sprintDuration) {
        const totalCapacity = memberCapacities.reduce((sum, member) => 
            sum + member.finalCapacity, 0
        );
        
        const averageCapacity = memberCapacities.length > 0 ? 
            totalCapacity / memberCapacities.length : 0;
        
        const capacityVariance = this.calculateCapacityVariance(memberCapacities, averageCapacity);
        
        return {
            total: totalCapacity,
            average: averageCapacity,
            variance: capacityVariance,
            memberCount: memberCapacities.length,
            capacityPerDay: sprintDuration > 0 ? totalCapacity / sprintDuration : 0,
            capacityPerWeek: sprintDuration > 0 ? totalCapacity / (sprintDuration / 7) : 0
        };
    }

    /**
     * Calculate capacity variance
     */
    calculateCapacityVariance(memberCapacities, averageCapacity) {
        if (memberCapacities.length < 2) return 0;
        
        const variance = memberCapacities.reduce((sum, member) => 
            sum + Math.pow(member.finalCapacity - averageCapacity, 2), 0
        ) / memberCapacities.length;
        
        return Math.sqrt(variance);
    }

    /**
     * Apply buffers to capacity
     */
    applyBuffers(teamCapacity, sprintDuration) {
        const capacityBuffer = teamCapacity.total * this.capacityBuffer;
        const vacationBuffer = teamCapacity.total * this.vacationBuffer;
        const meetingBuffer = teamCapacity.total * this.meetingBuffer;
        
        const totalBuffer = capacityBuffer + vacationBuffer + meetingBuffer;
        const bufferedTotal = teamCapacity.total - totalBuffer;
        
        return {
            total: Math.max(0, bufferedTotal),
            average: teamCapacity.average * (1 - this.capacityBuffer - this.vacationBuffer - this.meetingBuffer),
            variance: teamCapacity.variance,
            memberCount: teamCapacity.memberCount,
            capacityPerDay: sprintDuration > 0 ? bufferedTotal / sprintDuration : 0,
            capacityPerWeek: sprintDuration > 0 ? bufferedTotal / (sprintDuration / 7) : 0,
            buffers: {
                capacity: capacityBuffer,
                vacation: vacationBuffer,
                meetings: meetingBuffer,
                total: totalBuffer
            }
        };
    }

    /**
     * Calculate capacity metrics
     */
    calculateCapacityMetrics(teamCapacity, bufferedCapacity, memberCapacities, sprintDuration) {
        const utilization = this.calculateCapacityUtilization(teamCapacity, bufferedCapacity);
        const distribution = this.calculateCapacityDistribution(memberCapacities);
        const trend = this.calculateCapacityTrend(memberCapacities);
        const risks = this.identifyCapacityRisks(teamCapacity, memberCapacities);
        const recommendations = this.generateCapacityRecommendations(
            teamCapacity,
            bufferedCapacity,
            memberCapacities,
            risks
        );
        
        return {
            utilization,
            distribution,
            trend,
            risks,
            recommendations
        };
    }

    /**
     * Calculate capacity utilization
     */
    calculateCapacityUtilization(teamCapacity, bufferedCapacity) {
        if (teamCapacity.total === 0) return 0;
        
        return {
            total: bufferedCapacity.total / teamCapacity.total,
            capacityBuffer: this.capacityBuffer,
            vacationBuffer: this.vacationBuffer,
            meetingBuffer: this.meetingBuffer,
            effectiveUtilization: bufferedCapacity.total / teamCapacity.total
        };
    }

    /**
     * Calculate capacity distribution
     */
    calculateCapacityDistribution(memberCapacities) {
        const totalCapacity = memberCapacities.reduce((sum, member) => sum + member.finalCapacity, 0);
        
        return memberCapacities.map(member => ({
            memberId: member.id,
            memberName: member.name,
            capacity: member.finalCapacity,
            percentage: totalCapacity > 0 ? (member.finalCapacity / totalCapacity) * 100 : 0,
            role: member.role,
            partTime: member.partTime
        }));
    }

    /**
     * Calculate capacity trend
     */
    calculateCapacityTrend(memberCapacities) {
        // This would typically analyze historical data
        // For now, return a mock trend
        return {
            direction: 'stable',
            change: 0,
            confidence: 0.5,
            factors: ['No historical data available']
        };
    }

    /**
     * Identify capacity risks
     */
    identifyCapacityRisks(teamCapacity, memberCapacities) {
        const risks = [];
        
        // Low total capacity
        if (teamCapacity.total < 100) { // Less than 100 hours
            risks.push({
                type: 'low_capacity',
                severity: 'high',
                message: 'Total team capacity is very low',
                impact: 'May not be able to complete planned work',
                mitigation: 'Consider adding team members or reducing scope'
            });
        }
        
        // High capacity variance
        if (teamCapacity.variance > teamCapacity.average * 0.5) {
            risks.push({
                type: 'high_variance',
                severity: 'medium',
                message: 'High variance in member capacities',
                impact: 'Uneven workload distribution',
                mitigation: 'Balance workload across team members'
            });
        }
        
        // Part-time members
        const partTimeMembers = memberCapacities.filter(m => m.partTime);
        if (partTimeMembers.length > memberCapacities.length * 0.5) {
            risks.push({
                type: 'part_time_heavy',
                severity: 'medium',
                message: 'High percentage of part-time members',
                impact: 'May affect collaboration and knowledge sharing',
                mitigation: 'Ensure adequate overlap in working hours'
            });
        }
        
        // Low efficiency members
        const lowEfficiencyMembers = memberCapacities.filter(m => m.efficiency < 0.7);
        if (lowEfficiencyMembers.length > 0) {
            risks.push({
                type: 'low_efficiency',
                severity: 'medium',
                message: `${lowEfficiencyMembers.length} members have low efficiency`,
                impact: 'May affect sprint velocity',
                mitigation: 'Provide training or support to improve efficiency'
            });
        }
        
        return risks;
    }

    /**
     * Generate capacity recommendations
     */
    generateCapacityRecommendations(teamCapacity, bufferedCapacity, memberCapacities, risks) {
        const recommendations = [];
        
        // Capacity recommendations
        if (bufferedCapacity.total < 120) { // Less than 120 hours
            recommendations.push({
                type: 'capacity',
                priority: 'high',
                message: 'Consider increasing team size or extending sprint duration',
                action: 'Add more team members or increase sprint length'
            });
        }
        
        // Distribution recommendations
        const maxCapacity = Math.max(...memberCapacities.map(m => m.finalCapacity));
        const minCapacity = Math.min(...memberCapacities.map(m => m.finalCapacity));
        
        if (maxCapacity > minCapacity * 2) {
            recommendations.push({
                type: 'distribution',
                priority: 'medium',
                message: 'Uneven capacity distribution detected',
                action: 'Balance workload or adjust team composition'
            });
        }
        
        // Efficiency recommendations
        const averageEfficiency = memberCapacities.reduce((sum, m) => sum + m.efficiency, 0) / memberCapacities.length;
        if (averageEfficiency < 0.8) {
            recommendations.push({
                type: 'efficiency',
                priority: 'medium',
                message: 'Team efficiency could be improved',
                action: 'Identify and address efficiency blockers'
            });
        }
        
        // Risk-based recommendations
        risks.forEach(risk => {
            if (risk.severity === 'high') {
                recommendations.push({
                    type: 'risk',
                    priority: 'high',
                    message: risk.message,
                    action: risk.mitigation
                });
            }
        });
        
        return recommendations;
    }

    /**
     * Calculate member utilization
     */
    calculateMemberUtilization(member, finalCapacity) {
        const baseCapacity = this.workingHoursPerDay * this.workingDaysPerWeek * 2; // 2 weeks
        return baseCapacity > 0 ? finalCapacity / baseCapacity : 0;
    }

    /**
     * Identify member risks
     */
    identifyMemberRisks(member, finalCapacity) {
        const risks = [];
        
        if (member.availability < 0.8) {
            risks.push({
                type: 'low_availability',
                message: 'Low availability may affect sprint delivery'
            });
        }
        
        if (member.efficiency < 0.7) {
            risks.push({
                type: 'low_efficiency',
                message: 'Low efficiency may impact velocity'
            });
        }
        
        if (member.partTime && finalCapacity < 20) {
            risks.push({
                type: 'low_capacity',
                message: 'Very low capacity for part-time member'
            });
        }
        
        return risks;
    }

    /**
     * Generate member recommendations
     */
    generateMemberRecommendations(member, finalCapacity) {
        const recommendations = [];
        
        if (member.availability < 0.9) {
            recommendations.push({
                type: 'availability',
                message: 'Consider improving availability for better sprint participation'
            });
        }
        
        if (member.efficiency < 0.8) {
            recommendations.push({
                type: 'efficiency',
                message: 'Focus on improving efficiency through training or process optimization'
            });
        }
        
        if (member.experience < 2) {
            recommendations.push({
                type: 'experience',
                message: 'Provide mentoring and support for junior team member'
            });
        }
        
        return recommendations;
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
     * Calculate working days between dates
     */
    calculateWorkingDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let workingDays = 0;
        
        while (start <= end) {
            const dayOfWeek = start.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
                workingDays++;
            }
            start.setDate(start.getDate() + 1);
        }
        
        return workingDays;
    }

    /**
     * Get default capacity when no team data
     */
    getDefaultCapacity() {
        return {
            teamId: null,
            startDate: null,
            endDate: null,
            sprintDuration: 14,
            workingDays: 10,
            teamMembers: [],
            totalCapacity: 0,
            bufferedCapacity: 0,
            capacityUtilization: 0,
            capacityDistribution: [],
            capacityTrend: { direction: 'stable', change: 0, confidence: 0 },
            capacityRisks: [],
            recommendations: [{
                type: 'data_quality',
                priority: 'high',
                message: 'No team data available',
                action: 'Configure team members and their availability'
            }],
            metadata: {
                calculatedAt: new Date(),
                calculationMethod: 'default',
                buffersApplied: {
                    capacity: this.capacityBuffer,
                    vacation: this.vacationBuffer,
                    meetings: this.meetingBuffer
                }
            }
        };
    }

    /**
     * Stop the capacity planner
     */
    stop() {
        this.isRunning = false;
    }
}

module.exports = CapacityPlanner;
