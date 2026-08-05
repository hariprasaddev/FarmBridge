#!/usr/bin/env bash
# ============================================================
# FarmBridge — Backend end-to-end API test suite
# Tests every module: auth, products, orders, reviews,
# wishlist, notifications, password reset, admin.
# Requires: backend on :8080, MySQL running, python, curl,
# compiled DbTool/HashTool in qa/.
# ============================================================
set -u

BASE="http://localhost:8080"
TS=$(date +%s)
QA_DIR="$(cd "$(dirname "$0")" && pwd)"
TMP="$QA_DIR/.resp"

PASS=0; FAIL=0
declare -a FAILED=()

# ---------- unique test accounts ----------
B1="qa_buyer1_${TS}@test.com"     # main buyer (orders, reviews, wishlist)
B2="qa_buyer2_${TS}@test.com"     # second buyer (non-purchased review, aggregation)
PWD="qa_pwd_${TS}@test.com"       # password-reset user
F1="qa_farmer1_${TS}@test.com"    # main farmer
F2="qa_farmer2_${TS}@test.com"    # second farmer (ownership violations)
ADM="qa_admin_${TS}@test.com"     # seeded admin
PW="Passw0rd!123"

MYSQL_JAR=$(find ~/.m2/repository/com/mysql/mysql-connector-j -name 'mysql-connector-j-9.*.jar' ! -name '*sources*' ! -name '*javadoc*' 2>/dev/null | head -1)
CRYPTO_JAR=$(find ~/.m2/repository/org/springframework/security/spring-security-crypto -name 'spring-security-crypto-6.*.jar' ! -name '*sources*' ! -name '*javadoc*' 2>/dev/null | head -1)
CL_JAR=$(find ~/.m2/repository/commons-logging/commons-logging -name 'commons-logging-*.jar' ! -name '*sources*' 2>/dev/null | head -1)

# ---------- request / check helpers ----------
call() { # method path [json] [token]
  local method="$1" path="$2" data="${3:-}" token="${4:-}"
  local args=(-sS -X "$method" "$BASE$path" -H 'Content-Type: application/json')
  [ -n "$data" ] && args+=(-d "$data")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  RESP_CODE=$(curl "${args[@]}" -o "$TMP" -w '%{http_code}')
  RESP_BODY=$(cat "$TMP" | tr -d '\r')
}

check() { # name expected_code [body_contains]
  local name="$1" expected="$2" contains="${3:-}"
  if [ "$RESP_CODE" != "$expected" ]; then
    echo "FAIL [$RESP_CODE|exp $expected] $name -> $(echo "$RESP_BODY" | head -c 160)"
    FAIL=$((FAIL+1)); FAILED+=("$name")
    return
  fi
  if [ -n "$contains" ] && ! echo "$RESP_BODY" | grep -qiF "$contains"; then
    echo "FAIL [body] $name -> missing '$contains' in: $(echo "$RESP_BODY" | head -c 160)"
    FAIL=$((FAIL+1)); FAILED+=("$name")
    return
  fi
  echo "PASS $name"
  PASS=$((PASS+1))
}

jf() { printf '%s' "$RESP_BODY" | python -c "import sys,json
d=json.load(sys.stdin)
print(d.get('$1','') if isinstance(d,dict) else len(d))"; }
ja() { printf '%s' "$RESP_BODY" | python -c "import sys,json
d=json.load(sys.stdin)
print(len(d) if isinstance(d,list) else 0)"; }
ji() { printf '%s' "$RESP_BODY" | python -c "import sys,json
d=json.load(sys.stdin)
print(d[$1].get('$2',''))"; }
jjson() { printf '%s' "$RESP_BODY" | python -c "import sys,json
print(json.dumps(json.load(sys.stdin)))"; }

section() { echo; echo "======== $1 ========"; }

# Submit a verification request (multipart form fields + optional files).
# Usage: verify_post <token> [extra -F args...]
verify_post() {
  local token="$1"; shift
  curl -sS -X POST "$BASE/api/farmer/profile/verification" -H "Authorization: Bearer $token" \
    -F "fullName=QA Farmer One" -F "mobileNumber=9876543210" -F "village=TestVillage" \
    -F "mandal=TestMandal" -F "district=TestDistrict" -F "state=Telangana" \
    -F "farmName=QA Green Valley" -F "farmAddress=Survey 45, TestVillage" -F "farmSize=15.5" \
    -F "cultivationMethod=ORGANIC" -F "mainCrops=Rice, Wheat" -F "farmingExperience=10 years" \
    "$@" -o "$TMP" -w '%{http_code}'
}

# ============================================================
section "AUTHENTICATION"
# ============================================================

call POST /api/auth/register "{\"name\":\"QA Buyer One\",\"email\":\"$B1\",\"password\":\"$PW\",\"role\":\"BUYER\"}"
check "register BUYER" 200 "User Registered Successfully"

call POST /api/auth/register "{\"name\":\"QA Farmer One\",\"email\":\"$F1\",\"password\":\"$PW\",\"role\":\"FARMER\"}"
check "register FARMER" 200 "User Registered Successfully"

call POST /api/auth/register "{\"name\":\"QA Farmer Two\",\"email\":\"$F2\",\"password\":\"$PW\",\"role\":\"FARMER\"}"
check "register FARMER #2" 200 "User Registered Successfully"

call POST /api/auth/register "{\"name\":\"QA Buyer Two\",\"email\":\"$B2\",\"password\":\"$PW\",\"role\":\"BUYER\"}"
check "register BUYER #2" 200 "User Registered Successfully"

call POST /api/auth/register "{\"name\":\"QA Buyer One\",\"email\":\"$B1\",\"password\":\"$PW\",\"role\":\"BUYER\"}"
check "duplicate registration" 409 "already exists"

call POST /api/auth/register "{\"name\":\"Hacker\",\"email\":\"hacker_${TS}@test.com\",\"password\":\"$PW\",\"role\":\"ADMIN\"}"
check "self-register ADMIN blocked (privilege escalation)" 400 "Only FARMER and BUYER"

call POST /api/auth/register "{\"name\":\"NoRole\",\"email\":\"norole_${TS}@test.com\",\"password\":\"$PW\"}"
check "register without role blocked" 400 "Only FARMER and BUYER"

call POST /api/auth/register "{\"name\":\"Bad\",\"email\":\"not-an-email\",\"password\":\"$PW\",\"role\":\"BUYER\"}"
check "register invalid email" 400 "Validation failed"

call POST /api/auth/register "{\"name\":\"\",\"email\":\"x_${TS}@test.com\",\"password\":\"$PW\",\"role\":\"BUYER\"}"
check "register blank name" 400 "Validation failed"

call POST /api/auth/login "{\"email\":\"$B1\",\"password\":\"$PW\"}"
check "login buyer" 200 "Login successful"
B1_TOKEN=$(jf token)

call POST /api/auth/login "{\"email\":\"$F1\",\"password\":\"$PW\"}"
check "login farmer" 200 "Login successful"
F1_TOKEN=$(jf token)

call POST /api/auth/login "{\"email\":\"$F2\",\"password\":\"$PW\"}"
F2_TOKEN=$(jf token)

call POST /api/auth/login "{\"email\":\"$B2\",\"password\":\"$PW\"}"
B2_TOKEN=$(jf token)

call POST /api/auth/login "{\"email\":\"$B1\",\"password\":\"wrong-password\"}"
check "login wrong password" 400 "Invalid email or password"

call POST /api/auth/login "{\"email\":\"ghost_${TS}@test.com\",\"password\":\"$PW\"}"
check "login unknown email" 400 "Invalid email or password"

call POST /api/auth/login "{\"email\":\"$B1\"}"
check "login missing password" 400 "Validation failed"

call GET /api/farmer/products
check "no token on protected endpoint" 403

call GET /api/farmer/products "" "Bearer invalid.token.here"
check "invalid JWT rejected" 403

call GET /api/farmer/products "" "Bearer $B1_TOKEN"
check "BUYER on /api/farmer/** -> 403" 403

call GET /api/buyer/products "" "Bearer $F1_TOKEN"
check "FARMER on /api/buyer/** -> 403" 403

call GET /api/admin/stats "" "Bearer $B1_TOKEN"
check "BUYER on /api/admin/** -> 403" 403

call GET /api/test "" "$B1_TOKEN"
check "authenticated /api/test (any role)" 200 "JWT Authentication is working!"

# ---------- seed admin early (needed by the verification workflow) ----------
if [ -n "$MYSQL_JAR" ] && [ -n "$CRYPTO_JAR" ]; then
  ADMIN_HASH=$(java -cp "$(cygpath -w "$QA_DIR/classes");$(cygpath -w "$CRYPTO_JAR");$(cygpath -w "$CL_JAR")" HashTool "AdminPass123!" 2>/dev/null | tr -d '\r\n ')
  java -cp "$(cygpath -w "$QA_DIR/classes");$(cygpath -w "$MYSQL_JAR")" DbTool insert-admin "$ADM" "QA Admin" "$ADMIN_HASH" > /dev/null 2>&1
  echo "note: admin account seeded ($ADM)"
else
  echo "note: jars missing — cannot seed admin"; ADM=""
fi

call POST /api/auth/login "{\"email\":\"$ADM\",\"password\":\"AdminPass123!\"}"
check "admin login" 200 "Login successful"
ADM_TOKEN=$(jf token)

# ============================================================
section "FARMER PROFILE"
# ============================================================

call POST /api/farmer/profile "{\"farmName\":\"QA Green Valley\",\"location\":\"Rural District\",\"landSize\":15.5,\"cultivationMethod\":\"Organic\",\"cropsCultivated\":\"Rice, Wheat\",\"farmingType\":\"Subsistence\"}" "$F1_TOKEN"
check "farmer creates profile" 200 "QA Green Valley"

call POST /api/farmer/profile "{\"farmName\":\"QA Dup\",\"location\":\"X\",\"landSize\":1.0,\"cultivationMethod\":\"A\",\"cropsCultivated\":\"B\",\"farmingType\":\"C\"}" "$F1_TOKEN"
check "duplicate profile blocked" 409 "already exists"

call POST /api/farmer/profile "{\"farmName\":\"\",\"location\":\"X\",\"landSize\":1.0,\"cultivationMethod\":\"A\",\"cropsCultivated\":\"B\",\"farmingType\":\"C\"}" "$F1_TOKEN"
check "profile validation blank farmName" 400 "Validation failed"

call GET /api/farmer/profile "" "$F1_TOKEN"
check "get my profile" 200 "QA Green Valley"

call PUT /api/farmer/profile "{\"farmName\":\"QA Green Valley Updated\",\"location\":\"North District\",\"landSize\":20.0,\"cultivationMethod\":\"Organic\",\"cropsCultivated\":\"Rice, Wheat, Corn\",\"farmingType\":\"Commercial\"}" "$F1_TOKEN"
check "update my profile" 200 "QA Green Valley Updated"

call GET /api/farmer/profile "" "$F2_TOKEN"
check "farmer without profile -> 404" 404 "Farmer profile not found"

# ============================================================
section "FARMER VERIFICATION"
# ============================================================

# Generate a tiny valid PNG used for document uploads (also reused by
# the product-image tests later).
python - "$QA_DIR/test.png" <<'PYEOF'
import struct, zlib, sys
def chunk(t, d):
    c = t + d
    return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c))
sig = b'\x89PNG\r\n\x1a\n'
ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
idat = chunk(b'IDAT', zlib.compress(b'\x00\xff\x00\x00'))
iend = chunk(b'IEND', b'')
open(sys.argv[1], 'wb').write(sig + ihdr + idat + iend)
PYEOF
echo "note: wrote test image"

echo "not an image" > "$QA_DIR/not_image.txt"

# --- F1 submits a valid verification request ---
VERIFY_OUT=$(verify_post "$F1_TOKEN" -F "farmerPhoto=@$(cygpath -w "$QA_DIR/test.png")" -F "landCertificate=@$(cygpath -w "$QA_DIR/test.png")" -F "farmPhoto=@$(cygpath -w "$QA_DIR/test.png")")
VERIFY_BODY=$(cat "$TMP" | tr -d '\r')
if [ "$VERIFY_OUT" == "200" ] && echo "$VERIFY_BODY" | grep -q '"PENDING"'; then
  echo "PASS farmer submits verification -> PENDING"; PASS=$((PASS+1))
else
  echo "FAIL farmer submits verification (code=$VERIFY_OUT body=$(echo "$VERIFY_BODY" | head -c 200))"; FAIL=$((FAIL+1)); FAILED+=("submit verification"); fi

call GET /api/farmer/profile/verification "" "$F1_TOKEN"
check "farmer sees own verification status" 200 "PENDING"

# --- PENDING farmer cannot create products (403) ---
call POST /api/farmer/products "{\"name\":\"QA Blocked $TS\",\"price\":10,\"quantity\":5,\"category\":\"Grains\"}" "$F1_TOKEN"
check "unverified farmer create product -> 403" 403 "not been verified"

call PUT /api/farmer/products/1 "{\"name\":\"QA Blocked Update\",\"price\":10,\"quantity\":5,\"category\":\"Grains\"}" "$F1_TOKEN"
check "unverified farmer update product -> 403" 403 "not been verified"

# --- security: BUYER / anonymous cannot touch verification endpoints ---
call GET /api/farmer/profile/verification "" "$B1_TOKEN"
check "BUYER on farmer verification -> 403" 403

call GET /api/farmer/profile/verification
check "verification requires auth -> 403" 403

# --- farmer without submission -> 404 ---
call GET /api/farmer/profile/verification "" "$F2_TOKEN"
check "verification status without submission -> 404" 404 "Farmer profile not found"

# --- missing documents -> 400 ---
MISS_OUT=$(verify_post "$F2_TOKEN")
MISS_BODY=$(cat "$TMP" | tr -d '\r')
if [ "$MISS_OUT" == "400" ] && echo "$MISS_BODY" | grep -q "Farmer photo is required"; then
  echo "PASS missing documents rejected (400)"; PASS=$((PASS+1))
else
  echo "FAIL missing documents (code=$MISS_OUT body=$(echo "$MISS_BODY" | head -c 200))"; FAIL=$((FAIL+1)); FAILED+=("missing documents"); fi

# --- invalid (non-image) upload -> 400 ---
INV_OUT=$(verify_post "$F2_TOKEN" -F "farmerPhoto=@$(cygpath -w "$QA_DIR/not_image.txt")" -F "landCertificate=@$(cygpath -w "$QA_DIR/test.png")" -F "farmPhoto=@$(cygpath -w "$QA_DIR/test.png")")
INV_BODY=$(cat "$TMP" | tr -d '\r')
if [ "$INV_OUT" == "400" ] && echo "$INV_BODY" | grep -q "Only image files"; then
  echo "PASS invalid upload rejected (400)"; PASS=$((PASS+1))
else
  echo "FAIL invalid upload (code=$INV_OUT body=$(echo "$INV_BODY" | head -c 200))"; FAIL=$((FAIL+1)); FAILED+=("invalid upload"); fi

# --- bean validation: bad mobile number -> 400 ---
BAD_MOB_OUT=$(curl -sS -X POST "$BASE/api/farmer/profile/verification" -H "Authorization: Bearer $F2_TOKEN" \
  -F "fullName=QA Farmer Two" -F "mobileNumber=123" -F "village=V" -F "mandal=M" -F "district=D" -F "state=S" \
  -F "farmName=F2 Farm" -F "farmAddress=A" -F "farmSize=5" -F "cultivationMethod=NATURAL" \
  -F "mainCrops=Crops" -F "farmingExperience=2 years" \
  -F "farmerPhoto=@$(cygpath -w "$QA_DIR/test.png")" -F "landCertificate=@$(cygpath -w "$QA_DIR/test.png")" -F "farmPhoto=@$(cygpath -w "$QA_DIR/test.png")" \
  -o "$TMP" -w '%{http_code}')
BAD_MOB_BODY=$(cat "$TMP" | tr -d '\r')
if [ "$BAD_MOB_OUT" == "400" ] && echo "$BAD_MOB_BODY" | grep -q "Validation failed"; then
  echo "PASS invalid mobile number rejected (400)"; PASS=$((PASS+1))
else
  echo "FAIL invalid mobile (code=$BAD_MOB_OUT body=$(echo "$BAD_MOB_BODY" | head -c 200))"; FAIL=$((FAIL+1)); FAILED+=("invalid mobile"); fi

# --- F2 submits a valid verification request ---
VERIFY2_OUT=$(verify_post "$F2_TOKEN" -F "farmerPhoto=@$(cygpath -w "$QA_DIR/test.png")" -F "landCertificate=@$(cygpath -w "$QA_DIR/test.png")" -F "farmPhoto=@$(cygpath -w "$QA_DIR/test.png")")
VERIFY2_BODY=$(cat "$TMP" | tr -d '\r')
if [ "$VERIFY2_OUT" == "200" ] && echo "$VERIFY2_BODY" | grep -q '"PENDING"'; then
  echo "PASS farmer2 submits verification -> PENDING"; PASS=$((PASS+1))
else
  echo "FAIL farmer2 submits verification (code=$VERIFY2_OUT body=$(echo "$VERIFY2_BODY" | head -c 200))"; FAIL=$((FAIL+1)); FAILED+=("submit verification 2"); fi

# --- admin sees both pending requests ---
call GET /api/admin/farmers/unverified "" "$ADM_TOKEN"
check "admin lists pending verifications" 200
if echo "$RESP_BODY" | grep -q "$F1"; then echo "PASS F1 in pending list"; PASS=$((PASS+1)); else echo "FAIL F1 missing from pending list"; FAIL=$((FAIL+1)); FAILED+=("F1 in pending list"); fi
if echo "$RESP_BODY" | grep -q "$F2"; then echo "PASS F2 in pending list"; PASS=$((PASS+1)); else echo "FAIL F2 missing from pending list"; FAIL=$((FAIL+1)); FAILED+=("F2 in pending list"); fi

F1_PROFILE_ID=$(printf '%s' "$RESP_BODY" | python -c "
import sys,json
d=json.load(sys.stdin)
for p in d:
    if p.get('email')=='$F1': print(p.get('profileId')); break")
F2_PROFILE_ID=$(printf '%s' "$RESP_BODY" | python -c "
import sys,json
d=json.load(sys.stdin)
for p in d:
    if p.get('email')=='$F2': print(p.get('profileId')); break")

# --- admin approves F1 ---
call PUT /api/admin/farmers/$F1_PROFILE_ID/verify "" "$ADM_TOKEN"
check "admin approves F1" 200 "APPROVED"

# --- admin rejects F2 with a reason ---
call PUT /api/admin/farmers/$F2_PROFILE_ID/reject "{\"reason\":\"Land certificate is illegible, please re-upload\"}" "$ADM_TOKEN"
check "admin rejects F2 with reason" 200 "REJECTED"

call PUT /api/admin/farmers/$F2_PROFILE_ID/reject "{\"reason\":\"\"}" "$ADM_TOKEN"
check "reject without reason -> 400" 400 "Validation failed"

# --- farmer sees the stored rejection reason ---
call GET /api/farmer/profile/verification "" "$F2_TOKEN"
check "F2 sees rejection reason" 200 "Land certificate is illegible"

# --- rejected farmer is still blocked ---
call POST /api/farmer/products "{\"name\":\"QA Blocked2 $TS\",\"price\":10,\"quantity\":5,\"category\":\"Grains\"}" "$F2_TOKEN"
check "rejected farmer create product -> 403" 403 "not been verified"

# --- F2 resubmits (keeps documents) -> PENDING again ---
RESUB_OUT=$(verify_post "$F2_TOKEN")
RESUB_BODY=$(cat "$TMP" | tr -d '\r')
if [ "$RESUB_OUT" == "200" ] && echo "$RESUB_BODY" | grep -q '"PENDING"'; then
  echo "PASS F2 resubmits without documents -> PENDING"; PASS=$((PASS+1))
else
  echo "FAIL F2 resubmit (code=$RESUB_OUT body=$(echo "$RESUB_BODY" | head -c 200))"; FAIL=$((FAIL+1)); FAILED+=("resubmit"); fi

# --- admin approves F2 after resubmit ---
call PUT /api/admin/farmers/$F2_PROFILE_ID/verify "" "$ADM_TOKEN"
check "admin approves F2 after resubmit" 200 "APPROVED"

# --- approved farmer can now create + delete products ---
call POST /api/farmer/products "{\"name\":\"QA After Approval $TS\",\"price\":10,\"quantity\":5,\"category\":\"Grains\"}" "$F1_TOKEN"
check "approved farmer creates product" 201 "QA After Approval"
AFTER_PROD=$(jf id)
call DELETE /api/farmer/products/$AFTER_PROD "" "$F1_TOKEN"
check "approved farmer deletes product" 200 "deleted successfully"

# ============================================================
section "PRODUCTS"
# ============================================================

call POST /api/farmer/products "{\"name\":\"QA Organic Rice $TS\",\"description\":\"QA rice\",\"price\":100,\"quantity\":50,\"category\":\"Grains\"}" "$F1_TOKEN"
check "farmer creates product (201 Created)" 201 "QA Organic Rice"
PROD1=$(jf id)

call POST /api/farmer/products "{\"name\":\"QA Bad Price\",\"price\":0,\"quantity\":10,\"category\":\"Grains\"}" "$F1_TOKEN"
check "create product price<1 -> 400" 400 "Validation failed"

call POST /api/farmer/products "{\"name\":\"QA Bad Qty\",\"price\":10,\"quantity\":0,\"category\":\"Grains\"}" "$F1_TOKEN"
check "create product qty<1 -> 400" 400 "Validation failed"

call POST /api/farmer/products "{\"name\":\"\",\"price\":10,\"quantity\":5,\"category\":\"Grains\"}" "$F1_TOKEN"
check "create product blank name -> 400" 400 "Validation failed"

call POST /api/farmer/products "{\"name\":\"QA Apples $TS\",\"description\":\"QA apples\",\"price\":200,\"quantity\":30,\"category\":\"Fruits\"}" "$F2_TOKEN"
check "farmer2 creates product (201 Created)" 201 "QA Apples"
PROD2=$(jf id)

call POST /api/farmer/products "{\"name\":\"QA Wheat $TS\",\"description\":\"QA wheat\",\"price\":10,\"quantity\":100,\"category\":\"Grains\"}" "$F2_TOKEN"
check "farmer2 creates 2nd product (201 Created)" 201 "QA Wheat"
PROD3=$(jf id)

call PUT /api/farmer/products/$PROD1 "{\"name\":\"QA Organic Rice $TS\",\"description\":\"QA rice updated\",\"price\":120,\"quantity\":45,\"category\":\"Grains\"}" "$F1_TOKEN"
check "farmer updates own product" 200 "120"
EXPECTED_QTY=45

call PUT /api/farmer/products/$PROD1 "{\"name\":\"Hijack\",\"price\":1,\"quantity\":1,\"category\":\"Grains\"}" "$F2_TOKEN"
check "farmer2 updates farmer1 product -> 400" 400 "not allowed to update"

call GET /api/farmer/products/my-products "" "$F1_TOKEN"
check "farmer gets my products" 200 "QA Organic Rice"

call GET /api/buyer/products "" "$B1_TOKEN"
check "buyer browses all products" 200 "QA Organic Rice"

call GET /api/buyer/products/$PROD1 "" "$B1_TOKEN"
check "buyer gets product details" 200 "QA Organic Rice"
check "product details has rating fields" 200 "reviewCount"

call GET /api/buyer/products/999999999 "" "$B1_TOKEN"
check "product details not found -> 404" 404 "Product not found"

call GET /api/buyer/products/category/Grains "" "$B1_TOKEN"
check "category filter (Grains)" 200 "QA Organic Rice"
N_grains=$(ja)
[ "$N_grains" -ge 2 ] && { echo "PASS category filter returns >=2 items ($N_grains)"; PASS=$((PASS+1)); } \
  || { echo "FAIL category filter expected >=2 items, got $N_grains"; FAIL=$((FAIL+1)); FAILED+=("category filter count"); }

call GET /api/buyer/products/category/grains "" "$B1_TOKEN"
check "category filter case-insensitive" 200 "QA Organic Rice"

call GET /api/buyer/products/category/NoSuchCategory_$TS "" "$B1_TOKEN"
if [ "$RESP_CODE" == "200" ] && [ "$(printf '%s' "$RESP_BODY" | python -c 'import sys,json;print(len(json.load(sys.stdin)))')" == "0" ]; then
  echo "PASS unknown category returns empty list"; PASS=$((PASS+1))
else
  echo "FAIL unknown category should return empty list (code=$RESP_CODE)"; FAIL=$((FAIL+1)); FAILED+=("empty category")
fi

# --- image upload ---
python - "$QA_DIR/test.png" <<'PYEOF'
import struct, zlib, sys
def chunk(t, d):
    c = t + d
    return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c))
sig = b'\x89PNG\r\n\x1a\n'
ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
idat = chunk(b'IDAT', zlib.compress(b'\x00\xff\x00\x00'))
iend = chunk(b'IEND', b'')
open(sys.argv[1], 'wb').write(sig + ihdr + idat + iend)
PYEOF
echo "note: wrote test image"

UPLOAD_OUT=$(curl -sS -X POST "$BASE/api/farmer/products/$PROD1/image" -H "Authorization: Bearer $F1_TOKEN" -F "file=@$(cygpath -w "$QA_DIR/test.png")" -o "$TMP" -w '%{http_code}')
UPLOAD_BODY=$(cat "$TMP" | tr -d '\r')
if [ "$UPLOAD_OUT" == "200" ] && echo "$UPLOAD_BODY" | grep -qi "imageUrl"; then
  echo "PASS farmer uploads product image"; PASS=$((PASS+1))
  IMG_URL=$(printf '%s' "$UPLOAD_BODY" | python -c "import sys,json;print(json.load(sys.stdin).get('imageUrl',''))")
else
  echo "FAIL farmer uploads product image (code=$UPLOAD_OUT body=$(echo "$UPLOAD_BODY" | head -c 160))"; FAIL=$((FAIL+1)); FAILED+=("upload image")
  IMG_URL=""
fi

if [ -n "$IMG_URL" ]; then
  IMG_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$IMG_URL")
  [ "$IMG_CODE" == "200" ] && { echo "PASS uploaded image served publicly (200)"; PASS=$((PASS+1)); } \
    || { echo "FAIL uploaded image served publicly (code=$IMG_CODE)"; FAIL=$((FAIL+1)); FAILED+=("serve uploaded image"); }
fi

UPLOAD2=$(curl -sS -X POST "$BASE/api/farmer/products/$PROD1/image" -H "Authorization: Bearer $F2_TOKEN" -F "file=@$(cygpath -w "$QA_DIR/test.png")" -o "$TMP" -w '%{http_code}')
if [ "$UPLOAD2" == "400" ]; then
  echo "PASS non-owner image upload blocked"; PASS=$((PASS+1))
else
  echo "FAIL non-owner image upload (code=$UPLOAD2)"; FAIL=$((FAIL+1)); FAILED+=("non-owner upload")
fi

echo "not an image" > "$QA_DIR/not_image.txt"
UPLOAD3=$(curl -sS -X POST "$BASE/api/farmer/products/$PROD1/image" -H "Authorization: Bearer $F1_TOKEN" -F "file=@$(cygpath -w "$QA_DIR/not_image.txt")" -o "$TMP" -w '%{http_code}')
if [ "$UPLOAD3" == "400" ]; then
  echo "PASS non-image upload rejected"; PASS=$((PASS+1))
else
  echo "FAIL non-image upload (code=$UPLOAD3)"; FAIL=$((FAIL+1)); FAILED+=("non-image upload")
fi

# --- delete flows ---
call POST /api/farmer/products "{\"name\":\"QA Temp Product\",\"price\":5,\"quantity\":5,\"category\":\"Other\"}" "$F2_TOKEN"
TMPROD=$(jf id)
call DELETE /api/farmer/products/$TMPROD "" "$F2_TOKEN"
check "farmer deletes own product" 200 "deleted successfully"

call DELETE /api/farmer/products/$PROD1 "" "$F2_TOKEN"
check "farmer2 deletes farmer1 product -> 400" 400 "not allowed to delete"

call DELETE /api/farmer/products/999999999 "" "$F1_TOKEN"
check "delete non-existent product -> 404" 404 "Product not found"

# ============================================================
section "ORDERS"
# ============================================================

call POST /api/buyer/orders "{\"productId\":$PROD1,\"quantity\":5}" "$B1_TOKEN"
check "buyer places order" 201 "PENDING"
ORDER1=$(jf id)
TOTAL1=$(jf totalPrice)
if printf '%s' "$TOTAL1" | python -c "import sys; v=float(sys.stdin.read().strip()); sys.exit(0 if abs(v-600.0)<0.001 else 1)" 2>/dev/null; then
  echo "PASS order total price = 120*5 = 600 ($TOTAL1)"; PASS=$((PASS+1))
else
  echo "FAIL order total price expected 600 got $TOTAL1"; FAIL=$((FAIL+1)); FAILED+=("total price")
fi

call GET /api/buyer/products/$PROD1 "" "$B1_TOKEN"
QTY_AFTER=$(jf quantity)
if [ "$QTY_AFTER" == "40" ]; then
  echo "PASS stock deducted 45-5=40"; PASS=$((PASS+1))
else
  echo "FAIL stock deduction expected 40 got $QTY_AFTER"; FAIL=$((FAIL+1)); FAILED+=("stock deduction")
fi

call POST /api/buyer/orders "{\"productId\":$PROD1,\"quantity\":9999}" "$B1_TOKEN"
check "order exceeding stock -> 400" 400 "Insufficient product quantity"

call POST /api/buyer/orders "{\"productId\":999999999,\"quantity\":1}" "$B1_TOKEN"
check "order non-existent product -> 404" 404 "Product not found"

call POST /api/buyer/orders "{\"productId\":$PROD1,\"quantity\":0}" "$B1_TOKEN"
check "order qty 0 -> 400" 400 "Validation failed"

call POST /api/buyer/orders "{\"productId\":$PROD1,\"quantity\":3}" "$B2_TOKEN"
check "buyer2 places order" 201 "PENDING"
ORDER2=$(jf id)

call POST /api/buyer/orders "{\"productId\":$PROD1,\"quantity\":2}" "$B2_TOKEN"
check "buyer2 places 2nd order" 201 "PENDING"
ORDER3=$(jf id)

call GET /api/farmer/orders "" "$F1_TOKEN"
check "farmer sees received orders" 200 "QA Organic Rice"

call PUT /api/farmer/orders/$ORDER1/status "{\"status\":\"ACCEPTED\"}" "$F2_TOKEN"
check "farmer2 updates farmer1 order -> 400" 400 "not allowed to update this order"

call PUT /api/farmer/orders/999999999/status "{\"status\":\"ACCEPTED\"}" "$F1_TOKEN"
check "update non-existent order -> 404" 404 "Order not found"

call PUT /api/farmer/orders/$ORDER1/status "{\"status\":\"ACCEPTED\"}" "$F1_TOKEN"
check "farmer accepts order" 200 "ACCEPTED"

call PUT /api/farmer/orders/$ORDER1/status "{\"status\":\"REJECTED\"}" "$F1_TOKEN"
check "ACCEPTED->REJECTED invalid transition" 400 "Accepted order can only be COMPLETED"

call PUT /api/farmer/orders/$ORDER1/status "{\"status\":\"COMPLETED\"}" "$F1_TOKEN"
check "farmer completes order" 200 "COMPLETED"

call PUT /api/farmer/orders/$ORDER1/status "{\"status\":\"ACCEPTED\"}" "$F1_TOKEN"
check "COMPLETED locked (cannot change)" 400 "Completed order cannot be updated"

call GET /api/buyer/orders "" "$B1_TOKEN"
check "buyer sees own orders" 200 "QA Organic Rice"

# reject flow: ORDER2 (qty 3) — stock currently 40 (45-5)
call GET /api/buyer/products/$PROD1 "" "$B1_TOKEN"
QTY_BEFORE_REJECT=$(jf quantity)
call PUT /api/farmer/orders/$ORDER2/status "{\"status\":\"REJECTED\"}" "$F1_TOKEN"
check "farmer rejects order" 200 "REJECTED"

call GET /api/buyer/products/$PROD1 "" "$B1_TOKEN"
QTY_AFTER_REJECT=$(jf quantity)
if [ "$QTY_AFTER_REJECT" == "$((QTY_BEFORE_REJECT + 3))" ]; then
  echo "PASS stock restored after rejection ($QTY_BEFORE_REJECT -> $QTY_AFTER_REJECT)"; PASS=$((PASS+1))
else
  echo "FAIL stock restore expected $((QTY_BEFORE_REJECT + 3)) got $QTY_AFTER_REJECT"; FAIL=$((FAIL+1)); FAILED+=("stock restore")
fi

call PUT /api/farmer/orders/$ORDER2/status "{\"status\":\"ACCEPTED\"}" "$F1_TOKEN"
check "REJECTED locked (cannot change)" 400 "Rejected order cannot be updated"

call PUT /api/farmer/orders/$ORDER3/status "{\"status\":\"ACCEPTED\"}" "$F1_TOKEN"
check "farmer accepts order3 (for reviews)" 200 "ACCEPTED"

call GET /api/buyer/orders "" "$B2_TOKEN"
check "buyer2 sees only own orders" 200 "QA Organic Rice"
# ensure ORDER1 (buyer1's) is not in buyer2's list — exact id match
# (a plain substring grep is wrong once ids share digits, e.g. 66 vs 661)
if printf '%s' "$RESP_BODY" | python -c "
import sys,json
d=json.load(sys.stdin)
ids=[o.get('id') for o in d]
print('yes' if $ORDER1 in ids else 'no')" | grep -q 'yes'; then
  echo "FAIL order isolation: buyer2 list contains buyer1's order $ORDER1"; FAIL=$((FAIL+1)); FAILED+=("order isolation")
else
  echo "PASS order isolation (buyer2 does not see buyer1's orders)"; PASS=$((PASS+1))
fi

# ============================================================
section "REVIEWS"
# ============================================================

call POST /api/buyer/products/$PROD1/reviews "{\"rating\":5,\"comment\":\"Excellent rice!\"}" "$B1_TOKEN"
check "purchased buyer reviews product" 201 "Excellent rice"
REV1=$(jf id)

call POST /api/buyer/products/$PROD1/reviews "{\"rating\":4,\"comment\":\"Duplicate!\"}" "$B1_TOKEN"
check "duplicate review blocked" 409 "already exists"

call POST /api/buyer/products/$PROD2/reviews "{\"rating\":5,\"comment\":\"Not purchased\"}" "$B1_TOKEN"
check "non-purchased buyer blocked" 400 "only review products you have purchased"

call POST /api/buyer/products/$PROD1/reviews "{\"rating\":6,\"comment\":\"Bad\"}" "$B2_TOKEN"
check "rating out of range -> 400" 400 "Rating must be between 1 and 5"

call POST /api/buyer/products/$PROD1/reviews "{\"rating\":2,\"comment\":\"Mediocre\"}" "$B2_TOKEN"
check "second purchased buyer reviews" 201 "Mediocre"
REV2=$(jf id)

# aggregation: ratings 5 and 2 -> average 3.5, count 2
call GET /api/buyer/products/$PROD1 "" "$B1_TOKEN"
AVG=$(jf averageRating)
CNT=$(jf reviewCount)
if [ "$AVG" == "3.5" ] && [ "$CNT" == "2" ]; then
  echo "PASS rating aggregation avg=$AVG count=$CNT"; PASS=$((PASS+1))
else
  echo "FAIL rating aggregation expected avg=3.5 count=2 got avg=$AVG count=$CNT"; FAIL=$((FAIL+1)); FAILED+=("rating aggregation")
fi

call GET /api/buyer/products/$PROD1/reviews "" "$B1_TOKEN"
check "get product reviews" 200 "Excellent rice"
RV=$(ja)
[ "$RV" == "2" ] && { echo "PASS reviews list has 2 entries"; PASS=$((PASS+1)); } \
  || { echo "FAIL reviews list expected 2 got $RV"; FAIL=$((FAIL+1)); FAILED+=("reviews list count"); }

call GET /api/buyer/products/$PROD1/reviews/mine "" "$B1_TOKEN"
check "get my review" 200 "Excellent rice"

call PUT /api/buyer/reviews/$REV1 "{\"rating\":4,\"comment\":\"Updated review\"}" "$B1_TOKEN"
check "update own review" 200 "Updated review"

call PUT /api/buyer/reviews/$REV2 "{\"rating\":3,\"comment\":\"Hijack\"}" "$B1_TOKEN"
check "update other buyer's review -> 400" 400 "not allowed to update this review"

call GET /api/farmer/products/$PROD1/reviews "" "$F1_TOKEN"
check "farmer views reviews of own product" 200 "Updated review"

call GET /api/farmer/products/$PROD1/reviews "" "$F2_TOKEN"
check "farmer views reviews of other's product -> 400" 400 "not allowed to view these reviews"

call DELETE /api/buyer/reviews/$REV2 "" "$B1_TOKEN"
check "delete other buyer's review -> 400" 400 "not allowed to delete this review"

call DELETE /api/buyer/reviews/$REV1 "" "$B1_TOKEN"
check "delete own review" 200 "deleted successfully"

call DELETE /api/buyer/reviews/$REV1 "" "$B1_TOKEN"
check "delete deleted review -> 404" 404 "Review not found"

call GET /api/buyer/products/$PROD1/reviews "" "$B1_TOKEN"
RV2=$(ja)
[ "$RV2" == "1" ] && { echo "PASS review count back to 1 after delete"; PASS=$((PASS+1)); } \
  || { echo "FAIL review count expected 1 got $RV2"; FAIL=$((FAIL+1)); FAILED+=("review count after delete"); }

# ============================================================
section "WISHLIST"
# ============================================================

call POST /api/buyer/wishlist/$PROD1 "" "$B1_TOKEN"
check "add to wishlist" 201 "QA Organic Rice"

call POST /api/buyer/wishlist/$PROD1 "" "$B1_TOKEN"
check "duplicate wishlist add -> 409" 409 "already exists"

call POST /api/buyer/wishlist/999999999 "" "$B1_TOKEN"
check "wishlist non-existent product -> 404" 404 "Product not found"

call GET /api/buyer/wishlist "" "$B1_TOKEN"
check "list wishlist" 200 "QA Organic Rice"

call GET /api/buyer/wishlist/check/$PROD1 "" "$B1_TOKEN"
check "wishlist check true" 200 "true"

call GET /api/buyer/wishlist/check/$PROD2 "" "$B1_TOKEN"
check "wishlist check false" 200 "false"

call GET /api/buyer/wishlist "" "$B2_TOKEN"
check "wishlist isolation (buyer2 empty)" 200 "[]"

call DELETE /api/buyer/wishlist/$PROD1 "" "$B1_TOKEN"
check "remove from wishlist" 200 "removed from wishlist"

call GET /api/buyer/wishlist/check/$PROD1 "" "$B1_TOKEN"
check "wishlist check false after remove" 200 "false"

call DELETE /api/buyer/wishlist/$PROD1 "" "$B1_TOKEN"
check "remove not-wishlisted (idempotent)" 200 "removed from wishlist"

call POST /api/buyer/wishlist/$PROD1 "" "$F1_TOKEN"
check "FARMER on wishlist -> 403" 403

# ============================================================
section "NOTIFICATIONS"
# ============================================================

call GET /api/notifications "" "$F1_TOKEN"
check "farmer gets notifications" 200 "New Order"
F_NOTIF=$(ji 0 id)
F_NOTIF_TITLE=$(ji 0 title)

call GET /api/notifications "" "$B1_TOKEN"
check "buyer gets notifications" 200 "Order Accepted"
B_NOTIF_TITLES=$(jjson)

echo "$B_NOTIF_TITLES" | grep -q "Order Completed" && { echo "PASS buyer notified on order completed"; PASS=$((PASS+1)); } \
  || { echo "FAIL buyer missing completed notification"; FAIL=$((FAIL+1)); FAILED+=("completed notification"); }

call GET /api/notifications "" "$B2_TOKEN"
check "buyer2 notified of reject + accept" 200 "Order Rejected"
echo "$RESP_BODY" | grep -q "Order Accepted" && { echo "PASS buyer2 got accepted notification"; PASS=$((PASS+1)); } \
  || { echo "FAIL buyer2 missing accepted notification"; FAIL=$((FAIL+1)); FAILED+=("accepted notification"); }

call GET /api/notifications/unread "" "$B1_TOKEN"
check "get unread notifications" 200 "Order"

call GET /api/notifications/unread/count "" "$F1_TOKEN"
UNREAD_FARMER_BEFORE=$(printf '%s' "$RESP_BODY" | tr -d '\r')

call PUT /api/notifications/$F_NOTIF/read "" "$F1_TOKEN"
check "mark one notification read" 200 "true"

call GET /api/notifications/unread/count "" "$F1_TOKEN"
UNREAD_FARMER_AFTER=$(printf '%s' "$RESP_BODY" | tr -d '\r')
if [ -n "$UNREAD_FARMER_BEFORE" ] && [ "$UNREAD_FARMER_AFTER" == "$((UNREAD_FARMER_BEFORE - 1))" ]; then
  echo "PASS unread count decreased after marking one read ($UNREAD_FARMER_BEFORE -> $UNREAD_FARMER_AFTER)"; PASS=$((PASS+1))
else
  echo "FAIL unread count expected $((UNREAD_FARMER_BEFORE - 1)) got $UNREAD_FARMER_AFTER"; FAIL=$((FAIL+1)); FAILED+=("unread count decrease")
fi

call PUT /api/notifications/$F_NOTIF/read "" "$B1_TOKEN"
check "mark other user's notification read -> 403" 403 "not allowed to access"

call DELETE /api/notifications/$F_NOTIF "" "$B2_TOKEN"
check "delete other user's notification -> 403" 403 "not allowed to access"

call DELETE /api/notifications/999999999 "" "$B1_TOKEN"
check "delete non-existent notification -> 404" 404 "Notification not found"

call PUT /api/notifications/read-all "" "$B1_TOKEN"
check "mark all read" 200

call GET /api/notifications/unread/count "" "$B1_TOKEN"
UNREAD_ALL=$(printf '%s' "$RESP_BODY" | tr -d '\r')
[ "$UNREAD_ALL" == "0" ] && { echo "PASS unread count 0 after mark-all-read"; PASS=$((PASS+1)); } \
  || { echo "FAIL unread count expected 0 got $UNREAD_ALL"; FAIL=$((FAIL+1)); FAILED+=("mark all read count"); }

call GET /api/notifications "" "$B1_TOKEN"
NOTIF_ID_TO_DELETE=$(ji 0 id)
call DELETE /api/notifications/$NOTIF_ID_TO_DELETE "" "$B1_TOKEN"
check "delete own notification" 200 "deleted successfully"

call DELETE /api/notifications "" "$B1_TOKEN"
check "clear all notifications" 200

call GET /api/notifications "" "$B1_TOKEN"
RV3=$(ja)
[ "$RV3" == "0" ] && { echo "PASS notifications empty after clear"; PASS=$((PASS+1)); } \
  || { echo "FAIL notifications expected empty got $RV3"; FAIL=$((FAIL+1)); FAILED+=("clear all"); }

call GET /api/notifications
check "notifications require auth -> 403" 403

# ============================================================
section "FORGOT / RESET PASSWORD"
# ============================================================

call POST /api/auth/register "{\"name\":\"QA Pwd User\",\"email\":\"$PWD\",\"password\":\"$PW\",\"role\":\"BUYER\"}"
check "register pwd-reset user" 200 "User Registered"

call POST /api/auth/forgot-password "{\"email\":\"$PWD\"}"
check "forgot-password known email -> generic response" 200 "If the email exists"
RESP_KNOWN="$RESP_BODY"

call POST /api/auth/forgot-password "{\"email\":\"nobody_${TS}@test.com\"}"
check "forgot-password unknown email -> generic response" 200 "If the email exists"
RESP_UNKNOWN="$RESP_BODY"
[ "$RESP_KNOWN" == "$RESP_UNKNOWN" ] && { echo "PASS no account enumeration (identical responses)"; PASS=$((PASS+1)); } \
  || { echo "FAIL responses differ: '$RESP_KNOWN' vs '$RESP_UNKNOWN'"; FAIL=$((FAIL+1)); FAILED+=("anti-enumeration"); }

call POST /api/auth/forgot-password "{\"email\":\"not-an-email\"}"
check "forgot-password invalid email -> 400" 400 "Validation failed"

call POST /api/auth/reset-password "{\"token\":\"definitely-not-real\",\"newPassword\":\"NewPass123!\"}"
check "reset with invalid token -> 400" 400 "Invalid or expired"

call POST /api/auth/reset-password "{\"token\":\"x\",\"newPassword\":\"short\"}"
check "reset with short password -> 400" 400 "Validation failed"

# --- real token flow ---
call POST /api/auth/forgot-password "{\"email\":\"$PWD\"}"
check "forgot-password again creates token" 200 "If the email exists"

if [ -n "$MYSQL_JAR" ]; then
  java -cp "$(cygpath -w "$QA_DIR/classes");$(cygpath -w "$MYSQL_JAR")" DbTool get-token "$PWD" > "$QA_DIR/.token" 2>/dev/null
  RTOKEN=$(cat "$QA_DIR/.token" | tr -d '\r\n ')
  if [ -z "$RTOKEN" ]; then
    echo "FAIL could not read reset token from DB"; FAIL=$((FAIL+1)); FAILED+=("read reset token")
  else
    echo "note: reset token read from DB (${#RTOKEN} chars)"
    call POST /api/auth/reset-password "{\"token\":\"$RTOKEN\",\"newPassword\":\"NewPass123!\"}"
    check "successful password reset" 200 "Password reset successful."

    call POST /api/auth/login "{\"email\":\"$PWD\",\"password\":\"NewPass123!\"}"
    check "login with new password" 200 "Login successful"

    call POST /api/auth/login "{\"email\":\"$PWD\",\"password\":\"$PW\"}"
    check "login with old password rejected" 400 "Invalid email or password"

    call POST /api/auth/reset-password "{\"token\":\"$RTOKEN\",\"newPassword\":\"AnotherPass1!\"}"
    check "used token cannot be reused" 400 "already been used"

    # expired-token test: create a fresh token, backdate it, reset must fail
    call POST /api/auth/forgot-password "{\"email\":\"$PWD\"}"
    check "forgot-password (expiry test)" 200 "If the email exists"
    java -cp "$(cygpath -w "$QA_DIR/classes");$(cygpath -w "$MYSQL_JAR")" DbTool get-token "$PWD" > "$QA_DIR/.token2" 2>/dev/null
    RTOKEN2=$(cat "$QA_DIR/.token2" | tr -d '\r\n ')
    PAST=$(python -c "from datetime import datetime,timedelta;print((datetime.now()-timedelta(minutes=1)).strftime('%Y-%m-%d %H:%M:%S'))")
    java -cp "$(cygpath -w "$QA_DIR/classes");$(cygpath -w "$MYSQL_JAR")" DbTool set-token-expiry "$RTOKEN2" "$PAST" > /dev/null 2>&1
    call POST /api/auth/reset-password "{\"token\":\"$RTOKEN2\",\"newPassword\":\"ExpiredPass1!\"}"
    check "expired token rejected" 400 "Invalid or expired"
  fi
else
  echo "note: mysql jar not found — skipping token-level reset tests"
fi

# ============================================================
section "ADMIN"
# ============================================================

call GET /api/admin/stats "" "$ADM_TOKEN"
check "admin dashboard stats" 200
T_USERS=$(jf totalUsers)
T_PRODS=$(jf totalProducts)
T_ORDERS=$(jf totalOrders)
echo "note: stats -> users=$T_USERS farmers=$(jf totalFarmers) buyers=$(jf totalBuyers) products=$T_PRODS orders=$T_ORDERS pending=$(jf pendingVerifications)"
[ -n "$T_USERS" ] && [ "$T_USERS" != "None" ] && [ "$T_USERS" -ge 5 ] && { echo "PASS stats users >= 5 ($T_USERS)"; PASS=$((PASS+1)); } \
  || { echo "FAIL stats totalUsers missing/too low ($T_USERS)"; FAIL=$((FAIL+1)); FAILED+=("stats users"); }

call GET /api/admin/users "" "$ADM_TOKEN"
check "admin lists users" 200 "QA Buyer One"
N_USERS=$(ja)
[ "$N_USERS" == "$T_USERS" ] && { echo "PASS stats users == users list length ($N_USERS)"; PASS=$((PASS+1)); } \
  || { echo "note: stats users ($T_USERS) != users list ($N_USERS)"; }

call GET /api/admin/users "" "$ADM_TOKEN"
B1_ID=$(printf '%s' "$RESP_BODY" | python -c "
import sys,json
d=json.load(sys.stdin)
for u in d:
    if u.get('email')=='$B1': print(u.get('id')); break")
PWD_ID=$(printf '%s' "$RESP_BODY" | python -c "
import sys,json
d=json.load(sys.stdin)
for u in d:
    if u.get('email')=='$PWD': print(u.get('id')); break")

call GET /api/admin/users/$B1_ID "" "$ADM_TOKEN"
check "admin get user by id" 200 "QA Buyer One"

call GET /api/admin/users/999999999 "" "$ADM_TOKEN"
check "admin get user 404" 404 "not found"

call PUT /api/admin/users/$PWD_ID "{\"name\":\"QA Renamed User\",\"email\":\"$PWD\",\"role\":\"BUYER\"}" "$ADM_TOKEN"
check "admin updates user" 200 "QA Renamed User"

call PUT /api/admin/users/$PWD_ID "{\"name\":\"QA Renamed\",\"email\":\"$B1\",\"role\":\"BUYER\"}" "$ADM_TOKEN"
check "admin update email conflict -> 409" 409 "already in use"

call PUT /api/admin/users/$PWD_ID "{\"name\":\"QA Renamed\",\"email\":\"$PWD\"}" "$ADM_TOKEN"
check "admin update missing role -> 400" 400 "Validation failed"

call DELETE /api/admin/users/$PWD_ID "" "$ADM_TOKEN"
check "admin deletes user without relations" 200 "deleted successfully"

call DELETE /api/admin/users/$B1_ID "" "$ADM_TOKEN"
check "admin delete user with relations blocked" 400 "related data"

call GET /api/admin/farmers "" "$ADM_TOKEN"
check "admin lists farmers" 200 "QA Farmer One"

call GET /api/admin/buyers "" "$ADM_TOKEN"
check "admin lists buyers" 200 "QA Buyer One"

call GET /api/admin/products "" "$ADM_TOKEN"
check "admin lists products" 200 "QA Organic Rice"
N_ADM_PRODS=$(ja)
[ "$N_ADM_PRODS" == "$T_PRODS" ] && { echo "PASS stats products == admin products ($N_ADM_PRODS)"; PASS=$((PASS+1)); } \
  || { echo "note: stats products ($T_PRODS) != admin products ($N_ADM_PRODS)"; }

call GET /api/admin/orders "" "$ADM_TOKEN"
check "admin lists orders" 200 "QA Organic Rice"
N_ADM_ORDERS=$(ja)
[ "$N_ADM_ORDERS" == "$T_ORDERS" ] && { echo "PASS stats orders == admin orders ($N_ADM_ORDERS)"; PASS=$((PASS+1)); } \
  || { echo "note: stats orders ($T_ORDERS) != admin orders ($N_ADM_ORDERS)"; }

# A fresh farmer (F3) drives the admin-section verification flow
F3="qa_farmer3_${TS}@test.com"
call POST /api/auth/register "{\"name\":\"QA Farmer Three\",\"email\":\"$F3\",\"password\":\"$PW\",\"role\":\"FARMER\"}"
check "register FARMER #3" 200 "User Registered Successfully"

call POST /api/auth/login "{\"email\":\"$F3\",\"password\":\"$PW\"}"
F3_TOKEN=$(jf token)

VERIFY3_OUT=$(verify_post "$F3_TOKEN" -F "farmerPhoto=@$(cygpath -w "$QA_DIR/test.png")" -F "landCertificate=@$(cygpath -w "$QA_DIR/test.png")" -F "farmPhoto=@$(cygpath -w "$QA_DIR/test.png")")
VERIFY3_BODY=$(cat "$TMP" | tr -d '\r')
if [ "$VERIFY3_OUT" == "200" ] && echo "$VERIFY3_BODY" | grep -q '"PENDING"'; then
  echo "PASS F3 submits verification -> PENDING"; PASS=$((PASS+1))
else
  echo "FAIL F3 submits verification (code=$VERIFY3_OUT body=$(echo "$VERIFY3_BODY" | head -c 200))"; FAIL=$((FAIL+1)); FAILED+=("F3 submit verification"); fi

call GET /api/admin/farmers/unverified "" "$ADM_TOKEN"
check "admin lists unverified farmers" 200
F3_PROFILE_ID=$(printf '%s' "$RESP_BODY" | python -c "
import sys,json
d=json.load(sys.stdin)
for p in d:
    if p.get('email')=='$F3': print(p.get('profileId')); break")

call PUT /api/admin/farmers/$F3_PROFILE_ID/verify "" "$ADM_TOKEN"
check "admin approves F3" 200 "APPROVED"

call PUT /api/admin/farmers/999999999/verify "" "$ADM_TOKEN"
check "verify non-existent profile -> 404" 404 "Farmer profile not found"

call GET /api/admin/farmers/unverified "" "$ADM_TOKEN"
if printf '%s' "$RESP_BODY" | grep -q "$F3"; then
  echo "FAIL approved farmer still in pending list"; FAIL=$((FAIL+1)); FAILED+=("approved farmer in pending list")
else
  echo "PASS approved farmer removed from pending list"; PASS=$((PASS+1))
fi

call GET /api/buyer/products/$PROD1 "" "$B1_TOKEN"
check "product reflects farmer verified flag" 200 "true"

# ============================================================
section "ANALYTICS — AUTHORIZATION"
# ============================================================

# Admin analytics: only ADMIN may read it
call GET /api/admin/analytics "" "$B1_TOKEN"
check "admin analytics blocked for buyer" 403

call GET /api/admin/analytics "" "$F1_TOKEN"
check "admin analytics blocked for farmer" 403

call GET /api/admin/analytics ""
check "admin analytics blocked unauthenticated" 403

call GET /api/admin/analytics/revenue "" "$B1_TOKEN"
check "admin revenue blocked for buyer" 403

call GET /api/admin/top-buyers "" "$F1_TOKEN"
check "admin top-buyers blocked for farmer" 403

# Farmer analytics: only FARMER may read it
call GET /api/farmer/analytics "" "$ADM_TOKEN"
check "farmer analytics blocked for admin" 403

call GET /api/farmer/analytics "" "$B1_TOKEN"
check "farmer analytics blocked for buyer" 403

call GET /api/farmer/analytics ""
check "farmer analytics blocked unauthenticated" 403

# Buyer analytics: only BUYER may read it
call GET /api/buyer/analytics "" "$F1_TOKEN"
check "buyer analytics blocked for farmer" 403

call GET /api/buyer/analytics "" "$ADM_TOKEN"
check "buyer analytics blocked for admin" 403

call GET /api/buyer/analytics ""
check "buyer analytics blocked unauthenticated" 403

# ============================================================
section "ANALYTICS — ADMIN DASHBOARD"
# ============================================================

call GET /api/admin/analytics "" "$ADM_TOKEN"
check "admin analytics dashboard" 200 "platformRevenue"

if echo "$RESP_BODY" | python -c "
import sys, json
d = json.load(sys.stdin)
status_sum = sum(s['count'] for s in d.get('orderStatus', []))
ok = (d.get('orders', -1) == status_sum
      and len(d.get('productCategories', [])) > 0
      and len(d.get('latestOrders', [])) > 0
      and d.get('totalUsers', 0) > 0
      and d.get('totalFarmers', 0) > 0)
sys.exit(0 if ok else 1)"; then
  echo "PASS admin analytics internal consistency (status sum == orders, tables populated)"; PASS=$((PASS+1))
else
  echo "FAIL admin analytics internal consistency"; FAIL=$((FAIL+1)); FAILED+=("admin analytics internal consistency")
fi

call GET /api/admin/analytics/revenue "" "$ADM_TOKEN"
check "admin revenue per month" 200 "value"

call GET /api/admin/analytics/orders "" "$ADM_TOKEN"
check "admin orders per month" 200 "count"

call GET /api/admin/top-products "" "$ADM_TOKEN"
check "admin top products" 200 "productName"

call GET /api/admin/top-farmers "" "$ADM_TOKEN"
check "admin top farmers" 200 "email"

call GET /api/admin/top-buyers "" "$ADM_TOKEN"
check "admin top buyers" 200 "email"

# ============================================================
section "ANALYTICS — FARMER DASHBOARD"
# ============================================================

call GET /api/farmer/analytics "" "$F1_TOKEN"
check "farmer analytics dashboard" 200 "completedOrders"

if echo "$RESP_BODY" | python -c "
import sys, json
d = json.load(sys.stdin)
ok = (d.get('products', -1) >= 1
      and d.get('totalRevenue', -1) >= 0
      and d.get('customers', -1) >= 1
      and len(d.get('recentOrders', [])) > 0
      and len(d.get('salesPerProduct', [])) > 0)
sys.exit(0 if ok else 1)"; then
  echo "PASS farmer analytics reflects F1's real orders/products"; PASS=$((PASS+1))
else
  echo "FAIL farmer analytics reflects F1's real data"; FAIL=$((FAIL+1)); FAILED+=("farmer analytics reflects F1 data")
fi

call GET /api/farmer/analytics/sales "" "$F1_TOKEN"
check "farmer sales per product" 200 "productName"

# ============================================================
section "ANALYTICS — BUYER DASHBOARD"
# ============================================================

call GET /api/buyer/analytics "" "$B1_TOKEN"
check "buyer analytics dashboard" 200 "favoriteCategory"

if echo "$RESP_BODY" | python -c "
import sys, json
d = json.load(sys.stdin)
ok = (d.get('orders', 0) >= 1
      and d.get('favoriteCategory') is not None
      and len(d.get('latestOrders', [])) > 0
      and len(d.get('favoriteFarmers', [])) > 0)
sys.exit(0 if ok else 1)"; then
  echo "PASS buyer analytics reflects B1's real orders"; PASS=$((PASS+1))
else
  echo "FAIL buyer analytics reflects B1's real data"; FAIL=$((FAIL+1)); FAILED+=("buyer analytics reflects B1 data")
fi

call GET /api/buyer/analytics/spending "" "$B1_TOKEN"
check "buyer monthly spending" 200 "value"

# ============================================================
section "SUMMARY"
# ============================================================
echo
echo "TOTAL PASS: $PASS"
echo "TOTAL FAIL: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo "FAILED TESTS:"
  for t in "${FAILED[@]}"; do echo "  - $t"; done
fi
exit 0
