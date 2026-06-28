import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile

from .service import AdminService, get_temp_zip_path

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _extract_actor(x_admin_user: Optional[str]) -> str:
    return x_admin_user or "system"


def require_permission(permission: str):
    async def checker(x_admin_permissions: Optional[str] = Header(default="*")):
        perms = [p.strip() for p in (x_admin_permissions or "").split(",") if p.strip()]
        if "*" in perms or permission in perms:
            return True
        raise HTTPException(status_code=403, detail=f"Missing permission: {permission}")

    return checker


def get_admin_service(request: Request) -> AdminService:
    service = getattr(request.app.state, "admin_service", None)
    if not service:
        raise HTTPException(status_code=500, detail="Admin service not initialized")
    return service


@router.post("/auth/login")
async def admin_login(
    email: str = Form(...),
    password: str = Form(""),
    service: AdminService = Depends(get_admin_service),
):
    return service.admin_login(email, password)


@router.post("/auth/setup-password")
async def setup_first_password(
    email: str = Form(...),
    new_password: str = Form(...),
    service: AdminService = Depends(get_admin_service),
):
    return service.setup_password_first_login(email, new_password)


@router.post("/auth/change-password")
async def change_password(
    email: str = Form(...),
    current_password: str = Form(...),
    new_password: str = Form(...),
    service: AdminService = Depends(get_admin_service),
):
    return service.change_password(email, current_password, new_password)


@router.get("/dashboard")
async def get_dashboard(
    _ok: bool = Depends(require_permission("dashboard.read")),
    service: AdminService = Depends(get_admin_service),
):
    return service.dashboard_snapshot()


@router.get("/features")
async def list_features(
    include_disabled: bool = True,
    _ok: bool = Depends(require_permission("features.read")),
    service: AdminService = Depends(get_admin_service),
):
    return service.list_features(include_disabled=include_disabled)


@router.put("/features/{key}")
async def put_feature(
    key: str,
    payload: Dict[str, Any],
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("features.write")),
    service: AdminService = Depends(get_admin_service),
):
    return service.upsert_feature(key, payload, actor=_extract_actor(x_admin_user))


@router.delete("/features/{key}")
async def remove_feature(
    key: str,
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("features.write")),
    service: AdminService = Depends(get_admin_service),
):
    return {"deleted": service.delete_feature(key, actor=_extract_actor(x_admin_user))}


@router.get("/roles")
async def get_roles(
    _ok: bool = Depends(require_permission("users.read")),
    service: AdminService = Depends(get_admin_service),
):
    return service.list_roles()


@router.put("/roles/{name}")
async def put_role(
    name: str,
    payload: Dict[str, Any],
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("users.read")),
    service: AdminService = Depends(get_admin_service),
):
    return service.upsert_role(name, payload, actor=_extract_actor(x_admin_user))


@router.get("/settings")
async def get_settings(
    key: Optional[str] = None,
    _ok: bool = Depends(require_permission("settings.read")),
    service: AdminService = Depends(get_admin_service),
):
    return service.get_settings(key=key)


@router.put("/settings/{key}")
async def put_settings(
    key: str,
    payload: Dict[str, Any],
    encrypted: bool = False,
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("settings.write")),
    service: AdminService = Depends(get_admin_service),
):
    return service.set_settings(key, payload, encrypted=encrypted, actor=_extract_actor(x_admin_user))


@router.get("/pages")
async def get_pages(
    _ok: bool = Depends(require_permission("pages.read")),
    service: AdminService = Depends(get_admin_service),
):
    return service.list_pages()


@router.put("/pages/{slug}")
async def put_page(
    slug: str,
    payload: Dict[str, Any],
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("pages.write")),
    service: AdminService = Depends(get_admin_service),
):
    return service.upsert_page(slug, payload, actor=_extract_actor(x_admin_user))


@router.get("/navigation")
async def get_navigation(
    _ok: bool = Depends(require_permission("navigation.read")),
    service: AdminService = Depends(get_admin_service),
):
    return service.list_navigation()


@router.put("/navigation/{key}")
async def put_navigation(
    key: str,
    items: List[Dict[str, Any]],
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("navigation.write")),
    service: AdminService = Depends(get_admin_service),
):
    return service.upsert_navigation(key, items, actor=_extract_actor(x_admin_user))


@router.get("/plugins")
async def get_plugins(
    _ok: bool = Depends(require_permission("plugins.read")),
    service: AdminService = Depends(get_admin_service),
):
    return service.list_plugins()


@router.post("/plugins/install")
async def install_plugin(
    file: UploadFile = File(...),
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("plugins.write")),
    service: AdminService = Depends(get_admin_service),
):
    temp_path = get_temp_zip_path(".zip")
    try:
        data = await file.read()
        with open(temp_path, "wb") as f:
            f.write(data)
        return service.install_plugin_from_zip(temp_path, actor=_extract_actor(x_admin_user))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/plugins/{plugin_id}/enable")
async def enable_plugin(
    plugin_id: str,
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("plugins.write")),
    service: AdminService = Depends(get_admin_service),
):
    return service.set_plugin_status(plugin_id, True, actor=_extract_actor(x_admin_user))


@router.post("/plugins/{plugin_id}/disable")
async def disable_plugin(
    plugin_id: str,
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("plugins.write")),
    service: AdminService = Depends(get_admin_service),
):
    return service.set_plugin_status(plugin_id, False, actor=_extract_actor(x_admin_user))


@router.delete("/plugins/{plugin_id}")
async def remove_plugin(
    plugin_id: str,
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("plugins.write")),
    service: AdminService = Depends(get_admin_service),
):
    return {"deleted": service.delete_plugin(plugin_id, actor=_extract_actor(x_admin_user))}


@router.post("/plugins/{plugin_id}/rollback")
async def rollback_plugin(
    plugin_id: str,
    target_version: str = Form(...),
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("plugins.write")),
    service: AdminService = Depends(get_admin_service),
):
    return service.plugin_rollback(plugin_id, target_version, actor=_extract_actor(x_admin_user))


@router.get("/logs/audit")
async def get_audit_logs(
    limit: int = 200,
    _ok: bool = Depends(require_permission("logs.read")),
    service: AdminService = Depends(get_admin_service),
):
    return service.list_audit_logs(limit=limit)


@router.get("/search")
async def global_search(
    q: str,
    _ok: bool = Depends(require_permission("dashboard.read")),
    service: AdminService = Depends(get_admin_service),
):
    return service.global_search(q)


@router.put("/runtime/draft")
async def save_runtime_draft(
    payload: Dict[str, Any],
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("settings.write")),
    service: AdminService = Depends(get_admin_service),
):
    return service.save_runtime_draft(payload, actor=_extract_actor(x_admin_user))


@router.post("/runtime/publish")
async def publish_runtime(
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("settings.write")),
    service: AdminService = Depends(get_admin_service),
):
    return service.publish_runtime(actor=_extract_actor(x_admin_user))


@router.post("/runtime/rollback/{revision_index}")
async def rollback_runtime(
    revision_index: int,
    x_admin_user: Optional[str] = Header(default=None),
    _ok: bool = Depends(require_permission("settings.write")),
    service: AdminService = Depends(get_admin_service),
):
    return service.rollback_runtime(revision_index=revision_index, actor=_extract_actor(x_admin_user))


@router.get("/runtime/revisions")
async def list_runtime_revisions(
    _ok: bool = Depends(require_permission("settings.read")),
    service: AdminService = Depends(get_admin_service),
):
    runtime = service.get_settings("runtime")
    return {"revisions": runtime.get("revisions", []) if isinstance(runtime, dict) else []}


@router.get("/centers/summary")
async def centers_summary(
    _ok: bool = Depends(require_permission("dashboard.read")),
):
    return {
        "centers": [
            "dashboard",
            "feature_registry",
            "plugin_marketplace",
            "homepage_builder",
            "page_builder",
            "navigation_builder",
            "theme_builder",
            "media_center",
            "user_management",
            "role_management",
            "api_management",
            "payment_center",
            "seo_center",
            "settings",
            "announcements",
            "email_center",
            "notification_center",
            "ai_center",
            "analytics_center",
            "log_center",
            "backup_center",
            "security_center",
            "cache_center",
            "database_center",
            "server_center",
            "feature_flags",
            "import_export",
            "developer_center",
            "automation_center",
        ]
    }
