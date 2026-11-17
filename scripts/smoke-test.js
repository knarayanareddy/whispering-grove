/* Headless smoke test: boots the real game scripts against a stubbed DOM/canvas and drives every system. Run: node scripts/smoke-test.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..', 'public', 'game');
const handlers = {}, rafs = []; let t = 0;
Object.defineProperty(global, 'performance', { value: { now: () => t }, configurable: true });
const NOOPS = ['save', 'restore', 'translate', 'scale', 'rotate', 'beginPath', 'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'closePath', 'fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'arc', 'ellipse', 'rect', 'clip', 'fillText', 'strokeText', 'setTransform', 'roundRect', 'arcTo', 'transform'];
const mkCtx = () => { const c = { measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }; NOOPS.forEach((n) => { c[n] = () => {}; }); return c; };
const mkEl = (id) => {
  const el = { id, style: { setProperty() {} }, children: [], dataset: {}, classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c, f) { if (f === undefined ? !this._s.has(c) : f) this._s.add(c); else this._s.delete(c); }, contains(c) { return this._s.has(c); } },
    addEventListener(t, f) { (handlers[id + ':' + t] = handlers[id + ':' + t] || []).push(f); }, appendChild(c) { this.children.push(c); return c; }, removeChild(c) { this.children = this.children.filter((x) => x !== c); },
    querySelector: () => mkEl('q'), querySelectorAll: () => [], getContext: () => mkCtx(), click() { (handlers[id + ':click'] || []).forEach((f) => f({ target: el })); }, offsetWidth: 1, scrollTop: 0, scrollHeight: 0, width: 1280, height: 720,
    remove() {}, toDataURL: () => 'data:x', checked: false, textContent: '', innerHTML: '', disabled: false };
  Object.defineProperty(el, 'firstChild', { get() { return this.children[0] || { nodeValue: '' }; } });
  return el;
};
const els = {};
global.window = global; global.Game = undefined;
global.document = { getElementById: (id) => (els[id] = els[id] || mkEl(id)), createElement: (t) => mkEl(t), querySelector: () => mkEl('q'), querySelectorAll: () => [], body: mkEl('body') };
const store = {}; global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
global.addEventListener = (t, f) => { (handlers['window:' + t] = handlers['window:' + t] || []).push(f); };
Object.defineProperty(global, 'innerWidth', { value: 1280 }); Object.defineProperty(global, 'innerHeight', { value: 720 });
global.requestAnimationFrame = (f) => { rafs.push(f); };
global.Image = class { set src(v) { this.width = 120; this.height = 160; setTimeout(() => this.onload && this.onload(), 0); } };
global.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve(null) });
global.location = { reload() {} };

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map((m) => m[1]);
for (const s of scripts) vm.runInThisContext(fs.readFileSync(path.join(ROOT, s), 'utf8'), { filename: s });
const G = global.Game;
const frames = (n) => { for (let i = 0; i < n; i++) { t += 16.7; const f = rafs.splice(0); f.forEach((fn) => fn(t)); } };
const ok = (c, m) => { if (!c) { console.error('FAIL:', m); process.exitCode = 1; } else console.log('ok  ', m); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const realNow = Date.now;
const keys = (g) => g.input;

(async () => {
  await wait(50); frames(3);
  ok(Object.keys(G.Anim.images).length > 30, 'assets + derived variants registered (' + Object.keys(G.Anim.images).length + ')');
  ok(!!G.Anim.images.enemy_bogtoad_idle && !!G.Anim.images.boss_sorrel_idle && !!G.Anim.images.bg_trees_ember, 'derived enemy/boss/theme art exists');
  els.newBtn.click(); frames(10);
  const g = G.game; ok(g && g.world && g.quests && g.mapId === 'grove', 'new game boots in Whispering Grove');
  frames(240); ok(g.player.hp > 0, 'grove runs 4s of frames');
  // all skills, incl. locked
  for (const id of g.combat.order) { g.player.mp = g.player.maxMp; g.combat.cd[id] = 0; g.combat.tryUse(id); frames(60); }
  G.Prog.pts = 20; ['thorn', 'spark', 'gale'].forEach((id) => G.Prog.unlock(id)); G.Prog.upgrade('slash');
  for (const id of g.combat.order) { g.player.mp = g.player.maxMp; g.combat.cd[id] = 0; g.player.action = null; g.combat.tryUse(id); frames(80); }
  ok(true, 'all 8 skill slots fire without error');
  // finish chapter 1 artificially
  g.story.stage = 5; g.story.flags.sorrel = true;
  g.world.load('hollow', 'grove', { instant: true }); frames(30);
  ok(g.mapId === 'hollow' && g.npcs.length === 4, 'hub loads with 4 NPCs');
  // quest chain
  const talk = (id) => { const n = g.npcs.find((x) => x.id === id) || { id }; G.Dialogue.active = false; g.quests.interact(n); let guard = 0; while (G.Dialogue.active && guard++ < 60) { G.Dialogue.advance(); G.Dialogue.shown = 1e6; G.Dialogue.done = true; if (G.Dialogue.line && G.Dialogue.line.choices) G.Dialogue.pick(0); else G.Dialogue.advance(); } };
  talk('orrin'); ok(g.quests.done('q2a') === false && g.quests.state('q2a').st === 'active', 'q2a accepted');
  talk('mira'); ok(g.quests.done('q2a'), 'q2a turned in (rewards: gold ' + g.player.gold + ')');
  talk('mira'); for (let i = 0; i < 8; i++) g.quests.onKill({ type: 'slime', isBoss: false });
  const hid = g.level.id; g.level.id = 'grove'; for (let i = 0; i < 8; i++) g.quests.onKill({ type: 'slime', isBoss: false }); g.level.id = hid;
  talk('mira'); ok(g.quests.done('q2b') && g.story.flags.unlock_wilds, 'q2b done, Wildgate unlocked');
  talk('orrin'); g.world.load('marsh', 'hollow', { instant: true }); frames(300); talk('fenn'); ok(g.quests.done('q2c'), 'q2c Into the Mist done');
  // marsh collectibles + enemies + hazards
  g.player.x = g.level.items[0].x; g.player.y = g.level.items[0].y + 40; frames(10);
  ok(g.level.items[0].taken, 'collectible picked up');
  // fight boss in each story map
  const bosses = process.env.NOBOSS ? [] : [['marsh', 'drowned'], ['sunken', 'marrow'], ['ember', 'magmaw'], ['cloud', 'stormwing'], ['heart', 'sorrel']];
  for (const [map, id] of bosses) {
    g.world.load(map, 'hollow', { instant: true }); frames(20);
    ok(g.boss && g.boss.id === id, map + ' has boss ' + id);
    g.player.x = g.level.arenaX + 40; g.player.hp = g.player.maxHp = 99999; frames(30);
    if (id === 'sorrel') { let gd = 0; while (G.Dialogue.active && gd++ < 20) { G.Dialogue.shown = 1e6; G.Dialogue.done = true; G.Dialogue.advance(); } frames(30); }
    ok(g.boss.state !== 'sleep', id + ' wakes');
    for (let i = 0; i < (id === 'marrow' || id === 'sorrel' ? 60 * 8 : 150); i++) { // 25s of fighting with random inputs
      if (i % 30 === 0) { g.player.mp = g.player.maxMp; g.combat.tryUse(g.combat.order[i % 5]); }
      g.input.down.ArrowRight = (i % 200) < 100; g.input.down.ArrowLeft = !g.input.down.ArrowRight; if (i % 45 === 0) g.input.pressedAt.Space = performance.now();
      g.player.facing = g.boss.x > g.player.x ? 1 : -1; if (i % 10 === 0) g.combat.tryUse('basic'); frames(1);
      if (i === 200) g.boss.hp = Math.min(g.boss.hp, g.boss.maxHp * 0.2);
    }
    g.input.down = {};
    g.boss.takeHit && g.combat.hitEnemy(g.boss, 'ult', { mult: 9999 }); frames(60);
    ok(g.boss.state === 'dying' || g.boss.state === 'gone', id + ' defeated');
    G.Dialogue.active = false; frames(140);
    let guard = 0; while (G.Dialogue.active && guard++ < 80) { G.Dialogue.shown = 1e6; G.Dialogue.done = true; if (G.Dialogue.line && G.Dialogue.line.choices) G.Dialogue.pick(0); else G.Dialogue.advance(); }
    t += 2000; await wait(1900); frames(5); guard = 0; while (G.Dialogue.active && guard++ < 80) { G.Dialogue.shown = 1e6; G.Dialogue.done = true; if (G.Dialogue.line && G.Dialogue.line.choices) G.Dialogue.pick(0); else G.Dialogue.advance(); }
    frames(20);
  }
  console.log('  -> finale'); g.world.finale(); console.log('  -> finale opened'); { let gd = 0; while (G.Dialogue.active && gd++ < 60) { G.Dialogue.shown = 1e6; G.Dialogue.done = true; if (G.Dialogue.line && G.Dialogue.line.choices) G.Dialogue.pick(0); else G.Dialogue.advance(); } }
  ok(g.story.flags.ending, 'finale played, ending reached: ' + g.story.flags.ending);
  ok(Object.keys(G.Meta.d.endings).length === 1 && G.Meta.d.carry, 'meta saved with NG+ carry');
  // every map loads and runs
  for (const id of Object.keys(G.Maps.defs)) { g.world.load(id, 'hollow', { instant: true }); frames(120); }
  ok(true, 'all ' + Object.keys(G.Maps.defs).length + ' maps run');
  for (const b of Object.keys(G.Maps.biomes)) for (const tier of [1, 5]) { const def = G.Maps.wilds(b, tier, 12345); console.log('  wilds', b, tier, def.platforms.length, def.spawns.length); g.world.load('wilds', 'hollow', { def, instant: true }); console.log('   loaded'); frames(30); console.log('   framed'); g.player.x = def.chest.x; try { vm.runInThisContext('Game.game.world.interact()', { timeout: 3000 }); } catch (e) { console.log(String(e.stack).split('\n').slice(0, 8).join('\n')); process.exit(1); } console.log('   chest'); }
  ok(G.Prog.wilds >= 10, 'wilds expeditions + caches work (' + G.Prog.wilds + ')');
  // gear + panels
  for (let i = 0; i < 12; i++) G.Inv.add(G.Items.roll(['staff', 'robe', 'hat', 'charm'][i % 4], 1 + i / 2));
  G.Inv.gear.slice(0, 6).forEach((it) => G.Inv.equip(it.uid)); G.Prog.recalc(g.player);
  ok(g.player.bonus.atk > 0 || g.player.bonus.hp > 0, 'equipment applies bonuses');
  ['inventory', 'skills', 'quests', 'worldMap', 'codex', 'wilds'].forEach((p) => G.Panels[p]());
  G.Panels.shop('mira'); G.Panels.shop('forge'); G.Panels.ending('rekindle', true);
  ok(true, 'all panels render');
  // save / load round trip
  g.story.save(); const raw = JSON.parse(store['whisperingGrove.save.v1']); ok(raw.v === 2 && raw.ext && raw.ext.quests, 'save v2 contains world ext');
  els.contBtn.click(); frames(5); const g2 = G.game; ok(g2 !== g && g2.quests.done('q2a') && g2.mapId, 'continue restores quests + map (' + g2.mapId + ')');
  // class choice + NG+
  g2.player.lvl = 20; G.Prog.classOffered = false; G.Prog.cls = null; g2.world.maybeClass(); let guard = 0; while (G.Dialogue.active && guard++ < 30) { G.Dialogue.shown = 1e6; G.Dialogue.done = true; if (G.Dialogue.line && G.Dialogue.line.choices) G.Dialogue.pick(1); else G.Dialogue.advance(); }
  ok(G.Prog.cls === 'storm', 'class chosen at level 20: ' + G.Prog.cls);
  g2.player.mp = g2.player.maxMp; g2.combat.cd.ult = 0; g2.combat.tryUse('ult'); frames(100);
  els.ngBtn.click(); frames(5); ok(G.Mods.ng === 1 && G.game.player.lvl >= 1, 'New Game+ starts (ng=' + G.Mods.ng + ', lvl ' + G.game.player.lvl + ')');
  console.log(process.exitCode ? 'SMOKE TEST FAILED' : 'SMOKE TEST PASSED'); process.exit(process.exitCode || 0);
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
