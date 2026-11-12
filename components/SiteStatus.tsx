"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface SiteStatusData {
  maintenance: { enabled: boolean; message: string };
  announcement: { enabled: boolean; text: string; updatedAt?: number };
}

// How long the announcement stays on screen before it hides itself.
const AUTO_HIDE_MS = 10_000;
const DISMISS_STORAGE_KEY = "quester_dismissed_announcement";

// Shows a full-screen maintenance notice or an announcement banner on every public page.
// The /adminpan pages are never covered, so the admin can always switch maintenance off.
export default function SiteStatus() {
  const pathname = usePathname();
  const [status, setStatus] = useState<SiteStatusData | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [dismissedLoaded, setDismissedLoaded] = useState(false);

  // Identifies one announcement. It changes when the admin edits or re-saves the message,
  // which makes the banner appear again for people who had closed the previous one.
  const announcementKey =
    status?.announcement.enabled && status.announcement.text
      ? `${status.announcement.updatedAt ?? 0}:${status.announcement.text}`
      : null;

  const dismiss = useCallback((key: string) => {
    setDismissed(key);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, key);
    } catch {
      // storage can be blocked; the banner then just comes back on the next visit
    }
  }, []);

  // Remember (per browser) which announcement was already closed or timed out.
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_STORAGE_KEY));
    } catch {
      // ignore
    }
    setDismissedLoaded(true);
  }, []);

  // Hide the banner by itself after AUTO_HIDE_MS.
  useEffect(() => {
    if (!dismissedLoaded || !announcementKey || announcementKey === dismissed) return;
    const timer = setTimeout(() => dismiss(announcementKey), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [dismissedLoaded, announcementKey, dismissed, dismiss]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/status", { method: "POST", cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as SiteStatusData;
        if (!cancelled) setStatus(data);
      } catch {
        // network errors are ignored; the site simply stays as it is
      }
    };

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!status || pathname?.startsWith("/adminpan")) return null;

  if (status.maintenance.enabled) {
    return (
      <div
        role="alert"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: "#06061a" }}
      >
        <div className="text-5xl">🛠️</div>
        <h1 className="text-2xl font-bold">الموقع تحت الصيانة</h1>
        <p className="max-w-md whitespace-pre-line text-base" style={{ color: "#aaaaaa" }}>
          {status.maintenance.message}
        </p>
      </div>
    );
  }

  const { announcement } = status;
  if (dismissedLoaded && announcementKey && announcementKey !== dismissed) {
    return (
      <div
        role="status"
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-xl items-start gap-3 rounded-xl px-4 py-3 shadow-lg"
        style={{ background: "#800020", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        <p className="flex-1 whitespace-pre-line text-sm">📢 {announcement.text}</p>
        <button
          type="button"
          aria-label="إغلاق"
          onClick={() => dismiss(announcementKey)}
          className="text-lg leading-none opacity-80 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
}
