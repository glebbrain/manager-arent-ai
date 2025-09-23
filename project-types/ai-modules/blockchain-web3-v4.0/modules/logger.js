const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data || null
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(level, message, data = null) {
    try {
      const logFile = path.join(this.logDir, `blockchain-${new Date().toISOString().split('T')[0]}.log`);
      const logEntry = this.formatMessage(level, message, data) + '\n';
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(message, data = null) {
    console.log(`[BLOCKCHAIN] ${message}`, data || '');
    this.writeToFile('INFO', message, data);
  }

  info(message, data = null) {
    console.info(`[BLOCKCHAIN] ${message}`, data || '');
    this.writeToFile('INFO', message, data);
  }

  warn(message, data = null) {
    console.warn(`[BLOCKCHAIN] ${message}`, data || '');
    this.writeToFile('WARN', message, data);
  }

  error(message, data = null) {
    console.error(`[BLOCKCHAIN] ${message}`, data || '');
    this.writeToFile('ERROR', message, data);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[BLOCKCHAIN] ${message}`, data || '');
      this.writeToFile('DEBUG', message, data);
    }
  }
}

module.exports = new Logger();
