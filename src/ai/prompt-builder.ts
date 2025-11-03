/**
 * Prompt Builder - Erstellt kontextreiche Prompts für DeepSeek
 * Developer: Senior Developer Raj Patel
 */

import {
  AIPromptContext,
  TechnicalIndicators,
  MarketContext,
  Portfolio,
  Position,
  PerformanceStats,
  ClosedTrade,
} from '../types';

export class PromptBuilder {
  private useTechnicalIndicators: boolean;

  constructor(useTechnicalIndicators: boolean = true) {
    this.useTechnicalIndicators = useTechnicalIndicators;
  }

  /**
   * Erstellt den vollständigen Prompt für eine Trading-Entscheidung
   */
  buildTradingPrompt(context: AIPromptContext): string {
    const sections = [
      this.buildMarketDataSection(context),
    ];

    // Nur Indikatoren hinzufügen wenn aktiviert
    if (this.useTechnicalIndicators) {
      sections.push(this.buildTechnicalIndicatorsSection(context.technicalIndicators));
      sections.push(this.buildMarketContextSection(context.marketContext));
    } else {
      sections.push(this.buildPriceActionOnlySection(context));
    }

    sections.push(
      this.buildPortfolioSection(context.portfolio, context.currentPosition),
      this.buildPerformanceSection(context.performanceStats),
      this.buildRecentTradesSection(context.recentTrades),
      this.buildDecisionRequest()
    );

    return sections.join('\n\n');
  }

  /**
   * Marktdaten Sektion
   */
  private buildMarketDataSection(context: AIPromptContext): string {
    const latestCandle = context.marketData.ohlcv[context.marketData.ohlcv.length - 1];

    return `CURRENT MARKET DATA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Pair: ${context.marketData.pair}
• Timeframe: ${context.marketData.timeframe}
• Current Price: $${context.marketData.currentPrice.toFixed(2)}
• Latest Candle:
  - Open: $${latestCandle.open.toFixed(2)}
  - High: $${latestCandle.high.toFixed(2)}
  - Low: $${latestCandle.low.toFixed(2)}
  - Close: $${latestCandle.close.toFixed(2)}
  - Volume: ${latestCandle.volume.toFixed(2)}`;
  }

  /**
   * Technische Indikatoren Sektion - SCALPING ENHANCED
   */
  private buildTechnicalIndicatorsSection(indicators: TechnicalIndicators): string {
    const rsiStatus = this.getRSIStatus(indicators.rsi);
    const macdStatus = this.getMACDStatus(indicators.macd);
    const bbStatus = this.getBBStatus(indicators.bollingerBands);

    let section = `TECHNICAL INDICATORS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• RSI (14): ${indicators.rsi.toFixed(2)} - ${rsiStatus}
• MACD:
  - MACD Line: ${indicators.macd.macd.toFixed(2)}
  - Signal Line: ${indicators.macd.signal.toFixed(2)}
  - Histogram: ${indicators.macd.histogram.toFixed(2)} - ${macdStatus}
• Bollinger Bands:
  - Upper: $${indicators.bollingerBands.upper.toFixed(2)}
  - Middle: $${indicators.bollingerBands.middle.toFixed(2)}
  - Lower: $${indicators.bollingerBands.lower.toFixed(2)}
  - Status: ${bbStatus}
• Moving Averages:
  - SMA 20: $${indicators.sma20.toFixed(2)}
  - SMA 50: $${indicators.sma50.toFixed(2)}
  - EMA 12: $${indicators.ema12.toFixed(2)}
  - EMA 26: $${indicators.ema26.toFixed(2)}
• Volume:
  - Average: ${indicators.volumeAverage.toFixed(2)}
  - Ratio: ${indicators.volumeRatio.toFixed(2)}x ${this.getVolumeStatus(indicators.volumeRatio)}`;

    // Add SCALPING INDICATORS if available
    if (indicators.vwap) {
      section += `

SCALPING INDICATORS (Professional Grade):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• VWAP (Institutional Benchmark):
  - Value: $${indicators.vwap.value.toFixed(2)}
  - +1σ: $${indicators.vwap.stdDev1Upper.toFixed(2)}
  - -1σ: $${indicators.vwap.stdDev1Lower.toFixed(2)}
  - +2σ: $${indicators.vwap.stdDev2Upper.toFixed(2)} (Extreme Overbought)
  - -2σ: $${indicators.vwap.stdDev2Lower.toFixed(2)} (Extreme Oversold)`;
    }

    if (indicators.keltnerChannels) {
      section += `
• Keltner Channels (ATR-based):
  - Upper: $${indicators.keltnerChannels.upper.toFixed(2)}
  - Middle: $${indicators.keltnerChannels.middle.toFixed(2)}
  - Lower: $${indicators.keltnerChannels.lower.toFixed(2)}`;
    }

    if (indicators.squeeze) {
      const squeezeEmoji = indicators.squeeze.isActive ? '🔥' : '❌';
      section += `
• BB/Keltner Squeeze: ${squeezeEmoji} ${indicators.squeeze.isActive ? 'ACTIVE' : 'Inactive'}
  - Intensity: ${indicators.squeeze.intensity.toUpperCase()}
  ${indicators.squeeze.isActive ? '⚠️  VOLATILITY COMPRESSION - Breakout imminent!' : ''}`;
    }

    if (indicators.volumeProfile) {
      section += `
• Volume Profile (Last 50 candles):
  - POC (Point of Control): $${indicators.volumeProfile.poc.toFixed(2)} 🧲
  - VAH (Value Area High): $${indicators.volumeProfile.vah.toFixed(2)}
  - VAL (Value Area Low): $${indicators.volumeProfile.val.toFixed(2)}
  - Total Volume: ${indicators.volumeProfile.totalVolume.toFixed(2)}`;
    }

    if (indicators.marketDelta) {
      const deltaEmoji = indicators.marketDelta.imbalance === 'strong_buy' ? '🟢🟢' :
                          indicators.marketDelta.imbalance === 'buy' ? '🟢' :
                          indicators.marketDelta.imbalance === 'sell' ? '🔴' :
                          indicators.marketDelta.imbalance === 'strong_sell' ? '🔴🔴' : '⚪';
      section += `
• Market Delta (Orderflow):
  - Buy Volume: ${indicators.marketDelta.buyVolume.toFixed(2)}
  - Sell Volume: ${indicators.marketDelta.sellVolume.toFixed(2)}
  - Delta: ${indicators.marketDelta.delta.toFixed(2)} (${indicators.marketDelta.deltaPct.toFixed(1)}%)
  - Imbalance: ${deltaEmoji} ${indicators.marketDelta.imbalance.toUpperCase().replace('_', ' ')}`;
    }

    return section;
  }

  /**
   * Price Action Only Sektion (ohne technische Indikatoren)
   */
  private buildPriceActionOnlySection(context: AIPromptContext): string {
    const recent = context.marketData.ohlcv.slice(-10); // Letzte 10 Candles
    const priceAction = recent.map((c, i) => {
      const change = i > 0 ? ((c.close - recent[i-1].close) / recent[i-1].close * 100).toFixed(2) : '0.00';
      const changeNum = parseFloat(change);
      return `  - ${new Date(c.timestamp).toLocaleTimeString()}: $${c.close.toFixed(2)} (${changeNum >= 0 ? '+' : ''}${change}%)`;
    }).join('\n');

    return `PRICE ACTION ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recent Price Movement (Last 10 Candles):
${priceAction}

IMPORTANT: You are operating in PURE AI MODE.
- NO technical indicators are provided
- Rely ONLY on price action, patterns, and your trading knowledge
- Analyze candlestick patterns, support/resistance, trends from raw OHLCV data
- Use your deep understanding of market psychology and price dynamics`;
  }

  /**
   * Market Context Sektion
   */
  private buildMarketContextSection(context: MarketContext): string {
    return `MARKET CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Volatility: ${context.volatility.toUpperCase()}
• Trend: ${context.trend.toUpperCase()}
• Momentum: ${context.momentum.toUpperCase()}
• Support Level: ${context.support ? '$' + context.support.toFixed(2) : 'N/A'}
• Resistance Level: ${context.resistance ? '$' + context.resistance.toFixed(2) : 'N/A'}`;
  }

  /**
   * Portfolio Sektion
   */
  private buildPortfolioSection(portfolio: Portfolio, position: Position | null): string {
    let section = `PORTFOLIO STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Cash Available: $${portfolio.cash.toFixed(2)}
• Total Equity: $${portfolio.totalEquity.toFixed(2)}
• Holdings: ${this.formatHoldings(portfolio.holdings)}`;

    if (position) {
      const unrealizedPnL = position.unrealizedPnL || 0;
      const pnlPercentage = ((unrealizedPnL / (position.entryPrice * position.quantity)) * 100);

      section += `
• Current Position:
  - Side: ${position.side.toUpperCase()}
  - Entry Price: $${position.entryPrice.toFixed(2)}
  - Current Price: $${position.currentPrice?.toFixed(2) || 'N/A'}
  - Quantity: ${position.quantity.toFixed(6)}
  - Unrealized P&L: $${unrealizedPnL.toFixed(2)} (${pnlPercentage.toFixed(2)}%)
  - Stop Loss: $${position.stopLoss.toFixed(2)}
  - Take Profit: $${position.takeProfit.toFixed(2)}`;
    } else {
      section += `\n• Current Position: NONE (No open positions)`;
    }

    return section;
  }

  /**
   * Performance Statistiken Sektion
   */
  private buildPerformanceSection(stats: PerformanceStats): string {
    return `PERFORMANCE STATISTICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total Trades: ${stats.totalTrades} (${stats.winningTrades}W / ${stats.losingTrades}L)
• Win Rate: ${stats.winRate.toFixed(2)}%
• Profit Factor: ${stats.profitFactor.toFixed(2)}
• Total P&L: $${stats.totalPnL.toFixed(2)} (${stats.totalPnLPercentage.toFixed(2)}%)
• Sharpe Ratio: ${stats.sharpeRatio.toFixed(2)}
• Max Drawdown: ${stats.maxDrawdownPercentage.toFixed(2)}%
• Current Drawdown: ${stats.currentDrawdown.toFixed(2)}%
• Consecutive Wins: ${stats.consecutiveWins}
• Consecutive Losses: ${stats.consecutiveLosses} ${this.getStreakWarning(stats.consecutiveLosses)}
• Average Win: $${stats.averageWin.toFixed(2)}
• Average Loss: $${Math.abs(stats.averageLoss).toFixed(2)}
• Expectancy: $${stats.expectancy.toFixed(2)} per trade`;
  }

  /**
   * Letzte Trades Sektion
   */
  private buildRecentTradesSection(trades: ClosedTrade[]): string {
    if (trades.length === 0) {
      return `RECENT TRADES:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nNo trades yet.`;
    }

    const recentTrades = trades.slice(-5);
    let section = `RECENT TRADES (Last ${recentTrades.length}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    recentTrades.forEach((trade, index) => {
      const pnlSign = trade.pnl >= 0 ? '+' : '';
      const result = trade.isWin ? 'WIN' : 'LOSS';
      section += `
${index + 1}. ${result} - ${trade.action} @ $${trade.price.toFixed(2)} → Exit @ $${trade.exitPrice.toFixed(2)}
   P&L: ${pnlSign}$${trade.pnl.toFixed(2)} (${pnlSign}${trade.pnlPercentage.toFixed(2)}%)
   Reason: ${trade.reasoning}`;
    });

    return section;
  }

  /**
   * Entscheidungs-Anforderung
   */
  private buildDecisionRequest(): string {
    return `DECISION REQUIRED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Based on the above market data, technical indicators, portfolio status, and your performance history:

1. Analyze the current market situation
2. Consider risk management (max 2% risk per trade)
3. Respect circuit breakers (stop after 3 consecutive losses)
4. Make a trading decision: BUY, SELL, or HOLD

Respond ONLY with valid JSON in this exact format:
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 0.0-1.0,
  "quantity": 0.0-1.0,
  "stopLoss": number,
  "takeProfit": number,
  "reasoning": "string"
}`;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getRSIStatus(rsi: number): string {
    if (rsi > 70) return '🔴 OVERBOUGHT';
    if (rsi < 30) return '🟢 OVERSOLD';
    if (rsi > 60) return '🟡 Bullish';
    if (rsi < 40) return '🟡 Bearish';
    return '⚪ Neutral';
  }

  private getMACDStatus(macd: { macd: number; signal: number; histogram: number }): string {
    if (macd.histogram > 0) return '🟢 Bullish';
    if (macd.histogram < 0) return '🔴 Bearish';
    return '⚪ Neutral';
  }

  private getBBStatus(bb: { upper: number; middle: number; lower: number }): string {
    const width = ((bb.upper - bb.lower) / bb.middle) * 100;
    if (width < 2) return 'Tight Squeeze';
    if (width > 5) return 'Wide Expansion';
    return 'Normal';
  }

  private getVolumeStatus(ratio: number): string {
    if (ratio > 1.5) return '🔥 HIGH';
    if (ratio > 1.2) return '📈 Above Average';
    if (ratio < 0.8) return '📉 Below Average';
    return '⚪ Normal';
  }

  private formatHoldings(holdings: Map<string, number>): string {
    if (holdings.size === 0) return 'None';
    return Array.from(holdings.entries())
      .map(([symbol, qty]) => `${symbol}: ${qty.toFixed(6)}`)
      .join(', ');
  }

  private getStreakWarning(consecutiveLosses: number): string {
    if (consecutiveLosses >= 3) return '⚠️ CIRCUIT BREAKER WARNING!';
    if (consecutiveLosses >= 2) return '⚠️ CAUTION';
    return '';
  }
}

// Legacy Singleton Export (for backwards compatibility)
// NOTE: This uses technical indicators by default. For new code, instantiate PromptBuilder directly.
export const promptBuilder = new PromptBuilder(true);
