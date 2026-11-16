// Quick visual check: node e2e/peek.mjs <url> <out.png> [w] [h] [steps-json]
import { chromium } from 'playwright';
const [url, out, w = '1366', h = '768', steps = '[]'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
await page.goto(url);
await page.waitForTimeout(3000);
for (const s of JSON.parse(steps)) {
  if (s.click) await page.getByText(s.click, { exact: s.exact ?? false }).first().click();
  if (s.testid) await page.getByTestId(s.testid).click();
  if (s.key) await page.keyboard.press(s.key);
  if (s.wait) await page.waitForTimeout(s.wait);
}
await page.screenshot({ path: out });
console.log(errors.length ? errors.join('\n') : 'no errors');
await browser.close();
