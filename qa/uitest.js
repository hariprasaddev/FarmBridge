// FarmBridge frontend E2E UI test suite (puppeteer-core + installed Chrome)
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const TS = Date.now();

// Screenshots are written next to this script (qa/screenshots) regardless of cwd.
const SHOT_DIR = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOT_DIR, { recursive: true });

const buyerEmail = `uibuyer_${TS}@test.com`;
const farmerEmail = 'qa_farmer1_1785918721@test.com'; // seeded by backend suite
const farmerPass = 'Passw0rd!123';
const adminEmail = 'qa_admin_1785918721@test.com'; // seeded by backend suite
const adminPass = 'AdminPass123!';
const PW = 'Passw0rd!123';

const R = { pass: 0, fail: 0, failures: [] };
const consoleErrors = [];
const netErrors = [];

function ok(name) { R.pass++; console.log('PASS ' + name); }
function bad(name, detail) {
  R.fail++;
  R.failures.push(`${name} :: ${detail}`);
  console.log('FAIL ' + name + ' -> ' + detail);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function typeText(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 20000 });
  await page.$eval(selector, (el, val) => {
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function setSelect(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 20000 });
  await page.$eval(selector, (el, val) => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, val);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function waitForUrl(page, fragment, timeout = 20000) {
  await page.waitForFunction(
    (f) => window.location.pathname.includes(f),
    { timeout },
    fragment
  );
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function hasText(page, text) {
  const t = await bodyText(page);
  return t.includes(text);
}

async function clickByText(page, text, selector = 'button, a') {
  const handles = await page.$$(selector);
  for (const h of handles) {
    const t = await h.evaluate((e) => (e.textContent || '').trim());
    if (t.includes(text)) {
      await h.click().catch(() => {});
      return true;
    }
  }
  return false;
}

async function login(page, email, password) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await typeText(page, '#email', email);
  await typeText(page, '#password', password);
  await clickByText(page, 'Log In');
}

async function logout(page) {
  const onNav = await page.$('.btn-logout');
  if (onNav) { await onNav.click(); await sleep(600); return; }
  const onFd = await page.$('.fd-logout');
  if (onFd) { await onFd.click(); await sleep(600); }
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setDefaultTimeout(20000);

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));
  page.on('requestfailed', (req) =>
    netErrors.push('REQFAIL: ' + req.url() + ' :: ' + (req.failure() || {}).errorText)
  );
  page.on('response', (res) => {
    if (res.status() >= 400) netErrors.push(`HTTP${res.status()}: ${res.url()}`);
  });

  try {
    // ============================================================
    console.log('\n===== AUTH FLOWS =====');
    // 1. Root redirects to login
    await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
    await sleep(1500);
    (await page.evaluate(() => window.location.pathname)).includes('/login')
      ? ok('root "/" redirects to /login (protected route)')
      : bad('root redirect', 'expected /login, got ' + page.url());

    // 2. Register a BUYER via the UI
    await page.goto(BASE + '/register', { waitUntil: 'networkidle2' });
    await typeText(page, '#name', 'UI Test Buyer');
    await typeText(page, '#reg-email', buyerEmail);
    await typeText(page, '#reg-password', PW);
    await page.$eval('input[name="role"][value="BUYER"]', (el) => el.click());
    await sleep(200);
    await clickByText(page, 'Create Account');
    await waitForUrl(page, '/login');
    await sleep(800);
    (await page.$('.alert-success'))
      ? ok('register buyer via UI shows success message + redirects to login')
      : bad('register UI', 'no success alert after register');

    // 3. Wrong password shows an error
    await typeText(page, '#email', buyerEmail);
    await typeText(page, '#password', 'WrongPass1!');
    await clickByText(page, 'Log In');
    await page.waitForSelector('.alert-error', { timeout: 10000 }).catch(() => {});
    (await page.$('.alert-error'))
      ? ok('login with wrong password shows error alert')
      : bad('login error alert', 'no .alert-error visible');

    // 4. Correct login lands on buyer products
    await typeText(page, '#password', PW);
    await clickByText(page, 'Log In');
    await waitForUrl(page, '/buyer/products');
    (await hasText(page, 'Browse Products'))
      ? ok('login lands on buyer products page')
      : bad('login redirect', 'not on buyer products page');

    // ============================================================
    console.log('\n===== BUYER FLOWS =====');
    // 5. Product cards render
    await page.waitForSelector('.bp-card', { timeout: 15000 });
    let cardCount = await page.$$eval('.bp-card', (els) => els.length);
    cardCount > 0
      ? ok(`product grid renders ${cardCount} cards`)
      : bad('product grid', 'no .bp-card elements');

    // 6. Search filters products client-side
    await typeText(page, '.bp-search input', 'Rice');
    await sleep(700);
    let filteredCount = await page.$$eval('.bp-card', (els) => els.length);
    (filteredCount >= 1 && filteredCount <= cardCount)
      ? ok(`search 'Rice' filters ${cardCount} -> ${filteredCount} cards`)
      : bad('search filter', `expected 1..${cardCount}, got ${filteredCount}`);
    await page.$eval('.bp-search input', (el) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await sleep(500);

    // 7. Product details page
    await page.click('.bp-card');
    await page.waitForFunction(() => window.location.pathname.startsWith('/buyer/products/'));
    await page.waitForSelector('.pd-name', { timeout: 15000 });
    (await page.$('.pd-price'))
      ? ok('product details render name + price')
      : bad('product details', '.pd-name/.pd-price missing');
    await page.screenshot({ path: path.join(SHOT_DIR, 'product-details.png') }).catch(() => {});

    // 8. Review eligibility notice (buyer has not purchased)
    const hasReviewNotice = await page.evaluate(() =>
      document.body.innerText.includes('You can only review products you have purchased')
    );
    hasReviewNotice
      ? ok('non-purchased buyer sees review eligibility notice (form hidden)')
      : bad('review notice', 'expected eligibility notice text');

    // 9. Wishlist toggle
    await page.waitForSelector('.wish-btn', { timeout: 10000 });
    await page.click('.wish-btn');
    await sleep(1200);
    const pressed = await page.$eval('.wish-btn', (el) => el.getAttribute('aria-pressed'));
    pressed === 'true'
      ? ok('wishlist heart toggles to active')
      : bad('wishlist toggle', 'aria-pressed=' + pressed);

    // 10. Wishlist page shows item; remove it
    await page.goto(BASE + '/buyer/wishlist', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.bw-card, .bw-empty', { timeout: 15000 });
    (await page.$('.bw-card'))
      ? ok('wishlist page lists the saved product')
      : bad('wishlist page', 'no .bw-card after adding');
    await page.screenshot({ path: path.join(SHOT_DIR, 'wishlist.png') }).catch(() => {});
    await page.click('.bw-remove-btn');
    await sleep(1500);
    (await page.$('.bw-empty'))
      ? ok('removing from wishlist shows empty state')
      : bad('wishlist remove', 'empty state not shown after remove');

    // 11. Place an order from the details page
    await page.goto(BASE + '/buyer/products', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.bp-card', { timeout: 15000 });
    await page.click('.bp-card');
    await page.waitForSelector('.pd-place-btn', { timeout: 15000 });
    await page.click('.pd-place-btn');
    await sleep(1200);
    await waitForUrl(page, '/buyer/orders', 15000);
    await page.waitForSelector('.bo-card, .bo-empty', { timeout: 15000 });
    (await page.$('.bo-card'))
      ? ok('order placed from details page -> order card visible')
      : bad('place order', 'no order card on /buyer/orders');
    await page.screenshot({ path: path.join(SHOT_DIR, 'buyer-orders.png') }).catch(() => {});

    // 12. Notifications page renders
    await page.goto(BASE + '/notifications', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.npage-root', { timeout: 15000 });
    (await page.$('.npage-empty, .npage-card'))
      ? ok('notifications page renders (empty state or list)')
      : bad('notifications page', 'neither empty nor list rendered');
    await page.screenshot({ path: path.join(SHOT_DIR, 'notifications.png') }).catch(() => {});

    // 13. Logout
    await logout(page);
    await waitForUrl(page, '/login');
    ok('logout returns to login');

    // ============================================================
    console.log('\n===== FARMER FLOWS (seeded QA farmer) =====');
    await login(page, farmerEmail, farmerPass);
    await waitForUrl(page, '/farmer/dashboard');
    (await hasText(page, 'Dashboard'))
      ? ok('farmer login lands on dashboard')
      : bad('farmer login', 'not on dashboard');

    // Dashboard stat cards (wait for data to finish loading first)
    await page.waitForSelector('.fd-stat-card', { timeout: 15000 }).catch(() => {});
    const statCards = await page.$$eval('.fd-stat-card', (els) => els.length);
    statCards >= 5
      ? ok(`farmer dashboard renders ${statCards} stat cards`)
      : bad('farmer dashboard', 'expected >=5 stat cards, got ' + statCards);
    await page.screenshot({ path: path.join(SHOT_DIR, 'farmer-dashboard.png') }).catch(() => {});

    // Add a product via the UI
    await page.goto(BASE + '/farmer/products/add', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#name', { timeout: 15000 });
    const newProduct = `UI Test Crop ${TS}`;
    await typeText(page, '#name', newProduct);
    await setSelect(page, '#category', 'Grains');
    await typeText(page, '#description', 'Added by the automated UI test');
    await typeText(page, '#price', '45');
    await typeText(page, '#quantity', '25');
    await clickByText(page, 'Create Product');
    await waitForUrl(page, '/farmer/products', 20000);
    await sleep(1200);
    (await hasText(page, newProduct))
      ? ok('farmer creates a product through the UI (visible in My Products)')
      : bad('add product UI', 'new product not visible after create');
    await page.screenshot({ path: path.join(SHOT_DIR, 'farmer-products.png') }).catch(() => {});

    // Farmer orders page renders
    await page.goto(BASE + '/farmer/orders', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.querySelectorAll('*').length > 100, { timeout: 15000 });
    (await hasText(page, 'Orders'))
      ? ok('farmer orders page renders')
      : bad('farmer orders page', 'no Orders heading');
    await page.screenshot({ path: path.join(SHOT_DIR, 'farmer-orders.png') }).catch(() => {});

    // Farmer notifications bell
    await page.goto(BASE + '/farmer/dashboard', { waitUntil: 'networkidle2' });
    await sleep(1000);
    (await page.$('.nbell-btn'))
      ? ok('notification bell present in navbar')
      : bad('notification bell', 'no .nbell-btn');

    await logout(page);
    await waitForUrl(page, '/login');
    ok('farmer logout');

    // ============================================================
    console.log('\n===== ADMIN FLOWS (seeded QA admin) =====');
    await login(page, adminEmail, adminPass);
    await waitForUrl(page, '/admin/dashboard');
    (await hasText(page, 'Dashboard'))
      ? ok('admin login lands on dashboard')
      : bad('admin login', 'not on dashboard');
    await page.screenshot({ path: path.join(SHOT_DIR, 'admin-dashboard.png') }).catch(() => {});

    const adminPages = [
      ['/admin/users', 'Users'],
      ['/admin/products', 'Products'],
      ['/admin/orders', 'Orders'],
      ['/admin/verification', 'Verification'],
    ];
    for (const [path, heading] of adminPages) {
      await page.goto(BASE + path, { waitUntil: 'networkidle2' });
      await page.waitForFunction(() => document.querySelectorAll('*').length > 100, { timeout: 15000 });
      (await hasText(page, heading))
        ? ok(`admin page ${path} renders (${heading})`)
        : bad('admin page ' + path, 'heading ' + heading + ' not found');
    }
    await page.screenshot({ path: path.join(SHOT_DIR, 'admin-verification.png') }).catch(() => {});
    await logout(page);
    await waitForUrl(page, '/login');
    ok('admin logout');

    // ============================================================
    console.log('\n===== PROTECTED ROUTES =====');
    await page.goto(BASE + '/buyer/orders', { waitUntil: 'networkidle2' });
    await sleep(1500);
    (await page.evaluate(() => window.location.pathname)).includes('/login')
      ? ok('unauthenticated user is redirected from protected route to /login')
      : bad('protected route', 'no redirect, at ' + page.url());
  } catch (err) {
    bad('SCRIPT', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n===== SUMMARY =====');
  console.log('PASS: ' + R.pass);
  console.log('FAIL: ' + R.fail);
  if (R.failures.length) {
    console.log('FAILED TESTS:');
    R.failures.forEach((f) => console.log('  - ' + f));
  }
  const realConsoleErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('Download the React DevTools')
  );
  console.log('CONSOLE ERRORS: ' + (realConsoleErrors.length ? realConsoleErrors.length : 'none'));
  realConsoleErrors.slice(0, 10).forEach((e) => console.log('   ' + e));
  const expected = netErrors.filter((e) => !e.includes('HTTP404'));
  console.log('NETWORK ERRORS (4xx/5xx, excluding expected 404s): ' + (expected.length ? expected.length : 'none'));
  expected.slice(0, 10).forEach((e) => console.log('   ' + e));
  process.exit(R.fail ? 1 : 0);
})();
