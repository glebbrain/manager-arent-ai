const winston = require('winston');
const moment = require('moment');
const _ = require('lodash');

class KPICalculator {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/kpi-calculator.log' })
      ]
    });
    
    this.kpis = new Map();
    this.calculations = new Map();
    this.thresholds = new Map();
  }

  // Define KPI
  async defineKPI(config) {
    try {
      const kpi = {
        id: this.generateId(),
        name: config.name,
        description: config.description || '',
        formula: config.formula,
        dataSource: config.dataSource,
        aggregation: config.aggregation || 'sum',
        timeRange: config.timeRange || '1d',
        unit: config.unit || '',
        category: config.category || 'general',
        thresholds: config.thresholds || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      this.kpis.set(kpi.id, kpi);
      this.logger.info('KPI defined successfully', { id: kpi.id });
      return kpi;
    } catch (error) {
      this.logger.error('Error defining KPI:', error);
      throw error;
    }
  }

  // Calculate KPI
  async calculateKPI(kpiId, data, options = {}) {
    try {
      const kpi = this.kpis.get(kpiId);
      if (!kpi) {
        throw new Error('KPI not found');
      }

      const calculation = {
        id: this.generateId(),
        kpiId,
        timestamp: new Date(),
        data: data,
        options: options,
        result: null,
        status: 'calculating'
      };

      // Perform calculation based on KPI formula
      const result = await this.performCalculation(kpi, data, options);
      calculation.result = result;
      calculation.status = 'completed';

      // Store calculation
      this.calculations.set(calculation.id, calculation);

      this.logger.info('KPI calculated successfully', { kpiId, calculationId: calculation.id });
      return calculation;
    } catch (error) {
      this.logger.error('Error calculating KPI:', error);
      throw error;
    }
  }

  // Perform calculation
  async performCalculation(kpi, data, options) {
    const { formula, aggregation, timeRange } = kpi;
    
    // Parse formula
    const parsedFormula = this.parseFormula(formula);
    
    // Apply aggregation
    const aggregatedData = this.applyAggregation(data, aggregation, timeRange);
    
    // Calculate result
    const result = this.evaluateFormula(parsedFormula, aggregatedData, options);
    
    return {
      value: result,
      unit: kpi.unit,
      timestamp: new Date(),
      timeRange,
      aggregation,
      formula: parsedFormula
    };
  }

  // Parse formula
  parseFormula(formula) {
    // Simple formula parser - in production, use a proper expression parser
    const tokens = formula.split(/\s+/);
    const parsed = [];
    
    for (const token of tokens) {
      if (token.match(/^\d+$/)) {
        parsed.push({ type: 'number', value: parseFloat(token) });
      } else if (token.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        parsed.push({ type: 'variable', value: token });
      } else if (['+', '-', '*', '/', '(', ')'].includes(token)) {
        parsed.push({ type: 'operator', value: token });
      }
    }
    
    return parsed;
  }

  // Apply aggregation
  applyAggregation(data, aggregation, timeRange) {
    if (!Array.isArray(data)) return data;
    
    const endTime = new Date();
    const startTime = moment(endTime).subtract(this.parseTimeRange(timeRange)).toDate();
    
    const filteredData = data.filter(item => {
      const itemTime = new Date(item.timestamp || item.date);
      return itemTime >= startTime && itemTime <= endTime;
    });
    
    if (filteredData.length === 0) return [];
    
    switch (aggregation) {
      case 'sum':
        return this.aggregateSum(filteredData);
      case 'avg':
        return this.aggregateAverage(filteredData);
      case 'min':
        return this.aggregateMin(filteredData);
      case 'max':
        return this.aggregateMax(filteredData);
      case 'count':
        return this.aggregateCount(filteredData);
      default:
        return filteredData;
    }
  }

  // Aggregate sum
  aggregateSum(data) {
    const numericValues = data.map(item => this.extractNumericValue(item)).filter(v => !isNaN(v));
    return numericValues.reduce((sum, value) => sum + value, 0);
  }

  // Aggregate average
  aggregateAverage(data) {
    const numericValues = data.map(item => this.extractNumericValue(item)).filter(v => !isNaN(v));
    if (numericValues.length === 0) return 0;
    return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
  }

  // Aggregate min
  aggregateMin(data) {
    const numericValues = data.map(item => this.extractNumericValue(item)).filter(v => !isNaN(v));
    return numericValues.length > 0 ? Math.min(...numericValues) : 0;
  }

  // Aggregate max
  aggregateMax(data) {
    const numericValues = data.map(item => this.extractNumericValue(item)).filter(v => !isNaN(v));
    return numericValues.length > 0 ? Math.max(...numericValues) : 0;
  }

  // Aggregate count
  aggregateCount(data) {
    return data.length;
  }

  // Extract numeric value from data item
  extractNumericValue(item) {
    if (typeof item === 'number') return item;
    if (typeof item === 'string') return parseFloat(item);
    if (typeof item === 'object' && item.value !== undefined) return parseFloat(item.value);
    if (typeof item === 'object' && item.amount !== undefined) return parseFloat(item.amount);
    if (typeof item === 'object' && item.count !== undefined) return parseFloat(item.count);
    return 0;
  }

  // Evaluate formula
  evaluateFormula(parsedFormula, data, options) {
    // Simple formula evaluator - in production, use a proper expression evaluator
    let result = 0;
    let currentOperator = '+';
    
    for (const token of parsedFormula) {
      if (token.type === 'number') {
        result = this.applyOperator(result, token.value, currentOperator);
      } else if (token.type === 'variable') {
        const value = this.getVariableValue(token.value, data, options);
        result = this.applyOperator(result, value, currentOperator);
      } else if (token.type === 'operator') {
        currentOperator = token.value;
      }
    }
    
    return result;
  }

  // Apply operator
  applyOperator(left, right, operator) {
    switch (operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right !== 0 ? left / right : 0;
      default: return right;
    }
  }

  // Get variable value
  getVariableValue(variable, data, options) {
    // Map common variables to data properties
    const variableMap = {
      'total': data,
      'count': Array.isArray(data) ? data.length : 1,
      'sum': Array.isArray(data) ? data.reduce((sum, item) => sum + this.extractNumericValue(item), 0) : data,
      'avg': Array.isArray(data) ? this.aggregateAverage(data) : data,
      'min': Array.isArray(data) ? this.aggregateMin(data) : data,
      'max': Array.isArray(data) ? this.aggregateMax(data) : data
    };
    
    return variableMap[variable] || 0;
  }

  // Parse time range
  parseTimeRange(timeRange) {
    const match = timeRange.match(/^(\d+)([smhd])$/);
    if (!match) return { amount: 1, unit: 'd' };
    
    const amount = parseInt(match[1]);
    const unit = match[2];
    
    const unitMap = {
      's': 'seconds',
      'm': 'minutes',
      'h': 'hours',
      'd': 'days'
    };
    
    return { amount, unit: unitMap[unit] };
  }

  // Get KPI
  async getKPI(id) {
    const kpi = this.kpis.get(id);
    if (!kpi) {
      throw new Error('KPI not found');
    }
    return kpi;
  }

  // List KPIs
  async listKPIs(filters = {}) {
    let kpis = Array.from(this.kpis.values());
    
    if (filters.category) {
      kpis = kpis.filter(k => k.category === filters.category);
    }
    
    if (filters.status) {
      kpis = kpis.filter(k => k.status === filters.status);
    }
    
    return kpis;
  }

  // Update KPI
  async updateKPI(id, updates) {
    try {
      const kpi = await this.getKPI(id);
      
      const updatedKPI = {
        ...kpi,
        ...updates,
        updatedAt: new Date()
      };

      this.kpis.set(id, updatedKPI);
      this.logger.info('KPI updated successfully', { id });
      return updatedKPI;
    } catch (error) {
      this.logger.error('Error updating KPI:', error);
      throw error;
    }
  }

  // Delete KPI
  async deleteKPI(id) {
    try {
      const kpi = await this.getKPI(id);
      this.kpis.delete(id);
      this.logger.info('KPI deleted successfully', { id });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting KPI:', error);
      throw error;
    }
  }

  // Get calculation history
  async getCalculationHistory(kpiId, limit = 100) {
    const calculations = Array.from(this.calculations.values())
      .filter(c => c.kpiId === kpiId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    return calculations;
  }

  // Generate unique ID
  generateId() {
    return `kpi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new KPICalculator();
