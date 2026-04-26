const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };

    let browser = null;
    try {
        const { username, password } = JSON.parse(event.body);

        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.goto('https://perfil.uagrm.edu.bo/estudiantes/default.php', { 
            waitUntil: 'networkidle2' 
        });

        const inputs = await page.$$('input[type="text"], input[type="password"]');
        if (inputs.length >= 2) {
            await inputs[0].fill(username);
            await inputs[1].fill(password);
            await page.click('#btn-login');
        }

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