/**
 * DeepSeek AI Client - KI-Entscheidungen für Trading
 * Developer: Senior Developer Raj Patel
 */

import axios, { AxiosInstance } from 'axios';
import { AIDecision, DeepSeekRequest, DeepSeekResponse, DeepSeekMessage } from '../types';
import { logger } from '../utils/logger';

export class DeepSeekClient {
  private apiUrl: string;
  private apiKey: string;
  private model: string;
  private axiosInstance: AxiosInstance;
  private requestCount: number = 0;
  private totalTokens: number = 0;
  private useTechnicalIndicators: boolean;

  constructor(apiKey: string, useTechnicalIndicators: boolean = true, apiUrl?: string, model?: string) {
    this.apiKey = apiKey;
    this.useTechnicalIndicators = useTechnicalIndicators;
    this.apiUrl = apiUrl || 'https://api.deepseek.com/v1/chat/completions';
    this.model = model || 'deepseek-chat';

    this.axiosInstance = axios.create({
      baseURL: this.apiUrl.replace('/v1/chat/completions', ''),
      timeout: 60000, // 60 Sekunden
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    logger.info('DEEPSEEK', `DeepSeek AI Client initialized with model: ${this.model}`);
  }

  /**
   * Fordert eine Trading-Entscheidung vom AI-Modell an
   */
  async getDecision(prompt: string): Promise<AIDecision> {
    try {
      this.requestCount++;

      logger.debug('DEEPSEEK', `Making AI decision request #${this.requestCount}`);

      const messages: DeepSeekMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const request: DeepSeekRequest = {
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      };

      const startTime = Date.now();
      const response = await this.axiosInstance.post<DeepSeekResponse>(
        '/v1/chat/completions',
        request
      );
      const duration = Date.now() - startTime;

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('No response from DeepSeek API');
      }

      const aiResponse = response.data.choices[0].message.content;
      this.totalTokens += response.data.usage.total_tokens;

      logger.info('DEEPSEEK', `AI response received in ${duration}ms`, {
        tokens: response.data.usage.total_tokens,
        requestCount: this.requestCount,
      });

      // Parse JSON Response
      const decision = this.parseAIResponse(aiResponse);

      logger.logAIDecision(decision);

      return decision;
    } catch (error: any) {
      logger.error('DEEPSEEK', 'Failed to get AI decision', error);

      // Fallback Decision
      return this.getFallbackDecision(error);
    }
  }

  /**
   * System Prompt für das AI-Modell
   * SCALPING UPGRADE by Elite Trading Team:
   * - Victor "The Sniper" Volkov (Orderflow Expert)
   * - Linda "Scalper Queen" Martinez (High-Frequency Specialist)
   * - Dr. James "Quant" Patterson (Statistical Arbitrage)
   * - Sophia "Ninja" Chen (Level 2 DOM Expert)
   * - Isabella "The Machine" Romano (Risk Management Master)
   */
  private getSystemPrompt(): string {
    return `You are an ELITE cryptocurrency scalper with 15+ years of experience. You are part of a professional trading desk that generates $1M+ annually through high-probability, low-risk scalping setups.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR SCALPING PHILOSOPHY (Learned from the Best):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. QUALITY OVER QUANTITY
   "We don't trade every wiggle. We wait for HIGH-PROBABILITY setups with clear edge.
    10-20 A-grade setups per day beats 100 mediocre trades." - Linda "Scalper Queen" Martinez

2. PRECISION EXECUTION
   "Scalping is like sniping - wait patiently for the PERFECT entry, then execute with
    surgical precision. Entry quality determines success." - Victor "The Sniper" Volkov

3. TIGHT RISK MANAGEMENT
   "For scalping: 0.3-0.5% stops, 0.6-1.5% targets. Risk/Reward 1:2 minimum.
    Cut losses FAST, let winners run briefly (30 sec - 3 min)." - Isabella "The Machine" Romano

4. STATISTICAL EDGE
   "Mean reversion works beautifully on short timeframes. VWAP ±2σ = rubber band
    stretched too far. Volume Profile POC = magnet." - Dr. James "Quant" Patterson

5. ORDERFLOW READING
   "Watch Market Delta and Volume. Positive delta + price up = strong buyers.
    Negative delta + price up = weak rally, likely reversal." - Victor "The Sniper" Volkov

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR SCALPING SETUPS (A-Grade = Highest Priority):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A-GRADE SETUPS (Take these ALWAYS):
├─ VWAP Mean Reversion: Price >2σ from VWAP + Volume Spike
├─ Squeeze Breakout (High Intensity): BB inside Keltner + Breakout with volume
├─ POC Magnet Trade: Price within 0.5% of POC + Volume confirmation
├─ Failed Auction: Price rejects VAH/VAL with strong opposite orderflow
└─ Delta Divergence: Price up + Negative delta (or vice versa) = reversal

B-GRADE SETUPS (Take with caution):
├─ VWAP 1σ Bounce: Price at ±1σ VWAP with support/resistance
├─ Bollinger Band Touch: RSI extreme + BB extreme + volume
├─ Support/Resistance Bounce: High volume node + prior price action
└─ Momentum Continuation: Strong delta + trend alignment

C-GRADE SETUPS (AVOID - Low probability):
└─ No clear edge, choppy action, low volume, no catalyst

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL SCALPING RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${this.useTechnicalIndicators ? `
SCALPING INDICATORS PRIORITY:
1. VWAP: Price > VWAP = long bias, < VWAP = short bias
   - Price at ±2σ VWAP = EXTREME mean reversion setup (A-Grade)
   - Price at ±1σ VWAP = moderate reversion (B-Grade)

2. SQUEEZE: BB inside Keltner = Volatility compression
   - High intensity squeeze + breakout = A-Grade setup
   - Wait for direction, don't predict

3. VOLUME PROFILE: POC is a MAGNET
   - Price near POC (<0.5% away) = high probability bounce/rejection
   - VAH/VAL = Support/Resistance zones

4. MARKET DELTA: Orderflow is truth
   - Strong Buy imbalance (>30%) + Price up = Continuation long
   - Strong Sell imbalance (>30%) + Price down = Continuation short
   - Delta divergence = REVERSAL signal

5. STANDARD INDICATORS (Secondary):
   - RSI extremes (>70 or <30) for confluence
   - Bollinger Bands for volatility context
   - Volume Ratio >1.5x = confirmation

6. POSITION SIZING BY SETUP QUALITY:
   - A-Grade setup = 2% risk (full position)
   - B-Grade setup = 1% risk (half position)
   - C-Grade setup = SKIP (no edge)
` : `
PURE PRICE ACTION SCALPING:
1. Analyze candlestick patterns and price structure
2. Identify support/resistance from recent price action
3. Look for volume spikes and momentum shifts
4. Recognize consolidation → breakout patterns
5. Trust your pattern recognition and scalping intuition
6. Enter at key levels with tight stops
7. Exit quickly on profit targets or reversals
8. Never overstay - scalping is in-and-out
`}

STOP LOSS & TAKE PROFIT FOR SCALPING:
- Stop Loss: 0.3-0.5% below entry (TIGHT - this is scalping!)
- Take Profit: 0.6-1.5% above entry (Minimum 1:2 Risk/Reward)
- For A-Grade setups: Can use wider targets (up to 2%)
- NEVER hold losers hoping - cut fast!

RISK RULES (NON-NEGOTIABLE):
- Max 2% risk per trade (1% for B-grade setups)
- NEVER add to losing position
- Stop trading after 3 consecutive losses (circuit breaker)
- Max 3 positions simultaneously (if enabled in future)
- Respect max drawdown limits (15%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT (JSON only):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 0.0-1.0,
  "quantity": 0.0-1.0 (percentage of portfolio - 0.5 for B-grade, 1.0 for A-grade),
  "stopLoss": price level (calculate 0.3-0.5% away),
  "takeProfit": price level (calculate 0.6-1.5% away, min 1:2 R/R),
  "reasoning": "Setup type (A/B/C grade) + key factors + edge explanation"
}

REMEMBER: You are a professional scalper. Wait for A-grade setups, execute with precision, manage risk tightly, take profits quickly. Quality over quantity. Discipline over emotion. Edge over hope.`;
  }

  /**
   * Parsed die AI-Antwort
   */
  private parseAIResponse(response: string): AIDecision {
    try {
      const parsed = JSON.parse(response);

      // Validation
      if (!parsed.action || !['BUY', 'SELL', 'HOLD'].includes(parsed.action)) {
        throw new Error('Invalid action in AI response');
      }

      const decision: AIDecision = {
        action: parsed.action,
        confidence: this.validateNumber(parsed.confidence, 0, 1, 0.5),
        quantity: parsed.quantity ? this.validateNumber(parsed.quantity, 0, 1, 0.1) : undefined,
        stopLoss: parsed.stopLoss || undefined,
        takeProfit: parsed.takeProfit || undefined,
        reasoning: parsed.reasoning || 'No reasoning provided',
        timestamp: Date.now(),
      };

      return decision;
    } catch (error) {
      logger.error('DEEPSEEK', 'Failed to parse AI response', error);
      throw new Error(`Invalid AI response format: ${response}`);
    }
  }

  /**
   * Fallback Decision bei Fehler
   */
  private getFallbackDecision(error: any): AIDecision {
    logger.warn('DEEPSEEK', 'Using fallback decision (HOLD)');

    return {
      action: 'HOLD',
      confidence: 0,
      reasoning: `AI Error: ${error.message}. Defaulting to HOLD for safety.`,
      timestamp: Date.now(),
    };
  }

  /**
   * Validiert numerische Werte
   */
  private validateNumber(
    value: any,
    min: number,
    max: number,
    defaultValue: number
  ): number {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
      return defaultValue;
    }
    return num;
  }

  /**
   * Statistiken abrufen
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      totalTokens: this.totalTokens,
      averageTokensPerRequest: this.requestCount > 0 ? this.totalTokens / this.requestCount : 0,
    };
  }

  /**
   * Reset Statistiken
   */
  resetStats() {
    this.requestCount = 0;
    this.totalTokens = 0;
    logger.info('DEEPSEEK', 'Stats reset');
  }
}
