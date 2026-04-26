const chromium = require('playwright-aws-lambda');

exports.handler = async (event, context) => {
    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
    }

    let browser;
    try {
        const { username, password } = JSON.parse(event.body);
        const loginUrl = 'https://perfil.uagrm.edu.bo/estudiantes/default.php';

        // CONFIGURACIÓN CLAVE PARA NETLIFY
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless, // Netlify requiere que sea true
        });

        const page = await browser.newPage();
        
        // Navegación
        await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Lógica de llenado por posición (la que nos funcionó en tus pruebas locales)
        const inputs = await page.$$('input[type="text"], input[type="password"], input:not([type="hidden"])');
        if (inputs.length >= 2) {
            await inputs[0].fill(username);
            await inputs[1].fill(password);
        }

        // Click en el botón de login
        const btn = await page.$('#btn-login');
        if (btn) {
            await btn.click();
        } else {
            await page.click('button, input[type="submit"]');
        }

        // Esperar validación
        await page.waitForTimeout(5000); 

        const urlFinal = page.url();
        const esValido = !urlFinal.includes('default.php');

        await browser.close();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                valid: esValido, 
                url_alcanzada: urlFinal 
            }),
        };

    } catch (error) {
        if (browser) await browser.close();
        console.error("Error en Netlify:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Error en la nube', 
                detalle: error.message 
            }),
        };
    }
};