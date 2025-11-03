/**
 * Console Reporter - Real-time Dashboard
 * Developer: Carlos Rodriguez
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import { PerformanceStats, Trade, AIDecision, Portfolio } from '../types';

export class ConsoleReporter {
  private startTime: number = Date.now();

  /**
   * Zeigt Header für das Trading Dashboard
   */
  printHeader() {
    console.clear();
    console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║         AI DEEPSEEK TRADER - LIVE DASHBOARD                    ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════════╝\n'));
  }

  /**
   * Zeigt Portfolio-Status
   */
  printPortfolio(portfolio: Portfolio) {
    const table = new Table({
      head: [chalk.white.bold('Portfolio'), chalk.white.bold('Value')],
      colWidths: [30, 30],
      style: { head: [], border: [] },
    });

    table.push(
      ['Cash', chalk.green(`$${portfolio.cash.toFixed(2)}`)],
      ['Total Equity', chalk.cyan.bold(`$${portfolio.totalEquity.toFixed(2)}`)],
      ['Holdings', Array.from(portfolio.holdings.entries()).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None']
    );

    console.log(table.toString());
    console.log('');
  }

  /**
   * Zeigt Performance-Statistiken
   */
  printPerformance(stats: PerformanceStats) {
    const table = new Table({
      head: [chalk.white.bold('Metric'), chalk.white.bold('Value')],
      colWidths: [30, 30],
      style: { head: [], border: [] },
    });

    // Win Rate Farbe
    const winRateColor = stats.winRate >= 60 ? chalk.green : stats.winRate >= 50 ? chalk.yellow : chalk.red;

    // Sharpe Ratio Farbe
    const sharpeColor = stats.sharpeRatio >= 2 ? chalk.green : stats.sharpeRatio >= 1 ? chalk.yellow : chalk.red;

    // Drawdown Farbe
    const ddColor = stats.maxDrawdownPercentage <= 10 ? chalk.green : stats.maxDrawdownPercentage <= 20 ? chalk.yellow : chalk.red;

    table.push(
      // Grundlegende Metriken
      [chalk.bold('═══ Trading Performance ═══'), ''],
      ['Total Trades', `${stats.totalTrades}`],
      ['Win Rate', winRateColor(`${stats.winRate.toFixed(2)}%`) + ` (${stats.winningTrades}W / ${stats.losingTrades}L)`],
      ['Profit Factor', stats.profitFactor >= 1.5 ? chalk.green(stats.profitFactor.toFixed(2)) : chalk.red(stats.profitFactor.toFixed(2))],

      // P&L
      [chalk.bold('═══ Profit & Loss ═══'), ''],
      ['Total P&L', stats.totalPnL >= 0 ? chalk.green(`$${stats.totalPnL.toFixed(2)}`) : chalk.red(`$${stats.totalPnL.toFixed(2)}`)],
      ['Total P&L %', stats.totalPnLPercentage >= 0 ? chalk.green(`${stats.totalPnLPercentage.toFixed(2)}%`) : chalk.red(`${stats.totalPnLPercentage.toFixed(2)}%`)],
      ['Average Win', chalk.green(`$${stats.averageWin.toFixed(2)}`)],
      ['Average Loss', chalk.red(`$${Math.abs(stats.averageLoss).toFixed(2)}`)],
      ['Largest Win', chalk.green.bold(`$${stats.largestWin.toFixed(2)}`)],
      ['Largest Loss', chalk.red.bold(`$${Math.abs(stats.largestLoss).toFixed(2)}`)],

      // Risk Metriken
      [chalk.bold('═══ Risk Metrics ═══'), ''],
      ['Sharpe Ratio', sharpeColor(stats.sharpeRatio.toFixed(3))],
      ['Max Drawdown', ddColor(`${stats.maxDrawdownPercentage.toFixed(2)}%`) + ` ($${Math.abs(stats.maxDrawdown).toFixed(2)})`],
      ['Current Drawdown', `${stats.currentDrawdown.toFixed(2)}%`],

      // Streaks
      [chalk.bold('═══ Streaks ═══'), ''],
      ['Current Streak', this.formatStreak(stats.consecutiveWins, stats.consecutiveLosses)],
      ['Max Win Streak', chalk.green(`${stats.maxConsecutiveWins}`)],
      ['Max Loss Streak', chalk.red(`${stats.maxConsecutiveLosses}`)],

      // Weitere Metriken
      [chalk.bold('═══ Advanced ═══'), ''],
      ['Expectancy', stats.expectancy >= 0 ? chalk.green(`$${stats.expectancy.toFixed(2)}`) : chalk.red(`$${stats.expectancy.toFixed(2)}`)],
      ['Avg Holding Period', `${(stats.averageHoldingPeriod / 60000).toFixed(1)} min`],
      ['Risk/Reward Ratio', `1:${stats.averageRiskRewardRatio.toFixed(2)}`]
    );

    console.log(table.toString());
    console.log('');
  }

  /**
   * Zeigt letzte Trades
   */
  printRecentTrades(trades: Trade[], limit: number = 5) {
    if (trades.length === 0) {
      console.log(chalk.gray('No trades yet.\n'));
      return;
    }

    const table = new Table({
      head: [
        chalk.white.bold('Time'),
        chalk.white.bold('Action'),
        chalk.white.bold('Price'),
        chalk.white.bold('Quantity'),
        chalk.white.bold('Value'),
        chalk.white.bold('Fee'),
      ],
      colWidths: [12, 8, 12, 12, 12, 10],
      style: { head: [], border: [] },
    });

    const recentTrades = trades.slice(-limit).reverse();

    recentTrades.forEach((trade) => {
      const time = new Date(trade.timestamp).toLocaleTimeString();
      const actionColor = trade.action === 'BUY' ? chalk.green : chalk.red;

      table.push([
        time,
        actionColor(trade.action),
        `$${trade.price.toFixed(2)}`,
        trade.quantity.toFixed(6),
        `$${trade.value.toFixed(2)}`,
        `$${trade.fee.toFixed(2)}`,
      ]);
    });

    console.log(chalk.white.bold('═══ Recent Trades ═══'));
    console.log(table.toString());
    console.log('');
  }

  /**
   * Zeigt AI-Entscheidung
   */
  printAIDecision(decision: AIDecision) {
    let actionColor: (text: string) => string;
    let icon: string;

    switch (decision.action) {
      case 'BUY':
        actionColor = chalk.green.bold;
        icon = '📈';
        break;
      case 'SELL':
        actionColor = chalk.red.bold;
        icon = '📉';
        break;
      case 'HOLD':
        actionColor = chalk.yellow.bold;
        icon = '⏸️';
        break;
    }

    console.log(chalk.white.bold('═══ AI Decision ═══'));
    console.log(`${icon}  Action: ${actionColor(decision.action)}`);
    console.log(`💡 Confidence: ${this.getConfidenceBar(decision.confidence)}`);
    if (decision.quantity) {
      console.log(`📊 Quantity: ${(decision.quantity * 100).toFixed(1)}% of portfolio`);
    }
    if (decision.stopLoss) {
      console.log(`🛑 Stop Loss: $${decision.stopLoss.toFixed(2)}`);
    }
    if (decision.takeProfit) {
      console.log(`🎯 Take Profit: $${decision.takeProfit.toFixed(2)}`);
    }
    console.log(`🧠 Reasoning: ${chalk.italic(decision.reasoning)}`);
    console.log('');
  }

  /**
   * Zeigt Fortschrittsbalken für Backtesting
   */
  printBacktestProgress(current: number, total: number, currentDate: Date) {
    const percentage = (current / total) * 100;
    const barLength = 40;
    const filledLength = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    const elapsed = Date.now() - this.startTime;
    const estimatedTotal = (elapsed / current) * total;
    const remaining = estimatedTotal - elapsed;

    process.stdout.write('\r');
    process.stdout.write(
      `${chalk.cyan('Backtesting:')} [${bar}] ${percentage.toFixed(1)}% | ` +
      `${chalk.gray(currentDate.toISOString().split('T')[0])} | ` +
      `${chalk.gray(`ETA: ${this.formatDuration(remaining)}`)}`
    );
  }

  /**
   * Zeigt Zusammenfassung nach Backtest
   */
  printBacktestSummary(stats: PerformanceStats, duration: number) {
    console.log('\n\n');
    console.log(chalk.cyan.bold('╔════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║              BACKTEST RESULTS - SUMMARY                        ║'));
    console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════════╝\n'));

    this.printPerformance(stats);

    console.log(chalk.white.bold('═══ Backtest Info ═══'));
    console.log(`Duration: ${this.formatDuration(duration)}`);
    console.log(`Trading Period: ${stats.tradingDays} days`);
    console.log('');

    // Bewertung
    this.printEvaluation(stats);
  }

  /**
   * Bewertung der Performance
   */
  private printEvaluation(stats: PerformanceStats) {
    console.log(chalk.white.bold('═══ Performance Evaluation ═══'));

    const checks = [
      { name: 'Win Rate > 55%', passed: stats.winRate > 55, value: `${stats.winRate.toFixed(2)}%` },
      { name: 'Sharpe Ratio > 2.0', passed: stats.sharpeRatio > 2.0, value: stats.sharpeRatio.toFixed(2) },
      { name: 'Max Drawdown < 15%', passed: stats.maxDrawdownPercentage < 15, value: `${stats.maxDrawdownPercentage.toFixed(2)}%` },
      { name: 'Profit Factor > 1.5', passed: stats.profitFactor > 1.5, value: stats.profitFactor.toFixed(2) },
      { name: 'Positive P&L', passed: stats.totalPnL > 0, value: `$${stats.totalPnL.toFixed(2)}` },
    ];

    checks.forEach((check) => {
      const status = check.passed ? chalk.green('✓') : chalk.red('✗');
      console.log(`${status} ${check.name}: ${check.value}`);
    });

    const passedChecks = checks.filter((c) => c.passed).length;
    const totalChecks = checks.length;

    console.log('');
    if (passedChecks === totalChecks) {
      console.log(chalk.green.bold('🎉 EXCELLENT! Strategy is ready for live trading!'));
    } else if (passedChecks >= totalChecks * 0.6) {
      console.log(chalk.yellow.bold('⚠️  GOOD - Consider optimization before live trading'));
    } else {
      console.log(chalk.red.bold('❌ POOR - Strategy needs significant improvement'));
    }
    console.log('');
  }

  // Hilfsmethoden

  private formatStreak(wins: number, losses: number): string {
    if (wins > 0) {
      return chalk.green(`${wins} wins`);
    } else if (losses > 0) {
      return chalk.red(`${losses} losses`);
    } else {
      return chalk.gray('None');
    }
  }

  private getConfidenceBar(confidence: number): string {
    const barLength = 20;
    const filled = Math.round(barLength * confidence);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

    let color: (text: string) => string;
    if (confidence >= 0.7) color = chalk.green;
    else if (confidence >= 0.5) color = chalk.yellow;
    else color = chalk.red;

    return color(`${bar} ${(confidence * 100).toFixed(1)}%`);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Singleton Export
export const reporter = new ConsoleReporter();
