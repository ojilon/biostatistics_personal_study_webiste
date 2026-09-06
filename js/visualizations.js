/**
 * BISC 1254: Interactive Biostatistics Visualizations Toolkit
 * Pure Vanilla JavaScript implementation using the HTML5 Canvas API.
 */

document.addEventListener('DOMContentLoaded', () => {
  BiostatVisualizations.init();
});

const BiostatVisualizations = {
  init() {
    this.initNormalCurveVisualizer();
    this.initRegressionVisualizer();
    this.initBoxPlotVisualizer();
    this.initAnovaVisualizer();
  },

  /**
   * Helper: Handle Retina/High-DPI Display Scaling for HTML5 Canvas
   */
  setupCanvas(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  },

  /**
   * 1. Standard Normal Distribution ($Z$) Curve Renderer with Tail Shading
   */
  initNormalCurveVisualizer() {
    const canvas = document.getElementById('normalCurveCanvas');
    if (!canvas) return;

    const zSlider = document.getElementById('zScoreSlider');
    const zValueDisplay = document.getElementById('zScoreValue');
    const probDisplay = document.getElementById('probValue');

    const draw = () => {
      const setup = this.setupCanvas(canvas);
      if (!setup) return;
      const { ctx, width, height } = setup;

      const zVal = zSlider ? parseFloat(zSlider.value) : 1.96;
      if (zValueDisplay) zValueDisplay.textContent = zVal.toFixed(2);

      // Normal Distribution Density Function: f(x)
      const pdf = (x) => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);

      // Cumulative Distribution Function (CDF) approximation for p-value
      const cdf = (z) => {
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.3989423 * Math.exp(-z * z / 2);
        let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return z > 0 ? 1 - prob : prob;
      };

      if (probDisplay) {
        const pTail = (1 - cdf(Math.abs(zVal))) * 2; // Two-tailed p-value
        probDisplay.textContent = pTail.toFixed(4);
      }

      ctx.clearRect(0, 0, width, height);

      const padding = 40;
      const plotWidth = width - padding * 2;
      const plotHeight = height - padding * 2;
      const baseline = height - padding;

      // Coordinate Mapping Functions
      const xToCanvas = (x) => padding + ((x + 4) / 8) * plotWidth; // x range: [-4, +4]
      const yToCanvas = (y) => baseline - (y / 0.45) * plotHeight;  // max PDF height ~0.4

      // Draw Axis Baseline
      ctx.beginPath();
      ctx.moveTo(padding, baseline);
      ctx.lineTo(width - padding, baseline);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Shaded Region (Rejection Region / Tail Area)
      ctx.fillStyle = 'rgba(225, 29, 72, 0.25)'; // Highlight red tint
      ctx.beginPath();
      let started = false;
      for (let x = -4; x <= 4; x += 0.02) {
        if (Math.abs(x) >= Math.abs(zVal)) {
          const cx = xToCanvas(x);
          const cy = yToCanvas(pdf(x));
          if (!started) {
            ctx.moveTo(cx, baseline);
            ctx.lineTo(cx, cy);
            started = true;
          } else {
            ctx.lineTo(cx, cy);
          }
        } else if (started) {
          ctx.lineTo(xToCanvas(x), baseline);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          started = false;
        }
      }
      if (started) {
        ctx.lineTo(xToCanvas(4), baseline);
        ctx.closePath();
        ctx.fill();
      }

      // Draw Normal Curve Line
      ctx.beginPath();
      for (let x = -4; x <= 4; x += 0.02) {
        const cx = xToCanvas(x);
        const cy = yToCanvas(pdf(x));
        if (x === -4) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.strokeStyle = '#0f766e';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw Vertical Line for Current Z-Score
      [-Math.abs(zVal), Math.abs(zVal)].forEach(z => {
        const cx = xToCanvas(z);
        const cy = yToCanvas(pdf(z));
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(cx, baseline);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      });
    };

    draw();
    if (zSlider) zSlider.addEventListener('input', draw);
  },

  /**
   * 2. Scatter Plot & Simple Linear Regression ($\hat{Y} = \beta_0 + \beta_1 X$)
   */
  initRegressionVisualizer() {
    const canvas = document.getElementById('regressionCanvas');
    if (!canvas) return;

    // Sample Agricultural Dataset (Nitrogen kg/ha vs Maize Yield t/ha)
    const points = [
      { x: 10, y: 2.5 }, { x: 20, y: 3.1 }, { x: 30, y: 3.4 },
      { x: 40, y: 3.8 }, { x: 50, y: 4.2 }, { x: 60, y: 4.3 },
      { x: 70, y: 4.9 }, { x: 80, y: 5.1 }, { x: 90, y: 5.6 }
    ];

    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const padding = 45;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    const baseline = height - padding;

    // Compute Linear Regression Parameters
    const n = points.length;
    const sumX = points.reduce((acc, p) => acc + p.x, 0);
    const sumY = points.reduce((acc, p) => acc + p.y, 0);
    const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0);

    const meanX = sumX / n;
    const meanY = sumY / n;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = meanY - slope * meanX;

    const xToCanvas = (x) => padding + (x / 100) * plotWidth;
    const yToCanvas = (y) => baseline - (y / 6.0) * plotHeight;

    ctx.clearRect(0, 0, width, height);

    // Draw Axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, baseline);
    ctx.lineTo(width - padding, baseline);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Fitted Regression Line
    const x1 = 0, y1 = intercept;
    const x2 = 100, y2 = intercept + slope * 100;

    ctx.beginPath();
    ctx.moveTo(xToCanvas(x1), yToCanvas(y1));
    ctx.lineTo(xToCanvas(x2), yToCanvas(y2));
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Data Scatter Points
    points.forEach(p => {
      const cx = xToCanvas(p.x);
      const cy = yToCanvas(p.y);

      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#0f766e';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  },

  /**
   * 3. Five-Number Summary Box Plot Visualizer
   */
  initBoxPlotVisualizer() {
    const canvas = document.getElementById('boxPlotCanvas');
    if (!canvas) return;

    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    // Example Dataset Summary Metrics: Min, Q1, Median, Q3, Max
    const summary = { min: 12, q1: 14, median: 16, q3: 19, max: 24 };

    const padding = 50;
    const plotWidth = width - padding * 2;
    const centerY = height / 2;

    const xToCanvas = (val) => padding + ((val - 10) / 20) * plotWidth; // Range: [10, 30]

    ctx.clearRect(0, 0, width, height);

    // Draw Whiskers (Min to Q1, Q3 to Max)
    ctx.beginPath();
    ctx.moveTo(xToCanvas(summary.min), centerY);
    ctx.lineTo(xToCanvas(summary.q1), centerY);
    ctx.moveTo(xToCanvas(summary.q3), centerY);
    ctx.lineTo(xToCanvas(summary.max), centerY);

    // Whicker End Caps
    ctx.moveTo(xToCanvas(summary.min), centerY - 15);
    ctx.lineTo(xToCanvas(summary.min), centerY + 15);
    ctx.moveTo(xToCanvas(summary.max), centerY - 15);
    ctx.lineTo(xToCanvas(summary.max), centerY + 15);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Interquartile Range Box (Q1 to Q3)
    const boxLeft = xToCanvas(summary.q1);
    const boxRight = xToCanvas(summary.q3);
    const boxWidth = boxRight - boxLeft;
    const boxHeight = 50;

    ctx.fillStyle = 'rgba(15, 118, 110, 0.2)';
    ctx.fillRect(boxLeft, centerY - boxHeight / 2, boxWidth, boxHeight);

    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxLeft, centerY - boxHeight / 2, boxWidth, boxHeight);

    // Draw Median Line inside Box
    const medianX = xToCanvas(summary.median);
    ctx.beginPath();
    ctx.moveTo(medianX, centerY - boxHeight / 2);
    ctx.lineTo(medianX, centerY + boxHeight / 2);
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 3;
    ctx.stroke();
  },

  /**
   * 4. One-Way ANOVA Variance Partitioning Stacked Bar Chart
   */
  initAnovaVisualizer() {
    const canvas = document.getElementById('anovaCanvas');
    if (!canvas) return;

    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const ssBetween = 142.8;
    const ssWithin = 38.4;
    const ssTotal = ssBetween + ssWithin;

    const betweenRatio = ssBetween / ssTotal;
    const withinRatio = ssWithin / ssTotal;

    const padding = 40;
    const barWidth = width - padding * 2;
    const barHeight = 40;
    const barY = height / 2 - barHeight / 2;

    ctx.clearRect(0, 0, width, height);

    // Render Treatment Variation Segment (SS Between)
    const betweenWidth = barWidth * betweenRatio;
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(padding, barY, betweenWidth, barHeight);

    // Render Residual Error Segment (SS Within)
    const withinWidth = barWidth * withinRatio;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(padding + betweenWidth, barY, withinWidth, barHeight);

    // Render Segment Labels
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    if (betweenWidth > 60) {
      ctx.fillText(`SS Between (${(betweenRatio * 100).toFixed(1)}%)`, padding + betweenWidth / 2, barY + 24);
    }
    if (withinWidth > 60) {
      ctx.fillText(`SS Within (${(withinRatio * 100).toFixed(1)}%)`, padding + betweenWidth + withinWidth / 2, barY + 24);
    }
  }
};