/* Level: built from a map definition (see Maps.js). Platforms, collision queries, parallax themes, hazards, wind, moving logs. */
(function (G) {
  const A = G.Anim;
  const VW = 1280, VH = 720;

  /* visual themes: sky gradient, glow, ambient particles. Art layers are recoloured variants of the generated PNGs. */
  const THEMES = {
    grove: { suffix: '', sky: ['#7fb8e6', '#f7d9a0', '#ffe6b0'], sun: '255,225,150', fx: 'fireflies', fxCol: '255,240,150', haze: '220,200,255', tint: null, vig: '40,20,60' },
    hub: { suffix: '', sky: ['#8cc4ee', '#fbd9a6', '#ffeec4'], sun: '255,230,170', fx: 'fireflies', fxCol: '255,246,190', haze: '225,205,255', tint: null, vig: '50,25,60' },
    marsh: { suffix: 'marsh', sky: ['#7aa9a8', '#b9cfb6', '#dfe6c6'], sun: '210,235,200', fx: 'mist', fxCol: '210,235,225', haze: '190,225,215', tint: 'rgba(60,110,100,0.12)', vig: '10,40,40' },
    sunken: { suffix: 'sunken', sky: ['#1b1838', '#2d2a5a', '#3f3c78'], sun: '140,150,255', fx: 'motes', fxCol: '150,190,255', haze: '90,90,170', tint: 'rgba(30,20,80,0.25)', vig: '5,5,30' },
    ember: { suffix: 'ember', sky: ['#5a2a3a', '#d4683a', '#ffc27a'], sun: '255,170,90', fx: 'embers', fxCol: '255,150,60', haze: '255,150,120', tint: 'rgba(120,30,0,0.12)', vig: '60,10,0' },
    cloud: { suffix: 'cloud', sky: ['#6fb4ff', '#c9e6ff', '#fff4e0'], sun: '255,255,220', fx: 'wind', fxCol: '255,255,255', haze: '255,255,255', tint: null, vig: '40,60,110' },
    heart: { suffix: 'heart', sky: ['#2b1c4a', '#a05a9a', '#ffd89a'], sun: '255,230,160', fx: 'petals', fxCol: '255,225,150', haze: '255,200,230', tint: 'rgba(255,200,120,0.08)', vig: '40,10,50' }
  };

  class Level {
    constructor(def) {
      const P = G.Platform;
      this.def = def; this.id = def.id; this.name = def.name; this.themeId = def.theme || 'grove'; this.theme = THEMES[this.themeId] || THEMES.grove;
      this.width = def.width; this.height = VH; this.groundY = 600; this.power = def.power || 1; this.town = !!def.town; this.t = 0;
      this.ground = new P('ground', 0, 600, this.width, 120, true); this.ground.imgName = 'platform_tile_' + this.theme.suffix;
      this.platforms = [this.ground]; this.byName = {};
      (def.platforms || []).forEach((d, i) => {
        const p = new P(d.n || ('p' + i), d.x, d.y, d.w, 46, false);
        p.imgName = 'platform_tile_' + this.theme.suffix;
        if (d.move) { p.move = d.move; p.phase = d.move.ph || 0; }
        if (d.bounce) { p.bounce = true; p.glow = true; }
        this.platforms.push(p); this.byName[p.name] = p;
      });
      this.byName.ground = this.ground;
      const bounds = (s) => {
        if (s.x1 !== undefined) return { x1: s.x1, x2: s.x2, y: (this.byName[s.on || 'ground']).y };
        const p = this.byName[s.on || 'ground']; return { x1: p.x + 10, x2: p.x + p.w - 10, y: p.y };
      };
      this.spawns = (def.spawns || []).map((s) => ({ type: s.type, bounds: bounds(s) }));
      this.playerStart = def.start || { x: 160, y: 600 };
      this.portals = def.portals || []; this.zones = def.zones || []; this.winds = def.winds || []; this.items = (def.items || []).map((i) => Object.assign({ taken: false, ph: Math.random() * 6 }, i));
      this.npcs = def.npcs || [];
      // Chapter 1 story layout (only the Whispering Grove defines these)
      this.gateX = def.gateX; this.arenaX = def.arenaX; this.bossSpawn = def.bossSpawn; this.motes = def.motes || [];
      this.checkpoint = def.checkpoint || null; this.checkpoint2 = def.checkpoint2 || null;
      this.boss = def.boss || null; // generic boss arena {id,x1,x2}
      this.chest = def.chest || null;
      this.seed = def.seed || 1;
    }

    /* moving logs / islands, hazard zones, wind */
    update(dt, p, game) {
      this.t += dt;
      for (const pl of this.platforms) {
        if (!pl.move) continue;
        const prev = pl.x; pl.phase += dt * pl.move.sp;
        pl.x = pl.x0 + Math.sin(pl.phase) * pl.move.ax; pl.dx = pl.x - prev;
        if (p.grounded && p.groundPlat === pl && !p.dead) p.x += pl.dx;
      }
      if (p.dead) return;
      for (const z of this.winds) if (p.x > z.x1 && p.x < z.x2 && !p.grounded) p.x += z.vx * dt;
      for (const z of this.zones) {
        const inside = p.x > z.x1 && p.x < z.x2 && p.grounded && p.groundPlat === this.ground;
        z.acc = inside ? (z.acc || 0) + dt : 0;
        if (z.acc >= 1) { z.acc = 0; game.combat.hurtPlayer(Math.max(1, Math.round(z.dmg * G.Diff.cur.dmgMul * (1 + (this.power - 1) * 0.3))), p.x + (Math.random() < 0.5 ? -1 : 1)); game.fx.text(p.x, p.y - 100, 'Scorched!', 'info'); }
      }
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
      const I = A.images, th = this.theme, sfx = th.suffix ? '_' + th.suffix : '';
      let g = ctx.createLinearGradient(0, 0, 0, 560);
      g.addColorStop(0, th.sky[0]); g.addColorStop(0.55, th.sky[1]); g.addColorStop(1, th.sky[2]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
      // sun / moon glow that drifts slowly with the camera
      const sx = 900 - (camX / Math.max(1, this.width - VW)) * 500;
      g = ctx.createRadialGradient(sx, 150, 10, sx, 150, 420);
      g.addColorStop(0, 'rgba(' + th.sun + ',0.75)'); g.addColorStop(1, 'rgba(' + th.sun + ',0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, 600);
      this.rays(ctx, camX, t);
      this.tileLayer(ctx, I['bg_mountains' + sfx] || I.bg_mountains, camX, 0.12, 300, 480, 0.95);
      g = ctx.createLinearGradient(0, 260, 0, 500);
      g.addColorStop(0, 'rgba(' + th.haze + ',0)'); g.addColorStop(1, 'rgba(' + th.haze + ',0.35)');
      ctx.fillStyle = g; ctx.fillRect(0, 260, VW, 240);
      this.tileLayer(ctx, I['bg_trees' + sfx] || I.bg_trees, camX, 0.35, 330, 650, 1);
      g = ctx.createLinearGradient(0, 380, 0, 650);
      g.addColorStop(0, 'rgba(255,225,150,0)'); g.addColorStop(1, 'rgba(' + th.sun + ',0.16)');
      ctx.fillStyle = g; ctx.fillRect(0, 380, VW, 270);
      if (th.tint) { ctx.fillStyle = th.tint; ctx.fillRect(0, 0, VW, VH); }
    }

    rays(ctx, camX, t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const bx = ((i * 420 - camX * 0.1) % 1700 + 1700) % 1700 - 200;
        const sway = Math.sin(t * 0.25 + i) * 20;
        const g = ctx.createLinearGradient(bx, 0, bx - 220, 650);
        g.addColorStop(0, 'rgba(' + this.theme.sun + ',0.20)'); g.addColorStop(1, 'rgba(' + this.theme.sun + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(bx + sway, 0); ctx.lineTo(bx + 90 + sway, 0); ctx.lineTo(bx - 190, 650); ctx.lineTo(bx - 330, 650); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    drawPlatforms(ctx, camX) {
      for (const p of this.platforms) {
        p.draw(ctx, camX);
        if (p.glow) { // bouncy cloud
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,' + (0.18 + 0.1 * Math.sin(this.t * 3)) + ')';
          ctx.fillRect(p.x - camX, p.y - 8, p.w, 10); ctx.restore();
        }
      }
      for (const z of this.zones) { // lava / scorched ground
        const x1 = z.x1 - camX; if (x1 > VW || z.x2 - camX < 0) continue;
        ctx.save(); const gr = ctx.createLinearGradient(0, 590, 0, 640);
        gr.addColorStop(0, 'rgba(255,230,120,0.95)'); gr.addColorStop(0.4, 'rgba(255,100,20,0.95)'); gr.addColorStop(1, 'rgba(140,20,0,0.95)');
        ctx.fillStyle = gr; ctx.fillRect(x1, 596, z.x2 - z.x1, 40);
        ctx.globalCompositeOperation = 'lighter';
        for (let x = z.x1; x < z.x2; x += 38) { const bx = x - camX + 10, by = 590 - Math.abs(Math.sin(this.t * 2 + x)) * 10; ctx.fillStyle = 'rgba(255,170,60,0.5)'; ctx.beginPath(); ctx.arc(bx, by, 6, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      for (const z of this.winds) { // visible gusts
        ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        for (let i = 0; i < 9; i++) {
          const wx = z.x1 + ((i * 97 + this.t * 140 * Math.sign(z.vx)) % (z.x2 - z.x1) + (z.x2 - z.x1)) % (z.x2 - z.x1) - camX, wy = 140 + i * 48;
          if (wx < -60 || wx > VW + 60) continue;
          ctx.beginPath(); ctx.moveTo(wx, wy); ctx.bezierCurveTo(wx + 20, wy - 8, wx + 40, wy + 8, wx + 60 * Math.sign(z.vx), wy); ctx.stroke();
        }
        ctx.restore();
      }
    }

    drawForeground(ctx, camX, t) {
      const th = this.theme, n = th.fx === 'mist' ? 14 : 36;
      ctx.save(); ctx.globalCompositeOperation = th.fx === 'mist' ? 'source-over' : 'lighter';
      for (let i = 0; i < n; i++) {
        const baseX = (i * 337.7) % 1500, baseY = 150 + (i * 91) % 430;
        let px = ((baseX - camX * (0.6 + (i % 3) * 0.2) + Math.sin(t * 0.5 + i) * 30) % 1500 + 1500) % 1500 - 100;
        let py = baseY + Math.sin(t * 0.8 + i * 2) * 22;
        const a = 0.35 + 0.35 * Math.sin(t * 2 + i * 1.7); let r = 2 + (i % 3);
        if (th.fx === 'embers') { py = ((baseY - t * (40 + (i % 5) * 18)) % 700 + 700) % 700; r = 1.5 + (i % 2); }
        else if (th.fx === 'wind' || th.fx === 'petals') { px = ((baseX - camX * 0.7 - t * (th.fx === 'wind' ? 120 : 40) + i * 40) % 1500 + 1500) % 1500 - 100; py = baseY + Math.sin(t * 1.4 + i) * 40 + (th.fx === 'petals' ? (t * 30 + i * 50) % 500 - 100 : 0); }
        else if (th.fx === 'mist') { r = 14 + (i % 4) * 6; }
        const rr = r * (th.fx === 'mist' ? 8 : 5);
        const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
        g.addColorStop(0, 'rgba(' + th.fxCol + ',' + (th.fx === 'mist' ? 0.1 : a) + ')'); g.addColorStop(1, 'rgba(' + th.fxCol + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      const v = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.45, VW / 2, VH / 2, VW * 0.65);
      v.addColorStop(0, 'rgba(' + th.vig + ',0)'); v.addColorStop(1, 'rgba(' + th.vig + ',0.3)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, VW, VH);
    }
  }
  G.Level = Level; G.VW = VW; G.VH = VH; G.THEMES = THEMES;
})(window.Game = window.Game || {});
