"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface StoredUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  firstSeen: number;
  lastSeen: number;
  logins: number;
}

interface AdminData {
  dbConfigured: boolean;
  users: StoredUser[];
  maintenance: { enabled: boolean; message: string };
  announcement: { enabled: boolean; text: string; updatedAt: number };
}

const MAX_TEXT = 500;

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 16,
  padding: 20,
};

const input: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#fff",
  outline: "none",
};

const button: React.CSSProperties = {
  background: "#800020",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 18px",
  cursor: "pointer",
  fontWeight: 700,
};

function formatDate(ms: number): string {
  return ms ? new Date(ms).toLocaleString("ar-EG") : "—";
}

function avatarUrl(user: StoredUser): string {
  return user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : "https://cdn.discordapp.com/embed/avatars/0.png";
}

async function post(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState<AdminData | null>(null);

  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [maintEnabled, setMaintEnabled] = useState(false);
  const [maintMessage, setMaintMessage] = useState("");
  const [annEnabled, setAnnEnabled] = useState(false);
  const [annText, setAnnText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const applyData = useCallback((next: AdminData) => {
    setData(next);
    setMaintEnabled(next.maintenance.enabled);
    setMaintMessage(next.maintenance.message);
    setAnnEnabled(next.announcement.enabled);
    setAnnText(next.announcement.text);
  }, []);

  const load = useCallback(async () => {
    const res = await post("/api/admin/data");
    if (res.ok) applyData(res.data as AdminData);
    else setData(null);
    setChecking(false);
  }, [applyData]);

  useEffect(() => {
    load();
  }, [load]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    const res = await post("/api/admin/login", { password });
    setLoggingIn(false);
    if (res.ok) {
      setPassword("");
      setChecking(true);
      await load();
    } else {
      setLoginError(res.data?.error || "فشل تسجيل الدخول");
    }
  };

  const logout = async () => {
    await post("/api/admin/logout");
    setData(null);
  };

  const save = async (body: unknown, okMessage: string) => {
    setNotice(null);
    const res = await post("/api/admin/settings", body);
    if (res.ok) {
      setNotice(okMessage);
      await load();
    } else {
      setNotice(`❌ ${res.data?.error || "فشل الحفظ"}`);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!data) return [];
    if (!q) return data.users;
    return data.users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.globalName || "").toLowerCase().includes(q) ||
        u.id.includes(q)
    );
  }, [data, search]);

  if (checking) {
    return <main style={{ padding: 40, textAlign: "center" }}>جاري التحميل...</main>;
  }

  if (!data) {
    return (
      <main style={{ maxWidth: 380, margin: "0 auto", padding: "80px 20px" }}>
        <form onSubmit={login} style={{ ...card, display: "grid", gap: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>لوحة الأدمن</h1>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />
          {loginError && <p style={{ color: "#ff6b81", fontSize: 14 }}>{loginError}</p>}
          <button type="submit" disabled={loggingIn || !password} style={button}>
            {loggingIn ? "..." : "دخول"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px", display: "grid", gap: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>لوحة الأدمن</h1>
        <button type="button" onClick={logout} style={{ ...button, background: "rgba(255,255,255,0.1)" }}>
          خروج
        </button>
      </header>

      {!data.dbConfigured && (
        <div style={{ ...card, borderColor: "#ff6b81" }}>
          قاعدة البيانات غير مضبوطة، لن يتم حفظ الإعدادات ولا تسجيل المستخدمين. اضبط
          UPSTASH_REDIS_REST_URL و UPSTASH_REDIS_REST_TOKEN.
        </div>
      )}

      {notice && <div style={card}>{notice}</div>}

      <section style={{ ...card, display: "grid", gap: 12 }}>
        <h2 style={{ fontWeight: 700 }}>🛠️ وضع الصيانة</h2>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={maintEnabled} onChange={(e) => setMaintEnabled(e.target.checked)} />
          إغلاق الموقع (يظهر للزوار رسالة الصيانة وتتوقف الـ API)
        </label>
        <textarea
          value={maintMessage}
          maxLength={MAX_TEXT}
          rows={3}
          placeholder="رسالة الصيانة"
          onChange={(e) => setMaintMessage(e.target.value)}
          style={input}
        />
        <div>
          <button
            type="button"
            style={button}
            onClick={() =>
              save({ maintenance: { enabled: maintEnabled, message: maintMessage } }, "✅ تم حفظ وضع الصيانة")
            }
          >
            حفظ
          </button>
        </div>
      </section>

      <section style={{ ...card, display: "grid", gap: 12 }}>
        <h2 style={{ fontWeight: 700 }}>📢 رسالة للأعضاء</h2>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={annEnabled} onChange={(e) => setAnnEnabled(e.target.checked)} />
          إظهار الرسالة لكل الزوار
        </label>
        <textarea
          value={annText}
          maxLength={MAX_TEXT}
          rows={3}
          placeholder="نص الرسالة"
          onChange={(e) => setAnnText(e.target.value)}
          style={input}
        />
        <div>
          <button
            type="button"
            style={button}
            onClick={() => save({ announcement: { enabled: annEnabled, text: annText } }, "✅ تم حفظ الرسالة")}
          >
            حفظ
          </button>
        </div>
      </section>

      <section style={{ ...card, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontWeight: 700 }}>👥 المستخدمون ({data.users.length})</h2>
          <input
            placeholder="بحث بالاسم أو الـ ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...input, maxWidth: 240 }}
          />
        </div>
        <p style={{ color: "#aaaaaa", fontSize: 13 }}>
          يتم تسجيل الـ ID والاسم والصورة فقط عند تسجيل الدخول. لا يتم تخزين التوكنات ولا الإيميلات.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "right", color: "#aaaaaa" }}>
                <th style={{ padding: 8 }}>المستخدم</th>
                <th style={{ padding: 8 }}>ID</th>
                <th style={{ padding: 8 }}>أول ظهور</th>
                <th style={{ padding: 8 }}>آخر ظهور</th>
                <th style={{ padding: 8 }}>مرات الدخول</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl(u)} alt="" width={28} height={28} style={{ borderRadius: "50%" }} />
                      {u.globalName || u.username}
                    </span>
                  </td>
                  <td style={{ padding: 8, direction: "ltr", textAlign: "right" }}>{u.id}</td>
                  <td style={{ padding: 8 }}>{formatDate(u.firstSeen)}</td>
                  <td style={{ padding: 8 }}>{formatDate(u.lastSeen)}</td>
                  <td style={{ padding: 8 }}>{u.logins}</td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#aaaaaa" }}>
                    لا يوجد مستخدمون
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
