const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

module.exports = async function convertURL(passedInURL) {
  let browser;
  try {
    // Launch Puppeteer with necessary arguments
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Uses /tmp instead of /dev/shm
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--single-process', // Ensures Puppeteer runs in a single process to reduce thread usage
        '--no-zygote', // Disables the zygote process, which reduces memory usage
        '--disable-software-rasterizer', // Disable software rasterizer
        '--disable-gl-drawing-for-tests', // Disable GL drawing for tests
        '--disable-accelerated-2d-canvas', // Disable accelerated 2D canvas
        '--disable-features=IsolateOrigins,site-per-process', // Disable site isolation features
        '--mute-audio', // Mute audio to avoid unnecessary resources
        '--disable-web-security', // Disable web security to avoid CORS issues
        '--disable-extensions', // Disable extensions
        '--disable-default-apps', // Disable default apps
        '--remote-debugging-port=0' // Open debugging port
      ],
      headless: true,
      timeout: 60000 // Increase the timeout to 60 seconds
    });

    const page = await browser.newPage();
    await page.goto(passedInURL, {
      waitUntil: 'networkidle2', // Wait until network is idle
      timeout: 60000 // Set a 60-second timeout
    });

    // Get the title of the page for the file name
    let fileName = await page.title();

    // Replace certain characters in the file name
    const chars = { '|': '-', ',': '' };
    fileName = fileName.replace(/[\|,]/g, key => chars[key]);

    // Define the path to save the PDF
    const pdfDir = path.join(__dirname, 'pdf');
    const pathToPDF = path.join(pdfDir, `${fileName}.pdf`);

    // Create the 'pdf' directory if it does not exist
    await fs.mkdir(pdfDir, { recursive: true });

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
