import { store } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const img = await store().getImage(id);
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(img.data, "base64"), {
    headers: { "Content-Type": img.type, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
