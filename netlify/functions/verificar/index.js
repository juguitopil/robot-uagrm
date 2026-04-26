const chromium = require('chrome-aws-lambda');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let browser = null;
  try {
    const { username, password } = JSON.parse(event.body || '{}');

    if (!username || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'username y password son requeridos' }) };
    }

    const executablePath = await chromium.executablePath;

    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto('https://perfil.uagrm.edu.bo/estudiantes/default.php', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Lógica de login aquí...

    await browser.close();
    browser = null;
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    if (browser) {
      try { await browser.close(); } catch (_) { /* ignore */ }
    }
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
