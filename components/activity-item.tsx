"use client";

import Link from "next/link";
import { Heart, HeartOff, MessageCircle, Pencil, Plus, Settings2, Tag, Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/calc";
import type { Activity, ActivityType } from "@/lib/types";

const ICON: Record<ActivityType, typeof Plus> = {
  add: Plus,
  edit: Pencil,
  status: Tag,
  vote: Heart,
  unvote: HeartOff,
  comment: MessageCircle,
  delete: Trash2,
  settings: Settings2,
};

const VERB: Record<ActivityType, string> = {
  add: "hat hinzugefügt:",
  edit: "hat bearbeitet:",
  status: "hat den Status geändert:",
  vote: "mag",
  unvote: "hat die Stimme zurückgenommen bei",
  comment: "hat kommentiert:",
  delete: "hat entfernt:",
  settings: "hat die Reisedaten geändert",
};

export function ActivityItem({ a, compact }: { a: Activity; compact?: boolean }) {
  const Icon = ICON[a.type];
  const name = a.houseName && (a.houseId ? <Link href={`/haus/${a.houseId}`} className="font-medium underline-offset-2 hover:underline">{a.houseName}</Link> : <span className="font-medium">{a.houseName}</span>);
  return (
    <li className="flex gap-3 py-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className={compact ? "truncate" : ""}>
          <span className="font-semibold">{a.author}</span> {VERB[a.type]} {name}
        </p>
        {a.detail && a.type !== "settings" && (
          <p className={`text-muted ${compact ? "truncate" : ""}`}>{a.type === "comment" ? `„${a.detail}“` : a.detail}</p>
        )}
        <p className="text-xs text-muted">{timeAgo(a.at)}</p>
      </div>
    </li>
  );
}
