"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { NO_FILTERS, type Filters } from "@/lib/filters";
import { AMENITIES, AMENITY_LABEL, SOURCES, STATUSES, STATUS_LABEL, type Settings } from "@/lib/types";
import { parseNumber } from "@/lib/calc";
import { Chip, inputClass } from "./ui";

const SEA_STEPS = [200, 500, 1000, 3000, 10000];
const SLEEP_STEPS = [2, 4, 6, 8, 10, 12];

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function FilterSheet({
  filters: f,
  onChange,
  onClose,
  resultCount,
  proposers,
  settings,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
  resultCount: number;
  proposers: string[];
  settings: Settings;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });
  const hasTrip = !!(settings.tripFrom && settings.tripTo);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-2xl bg-bg shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Filter"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <button onClick={() => onChange({ ...NO_FILTERS, q: f.q })} className="text-sm text-accent">
            Zurücksetzen
          </button>
          <h2 className="font-semibold">Filter</h2>
          <button onClick={onClose} aria-label="Schließen" className="rounded-full p-1 text-muted">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <Group title="Gesamtpreis">
            <div>
              <label>
                <span className="mb-1 block text-xs text-muted">max. gesamt</span>
                <input
                  inputMode="numeric"
                  placeholder="€"
                  className={inputClass}
                  value={f.maxTotal ?? ""}
                  onChange={(e) => set({ maxTotal: parseNumber(e.target.value) })}
                />
              </label>
            </div>
          </Group>

          <Group title="Schlafplätze (mindestens)">
            <Row>
              {SLEEP_STEPS.map((n) => (
                <Chip key={n} active={f.minSleeps === n} onClick={() => set({ minSleeps: f.minSleeps === n ? null : n })}>
                  {n}+
                </Chip>
              ))}
            </Row>
          </Group>

          <Group title="Entfernung zum Meer (höchstens)">
            <Row>
              {SEA_STEPS.map((m) => (
                <Chip key={m} active={f.maxSea === m} onClick={() => set({ maxSea: f.maxSea === m ? null : m })}>
                  {m < 1000 ? `${m} m` : `${m / 1000} km`}
                </Chip>
              ))}
            </Row>
          </Group>

          <Group title="Ausstattung">
            <Row>
              <Chip active={f.pool} onClick={() => set({ pool: !f.pool })}>
                Pool
              </Chip>
              {AMENITIES.map((a) => (
                <Chip key={a} active={f.amenities.includes(a)} onClick={() => set({ amenities: toggle(f.amenities, a) })}>
                  {AMENITY_LABEL[a]}
                </Chip>
              ))}
            </Row>
          </Group>

          <Group title="Status">
            <Row>
              {STATUSES.map((s) => (
                <Chip key={s} active={f.statuses.includes(s)} onClick={() => set({ statuses: toggle(f.statuses, s) })}>
                  {STATUS_LABEL[s]}
                </Chip>
              ))}
            </Row>
          </Group>

          <Group title="Zeitraum">
            <Row>
              <Chip active={f.fitsTrip} onClick={() => hasTrip && set({ fitsTrip: !f.fitsTrip })} className={hasTrip ? "" : "opacity-50"}>
                Deckt unseren Reisezeitraum ab
              </Chip>
            </Row>
            {!hasTrip && <p className="mt-2 text-xs text-muted">Reisezeitraum oben unter Einstellungen festlegen.</p>}
          </Group>

          <Group title="Quelle">
            <Row>
              {SOURCES.map((s) => (
                <Chip key={s} active={f.sources.includes(s)} onClick={() => set({ sources: toggle(f.sources, s) })}>
                  {s}
                </Chip>
              ))}
            </Row>
          </Group>

          {proposers.length > 0 && (
            <Group title="Vorgeschlagen von">
              <Row>
                {proposers.map((p) => (
                  <Chip key={p} active={f.proposers.includes(p)} onClick={() => set({ proposers: toggle(f.proposers, p) })}>
                    {p}
                  </Chip>
                ))}
              </Row>
            </Group>
          )}
        </div>

        <div className="border-t border-line p-4 pb-safe">
          <button onClick={onClose} className="w-full rounded-xl bg-accent py-3 font-semibold text-accent-fg">
            {resultCount} {resultCount === 1 ? "Haus" : "Häuser"} anzeigen
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}
