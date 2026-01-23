
async function checkRepo(version) {
    const url = `https://cran.r-universe.dev/bin/emscripten/contrib/${version}/PACKAGES`;
    console.log(`Checking ${version}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`[${version}] HTTP Error: ${res.status}`);
            return;
        }
        const text = await res.text();
        if (text.includes('Package: quadprog')) {
            console.log(`[${version}] SUCCESS: quadprog FOUND.`);
        } else {
            console.log(`[${version}] FAILURE: quadprog NOT found.`);
            // console.log(`[${version}] Preview:`, text.substring(0, 100));
        }
    } catch (e) {
        console.error(`[${version}] Network Error:`, e.message);
    }
}

(async () => {
    await checkRepo('4.3');
    await checkRepo('4.4');
    await checkRepo('4.2');
})();
