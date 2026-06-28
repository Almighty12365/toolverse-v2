from __future__ import annotations

from typing import Any, Dict, List, Optional
from sqlalchemy import select, delete
from sqlalchemy.orm import Session, joinedload

from .models import (
    AdminUser,
    AdminUserRole,
    AuditLog,
    Feature,
    Navigation,
    Page,
    Plugin,
    Role,
    Setting,
)


class AdminRepository:
    def __init__(self, db: Session):
        self.db = db

    # ---- roles / users ----
    def get_role_by_name(self, name: str) -> Optional[Role]:
        return self.db.scalar(select(Role).where(Role.name == name))

    def list_roles(self) -> List[Role]:
        return list(self.db.scalars(select(Role).order_by(Role.name.asc())).all())

    def upsert_role(self, payload: Dict[str, Any]) -> Role:
        role = self.get_role_by_name(payload["name"])
        if role:
            role.label = payload["label"]
            role.permissions = payload.get("permissions", [])
            role.is_system = payload.get("is_system", False)
            self.db.add(role)
            return role
        role = Role(**payload)
        self.db.add(role)
        return role

    def get_user_by_email(self, email: str) -> Optional[AdminUser]:
        return self.db.scalar(
            select(AdminUser)
            .options(joinedload(AdminUser.role_links).joinedload(AdminUserRole.role))
            .where(AdminUser.email == email)
        )

    def create_user(self, payload: Dict[str, Any]) -> AdminUser:
        user = AdminUser(**payload)
        self.db.add(user)
        self.db.flush()
        return user

    def assign_role_to_user(self, user_id: int, role_id: int) -> None:
        exists = self.db.scalar(
            select(AdminUserRole).where(AdminUserRole.user_id == user_id, AdminUserRole.role_id == role_id)
        )
        if not exists:
            self.db.add(AdminUserRole(user_id=user_id, role_id=role_id))

    # ---- settings ----
    def get_setting(self, key: str) -> Optional[Setting]:
        return self.db.scalar(select(Setting).where(Setting.key == key))

    def list_settings(self) -> List[Setting]:
        return list(self.db.scalars(select(Setting).order_by(Setting.key.asc())).all())

    def upsert_setting(self, key: str, value: Dict[str, Any], encrypted: bool) -> Setting:
        row = self.get_setting(key)
        if row:
            row.value = value
            row.is_encrypted = encrypted
            self.db.add(row)
            return row
        row = Setting(key=key, value=value, is_encrypted=encrypted)
        self.db.add(row)
        return row

    # ---- features ----
    def get_feature(self, key: str) -> Optional[Feature]:
        return self.db.scalar(select(Feature).where(Feature.key == key))

    def list_features(self, include_disabled: bool = True) -> List[Feature]:
        rows = list(self.db.scalars(select(Feature).order_by(Feature.priority.asc())).all())
        if include_disabled:
            return rows
        return [r for r in rows if (r.flags or {}).get("enabled", True)]

    def upsert_feature(self, key: str, payload: Dict[str, Any]) -> Feature:
        row = self.get_feature(key)
        if row:
            for k, v in payload.items():
                setattr(row, k, v)
            self.db.add(row)
            return row
        payload["key"] = key
        row = Feature(**payload)
        self.db.add(row)
        return row

    def delete_feature(self, key: str) -> bool:
        result = self.db.execute(delete(Feature).where(Feature.key == key))
        return (result.rowcount or 0) > 0

    # ---- pages ----
    def get_page(self, slug: str) -> Optional[Page]:
        return self.db.scalar(select(Page).where(Page.slug == slug))

    def list_pages(self) -> List[Page]:
        return list(self.db.scalars(select(Page).order_by(Page.slug.asc())).all())

    def upsert_page(self, slug: str, payload: Dict[str, Any]) -> Page:
        row = self.get_page(slug)
        if row:
            for k, v in payload.items():
                setattr(row, k, v)
            self.db.add(row)
            return row
        payload["slug"] = slug
        row = Page(**payload)
        self.db.add(row)
        return row

    # ---- navigation ----
    def get_navigation(self, key: str) -> Optional[Navigation]:
        return self.db.scalar(select(Navigation).where(Navigation.key == key))

    def list_navigation(self) -> List[Navigation]:
        return list(self.db.scalars(select(Navigation).order_by(Navigation.key.asc())).all())

    def upsert_navigation(self, key: str, items: List[Dict[str, Any]]) -> Navigation:
        row = self.get_navigation(key)
        if row:
            row.items = items
            self.db.add(row)
            return row
        row = Navigation(key=key, items=items)
        self.db.add(row)
        return row

    # ---- plugins ----
    def get_plugin(self, plugin_id: str) -> Optional[Plugin]:
        return self.db.scalar(select(Plugin).where(Plugin.plugin_id == plugin_id))

    def list_plugins(self) -> List[Plugin]:
        return list(self.db.scalars(select(Plugin).order_by(Plugin.plugin_id.asc())).all())

    def upsert_plugin(self, payload: Dict[str, Any]) -> Plugin:
        row = self.get_plugin(payload["plugin_id"])
        if row:
            for k, v in payload.items():
                setattr(row, k, v)
            self.db.add(row)
            return row
        row = Plugin(**payload)
        self.db.add(row)
        return row

    def delete_plugin(self, plugin_id: str) -> bool:
        result = self.db.execute(delete(Plugin).where(Plugin.plugin_id == plugin_id))
        return (result.rowcount or 0) > 0

    # ---- audit ----
    def create_audit_log(self, payload: Dict[str, Any]) -> AuditLog:
        row = AuditLog(**payload)
        self.db.add(row)
        return row

    def list_audit_logs(self, limit: int = 200) -> List[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        return list(self.db.scalars(stmt).all())
