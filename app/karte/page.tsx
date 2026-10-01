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
    <div className="relative h-[calc(100dvh-3.5rem-4.5rem)]">
      <HouseMap
        houses={houses}
        settings={s}
        favoriteIds={favorites.length === 1 ? favoriteIds : new Set()}
        selected={selected}
        onSelect={setSelected}
        focus={focus}
      />
      {missing > 0 && !sel && (
        <p className="absolute inset-x-3 top-3 z-[500] rounded-xl bg-surface/95 px-3 py-2 text-xs text-muted shadow">
          {missing} {missing === 1 ? "Haus hat" : "Häuser haben"} noch keinen Ort. Unter „Bearbeiten“ Ort oder Koordinaten ergänzen.
        </p>
      )}
      {sel && (
        <div className="absolute inset-x-3 bottom-3 z-[500] mx-auto max-w-md">
          <div className="relative flex gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-2.5 shadow-lg">
            <Link href={`/haus/${sel.id}`} className="flex min-w-0 flex-1 gap-3">
              <Cover src={sel.images[0]} alt={sel.name} className="h-20 w-24 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 py-0.5">
                <StatusBadge status={sel.status} />
                <p className="mt-1 truncate font-semibold">{sel.name}</p>
                <p className="text-sm text-muted">
                  {euro(prices(sel, s).perPerson)} p. P. · {distance(sel.seaDistance)} Meer
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
