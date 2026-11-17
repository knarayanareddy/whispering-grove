/* Boons: temporary power-ups dropped by monsters. Pick them up to gain timed buffs, shields or instant heals. */
(function (G) {
  const A = G.Anim;
  const BOONS = {
    sunpetal: { name: 'Sunpetal', desc: '+40% damage', dur: 18, color: '#ffb347', glow: '#ffe2a0' },
    windleaf: { name: 'Windleaf', desc: '+30% speed, higher jumps', dur: 18, color: '#6dffb0', glow: '#d2ffe6' },
    moonberry: { name: 'Moonberry', desc: 'Skills cost half MP, fast MP regen', dur: 18, color: '#8ab4ff', glow: '#d4e4ff' },
    bloom: { name: 'Bloom Shield', desc: 'Absorbs 60 damage', dur: 25, color: '#ff9ad8', glow: '#ffd9f0' },
    clover: { name: 'Lucky Clover', desc: 'Double EXP gain', dur: 25, color: '#b6ff5a', glow: '#ecffc4' },
    heartseed: { name: 'Heartseed', desc: 'Restores 35% HP', dur: 0, color: '#ff6b81', glow: '#ffd0d8' }
  };
  const IDS = Object.keys(BOONS);
  const SHIELD = 60;

  class BoonManager {
    constructor(level, player, fx, ui) {
      this.level = level; this.p = player; this.fx = fx; this.ui = ui;
      this.items = []; this.active = {}; this.t = 0; this.collected = 0;
      this.hud = document.getElementById('buffs'); this.chips = {};
      if (this.hud) this.hud.innerHTML = '';
    }

    /* ---- drops ---- */
    pickId() {
      const p = this.p, w = { sunpetal: 3, windleaf: 3, moonberry: 3, bloom: 2, clover: 2, heartseed: p.hp < p.maxHp * 0.5 ? 6 : 2 };
      let total = 0; for (const k in w) total += w[k];
      let r = Math.random() * total;
      for (const k in w) { r -= w[k]; if (r <= 0) return k; }
      return 'sunpetal';
    }
    maybeDrop(e) {
      const D = G.Diff.cur;
      const chance = e.elite ? 1 : D.dropChance;
      if (Math.random() < chance) this.spawn(this.pickId(), e.x, e.cy);
    }
    spawn(id, x, y) {
      this.items.push({ id: id, x: x, y: y, vx: A.rand(-90, 90), vy: -460, life: 0, grounded: false, phase: Math.random() * 6 });
    }
    grant(id) { this.apply(id, true); }

    /* ---- effects ---- */
    apply(id, silent) {
      const b = BOONS[id], p = this.p; if (!b) return;
      this.collected++;
      this.fx.text(p.x, p.y - 112, b.name + '!', 'boon');
      this.fx.ring(p.x, p.y - 30, 90, b.color, 0.55, 8);
      this.fx.burst(p.x, p.y - 36, { n: 18, colors: [b.color, b.glow, '#fff'], speed: 260, life: 0.8, size: 5, grav: -40, glow: true, shape: 'star' });
      if (id === 'heartseed') {
        const amt = Math.round(p.maxHp * 0.35); p.heal(amt); this.fx.text(p.x, p.y - 90, '+' + amt, 'heal');
      } else {
        this.active[id] = b.dur;
        if (id === 'bloom') p.shield = SHIELD;
      }
      if (this.ui && !silent) this.ui.chat(b.name + ': ' + b.desc + '.', 'good');
      else if (this.ui) this.ui.chat('You received ' + b.name + ': ' + b.desc + '.', 'good');
    }

    recalc() {
      const a = this.active, p = this.p;
      p.dmgMul = a.sunpetal > 0 ? 1.4 : 1;
      p.speedMul = a.windleaf > 0 ? 1.3 : 1;
      p.jumpMul = a.windleaf > 0 ? 1.12 : 1;
      p.mpCostMul = a.moonberry > 0 ? 0.5 : 1;
      p.mpRegenMul = a.moonberry > 0 ? 4 : 1;
      p.expMul = a.clover > 0 ? 2 : 1;
      if (!(a.bloom > 0)) p.shield = 0;
      else if (p.shield <= 0) { delete a.bloom; }
    }
    clear() { this.active = {}; this.recalc(); }

    update(dt) {
      this.t += dt; const p = this.p;
      for (const k in this.active) { this.active[k] -= dt; if (this.active[k] <= 0) delete this.active[k]; }
      this.recalc();
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i]; it.life += dt;
        if (it.life > 22) { this.items.splice(i, 1); continue; }
        if (!it.grounded) {
          const prev = it.y; it.vy += 1300 * dt; it.y += it.vy * dt; it.x += it.vx * dt; it.vx = A.approach(it.vx, 0, 2, dt);
          if (it.vy > 0) { const pl = this.level.landOn(it.x - 6, it.x + 6, prev, it.y, false); if (pl) { it.y = pl.y - 22; it.vy = 0; it.grounded = true; } }
        }
        const dx = p.x - it.x, dy = (p.y - 36) - it.y;
        if (!p.dead && it.life > 0.5 && Math.hypot(dx, dy) < 40) { this.apply(it.id); this.items.splice(i, 1); }
      }
      this.updateHud();
    }

    updateHud() {
      if (!this.hud) return;
      for (const id in this.active) {
        if (!this.chips[id]) {
          const b = BOONS[id], d = document.createElement('div'); d.className = 'chip'; d.style.setProperty('--c', b.color);
          d.innerHTML = '<span class="cn">' + b.name + '</span><span class="ct"></span><div class="cbar"><i></i></div>';
          this.hud.appendChild(d); this.chips[id] = d;
        }
        const c = this.chips[id], b = BOONS[id];
        c.querySelector('.ct').textContent = id === 'bloom' ? Math.ceil(this.p.shield) + ' HP' : Math.ceil(this.active[id]) + 's';
        c.querySelector('i').style.width = (this.active[id] / b.dur * 100) + '%';
      }
      for (const id in this.chips) if (!(id in this.active)) { this.chips[id].remove(); delete this.chips[id]; }
    }

    draw(ctx, camX) {
      for (const it of this.items) {
        const b = BOONS[it.id], bob = it.grounded ? Math.sin(this.t * 3 + it.phase) * 5 : 0;
        const x = it.x - camX, y = it.y + bob;
        if (it.life > 18 && Math.floor(it.life * 8) % 2) continue;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(x, y, 0, x, y, 34);
        g.addColorStop(0, b.color + 'cc'); g.addColorStop(1, b.color + '00');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        // petals
        ctx.translate(x, y); ctx.rotate(this.t * 0.8 + it.phase);
        ctx.fillStyle = b.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        for (let k = 0; k < 5; k++) {
          ctx.rotate(Math.PI * 2 / 5);
          ctx.beginPath(); ctx.ellipse(0, -9, 5, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = b.glow; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.textAlign = 'center'; ctx.font = '800 12px "Trebuchet MS", sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#2a1a3a'; ctx.fillStyle = b.glow;
        ctx.strokeText(b.name, x, y - 28); ctx.fillText(b.name, x, y - 28); ctx.restore();
      }
    }
  }
  G.BoonManager = BoonManager; G.BOONS = BOONS;
})(window.Game = window.Game || {});
