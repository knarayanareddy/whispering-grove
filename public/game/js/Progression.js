/* Progression: skill tree, classes, relics, Hollow Mode modifiers, Blessings (NG+), bestiary, achievements and cross-run meta. */
(function (G) {
  const META_KEY = 'whisperingGrove.meta.v1';
  G.Mods = { glass: false, swarm: false, noheal: false, mirror: false, ng: 0, reward: 1 };

  const CLASSES = {
    knight: { name: 'Lantern Knight', blurb: 'Melee guardian. +25% max HP, +8% damage. Ultimate: Sunbreaker, a huge forward cleave that grants a Bloom Shield.', bonus: { hpPct: 0.25, dmgPct: 0.08 }, ult: 'sunbreaker' },
    storm: { name: 'Storm Mage', blurb: 'Area control. +15% damage, +20% max MP. Ultimate: Tempest, chain lightning that strikes up to 8 foes, three times.', bonus: { dmgPct: 0.15, mpPct: 0.2 }, ult: 'tempest' },
    healer: { name: 'Verdant Healer', blurb: 'Support. +10% max HP, +30% MP regen, Heal is 25% stronger. Ultimate: Bloomsong, a healing wave that also blasts nearby foes.', bonus: { hpPct: 0.1 }, ult: 'bloomsong' }
  };
  const ULTS = {
    sunbreaker: { name: 'Sunbreaker', mp: 45, cd: 18, dur: 0.8, hitAt: 0.35, mult: 7, range: 330, height: 200, knock: 520, shake: 18, stop: 0.14 },
    tempest: { name: 'Tempest', mp: 50, cd: 20, dur: 0.8, hitAt: 0.3, mult: 2.6, radius: 520, knock: 220, shake: 14, stop: 0.1 },
    bloomsong: { name: 'Bloomsong', mp: 45, cd: 18, dur: 0.8, hitAt: 0.3, mult: 4.5, radius: 380, knock: 300, shake: 10, stop: 0.08 }
  };
  const NEW_SKILLS = {
    thorn: { name: "Thorn Snare", mp: 16, cd: 7, dur: 0.45, hitAt: 0.16, mult: 1.4, radius: 270, knock: 60, shake: 5, stop: 0.05, cost: 2 },
    spark: { name: "Lumi's Spark", mp: 12, cd: 4, dur: 0.35, hitAt: 0.1, mult: 1.2, speed: 560, knock: 160, shake: 0, stop: 0.03, cost: 2 },
    gale: { name: 'Gale Step', mp: 18, cd: 9, dur: 0.4, hitAt: 0.05, mult: 1.8, radius: 190, knock: 380, shake: 6, stop: 0.05, cost: 3 }
  };
  const RELICS = {
    splitspark: { name: 'Splitting Spark', desc: 'Fireball splits in two, but costs 50% more MP.' },
    glasslantern: { name: 'Glass Lantern', desc: '+35% damage, -25% max HP.' },
    echostep: { name: 'Echo Step', desc: 'Double jumping releases a damaging ring.' },
    mossleech: { name: 'Mossleech Seed', desc: 'Heal for 3% of damage dealt.' },
    thornmantle: { name: 'Thorn Mantle', desc: 'When hurt, a thorn burst strikes nearby foes.' },
    windwalker: { name: 'Windwalker Sash', desc: '+15% move speed. Dash costs no MP.' },
    sagecrown: { name: "Sage's Crown", desc: 'Skills cost 25% less MP.' },
    phoenix: { name: 'Phoenix Ember', desc: 'Once per life, a fatal blow revives you at 40% HP.' }
  };
  const BLESSINGS = {
    might: { name: 'Blessing of Might', desc: '+10% damage.', bonus: { dmgPct: 0.1 } },
    vigor: { name: 'Blessing of Vigor', desc: '+15% max HP.', bonus: { hpPct: 0.15 } },
    insight: { name: 'Blessing of Insight', desc: '+10% EXP.', bonus: { exp: 0.1 } },
    fortune: { name: 'Blessing of Fortune', desc: '+15% gold.', bonus: { gold: 0.15 } },
    keen: { name: 'Blessing of Keen Eyes', desc: '+6% crit chance.', bonus: { crit: 0.06 } },
    swift: { name: 'Blessing of Swiftness', desc: '+6% move speed.', bonus: { spd: 0.06 } },
    deep: { name: 'Blessing of Deep Wells', desc: '+20% max MP.', bonus: { mpPct: 0.2 } },
    bearer: { name: 'Lanternbearer', desc: 'Carry one extra relic.', bonus: {}, relicSlot: 1 }
  };
  const LORE = {
    slime: 'Leaf Slimes sprout wherever the Whisper is thin. They are mostly harmless, mostly.', mushroom: 'Grumpy Shrooms guard their patch of moss with great seriousness.', spirit: 'Wisp Spirits are scraps of the Whisper that lost their way.',
    bogtoad: 'Bog Toads spit marsh-water. They croak the Heartwood song, but flat.', gloweel: 'Glow Eels light the Mistmarsh like drifting lanterns.', lanternbeetle: 'Lantern Beetles charge at anything that glows brighter than them.',
    mossgolem: 'Moss Golems are old Circle statues, woken by the Hollow.', thornsprite: 'Thorn Sprites fling barbs when frightened, which is always.', hollowwisp: 'Hollow Wisps are Wisp Spirits after the silence finds them.',
    emberimp: 'Ember Imps are Ashe\'s forge-sparks that never cooled down.', cinderspirit: 'Cinder Spirits drift above the lava, humming a broken tune.', lavagolem: 'Lava Golems keep the forge-titan\'s halls. Do not step in the glow.',
    cloudpuff: 'Cloud Puffs bounce on the breeze and expect you to do the same.', stormsprite: 'Storm Sprites crackle with static and old grudges.', galeshroom: 'Gale Shrooms ride the orchard winds like leaves.',
    shade: 'Memory Shades replay the Heartwood\'s saddest afternoon, forever.', echo: 'Grief Echoes repeat the last thing they heard: usually a goodbye.', griefcap: 'Griefcaps grow where something was lost and never mourned.'
  };
  const ACH = [
    { id: 'first', name: 'First Light', desc: 'Defeat a monster.', test: (s) => s.kills >= 1 },
    { id: 'hunt100', name: 'Grove Keeper', desc: 'Defeat 100 monsters.', test: (s) => s.kills >= 100 },
    { id: 'hunt500', name: 'Hollow Bane', desc: 'Defeat 500 monsters.', test: (s) => s.kills >= 500 },
    { id: 'lv10', name: 'Apprentice No More', desc: 'Reach level 10.', test: (s) => s.lvl >= 10 },
    { id: 'lv20', name: 'Lanternbearer', desc: 'Reach level 20.', test: (s) => s.lvl >= 20 },
    { id: 'lv30', name: 'Whisper Master', desc: 'Reach the level cap.', test: (s) => s.lvl >= s.cap },
    { id: 'class', name: 'Chosen Path', desc: 'Choose a class.', test: (s) => !!s.cls },
    { id: 'rich', name: 'Mira\'s Favourite', desc: 'Hold 2000 gold at once.', test: (s) => s.gold >= 2000 },
    { id: 'legend', name: 'Legend in the Pack', desc: 'Own a Legendary item.', test: (s) => s.legend },
    { id: 'bosses3', name: 'Warden Breaker', desc: 'Defeat 3 bosses.', test: (s) => s.bosses >= 3 },
    { id: 'letters', name: 'Sorrel\'s Correspondent', desc: 'Find all 5 of Sorrel\'s letters.', test: (s) => s.letters >= 5 },
    { id: 'wilds3', name: 'Wild at Heart', desc: 'Complete 3 Wilds expeditions.', test: (s) => s.wilds >= 3 },
    { id: 'bestiary', name: 'Naturalist', desc: 'Defeat 10 different kinds of monster.', test: (s) => s.kinds >= 10 },
    { id: 'ending', name: 'The Song Goes On', desc: 'Reach any ending.', test: (s) => s.endings >= 1 }
  ];

  const Meta = {
    d: { endings: {}, blessings: [], pending: 0, ngCount: 0, carry: null, best: {} },
    load: function () { try { const x = JSON.parse(localStorage.getItem(META_KEY)); if (x) this.d = Object.assign(this.d, x); } catch (e) { /* ignore */ } },
    save: function () { try { localStorage.setItem(META_KEY, JSON.stringify(this.d)); } catch (e) { /* ignore */ } }
  };
  Meta.load();

  const Prog = {
    pts: 0, rank: { slash: 1, fireball: 1, heal: 1, dash: 1, ult: 1 }, unlocked: {}, cls: null, relics: [], relicOn: [], bestiary: {}, ach: {}, letters: [], bosses: 0, wilds: 0, phoenixUsed: false, classOffered: false,
    reset: function () { this.pts = 0; this.rank = { slash: 1, fireball: 1, heal: 1, dash: 1, ult: 1 }; this.unlocked = {}; this.cls = null; this.relics = []; this.relicOn = []; this.bestiary = {}; this.ach = {}; this.letters = []; this.bosses = 0; this.wilds = 0; this.phoenixUsed = false; this.classOffered = false; },
    cap: function () { return 30 + 5 * (G.Mods.ng || 0); },
    mult: function (id) { return 1 + 0.15 * ((this.rank[id] || 1) - 1); },
    isUnlocked: function (id) { return !NEW_SKILLS[id] || !!this.unlocked[id]; },
    skillDef: function (id) {
      if (id === 'ult' && this.cls) return ULTS[CLASSES[this.cls].ult];
      return NEW_SKILLS[id] || (G.SKILLS ? G.SKILLS[id] : null);
    },
    upgrade: function (id) { if (this.pts < 1 || (this.rank[id] || 1) >= 4 || NEW_SKILLS[id] && !this.unlocked[id]) return false; this.pts--; this.rank[id] = (this.rank[id] || 1) + 1; return true; },
    unlock: function (id) { const d = NEW_SKILLS[id]; if (!d || this.unlocked[id] || this.pts < d.cost) return false; this.pts -= d.cost; this.unlocked[id] = true; this.rank[id] = 1; return true; },
    hasRelic: function (id) { return this.relicOn.indexOf(id) >= 0; },
    relicSlots: function () { return 3 + (this.blessingSlots || 0); },
    toggleRelic: function (id) {
      const i = this.relicOn.indexOf(id); if (i >= 0) this.relicOn.splice(i, 1); else if (this.relics.indexOf(id) >= 0 && this.relicOn.length < this.relicSlots()) this.relicOn.push(id);
    },
    giveRelic: function (id) { if (!id) { const left = Object.keys(RELICS).filter((r) => this.relics.indexOf(r) < 0); if (!left.length) return null; id = left[Math.floor(Math.random() * left.length)]; } if (this.relics.indexOf(id) < 0) { this.relics.push(id); if (this.relicOn.length < this.relicSlots()) this.relicOn.push(id); } return id; },
    phoenix: function (p) { if (this.hasRelic('phoenix') && !this.phoenixUsed) { this.phoenixUsed = true; p.hp = Math.round(p.maxHp * 0.4); p.invuln = 2.5; return true; } return false; },
    kill: function (type) { this.bestiary[type] = (this.bestiary[type] || 0) + 1; },
    recalc: function (p) {
      const S = G.Inv.stats(), b = { atk: S.atk || 0, hp: S.hp || 0, mp: S.mp || 0, crit: S.crit || 0, spd: S.spd || 0, exp: S.exp || 0, gold: S.gold || 0, steal: S.steal || 0, dmgPct: 0, hpPct: 0, mpPct: 0 };
      const add = (o) => { for (const k in o) b[k] = (b[k] || 0) + o[k]; };
      if (this.cls) add(CLASSES[this.cls].bonus);
      this.blessingSlots = 0;
      (Meta.d.blessings || []).forEach((id) => { const d = BLESSINGS[id]; if (d) { add(d.bonus); if (d.relicSlot) this.blessingSlots += d.relicSlot; } });
      if (this.hasRelic('glasslantern')) { b.dmgPct += 0.35; b.hpPct -= 0.25; }
      if (this.hasRelic('windwalker')) b.spd += 0.15;
      b.mpRegen = (this.cls === 'healer' ? 0.3 : 0); b.skillMpMul = this.hasRelic('sagecrown') ? 0.75 : 1;
      if (G.Mods.glass) b.dmgPct += 0.5;
      p.bonus = b;
      const mh = Math.max(20, Math.round(((p.baseHp || p.maxHp) + b.hp) * (1 + b.hpPct))), mm = Math.max(10, Math.round(((p.baseMp || p.maxMp) + b.mp) * (1 + b.mpPct)));
      p.maxHp = mh; p.maxMp = mm; p.hp = Math.min(p.hp, mh); p.mp = Math.min(p.mp, mm);
    },
    stateForAch: function (g) {
      const p = g.player, inv = G.Inv, all = inv.gear.concat(Object.keys(inv.eq).map((k) => inv.eq[k]).filter(Boolean));
      return { kills: p.kills, lvl: p.lvl, cap: this.cap(), cls: this.cls, gold: p.gold, legend: all.some((i) => i.rar === 4), bosses: this.bosses, letters: this.letters.length, wilds: this.wilds, kinds: Object.keys(this.bestiary).length, endings: Object.keys(Meta.d.endings).length };
    },
    checkAch: function (g) {
      const s = this.stateForAch(g);
      ACH.forEach((a) => { if (!this.ach[a.id] && a.test(s)) { this.ach[a.id] = true; g.ui.chat('Achievement unlocked: ' + a.name, 'good'); g.ui.banner('Achievement: ' + a.name, 'sub'); } });
    },
    serialize: function () { return { pts: this.pts, rank: this.rank, unlocked: this.unlocked, cls: this.cls, relics: this.relics, relicOn: this.relicOn, bestiary: this.bestiary, ach: this.ach, letters: this.letters, bosses: this.bosses, wilds: this.wilds, phoenixUsed: this.phoenixUsed, classOffered: this.classOffered }; },
    restore: function (d) { this.reset(); if (d) Object.assign(this, d); }
  };
  G.Prog = Prog; G.Meta = Meta; G.CLASSES = CLASSES; G.ULTS = ULTS; G.NEW_SKILLS = NEW_SKILLS; G.RELICS = RELICS; G.BLESSINGS = BLESSINGS; G.LORE = LORE; G.ACH = ACH;
})(window.Game = window.Game || {});
