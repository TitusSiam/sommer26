import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { DEFAULT_SETTINGS, type Activity, type AppState, type Comment, type House, type Settings } from "./types";

const ACTIVITY_LIMIT = 150;
const ACTIVITY_SHOWN = 80;

type StoredImage = { type: string; data: string }; // data = base64

export interface Store {
  kind: AppState["storage"];
  getState(): Promise<Omit<AppState, "storage" | "shareCode">>;
  getHouse(id: string): Promise<House | null>;
  saveHouse(h: House): Promise<void>;
  deleteHouse(id: string): Promise<void>;
  setVote(houseId: string, name: string, on: boolean): Promise<void>;
  addComment(c: Comment): Promise<void>;
  deleteComment(houseId: string, commentId: string): Promise<Comment | null>;
  addActivity(a: Activity): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
  putImage(id: string, img: StoredImage): Promise<void>;
  getImage(id: string): Promise<StoredImage | null>;
}

// ---------- Redis (Upstash) ----------

const P = "fh:";

class RedisStore implements Store {
  kind = "redis" as const;
  constructor(private r: Redis) {}

  async getState() {
    const [rawHouses, rawActivity, rawSettings] = await Promise.all([
      this.r.hgetall<Record<string, string>>(`${P}houses`),
      this.r.lrange<string>(`${P}activity`, 0, ACTIVITY_SHOWN - 1),
      this.r.get<string>(`${P}settings`),
    ]);
    const houses = Object.values(rawHouses ?? {}).map((v) => JSON.parse(v) as House);
    const votes: AppState["votes"] = {};
    const comments: AppState["comments"] = {};
    if (houses.length) {
      const p = this.r.pipeline();
      for (const h of houses) {
        p.smembers(`${P}votes:${h.id}`);
        p.lrange(`${P}comments:${h.id}`, 0, -1);
      }
      const res = (await p.exec()) as unknown[];
      houses.forEach((h, i) => {
        votes[h.id] = (res[i * 2] as string[]) ?? [];
        comments[h.id] = ((res[i * 2 + 1] as string[]) ?? []).map((c) => JSON.parse(c) as Comment);
      });
    }
    return {
      houses,
      votes,
      comments,
      activity: (rawActivity ?? []).map((a) => JSON.parse(a) as Activity),
      settings: rawSettings ? { ...DEFAULT_SETTINGS, ...(JSON.parse(rawSettings) as Settings) } : DEFAULT_SETTINGS,
    };
  }

  async getHouse(id: string) {
    const v = await this.r.hget<string>(`${P}houses`, id);
    return v ? (JSON.parse(v) as House) : null;
  }

  async saveHouse(h: House) {
    await this.r.hset(`${P}houses`, { [h.id]: JSON.stringify(h) });
  }

  async deleteHouse(id: string) {
    const h = await this.getHouse(id);
    const imageIds = (h?.images ?? []).map(localImageId).filter((x): x is string => !!x);
    await this.r.hdel(`${P}houses`, id);
    await this.r.del(`${P}votes:${id}`, `${P}comments:${id}`, ...imageIds.map((i) => `${P}img:${i}`));
  }

  async setVote(houseId: string, name: string, on: boolean) {
    if (on) await this.r.sadd(`${P}votes:${houseId}`, name);
    else await this.r.srem(`${P}votes:${houseId}`, name);
  }

  async addComment(c: Comment) {
    await this.r.rpush(`${P}comments:${c.houseId}`, JSON.stringify(c));
  }

  async deleteComment(houseId: string, commentId: string) {
    const list = await this.r.lrange<string>(`${P}comments:${houseId}`, 0, -1);
    const raw = list.find((c) => (JSON.parse(c) as Comment).id === commentId);
    if (!raw) return null;
    await this.r.lrem(`${P}comments:${houseId}`, 1, raw);
    return JSON.parse(raw) as Comment;
  }

  async addActivity(a: Activity) {
    await this.r.lpush(`${P}activity`, JSON.stringify(a));
    await this.r.ltrim(`${P}activity`, 0, ACTIVITY_LIMIT - 1);
  }

  async saveSettings(s: Settings) {
    await this.r.set(`${P}settings`, JSON.stringify(s));
  }

  async putImage(id: string, img: StoredImage) {
    await this.r.set(`${P}img:${id}`, JSON.stringify(img));
  }

  async getImage(id: string) {
    const v = await this.r.get<string>(`${P}img:${id}`);
    return v ? (JSON.parse(v) as StoredImage) : null;
  }
}

// ---------- Datei (lokale Entwicklung) bzw. Arbeitsspeicher (Fallback) ----------

type Db = {
  houses: Record<string, House>;
  votes: Record<string, string[]>;
  comments: Record<string, Comment[]>;
  activity: Activity[];
  settings: Settings;
  images: Record<string, StoredImage>;
};

const emptyDb = (): Db => ({ houses: {}, votes: {}, comments: {}, activity: [], settings: DEFAULT_SETTINGS, images: {} });

class LocalStore implements Store {
  private db: Db | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private file = path.join(process.cwd(), ".data", "db.json");

  constructor(public kind: "file" | "memory") {}

  private async load(): Promise<Db> {
    if (this.db) return this.db;
    if (this.kind === "file") {
      try {
        this.db = { ...emptyDb(), ...(JSON.parse(await fs.readFile(this.file, "utf8")) as Db) };
      } catch {
        this.db = emptyDb();
      }
    } else {
      this.db = emptyDb();
    }
    return this.db;
  }

  /** Serialisiert Schreibzugriffe, damit parallele Requests sich nicht überschreiben. */
  private mutate<T>(fn: (db: Db) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.load();
      const out = fn(db);
      if (this.kind === "file") {
        await fs.mkdir(path.dirname(this.file), { recursive: true });
        await fs.writeFile(this.file, JSON.stringify(db));
      }
      return out;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async getState() {
    const db = await this.load();
    return {
      houses: Object.values(db.houses),
      votes: db.votes,
      comments: db.comments,
      activity: db.activity.slice(0, ACTIVITY_SHOWN),
      settings: { ...DEFAULT_SETTINGS, ...db.settings },
    };
  }

  async getHouse(id: string) {
    return (await this.load()).houses[id] ?? null;
  }

  saveHouse(h: House) {
    return this.mutate((db) => {
      db.houses[h.id] = h;
    });
  }

  deleteHouse(id: string) {
    return this.mutate((db) => {
      for (const img of db.houses[id]?.images ?? []) {
        const local = localImageId(img);
        if (local) delete db.images[local];
      }
      delete db.houses[id];
      delete db.votes[id];
      delete db.comments[id];
    });
  }

  setVote(houseId: string, name: string, on: boolean) {
    return this.mutate((db) => {
      const set = new Set(db.votes[houseId] ?? []);
      if (on) set.add(name);
      else set.delete(name);
      db.votes[houseId] = [...set];
    });
  }

  addComment(c: Comment) {
    return this.mutate((db) => {
      (db.comments[c.houseId] ??= []).push(c);
    });
  }

  deleteComment(houseId: string, commentId: string) {
    return this.mutate((db) => {
      const list = db.comments[houseId] ?? [];
      const i = list.findIndex((c) => c.id === commentId);
      if (i < 0) return null;
      return list.splice(i, 1)[0];
    });
  }

  addActivity(a: Activity) {
    return this.mutate((db) => {
      db.activity.unshift(a);
      db.activity.length = Math.min(db.activity.length, ACTIVITY_LIMIT);
    });
  }

  saveSettings(s: Settings) {
    return this.mutate((db) => {
      db.settings = s;
    });
  }

  putImage(id: string, img: StoredImage) {
    return this.mutate((db) => {
      db.images[id] = img;
    });
  }

  async getImage(id: string) {
    return (await this.load()).images[id] ?? null;
  }
}

/** Bilder, die in dieser App hochgeladen wurden, liegen unter /api/images/<id>. */
export function localImageId(url: string): string | null {
  const m = url.match(/^\/api\/images\/([a-zA-Z0-9_-]+)$/);
  return m ? m[1] : null;
}

const g = globalThis as unknown as { __fhStore?: Store };

export function store(): Store {
  if (g.__fhStore) return g.__fhStore;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    g.__fhStore = new RedisStore(new Redis({ url, token, automaticDeserialization: false }));
  } else {
    // Auf Vercel ist das Dateisystem schreibgeschützt: ohne Redis nur flüchtiger Speicher.
    g.__fhStore = new LocalStore(process.env.VERCEL ? "memory" : "file");
  }
  return g.__fhStore;
}
