/**
 * BISC 1254: Biostatistics & Research Methods
 * Global Controller & Utility Hub
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAnswerToggles();
});

/**
 * Highlights active page in universal navigation bar
 */
function initNavigation() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.navigation a');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Sets up click event listeners for hidden quiz/challenge answers
 */
function initAnswerToggles() {
    const toggleButtons = document.querySelectorAll('[data-toggle="answer"]');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.classList.toggle('show-answer');
                const isShown = targetElement.classList.contains('show-answer');
                button.textContent = isShown ? 'Hide Solution' : 'Show Solution';
            }
        });
    });
}

/**
 * Global Dataset Loader Utility
 * @param {string} datasetName - Filename without extension (e.g., 'hen-eggs')
 * @returns {Promise<Array|Object>} JSON Data
 */
async function loadDataset(datasetName) {
    try {
        const response = await fetch(`../js/data/${datasetName}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading dataset '${datasetName}':`, error);
        return null;
    }
}

/**
 * Core Statistical Math Utilities
 */
const BiostatsMath = {
    /**
     * Calculates Arithmetic Mean
     * @param {number[]} arr 
     */
    mean(arr) {
        if (!arr.length) return 0;
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    },

    /**
     * Calculates Sample Variance (s²) with Bessel's correction (n - 1)
     * @param {number[]} arr 
     */
    variance(arr) {
        if (arr.length <= 1) return 0;
        const avg = this.mean(arr);
        const sqDiffs = arr.map(val => Math.pow(val - avg, 2));
        return sqDiffs.reduce((sum, val) => sum + val, 0) / (arr.length - 1);
    },

    /**
     * Calculates Sample Standard Deviation (s)
     * @param {number[]} arr 
     */
    stdDev(arr) {
        return Math.sqrt(this.variance(arr));
    },

    /**
     * Calculates Coefficient of Variation (CV %)
     * @param {number[]} arr 
     */
    coefficientOfVariation(arr) {
        const avg = this.mean(arr);
        if (avg === 0) return 0;
        return (this.stdDev(arr) / avg) * 100;
    },

    /**
     * Calculates Median
     * @param {number[]} arr 
     */
    median(arr) {
        if (!arr.length) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
    },

    /**
     * Rounds standard floating values for clean UI rendering
     * @param {number} val 
     * @param {number} decimals 
     */
    formatNumber(val, decimals = 3) {
        if (isNaN(val) || val === null) return 'N/A';
        return Number(val).toFixed(decimals);
    }
};

// Expose utilities globally
window.loadDataset = loadDataset;
window.BiostatsMath = BiostatsMath;