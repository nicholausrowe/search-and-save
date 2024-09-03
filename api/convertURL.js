const Puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

let queue; // Declare queue globally

// Function to initialize the queue dynamically
async function initializeQueue() {
  try {
    const { default: PQueue } = await import('p-queue');
    queue = new PQueue({ concurrency: 2 });
    console.log('PQueue has been initialized successfully!');
  } catch (error) {
    console.error('Error importing p-queue:', error);
    throw error;
  }
}

// Immediately initialize the queue when the module is loaded
const queueInitializationPromise = initializeQueue();

// Function to convert URL to PDF
async function convertURL(passedInURL) {
  // Wait for the queue to be initialized
  await queueInitializationPromise;

  if (!queue) {
    throw new Error('Queue is not initialized properly.');
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

// Function to handle multiple URL conversions
async function convertMultipleURLs(urls) {
  // Wait for the queue to be initialized
  await queueInitializationPromise;

  const promises = urls.map((url) => convertURL(url));
  return Promise.all(promises);
}

module.exports = { convertURL, convertMultipleURLs };
