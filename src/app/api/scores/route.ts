import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { scores } from "@/db/schema";

export const dynamic = "force-dynamic";

const BOARD = /^[a-z0-9_]{1,24}$/;

export async function GET(req: Request) {
  const board = new URL(req.url).searchParams.get("board") ?? "";
  if (!BOARD.test(board)) return Response.json({ error: "bad board" }, { status: 400 });
  try {
    // best (lowest) time per player, top 10
    const rows = await db.select().from(scores).where(eq(scores.board, board)).orderBy(asc(scores.value)).limit(60);
    const seen = new Set<string>();
    const best = rows.filter((r) => (seen.has(r.token) ? false : (seen.add(r.token), true))).slice(0, 10)
      .map((r) => ({ name: r.name, value: r.value, diff: r.diff }));
    return Response.json({ rows: best });
  } catch {
    return Response.json({ rows: [] }, { status: 503 });
  }
}

export async function POST(req: Request) {
  let b: { token?: unknown; name?: unknown; board?: unknown; value?: unknown; diff?: unknown };
  try { b = await req.json(); } catch { return Response.json({ error: "bad json" }, { status: 400 }); }
  if (typeof b.token !== "string" || typeof b.board !== "string" || !BOARD.test(b.board) || typeof b.value !== "number" || !Number.isFinite(b.value) || b.value < 1 || b.value > 360000)
    return Response.json({ error: "bad request" }, { status: 400 });
  const name = typeof b.name === "string" ? b.name.slice(0, 24) : "Wren";
  const diff = typeof b.diff === "string" ? b.diff.slice(0, 16) : "";
  try {
    await db.insert(scores).values({ token: b.token.slice(0, 64), name, board: b.board, value: Math.round(b.value), diff });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "db unavailable" }, { status: 503 });
  }
}
