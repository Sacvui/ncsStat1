const fs = require('fs');
const path = require('path');

const headers = ['ID', 'Gender', 'Age', 'Education', 'Income', 'SAT1', 'SAT2', 'SAT3', 'SAT4', 'SAT5', 'LOY1', 'LOY2', 'LOY3', 'LOY4', 'LOY5', 'TRUST1', 'TRUST2', 'TRUST3', 'PQ1', 'PQ2', 'PQ3', 'PQ4', 'INT1', 'INT2', 'INT3'];
const rows = [];
const N = 300;

for (let i = 1; i <= N; i++) {
    const gender = Math.random() > 0.5 ? 1 : 2;
    const age = Math.floor(Math.random() * (60 - 18) + 18);
    const edu = Math.floor(Math.random() * 5) + 1;
    const income = Math.floor(Math.random() * 4) + 1;

    // Simulate correlations: SAT -> LOY
    const satBase = Math.random() * 2 + 3; // 3 to 5 mean
    const sat = Array(5).fill(0).map(() => Math.min(5, Math.max(1, Math.round(satBase + (Math.random() - 0.5)))));

    const loyBase = Math.min(5, Math.max(1, satBase * 0.7 + Math.random() * 1.5));
    const loy = Array(5).fill(0).map(() => Math.min(5, Math.max(1, Math.round(loyBase + (Math.random() - 0.5)))));

    const trust = Array(3).fill(0).map(() => Math.floor(Math.random() * 5) + 1);
    const pq = Array(4).fill(0).map(() => Math.floor(Math.random() * 5) + 1);
    const int = Array(3).fill(0).map(() => Math.floor(Math.random() * 5) + 1);

    rows.push([i, gender, age, edu, income, ...sat, ...loy, ...trust, ...pq, ...int].join(','));
}

const csv = headers.join(',') + '\n' + rows.join('\n');
fs.writeFileSync('public/sample_data_large.csv', csv);
console.log('Generated public/sample_data_large.csv');
