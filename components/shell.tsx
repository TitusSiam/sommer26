"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Activity, GitCompareArrows, Home, Map, Plus, Settings2, UserRound } from "lucide-react";
import { NameDialog, useApp } from "./app-state";
import { cx } from "./ui";

const NAV = [
  { href: "/", label: "Häuser", icon: Home },
  { href: "/karte", label: "Karte", icon: Map },
  { href: "/neu", label: "Neu", icon: Plus, primary: true },
  { href: "/vergleich", label: "Vergleich", icon: GitCompareArrows },
  { href: "/aktivitaet", label: "Aktivität", icon: Activity },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { state, me, setMe, compare } = useApp();
  const [editName, setEditName] = useState(false);
  if (path === "/zugang") return <>{children}</>;
  const fullBleed = path === "/karte";

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-4">
          <Link href="/" className="min-w-0 flex-1 truncate text-base font-semibold">
            {state?.settings.tripName ?? "Ferienhaus"}
          </Link>
          <Link href="/reise" aria-label="Reise-Einstellungen" className="rounded-full p-2 text-muted hover:bg-surface-2">
            <Settings2 size={20} />
          </Link>
          <button
            onClick={() => setEditName(true)}
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-2 pr-3 text-sm"
          >
            <UserRound size={16} className="text-muted" />
            <span className="max-w-24 truncate">{me || "Name?"}</span>
          </button>
        </div>
        {state?.storage === "memory" && (
          <p className="bg-warn-soft px-4 py-2 text-xs text-warn">
            Kein Speicher eingerichtet: Änderungen gehen verloren. Upstash Redis in Vercel verbinden (siehe README).
          </p>
        )}
      </header>

      <main className={cx("flex-1", fullBleed ? "" : "px-4 pb-28 pt-4")}>{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-safe backdrop-blur">
        <ul className="mx-auto flex max-w-3xl items-end justify-around px-2 pt-1.5">
          {NAV.map(({ href, label, icon: Icon, primary }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            const badge = href === "/vergleich" && compare.length ? compare.length : null;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={cx("relative flex flex-col items-center gap-0.5 py-1 text-[11px]", active ? "text-accent" : "text-muted")}
                >
                  {primary ? (
                    <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-fg shadow-md">
                      <Icon size={24} />
                    </span>
                  ) : (
                    <Icon size={22} strokeWidth={active ? 2.3 : 1.8} />
                  )}
                  <span className={active ? "font-semibold" : ""}>{label}</span>
                  {badge && (
                    <span className="absolute right-[calc(50%-20px)] top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {editName && (
        <NameDialog
          initial={me}
          onCancel={() => setEditName(false)}
          onSave={(n) => {
            setMe(n);
            setEditName(false);
          }}
        />
      )}
    </div>
  );
}
