"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-state";
import { Label, Spinner, inputClass } from "@/components/ui";
import { nightsBetween } from "@/lib/calc";

export default function TripSettingsPage() {
  const { state, saveSettings, withName, me } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!state || loaded) return;
    setName(state.settings.tripName);
    setFrom(state.settings.tripFrom ?? "");
    setTo(state.settings.tripTo ?? "");
    setLoaded(true);
  }, [state, loaded]);

  if (!state) return <Spinner />;
  const nights = nightsBetween(from || null, to || null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        withName(async () => {
          const ok = await saveSettings({ tripName: name, tripFrom: from || null, tripTo: to || null });
          if (ok) router.push("/");
        });
      }}
    >
      <h1 className="text-xl font-semibold">Reise</h1>
      <p className="text-sm text-muted">Gilt für alle. Der Zeitraum fließt in die Preisrechnung und den Zeitraum-Filter ein.</p>
      <label className="block">
        <Label>Name der Reise</Label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="z. B. Sardinien 2027" />
      </label>
      <div>
        <Label hint={nights ? `${nights} Nächte` : undefined}>Reisezeitraum</Label>
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} aria-label="Anreise" />
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputClass} aria-label="Abreise" />
        </div>
      </div>
      <button className="w-full rounded-xl bg-accent py-3.5 font-semibold text-accent-fg">Speichern{!me && " (Name wird abgefragt)"}</button>
    </form>
  );
}
