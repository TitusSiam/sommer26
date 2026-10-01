export const SOURCES = ["Airbnb", "Booking", "FeWo-direkt", "Vrbo", "Holidu", "Sonstige"] as const;
export type Source = (typeof SOURCES)[number];

export const STATUSES = ["frei", "angefragt", "raus"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  frei: "Noch frei",
  angefragt: "Angefragt",
  raus: "Raus",
};

export const AMENITIES = ["wifi", "ac", "washer", "bbq"] as const;
export type Amenity = (typeof AMENITIES)[number];

export const AMENITY_LABEL: Record<Amenity, string> = {
  wifi: "WLAN",
  ac: "Klimaanlage",
  washer: "Waschmaschine",
  bbq: "Grill",
};

export type House = {
  id: string;
  name: string;
  url: string;
  source: Source;
  /** Erstes Bild ist das Titelbild */
  images: string[];
  sleeps: number | null;
  /** Gesamtpreis in Euro für den Zeitraum */
  totalPrice: number | null;
  /** Preis pro Nacht in Euro */
  pricePerDay: number | null;
  pool: boolean;
  /** Entfernung zum Meer in Metern */
  seaDistance: number | null;
  availableFrom: string | null; // YYYY-MM-DD
  availableTo: string | null; // YYYY-MM-DD
  amenities: Record<Amenity, boolean>;
  cons: string;
  status: Status;
  proposedBy: string;
  location: string;
  lat: number | null;
  lng: number | null;
  createdAt: number;
  updatedAt: number;
};

export type Comment = {
  id: string;
  houseId: string;
  author: string;
  text: string;
  createdAt: number;
};

export type ActivityType = "add" | "edit" | "status" | "vote" | "unvote" | "comment" | "delete" | "settings";

export type Activity = {
  id: string;
  type: ActivityType;
  author: string;
  houseId: string | null;
  houseName: string | null;
  detail: string;
  at: number;
};

export type Settings = {
  tripName: string;
  tripFrom: string | null;
  tripTo: string | null;
};

export type AppState = {
  houses: House[];
  /** houseId -> Liste der Namen, die dafür gestimmt haben */
  votes: Record<string, string[]>;
  /** houseId -> Kommentare, älteste zuerst */
  comments: Record<string, Comment[]>;
  activity: Activity[];
  settings: Settings;
  storage: "redis" | "file" | "memory";
  /** Gruppen-Code für Teilen-Links, nur wenn Zugangsschutz aktiv */
  shareCode: string | null;
};

export const DEFAULT_SETTINGS: Settings = {
  tripName: "Unser Ferienhaus",
  tripFrom: null,
  tripTo: null,
};

export function emptyHouse(): Omit<House, "id" | "createdAt" | "updatedAt"> {
  return {
    name: "",
    url: "",
    source: "Sonstige",
    images: [],
    sleeps: null,
    totalPrice: null,
    pricePerDay: null,
    pool: false,
    seaDistance: null,
    availableFrom: null,
    availableTo: null,
    amenities: { wifi: false, ac: false, washer: false, bbq: false },
    cons: "",
    status: "frei",
    proposedBy: "",
    location: "",
    lat: null,
    lng: null,
  };
}
