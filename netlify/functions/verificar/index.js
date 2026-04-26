const chromium = require('chrome-aws-lambda');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Use POST' };

    let browser = null;
    try {
        const { username, password } = JSON.parse(event.body);

        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: true,
        });

        const page = await browser.newPage();
        await page.goto('https://perfil.uagrm.edu.bo/estudiantes/default.php', { 
            waitUntil: 'domcontentloaded' 
        });

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
        return { 
            statusCode: 200, 
            body: JSON.stringify({ valid: esValido, url: urlFinal }) 
        };

    } catch (error) {
        if (browser !== null) await browser.close();
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: error.message }) 
        };
    }
};