"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  Check,
  ChevronLeft,
  Crown,
  ExternalLink,
  GitCompareArrows,
  Heart,
  MapPin,
  Moon,
  Pencil,
  Send,
  Share2,
  Trash2,
  Waves,
  WavesLadder,
} from "lucide-react";
import { useApp, useDerived } from "@/components/app-state";
import { AMENITY_ICON, Cover } from "@/components/house-card";
import { Avatar } from "@/components/shell";
import { Card, Empty, SectionTitle, Spinner, cx } from "@/components/ui";
import { coversTrip, distance, euro, nightsFor, prices, range, timeAgo } from "@/lib/calc";
import { houseShareText, whatsappHref } from "@/lib/share";
import { AMENITIES, AMENITY_LABEL, STATUSES, STATUS_LABEL, type Status } from "@/lib/types";

const STATUS_TINT: Record<Status, string> = {
  frei: "text-ok",
  angefragt: "text-warn",
  raus: "text-out",
};

export default function HouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { state, me, toggleVote, updateHouse, deleteHouse, addComment, deleteComment, withName, compare, toggleCompare } = useApp();
  const { favoriteIds, favorites } = useDerived();
  const [slide, setSlide] = useState(0);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  if (!state) return <Spinner />;
  const h = state.houses.find((x) => x.id === id);
  if (!h)
    return (
      <Empty title="Nicht gefunden">
        <Link href="/" className="font-medium text-accent">
          Zur Übersicht
        </Link>
      </Empty>
    );

  const s = state.settings;
  const p = prices(h, s);
  const nights = nightsFor(h, s);
  const fits = coversTrip(h, s);
  const voters = state.votes[h.id] ?? [];
  const voted = !!me && voters.includes(me);
  const comments = state.comments[h.id] ?? [];
  const isFav = favoriteIds.has(h.id) && favorites.length === 1;
  const images = h.images.length ? h.images : [undefined];
  const statusIndex = STATUSES.indexOf(h.status);
  const inCompare = compare.includes(h.id);
  const back = () => (window.history.length > 1 ? router.back() : router.push("/"));

  return (
    <div>
      {/* Titelbild, randlos */}
      <div className="relative">
        <div
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {images.map((src, i) => (
            <Cover key={i} src={src} alt={`${h.name} Bild ${i + 1}`} className="aspect-[4/5] max-h-[64vh] w-full shrink-0 snap-center sm:aspect-[16/10]" />
          ))}
        </div>
        <span className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/30 to-transparent" />
        <div className="absolute inset-x-3 top-[max(env(safe-area-inset-top),0.75rem)] flex items-center gap-2">
          <button onClick={back} aria-label="Zurück" className="press glass-dark flex h-11 w-11 items-center justify-center rounded-full">
            <ChevronLeft size={24} />
          </button>
          <span className="flex-1" />
          <a
            href={whatsappHref(houseShareText(h, s, voters.length, state.shareCode))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="In WhatsApp teilen"
            className="press glass-dark flex h-11 w-11 items-center justify-center rounded-full"
          >
            <Share2 size={19} />
          </a>
          <button
            onClick={() => toggleVote(h.id)}
            aria-pressed={voted}
            aria-label={voted ? "Stimme zurücknehmen" : "Gefällt mir"}
            className={cx("press flex h-11 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-semibold", voted ? "bg-white text-heart shadow-lg" : "glass-dark")}
          >
            <Heart key={String(voted)} size={20} fill={voted ? "currentColor" : "none"} className={voted ? "pop" : ""} />
            {voters.length}
          </button>
        </div>
        {images.length > 1 && (
          <div className="glass-dark absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full px-2.5 py-1.5">
            {images.map((_, i) => (
              <span key={i} className={cx("h-1.5 rounded-full bg-white transition-all duration-300", i === slide ? "w-4" : "w-1.5 opacity-50")} />
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 -mt-8 space-y-4 px-4">
        {/* Kopf mit Titel, Status und Preis */}
        <Card className="rise p-5">
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            {isFav && (
              <span className="inline-flex items-center gap-1 text-accent">
                <Crown size={13} /> Favorit ·
              </span>
            )}
            <span>{h.source}</span>
            {h.proposedBy && <span>· von {h.proposedBy}</span>}
          </div>
          <h1 className="font-display mt-1.5 text-[40px] leading-[0.98]">{h.name}</h1>
          {h.location && (
            <p className="mt-2 flex items-center gap-1 text-[15px] text-muted">
              <MapPin size={15} /> {h.location}
            </p>
          )}

          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-[46px] leading-none">
                {euro(p.total)}
                {p.totalDerived && <span className="align-top text-[22px] text-muted">*</span>}
              </p>
              <p className="mt-1 text-[13.5px] text-muted">
                gesamt{p.perDay != null && ` · ${euro(p.perDay)}${p.perDayDerived ? "*" : ""} pro Nacht`}
              </p>
            </div>
            {h.url && (
              <a href={h.url} target="_blank" rel="noopener noreferrer" className="btn-primary press shrink-0 px-4 py-3 text-[14.5px]">
                Angebot <ExternalLink size={15} />
              </a>
            )}
          </div>

          {/* Status als Segment-Steuerung mit gleitendem Glas-Daumen */}
          <div className="relative mt-5 grid grid-cols-3 rounded-full bg-[rgb(12_29_39/0.06)] p-1" role="radiogroup" aria-label="Status">
            <span
              aria-hidden
              className="glass-strong absolute bottom-1 left-1 top-1 rounded-full transition-transform duration-500 [transition-timing-function:cubic-bezier(0.3,0.8,0.25,1.15)]"
              style={{ width: "calc((100% - 0.5rem) / 3)", transform: `translateX(${statusIndex * 100}%)` }}
            />
            {STATUSES.map((st) => (
              <button
                key={st}
                role="radio"
                aria-checked={h.status === st}
                onClick={() => h.status !== st && withName(() => void updateHouse(h.id, { status: st }))}
                className={cx("relative z-10 rounded-full py-2.5 text-[14px] transition-colors", h.status === st ? cx("font-semibold", STATUS_TINT[st]) : "font-medium text-fg/60")}
              >
                {STATUS_LABEL[st]}
              </button>
            ))}
          </div>
        </Card>

        {/* Eckdaten als Kacheln */}
        <div className="rise grid grid-cols-2 gap-2.5" style={{ animationDelay: "60ms" }}>
          <Tile icon={BedDouble} label="Schlafplätze" value={h.sleeps ?? "–"} />
          <Tile icon={Waves} label="Zum Meer" value={distance(h.seaDistance)} />
          <Tile icon={WavesLadder} label="Pool" value={h.pool ? "Ja" : "Nein"} highlight={h.pool} />
          <Tile icon={Moon} label="Nächte" value={nights ?? "–"} />
          <div className="glass-thin col-span-2 flex items-center gap-3 rounded-[22px] p-4">
            <CalendarDays size={20} className="shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-muted">Verfügbar</p>
              <p className="text-[16px] font-semibold">{range(h.availableFrom, h.availableTo)}</p>
            </div>
            {fits === true && <span className="rounded-full bg-ok-soft px-2.5 py-1 text-[12px] font-semibold text-ok">passt</span>}
            {fits === false && <span className="rounded-full bg-[rgb(229_72_61/0.12)] px-2.5 py-1 text-[12px] font-semibold text-danger">passt nicht</span>}
          </div>
        </div>
        {(p.totalDerived || p.perDayDerived) && <p className="px-1 text-[12px] text-muted">* berechnet aus {nights} Nächten</p>}

        {/* Ausstattung */}
        <section className="rise" style={{ animationDelay: "120ms" }}>
          <SectionTitle>Ausstattung</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const Icon = AMENITY_ICON[a];
              const on = h.amenities[a];
              return (
                <span
                  key={a}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] font-medium",
                    on ? "glass-thin text-fg" : "bg-[rgb(12_29_39/0.04)] text-faint line-through decoration-1",
                  )}
                >
                  <Icon size={16} className={on ? "text-accent" : ""} /> {AMENITY_LABEL[a]}
                  {on && <Check size={14} className="text-ok" />}
                </span>
              );
            })}
          </div>
          {h.cons && (
            <div className="glass-thin mt-3 rounded-[22px] bg-[linear-gradient(160deg,rgb(255_236_206/0.75),rgb(255_246_232/0.5))] p-4">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-warn">Nachteile</p>
              <p className="mt-1 whitespace-pre-line text-[15px]">{h.cons}</p>
            </div>
          )}
        </section>

        {/* Wer findet es gut */}
        {voters.length > 0 && (
          <Card className="flex items-center gap-3 p-4">
            <div className="flex -space-x-2">
              {voters.slice(0, 6).map((v) => (
                <span key={v} className="rounded-full ring-2 ring-white">
                  <Avatar name={v} size={30} />
                </span>
              ))}
            </div>
            <p className="min-w-0 flex-1 text-[14px] text-muted">
              <span className="font-semibold text-fg">{voters.join(", ")}</span> {voters.length === 1 ? "mag" : "mögen"} das Haus
            </p>
          </Card>
        )}

        {/* Aktionen */}
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={whatsappHref(houseShareText(h, s, voters.length, state.shareCode))}
            target="_blank"
            rel="noopener noreferrer"
            className="press flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#3ee07a] to-[#1fb85a] py-3.5 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.5),0_8px_20px_-8px_rgb(37_211_102/0.7)]"
          >
            <Share2 size={17} /> WhatsApp
          </a>
          <button onClick={() => toggleCompare(h.id)} className={cx("press flex items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-semibold", inCompare ? "btn-primary" : "glass-thin")}>
            <GitCompareArrows size={17} /> {inCompare ? "Im Vergleich" : "Vergleichen"}
          </button>
          <Link href={`/haus/${h.id}/bearbeiten`} className="press glass-thin flex items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-medium">
            <Pencil size={16} /> Bearbeiten
          </Link>
          {h.lat != null ? (
            <Link href={`/karte?haus=${h.id}`} className="press glass-thin flex items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-medium">
              <MapPin size={16} /> Auf Karte
            </Link>
          ) : (
            <span className="flex items-center justify-center rounded-full border border-dashed border-[rgb(12_29_39/0.15)] py-3.5 text-[13px] text-muted">Kein Ort</span>
          )}
        </div>

        {/* Kommentare als Nachrichtenverlauf */}
        <section id="kommentare" className="scroll-mt-6 pt-2">
          <SectionTitle>Kommentare{comments.length > 0 && ` · ${comments.length}`}</SectionTitle>
          <div className="space-y-2.5">
            {comments.length === 0 && <p className="px-1 text-[14.5px] text-muted">Noch keine Kommentare. Was denkst du?</p>}
            {comments.map((c) => {
              const mine = !!me && c.author.toLowerCase() === me.toLowerCase();
              return (
                <div key={c.id} className={cx("flex items-end gap-2", mine && "flex-row-reverse")}>
                  {!mine && <Avatar name={c.author} size={28} />}
                  <div className={cx("max-w-[80%] rounded-[22px] px-4 py-2.5", mine ? "btn-primary !block rounded-br-md !font-normal" : "glass-thin rounded-bl-md")}>
                    {!mine && <p className="text-[12.5px] font-semibold text-accent">{c.author}</p>}
                    <p className="whitespace-pre-line break-words text-[15px] leading-snug">{c.text}</p>
                    <p className={cx("mt-1 text-[11px]", mine ? "text-white/70" : "text-faint")}>{timeAgo(c.createdAt)}</p>
                  </div>
                  {mine && (
                    <button onClick={() => confirm("Kommentar löschen?") && deleteComment(h.id, c.id)} aria-label="Kommentar löschen" className="press mb-1 p-1 text-faint">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <form
            className="glass mt-3 flex items-end gap-2 rounded-[26px] p-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              const t = text.trim();
              if (!t || sending) return;
              withName(async () => {
                setSending(true);
                if (await addComment(h.id, t)) setText("");
                setSending(false);
              });
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={1}
              placeholder={me ? `Nachricht als ${me}` : "Kommentar schreiben"}
              className="min-h-11 flex-1 resize-none bg-transparent px-3.5 py-2.5 outline-none placeholder:text-faint"
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
            />
            <button disabled={!text.trim() || sending} aria-label="Senden" className="btn-primary press h-11 w-11 shrink-0">
              <Send size={18} />
            </button>
          </form>
        </section>

        <div className="flex flex-col items-center gap-1 pt-4">
          <button
            onClick={() =>
              withName(async () => {
                if (!confirm(`„${h.name}“ wirklich löschen? Stimmen und Kommentare gehen verloren.`)) return;
                if (await deleteHouse(h.id)) router.push("/");
              })
            }
            className="press flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium text-danger"
          >
            <Trash2 size={15} /> Haus löschen
          </button>
          <p className="text-[12px] text-faint">Hinzugefügt {timeAgo(h.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, highlight }: { icon: typeof Waves; label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="glass-thin rounded-[22px] p-4">
      <Icon size={20} className={highlight ? "text-accent" : "text-fg/55"} />
      <p className="mt-3 text-[12.5px] text-muted">{label}</p>
      <p className="font-display text-[28px] leading-none">{value}</p>
    </div>
  );
}
