from typing import Dict, List

DEFAULT_ROLES: List[Dict] = [
    {
        "name": "super_admin",
        "label": "Super Admin",
        "permissions": ["*"],
        "is_system": True,
    },
    {
        "name": "admin",
        "label": "Admin",
        "permissions": [
            "dashboard.read",
            "features.read",
            "features.write",
            "plugins.read",
            "plugins.write",
            "settings.read",
            "settings.write",
            "users.read",
            "analytics.read",
            "logs.read",
            "pages.read",
            "pages.write",
            "navigation.read",
            "navigation.write",
            "theme.read",
            "theme.write",
            "seo.read",
            "seo.write",
        ],
        "is_system": True,
    },
    {
        "name": "operator",
        "label": "Operator",
        "permissions": [
            "dashboard.read",
            "features.read",
            "plugins.read",
            "settings.read",
            "users.read",
            "analytics.read",
            "logs.read",
            "pages.read",
            "navigation.read",
            "theme.read",
            "seo.read",
        ],
        "is_system": True,
    },
]

DEFAULT_SETTINGS: Dict = {
    "general": {
        "site_name": "ToolVerse",
        "tagline": "Enterprise Website OS",
        "timezone": "UTC",
        "language": "en",
        "currency": "USD",
    },
    "branding": {
        "logo_url": "",
        "favicon_url": "",
        "primary_color": "#a21caf",
        "secondary_color": "#06b6d4",
        "dark_mode_default": True,
    },
    "security": {
        "force_2fa": False,
        "session_timeout_minutes": 120,
        "password_min_length": 12,
        "rate_limit_per_minute": 120,
    },
    "maintenance": {
        "enabled": False,
        "message": "",
    },
}
