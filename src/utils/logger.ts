// Production-ready logging utility
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  private createLogEntry(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // Log everything in development
    }
    
    if (this.isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    
    return false;
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);
    
    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  private formatMessage(entry: LogEntry): string {
    const prefix = entry.context ? `[${entry.context}]` : '';
    return `${entry.timestamp} ${entry.level.toUpperCase()} ${prefix} ${entry.message}`;
  }

  debug(message: string, data?: any, context?: string) {
    const entry = this.createLogEntry('debug', message, data, context);
    
    if (this.shouldLog('debug')) {
      , data || '');
    }
    
    this.addToBuffer(entry);
  }

  info(message: string, data?: any, context?: string) {
    const entry = this.createLogEntry('info', message, data, context);
    
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(entry), data || '');
    }
    
    this.addToBuffer(entry);
  }

  warn(message: string, data?: any, context?: string) {
    const entry = this.createLogEntry('warn', message, data, context);
    
    if (this.shouldLog('warn')) {
      , data || '');
    }
    
    this.addToBuffer(entry);
  }

  error(message: string, error?: any, context?: string) {
    const entry = this.createLogEntry('error', message, error, context);
    
    if (this.shouldLog('error')) {
      , error || '');
    }
    
    this.addToBuffer(entry);
    
    // In production, you might want to send this to an error tracking service
    if (this.isProduction && error) {
      this.sendToErrorTracking(entry);
    }
  }

  private sendToErrorTracking(entry: LogEntry) {
    // TODO: Implement error tracking service integration
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    
    // For now, we'll just store it for potential future use
    // You can implement this based on your preferred error tracking service
    if (typeof window !== 'undefined') {
      // Client-side error tracking
      // window.Sentry?.captureException(entry.data);
    } else {
      // Server-side error tracking
      // You can send to your logging service here
    }
  }

  // Get recent logs (useful for debugging)
  getRecentLogs(level?: LogLevel, limit: number = 10): LogEntry[] {
    let logs = this.logBuffer;
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    return logs.slice(-limit);
  }

  // Clear log buffer
  clearBuffer() {
    this.logBuffer = [];
  }

  // Export logs (useful for debugging)
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Create singleton instance
const logger = new Logger();

// Export the logger instance
export default logger;

// Export individual methods for convenience
export const { debug, info, warn, error } = logger;

// Export the class for testing
export { Logger }; 