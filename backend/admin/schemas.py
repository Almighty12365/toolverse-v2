from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AdminBaseModel(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FeatureSeo(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    canonical: Optional[str] = None


class FeatureVisibility(BaseModel):
    homepage: bool = True
    sidebar: bool = True
    navbar: bool = False
    search: bool = True


class FeatureFlags(BaseModel):
    enabled: bool = True
    premium: bool = False
    featured: bool = False
    popular: bool = False
    is_new: bool = False
    beta: bool = False
    maintenance: bool = False


class FeatureModel(AdminBaseModel):
    key: str
    name: str
    description: str = ""
    category: str = "general"
    version: str = "1.0.0"
    priority: int = 100
    endpoint: Optional[str] = None
    client_handler: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    flags: FeatureFlags = Field(default_factory=FeatureFlags)
    visibility: FeatureVisibility = Field(default_factory=FeatureVisibility)
    seo: FeatureSeo = Field(default_factory=FeatureSeo)
    analytics: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PluginManifest(BaseModel):
    id: str
    name: str
    version: str
    description: Optional[str] = ""
    author: Optional[str] = ""
    permissions: List[str] = Field(default_factory=list)
    routes: List[Dict[str, Any]] = Field(default_factory=list)
    hooks: List[str] = Field(default_factory=list)
    settings_schema: Dict[str, Any] = Field(default_factory=dict)
    navigation: List[Dict[str, Any]] = Field(default_factory=list)


class PluginModel(AdminBaseModel):
    plugin_id: str
    name: str
    version: str
    status: str = "disabled"
    install_path: str
    manifest: PluginManifest
    health: Dict[str, Any] = Field(default_factory=dict)
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    storage: Dict[str, Any] = Field(default_factory=dict)
    analytics: Dict[str, Any] = Field(default_factory=dict)


class RoleModel(AdminBaseModel):
    name: str
    label: str
    permissions: List[str] = Field(default_factory=list)
    is_system: bool = False


class AdminUserModel(AdminBaseModel):
    username: str
    password_hash: str
    roles: List[str] = Field(default_factory=lambda: ["super_admin"])
    is_active: bool = True
    profile: Dict[str, Any] = Field(default_factory=dict)
    last_login_at: Optional[datetime] = None


class SettingModel(AdminBaseModel):
    key: str
    value: Dict[str, Any] = Field(default_factory=dict)
    is_encrypted: bool = False


class PageBlock(BaseModel):
    id: str
    type: str
    props: Dict[str, Any] = Field(default_factory=dict)
    children: List["PageBlock"] = Field(default_factory=list)


class PageModel(AdminBaseModel):
    slug: str
    title: str
    page_type: str = "custom"
    status: str = "published"
    seo: FeatureSeo = Field(default_factory=FeatureSeo)
    blocks: List[PageBlock] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class NavigationItem(BaseModel):
    id: str
    label: str
    url: str
    icon: Optional[str] = None
    children: List["NavigationItem"] = Field(default_factory=list)
    visibility_rules: Dict[str, Any] = Field(default_factory=dict)
    order: int = 0


class NavigationModel(AdminBaseModel):
    key: str
    items: List[NavigationItem] = Field(default_factory=list)


class AuditLogModel(AdminBaseModel):
    actor: str = "system"
    action: str
    resource_type: str
    resource_id: str = ""
    payload: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None


PageBlock.model_rebuild()
NavigationItem.model_rebuild()
