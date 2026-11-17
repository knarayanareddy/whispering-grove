# Whispering Grove: The Last Lantern

A MapleStory-inspired 2D side-scrolling action game with a Studio Ghibli forest feel, built in plain HTML / CSS / JavaScript (canvas) and served from a Next.js shell.

- **Play:** run the app and open `/` (redirects to `/game/index.html`), or open `public/game/index.html` directly.
- **Full plan:** see [`docs/ROADMAP.md`](docs/ROADMAP.md): story bible, difficulty tables, power-ups and all 4 phases.

## Phase 1: The Waking Grove (built)
- Title screen, **4 difficulty tiers** (Cozy / Adventurer / Heroic / Nightmare), Continue + autosave
- Narrated prologue, **dialogue with choices**, **5-quest chain**, quest tracker, journal
- **Elder Orrin**, **Lumi** the companion, hidden **Whisper Motes**, the **Blight Gate**
- **6 Boons** (timed power-ups), **Elite monsters**
- **Boss: Brambold, the Gloomcap Warden** (3 phases, telegraphed attacks, summons)
- Chapter-complete card

## Controls
| Key | Action |
|---|---|
| Arrow keys | Move |
| Space (x2) | Jump / double jump |
| Down + Space | Drop through a platform |
| Ctrl / A | Basic attack |
| 1 to 5 | Slash, Fireball, Heal, Dash, Nova |
| E (or Up) | Talk / advance dialogue |
| Q | Quest log |
| Esc | Pause |

## Art pipeline
Raw generated art lives in `art-source/` (flat magenta backgrounds). Run `node scripts/process-assets.js` (needs `sharp`) to chroma-key it into transparent PNGs in `public/game/Assets/` and derive extra poses.
