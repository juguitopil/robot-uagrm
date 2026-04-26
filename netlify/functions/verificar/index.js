const { chromium } = require('playwright-core');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Use POST' };

    let browser;
    try {
        const { username, password } = JSON.parse(event.body);
        
        // Launch usando el ejecutable que descargamos en el build
        browser = await chromium.launch({ headless: true });
        
        const page = await browser.newPage();
        await page.goto('https://perfil.uagrm.edu.bo/estudiantes/default.php', { waitUntil: 'networkidle' });

        const inputs = await page.$$('input[type="text"], input[type="password"]');
        if (inputs.length >= 2) {
            await inputs[0].fill(username);
            await inputs[1].fill(password);
        }

        await page.click('#btn-login');
        await page.waitForTimeout(5000); 

        const urlFinal = page.url();
        const esValido = !urlFinal.includes('default.php');

        await browser.close();
        return { statusCode: 200, body: JSON.stringify({ valid: esValido, url: urlFinal }) };

    } catch (error) {
        if (browser) await browser.close();
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};