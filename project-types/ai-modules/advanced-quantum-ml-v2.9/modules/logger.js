const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = 'logs';
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  writeToFile(level, message, meta = {}) {
    const logFile = path.join(this.logDir, `${level}.log`);
    const formattedMessage = this.formatMessage(level, message, meta);
    
    fs.appendFileSync(logFile, formattedMessage + '\n');
  }

  info(message, meta = {}) {
    const formattedMessage = this.formatMessage('info', message, meta);
    console.log(formattedMessage);
    this.writeToFile('info', message, meta);
  }

  warn(message, meta = {}) {
    const formattedMessage = this.formatMessage('warn', message, meta);
    console.warn(formattedMessage);
    this.writeToFile('warn', message, meta);
  }

  error(message, meta = {}) {
    const formattedMessage = this.formatMessage('error', message, meta);
    console.error(formattedMessage);
    this.writeToFile('error', message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      const formattedMessage = this.formatMessage('debug', message, meta);
      console.debug(formattedMessage);
      this.writeToFile('debug', message, meta);
    }
  }
}

module.exports = new Logger();
