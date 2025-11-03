/**
 * Performance Statistics Tracker
 * Developer: Lead Developer Julia Kowalski
 * Expert Advisor: Ahmed Hassan (The Guardian)
 */

import { PerformanceStats, ClosedTrade, Portfolio } from '../types';
import { logger } from '../utils/logger';
import { PerformanceChartGenerator } from '../visualization/performance-charts';
import { DashboardServer } from '../server/dashboard-server';
import * as path from 'path';

export class PerformanceTracker {
  private stats: PerformanceStats;
  private closedTrades: ClosedTrade[] = [];
  private initialCapital: number;
  private peakEquity: number;
  private dashboardServer: DashboardServer | null = null;
  private currentPrice: number = 0;

  constructor(initialCapital: number) {
    this.initialCapital = initialCapital;
    this.peakEquity = initialCapital;

    this.stats = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,

      totalPnL: 0,
      totalPnLPercentage: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,

      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercentage: 0,
      currentDrawdown: 0,

      consecutiveWins: 0,
      consecutiveLosses: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,

      averageHoldingPeriod: 0,
      averageRiskRewardRatio: 0,
      expectancy: 0,

      equityCurve: [{ timestamp: Date.now(), equity: initialCapital }],

      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      tradingDays: 0,
    };

    logger.info('PERFORMANCE', `Performance Tracker initialized with $${initialCapital}`);
  }

  /**
   * Fügt einen abgeschlossenen Trade hinzu und aktualisiert Statistiken
   */
  addTrade(trade: ClosedTrade, currentEquity: number): void {
    this.closedTrades.push(trade);
    this.stats.totalTrades++;

    // Win/Loss Tracking
    if (trade.isWin) {
      this.stats.winningTrades++;
      this.stats.consecutiveWins++;
      this.stats.consecutiveLosses = 0;

      if (this.stats.consecutiveWins > this.stats.maxConsecutiveWins) {
        this.stats.maxConsecutiveWins = this.stats.consecutiveWins;
      }
    } else {
      this.stats.losingTrades++;
      this.stats.consecutiveLosses++;
      this.stats.consecutiveWins = 0;

      if (this.stats.consecutiveLosses > this.stats.maxConsecutiveLosses) {
        this.stats.maxConsecutiveLosses = this.stats.consecutiveLosses;
      }
    }

    // P&L Tracking
    this.stats.totalPnL += trade.pnl;

    // Equity Curve Update
    this.stats.equityCurve.push({
      timestamp: trade.exitTime,
      equity: currentEquity,
    });

    // Drawdown Berechnung
    if (currentEquity > this.peakEquity) {
      this.peakEquity = currentEquity;
    }

    const drawdown = this.peakEquity - currentEquity;
    this.stats.currentDrawdown = (drawdown / this.peakEquity) * 100;

    if (drawdown > this.stats.maxDrawdown) {
      this.stats.maxDrawdown = drawdown;
      this.stats.maxDrawdownPercentage = (drawdown / this.peakEquity) * 100;
    }

    // Update Zeit
    this.stats.lastUpdateTime = trade.exitTime;

    // Vollständige Neuberechnung der aggregierten Metriken
    this.recalculateStats();

    logger.info('PERFORMANCE', `Trade recorded: ${trade.isWin ? 'WIN' : 'LOSS'} | P&L: $${trade.pnl.toFixed(2)}`);
    logger.logPerformance(this.stats);

    // Broadcast to dashboard
    this.broadcastUpdate();
  }

  /**
   * Berechnet alle aggregierten Statistiken neu
   */
  private recalculateStats(): void {
    // Win Rate
    this.stats.winRate = this.stats.totalTrades > 0
      ? (this.stats.winningTrades / this.stats.totalTrades) * 100
      : 0;

    // Total P&L Percentage
    this.stats.totalPnLPercentage = (this.stats.totalPnL / this.initialCapital) * 100;

    // Average Win/Loss
    const wins = this.closedTrades.filter((t) => t.isWin);
    const losses = this.closedTrades.filter((t) => !t.isWin);

    this.stats.averageWin = wins.length > 0
      ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length
      : 0;

    this.stats.averageLoss = losses.length > 0
      ? losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length
      : 0;

    // Largest Win/Loss
    this.stats.largestWin = wins.length > 0
      ? Math.max(...wins.map((t) => t.pnl))
      : 0;

    this.stats.largestLoss = losses.length > 0
      ? Math.min(...losses.map((t) => t.pnl))
      : 0;

    // Profit Factor
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

    this.stats.profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Sharpe Ratio
    this.stats.sharpeRatio = this.calculateSharpeRatio();

    // Average Holding Period
    const totalHoldingTime = this.closedTrades.reduce((sum, t) => sum + t.holdingPeriod, 0);
    this.stats.averageHoldingPeriod = this.closedTrades.length > 0
      ? totalHoldingTime / this.closedTrades.length
      : 0;

    // Average Risk/Reward Ratio
    this.stats.averageRiskRewardRatio = this.calculateAverageRiskReward();

    // Expectancy (Expected value per trade)
    this.stats.expectancy = this.stats.totalTrades > 0
      ? this.stats.totalPnL / this.stats.totalTrades
      : 0;

    // Trading Days
    const timeElapsed = this.stats.lastUpdateTime - this.stats.startTime;
    this.stats.tradingDays = timeElapsed / (1000 * 60 * 60 * 24);
  }

  /**
   * Berechnet Sharpe Ratio
   * Sharpe = (Average Return - Risk-Free Rate) / Standard Deviation of Returns
   */
  private calculateSharpeRatio(): number {
    if (this.closedTrades.length < 2) return 0;

    const returns = this.closedTrades.map((t) => t.pnlPercentage);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Standard Deviation
    const squaredDiffs = returns.map((r) => Math.pow(r - avgReturn, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Risk-free rate angenommen bei 0% für Crypto
    const riskFreeRate = 0;
    const sharpe = (avgReturn - riskFreeRate) / stdDev;

    // Annualisieren (falls gewünscht)
    // const annualizedSharpe = sharpe * Math.sqrt(252); // 252 Trading Days

    return sharpe;
  }

  /**
   * Berechnet Average Risk/Reward Ratio
   */
  private calculateAverageRiskReward(): number {
    if (this.stats.averageLoss === 0) return 0;
    return Math.abs(this.stats.averageWin / this.stats.averageLoss);
  }

  /**
   * Gibt aktuelle Statistiken zurück
   */
  getStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Gibt alle abgeschlossenen Trades zurück
   */
  getClosedTrades(): ClosedTrade[] {
    return [...this.closedTrades];
  }

  /**
   * Gibt die letzten N Trades zurück
   */
  getRecentTrades(count: number = 5): ClosedTrade[] {
    return this.closedTrades.slice(-count);
  }

  /**
   * Aktualisiert Equity Curve (z.B. bei HOLD)
   */
  updateEquityCurve(timestamp: number, equity: number): void {
    this.stats.equityCurve.push({ timestamp, equity });

    // Drawdown Update
    if (equity > this.peakEquity) {
      this.peakEquity = equity;
    }

    const drawdown = this.peakEquity - equity;
    this.stats.currentDrawdown = (drawdown / this.peakEquity) * 100;

    if (drawdown > this.stats.maxDrawdown) {
      this.stats.maxDrawdown = drawdown;
      this.stats.maxDrawdownPercentage = (drawdown / this.peakEquity) * 100;
    }

    this.stats.lastUpdateTime = timestamp;

    // Broadcast to dashboard
    this.broadcastUpdate();
  }

  /**
   * Reset (für neue Backtest-Läufe)
   */
  reset(initialCapital: number): void {
    this.initialCapital = initialCapital;
    this.peakEquity = initialCapital;
    this.closedTrades = [];

    this.stats = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,

      totalPnL: 0,
      totalPnLPercentage: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,

      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercentage: 0,
      currentDrawdown: 0,

      consecutiveWins: 0,
      consecutiveLosses: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,

      averageHoldingPeriod: 0,
      averageRiskRewardRatio: 0,
      expectancy: 0,

      equityCurve: [{ timestamp: Date.now(), equity: initialCapital }],

      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      tradingDays: 0,
    };

    logger.info('PERFORMANCE', 'Performance Tracker reset');
  }

  /**
   * Exportiert Statistiken als JSON
   */
  exportStats(): string {
    return JSON.stringify(
      {
        stats: this.stats,
        trades: this.closedTrades,
      },
      null,
      2
    );
  }

  /**
   * Generiert Performance Report als HTML
   */
  async generatePerformanceReport(
    outputPath?: string,
    title: string = 'Trading Performance Report'
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultPath = outputPath || path.join(
      process.cwd(),
      'reports',
      `performance-report-${timestamp}.html`
    );

    return await PerformanceChartGenerator.saveReport(
      this.stats,
      this.closedTrades,
      this.initialCapital,
      defaultPath,
      title
    );
  }

  /**
   * Generiert HTML String ohne zu speichern
   */
  generatePerformanceHTML(title: string = 'Trading Performance Report'): string {
    return PerformanceChartGenerator.generateHTMLReport(
      this.stats,
      this.closedTrades,
      this.initialCapital,
      title
    );
  }

  /**
   * Verbindet mit Dashboard Server
   */
  connectToDashboard(server: DashboardServer): void {
    this.dashboardServer = server;
    this.broadcastUpdate();
    logger.info('PERFORMANCE', 'Connected to dashboard server');
  }

  /**
   * Trennt vom Dashboard Server
   */
  disconnectFromDashboard(): void {
    this.dashboardServer = null;
    logger.info('PERFORMANCE', 'Disconnected from dashboard server');
  }

  /**
   * Aktualisiert aktuellen Preis
   */
  updateCurrentPrice(price: number): void {
    this.currentPrice = price;
  }

  /**
   * Sendet Update an Dashboard
   */
  private broadcastUpdate(): void {
    if (this.dashboardServer) {
      this.dashboardServer.broadcastUpdate({
        stats: this.stats,
        trades: this.closedTrades,
        initialCapital: this.initialCapital,
        currentPrice: this.currentPrice,
        timestamp: Date.now(),
      });
    }
  }

}
