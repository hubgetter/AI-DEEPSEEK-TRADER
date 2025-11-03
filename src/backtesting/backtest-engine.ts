/**
 * Backtesting Engine - Simuliert Trading mit historischen Daten
 * Developer: Lead Developer Julia Kowalski
 * Experten: Gesamtes Finance Team
 */

import {
  OHLCV,
  Portfolio,
  Position,
  Trade,
  ClosedTrade,
  AIDecision,
  TradingConfig,
  BacktestResult,
  AIPromptContext,
  MarketData,
} from '../types';
import { KrakenClient } from '../data/kraken-client';
import { DeepSeekClient } from '../ai/deepseek-client';
import { PromptBuilder } from '../ai/prompt-builder';
import { indicatorCalculator } from '../indicators/technical-indicators';
import { RiskManager } from '../risk/risk-manager';
import { PerformanceTracker } from './performance-stats';
import { logger } from '../utils/logger';
import { reporter } from '../utils/console-reporter';

export class BacktestEngine {
  private config: TradingConfig;
  private krakenClient: KrakenClient;
  private deepseekClient: DeepSeekClient;
  private promptBuilder: PromptBuilder;
  private riskManager: RiskManager;
  private performanceTracker: PerformanceTracker;

  private portfolio: Portfolio;
  private currentPosition: Position | null = null;
  private trades: Trade[] = [];
  private decisions: AIDecision[] = [];

  constructor(config: TradingConfig) {
    this.config = config;

    this.krakenClient = new KrakenClient(config.krakenApiKey, config.krakenApiSecret);
    this.deepseekClient = new DeepSeekClient(
      config.deepseekApiKey,
      config.useTechnicalIndicators,
      undefined,
      config.deepseekModel
    );
    this.promptBuilder = new PromptBuilder(config.useTechnicalIndicators);
    this.riskManager = new RiskManager(config.riskParameters);
    this.performanceTracker = new PerformanceTracker(config.initialCapital);

    this.portfolio = {
      cash: config.initialCapital,
      holdings: new Map(),
      totalEquity: config.initialCapital,
      timestamp: Date.now(),
    };

    logger.info('BACKTEST', 'Backtest Engine initialized', {
      pair: config.pair,
      timeframe: config.timeframe,
      initialCapital: config.initialCapital,
    });
  }

  /**
   * Startet den Backtest
   */
  async run(): Promise<BacktestResult> {
    try {
      const startTime = Date.now();

      logger.info('BACKTEST', '🚀 Starting backtest...');
      reporter.printHeader();

      // 1. Lade historische Daten
      const candles = await this.loadHistoricalData();
      logger.info('BACKTEST', `Loaded ${candles.length} candles`);

      // 2. Iteriere durch alle Candles
      for (let i = 50; i < candles.length; i++) {
        const currentCandles = candles.slice(0, i + 1);
        const currentCandle = candles[i];

        await this.processCandle(currentCandles, currentCandle);

        // Progress Update (alle 10 Candles)
        if (i % 10 === 0) {
          const progress = (i / candles.length) * 100;
          reporter.printBacktestProgress(
            i,
            candles.length,
            new Date(currentCandle.timestamp)
          );
        }
      }

      // 3. Schließe offene Position (falls vorhanden)
      if (this.currentPosition) {
        await this.closePosition(candles[candles.length - 1], 'Backtest ended');
      }

      const duration = Date.now() - startTime;

      // 4. Erstelle Backtest Result
      const result: BacktestResult = {
        config: this.config,
        stats: this.performanceTracker.getStats(),
        trades: this.performanceTracker.getClosedTrades(),
        decisions: this.decisions,
        equityCurve: this.performanceTracker.getStats().equityCurve,
        duration,
        startDate: this.config.backtestStartDate || new Date(),
        endDate: this.config.backtestEndDate || new Date(),
      };

      // 5. Zeige Ergebnisse
      reporter.printBacktestSummary(result.stats, duration);

      logger.info('BACKTEST', '✅ Backtest completed', {
        duration: `${(duration / 1000).toFixed(2)}s`,
        totalTrades: result.stats.totalTrades,
        finalEquity: this.portfolio.totalEquity,
      });

      return result;
    } catch (error: any) {
      logger.error('BACKTEST', 'Backtest failed', error);
      throw error;
    }
  }

  /**
   * Verarbeitet eine einzelne Candle
   */
  private async processCandle(allCandles: OHLCV[], currentCandle: OHLCV): Promise<void> {
    try {
      const currentPrice = currentCandle.close;

      // 1. Aktualisiere Portfolio Equity
      this.updatePortfolio(currentPrice, currentCandle.timestamp);

      // 2. Prüfe Stop Loss / Take Profit für offene Position
      if (this.currentPosition) {
        await this.checkExitConditions(currentCandle);
      }

      // 3. Berechne technische Indikatoren
      const indicators = indicatorCalculator.calculateIndicators(allCandles);
      const marketContext = indicatorCalculator.analyzeMarketContext(indicators, allCandles);

      // 4. Erstelle Market Data
      const marketData: MarketData = {
        pair: this.config.pair,
        timeframe: this.config.timeframe,
        currentPrice,
        ohlcv: allCandles.slice(-100), // Letzte 100 Candles
        timestamp: currentCandle.timestamp,
      };

      // 5. Erstelle AI Prompt Context
      const promptContext: AIPromptContext = {
        marketData,
        technicalIndicators: indicators,
        marketContext,
        portfolio: this.portfolio,
        currentPosition: this.currentPosition,
        performanceStats: this.performanceTracker.getStats(),
        recentTrades: this.performanceTracker.getRecentTrades(5),
      };

      // 6. Hole AI-Entscheidung
      const prompt = this.promptBuilder.buildTradingPrompt(promptContext);
      const decision = await this.deepseekClient.getDecision(prompt);
      this.decisions.push(decision);

      // 7. Risk Management Check (mit Timestamp für Auto-Recovery)
      const riskCheck = this.riskManager.checkTradeAllowed(
        decision,
        this.portfolio,
        this.performanceTracker.getStats(),
        this.currentPosition,
        currentCandle.timestamp
      );

      if (!riskCheck.allowed) {
        logger.warn('BACKTEST', `Trade rejected: ${riskCheck.reason}`);
        return;
      }

      // 8. Führe Trade aus
      await this.executeTrade(decision, currentCandle);

      // 9. Update Equity Curve
      this.performanceTracker.updateEquityCurve(currentCandle.timestamp, this.portfolio.totalEquity);

    } catch (error: any) {
      logger.error('BACKTEST', 'Error processing candle', error);
      // Continue with next candle
    }
  }

  /**
   * Führt einen Trade aus
   */
  private async executeTrade(decision: AIDecision, candle: OHLCV): Promise<void> {
    const currentPrice = candle.close;

    if (decision.action === 'BUY' && !this.currentPosition) {
      await this.openPosition(decision, candle);
    } else if (decision.action === 'SELL' && this.currentPosition) {
      await this.closePosition(candle, decision.reasoning);
    } else if (decision.action === 'HOLD') {
      logger.debug('BACKTEST', 'AI Decision: HOLD');
    }
  }

  /**
   * Öffnet eine Position
   */
  private async openPosition(decision: AIDecision, candle: OHLCV): Promise<void> {
    const entryPrice = candle.close * (1 + this.config.slippage); // Slippage simulieren

    // Position Size berechnen
    const quantity = this.riskManager.calculatePositionSize(
      decision,
      this.portfolio,
      entryPrice
    );

    const value = quantity * entryPrice;
    const fee = value * this.config.takerFee;

    // Stop Loss & Take Profit
    const stopLoss = this.riskManager.calculateStopLoss(entryPrice, 'long', decision.stopLoss);
    const takeProfit = this.riskManager.calculateTakeProfit(entryPrice, 'long', decision.takeProfit);

    // Erstelle Position
    this.currentPosition = {
      symbol: this.config.pair,
      entryPrice,
      quantity,
      side: 'long',
      entryTime: candle.timestamp,
      stopLoss,
      takeProfit,
      currentPrice: entryPrice,
      unrealizedPnL: 0,
    };

    // Update Portfolio
    this.portfolio.cash -= value + fee;
    const symbol = this.config.pair.split('/')[0];
    this.portfolio.holdings.set(symbol, quantity);

    // Record Trade
    const trade: Trade = {
      id: `trade_${Date.now()}`,
      timestamp: candle.timestamp,
      pair: this.config.pair,
      action: 'BUY',
      quantity,
      price: entryPrice,
      value,
      fee,
      stopLoss,
      takeProfit,
      reasoning: decision.reasoning,
    };

    this.trades.push(trade);
    logger.logTrade(trade);
  }

  /**
   * Schließt eine Position
   */
  private async closePosition(candle: OHLCV, reason: string): Promise<void> {
    if (!this.currentPosition) return;

    const exitPrice = candle.close * (1 - this.config.slippage); // Slippage
    const value = this.currentPosition.quantity * exitPrice;
    const fee = value * this.config.takerFee;

    // Berechne P&L
    const entryValue = this.currentPosition.quantity * this.currentPosition.entryPrice;
    const pnl = value - entryValue - fee;
    const pnlPercentage = (pnl / entryValue) * 100;

    // Update Portfolio
    this.portfolio.cash += value - fee;
    const symbol = this.config.pair.split('/')[0];
    this.portfolio.holdings.delete(symbol);

    // Record Closed Trade
    const closedTrade: ClosedTrade = {
      id: `trade_${Date.now()}`,
      timestamp: this.currentPosition.entryTime,
      pair: this.config.pair,
      action: 'SELL',
      quantity: this.currentPosition.quantity,
      price: this.currentPosition.entryPrice,
      value: entryValue,
      fee,
      stopLoss: this.currentPosition.stopLoss,
      takeProfit: this.currentPosition.takeProfit,
      reasoning: reason,
      exitTime: candle.timestamp,
      exitPrice,
      pnl,
      pnlPercentage,
      holdingPeriod: candle.timestamp - this.currentPosition.entryTime,
      isWin: pnl > 0,
    };

    this.performanceTracker.addTrade(closedTrade, this.portfolio.totalEquity);
    logger.logTrade(closedTrade);

    this.currentPosition = null;
  }

  /**
   * Prüft Exit-Bedingungen (Stop Loss / Take Profit)
   */
  private async checkExitConditions(candle: OHLCV): Promise<void> {
    if (!this.currentPosition) return;

    const currentPrice = candle.close;

    // Stop Loss getroffen?
    if (currentPrice <= this.currentPosition.stopLoss) {
      logger.warn('BACKTEST', `Stop Loss hit at $${currentPrice.toFixed(2)}`);
      await this.closePosition(candle, 'Stop Loss triggered');
      return;
    }

    // Take Profit getroffen?
    if (currentPrice >= this.currentPosition.takeProfit) {
      logger.info('BACKTEST', `Take Profit hit at $${currentPrice.toFixed(2)}`);
      await this.closePosition(candle, 'Take Profit triggered');
      return;
    }

    // Update Unrealized P&L
    this.currentPosition.currentPrice = currentPrice;
    const unrealizedValue = this.currentPosition.quantity * currentPrice;
    const entryValue = this.currentPosition.quantity * this.currentPosition.entryPrice;
    this.currentPosition.unrealizedPnL = unrealizedValue - entryValue;
  }

  /**
   * Aktualisiert Portfolio Equity
   */
  private updatePortfolio(currentPrice: number, timestamp: number): void {
    let totalEquity = this.portfolio.cash;

    // Unrealized P&L hinzufügen
    if (this.currentPosition) {
      const positionValue = this.currentPosition.quantity * currentPrice;
      totalEquity += positionValue;
    }

    this.portfolio.totalEquity = totalEquity;
    this.portfolio.timestamp = timestamp;
  }

  /**
   * Lädt historische Daten
   */
  private async loadHistoricalData(): Promise<OHLCV[]> {
    if (!this.config.backtestStartDate || !this.config.backtestEndDate) {
      throw new Error('Backtest start and end dates are required');
    }

    // Timeframe zu Minuten konvertieren
    const timeframeMinutes = this.parseTimeframe(this.config.timeframe);

    logger.info('BACKTEST', `Loading historical data from ${this.config.backtestStartDate.toISOString()} to ${this.config.backtestEndDate.toISOString()}`);

    const candles = await this.krakenClient.getHistoricalOHLC(
      this.config.pair,
      timeframeMinutes,
      this.config.backtestStartDate,
      this.config.backtestEndDate
    );

    return candles;
  }

  /**
   * Parsed Timeframe String zu Minuten
   */
  private parseTimeframe(timeframe: string): number {
    const match = timeframe.match(/^(\d+)([mhd])$/);
    if (!match) {
      throw new Error(`Invalid timeframe format: ${timeframe}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'm': return value;
      case 'h': return value * 60;
      case 'd': return value * 1440;
      default: throw new Error(`Unknown timeframe unit: ${unit}`);
    }
  }

  /**
   * Gibt aktuellen Portfolio-Status zurück
   */
  getPortfolio(): Portfolio {
    return { ...this.portfolio };
  }

  /**
   * Gibt Performance-Statistiken zurück
   */
  getPerformanceStats() {
    return this.performanceTracker.getStats();
  }

  /**
   * Generiert Performance Report als HTML
   */
  getPerformanceHTML(title?: string): string {
    return this.performanceTracker.generatePerformanceHTML(title);
  }

  /**
   * Speichert Performance Report
   */
  async savePerformanceReport(outputPath?: string, title?: string): Promise<string> {
    return await this.performanceTracker.generatePerformanceReport(outputPath, title);
  }
}
