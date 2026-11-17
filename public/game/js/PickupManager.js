/* PickupManager: EXP orbs and gold coins dropped by defeated enemies. Auto-collected on contact. */
(function (G) {
  const A = G.Anim;
  class PickupManager {
    constructor(level, player, fx, ui) {
      this.level = level; this.player = player; this.fx = fx; this.ui = ui; this.items = []; this.t = 0;
    }
    drop(e) {
      const exp = e.s.exp, g = Math.round(A.rand(e.s.gold[0], e.s.gold[1]));
      const parts = (total, n) => { const a = []; let left = total; for (let i = 0; i < n; i++) { const v = i === n - 1 ? left : Math.max(1, Math.floor(total / n)); a.push(v); left -= v; } return a; };
      const spawn = (type, value) => this.items.push({
        type: type, value: value, x: e.x + A.rand(-10, 10), y: e.cy,
        vx: A.rand(-150, 150), vy: A.rand(-520, -340), grounded: false, life: 0, phase: Math.random() * 6, magnet: false
      });
      parts(exp, 3).forEach(v => v > 0 && spawn('exp', v));
      parts(g, 2).forEach(v => v > 0 && spawn('gold', v));
    }
    update(dt) {
      this.t += dt; const p = this.player;
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i]; it.life += dt;
        if (it.life > 25) { this.items.splice(i, 1); continue; }
        const px = p.x, py = p.y - 35;
        const dx = px - it.x, dy = py - it.y, d = Math.hypot(dx, dy);
        if (!p.dead && it.life > 0.45 && d < 140) it.magnet = true;
        if (it.magnet && !p.dead) {
          const sp = A.clamp(300 + (140 - d) * 6, 300, 900);
          it.vx = A.approach(it.vx, dx / (d || 1) * sp, 10, dt); it.vy = A.approach(it.vy, dy / (d || 1) * sp, 10, dt);
          it.x += it.vx * dt; it.y += it.vy * dt; it.grounded = false;
        } else if (!it.grounded) {
          const prev = it.y; it.vy += 1500 * dt; it.y += it.vy * dt; it.x += it.vx * dt;
          it.vx = A.approach(it.vx, 0, 1.5, dt);
          if (it.vy > 0) { const pl = this.level.landOn(it.x - 6, it.x + 6, prev, it.y, false); if (pl) { it.y = pl.y - 8; it.vy = 0; it.grounded = true; } }
        }
        if (!p.dead && d < 34 && it.life > 0.3) { this.collect(it); this.items.splice(i, 1); }
      }
    }
    collect(it) {
      const p = this.player;
      if (it.type === 'exp') {
        const val = Math.round(it.value * p.expMul), lv = p.addExp(val);
        this.fx.text(p.x, p.y - 95, '+' + val + ' EXP' + (p.expMul > 1 ? ' x2' : ''), 'exp');
        this.fx.burst(p.x, p.y - 35, { n: 6, colors: ['#9ad8ff', '#fff'], speed: 160, life: 0.4, size: 4, grav: -50, glow: true });
        if (lv && G.onLevelUp) G.onLevelUp();
      } else {
        p.gold += it.value;
        this.fx.text(p.x, p.y - 80, '+' + it.value + ' Gold', 'gold');
        this.fx.burst(p.x, p.y - 35, { n: 5, colors: ['#ffe27a', '#fff6c0'], speed: 150, life: 0.4, size: 3, grav: 100, glow: true, shape: 'star' });
      }
    }
    draw(ctx, camX) {
      for (const it of this.items) {
        const bob = it.grounded ? Math.sin(this.t * 4 + it.phase) * 3 : 0;
        const x = it.x - camX, y = it.y + bob;
        if (it.life > 20 && Math.floor(it.life * 8) % 2) continue;
        ctx.save();
        if (it.type === 'exp') {
          const g = ctx.createRadialGradient(x, y, 0, x, y, 18);
          g.addColorStop(0, 'rgba(160,225,255,0.9)'); g.addColorStop(1, 'rgba(120,190,255,0)');
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#7fd0ff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2); ctx.fill();
        } else {
          const w = Math.abs(Math.cos(this.t * 5 + it.phase)) * 7 + 2;
          ctx.fillStyle = '#ffcf3a'; ctx.strokeStyle = '#a86a00'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(x, y, w, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.ellipse(x - w * 0.25, y - 2, Math.max(1, w * 0.3), 3, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }
  }
  G.PickupManager = PickupManager;
})(window.Game = window.Game || {});
