import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if(msg.type() === 'error') {
      console.log('PAGE ERROR LOG:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  
  // Turn on simulation
  await page.evaluate(() => {
    const simulateBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Simulateur'));
    if(simulateBtn) simulateBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));

  // Navigate to FleetManager
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, a, div')).find(b => b.textContent && b.textContent.includes('Parc Auto'));
    if(btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
