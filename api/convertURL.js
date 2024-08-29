const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Helper function to introduce delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = async function convertURL(passedInURL) {
  let browser;
  try {
    // Launch Puppeteer with necessary arguments
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-client-side-phishing-detection',
        '--disable-renderer-backgrounding',
        '--no-zygote',
        '--disable-software-rasterizer',
        '--disable-gl-drawing-for-tests',
        '--disable-accelerated-2d-canvas',
        '--disable-features=IsolateOrigins,site-per-process',
        '--mute-audio',
        '--disable-web-security',
        '--disable-extensions',
        '--disable-default-apps',
        '--remote-debugging-port=0',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain',
      ],
      headless: true,
      timeout: 120000, // Increase the timeout to 120 seconds
    });

    const page = await browser.newPage();
    await page.goto(passedInURL, {
      waitUntil: 'networkidle2', // Wait until network is idle
      timeout: 120000, // Set a 120-second timeout
    });

    // Get the title of the page for the file name
    let fileName = await page.title();

    // Replace certain characters in the file name
    const chars = { '|': '-', ',': '' };
    fileName = fileName.replace(/[\|,]/g, (key) => chars[key]);

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

    // Close browser after operation
    await browser.close();

    // Introduce delay after each query
    await sleep(5000); // 2-second delay

    return pathToPDF;
  } catch (error) {
    console.error('Error in convertURL:', error);

    // Ensure the browser is closed if an error occurs
    if (browser) {
      await browser.close();
    }

    // Additional error handling: Retry logic or specific checks
    if (error.message.includes('Timed out')) {
      console.warn('Retrying due to timeout...');
      return await convertURL(passedInURL); // Retry once on timeout
    }

    throw error; // Re-throw the error after logging
  }
};
