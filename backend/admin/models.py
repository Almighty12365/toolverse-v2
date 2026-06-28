from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Role(Base, TimestampMixin):
    __tablename__ = "admin_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    permissions: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class AdminUser(Base, TimestampMixin):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[Any] = mapped_column(String(255), nullable=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    profile: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    last_login_at: Mapped[Any] = mapped_column(DateTime, nullable=True)

    role_links = relationship("AdminUserRole", back_populates="user", cascade="all, delete-orphan")


class AdminUserRole(Base):
    __tablename__ = "admin_user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id", name="uq_admin_user_role"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("admin_roles.id", ondelete="CASCADE"), nullable=False)

    user = relationship("AdminUser", back_populates="role_links")
    role = relationship("Role")


class Setting(Base, TimestampMixin):
    __tablename__ = "admin_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    value: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    is_encrypted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Feature(Base, TimestampMixin):
    __tablename__ = "admin_features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    category: Mapped[str] = mapped_column(String(120), default="general", nullable=False)
    version: Mapped[str] = mapped_column(String(40), default="1.0.0", nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    endpoint: Mapped[Any] = mapped_column(String(255), nullable=True)
    client_handler: Mapped[Any] = mapped_column(String(255), nullable=True)
    tags: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    dependencies: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    flags: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    visibility: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    seo: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    analytics: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    meta_json: Mapped[Any] = mapped_column("metadata", JSON, default=dict, nullable=False)


class Plugin(Base, TimestampMixin):
    __tablename__ = "admin_plugins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plugin_id: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="disabled", nullable=False)
    install_path: Mapped[str] = mapped_column(String(500), nullable=False)
    manifest: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    health: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    logs: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    storage: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    analytics: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)


class Page(Base, TimestampMixin):
    __tablename__ = "admin_pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    page_type: Mapped[str] = mapped_column(String(80), default="custom", nullable=False)
    status: Mapped[str] = mapped_column(String(80), default="published", nullable=False)
    seo: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    blocks: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)
    meta_json: Mapped[Any] = mapped_column("metadata", JSON, default=dict, nullable=False)


class Navigation(Base, TimestampMixin):
    __tablename__ = "admin_navigation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    items: Mapped[Any] = mapped_column(JSON, default=list, nullable=False)


class AuditLog(Base, TimestampMixin):
    __tablename__ = "admin_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor: Mapped[str] = mapped_column(String(255), default="system", nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(120), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    payload: Mapped[Any] = mapped_column(JSON, default=dict, nullable=False)
    ip_address: Mapped[Any] = mapped_column(String(80), nullable=True)
