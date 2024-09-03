const Puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

let PQueue; // Declare PQueue globally
let queue;  // Declare queue globally
let isQueueInitialized = false; // Flag to check if queue is initialized

// Function to dynamically import and initialize PQueue
async function initializeQueue() {
  if (!isQueueInitialized) {
    try {
      const module = await import('p-queue'); // Dynamically import the ES module
      PQueue = module.default; // Assign the imported default export to PQueue
      queue = new PQueue({ concurrency: 2 });
      console.log('PQueue has been initialized successfully!');
      isQueueInitialized = true; // Set flag to indicate initialization is done
    } catch (error) {
      console.error('Error importing p-queue:', error);
      throw error;
    }
  }
}

// Function to ensure queue is initialized
async function ensureInitialized() {
  await initializeQueue(); // Always await to ensure the queue is initialized before use
}

// Function to convert URL to PDF
async function convertURL(passedInURL) {
  await ensureInitialized(); // Ensure queue is initialized

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

module.exports = convertURL;
