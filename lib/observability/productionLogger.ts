/**
 * Xpedition Production Hardening — Production Logger & Observability
 *
 * Provides structured JSON logging, strict PII/secret redaction, and in-memory trace buffers
 * for production telemetry and health monitoring.
 */

import { getProductionConfig } from '../config/productionConfig';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
  };
}

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'bearer',
  'cookie',
  'secret',
  'apikey',
  'api_key',
  'anonkey',
  'anon_key',
  'servicerolekey',
  'service_role_key',
  'privatekey',
  'private_key',
  'access_token',
  'refresh_token',
]);

/**
 * Recursively redacts sensitive values from log context
 */
export function sanitizeLogContext(data: any, depth = 0): any {
  if (depth > 5 || data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogContext(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogContext(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export class ProductionLogger {
  private static instance: ProductionLogger;
  private readonly buffer: LogEntry[] = [];
  private readonly maxBufferSize: number;

  constructor(maxBufferSize = 200) {
    this.maxBufferSize = maxBufferSize;
  }

  public static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  private write(entry: LogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    const config = getProductionConfig();
    if (config.isProduction) {
      // In production, emit single-line structured JSON
      const json = JSON.stringify(entry);
      if (entry.level === 'error') {
        console.error(json);
      } else if (entry.level === 'warn') {
        console.warn(json);
      } else {
        console.log(json);
      }
    } else {
      // In development, human-readable format
      const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
      if (entry.level === 'error') {
        console.error(prefix, entry.error || '', entry.context || '');
      } else if (entry.level === 'warn') {
        console.warn(prefix, entry.context || '');
      } else {
        console.log(prefix, entry.context || '');
      }
    }
  }

  public info(message: string, context?: Record<string, any>): void {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context: context ? sanitizeLogContext(context) : undefined,
    });
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context: context ? sanitizeLogContext(context) : undefined,
    });
  }

  public error(message: string, error?: any, context?: Record<string, any>): void {
    let errorDetails: LogEntry['error'] | undefined;

    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        code: (error as any).code,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      };
    } else if (error && typeof error === 'object') {
      errorDetails = {
        name: error.name || 'Error',
        message: error.message || String(error),
        code: error.code,
      };
    } else if (error) {
      errorDetails = {
        name: 'Error',
        message: String(error),
      };
    }

    this.write({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context: context ? sanitizeLogContext(context) : undefined,
      error: errorDetails,
    });
  }

  public getRecentLogs(): LogEntry[] {
    return [...this.buffer];
  }

  public clear(): void {
    this.buffer.length = 0;
  }
}

export const logger = ProductionLogger.getInstance();
