#!/usr/bin/env python3
"""
Comprehensive test suite for Toolverse Admin Panel + Runtime API endpoints.

Tests cover:
1. Admin Auth (login, setup-password, change-password)
2. Admin Dashboard
3. Admin Features (CRUD)
4. Admin Roles (list, upsert)
5. Admin Settings (get, put, encrypted)
6. Admin Pages (list, upsert)
7. Admin Navigation (list, upsert)
8. Admin Plugins (list, install, enable, disable, delete)
9. Admin Audit Logs
10. Admin Global Search
11. Admin Runtime (draft, publish, revisions, rollback)
12. Admin Centers Summary
13. Runtime Config (public endpoint)
14. Runtime Homepage
15. Runtime Navigation
16. Runtime Theme
17. Runtime Announcements
18. Runtime SEO
19. Runtime Tools (list, detail)
20. Runtime Pages (list, by slug)
21. Runtime Search
22. Runtime Sitemap
23. Runtime Branding
24. Runtime Health
25. Permission enforcement (403 without perms)
"""

import io
import json
import os
import zipfile
import requests

BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL", "http://127.0.0.1:8010")
ADMIN_API = f"{BACKEND_URL}/api/admin"
RUNTIME_API = f"{BACKEND_URL}/api/runtime"

# Permission headers that pass all checks
FULL_PERMS_HEADERS = {"x-admin-permissions": "*", "x-admin-user": "test@example.com"}

results = {"passed": [], "failed": []}


def log_result(test_name: str, passed: bool, details: str = ""):
    if passed:
        results["passed"].append(test_name)
        print(f"  ✓ {test_name}")
    else:
        results["failed"].append({"test": test_name, "details": details})
        print(f"  ✗ {test_name}: {details}")


def section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


ADMIN_EMAIL = "aman74560027@gmail.com"
TEST_PASSWORD = "SuperSecure@Pass123"
CHANGED_PASSWORD = "ChangedPass@Secure456"
FEATURE_KEY = "test-feature-pytest"
ROLE_NAME = "test_role_pytest"
PAGE_SLUG = "pytest-page"
NAV_KEY = "pytest-nav"

# ──────────────────────────────────────────────────────────────
# SECTION 1: Admin Auth
# ──────────────────────────────────────────────────────────────
section("1. ADMIN AUTH")

# 1a. Login with no password (bootstrap account — should return requires_password_setup)
try:
    form = {"email": ADMIN_EMAIL, "password": ""}
    r = requests.post(f"{ADMIN_API}/auth/login", data=form, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if data.get("requires_password_setup") or "email" in data:
            log_result("Admin Login (bootstrap - no password)", True)
        else:
            log_result("Admin Login (bootstrap - no password)", False, f"Unexpected response: {data}")
    else:
        log_result("Admin Login (bootstrap - no password)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Login (bootstrap - no password)", False, str(e))

# 1b. Setup first password
try:
    form = {"email": ADMIN_EMAIL, "new_password": TEST_PASSWORD}
    r = requests.post(f"{ADMIN_API}/auth/setup-password", data=form, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if data.get("password_set"):
            log_result("Admin Setup Password", True)
        else:
            log_result("Admin Setup Password", False, f"Missing password_set field: {data}")
    else:
        log_result("Admin Setup Password", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Setup Password", False, str(e))

# 1c. Login with correct password
try:
    form = {"email": ADMIN_EMAIL, "password": TEST_PASSWORD}
    r = requests.post(f"{ADMIN_API}/auth/login", data=form, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if "email" in data and "roles" in data:
            log_result("Admin Login (correct password)", True)
        else:
            log_result("Admin Login (correct password)", False, f"Missing fields: {data}")
    else:
        log_result("Admin Login (correct password)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Login (correct password)", False, str(e))

# 1d. Login with wrong password
try:
    form = {"email": ADMIN_EMAIL, "password": "wrongpassword"}
    r = requests.post(f"{ADMIN_API}/auth/login", data=form, timeout=15)
    if r.status_code == 401:
        log_result("Admin Login (wrong password → 401)", True)
    else:
        log_result("Admin Login (wrong password → 401)", False, f"Expected 401, got {r.status_code}")
except Exception as e:
    log_result("Admin Login (wrong password → 401)", False, str(e))

# 1e. Change password
try:
    form = {"email": ADMIN_EMAIL, "current_password": TEST_PASSWORD, "new_password": CHANGED_PASSWORD}
    r = requests.post(f"{ADMIN_API}/auth/change-password", data=form, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if data.get("password_changed"):
            log_result("Admin Change Password", True)
        else:
            log_result("Admin Change Password", False, f"Missing password_changed: {data}")
    else:
        log_result("Admin Change Password", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Change Password", False, str(e))

# 1f. Login with new changed password
try:
    form = {"email": ADMIN_EMAIL, "password": CHANGED_PASSWORD}
    r = requests.post(f"{ADMIN_API}/auth/login", data=form, timeout=15)
    if r.status_code == 200:
        log_result("Admin Login (after change password)", True)
    else:
        log_result("Admin Login (after change password)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Login (after change password)", False, str(e))

# 1g. Short password should fail (< 12 chars)
try:
    form = {"email": ADMIN_EMAIL, "new_password": "short"}
    r = requests.post(f"{ADMIN_API}/auth/setup-password", data=form, timeout=15)
    if r.status_code == 400:
        log_result("Admin Setup Password (too short → 400)", True)
    else:
        log_result("Admin Setup Password (too short → 400)", False, f"Expected 400, got {r.status_code}")
except Exception as e:
    log_result("Admin Setup Password (too short → 400)", False, str(e))

# Reset password back to TEST_PASSWORD for further tests
try:
    form = {"email": ADMIN_EMAIL, "current_password": CHANGED_PASSWORD, "new_password": TEST_PASSWORD}
    requests.post(f"{ADMIN_API}/auth/change-password", data=form, timeout=15)
except Exception:
    pass


# ──────────────────────────────────────────────────────────────
# SECTION 2: Dashboard
# ──────────────────────────────────────────────────────────────
section("2. ADMIN DASHBOARD")

try:
    r = requests.get(f"{ADMIN_API}/dashboard", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        required = ["features", "plugins", "pages", "admin_users", "system", "timeline"]
        missing = [k for k in required if k not in data]
        if not missing:
            log_result("Admin Dashboard (structure)", True)
        else:
            log_result("Admin Dashboard (structure)", False, f"Missing: {missing}")
    else:
        log_result("Admin Dashboard (structure)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Dashboard (structure)", False, str(e))

try:
    r = requests.get(f"{ADMIN_API}/dashboard", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        system = data.get("system", {})
        if "server_time" in system and system.get("status") == "healthy":
            log_result("Admin Dashboard (system health)", True)
        else:
            log_result("Admin Dashboard (system health)", False, f"Bad system block: {system}")
    else:
        log_result("Admin Dashboard (system health)", False, f"Status {r.status_code}")
except Exception as e:
    log_result("Admin Dashboard (system health)", False, str(e))

# Test permission enforcement — no perms header should fail
try:
    r = requests.get(f"{ADMIN_API}/dashboard", headers={"x-admin-permissions": "nothing"}, timeout=15)
    if r.status_code == 403:
        log_result("Admin Dashboard (403 without permission)", True)
    else:
        log_result("Admin Dashboard (403 without permission)", False, f"Expected 403, got {r.status_code}")
except Exception as e:
    log_result("Admin Dashboard (403 without permission)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 3: Features
# ──────────────────────────────────────────────────────────────
section("3. ADMIN FEATURES")

try:
    r = requests.get(f"{ADMIN_API}/features", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            log_result("Admin Features List", True)
        else:
            log_result("Admin Features List", False, f"Expected list, got {type(data)}")
    else:
        log_result("Admin Features List", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Features List", False, str(e))

# Create/update a feature
try:
    payload = {
        "name": "Test Feature",
        "description": "A feature for pytest",
        "category": "testing",
        "endpoint": "/api/test",
    }
    r = requests.put(
        f"{ADMIN_API}/features/{FEATURE_KEY}",
        json=payload,
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("key") == FEATURE_KEY and data.get("name") == "Test Feature":
            log_result("Admin Feature Upsert (create)", True)
        else:
            log_result("Admin Feature Upsert (create)", False, f"Wrong data: {data}")
    else:
        log_result("Admin Feature Upsert (create)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Feature Upsert (create)", False, str(e))

# Update the feature
try:
    payload = {"name": "Test Feature Updated", "description": "Updated desc", "category": "testing"}
    r = requests.put(
        f"{ADMIN_API}/features/{FEATURE_KEY}",
        json=payload,
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("name") == "Test Feature Updated":
            log_result("Admin Feature Upsert (update)", True)
        else:
            log_result("Admin Feature Upsert (update)", False, f"Name not updated: {data}")
    else:
        log_result("Admin Feature Upsert (update)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Feature Upsert (update)", False, str(e))

# Delete the feature
try:
    r = requests.delete(
        f"{ADMIN_API}/features/{FEATURE_KEY}",
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if "deleted" in data:
            log_result("Admin Feature Delete", True)
        else:
            log_result("Admin Feature Delete", False, f"Missing deleted key: {data}")
    else:
        log_result("Admin Feature Delete", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Feature Delete", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 4: Roles
# ──────────────────────────────────────────────────────────────
section("4. ADMIN ROLES")

try:
    r = requests.get(f"{ADMIN_API}/roles", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            # Check expected system roles exist
            names = {role["name"] for role in data}
            if "super_admin" in names:
                log_result("Admin Roles List (includes super_admin)", True)
            else:
                log_result("Admin Roles List (includes super_admin)", False, f"super_admin not found in {names}")
        else:
            log_result("Admin Roles List (includes super_admin)", False, f"Expected list, got {type(data)}")
    else:
        log_result("Admin Roles List (includes super_admin)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Roles List (includes super_admin)", False, str(e))

# Upsert a custom role
try:
    payload = {
        "label": "Test Role",
        "permissions": ["features.read", "pages.read"],
        "is_system": False,
    }
    r = requests.put(
        f"{ADMIN_API}/roles/{ROLE_NAME}",
        json=payload,
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("name") == ROLE_NAME and "features.read" in (data.get("permissions") or []):
            log_result("Admin Role Upsert", True)
        else:
            log_result("Admin Role Upsert", False, f"Wrong data: {data}")
    else:
        log_result("Admin Role Upsert", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Role Upsert", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 5: Settings
# ──────────────────────────────────────────────────────────────
section("5. ADMIN SETTINGS")

try:
    r = requests.get(f"{ADMIN_API}/settings", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, dict):
            log_result("Admin Settings List", True)
        else:
            log_result("Admin Settings List", False, f"Expected dict, got {type(data)}")
    else:
        log_result("Admin Settings List", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Settings List", False, str(e))

# Set a setting
try:
    payload = {"test_key": "test_value", "number": 42}
    r = requests.put(
        f"{ADMIN_API}/settings/pytest_test_setting",
        json=payload,
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("saved"):
            log_result("Admin Settings Put", True)
        else:
            log_result("Admin Settings Put", False, f"Missing saved: {data}")
    else:
        log_result("Admin Settings Put", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Settings Put", False, str(e))

# Get single key
try:
    r = requests.get(
        f"{ADMIN_API}/settings?key=pytest_test_setting",
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, dict) and data.get("test_key") == "test_value":
            log_result("Admin Settings Get (single key)", True)
        else:
            log_result("Admin Settings Get (single key)", False, f"Wrong data: {data}")
    else:
        log_result("Admin Settings Get (single key)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Settings Get (single key)", False, str(e))

# Set encrypted setting
try:
    payload = {"secret": "my-super-secret-value"}
    r = requests.put(
        f"{ADMIN_API}/settings/pytest_encrypted?encrypted=true",
        json=payload,
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("saved"):
            log_result("Admin Settings Put (encrypted)", True)
        else:
            log_result("Admin Settings Put (encrypted)", False, f"Missing saved: {data}")
    else:
        log_result("Admin Settings Put (encrypted)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Settings Put (encrypted)", False, str(e))

# Get encrypted setting back (should return decrypted value)
try:
    r = requests.get(
        f"{ADMIN_API}/settings?key=pytest_encrypted",
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, dict) and data.get("secret") == "my-super-secret-value":
            log_result("Admin Settings Get (encrypted - decrypts correctly)", True)
        else:
            log_result("Admin Settings Get (encrypted - decrypts correctly)", False, f"Wrong data: {data}")
    else:
        log_result("Admin Settings Get (encrypted - decrypts correctly)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Settings Get (encrypted - decrypts correctly)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 6: Pages
# ──────────────────────────────────────────────────────────────
section("6. ADMIN PAGES")

try:
    r = requests.get(f"{ADMIN_API}/pages", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            slugs = [p["slug"] for p in data]
            if "home" in slugs:
                log_result("Admin Pages List (bootstrap home page exists)", True)
            else:
                log_result("Admin Pages List (bootstrap home page exists)", False, f"home not found in {slugs}")
        else:
            log_result("Admin Pages List (bootstrap home page exists)", False, f"Expected list, got {type(data)}")
    else:
        log_result("Admin Pages List (bootstrap home page exists)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Pages List (bootstrap home page exists)", False, str(e))

# Upsert a page
try:
    payload = {
        "title": "PyTest Page",
        "page_type": "custom",
        "status": "published",
        "seo": {"title": "Test", "description": "Testing"},
        "blocks": [{"id": "block-1", "type": "hero", "props": {"title": "Hello"}, "children": []}],
        "meta_json": {},
    }
    r = requests.put(
        f"{ADMIN_API}/pages/{PAGE_SLUG}",
        json=payload,
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("slug") == PAGE_SLUG and data.get("title") == "PyTest Page":
            log_result("Admin Page Upsert", True)
        else:
            log_result("Admin Page Upsert", False, f"Wrong data: {data}")
    else:
        log_result("Admin Page Upsert", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Page Upsert", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 7: Navigation
# ──────────────────────────────────────────────────────────────
section("7. ADMIN NAVIGATION")

try:
    r = requests.get(f"{ADMIN_API}/navigation", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            keys = {item["key"] for item in data}
            has_nav = bool(keys & {"navbar", "sidebar", "footer"})
            if has_nav:
                log_result("Admin Navigation List (navbar/sidebar/footer present)", True)
            else:
                log_result("Admin Navigation List (navbar/sidebar/footer present)", False, f"Keys: {keys}")
        else:
            log_result("Admin Navigation List (navbar/sidebar/footer present)", False, f"Expected list, got {type(data)}")
    else:
        log_result("Admin Navigation List (navbar/sidebar/footer present)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Navigation List (navbar/sidebar/footer present)", False, str(e))

# Upsert navigation
try:
    items = [
        {"label": "Home", "href": "/", "icon": "home"},
        {"label": "Tools", "href": "/tools", "icon": "tools"},
    ]
    r = requests.put(
        f"{ADMIN_API}/navigation/{NAV_KEY}",
        json=items,
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("key") == NAV_KEY and len(data.get("items", [])) == 2:
            log_result("Admin Navigation Upsert", True)
        else:
            log_result("Admin Navigation Upsert", False, f"Wrong data: {data}")
    else:
        log_result("Admin Navigation Upsert", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Navigation Upsert", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 8: Plugins
# ──────────────────────────────────────────────────────────────
section("8. ADMIN PLUGINS")

# List plugins
try:
    r = requests.get(f"{ADMIN_API}/plugins", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            log_result("Admin Plugins List", True)
        else:
            log_result("Admin Plugins List", False, f"Expected list, got {type(data)}")
    else:
        log_result("Admin Plugins List", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Plugins List", False, str(e))

# Install plugin (create a zip with plugin.json)
PLUGIN_ID = "pytest-test-plugin"
try:
    manifest = {
        "id": PLUGIN_ID,
        "name": "PyTest Test Plugin",
        "version": "1.0.0",
        "description": "A test plugin for pytest",
        "author": "Test",
        "main": "index.js",
    }
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("plugin.json", json.dumps(manifest))
        zf.writestr("index.js", "// Test plugin code")
        zf.writestr("README.md", "# Test Plugin")
    zip_buf.seek(0)

    r = requests.post(
        f"{ADMIN_API}/plugins/install",
        files={"file": ("plugin.zip", zip_buf.read(), "application/zip")},
        headers=FULL_PERMS_HEADERS,
        timeout=30,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("plugin_id") == PLUGIN_ID and data.get("status") == "enabled":
            log_result("Admin Plugin Install", True)
        else:
            log_result("Admin Plugin Install", False, f"Wrong data: {data}")
    else:
        log_result("Admin Plugin Install", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Plugin Install", False, str(e))

# Disable plugin
try:
    r = requests.post(
        f"{ADMIN_API}/plugins/{PLUGIN_ID}/disable",
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("status") == "disabled":
            log_result("Admin Plugin Disable", True)
        else:
            log_result("Admin Plugin Disable", False, f"Wrong status: {data}")
    else:
        log_result("Admin Plugin Disable", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Plugin Disable", False, str(e))

# Enable plugin
try:
    r = requests.post(
        f"{ADMIN_API}/plugins/{PLUGIN_ID}/enable",
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("status") == "enabled":
            log_result("Admin Plugin Enable", True)
        else:
            log_result("Admin Plugin Enable", False, f"Wrong status: {data}")
    else:
        log_result("Admin Plugin Enable", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Plugin Enable", False, str(e))

# Delete plugin
try:
    r = requests.delete(
        f"{ADMIN_API}/plugins/{PLUGIN_ID}",
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if "deleted" in data:
            log_result("Admin Plugin Delete", True)
        else:
            log_result("Admin Plugin Delete", False, f"Missing deleted key: {data}")
    else:
        log_result("Admin Plugin Delete", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Plugin Delete", False, str(e))

# Try to enable non-existent plugin (should 404)
try:
    r = requests.post(
        f"{ADMIN_API}/plugins/non-existent-plugin/enable",
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 404:
        log_result("Admin Plugin Enable (non-existent → 404)", True)
    else:
        log_result("Admin Plugin Enable (non-existent → 404)", False, f"Expected 404, got {r.status_code}")
except Exception as e:
    log_result("Admin Plugin Enable (non-existent → 404)", False, str(e))

# Install plugin (missing plugin.json should return 400)
try:
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("index.js", "// No manifest")
    zip_buf.seek(0)
    r = requests.post(
        f"{ADMIN_API}/plugins/install",
        files={"file": ("bad.zip", zip_buf.read(), "application/zip")},
        headers=FULL_PERMS_HEADERS,
        timeout=30,
    )
    if r.status_code == 400:
        log_result("Admin Plugin Install (missing plugin.json → 400)", True)
    else:
        log_result("Admin Plugin Install (missing plugin.json → 400)", False, f"Expected 400, got {r.status_code}")
except Exception as e:
    log_result("Admin Plugin Install (missing plugin.json → 400)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 9: Audit Logs
# ──────────────────────────────────────────────────────────────
section("9. ADMIN AUDIT LOGS")

try:
    r = requests.get(f"{ADMIN_API}/logs/audit", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            if data:  # Should have at least some logs from our operations above
                entry = data[0]
                required = {"actor", "action", "resource_type", "resource_id", "payload"}
                missing = required - set(entry.keys())
                if not missing:
                    log_result("Admin Audit Logs (structure)", True)
                else:
                    log_result("Admin Audit Logs (structure)", False, f"Missing fields: {missing}")
            else:
                log_result("Admin Audit Logs (structure)", False, "Empty audit log - expected entries after CRUD operations")
        else:
            log_result("Admin Audit Logs (structure)", False, f"Expected list, got {type(data)}")
    else:
        log_result("Admin Audit Logs (structure)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Audit Logs (structure)", False, str(e))

try:
    r = requests.get(f"{ADMIN_API}/logs/audit?limit=5", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if len(data) <= 5:
            log_result("Admin Audit Logs (limit parameter)", True)
        else:
            log_result("Admin Audit Logs (limit parameter)", False, f"Expected ≤5 results, got {len(data)}")
    else:
        log_result("Admin Audit Logs (limit parameter)", False, f"Status {r.status_code}")
except Exception as e:
    log_result("Admin Audit Logs (limit parameter)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 10: Global Search
# ──────────────────────────────────────────────────────────────
section("10. ADMIN GLOBAL SEARCH")

try:
    r = requests.get(f"{ADMIN_API}/search?q=home", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        required = {"features", "pages", "plugins", "settings"}
        missing = required - set(data.keys())
        if not missing:
            # pages should contain 'home'
            page_slugs = [p["slug"] for p in data.get("pages", [])]
            if "home" in page_slugs:
                log_result("Admin Global Search (home page found)", True)
            else:
                log_result("Admin Global Search (home page found)", False, f"Pages: {page_slugs}, data: {data}")
        else:
            log_result("Admin Global Search (home page found)", False, f"Missing keys: {missing}")
    else:
        log_result("Admin Global Search (home page found)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Global Search (home page found)", False, str(e))

try:
    r = requests.get(f"{ADMIN_API}/search?q=zzznoresultxxx", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        total_hits = sum(len(v) for v in data.values() if isinstance(v, list))
        if total_hits == 0:
            log_result("Admin Global Search (no results)", True)
        else:
            log_result("Admin Global Search (no results)", False, f"Expected 0 hits, got {total_hits}")
    else:
        log_result("Admin Global Search (no results)", False, f"Status {r.status_code}")
except Exception as e:
    log_result("Admin Global Search (no results)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 11: Runtime Management (draft/publish/revisions/rollback)
# ──────────────────────────────────────────────────────────────
section("11. ADMIN RUNTIME MANAGEMENT")

DRAFT_PAYLOAD = {
    "theme": {"primary_color": "#ff0000", "site_name": "TestVerse"},
    "announcements": {"top_banner": {"enabled": True, "text": "Test banner"}},
}

# Save draft
try:
    r = requests.put(
        f"{ADMIN_API}/runtime/draft",
        json=DRAFT_PAYLOAD,
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("saved") and "updated_at" in data:
            log_result("Admin Runtime Save Draft", True)
        else:
            log_result("Admin Runtime Save Draft", False, f"Missing fields: {data}")
    else:
        log_result("Admin Runtime Save Draft", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Runtime Save Draft", False, str(e))

# Publish runtime
try:
    r = requests.post(
        f"{ADMIN_API}/runtime/publish",
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if data.get("published") and "published_at" in data:
            log_result("Admin Runtime Publish", True)
        else:
            log_result("Admin Runtime Publish", False, f"Missing fields: {data}")
    else:
        log_result("Admin Runtime Publish", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Runtime Publish", False, str(e))

# Get revisions
try:
    r = requests.get(f"{ADMIN_API}/runtime/revisions", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data.get("revisions"), list):
            log_result("Admin Runtime Revisions List", True)
        else:
            log_result("Admin Runtime Revisions List", False, f"Missing revisions list: {data}")
    else:
        log_result("Admin Runtime Revisions List", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Runtime Revisions List", False, str(e))

# Rollback to revision 0 (if any)
try:
    revisions_r = requests.get(f"{ADMIN_API}/runtime/revisions", headers=FULL_PERMS_HEADERS, timeout=15)
    if revisions_r.status_code == 200:
        revisions = revisions_r.json().get("revisions", [])
        if revisions:
            r = requests.post(
                f"{ADMIN_API}/runtime/rollback/0",
                headers=FULL_PERMS_HEADERS,
                timeout=15,
            )
            if r.status_code == 200:
                data = r.json()
                if data.get("rolled_back") and "rolled_back_at" in data:
                    log_result("Admin Runtime Rollback", True)
                else:
                    log_result("Admin Runtime Rollback", False, f"Missing fields: {data}")
            else:
                log_result("Admin Runtime Rollback", False, f"Status {r.status_code}: {r.text[:200]}")
        else:
            log_result("Admin Runtime Rollback", True)  # no revisions yet, skip
    else:
        log_result("Admin Runtime Rollback", False, "Could not get revisions")
except Exception as e:
    log_result("Admin Runtime Rollback", False, str(e))

# Rollback to invalid revision index (should 404)
try:
    r = requests.post(
        f"{ADMIN_API}/runtime/rollback/9999",
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 404:
        log_result("Admin Runtime Rollback (invalid index → 404)", True)
    else:
        log_result("Admin Runtime Rollback (invalid index → 404)", False, f"Expected 404, got {r.status_code}")
except Exception as e:
    log_result("Admin Runtime Rollback (invalid index → 404)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 12: Centers Summary
# ──────────────────────────────────────────────────────────────
section("12. ADMIN CENTERS SUMMARY")

try:
    r = requests.get(f"{ADMIN_API}/centers/summary", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code == 200:
        data = r.json()
        centers = data.get("centers", [])
        if isinstance(centers, list) and len(centers) > 10:
            log_result("Admin Centers Summary", True)
        else:
            log_result("Admin Centers Summary", False, f"Expected list with 10+ centers, got: {data}")
    else:
        log_result("Admin Centers Summary", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Admin Centers Summary", False, str(e))


# ══════════════════════════════════════════════════════════════
# RUNTIME API ENDPOINTS (public-facing)
# ══════════════════════════════════════════════════════════════

# ──────────────────────────────────────────────────────────────
# SECTION 13: Runtime Health
# ──────────────────────────────────────────────────────────────
section("13. RUNTIME HEALTH")

try:
    r = requests.get(f"{RUNTIME_API}/health", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if data.get("ok") and "timestamp" in data and data.get("scope") == "runtime-public":
            log_result("Runtime Health", True)
        else:
            log_result("Runtime Health", False, f"Wrong response: {data}")
    else:
        log_result("Runtime Health", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Health", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 14: Runtime Config
# ──────────────────────────────────────────────────────────────
section("14. RUNTIME CONFIG")

try:
    r = requests.get(f"{RUNTIME_API}/config", timeout=15)
    if r.status_code == 200:
        data = r.json()
        required = ["homepage", "navigation", "theme", "tools", "feature_registry", "seo"]
        missing = [k for k in required if k not in data]
        if not missing:
            log_result("Runtime Config (structure)", True)
        else:
            log_result("Runtime Config (structure)", False, f"Missing: {missing}")
    else:
        log_result("Runtime Config (structure)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Config (structure)", False, str(e))

try:
    r = requests.get(f"{RUNTIME_API}/config", timeout=15)
    if r.status_code == 200:
        data = r.json()
        theme = data.get("theme", {})
        if "primary_color" in theme or "site_name" in theme:
            log_result("Runtime Config (theme data present)", True)
        else:
            log_result("Runtime Config (theme data present)", False, f"Theme: {theme}")
    else:
        log_result("Runtime Config (theme data present)", False, f"Status {r.status_code}")
except Exception as e:
    log_result("Runtime Config (theme data present)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 15: Runtime Homepage
# ──────────────────────────────────────────────────────────────
section("15. RUNTIME HOMEPAGE")

try:
    r = requests.get(f"{RUNTIME_API}/homepage", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if "slug" in data or "title" in data or "sections" in data:
            log_result("Runtime Homepage", True)
        else:
            log_result("Runtime Homepage", False, f"Missing homepage fields: {data}")
    else:
        log_result("Runtime Homepage", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Homepage", False, str(e))

try:
    r = requests.get(f"{RUNTIME_API}/homepage", timeout=15)
    if r.status_code == 200:
        data = r.json()
        sections = data.get("sections", [])
        if isinstance(sections, list):
            log_result("Runtime Homepage (sections is list)", True)
        else:
            log_result("Runtime Homepage (sections is list)", False, f"sections type: {type(sections)}")
    else:
        log_result("Runtime Homepage (sections is list)", False, f"Status {r.status_code}")
except Exception as e:
    log_result("Runtime Homepage (sections is list)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 16: Runtime Navigation
# ──────────────────────────────────────────────────────────────
section("16. RUNTIME NAVIGATION")

try:
    r = requests.get(f"{RUNTIME_API}/navigation", timeout=15)
    if r.status_code == 200:
        data = r.json()
        has_all = all(k in data for k in ["navbar", "sidebar", "footer"])
        if has_all:
            log_result("Runtime Navigation (navbar/sidebar/footer)", True)
        else:
            log_result("Runtime Navigation (navbar/sidebar/footer)", False, f"Keys: {list(data.keys())}")
    else:
        log_result("Runtime Navigation (navbar/sidebar/footer)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Navigation (navbar/sidebar/footer)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 17: Runtime Theme
# ──────────────────────────────────────────────────────────────
section("17. RUNTIME THEME")

try:
    r = requests.get(f"{RUNTIME_API}/theme", timeout=15)
    if r.status_code == 200:
        data = r.json()
        # Should have some theme keys
        if isinstance(data, dict) and len(data) > 0:
            log_result("Runtime Theme (returns data)", True)
        else:
            log_result("Runtime Theme (returns data)", False, f"Empty or wrong type: {data}")
    else:
        log_result("Runtime Theme (returns data)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Theme (returns data)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 18: Runtime Announcements
# ──────────────────────────────────────────────────────────────
section("18. RUNTIME ANNOUNCEMENTS")

try:
    r = requests.get(f"{RUNTIME_API}/announcements", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, dict):
            log_result("Runtime Announcements", True)
        else:
            log_result("Runtime Announcements", False, f"Expected dict, got {type(data)}")
    else:
        log_result("Runtime Announcements", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Announcements", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 19: Runtime SEO
# ──────────────────────────────────────────────────────────────
section("19. RUNTIME SEO")

try:
    r = requests.get(f"{RUNTIME_API}/seo", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, dict):
            log_result("Runtime SEO (returns dict)", True)
        else:
            log_result("Runtime SEO (returns dict)", False, f"Expected dict, got {type(data)}")
    else:
        log_result("Runtime SEO (returns dict)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime SEO (returns dict)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 20: Runtime Tools
# ──────────────────────────────────────────────────────────────
section("20. RUNTIME TOOLS")

try:
    r = requests.get(f"{RUNTIME_API}/tools", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            log_result("Runtime Tools List", True)
        else:
            log_result("Runtime Tools List", False, f"Expected list, got {type(data)}")
    else:
        log_result("Runtime Tools List", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Tools List", False, str(e))

# Filter by category
try:
    r = requests.get(f"{RUNTIME_API}/tools?category=testing", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            log_result("Runtime Tools (category filter)", True)
        else:
            log_result("Runtime Tools (category filter)", False, f"Expected list, got {type(data)}")
    else:
        log_result("Runtime Tools (category filter)", False, f"Status {r.status_code}")
except Exception as e:
    log_result("Runtime Tools (category filter)", False, str(e))

# Search tools
try:
    r = requests.get(f"{RUNTIME_API}/tools?q=pdf", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            log_result("Runtime Tools (search query)", True)
        else:
            log_result("Runtime Tools (search query)", False, f"Expected list, got {type(data)}")
    else:
        log_result("Runtime Tools (search query)", False, f"Status {r.status_code}")
except Exception as e:
    log_result("Runtime Tools (search query)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 21: Runtime Pages
# ──────────────────────────────────────────────────────────────
section("21. RUNTIME PAGES")

try:
    r = requests.get(f"{RUNTIME_API}/pages", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            slugs = [p["slug"] for p in data]
            if "home" in slugs:
                log_result("Runtime Pages List (home page present)", True)
            else:
                log_result("Runtime Pages List (home page present)", False, f"Slugs: {slugs}")
        else:
            log_result("Runtime Pages List (home page present)", False, f"Expected list, got {type(data)}")
    else:
        log_result("Runtime Pages List (home page present)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Pages List (home page present)", False, str(e))

# Page by slug
try:
    r = requests.get(f"{RUNTIME_API}/pages/home", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if data.get("slug") == "home" and "title" in data:
            log_result("Runtime Page by Slug (home)", True)
        else:
            log_result("Runtime Page by Slug (home)", False, f"Wrong data: {data}")
    else:
        log_result("Runtime Page by Slug (home)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Page by Slug (home)", False, str(e))

# Page by slug — our created pytest-page
try:
    r = requests.get(f"{RUNTIME_API}/pages/{PAGE_SLUG}", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if data.get("slug") == PAGE_SLUG:
            log_result(f"Runtime Page by Slug ({PAGE_SLUG})", True)
        else:
            log_result(f"Runtime Page by Slug ({PAGE_SLUG})", False, f"Wrong slug: {data}")
    else:
        log_result(f"Runtime Page by Slug ({PAGE_SLUG})", False, f"Status {r.status_code}")
except Exception as e:
    log_result(f"Runtime Page by Slug ({PAGE_SLUG})", False, str(e))

# Non-existent page → 404
try:
    r = requests.get(f"{RUNTIME_API}/pages/definitely-does-not-exist-xyz", timeout=15)
    if r.status_code == 404:
        log_result("Runtime Page by Slug (non-existent → 404)", True)
    else:
        log_result("Runtime Page by Slug (non-existent → 404)", False, f"Expected 404, got {r.status_code}")
except Exception as e:
    log_result("Runtime Page by Slug (non-existent → 404)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 22: Runtime Search
# ──────────────────────────────────────────────────────────────
section("22. RUNTIME SEARCH")

try:
    r = requests.get(f"{RUNTIME_API}/search?q=home", timeout=15)
    if r.status_code == 200:
        data = r.json()
        required = {"tools", "pages", "navigation"}
        missing = required - set(data.keys())
        if not missing:
            log_result("Runtime Search (structure)", True)
        else:
            log_result("Runtime Search (structure)", False, f"Missing keys: {missing}")
    else:
        log_result("Runtime Search (structure)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Search (structure)", False, str(e))

try:
    r = requests.get(f"{RUNTIME_API}/search?q=home", timeout=15)
    if r.status_code == 200:
        data = r.json()
        pages = data.get("pages", [])
        page_slugs = [p.get("slug") for p in pages]
        if "home" in page_slugs:
            log_result("Runtime Search (home page in results)", True)
        else:
            log_result("Runtime Search (home page in results)", False, f"Pages: {pages}")
    else:
        log_result("Runtime Search (home page in results)", False, f"Status {r.status_code}")
except Exception as e:
    log_result("Runtime Search (home page in results)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 23: Runtime Sitemap
# ──────────────────────────────────────────────────────────────
section("23. RUNTIME SITEMAP")

try:
    r = requests.get(f"{RUNTIME_API}/sitemap", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if "urls" in data and "generated_at" in data and isinstance(data["urls"], list):
            if "/" in data["urls"]:
                log_result("Runtime Sitemap (contains root /)", True)
            else:
                log_result("Runtime Sitemap (contains root /)", False, f"URLs: {data['urls'][:10]}")
        else:
            log_result("Runtime Sitemap (contains root /)", False, f"Wrong structure: {data}")
    else:
        log_result("Runtime Sitemap (contains root /)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Sitemap (contains root /)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 24: Runtime Branding
# ──────────────────────────────────────────────────────────────
section("24. RUNTIME BRANDING")

try:
    r = requests.get(f"{RUNTIME_API}/branding", timeout=15)
    if r.status_code == 200:
        data = r.json()
        required = ["site_name", "tagline", "logo_url", "favicon_url"]
        missing = [k for k in required if k not in data]
        if not missing:
            log_result("Runtime Branding (structure)", True)
        else:
            log_result("Runtime Branding (structure)", False, f"Missing: {missing}")
    else:
        log_result("Runtime Branding (structure)", False, f"Status {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Branding (structure)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 25: Preview Token Enforcement
# ──────────────────────────────────────────────────────────────
section("25. PREVIEW TOKEN ENFORCEMENT")

try:
    # Preview with no token should 403
    r = requests.get(f"{RUNTIME_API}/config?preview=true", timeout=15)
    if r.status_code == 403:
        log_result("Runtime Preview (no token → 403)", True)
    else:
        log_result("Runtime Preview (no token → 403)", False, f"Expected 403, got {r.status_code}")
except Exception as e:
    log_result("Runtime Preview (no token → 403)", False, str(e))

try:
    # Preview with wrong token should 403
    r = requests.get(
        f"{RUNTIME_API}/config?preview=true",
        headers={"x-preview-token": "wrong-token"},
        timeout=15,
    )
    if r.status_code == 403:
        log_result("Runtime Preview (wrong token → 403)", True)
    else:
        log_result("Runtime Preview (wrong token → 403)", False, f"Expected 403, got {r.status_code}")
except Exception as e:
    log_result("Runtime Preview (wrong token → 403)", False, str(e))

try:
    # Preview with correct token should work
    PREVIEW_TOKEN = "toolverse-preview-token"
    r = requests.get(
        f"{RUNTIME_API}/config?preview=true",
        headers={"x-preview-token": PREVIEW_TOKEN},
        timeout=15,
    )
    if r.status_code == 200:
        log_result("Runtime Preview (correct token → 200)", True)
    else:
        log_result("Runtime Preview (correct token → 200)", False, f"Expected 200, got {r.status_code}: {r.text[:200]}")
except Exception as e:
    log_result("Runtime Preview (correct token → 200)", False, str(e))


# ──────────────────────────────────────────────────────────────
# SECTION 26: Edge Cases & Validation
# ──────────────────────────────────────────────────────────────
section("26. EDGE CASES & VALIDATION")

# Admin dashboard without any permission header (defaults to "*")
try:
    r = requests.get(f"{ADMIN_API}/dashboard", timeout=15)
    if r.status_code == 200:
        log_result("Admin Dashboard (no permission header - defaults to * allowed)", True)
    else:
        log_result("Admin Dashboard (no permission header - defaults to * allowed)", False, f"Status {r.status_code}")
except Exception as e:
    log_result("Admin Dashboard (no permission header - defaults to * allowed)", False, str(e))

# Feature list exclude_disabled
try:
    r = requests.get(
        f"{ADMIN_API}/features?include_disabled=false",
        headers=FULL_PERMS_HEADERS,
        timeout=15,
    )
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            log_result("Admin Features (include_disabled=false)", True)
        else:
            log_result("Admin Features (include_disabled=false)", False, f"Expected list, got {type(data)}")
    else:
        log_result("Admin Features (include_disabled=false)", False, f"Status {r.status_code}")
except Exception as e:
    log_result("Admin Features (include_disabled=false)", False, str(e))

# Non-existent endpoint should 404
try:
    r = requests.get(f"{RUNTIME_API}/tools/non-existent-tool-xyz", timeout=15)
    if r.status_code == 404:
        log_result("Runtime Tool Detail (non-existent → 404)", True)
    else:
        log_result("Runtime Tool Detail (non-existent → 404)", False, f"Expected 404, got {r.status_code}")
except Exception as e:
    log_result("Runtime Tool Detail (non-existent → 404)", False, str(e))

# Runtime search with missing q parameter
try:
    r = requests.get(f"{RUNTIME_API}/search", timeout=15)
    if r.status_code in (400, 422):
        log_result("Runtime Search (missing q → 400/422)", True)
    else:
        log_result("Runtime Search (missing q → 400/422)", False, f"Expected 400/422, got {r.status_code}")
except Exception as e:
    log_result("Runtime Search (missing q → 400/422)", False, str(e))

# Admin search with missing q parameter
try:
    r = requests.get(f"{ADMIN_API}/search", headers=FULL_PERMS_HEADERS, timeout=15)
    if r.status_code in (400, 422):
        log_result("Admin Search (missing q → 400/422)", True)
    else:
        log_result("Admin Search (missing q → 400/422)", False, f"Expected 400/422, got {r.status_code}")
except Exception as e:
    log_result("Admin Search (missing q → 400/422)", False, str(e))

# Root API endpoint
try:
    r = requests.get(f"{BACKEND_URL}/api/", timeout=15)
    if r.status_code == 200:
        data = r.json()
        if "message" in data:
            log_result("Root API Endpoint", True)
        else:
            log_result("Root API Endpoint", False, f"Missing message: {data}")
    else:
        log_result("Root API Endpoint", False, f"Status {r.status_code}")
except Exception as e:
    log_result("Root API Endpoint", False, str(e))


# ══════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ══════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("  ADMIN + RUNTIME API TEST SUMMARY")
print(f"{'='*60}")
print(f"  ✓ PASSED: {len(results['passed'])} tests")
print(f"  ✗ FAILED: {len(results['failed'])} tests")
print(f"  Total:    {len(results['passed']) + len(results['failed'])} tests")

if results["failed"]:
    print(f"\n  Failed tests:")
    for fail in results["failed"]:
        print(f"    ✗ {fail['test']}")
        print(f"      → {fail['details']}")

print(f"\n{'='*60}")
