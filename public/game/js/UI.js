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
      const msg = (t) => this.chat(t, 'sys');
      $('btnInv').onclick = () => msg('Inventory: ' + game.player.gold + ' Gold, 0 items. Defeat monsters to collect loot.');
      $('btnSkills').onclick = () => msg('Skills: 1 Slash, 2 Fireball, 3 Heal, 4 Dash, 5 Nova. Ctrl or A to Attack.');
      $('btnQuests').onclick = () => msg('Quest: Clear the Grove - defeat monsters (' + game.player.kills + '/25).');
      $('btnMap').onclick = () => msg('Map: Whispering Grove. Monsters: Leaf Slime, Grumpy Shroom, Wisp Spirit.');
      $('btnMenu').onclick = () => { if (G.togglePause) G.togglePause(); };
      this.chat('Welcome to Whispering Grove!', 'sys');
      this.chat('Arrow keys to move, Space to jump (twice for a double jump).', 'sys');
      this.chat('Hold Down + Space to drop through platforms.', 'sys');
      this.chat('Ctrl or A to attack. Keys 1-5 cast skills.', 'sys');
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
      this.drawMinimap();
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
        c.fillStyle = '#ff5a5a'; c.beginPath(); c.arc(e.x * sx, (e.y - 6) * sy, 2.2, 0, Math.PI * 2); c.fill();
      }
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1;
      c.strokeRect(g.camera.x * sx, 1, G.VW * sx, H - 2);
      const p = g.player; c.fillStyle = '#ffe14a'; c.strokeStyle = '#fff';
      c.beginPath(); c.arc(p.x * sx, (p.y - 8) * sy, 3.4, 0, Math.PI * 2); c.fill(); c.stroke();
    }
  }
  G.UI = UI;
})(window.Game = window.Game || {});
