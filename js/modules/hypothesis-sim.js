/**
 * BISC 1254: Hypothesis Testing & Power Interactive Simulation
 * File: js/modules/hypothesis-sim.js
 * Visualizes Null ($H_0$) vs. Alternative ($H_a$) distributions,
 * rejection regions ($\alpha$), Type II error ($\beta$), and statistical power.
 */

class HypothesisSimulation {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.nullMean = options.nullMean || 10.0;    // H0 mean (e.g., baseline crop yield t/ha)
    this.altMean = options.altMean || 11.5;      // Ha true mean under treatment
    this.popSd = options.popSd || 2.5;           // Population standard deviation
    this.sampleSize = options.sampleSize || 25;  // Sample size (n)
    this.alpha = options.alpha || 0.05;          // Significance level
    this.isTwoTailed = options.isTwoTailed !== false;

    this.init();
  }

  init() {
    this.setupCanvas();
    this.bindControls();
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

  // Standard Normal PDF
  pdf(x, mean, stdError) {
    const z = (x - mean) / stdError;
    return (1 / (stdError * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
  }

  // Polynomial approximation of Standard Normal CDF
  cdf(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - prob : prob;
  }

  // Inverse CDF for critical value computation
  invCdf(p) {
    // Rational approximation for lower/upper tail quantile
    if (p <= 0 || p >= 1) return 0;
    const q = p < 0.5 ? p : 1 - p;
    const t = Math.sqrt(-2 * Math.log(q));
    const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
    const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
    let z = t - ((c2 * t + c1) * t + c0) / (((d3 * t + d2) * t + d1) * t + 1);
    return p < 0.5 ? -z : z;
  }

  calculateStats() {
    const stdError = this.popSd / Math.sqrt(this.sampleSize);
    const effectSize = (this.altMean - this.nullMean) / this.popSd; // Cohen's d

    // Z-statistic under true mean vs null
    const zObserved = (this.altMean - this.nullMean) / stdError;

    // Critical Z and critical X values under H0
    const alphaTail = this.isTwoTailed ? this.alpha / 2 : this.alpha;
    const zCritUpper = this.invCdf(1 - alphaTail);
    const zCritLower = this.isTwoTailed ? this.invCdf(alphaTail) : -Infinity;

    const xCritUpper = this.nullMean + zCritUpper * stdError;
    const xCritLower = this.nullMean + zCritLower * stdError;

    // Two-tailed p-value
    const pValue = this.isTwoTailed ? (1 - this.cdf(Math.abs(zObserved))) * 2 : 1 - this.cdf(zObserved);

    // Beta (Type II error rate) & Statistical Power (1 - Beta)
    const betaUpper = this.cdf((xCritUpper - this.altMean) / stdError);
    const betaLower = this.isTwoTailed ? this.cdf((xCritLower - this.altMean) / stdError) : 0;
    const beta = Math.max(0, betaUpper - betaLower);
    const power = 1 - beta;

    return {
      stdError,
      effectSize,
      zObserved,
      zCritUpper,
      xCritUpper,
      xCritLower,
      pValue,
      beta,
      power,
      rejectNull: pValue < this.alpha
    };
  }

  bindControls() {
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.render();
    });

    const altMeanSlider = document.getElementById('hypo-altmean-slider');
    const nSlider = document.getElementById('hypo-n-slider');
    const alphaSlider = document.getElementById('hypo-alpha-slider');

    if (altMeanSlider) {
      altMeanSlider.addEventListener('input', (e) => {
        this.altMean = parseFloat(e.target.value);
        this.render();
        this.updateDOMOutputs();
      });
    }

    if (nSlider) {
      nSlider.addEventListener('input', (e) => {
        this.sampleSize = parseInt(e.target.value, 10);
        this.render();
        this.updateDOMOutputs();
      });
    }

    if (alphaSlider) {
      alphaSlider.addEventListener('input', (e) => {
        this.alpha = parseFloat(e.target.value);
        this.render();
        this.updateDOMOutputs();
      });
    }
  }

  render() {
    const { ctx, width, height, nullMean, altMean } = this;
    const stats = this.calculateStats();
    const padding = 50;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    const baseline = height - padding;

    // Determine coordinate scale centered between distributions
    const minX = Math.min(nullMean, altMean) - 4 * stats.stdError;
    const maxX = Math.max(nullMean, altMean) + 4 * stats.stdError;

    const xToCanvas = (x) => padding + ((x - minX) / (maxX - minX)) * plotWidth;
    const yToCanvas = (y) => baseline - (y / (1 / (stats.stdError * Math.sqrt(2 * Math.PI)))) * (plotHeight * 0.85);

    ctx.clearRect(0, 0, width, height);

    // Draw Baseline Axis
    ctx.beginPath();
    ctx.moveTo(padding, baseline);
    ctx.lineTo(width - padding, baseline);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 1. Draw H0 Sampling Distribution Curve (Null Hypothesis)
    ctx.beginPath();
    for (let x = minX; x <= maxX; x += (maxX - minX) / 200) {
      const cx = xToCanvas(x);
      const cy = yToCanvas(this.pdf(x, nullMean, stats.stdError));
      if (x === minX) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Draw Ha Sampling Distribution Curve (Alternative Hypothesis)
    ctx.beginPath();
    for (let x = minX; x <= maxX; x += (maxX - minX) / 200) {
      const cx = xToCanvas(x);
      const cy = yToCanvas(this.pdf(x, altMean, stats.stdError));
      if (x === minX) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Draw Critical Cutoff Threshold Line (Alpha)
    const critCx = xToCanvas(stats.xCritUpper);
    ctx.beginPath();
    ctx.setLineDash([5, 4]);
    ctx.moveTo(critCx, padding / 2);
    ctx.lineTo(critCx, baseline);
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Draw Observed Alternative Mean Line
    const altCx = xToCanvas(altMean);
    ctx.beginPath();
    ctx.arc(altCx, yToCanvas(this.pdf(altMean, altMean, stats.stdError)), 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();

    // Text Annotations
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#0f766e';
    ctx.fillText('H₀ Distribution', xToCanvas(nullMean) - 25, yToCanvas(this.pdf(nullMean, nullMean, stats.stdError)) - 10);

    ctx.fillStyle = '#0284c7';
    ctx.fillText('Hₐ Distribution', xToCanvas(altMean) - 25, yToCanvas(this.pdf(altMean, altMean, stats.stdError)) - 10);
  }

  updateDOMOutputs() {
    const stats = this.calculateStats();

    const zEl = document.getElementById('hypo-z-val');
    const pEl = document.getElementById('hypo-p-val');
    const powerEl = document.getElementById('hypo-power-val');
    const decisionEl = document.getElementById('hypo-decision-val');

    if (zEl) zEl.textContent = stats.zObserved.toFixed(2);
    if (pEl) pEl.textContent = stats.pValue < 0.001 ? '< 0.001' : stats.pValue.toFixed(4);
    if (powerEl) powerEl.textContent = (stats.power * 100).toFixed(1) + '%';

    if (decisionEl) {
      decisionEl.textContent = stats.rejectNull ? 'Reject H₀ (Statistically Significant)' : 'Fail to Reject H₀';
      decisionEl.style.color = stats.rejectNull ? '#e11d48' : '#0f766e';
    }
  }
}

window.HypothesisSimulation = HypothesisSimulation;