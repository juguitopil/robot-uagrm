const { chromium } = require('playwright-core');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    let browser;
    try {
        const { username, password } = JSON.parse(event.body);
        
        // El plugin de Netlify se encarga de encontrar el ejecutable automáticamente
        browser = await chromium.launch({ headless: true });
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        await page.goto('https://perfil.uagrm.edu.bo/estudiantes/default.php', { 
            waitUntil: 'domcontentloaded' 
        });

        // Lógica de llenado por posición que ya te funcionó localmente
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
            body: JSON.stringify({ valid: esValido, url: urlFinal }),
        };

    } catch (error) {
        if (browser) await browser.close();
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error en la nube', detalle: error.message }),
        };
    }
};