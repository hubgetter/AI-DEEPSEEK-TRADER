/**
 * Technical Indicators - RSI, MACD, Bollinger Bands, etc.
 * Developer: Senior Developer Raj Patel
 * Expert Advisor: Sofia Petrov (Chart Master)
 *
 * SCALPING UPGRADE by Elite Trading Team:
 * - Victor "The Sniper" Volkov (Orderflow Expert)
 * - Dr. James "Quant" Patterson (Market Microstructure)
 * - Sophia "Ninja" Chen (Level 2 DOM Expert)
 *
 * Added Professional Scalping Indicators:
 * - VWAP (Volume Weighted Average Price) - Institutional benchmark
 * - Volume Profile (POC, VAH, VAL) - High Volume Nodes
 * - Keltner Channels - Volatility bands for squeeze detection
 * - Market Delta - Buy/Sell volume imbalance
 * - Orderflow Metrics - Tape reading indicators
 */

import { OHLCV, TechnicalIndicators, MarketContext } from '../types';
import { logger } from '../utils/logger';

export class TechnicalIndicatorCalculator {
  /**
   * Berechnet alle technischen Indikatoren für die gegebenen OHLCV-Daten
   */
  calculateIndicators(candles: OHLCV[]): TechnicalIndicators {
    if (candles.length < 50) {
      throw new Error('Not enough candles for indicator calculation (minimum 50 required)');
    }

    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const volumes = candles.map((c) => c.volume);

    // Standard indicators
    const rsi = this.calculateRSI(closes, 14);
    const macd = this.calculateMACD(closes);
    const bollingerBands = this.calculateBollingerBands(closes, 20, 2);
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const volumeAverage = this.calculateSMA(volumes, 20);
    const volumeRatio = volumes[volumes.length - 1] / volumeAverage;

    // SCALPING INDICATORS - Professional Grade
    const vwap = this.calculateVWAP(candles);
    const keltnerChannels = this.calculateKeltnerChannels(candles, 20, 1.5);
    const volumeProfile = this.calculateVolumeProfile(candles);
    const marketDelta = this.calculateMarketDelta(candles);

    // Squeeze Detection (BB + Keltner)
    const squeeze = this.detectSqueeze(bollingerBands, keltnerChannels);

    return {
      rsi,
      macd,
      bollingerBands,
      sma20,
      sma50,
      ema12,
      ema26,
      volumeAverage,
      volumeRatio,
      // Scalping additions
      vwap,
      keltnerChannels,
      volumeProfile,
      marketDelta,
      squeeze,
    };
  }

  /**
   * Analysiert Market Context basierend auf Indikatoren
   */
  analyzeMarketContext(indicators: TechnicalIndicators, candles: OHLCV[]): MarketContext {
    const currentPrice = candles[candles.length - 1].close;

    // Volatilität: basierend auf Bollinger Band Width
    const bbWidth =
      (indicators.bollingerBands.upper - indicators.bollingerBands.lower) /
      indicators.bollingerBands.middle;
    let volatility: 'low' | 'medium' | 'high';
    if (bbWidth < 0.02) volatility = 'low';
    else if (bbWidth < 0.05) volatility = 'medium';
    else volatility = 'high';

    // Trend: basierend auf SMA Crossover
    let trend: 'bullish' | 'bearish' | 'sideways';
    if (indicators.sma20 > indicators.sma50 * 1.01) trend = 'bullish';
    else if (indicators.sma20 < indicators.sma50 * 0.99) trend = 'bearish';
    else trend = 'sideways';

    // Momentum: basierend auf MACD und RSI
    let momentum: 'strong' | 'weak' | 'neutral';
    const macdStrong = Math.abs(indicators.macd.histogram) > Math.abs(indicators.macd.macd) * 0.1;
    const rsiStrong = indicators.rsi > 60 || indicators.rsi < 40;
    if (macdStrong && rsiStrong) momentum = 'strong';
    else if (!macdStrong && !rsiStrong) momentum = 'weak';
    else momentum = 'neutral';

    // Support & Resistance (vereinfacht)
    const support = this.findSupport(candles);
    const resistance = this.findResistance(candles);

    return { volatility, trend, momentum, support, resistance };
  }

  // ============================================================================
  // RSI (Relative Strength Index)
  // ============================================================================

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
      return 50; // Neutral
    }

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const recentChanges = changes.slice(-period);

    let gains = 0;
    let losses = 0;

    for (const change of recentChanges) {
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }

  // ============================================================================
  // MACD (Moving Average Convergence Divergence)
  // ============================================================================

  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);

    const macd = ema12 - ema26;

    // Signal Line = 9-period EMA of MACD
    // Für korrekte Berechnung müssten wir MACD-Werte für alle Perioden haben
    // Vereinfachung: Signal = MACD * 0.9 (Approximation)
    const signal = macd * 0.9;

    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  // ============================================================================
  // Bollinger Bands
  // ============================================================================

  private calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDev: number = 2
  ): { upper: number; middle: number; lower: number } {
    const middle = this.calculateSMA(prices, period);
    const standardDeviation = this.calculateStandardDeviation(prices, period);

    const upper = middle + stdDev * standardDeviation;
    const lower = middle - stdDev * standardDeviation;

    return { upper, middle, lower };
  }

  // ============================================================================
  // SMA (Simple Moving Average)
  // ============================================================================

  private calculateSMA(values: number[], period: number): number {
    if (values.length < period) {
      period = values.length;
    }

    const recentValues = values.slice(-period);
    const sum = recentValues.reduce((acc, val) => acc + val, 0);

    return sum / period;
  }

  // ============================================================================
  // EMA (Exponential Moving Average)
  // ============================================================================

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length < period) {
      return this.calculateSMA(prices, prices.length);
    }

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  // ============================================================================
  // Standard Deviation
  // ============================================================================

  private calculateStandardDeviation(values: number[], period: number): number {
    if (values.length < period) {
      period = values.length;
    }

    const recentValues = values.slice(-period);
    const mean = this.calculateSMA(values, period);

    const squaredDifferences = recentValues.map((val) => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / period;

    return Math.sqrt(variance);
  }

  // ============================================================================
  // Support & Resistance (Vereinfacht)
  // ============================================================================

  private findSupport(candles: OHLCV[]): number | null {
    // Finde lokale Minima in den letzten 20 Candles
    const recentCandles = candles.slice(-20);
    const lows = recentCandles.map((c) => c.low);

    let support: number | null = null;
    let minLow = Math.min(...lows);

    // Support = niedrigster Punkt der letzten 20 Candles
    support = minLow;

    return support;
  }

  private findResistance(candles: OHLCV[]): number | null {
    // Finde lokale Maxima in den letzten 20 Candles
    const recentCandles = candles.slice(-20);
    const highs = recentCandles.map((c) => c.high);

    let resistance: number | null = null;
    let maxHigh = Math.max(...highs);

    // Resistance = höchster Punkt der letzten 20 Candles
    resistance = maxHigh;

    return resistance;
  }

  // ============================================================================
  // Helper: Erkennt Überkauft/Überverkauft Zustände
  // ============================================================================

  isOverbought(indicators: TechnicalIndicators): boolean {
    return indicators.rsi > 70;
  }

  isOversold(indicators: TechnicalIndicators): boolean {
    return indicators.rsi < 30;
  }

  // ============================================================================
  // Helper: MACD Crossover Detection
  // ============================================================================

  isBullishCrossover(indicators: TechnicalIndicators): boolean {
    // MACD kreuzt Signal Line von unten nach oben
    return indicators.macd.histogram > 0 && Math.abs(indicators.macd.histogram) < 0.5;
  }

  isBearishCrossover(indicators: TechnicalIndicators): boolean {
    // MACD kreuzt Signal Line von oben nach unten
    return indicators.macd.histogram < 0 && Math.abs(indicators.macd.histogram) < 0.5;
  }

  // ============================================================================
  // Helper: Bollinger Band Squeeze/Breakout
  // ============================================================================

  isPriceAtUpperBand(currentPrice: number, indicators: TechnicalIndicators): boolean {
    return currentPrice >= indicators.bollingerBands.upper * 0.99;
  }

  isPriceAtLowerBand(currentPrice: number, indicators: TechnicalIndicators): boolean {
    return currentPrice <= indicators.bollingerBands.lower * 1.01;
  }

  // ============================================================================
  // Logging & Debugging
  // ============================================================================

  logIndicators(indicators: TechnicalIndicators) {
    logger.debug('INDICATORS', 'Technical Indicators:', {
      rsi: indicators.rsi.toFixed(2),
      macd: {
        macd: indicators.macd.macd.toFixed(2),
        signal: indicators.macd.signal.toFixed(2),
        histogram: indicators.macd.histogram.toFixed(2),
      },
      bollingerBands: {
        upper: indicators.bollingerBands.upper.toFixed(2),
        middle: indicators.bollingerBands.middle.toFixed(2),
        lower: indicators.bollingerBands.lower.toFixed(2),
      },
      volumeRatio: indicators.volumeRatio.toFixed(2),
    });
  }

  // ============================================================================
  // SCALPING INDICATORS - Professional Trading Tools
  // ============================================================================

  /**
   * VWAP - Volume Weighted Average Price
   * The institutional benchmark - big money uses VWAP for execution
   * Price above VWAP = Bullish, Price below VWAP = Bearish
   *
   * Expert: Dr. James "Quant" Patterson
   * "VWAP is where institutions execute. Price > VWAP = long bias, < VWAP = short bias.
   *  Deviation >2 StdDev = mean reversion opportunity."
   */
  private calculateVWAP(candles: OHLCV[]): {
    value: number;
    stdDev1Upper: number;
    stdDev1Lower: number;
    stdDev2Upper: number;
    stdDev2Lower: number;
  } {
    let cumulativeTPV = 0; // Typical Price * Volume
    let cumulativeVolume = 0;
    const typicalPrices: number[] = [];

    // Calculate VWAP
    for (const candle of candles) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      typicalPrices.push(typicalPrice);
      cumulativeTPV += typicalPrice * candle.volume;
      cumulativeVolume += candle.volume;
    }

    const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : candles[candles.length - 1].close;

    // Calculate Standard Deviation bands
    const squaredDiffs = typicalPrices.map(tp => Math.pow(tp - vwap, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / typicalPrices.length;
    const stdDev = Math.sqrt(variance);

    return {
      value: vwap,
      stdDev1Upper: vwap + stdDev,
      stdDev1Lower: vwap - stdDev,
      stdDev2Upper: vwap + 2 * stdDev,
      stdDev2Lower: vwap - 2 * stdDev,
    };
  }

  /**
   * Keltner Channels - ATR-based volatility bands
   * Used in combination with Bollinger Bands for "Squeeze" detection
   *
   * Expert: Linda "Scalper Queen" Martinez
   * "When Bollinger Bands squeeze inside Keltner Channels = compression.
   *  Breakout from squeeze = explosive move. That's where we make money."
   */
  private calculateKeltnerChannels(
    candles: OHLCV[],
    period: number = 20,
    multiplier: number = 1.5
  ): { upper: number; middle: number; lower: number } {
    const closes = candles.map(c => c.close);
    const middle = this.calculateEMA(closes, period);

    // Calculate ATR (Average True Range)
    const atr = this.calculateATR(candles, period);

    const upper = middle + multiplier * atr;
    const lower = middle - multiplier * atr;

    return { upper, middle, lower };
  }

  /**
   * ATR - Average True Range
   * Measures volatility - essential for stop loss placement
   */
  private calculateATR(candles: OHLCV[], period: number = 14): number {
    if (candles.length < period + 1) return 0;

    const trueRanges: number[] = [];

    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const previousClose = candles[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - previousClose),
        Math.abs(low - previousClose)
      );

      trueRanges.push(tr);
    }

    // Average of last 'period' true ranges
    const recentTR = trueRanges.slice(-period);
    return recentTR.reduce((sum, val) => sum + val, 0) / period;
  }

  /**
   * Squeeze Detection - BB inside Keltner = Volatility Compression
   *
   * Expert: Dr. James "Quant" Patterson
   * "The Squeeze is the calm before the storm. When volatility contracts,
   *  it MUST expand. We wait for the breakout direction, then ride the wave."
   */
  private detectSqueeze(
    bb: { upper: number; middle: number; lower: number },
    kc: { upper: number; middle: number; lower: number }
  ): {
    isActive: boolean;
    intensity: 'low' | 'medium' | 'high';
  } {
    // Squeeze is active when BB is inside KC
    const isActive = bb.upper < kc.upper && bb.lower > kc.lower;

    // Intensity based on how much BB has contracted
    const bbWidth = (bb.upper - bb.lower) / bb.middle;
    let intensity: 'low' | 'medium' | 'high';

    if (bbWidth < 0.015) intensity = 'high';      // Very tight
    else if (bbWidth < 0.025) intensity = 'medium';
    else intensity = 'low';

    return { isActive, intensity };
  }

  /**
   * Volume Profile - POC (Point of Control) & Value Areas
   * Shows where most volume traded - high volume nodes act as magnets
   *
   * Expert: Sophia "Ninja" Chen
   * "POC is a magnet. Price is always drawn to high volume nodes.
   *  VAH/VAL are the boundaries. Trade the reversion to POC."
   */
  private calculateVolumeProfile(candles: OHLCV[]): {
    poc: number;          // Point of Control (highest volume price level)
    vah: number;          // Value Area High (70% volume upper bound)
    val: number;          // Value Area Low (70% volume lower bound)
    totalVolume: number;
  } {
    // Create price buckets (simplified - use recent 50 candles)
    const recentCandles = candles.slice(-50);

    // Find price range
    const prices = recentCandles.flatMap(c => [c.high, c.low, c.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Create 20 price buckets
    const bucketCount = 20;
    const bucketSize = (maxPrice - minPrice) / bucketCount;
    const volumeBuckets = new Array(bucketCount).fill(0);

    // Distribute volume into buckets
    for (const candle of recentCandles) {
      const avgPrice = (candle.high + candle.low) / 2;
      const bucketIndex = Math.min(
        Math.floor((avgPrice - minPrice) / bucketSize),
        bucketCount - 1
      );
      volumeBuckets[bucketIndex] += candle.volume;
    }

    // Find POC (bucket with highest volume)
    let maxVolumeIndex = 0;
    for (let i = 1; i < bucketCount; i++) {
      if (volumeBuckets[i] > volumeBuckets[maxVolumeIndex]) {
        maxVolumeIndex = i;
      }
    }

    const poc = minPrice + (maxVolumeIndex + 0.5) * bucketSize;
    const totalVolume = volumeBuckets.reduce((sum, v) => sum + v, 0);

    // Calculate Value Area (70% of volume)
    const targetVolume = totalVolume * 0.7;
    let accumulatedVolume = volumeBuckets[maxVolumeIndex];
    let upperIndex = maxVolumeIndex;
    let lowerIndex = maxVolumeIndex;

    // Expand outward from POC until we capture 70% volume
    while (accumulatedVolume < targetVolume) {
      const upperVol = upperIndex < bucketCount - 1 ? volumeBuckets[upperIndex + 1] : 0;
      const lowerVol = lowerIndex > 0 ? volumeBuckets[lowerIndex - 1] : 0;

      if (upperVol > lowerVol && upperIndex < bucketCount - 1) {
        upperIndex++;
        accumulatedVolume += upperVol;
      } else if (lowerIndex > 0) {
        lowerIndex--;
        accumulatedVolume += lowerVol;
      } else {
        break;
      }
    }

    const vah = minPrice + (upperIndex + 1) * bucketSize;
    const val = minPrice + lowerIndex * bucketSize;

    return { poc, vah, val, totalVolume };
  }

  /**
   * Market Delta - Buy vs Sell Volume Imbalance
   * Approximation: Green candles = buying, Red candles = selling
   *
   * Expert: Victor "The Sniper" Volkov
   * "Market Delta shows who's in control. Positive delta + price up = strong buyers.
   *  Negative delta + price up = weak buyers, probably a trap. Watch divergences!"
   */
  private calculateMarketDelta(candles: OHLCV[]): {
    delta: number;           // Net buying/selling pressure
    deltaPct: number;        // As percentage of total volume
    buyVolume: number;
    sellVolume: number;
    imbalance: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  } {
    const recent = candles.slice(-20);

    let buyVolume = 0;
    let sellVolume = 0;

    for (const candle of recent) {
      // Simplified: Green candle = buy pressure, Red = sell pressure
      if (candle.close > candle.open) {
        buyVolume += candle.volume;
      } else {
        sellVolume += candle.volume;
      }
    }

    const totalVolume = buyVolume + sellVolume;
    const delta = buyVolume - sellVolume;
    const deltaPct = totalVolume > 0 ? (delta / totalVolume) * 100 : 0;

    // Classify imbalance
    let imbalance: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    if (deltaPct > 30) imbalance = 'strong_buy';
    else if (deltaPct > 10) imbalance = 'buy';
    else if (deltaPct > -10) imbalance = 'neutral';
    else if (deltaPct > -30) imbalance = 'sell';
    else imbalance = 'strong_sell';

    return {
      delta,
      deltaPct,
      buyVolume,
      sellVolume,
      imbalance,
    };
  }

  // ============================================================================
  // SCALPING HELPERS - Setup Recognition
  // ============================================================================

  /**
   * Detects VWAP Mean Reversion Setup
   * Price deviates >2 StdDev from VWAP = rubber band stretched too far
   *
   * Expert: Dr. James "Quant" Patterson
   */
  detectVWAPReversion(currentPrice: number, vwap: any): {
    isSetup: boolean;
    direction: 'long' | 'short' | 'none';
    quality: 'A' | 'B' | 'C';
  } {
    const deviation = currentPrice - vwap.value;
    const devPct = (deviation / vwap.value) * 100;

    // Long setup: Price below VWAP by >2 StdDev
    if (currentPrice < vwap.stdDev2Lower) {
      const quality = Math.abs(devPct) > 3 ? 'A' : 'B';
      return { isSetup: true, direction: 'long', quality };
    }

    // Short setup: Price above VWAP by >2 StdDev
    if (currentPrice > vwap.stdDev2Upper) {
      const quality = Math.abs(devPct) > 3 ? 'A' : 'B';
      return { isSetup: true, direction: 'short', quality };
    }

    return { isSetup: false, direction: 'none', quality: 'C' };
  }

  /**
   * Detects Squeeze Breakout Setup
   * Volatility compression followed by expansion = high probability move
   *
   * Expert: Linda "Scalper Queen" Martinez
   */
  detectSqueezeBreakout(
    currentPrice: number,
    previousPrice: number,
    squeeze: any,
    kc: any
  ): {
    isSetup: boolean;
    direction: 'long' | 'short' | 'none';
    quality: 'A' | 'B' | 'C';
  } {
    // Only trade squeeze releases
    if (!squeeze.isActive) {
      return { isSetup: false, direction: 'none', quality: 'C' };
    }

    // Check for breakout
    const pctMove = ((currentPrice - previousPrice) / previousPrice) * 100;

    // Bullish breakout: Price breaks above upper Keltner
    if (currentPrice > kc.upper && pctMove > 0.3) {
      const quality = squeeze.intensity === 'high' ? 'A' : 'B';
      return { isSetup: true, direction: 'long', quality };
    }

    // Bearish breakout: Price breaks below lower Keltner
    if (currentPrice < kc.lower && pctMove < -0.3) {
      const quality = squeeze.intensity === 'high' ? 'A' : 'B';
      return { isSetup: true, direction: 'short', quality };
    }

    return { isSetup: false, direction: 'none', quality: 'C' };
  }

  /**
   * Detects Volume Profile Magnet Trade
   * Price pulls back to POC = high probability bounce/rejection
   *
   * Expert: Sophia "Ninja" Chen
   */
  detectPOCMagnet(currentPrice: number, volumeProfile: any): {
    isSetup: boolean;
    direction: 'long' | 'short' | 'none';
    quality: 'A' | 'B' | 'C';
  } {
    const pocDist = Math.abs(currentPrice - volumeProfile.poc);
    const pocDistPct = (pocDist / currentPrice) * 100;

    // Price very close to POC (<0.5% away)
    if (pocDistPct < 0.5) {
      // Above POC = potential support
      if (currentPrice > volumeProfile.poc) {
        return { isSetup: true, direction: 'long', quality: 'A' };
      }
      // Below POC = potential resistance
      else {
        return { isSetup: true, direction: 'short', quality: 'A' };
      }
    }

    // Price near Value Area High/Low
    const vahDist = Math.abs(currentPrice - volumeProfile.vah);
    const valDist = Math.abs(currentPrice - volumeProfile.val);

    if (vahDist < currentPrice * 0.005) {
      return { isSetup: true, direction: 'short', quality: 'B' }; // Resistance at VAH
    }

    if (valDist < currentPrice * 0.005) {
      return { isSetup: true, direction: 'long', quality: 'B' }; // Support at VAL
    }

    return { isSetup: false, direction: 'none', quality: 'C' };
  }
}

// Singleton Export
export const indicatorCalculator = new TechnicalIndicatorCalculator();
