const puppeteer = require('puppeteer');
const path = require('path');

module.exports = async function convertURL(passedInURL) {
  let browser;
  try {
    // Launch Puppeteer with necessary arguments
    browser = await puppeteer.launch({
      headless: true, // or false if you want to see the browser
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(passedInURL, {
      waitUntil: 'networkidle2', // Wait until network is idle
    });

    // Get the title of the page for the file name
    let fileName = await page._frameManager._mainFrame.evaluate(() => document.title);

    // Replace certain characters in the file name
    const chars = { '|': '-', ',': '' };
    fileName = fileName.replace(/[\|,]/g, key => chars[key]);

    // Define the path to save the PDF
    const pathToPDF = path.join(__dirname, `/pdf/${fileName}.pdf`);

    // Generate the PDF
    await page.pdf({
      path: pathToPDF,
      format: 'letter',
      printBackground: true,
    });

    await browser.close();

    return pathToPDF;

  } catch (error) {
    // Improved error logging
    console.error('Error in convertURL:', error);

    // Ensure the browser is closed if an error occurs
    if (browser) {
      await browser.close();
    }
    throw error; // Re-throw the error after logging
  }
};
