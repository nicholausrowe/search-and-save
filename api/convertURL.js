const puppeteer = require('puppeteer');
const path = require('path');


module.exports = async function convertURL(passedInURL) {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(passedInURL, {
      waitUntil: 'networkidle2',
    });

  const fileName = await page._frameManager._mainFrame.evaluate(() => document.title);

  const pathToPDF = path.join(__dirname, `pdf/${fileName}.pdf`);

  await page.pdf({
    path: pathToPDF,
    format: 'letter',
    printBackground: true
  });

  await browser.close();

  return pathToPDF;
}
