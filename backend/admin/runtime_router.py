from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request

from .service import AdminService

runtime_router = APIRouter(prefix="/api/runtime", tags=["runtime"])


def get_admin_service(request: Request) -> AdminService:
    service = getattr(request.app.state, "admin_service", None)
    if not service:
        raise HTTPException(status_code=500, detail="Admin service not initialized")
    return service


def _preview_auth(
    preview: bool,
    x_preview_token: Optional[str],
    service: AdminService,
) -> bool:
    if not preview:
        return False
    expected = service.get_preview_token()
    if not expected or x_preview_token != expected:
        raise HTTPException(status_code=403, detail="Invalid preview token")
    return True


@runtime_router.get("/config")
async def runtime_config(
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_config_snapshot(preview=is_preview)


@runtime_router.get("/homepage")
async def runtime_homepage(
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_homepage(preview=is_preview)


@runtime_router.get("/navigation")
async def runtime_navigation(
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_navigation(preview=is_preview)


@runtime_router.get("/theme")
async def runtime_theme(
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_theme(preview=is_preview)


@runtime_router.get("/announcements")
async def runtime_announcements(
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_announcements(preview=is_preview)


@runtime_router.get("/seo")
async def runtime_seo(
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_seo(preview=is_preview)


@runtime_router.get("/tools")
async def runtime_tools(
    category: Optional[str] = None,
    q: Optional[str] = None,
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_tools(category=category, q=q, preview=is_preview)


@runtime_router.get("/tools/{tool_key}")
async def runtime_tool_detail(
    tool_key: str,
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_tool_detail(tool_key=tool_key, preview=is_preview)


@runtime_router.get("/pages")
async def runtime_pages(
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_pages(preview=is_preview)


@runtime_router.get("/pages/{slug}")
async def runtime_page_by_slug(
    slug: str,
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_page_by_slug(slug=slug, preview=is_preview)


@runtime_router.get("/search")
async def runtime_search(
    q: str,
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_search(q=q, preview=is_preview)


@runtime_router.get("/sitemap")
async def runtime_sitemap(
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    return service.runtime_sitemap(preview=is_preview)


@runtime_router.get("/branding")
async def runtime_branding(
    preview: bool = Query(False),
    x_preview_token: Optional[str] = Header(default=None),
    service: AdminService = Depends(get_admin_service),
):
    is_preview = _preview_auth(preview, x_preview_token, service)
    theme = service.runtime_theme(preview=is_preview)
    return {
        "site_name": theme.get("site_name", "Toolverse"),
        "tagline": theme.get("tagline", ""),
        "logo_url": theme.get("logo_url", ""),
        "favicon_url": theme.get("favicon_url", ""),
    }


@runtime_router.get("/health")
async def runtime_health():
    return {"ok": True, "timestamp": datetime.utcnow().isoformat(), "scope": "runtime-public"}
