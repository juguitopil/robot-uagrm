const chromium = require('chrome-aws-lambda');

exports.handler = async (event) => {
  let browser = null;
  try {
    const { username, password } = JSON.parse(event.body);
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto('https://perfil.uagrm.edu.bo/estudiantes/default.php');

    // Lógica de login aquí...

    await browser.close();
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    if (browser) await browser.close();
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};