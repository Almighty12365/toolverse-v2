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
const ADMIN_API = `${BACKEND_URL}/api/admin`;

const adminClient = axios.create({
  baseURL: ADMIN_API,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAdminHeaders = (session) => {
  if (!session) {
    delete adminClient.defaults.headers.common["x-admin-user"];
    delete adminClient.defaults.headers.common["x-admin-permissions"];
    return;
  }
  adminClient.defaults.headers.common["x-admin-user"] = session.email;
  adminClient.defaults.headers.common["x-admin-permissions"] = (session.permissions || ["*"]).join(",");
};

export const adminAuthLogin = async (email, password) => {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  const res = await axios.post(`${ADMIN_API}/auth/login`, form);
  return res.data;
};

export const adminSetupPassword = async (email, newPassword) => {
  const form = new FormData();
  form.append("email", email);
  form.append("new_password", newPassword);
  const res = await axios.post(`${ADMIN_API}/auth/setup-password`, form);
  return res.data;
};

export const adminChangePassword = async (email, currentPassword, newPassword) => {
  const form = new FormData();
  form.append("email", email);
  form.append("current_password", currentPassword);
  form.append("new_password", newPassword);
  const res = await axios.post(`${ADMIN_API}/auth/change-password`, form);
  return res.data;
};

export const adminGetDashboard = async () => (await adminClient.get("/dashboard")).data;

export const adminGetFeatures = async () => (await adminClient.get("/features")).data;
export const adminPutFeature = async (key, payload) => (await adminClient.put(`/features/${key}`, payload)).data;
export const adminDeleteFeature = async (key) => (await adminClient.delete(`/features/${key}`)).data;

export const adminGetPages = async () => (await adminClient.get("/pages")).data;
export const adminPutPage = async (slug, payload) => (await adminClient.put(`/pages/${slug}`, payload)).data;

export const adminGetNavigation = async () => (await adminClient.get("/navigation")).data;
export const adminPutNavigation = async (key, items) => (await adminClient.put(`/navigation/${key}`, items)).data;

export const adminGetSettings = async () => (await adminClient.get("/settings")).data;
export const adminPutSettings = async (key, payload, encrypted = false) =>
  (await adminClient.put(`/settings/${key}?encrypted=${encrypted ? "true" : "false"}`, payload)).data;

export const adminGetRoles = async () => (await adminClient.get("/roles")).data;
export const adminPutRole = async (name, payload) => (await adminClient.put(`/roles/${name}`, payload)).data;

export const adminGetPlugins = async () => (await adminClient.get("/plugins")).data;
export const adminEnablePlugin = async (pluginId) => (await adminClient.post(`/plugins/${pluginId}/enable`)).data;
export const adminDisablePlugin = async (pluginId) => (await adminClient.post(`/plugins/${pluginId}/disable`)).data;
export const adminDeletePlugin = async (pluginId) => (await adminClient.delete(`/plugins/${pluginId}`)).data;

export const adminGetAuditLogs = async () => (await adminClient.get("/logs/audit")).data;
export const adminSearch = async (q) => (await adminClient.get(`/search?q=${encodeURIComponent(q)}`)).data;

export const adminSaveRuntimeDraft = async (payload) =>
  (await adminClient.put("/runtime/draft", payload)).data;

export const adminPublishRuntime = async ({ scheduled_at = null } = {}) =>
  (await adminClient.post("/runtime/publish", { scheduled_at })).data;

export const adminGetRuntimeRevisions = async () =>
  (await adminClient.get("/runtime/revisions")).data;

export const adminRollbackRuntime = async (revisionIndex) =>
  (await adminClient.post(`/runtime/rollback/${revisionIndex}`)).data;
