"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Check, Heart, Minus, X } from "lucide-react";
import { useApp, useDerived } from "@/components/app-state";
import { Cover } from "@/components/house-card";
import { Card, Empty, Spinner, StatusBadge, cx } from "@/components/ui";
import { coversTrip, distance, euro, prices, range } from "@/lib/calc";
import { AMENITIES, AMENITY_LABEL, type House } from "@/lib/types";

type Row = {
  label: string;
  render: (h: House) => ReactNode;
  /** Zahl zum Vergleichen; best = "min" oder "max" markiert den besten Wert */
  score?: (h: House) => number | null;
  best?: "min" | "max";
};

export default function ComparePage() {
  const { state, compare, toggleCompare, clearCompare } = useApp();
  const { houses, voteCount } = useDerived();
  if (!state) return <Spinner />;
  const s = state.settings;
  const picked = compare.map((id) => houses.find((h) => h.id === id)).filter((h): h is House => !!h);

  if (picked.length < 2)
    return (
      <div>
        <h1 className="mb-1 text-xl font-semibold">Vergleich</h1>
        <p className="mb-4 text-sm text-muted">Wähle 2 bis 3 Häuser aus ({picked.length}/3).</p>
        {houses.length < 2 ? (
          <Empty title="Zu wenige Häuser">Füge mindestens zwei Häuser hinzu.</Empty>
        ) : (
          <Card className="divide-y divide-line">
            {houses.map((h) => (
              <label key={h.id} className="flex cursor-pointer items-center gap-3 p-3">
                <input type="checkbox" checked={compare.includes(h.id)} onChange={() => toggleCompare(h.id)} className="h-5 w-5 accent-[var(--accent)]" />
                <Cover src={h.images[0]} alt="" className="h-10 w-14 shrink-0 rounded-lg" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{h.name}</span>
                <span className="text-sm text-muted">{euro(prices(h, s).total)}</span>
              </label>
            ))}
          </Card>
        )}
      </div>
    );

  const rows: Row[] = [
    { label: "Status", render: (h) => <StatusBadge status={h.status} /> },
    { label: "Stimmen", render: (h) => <span className="inline-flex items-center gap-1"><Heart size={14} /> {voteCount(h.id)}</span>, score: (h) => voteCount(h.id), best: "max" },
    { label: "Gesamtpreis", render: (h) => euro(prices(h, s).total), score: (h) => prices(h, s).total, best: "min" },
    { label: "Preis pro Nacht", render: (h) => euro(prices(h, s).perDay), score: (h) => prices(h, s).perDay, best: "min" },
    { label: "Schlafplätze", render: (h) => h.sleeps ?? "–", score: (h) => h.sleeps, best: "max" },
    { label: "Entfernung zum Meer", render: (h) => distance(h.seaDistance), score: (h) => h.seaDistance, best: "min" },
    { label: "Pool", render: (h) => <YesNo on={h.pool} />, score: (h) => (h.pool ? 1 : 0), best: "max" },
    ...AMENITIES.map<Row>((a) => ({ label: AMENITY_LABEL[a], render: (h) => <YesNo on={h.amenities[a]} /> })),
    {
      label: "Verfügbar",
      render: (h) => (
        <span className={cx(coversTrip(h, s) === true && "text-ok", coversTrip(h, s) === false && "text-danger")}>{range(h.availableFrom, h.availableTo)}</span>
      ),
    },
    { label: "Quelle", render: (h) => (h.url ? <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-accent underline">{h.source}</a> : h.source) },
    { label: "Vorgeschlagen von", render: (h) => h.proposedBy || "–" },
    { label: "Nachteile", render: (h) => <span className="whitespace-pre-line text-xs">{h.cons || "–"}</span> },
  ];

  const cols = picked.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vergleich</h1>
        <button onClick={clearCompare} className="text-sm text-accent">
          Auswahl leeren
        </button>
      </div>

      <div className={cx("sticky top-14 z-20 -mx-4 grid gap-2 border-b border-line bg-bg/95 px-4 pb-3 pt-1 backdrop-blur", cols)}>
        {picked.map((h) => (
          <div key={h.id} className="relative min-w-0">
            <Link href={`/haus/${h.id}`}>
              <Cover src={h.images[0]} alt={h.name} className="aspect-[4/3] w-full rounded-xl" />
              <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-tight">{h.name}</p>
            </Link>
            <button onClick={() => toggleCompare(h.id)} aria-label="Aus Vergleich entfernen" className="absolute right-1 top-1 rounded-full bg-black/55 p-0.5 text-white">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="divide-y divide-line">
        {rows.map((r) => {
          const scores = r.score ? picked.map(r.score) : [];
          const valid = scores.filter((x): x is number => x != null);
          const target = r.best && valid.length > 1 ? (r.best === "min" ? Math.min(...valid) : Math.max(...valid)) : null;
          const allSame = valid.length === picked.length && valid.every((v) => v === valid[0]);
          return (
            <div key={r.label} className="py-2.5">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{r.label}</p>
              <div className={cx("grid gap-2 text-sm", cols)}>
                {picked.map((h, i) => {
                  const isBest = target != null && !allSame && scores[i] === target;
                  return (
                    <div key={h.id} className={cx("min-w-0 break-words rounded-lg px-1.5 py-1", isBest && "bg-ok-soft font-semibold text-ok")}>
                      {r.render(h)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">Grün = bester Wert in der Zeile.</p>
    </div>
  );
}

function YesNo({ on }: { on: boolean }) {
  return on ? <Check size={16} className="text-ok" aria-label="Ja" /> : <Minus size={16} className="text-muted" aria-label="Nein" />;
}
