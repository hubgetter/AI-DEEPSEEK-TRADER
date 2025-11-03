/**
 * Logger - Umfassendes Logging-System
 * Developer: Carlos Rodriguez
 */

import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { LogLevel, LogEntry } from '../types';

class Logger {
  private logger: winston.Logger;
  private logEntries: LogEntry[] = [];

  constructor() {
    // Erstelle logs Verzeichnis falls nicht vorhanden
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Winston Logger konfigurieren
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: { service: 'ai-deepseek-trader' },
      transports: [
        // Fehler-Log
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
        // Kombiniertes Log
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        }),
        // Trading-spezifisches Log
        new winston.transports.File({
          filename: path.join(logsDir, 'trading.log'),
          level: 'info',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
      ],
    });

    // Konsolen-Output nur in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, category }) => {
              return `[${timestamp}] ${level} [${category || 'GENERAL'}]: ${message}`;
            })
          ),
        })
      );
    }
  }

  private log(level: LogLevel, category: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };

    this.logEntries.push(entry);
    this.logger.log(level, message, { category, ...data });
  }

  debug(category: string, message: string, data?: any) {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: any) {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, error?: any) {
    this.log('error', category, message, {
      error: error?.message || error,
      stack: error?.stack,
    });
  }

  // Trading-spezifische Log-Methoden
  logTrade(trade: any) {
    this.info('TRADE', `${trade.action} ${trade.quantity} ${trade.pair} @ ${trade.price}`, {
      trade,
    });
  }

  logAIDecision(decision: any) {
    this.info('AI_DECISION', `Action: ${decision.action} | Confidence: ${decision.confidence}`, {
      decision,
    });
  }

  logPerformance(stats: any) {
    this.info('PERFORMANCE', `Win Rate: ${stats.winRate.toFixed(2)}% | Sharpe: ${stats.sharpeRatio.toFixed(2)}`, {
      stats,
    });
  }

  logRiskEvent(event: string, details: any) {
    this.warn('RISK', event, details);
  }

  // Alle Log-Einträge abrufen
  getLogEntries(): LogEntry[] {
    return [...this.logEntries];
  }

  // Log-Einträge filtern
  getLogsByCategory(category: string): LogEntry[] {
    return this.logEntries.filter((entry) => entry.category === category);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logEntries.filter((entry) => entry.level === level);
  }

  // Logs speichern
  async saveLogsToFile(filename: string) {
    const logsDir = path.join(process.cwd(), 'logs');
    const filepath = path.join(logsDir, filename);
    const data = JSON.stringify(this.logEntries, null, 2);
    fs.writeFileSync(filepath, data, 'utf-8');
    this.info('SYSTEM', `Logs saved to ${filepath}`);
  }
}

// Singleton Export
export const logger = new Logger();
