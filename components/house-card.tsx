"use client";

import Link from "next/link";
import { BedDouble, Crown, Flame, Heart, House as HouseIcon, Snowflake, WashingMachine, Waves, WavesLadder, Wifi } from "lucide-react";
import { distance, euro, prices } from "@/lib/calc";
import { AMENITY_LABEL, type Amenity, type House, type Settings } from "@/lib/types";
import { useApp } from "./app-state";
import { StatusBadge, cx } from "./ui";

export const AMENITY_ICON: Record<Amenity, typeof Wifi> = {
  wifi: Wifi,
  ac: Snowflake,
  washer: WashingMachine,
  bbq: Flame,
};

export function Cover({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  if (!src)
    return (
      <div className={cx("flex items-center justify-center bg-surface-2 text-muted", className)}>
        <HouseIcon size={32} strokeWidth={1.4} />
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" className={cx("bg-surface-2 object-cover", className)} />;
}

export function HouseCard({ house: h, settings, favorite }: { house: House; settings: Settings; favorite: boolean }) {
  const { state, me, toggleVote, compare, toggleCompare } = useApp();
  const p = prices(h, settings);
  const voters = state?.votes[h.id] ?? [];
  const voted = !!me && voters.includes(me);
  const inCompare = compare.includes(h.id);
  const comments = state?.comments[h.id]?.length ?? 0;

  return (
    <article className={cx("overflow-hidden rounded-2xl border bg-surface", favorite ? "border-accent" : "border-line", h.status === "raus" && "opacity-60")}>
      <Link href={`/haus/${h.id}`} className="relative block">
        <Cover src={h.images[0]} alt={h.name} className="aspect-[16/10] w-full" />
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          <StatusBadge status={h.status} />
          {favorite && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-fg">
              <Crown size={12} /> Favorit
            </span>
          )}
        </div>
        <span className="absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">{h.source}</span>
      </Link>

      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <Link href={`/haus/${h.id}`} className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-snug">{h.name}</h3>
            <p className="truncate text-sm text-muted">
              {[h.location, h.proposedBy && `von ${h.proposedBy}`].filter(Boolean).join(" · ") || " "}
            </p>
          </Link>
          <div className="text-right">
            <p className="text-lg font-bold leading-tight">{euro(p.perPerson)}</p>
            <p className="text-xs text-muted">pro Person</p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>
            {euro(p.total)}
            {p.totalDerived && "*"} gesamt
          </span>
          {p.perDay != null && (
            <span>
              {euro(p.perDay)}
              {p.perDayDerived && "*"}/Nacht
            </span>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          {h.sleeps != null && (
            <Fact>
              <BedDouble size={14} /> {h.sleeps}
            </Fact>
          )}
          {h.seaDistance != null && (
            <Fact>
              <Waves size={14} /> {distance(h.seaDistance)}
            </Fact>
          )}
          {h.pool && (
            <Fact accent>
              <WavesLadder size={14} /> Pool
            </Fact>
          )}
          {(Object.keys(AMENITY_ICON) as Amenity[])
            .filter((a) => h.amenities[a])
            .map((a) => {
              const Icon = AMENITY_ICON[a];
              return (
                <Fact key={a} title={AMENITY_LABEL[a]}>
                  <Icon size={14} />
                </Fact>
              );
            })}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <button
            onClick={() => toggleVote(h.id)}
            className={cx(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
              voted ? "border-heart bg-heart/10 text-heart" : "border-line",
            )}
            aria-pressed={voted}
          >
            <Heart size={16} fill={voted ? "currentColor" : "none"} /> {voters.length}
          </button>
          <Link href={`/haus/${h.id}#kommentare`} className="text-sm text-muted">
            {comments} {comments === 1 ? "Kommentar" : "Kommentare"}
          </Link>
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={inCompare} onChange={() => toggleCompare(h.id)} className="h-4 w-4 accent-[var(--accent)]" />
            Vergleichen
          </label>
        </div>
      </div>
    </article>
  );
}

function Fact({ children, accent, title }: { children: React.ReactNode; accent?: boolean; title?: string }) {
  return (
    <span
      title={title}
      className={cx("inline-flex items-center gap-1 rounded-md px-1.5 py-1", accent ? "bg-accent-soft text-accent" : "bg-surface-2 text-fg")}
    >
      {children}
    </span>
  );
}
