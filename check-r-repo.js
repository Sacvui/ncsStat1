
const https = require('https');

const url = 'https://cran.r-universe.dev/bin/emscripten/contrib/4.4/PACKAGES';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (data.includes('Package: quadprog')) {
            console.log('SUCCESS: quadprog found in repo');
        } else {
            console.log('FAILURE: quadprog NOT found in repo');
            console.log('Repo content preview:', data.substring(0, 500));
        }
    });
}).on('error', (err) => {
    console.log('Error fetching repo:', err.message);
});
