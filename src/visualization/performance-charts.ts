/**
 * Performance Charts Generator
 * Developer: Lead Developer Julia Kowalski
 * Creates visual performance reports for backtesting and live trading
 */

import { PerformanceStats, ClosedTrade } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export interface ChartData {
  equityCurve: {
    labels: string[];
    data: number[];
  };
  pnlDistribution: {
    labels: string[];
    wins: number[];
    losses: number[];
  };
  monthlyReturns: {
    labels: string[];
    data: number[];
  };
  drawdownCurve: {
    labels: string[];
    data: number[];
  };
  tradeAnalysis: {
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
}

export class PerformanceChartGenerator {
  /**
   * Generiert Chart-Daten aus Performance-Statistiken
   */
  static generateChartData(
    stats: PerformanceStats,
    trades: ClosedTrade[],
    initialCapital: number
  ): ChartData {
    return {
      equityCurve: this.generateEquityCurveData(stats.equityCurve),
      pnlDistribution: this.generatePnLDistribution(trades),
      monthlyReturns: this.generateMonthlyReturns(stats.equityCurve, initialCapital),
      drawdownCurve: this.generateDrawdownCurve(stats.equityCurve, initialCapital),
      tradeAnalysis: {
        winRate: stats.winRate,
        profitFactor: stats.profitFactor,
        sharpeRatio: stats.sharpeRatio,
        maxDrawdown: stats.maxDrawdownPercentage,
      },
    };
  }

  /**
   * Equity Curve Daten
   */
  private static generateEquityCurveData(
    equityCurve: { timestamp: number; equity: number }[]
  ): { labels: string[]; data: number[] } {
    const labels = equityCurve.map((point) =>
      new Date(point.timestamp).toLocaleString('de-DE', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    );

    const data = equityCurve.map((point) => point.equity);

    return { labels, data };
  }

  /**
   * P&L Verteilung (Wins vs Losses)
   */
  private static generatePnLDistribution(
    trades: ClosedTrade[]
  ): { labels: string[]; wins: number[]; losses: number[] } {
    // Gruppiere Trades in Buckets (z.B. -10%, -5%, 0%, 5%, 10%)
    const buckets = [
      { label: '< -10%', min: -Infinity, max: -10 },
      { label: '-10% to -5%', min: -10, max: -5 },
      { label: '-5% to 0%', min: -5, max: 0 },
      { label: '0% to 5%', min: 0, max: 5 },
      { label: '5% to 10%', min: 5, max: 10 },
      { label: '> 10%', min: 10, max: Infinity },
    ];

    const wins: number[] = Array(buckets.length).fill(0);
    const losses: number[] = Array(buckets.length).fill(0);

    trades.forEach((trade) => {
      const pnlPct = trade.pnlPercentage;
      const bucketIndex = buckets.findIndex(
        (b) => pnlPct >= b.min && pnlPct < b.max
      );

      if (bucketIndex !== -1) {
        if (trade.isWin) {
          wins[bucketIndex]++;
        } else {
          losses[bucketIndex]++;
        }
      }
    });

    return {
      labels: buckets.map((b) => b.label),
      wins,
      losses,
    };
  }

  /**
   * Monatliche Returns
   */
  private static generateMonthlyReturns(
    equityCurve: { timestamp: number; equity: number }[],
    initialCapital: number
  ): { labels: string[]; data: number[] } {
    if (equityCurve.length === 0) {
      return { labels: [], data: [] };
    }

    // Gruppiere nach Monaten
    const monthlyData = new Map<string, { start: number; end: number }>();

    equityCurve.forEach((point) => {
      const date = new Date(point.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { start: point.equity, end: point.equity });
      } else {
        const existing = monthlyData.get(monthKey)!;
        existing.end = point.equity;
      }
    });

    // Berechne Returns
    const labels: string[] = [];
    const data: number[] = [];

    monthlyData.forEach((value, key) => {
      const returnPct = ((value.end - value.start) / value.start) * 100;
      labels.push(key);
      data.push(returnPct);
    });

    return { labels, data };
  }

  /**
   * Drawdown Curve
   */
  private static generateDrawdownCurve(
    equityCurve: { timestamp: number; equity: number }[],
    initialCapital: number
  ): { labels: string[]; data: number[] } {
    let peak = initialCapital;
    const labels: string[] = [];
    const data: number[] = [];

    equityCurve.forEach((point) => {
      if (point.equity > peak) {
        peak = point.equity;
      }

      const drawdown = ((peak - point.equity) / peak) * 100;

      labels.push(
        new Date(point.timestamp).toLocaleString('de-DE', {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
        })
      );
      data.push(-drawdown); // Negativ für bessere Visualisierung
    });

    return { labels, data };
  }

  /**
   * Generiert HTML Report mit Charts
   */
  static generateHTMLReport(
    stats: PerformanceStats,
    trades: ClosedTrade[],
    initialCapital: number,
    title: string = 'Trading Performance Report'
  ): string {
    const chartData = this.generateChartData(stats, trades, initialCapital);

    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      color: #333;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
    }

    h1 {
      text-align: center;
      color: #667eea;
      margin-bottom: 10px;
      font-size: 2.5em;
    }

    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 40px;
      font-size: 1.1em;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
    }

    .stat-label {
      font-size: 0.9em;
      opacity: 0.9;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 2em;
      font-weight: bold;
    }

    .stat-value.positive {
      color: #4ade80;
    }

    .stat-value.negative {
      color: #f87171;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 30px;
      margin-top: 30px;
    }

    .chart-container {
      background: #f8fafc;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }

    .chart-title {
      font-size: 1.3em;
      color: #667eea;
      margin-bottom: 20px;
      font-weight: 600;
    }

    canvas {
      max-height: 300px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 ${title}</h1>
    <p class="subtitle">Generiert am ${new Date().toLocaleString('de-DE')}</p>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total P&L</div>
        <div class="stat-value ${stats.totalPnL >= 0 ? 'positive' : 'negative'}">
          ${stats.totalPnL >= 0 ? '+' : ''}$${stats.totalPnL.toFixed(2)}
        </div>
        <div class="stat-label">${stats.totalPnLPercentage.toFixed(2)}%</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Win Rate</div>
        <div class="stat-value">${stats.winRate.toFixed(1)}%</div>
        <div class="stat-label">${stats.winningTrades}W / ${stats.losingTrades}L</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Profit Factor</div>
        <div class="stat-value">${stats.profitFactor.toFixed(2)}</div>
        <div class="stat-label">Risk/Reward: ${stats.averageRiskRewardRatio.toFixed(2)}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Sharpe Ratio</div>
        <div class="stat-value">${stats.sharpeRatio.toFixed(2)}</div>
        <div class="stat-label">Risk-adjusted Return</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Max Drawdown</div>
        <div class="stat-value negative">${stats.maxDrawdownPercentage.toFixed(2)}%</div>
        <div class="stat-label">$${stats.maxDrawdown.toFixed(2)}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Total Trades</div>
        <div class="stat-value">${stats.totalTrades}</div>
        <div class="stat-label">${stats.tradingDays.toFixed(1)} Tage</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-container full-width">
        <h3 class="chart-title">Equity Curve</h3>
        <canvas id="equityChart"></canvas>
      </div>

      <div class="chart-container">
        <h3 class="chart-title">P&L Distribution</h3>
        <canvas id="pnlChart"></canvas>
      </div>

      <div class="chart-container">
        <h3 class="chart-title">Drawdown Curve</h3>
        <canvas id="drawdownChart"></canvas>
      </div>

      <div class="chart-container full-width">
        <h3 class="chart-title">Monthly Returns</h3>
        <canvas id="monthlyChart"></canvas>
      </div>
    </div>

    <div class="footer">
      <p>🤖 AI DeepSeek Trader | Powered by BMAD Method</p>
      <p>Lead Developer: Julia Kowalski | Risk Manager: Ahmed Hassan</p>
    </div>
  </div>

  <script>
    const chartData = ${JSON.stringify(chartData)};

    // Equity Curve Chart
    new Chart(document.getElementById('equityChart'), {
      type: 'line',
      data: {
        labels: chartData.equityCurve.labels,
        datasets: [{
          label: 'Equity ($)',
          data: chartData.equityCurve.data,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: false, ticks: { callback: (value) => '$' + value.toFixed(0) } }
        }
      }
    });

    // P&L Distribution Chart
    new Chart(document.getElementById('pnlChart'), {
      type: 'bar',
      data: {
        labels: chartData.pnlDistribution.labels,
        datasets: [
          {
            label: 'Wins',
            data: chartData.pnlDistribution.wins,
            backgroundColor: '#4ade80',
          },
          {
            label: 'Losses',
            data: chartData.pnlDistribution.losses,
            backgroundColor: '#f87171',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    // Drawdown Curve Chart
    new Chart(document.getElementById('drawdownChart'), {
      type: 'line',
      data: {
        labels: chartData.drawdownCurve.labels,
        datasets: [{
          label: 'Drawdown (%)',
          data: chartData.drawdownCurve.data,
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: { beginAtZero: true, reverse: true, ticks: { callback: (value) => value + '%' } }
        }
      }
    });

    // Monthly Returns Chart
    new Chart(document.getElementById('monthlyChart'), {
      type: 'bar',
      data: {
        labels: chartData.monthlyReturns.labels,
        datasets: [{
          label: 'Monthly Return (%)',
          data: chartData.monthlyReturns.data,
          backgroundColor: chartData.monthlyReturns.data.map(v => v >= 0 ? '#4ade80' : '#f87171'),
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (value) => value + '%' } }
        }
      }
    });
  </script>
</body>
</html>
    `.trim();

    return html;
  }

  /**
   * Speichert HTML Report in Datei
   */
  static async saveReport(
    stats: PerformanceStats,
    trades: ClosedTrade[],
    initialCapital: number,
    outputPath: string,
    title: string = 'Trading Performance Report'
  ): Promise<string> {
    try {
      const html = this.generateHTMLReport(stats, trades, initialCapital, title);

      // Erstelle Verzeichnis falls nicht vorhanden
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Schreibe Datei
      fs.writeFileSync(outputPath, html, 'utf-8');

      logger.info('VISUALIZATION', `Performance report saved: ${outputPath}`);

      return outputPath;
    } catch (error) {
      logger.error('VISUALIZATION', 'Failed to save performance report', error);
      throw error;
    }
  }
}
