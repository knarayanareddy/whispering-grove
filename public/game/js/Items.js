/* Items: Lantern Charms, equipment with rarity tiers and random affixes, potions, shop stock and the player's inventory. */
(function (G) {
  const RAR = [
    { id: 'common', name: 'Common', color: '#d8d8d8', mult: 1 },
    { id: 'uncommon', name: 'Uncommon', color: '#7ee08a', mult: 1.25 },
    { id: 'rare', name: 'Rare', color: '#6ab8ff', mult: 1.6 },
    { id: 'epic', name: 'Epic', color: '#c58cff', mult: 2.1 },
    { id: 'legendary', name: 'Legendary', color: '#ffb347', mult: 2.8 }
  ];
  const BASE = {
    staff: ['Oak Staff', 'Lantern Rod', 'Willow Staff', 'Crescent Staff', 'Sunroot Staff'],
    robe: ['Leaf Robe', 'Moss Cloak', 'Dusk Robe', 'Starweave Robe', 'Grovewarden Mantle'],
    hat: ['Leaf Cap', 'Pointed Hat', 'Sprout Circlet', 'Wanderer Hood', 'Moonpetal Crown'],
    charm: ['Lantern Charm', 'Clover Charm', 'Acorn Charm', 'Moth Charm', 'Bell Charm']
  };
  const MAIN = { staff: 'atk', robe: 'hp', hat: 'mp' };
  const STAT = { atk: 'ATK', hp: 'Max HP', mp: 'Max MP', crit: 'Crit', spd: 'Speed', exp: 'EXP', gold: 'Gold', steal: 'Leech' };
  const PCT = { crit: 1, spd: 1, exp: 1, gold: 1, steal: 1 };
  const AFFIX = { atk: 'of Embers', hp: 'of the Oak', mp: 'of Lumi', crit: 'of Sparks', spd: 'of the Gale', exp: "Scholar's", gold: 'Gilded', steal: 'Mossbound' };
  const UTIL = ['atk', 'hp', 'mp', 'crit', 'spd', 'exp', 'gold', 'steal'];
  let uidc = 1;

  function val(stat, pw, m) {
    switch (stat) {
      case 'atk': return Math.round(2 + pw * 2.6 * m);
      case 'hp': return Math.round(14 + pw * 13 * m);
      case 'mp': return Math.round(5 + pw * 4.5 * m);
      case 'crit': return +((0.015 + 0.006 * pw) * m).toFixed(3);
      case 'spd': return +(0.02 * m).toFixed(3);
      case 'exp': return +(0.03 * m).toFixed(3);
      case 'gold': return +(0.04 * m).toFixed(3);
      default: return +(0.006 * m).toFixed(3);
    }
  }
  function rollRarity(rng, pw, min) {
    const r = rng(), l = 0.004 + 0.003 * pw, e = l + 0.03 + 0.012 * pw, ra = e + 0.12 + 0.025 * pw, u = ra + 0.28;
    let i = r < l ? 4 : r < e ? 3 : r < ra ? 2 : r < u ? 1 : 0;
    return Math.max(i, min || 0);
  }
  function roll(slot, pw, rar, rng) {
    rng = rng || Math.random; if (rar === undefined || rar === null) rar = rollRarity(rng, pw);
    const m = RAR[rar].mult, stats = {}, pick = (a) => a[Math.floor(rng() * a.length)];
    let first;
    if (MAIN[slot]) { first = MAIN[slot]; stats[first] = val(first, pw, m); }
    else { first = pick(UTIL); stats[first] = val(first, pw, m); }
    const extra = slot === 'charm' ? [1, 1, 2, 2, 3][rar] : [0, 1, 1, 2, 3][rar];
    let lastAff = first;
    for (let i = 0; i < extra; i++) { const s = pick(UTIL.filter((k) => stats[k] === undefined)); stats[s] = val(s, pw, m * 0.8); lastAff = s; }
    const base = BASE[slot][Math.min(BASE[slot].length - 1, Math.floor(pw / 1.2 + rng() * 1.5))];
    const name = (rar >= 1 && (slot === 'charm' || extra > 0) ? '' : '') + base + (rar >= 1 ? ' ' + AFFIX[lastAff] : '');
    return { uid: 'i' + Date.now().toString(36) + (uidc++), slot: slot, name: name.replace("Scholar's", "Scholar's"), rar: rar, stats: stats, plus: 0, price: Math.round((25 + pw * 20) * m * m) };
  }
  function itemStats(it) {
    const out = {}; for (const k in it.stats) out[k] = it.stats[k];
    if (it.plus && out.atk) out.atk = Math.round(out.atk * (1 + 0.1 * it.plus));
    return out;
  }
  function describe(it) {
    const st = itemStats(it);
    return Object.keys(st).map((k) => '+' + (PCT[k] ? (st[k] * 100).toFixed(1) + '%' : st[k]) + ' ' + STAT[k]).join(', ');
  }

  const Inv = {
    gear: [], eq: { staff: null, robe: null, hat: null, charmA: null, charmB: null }, potions: { hp: 2, mp: 1 }, cap: 36, stored: 0,
    reset: function () { this.gear = []; this.eq = { staff: null, robe: null, hat: null, charmA: null, charmB: null }; this.potions = { hp: 2, mp: 1 }; },
    add: function (it) { if (this.gear.length >= this.cap) return false; this.gear.push(it); return true; },
    find: function (uid) { return this.gear.find((g) => g.uid === uid) || null; },
    equip: function (uid) {
      const it = this.find(uid); if (!it) return;
      let slot = it.slot;
      if (slot === 'charm') slot = !this.eq.charmA ? 'charmA' : !this.eq.charmB ? 'charmB' : 'charmA';
      if (this.eq[slot]) this.gear.push(this.eq[slot]);
      this.gear = this.gear.filter((g) => g.uid !== uid); this.eq[slot] = it;
    },
    unequip: function (slot) { const it = this.eq[slot]; if (!it || this.gear.length >= this.cap) return; this.gear.push(it); this.eq[slot] = null; },
    sell: function (uid) { const it = this.find(uid); if (!it) return 0; this.gear = this.gear.filter((g) => g.uid !== uid); return Math.max(1, Math.round(it.price * 0.4)); },
    stats: function () {
      const t = {}; for (const k in this.eq) { const it = this.eq[k]; if (!it) continue; const s = itemStats(it); for (const st in s) t[st] = (t[st] || 0) + s[st]; } return t;
    },
    usePotion: function (kind, p, fx, ui) {
      if (p.dead || (this.potions[kind] || 0) <= 0) { if (ui) ui.chat('No ' + (kind === 'hp' ? 'Heart Tonic' : 'Moon Dew') + ' left.', 'warn'); return false; }
      if (kind === 'hp') {
        if (G.Mods && G.Mods.noheal) { if (ui) ui.chat('Hollow Mode: No Heals is active.', 'warn'); return false; }
        if (p.hp >= p.maxHp) return false; const n = Math.round(p.maxHp * 0.4); p.heal(n); fx.text(p.x, p.y - 95, '+' + n, 'heal'); fx.ring(p.x, p.y - 4, 70, '#8dffb0', 0.5, 7);
      } else { if (p.mp >= p.maxMp) return false; const n = Math.round(p.maxMp * 0.5); p.mp = Math.min(p.maxMp, p.mp + n); fx.text(p.x, p.y - 95, '+' + n + ' MP', 'boon'); fx.ring(p.x, p.y - 4, 70, '#8ac8ff', 0.5, 7); }
      this.potions[kind]--; return true;
    },
    serialize: function () { return { gear: this.gear, eq: this.eq, potions: this.potions }; },
    restore: function (d) { if (!d) return this.reset(); this.gear = d.gear || []; this.eq = Object.assign({ staff: null, robe: null, hat: null, charmA: null, charmB: null }, d.eq || {}); this.potions = d.potions || { hp: 2, mp: 1 }; }
  };

  /* shop stock: stable for a given seed so that re-opening the shop does not re-roll */
  function stock(kind, pw, seed) {
    const rng = G.Maps.rng(seed), out = [], slots = ['staff', 'robe', 'hat', 'charm', 'charm', 'staff'];
    const n = kind === 'forge' ? 5 : 4;
    for (let i = 0; i < n; i++) {
      const it = roll(slots[Math.floor(rng() * slots.length)], pw + (kind === 'forge' ? 0.8 : 0), rollRarity(rng, pw * 0.7, kind === 'forge' ? 2 : 0), rng);
      it.uid = 's' + seed + '_' + i; if (kind === 'forge') it.price = Math.round(it.price * 1.2); out.push(it);
    }
    return out;
  }
  G.Items = { RAR: RAR, roll: roll, stock: stock, describe: describe, itemStats: itemStats, STAT: STAT, PCT: PCT };
  G.Inv = Inv;
})(window.Game = window.Game || {});
