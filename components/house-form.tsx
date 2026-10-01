"use client";

import { useRef, useState } from "react";
import { ChevronDown, ImagePlus, Link2, Loader2, MapPin, Star, X } from "lucide-react";
import { detectSource, nightsBetween, parseCoords, parseNumber } from "@/lib/calc";
import { AMENITIES, AMENITY_LABEL, SOURCES, STATUSES, STATUS_LABEL, emptyHouse, type House } from "@/lib/types";
import { useApp } from "./app-state";
import { Label, cx, inputClass } from "./ui";

type Draft = {
  url: string;
  name: string;
  source: House["source"];
  images: string[];
  sleeps: string;
  totalPrice: string;
  pricePerDay: string;
  pool: boolean;
  sea: string;
  location: string;
  coords: string;
  availableFrom: string;
  availableTo: string;
  amenities: House["amenities"];
  cons: string;
  status: House["status"];
  proposedBy: string;
};

const numStr = (n: number | null) => (n == null ? "" : String(n).replace(".", ","));

function toDraft(h: Omit<House, "id" | "createdAt" | "updatedAt">): Draft {
  return {
    url: h.url,
    name: h.name,
    source: h.source,
    images: h.images,
    sleeps: numStr(h.sleeps),
    totalPrice: numStr(h.totalPrice),
    pricePerDay: numStr(h.pricePerDay),
    pool: h.pool,
    sea: h.seaDistance == null ? "" : h.seaDistance >= 1000 ? `${numStr(h.seaDistance / 1000)} km` : `${h.seaDistance} m`,
    location: h.location,
    coords: h.lat != null && h.lng != null ? `${h.lat.toFixed(5)}, ${h.lng.toFixed(5)}` : "",
    availableFrom: h.availableFrom ?? "",
    availableTo: h.availableTo ?? "",
    amenities: h.amenities,
    cons: h.cons,
    status: h.status,
    proposedBy: h.proposedBy,
  };
}

/** „300“, „300 m“ → 300; „1,5 km“ → 1500; „1,5“ ohne Einheit → 1500 (unter 20 als km gedeutet). */
export function parseDistance(v: string): number | null {
  const n = parseNumber(v);
  if (n == null) return null;
  if (/km/i.test(v)) return Math.round(n * 1000);
  if (/\bm\b|meter/i.test(v)) return Math.round(n);
  return n < 20 ? Math.round(n * 1000) : Math.round(n);
}

function fromDraft(d: Draft): Partial<House> {
  const c = parseCoords(d.coords);
  return {
    url: d.url.trim(),
    name: d.name.trim(),
    source: d.source,
    images: d.images,
    sleeps: parseNumber(d.sleeps),
    totalPrice: parseNumber(d.totalPrice),
    pricePerDay: parseNumber(d.pricePerDay),
    pool: d.pool,
    seaDistance: parseDistance(d.sea),
    location: d.location.trim(),
    ...(d.coords.trim() ? (c ? { lat: c.lat, lng: c.lng } : {}) : { lat: null, lng: null }),
    availableFrom: d.availableFrom || null,
    availableTo: d.availableTo || null,
    amenities: d.amenities,
    cons: d.cons.trim(),
    status: d.status,
    proposedBy: d.proposedBy.trim(),
  };
}

export function HouseForm({
  initial,
  mode,
  onSubmit,
}: {
  initial?: House;
  mode: "create" | "edit";
  onSubmit: (h: Partial<House>) => Promise<void>;
}) {
  const { uploadImage, toast, me } = useApp();
  const [d, setD] = useState<Draft>(() => toDraft(initial ?? { ...emptyHouse(), proposedBy: me }));
  const [more, setMore] = useState(mode === "edit");
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [imgUrl, setImgUrl] = useState("");
  const lastFetched = useRef(initial?.url ?? "");
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  async function autofill(url: string) {
    if (!/^https?:\/\//i.test(url) || url === lastFetched.current) return;
    lastFetched.current = url;
    set({ source: detectSource(url) });
    setFetching(true);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) return;
      const p = (await res.json()) as { title: string | null; image: string | null; sleeps: number | null; pool: boolean | null; lat: number | null; lng: number | null };
      setD((x) => ({
        ...x,
        name: x.name || p.title || "",
        images: p.image && !x.images.includes(p.image) ? [p.image, ...x.images] : x.images,
        sleeps: x.sleeps || (p.sleeps ? String(p.sleeps) : ""),
        pool: x.pool || !!p.pool,
        coords: x.coords || (p.lat != null && p.lng != null ? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` : ""),
      }));
      if (p.title || p.image) toast("Daten aus dem Link übernommen");
    } finally {
      setFetching(false);
    }
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files].slice(0, 10);
    setUploading((n) => n + list.length);
    for (const f of list) {
      const url = await uploadImage(f);
      if (url) setD((x) => ({ ...x, images: [...x.images, url] }));
      setUploading((n) => n - 1);
    }
  }

  const nights = nightsBetween(d.availableFrom || null, d.availableTo || null);
  const canSave = !!(d.name.trim() || d.url.trim()) && !busy && uploading === 0;

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSave) return;
        if (d.coords.trim() && !parseCoords(d.coords)) {
          toast("Koordinaten nicht erkannt, z. B. 37.123, 14.456");
          return;
        }
        setBusy(true);
        try {
          await onSubmit(fromDraft(d));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block">
        <Label hint={fetching ? "liest Angebot …" : d.url ? d.source : "füllt Name & Bild automatisch"}>Link zum Angebot</Label>
        <div className="relative">
          <Link2 size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="url"
            inputMode="url"
            value={d.url}
            onChange={(e) => {
              set({ url: e.target.value });
              if (e.nativeEvent instanceof InputEvent && e.nativeEvent.inputType === "insertFromPaste") autofill(e.target.value.trim());
            }}
            onBlur={(e) => autofill(e.target.value.trim())}
            placeholder="https://www.airbnb.de/rooms/…"
            className={cx(inputClass, "pl-10")}
          />
          {fetching && <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />}
        </div>
      </label>

      <label className="block">
        <Label>Name</Label>
        <input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="z. B. Villa mit Meerblick" className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <Label>Gesamtpreis</Label>
          <input inputMode="decimal" value={d.totalPrice} onChange={(e) => set({ totalPrice: e.target.value })} placeholder="€" className={inputClass} />
        </label>
        <label className="block">
          <Label hint="optional">Preis/Nacht</Label>
          <input inputMode="decimal" value={d.pricePerDay} onChange={(e) => set({ pricePerDay: e.target.value })} placeholder="€" className={inputClass} />
        </label>
        <label className="block">
          <Label>Schlafplätze</Label>
          <input inputMode="numeric" value={d.sleeps} onChange={(e) => set({ sleeps: e.target.value })} placeholder="z. B. 8" className={inputClass} />
        </label>
        <label className="block">
          <Label>Zum Meer</Label>
          <input value={d.sea} onChange={(e) => set({ sea: e.target.value })} placeholder="300 m / 1,5 km" className={inputClass} />
        </label>
      </div>

      <fieldset>
        <Label>Ausstattung</Label>
        <div className="flex flex-wrap gap-2">
          <CheckChip checked={d.pool} onChange={(v) => set({ pool: v })} label="Pool" />
          {AMENITIES.map((a) => (
            <CheckChip key={a} checked={d.amenities[a]} onChange={(v) => set({ amenities: { ...d.amenities, [a]: v } })} label={AMENITY_LABEL[a]} />
          ))}
        </div>
      </fieldset>

      <label className="block">
        <Label hint="für die Karte">Ort</Label>
        <div className="relative">
          <MapPin size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={d.location} onChange={(e) => set({ location: e.target.value })} placeholder="z. B. Cefalù, Sizilien" className={cx(inputClass, "pl-10")} />
        </div>
      </label>

      {!more && (
        <button type="button" onClick={() => setMore(true)} className="flex w-full items-center justify-center gap-1 py-1 text-sm font-medium text-accent">
          Weitere Details <ChevronDown size={16} />
        </button>
      )}

      {more && (
        <div className="space-y-4 border-t border-line pt-4">
          <div>
            <Label hint="erstes = Titelbild">Bilder</Label>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {d.images.map((src, i) => (
                <div key={src + i} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  {i === 0 ? (
                    <span className="absolute bottom-1 left-1 rounded bg-accent px-1 text-[10px] font-semibold text-accent-fg">Titel</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => set({ images: [src, ...d.images.filter((_, j) => j !== i)] })}
                      className="absolute bottom-1 left-1 rounded bg-black/60 p-0.5 text-white"
                      aria-label="Als Titelbild"
                    >
                      <Star size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => set({ images: d.images.filter((_, j) => j !== i) })}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                    aria-label="Bild entfernen"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-xs text-muted">
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                {uploading ? "lädt …" : "Foto"}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>
            </div>
            <div className="mt-2 flex gap-2">
              <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="oder Bild-URL einfügen" className={cx(inputClass, "py-2 text-sm")} />
              <button
                type="button"
                disabled={!/^https?:\/\//.test(imgUrl.trim())}
                onClick={() => {
                  set({ images: [...d.images, imgUrl.trim()] });
                  setImgUrl("");
                }}
                className="rounded-xl border border-line px-3 text-sm disabled:opacity-40"
              >
                Hinzufügen
              </button>
            </div>
          </div>

          <div>
            <Label hint={nights ? `${nights} Nächte` : undefined}>Verfügbarer Zeitraum</Label>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={d.availableFrom} onChange={(e) => set({ availableFrom: e.target.value })} className={inputClass} aria-label="Von" />
              <input type="date" value={d.availableTo} min={d.availableFrom || undefined} onChange={(e) => set({ availableTo: e.target.value })} className={inputClass} aria-label="Bis" />
            </div>
          </div>

          <label className="block">
            <Label>Nachteile</Label>
            <textarea
              value={d.cons}
              onChange={(e) => set({ cons: e.target.value })}
              rows={3}
              placeholder="z. B. Straße hörbar, steile Treppe, nur 1 Bad"
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <Label>Quelle</Label>
              <select value={d.source} onChange={(e) => set({ source: e.target.value as House["source"] })} className={inputClass}>
                {SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <Label>Status</Label>
              <select value={d.status} onChange={(e) => set({ status: e.target.value as House["status"] })} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <Label>Vorgeschlagen von</Label>
            <input value={d.proposedBy} onChange={(e) => set({ proposedBy: e.target.value })} placeholder="Name" className={inputClass} />
          </label>

          <label className="block">
            <Label hint="optional, sonst aus dem Ort">Koordinaten</Label>
            <input
              value={d.coords}
              onChange={(e) => {
                const c = parseCoords(e.target.value);
                set({ coords: c ? `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}` : e.target.value });
              }}
              placeholder="Google-Maps-Link oder 37.12, 14.45"
              className={inputClass}
            />
          </label>
        </div>
      )}

      <div className="sticky bottom-20 z-10 -mx-4 bg-gradient-to-t from-bg via-bg to-transparent px-4 pb-2 pt-4">
        <button disabled={!canSave} className="w-full rounded-xl bg-accent py-3.5 font-semibold text-accent-fg shadow-sm disabled:opacity-40">
          {busy ? "Speichert …" : uploading ? "Bilder laden …" : mode === "create" ? "Haus speichern" : "Änderungen speichern"}
        </button>
      </div>
    </form>
  );
}

/** Echte Checkbox im Chip-Look: schnell antippbar, für Screenreader eine Checkbox. */
function CheckChip({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label
      className={cx(
        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
        checked ? "border-accent bg-accent-soft font-medium text-accent" : "border-line bg-surface",
      )}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
      {label}
    </label>
  );
}
