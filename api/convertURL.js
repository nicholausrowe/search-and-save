// Make sure this is in convertURL.mjs or convertURL.js with "type": "module" in package.json
import puppeteer from 'puppeteer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

let PQueue;
let queue;
let isQueueInitialized = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeQueue() {
  if (!isQueueInitialized) {
    try {
      const { default: ImportedPQueue } = await import('p-queue');
      PQueue = ImportedPQueue;
      queue = new PQueue({ concurrency: 2 });
      console.log('PQueue has been initialized successfully!');
      isQueueInitialized = true;
    } catch (error) {
      console.error('Error importing p-queue:', error);
      throw error;
    }
  }
}

async function ensureInitialized() {
  await initializeQueue();
}

async function convertURL(passedInURL) {
  await ensureInitialized();
  if (!queue) {
    throw new Error('Queue is not initialized properly.');
  }
  return queue.add(async () => {
    let browser;
    try {
      browser = await puppeteer.launch({
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

export default convertURL;
