const winston = require('winston');
const { Pool } = require('pg');
const _ = require('lodash');

class DatabaseOptimizer {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/database-optimizer.log' })
      ]
    });
    
    this.connections = new Map();
    this.queries = new Map();
    this.indexes = new Map();
    this.metrics = {
      queriesExecuted: 0,
      slowQueries: 0,
      averageQueryTime: 0,
      totalQueryTime: 0,
      connectionsActive: 0,
      connectionsIdle: 0
    };
  }

  // Initialize database optimizer
  async initialize(config) {
    try {
      // Create connection pool
      const pool = new Pool({
        host: config.host || 'localhost',
        port: config.port || 5432,
        database: config.database || 'postgres',
        user: config.user || 'postgres',
        password: config.password || '',
        max: config.maxConnections || 20,
        idleTimeoutMillis: config.idleTimeout || 30000,
        connectionTimeoutMillis: config.connectionTimeout || 2000,
        statement_timeout: config.statementTimeout || 30000,
        query_timeout: config.queryTimeout || 30000
      });

      this.connections.set('default', pool);
      
      // Set up event listeners
      pool.on('connect', (client) => {
        this.metrics.connectionsActive++;
        this.logger.debug('Database client connected');
      });

      pool.on('remove', (client) => {
        this.metrics.connectionsActive--;
        this.logger.debug('Database client removed');
      });

      pool.on('error', (err) => {
        this.logger.error('Database pool error:', err);
      });

      this.logger.info('Database optimizer initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing database optimizer:', error);
      throw error;
    }
  }

  // Execute query with optimization
  async executeQuery(query, params = [], options = {}) {
    try {
      const startTime = Date.now();
      const connectionName = options.connection || 'default';
      const pool = this.connections.get(connectionName);
      
      if (!pool) {
        throw new Error(`Connection not found: ${connectionName}`);
      }

      // Check if query is cached
      const cacheKey = this.generateCacheKey(query, params);
      if (options.useCache && this.queries.has(cacheKey)) {
        const cached = this.queries.get(cacheKey);
        if (cached.expiresAt > Date.now()) {
          this.logger.debug('Query result served from cache', { cacheKey });
          return cached.result;
        }
      }

      // Execute query
      const result = await pool.query(query, params);
      const executionTime = Date.now() - startTime;

      // Update metrics
      this.metrics.queriesExecuted++;
      this.metrics.totalQueryTime += executionTime;
      this.metrics.averageQueryTime = this.metrics.totalQueryTime / this.metrics.queriesExecuted;

      // Check for slow queries
      if (executionTime > (options.slowQueryThreshold || 1000)) {
        this.metrics.slowQueries++;
        this.logger.warn('Slow query detected', {
          query: query.substring(0, 100),
          executionTime,
          threshold: options.slowQueryThreshold || 1000
        });
      }

      // Cache result if requested
      if (options.useCache && options.cacheTTL) {
        this.queries.set(cacheKey, {
          result,
          expiresAt: Date.now() + options.cacheTTL
        });
      }

      this.logger.debug('Query executed successfully', {
        executionTime,
        rowCount: result.rowCount
      });

      return result;
    } catch (error) {
      this.logger.error('Error executing query:', error);
      throw error;
    }
  }

  // Analyze query performance
  async analyzeQuery(query, params = []) {
    try {
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const result = await this.executeQuery(explainQuery, params);
      
      const analysis = result.rows[0]['QUERY PLAN'][0];
      
      return {
        executionTime: analysis['Execution Time'],
        planningTime: analysis['Planning Time'],
        totalTime: analysis['Total Cost'],
        rows: analysis['Actual Rows'],
        loops: analysis['Actual Loops'],
        buffers: analysis['Buffers'],
        nodeType: analysis['Node Type'],
        cost: analysis['Total Cost'],
        startupCost: analysis['Startup Cost']
      };
    } catch (error) {
      this.logger.error('Error analyzing query:', error);
      throw error;
    }
  }

  // Create index
  async createIndex(tableName, columns, options = {}) {
    try {
      const indexName = options.name || `idx_${tableName}_${columns.join('_')}`;
      const unique = options.unique ? 'UNIQUE ' : '';
      const partial = options.where ? ` WHERE ${options.where}` : '';
      
      const query = `CREATE ${unique}INDEX ${indexName} ON ${tableName} (${columns.join(', ')})${partial}`;
      
      await this.executeQuery(query);
      
      const index = {
        name: indexName,
        table: tableName,
        columns,
        unique: options.unique || false,
        partial: !!options.where,
        createdAt: new Date()
      };
      
      this.indexes.set(indexName, index);
      
      this.logger.info('Index created successfully', { indexName, tableName, columns });
      return index;
    } catch (error) {
      this.logger.error('Error creating index:', error);
      throw error;
    }
  }

  // Drop index
  async dropIndex(indexName) {
    try {
      const query = `DROP INDEX IF EXISTS ${indexName}`;
      await this.executeQuery(query);
      
      this.indexes.delete(indexName);
      
      this.logger.info('Index dropped successfully', { indexName });
      return { success: true };
    } catch (error) {
      this.logger.error('Error dropping index:', error);
      throw error;
    }
  }

  // Get table statistics
  async getTableStats(tableName) {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation,
          most_common_vals,
          most_common_freqs,
          histogram_bounds
        FROM pg_stats 
        WHERE tablename = $1
      `;
      
      const result = await this.executeQuery(query, [tableName]);
      
      return {
        tableName,
        statistics: result.rows
      };
    } catch (error) {
      this.logger.error('Error getting table statistics:', error);
      throw error;
    }
  }

  // Get index statistics
  async getIndexStats() {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `;
      
      const result = await this.executeQuery(query);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Error getting index statistics:', error);
      throw error;
    }
  }

  // Get slow queries
  async getSlowQueries(limit = 10) {
    try {
      const query = `
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements
        ORDER BY mean_time DESC
        LIMIT $1
      `;
      
      const result = await this.executeQuery(query, [limit]);
      
      return result.rows;
    } catch (error) {
      this.logger.error('Error getting slow queries:', error);
      throw error;
    }
  }

  // Optimize table
  async optimizeTable(tableName) {
    try {
      // Analyze table
      await this.executeQuery(`ANALYZE ${tableName}`);
      
      // Vacuum table
      await this.executeQuery(`VACUUM ${tableName}`);
      
      this.logger.info('Table optimized successfully', { tableName });
      return { success: true };
    } catch (error) {
      this.logger.error('Error optimizing table:', error);
      throw error;
    }
  }

  // Get connection pool stats
  async getConnectionStats() {
    try {
      const stats = [];
      
      for (const [name, pool] of this.connections) {
        stats.push({
          name,
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        });
      }
      
      return stats;
    } catch (error) {
      this.logger.error('Error getting connection stats:', error);
      throw error;
    }
  }

  // Add connection pool
  async addConnection(name, config) {
    try {
      const pool = new Pool(config);
      
      this.connections.set(name, pool);
      
      this.logger.info('Connection pool added successfully', { name });
      return { success: true };
    } catch (error) {
      this.logger.error('Error adding connection pool:', error);
      throw error;
    }
  }

  // Remove connection pool
  async removeConnection(name) {
    try {
      const pool = this.connections.get(name);
      
      if (!pool) {
        throw new Error(`Connection not found: ${name}`);
      }
      
      await pool.end();
      this.connections.delete(name);
      
      this.logger.info('Connection pool removed successfully', { name });
      return { success: true };
    } catch (error) {
      this.logger.error('Error removing connection pool:', error);
      throw error;
    }
  }

  // Get database metrics
  async getDatabaseMetrics() {
    try {
      const query = `
        SELECT 
          datname,
          numbackends,
          xact_commit,
          xact_rollback,
          blks_read,
          blks_hit,
          tup_returned,
          tup_fetched,
          tup_inserted,
          tup_updated,
          tup_deleted
        FROM pg_stat_database
        WHERE datname = current_database()
      `;
      
      const result = await this.executeQuery(query);
      const dbStats = result.rows[0];
      
      return {
        ...this.metrics,
        database: {
          name: dbStats.datname,
          activeConnections: dbStats.numbackends,
          transactionsCommitted: dbStats.xact_commit,
          transactionsRolledBack: dbStats.xact_rollback,
          blocksRead: dbStats.blks_read,
          blocksHit: dbStats.blks_hit,
          cacheHitRatio: dbStats.blks_hit / (dbStats.blks_hit + dbStats.blks_read) || 0,
          tuplesReturned: dbStats.tup_returned,
          tuplesFetched: dbStats.tup_fetched,
          tuplesInserted: dbStats.tup_inserted,
          tuplesUpdated: dbStats.tup_updated,
          tuplesDeleted: dbStats.tup_deleted
        }
      };
    } catch (error) {
      this.logger.error('Error getting database metrics:', error);
      throw error;
    }
  }

  // Generate cache key
  generateCacheKey(query, params) {
    return `${query}_${JSON.stringify(params)}`;
  }

  // Clear query cache
  async clearQueryCache() {
    this.queries.clear();
    this.logger.info('Query cache cleared');
  }

  // Get query cache stats
  async getQueryCacheStats() {
    return {
      cachedQueries: this.queries.size,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  // Generate unique ID
  generateId() {
    return `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new DatabaseOptimizer();
