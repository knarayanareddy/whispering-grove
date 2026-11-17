# Whispering Grove: The Last Lantern
### Story bible, 4-phase production plan, and Phase 1 status

> Phase 1 is **built** (this repo). Phases 2-4 are fully planned below so every system built now has a place to grow.

---

## 1. The story

### Premise
Long ago the **Heartwood** sang. Its song, **the Whisper**, drifted through every leaf, stream and stone, and the world kept its colour. **Five Lanterns** carried the Whisper to the corners of the land, tended by the **Lantern Circle**.

One by one the Lanterns went dark. A creeping silence, **the Hollow**, is swallowing the Whisper and twisting every creature it touches. In the last grove that still hums, an apprentice named **Wren** wakes up, and is one of the few who can still hear the song.

### Cast
| Character | Role | Notes |
|---|---|---|
| **Wren** | Player, apprentice mage | Auburn hair, leaf clip, lantern staff. Name and gender-neutral voice, defined by dialogue choices. |
| **Lumi** | Companion | A tiny spark of light. Gives tips, reacts to events. *Secret: she is the last living fragment of the Whisper itself.* |
| **Elder Orrin** | Mentor (owl-wizard) | Last active Lantern keeper. Carries a cracked lantern on his hat. Hides his history with Sorrel. |
| **Brambold** | Chapter 1 boss | Once the gentlest Circle keeper, a Gloomcap Warden. Corrupted, but remembers. |
| **Sorrel, the Hollow King** | Antagonist | Orrin's first apprentice. Tried to preserve the Whisper by silencing grief, and created the Hollow. |
| **Mira Mossback** | Merchant (Phase 2) | Travelling mole-merchant. Comic relief and lore dealer. |
| **Captain Ashe** | Ally (Phase 3) | Ember Peaks smith who reforges Lantern gear. |
| **Zephyra** | Rival/ally (Phase 3) | Sky-orchard storm mage, mirrors Wren's choices. |

### The twist
The Hollow is **not evil**. It is the Heartwood's own grief, grown too large to sing. Sorrel did not set out to destroy the world. He wanted to stop the Heartwood from ever hurting again, and silence was the only way he knew. **Lumi is what the Heartwood sent out to find someone who could hear it.**

### Three endings (Phase 4)
1. **Rekindle**: Wren and Lumi relight the Heartwood. The Hollow fades and Lumi merges with the song. Hopeful, bittersweet.
2. **Release**: Wren lets the Heartwood sleep. The Hollow gently fades and the world is quiet but safe. Magic ebbs. Peaceful, melancholy.
3. **Rewrite**: Wren becomes the new Heartwood keeper, and the Lantern Circle is reborn. Costly, heroic.

Small choices through the game (dialogue flags such as `brave`/`humble`, mercy to bosses, side quests) alter the epilogue lines and unlock the best version of each ending.

---

## 2. Design pillars
1. **Movement and combat feel come first.** Nothing in the story layer may add input lag or break the snappy MapleStory rhythm.
2. **Story is delivered in play.** Short dialogue, companion barks, environmental storytelling. No long unskippable cutscenes.
3. **Difficulty is a dial, not a wall.** Four tiers retune the same content so everyone can finish the story.
4. **Power-ups are decisions.** Boons are short-lived and reward routing and risk; permanent power comes from gear and skills.
5. **Everything is data.** Quests, dialogue, difficulty tiers, boons and enemies are plain data tables so later phases add content without rewriting systems.

---

## 3. Difficulty tiers (implemented in Phase 1, `js/Difficulty.js`)
| Tier | Enemy HP | Enemy DMG | Speed | Elite chance | EXP / Gold | Boon drop | HP regen | Death penalty | Respawn HP | Boss HP / DMG |
|---|---|---|---|---|---|---|---|---|---|---|
| **Cozy** | 0.7x | 0.6x | 0.9x | 0% | 1.0x / 1.0x | 34% | 2.2x | none | 80% | 0.75x / 0.6x |
| **Adventurer** | 1x | 1x | 1x | 4% | 1.0x / 1.0x | 20% | 1x | lose 10% gold | 50% | 1x / 1x |
| **Heroic** | 1.55x | 1.35x | 1.12x | 14% | 1.3x / 1.25x | 14% | 0.5x | lose 20% gold | 40% | 1.7x / 1.3x |
| **Nightmare** | 2.3x | 2x | 1.25x | 32% | 1.8x / 1.6x | 8% | none | lose 40% gold | 25% | 2.9x / 1.8x |

**Elites** are larger, glowing, have 2.4x HP and 1.4x damage, give 2.5x EXP and always drop a Boon.
Phase 3 adds **Hollow Mode** modifiers on top (see below), and Phase 4 adds New Game+.

---

## 4. Power-ups

### Boons (Phase 1, temporary, dropped by monsters)
| Boon | Effect | Duration |
|---|---|---|
| **Sunpetal** | +40% damage | 18s |
| **Windleaf** | +30% move speed, +12% jump | 18s |
| **Moonberry** | Skills cost half MP, 4x MP regen | 18s |
| **Bloom Shield** | Absorbs 60 damage | 25s |
| **Lucky Clover** | Double EXP | 25s |
| **Heartseed** | Instantly heals 35% HP (more likely when you are hurt) | instant |

### Planned expansions
- **Phase 2: Lantern Charms** (equipable, permanent passives, rarity tiers) and a **Skill Tree** (upgrade points per level).
- **Phase 3: Relics** (run-defining modifiers found in dungeons, e.g. "Fireball splits in two, costs +50% MP") and **Boon synergies** (Sunpetal + Moonberry = *Eclipse*, brief crit surge).
- **Phase 4: Heartwood Blessings** (end-game meta-progression carried into New Game+).

---

## 5. The four phases

### PHASE 1: "The Waking Grove" (BUILT)
*Goal: turn the movement/combat prototype into a story-driven game with a full chapter, a boss, difficulty and power-ups.*

**Story & structure**
- Title screen with New Game / Continue and **4 difficulty tiers**
- Narrated prologue, then Chapter 1 opening with Lumi
- **Dialogue system**: typewriter text, portraits, narrator pages, branching choices stored as story flags
- **Quest chain (5 quests)**: A Voice in the Leaves, Blightbitten, Whisper Motes, The Lantern Rekindled, Warden of the Gloom
- Quest tracker HUD, **Quest Log + Journal** (lore unlocks as you progress)
- Chapter-complete card with run statistics
- **Autosave** (localStorage) every 20s and at every quest milestone

**World**
- Map extended to 3640px with the **Blight Gate** and a **boss arena**
- **Elder Orrin** NPC with quest markers, **Whisper Motes** hidden on the highest logs (rewarding double-jump exploration)
- Checkpoint after the gate (boss retries respawn right outside the arena)

**Systems**
- **Lumi** companion: follows Wren, speech bubbles, contextual tips (low HP, low MP, first enemy, elite, high jump)
- **Boon power-ups** with HUD buff chips and timers
- **Elite monsters** and full difficulty scaling for every enemy
- **Boss: Brambold, the Gloomcap Warden** with 3 phases and telegraphed attacks:
  - *Swing*: close-range arc (red telegraph)
  - *Slam*: ground shockwaves travelling both ways (jump them); phase 3 sends a second pair
  - *Spore Rain*: marked purple circles, then falling spores (4/6/8 depending on phase)
  - *Blight Spawn*: summons up to 2 leaf slimes from phase 2
  - Phase transitions with a roar, shake, and visible enrage
  - Boss HP bar with "recent damage" ghost trail

**Art (GPT image generation)**: hero, 3 monsters, boss, Elder Orrin, platform, sky, mountains and tree layers. Poses beyond idle are derived by `scripts/process-assets.js` (squash, tilt, flash).

**Phase 1 exit criteria**: a player can start a new game on any difficulty, finish Chapter 1 including the boss, see the chapter card, and continue from a save. All verified by an automated smoke test of the full flow.

---

### PHASE 2: "The Sunken Hollow" (Chapter 2-3: the world opens)
*Goal: multiple maps, progression systems, and the Mistmarsh / Sunken Hollow story arc.*

**World**
- **Data-driven multi-map engine**: maps defined as JSON (platforms, spawns, NPCs, portals); **portals** with fade transitions; world map screen
- New maps: **Mistmarsh** (fog, lily-pad platforms, moving logs), **Sunken Hollow** (cave, lantern-lit ruins, vertical climbing), **Orrin's Hollow Tree** (hub town)
- Hub with **Mira Mossback** (shop, repairs, lore)

**Progression**
- **Skill tree**: unlock slots 6-8 (Thorn Snare, Lumi's Spark, Gale Step), 3 upgrade ranks each, points per level
- **Equipment & inventory**: hat / robe / staff / charm slots, rarity tiers (common to legendary), random affixes, sell/buy
- **Lantern Charms** (see power-ups) and stat panel
- Level cap 30, EXP curve retune, **Elder quests** and side quests (herbalist, lost lanterns, fishing-frog contest)

**Enemies & bosses**
- 6 new monsters (bog toad, glow-eel, lantern beetle, moss golem, thorn sprite, hollow wisp), each with a unique behaviour (ranged, charge, burrow)
- **Mini-boss**: The Drowned Warden (water-level changing mechanic)
- **Chapter 2 boss**: Marrow, the Hollow Hound (fast, chases across platforms)

**Story beats**
- Orrin reveals the history of Sorrel; flashback dialogue sequences (painted still frames)
- Lumi's first hint of her origin
- Choice: *spare or purify* the Drowned Warden (changes a later ally)

**Art needs**: skill icons x8, UI panel frames, inventory icons, 6 monsters x 3 poses, 2 maps of backgrounds, Lumi sprite & portrait, Mira, foreground grass.

**Exit**: complete chapters 2-3, 2 bosses, shop and equipment loop working, saves migrated (save `v:2`).

---

### PHASE 3: "Ember Peaks & Cloud Orchard" (Chapters 4-5: mastery and choice)
*Goal: classes, replayable challenge content, and deeper narrative branching.*

**Classes** (chosen at level 20 via a story moment)
- **Lantern Knight** (melee, shield, guard-break)
- **Storm Mage** (chain lightning, area control)
- **Verdant Healer** (support, summons, Lumi bond)
- Each has 6 class skills plus a 2-ability **ultimate** replacing Nova

**World**
- **Ember Peaks**: lava platforms, falling embers, heat gauge. **Cloud Orchard**: wind currents, bouncing cloud platforms, moving islands
- **Day/night & weather** affecting spawns and visuals (fireflies at night, rain slows fire skills)

**Content**
- **Challenge dungeons**: wave arenas and timed trials with relic rewards
- **Relics** and **boon synergies**; **Hollow Mode** modifiers (optional per-run: *Glass Cannon*, *Swarm*, *No Heals*, *Mirrored Enemies*) for bonus rewards
- **Companion bonds**: Lumi levels up (new passive abilities); one additional companion chosen from story outcomes
- Achievements and a **bestiary**

**Bosses**: *Magmaw* (Ember Peaks forge-titan), *Stormwing Sovereign* (Cloud Orchard; aerial phases), plus a surprise Sorrel encounter (unbeatable, story fight)

**Story beats**: Lanterns 3 and 4 relit; Zephyra and Captain Ashe arcs; Sorrel's letters (collectible lore); Lumi's secret revealed at the end of Chapter 5; first branching ending flags locked in.

**Exit**: 3 classes playable start to finish, 2 new regions, 2 bosses, relic system and Hollow Mode stable.

---

### PHASE 4: "The Heartwood" (Chapter 6: finale and live features)
*Goal: finish the story, then make it endlessly replayable and social.*

**Finale**
- **The Heartwood** final region (a vertical climb through memories with the Whisper rising)
- **Sorrel, the Hollow King**: 4-phase boss. Phases reflect grief stages and *change by your earlier choices*
- **Three endings** (Rekindle, Release, Rewrite) with painted epilogue sequence and credits

**Replay**
- **New Game+**: carry over level cap, Blessings and unlocked gear; enemy scaling adds tiers; secret ending variant
- **Nightmare+**: stacking modifiers, leaderboard-worthy
- **Daily Trial**: seeded challenge dungeon

**Online (uses the existing Postgres + Next.js backend)**
- **Cloud saves** (account-less, device token) via `/api/save`
- **Leaderboards** for boss times and Daily Trial via `/api/scores` (Drizzle tables: `players`, `saves`, `scores`)
- **Ghost players** (async MMO feel): see anonymous silhouettes of recent runs in town, send emotes
- Optional **co-op** prototype for challenge dungeons (WebSocket room of 2)

**Polish**
- **Audio**: music per region, adaptive boss music, SFX (WebAudio)
- Settings: remappable keys, colour-blind-safe damage text, screen-shake slider, text size
- Performance pass (sprite batching, offscreen layers), gamepad support, mobile touch layout
- Full localisation structure (English first)

**Exit**: ending-to-credits playable on every difficulty, NG+ functional, cloud saves and leaderboards live.

---

## 6. Technical architecture (so far)

```
public/game/
  index.html          DOM HUD + overlays
  css/style.css
  js/
    AnimationManager  asset loader, tween helpers
    InputManager      keyboard + buffered presses
    Level / Platform  map layout, parallax, spawns, story layout (gate, NPCs, motes)
    Camera            soft dead-zone follow + shake
    Player            physics, state machine, buff-aware stats
    Enemy             patrol/chase/attack AI + difficulty & Elite scaling
    Boss              Brambold (3 phases, hazards)           [Phase 1]
    CombatManager     skills, hit detection, feedback
    PickupManager     EXP & gold drops
    Boons             temporary power-ups + HUD chips         [Phase 1]
    Difficulty        4 tiers                                  [Phase 1]
    Dialogue          typewriter dialogue + choices            [Phase 1]
    NPC               NPCs + Lumi companion                    [Phase 1]
    Story             quests, script, motes, gate, saves       [Phase 1]
    UI / Effects      HUD, tracker, boss bar, particles
    main              boot, title flow, game loop
  Assets/             processed transparent PNGs
art-source/           raw generated art (magenta keyed)
scripts/process-assets.js   chroma key + derived poses
```

**Planned refactors**
- Phase 2: `Level` becomes `MapLoader` (JSON maps); `Story` splits into `QuestManager` + `ScriptLibrary` per chapter
- Phase 3: `Player` class data from `ClassDefs`
- Phase 4: `Save` adapter gets a cloud backend

---

## 7. Known gaps after Phase 1 (to be closed in Phase 2)
- Only the hero's idle pose and the boss/monster idle poses are original art; walk/jump/fall/attack/hit poses are **derived** from the idle art (squash, tilt, flash).
- Skill icons, the UI panel frame and the foreground grass layer are not generated yet (the HUD uses text slots; foreground grass is skipped).
- Lumi is drawn procedurally (glow + wings) until her sprite is generated.
- No audio yet.
