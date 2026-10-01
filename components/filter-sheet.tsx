"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { NO_FILTERS, type Filters } from "@/lib/filters";
import { AMENITIES, AMENITY_LABEL, SOURCES, STATUSES, STATUS_LABEL, type Settings } from "@/lib/types";
import { parseNumber } from "@/lib/calc";
import { Chip, Sheet, inputClass } from "./ui";

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
    <Sheet onClose={onClose} label="Filter" className="flex max-h-[90dvh] flex-col">
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <button onClick={() => onChange({ ...NO_FILTERS, q: f.q })} className="press text-[15px] font-medium text-accent">
            Zurücksetzen
          </button>
          <h2 className="font-display text-[30px] leading-none">Filter</h2>
          <button onClick={onClose} aria-label="Schließen" className="press glass-thin flex h-9 w-9 items-center justify-center rounded-full text-fg/70">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <Group title="Gesamtpreis">
            <div>
              <label>
                <span className="mb-1.5 block px-1 text-[13px] text-muted">höchstens</span>
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
            {!hasTrip && <p className="mt-2 px-1 text-[12.5px] text-muted">Reisezeitraum oben unter Einstellungen festlegen.</p>}
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

        <div className="px-5 pb-safe pt-3">
          <button onClick={onClose} className="btn-primary press w-full py-4 text-[16px]">
            {resultCount} {resultCount === 1 ? "Haus" : "Häuser"} anzeigen
          </button>
        </div>
    </Sheet>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 px-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}
