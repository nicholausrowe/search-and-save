import Puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises'; // Import Promises API for fs
import PQueue from 'p-queue';  // Correctly import p-queue using ES Module syntax

// Initialize PQueue
const queue = new PQueue({ concurrency: 2 });

// Function to convert URL to PDF
async function convertURL(passedInURL) {
  return queue.add(async () => {
    let browser;
    try {
      browser = await Puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-http2',
          // '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          // '--disable-gpu',
          // '--disable-features=VizDisplayCompositor',
          // '--disable-background-networking',
          // '--disable-background-timer-throttling',
          // '--disable-client-side-phishing-detection',
          // '--disable-renderer-backgrounding',
          // '--disable-accelerated-2d-canvas',
          // '--disable-features=IsolateOrigins,site-per-process',
          // '--mute-audio',
          // '--disable-web-security',
          // '--disable-extensions',
          // '--disable-hang-monitor',
          // '--disable-sync',
          // '--disable-translate',
          // '--metrics-recording-only',
          // '--no-first-run',
          // '--enable-automation',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.120 Safari/537.3'
        ],
        headless: true,
        timeout: 120000,
        dumpio: true
      });

      const page = await browser.newPage();

      // set User Agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      // add User Agent Headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      });

      await page.goto(passedInURL, {
        waitUntil: 'networkidle2',
        timeout: 120000,
      });

      let fileName = await page.title();
      const chars = { '|': '-', ',': '' };
      fileName = fileName.replace(/[\|,]/g, (key) => chars[key]);

      const pdfDir = path.join(process.cwd(), 'pdf');
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

export default convertURL; // Use ES module export syntax
