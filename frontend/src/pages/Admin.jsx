import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import {
  adminAuthLogin,
  adminSetupPassword,
  adminChangePassword,
  adminGetDashboard,
  adminGetFeatures,
  adminPutFeature,
  adminDeleteFeature,
  adminGetPages,
  adminPutPage,
  adminGetNavigation,
  adminPutNavigation,
  adminGetSettings,
  adminPutSettings,
  adminGetRoles,
  adminPutRole,
  adminGetPlugins,
  adminEnablePlugin,
  adminDisablePlugin,
  adminDeletePlugin,
  adminGetAuditLogs,
  adminSearch,
  setAdminHeaders,
  adminSaveRuntimeDraft,
  adminPublishRuntime,
  adminGetRuntimeRevisions,
  adminRollbackRuntime,
} from "../lib/adminApi";

const SESSION_KEY = "toolverse_admin_session_v1";

const navItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "features", label: "Feature Registry" },
  { key: "plugins", label: "Plugin Marketplace" },
  { key: "widgets", label: "Widget Marketplace" },
  { key: "homepage-builder", label: "Homepage Builder" },
  { key: "page-builder", label: "Page Builder" },
  { key: "navigation-builder", label: "Navigation Builder" },
  { key: "theme-builder", label: "Theme Builder" },
  { key: "cms", label: "CMS" },
  { key: "media", label: "Media Library" },
  { key: "users", label: "User Management" },
  { key: "roles", label: "Roles & Permissions" },
  { key: "api-center", label: "API Center" },
  { key: "ai-center", label: "AI Center" },
  { key: "seo-center", label: "SEO Center" },
  { key: "analytics", label: "Analytics Center" },
  { key: "backup", label: "Backup Center" },
  { key: "security", label: "Security Center" },
  { key: "automation", label: "Automation Center" },
  { key: "developer", label: "Developer Center" },
  { key: "notifications", label: "Notification Center" },
  { key: "email", label: "Email Center" },
  { key: "payments", label: "Payment Center" },
  { key: "settings", label: "Settings Center" },
  { key: "logs", label: "Audit Logs" },
  { key: "search", label: "Search Center" },
];

const loadSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

function AdminLayout({ children, title, session, onLogout }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-white/10 bg-zinc-900/60 backdrop-blur">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="font-semibold tracking-tight">ToolVerse Enterprise Admin OS</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{session?.email}</span>
            <Button onClick={onLogout} variant="outline" className="border-white/20 text-zinc-100 hover:bg-white/10">
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="max-w-[1700px] mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-6">
        <aside className="rounded-xl border border-white/10 bg-zinc-900/50 p-3 h-[calc(100vh-120px)] overflow-y-auto sticky top-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const href = `/admin/${item.key}`;
              const active = location.pathname === href;
              return (
                <Link
                  key={item.key}
                  to={href}
                  className={`block px-3 py-2 rounded-md text-sm transition ${
                    active ? "bg-fuchsia-600/30 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="space-y-4">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminLogin({ onLogin }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("aman74560027@gmail.com");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      setError("");
      if (mode === "setup") {
        await adminSetupPassword(email, newPassword);
      } else if (mode === "change") {
        await adminChangePassword(email, password, newPassword);
      } else {
        const res = await adminAuthLogin(email, password);
        onLogin(res);
        nav("/admin/dashboard");
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-zinc-900/70 border-white/10 text-zinc-100">
        <CardHeader><CardTitle>Enterprise Admin Login</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Email</Label>
            <Input className="mt-1 bg-zinc-950 border-white/20" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {(mode === "login" || mode === "change") && (
            <div>
              <Label>{mode === "change" ? "Current Password" : "Password"}</Label>
              <Input type="password" className="mt-1 bg-zinc-950 border-white/20" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          {(mode === "setup" || mode === "change") && (
            <div>
              <Label>New Password</Label>
              <Input type="password" className="mt-1 bg-zinc-950 border-white/20" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button className="w-full bg-fuchsia-600 hover:bg-fuchsia-500" onClick={submit}>
            {mode === "login" ? "Login" : mode === "setup" ? "Setup Password" : "Change Password"}
          </Button>
          <div className="text-xs text-zinc-400 flex gap-3">
            <button onClick={() => setMode("login")}>Login</button>
            <button onClick={() => setMode("setup")}>First Setup</button>
            <button onClick={() => setMode("change")}>Change Password</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardModule() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    adminGetDashboard().then(setStats).catch(() => {});
  }, []);

  const cards = useMemo(() => {
    if (!stats) return [];
    return [
      { key: "features_total", label: "Features", value: stats?.features?.total ?? 0 },
      { key: "plugins_total", label: "Plugins", value: stats?.plugins?.total ?? 0 },
      { key: "plugins_enabled", label: "Enabled Plugins", value: stats?.plugins?.enabled ?? 0 },
      { key: "pages_total", label: "Pages", value: stats?.pages?.total ?? 0 },
      { key: "admin_users_total", label: "Admin Users", value: stats?.admin_users?.total ?? 0 },
      { key: "system_status", label: "System Status", value: stats?.system?.status || "unknown" },
    ];
  }, [stats]);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.key} className="bg-zinc-900/60 border-white/10 text-zinc-100">
            <CardHeader><CardTitle className="text-sm">{c.label}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{String(c.value)}</div></CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-zinc-900/60 border-white/10 text-zinc-100">
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(stats?.timeline || []).slice(0, 10).map((item, idx) => (
            <div key={`${item.id || idx}`} className="text-sm text-zinc-300 border-b border-white/5 pb-2">
              <div><span className="text-zinc-400">actor:</span> {item.actor}</div>
              <div><span className="text-zinc-400">action:</span> {item.action}</div>
              <div><span className="text-zinc-400">resource:</span> {item.resource_type}/{item.resource_id}</div>
            </div>
          ))}
          {(stats?.timeline || []).length === 0 && <p className="text-zinc-400 text-sm">No activity yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function FeaturesModule() {
  const [features, setFeatures] = useState([]);
  const [form, setForm] = useState({ key: "", name: "", category: "general", description: "" });

  const load = () => adminGetFeatures().then(setFeatures).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.key) return;
    await adminPutFeature(form.key, {
      ...form,
      flags: { enabled: true, premium: false, featured: false, popular: false, is_new: false, beta: false, maintenance: false },
      visibility: { homepage: true, sidebar: true, navbar: false, search: true },
      seo: {},
      dependencies: [],
      tags: [],
      analytics: {},
      metadata: {},
    });
    setForm({ key: "", name: "", category: "general", description: "" });
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900/60 border-white/10 text-zinc-100">
        <CardHeader><CardTitle>Create / Edit Feature</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <Input className="bg-zinc-950 border-white/20" placeholder="key" value={form.key} onChange={(e)=>setForm({...form,key:e.target.value})}/>
          <Input className="bg-zinc-950 border-white/20" placeholder="name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/>
          <Input className="bg-zinc-950 border-white/20" placeholder="category" value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}/>
          <Textarea className="bg-zinc-950 border-white/20 md:col-span-2" placeholder="description" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/>
          <Button className="bg-fuchsia-600 hover:bg-fuchsia-500 md:col-span-2" onClick={save}>Save Feature</Button>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-3">
        {features.map((f) => (
          <Card key={f.key} className="bg-zinc-900/60 border-white/10 text-zinc-100">
            <CardHeader><CardTitle className="text-base">{f.name} ({f.key})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-zinc-300">{f.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">{f.category}</span>
                <Button variant="destructive" onClick={() => adminDeleteFeature(f.key).then(load)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PagesModule() {
  const [pages, setPages] = useState([]);
  const [form, setForm] = useState({ slug: "home", title: "Home", page_type: "homepage", status: "published", blocksText: "[]" });
  const load = () => adminGetPages().then(setPages).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    const blocks = JSON.parse(form.blocksText || "[]");
    await adminPutPage(form.slug, { ...form, blocks, seo: {}, metadata: {} });
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900/60 border-white/10 text-zinc-100">
        <CardHeader><CardTitle>Visual Page Builder (JSON blocks persisted)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input className="bg-zinc-950 border-white/20" value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value})} placeholder="slug"/>
          <Input className="bg-zinc-950 border-white/20" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="title"/>
          <Textarea className="bg-zinc-950 border-white/20 h-44" value={form.blocksText} onChange={(e)=>setForm({...form,blocksText:e.target.value})}/>
          <Button className="bg-fuchsia-600 hover:bg-fuchsia-500" onClick={save}>Save Page</Button>
        </CardContent>
      </Card>
      {pages.map((p)=>(
        <Card key={p.slug} className="bg-zinc-900/60 border-white/10 text-zinc-100">
          <CardHeader><CardTitle>{p.title} ({p.slug})</CardTitle></CardHeader>
        </Card>
      ))}
    </div>
  );
}

function NavigationModule() {
  const [key, setKey] = useState("navbar");
  const [itemsText, setItemsText] = useState("[]");
  const [rows, setRows] = useState([]);
  const load = () => adminGetNavigation().then(setRows).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async () => {
    await adminPutNavigation(key, JSON.parse(itemsText || "[]"));
    load();
  };
  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900/60 border-white/10 text-zinc-100">
        <CardHeader><CardTitle>Navigation Builder</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input className="bg-zinc-950 border-white/20" value={key} onChange={(e)=>setKey(e.target.value)}/>
          <Textarea className="bg-zinc-950 border-white/20 h-44" value={itemsText} onChange={(e)=>setItemsText(e.target.value)}/>
          <Button className="bg-fuchsia-600 hover:bg-fuchsia-500" onClick={save}>Save Navigation</Button>
        </CardContent>
      </Card>
      {rows.map((n)=><Card key={n.key} className="bg-zinc-900/60 border-white/10 text-zinc-100"><CardHeader><CardTitle>{n.key}</CardTitle></CardHeader></Card>)}
    </div>
  );
}

function SettingsModule() {
  const [rows, setRows] = useState({});
  const [k, setK] = useState("general");
  const [jsonText, setJsonText] = useState("{}");
  const [enc, setEnc] = useState(false);

  const load = () => adminGetSettings().then((data) => setRows(data || {})).catch(() => setRows({}));
  useEffect(() => { load(); }, []);
  const save = async () => {
    await adminPutSettings(k, JSON.parse(jsonText || "{}"), enc);
    load();
  };

  const settingKeys = Object.keys(rows || {});

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900/60 border-white/10 text-zinc-100">
        <CardHeader><CardTitle>Settings Center</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input className="bg-zinc-950 border-white/20" value={k} onChange={(e)=>setK(e.target.value)} />
          <Textarea className="bg-zinc-950 border-white/20 h-44" value={jsonText} onChange={(e)=>setJsonText(e.target.value)} />
          <div className="flex items-center gap-2">
            <Switch checked={enc} onCheckedChange={setEnc} />
            <span className="text-sm text-zinc-300">Encrypt value</span>
          </div>
          <Button className="bg-fuchsia-600 hover:bg-fuchsia-500" onClick={save}>Save Settings</Button>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-3">
        {settingKeys.map((key)=><Card key={key} className="bg-zinc-900/60 border-white/10 text-zinc-100"><CardHeader><CardTitle>{key}</CardTitle></CardHeader></Card>)}
      </div>
    </div>
  );
}

function RolesModule() {
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [permissions, setPermissions] = useState("");
  const load = () => adminGetRoles().then(setRoles).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async () => {
    await adminPutRole(name, { name, label, permissions: permissions.split(",").map((x)=>x.trim()).filter(Boolean), is_system: false });
    load();
  };
  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900/60 border-white/10 text-zinc-100">
        <CardHeader><CardTitle>Roles & Permissions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input className="bg-zinc-950 border-white/20" placeholder="role name" value={name} onChange={(e)=>setName(e.target.value)} />
          <Input className="bg-zinc-950 border-white/20" placeholder="label" value={label} onChange={(e)=>setLabel(e.target.value)} />
          <Textarea className="bg-zinc-950 border-white/20" placeholder="permissions comma separated" value={permissions} onChange={(e)=>setPermissions(e.target.value)} />
          <Button className="bg-fuchsia-600 hover:bg-fuchsia-500" onClick={save}>Save Role</Button>
        </CardContent>
      </Card>
      {roles.map((r)=><Card key={r.name} className="bg-zinc-900/60 border-white/10 text-zinc-100"><CardHeader><CardTitle>{r.label} ({r.name})</CardTitle></CardHeader></Card>)}
    </div>
  );
}

function PluginsModule() {
  const [plugins, setPlugins] = useState([]);
  const load = () => adminGetPlugins().then(setPlugins).catch(() => {});
  useEffect(() => { load(); }, []);
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {plugins.map((p) => (
        <Card key={p.plugin_id} className="bg-zinc-900/60 border-white/10 text-zinc-100">
          <CardHeader><CardTitle>{p.name} ({p.version})</CardTitle></CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Button onClick={() => adminEnablePlugin(p.plugin_id).then(load)}>Enable</Button>
            <Button onClick={() => adminDisablePlugin(p.plugin_id).then(load)} variant="outline" className="border-white/20">Disable</Button>
            <Button onClick={() => adminDeletePlugin(p.plugin_id).then(load)} variant="destructive">Delete</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LogsModule() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { adminGetAuditLogs().then(setLogs).catch(() => {}); }, []);
  return (
    <div className="space-y-2">
      {logs.map((l, i) => (
        <Card key={`${l.created_at}-${i}`} className="bg-zinc-900/60 border-white/10 text-zinc-100">
          <CardContent className="py-3 text-sm">
            <div><span className="text-zinc-400">actor:</span> {l.actor}</div>
            <div><span className="text-zinc-400">action:</span> {l.action}</div>
            <div><span className="text-zinc-400">resource:</span> {l.resource_type}/{l.resource_id}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SearchModule() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState({});
  const run = () => adminSearch(q).then((data) => setRes(data || {})).catch(() => setRes({}));
  const sections = Object.entries(res || {});
  return (
    <Card className="bg-zinc-900/60 border-white/10 text-zinc-100">
      <CardHeader><CardTitle>Global Search Center</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input className="bg-zinc-950 border-white/20" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search users/plugins/tools/pages/settings..." />
          <Button onClick={run} className="bg-fuchsia-600 hover:bg-fuchsia-500">Search</Button>
        </div>
        <div className="space-y-3">
          {sections.map(([group, items]) => (
            <div key={group}>
              <h3 className="text-sm font-medium text-zinc-200 mb-1">{group}</h3>
              <div className="space-y-1">
                {(Array.isArray(items) ? items : []).map((r, i)=><div key={`${group}-${i}`} className="text-sm text-zinc-300">{JSON.stringify(r)}</div>)}
                {(!Array.isArray(items) || items.length === 0) && <div className="text-xs text-zinc-500">No results</div>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GenericBoundModule({ title, settingKey }) {
  const [jsonText, setJsonText] = useState("{}");
  const save = async () => {
    await adminPutSettings(settingKey, JSON.parse(jsonText || "{}"), false);
  };
  return (
    <Card className="bg-zinc-900/60 border-white/10 text-zinc-100">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Textarea className="bg-zinc-950 border-white/20 h-52" value={jsonText} onChange={(e)=>setJsonText(e.target.value)} />
        <Button className="bg-fuchsia-600 hover:bg-fuchsia-500" onClick={save}>Persist {title}</Button>
      </CardContent>
    </Card>
  );
}

function PublishModule() {
  const [jsonText, setJsonText] = useState("{}");
  const [previewToken, setPreviewToken] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [revisions, setRevisions] = useState([]);
  const [message, setMessage] = useState("");

  const loadRevisions = () =>
    adminGetRuntimeRevisions()
      .then((data) => setRevisions(data?.revisions || []))
      .catch(() => setRevisions([]));
  useEffect(() => { loadRevisions(); }, []);

  const saveDraft = async () => {
    try {
      setMessage("");
      const payload = JSON.parse(jsonText || "{}");
      const res = await adminSaveRuntimeDraft(payload);
      if (res?.preview_token) setPreviewToken(res.preview_token);
      setMessage("Draft saved.");
      loadRevisions();
    } catch (e) {
      setMessage(e?.response?.data?.detail || e.message || "Save draft failed");
    }
  };

  const publishNow = async () => {
    try {
      setMessage("");
      await adminPublishRuntime({ scheduled_at: null });
      setMessage("Published successfully.");
      loadRevisions();
    } catch (e) {
      setMessage(e?.response?.data?.detail || e.message || "Publish failed");
    }
  };

  const schedulePublish = async () => {
    try {
      setMessage("");
      await adminPublishRuntime({ scheduled_at: scheduledAt || null });
      setMessage("Publish scheduled.");
      loadRevisions();
    } catch (e) {
      setMessage(e?.response?.data?.detail || e.message || "Schedule failed");
    }
  };

  const rollback = async (idx) => {
    try {
      setMessage("");
      await adminRollbackRuntime(idx);
      setMessage(`Rollback to revision ${idx} complete.`);
      loadRevisions();
    } catch (e) {
      setMessage(e?.response?.data?.detail || e.message || "Rollback failed");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900/60 border-white/10 text-zinc-100">
        <CardHeader><CardTitle>Publish Workflow</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea className="bg-zinc-950 border-white/20 h-52" placeholder="Runtime draft JSON" value={jsonText} onChange={(e)=>setJsonText(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button className="bg-fuchsia-600 hover:bg-fuchsia-500" onClick={saveDraft}>Save Draft</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={publishNow}>Publish Now</Button>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="min-w-[260px]">
              <Label>Schedule Publish (ISO timestamp)</Label>
              <Input className="bg-zinc-950 border-white/20 mt-1" value={scheduledAt} onChange={(e)=>setScheduledAt(e.target.value)} placeholder="2026-12-31T10:00:00Z" />
            </div>
            <Button onClick={schedulePublish} variant="outline" className="border-white/20">Schedule</Button>
          </div>
          {previewToken && <p className="text-xs text-zinc-300">Preview Token: <span className="text-fuchsia-300">{previewToken}</span></p>}
          {message && <p className="text-sm text-zinc-300">{message}</p>}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/60 border-white/10 text-zinc-100">
        <CardHeader><CardTitle>Revision History</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {revisions.map((r, i) => (
            <div key={i} className="rounded-md border border-white/10 p-3 flex items-center justify-between gap-3">
              <div className="text-sm">
                <div>Revision #{i}</div>
                <div className="text-zinc-400 text-xs">{r.published_at || r.updated_at || "n/a"}</div>
              </div>
              <Button variant="outline" className="border-white/20" onClick={() => rollback(i)}>Rollback</Button>
            </div>
          ))}
          {revisions.length === 0 && <p className="text-sm text-zinc-400">No revisions yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function AdminPage() {
  const [session, setSession] = useState(loadSession());

  useEffect(() => {
    setAdminHeaders(session);
  }, [session]);

  const onLogin = (res) => {
    const normalized = { email: res.email, permissions: res.permissions || ["*"] };
    setSession(normalized);
    saveSession(normalized);
    setAdminHeaders(normalized);
  };

  const onLogout = () => {
    clearSession();
    setSession(null);
    setAdminHeaders(null);
  };

  const wrap = (title, node) => (
    <ProtectedRoute session={session}>
      <AdminLayout title={title} session={session} onLogout={onLogout}>{node}</AdminLayout>
    </ProtectedRoute>
  );

  return (
    <Routes>
      <Route index element={<Navigate to="login" replace />} />
      <Route path="login" element={<AdminLogin onLogin={onLogin} />} />

      <Route path="dashboard" element={wrap("Global Dashboard", <DashboardModule />)} />
      <Route path="features" element={wrap("Feature Registry", <FeaturesModule />)} />
      <Route path="plugins" element={wrap("Plugin Marketplace", <PluginsModule />)} />
      <Route path="widgets" element={wrap("Widget Marketplace", <GenericBoundModule title="Widget Marketplace" settingKey="widgets" />)} />
      <Route path="homepage-builder" element={wrap("Homepage Builder", <PagesModule />)} />
      <Route path="page-builder" element={wrap("Drag & Drop Page Builder", <PagesModule />)} />
      <Route path="navigation-builder" element={wrap("Navigation Builder", <NavigationModule />)} />
      <Route path="theme-builder" element={wrap("Theme Builder", <GenericBoundModule title="Theme Builder" settingKey="theme" />)} />
      <Route path="cms" element={wrap("CMS", <PagesModule />)} />
      <Route path="media" element={wrap("Media Library", <GenericBoundModule title="Media Library" settingKey="media" />)} />
      <Route path="users" element={wrap("User Management", <GenericBoundModule title="User Management" settingKey="users" />)} />
      <Route path="roles" element={wrap("Roles & Permissions", <RolesModule />)} />
      <Route path="api-center" element={wrap("API Center", <GenericBoundModule title="API Center" settingKey="api_center" />)} />
      <Route path="ai-center" element={wrap("AI Center", <GenericBoundModule title="AI Center" settingKey="ai_center" />)} />
      <Route path="seo-center" element={wrap("SEO Center", <GenericBoundModule title="SEO Center" settingKey="seo" />)} />
      <Route path="analytics" element={wrap("Analytics Center", <GenericBoundModule title="Analytics Center" settingKey="analytics_center" />)} />
      <Route path="backup" element={wrap("Backup Center", <GenericBoundModule title="Backup Center" settingKey="backup_center" />)} />
      <Route path="security" element={wrap("Security Center", <GenericBoundModule title="Security Center" settingKey="security_center" />)} />
      <Route path="automation" element={wrap("Automation Center", <GenericBoundModule title="Automation Center" settingKey="automation_center" />)} />
      <Route path="developer" element={wrap("Developer Center", <GenericBoundModule title="Developer Center" settingKey="developer_center" />)} />
      <Route path="notifications" element={wrap("Notification Center", <GenericBoundModule title="Notification Center" settingKey="notification_center" />)} />
      <Route path="email" element={wrap("Email Center", <GenericBoundModule title="Email Center" settingKey="email_center" />)} />
      <Route path="payments" element={wrap("Payment Center", <GenericBoundModule title="Payment Center" settingKey="payment_center" />)} />
      <Route path="settings" element={wrap("Settings Center", <SettingsModule />)} />
      <Route path="logs" element={wrap("Audit Logs", <LogsModule />)} />
      <Route path="search" element={wrap("Search Center", <SearchModule />)} />
      <Route path="publish" element={wrap("Publish Center", <PublishModule />)} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
