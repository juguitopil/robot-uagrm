const chromium = require('playwright-aws-lambda');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'POST requerido' }) };
    }

    let browser;
    try {
        const { username, password } = JSON.parse(event.body);
        const loginUrl = 'https://perfil.uagrm.edu.bo/estudiantes/default.php';

        // CONFIGURACIÓN PARA NUBE:
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: true, // DEBE SER TRUE EN LA NUBE
        });

        const page = await browser.newPage();
        
        await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Intento de login inteligente
        try {
            await page.waitForSelector('#usuario', { visible: true, timeout: 5000 });
            await page.fill('#usuario', username);
            await page.fill('#password', password);
        } catch (e) {
            // Si el ID falla, usa la posición de los cuadros (lo que nos funcionó antes)
            const inputs = await page.$$('input[type="text"], input[type="password"], input:not([type="hidden"])');
            if (inputs.length >= 2) {
                await inputs[0].fill(username);
                await inputs[1].fill(password);
            }
        }

        const btn = await page.$('#btn-login');
        if (btn) await btn.click(); else await page.click('button, input[type="submit"]');

        // Espera de seguridad para el redireccionamiento
        await page.waitForTimeout(5000); 

        const urlFinal = page.url();
        // Éxito si la URL cambió y ya no estamos en la página de login
        const esValido = !urlFinal.includes('default.php');

        // IMPORTANTE: Ahora sí cerramos siempre el navegador
        await browser.close(); 

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                valid: esValido, 
                mensaje: esValido ? "Sincronización exitosa" : "Credenciales incorrectas"
            }),
        };

    } catch (error) {
        if (browser) await browser.close();
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error del robot', detalle: error.message }),
        };
    }
};