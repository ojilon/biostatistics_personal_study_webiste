/**
 * BISC 1254: Probability & Sampling Distribution Interactive Simulation
 * File: js/modules/probability-sim.js
 * Visualizes Binomial probability distributions, empirical trials,
 * and Normal approximation curves.
 */

class ProbabilitySimulation {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.n = options.n || 20;      // Number of trials (e.g., offspring count)
    this.p = options.p || 0.5;     // Success probability (e.g., gene inheritance rate)
    this.trialsCount = 0;
    this.empiricalCounts = new Array(this.n + 1).fill(0);

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

  // Factorial helper function
  factorial(k) {
    if (k <= 1) return 1;
    let res = 1;
    for (let i = 2; i <= k; i++) res *= i;
    return res;
  }

  // Combination formula nCr
  combination(n, r) {
    if (r < 0 || r > n) return 0;
    return this.factorial(n) / (this.factorial(r) * this.factorial(n - r));
  }

  // Calculate Binomial Probability Mass Function: P(X = k) = (nCr) * p^k * (1-p)^(n-k)
  getBinomialProbability(k) {
    return this.combination(this.n, k) * Math.pow(this.p, k) * Math.pow(1 - this.p, this.n - k);
  }

  // Calculate Normal PDF approximation: N(mu, sigma)
  getNormalPdf(x, mean, stdDev) {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  }

  runTrials(numToRun = 100) {
    for (let t = 0; t < numToRun; t++) {
      let successes = 0;
      for (let i = 0; i < this.n; i++) {
        if (Math.random() < this.p) successes++;
      }
      this.empiricalCounts[successes]++;
      this.trialsCount++;
    }
    this.render();
    this.updateDOMOutputs();
  }

  resetEmpiricalData() {
    this.trialsCount = 0;
    this.empiricalCounts = new Array(this.n + 1).fill(0);
    this.render();
    this.updateDOMOutputs();
  }

  bindControls() {
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.render();
    });

    const nSlider = document.getElementById('prob-n-slider');
    const pSlider = document.getElementById('prob-p-slider');
    const runBtn = document.getElementById('prob-run-btn');
    const resetBtn = document.getElementById('prob-reset-btn');

    if (nSlider) {
      nSlider.addEventListener('input', (e) => {
        this.n = parseInt(e.target.value, 10);
        this.resetEmpiricalData();
      });
    }

    if (pSlider) {
      pSlider.addEventListener('input', (e) => {
        this.p = parseFloat(e.target.value);
        this.resetEmpiricalData();
      });
    }

    if (runBtn) {
      runBtn.addEventListener('click', () => this.runTrials(100));
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetEmpiricalData());
    }
  }

  render() {
    const { ctx, width, height, n, p } = this;
    const padding = 45;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    const baseline = height - padding;

    ctx.clearRect(0, 0, width, height);

    // Theoretical Parameters
    const mean = n * p;
    const variance = n * p * (1 - p);
    const stdDev = Math.sqrt(variance);

    // Determine max probability height for scaling
    let maxP = 0;
    for (let k = 0; k <= n; k++) {
      const prob = this.getBinomialProbability(k);
      if (prob > maxP) maxP = prob;
    }
    maxP = Math.max(maxP, 0.25);

    // Draw Axes
    ctx.beginPath();
    ctx.moveTo(padding, padding / 2);
    ctx.lineTo(padding, baseline);
    ctx.lineTo(width - padding / 2, baseline);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Theoretical Probability Histogram Bars
    const barWidth = plotWidth / (n + 1);

    for (let k = 0; k <= n; k++) {
      const theoProb = this.getBinomialProbability(k);
      const barH = (theoProb / maxP) * plotHeight;
      const x = padding + k * barWidth;
      const y = baseline - barH;

      // Render Theoretical PMF Bar (Teal outline)
      ctx.fillStyle = 'rgba(15, 118, 110, 0.15)';
      ctx.fillRect(x + 2, y, barWidth - 4, barH);
      ctx.strokeStyle = '#0f766e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 2, y, barWidth - 4, barH);

      // Render Empirical Data Overlays if available
      if (this.trialsCount > 0) {
        const empProb = this.empiricalCounts[k] / this.trialsCount;
        const empH = (empProb / maxP) * plotHeight;
        const empY = baseline - empH;

        ctx.fillStyle = 'rgba(225, 29, 72, 0.5)';
        ctx.fillRect(x + barWidth * 0.25, empY, barWidth * 0.5, empH);
      }
    }

    // Draw Normal Curve Overlay
    if (n >= 10 && variance >= 2.5) {
      ctx.beginPath();
      for (let k = 0; k <= n; k += 0.1) {
        const normProb = this.getNormalPdf(k, mean, stdDev);
        const x = padding + (k + 0.5) * barWidth;
        const y = baseline - (normProb / maxP) * plotHeight;

        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  updateDOMOutputs() {
    const mean = this.n * this.p;
    const stdDev = Math.sqrt(this.n * this.p * (1 - this.p));

    const meanEl = document.getElementById('prob-mean-val');
    const sdEl = document.getElementById('prob-sd-val');
    const trialsEl = document.getElementById('prob-trials-val');

    if (meanEl) meanEl.textContent = mean.toFixed(2);
    if (sdEl) sdEl.textContent = stdDev.toFixed(2);
    if (trialsEl) trialsEl.textContent = this.trialsCount;
  }
}

window.ProbabilitySimulation = ProbabilitySimulation;