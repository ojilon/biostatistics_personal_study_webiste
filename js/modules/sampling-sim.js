/**
 * BISC 1254: Biostatistics & Research Methods
 * Sampling Techniques Simulator Module
 */

document.addEventListener('DOMContentLoaded', () => {
    initSamplingSimulator();
});

function initSamplingSimulator() {
    const methodSelect = document.getElementById('samplingMethod');
    const sampleSizeInput = document.getElementById('sampleSize');
    const runBtn = document.getElementById('runSamplingBtn');
    const gridCanvas = document.getElementById('samplingCanvas');
    const populationMeanSpan = document.getElementById('popMeanDisplay');
    const sampleMeanSpan = document.getElementById('sampleMeanDisplay');
    const samplingErrorSpan = document.getElementById('samplingErrorDisplay');

    if (!gridCanvas) return;

    const ctx = gridCanvas.getContext('2d');
    const rows = 10;
    const cols = 10;
    const totalPlots = rows * cols;

    let population = [];

    function generatePopulation() {
        population = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const baseYield = r < 5 ? 18.5 : 11.2;
                const noise = (Math.random() - 0.5) * 5;
                const yieldVal = Math.max(2.0, Math.round((baseYield + noise) * 10) / 10);
                population.push({
                    id: r * cols + c,
                    row: r,
                    col: c,
                    yield: yieldVal,
                    stratum: r < 5 ? 'North Field (High Fertility)' : 'South Field (Low Fertility)',
                    clusterId: Math.floor((r * cols + c) / 10)
                });
            }
        }
    }

    generatePopulation();

    function drawGrid(selectedIds = []) {
        const dpr = window.devicePixelRatio || 1;
        const displayW = gridCanvas.clientWidth || 480;
        const displayH = Math.round(displayW * 0.75) || 360;
        gridCanvas.width = displayW * dpr;
        gridCanvas.height = displayH * dpr;
        gridCanvas.style.width = displayW + 'px';
        gridCanvas.style.height = displayH + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const width = displayW;
        const height = displayH;
        const cellW = width / cols;
        const cellH = height / rows;

        ctx.clearRect(0, 0, width, height);

        population.forEach(plot => {
            const x = plot.col * cellW;
            const y = plot.row * cellH;
            const isSelected = selectedIds.includes(plot.id);

            if (isSelected) {
                ctx.fillStyle = '#d69e2e';
            } else if (plot.row < 5) {
                ctx.fillStyle = '#dff3e7';
            } else {
                ctx.fillStyle = '#f4f8f5';
            }

            ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
            ctx.strokeStyle = isSelected ? '#744210' : '#cfe0d4';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);

            ctx.fillStyle = isSelected ? '#ffffff' : '#17251d';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${plot.yield}`, x + cellW / 2, y + cellH / 2);
        });
    }

    function runSampling() {
        const method = methodSelect ? methodSelect.value : 'srs';
        const n = parseInt(sampleSizeInput ? sampleSizeInput.value : 10, 10) || 10;
        let selectedPlots = [];

        if (method === 'srs') {
            const shuffled = [...population].sort(() => Math.random() - 0.5);
            selectedPlots = shuffled.slice(0, n);
        } else if (method === 'stratified') {
            const north = population.filter(p => p.row < 5).sort(() => Math.random() - 0.5);
            const south = population.filter(p => p.row >= 5).sort(() => Math.random() - 0.5);
            const half = Math.floor(n / 2);
            selectedPlots = [...north.slice(0, half), ...south.slice(0, n - half)];
        } else if (method === 'systematic') {
            const k = Math.max(1, Math.floor(totalPlots / n));
            const start = Math.floor(Math.random() * k);
            for (let i = 0; i < n; i++) {
                const idx = (start + i * k) % totalPlots;
                selectedPlots.push(population[idx]);
            }
        } else if (method === 'cluster') {
            const totalClusters = 10;
            const clustersToPick = Math.max(1, Math.round(n / 10));
            const shuffledClusters = [...Array(totalClusters).keys()].sort(() => Math.random() - 0.5);
            const chosenClusters = shuffledClusters.slice(0, clustersToPick);
            selectedPlots = population.filter(p => chosenClusters.includes(p.clusterId));
        }

        const selectedIds = selectedPlots.map(p => p.id);
        drawGrid(selectedIds);

        const popYields = population.map(p => p.yield);
        const sampleYields = selectedPlots.map(p => p.yield);

        const popMean = window.BiostatsMath ? window.BiostatsMath.mean(popYields) : 0;
        const sampleMean = window.BiostatsMath ? window.BiostatsMath.mean(sampleYields) : 0;
        const error = Math.abs(sampleMean - popMean);

        if (populationMeanSpan) populationMeanSpan.textContent = `${window.BiostatsMath.formatNumber(popMean, 2)} kg`;
        if (sampleMeanSpan) sampleMeanSpan.textContent = `${window.BiostatsMath.formatNumber(sampleMean, 2)} kg`;
        if (samplingErrorSpan) samplingErrorSpan.textContent = `${window.BiostatsMath.formatNumber(error, 2)} kg`;
    }

    drawGrid();

    if (runBtn) {
        runBtn.addEventListener('click', runSampling);
    }

    window.addEventListener('resize', () => drawGrid());
}
