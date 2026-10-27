import { chromium } from 'playwright-core';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({
  executablePath: edge,
  headless: true,
  args: ['--disable-dev-shm-usage', '--force-device-scale-factor=1'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const logs = [];
page.on('console', (msg) => logs.push(`console.${msg.type()}: ${msg.text()}`));
page.on('pageerror', (error) => logs.push(`PAGEERROR: ${error.stack || error.message}`));
page.on('requestfailed', (request) => logs.push(`REQUESTFAILED: ${request.url()} ${request.failure()?.errorText}`));

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.resolve('shot_01_landing.png') });

await page.click('#btn-start');
await page.waitForTimeout(1600);
if (await page.locator('#dialogue-layer:not(.hidden) .dialogue-skip').count()) {
  await page.locator('#dialogue-layer .dialogue-skip').click();
}
await page.waitForTimeout(1600);
await page.screenshot({ path: path.resolve('shot_03_game.png') });
const state1 = await page.evaluate(() => window.__NOVEL_GAME__?.getDebugState?.() ?? null);

// Move right for a moment and see if the player updates.
await page.keyboard.down('KeyD');
await page.waitForTimeout(700);
await page.keyboard.up('KeyD');
await page.waitForTimeout(250);
await page.screenshot({ path: path.resolve('shot_04_moved.png') });
const state2 = await page.evaluate(() => window.__NOVEL_GAME__?.getDebugState?.() ?? null);

// Force a debate and skip its intro.
await page.evaluate(() => window.__NOVEL_GAME__?.debugTriggerDebate?.());
await page.waitForTimeout(1000);
if (await page.locator('#dialogue-layer:not(.hidden) .dialogue-skip').count()) {
  await page.locator('#dialogue-layer .dialogue-skip').click();
}
await page.waitForTimeout(1400);
await page.screenshot({ path: path.resolve('shot_05_debate.png') });
const cards = await page.locator('#debate-hand .play-card').count();
const debateState = await page.evaluate(() => window.__NOVEL_GAME__?.getDebugState?.() ?? null);

if (cards > 0) {
  await page.locator('#debate-hand .play-card').first().click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.resolve('shot_06_card_played.png') });
}
const finalState = await page.evaluate(() => window.__NOVEL_GAME__?.getDebugState?.() ?? null);
const consoleErrors = logs.filter((line) => line.includes('error') || line.includes('PAGEERROR'));

console.log(JSON.stringify({ state1, state2, debateState, finalState, cards, consoleErrors, logs }, null, 2));
await browser.close();
