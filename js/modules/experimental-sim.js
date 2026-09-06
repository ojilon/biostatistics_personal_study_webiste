/**
 * BISC 1254: Experimental Design Field Trial Interactive Simulation
 * File: js/modules/experimental-sim.js
 * Visualizes treatment randomization across experimental plots for CRD and RCBD,
 * incorporating underlying spatial soil gradients.
 */

class ExperimentalDesignSimulation {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.designType = options.designType || 'RCBD'; // 'CRD' or 'RCBD'
    this.treatments = options.treatments || ['T1 (Control)', 'T2 (NPK Low)', 'T3 (NPK High)'];
    this.replicates = options.replicates || 4; // Number of blocks or replicates per treatment
    this.rows = options.rows || 4; // Grid rows
    this.cols = options.cols || 3; // Grid columns

    // Field gradient vector: moisture/fertility slope from top to bottom (0.0 to 1.0)
    this.gridPlots = [];

    this.init();
  }

  init() {
    this.setupCanvas();
    this.generatePlotLayout();
    this.bindControls();
    this.render();
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

  // Fisher-Yates array shuffling helper
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  generatePlotLayout() {
    this.gridPlots = [];
    const totalPlots = this.rows * this.cols;
    const k = this.treatments.length;

    if (this.designType === 'CRD') {
      // CRD: Pool all treatment replications and assign completely at random
      let pool = [];
      const repsPerTrt = Math.floor(totalPlots / k);
      this.treatments.forEach(trt => {
        for (let r = 0; r < repsPerTrt; r++) pool.push(trt);
      });
      // Fill remaining if any
      while (pool.length < totalPlots) {
        pool.push(this.treatments[pool.length % k]);
      }
      pool = this.shuffle(pool);

      let index = 0;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          // Environmental fertility gradient increases along row axis
          const fertilityGradient = (r / Math.max(1, this.rows - 1));
          this.gridPlots.push({
            id: `Plot-${r + 1}${c + 1}`,
            row: r,
            col: c,
            block: null,
            treatment: pool[index++],
            fertility: parseFloat((0.5 + fertilityGradient * 0.5).toFixed(2))
          });
        }
      }
    } else {
      // RCBD: Blocks arranged along rows (perpendicular to gradient)
      // Each row forms a homogeneous block containing all treatments once
      for (let r = 0; r < this.rows; r++) {
        const trtShuffled = this.shuffle(this.treatments);
        const fertilityGradient = (r / Math.max(1, this.rows - 1));

        for (let c = 0; c < this.cols; c++) {
          const trt = trtShuffled[c % k];
          this.gridPlots.push({
            id: `Plot-B${r + 1}-P${c + 1}`,
            row: r,
            col: c,
            block: `Block ${r + 1}`,
            treatment: trt,
            fertility: parseFloat((0.5 + fertilityGradient * 0.5).toFixed(2))
          });
        }
      }
    }
  }

  bindControls() {
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.render();
    });

    const designSelect = document.getElementById('exp-design-select');
    const randomizeBtn = document.getElementById('exp-randomize-btn');

    if (designSelect) {
      designSelect.addEventListener('change', (e) => {
        this.designType = e.target.value;
        this.generatePlotLayout();
        this.render();
      });
    }

    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', () => {
        this.generatePlotLayout();
        this.render();
      });
    }
  }

  // Treatment color mappings
  getTreatmentColor(trt) {
    if (trt.includes('T1') || trt.includes('Control')) return 'rgba(225, 29, 72, 0.7)';  // Red
    if (trt.includes('T2') || trt.includes('Low')) return 'rgba(2, 132, 199, 0.7)';     // Blue
    return 'rgba(15, 118, 110, 0.7)';                                                  // Teal
  }

  render() {
    const { ctx, width, height, rows, cols } = this;
    const padding = 30;
    const gridW = width - padding * 2;
    const gridH = height - padding * 2;

    const cellW = gridW / cols;
    const cellH = gridH / rows;

    ctx.clearRect(0, 0, width, height);

    // Render Plots
    this.gridPlots.forEach(plot => {
      const x = padding + plot.col * cellW;
      const y = padding + plot.row * cellH;

      // Base plot fill reflecting fertility gradient background
      const gradientAlpha = 0.1 + plot.fertility * 0.15;
      ctx.fillStyle = `rgba(180, 83, 9, ${gradientAlpha})`;
      ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);

      // Treatment border & header color band
      ctx.fillStyle = this.getTreatmentColor(plot.treatment);
      ctx.fillRect(x + 4, y + 4, cellW - 8, 8);

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 4, y + 4, cellW - 8, cellH - 8);

      // Plot Labels
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';

      if (plot.block) {
        ctx.fillText(plot.block, x + cellW / 2, y + 24);
      }

      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(plot.treatment, x + cellW / 2, y + cellH / 2 + 4);

      ctx.font = '10px system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Fertility: ${plot.fertility}`, x + cellW / 2, y + cellH - 12);
    });

    this.updateDOMOutputs();
  }

  updateDOMOutputs() {
    const designEl = document.getElementById('exp-design-val');
    const plotsEl = document.getElementById('exp-plots-val');

    if (designEl) designEl.textContent = this.designType === 'CRD' ? 'Completely Randomized (CRD)' : 'Randomized Complete Block (RCBD)';
    if (plotsEl) plotsEl.textContent = this.gridPlots.length;
  }
}

window.ExperimentalDesignSimulation = ExperimentalDesignSimulation;