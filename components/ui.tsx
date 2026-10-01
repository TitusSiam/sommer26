"use client";

import type { ReactNode } from "react";
import { STATUS_LABEL, type Status } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const STATUS_CLASS: Record<Status, string> = {
  frei: "bg-ok-soft text-ok",
  angefragt: "bg-warn-soft text-warn",
  raus: "bg-out-soft text-out",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_CLASS[status], className)}>
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
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
        active ? "border-accent bg-accent-soft font-medium text-accent" : "border-line bg-surface text-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border border-line bg-surface", className)}>{children}</div>;
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </span>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 outline-none placeholder:text-muted/70 focus:border-accent";

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Spinner() {
  return <div className="mx-auto my-16 h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />;
}
