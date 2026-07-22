import puppeteer from 'puppeteer-core';
import path from 'node:path';

const OUT = process.argv[2] || '.';
const URL = 'http://localhost:5173';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
});

async function shoot(name, width, height, steps) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3800)); // preloader + intro
  await page.screenshot({ path: path.join(OUT, `${name}-1-hero.png`) });
  for (const [i, y] of steps.entries()) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await new Promise(r => setTimeout(r, 1600)); // let reveals play
    await page.screenshot({ path: path.join(OUT, `${name}-${i + 2}.png`) });
  }
  const errors = await page.evaluate(() => window.__errs || []);
  const docW = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(name, 'docWidth:', docW, 'viewport:', width, docW > width ? 'OVERFLOW!' : 'ok');
  await page.close();
}

await shoot('desktop', 1440, 900, [900, 1900, 2900, 3900, 4900, 6200, 7400]);
await shoot('mobile', 375, 812, [800, 1700, 2700, 3900, 5100, 6300, 7600]);
await browser.close();
console.log('done');
