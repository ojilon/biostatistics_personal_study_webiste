/**
 * BISC 1254: Simple Linear Regression Interactive Simulation
 * File: js/modules/regression-sim.js
 * Calculates bivariate regression metrics (r, R^2, slope, intercept)
 * and handles dynamic scatter plot rendering and predictions.
 */

class RegressionSimulation {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Initial dataset: Nitrogen Level (kg/ha) vs Maize Yield (t/ha)
    this.data = options.data || [
      { x: 10, y: 2.1 },
      { x: 20, y: 2.8 },
      { x: 30, y: 3.2 },
      { x: 40, y: 3.7 },
      { x: 50, y: 4.1 },
      { x: 60, y: 4.5 },
      { x: 70, y: 4.8 },
      { x: 80, y: 5.2 }
    ];

    this.xLabel = options.xLabel || 'Nitrogen (kg/ha)';
    this.yLabel = options.yLabel || 'Yield (t/ha)';
    this.maxX = options.maxX || 100;
    this.maxY = options.maxY || 7;

    this.init();
  }

  init() {
    this.setupCanvas();
    this.bindEvents();
    this.render();
    this.updateDOMOutputs();
  }

  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  calculateStats() {
    const n = this.data.length;
    if (n === 0) return { n: 0, r: 0, r2: 0, slope: 0, intercept: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

    this.data.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
      sumYY += p.y * p.y;
    });

    const meanX = sumX / n;
    const meanY = sumY / n;

    const numSlope = n * sumXY - sumX * sumY;
    const denSlope = n * sumXX - sumX * sumX;

    const slope = denSlope !== 0 ? numSlope / denSlope : 0;
    const intercept = meanY - slope * meanX;

    const numR = n * sumXY - sumX * sumY;
    const denR = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const r = denR !== 0 ? numR / denR : 0;
    const r2 = r * r;

    return { n, meanX, meanY, slope, intercept, r, r2 };
  }

  predict(x) {
    const stats = this.calculateStats();
    return stats.intercept + stats.slope * x;
  }

  xToCanvas(x) {
    const padding = 50;
    return padding + (x / this.maxX) * (this.width - padding * 2);
  }

  yToCanvas(y) {
    const padding = 50;
    return (this.height - padding) - (y / this.maxY) * (this.height - padding * 2);
  }

  canvasToX(cx) {
    const padding = 50;
    return Math.max(0, Math.min(this.maxX, ((cx - padding) / (this.width - padding * 2)) * this.maxX));
  }

  canvasToY(cy) {
    const padding = 50;
    return Math.max(0, Math.min(this.maxY, (((this.height - padding) - cy) / (this.height - padding * 2)) * this.maxY));
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.render();
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const newX = parseFloat(this.canvasToX(cx).toFixed(1));
      const newY = parseFloat(this.canvasToY(cy).toFixed(2));

      this.data.push({ x: newX, y: newY });
      this.render();
      this.updateDOMOutputs();
    });
  }

  render() {
    const { ctx, width, height } = this;
    const padding = 50;
    const stats = this.calculateStats();

    ctx.clearRect(0, 0, width, height);

    // Render Axes
    ctx.beginPath();
    ctx.moveTo(padding, padding / 2);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding / 2, height - padding);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Render Labels
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.fillText(this.xLabel, width / 2, height - 12);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(this.yLabel, 0, 0);
    ctx.restore();

    // Render Fitted Line
    if (this.data.length > 1) {
      const x1 = 0;
      const y1 = stats.intercept;
      const x2 = this.maxX;
      const y2 = stats.intercept + stats.slope * this.maxX;

      ctx.beginPath();
      ctx.moveTo(this.xToCanvas(x1), this.yToCanvas(y1));
      ctx.lineTo(this.xToCanvas(x2), this.yToCanvas(y2));
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Render Scatter Points and Residual Lines
    this.data.forEach(p => {
      const cx = this.xToCanvas(p.x);
      const cy = this.yToCanvas(p.y);
      const predY = stats.intercept + stats.slope * p.x;
      const predCy = this.yToCanvas(predY);

      // Residual Line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, predCy);
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Data Marker
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#0f766e';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  updateDOMOutputs() {
    const stats = this.calculateStats();
    const rEl = document.getElementById('reg-r-val');
    const r2El = document.getElementById('reg-r2-val');
    const eqEl = document.getElementById('reg-eq-val');

    if (rEl) rEl.textContent = stats.r.toFixed(3);
    if (r2El) r2El.textContent = (stats.r2 * 100).toFixed(1) + '%';
    if (eqEl) eqEl.textContent = `Ŷ = ${stats.intercept.toFixed(2)} + ${stats.slope.toFixed(3)}X`;
  }

  resetData(newData) {
    this.data = newData || [];
    this.render();
    this.updateDOMOutputs();
  }
}

window.RegressionSimulation = RegressionSimulation;