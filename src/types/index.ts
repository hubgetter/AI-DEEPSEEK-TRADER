/**
 * Type Definitions für AI DeepSeek Trader
 * Architekt: Dr. Andreas Müller
 */

// ============================================================================
// MARKET DATA TYPES
// ============================================================================

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  pair: string;
  timeframe: string;
  currentPrice: number;
  ohlcv: OHLCV[];
  timestamp: number;
}

// ============================================================================
// TECHNICAL INDICATORS (von Sofia Petrov - Chart Master)
// SCALPING UPGRADE by Elite Trading Team
// ============================================================================

export interface TechnicalIndicators {
  // Standard Indicators
  rsi: number;                    // Relative Strength Index (0-100)
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  sma20: number;                  // Simple Moving Average 20
  sma50: number;                  // Simple Moving Average 50
  ema12: number;                  // Exponential Moving Average 12
  ema26: number;                  // Exponential Moving Average 26
  volumeAverage: number;          // Durchschnittliches Volumen
  volumeRatio: number;            // Aktuelles Volumen / Durchschnitt

  // SCALPING INDICATORS - Professional Grade
  vwap?: {                         // Volume Weighted Average Price
    value: number;
    stdDev1Upper: number;
    stdDev1Lower: number;
    stdDev2Upper: number;
    stdDev2Lower: number;
  };
  keltnerChannels?: {             // ATR-based volatility bands
    upper: number;
    middle: number;
    lower: number;
  };
  volumeProfile?: {               // High Volume Nodes
    poc: number;                  // Point of Control
    vah: number;                  // Value Area High
    val: number;                  // Value Area Low
    totalVolume: number;
  };
  marketDelta?: {                 // Buy/Sell Pressure
    delta: number;
    deltaPct: number;
    buyVolume: number;
    sellVolume: number;
    imbalance: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  };
  squeeze?: {                     // BB + Keltner Squeeze
    isActive: boolean;
    intensity: 'low' | 'medium' | 'high';
  };
}

export interface MarketContext {
  volatility: 'low' | 'medium' | 'high';
  trend: 'bullish' | 'bearish' | 'sideways';
  momentum: 'strong' | 'weak' | 'neutral';
  support: number | null;
  resistance: number | null;
}

// ============================================================================
// PORTFOLIO & TRADING (von Ahmed Hassan - Risk Manager)
// ============================================================================

export interface Portfolio {
  cash: number;
  holdings: Map<string, number>;  // symbol -> quantity
  totalEquity: number;
  timestamp: number;
}

export interface Position {
  symbol: string;
  entryPrice: number;
  quantity: number;
  side: 'long' | 'short';
  entryTime: number;
  stopLoss: number;
  takeProfit: number;
  currentPrice?: number;
  unrealizedPnL?: number;
}

export interface Trade {
  id: string;
  timestamp: number;
  pair: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  value: number;
  fee: number;
  stopLoss?: number;
  takeProfit?: number;
  reasoning: string;
}

export interface ClosedTrade extends Trade {
  exitTime: number;
  exitPrice: number;
  pnl: number;
  pnlPercentage: number;
  holdingPeriod: number;          // in milliseconds
  isWin: boolean;
}

// ============================================================================
// PERFORMANCE STATISTICS (KPIs von Ahmed Hassan)
// ============================================================================

export interface PerformanceStats {
  // Grundlegende Metriken
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;                // Percentage (0-100)

  // Profit & Loss
  totalPnL: number;
  totalPnLPercentage: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;           // Gross Profit / Gross Loss

  // Risk Metriken
  sharpeRatio: number;            // Risk-adjusted return
  maxDrawdown: number;            // Maximum portfolio decline
  maxDrawdownPercentage: number;
  currentDrawdown: number;

  // Streak Tracking
  consecutiveWins: number;
  consecutiveLosses: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;

  // Erweiterte Metriken
  averageHoldingPeriod: number;   // in minutes
  averageRiskRewardRatio: number;
  expectancy: number;             // Expected value per trade

  // Equity Curve
  equityCurve: { timestamp: number; equity: number }[];

  // Zeit
  startTime: number;
  lastUpdateTime: number;
  tradingDays: number;
}

// ============================================================================
// AI DECISION TYPES (DeepSeek Integration)
// ============================================================================

export interface AIDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;             // 0-1
  quantity?: number;              // Percentage of portfolio (0-1)
  stopLoss?: number;              // Price level
  takeProfit?: number;            // Price level
  reasoning: string;
  timestamp: number;
}

export interface AIPromptContext {
  marketData: MarketData;
  technicalIndicators: TechnicalIndicators;
  marketContext: MarketContext;
  portfolio: Portfolio;
  currentPosition: Position | null;
  performanceStats: PerformanceStats;
  recentTrades: ClosedTrade[];
}

// ============================================================================
// RISK MANAGEMENT (von Ahmed Hassan - The Guardian)
// ============================================================================

export interface RiskParameters {
  maxRiskPerTrade: number;        // Percentage (0-1)
  maxDrawdown: number;            // Percentage (0-1)
  dailyLossLimit: number;         // Percentage (0-1)
  maxConsecutiveLosses: number;
  minSharpeRatio: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  maxPositionSize: number;        // Percentage of portfolio (0-1)
  circuitBreakerRecoveryMinutes: number; // Auto-recovery time in minutes (0 = disabled)
}

export interface RiskCheck {
  allowed: boolean;
  reason?: string;
  adjustedQuantity?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface TradingConfig {
  pair: string;
  timeframe: string;
  initialCapital: number;
  riskParameters: RiskParameters;

  // Kraken Config
  krakenApiKey?: string;
  krakenApiSecret?: string;

  // DeepSeek Config
  deepseekApiKey: string;
  deepseekModel: string;

  // AI Config
  useTechnicalIndicators: boolean; // If false, AI relies only on price action

  // Backtesting Config
  backtestStartDate?: Date;
  backtestEndDate?: Date;

  // Fees (Kraken)
  makerFee: number;               // 0.0016 = 0.16%
  takerFee: number;               // 0.0026 = 0.26%
  slippage: number;               // 0.0005 = 0.05%
}

// ============================================================================
// BACKTESTING
// ============================================================================

export interface BacktestResult {
  config: TradingConfig;
  stats: PerformanceStats;
  trades: ClosedTrade[];
  decisions: AIDecision[];
  equityCurve: { timestamp: number; equity: number }[];
  duration: number;               // in milliseconds
  startDate: Date;
  endDate: Date;
}

// ============================================================================
// LOGGING
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

// ============================================================================
// KRAKEN API TYPES
// ============================================================================

export interface KrakenOHLCResponse {
  error: string[];
  result: {
    [key: string]: number[][];  // [time, open, high, low, close, vwap, volume, count]
  };
}

export interface KrakenTickerResponse {
  error: string[];
  result: {
    [key: string]: {
      a: [string, string, string];  // ask [price, whole lot volume, lot volume]
      b: [string, string, string];  // bid [price, whole lot volume, lot volume]
      c: [string, string];          // last trade [price, lot volume]
      v: [string, string];          // volume [today, last 24 hours]
      p: [string, string];          // volume weighted average [today, last 24 hours]
      t: [number, number];          // number of trades [today, last 24 hours]
      l: [string, string];          // low [today, last 24 hours]
      h: [string, string];          // high [today, last 24 hours]
      o: string;                    // today's opening price
    };
  };
}

// ============================================================================
// DEEPSEEK API TYPES
// ============================================================================

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: DeepSeekMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
