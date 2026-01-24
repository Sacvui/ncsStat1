/**
 * Generate Test Dataset for SEM/CFA Analysis
 * - 500 rows (cases)
 * - 40 variables (8 constructs × 5 indicators)
 * - ~100 rows with data quality issues (missing, outliers)
 */

import fs from 'fs';

// Seed-based pseudo-random for reproducibility
let seed = 42;
function seededRandom() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
}

function gaussRandom(mean = 0, std = 1) {
    const u1 = seededRandom();
    const u2 = seededRandom();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
}

// 8 constructs with 5 indicators each = 40 variables
const factors = {
    'SAT': 5,   // Satisfaction
    'TRUST': 5, // Trust
    'QUAL': 5,  // Quality
    'VAL': 5,   // Value
    'LOY': 5,   // Loyalty
    'COM': 5,   // Commitment
    'IMG': 5,   // Image
    'EXP': 5,   // Expectation
};

// Generate headers
const headers = [];
for (const [factor, count] of Object.entries(factors)) {
    for (let i = 1; i <= count; i++) {
        headers.push(`${factor}${i}`);
    }
}

// Generate 500 rows
const rows = [];
for (let rowIdx = 0; rowIdx < 500; rowIdx++) {
    const row = [];
    const isBadRow = rowIdx < 100; // First 100 rows have issues

    for (const [factor, count] of Object.entries(factors)) {
        // Generate latent factor mean (3.5 center for Likert 1-5)
        const factorMean = gaussRandom(3.5, 0.8);

        for (let i = 1; i <= count; i++) {
            let value;

            if (isBadRow) {
                // Add data quality issues
                const issueType = seededRandom();
                if (issueType < 0.25) {
                    value = ''; // Missing
                } else if (issueType < 0.4) {
                    value = seededRandom() < 0.5 ? -5 : 10; // Outlier
                } else if (issueType < 0.55) {
                    value = Math.round(gaussRandom(factorMean, 2.5) * 100) / 100; // High variance
                } else {
                    // Normal but may be out of range
                    value = Math.round((factorMean + gaussRandom(0, 0.5)) * 100) / 100;
                    value = Math.max(1, Math.min(5, value));
                }
            } else {
                // Good data within 1-5 range
                value = factorMean + gaussRandom(0, 0.4);
                value = Math.max(1, Math.min(5, value));
                value = Math.round(value * 100) / 100;
            }

            row.push(value);
        }
    }
    rows.push(row);
}

// Shuffle rows
for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
}

// Write CSV
const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
].join('\n');

fs.writeFileSync('public/test_data_sem_cfa.csv', csvContent);
console.log(`Generated 500 rows × 40 columns`);
console.log(`Saved to: public/test_data_sem_cfa.csv`);
