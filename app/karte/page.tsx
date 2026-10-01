"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Heart, X } from "lucide-react";
import { useApp, useDerived } from "@/components/app-state";
import { Cover } from "@/components/house-card";
import { Spinner, StatusBadge } from "@/components/ui";
import { distance, euro, prices } from "@/lib/calc";

const HouseMap = dynamic(() => import("@/components/house-map"), { ssr: false, loading: () => <Spinner /> });

export default function MapPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <MapView />
    </Suspense>
  );
}

function MapView() {
  const { state } = useApp();
  const { houses, favoriteIds, favorites, voteCount } = useDerived();
  const focus = useSearchParams().get("haus");
  const [selected, setSelected] = useState<string | null>(focus);
  if (!state) return <Spinner />;
  const missing = houses.filter((h) => h.lat == null).length;
  const sel = houses.find((h) => h.id === selected);
  const s = state.settings;

  return (
    <div className="relative isolate h-dvh">
      <HouseMap
        houses={houses}
        settings={s}
        favoriteIds={favorites.length === 1 ? favoriteIds : new Set()}
        selected={selected}
        onSelect={setSelected}
        focus={focus}
      />
      {missing > 0 && !sel && (
        <p className="glass-thin absolute inset-x-3 top-[calc(max(env(safe-area-inset-top),0.5rem)+4.25rem)] z-[500] mx-auto max-w-md rounded-2xl px-4 py-2.5 text-[12.5px] text-muted">
          {missing} {missing === 1 ? "Haus hat" : "Häuser haben"} noch keinen Ort. Unter „Bearbeiten“ Ort oder Koordinaten ergänzen.
        </p>
      )}
      {sel && (
        <div className="absolute inset-x-3 bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+5.25rem)] z-[500] mx-auto max-w-md">
          <div className="glass-strong sheet-in relative flex gap-3 overflow-hidden rounded-[28px] p-2">
            <Link href={`/haus/${sel.id}`} className="flex min-w-0 flex-1 gap-3">
              <Cover src={sel.images[0]} alt={sel.name} className="h-24 w-28 shrink-0 rounded-[22px]" />
              <div className="min-w-0 flex-1 py-0.5">
                <StatusBadge status={sel.status} />
                <p className="mt-1 truncate font-semibold">{sel.name}</p>
                <p className="text-sm text-muted">
                  {euro(prices(sel, s).total)} gesamt · {distance(sel.seaDistance)} Meer
                </p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Heart size={12} /> {voteCount(sel.id)}
                </p>
              </div>
            </Link>
            <button onClick={() => setSelected(null)} aria-label="Schließen" className="self-start p-1 text-muted">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
