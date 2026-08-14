import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  
  // Navigate to FleetManager
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, a, div')).find(b => b.textContent && b.textContent.includes('Parc Auto'));
    if(btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  const isBlank = document.body.innerText.trim() === '';
  console.log('Is blank screen:', await page.evaluate(() => document.body.innerText.trim() === ''));
  console.log('App content length:', content.length);
  
  await browser.close();
})();
