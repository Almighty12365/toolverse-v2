import axios from "axios";

const normalizeBaseUrl = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "");
};

const FALLBACK_BACKEND_URL = "http://127.0.0.1:8010";
const envBackendUrl =
  normalizeBaseUrl(process.env.REACT_APP_BACKEND_URL) ||
  normalizeBaseUrl(process.env.VITE_BACKEND_URL);

const BACKEND_URL = envBackendUrl || FALLBACK_BACKEND_URL;
const RUNTIME_API = `${BACKEND_URL}/api/runtime`;

const FALLBACK_CONFIG = {
  homepage: { slug: "home", title: "ToolVerse", sections: [] },
  navigation: { navbar: [], sidebar: [], footer: [], mega_menu: [] },
  theme: {
    site_name: "Toolverse",
    tagline: "Enterprise Website OS",
    logo_url: "",
    favicon_url: "",
    primary_color: "#a21caf",
    secondary_color: "#06b6d4",
    dark_mode_default: true,
    font_family: "Inter, system-ui, sans-serif",
    radius: "1rem",
    card_style: "glass",
    button_style: "solid",
    css_variables: {},
  },
  site_settings: {},
  categories: [],
  tools: [],
  feature_registry: [],
  homepage_sections: [],
  widgets: [],
  announcements: {
    top_banner: { enabled: false, text: "", link: "" },
    popup: { enabled: false, title: "", body: "" },
    alert_bar: { enabled: false, text: "", variant: "info" },
  },
  seo: {},
  pages: [],
  footer: { columns: [] },
  branding: { brand_name: "ToolVerse", logo_url: "", favicon_url: "" },
};

const safeGet = async (path, fallback, options = {}) => {
  try {
    const params = {};
    const headers = {};
    if (options.preview) {
      params.preview = true;
      if (options.previewToken) {
        headers["x-preview-token"] = options.previewToken;
      }
    }
    const res = await axios.get(`${RUNTIME_API}${path}`, { params, headers });
    return res.data;
  } catch {
    return fallback;
  }
};

export const fetchRuntimeConfig = async (options = {}) => {
  return safeGet("/config", FALLBACK_CONFIG, options);
};

export const fetchRuntimeHomepage = async (options = {}) => {
  return safeGet("/homepage", FALLBACK_CONFIG.homepage, options);
};

export const fetchRuntimeNavigation = async (options = {}) => {
  return safeGet("/navigation", FALLBACK_CONFIG.navigation, options);
};

export const fetchRuntimeTheme = async (options = {}) => {
  return safeGet("/theme", FALLBACK_CONFIG.theme, options);
};

export const fetchRuntimeAnnouncements = async (options = {}) => {
  return safeGet("/announcements", FALLBACK_CONFIG.announcements, options);
};

export const fetchRuntimeSeo = async (options = {}) => {
  return safeGet("/seo", FALLBACK_CONFIG.seo, options);
};

export const fetchRuntimeTools = async ({ category, q, ...options } = {}) => {
  const query = new URLSearchParams();
  if (category) query.append("category", category);
  if (q) query.append("q", q);
  if (options.preview) query.append("preview", "true");
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return safeGet(`/tools${suffix}`, [], options);
};

export const fetchRuntimePages = async (options = {}) => {
  return safeGet("/pages", [], options);
};

export const fetchRuntimeToolDetail = async (toolKey, options = {}) => {
  if (!toolKey) return null;
  return safeGet(`/tools/${encodeURIComponent(toolKey)}`, null, options);
};

export const fetchRuntimePageBySlug = async (slug, options = {}) => {
  if (!slug) return null;
  return safeGet(`/pages/${encodeURIComponent(slug)}`, null, options);
};

export const fetchRuntimeSearch = async (q, options = {}) => {
  const suffix = `?q=${encodeURIComponent(q || "")}${options.preview ? "&preview=true" : ""}`;
  return safeGet(`/search${suffix}`, { tools: [], pages: [], navigation: [] }, options);
};

export const buildRuntimeConfig = async (options = {}) => {
  const cfg = await fetchRuntimeConfig(options);
  return {
    ...FALLBACK_CONFIG,
    ...(cfg || {}),
    navigation: { ...FALLBACK_CONFIG.navigation, ...((cfg || {}).navigation || {}) },
    theme: { ...FALLBACK_CONFIG.theme, ...((cfg || {}).theme || {}) },
    announcements: { ...FALLBACK_CONFIG.announcements, ...((cfg || {}).announcements || {}) },
    footer: { ...FALLBACK_CONFIG.footer, ...((cfg || {}).footer || {}) },
    branding: { ...FALLBACK_CONFIG.branding, ...((cfg || {}).branding || {}) },
  };
};
