/* UI: HUD bars, skill bar with cooldown overlays, minimap, chat log, menu buttons. */
(function (G) {
  const A = G.Anim;
  const $ = (id) => document.getElementById(id);

  class UI {
    constructor() {
      this.disp = { hp: 0, mp: 0, exp: 0 }; this.first = true;
      this.el = {
        lvl: $('lvl'), hpFill: $('hpFill'), mpFill: $('mpFill'), expFill: $('expFill'),
        hpVal: $('hpVal'), mpVal: $('mpVal'), expVal: $('expVal'), gold: $('gold'),
        quest: $('questTracker'), cbanner: $('chapterBanner'), card: $('chapterCard'), bossBar: $('bossBar'), bossFill: $('bossFill'), bossGhost: $('bossGhost'), bossPhase: $('bossPhase'),
        chat: $('chatLog'), mini: $('minimap'), flash: $('levelFlash'), skillbar: $('skillbar'), banner: $('banner')
      };
      this.mctx = this.el.mini.getContext('2d');
      this.slots = {};
      this.game = null;
    }

    bind(game) {
      this.game = game;
      const combat = game.combat, bar = this.el.skillbar; bar.innerHTML = '';
      for (let i = 0; i < 8; i++) {
        const id = combat.order[i];
        const d = document.createElement('div'); d.className = 'slot' + (id ? '' : ' locked');
        const s = id ? G.SKILLS[id] : null;
        d.innerHTML = '<span class="key">' + (i + 1) + '</span>' +
          '<span class="sname">' + (s ? s.name : 'Locked') + '</span>' +
          '<span class="cost">' + (s ? (s.mp + ' MP') : '') + '</span>' +
          '<div class="cd"></div><span class="cdt"></span>';
        bar.appendChild(d);
        if (id) this.slots[id] = { root: d, cd: d.querySelector('.cd'), cdt: d.querySelector('.cdt') };
      }
      this.el.chat.innerHTML = '';
      const modal = (title, html) => G.openModal(title, html);
      $('btnInv').onclick = () => {
        const p = game.player, act = Object.keys(game.boons.active).map((id) => '<li><b>' + G.BOONS[id].name + '</b> - ' + G.BOONS[id].desc + ' (' + Math.ceil(game.boons.active[id]) + 's)</li>').join('');
        modal('Inventory', '<p class="gold">Gold: <b>' + p.gold + '</b></p><h3>Active Boons</h3><ul class="plain">' + (act || '<li>None. Defeat monsters to find Boons.</li>') + '</ul><h3>Boon Guide</h3><ul class="plain">' +
          Object.keys(G.BOONS).map((id) => '<li><b style="color:' + G.BOONS[id].color + '">' + G.BOONS[id].name + '</b> - ' + G.BOONS[id].desc + '</li>').join('') + '</ul><p class="note">Equipment and charms arrive in Phase 2.</p>');
      };
      $('btnSkills').onclick = () => {
        const rows = combat.order.map((id, i) => { const s = G.SKILLS[id]; return '<li><b>' + (i + 1) + '. ' + s.name + '</b> - ' + s.mp + ' MP, ' + s.cd + 's cooldown</li>'; }).join('');
        modal('Skills', '<ul class="plain"><li><b>Ctrl / A. Attack</b> - free basic strike</li>' + rows + '</ul><p class="note">Slots 6 to 8 unlock with the skill tree in Phase 2.</p>');
      };
      $('btnQuests').onclick = () => modal('Quest Log', game.story.journalHtml());
      $('btnMap').onclick = () => this.chat('Map: Whispering Grove. Blight Gate at the east. Monsters: Leaf Slime, Grumpy Shroom, Wisp Spirit.', 'sys');
      $('btnMenu').onclick = () => { if (G.togglePause) G.togglePause(); };
      this.chat('Welcome to Whispering Grove! Difficulty: ' + G.Diff.cur.name + '.', 'sys');
    }

    chat(text, kind) {
      const d = document.createElement('div'); d.className = 'line ' + (kind || 'sys'); d.textContent = text;
      const log = this.el.chat; log.appendChild(d);
      while (log.children.length > 40) log.removeChild(log.firstChild);
      log.scrollTop = log.scrollHeight;
    }

    slotDenied(id) {
      const s = this.slots[id]; if (!s) return;
      s.root.classList.remove('denied'); void s.root.offsetWidth; s.root.classList.add('denied');
    }

    levelUp(level) {
      const f = this.el.flash; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
      const b = this.el.banner; b.textContent = 'LEVEL UP!  Lv ' + level; b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
      this.chat('Level up! You are now level ' + level + '.', 'good');
    }

    refreshQuest() {
      const g = this.game; if (!g || !g.story) return;
      const t = g.story.trackerHtml();
      this.el.quest.innerHTML = '<div class="qt">Quest</div><div class="qn">' + t.title + '</div><div class="qd">' + t.desc + '</div>' + (t.prog ? '<div class="qp">' + t.prog + '</div>' : '');
      this.el.quest.classList.remove('pulse'); void this.el.quest.offsetWidth; this.el.quest.classList.add('pulse');
    }

    banner(text, kind) {
      const b = this.el.cbanner; b.textContent = text; b.className = kind || 'sub'; void b.offsetWidth; b.classList.add('go');
    }

    bossHit() { this.bossShake = 0.2; }

    chapterCard(sm) {
      const c = this.el.card; G.modal = true;
      c.innerHTML = '<h2>Chapter 1 Complete</h2><div class="ctitle">The Waking Grove</div><p class="cq">The Gloomcap Warden is free of the Hollow, and a new name echoes in the Whisper: Sorrel.</p>' +
        '<div class="stats"><span>Time</span><b>' + sm.time + '</b><span>Monsters</span><b>' + sm.kills + '</b><span>Motes</span><b>' + sm.motes + '</b><span>Boons</span><b>' + sm.boons + '</b><span>Deaths</span><b>' + sm.deaths + '</b><span>Level</span><b>' + sm.level + '</b><span>Gold</span><b>' + sm.gold + '</b><span>Difficulty</span><b>' + sm.diff + '</b></div>' +
        '<p class="next">Next: Chapter 2, The Sunken Hollow <em>(coming in Phase 2)</em></p><button id="cardBtn">Keep Exploring</button>';
      c.classList.remove('hidden');
      document.getElementById('cardBtn').onclick = () => { c.classList.add('hidden'); G.modal = false; };
    }

    update(dt) {
      const g = this.game, p = g.player, e = this.el;
      const targets = { hp: p.hp / p.maxHp, mp: p.mp / p.maxMp, exp: p.exp / p.expNext };
      for (const k in targets) {
        this.disp[k] = this.first ? targets[k] : A.approach(this.disp[k], targets[k], 12, dt);
        // exp bar resets instantly on level-up instead of draining backwards
        if (k === 'exp' && this.disp.exp > targets.exp + 0.3) this.disp.exp = 0;
      }
      this.first = false;
      e.hpFill.style.width = (this.disp.hp * 100).toFixed(1) + '%';
      e.mpFill.style.width = (this.disp.mp * 100).toFixed(1) + '%';
      e.expFill.style.width = (this.disp.exp * 100).toFixed(1) + '%';
      e.hpVal.textContent = Math.ceil(p.hp) + ' / ' + p.maxHp;
      e.mpVal.textContent = Math.floor(p.mp) + ' / ' + p.maxMp;
      e.expVal.textContent = p.exp + ' / ' + p.expNext + '  (' + (p.exp / p.expNext * 100).toFixed(1) + '%)';
      e.lvl.textContent = p.lvl; e.gold.textContent = p.gold;
      for (const id in this.slots) {
        const s = this.slots[id], cd = g.combat.cd[id], max = g.combat.cdMax[id];
        s.cd.style.height = (cd > 0 ? (cd / max) * 100 : 0) + '%';
        s.cdt.textContent = cd > 0 ? (cd >= 1 ? Math.ceil(cd) : cd.toFixed(1)) : '';
        const lack = p.mp < G.SKILLS[id].mp;
        s.root.classList.toggle('nomp', lack && cd <= 0);
        s.root.classList.toggle('ready', !lack && cd <= 0);
      }
      this.updateBoss(dt);
      this.drawMinimap();
    }

    updateBoss(dt) {
      const b = this.game.boss, bar = this.el.bossBar; if (!b) return;
      const show = b.alive || b.state === 'dying';
      bar.classList.toggle('hidden', !show);
      if (!show) { this.bossDisp = 1; return; }
      const r = b.hp / b.maxHp; this.bossDisp = A.approach(this.bossDisp === undefined ? 1 : this.bossDisp, r, 8, dt);
      this.el.bossFill.style.width = (r * 100).toFixed(1) + '%'; this.el.bossGhost.style.width = (this.bossDisp * 100).toFixed(1) + '%';
      this.el.bossPhase.textContent = 'Phase ' + b.phase + ' / 3';
    }

    drawMinimap() {
      const g = this.game, c = this.mctx, W = this.el.mini.width, H = this.el.mini.height;
      const sx = W / g.level.width, sy = H / g.level.height;
      c.clearRect(0, 0, W, H);
      c.fillStyle = 'rgba(20,35,45,0.85)'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#7fd69a';
      for (const pl of g.level.platforms) c.fillRect(pl.x * sx, pl.y * sy, Math.max(2, pl.w * sx), pl === g.level.ground ? 6 : 2);
      for (const e of g.enemies) {
        if (!e.alive) continue;
        c.fillStyle = e.isBoss ? '#c06bff' : e.elite ? '#ffb02a' : '#ff5a5a'; c.beginPath(); c.arc(e.x * sx, (e.y - 6) * sy, e.isBoss ? 4 : 2.2, 0, Math.PI * 2); c.fill();
      }
      if (g.story && g.story.stage < 4) { c.fillStyle = 'rgba(190,110,255,0.9)'; c.fillRect(g.level.gateX * sx - 1, 0, 2, H); }
      for (const n of g.npcs) { c.fillStyle = '#7fe0ff'; c.beginPath(); c.arc(n.x * sx, (n.y - 8) * sy, 3, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1;
      c.strokeRect(g.camera.x * sx, 1, G.VW * sx, H - 2);
      const p = g.player; c.fillStyle = '#ffe14a'; c.strokeStyle = '#fff';
      c.beginPath(); c.arc(p.x * sx, (p.y - 8) * sy, 3.4, 0, Math.PI * 2); c.fill(); c.stroke();
    }
  }
  G.UI = UI;
})(window.Game = window.Game || {});
