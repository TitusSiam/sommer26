import { NextResponse } from "next/server";
import { bad } from "@/lib/api";
import { store } from "@/lib/store";
import { newId } from "@/lib/sanitize";

const MAX_BYTES = 900 * 1024; // Client verkleinert vorher, das ist nur die Obergrenze
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) return bad("Keine Datei");
  if (!TYPES.includes(file.type)) return bad("Nur JPG, PNG oder WebP");
  if (file.size > MAX_BYTES) return bad("Bild zu groß");
  const id = newId();
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  await store().putImage(id, { type: file.type, data });
  return NextResponse.json({ url: `/api/images/${id}` });
}
