/* Panels: modal screens - inventory, shop, skill tree & relics, quest log, codex, world map, Wilds picker, leaderboards, ending card. */
(function (G) {
  const $ = (id) => document.getElementById(id);
  const RAR = () => G.Items.RAR;
  const nameHtml = (it) => '<b style="color:' + RAR()[it.rar].color + '">' + it.name + (it.plus ? ' +' + it.plus : '') + '</b>';
  const pct = (v) => (v * 100).toFixed(0) + '%';
  const bought = {};

  function open(title, html, handler) {
    G.openModal(title, html);
    $('modalBody').onclick = function (e) { const t = e.target.closest('[data-act]'); if (t && handler) handler(t.dataset.act, t.dataset.id); };
  }
  const btn = (act, id, label, dis) => '<button class="mb" data-act="' + act + '" data-id="' + (id || '') + '"' + (dis ? ' disabled' : '') + '>' + label + '</button>';
  const row = (l, r) => '<div class="rowi"><span>' + l + '</span><span>' + (r || '') + '</span></div>';
  const g = () => G.game;

  const P = {
    /* ---------- inventory ---------- */
    inventory() {
      const p = g().player, inv = G.Inv, b = p.bonus, eq = inv.eq;
      const slots = [['staff', 'Staff'], ['robe', 'Robe'], ['hat', 'Hat'], ['charmA', 'Charm 1'], ['charmB', 'Charm 2']];
      let h = '<p class="gold">Gold: <b>' + p.gold + '</b> &nbsp; Heart Tonics (Z): <b>' + inv.potions.hp + '</b> &nbsp; Moon Dew (X): <b>' + inv.potions.mp + '</b></p>';
      h += '<p>' + btn('pot_hp', '', 'Use Heart Tonic') + btn('pot_mp', '', 'Use Moon Dew') + '</p>';
      h += '<h3>Stats</h3>' + row('Attack', Math.round(p.atk)) + row('Crit chance', pct(0.22 + b.crit)) + row('Move speed', '+' + pct(b.spd)) + row('EXP / Gold bonus', '+' + pct(b.exp) + ' / +' + pct(b.gold)) + row('Leech', pct(b.steal));
      h += '<h3>Equipped</h3>' + slots.map((s) => eq[s[0]] ? row(s[1] + ': ' + nameHtml(eq[s[0]]), G.Items.describe(eq[s[0]]) + ' ' + btn('unequip', s[0], 'Remove')) : row(s[1] + ': <i>empty</i>', '')).join('');
      h += '<h3>Pack (' + inv.gear.length + '/' + inv.cap + ')</h3>' + (inv.gear.length ? inv.gear.map((it) => row(nameHtml(it) + ' <small>' + it.slot + '</small><br><small>' + G.Items.describe(it) + '</small>', btn('equip', it.uid, 'Equip') + btn('sell', it.uid, 'Sell ' + Math.round(it.price * 0.4) + 'g'))).join('') : '<p class="note">Empty. Loot drops from monsters, quests, shops and Wilds caches.</p>');
      const act = Object.keys(g().boons.active).map((id) => '<li><b>' + G.BOONS[id].name + '</b> - ' + G.BOONS[id].desc + ' (' + Math.ceil(g().boons.active[id]) + 's)</li>').join('');
      h += '<h3>Active Boons</h3><ul class="plain">' + (act || '<li>None. Sunpetal + Moonberry together trigger Eclipse (+50% crit).</li>') + '</ul>';
      open('Inventory', h, (a, id) => {
        const gm = g(); const p2 = gm.player;
        if (a === 'equip') inv.equip(id); else if (a === 'unequip') inv.unequip(id); else if (a === 'sell') p2.gold += inv.sell(id);
        else if (a === 'pot_hp') inv.usePotion('hp', p2, gm.fx, gm.ui); else if (a === 'pot_mp') inv.usePotion('mp', p2, gm.fx, gm.ui);
        G.Prog.recalc(p2); P.inventory();
      });
    },

    /* ---------- shop ---------- */
    shop(kind) {
      const gm = g(), p = gm.player, inv = G.Inv, forge = kind === 'forge', pw = Math.max(1, gm.quests.maxPower());
      const seed = (Object.keys(gm.quests.q).filter((k) => gm.quests.q[k].st === 'done').length + 1) * 31 + (forge ? 7 : 3);
      const stock = G.Items.stock(kind, pw, seed);
      let h = '<p class="gold">Gold: <b>' + p.gold + '</b></p><h3>Supplies</h3>' +
        row('Heart Tonic <small>(heals 40% HP, key Z)</small>', btn('buy_hp', '', 'Buy 40g', p.gold < 40)) + row('Moon Dew <small>(restores 50% MP, key X)</small>', btn('buy_mp', '', 'Buy 35g', p.gold < 35));
      h += '<h3>' + (forge ? "Ashe's Forge" : "Mira's Wares") + '</h3>' + stock.map((it) => bought[it.uid] ? '' : row(nameHtml(it) + ' <small>' + it.slot + '</small><br><small>' + G.Items.describe(it) + '</small>', btn('buy', it.uid, 'Buy ' + it.price + 'g', p.gold < it.price))).join('');
      if (forge) {
        const st = inv.eq.staff; h += '<h3>Services</h3>' + (st ? row('Upgrade ' + nameHtml(st) + ' <small>(+10% ATK per level, max +5)</small>', btn('upg', '', st.plus >= 5 ? 'Maxed' : 'Upgrade ' + (150 * (st.plus + 1)) + 'g', st.plus >= 5 || p.gold < 150 * (st.plus + 1))) : '<p class="note">Equip a staff to upgrade it.</p>');
      }
      h += '<h3>Sell</h3>' + (inv.gear.length ? inv.gear.map((it) => row(nameHtml(it), btn('sell', it.uid, 'Sell ' + Math.round(it.price * 0.4) + 'g'))).join('') : '<p class="note">Nothing in your pack.</p>');
      open(forge ? 'Forge' : 'Merchant', h, (a, id) => {
        if (a === 'buy_hp' && p.gold >= 40) { p.gold -= 40; inv.potions.hp++; } else if (a === 'buy_mp' && p.gold >= 35) { p.gold -= 35; inv.potions.mp++; }
        else if (a === 'buy') { const it = stock.find((s) => s.uid === id); if (it && p.gold >= it.price && inv.gear.length < inv.cap) { p.gold -= it.price; bought[id] = true; const c = JSON.parse(JSON.stringify(it)); c.uid = 'b' + Date.now().toString(36) + Math.floor(Math.random() * 999); inv.add(c); } }
        else if (a === 'sell') p.gold += inv.sell(id);
        else if (a === 'upg') { const st = inv.eq.staff, cost = 150 * (st.plus + 1); if (st && st.plus < 5 && p.gold >= cost) { p.gold -= cost; st.plus++; G.Prog.recalc(p); } }
        P.shop(kind);
      });
    },

    /* ---------- skills ---------- */
    skills() {
      const gm = g(), pr = G.Prog, c = gm.combat;
      let h = '<p class="gold">Skill points: <b>' + pr.pts + '</b> (1 per level) &nbsp; Class: <b>' + (pr.cls ? G.CLASSES[pr.cls].name : 'none yet (level 20)') + '</b></p>';
      h += '<ul class="plain"><li><b>Ctrl / A. Attack</b> - free basic strike</li></ul><h3>Skill Tree</h3>';
      c.order.forEach((id, i) => {
        const s = c.def(id), unl = pr.isUnlocked(id), nw = G.NEW_SKILLS[id], rk = pr.rank[id] || 1;
        h += row('<b>' + (i + 1) + '. ' + s.name + '</b> <small>' + s.mp + ' MP, ' + s.cd + 's' + (unl ? ', Rank ' + rk + '/4 (+' + Math.round((pr.mult(id) - 1) * 100) + '% power, -' + (rk - 1) * 4 + '% MP)' : '') + '</small>',
          unl ? btn('rank', id, rk >= 4 ? 'Max' : 'Rank up (1 SP)', rk >= 4 || pr.pts < 1) : btn('unlock', id, 'Unlock (' + nw.cost + ' SP)', pr.pts < nw.cost));
      });
      if (pr.cls) h += '<p class="note">' + G.CLASSES[pr.cls].blurb + '</p>';
      h += '<h3>Relics (' + pr.relicOn.length + '/' + pr.relicSlots() + ' equipped)</h3>' + (pr.relics.length ? pr.relics.map((id) => row('<b>' + G.RELICS[id].name + '</b><br><small>' + G.RELICS[id].desc + '</small>', btn('relic', id, pr.hasRelic(id) ? 'Unequip' : 'Equip'))).join('') : '<p class="note">No relics yet. Earn them from bosses, Wilds caches and quests.</p>');
      open('Skills', h, (a, id) => {
        if (a === 'rank') pr.upgrade(id); else if (a === 'unlock') { if (pr.unlock(id)) gm.ui.chat('Learned ' + G.NEW_SKILLS[id].name + '!', 'good'); }
        else if (a === 'relic') pr.toggleRelic(id);
        pr.recalc(gm.player); gm.ui.buildSkillbar(); P.skills();
      });
    },

    /* ---------- quest log ---------- */
    quests() {
      const gm = g(), q = gm.quests, st = gm.story; let h = '';
      if (st.stage < 5) { open('Quest Log', st.journalHtml()); return; }
      const act = q.activeList();
      h += '<h3>Active</h3><ul class="qlist">' + (act.length ? act.map((x) => { const s = q.state(x.id); return '<li class="cur"><b>' + x.title + '</b>' + (x.side ? ' <small>(side)</small>' : '') + '<br><span>' + x.desc + (['kill', 'collect', 'wilds'].indexOf(x.obj.kind) >= 0 ? ' [' + s.n + '/' + q.goal(x) + ']' : '') + (q.ready(x) ? ' <em>Ready to turn in.</em>' : '') + '</span></li>'; }).join('') : '<li><span>Nothing active. Talk to Orrin, Mira, Tamsin or Bramble in the Hollow Tree.</span></li>') + '</ul>';
      const done = G.QUEST_DATA.filter((x) => q.done(x.id));
      h += '<h3>Completed (' + done.length + '/' + G.QUEST_DATA.length + ')</h3><ul class="qlist">' + done.map((x) => '<li class="done">' + x.title + '</li>').join('') + '</ul>';
      const f = st.flags, choices = [f.brave ? 'You told Orrin you heard the Whisper fading.' : f.humble ? 'You told Orrin it was only the wind.' : '', f.spared ? 'You spared the Drowned Warden.' : f.purified ? 'You purified the Drowned Warden.' : '', f.lumi_secret ? 'You know what Lumi truly is.' : ''].filter(Boolean);
      if (choices.length) h += '<h3>Your Choices</h3><p class="note">' + choices.join('<br>') + '</p>';
      open('Quest Log', h);
    },

    /* ---------- world map ---------- */
    worldMap() {
      const gm = g(), q = gm.quests; const L = gm.level;
      const regions = [['grove', 'Whispering Grove', 'Chapter 1', null], ['hollow', "Orrin's Hollow Tree", 'Hub: shops, quests, the Wildgate', null], ['marsh', 'Mistmarsh', 'Chapter 2: moving logs, the Drowned Warden', 'unlock_marsh'], ['sunken', 'Sunken Hollow', 'Chapter 3: Marrow, Sorrel\'s letters', 'unlock_sunken'], ['ember', 'Ember Peaks', 'Chapter 4: lava ground, Magmaw', 'unlock_ember'], ['cloud', 'Cloud Orchard', 'Chapter 5: bounce clouds, wind, Stormwing', 'unlock_cloud'], ['heart', 'The Heartwood', 'Chapter 6: the climb, Sorrel', 'unlock_heart'], ['wilds', 'The Wilds', 'Endless seeded expeditions (via the Wildgate)', 'unlock_wilds']];
      const h = '<p class="note">You are in: <b>' + L.name + '</b>. Travel with the glowing gates (E). Every region links through the Hollow Tree.</p>' + regions.map((r) => row('<b style="color:' + (r[3] && !q.flag(r[3]) ? '#8a7a9a' : '#ffe9b0') + '">' + r[1] + '</b><br><small>' + r[2] + '</small>', r[3] && !q.flag(r[3]) ? 'Locked' : (g().mapId === r[0] ? 'You are here' : 'Open'))).join('');
      open('World Map', h);
    },

    /* ---------- codex ---------- */
    codex() {
      const gm = g(), pr = G.Prog; let h = '<h3>Bestiary</h3>';
      const types = Object.keys(G.ENEMY_TYPES);
      h += types.map((t) => { const n = pr.bestiary[t] || 0; return n ? row('<b>' + G.ENEMY_TYPES[t].name + '</b> <small>x' + n + '</small><br><small>' + G.LORE[t] + '</small>') : row('<b>???</b> <small>not yet encountered</small>'); }).join('');
      h += '<h3>Achievements (' + Object.keys(pr.ach).length + '/' + G.ACH.length + ')</h3>' + G.ACH.map((a) => row('<b style="color:' + (pr.ach[a.id] ? '#9dffb4' : '#9a8fa8') + '">' + a.name + '</b><br><small>' + a.desc + '</small>', pr.ach[a.id] ? 'Done' : '')).join('');
      h += "<h3>Sorrel's Letters (" + pr.letters.length + '/5)</h3>' + (pr.letters.length ? pr.letters.map((i) => '<div class="lore">' + G.LETTERS[i] + '</div>').join('') : '<p class="note">None found yet. Look in the Sunken Hollow.</p>');
      const bl = G.Meta.d.blessings; h += '<h3>Heartwood Blessings</h3>' + (bl.length ? bl.map((id) => row('<b>' + G.BLESSINGS[id].name + '</b>', G.BLESSINGS[id].desc)).join('') : '<p class="note">Earned by reaching an ending. They carry into New Game+.</p>');
      const e = G.Meta.d.endings; h += '<h3>Endings</h3>' + row('Rekindle', e.rekindle ? 'Seen' : '???') + row('Release', e.release ? 'Seen' : '???') + row('Rewrite', e.rewrite ? 'Seen' : '???');
      open('Codex', h);
    },

    /* ---------- Wilds ---------- */
    wilds() {
      const gm = g(), q = gm.quests; const sel = P._wsel || (P._wsel = { biome: 'grove', tier: 1 });
      const bio = G.Maps.biomes, unlock = { grove: null, marsh: 'unlock_marsh', sunken: 'unlock_sunken', ember: 'unlock_ember', cloud: 'unlock_cloud', heart: 'unlock_heart' };
      let h = '<p class="note">Each expedition is a seeded map with a random modifier and a Warden\'s Cache at the far end. Higher tiers: tougher monsters, better loot.</p><h3>Biome</h3><p>' + Object.keys(bio).map((k) => btn('biome', k, bio[k].name, !!(unlock[k] && !q.flag(unlock[k]))).replace('class="mb"', 'class="mb' + (sel.biome === k ? ' sel' : '') + '"')).join('') + '</p>';
      h += '<h3>Tier</h3><p>' + [1, 2, 3, 4, 5].map((t) => btn('tier', t, 'Tier ' + t).replace('class="mb"', 'class="mb' + (sel.tier === t ? ' sel' : '') + '"')).join('') + '</p>';
      h += '<p>' + btn('go', '', 'Begin Expedition') + btn('rand', '', 'Random Seed') + btn('daily', '', 'Daily Trial') + btn('board', '', 'Leaderboards') + '</p><p class="note">Daily Trial: same seed for everyone today, Verdant Wilds tier 3. Expeditions completed: ' + G.Prog.wilds + '.</p>';
      open('The Wildgate', h, (a, id) => {
        if (a === 'biome') sel.biome = id; else if (a === 'tier') sel.tier = +id;
        else if (a === 'go') { gm.world.startWilds(sel.biome, sel.tier, Math.floor(Math.random() * 1e6)); return; }
        else if (a === 'rand') { const ks = Object.keys(bio).filter((k) => !unlock[k] || q.flag(unlock[k])); gm.world.startWilds(ks[Math.floor(Math.random() * ks.length)], 1 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 1e6)); return; }
        else if (a === 'daily') { const d = new Date(); gm.world.startWilds('grove', 3, d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(), true); return; }
        else if (a === 'board') { P.leaderboards(); return; }
        P.wilds();
      });
    },

    leaderboards() {
      const boards = [['daily', 'Daily Trial (fastest)'], ['wilds_t3', 'Wilds Tier 3 (fastest)'], ['story_time', 'Story clear time']];
      open('Leaderboards', '<p class="note">Loading...</p>');
      Promise.all(boards.map((b) => G.Cloud.board(b[0]))).then((all) => {
        let h = '<p class="note">Cloud leaderboards need the game to be served by the app (not opened from a file).</p>';
        boards.forEach((b, i) => { const rows = all[i] || []; h += '<h3>' + b[1] + '</h3>' + (rows.length ? rows.map((r, k) => row((k + 1) + '. ' + r.name + ' <small>(' + r.diff + ')</small>', Math.floor(r.value / 60) + ':' + ('0' + r.value % 60).slice(-2))).join('') : '<p class="note">No scores yet.</p>'); });
        if (G.modal) $('modalBody').innerHTML = h;
      });
    },

    /* ---------- ending ---------- */
    ending(id, best) {
      const c = $('chapterCard'); G.modal = true;
      const T = { rekindle: ['Rekindle', 'The Heartwood sings again, and Lumi sings with it. Every leaf remembers its colour.'], release: ['Release', 'The Heartwood sleeps. The world is quiet, safe, and a little less magical. The lanterns glow, warm and ordinary.'], rewrite: ['Rewrite', 'The Lantern Circle is reborn with Wren at its heart. The watch is long, but the song is shared.'] }[id];
      const sm = g().story.summary(), pending = G.Meta.d.pending;
      const pick = () => {
        const left = Object.keys(G.BLESSINGS).filter((k) => G.Meta.d.blessings.indexOf(k) < 0).sort(() => Math.random() - 0.5).slice(0, 3);
        if (pending <= 0 || !left.length) return '';
        return '<p class="next">Choose a Heartwood Blessing (kept in New Game+):</p><p>' + left.map((k) => '<button class="mb" data-b="' + k + '">' + G.BLESSINGS[k].name + '<br><small>' + G.BLESSINGS[k].desc + '</small></button>').join('') + '</p>';
      };
      c.innerHTML = '<h2>Ending: ' + T[0] + (best ? ' (the Fullest Song)' : '') + '</h2><div class="ctitle">The Last Lantern</div><p class="cq">' + T[1] + '</p>' +
        '<div class="stats"><span>Time</span><b>' + sm.time + '</b><span>Monsters</span><b>' + sm.kills + '</b><span>Deaths</span><b>' + sm.deaths + '</b><span>Level</span><b>' + sm.level + '</b><span>Letters</span><b>' + G.Prog.letters.length + '/5</b><span>Difficulty</span><b>' + sm.diff + '</b></div>' +
        '<div id="blessBox">' + pick() + '</div><p class="next">Thank you for walking the grove. The Wilds, harder difficulties and New Game+ are waiting.</p><button id="cardBtn">Keep Exploring</button>';
      c.classList.remove('hidden');
      c.onclick = (e) => {
        const b = e.target.closest('[data-b]');
        if (b) { G.Meta.d.blessings.push(b.dataset.b); G.Meta.d.pending--; G.Meta.save(); G.Prog.recalc(g().player); $('blessBox').innerHTML = '<p class="next">Blessed: ' + G.BLESSINGS[b.dataset.b].name + '</p>'; }
      };
      $('cardBtn').onclick = () => { c.classList.add('hidden'); G.modal = false; c.onclick = null; };
    }
  };
  G.Panels = P;
})(window.Game = window.Game || {});
