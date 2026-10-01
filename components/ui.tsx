"use client";

import type { ReactNode } from "react";
import { STATUS_LABEL, type Status } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const STATUS_DOT: Record<Status, string> = {
  frei: "bg-[#34c759]",
  angefragt: "bg-[#ffb300]",
  raus: "bg-[#8e8e93]",
};

/** Status als Glas-Kapsel mit farbigem Punkt; `onPhoto` für dunkles Glas über Bildern. */
export function StatusBadge({ status, className, onPhoto }: { status: Status; className?: string; onPhoto?: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold tracking-tight",
        onPhoto ? "glass-dark" : "glass-thin text-fg",
        className,
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "press inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px]",
        active ? "btn-primary font-semibold" : "glass-thin font-medium text-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("glass specular rounded-[28px]", className)}>{children}</div>;
}

/** Abschnittsüberschrift im iOS-Stil: klein, gesperrt, gedämpft. */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between px-1">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">{children}</h2>
      {action}
    </div>
  );
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between px-1 text-[13px] font-semibold text-fg/80">
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </span>
  );
}

export const inputClass = "field";

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rise flex flex-col items-center px-6 py-16 text-center">
      <p className="font-display text-[34px] leading-none">{title}</p>
      {children && <div className="mt-3 text-[15px] text-muted">{children}</div>}
    </div>
  );
}

export function Spinner() {
  return <div className="mx-auto my-20 h-7 w-7 animate-spin rounded-full border-[2.5px] border-white/70 border-t-accent" />;
}

/** Großer Seitentitel im Stil der iOS Large Titles, mit Serif-Akzent. */
export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rise mb-5 px-1">
      <h1 className="font-display text-[44px] leading-[0.95]">{children}</h1>
      {sub && <p className="mt-2 text-[15px] text-muted">{sub}</p>}
    </div>
  );
}

/** Glas-Sheet von unten (iOS-Stil), auf größeren Bildschirmen mittig. */
export function Sheet({ children, onClose, className, label }: { children: ReactNode; onClose: () => void; className?: string; label?: string }) {
  return (
    <div
      className="fade-in fixed inset-0 z-[70] flex items-end justify-center bg-[rgb(12_29_39/0.16)] backdrop-blur-[3px] sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className={cx("glass-strong sheet-in w-full max-w-lg rounded-t-[34px] sm:rounded-[34px]", className)}
      >
        <div className="mx-auto mt-2.5 h-[5px] w-10 rounded-full bg-[rgb(12_29_39/0.16)] sm:hidden" />
        {children}
      </div>
    </div>
  );
}
