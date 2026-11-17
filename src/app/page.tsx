import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function HomePage() {
  // The playable game is a static HTML/CSS/JS project in /public/game (open index.html directly, too).
  redirect("/game/index.html");
}
