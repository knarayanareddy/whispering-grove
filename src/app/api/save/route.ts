import { eq } from "drizzle-orm";
import { db } from "@/db";
import { saves } from "@/db/schema";

export const dynamic = "force-dynamic";

const validToken = (t: unknown): t is string => typeof t === "string" && t.length >= 4 && t.length <= 64;

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!validToken(token)) return Response.json({ error: "bad token" }, { status: 400 });
  try {
    const rows = await db.select().from(saves).where(eq(saves.token, token)).limit(1);
    return Response.json({ data: rows[0]?.data ?? null, updatedAt: rows[0]?.updatedAt ?? null });
  } catch {
    return Response.json({ error: "db unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  let body: { token?: unknown; data?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: "bad json" }, { status: 400 }); }
  if (!validToken(body.token) || body.data === undefined || body.data === null) return Response.json({ error: "bad request" }, { status: 400 });
  if (JSON.stringify(body.data).length > 400_000) return Response.json({ error: "too large" }, { status: 413 });
  try {
    await db.insert(saves).values({ token: body.token, data: body.data as object })
      .onConflictDoUpdate({ target: saves.token, set: { data: body.data as object, updatedAt: new Date() } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "db unavailable" }, { status: 503 });
  }
}
