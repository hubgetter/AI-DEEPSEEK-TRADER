/**
 * Live Performance Dashboard Server
 * Real-time visualization of trading performance
 * Developer: Lead Developer Julia Kowalski
 */

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as path from 'path';
import { PerformanceStats, ClosedTrade } from '../types';
import { logger } from '../utils/logger';

export interface DashboardData {
  stats: PerformanceStats;
  trades: ClosedTrade[];
  initialCapital: number;
  currentPrice?: number;
  timestamp: number;
}

export class DashboardServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private port: number;
  private clients: Set<WebSocket> = new Set();
  private latestData: DashboardData | null = null;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    // Serve static files
    this.app.use('/static', express.static(path.join(__dirname, '../../public')));

    // Main dashboard page
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });

    // API endpoint for latest data
    this.app.get('/api/data', (req, res) => {
      res.json(this.latestData || {});
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', clients: this.clients.size });
    });
  }

  /**
   * Setup WebSocket server
   */
  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('DASHBOARD', 'New client connected');
      this.clients.add(ws);

      // Send latest data immediately
      if (this.latestData) {
        ws.send(JSON.stringify({ type: 'update', data: this.latestData }));
      }

      ws.on('close', () => {
        logger.info('DASHBOARD', 'Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('DASHBOARD', 'WebSocket error', error);
        this.clients.delete(ws);
      });
    });
  }

  /**
   * Broadcast update to all connected clients
   */
  public broadcastUpdate(data: DashboardData): void {
    this.latestData = data;

    const message = JSON.stringify({ type: 'update', data });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    logger.info('DASHBOARD', `Broadcasted update to ${this.clients.size} clients`);
  }

  /**
   * Start the server
   */
  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        logger.info('DASHBOARD', `Dashboard server running on http://localhost:${this.port}`);
        console.log(`\n📊 Dashboard server started: http://localhost:${this.port}\n`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.clients.forEach((client) => client.close());
      this.wss.close(() => {
        this.server.close(() => {
          logger.info('DASHBOARD', 'Dashboard server stopped');
          resolve();
        });
      });
    });
  }

  /**
   * Get dashboard HTML
   */
  private getDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI DeepSeek Trader - Live Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 20px;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      border-radius: 20px;
      margin-bottom: 30px;
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
    }

    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .status-indicator {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse 2s infinite;
    }

    .status-indicator.disconnected {
      background: #f87171;
      animation: none;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .subtitle {
      opacity: 0.9;
      font-size: 1.1em;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: #1e293b;
      border: 2px solid #334155;
      padding: 25px;
      border-radius: 15px;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      border-color: #667eea;
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
    }

    .stat-label {
      font-size: 0.9em;
      color: #94a3b8;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stat-value {
      font-size: 2.2em;
      font-weight: bold;
      color: #e2e8f0;
    }

    .stat-value.positive {
      color: #4ade80;
    }

    .stat-value.negative {
      color: #f87171;
    }

    .stat-subtext {
      font-size: 0.85em;
      color: #64748b;
      margin-top: 8px;
    }

    .charts-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
    }

    .chart-card {
      background: #1e293b;
      border: 2px solid #334155;
      padding: 25px;
      border-radius: 15px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .chart-title {
      font-size: 1.4em;
      color: #667eea;
      font-weight: 600;
    }

    .last-update {
      font-size: 0.85em;
      color: #64748b;
    }

    .trades-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    .trades-table th {
      background: #334155;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #475569;
    }

    .trades-table td {
      padding: 12px;
      border-bottom: 1px solid #334155;
    }

    .trades-table tr:hover {
      background: #334155;
    }

    .trade-win {
      color: #4ade80;
    }

    .trade-loss {
      color: #f87171;
    }

    .loading {
      text-align: center;
      padding: 60px;
      font-size: 1.2em;
      color: #64748b;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 30px;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>
      <span id="statusIndicator" class="status-indicator"></span>
      AI DeepSeek Trader - Live Dashboard
    </h1>
    <p class="subtitle">Real-time Performance Monitoring | <span id="lastUpdate">Connecting...</span></p>
  </div>

  <div id="loadingMessage" class="loading">
    Connecting to server...
  </div>

  <div id="dashboard" style="display: none;">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total P&L</div>
        <div class="stat-value" id="totalPnL">$0.00</div>
        <div class="stat-subtext" id="totalPnLPct">0.00%</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Current Equity</div>
        <div class="stat-value" id="currentEquity">$0.00</div>
        <div class="stat-subtext" id="currentPrice">Price: $0.00</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Win Rate</div>
        <div class="stat-value" id="winRate">0.0%</div>
        <div class="stat-subtext" id="winLoss">0W / 0L</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Profit Factor</div>
        <div class="stat-value" id="profitFactor">0.00</div>
        <div class="stat-subtext">Risk/Reward: <span id="riskReward">0.00</span></div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Sharpe Ratio</div>
        <div class="stat-value" id="sharpeRatio">0.00</div>
        <div class="stat-subtext">Risk-adjusted Return</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Max Drawdown</div>
        <div class="stat-value negative" id="maxDrawdown">0.00%</div>
        <div class="stat-subtext">Current: <span id="currentDrawdown">0.00%</span></div>
      </div>
    </div>

    <div class="charts-container">
      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">Equity Curve</h3>
          <span class="last-update">Last update: <span id="equityUpdate">Never</span></span>
        </div>
        <canvas id="equityChart"></canvas>
      </div>

      <div class="grid-2">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">P&L Distribution</h3>
          </div>
          <canvas id="pnlChart"></canvas>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Drawdown Curve</h3>
          </div>
          <canvas id="drawdownChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">Recent Trades</h3>
        </div>
        <table class="trades-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Pair</th>
              <th>Action</th>
              <th>Price</th>
              <th>P&L</th>
              <th>P&L %</th>
            </tr>
          </thead>
          <tbody id="tradesTableBody">
            <tr><td colspan="6" style="text-align: center; color: #64748b;">No trades yet</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    let ws;
    let charts = {};

    // Connect to WebSocket
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(\`\${protocol}//\${window.location.host}\`);

      ws.onopen = () => {
        console.log('Connected to dashboard server');
        document.getElementById('statusIndicator').classList.remove('disconnected');
        document.getElementById('lastUpdate').textContent = 'Connected';
      };

      ws.onclose = () => {
        console.log('Disconnected from server');
        document.getElementById('statusIndicator').classList.add('disconnected');
        document.getElementById('lastUpdate').textContent = 'Disconnected - Reconnecting...';
        setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'update') {
          updateDashboard(message.data);
        }
      };
    }

    // Update dashboard with new data
    function updateDashboard(data) {
      document.getElementById('loadingMessage').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';

      const stats = data.stats;
      const trades = data.trades;

      // Update stats
      updateElement('totalPnL', formatCurrency(stats.totalPnL), stats.totalPnL >= 0);
      updateElement('totalPnLPct', \`\${stats.totalPnLPercentage.toFixed(2)}%\`);

      const currentEquity = stats.equityCurve[stats.equityCurve.length - 1]?.equity || data.initialCapital;
      updateElement('currentEquity', formatCurrency(currentEquity));
      updateElement('currentPrice', \`Price: \${formatCurrency(data.currentPrice || 0)}\`);

      updateElement('winRate', \`\${stats.winRate.toFixed(1)}%\`);
      updateElement('winLoss', \`\${stats.winningTrades}W / \${stats.losingTrades}L\`);

      updateElement('profitFactor', stats.profitFactor.toFixed(2));
      updateElement('riskReward', stats.averageRiskRewardRatio.toFixed(2));

      updateElement('sharpeRatio', stats.sharpeRatio.toFixed(2));

      updateElement('maxDrawdown', \`\${stats.maxDrawdownPercentage.toFixed(2)}%\`);
      updateElement('currentDrawdown', \`\${stats.currentDrawdown.toFixed(2)}%\`);

      // Update timestamp
      const now = new Date().toLocaleTimeString('de-DE');
      document.getElementById('lastUpdate').textContent = \`Last update: \${now}\`;
      document.getElementById('equityUpdate').textContent = now;

      // Update charts
      updateEquityChart(stats.equityCurve);
      updatePnLChart(trades);
      updateDrawdownChart(stats.equityCurve, data.initialCapital);

      // Update trades table
      updateTradesTable(trades.slice(-10).reverse());
    }

    function updateElement(id, value, positive = null) {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = value;
        if (positive !== null) {
          el.className = 'stat-value ' + (positive ? 'positive' : 'negative');
        }
      }
    }

    function formatCurrency(value) {
      const sign = value >= 0 ? '+' : '';
      return \`\${sign}$\${value.toFixed(2)}\`;
    }

    function updateEquityChart(equityCurve) {
      const ctx = document.getElementById('equityChart');

      const labels = equityCurve.map(p => new Date(p.timestamp).toLocaleString('de-DE', {
        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }));
      const data = equityCurve.map(p => p.equity);

      if (charts.equity) {
        charts.equity.data.labels = labels;
        charts.equity.data.datasets[0].data = data;
        charts.equity.update('none');
      } else {
        charts.equity = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Equity ($)',
              data,
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
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: false,
                ticks: { color: '#94a3b8', callback: (value) => '$' + value.toFixed(0) },
                grid: { color: '#334155' }
              },
              x: {
                ticks: { color: '#94a3b8', maxTicksLimit: 10 },
                grid: { color: '#334155' }
              }
            }
          }
        });
      }
    }

    function updatePnLChart(trades) {
      const ctx = document.getElementById('pnlChart');

      const buckets = [
        { label: '< -10%', min: -Infinity, max: -10 },
        { label: '-10 to -5%', min: -10, max: -5 },
        { label: '-5 to 0%', min: -5, max: 0 },
        { label: '0 to 5%', min: 0, max: 5 },
        { label: '5 to 10%', min: 5, max: 10 },
        { label: '> 10%', min: 10, max: Infinity },
      ];

      const wins = Array(buckets.length).fill(0);
      const losses = Array(buckets.length).fill(0);

      trades.forEach(trade => {
        const pnlPct = trade.pnlPercentage;
        const idx = buckets.findIndex(b => pnlPct >= b.min && pnlPct < b.max);
        if (idx !== -1) {
          if (trade.isWin) wins[idx]++;
          else losses[idx]++;
        }
      });

      if (charts.pnl) {
        charts.pnl.data.datasets[0].data = wins;
        charts.pnl.data.datasets[1].data = losses;
        charts.pnl.update('none');
      } else {
        charts.pnl = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: buckets.map(b => b.label),
            datasets: [
              { label: 'Wins', data: wins, backgroundColor: '#4ade80' },
              { label: 'Losses', data: losses, backgroundColor: '#f87171' }
            ]
          },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#94a3b8' } } },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { color: '#94a3b8', stepSize: 1 },
                grid: { color: '#334155' }
              },
              x: {
                ticks: { color: '#94a3b8' },
                grid: { color: '#334155' }
              }
            }
          }
        });
      }
    }

    function updateDrawdownChart(equityCurve, initialCapital) {
      const ctx = document.getElementById('drawdownChart');

      let peak = initialCapital;
      const labels = [];
      const data = [];

      equityCurve.forEach(point => {
        if (point.equity > peak) peak = point.equity;
        const drawdown = ((peak - point.equity) / peak) * 100;
        labels.push(new Date(point.timestamp).toLocaleString('de-DE', {
          month: 'short', day: '2-digit', hour: '2-digit'
        }));
        data.push(-drawdown);
      });

      if (charts.drawdown) {
        charts.drawdown.data.labels = labels;
        charts.drawdown.data.datasets[0].data = data;
        charts.drawdown.update('none');
      } else {
        charts.drawdown = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Drawdown (%)',
              data,
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
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                reverse: true,
                ticks: { color: '#94a3b8', callback: (value) => value + '%' },
                grid: { color: '#334155' }
              },
              x: {
                ticks: { color: '#94a3b8', maxTicksLimit: 10 },
                grid: { color: '#334155' }
              }
            }
          }
        });
      }
    }

    function updateTradesTable(recentTrades) {
      const tbody = document.getElementById('tradesTableBody');
      if (recentTrades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b;">No trades yet</td></tr>';
        return;
      }

      tbody.innerHTML = recentTrades.map(trade => \`
        <tr>
          <td>\${new Date(trade.exitTime).toLocaleString('de-DE')}</td>
          <td>\${trade.pair}</td>
          <td>\${trade.action}</td>
          <td>$\${trade.exitPrice.toFixed(2)}</td>
          <td class="\${trade.isWin ? 'trade-win' : 'trade-loss'}">\${formatCurrency(trade.pnl)}</td>
          <td class="\${trade.isWin ? 'trade-win' : 'trade-loss'}">\${trade.pnlPercentage.toFixed(2)}%</td>
        </tr>
      \`).join('');
    }

    // Initialize connection
    connect();
  </script>
</body>
</html>
    `.trim();
  }

  /**
   * Get number of connected clients
   */
  public getConnectedClients(): number {
    return this.clients.size;
  }
}
