/**
 * Paper Trading Engine - Live Trading mit simulierten Orders
 * Developer: Lead Developer Julia Kowalski
 *
 * Verwendet Live-Daten von Kraken, führt aber nur simulierte Trades aus
 * Perfekt zur Evaluation der Performance im Live-Umfeld
 */

import {
  OHLCV,
  Portfolio,
  Position,
  Trade,
  ClosedTrade,
  AIDecision,
  TradingConfig,
  AIPromptContext,
  MarketData,
} from '../types';
import { KrakenClient } from '../data/kraken-client';
import { DeepSeekClient } from '../ai/deepseek-client';
import { PromptBuilder } from '../ai/prompt-builder';
import { indicatorCalculator } from '../indicators/technical-indicators';
import { RiskManager } from '../risk/risk-manager';
import { PerformanceTracker } from '../backtesting/performance-stats';
import { DashboardServer } from '../server/dashboard-server';
import { logger } from '../utils/logger';

export class PaperTradingEngine {
  private config: TradingConfig;
  private krakenClient: KrakenClient;
  private deepseekClient: DeepSeekClient;
  private promptBuilder: PromptBuilder;
  private riskManager: RiskManager;
  private performanceTracker: PerformanceTracker;
  private dashboardServer?: DashboardServer;

  private portfolio: Portfolio;
  private currentPosition: Position | null = null;
  private trades: Trade[] = [];
  private decisions: AIDecision[] = [];
  private candleHistory: OHLCV[] = [];
  private isRunning: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(config: TradingConfig, dashboardServer?: DashboardServer) {
    this.config = config;
    this.dashboardServer = dashboardServer;

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

    // Connect Performance Tracker to Dashboard
    if (this.dashboardServer) {
      this.performanceTracker.connectToDashboard(this.dashboardServer);
    }

    this.portfolio = {
      cash: config.initialCapital,
      holdings: new Map(),
      totalEquity: config.initialCapital,
      timestamp: Date.now(),
    };

    logger.info('PAPER_TRADING', 'Paper Trading Engine initialized', {
      pair: config.pair,
      timeframe: config.timeframe,
      initialCapital: config.initialCapital,
    });
  }

  /**
   * Startet Paper Trading
   */
  async start(): Promise<void> {
    try {
      this.isRunning = true;
      logger.info('PAPER_TRADING', '🚀 Starting Paper Trading (Live Simulation)...');

      console.log('\n╔════════════════════════════════════════════════════════════════╗');
      console.log('║         PAPER TRADING - LIVE SIMULATION ACTIVE                 ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');
      console.log('⚠️  Paper Trading Mode: Trades are SIMULATED, no real orders!');
      console.log('📊 Using LIVE data from Kraken');
      console.log('🤖 AI makes real-time trading decisions\n');

      // 1. Lade initiale historische Daten (für Indikatoren)
      await this.loadInitialHistory();

      // 2. Starte Polling-Loop
      const intervalMs = this.parseTimeframeToMs(this.config.timeframe);
      logger.info('PAPER_TRADING', `Polling interval: ${intervalMs}ms (${this.config.timeframe})`);

      // Sofort erste Candle verarbeiten
      await this.fetchAndProcessLatestCandle();

      // Dann regelmäßig pollen
      this.pollingInterval = setInterval(async () => {
        if (this.isRunning) {
          await this.fetchAndProcessLatestCandle();
        }
      }, intervalMs);

      logger.info('PAPER_TRADING', '✅ Paper Trading is running. Press Ctrl+C to stop.');
      console.log('✅ Paper Trading is running. Press Ctrl+C to stop.\n');
    } catch (error: any) {
      logger.error('PAPER_TRADING', 'Failed to start paper trading', error);
      throw error;
    }
  }

  /**
   * Stoppt Paper Trading
   */
  stop(): void {
    this.isRunning = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    // Schließe offene Position
    if (this.currentPosition && this.candleHistory.length > 0) {
      const lastCandle = this.candleHistory[this.candleHistory.length - 1];
      this.closePosition(lastCandle, 'Paper Trading stopped');
    }

    logger.info('PAPER_TRADING', '🛑 Paper Trading stopped');
    console.log('\n🛑 Paper Trading stopped');
    console.log(`\n📊 Final Performance:`);
    console.log(`   Total Trades: ${this.performanceTracker.getStats().totalTrades}`);
    console.log(`   Final Equity: $${this.portfolio.totalEquity.toFixed(2)}`);
    console.log(`   Total P&L: $${(this.portfolio.totalEquity - this.config.initialCapital).toFixed(2)}\n`);
  }

  /**
   * Lädt initiale historische Daten (für Indikatoren)
   */
  private async loadInitialHistory(): Promise<void> {
    try {
      logger.info('PAPER_TRADING', 'Loading initial historical data for indicators...');

      const timeframeMinutes = this.parseTimeframe(this.config.timeframe);
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 Stunden zurück

      const candles = await this.krakenClient.getHistoricalOHLC(
        this.config.pair,
        timeframeMinutes,
        startDate,
        endDate
      );

      this.candleHistory = candles;
      logger.info('PAPER_TRADING', `Loaded ${candles.length} initial candles`);
      console.log(`📈 Loaded ${candles.length} candles for technical analysis\n`);
    } catch (error: any) {
      logger.error('PAPER_TRADING', 'Failed to load initial history', error);
      throw error;
    }
  }

  /**
   * Holt neueste Candle und verarbeitet sie
   */
  private async fetchAndProcessLatestCandle(): Promise<void> {
    try {
      const timeframeMinutes = this.parseTimeframe(this.config.timeframe);

      // Hole neueste OHLC Candles
      const latestCandles = await this.krakenClient.getOHLC(
        this.config.pair,
        timeframeMinutes
      );

      if (latestCandles.length === 0) {
        logger.warn('PAPER_TRADING', 'No candles received from Kraken');
        return;
      }

      const latestCandle = latestCandles[latestCandles.length - 1];

      // Prüfe ob neue Candle (nicht bereits verarbeitet)
      if (this.candleHistory.length > 0) {
        const lastProcessed = this.candleHistory[this.candleHistory.length - 1];
        if (latestCandle.timestamp <= lastProcessed.timestamp) {
          logger.debug('PAPER_TRADING', 'No new candle yet, waiting...');
          return;
        }
      }

      // Neue Candle gefunden - verarbeite sie
      logger.info('PAPER_TRADING', `📊 New candle: ${new Date(latestCandle.timestamp).toISOString()}, Close: $${latestCandle.close.toFixed(2)}`);
      console.log(`\n📊 [${new Date(latestCandle.timestamp).toLocaleString()}] Price: $${latestCandle.close.toFixed(2)}`);

      // Füge zur History hinzu
      this.candleHistory.push(latestCandle);

      // Behalte nur letzte 500 Candles im Speicher
      if (this.candleHistory.length > 500) {
        this.candleHistory = this.candleHistory.slice(-500);
      }

      // Verarbeite die Candle
      await this.processCandle(latestCandle);
    } catch (error: any) {
      logger.error('PAPER_TRADING', 'Error fetching/processing latest candle', error);
    }
  }

  /**
   * Verarbeitet eine einzelne Candle (ähnlich wie Backtest Engine)
   */
  private async processCandle(currentCandle: OHLCV): Promise<void> {
    try {
      const currentPrice = currentCandle.close;

      // 1. Aktualisiere Portfolio Equity
      this.updatePortfolio(currentPrice, currentCandle.timestamp);

      // 2. Prüfe Stop Loss / Take Profit für offene Position
      if (this.currentPosition) {
        await this.checkExitConditions(currentCandle);
      }

      // 3. Berechne technische Indikatoren
      const indicators = indicatorCalculator.calculateIndicators(this.candleHistory);
      const marketContext = indicatorCalculator.analyzeMarketContext(indicators, this.candleHistory);

      // 4. Erstelle Market Data
      const marketData: MarketData = {
        pair: this.config.pair,
        timeframe: this.config.timeframe,
        currentPrice,
        ohlcv: this.candleHistory.slice(-100), // Letzte 100 Candles
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
      console.log('🤖 AI analyzing market...');
      const prompt = this.promptBuilder.buildTradingPrompt(promptContext);
      const decision = await this.deepseekClient.getDecision(prompt);
      this.decisions.push(decision);

      console.log(`💭 AI Decision: ${decision.action} - ${decision.reasoning.substring(0, 100)}...`);

      // 7. Risk Management Check
      const riskCheck = this.riskManager.checkTradeAllowed(
        decision,
        this.portfolio,
        this.performanceTracker.getStats(),
        this.currentPosition,
        currentCandle.timestamp
      );

      if (!riskCheck.allowed) {
        logger.warn('PAPER_TRADING', `Trade rejected: ${riskCheck.reason}`);
        console.log(`⚠️  Trade rejected: ${riskCheck.reason}`);
        return;
      }

      // 8. Führe (simulierten) Trade aus
      await this.executeTrade(decision, currentCandle);

      // 9. Update Dashboard
      this.performanceTracker.updateEquityCurve(currentCandle.timestamp, this.portfolio.totalEquity);

      // Broadcast to Dashboard
      if (this.dashboardServer) {
        this.dashboardServer.broadcastUpdate({
          stats: this.performanceTracker.getStats(),
          trades: this.performanceTracker.getClosedTrades(),
          initialCapital: this.config.initialCapital,
          currentPrice,
          timestamp: currentCandle.timestamp,
        });
      }
    } catch (error: any) {
      logger.error('PAPER_TRADING', 'Error processing candle', error);
    }
  }

  /**
   * Führt einen (simulierten) Trade aus
   */
  private async executeTrade(decision: AIDecision, candle: OHLCV): Promise<void> {
    if (decision.action === 'BUY' && !this.currentPosition) {
      await this.openPosition(decision, candle);
    } else if (decision.action === 'SELL' && this.currentPosition) {
      await this.closePosition(candle, decision.reasoning);
    } else if (decision.action === 'HOLD') {
      logger.debug('PAPER_TRADING', 'AI Decision: HOLD');
      console.log('📊 Position: HOLD');
    }
  }

  /**
   * Öffnet eine (simulierte) Position
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

    console.log(`\n🟢 BUY SIGNAL (SIMULATED)`);
    console.log(`   Price: $${entryPrice.toFixed(2)}`);
    console.log(`   Quantity: ${quantity.toFixed(8)}`);
    console.log(`   Value: $${value.toFixed(2)}`);
    console.log(`   Stop Loss: $${stopLoss.toFixed(2)}`);
    console.log(`   Take Profit: $${takeProfit.toFixed(2)}\n`);
  }

  /**
   * Schließt eine (simulierte) Position
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

    const emoji = pnl > 0 ? '🟢' : '🔴';
    const sign = pnl > 0 ? '+' : '';

    console.log(`\n${emoji} SELL SIGNAL (SIMULATED)`);
    console.log(`   Exit Price: $${exitPrice.toFixed(2)}`);
    console.log(`   P&L: ${sign}$${pnl.toFixed(2)} (${sign}${pnlPercentage.toFixed(2)}%)`);
    console.log(`   Reason: ${reason}`);
    console.log(`   New Equity: $${this.portfolio.totalEquity.toFixed(2)}\n`);

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
      logger.warn('PAPER_TRADING', `⛔ Stop Loss hit at $${currentPrice.toFixed(2)}`);
      console.log(`\n⛔ Stop Loss triggered at $${currentPrice.toFixed(2)}`);
      await this.closePosition(candle, 'Stop Loss triggered');
      return;
    }

    // Take Profit getroffen?
    if (currentPrice >= this.currentPosition.takeProfit) {
      logger.info('PAPER_TRADING', `🎯 Take Profit hit at $${currentPrice.toFixed(2)}`);
      console.log(`\n🎯 Take Profit triggered at $${currentPrice.toFixed(2)}`);
      await this.closePosition(candle, 'Take Profit triggered');
      return;
    }

    // Update Unrealized P&L
    this.currentPosition.currentPrice = currentPrice;
    const unrealizedValue = this.currentPosition.quantity * currentPrice;
    const entryValue = this.currentPosition.quantity * this.currentPosition.entryPrice;
    this.currentPosition.unrealizedPnL = unrealizedValue - entryValue;

    const pnlPercent = (this.currentPosition.unrealizedPnL / entryValue) * 100;
    console.log(`   Current Position P&L: ${this.currentPosition.unrealizedPnL >= 0 ? '+' : ''}$${this.currentPosition.unrealizedPnL.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
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
      case 'm':
        return value;
      case 'h':
        return value * 60;
      case 'd':
        return value * 1440;
      default:
        throw new Error(`Unknown timeframe unit: ${unit}`);
    }
  }

  /**
   * Parsed Timeframe String zu Millisekunden
   */
  private parseTimeframeToMs(timeframe: string): number {
    const minutes = this.parseTimeframe(timeframe);
    return minutes * 60 * 1000;
  }

  /**
   * Gibt Performance-Statistiken zurück
   */
  getPerformanceStats() {
    return this.performanceTracker.getStats();
  }

  /**
   * Gibt aktuelles Portfolio zurück
   */
  getPortfolio(): Portfolio {
    return { ...this.portfolio };
  }
}
