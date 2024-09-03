const Puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

let PQueue; // Declare PQueue globally
let queue;  // Declare queue globally
let queueInitializationPromise; // Promise to track initialization

// Function to initialize the queue dynamically
async function initializeQueue() {
  if (!queueInitializationPromise) {
    queueInitializationPromise = (async () => {
      try {
        const module = await import('p-queue'); // Dynamically import the module
        PQueue = module.default; // Assign the imported default export to PQueue
        queue = new PQueue({ concurrency: 2 });
        console.log('PQueue has been initialized successfully!');
      } catch (error) {
        console.error('Error importing p-queue:', error);
        throw error;
      }
    })();
  }
  return queueInitializationPromise; // Return the promise to ensure it's awaited
}

// Function to ensure that the queue is initialized
async function ensureInitialized() {
  await initializeQueue(); // Await the promise for initialization
}

// Function to convert URL to PDF
async function convertURL(passedInURL) {
  // Wait for the queue to be initialized
  await ensureInitialized();

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
