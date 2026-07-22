import puppeteer from 'puppeteer-core';
import path from 'node:path';

const OUT = process.argv[2] || '.';
const URL = 'http://localhost:5173';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
});

// 1. Desktop: open a service accordion
let page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 5600));
await page.evaluate(() => document.querySelectorAll('.service__row')[1].scrollIntoView({ block: 'center' }));
await new Promise(r => setTimeout(r, 1200));
await page.evaluate(() => document.querySelectorAll('.service__row')[1].click());
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: path.join(OUT, 'ix-accordion.png') });
await page.close();

// 2. Mobile: burger menu
page = await browser.newPage();
await page.setViewport({ width: 375, height: 812 });
await page.goto(URL, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 5600));
await page.click('#burger');
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: path.join(OUT, 'ix-menu.png') });
// tap a menu link → should close + scroll
await page.click('.menu__link[href="#services"]');
await new Promise(r => setTimeout(r, 2200));
const scrollY = await page.evaluate(() => window.scrollY);
console.log('after menu nav scrollY:', Math.round(scrollY));
await page.screenshot({ path: path.join(OUT, 'ix-menu-nav.png') });
await page.close();

// 3. Reduced motion: everything must be visible without animations
page = await browser.newPage();
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1500));
const rm = await page.evaluate(() => ({
  preloader: getComputedStyle(document.getElementById('preloader')).display,
  heroTitleOpacity: getComputedStyle(document.querySelector('.hero__title')).opacity,
  statText: document.querySelector('[data-count]').textContent,
  aboutWordOpacity: getComputedStyle(document.querySelector('#aboutText')).opacity,
}));
console.log('reduced-motion:', JSON.stringify(rm));
await page.screenshot({ path: path.join(OUT, 'ix-reduced.png') });
await page.close();

await browser.close();
console.log('done');
