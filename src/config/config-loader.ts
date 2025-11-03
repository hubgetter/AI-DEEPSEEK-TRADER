/**
 * Configuration Loader
 * Developer: Yuki Tanaka
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { TradingConfig } from '../types';
import { logger } from '../utils/logger';

// Lade .env Datei mit explizitem Pfad und override
const envPath = path.resolve(process.cwd(), '.env');
console.log(`\n🔍 Loading .env from: ${envPath}\n`);
dotenv.config({ path: envPath, override: true });

export class ConfigLoader {
  /**
   * Lädt Trading-Konfiguration aus .env
   */
  static loadConfig(): TradingConfig {
    // DEBUG: Log raw environment variables
    console.log('\n🔍 DEBUG: Raw Environment Variables from .env:');
    console.log('MAKER_FEE:', process.env.MAKER_FEE);
    console.log('TAKER_FEE:', process.env.TAKER_FEE);
    console.log('SLIPPAGE:', process.env.SLIPPAGE);
    console.log('USE_TECHNICAL_INDICATORS:', process.env.USE_TECHNICAL_INDICATORS);
    console.log('BACKTEST_START_DATE:', process.env.BACKTEST_START_DATE);
    console.log('BACKTEST_END_DATE:', process.env.BACKTEST_END_DATE);
    console.log('');

    // Validiere erforderliche Umgebungsvariablen
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY is required in .env file');
    }

    const config: TradingConfig = {
      // Trading Pair & Timeframe
      pair: process.env.TRADING_PAIR || 'BTC/USD',
      timeframe: process.env.TIMEFRAME || '5m',
      initialCapital: parseFloat(process.env.INITIAL_CAPITAL || '10000'),

      // DeepSeek Config
      deepseekApiKey,
      deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',

      // AI Config
      useTechnicalIndicators: process.env.USE_TECHNICAL_INDICATORS !== 'false',

      // Kraken Config (optional für Backtesting)
      krakenApiKey: process.env.KRAKEN_API_KEY,
      krakenApiSecret: process.env.KRAKEN_API_SECRET,

      // Backtesting Config
      backtestStartDate: process.env.BACKTEST_START_DATE
        ? new Date(process.env.BACKTEST_START_DATE)
        : undefined,
      backtestEndDate: process.env.BACKTEST_END_DATE
        ? new Date(process.env.BACKTEST_END_DATE)
        : undefined,

      // Fees (Kraken Standard)
      makerFee: parseFloat(process.env.MAKER_FEE || '0.0016'), // 0.16%
      takerFee: parseFloat(process.env.TAKER_FEE || '0.0026'), // 0.26%
      slippage: parseFloat(process.env.SLIPPAGE || '0.0005'), // 0.05%

      // Risk Parameters
      riskParameters: {
        maxRiskPerTrade: parseFloat(process.env.RISK_PER_TRADE || '0.02'), // 2%
        maxDrawdown: parseFloat(process.env.MAX_DRAWDOWN || '0.15'), // 15%
        dailyLossLimit: parseFloat(process.env.DAILY_LOSS_LIMIT || '0.05'), // 5%
        maxConsecutiveLosses: parseInt(process.env.MAX_CONSECUTIVE_LOSSES || '3'),
        minSharpeRatio: parseFloat(process.env.MIN_SHARPE_RATIO || '2.0'),
        stopLossPercentage: parseFloat(process.env.STOP_LOSS_PERCENTAGE || '0.02'), // 2%
        takeProfitPercentage: parseFloat(process.env.TAKE_PROFIT_PERCENTAGE || '0.03'), // 3%
        maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || '0.25'), // 25%
        circuitBreakerRecoveryMinutes: parseInt(process.env.CIRCUIT_BREAKER_RECOVERY_MINUTES || '0'),
      },
    };

    logger.info('CONFIG', 'Configuration loaded', {
      pair: config.pair,
      timeframe: config.timeframe,
      initialCapital: config.initialCapital,
    });

    return config;
  }

  /**
   * Validiert Konfiguration
   */
  static validateConfig(config: TradingConfig): void {
    const errors: string[] = [];

    if (config.initialCapital <= 0) {
      errors.push('Initial capital must be greater than 0');
    }

    if (config.riskParameters.maxRiskPerTrade <= 0 || config.riskParameters.maxRiskPerTrade > 1) {
      errors.push('Risk per trade must be between 0 and 1');
    }

    if (config.backtestStartDate && config.backtestEndDate) {
      if (config.backtestStartDate >= config.backtestEndDate) {
        errors.push('Backtest start date must be before end date');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    logger.info('CONFIG', 'Configuration validated successfully');
  }

  /**
   * Zeigt Konfiguration an
   */
  static printConfig(config: TradingConfig): void {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                  TRADING CONFIGURATION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Trading Pair:       ${config.pair}`);
    console.log(`Timeframe:          ${config.timeframe}`);
    console.log(`Initial Capital:    $${config.initialCapital.toFixed(2)}`);
    console.log(`DeepSeek Model:     ${config.deepseekModel}`);
    console.log(`Technical Indicators: ${config.useTechnicalIndicators ? 'Enabled' : 'Disabled (Pure AI)'}`);
    console.log('\nRisk Parameters:');
    console.log(`  Max Risk/Trade:   ${(config.riskParameters.maxRiskPerTrade * 100).toFixed(2)}%`);
    console.log(`  Max Drawdown:     ${(config.riskParameters.maxDrawdown * 100).toFixed(2)}%`);
    console.log(`  Daily Loss Limit: ${(config.riskParameters.dailyLossLimit * 100).toFixed(2)}%`);
    console.log(`  Max Consecutive Losses: ${config.riskParameters.maxConsecutiveLosses}`);
    console.log(`  Circuit Breaker Recovery: ${config.riskParameters.circuitBreakerRecoveryMinutes > 0 ? config.riskParameters.circuitBreakerRecoveryMinutes + ' min' : 'Disabled'}`);
    console.log(`  Stop Loss:        ${(config.riskParameters.stopLossPercentage * 100).toFixed(2)}%`);
    console.log(`  Take Profit:      ${(config.riskParameters.takeProfitPercentage * 100).toFixed(2)}%`);
    console.log('\nFees:');
    console.log(`  Maker Fee:        ${(config.makerFee * 100).toFixed(4)}%`);
    console.log(`  Taker Fee:        ${(config.takerFee * 100).toFixed(4)}%`);
    console.log(`  Slippage:         ${(config.slippage * 100).toFixed(4)}%`);

    if (config.backtestStartDate && config.backtestEndDate) {
      console.log('\nBacktesting Period:');
      console.log(`  Start: ${config.backtestStartDate.toISOString().split('T')[0]}`);
      console.log(`  End:   ${config.backtestEndDate.toISOString().split('T')[0]}`);
    }

    console.log('═══════════════════════════════════════════════════════════\n');
  }
}
