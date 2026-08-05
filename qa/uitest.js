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
  // 1) New enterprise shell: logout lives in the profile dropdown.
  //    Use DOM-level clicks so transient overlays (e.g. toasts) never
  //    intercept the pointer and stall the test.
  const pdTrigger = await page.$('.fb-pd-trigger');
  if (pdTrigger) {
    await page.evaluate(() => {
      const el = document.querySelector('.fb-pd-trigger');
      if (el) el.click();
    });
    await sleep(400);
    const pdLogout = await page.$('.fb-pd-menu .btn-logout');
    if (pdLogout) {
      await page.evaluate(() => {
        const el = document.querySelector('.fb-pd-menu .btn-logout');
        if (el) el.click();
      });
      await sleep(700);
      return;
    }
  }
  // 2) Legacy shells (kept for older pages)
  const onNav = await page.$('.btn-logout');
  if (onNav) { await onNav.click(); await sleep(600); return; }
  const onFd = await page.$('.fd-logout');
  if (onFd) { await onFd.click(); await sleep(600); return; }
  const onAd = await page.$('.ad-logout');
  if (onAd) { await onAd.click(); await sleep(600); }
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
  // Auto-accept any residual window.confirm dialogs (approve/reject now
  // use the design-system ConfirmDialog, which the suite clicks through
  // explicitly — this handler is kept as a safety net for stray dialogs).
  page.on('dialog', (d) => d.accept().catch(() => {}));

  // Ensure a tiny valid PNG exists for document uploads
  const testPng = path.join(__dirname, 'test.png');
  if (!fs.existsSync(testPng)) {
    fs.writeFileSync(testPng, Buffer.from(
      '89504e470d0a1a0a0000000d494844520000000100000001080200000090775368' +
      '0000000c49444154789c6360f8cf000000010100018f0ee8f30000000049454e44ae426082',
      'hex'
    ));
  }

  // Upload the verification documents (4 file inputs in order)
  async function uploadVerificationDocs(page) {
    const inputs = await page.$$('.fv-doc-btn input[type=file]');
    if (inputs.length < 3) throw new Error('expected >=3 document inputs, got ' + inputs.length);
    for (let i = 0; i < 3; i++) await inputs[i].uploadFile(testPng);
  }

  // Fill the verification form (fields must exist; documents uploaded separately)
  async function fillVerificationForm(page, farmName, name) {
    await typeText(page, '#fullName', name);
    await typeText(page, '#mobileNumber', '9876543210');
    await typeText(page, '#village', 'Test Village');
    await typeText(page, '#mandal', 'Test Mandal');
    await typeText(page, '#district', 'Test District');
    await typeText(page, '#state', 'Telangana');
    await typeText(page, '#farmName', farmName);
    await typeText(page, '#farmAddress', 'Survey 45, Test Village');
    await typeText(page, '#farmSize', '6.5');
    await typeText(page, '#mainCrops', 'Rice, Cotton');
    await typeText(page, '#farmingExperience', '8 years');
    await setSelect(page, '#cultivationMethod', 'ORGANIC');
  }

  // Find the admin verification card for a specific email and act on it
  async function adminCardAction(page, email, buttonSelector) {
    const cards = await page.$$('.av-card');
    for (const card of cards) {
      const text = await card.evaluate((el) => el.innerText);
      if (text.includes(email)) {
        const btn = await card.$(buttonSelector);
        if (!btn) return false;
        await btn.click();
        return true;
      }
    }
    return false;
  }

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

    // 4. Correct login lands on the buyer analytics dashboard
    await typeText(page, '#password', PW);
    await clickByText(page, 'Log In');
    await waitForUrl(page, '/buyer/dashboard');
    (await hasText(page, 'My Dashboard'))
      ? ok('login lands on buyer dashboard')
      : bad('login redirect', 'not on buyer dashboard');

    // ============================================================
    console.log('\n===== BUYER FLOWS =====');
    // Navigate to the marketplace (login lands on the buyer dashboard)
    await page.goto(BASE + '/buyer/products', { waitUntil: 'networkidle2' });
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
    await page.waitForSelector('.fa-card', { timeout: 15000 }).catch(() => {});
    const statCards = await page.$$eval('.fa-card', (els) => els.length);
    statCards >= 10
      ? ok(`farmer dashboard renders ${statCards} analytics stat cards`)
      : bad('farmer dashboard', 'expected >=10 stat cards, got ' + statCards);
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
    console.log('\n===== FARMER VERIFICATION UI FLOWS =====');
    const verifFarmer = `uifarmer_${TS}@test.com`;
    const verifFarmer2 = `uifarmer2_${TS}@test.com`;
    const verifFarm = `UI Verified Farm ${TS}`;
    const verifFarm2 = `UI Rejected Farm ${TS}`;

    // --- register a fresh farmer via the UI ---
    await page.goto(BASE + '/register', { waitUntil: 'networkidle2' });
    await typeText(page, '#name', 'UI Verification Farmer');
    await typeText(page, '#reg-email', verifFarmer);
    await typeText(page, '#reg-password', PW);
    await page.$eval('input[name="role"][value="FARMER"]', (el) => el.click());
    await sleep(200);
    await clickByText(page, 'Create Account');
    await waitForUrl(page, '/login');
    await sleep(600);

    // --- login and land on the dashboard: verification-pending banner ---
    await login(page, verifFarmer, PW);
    await waitForUrl(page, '/farmer/dashboard');
    await page.waitForSelector('.fd-stat-card', { timeout: 15000 }).catch(() => {});
    await sleep(1200);
    (await hasText(page, 'Complete your farmer verification to start selling'))
      ? ok('new farmer dashboard shows verification-pending banner')
      : bad('verif banner', 'no pending-verification banner on dashboard');
    (await hasText(page, 'Available after your account is verified'))
      ? ok('Add Product quick action is locked for unverified farmer')
      : bad('verif locked action', 'Add Product action not locked');

    // --- submit the verification form with documents ---
    await page.goto(BASE + '/farmer/verification', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#fullName', { timeout: 15000 });
    await fillVerificationForm(page, verifFarm, 'UI Verification Farmer');
    await uploadVerificationDocs(page);
    await clickByText(page, 'Submit Verification');
    await page.waitForFunction(
      () => document.body.innerText.includes('under review'),
      { timeout: 20000 }
    );
    (await hasText(page, 'Your verification request is under review'))
      ? ok('verification submitted -> PENDING screen shown')
      : bad('verif pending screen', 'PENDING screen not shown after submit');
    await page.screenshot({ path: path.join(SHOT_DIR, 'farmer-verification-pending.png') }).catch(() => {});

    // --- register + submit a SECOND farmer (for the reject flow) ---
    await logout(page);
    await waitForUrl(page, '/login');
    await page.goto(BASE + '/register', { waitUntil: 'networkidle2' });
    await typeText(page, '#name', 'UI Second Farmer');
    await typeText(page, '#reg-email', verifFarmer2);
    await typeText(page, '#reg-password', PW);
    await page.$eval('input[name="role"][value="FARMER"]', (el) => el.click());
    await sleep(200);
    await clickByText(page, 'Create Account');
    await waitForUrl(page, '/login');
    await sleep(600);
    await login(page, verifFarmer2, PW);
    await waitForUrl(page, '/farmer/dashboard');
    await page.goto(BASE + '/farmer/verification', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#fullName', { timeout: 15000 });
    await fillVerificationForm(page, verifFarm2, 'UI Second Farmer');
    await uploadVerificationDocs(page);
    await clickByText(page, 'Submit Verification');
    await page.waitForFunction(
      () => document.body.innerText.includes('under review'),
      { timeout: 20000 }
    );
    (await hasText(page, 'under review'))
      ? ok('second farmer verification submitted -> PENDING')
      : bad('verif2 submit', 'second farmer PENDING screen not shown');
    await logout(page);
    await waitForUrl(page, '/login');

    // --- admin: reject the second farmer with a reason, approve the first ---
    await login(page, adminEmail, adminPass);
    await waitForUrl(page, '/admin/dashboard');
    await page.goto(BASE + '/admin/verification', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.av-card', { timeout: 20000 }).catch(() => {});
    const rejected = await adminCardAction(page, verifFarmer2, '.av-reject');
    rejected
      ? ok('admin finds second farmer in pending verification list')
      : bad('admin reject card', 'could not find card for ' + verifFarmer2);
    if (rejected) {
      await page.waitForSelector('#reject-reason', { timeout: 10000 });
      await typeText(page, '#reject-reason', 'Land certificate unclear — please re-upload');
      await clickByText(page, 'Confirm Rejection');
      await page.waitForSelector('.alert-success', { timeout: 15000 }).catch(() => {});
      (await page.$('.alert-success'))
        ? ok('admin rejects second farmer with reason')
        : bad('admin reject', 'no success alert after rejection');
    }

    const approved = await adminCardAction(page, verifFarmer, '.av-approve');
    approved
      ? ok('admin finds first farmer in pending verification list')
      : bad('admin approve card', 'could not find card for ' + verifFarmer);
    if (approved) {
      // The approve button now opens the design-system ConfirmDialog —
      // click its primary (confirm) button to finish the approval.
      await page
        .waitForSelector('.fb-modal-footer .fb-btn-primary', { timeout: 8000 })
        .catch(() => {});
      const confirmApproveBtn = await page.$('.fb-modal-footer .fb-btn-primary');
      if (confirmApproveBtn) {
        await confirmApproveBtn.click();
      }
      await page.waitForSelector('.alert-success', { timeout: 15000 }).catch(() => {});
      (await page.$('.alert-success'))
        ? ok('admin approves first farmer')
        : bad('admin approve', 'no success alert after approval');
    }
    await page.screenshot({ path: path.join(SHOT_DIR, 'admin-verification-actions.png') }).catch(() => {});
    await logout(page);
    await waitForUrl(page, '/login');

    // --- rejected farmer sees the reason + can resubmit ---
    await login(page, verifFarmer2, PW);
    await waitForUrl(page, '/farmer/dashboard');
    await page.goto(BASE + '/farmer/verification', { waitUntil: 'networkidle2' });
    await page.waitForFunction(
      () => document.body.innerText.includes('Verification rejected'),
      { timeout: 15000 }
    );
    (await hasText(page, 'Land certificate unclear'))
      ? ok('rejected farmer sees the stored rejection reason')
      : bad('reject reason', 'rejection reason not displayed');
    await page.screenshot({ path: path.join(SHOT_DIR, 'farmer-verification-rejected.png') }).catch(() => {});
    await clickByText(page, 'Update & Resubmit');
    await page.waitForSelector('#fullName', { timeout: 10000 });
    await clickByText(page, 'Submit Verification');
    await page.waitForFunction(
      () => document.body.innerText.includes('under review'),
      { timeout: 20000 }
    );
    (await hasText(page, 'under review'))
      ? ok('rejected farmer resubmits -> PENDING again')
      : bad('resubmit', 'PENDING screen not shown after resubmit');
    await logout(page);
    await waitForUrl(page, '/login');

    // --- approved farmer: APPROVED screen + can create products ---
    await login(page, verifFarmer, PW);
    await waitForUrl(page, '/farmer/dashboard');
    await page.goto(BASE + '/farmer/verification', { waitUntil: 'networkidle2' });
    await page.waitForFunction(
      () => document.body.innerText.includes('Verified Farmer'),
      { timeout: 15000 }
    );
    (await hasText(page, 'Verified Farmer'))
      ? ok('approved farmer sees Verified Farmer screen')
      : bad('approved screen', 'Verified Farmer screen not shown');
    await page.screenshot({ path: path.join(SHOT_DIR, 'farmer-verification-approved.png') }).catch(() => {});

    await page.goto(BASE + '/farmer/products/add', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#name', { timeout: 15000 });
    const verifProduct = `UI Verified Crop ${TS}`;
    await typeText(page, '#name', verifProduct);
    await setSelect(page, '#category', 'Grains');
    await typeText(page, '#description', 'Created by the verification UI test');
    await typeText(page, '#price', '55');
    await typeText(page, '#quantity', '30');
    await clickByText(page, 'Create Product');
    await waitForUrl(page, '/farmer/products', 20000);
    await sleep(1200);
    (await hasText(page, verifProduct))
      ? ok('approved farmer creates product through the UI')
      : bad('approved create product', 'product not visible after create');
    await logout(page);
    await waitForUrl(page, '/login');

    // --- buyer sees the Verified Farmer badge on the new product card ---
    // (buyers now land on their analytics dashboard after login)
    await login(page, buyerEmail, PW);
    await waitForUrl(page, '/buyer/dashboard');
    await page.goto(BASE + '/buyer/products', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.bp-card', { timeout: 15000 });
    const badgeShown = await page.evaluate((productName) => {
      const cards = Array.from(document.querySelectorAll('.bp-card'));
      const card = cards.find((c) => c.innerText.includes(productName));
      return card ? Boolean(card.querySelector('.bp-verified')) : false;
    }, verifProduct);
    badgeShown
      ? ok('buyer sees Verified Farmer badge on the approved farmer\'s product card')
      : bad('buyer badge', 'no .bp-verified badge on the new product card');
    await page.screenshot({ path: path.join(SHOT_DIR, 'buyer-verified-badge.png') }).catch(() => {});
    await logout(page);
    await waitForUrl(page, '/login');
    ok('verification flow logout');

    // ============================================================
    console.log('\n===== ANALYTICS DASHBOARDS =====');

    // --- Admin analytics dashboard ---
    await login(page, adminEmail, adminPass);
    await waitForUrl(page, '/admin/dashboard');
    await page.waitForSelector('.an-stats-grid', { timeout: 20000 });
    await sleep(2500); // let the charts + animated counters settle
    const adminDash = await bodyText(page);
    adminDash.includes('Analytics Dashboard') &&
      adminDash.includes('Total Users') &&
      adminDash.includes('Platform Revenue')
      ? ok('admin analytics dashboard renders stat cards')
      : bad('admin dashboard', 'missing cards/title');
    adminDash.includes('Revenue Per Month') &&
      adminDash.includes('Top Selling Categories')
      ? ok('admin analytics dashboard renders charts')
      : bad('admin charts', 'missing chart panels');
    adminDash.includes('Latest Orders') &&
      adminDash.includes('Low Stock Products') &&
      adminDash.includes('Latest Reviews')
      ? ok('admin analytics dashboard renders tables')
      : bad('admin tables', 'missing table panels');
    const adminCharts = await page.$$('.recharts-responsive-container');
    adminCharts.length >= 6
      ? ok('admin dashboard renders 6+ real recharts charts (' + adminCharts.length + ')')
      : bad('admin charts count', 'found ' + adminCharts.length);
    await page.screenshot({ path: path.join(SHOT_DIR, 'admin-analytics.png') }).catch(() => {});
    await logout(page);
    await waitForUrl(page, '/login');

    // --- Farmer analytics dashboard ---
    await login(page, farmerEmail, farmerPass);
    await waitForUrl(page, '/farmer/dashboard');
    await page.waitForSelector('.fa-cards', { timeout: 20000 });
    await sleep(2500);
    const farmDash = await bodyText(page);
    farmDash.includes('Business Overview') &&
      farmDash.includes('Today\'s Orders') &&
      farmDash.includes('Total Revenue')
      ? ok('farmer analytics dashboard renders stat cards')
      : bad('farmer dashboard', 'missing cards');
    farmDash.includes('Performance Charts') &&
      farmDash.includes('Revenue Trend') &&
      farmDash.includes('Rating Trend')
      ? ok('farmer analytics dashboard renders charts')
      : bad('farmer charts', 'missing chart panels');
    farmDash.includes('Recent Orders') &&
      farmDash.includes('Top Customers')
      ? ok('farmer analytics dashboard renders sections')
      : bad('farmer sections', 'missing sections');
    // All six chart panels render; empty-state panels (no data yet) show
    // the real "No data" placeholder instead of a chart.
    const farmPanels = await page.$$('.fa-charts .fa-panel');
    const farmCharts = await page.$$('.recharts-responsive-container');
    farmPanels.length >= 6 && farmCharts.length >= 1
      ? ok('farmer dashboard renders all 6 chart panels (' + farmPanels.length + ' panels, ' + farmCharts.length + ' live charts)')
      : bad('farmer charts count', 'panels=' + farmPanels.length + ' charts=' + farmCharts.length);
    await page.screenshot({ path: path.join(SHOT_DIR, 'farmer-analytics.png') }).catch(() => {});
    await logout(page);
    await waitForUrl(page, '/login');

    // --- Buyer analytics dashboard (fresh buyer lands here by default) ---
    await login(page, buyerEmail, PW);
    await waitForUrl(page, '/buyer/dashboard');
    await page.waitForSelector('.bd-cards', { timeout: 20000 });
    await sleep(2500);
    const buyerDash = await bodyText(page);
    buyerDash.includes('My Dashboard') &&
      buyerDash.includes('Money Spent') &&
      buyerDash.includes('Favorite Category')
      ? ok('buyer analytics dashboard renders stat cards')
      : bad('buyer dashboard', 'missing cards');
    buyerDash.includes('Monthly Spending') &&
      buyerDash.includes('Orders Timeline')
      ? ok('buyer analytics dashboard renders charts')
      : bad('buyer charts', 'missing chart panels');
    buyerDash.includes('Recently Viewed') &&
      buyerDash.includes('Recommended For You')
      ? ok('buyer analytics dashboard renders sections')
      : bad('buyer sections', 'missing sections');
    // All three chart panels render; the spending panel shows a real
    // empty state until the buyer has completed orders.
    const buyerPanels = await page.$$('.bd-charts .bd-panel');
    const buyerCharts = await page.$$('.recharts-responsive-container');
    buyerPanels.length >= 3 && buyerCharts.length >= 1
      ? ok('buyer dashboard renders all 3 chart panels (' + buyerPanels.length + ' panels, ' + buyerCharts.length + ' live charts)')
      : bad('buyer charts count', 'panels=' + buyerPanels.length + ' charts=' + buyerCharts.length);
    await page.screenshot({ path: path.join(SHOT_DIR, 'buyer-analytics.png') }).catch(() => {});
    await logout(page);
    await waitForUrl(page, '/login');
    ok('analytics dashboards logout');

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
