const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: consoleFormat
  }),

  // File transport for all logs
  new DailyRotateFile({
    filename: 'logs/performance-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    format: format
  }),

  // File transport for error logs
  new DailyRotateFile({
    filename: 'logs/performance-error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: format
  }),

  // File transport for debug logs
  new DailyRotateFile({
    filename: 'logs/performance-debug-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '7d',
    level: 'debug',
    format: format
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false
});

// Add performance-specific logging methods
logger.performance = (operation, duration, metadata = {}) => {
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...metadata
  });
};

logger.cache = (operation, key, hit, duration, metadata = {}) => {
  logger.info(`Cache: ${operation}`, {
    key,
    hit,
    duration: `${duration}ms`,
    ...metadata
  });
};

logger.loadBalancer = (operation, backend, responseTime, status, metadata = {}) => {
  logger.info(`Load Balancer: ${operation}`, {
    backend,
    responseTime: `${responseTime}ms`,
    status,
    ...metadata
  });
};

logger.resource = (operation, resource, usage, threshold, metadata = {}) => {
  logger.info(`Resource: ${operation}`, {
    resource,
    usage: `${usage}%`,
    threshold: `${threshold}%`,
    ...metadata
  });
};

logger.optimization = (type, result, improvement, metadata = {}) => {
  logger.info(`Optimization: ${type}`, {
    result,
    improvement: `${improvement}%`,
    ...metadata
  });
};

logger.analytics = (metric, value, trend, metadata = {}) => {
  logger.info(`Analytics: ${metric}`, {
    value,
    trend,
    ...metadata
  });
};

logger.alert = (type, severity, message, metadata = {}) => {
  const level = severity === 'critical' ? 'error' : severity === 'warning' ? 'warn' : 'info';
  logger[level](`Alert: ${type}`, {
    severity,
    message,
    ...metadata
  });
};

// Add request logging middleware
logger.request = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });

  next();
};

// Add correlation ID support
logger.withCorrelationId = (correlationId) => {
  return {
    info: (message, meta = {}) => logger.info(message, { correlationId, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { correlationId, ...meta }),
    error: (message, meta = {}) => logger.error(message, { correlationId, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { correlationId, ...meta })
  };
};

// Add structured logging for metrics
logger.metrics = (metricName, value, unit = '', metadata = {}) => {
  logger.info(`Metric: ${metricName}`, {
    value,
    unit,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Add health check logging
logger.health = (component, status, details = {}) => {
  const level = status === 'healthy' ? 'info' : 'warn';
  logger[level](`Health: ${component}`, {
    status,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Add configuration logging
logger.config = (component, setting, value, metadata = {}) => {
  logger.info(`Config: ${component} - ${setting}`, {
    value,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Add lifecycle logging
logger.lifecycle = (component, event, metadata = {}) => {
  logger.info(`Lifecycle: ${component} - ${event}`, {
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Add error context logging
logger.errorWithContext = (error, context = {}) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString()
  });
};

// Export logger
module.exports = logger;
