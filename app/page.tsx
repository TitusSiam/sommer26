"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronRight, Crown, Heart, Search, Share2, SlidersHorizontal, X } from "lucide-react";
import { useApp, useDerived } from "@/components/app-state";
import { HouseCard, Cover } from "@/components/house-card";
import { FilterSheet } from "@/components/filter-sheet";
import { ActivityItem } from "@/components/activity-item";
import { Card, Chip, Empty, SectionTitle, Spinner, cx } from "@/components/ui";
import { NO_FILTERS, SORTS, activeFilterCount, matches, sortHouses, type Filters, type SortKey } from "@/lib/filters";
import { euro, nightsBetween, prices, range } from "@/lib/calc";
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

  const nights = nightsBetween(settings.tripFrom, settings.tripTo);
  const subline = [
    `${houses.length} ${houses.length === 1 ? "Haus" : "Häuser"}`,
    settings.tripFrom && settings.tripTo ? `${range(settings.tripFrom, settings.tripTo)}${nights ? ` · ${nights} Nächte` : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (!houses.length)
    return (
      <div>
        <Title name={settings.tripName} sub="Noch leer. Zeit für Fernweh." />
        <Card className="rise p-6 text-center">
          <p className="font-display text-[30px] leading-tight">Das erste Haus</p>
          <p className="mx-auto mt-2 max-w-xs text-[15px] text-muted">Link von Airbnb, Booking oder FeWo-direkt einfügen. Den Rest ergänzt ihr später.</p>
          <Link href="/neu" className="btn-primary press mt-5 px-6 py-3.5 text-[15px]">
            Haus hinzufügen
          </Link>
        </Card>
      </div>
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
    <div className="space-y-7">
      <Title name={settings.tripName} sub={subline} />
      <Overview />

      <section className="space-y-3.5">
        <SectionTitle>Häuser</SectionTitle>
        <div className="flex gap-2">
          <label className="glass-thin relative flex flex-1 items-center rounded-full">
            <Search size={18} className="pointer-events-none absolute left-4 text-muted" />
            <input
              value={filters.q}
              onChange={(e) => update({ ...filters, q: e.target.value })}
              placeholder="Suchen"
              className="w-full rounded-full bg-transparent py-3 pl-11 pr-4 outline-none placeholder:text-faint"
            />
          </label>
          <button onClick={() => setSheet(true)} aria-label="Filter" className="press glass-thin relative flex h-12 w-12 items-center justify-center rounded-full">
            <SlidersHorizontal size={19} />
            {count > 0 && <span className="btn-primary absolute -right-0.5 -top-0.5 h-5 min-w-5 px-1 text-[11px]">{count}</span>}
          </button>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
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

        <div className="flex items-center justify-between gap-2 px-1 text-[13.5px]">
          <p className="text-muted">
            {visible.length} von {houses.length}
            {count > 0 && (
              <button onClick={() => update(NO_FILTERS)} className="press ml-2 inline-flex items-center gap-0.5 font-medium text-accent">
                <X size={14} /> Filter löschen
              </button>
            )}
          </p>
          <label className="press glass-thin flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2">
            <ArrowUpDown size={14} className="text-muted" />
            <select
              value={sort}
              onChange={(e) => updateSort(e.target.value as SortKey)}
              className="max-w-44 appearance-none bg-transparent pr-1 text-[13.5px] font-semibold text-fg outline-none"
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
            {visible.map((h, i) => (
              <HouseCard key={h.id} index={i} house={h} settings={settings} favorite={favoriteIds.has(h.id) && favorites.length === 1} />
            ))}
          </div>
        ) : (
          <Empty title="Nichts gefunden">Filter lockern oder zurücksetzen.</Empty>
        )}

        {visible.some((h) => {
          const p = prices(h, settings);
          return p.totalDerived || p.perDayDerived;
        }) && <p className="px-1 text-[12px] text-muted">* berechnet aus Preis pro Nacht × Nächte bzw. Gesamtpreis ÷ Nächte.</p>}
      </section>

      <Recent />

      <a href={whatsappHref(rankingText())} target="_blank" rel="noopener noreferrer" className="press glass-thin flex items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-semibold">
        <Share2 size={17} className="text-[#25D366]" /> Stand in WhatsApp teilen
      </a>

      {compare.length >= 2 && (
        <Link
          href="/vergleich"
          className="btn-primary press sheet-in fixed inset-x-4 bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+5.25rem)] z-30 mx-auto max-w-xs py-3 text-[15px]"
        >
          {compare.length} Häuser vergleichen <ChevronRight size={18} />
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

function Title({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="rise -mt-12 px-1 pt-1">
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">Ferienhaus</p>
      <h1 className="font-display mt-1 text-[52px] leading-[0.92]">{name}</h1>
      <p className="mt-2.5 text-[15px] text-muted">{sub}</p>
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
  const dot = { frei: "bg-[#34c759]", angefragt: "bg-[#ffb300]", raus: "bg-[#8e8e93]" } as const;

  return (
    <section className="space-y-3.5">
      {fav ? (
        <Link href={`/haus/${fav.id}`} className="rise press glass specular block rounded-[32px] p-1.5" style={{ animationDelay: "60ms" }}>
          <div className="relative overflow-hidden rounded-[26px]">
            <Cover src={fav.images[0]} alt={fav.name} className="aspect-[16/10] w-full" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
            <div className="glass-dark absolute inset-x-2.5 bottom-2.5 flex items-end gap-3 rounded-[20px] p-3.5">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white/80">
                  <Crown size={13} /> Aktueller Favorit
                </p>
                <p className="font-display mt-0.5 truncate text-[30px] leading-none">{fav.name}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="flex items-center justify-end gap-1 text-[15px] font-semibold">
                  <Heart size={15} fill="currentColor" className="text-[#ff7b86]" /> {maxVotes}
                </p>
                <p className="text-[12.5px] text-white/80">{euro(prices(fav, settings).total)}</p>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <Card className="rise p-5">
          <p className="font-display text-[26px] leading-tight">{favorites.length > 1 ? "Gleichstand" : "Noch kein Favorit"}</p>
          <p className="mt-1 text-[14.5px] text-muted">
            {favorites.length > 1 ? favorites.map((h) => h.name).join(" · ") : "Tippe auf das Herz bei den Häusern, die dir gefallen."}
          </p>
        </Card>
      )}

      <Card className="rise grid grid-cols-3 divide-x divide-[var(--hairline)] py-4">
        {(["frei", "angefragt", "raus"] as const).map((s) => (
          <div key={s} className="text-center">
            <p className="font-display text-[34px] leading-none tabular-nums">{counts[s]}</p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] text-muted">
              <span className={cx("h-1.5 w-1.5 rounded-full", dot[s])} />
              {STATUS_LABEL[s]}
            </p>
          </div>
        ))}
      </Card>

      {ranked.length > 1 && (
        <Card className="rise p-4">
          <p className="mb-3 px-0.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">Ranking</p>
          <ol className="space-y-3">
            {ranked.slice(0, 5).map(({ h, v }, i) => (
              <li key={h.id}>
                <Link href={`/haus/${h.id}`} className="press flex items-center gap-3 text-[15px]">
                  <span className="font-display w-5 text-center text-[22px] leading-none text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{h.name}</span>
                    <span className="mt-1.5 block h-[5px] overflow-hidden rounded-full bg-[rgb(12_29_39/0.07)]">
                      <span className="block h-full rounded-full bg-gradient-to-r from-[#5ac8fa] to-[#0a7cff]" style={{ width: `${(v / maxVotes) * 100}%` }} />
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
    </section>
  );
}

function Recent() {
  const { state } = useApp();
  const recent = state?.activity.slice(0, 3) ?? [];
  if (!recent.length) return null;
  return (
    <section>
      <SectionTitle
        action={
          <Link href="/aktivitaet" className="text-[14px] font-medium text-accent">
            Alle
          </Link>
        }
      >
        Zuletzt passiert
      </SectionTitle>
      <Card className="px-4 py-1">
        <ul className="divide-y divide-[var(--hairline)]">
          {recent.map((a) => (
            <ActivityItem key={a.id} a={a} compact />
          ))}
        </ul>
      </Card>
    </section>
  );
}
