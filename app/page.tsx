"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Crown, Heart, Search, Share2, SlidersHorizontal, X } from "lucide-react";
import { useApp, useDerived } from "@/components/app-state";
import { HouseCard, Cover } from "@/components/house-card";
import { FilterSheet } from "@/components/filter-sheet";
import { ActivityItem } from "@/components/activity-item";
import { Card, Chip, Empty, Spinner } from "@/components/ui";
import { NO_FILTERS, SORTS, activeFilterCount, matches, sortHouses, type Filters, type SortKey } from "@/lib/filters";
import { euro, prices } from "@/lib/calc";
import { appUrl, whatsappHref } from "@/lib/share";
import { AMENITY_LABEL, DEFAULT_SETTINGS, STATUS_LABEL } from "@/lib/types";

const FILTER_KEY = "fh:filters";
const SORT_KEY = "fh:sort";

export default function HomePage() {
  const { state, error, compare } = useApp();
  const { houses, voteCount, ranked, favorites, favoriteIds } = useDerived();
  const settings = state?.settings ?? DEFAULT_SETTINGS;
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<SortKey>("votes");
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    try {
      const f = localStorage.getItem(FILTER_KEY);
      if (f) setFilters({ ...NO_FILTERS, ...JSON.parse(f) });
      const s = localStorage.getItem(SORT_KEY);
      if (s && s in SORTS) setSort(s as SortKey);
    } catch {
      // ignorieren
    }
  }, []);

  const update = (f: Filters) => {
    setFilters(f);
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(f));
    } catch {
      // ignorieren
    }
  };
  const updateSort = (s: SortKey) => {
    setSort(s);
    try {
      localStorage.setItem(SORT_KEY, s);
    } catch {
      // ignorieren
    }
  };

  const visible = useMemo(
    () => sortHouses(houses.filter((h) => matches(h, filters, settings)), sort, settings, voteCount),
    [houses, filters, settings, sort, voteCount],
  );
  const proposers = useMemo(() => [...new Set(houses.map((h) => h.proposedBy).filter(Boolean))].sort(), [houses]);
  const count = activeFilterCount(filters);

  if (!state) return error ? <Empty title="Laden fehlgeschlagen">{error}</Empty> : <Spinner />;

  if (!houses.length)
    return (
      <Empty title="Noch keine Häuser">
        <p>Füge das erste Angebot hinzu. Link einfügen reicht, der Rest geht später.</p>
        <Link href="/neu" className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 font-semibold text-accent-fg">
          Haus hinzufügen
        </Link>
      </Empty>
    );

  const rankingText = () =>
    [
      `🏡 ${settings.tripName}: aktueller Stand`,
      ...ranked.slice(0, 5).map(({ h, v }, i) => {
        const total = prices(h, settings).total;
        return `${i + 1}. ${h.name} (${v} 👍${total != null ? `, ${euro(total)} gesamt` : ""})`;
      }),
      ranked.length ? "" : "Noch keine Stimmen. Jetzt abstimmen:",
      appUrl("/", state.shareCode),
    ]
      .filter((x) => x !== "")
      .join("\n");

  return (
    <div className="space-y-5">
      <Overview />

      <section className="space-y-3">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={filters.q}
              onChange={(e) => update({ ...filters, q: e.target.value })}
              placeholder="Suchen"
              className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 outline-none focus:border-accent"
            />
          </label>
          <button
            onClick={() => setSheet(true)}
            className="relative flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-medium"
          >
            <SlidersHorizontal size={18} /> Filter
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-fg">{count}</span>
            )}
          </button>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={filters.pool} onClick={() => update({ ...filters, pool: !filters.pool })}>
            Pool
          </Chip>
          <Chip active={filters.maxSea === 500} onClick={() => update({ ...filters, maxSea: filters.maxSea === 500 ? null : 500 })}>
            ≤ 500 m zum Meer
          </Chip>
          {(["wifi", "ac"] as const).map((a) => (
            <Chip
              key={a}
              active={filters.amenities.includes(a)}
              onClick={() =>
                update({
                  ...filters,
                  amenities: filters.amenities.includes(a) ? filters.amenities.filter((x) => x !== a) : [...filters.amenities, a],
                })
              }
            >
              {AMENITY_LABEL[a]}
            </Chip>
          ))}
          <Chip
            active={filters.statuses.length === 2 && !filters.statuses.includes("raus")}
            onClick={() =>
              update({ ...filters, statuses: filters.statuses.length === 2 && !filters.statuses.includes("raus") ? [] : ["frei", "angefragt"] })
            }
          >
            Ohne „{STATUS_LABEL.raus}“
          </Chip>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <p className="text-muted">
            {visible.length} von {houses.length} {houses.length === 1 ? "Haus" : "Häusern"}
            {count > 0 && (
              <button onClick={() => update(NO_FILTERS)} className="ml-2 inline-flex items-center gap-0.5 text-accent">
                <X size={14} /> Filter löschen
              </button>
            )}
          </p>
          <label className="flex items-center gap-1 text-muted">
            <ArrowUpDown size={15} />
            <select
              value={sort}
              onChange={(e) => updateSort(e.target.value as SortKey)}
              className="max-w-44 bg-transparent py-1 text-sm font-medium text-fg outline-none"
              aria-label="Sortierung"
            >
              {Object.entries(SORTS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visible.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((h) => (
              <HouseCard key={h.id} house={h} settings={settings} favorite={favoriteIds.has(h.id) && favorites.length === 1} />
            ))}
          </div>
        ) : (
          <Empty title="Nichts gefunden">Filter lockern oder zurücksetzen.</Empty>
        )}

        {visible.some((h) => {
          const p = prices(h, settings);
          return p.totalDerived || p.perDayDerived;
        }) && <p className="text-xs text-muted">* berechnet aus Preis pro Nacht × Nächte bzw. Gesamtpreis ÷ Nächte.</p>}

        <a
          href={whatsappHref(rankingText())}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-medium"
        >
          <Share2 size={16} /> Stand in WhatsApp teilen
        </a>
      </section>

      {compare.length >= 2 && (
        <Link
          href="/vergleich"
          className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-md items-center justify-center rounded-xl bg-fg py-3 text-sm font-semibold text-bg shadow-lg"
        >
          {compare.length} Häuser vergleichen
        </Link>
      )}

      {sheet && (
        <FilterSheet
          filters={filters}
          onChange={update}
          onClose={() => setSheet(false)}
          resultCount={visible.length}
          proposers={proposers}
          settings={settings}
        />
      )}
    </div>
  );
}

function Overview() {
  const { state } = useApp();
  const { houses, ranked, favorites } = useDerived();
  if (!state) return null;
  const settings = state.settings;
  const fav = favorites.length === 1 ? favorites[0] : null;
  const maxVotes = ranked[0]?.v ?? 0;
  const counts = { frei: 0, angefragt: 0, raus: 0 };
  for (const h of houses) counts[h.status]++;
  const recent = state.activity.slice(0, 3);

  return (
    <section className="space-y-3">
      {fav ? (
        <Link href={`/haus/${fav.id}`} className="block">
          <Card className="flex items-center gap-3 overflow-hidden border-accent p-2.5">
            <Cover src={fav.images[0]} alt={fav.name} className="h-16 w-20 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-accent">
                <Crown size={13} /> Aktueller Favorit
              </p>
              <p className="truncate font-semibold">{fav.name}</p>
              <p className="text-sm text-muted">
                {maxVotes} {maxVotes === 1 ? "Stimme" : "Stimmen"} · {euro(prices(fav, settings).total)} gesamt
              </p>
            </div>
          </Card>
        </Link>
      ) : (
        <Card className="p-3.5 text-sm">
          <p className="font-semibold">{favorites.length > 1 ? `Gleichstand zwischen ${favorites.length} Häusern` : "Noch kein Favorit"}</p>
          <p className="text-muted">
            {favorites.length > 1 ? favorites.map((h) => h.name).join(", ") : "Tippe auf das Herz bei den Häusern, die dir gefallen."}
          </p>
        </Card>
      )}

      {ranked.length > 1 && (
        <Card className="p-3.5">
          <p className="mb-2 text-sm font-semibold">Ranking</p>
          <ol className="space-y-2">
            {ranked.slice(0, 5).map(({ h, v }, i) => (
              <li key={h.id}>
                <Link href={`/haus/${h.id}`} className="flex items-center gap-2 text-sm">
                  <span className="w-4 text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{h.name}</span>
                    <span className="mt-1 block h-1.5 rounded-full bg-surface-2">
                      <span className="block h-1.5 rounded-full bg-accent" style={{ width: `${(v / maxVotes) * 100}%` }} />
                    </span>
                  </span>
                  <span className="flex items-center gap-1 tabular-nums text-muted">
                    <Heart size={13} /> {v}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        {(["frei", "angefragt", "raus"] as const).map((s) => (
          <Card key={s} className="py-2.5">
            <p className="text-lg font-bold tabular-nums">{counts[s]}</p>
            <p className="text-xs text-muted">{STATUS_LABEL[s]}</p>
          </Card>
        ))}
      </div>

      {recent.length > 0 && (
        <Card className="p-3.5">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-semibold">Zuletzt passiert</p>
            <Link href="/aktivitaet" className="text-sm text-accent">
              Alle
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {recent.map((a) => (
              <ActivityItem key={a.id} a={a} compact />
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
