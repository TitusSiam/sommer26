"use client";

import Link from "next/link";
import { useState } from "react";
import { BedDouble, Crown, Flame, GitCompareArrows, Heart, House as HouseIcon, MessageCircle, Snowflake, WashingMachine, Waves, WavesLadder, Wifi } from "lucide-react";
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

/** Bild oder, falls keins da ist, eine ruhige Meer-und-Sand-Fläche. */
export function Cover({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src)
    return (
      <div className={cx("relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#bfe6f2] via-[#d9eef2] to-[#f6e7d3] text-white", className)}>
        <svg aria-hidden viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-1/2 w-full">
          <path d="M0 50 Q 50 30 100 50 T 200 50 T 300 50 T 400 50 V120 H0Z" fill="rgb(255 255 255 / 0.35)" />
          <path d="M0 75 Q 50 58 100 75 T 200 75 T 300 75 T 400 75 V120 H0Z" fill="rgb(255 255 255 / 0.4)" />
        </svg>
        <HouseIcon size={34} strokeWidth={1.3} className="relative drop-shadow-[0_2px_6px_rgb(0_60_90/0.25)]" />
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(src)} className={cx("bg-[#dceef3] object-cover", className)} />
  );
}

export function HouseCard({ house: h, settings, favorite, index = 0 }: { house: House; settings: Settings; favorite: boolean; index?: number }) {
  const { state, me, toggleVote, compare, toggleCompare } = useApp();
  const p = prices(h, settings);
  const voters = state?.votes[h.id] ?? [];
  const voted = !!me && voters.includes(me);
  const inCompare = compare.includes(h.id);
  const comments = state?.comments[h.id]?.length ?? 0;
  const out = h.status === "raus";

  return (
    <article
      className={cx("rise glass specular rounded-[30px] p-1.5", favorite && "ring-2 ring-accent/50 ring-offset-0", out && "opacity-60 saturate-50")}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative overflow-hidden rounded-[24px]">
        <Link href={`/haus/${h.id}`} className="block">
          <Cover src={h.images[0]} alt={h.name} className="aspect-[4/3] w-full" />
          <span className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 to-transparent" />
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex gap-1.5">
          <StatusBadge status={h.status} onPhoto />
          {favorite && (
            <span className="btn-primary px-2.5 py-1 text-[11.5px]">
              <Crown size={12} /> Favorit
            </span>
          )}
        </div>

        <button
          onClick={() => toggleVote(h.id)}
          aria-pressed={voted}
          aria-label={voted ? "Stimme zurücknehmen" : "Gefällt mir"}
          className={cx("press absolute right-2.5 top-2.5 flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold", voted ? "bg-white text-heart shadow-lg" : "glass-dark")}
        >
          <Heart key={String(voted)} size={18} fill={voted ? "currentColor" : "none"} className={voted ? "pop" : ""} />
          {voters.length}
        </button>

        <span className="glass-dark pointer-events-none absolute bottom-2.5 left-2.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold">{h.source}</span>

        <button
          onClick={() => toggleCompare(h.id)}
          aria-pressed={inCompare}
          aria-label={inCompare ? "Aus Vergleich entfernen" : "Zum Vergleich hinzufügen"}
          className={cx("press absolute bottom-2.5 right-2.5 flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold", inCompare ? "btn-primary" : "glass-dark")}
        >
          <GitCompareArrows size={15} />
          {inCompare ? "Im Vergleich" : "Vergleichen"}
        </button>
      </div>

      <Link href={`/haus/${h.id}`} className="block px-3 pb-2.5 pt-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[17px] font-semibold leading-snug tracking-tight">{h.name}</h3>
            <p className="truncate text-[13.5px] text-muted">{[h.location, h.proposedBy && `von ${h.proposedBy}`].filter(Boolean).join(" · ") || " "}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-[28px] leading-none">
              {euro(p.total)}
              {p.totalDerived && <span className="align-top text-[16px] text-muted">*</span>}
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted">
              {p.perDay != null ? `${euro(p.perDay)}${p.perDayDerived ? "*" : ""} / Nacht` : "gesamt"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13px] text-fg/75">
          {h.sleeps != null && (
            <Fact icon={BedDouble}>{h.sleeps}</Fact>
          )}
          {h.seaDistance != null && <Fact icon={Waves}>{distance(h.seaDistance)}</Fact>}
          {h.pool && (
            <Fact icon={WavesLadder} accent>
              Pool
            </Fact>
          )}
          {(Object.keys(AMENITY_ICON) as Amenity[])
            .filter((a) => h.amenities[a])
            .map((a) => {
              const Icon = AMENITY_ICON[a];
              return <Icon key={a} size={15} strokeWidth={1.9} aria-label={AMENITY_LABEL[a]} />;
            })}
          {comments > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 text-muted">
              <MessageCircle size={14} /> {comments}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}

function Fact({ icon: Icon, children, accent }: { icon: typeof Wifi; children: React.ReactNode; accent?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-1 font-medium", accent && "text-accent")}>
      <Icon size={15} strokeWidth={1.9} /> {children}
    </span>
  );
}
