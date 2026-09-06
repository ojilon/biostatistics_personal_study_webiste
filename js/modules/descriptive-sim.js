/**
 * BISC 1254: Biostatistics & Research Methods
 * Descriptive Statistics & Frequency Distribution Simulator Module
 */

document.addEventListener('DOMContentLoaded', () => {
    initDescriptiveSim();
});

async function initDescriptiveSim() {
    const datasetSelect = document.getElementById('descDatasetSelect');
    const binSlider = document.getElementById('binSlider');
    const binValDisplay = document.getElementById('binValDisplay');
    const canvas = document.getElementById('histogramCanvas');
    const freqTableBody = document.getElementById('freqTableBody');

    const meanElem = document.getElementById('descMean');
    const medianElem = document.getElementById('descMedian');
    const modeElem = document.getElementById('descMode');
    const stdDevElem = document.getElementById('descStdDev');
    const varianceElem = document.getElementById('descVariance');
    const cvElem = document.getElementById('descCV');

    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Default Wakiso egg weight sample data (grams)
    let currentData = [
        58.4, 62.1, 55.8, 60.3, 64.2, 57.9, 59.1, 61.5, 63.0, 56.7,
        65.4, 58.9, 61.2, 59.8, 54.6, 62.8, 60.5, 63.7, 57.2, 61.0,
        66.1, 59.5, 58.1, 62.4, 60.9, 56.2, 64.8, 61.7, 59.3, 63.2,
        57.6, 60.1, 62.5, 65.0, 58.3, 61.9, 59.7, 56.9, 63.5, 60.8,
        62.0, 57.8, 64.1, 61.3, 59.0, 55.4, 63.8, 60.4, 62.2, 58.7
    ];

    if (datasetSelect) {
        datasetSelect.addEventListener('change', async (e) => {
            const choice = e.target.value;
            if (window.loadDataset) {
                const loaded = await window.loadDataset(choice);
                if (loaded && loaded.rawEggWeights) {
                    currentData = loaded.rawEggWeights;
                } else if (loaded && loaded.rawMilkYields) {
                    currentData = loaded.rawMilkYields;
                } else if (loaded && loaded.data) {
                    currentData = loaded.data;
                }
            }
            updateAll();
        });
    }

    if (binSlider) {
        binSlider.addEventListener('input', (e) => {
            if (binValDisplay) binValDisplay.textContent = e.target.value;
            updateAll();
        });
    }

    function calculateMode(arr) {
        const freq = {};
        let maxFreq = 0;
        let modes = [];
        arr.forEach(val => {
            const rounded = Math.round(val * 10) / 10;
            freq[rounded] = (freq[rounded] || 0) + 1;
            if (freq[rounded] > maxFreq) maxFreq = freq[rounded];
        });
        for (const k in freq) {
            if (freq[k] === maxFreq && maxFreq > 1) modes.push(Number(k));
        }
        return modes.length ? modes.join(', ') : 'No Mode';
    }

    function updateAll() {
        if (!currentData || !currentData.length) return;

        const math = window.BiostatsMath || {
            mean: arr => arr.reduce((a, b) => a + b, 0) / arr.length,
            median: arr => {
                const s = [...arr].sort((a, b) => a - b);
                const m = Math.floor(s.length / 2);
                return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2;
            },
            stdDev: arr => {
                const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
                const v = arr.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (arr.length - 1);
                return Math.sqrt(v);
            },
            variance: arr => {
                const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
                return arr.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (arr.length - 1);
            },
            coefficientOfVariation: arr => {
                const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
                const sd = Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (arr.length - 1));
                return (sd / avg) * 100;
            },
            formatNumber: (val, d = 2) => Number(val).toFixed(d)
        };

        const mean = math.mean(currentData);
        const median = math.median(currentData);
        const stdDev = math.stdDev(currentData);
        const variance = math.variance(currentData);
        const cv = math.coefficientOfVariation(currentData);
        const mode = calculateMode(currentData);

        if (meanElem) meanElem.textContent = math.formatNumber(mean, 2);
        if (medianElem) medianElem.textContent = math.formatNumber(median, 2);
        if (modeElem) modeElem.textContent = mode;
        if (stdDevElem) stdDevElem.textContent = math.formatNumber(stdDev, 2);
        if (varianceElem) varianceElem.textContent = math.formatNumber(variance, 2);
        if (cvElem) cvElem.textContent = `${math.formatNumber(cv, 1)}%`;

        const numBins = binSlider ? parseInt(binSlider.value, 10) : 6;
        const minVal = Math.floor(Math.min(...currentData));
        const maxVal = Math.ceil(Math.max(...currentData));
        const binWidth = (maxVal - minVal) / numBins;

        const bins = Array.from({ length: numBins }, (_, i) => {
            const lower = minVal + i * binWidth;
            const upper = lower + binWidth;
            return {
                index: i + 1,
                lower,
                upper,
                midpoint: (lower + upper) / 2,
                count: 0,
                cumCount: 0,
                relFreq: 0
            };
        });

        currentData.forEach(val => {
            let binIndex = Math.floor((val - minVal) / binWidth);
            if (binIndex >= numBins) binIndex = numBins - 1;
            bins[binIndex].count++;
        });

        let cumSum = 0;
        bins.forEach(b => {
            cumSum += b.count;
            b.cumCount = cumSum;
            b.relFreq = (b.count / currentData.length) * 100;
        });

        if (freqTableBody) {
            freqTableBody.innerHTML = bins.map(b => `
                <tr>
                    <td>${math.formatNumber(b.lower, 1)} – ${math.formatNumber(b.upper, 1)}</td>
                    <td>${math.formatNumber(b.midpoint, 1)}</td>
                    <td><strong>${b.count}</strong></td>
                    <td>${math.formatNumber(b.relFreq, 1)}%</td>
                    <td>${b.cumCount}</td>
                </tr>
            `).join('');
        }

        drawHistogram(bins, mean);
    }

    function drawHistogram(bins, mean) {
        const w = canvas.width;
        const h = canvas.height;
        const pad = 40;

        ctx.clearRect(0, 0, w, h);

        const maxCount = Math.max(...bins.map(b => b.count), 1);
        const plotW = w - 2 * pad;
        const plotH = h - 2 * pad;
        const barW = plotW / bins.length;

        ctx.strokeStyle = '#cfe0d4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pad, pad);
        ctx.lineTo(pad, h - pad);
        ctx.lineTo(w - pad, h - pad);
        ctx.stroke();

        bins.forEach((b, i) => {
            const barH = (b.count / maxCount) * plotH;
            const x = pad + i * barW;
            const y = h - pad - barH;

            ctx.fillStyle = '#157347';
            ctx.fillRect(x + 2, y, barW - 4, barH);

            ctx.strokeStyle = '#0c4b33';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y, barW - 4, barH);

            if (b.count > 0) {
                ctx.fillStyle = '#17251d';
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(b.count, x + barW / 2, y - 5);
            }

            ctx.fillStyle = '#5d6f63';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(b.midpoint.toFixed(1), x + barW / 2, h - pad + 15);
        });

        const overallMin = bins[0].lower;
        const overallMax = bins[bins.length - 1].upper;
        const meanX = pad + ((mean - overallMin) / (overallMax - overallMin)) * plotW;

        if (meanX >= pad && meanX <= w - pad) {
            ctx.strokeStyle = '#d69e2e';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(meanX, pad);
            ctx.lineTo(meanX, h - pad);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#744210';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Mean (${mean.toFixed(1)})`, meanX, pad - 8);
        }
    }

    updateAll();
}