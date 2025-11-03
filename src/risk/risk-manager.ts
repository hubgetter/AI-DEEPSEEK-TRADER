/**
 * Risk Manager - Circuit Breakers, Position Sizing, Risk Control
 * Developer: Lead Developer Julia Kowalski
 * Expert Advisor: Ahmed Hassan (The Guardian)
 */

import {
  RiskParameters,
  RiskCheck,
  Portfolio,
  PerformanceStats,
  AIDecision,
  Position,
} from '../types';
import { logger } from '../utils/logger';

export class RiskManager {
  private riskParams: RiskParameters;
  private tradingHalted: boolean = false;
  private haltReason: string = '';
  private haltTimestamp: number = 0; // Timestamp when trading was halted

  constructor(riskParams: RiskParameters) {
    this.riskParams = riskParams;
    logger.info('RISK', 'Risk Manager initialized', riskParams);
  }

  /**
   * Prüft ob ein Trade erlaubt ist
   */
  checkTradeAllowed(
    decision: AIDecision,
    portfolio: Portfolio,
    stats: PerformanceStats,
    currentPosition: Position | null,
    currentTimestamp?: number
  ): RiskCheck {
    // Auto-Recovery: Check if trading can resume
    if (this.tradingHalted && currentTimestamp) {
      this.checkAutoRecovery(currentTimestamp);
    }

    // Circuit Breaker: Trading gestoppt?
    if (this.tradingHalted) {
      return {
        allowed: false,
        reason: `Trading halted: ${this.haltReason}`,
      };
    }

    // Prüfung 1: Consecutive Losses (Circuit Breaker)
    const consecutiveLossCheck = this.checkConsecutiveLosses(stats);
    if (!consecutiveLossCheck.allowed) {
      this.haltTrading(consecutiveLossCheck.reason!, currentTimestamp);
      return consecutiveLossCheck;
    }

    // Prüfung 2: Daily Loss Limit
    const dailyLossCheck = this.checkDailyLossLimit(stats);
    if (!dailyLossCheck.allowed) {
      this.haltTrading(dailyLossCheck.reason!, currentTimestamp);
      return dailyLossCheck;
    }

    // Prüfung 3: Max Drawdown
    const drawdownCheck = this.checkMaxDrawdown(stats);
    if (!drawdownCheck.allowed) {
      this.haltTrading(drawdownCheck.reason!, currentTimestamp);
      return drawdownCheck;
    }

    // Prüfung 4: Sharpe Ratio (nur warnen, nicht stoppen)
    this.checkSharpeRatio(stats);

    // Prüfung 5: Position Sizing
    if (decision.action === 'BUY') {
      const positionSizeCheck = this.checkPositionSize(decision, portfolio);
      if (!positionSizeCheck.allowed) {
        return positionSizeCheck;
      }
    }

    // Prüfung 6: Ausreichend Cash verfügbar
    if (decision.action === 'BUY') {
      const cashCheck = this.checkSufficientCash(decision, portfolio);
      if (!cashCheck.allowed) {
        return cashCheck;
      }
    }

    // Prüfung 7: Position bereits offen?
    if (decision.action === 'BUY' && currentPosition) {
      return {
        allowed: false,
        reason: 'Position already open. Close current position before opening new one.',
      };
    }

    if (decision.action === 'SELL' && !currentPosition) {
      return {
        allowed: false,
        reason: 'No open position to sell.',
      };
    }

    // Alle Prüfungen bestanden
    logger.info('RISK', `Trade allowed: ${decision.action}`, {
      confidence: decision.confidence,
      quantity: decision.quantity,
    });

    return { allowed: true };
  }

  /**
   * Berechnet die optimale Position Size basierend auf Risk Parameters
   */
  calculatePositionSize(
    decision: AIDecision,
    portfolio: Portfolio,
    currentPrice: number
  ): number {
    const maxRiskAmount = portfolio.totalEquity * this.riskParams.maxRiskPerTrade;

    // Stop Loss Distance
    const stopLossDistance = decision.stopLoss
      ? Math.abs(currentPrice - decision.stopLoss)
      : currentPrice * this.riskParams.stopLossPercentage;

    // Position Size basierend auf Stop Loss
    let positionSize = maxRiskAmount / stopLossDistance;

    // Begrenze auf Max Position Size (% of portfolio)
    const maxPositionValue = portfolio.totalEquity * this.riskParams.maxPositionSize;
    const maxQuantity = maxPositionValue / currentPrice;

    positionSize = Math.min(positionSize, maxQuantity);

    // AI-Empfehlung berücksichtigen (wenn vorhanden)
    if (decision.quantity) {
      const aiSuggestedQuantity = (portfolio.cash * decision.quantity) / currentPrice;
      positionSize = Math.min(positionSize, aiSuggestedQuantity);
    }

    logger.debug('RISK', `Calculated position size: ${positionSize.toFixed(6)}`, {
      maxRiskAmount,
      stopLossDistance,
      currentPrice,
      maxQuantity,
    });

    return positionSize;
  }

  /**
   * Berechnet Stop Loss Level
   */
  calculateStopLoss(entryPrice: number, side: 'long' | 'short', aiStopLoss?: number): number {
    if (aiStopLoss) {
      // Validiere AI Stop Loss
      const distance = Math.abs(entryPrice - aiStopLoss) / entryPrice;
      if (distance >= this.riskParams.stopLossPercentage * 0.5 && distance <= this.riskParams.stopLossPercentage * 2) {
        return aiStopLoss;
      }
    }

    // Fallback: Standard Stop Loss Percentage
    if (side === 'long') {
      return entryPrice * (1 - this.riskParams.stopLossPercentage);
    } else {
      return entryPrice * (1 + this.riskParams.stopLossPercentage);
    }
  }

  /**
   * Berechnet Take Profit Level
   */
  calculateTakeProfit(entryPrice: number, side: 'long' | 'short', aiTakeProfit?: number): number {
    if (aiTakeProfit) {
      // Validiere AI Take Profit
      const distance = Math.abs(aiTakeProfit - entryPrice) / entryPrice;
      if (distance >= this.riskParams.takeProfitPercentage * 0.5 && distance <= this.riskParams.takeProfitPercentage * 3) {
        return aiTakeProfit;
      }
    }

    // Fallback: Standard Take Profit Percentage
    if (side === 'long') {
      return entryPrice * (1 + this.riskParams.takeProfitPercentage);
    } else {
      return entryPrice * (1 - this.riskParams.takeProfitPercentage);
    }
  }

  // ============================================================================
  // CIRCUIT BREAKERS & RISK CHECKS
  // ============================================================================

  /**
   * Circuit Breaker: Consecutive Losses
   */
  private checkConsecutiveLosses(stats: PerformanceStats): RiskCheck {
    if (stats.consecutiveLosses >= this.riskParams.maxConsecutiveLosses) {
      const reason = `Circuit Breaker: ${stats.consecutiveLosses} consecutive losses (max: ${this.riskParams.maxConsecutiveLosses})`;
      logger.logRiskEvent('CIRCUIT_BREAKER_TRIGGERED', { consecutiveLosses: stats.consecutiveLosses });
      return { allowed: false, reason };
    }
    return { allowed: true };
  }

  /**
   * Daily Loss Limit Check
   */
  private checkDailyLossLimit(stats: PerformanceStats): RiskCheck {
    // Vereinfachung: nutzen wir Current Drawdown als Proxy
    const lossPercentage = Math.abs(stats.currentDrawdown) / 100;

    if (lossPercentage >= this.riskParams.dailyLossLimit) {
      const reason = `Daily loss limit reached: ${(lossPercentage * 100).toFixed(2)}% (max: ${(this.riskParams.dailyLossLimit * 100).toFixed(2)}%)`;
      logger.logRiskEvent('DAILY_LOSS_LIMIT_REACHED', { lossPercentage });
      return { allowed: false, reason };
    }
    return { allowed: true };
  }

  /**
   * Max Drawdown Check
   */
  private checkMaxDrawdown(stats: PerformanceStats): RiskCheck {
    if (stats.maxDrawdownPercentage / 100 >= this.riskParams.maxDrawdown) {
      const reason = `Max drawdown exceeded: ${stats.maxDrawdownPercentage.toFixed(2)}% (max: ${(this.riskParams.maxDrawdown * 100).toFixed(2)}%)`;
      logger.logRiskEvent('MAX_DRAWDOWN_EXCEEDED', { maxDrawdown: stats.maxDrawdownPercentage });
      return { allowed: false, reason };
    }
    return { allowed: true };
  }

  /**
   * Sharpe Ratio Warning (nur Warnung, kein Stopp)
   */
  private checkSharpeRatio(stats: PerformanceStats): void {
    if (stats.totalTrades >= 20 && stats.sharpeRatio < this.riskParams.minSharpeRatio) {
      logger.warn(
        'RISK',
        `Sharpe Ratio below target: ${stats.sharpeRatio.toFixed(2)} (target: ${this.riskParams.minSharpeRatio})`
      );
    }
  }

  /**
   * Position Size Check
   */
  private checkPositionSize(decision: AIDecision, portfolio: Portfolio): RiskCheck {
    if (decision.quantity && decision.quantity > this.riskParams.maxPositionSize) {
      const adjusted = this.riskParams.maxPositionSize;
      logger.warn(
        'RISK',
        `Position size adjusted from ${(decision.quantity * 100).toFixed(1)}% to ${(adjusted * 100).toFixed(1)}%`
      );
      return {
        allowed: true,
        adjustedQuantity: adjusted,
      };
    }
    return { allowed: true };
  }

  /**
   * Sufficient Cash Check
   */
  private checkSufficientCash(decision: AIDecision, portfolio: Portfolio): RiskCheck {
    const requiredCash = decision.quantity
      ? portfolio.totalEquity * decision.quantity
      : portfolio.totalEquity * 0.1;

    if (portfolio.cash < requiredCash) {
      const reason = `Insufficient cash: Required $${requiredCash.toFixed(2)}, Available: $${portfolio.cash.toFixed(2)}`;
      return { allowed: false, reason };
    }
    return { allowed: true };
  }

  // ============================================================================
  // TRADING HALT MANAGEMENT
  // ============================================================================

  /**
   * Stoppt Trading
   */
  haltTrading(reason: string, timestamp?: number): void {
    this.tradingHalted = true;
    this.haltReason = reason;
    this.haltTimestamp = timestamp || Date.now();

    const recoveryInfo = this.riskParams.circuitBreakerRecoveryMinutes > 0
      ? ` (Auto-recovery in ${this.riskParams.circuitBreakerRecoveryMinutes} minutes)`
      : ' (No auto-recovery)';

    logger.error('RISK', `🛑 TRADING HALTED: ${reason}${recoveryInfo}`);
  }

  /**
   * Prüft ob Auto-Recovery möglich ist
   */
  private checkAutoRecovery(currentTimestamp: number): void {
    if (!this.tradingHalted || this.riskParams.circuitBreakerRecoveryMinutes === 0) {
      return;
    }

    const recoveryTimeMs = this.riskParams.circuitBreakerRecoveryMinutes * 60 * 1000;
    const elapsedTime = currentTimestamp - this.haltTimestamp;

    if (elapsedTime >= recoveryTimeMs) {
      logger.info('RISK', `✅ Auto-Recovery: Trading resumed after ${this.riskParams.circuitBreakerRecoveryMinutes} minutes`);
      this.resumeTrading();
    }
  }

  /**
   * Setzt Trading fort
   */
  resumeTrading(): void {
    if (this.tradingHalted) {
      logger.info('RISK', '✅ Trading resumed');
      this.tradingHalted = false;
      this.haltReason = '';
      this.haltTimestamp = 0;
    }
  }

  /**
   * Ist Trading gestoppt?
   */
  isTradingHalted(): boolean {
    return this.tradingHalted;
  }

  /**
   * Grund für Trading-Stopp
   */
  getHaltReason(): string {
    return this.haltReason;
  }

  // ============================================================================
  // RISK PARAMETERS UPDATE
  // ============================================================================

  updateRiskParameters(params: Partial<RiskParameters>): void {
    this.riskParams = { ...this.riskParams, ...params };
    logger.info('RISK', 'Risk parameters updated', this.riskParams);
  }

  getRiskParameters(): RiskParameters {
    return { ...this.riskParams };
  }
}
