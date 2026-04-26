const { chromium } = require('playwright-core');
const path = require('path');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Use POST' };

    let browser;
    try {
        const { username, password } = JSON.parse(event.body);
        
        // Buscamos el ejecutable en la carpeta local que forzamos arriba
        browser = await chromium.launch({ 
            headless: true,
            // Esta ruta es donde Playwright guarda las cosas cuando PATH es 0
            executablePath: path.join(process.cwd(), '.cache', 'ms-playwright', 'chromium-1127', 'chrome-linux', 'chrome'),
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.goto('https://perfil.uagrm.edu.bo/estudiantes/default.php', { waitUntil: 'domcontentloaded' });

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
        // Si vuelve a fallar, este error nos dirá exactamente qué ruta intentó usar
        return { statusCode: 500, body: JSON.stringify({ error: error.message, path: process.cwd() }) };
    }
};