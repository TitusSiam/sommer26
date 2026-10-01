"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { euro, prices } from "@/lib/calc";
import type { House, Settings } from "@/lib/types";

function pin(label: string, cls: string) {
  return L.divIcon({
    className: "",
    html: `<span class="price-pin ${cls}">${label}</span>`,
    iconSize: [0, 0],
  });
}

function Fit({ houses, focus }: { houses: House[]; focus: string | null }) {
  const map = useMap();
  useEffect(() => {
    const f = houses.find((h) => h.id === focus);
    if (f) {
      map.setView([f.lat!, f.lng!], 13);
      return;
    }
    if (!houses.length) return;
    const b = L.latLngBounds(houses.map((h) => [h.lat!, h.lng!] as [number, number]));
    map.fitBounds(b, { padding: [48, 48], maxZoom: 13 });
    // nur beim ersten Laden bzw. bei geänderter Auswahl einpassen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houses.length, focus]);
  return null;
}

export default function HouseMap({
  houses,
  settings,
  favoriteIds,
  selected,
  onSelect,
  focus,
}: {
  houses: House[];
  settings: Settings;
  favoriteIds: Set<string>;
  selected: string | null;
  onSelect: (id: string) => void;
  focus: string | null;
}) {
  const located = useMemo(() => houses.filter((h) => h.lat != null && h.lng != null), [houses]);
  return (
    <MapContainer center={[45, 10]} zoom={4} className="h-full w-full" zoomControl={false} attributionControl>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Fit houses={located} focus={focus} />
      {located.map((h) => {
        const p = prices(h, settings);
        const label = p.perPerson != null ? `${euro(p.perPerson)} p. P.` : h.name.slice(0, 14);
        const cls = [favoriteIds.has(h.id) || selected === h.id ? "is-fav" : "", `is-${h.status}`].join(" ");
        return (
          <Marker
            key={h.id}
            position={[h.lat!, h.lng!]}
            icon={pin(label, cls)}
            zIndexOffset={selected === h.id ? 1000 : favoriteIds.has(h.id) ? 500 : 0}
            eventHandlers={{ click: () => onSelect(h.id) }}
          />
        );
      })}
    </MapContainer>
  );
}
