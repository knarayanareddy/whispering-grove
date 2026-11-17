/* Effects: particles, floating damage numbers, rings and slash arcs. */
(function (G) {
  const A = G.Anim;
  const TEXT_STYLES = {
    normal: { color: '#ffffff', size: 26, stroke: '#2a1a3a' },
    crit: { color: '#ffd93a', size: 40, stroke: '#7a2a00' },
    player: { color: '#ff6b6b', size: 28, stroke: '#3a0a0a' },
    heal: { color: '#7dffa0', size: 28, stroke: '#0b3a1a' },
    exp: { color: '#8fd0ff', size: 20, stroke: '#0b2a4a' },
    gold: { color: '#ffe27a', size: 20, stroke: '#4a3200' },
    info: { color: '#ffffff', size: 22, stroke: '#2a1a3a' },
    levelup: { color: '#ffe96b', size: 46, stroke: '#7a3a00' }
  };

  class Effects {
    constructor() { this.particles = []; this.texts = []; this.rings = []; this.slashes = []; }

    burst(x, y, o) {
      o = o || {};
      const n = o.n || 8, colors = o.colors || ['#ffffff'];
      for (let i = 0; i < n; i++) {
        if (this.particles.length > 700) break;
        const a = o.angle !== undefined ? o.angle + A.rand(-(o.spread || Math.PI), (o.spread || Math.PI)) : A.rand(0, Math.PI * 2);
        const sp = A.rand((o.speed || 220) * 0.4, o.speed || 220);
        this.particles.push({
          x: x + A.rand(-3, 3), y: y + A.rand(-3, 3),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0),
          life: 0, max: A.rand((o.life || 0.5) * 0.6, o.life || 0.5),
          size: A.rand((o.size || 5) * 0.6, o.size || 5), color: colors[i % colors.length],
          grav: o.grav === undefined ? 600 : o.grav, shape: o.shape || 'circle', glow: !!o.glow, drag: o.drag || 0
        });
      }
    }
    text(x, y, str, kind) {
      const st = TEXT_STYLES[kind] || TEXT_STYLES.normal;
      this.texts.push({ x: x, y: y, str: String(str), st: st, life: 0, max: kind === 'levelup' ? 1.8 : (kind === 'crit' ? 1.1 : 0.9), vy: kind === 'crit' ? 110 : 80 });
    }
    ring(x, y, maxR, color, life, width) {
      this.rings.push({ x: x, y: y, r: 0, max: maxR, color: color, life: 0, dur: life || 0.4, width: width || 6 });
    }
    slash(x, y, dir, range, heavy) {
      this.slashes.push({ x: x, y: y, dir: dir, range: range, heavy: !!heavy, life: 0, dur: heavy ? 0.28 : 0.2 });
    }

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life += dt;
        if (p.life >= p.max) { this.particles.splice(i, 1); continue; }
        p.vy += p.grav * dt;
        if (p.drag) { p.vx = A.approach(p.vx, 0, p.drag, dt); }
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i]; t.life += dt;
        if (t.life >= t.max) { this.texts.splice(i, 1); continue; }
        t.y -= t.vy * dt; t.vy = A.approach(t.vy, 18, 4, dt);
      }
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i]; r.life += dt;
        if (r.life >= r.dur) { this.rings.splice(i, 1); continue; }
        r.r = r.max * A.easeOutCubic(r.life / r.dur);
      }
      for (let i = this.slashes.length - 1; i >= 0; i--) {
        const s = this.slashes[i]; s.life += dt;
        if (s.life >= s.dur) this.slashes.splice(i, 1);
      }
    }

    drawWorld(ctx, camX) {
      // slashes
      for (const s of this.slashes) {
        const p = s.life / s.dur;
        const sweep = A.easeOutCubic(Math.min(1, p * 2.2));
        const a0 = -1.15, a1 = a0 + 2.3 * sweep;
        const R = s.range * 0.78;
        ctx.save();
        ctx.translate(s.x - camX, s.y); ctx.scale(s.dir, 1);
        ctx.globalAlpha = Math.max(0, 1 - p * p);
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, -R, R, R);
        g.addColorStop(0, s.heavy ? '#fff2a0' : '#ffffff');
        g.addColorStop(1, s.heavy ? '#ff9a3a' : '#7fd8ff');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, R, a0, a1, false);
        ctx.arc(0, 0, R * (s.heavy ? 0.55 : 0.68), a1, a0, true);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // rings
      for (const r of this.rings) {
        const p = r.life / r.dur;
        ctx.save();
        ctx.globalAlpha = 1 - p; ctx.strokeStyle = r.color; ctx.lineWidth = r.width * (1 - p) + 1;
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath(); ctx.ellipse(r.x - camX, r.y, r.r, r.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      // particles
      for (const p of this.particles) {
        const k = 1 - p.life / p.max;
        ctx.save();
        ctx.globalAlpha = Math.max(0, k);
        if (p.glow) ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color;
        const sz = p.size * (0.4 + 0.6 * k);
        const px = p.x - camX;
        if (p.shape === 'star') {
          ctx.translate(px, p.y); ctx.rotate(p.life * 6);
          ctx.beginPath();
          for (let i = 0; i < 8; i++) { const rr = i % 2 ? sz * 0.4 : sz * 1.4; const ang = i * Math.PI / 4; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
          ctx.closePath(); ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(px, p.y, sz, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }

    drawTexts(ctx, camX) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const t of this.texts) {
        const p = t.life / t.max;
        const pop = A.easeOutBack(Math.min(1, t.life / 0.16));
        const sc = Math.max(0.01, pop) * (t.st === TEXT_STYLES.crit ? 1 + 0.08 * Math.sin(t.life * 30) * (1 - p) : 1);
        ctx.save();
        ctx.globalAlpha = p > 0.7 ? Math.max(0, 1 - (p - 0.7) / 0.3) : 1;
        ctx.translate(t.x - camX, t.y); ctx.scale(sc, sc);
        ctx.font = '900 ' + t.st.size + 'px "Trebuchet MS", "Arial Black", sans-serif';
        ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.strokeStyle = t.st.stroke; ctx.strokeText(t.str, 0, 0);
        ctx.fillStyle = t.st.color; ctx.fillText(t.str, 0, 0);
        ctx.restore();
      }
    }
  }
  G.Effects = Effects;
})(window.Game = window.Game || {});
