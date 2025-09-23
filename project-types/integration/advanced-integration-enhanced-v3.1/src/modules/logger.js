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
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    format: format
  }),

  // File transport for error logs
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: format
  }),

  // File transport for debug logs
  new DailyRotateFile({
    filename: 'logs/debug-%DATE%.log',
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

// Add integration-specific logging methods
logger.integration = (module, action, data = {}) => {
  logger.info(`[${module}] ${action}`, data);
};

logger.integrationError = (module, action, error, data = {}) => {
  logger.error(`[${module}] ${action} failed`, { error: error.message, stack: error.stack, ...data });
};

logger.integrationWarn = (module, action, message, data = {}) => {
  logger.warn(`[${module}] ${action}: ${message}`, data);
};

logger.integrationDebug = (module, action, data = {}) => {
  logger.debug(`[${module}] ${action}`, data);
};

// Add performance logging
logger.performance = (operation, duration, metadata = {}) => {
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...metadata
  });
};

// Add security logging
logger.security = (event, data = {}) => {
  logger.warn(`Security: ${event}`, data);
};

// Add audit logging
logger.audit = (action, user, resource, result, metadata = {}) => {
  logger.info(`Audit: ${action}`, {
    user,
    resource,
    result,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Add business logic logging
logger.business = (process, step, data = {}) => {
  logger.info(`Business: ${process} - ${step}`, data);
};

// Add system logging
logger.system = (component, event, data = {}) => {
  logger.info(`System: ${component} - ${event}`, data);
};

// Add data logging
logger.data = (operation, dataType, count, metadata = {}) => {
  logger.info(`Data: ${operation}`, {
    type: dataType,
    count,
    ...metadata
  });
};

// Add API logging
logger.api = (endpoint, method, status, duration, metadata = {}) => {
  const level = status >= 400 ? 'warn' : 'info';
  logger[level](`API: ${method} ${endpoint}`, {
    status,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Add database logging
logger.database = (operation, table, duration, metadata = {}) => {
  logger.info(`Database: ${operation}`, {
    table,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Add cache logging
logger.cache = (operation, key, hit, duration, metadata = {}) => {
  logger.info(`Cache: ${operation}`, {
    key,
    hit,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Add external service logging
logger.external = (service, operation, status, duration, metadata = {}) => {
  const level = status >= 400 ? 'warn' : 'info';
  logger[level](`External: ${service} - ${operation}`, {
    status,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Add integration module logging
logger.module = (moduleName, event, data = {}) => {
  logger.info(`Module: ${moduleName} - ${event}`, data);
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

// Export logger
module.exports = logger;
