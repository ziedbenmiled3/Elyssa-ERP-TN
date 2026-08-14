import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
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
  
  const { isBlank, length, textContent } = await page.evaluate(() => {
    return {
      isBlank: document.body.innerText.trim() === '',
      length: document.body.innerHTML.length,
      textContent: document.body.innerText.substring(0, 500)
    };
  });
  console.log('Is blank screen:', isBlank);
  console.log('App content length:', length);
  console.log('Text Content preview:', textContent);
  
  await browser.close();
})();
