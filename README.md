# Whispering Grove: The Last Lantern

A MapleStory-inspired 2D side-scrolling action RPG with a Studio Ghibli forest feel, built in plain HTML / CSS / JavaScript (canvas) and served from a Next.js shell.

* **Play:** run the app and open `/` (redirects to `/game/index.html`), or open `public/game/index.html` directly (cloud features need the app).
* **Plan and status:** [docs/ROADMAP.md](docs/ROADMAP.md): story bible, difficulty tables, phases 1-4 (built) and phases 5-8 (planned).

## What is in the game
* **Six chapters** across 7 maps: Whispering Grove, Orrin's Hollow Tree (hub), Mistmarsh, Sunken Hollow, Ember Peaks, Cloud Orchard and the Heartwood.
* **25 quests**, 8 NPCs, branching dialogue, Sorrel's letters, 3 endings (plus a fuller ending for merciful, thorough players).
* **6 bosses**: Brambold, the Drowned Warden, Marrow, Magmaw, Stormwing Sovereign and Sorrel (4 phases).
* **The Wilds**: endless seeded expeditions (6 biomes x 5 tiers, random modifiers, Warden's Cache) plus a Daily Trial.
* **Difficulty**: Cozy / Adventurer / Heroic / Nightmare, optional Hollow Mode modifiers, New Game+.
* **Power**: gear with 5 rarities, shops and a forge, potions, 6 Boons with synergy, relics, a skill tree (8 skills), 3 classes with ultimates, Blessings.
* **Online**: cloud saves and leaderboards (Postgres + Drizzle).

## Controls
| Key | Action |
| --- | --- |
| Arrow keys | Move |
| Space (x2) | Jump / double jump |
| Down + Space | Drop through a platform |
| Ctrl / A | Basic attack |
| 1 to 8 | Slash, Fireball, Heal, Dash, Ultimate, Thorn Snare, Lumi's Spark, Gale Step |
| E (or Up) | Talk, enter gates, open caches |
| Z / X | Heart Tonic / Moon Dew |
| Q / I / K / C / M | Quests / Inventory / Skills / Codex / Map |
| Esc | Pause (cloud save, leaderboards) |

## Development
* `node scripts/process-assets.js` turns raw art in `art-source/` (magenta-keyed) into transparent PNGs in `public/game/Assets/`.
* `node scripts/smoke-test.js` boots the game headlessly and exercises maps, quests, bosses, shops, Wilds, endings, saves and New Game+.
* Backend: `src/app/api/save` and `src/app/api/scores`, tables in `src/db/schema.ts` (`npx drizzle-kit push`).
