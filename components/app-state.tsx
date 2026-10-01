"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppState, Comment, House, Settings } from "@/lib/types";

type Ctx = {
  state: AppState | null;
  error: string | null;
  me: string;
  setMe: (name: string) => void;
  /** Führt fn mit dem eigenen Namen aus, fragt ihn vorher ab, falls nötig. */
  withName: (fn: (name: string) => void | Promise<void>) => void;
  refresh: () => Promise<void>;
  createHouse: (h: Partial<House>) => Promise<House | null>;
  updateHouse: (id: string, patch: Partial<House>) => Promise<House | null>;
  deleteHouse: (id: string) => Promise<boolean>;
  toggleVote: (id: string) => void;
  addComment: (id: string, text: string) => Promise<boolean>;
  deleteComment: (id: string, commentId: string) => Promise<void>;
  saveSettings: (s: Settings) => Promise<boolean>;
  uploadImage: (file: File) => Promise<string | null>;
  compare: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  toast: (msg: string) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp außerhalb von AppProvider");
  return c;
}

const NAME_KEY = "fh:name";
const COMPARE_KEY = "fh:compare";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {
    // privater Modus o. ä.: dann eben nur für diese Sitzung
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Fehler ${res.status}`);
  return data as T;
}

/** Verkleinert Fotos im Browser, damit Uploads schnell und klein bleiben. */
async function shrink(file: File, maxSide = 1600, quality = 0.8): Promise<Blob> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  for (const q of [quality, 0.65, 0.5]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && blob.size < 850 * 1024) return blob;
  }
  return file;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [me, setMeState] = useState("");
  const [askName, setAskName] = useState(false);
  const pending = useRef<((name: string) => void | Promise<void>) | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setState(await api<AppState>("/api/state", { cache: "no-store" }));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    setMeState(safeGet(NAME_KEY) ?? "");
    try {
      setCompare(JSON.parse(sessionStorage.getItem(COMPARE_KEY) ?? "[]"));
    } catch {
      // ignorieren
    }
    refresh();
    const onFocus = () => document.visibilityState === "visible" && refresh();
    const timer = setInterval(() => document.visibilityState === "visible" && refresh(), 15000);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const setMe = useCallback((name: string) => {
    const n = name.trim().slice(0, 40);
    setMeState(n);
    safeSet(NAME_KEY, n);
  }, []);

  const withName = useCallback(
    (fn: (name: string) => void | Promise<void>) => {
      if (me) {
        fn(me);
        return;
      }
      pending.current = fn;
      setAskName(true);
    },
    [me],
  );

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        const out = await fn();
        refresh();
        return out;
      } catch (e) {
        toast((e as Error).message);
        return null;
      }
    },
    [refresh, toast],
  );

  const actor = () => safeGet(NAME_KEY) || me;

  const ctx: Ctx = {
    state,
    error,
    me,
    setMe,
    withName,
    refresh,
    createHouse: (house) =>
      run(async () => (await api<{ house: House }>("/api/houses", { method: "POST", body: JSON.stringify({ actor: actor(), house }) })).house),
    updateHouse: (id, patch) =>
      run(async () => {
        // Sofort lokal anzeigen, Server bestätigt beim nächsten Laden
        setState((s) => s && { ...s, houses: s.houses.map((h) => (h.id === id ? { ...h, ...patch } : h)) });
        return (await api<{ house: House }>(`/api/houses/${id}`, { method: "PATCH", body: JSON.stringify({ actor: actor(), house: patch }) })).house;
      }),
    deleteHouse: async (id) =>
      !!(await run(() => api(`/api/houses/${id}`, { method: "DELETE", body: JSON.stringify({ actor: actor() }) }))),
    toggleVote: (id) =>
      withName((name) => {
        const voted = (state?.votes[id] ?? []).includes(name);
        setState(
          (s) =>
            s && {
              ...s,
              votes: { ...s.votes, [id]: voted ? (s.votes[id] ?? []).filter((n) => n !== name) : [...(s.votes[id] ?? []), name] },
            },
        );
        run(() => api(`/api/houses/${id}/vote`, { method: "POST", body: JSON.stringify({ actor: name, on: !voted }) }));
      }),
    addComment: async (id, text) => {
      const res = await run(() => api<{ comment: Comment }>(`/api/houses/${id}/comments`, { method: "POST", body: JSON.stringify({ actor: actor(), text }) }));
      return !!res;
    },
    deleteComment: async (id, commentId) => {
      await run(() => api(`/api/houses/${id}/comments`, { method: "DELETE", body: JSON.stringify({ actor: actor(), commentId }) }));
    },
    saveSettings: async (settings) =>
      !!(await run(() => api("/api/settings", { method: "PUT", body: JSON.stringify({ actor: actor(), settings }) }))),
    uploadImage: async (file) => {
      try {
        const body = new FormData();
        body.append("file", await shrink(file), "bild.jpg");
        return (await api<{ url: string }>("/api/images", { method: "POST", body })).url;
      } catch (e) {
        toast((e as Error).message);
        return null;
      }
    },
    compare,
    toggleCompare: (id) =>
      setCompare((c) => {
        const next = c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? (toast("Maximal 3 Häuser vergleichen"), c) : [...c, id];
        try {
          sessionStorage.setItem(COMPARE_KEY, JSON.stringify(next));
        } catch {
          // ignorieren
        }
        return next;
      }),
    clearCompare: () => {
      setCompare([]);
      try {
        sessionStorage.removeItem(COMPARE_KEY);
      } catch {
        // ignorieren
      }
    },
    toast,
  };

  return (
    <AppCtx.Provider value={ctx}>
      {children}
      {askName && (
        <NameDialog
          onCancel={() => {
            pending.current = null;
            setAskName(false);
          }}
          onSave={(n) => {
            setMe(n);
            setAskName(false);
            const fn = pending.current;
            pending.current = null;
            fn?.(n);
          }}
        />
      )}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-full bg-fg px-4 py-2 text-sm text-bg shadow-lg">
            {t.msg}
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}

export function NameDialog({ initial = "", onSave, onCancel }: { initial?: string; onSave: (n: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center" onClick={onCancel}>
      <form
        className="w-full max-w-sm rounded-t-2xl bg-surface p-5 pb-safe shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (v.trim()) onSave(v);
        }}
      >
        <h2 className="text-lg font-semibold">Wie heißt du?</h2>
        <p className="mt-1 text-sm text-muted">Damit die anderen sehen, wer abstimmt und kommentiert.</p>
        <input
          autoFocus
          value={v}
          onChange={(e) => setV(e.target.value)}
          maxLength={40}
          placeholder="Vorname"
          className="mt-4 w-full rounded-xl border border-line bg-bg px-3 py-3 outline-none focus:border-accent"
        />
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-line py-3 text-sm font-medium">
            Abbrechen
          </button>
          <button disabled={!v.trim()} className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-accent-fg disabled:opacity-40">
            Speichern
          </button>
        </div>
      </form>
    </div>
  );
}

/** Abgeleitete Werte, die mehrere Seiten brauchen. */
export function useDerived() {
  const { state } = useApp();
  return useMemo(() => {
    const houses = state?.houses ?? [];
    const voteCount = (id: string) => state?.votes[id]?.length ?? 0;
    const ranked = houses
      .filter((h) => h.status !== "raus")
      .map((h) => ({ h, v: voteCount(h.id) }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v || a.h.createdAt - b.h.createdAt);
    const top = ranked[0]?.v ?? 0;
    const favorites = ranked.filter((x) => x.v === top).map((x) => x.h);
    return { houses, voteCount, ranked, favorites, favoriteIds: new Set(favorites.map((h) => h.id)) };
  }, [state]);
}
