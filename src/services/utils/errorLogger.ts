export interface ErrorLog {
  timestamp: Date;
  operation: string;
  error: Error | string;
  context?: any;
  duration?: number;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  log(operation: string, error: Error | string, context?: any, duration?: number): void {
    const logEntry: ErrorLog = {
      timestamp: new Date(),
      operation,
      error,
      context,
      duration
    };

    this.logs.unshift(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console log for immediate debugging
    console.error(`[${operation}] Error:`, error);
    if (context) {
      console.error(`[${operation}] Context:`, context);
    }
    if (duration) {
      console.error(`[${operation}] Duration: ${duration}ms`);
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogsByOperation(operation: string): ErrorLog[] {
    return this.logs.filter(log => log.operation === operation);
  }
}

export const errorLogger = new ErrorLogger();

// Helper function to time operations
export const timeOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  context?: any
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    console.log(`[${operationName}] Starting operation...`);
    const result = await operation();
    const duration = Date.now() - startTime;
    console.log(`[${operationName}] Completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    errorLogger.log(operationName, error as Error, context, duration);
    throw error;
  }
};
