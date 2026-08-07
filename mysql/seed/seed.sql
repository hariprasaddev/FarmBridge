-- ============================================================
-- FarmBridge — one-time seed for the Compose MySQL database
-- ADF Phase 12 · Step 3
--
-- WHY THIS EXISTS: the app has no ADMIN self-registration and no
-- in-app data seeder, so a fresh Compose database is empty except
-- for the schema created by the backend (ddl-auto=update). This
-- script seeds the accounts the stack needs to be usable:
--   * a general admin (admin@farmbridge.com)
--   * the exact QA accounts consumed by qa/uitest.js
--   * an approved farmer profile + products for the QA farmer
--
-- HOW TO RUN (after `docker compose up -d` and once the backend has
-- created the schema — i.e. after the backend service is healthy):
--
--   docker compose exec -T mysql sh -c \
--     'mysql -ufarmbridge -p"$MYSQL_PASSWORD" farmbridge' < mysql/seed/seed.sql
--
-- IDEMPOTENT: every statement guards on existence; safe to re-run.
--
-- ⚠ SECURITY: the passwords behind these BCrypt hashes are LOCAL-DEV
-- placeholders (Admin@12345 / AdminPass123! / Passw0rd!123). In a
-- real deployment, replace this seeding with a proper credentials
-- secret and change every password immediately.
-- ============================================================

-- ------------------------------------------------------------------
-- 1. General admin account (placeholder password Admin@12345)
-- ------------------------------------------------------------------
INSERT INTO users (name, email, password, role, active, created_at)
SELECT 'FarmBridge Admin', 'admin@farmbridge.com',
       '$2a$10$5Lt8vVOp3FSacC5p3C4tbO06YhF7lThmGakPG6Ed.NO4E9uTwLkCW',
       'ADMIN', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@farmbridge.com');

-- ------------------------------------------------------------------
-- 2. QA admin account consumed by qa/uitest.js (AdminPass123!)
-- ------------------------------------------------------------------
INSERT INTO users (name, email, password, role, active, created_at)
SELECT 'QA Admin', 'qa_admin_1785918721@test.com',
       '$2a$10$f7eE2JuWn56ztadNOC.f4OUGthXJuXYjiKV0ESANG4vyxkmjmO3nW',
       'ADMIN', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'qa_admin_1785918721@test.com');

-- ------------------------------------------------------------------
-- 3. QA farmer account consumed by qa/uitest.js (Passw0rd!123)
-- ------------------------------------------------------------------
INSERT INTO users (name, email, password, role, active, created_at)
SELECT 'QA Farmer One', 'qa_farmer1_1785918721@test.com',
       '$2a$10$LOHbpY5oS7kK6qASgAC8T.ch.PWkOUI2062M/Zb4jbVsCxa2cidQC',
       'FARMER', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'qa_farmer1_1785918721@test.com');

-- Approved farmer profile so the farmer dashboard + add-product flows work.
INSERT INTO farmer_profiles
  (user_id, full_name, mobile_number, village, mandal, district, state,
   farm_name, location, farm_address, land_size, cultivation_method,
   crops_cultivated, farming_experience, verified, verification_status,
   submitted_at)
SELECT u.id, 'QA Farmer One', '9876543210', 'Test Village', 'Test Mandal',
       'Test District', 'Telangana', 'QA Test Farm',
       'Test Village, Test Mandal, Test District, Telangana',
       'Survey 45, Test Village', 6.5, 'ORGANIC', 'Rice, Cotton', '8 years',
       TRUE, 'APPROVED', NOW()
FROM users u
WHERE u.email = 'qa_farmer1_1785918721@test.com'
  AND NOT EXISTS (SELECT 1 FROM farmer_profiles fp WHERE fp.user_id = u.id);

-- ------------------------------------------------------------------
-- 4. A few products for the QA farmer (buyer browsing + dashboard stats)
-- ------------------------------------------------------------------
INSERT INTO products (name, description, price, quantity, category, image_url, farmer_id)
SELECT 'Organic Rice', 'Premium organic rice from a verified farm',
       120.00, 500, 'Grains', NULL, u.id
FROM users u
WHERE u.email = 'qa_farmer1_1785918721@test.com'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'Organic Rice' AND p.farmer_id = u.id);

INSERT INTO products (name, description, price, quantity, category, image_url, farmer_id)
SELECT 'Fresh Tomatoes', 'Farm-fresh red tomatoes, harvested daily',
       40.00, 300, 'Vegetables', NULL, u.id
FROM users u
WHERE u.email = 'qa_farmer1_1785918721@test.com'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'Fresh Tomatoes' AND p.farmer_id = u.id);

INSERT INTO products (name, description, price, quantity, category, image_url, farmer_id)
SELECT 'Alphonso Mangoes', 'Sweet Alphonso mangoes in season',
       250.00, 100, 'Fruits', NULL, u.id
FROM users u
WHERE u.email = 'qa_farmer1_1785918721@test.com'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'Alphonso Mangoes' AND p.farmer_id = u.id);

INSERT INTO products (name, description, price, quantity, category, image_url, farmer_id)
SELECT 'Fresh Milk', 'Raw cow milk, 1 litre pack',
       60.00, 200, 'Dairy', NULL, u.id
FROM users u
WHERE u.email = 'qa_farmer1_1785918721@test.com'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'Fresh Milk' AND p.farmer_id = u.id);
