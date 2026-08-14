import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR LOG:', msg.text());
  });
  page.on('pageerror', err => {
    console.log('CRITICAL PAGE ERROR:', err.stack || err.toString());
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Turn on simulation / demo
  await page.evaluate(() => {
    const simulateBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Simulateur'));
    if(simulateBtn) simulateBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- Testing FleetManager (Parc Auto) ---');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, a, div, span')).find(b => b.textContent && b.textContent.includes('Parc Auto'));
    if(btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  console.log('--- Testing CessionManager (Cession) ---');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, a, div, span')).find(b => b.textContent && b.textContent.includes('Cession'));
    if(btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await browser.close();
})();
