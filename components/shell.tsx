"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, GitCompareArrows, House, Map, Plus, Settings2 } from "lucide-react";
import { NameDialog, useApp } from "./app-state";
import { cx } from "./ui";

const TABS = [
  { href: "/", label: "Häuser", icon: House },
  { href: "/karte", label: "Karte", icon: Map },
  { href: "/vergleich", label: "Vergleich", icon: GitCompareArrows },
  { href: "/aktivitaet", label: "Aktivität", icon: Activity },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { state, me, setMe, compare } = useApp();
  const [editName, setEditName] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  if (path === "/zugang") return <>{children}</>;
  const fullBleed = path === "/karte";
  const isHome = path === "/";
  // Detailseite hat ein randloses Titelbild mit eigenen Glasknöpfen
  const isDetail = path.startsWith("/haus/") && !path.endsWith("/bearbeiten");
  const activeIndex = TABS.findIndex((t) => (t.href === "/" ? isHome : path.startsWith(t.href)));

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      {!isDetail && (
        <header className={cx("z-40 px-3 pt-[max(env(safe-area-inset-top),0.5rem)]", fullBleed ? "absolute inset-x-0 top-0 mx-auto max-w-3xl" : "sticky top-0")}>
          <div
            className={cx(
              "flex h-14 items-center gap-2 rounded-full px-2 transition-[background,box-shadow,border-color] duration-300",
              scrolled || fullBleed ? "glass specular" : "border border-transparent",
            )}
          >
            <Link
              href="/"
              className={cx(
                "min-w-0 flex-1 truncate pl-3 text-[17px] font-semibold tracking-tight transition-opacity duration-300",
                isHome && !scrolled ? "opacity-0" : "opacity-100",
              )}
            >
              {state?.settings.tripName ?? "Ferienhaus"}
            </Link>
            <Link href="/reise" aria-label="Reise-Einstellungen" className="press glass-thin flex h-10 w-10 items-center justify-center rounded-full text-fg/80">
              <Settings2 size={19} />
            </Link>
            <button onClick={() => setEditName(true)} className="press glass-thin flex h-10 items-center gap-2 rounded-full pl-1 pr-3.5 text-[14px] font-medium">
              <Avatar name={me} size={32} />
              <span className="max-w-24 truncate">{me || "Name?"}</span>
            </button>
          </div>
          {state?.storage === "memory" && (
            <p className="glass-thin mx-1 mt-2 rounded-2xl px-4 py-2.5 text-[12.5px] text-warn">
              Kein Speicher eingerichtet: Änderungen gehen verloren. Upstash Redis in Vercel verbinden (siehe README).
            </p>
          )}
        </header>
      )}

      <main className={cx("flex-1", fullBleed ? "" : isDetail ? "pb-36" : "px-4 pb-36 pt-2")}>{children}</main>

      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-safe">
        <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-2.5 px-4">
          <ul className="glass specular relative grid flex-1 grid-cols-4 rounded-full p-1.5">
            {activeIndex >= 0 && (
              <span
                aria-hidden
                className="absolute bottom-1.5 left-1.5 top-1.5 rounded-full bg-[rgb(10_124_255/0.11)] shadow-[inset_0_0_0_0.5px_rgb(10_124_255/0.18)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.3,0.8,0.25,1.15)]"
                style={{ width: "calc((100% - 0.75rem) / 4)", transform: `translateX(${activeIndex * 100}%)` }}
              />
            )}
            {TABS.map(({ href, label, icon: Icon }, i) => {
              const active = i === activeIndex;
              const badge = href === "/vergleich" && compare.length ? compare.length : null;
              return (
                <li key={href} className="relative">
                  <Link
                    href={href}
                    className={cx("press flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[10.5px] font-medium", active ? "text-accent" : "text-fg/70")}
                  >
                    <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                    <span className={active ? "font-semibold" : ""}>{label}</span>
                  </Link>
                  {badge && (
                    <span className="btn-primary pointer-events-none absolute right-[calc(50%-22px)] top-0.5 h-[18px] min-w-[18px] px-1 text-[10px]">{badge}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <Link href="/neu" aria-label="Haus hinzufügen" className={cx("btn-primary h-[62px] w-[62px] shrink-0", path === "/neu" && "ring-4 ring-white/70")}>
            <Plus size={28} strokeWidth={2.4} />
          </Link>
        </div>
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

const AVATAR_TINTS = [
  "from-[#5ac8fa] to-[#0a7cff]",
  "from-[#ffb36b] to-[#ff7a45]",
  "from-[#7fe0a8] to-[#22b07d]",
  "from-[#ff9ab0] to-[#ff5a7a]",
  "from-[#ffd36b] to-[#f2a300]",
  "from-[#8fd3ff] to-[#3f8cff]",
];

/** Farbiger Initialen-Kreis, Farbe stabil je Name. */
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const n = name.trim();
  let hash = 0;
  for (const ch of n.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.5),0_2px_6px_-2px_rgb(0_0_0/0.25)]",
        n ? AVATAR_TINTS[hash % AVATAR_TINTS.length] : "from-[#c7ccd1] to-[#9aa1a8]",
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {(n || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
