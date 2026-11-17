/* Level: platform layout, collision queries, parallax backgrounds and enemy spawn points. */
(function (G) {
  const A = G.Anim;
  const VW = 1280, VH = 720;

  class Level {
    constructor() {
      this.width = 2800; this.height = VH; this.groundY = 600;
      const P = G.Platform;
      this.ground = new P('ground', 0, 600, this.width, 120, true);
      const mk = (n, x, y, w) => new P(n, x, y, w, 46, false);
      this.platforms = [
        this.ground,
        mk('A', 240, 490, 460),
        mk('C', 520, 380, 400),
        mk('I', 880, 270, 360),
        mk('B', 800, 490, 520),
        mk('E', 1240, 380, 460),
        mk('D', 1600, 490, 520),
        mk('F', 1940, 380, 460),
        mk('G', 2300, 490, 420)
      ];
      const by = {}; this.platforms.forEach(p => by[p.name] = p);
      const b = (p, x1, x2) => ({ x1: x1 === undefined ? p.x : x1, x2: x2 === undefined ? p.x + p.w : x2, y: p.y });
      this.spawns = [
        { type: 'slime', bounds: b(this.ground, 380, 900) },
        { type: 'slime', bounds: b(by.A) },
        { type: 'mushroom', bounds: b(by.B) },
        { type: 'spirit', bounds: b(by.C) },
        { type: 'mushroom', bounds: b(this.ground, 1350, 1900) },
        { type: 'slime', bounds: b(by.D) },
        { type: 'spirit', bounds: b(by.F) },
        { type: 'mushroom', bounds: b(by.E) },
        { type: 'slime', bounds: b(this.ground, 2000, 2650) },
        { type: 'mushroom', bounds: b(by.G) }
      ];
      this.playerStart = { x: 160, y: 600 };
    }

    landOn(l, r, prevB, newB, ignoreOneWay) {
      let best = null;
      for (const p of this.platforms) {
        if (ignoreOneWay && p.oneWay) continue;
        if (r > p.x && l < p.x + p.w && prevB <= p.y + 0.5 && newB >= p.y) { if (!best || p.y < best.y) best = p; }
      }
      return best;
    }
    support(l, r, y, ignoreOneWay) {
      for (const p of this.platforms) {
        if (ignoreOneWay && p.oneWay) continue;
        if (Math.abs(p.y - y) <= 1.5 && r > p.x && l < p.x + p.w) return p;
      }
      return null;
    }

    /* ---------- rendering ---------- */
    tileLayer(ctx, img, camX, factor, drawH, bottomY, alpha) {
      if (!img) return;
      const s = drawH / img.height, w = img.width * s, off = camX * factor;
      ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      for (let i = Math.floor(off / w); i * w - off < VW; i++) {
        const x = Math.round(i * w - off);
        ctx.save();
        if (i % 2 !== 0) { ctx.translate(x + Math.ceil(w), 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, bottomY - drawH, Math.ceil(w), drawH); }
        else ctx.drawImage(img, x, bottomY - drawH, Math.ceil(w), drawH);
        ctx.restore();
      }
      ctx.restore();
    }

    drawBackground(ctx, camX, t) {
      const I = A.images;
      const prog = camX / (this.width - VW);
      if (I.bg_sky) ctx.drawImage(I.bg_sky, -prog * 120, -34, 1400, 788);
      else { ctx.fillStyle = '#9ad'; ctx.fillRect(0, 0, VW, VH); }
      // sun rays
      this.rays(ctx, camX, t);
      this.tileLayer(ctx, I.bg_mountains, camX, 0.12, 300, 480, 0.95);
      // atmospheric haze between layers
      let g = ctx.createLinearGradient(0, 260, 0, 500);
      g.addColorStop(0, 'rgba(220,200,255,0)'); g.addColorStop(1, 'rgba(235,215,255,0.35)');
      ctx.fillStyle = g; ctx.fillRect(0, 260, VW, 240);
      this.tileLayer(ctx, I.bg_trees, camX, 0.35, 330, 650, 1);
      g = ctx.createLinearGradient(0, 380, 0, 650);
      g.addColorStop(0, 'rgba(255,225,150,0)'); g.addColorStop(1, 'rgba(255,200,110,0.18)');
      ctx.fillStyle = g; ctx.fillRect(0, 380, VW, 270);
    }

    rays(ctx, camX, t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const bx = ((i * 420 - camX * 0.1) % 1700 + 1700) % 1700 - 200;
        const sway = Math.sin(t * 0.25 + i) * 20;
        const g = ctx.createLinearGradient(bx, 0, bx - 220, 650);
        g.addColorStop(0, 'rgba(255,235,160,0.20)'); g.addColorStop(1, 'rgba(255,235,160,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(bx + sway, 0); ctx.lineTo(bx + 90 + sway, 0); ctx.lineTo(bx - 190, 650); ctx.lineTo(bx - 330, 650); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    drawPlatforms(ctx, camX) { for (const p of this.platforms) p.draw(ctx, camX); }

    drawForeground(ctx, camX, t) {
      this.tileLayer(ctx, A.images.fg_grass, camX, 1.25, 80, 738, 1);
      // fireflies / floating spirits
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 36; i++) {
        const baseX = (i * 337.7) % 1500, baseY = 150 + (i * 91) % 430;
        const px = ((baseX - camX * (0.6 + (i % 3) * 0.2) + Math.sin(t * 0.5 + i) * 30) % 1500 + 1500) % 1500 - 100;
        const py = baseY + Math.sin(t * 0.8 + i * 2) * 22;
        const a = 0.35 + 0.35 * Math.sin(t * 2 + i * 1.7);
        const r = 2 + (i % 3);
        const g = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
        g.addColorStop(0, i % 4 === 0 ? 'rgba(170,240,255,' + a + ')' : 'rgba(255,240,150,' + a + ')');
        g.addColorStop(1, 'rgba(255,240,150,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r * 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      // soft vignette
      const v = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.45, VW / 2, VH / 2, VW * 0.65);
      v.addColorStop(0, 'rgba(40,20,60,0)'); v.addColorStop(1, 'rgba(40,20,60,0.28)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, VW, VH);
    }
  }
  G.Level = Level; G.VW = VW; G.VH = VH;
})(window.Game = window.Game || {});
