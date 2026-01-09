/**
 * CBV System - Logger Utility
 * Provides structured logging with different levels and storage
 */

import CONFIG from './config';

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = CONFIG.DEBUG.LOG_RETENTION;
    this.listeners = [];
  }

  // Log levels
  LEVELS = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    METRIC: 'METRIC',
  };

  // Add a log entry
  log(level, message, data = {}) {
    const entry = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };

    // Add to in-memory logs
    this.logs.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output (with color coding)
    this._consoleLog(entry);

    // Notify listeners
    this._notifyListeners(entry);

    return entry;
  }

  // Convenience methods
  debug(message, data) {
    return this.log(this.LEVELS.DEBUG, message, data);
  }

  info(message, data) {
    return this.log(this.LEVELS.INFO, message, data);
  }

  warn(message, data) {
    return this.log(this.LEVELS.WARN, message, data);
  }

  error(message, data) {
    return this.log(this.LEVELS.ERROR, message, data);
  }

  metric(message, data) {
    return this.log(this.LEVELS.METRIC, message, data);
  }

  // Console output with styling
  _consoleLog(entry) {
    const { level, message, data, timestamp } = entry;
    const time = new Date(timestamp).toLocaleTimeString();
    
    const styles = {
      DEBUG: 'color: #6b7280',
      INFO: 'color: #3b82f6',
      WARN: 'color: #f59e0b',
      ERROR: 'color: #ef4444',
      METRIC: 'color: #8b5cf6',
    };

    const style = styles[level] || 'color: #000';
    
    console.log(
      `%c[${time}] [${level}] ${message}`,
      style,
      Object.keys(data).length > 0 ? data : ''
    );
  }

  // Subscribe to log events
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners
  _notifyListeners(entry) {
    this.listeners.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('Error in log listener:', error);
      }
    });
  }

  // Get all logs
  getLogs(filter = {}) {
    let filtered = [...this.logs];

    if (filter.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }

    if (filter.since) {
      filtered = filtered.filter(log => log.timestamp >= filter.since);
    }

    if (filter.until) {
      filtered = filtered.filter(log => log.timestamp <= filter.until);
    }

    return filtered;
  }

  // Clear all logs
  clear() {
    this.logs = [];
    this.info('Logs cleared');
  }

  // Export logs as JSON
  export() {
    return {
      exportedAt: Date.now(),
      version: CONFIG.VERSION,
      logs: this.logs,
    };
  }

  // Get log statistics
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      timeRange: {
        start: this.logs[0]?.timestamp || null,
        end: this.logs[this.logs.length - 1]?.timestamp || null,
      },
    };

    // Count by level
    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
const logger = new Logger();

// Log system initialization
logger.info('Logger initialized', {
  version: CONFIG.VERSION,
  maxLogs: CONFIG.DEBUG.LOG_RETENTION,
});

export default logger;
