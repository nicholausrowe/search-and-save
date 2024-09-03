const Puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

let queue; // Declare queue in the broader scope

// Immediately-Invoked Async Function Expression (IIFE)
(async () => {
  try {
    // Dynamically import the ES Module
    const { default: PQueue } = await import('p-queue');

    // Initialize PQueue after it has been imported
    queue = new PQueue({ concurrency: 2 });

    // Place your existing logic using PQueue here
    console.log('PQueue has been initialized successfully!');
  } catch (error) {
    console.error('Error importing p-queue:', error);
  }
})();

// Function to convert URL to PDF
async function convertURL(passedInURL) {
  if (!queue) {
    throw new Error('Queue is not initialized yet. Please wait until the module is ready.');
  }

  return queue.add(async () => {
    let browser;
    try {
      browser = await Puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-client-side-phishing-detection',
          '--disable-renderer-backgrounding',
          '--disable-accelerated-2d-canvas',
          '--disable-features=IsolateOrigins,site-per-process',
          '--mute-audio',
          '--disable-web-security',
          '--disable-extensions',
          '--disable-hang-monitor',
          '--disable-sync',
          '--disable-translate',
          '--metrics-recording-only',
          '--no-first-run',
          '--enable-automation',
        ],
        headless: true,
        timeout: 120000,
      });

      const page = await browser.newPage();
      await page.goto(passedInURL, {
        waitUntil: 'networkidle2',
        timeout: 120000,
      });

      let fileName = await page.title();
      const chars = { '|': '-', ',': '' };
      fileName = fileName.replace(/[\|,]/g, (key) => chars[key]);

      const pdfDir = path.join(__dirname, 'pdf');
      const pathToPDF = path.join(pdfDir, `${fileName}.pdf`);
      await fs.mkdir(pdfDir, { recursive: true });

      await page.pdf({
        path: pathToPDF,
        format: 'letter',
        printBackground: true,
      });

      await browser.close();
      return pathToPDF;
    } catch (error) {
      console.error('Error in convertURL:', error);
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  });
}

module.exports = convertURL;
