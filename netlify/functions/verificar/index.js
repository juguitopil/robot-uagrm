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
        
        // Aumentamos el timeout a 30s porque el portal UAGRM a veces es lento
        await page.goto('https://perfil.uagrm.edu.bo/estudiantes/default.php', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        const inputs = await page.$$('input[type="text"], input[type="password"]');
        if (inputs.length >= 2) {
            await inputs[0].type(username);
            await inputs[1].type(password);
            
            // Usamos Promise.all para asegurarnos de que la navegación termine antes de seguir
            await Promise.all([
                page.click('#btn-login'),
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
            ]);
        }

        const urlFinal = page.url();
        // Si la URL ya no contiene "default.php", el login fue exitoso
        const esValido = !urlFinal.includes('default.php');

        // IMPORTANTE: Cerramos el navegador ANTES de retornar la respuesta
        await browser.close();
        browser = null;

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                valid: esValido,
                url: urlFinal 
            })
        };
    } catch (error) {
        // En caso de error, cerramos el navegador para no dejar procesos colgados
        if (browser) await browser.close();
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: error.message }) 
        };
    }
};