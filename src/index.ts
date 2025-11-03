/**
 * Main Entry Point
 * Startet den AI Trader (Live Trading Mode)
 */

import { ConfigLoader } from './config/config-loader';
import { logger } from './utils/logger';

async function main() {
  try {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         AI DEEPSEEK TRADER - LIVE TRADING MODE                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // 1. Lade Konfiguration
    const config = ConfigLoader.loadConfig();
    ConfigLoader.validateConfig(config);
    ConfigLoader.printConfig(config);

    // 2. TODO: Live Trading Implementation
    console.log('⚠️  Live Trading is not yet implemented.\n');
    console.log('Please run backtesting first:\n');
    console.log('  npm run backtest\n');
    console.log('After successful backtesting, live trading can be enabled.\n');

    logger.info('MAIN', 'Live trading not yet implemented');

    process.exit(0);
  } catch (error: any) {
    logger.error('MAIN', 'Fatal error', error);
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Fehlerbehandlung
process.on('unhandledRejection', (reason, promise) => {
  logger.error('SYSTEM', 'Unhandled Rejection', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('SYSTEM', 'Uncaught Exception', error);
  process.exit(1);
});

// Starte Main
main();
