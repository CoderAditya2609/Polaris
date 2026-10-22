import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BASE = process.env.QA_BASE ?? 'http://localhost:4173';
const OUT =
  process.env.QA_OUT ?? path.join(os.tmpdir(), 'opencode', 'polaris-qa');
const PHOTO =
  process.env.QA_PHOTO ??
  path.join(os.tmpdir(), 'opencode', 'polaris-qa-photo.png');
const NAME = 'Adi';
const PASS = 'Polaris-QA-2026!';
const NEW_PASS = 'Polaris-QA-2026-v2!';
const TITLE = 'A quiet test of the sky';
const BODY = 'The clouds moved slowly over the lake and the stars came out.';

fs.mkdirSync(OUT, { recursive: true });
assert.ok(fs.existsSync(PHOTO), `QA photo missing at ${PHOTO}`);

const errors = [];
const screenshots = [];
let step = 0;

function log(message) {
  step += 1;
  console.log(`[${String(step).padStart(2, '0')}] ${message}`);
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  acceptDownloads: true,
  colorScheme: 'dark',
});
const page = await context.newPage();
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

const shot = async (name) => {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, animations: 'disabled' });
  screenshots.push(file);
};

const heading = (name) => page.getByRole('heading', { name, exact: true }).first();
const lockInput = () => page.locator('#lock-passphrase');

try {
  log('Open app');
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  await heading('Begin your journal').waitFor({ timeout: 20000 });
  await shot('01-setup.png');

  log('Create journal');
  await page.locator('#setup-name').fill(NAME);
  await page.locator('#setup-passphrase').fill(PASS);
  await page.locator('#setup-confirm').fill(PASS);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create my journal' }).click();
  await page.waitForTimeout(600);
  await heading("Today's Journal").waitFor({ timeout: 30000 });
  await shot('02-journal-empty.png');

  log('Write title, mood, formatted entry');
  await page.getByLabel('Entry title').fill(TITLE);
  await page.getByRole('button', { name: 'Good', exact: true }).click();
  await page.locator('.polaris-editor').click();
  await page.keyboard.type(BODY);
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await page.keyboard.type(' A bold line of thought.');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  assert.ok((await page.locator('.polaris-editor strong').count()) > 0, 'bold text missing');
  await page.waitForTimeout(2600);
  assert.ok(
    await page.getByText('Auto-saved', { exact: true }).first().isVisible(),
    'autosave did not settle',
  );

  log('Upload a daily polaroid');
  await page.getByRole('button', { name: "Add today's photo" }).first().click();
  await heading('Daily Polaroid').waitFor();
  await page.locator('input[type="file"]').first().setInputFiles(PHOTO);
  await page.getByAltText("Today's polaroid").waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200);
  await shot('03-journal-filled.png');

  log('Calendar page');
  await page.getByRole('link', { name: 'Calendar', exact: true }).first().click();
  await heading('Calendar').waitFor();
  await page.waitForTimeout(1200);
  assert.ok(
    (await page.locator('main button[aria-label^="Open "]').count()) >= 28,
    'calendar days missing',
  );
  await page.locator('main img').first().waitFor({ timeout: 20000 });
  await shot('04-calendar.png');

  log('Polaroid Wall page');
  await page.getByRole('link', { name: 'Polaroid Wall', exact: true }).first().click();
  await heading('Polaroid Wall').waitFor();
  await page.locator('main img').first().waitFor({ timeout: 20000 });
  await shot('05-wall.png');

  log('Insights page');
  await page.getByRole('link', { name: 'Insights', exact: true }).first().click();
  await heading('Insights').waitFor();
  const insightsText = await page.locator('main').innerText();
  assert.match(insightsText, /writing streak/i);
  assert.match(insightsText, /1\s*\n?\s*day/);
  await shot('06-insights.png');

  log('Settings page');
  await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
  await heading('Settings').waitFor();
  await shot('07-settings-dark.png');

  log('Reject a wrong current passphrase');
  await page.locator('#current-pass').fill('definitely-not-it');
  await page.locator('#new-pass').fill(NEW_PASS);
  await page.locator('#confirm-pass').fill(NEW_PASS);
  await page.getByRole('button', { name: 'Change passphrase' }).click();
  await page.getByText('The current passphrase is incorrect.').waitFor({ timeout: 30000 });

  log('Change passphrase and re-encrypt everything');
  await page.locator('#current-pass').fill(PASS);
  await page.locator('#new-pass').fill(NEW_PASS);
  await page.locator('#confirm-pass').fill(NEW_PASS);
  await page.getByRole('button', { name: 'Change passphrase' }).click();
  await page
    .getByText(/Passphrase changed\. Every entry and photo was re-encrypted\./)
    .waitFor({ timeout: 60000 });
  await page.waitForTimeout(600);

  log('Export and inspect encrypted backup');
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
  await page.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  const backupPath = path.join(OUT, 'polaris-backup.json');
  await download.saveAs(backupPath);
  const rawBackup = fs.readFileSync(backupPath, 'utf8');
  const backup = JSON.parse(rawBackup);
  assert.equal(backup.app, 'polaris');
  assert.equal(backup.version, 1);
  assert.equal(backup.entries.length, 1, 'backup should have one entry');
  assert.equal(backup.photos.length, 1, 'backup should have one photo');
  assert.equal(Buffer.from(backup.salt, 'base64').length, 16);
  assert.equal(backup.iterations, 600000);
  for (const secret of [TITLE, BODY, NAME, PASS, NEW_PASS, 'clouds']) {
    assert.ok(!rawBackup.includes(secret), `backup leaked plaintext: ${secret}`);
  }

  log('Light theme');
  await page.getByRole('button', { name: 'Day', exact: true }).click();
  await page.waitForTimeout(500);
  const lightState = await page.evaluate(() => {
    const root = document.documentElement;
    const panel = document.querySelector('.glass');
    return {
      hasLight: root.classList.contains('light'),
      hasDark: root.classList.contains('dark'),
      paper: getComputedStyle(root).getPropertyValue('--panel').trim(),
      panelInk: panel ? getComputedStyle(panel).getPropertyValue('--text').trim() : '',
      panelBackground: panel ? getComputedStyle(panel).backgroundColor : '',
    };
  });
  assert.ok(lightState.hasLight, 'html.light class missing');
  assert.ok(!lightState.hasDark, 'html.dark should be removed in day mode');
  assert.ok(lightState.paper.includes('252, 247, 238'), 'day paper tone missing');
  assert.equal(lightState.panelInk, '#2b2118', 'panel ink should be dark in day mode');
  assert.ok(
    lightState.panelBackground.includes('252, 247, 238'),
    'glass panels should become paper in day mode',
  );
  await page.locator('main').evaluate((element) => element.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await shot('08-settings-light.png');
  await page.getByRole('link', { name: 'Journal', exact: true }).first().click();
  await heading("Today's Journal").waitFor();
  await page.waitForTimeout(600);
  const scrollAfterNavigation = await page
    .locator('main')
    .evaluate((element) => element.scrollTop);
  assert.equal(scrollAfterNavigation, 0, 'scroll position persisted across routes');
  await shot('09-journal-light.png');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.waitForTimeout(400);
  assert.ok(
    await page.evaluate(
      () =>
        document.documentElement.classList.contains('dark') &&
        !document.documentElement.classList.contains('light'),
    ),
    'dark theme did not come back',
  );

  log('Search palette (Ctrl+K)');
  await page.keyboard.press('Control+K');
  const searchDialog = page.getByRole('dialog', { name: 'Search journal' });
  await searchDialog.waitFor();
  await searchDialog.locator('input').fill('clouds');
  await page.getByRole('button', { name: new RegExp(TITLE) }).waitFor({ timeout: 10000 });
  await shot('10-search.png');
  await page.keyboard.press('Escape');

  log('Lock, reject wrong pass, unlock with the new pass');
  await page.getByRole('button', { name: 'Lock journal' }).first().click();
  await heading('Welcome back').waitFor();
  await shot('11-lock.png');
  await lockInput().fill('still-not-it');
  await page.getByRole('button', { name: 'Unlock Journal' }).click();
  await page.getByText('That passphrase is incorrect. Try again.').waitFor({ timeout: 30000 });
  await lockInput().fill(NEW_PASS);
  await page.getByRole('button', { name: 'Unlock Journal' }).click();
  await heading("Today's Journal").waitFor({ timeout: 60000 });
  await page.waitForTimeout(1200);
  assert.equal(await page.getByLabel('Entry title').inputValue(), TITLE);
  await page.getByAltText("Today's polaroid").waitFor({ timeout: 20000 });
  await shot('12-reunlocked.png');

  log('Inspect IndexedDB at rest');
  const inspect = async () =>
    page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('polaris-journal');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const readAll = (store) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(store, 'readonly');
          const request = tx.objectStore(store).getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      const keys = (store) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(store, 'readonly');
          const request = tx.objectStore(store).getAllKeys();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      const getMeta = (key) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction('meta', 'readonly');
          const request = tx.objectStore('meta').get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      const decode = (buffer) => new TextDecoder().decode(new Uint8Array(buffer));
      const entries = await readAll('entries');
      const photos = await readAll('photos');
      const kdf = await getMeta('kdf');
      const check = await getMeta('check');
      const settings = await getMeta('settings');
      return {
        entryCount: entries.length,
        entries: entries.map((entry) => ({
          date: entry.date,
          iv: entry.iv.byteLength,
          data: entry.data.byteLength,
          text: decode(entry.data),
        })),
        photos: photos.map((photo) => ({
          date: photo.date,
          bytes: photo.data.byteLength,
          mime: photo.mime,
        })),
        metaKeys: (await keys('meta')).sort(),
        salt: kdf?.salt?.byteLength ?? 0,
        iterations: kdf?.iterations ?? 0,
        checkText: check ? decode(check.data) : '',
        settingsText: settings ? decode(settings.data) : '',
      };
    });

  const firstInspect = await inspect();
  assert.equal(firstInspect.entryCount, 1);
  assert.equal(firstInspect.entries[0].iv, 12);
  assert.ok(firstInspect.entries[0].data > 20);
  assert.ok(!firstInspect.entries[0].text.includes('clouds'), 'entry ciphertext leaked text');
  assert.ok(!firstInspect.entries[0].text.includes(TITLE), 'entry ciphertext leaked title');
  assert.equal(firstInspect.photos.length, 1);
  assert.ok(firstInspect.photos[0].bytes > 1000);
  assert.match(firstInspect.photos[0].mime, /^image\//);
  assert.deepEqual(firstInspect.metaKeys, ['check', 'kdf', 'settings']);
  assert.equal(firstInspect.salt, 16);
  assert.equal(firstInspect.iterations, 600000);
  assert.ok(!firstInspect.checkText.includes(NEW_PASS));
  assert.ok(!firstInspect.settingsText.includes(NAME));

  log('Create a throwaway entry for a past day');
  await page.locator('main button[aria-haspopup="dialog"]').click();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  await page.locator('#journal-date').fill(yKey);
  await page.waitForTimeout(800);
  await page.getByLabel('Entry title').fill('Temporary entry');
  await page.locator('.polaris-editor').click();
  await page.keyboard.type('This should disappear after restore.');
  await page.getByRole('button', { name: /Save Entry/ }).click();
  await page.waitForTimeout(800);
  const beforeImport = await inspect();
  assert.equal(beforeImport.entryCount, 2, 'throwaway entry was not saved');

  log('Restore the encrypted backup (should replace the throwaway entry)');
  await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
  await heading('Settings').waitFor();
  await page.locator('main input[type="file"]').setInputFiles(backupPath);
  await heading('Restore backup').waitFor();
  await page.locator('#import-pass').fill(NEW_PASS);
  await page.getByRole('button', { name: 'Restore backup' }).click();
  await heading('Welcome back').waitFor({ timeout: 60000 });
  await page.getByText(/Backup restored\./).waitFor({ timeout: 10000 });
  await shot('13-import-locked.png');
  await lockInput().fill(NEW_PASS);
  await page.getByRole('button', { name: 'Unlock Journal' }).click();
  await heading('Settings').waitFor({ timeout: 60000 });
  await page.getByRole('link', { name: 'Journal', exact: true }).first().click();
  await heading("Today's Journal").waitFor();
  await page.waitForTimeout(1200);
  assert.equal(await page.getByLabel('Entry title').inputValue(), TITLE);
  await page.getByAltText("Today's polaroid").waitFor({ timeout: 20000 });
  const afterImport = await inspect();
  assert.equal(afterImport.entryCount, 1, 'restore did not replace existing data');
  assert.ok(
    !afterImport.entries.some((entry) => entry.text.includes('Temporary entry')),
    'throwaway entry survived restore',
  );

  log('CSP, service worker and PWA manifest');
  const csp = await page.evaluate(
    () =>
      document
        .querySelector('meta[http-equiv="Content-Security-Policy"]')
        ?.getAttribute('content') ?? '',
  );
  assert.ok(csp.includes("default-src 'self'"), 'CSP missing');
  assert.ok(csp.includes("script-src 'self'"), 'CSP script policy missing');
  assert.ok(csp.includes("object-src 'none'"), 'CSP object policy missing');
  const swRegistered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration);
  });
  assert.ok(swRegistered, 'service worker did not register');
  const manifestStatus = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest');
    return response.status;
  });
  assert.equal(manifestStatus, 200);

  log('Mobile layout');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  const mobileState = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      sidebarDisplay: aside ? getComputedStyle(aside).display : 'missing',
      mobileSearch: Boolean(document.querySelector('header button[aria-label="Search journal"]')),
    };
  });
  assert.equal(mobileState.sidebarDisplay, 'none', 'desktop sidebar visible on mobile');
  assert.ok(mobileState.mobileSearch, 'mobile search button missing');
  assert.ok(
    mobileState.scrollWidth <= mobileState.innerWidth + 1,
    `horizontal overflow on mobile (${mobileState.scrollWidth} > ${mobileState.innerWidth})`,
  );
  await shot('14-mobile.png');

  if (errors.length) {
    console.error('\nBrowser errors collected:');
    for (const message of errors) console.error(` - ${message}`);
  }
  assert.equal(errors.length, 0, 'browser console/page errors were collected');

  console.log('\nQA PASS');
  console.log(`Screenshots: ${OUT}`);
  console.log(screenshots.map((file) => ` - ${path.basename(file)}`).join('\n'));
} catch (cause) {
  try {
    await page.screenshot({ path: path.join(OUT, 'failure.png'), animations: 'disabled' });
  } catch {
    /* ignore screenshot failure */
  }
  console.error('\nQA FAIL:', cause);
  if (errors.length) {
    console.error('Browser errors:');
    for (const message of errors) console.error(` - ${message}`);
  }
  process.exitCode = 1;
} finally {
  await browser.close();
}
