const puppeteer = require('puppeteer');
const path = require('path');


module.exports = async function convertURL(passedInURL) {

  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  const page = await browser.newPage();
  await page.goto(passedInURL, {
    waitUntil: 'networkidle2',
  });

  let fileName = await page._frameManager._mainFrame.evaluate(() => document.title);

  const chars = {'\|': '-', ',': ''};

  fileName = fileName.replace(/[\|,]/g, key => chars[key]);

  const pathToPDF = path.join(__dirname, `/pdf/${fileName}.pdf`);

  await page.pdf({
    path: pathToPDF,
    format: 'letter',
    printBackground: true
  });

  await browser.close();

  return pathToPDF;
}
