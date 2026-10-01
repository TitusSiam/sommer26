"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ExternalLink, Heart, MapPin, Pencil, Send, Share2, Trash2, X } from "lucide-react";
import { useApp, useDerived } from "@/components/app-state";
import { AMENITY_ICON, Cover } from "@/components/house-card";
import { Card, Empty, Spinner, cx, inputClass } from "@/components/ui";
import { coversTrip, distance, euro, nightsFor, prices, range, timeAgo } from "@/lib/calc";
import { houseShareText, whatsappHref } from "@/lib/share";
import { AMENITIES, AMENITY_LABEL, STATUSES, STATUS_LABEL, type Status } from "@/lib/types";

const STATUS_ACTIVE: Record<Status, string> = {
  frei: "bg-ok text-white",
  angefragt: "bg-warn text-white",
  raus: "bg-out text-white",
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
      <Empty title="Haus nicht gefunden">
        <Link href="/" className="text-accent">
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

  return (
    <div className="-mt-4 space-y-4">
      <div className="relative -mx-4">
        <div
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {images.map((src, i) => (
            <Cover key={i} src={src} alt={`${h.name} Bild ${i + 1}`} className="aspect-[4/3] w-full shrink-0 snap-center sm:aspect-[16/9]" />
          ))}
        </div>
        <button onClick={() => router.back()} aria-label="Zurück" className="absolute left-3 top-3 rounded-full bg-black/50 p-1.5 text-white">
          <ChevronLeft size={20} />
        </button>
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white">
            {slide + 1} / {images.length}
          </span>
        )}
      </div>

      <div>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {isFav && <p className="text-xs font-semibold uppercase tracking-wide text-accent">Aktueller Favorit</p>}
            <h1 className="text-xl font-semibold leading-snug">{h.name}</h1>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
              {h.location && (
                <>
                  <MapPin size={14} /> {h.location} ·{" "}
                </>
              )}
              {h.source}
              {h.proposedBy && ` · von ${h.proposedBy}`}
            </p>
          </div>
          <button
            onClick={() => toggleVote(h.id)}
            aria-pressed={voted}
            className={cx(
              "flex shrink-0 flex-col items-center rounded-2xl border px-3 py-2 text-sm font-semibold",
              voted ? "border-heart bg-heart/10 text-heart" : "border-line bg-surface",
            )}
          >
            <Heart size={22} fill={voted ? "currentColor" : "none"} />
            {voters.length}
          </button>
        </div>
        {voters.length > 0 && <p className="mt-2 text-sm text-muted">Gefällt: {voters.join(", ")}</p>}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1" role="radiogroup" aria-label="Status">
        {STATUSES.map((st) => (
          <button
            key={st}
            role="radio"
            aria-checked={h.status === st}
            onClick={() => h.status !== st && withName(() => void updateHouse(h.id, { status: st }))}
            className={cx("rounded-lg py-2 text-sm font-medium", h.status === st ? STATUS_ACTIVE[st] : "text-muted")}
          >
            {STATUS_LABEL[st]}
          </button>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{euro(p.perPerson)}</p>
            <p className="text-sm text-muted">
              pro Person{p.persons ? ` (÷ ${p.persons} ${p.personsFromGroup ? "Mitreisende" : "Schlafplätze"})` : ""}
            </p>
          </div>
          {h.url && (
            <a
              href={h.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-fg"
            >
              Zum Angebot <ExternalLink size={15} />
            </a>
          )}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
          <Fact label="Gesamtpreis" value={`${euro(p.total)}${p.totalDerived ? " *" : ""}`} />
          <Fact label="Pro Nacht" value={`${euro(p.perDay)}${p.perDayDerived ? " *" : ""}`} />
          <Fact label="Schlafplätze" value={h.sleeps ?? "–"} />
          <Fact label="Zum Meer" value={distance(h.seaDistance)} />
          <Fact label="Pool" value={h.pool ? "Ja" : "Nein"} />
          <Fact label="Nächte" value={nights ?? "–"} />
          <div className="col-span-2">
            <dt className="text-muted">Verfügbar</dt>
            <dd className="font-medium">
              {range(h.availableFrom, h.availableTo)}
              {fits === true && <span className="ml-2 text-ok">passt zu unserem Zeitraum</span>}
              {fits === false && <span className="ml-2 text-danger">passt nicht zu unserem Zeitraum</span>}
            </dd>
          </div>
        </dl>
        {(p.totalDerived || p.perDayDerived) && <p className="mt-3 text-xs text-muted">* berechnet aus {nights} Nächten</p>}
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 text-sm font-semibold">Ausstattung</h2>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {AMENITIES.map((a) => {
            const Icon = AMENITY_ICON[a];
            const on = h.amenities[a];
            return (
              <li key={a} className={cx("flex items-center gap-2", !on && "text-muted line-through decoration-muted/50")}>
                <Icon size={16} /> {AMENITY_LABEL[a]}
                {on ? <Check size={14} className="text-ok" /> : <X size={14} />}
              </li>
            );
          })}
        </ul>
        {h.cons && (
          <div className="mt-4 rounded-xl bg-warn-soft p-3 text-sm">
            <p className="mb-0.5 font-semibold text-warn">Nachteile</p>
            <p className="whitespace-pre-line">{h.cons}</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={whatsappHref(houseShareText(h, s, voters.length, state.shareCode))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white"
        >
          <Share2 size={16} /> WhatsApp
        </a>
        <button
          onClick={() => toggleCompare(h.id)}
          className={cx("rounded-xl border py-3 text-sm font-medium", compare.includes(h.id) ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface")}
        >
          {compare.includes(h.id) ? "Im Vergleich ✓" : "Vergleichen"}
        </button>
        <Link href={`/haus/${h.id}/bearbeiten`} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-medium">
          <Pencil size={15} /> Bearbeiten
        </Link>
        {h.lat != null ? (
          <Link href={`/karte?haus=${h.id}`} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-medium">
            <MapPin size={15} /> Auf Karte
          </Link>
        ) : (
          <span className="flex items-center justify-center rounded-xl border border-dashed border-line py-3 text-xs text-muted">Kein Ort hinterlegt</span>
        )}
      </div>

      <section id="kommentare" className="scroll-mt-20">
        <h2 className="mb-2 text-base font-semibold">Kommentare {comments.length > 0 && <span className="text-muted">({comments.length})</span>}</h2>
        <Card className="divide-y divide-line">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 p-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                {c.author.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p>
                  <span className="font-semibold">{c.author}</span> <span className="text-xs text-muted">{timeAgo(c.createdAt)}</span>
                </p>
                <p className="whitespace-pre-line break-words">{c.text}</p>
              </div>
              {me && c.author.toLowerCase() === me.toLowerCase() && (
                <button
                  onClick={() => confirm("Kommentar löschen?") && deleteComment(h.id, c.id)}
                  aria-label="Kommentar löschen"
                  className="self-start p-1 text-muted"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
          <form
            className="flex items-end gap-2 p-3"
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
              placeholder={me ? `Kommentar als ${me}` : "Kommentar schreiben"}
              className={cx(inputClass, "min-h-11 resize-none py-2.5")}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
            />
            <button disabled={!text.trim() || sending} aria-label="Senden" className="rounded-xl bg-accent p-3 text-accent-fg disabled:opacity-40">
              <Send size={18} />
            </button>
          </form>
        </Card>
      </section>

      <button
        onClick={() =>
          withName(async () => {
            if (!confirm(`„${h.name}“ wirklich löschen? Stimmen und Kommentare gehen verloren.`)) return;
            if (await deleteHouse(h.id)) router.push("/");
          })
        }
        className="mx-auto flex items-center gap-1.5 py-2 text-sm text-danger"
      >
        <Trash2 size={15} /> Haus löschen
      </button>
      <p className="text-center text-xs text-muted">Hinzugefügt {timeAgo(h.createdAt)}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
