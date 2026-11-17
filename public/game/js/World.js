/* World: multi-map manager. Portals + fades, NPC/quest routing, collectibles, boss arenas, Wilds expeditions, class choice, endings, save extension. */
(function (G) {
  const A = G.Anim;
  const L = (who, text) => ({ who: who, text: text });
  const ITEM_COL = { lantern: '255,211,107', letter: '255,242,204', shard: '143,224,255', feather: '255,246,143', memory: '255,179,230' };
  const ITEM_NAME = { lantern: 'Lost Lantern', letter: "Sorrel's Letter", shard: 'Cooling Shard', feather: 'Storm Feather', memory: 'Memory' };

  class World {
    constructor(game) {
      this.g = game; this.busy = false; this.bossDone = {}; this.takenItems = {}; this.runT = 0; this.chestOpen = false; this.t = 0; this.lastPortal = null; this.achT = 2; this.eclipseCd = 0;
      this.fade = document.getElementById('fade');
    }

    /* ---------- flags & gating ---------- */
    unlocked(req) { return !req || this.g.quests.flag(req); }

    /* ---------- map loading ---------- */
    load(id, fromId, opts) {
      opts = opts || {};
      const def = opts.def || G.Maps.defs[id]; if (!def) return;
      const go = () => {
        const g = this.g, p = g.player, st = g.story, D = G.Diff.cur, M = G.Mods;
        const level = new G.Level(def); g.level = level; g.mapId = def.id; p.level = level;
        g.pickups.level = level; g.pickups.items = []; g.boons.level = level; g.boons.items = []; g.camera.worldW = level.width; g.combat.projectiles = []; g.combat.shots = [];
        let sx = level.playerStart.x; const from = fromId && level.portals.find((q) => q.to === fromId);
        if (opts.x !== undefined) sx = opts.x; else if (from) sx = from.x + (from.x < level.width / 2 ? 90 : -90);
        p.x = sx; p.y = level.playerStart.y; p.vx = p.vy = 0; p.grounded = true; p.groundPlat = level.ground; p.limitMin = 0; p.limitMax = Infinity; p.action = null; p.dashTimer = 0;
        const mut = def.mut || {};
        g.enemies = [];
        level.spawns.forEach((s) => { g.enemies.push(new G.Enemy({ type: s.type, bounds: s.bounds, power: level.power, eliteAdd: mut.eliteAdd || 0, goldMul: mut.gold || 1 })); if (M.swarm && !def.wilds) g.enemies.push(new G.Enemy({ type: s.type, bounds: s.bounds, power: level.power })); });
        g.boss = null;
        if (def.id === 'grove') { if (st.stage < 5) { g.boss = new G.Boss(level.bossSpawn); g.enemies.push(g.boss); } }
        else if (level.boss && !this.bossDone[level.boss.id]) {
          const cfg = Object.assign({}, G.BOSS_CFG[level.boss.id]), f = st.flags;
          if (cfg.id === 'sorrel') { cfg.noSummon = !!f.spared; if (f.purified) cfg.dmgScale = 0.9; }
          g.boss = new G.Boss({ bounds: { x1: level.boss.x1, x2: level.boss.x2, y: 600 }, cfg: cfg, power: level.power }); g.enemies.push(g.boss);
        }
        const tk = this.takenItems[def.id]; if (tk && !def.wilds) level.items.forEach((it, i) => { it.taken = !!tk[i]; });
        g.npcs = level.npcs.map((n) => new G.NPC(n));
        if (def.id === 'grove' && st.stage >= 4) level.checkpoint = level.checkpoint2;
        st.motes = level.motes.map((m, i) => ({ x: m.x, y: m.y, taken: !!(st.motes[i] && st.motes[i].taken && def.id === 'grove'), phase: Math.random() * 6 }));
        g.camera.snapTo(p); g.companion.snap();
        this.chestOpen = false; this.runT = 0; this.hurtFlash = 0;
        g.ui.el.bossBar.classList.add('hidden'); g.ui.setMapName(def.name);
        const sub = def.wilds ? def.name + ' - ' + mut.name : def.name;
        if (!opts.instant) g.ui.banner(sub, 'sub');
        if (def.wilds) { g.ui.chat('Expedition modifier: ' + mut.name + '. ' + mut.desc, 'sys'); g.companion.speak('A new world! ' + mut.desc, 4); }
        g.quests.onEnter(def.id);
        if (!opts.instant) g.story.save();
      };
      if (opts.instant) { go(); return; }
      this.busy = true; this.fade.classList.add('on');
      setTimeout(() => { go(); setTimeout(() => { this.fade.classList.remove('on'); this.busy = false; }, 120); }, 420);
    }

    startWilds(biome, tier, seed, daily) {
      const def = G.Maps.wilds(biome, tier, seed); def.daily = !!daily;
      G.closeModal(); this.load('wilds', 'hollow', { def: def });
    }

    /* ---------- interaction ---------- */
    npcMarker(npc) {
      const g = this.g, st = g.story;
      if (npc.id === 'orrin' && g.mapId === 'grove' && (st.stage < 5 || (st.stage === 5 && !st.flags.sorrel))) return st.markerFor(npc);
      return g.quests.markerFor(npc);
    }
    interact() {
      const g = this.g, p = g.player, L_ = g.level;
      const npc = g.npcs.find((n) => n.near);
      if (npc) {
        const st = g.story;
        if (npc.id === 'orrin' && g.mapId === 'grove' && (st.stage < 5 || (st.stage === 5 && !st.flags.sorrel))) { st.interact(npc); return; }
        if (!g.quests.interact(npc)) { if (npc.shop) G.Panels.shop(npc.shop); else G.Dialogue.open([L(npc.id, '...')]); }
        else if (npc.shop) { const prev = G.Dialogue.onDone; G.Dialogue.onDone = () => { if (prev) prev(); }; }
        return;
      }
      const pt = L_.portals.find((q) => Math.abs(q.x - p.x) < 70 && p.y > 540);
      if (pt) {
        if (!this.unlocked(pt.req)) { g.ui.chat('This way is sealed. ' + (pt.req === 'marsh_boss' ? 'Defeat the Drowned Warden first.' : 'Progress the story to open it.'), 'warn'); return; }
        if (pt.kind === 'wilds') { G.Panels.wilds(); return; }
        this.load(pt.to, L_.id); return;
      }
      if (L_.chest && !this.chestOpen && Math.abs(L_.chest.x - p.x) < 80) { this.openChest(); return; }
      const shopNpc = g.npcs.find((n) => n.shop && Math.abs(n.x - p.x) < 140);
      if (shopNpc) G.Panels.shop(shopNpc.shop);
    }
    nearHint() {
      const g = this.g, p = g.player, L_ = g.level;
      const pt = L_.portals.find((q) => Math.abs(q.x - p.x) < 70 && p.y > 540); if (pt) return { x: pt.x, y: 600, text: this.unlocked(pt.req) ? 'Press E: ' + pt.label : 'Sealed: ' + pt.label };
      if (L_.chest && !this.chestOpen && Math.abs(L_.chest.x - p.x) < 80) return { x: L_.chest.x, y: 600, text: "Press E: open the Warden's Cache" };
      return null;
    }

    openChest() {
      const g = this.g, L_ = g.level, p = g.player, tier = L_.tier || 1, pw = L_.power;
      this.chestOpen = true; const rar = Math.min(3, tier - 1 + (Math.random() < 0.25 ? 1 : 0));
      const it = G.Items.roll(['staff', 'robe', 'hat', 'charm'][Math.floor(Math.random() * 4)], pw, Math.max(rar, Math.floor(Math.random() * 3)));
      const gold = Math.round(70 * pw * tier * (L_.def.mut && L_.def.mut.gold ? 2 : 1)), exp = Math.round(60 * pw * tier);
      p.gold += gold; const lv = p.addExp(exp); G.Inv.add(it); G.Inv.potions.hp += 1; G.Inv.potions.mp += 1;
      g.fx.burst(L_.chest.x, 520, { n: 36, colors: ['#ffe96b', '#fff', '#9ad8ff', '#ff9ad8'], speed: 460, life: 1, size: 6, grav: 200, glow: true, shape: 'star', up: 200 });
      g.ui.chat('Cache: ' + gold + ' gold, ' + exp + ' EXP, ' + it.name + ' (' + G.Items.RAR[it.rar].name + '), 1 tonic of each kind.', 'good');
      let relic = null; if (Math.random() < Math.min(0.6, 0.15 * tier + 0.05)) { relic = G.Prog.giveRelic(); if (relic) g.ui.chat('Relic found: ' + G.RELICS[relic].name + '!', 'good'); }
      if (lv && G.onLevelUp) G.onLevelUp();
      G.Prog.wilds++; g.quests.onWilds(); G.Prog.recalc(p);
      const secs = Math.round(this.runT); g.ui.banner('Expedition complete! ' + Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2), 'sub');
      if (L_.def.daily && G.Cloud) G.Cloud.submit('daily', secs);
      if (G.Cloud && L_.def.wilds) G.Cloud.submit('wilds_t' + tier, secs);
      g.story.save();
    }

    /* ---------- bosses ---------- */
    onBossDefeated(e) {
      const g = this.g, p = g.player, id = e.id;
      if (id === 'brambold') { g.story.onBossDefeated(e); return; }
      p.limitMin = 0; this.bossDone[id] = true; G.Prog.bosses++; g.story.flags[id + '_down'] = true;
      if (id === 'drowned') g.story.flags.marsh_boss = true;
      g.boons.spawn('heartseed', e.x, e.cy);
      setTimeout(() => {
        if (id === 'drowned') {
          G.Dialogue.open([L('drowned', '...so cold... so quiet... who sings?'), { who: 'hero', text: '...', choices: [
            { text: 'Purify the Hollow from you.', flag: 'purified', reply: [L('lumi', 'The Whisper is flowing into the Warden... the water is clearing!'), L('drowned', 'I remember the song. Take what the marsh keeps.')] },
            { text: 'Spare him. Let him rest as he is.', flag: 'spared', reply: [L('drowned', '...you let me rest. A kindness I did not expect.'), L('lumi', 'Wren... that was brave. In a different way.')] }] }],
          () => { if (g.story.flags.purified) { const r = G.Prog.giveRelic(); if (r) g.ui.chat('Relic found: ' + G.RELICS[r].name + '!', 'good'); } else { const it = G.Items.roll('charm', 2.4, 3); G.Inv.add(it); g.ui.chat('The Warden gifts you ' + it.name + '.', 'good'); } g.quests.onBoss(id); });
        } else g.quests.onBoss(id);
      }, 1700);
    }
    onRespawn() {
      const g = this.g; g.player.limitMin = 0;
      if (g.mapId !== 'grove' && g.boss && g.boss.state !== 'gone' && g.boss.state !== 'dying') {
        g.boss.resetFight(); this.bossStarted = false;
        for (let i = g.enemies.length - 1; i >= 0; i--) if (g.enemies[i].summoned) g.enemies.splice(i, 1);
        g.companion.speak('Take a breath, Wren. Read the red warnings, then strike in the gaps.', 4.5);
      }
    }
    onQuestDone(q) {
      const g = this.g;
      if (q.id === 'q6c') this.finale();
      if (q.id === 'q3c') g.companion.speak('The second Lantern burns again. Three more to go.', 5);
      G.Prog.checkAch(g);
    }

    /* ---------- endings ---------- */
    finale() {
      const g = this.g, f = g.story.flags, letters = G.Prog.letters.length, best = letters >= 5 && (f.spared || f.purified);
      const extras = [];
      if (f.spared) extras.push(L('narrator', 'In the marsh, a Warden you spared hums quietly along.'));
      if (f.purified) extras.push(L('narrator', 'In the marsh, the water runs clear. The Warden you purified is fishing.'));
      if (f.brave) extras.push(L('narrator', 'Elder Orrin tells it often: the apprentice who said, "I hear it, and it is fading."'));
      if (f.humble) extras.push(L('narrator', 'Elder Orrin tells it often: the apprentice who said it was only the wind. And then listened anyway.'));
      if (best) extras.push(L('sorrel', 'You read all my letters. Thank you. That is the first time anyone answered me.'));
      const tail = best ? [L('narrator', 'And in the song, faint and fond, a voice that is not quite Lumi\'s and not quite Sorrel\'s sings the alto line.')] : [];
      const lines = [
        L('sorrel', '...you listened. I forgot that was possible.'),
        L('narrator', 'Sorrel kneels. The Hollow thins like breath on glass, and for the first time in a hundred years the Heartwood sings out loud.'),
        L('lumi', 'Wren... the Heartwood is asking what we want. It will do what we choose.'),
        { who: 'heartwood', text: '(The Heartwood waits for your answer.)', choices: [
          { text: 'Rekindle it. Let Lumi sing it back to life.', flag: 'end_rekindle', reply: [L('lumi', 'Then I will go home, Wren. Not away. Home. I will be in every leaf, and every time you listen, I will be listening back.')].concat(extras, tail, [L('narrator', 'ENDING: REKINDLE. The Hollow fades. The Whisper returns. Lumi is the song.')]) },
          { text: 'Release it. Let the Heartwood sleep, and the world rest.', flag: 'end_release', reply: [L('lumi', 'Sleep well, old friend. We will keep the lanterns lit for you.')].concat(extras, tail, [L('narrator', 'ENDING: RELEASE. The world grows quiet and safe. Magic ebbs like a tide, and the Lanterns become ordinary lights, warm and loved.')]) },
          { text: 'Rewrite the Circle. I will become the new keeper.', flag: 'end_rewrite', reply: [L('orrin', 'Wren... a keeper does not rule the song. A keeper listens to it, for everyone.'), L('hero', 'Then I will listen.')].concat(extras, tail, [L('narrator', 'ENDING: REWRITE. The Lantern Circle is reborn with Wren at its heart. The cost is a quieter life and a longer watch.')]) }] }
      ];
      G.Dialogue.open(lines, () => {
        const ending = f.end_rekindle ? 'rekindle' : f.end_release ? 'release' : 'rewrite';
        this.reachEnding(ending, best);
      }, { cinematic: true });
    }
    reachEnding(ending, best) {
      const g = this.g, p = g.player, M = G.Meta.d;
      M.endings[ending] = true; M.pending += best ? 2 : 1;
      M.carry = { ng: (G.Mods.ng || 0) + 1, lvl: p.lvl, baseHp: p.baseHp, baseMp: p.baseMp, inv: G.Inv.serialize(), prog: G.Prog.serialize(), gold: Math.round(p.gold * 0.5), kills: p.kills };
      G.Meta.save(); G.Prog.checkAch(g); g.story.flags.ending = ending; g.story.save();
      if (G.Cloud) G.Cloud.submit('story_time', Math.round(g.story.playTime));
      G.Panels.ending(ending, best);
    }

    /* ---------- class choice at level 20 ---------- */
    maybeClass() {
      const g = this.g, p = g.player, P = G.Prog;
      if (p.lvl < 20 || P.cls || P.classOffered || G.Dialogue.active || p.dead || this.busy) return;
      P.classOffered = true; const f = g.story.flags;
      G.Dialogue.open([L('lumi', 'Wren... your light has changed. It is trying to become something. Which way does it lean?'), { who: 'hero', text: '...', choices: [
        { text: 'Lantern Knight: shield the many.', flag: 'cls_knight', reply: [L('lumi', 'A guardian. The Lantern will be your shield.')] },
        { text: 'Storm Mage: bend the sky.', flag: 'cls_storm', reply: [L('lumi', 'Lightning in a lantern. Dramatic. I love it.')] },
        { text: 'Verdant Healer: grow what is hurt.', flag: 'cls_healer', reply: [L('lumi', 'Roots and petals. Gentle, and unstoppable.')] }] }],
      () => {
        P.cls = f.cls_knight ? 'knight' : f.cls_storm ? 'storm' : 'healer';
        G.Prog.recalc(p); g.ui.buildSkillbar(); g.ui.setClass(G.CLASSES[P.cls].name); g.ui.chat('Class chosen: ' + G.CLASSES[P.cls].name + '. Your ultimate (key 5) is now ' + G.ULTS[G.CLASSES[P.cls].ult].name + '.', 'good');
        g.fx.ring(p.x, p.y - 30, 240, '#ffe96b', 0.9, 12); g.camera.addShake(6); P.checkAch(g); g.story.save();
      });
    }

    /* ---------- per frame ---------- */
    update(dt) {
      const g = this.g, p = g.player, L_ = g.level; this.t += dt; this.runT += dt;
      L_.update(dt, p, g);
      // collectibles
      for (const it of L_.items) {
        if (it.taken || p.dead) continue;
        if (Math.hypot(p.x - it.x, (p.y - 40) - it.y) < 48) {
          it.taken = true; this.takenItems[L_.id] = L_.items.map((k) => !!k.taken); const col = ITEM_COL[it.what] ? ITEM_COL[it.what] : '255,255,255';
          g.fx.ring(it.x, it.y, 110, 'rgb(' + col + ')', 0.7, 9); g.fx.burst(it.x, it.y, { n: 24, colors: ['#fff', 'rgb(' + col + ')'], speed: 280, life: 0.9, size: 5, grav: -60, glow: true, shape: 'star' });
          g.fx.text(it.x, it.y - 30, ITEM_NAME[it.what] || 'Found', 'boon');
          if (it.what === 'letter') { const idx = G.Prog.letters.length; if (idx < G.LETTERS.length) { G.Prog.letters.push(idx); G.Dialogue.open([L('narrator', 'Letter ' + (idx + 1) + ' of 5, in neat, tired handwriting:'), L('narrator', '"' + G.LETTERS[idx] + '"')]); } }
          if (it.what === 'memory') { const n = L_.items.filter((k) => k.what === 'memory' && k.taken).length; g.companion.speak(['I remember warmth. A lantern, first lit.', 'Two laughing figures under the Heartwood.', 'The day the first Lantern died. Oh. Oh, that hurts.', 'And... you, Wren. Waking me up.'][Math.min(3, n - 1)], 4); }
          g.quests.onItem(it.what);
        }
      }
      // generic boss arena
      if (g.boss && g.mapId !== 'grove' && g.boss.state === 'sleep' && !p.dead && p.x > L_.arenaX && !this.bossStarted) {
        this.bossStarted = true; p.limitMin = g.boss.b.x1 - 20; L_.checkpoint = { x: g.boss.b.x1 - 140, y: 600 };
        const go = () => { g.boss.wake(); g.ui.banner(g.boss.s.name, 'boss'); this.bossStarted = false; };
        if (g.boss.id === 'sorrel') G.Dialogue.open([L('sorrel', 'Phase by phase, I will show you what grief is. Denial first.')], go); else go();
      }
      if (g.mapId !== 'grove') { p.limitMax = Infinity; }
      // Eclipse synergy (Sunpetal + Moonberry)
      p.eclipse = Math.max(0, (p.eclipse || 0) - dt); this.eclipseCd = Math.max(0, this.eclipseCd - dt);
      const a = g.boons.active;
      if ((a.sunpetal || 0) > 0 && (a.moonberry || 0) > 0 && p.eclipse <= 0 && this.eclipseCd <= 0) { p.eclipse = 8; this.eclipseCd = 24; g.fx.text(p.x, p.y - 140, 'ECLIPSE! +50% crit', 'crit'); g.fx.ring(p.x, p.y - 30, 180, '#ffb2ff', 0.7, 10); g.ui.chat('Boon synergy: Eclipse! Crit surge for 8s.', 'good'); }
      this.achT -= dt; if (this.achT <= 0) { this.achT = 2; G.Prog.checkAch(g); this.maybeClass(); }
    }

    /* ---------- drawing ---------- */
    drawWorld(ctx, camX, t) {
      const L_ = this.g.level;
      for (const pt of L_.portals) {
        const x = pt.x - camX; if (x < -120 || x > G.VW + 120) continue;
        const open = this.unlocked(pt.req), col = open ? (pt.kind === 'wilds' ? '255,170,90' : '150,220,255') : '120,110,150';
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createLinearGradient(x - 44, 0, x + 44, 0);
        gr.addColorStop(0, 'rgba(' + col + ',0)'); gr.addColorStop(0.5, 'rgba(' + col + ',' + (open ? 0.55 : 0.2) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, 536, 46, 74 + Math.sin(t * 2) * 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.strokeStyle = 'rgba(' + col + ',0.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, 536, 30, 66, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.font = '800 13px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#1c1030'; ctx.fillStyle = open ? '#e5f7ff' : '#9a90b4';
        ctx.strokeText(pt.label, x, 446); ctx.fillText(pt.label, x, 446); ctx.restore();
      }
      for (const it of L_.items) {
        if (it.taken) continue; const x = it.x - camX, y = it.y + Math.sin(t * 2 + it.ph) * 8, col = ITEM_COL[it.what] || '255,255,255';
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(x, y, 0, x, y, 46); g.addColorStop(0, 'rgba(' + col + ',0.95)'); g.addColorStop(0.35, 'rgba(' + col + ',0.5)'); g.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 46, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over'; ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + it.ph) * 0.4);
        ctx.fillStyle = '#fffdf2'; ctx.strokeStyle = 'rgba(' + col + ',1)'; ctx.lineWidth = 2;
        if (it.what === 'letter') { ctx.fillRect(-9, -7, 18, 14); ctx.strokeRect(-9, -7, 18, 14); ctx.beginPath(); ctx.moveTo(-9, -7); ctx.lineTo(0, 1); ctx.lineTo(9, -7); ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 0); ctx.lineTo(0, 12); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      }
      const c = L_.chest;
      if (c && !this.chestOpen) {
        const x = c.x - camX; ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(x, 560, 4, x, 560, 90); g.addColorStop(0, 'rgba(255,220,120,0.7)'); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, 560, 90, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.save(); ctx.fillStyle = '#7a4a22'; ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 3; ctx.fillRect(x - 28, 566, 56, 34); ctx.strokeRect(x - 28, 566, 56, 34);
        ctx.fillStyle = '#c99b3a'; ctx.fillRect(x - 28, 566, 56, 9); ctx.fillRect(x - 5, 574, 10, 12); ctx.restore();
        ctx.save(); ctx.font = '800 13px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#1c1030'; ctx.fillStyle = '#ffe9b0'; ctx.strokeText("Warden's Cache", x, 548); ctx.fillText("Warden's Cache", x, 548); ctx.restore();
      }
      const h = this.nearHint();
      if (h) { const x = h.x - camX; ctx.save(); ctx.font = '800 14px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(30,18,40,0.85)'; ctx.fillRect(x - 110, 614, 220, 24); ctx.fillStyle = '#9ad8ff'; ctx.fillText(h.text, x, 631); ctx.restore(); }
    }

    /* ---------- tracker / save ---------- */
    trackerInfo() {
      const st = this.g.story;
      if (st.stage < 5) return st.trackerHtml();
      const t = this.g.quests.tracker();
      if (t) return t;
      return { title: st.flags.ending ? 'The Song Goes On' : 'Explore freely', desc: st.flags.ending ? 'Try the Wilds, a harder difficulty, or New Game+.' : 'Speak with Elder Orrin or Mira in the Hollow Tree.', prog: '' };
    }
    serialize() {
      const g = this.g, p = g.player;
      return { map: g.mapId === 'wilds' ? 'hollow' : g.mapId, quests: g.quests.serialize(), inv: G.Inv.serialize(), prog: G.Prog.serialize(), bossDone: this.bossDone, takenItems: this.takenItems, mods: G.Mods, baseHp: p.baseHp, baseMp: p.baseMp };
    }
    restore(ext) {
      const g = this.g, p = g.player; if (!ext) { G.Prog.recalc(p); return; }
      G.Inv.restore(ext.inv); G.Prog.restore(ext.prog); g.quests.restore(ext.quests); this.bossDone = ext.bossDone || {}; this.takenItems = ext.takenItems || {}; Object.assign(G.Mods, ext.mods || {});
      if (ext.baseHp) { p.baseHp = ext.baseHp; p.baseMp = ext.baseMp; }
      G.Prog.recalc(p); g.ui.buildSkillbar(); if (G.Prog.cls) g.ui.setClass(G.CLASSES[G.Prog.cls].name);
      if (ext.map && ext.map !== 'grove' && G.Maps.defs[ext.map]) { this.load(ext.map, null, { instant: true, x: 160 }); }
    }
  }
  G.World = World;
})(window.Game = window.Game || {});
