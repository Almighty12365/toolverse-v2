import json
import os
import shutil
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .constants import DEFAULT_ROLES, DEFAULT_SETTINGS
from .repository import AdminRepository
from .schemas import PluginManifest
from .security import decrypt_value, encrypt_value

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

RUNTIME_CACHE_TTL_SECONDS = 30


class AdminService:
    def __init__(self, db: Session, plugins_root: str):
        self.db = db
        self.repo = AdminRepository(db)
        self.plugins_root = Path(plugins_root)
        self.plugins_root.mkdir(parents=True, exist_ok=True)
        self._runtime_cache: Dict[str, Tuple[datetime, Any]] = {}

    def bootstrap(self, static_tools: List[Dict[str, Any]]) -> None:
        self._bootstrap_roles()
        self._bootstrap_admin_user()
        self._bootstrap_settings()
        self.sync_features_from_static_tools(static_tools)
        self._bootstrap_default_navigation()
        self._bootstrap_default_pages()
        self.db.commit()

    def _bootstrap_roles(self) -> None:
        for role in DEFAULT_ROLES:
            if not self.repo.get_role_by_name(role["name"]):
                self.repo.upsert_role(role)

    def _bootstrap_admin_user(self) -> None:
        email = "aman74560027@gmail.com"
        user = self.repo.get_user_by_email(email)
        if user:
            return
        user = self.repo.create_user(
            {
                "email": email,
                "password_hash": None,
                "must_change_password": True,
                "is_active": True,
                "profile": {"display_name": "Super Admin", "bootstrap_required": True},
            }
        )
        role = self.repo.get_role_by_name("super_admin")
        if role:
            self.repo.assign_role_to_user(user.id, role.id)

    def _bootstrap_settings(self) -> None:
        for key, value in DEFAULT_SETTINGS.items():
            if not self.repo.get_setting(key):
                self.repo.upsert_setting(key, value, encrypted=False)

    def _bootstrap_default_navigation(self) -> None:
        for key in ["navbar", "sidebar", "footer"]:
            if not self.repo.get_navigation(key):
                self.repo.upsert_navigation(key, [])

    def _bootstrap_default_pages(self) -> None:
        if not self.repo.get_page("home"):
            self.repo.upsert_page(
                "home",
                {
                    "title": "Home",
                    "page_type": "homepage",
                    "status": "published",
                    "seo": {},
                    "blocks": [
                        {"id": "hero-1", "type": "hero", "props": {"title": "ToolVerse", "subtitle": "Enterprise Website OS"}, "children": []},
                        {"id": "tools-1", "type": "tools_grid", "props": {"title": "Popular Tools"}, "children": []},
                        {"id": "faq-1", "type": "faq", "props": {"title": "Frequently Asked Questions", "items": []}, "children": []},
                    ],
                    "meta_json": {},
                },
            )

    def sync_features_from_static_tools(self, static_tools: List[Dict[str, Any]]) -> Dict[str, int]:
        created = 0
        updated = 0
        for tool in static_tools:
            existing = self.repo.get_feature(tool["id"])
            payload = {
                "name": tool["name"],
                "description": tool.get("desc", ""),
                "category": tool.get("category", "general"),
                "endpoint": tool.get("endpoint"),
                "client_handler": tool.get("client"),
                "meta_json": {
                    "accept": tool.get("accept"),
                    "multi": tool.get("multi", False),
                    "color": tool.get("color"),
                    "noFile": tool.get("noFile", False),
                },
            }
            self.repo.upsert_feature(tool["id"], payload)
            if existing:
                updated += 1
            else:
                created += 1
        self.db.commit()
        return {"created": created, "updated": updated}

    def list_features(self, include_disabled: bool = True) -> List[Dict[str, Any]]:
        rows = self.repo.list_features(include_disabled=include_disabled)
        return [self._feature_to_dict(r) for r in rows]

    def upsert_feature(self, key: str, payload: Dict[str, Any], actor: str = "system") -> Dict[str, Any]:
        row = self.repo.upsert_feature(key, payload)
        self.write_audit(actor, "feature.upsert", "feature", key, payload)
        self.db.commit()
        return self._feature_to_dict(row)

    def delete_feature(self, key: str, actor: str = "system") -> bool:
        deleted = self.repo.delete_feature(key)
        self.write_audit(actor, "feature.delete", "feature", key, {})
        self.db.commit()
        return deleted

    def list_roles(self) -> List[Dict[str, Any]]:
        rows = self.repo.list_roles()
        return [
            {
                "id": r.id,
                "name": r.name,
                "label": r.label,
                "permissions": r.permissions or [],
                "is_system": r.is_system,
            }
            for r in rows
        ]

    def upsert_role(self, name: str, payload: Dict[str, Any], actor: str = "system") -> Dict[str, Any]:
        payload["name"] = name
        role = self.repo.upsert_role(payload)
        self.write_audit(actor, "role.upsert", "role", name, payload)
        self.db.commit()
        return {
            "id": role.id,
            "name": role.name,
            "label": role.label,
            "permissions": role.permissions or [],
            "is_system": role.is_system,
        }

    def admin_login(self, email: str, password: str) -> Dict[str, Any]:
        user = self.repo.get_user_by_email(email)
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not user.password_hash:
            return {
                "email": user.email,
                "requires_password_setup": True,
                "must_change_password": True,
                "roles": ["super_admin"],
                "permissions": ["*"],
            }
        if not pwd_context.verify(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user.last_login_at = datetime.utcnow()
        role_names = [link.role.name for link in user.role_links]
        perms = set()
        for link in user.role_links:
            for p in (link.role.permissions or []):
                perms.add(p)
        self.db.add(user)
        self.db.commit()
        return {
            "email": user.email,
            "roles": role_names,
            "permissions": sorted(perms),
            "must_change_password": user.must_change_password,
        }

    def setup_password_first_login(self, email: str, new_password: str) -> Dict[str, Any]:
        user = self.repo.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="Admin account not found")
        if len(new_password) < 12:
            raise HTTPException(status_code=400, detail="Password must be at least 12 characters")
        user.password_hash = pwd_context.hash(new_password)
        user.must_change_password = False
        user.profile = {**(user.profile or {}), "bootstrap_required": False}
        self.db.add(user)
        self.write_audit(email, "auth.password_setup", "user", email, {})
        self.db.commit()
        return {"email": email, "password_set": True}

    def change_password(self, email: str, current_password: str, new_password: str) -> Dict[str, Any]:
        user = self.repo.get_user_by_email(email)
        if not user or not user.password_hash:
            raise HTTPException(status_code=404, detail="Admin account not found")
        if not pwd_context.verify(current_password, user.password_hash):
            raise HTTPException(status_code=401, detail="Current password is invalid")
        if len(new_password) < 12:
            raise HTTPException(status_code=400, detail="Password must be at least 12 characters")
        user.password_hash = pwd_context.hash(new_password)
        user.must_change_password = False
        self.db.add(user)
        self.write_audit(email, "auth.password_change", "user", email, {})
        self.db.commit()
        return {"email": email, "password_changed": True}

    def get_settings(self, key: Optional[str] = None) -> Dict[str, Any]:
        if key:
            row = self.repo.get_setting(key)
            if not row:
                return {}
            if row.is_encrypted:
                return json.loads(decrypt_value((row.value or {}).get("payload", "")))
            return row.value or {}
        rows = self.repo.list_settings()
        out: Dict[str, Any] = {}
        for row in rows:
            if row.is_encrypted:
                out[row.key] = json.loads(decrypt_value((row.value or {}).get("payload", "")))
            else:
                out[row.key] = row.value or {}
        return out

    def set_settings(self, key: str, value: Dict[str, Any], encrypted: bool = False, actor: str = "system") -> Dict[str, Any]:
        payload = {"payload": encrypt_value(json.dumps(value))} if encrypted else value
        self.repo.upsert_setting(key, payload, encrypted=encrypted)
        self.write_audit(actor, "settings.update", "settings", key, {"encrypted": encrypted})
        self.db.commit()
        return {"key": key, "saved": True}

    def list_pages(self) -> List[Dict[str, Any]]:
        rows = self.repo.list_pages()
        return [
            {
                "id": p.id,
                "slug": p.slug,
                "title": p.title,
                "page_type": p.page_type,
                "status": p.status,
                "seo": p.seo or {},
                "blocks": p.blocks or [],
            "metadata": p.meta_json or {},
            }
            for p in rows
        ]

    def upsert_page(self, slug: str, payload: Dict[str, Any], actor: str = "system") -> Dict[str, Any]:
        row = self.repo.upsert_page(slug, payload)
        self.write_audit(actor, "page.upsert", "page", slug, payload)
        self.db.commit()
        return {
            "id": row.id,
            "slug": row.slug,
            "title": row.title,
            "page_type": row.page_type,
            "status": row.status,
            "seo": row.seo or {},
            "blocks": row.blocks or [],
            "metadata": row.meta_json or {},
        }

    def list_navigation(self) -> List[Dict[str, Any]]:
        rows = self.repo.list_navigation()
        return [{"id": n.id, "key": n.key, "items": n.items or []} for n in rows]

    def upsert_navigation(self, key: str, items: List[Dict[str, Any]], actor: str = "system") -> Dict[str, Any]:
        row = self.repo.upsert_navigation(key, items)
        self.write_audit(actor, "navigation.upsert", "navigation", key, {"count": len(items)})
        self.db.commit()
        return {"id": row.id, "key": row.key, "items": row.items or []}

    def install_plugin_from_zip(self, zip_path: str, actor: str = "system") -> Dict[str, Any]:
        with zipfile.ZipFile(zip_path, "r") as zf:
            names = zf.namelist()
            manifest_candidates = [n for n in names if n.endswith("plugin.json")]
            if not manifest_candidates:
                raise HTTPException(status_code=400, detail="plugin.json not found in zip")
            manifest_raw = zf.read(manifest_candidates[0]).decode("utf-8")
            manifest_data = json.loads(manifest_raw)
            manifest = PluginManifest(**manifest_data)

            target = self.plugins_root / manifest.id / manifest.version
            if target.exists():
                shutil.rmtree(target)
            target.mkdir(parents=True, exist_ok=True)
            zf.extractall(target)

        row = self.repo.upsert_plugin(
            {
                "plugin_id": manifest.id,
                "name": manifest.name,
                "version": manifest.version,
                "status": "enabled",
                "install_path": str(target),
                "manifest": manifest.model_dump(),
                "health": {"status": "healthy", "checked_at": datetime.utcnow().isoformat()},
                "logs": [{"level": "info", "message": "Plugin installed", "at": datetime.utcnow().isoformat()}],
                "storage": {},
                "analytics": {},
            }
        )
        self.write_audit(actor, "plugin.install", "plugin", manifest.id, {"version": manifest.version})
        self.db.commit()
        return self._plugin_to_dict(row)

    def list_plugins(self) -> List[Dict[str, Any]]:
        return [self._plugin_to_dict(p) for p in self.repo.list_plugins()]

    def set_plugin_status(self, plugin_id: str, enabled: bool, actor: str = "system") -> Dict[str, Any]:
        row = self.repo.get_plugin(plugin_id)
        if not row:
            raise HTTPException(status_code=404, detail="Plugin not found")
        row.status = "enabled" if enabled else "disabled"
        self.db.add(row)
        self.write_audit(actor, "plugin.status", "plugin", plugin_id, {"status": row.status})
        self.db.commit()
        return self._plugin_to_dict(row)

    def delete_plugin(self, plugin_id: str, actor: str = "system") -> bool:
        row = self.repo.get_plugin(plugin_id)
        if not row:
            return False
        install_path = Path(row.install_path or "")
        if install_path.exists():
            shutil.rmtree(install_path, ignore_errors=True)
        deleted = self.repo.delete_plugin(plugin_id)
        self.write_audit(actor, "plugin.delete", "plugin", plugin_id, {})
        self.db.commit()
        return deleted

    def plugin_rollback(self, plugin_id: str, target_version: str, actor: str = "system") -> Dict[str, Any]:
        row = self.repo.get_plugin(plugin_id)
        if not row:
            raise HTTPException(status_code=404, detail="Plugin not found")
        version_dir = self.plugins_root / plugin_id / target_version
        if not version_dir.exists():
            raise HTTPException(status_code=404, detail="Target version not found on disk")
        row.version = target_version
        row.install_path = str(version_dir)
        logs = row.logs or []
        logs.append({"level": "warn", "message": f"Rolled back to {target_version}", "at": datetime.utcnow().isoformat()})
        row.logs = logs
        self.db.add(row)
        self.write_audit(actor, "plugin.rollback", "plugin", plugin_id, {"target_version": target_version})
        self.db.commit()
        return self._plugin_to_dict(row)

    def dashboard_snapshot(self) -> Dict[str, Any]:
        features = self.repo.list_features(include_disabled=True)
        plugins = self.repo.list_plugins()
        pages = self.repo.list_pages()
        logs = self.repo.list_audit_logs(limit=20)
        return {
            "features": {"total": len(features)},
            "plugins": {"total": len(plugins), "enabled": len([p for p in plugins if p.status == "enabled"])},
            "pages": {"total": len(pages)},
            "admin_users": {"total": 1},
            "system": {"server_time": datetime.utcnow().isoformat(), "status": "healthy", "cpu": None, "ram": None, "storage": None},
            "timeline": [self._audit_to_dict(l) for l in logs],
        }

    def global_search(self, query: str) -> Dict[str, List[Dict[str, Any]]]:
        q = query.lower()
        features = [f for f in self.list_features(True) if q in f["name"].lower() or q in f["key"].lower()]
        pages = [p for p in self.list_pages() if q in p["title"].lower() or q in p["slug"].lower()]
        plugins = [p for p in self.list_plugins() if q in p["name"].lower() or q in p["plugin_id"].lower()]
        settings = [{"key": k} for k in self.get_settings().keys() if q in k.lower()]
        return {"features": features[:20], "pages": pages[:20], "plugins": plugins[:20], "settings": settings[:20]}

    def get_preview_token(self) -> str:
        row = self.repo.get_setting("preview")
        if not row:
            self.repo.upsert_setting("preview", {"token": "toolverse-preview-token"}, encrypted=False)
            self.db.commit()
            row = self.repo.get_setting("preview")
        val = row.value or {}
        token = val.get("token") if isinstance(val, dict) else None
        if not token:
            token = "toolverse-preview-token"
            self.repo.upsert_setting("preview", {"token": token}, encrypted=False)
            self.db.commit()
        return token

    def _cache_get(self, key: str):
        entry = self._runtime_cache.get(key)
        if not entry:
            return None
        ts, data = entry
        age = (datetime.utcnow() - ts).total_seconds()
        if age > RUNTIME_CACHE_TTL_SECONDS:
            self._runtime_cache.pop(key, None)
            return None
        return data

    def _cache_set(self, key: str, data: Any):
        self._runtime_cache[key] = (datetime.utcnow(), data)

    def _cache_invalidate_runtime(self):
        self._runtime_cache = {}

    def _runtime_key(self, base: str, preview: bool) -> str:
        return f"{base}:preview={1 if preview else 0}"

    def _get_runtime_store(self, preview: bool) -> Dict[str, Any]:
        all_settings = self.get_settings()
        runtime = all_settings.get("runtime", {}) if isinstance(all_settings, dict) else {}
        published = runtime.get("published", {}) if isinstance(runtime, dict) else {}
        draft = runtime.get("draft", {}) if isinstance(runtime, dict) else {}
        return draft if preview else published

    def _default_runtime_store(self) -> Dict[str, Any]:
        return {
            "homepage": {
                "slug": "home",
                "title": "ToolVerse",
                "sections": [
                    {"id": "hero-1", "type": "hero", "props": {"title": "ToolVerse", "subtitle": "Enterprise Website OS"}},
                    {"id": "categories-1", "type": "categories", "props": {"title": "Categories"}},
                    {"id": "tools-1", "type": "tools_grid", "props": {"title": "Popular Tools"}},
                    {"id": "faq-1", "type": "faq", "props": {"title": "FAQ", "items": []}},
                ],
            },
            "navigation": {
                "navbar": [],
                "sidebar": [],
                "footer": [],
            },
            "theme": {
                "site_name": "Toolverse",
                "tagline": "Enterprise Website OS",
                "logo_url": "",
                "favicon_url": "",
                "primary_color": "#a21caf",
                "secondary_color": "#06b6d4",
                "font_family": "Inter, system-ui, sans-serif",
                "radius": "1rem",
                "button_style": "solid",
                "card_style": "glass",
                "dark_mode_default": True,
                "css_variables": {},
            },
            "announcements": {
                "top_banner": {"enabled": False, "text": "", "link": ""},
                "popup": {"enabled": False, "title": "", "body": ""},
                "alert_bar": {"enabled": False, "text": "", "variant": "info"},
            },
            "seo": {
                "title": "ToolVerse",
                "description": "Enterprise Website OS",
                "keywords": [],
                "canonical": "",
                "robots": "index,follow",
                "open_graph": {},
                "twitter": {},
            },
            "categories": [],
            "widgets": [],
            "footer": {"columns": []},
            "branding": {
                "brand_name": "ToolVerse",
                "logo_url": "",
                "favicon_url": "",
            },
        }

    def _merge_runtime(self, preview: bool) -> Dict[str, Any]:
        defaults = self._default_runtime_store()
        store = self._get_runtime_store(preview=preview)
        if not store:
            return defaults
        merged = {**defaults, **store}
        for key in ["navigation", "theme", "announcements", "seo", "homepage", "footer", "branding"]:
            if isinstance(defaults.get(key), dict):
                merged[key] = {**defaults.get(key, {}), **(store.get(key, {}) if isinstance(store.get(key), dict) else {})}
        return merged

    def _published_or_preview_feature_rows(self, preview: bool):
        return self.repo.list_features(include_disabled=True)

    def runtime_config_snapshot(self, preview: bool = False) -> Dict[str, Any]:
        cache_key = self._runtime_key("config", preview)
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached
        runtime = self._merge_runtime(preview=preview)
        features = [self._feature_to_dict(r) for r in self._published_or_preview_feature_rows(preview)]
        pages = self.runtime_pages(preview=preview)
        data = {
            "homepage": runtime.get("homepage", {}),
            "navigation": runtime.get("navigation", {}),
            "theme": runtime.get("theme", {}),
            "site_settings": self.get_settings().get("general", {}),
            "categories": runtime.get("categories", []),
            "tools": self.runtime_tools(preview=preview),
            "feature_registry": features,
            "homepage_sections": (runtime.get("homepage", {}) or {}).get("sections", []),
            "widgets": runtime.get("widgets", []),
            "announcements": runtime.get("announcements", {}),
            "seo": runtime.get("seo", {}),
            "pages": pages,
            "footer": runtime.get("footer", {}),
            "branding": runtime.get("branding", {}),
        }
        self._cache_set(cache_key, data)
        return data

    def runtime_homepage(self, preview: bool = False) -> Dict[str, Any]:
        cache_key = self._runtime_key("homepage", preview)
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached
        runtime = self._merge_runtime(preview=preview)
        page = self.repo.get_page("home")
        homepage = runtime.get("homepage", {})
        if page and page.status == "published":
            homepage = {
                **homepage,
                "slug": page.slug,
                "title": page.title,
                "seo": page.seo or {},
                "sections": page.blocks or homepage.get("sections", []),
            }
        self._cache_set(cache_key, homepage)
        return homepage

    def runtime_navigation(self, preview: bool = False) -> Dict[str, Any]:
        cache_key = self._runtime_key("navigation", preview)
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached
        runtime = self._merge_runtime(preview=preview)
        nav = runtime.get("navigation", {})
        rows = self.repo.list_navigation()
        db_nav = {r.key: (r.items or []) for r in rows}
        data = {
            "navbar": db_nav.get("navbar", nav.get("navbar", [])),
            "sidebar": db_nav.get("sidebar", nav.get("sidebar", [])),
            "footer": db_nav.get("footer", nav.get("footer", [])),
            "mega_menu": db_nav.get("mega_menu", nav.get("mega_menu", [])),
        }
        self._cache_set(cache_key, data)
        return data

    def runtime_theme(self, preview: bool = False) -> Dict[str, Any]:
        cache_key = self._runtime_key("theme", preview)
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached
        runtime = self._merge_runtime(preview=preview)
        settings = self.get_settings()
        data = {
            **runtime.get("theme", {}),
            **(settings.get("branding", {}) if isinstance(settings, dict) else {}),
            **(settings.get("theme", {}) if isinstance(settings, dict) else {}),
            **(settings.get("general", {}) if isinstance(settings, dict) else {}),
        }
        self._cache_set(cache_key, data)
        return data

    def runtime_announcements(self, preview: bool = False) -> Dict[str, Any]:
        cache_key = self._runtime_key("announcements", preview)
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached
        runtime = self._merge_runtime(preview=preview)
        settings = self.get_settings()
        data = {
            **runtime.get("announcements", {}),
            **(settings.get("announcements", {}) if isinstance(settings, dict) else {}),
        }
        self._cache_set(cache_key, data)
        return data

    def runtime_seo(self, preview: bool = False) -> Dict[str, Any]:
        cache_key = self._runtime_key("seo", preview)
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached
        runtime = self._merge_runtime(preview=preview)
        settings = self.get_settings()
        data = {
            **runtime.get("seo", {}),
            **(settings.get("seo", {}) if isinstance(settings, dict) else {}),
        }
        self._cache_set(cache_key, data)
        return data

    def runtime_tools(self, category: Optional[str] = None, q: Optional[str] = None, preview: bool = False) -> List[Dict[str, Any]]:
        rows = [self._feature_to_dict(r) for r in self._published_or_preview_feature_rows(preview)]
        rows = [r for r in rows if (r.get("flags", {}).get("enabled", True) is True)]
        if category:
            rows = [r for r in rows if (r.get("category") or "").lower() == category.lower()]
        if q:
            qq = q.lower()
            rows = [r for r in rows if qq in (r.get("name", "").lower()) or qq in (r.get("description", "").lower())]
        return rows

    def runtime_tool_detail(self, tool_key: str, preview: bool = False) -> Dict[str, Any]:
        rows = self.runtime_tools(preview=preview)
        for r in rows:
            if r.get("key") == tool_key:
                return r
        raise HTTPException(status_code=404, detail="Tool not found")

    def runtime_pages(self, preview: bool = False) -> List[Dict[str, Any]]:
        rows = self.repo.list_pages()
        out = []
        for p in rows:
            if not preview and p.status != "published":
                continue
            out.append(
                {
                    "slug": p.slug,
                    "title": p.title,
                    "page_type": p.page_type,
                    "status": p.status,
                    "seo": p.seo or {},
                    "sections": p.blocks or [],
                }
            )
        return out

    def runtime_page_by_slug(self, slug: str, preview: bool = False) -> Dict[str, Any]:
        page = self.repo.get_page(slug)
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        if not preview and page.status != "published":
            raise HTTPException(status_code=404, detail="Page not found")
        return {
            "slug": page.slug,
            "title": page.title,
            "page_type": page.page_type,
            "status": page.status,
            "seo": page.seo or {},
            "sections": page.blocks or [],
        }

    def runtime_search(self, q: str, preview: bool = False) -> Dict[str, Any]:
        query = q.lower()
        tools = self.runtime_tools(preview=preview)
        pages = self.runtime_pages(preview=preview)
        navigation = self.runtime_navigation(preview=preview)

        tool_hits = [t for t in tools if query in t.get("name", "").lower() or query in t.get("description", "").lower()]
        page_hits = [p for p in pages if query in p.get("title", "").lower() or query in p.get("slug", "").lower()]

        nav_hits = []
        for area in ["navbar", "sidebar", "footer", "mega_menu"]:
            for item in navigation.get(area, []):
                label = (item.get("label") or "").lower()
                href = (item.get("href") or "").lower()
                if query in label or query in href:
                    nav_hits.append({"area": area, **item})

        return {"tools": tool_hits[:30], "pages": page_hits[:30], "navigation": nav_hits[:30]}

    def runtime_sitemap(self, preview: bool = False) -> Dict[str, Any]:
        pages = self.runtime_pages(preview=preview)
        tools = self.runtime_tools(preview=preview)
        urls = ["/", "/pricing"] + [f"/tool/{t['key']}" for t in tools] + [f"/page/{p['slug']}" for p in pages if p["slug"] != "home"]
        return {"generated_at": datetime.utcnow().isoformat(), "urls": sorted(list(set(urls)))}

    def publish_runtime(self, actor: str = "system") -> Dict[str, Any]:
        settings = self.get_settings()
        runtime = settings.get("runtime", {}) if isinstance(settings, dict) else {}
        draft = runtime.get("draft", {}) if isinstance(runtime, dict) else {}
        published = runtime.get("published", {}) if isinstance(runtime, dict) else {}
        revisions = runtime.get("revisions", []) if isinstance(runtime, dict) else []
        revisions.append(
            {
                "at": datetime.utcnow().isoformat(),
                "actor": actor,
                "published_before": published,
            }
        )
        if len(revisions) > 50:
            revisions = revisions[-50:]
        payload = {**runtime, "published": draft or published, "revisions": revisions, "published_at": datetime.utcnow().isoformat()}
        self.set_settings("runtime", payload, encrypted=False, actor=actor)
        self._cache_invalidate_runtime()
        return {"published": True, "published_at": payload["published_at"]}

    def save_runtime_draft(self, draft: Dict[str, Any], actor: str = "system") -> Dict[str, Any]:
        settings = self.get_settings()
        runtime = settings.get("runtime", {}) if isinstance(settings, dict) else {}
        payload = {**runtime, "draft": draft, "updated_at": datetime.utcnow().isoformat()}
        self.set_settings("runtime", payload, encrypted=False, actor=actor)
        self._cache_invalidate_runtime()
        return {"saved": True, "updated_at": payload["updated_at"]}

    def rollback_runtime(self, revision_index: int, actor: str = "system") -> Dict[str, Any]:
        settings = self.get_settings()
        runtime = settings.get("runtime", {}) if isinstance(settings, dict) else {}
        revisions = runtime.get("revisions", []) if isinstance(runtime, dict) else []
        if revision_index < 0 or revision_index >= len(revisions):
            raise HTTPException(status_code=404, detail="Revision not found")
        selected = revisions[revision_index]
        published = selected.get("published_before", {})
        payload = {**runtime, "published": published, "rolled_back_at": datetime.utcnow().isoformat()}
        self.set_settings("runtime", payload, encrypted=False, actor=actor)
        self._cache_invalidate_runtime()
        return {"rolled_back": True, "rolled_back_at": payload["rolled_back_at"]}

    def write_audit(
        self,
        actor: str,
        action: str,
        resource_type: str,
        resource_id: str,
        payload: Dict[str, Any],
        ip_address: Optional[str] = None,
    ) -> None:
        self.repo.create_audit_log(
            {
                "actor": actor,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "payload": payload,
                "ip_address": ip_address,
            }
        )

    def list_audit_logs(self, limit: int = 200) -> List[Dict[str, Any]]:
        return [self._audit_to_dict(l) for l in self.repo.list_audit_logs(limit=limit)]

    @staticmethod
    def _feature_to_dict(row) -> Dict[str, Any]:
        return {
            "id": row.id,
            "key": row.key,
            "name": row.name,
            "description": row.description,
            "category": row.category,
            "version": row.version,
            "priority": row.priority,
            "endpoint": row.endpoint,
            "client_handler": row.client_handler,
            "tags": row.tags or [],
            "dependencies": row.dependencies or [],
            "flags": row.flags or {},
            "visibility": row.visibility or {},
            "seo": row.seo or {},
            "analytics": row.analytics or {},
            "metadata": row.meta_json or {},
        }

    @staticmethod
    def _plugin_to_dict(row) -> Dict[str, Any]:
        return {
            "id": row.id,
            "plugin_id": row.plugin_id,
            "name": row.name,
            "version": row.version,
            "status": row.status,
            "install_path": row.install_path,
            "manifest": row.manifest or {},
            "health": row.health or {},
            "logs": row.logs or [],
            "storage": row.storage or {},
            "analytics": row.analytics or {},
        }

    @staticmethod
    def _audit_to_dict(row) -> Dict[str, Any]:
        return {
            "id": row.id,
            "actor": row.actor,
            "action": row.action,
            "resource_type": row.resource_type,
            "resource_id": row.resource_id,
            "payload": row.payload or {},
            "ip_address": row.ip_address,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }


def get_temp_zip_path(suffix: str = ".zip") -> str:
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    return path
