/* NPC + Companion: story characters. Elder Orrin stands in the grove; Lumi (a Whisper spark) follows Wren. */
(function (G) {
  const A = G.Anim;

  class NPC {
    constructor(def) {
      this.id = def.id; this.name = def.name; this.x = def.x; this.y = def.y; this.img = def.img; this.scale = def.scale || 0.42;
      this.artFacesLeft = !!def.artFacesLeft; this.facing = def.facing || 1; this.t = Math.random() * 6; this.sx = 1; this.sy = 1; this.near = false;
    }
    update(dt, p) {
      this.t += dt;
      const dx = p.x - this.x; this.near = Math.abs(dx) < 95 && Math.abs(p.y - this.y) < 60 && !p.dead;
      if (Math.abs(dx) < 380) this.facing = dx >= 0 ? 1 : -1;
      const b = Math.sin(this.t * 2.2);
      this.sy = A.approach(this.sy, 1 + 0.02 * b, 8, dt); this.sx = A.approach(this.sx, 1 - 0.012 * b, 8, dt);
    }
    draw(ctx, camX, marker) {
      const img = A.images[this.img]; if (!img) return;
      const dw = img.width * this.scale, dh = img.height * this.scale, x = this.x - camX;
      ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#1a0f2a'; ctx.beginPath(); ctx.ellipse(x, this.y + 1, 30, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(x, this.y);
      ctx.scale(this.facing * (this.artFacesLeft ? -1 : 1), 1); ctx.scale(this.sx, this.sy);
      ctx.drawImage(img, -dw / 2, -dh, dw, dh); ctx.restore();
      // name plate + quest marker
      ctx.save(); ctx.textAlign = 'center';
      ctx.font = '800 13px "Trebuchet MS", sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#2a1a3a'; ctx.fillStyle = '#ffe9b0';
      const top = this.y - dh * 0.8;
      ctx.strokeText(this.name, x, top - 8); ctx.fillText(this.name, x, top - 8);
      if (marker) {
        const bob = Math.sin(this.t * 4) * 4;
        ctx.font = '900 34px "Trebuchet MS", sans-serif'; ctx.lineWidth = 6;
        ctx.strokeStyle = '#6b3a00'; ctx.fillStyle = marker === 'turnin' ? '#ffe96b' : '#fff7b0';
        const ch = marker === 'turnin' ? '?' : '!';
        ctx.strokeText(ch, x, top - 28 + bob); ctx.fillText(ch, x, top - 28 + bob);
      }
      if (this.near) {
        ctx.font = '800 14px "Trebuchet MS", sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#2a1a3a'; ctx.fillStyle = '#ffffff';
        const w = 170, y = this.y + 28;
        ctx.fillStyle = 'rgba(30,18,40,0.8)'; ctx.fillRect(x - w / 2, y - 14, w, 24);
        ctx.fillStyle = '#9ad8ff'; ctx.fillText('Press E to talk', x, y + 4);
      }
      ctx.restore();
    }
  }

  class Companion {
    constructor(player) {
      this.p = player; this.x = player.x - 40; this.y = player.y - 110; this.t = 0; this.say = null; this.q = []; this.seen = {}; this.trail = 0;
    }
    snap() { this.x = this.p.x - 40; this.y = this.p.y - 110; }
    speak(text, dur) { this.q.push({ text: text, dur: dur || 4 }); }
    tip(key, text, dur) { if (this.seen[key]) return; this.seen[key] = true; this.speak(text, dur); }
    update(dt, game) {
      const p = this.p; this.t += dt;
      const tx = p.x - p.facing * 52 + Math.sin(this.t * 1.3) * 18, ty = p.y - 108 + Math.sin(this.t * 2.1) * 12;
      this.x = A.approach(this.x, tx, 3.2, dt); this.y = A.approach(this.y, ty, 3.2, dt);
      if (this.say) { this.say.t += dt; if (this.say.t > this.say.dur) this.say = null; }
      else if (this.q.length) this.say = Object.assign({ t: 0 }, this.q.shift());
      this.trail -= dt;
      if (this.trail <= 0 && game) { this.trail = 0.09; game.fx.burst(this.x, this.y, { n: 1, colors: ['#fff3a0', '#bdf3ff'], speed: 24, life: 0.7, size: 3.5, grav: 20, glow: true }); }
    }
    draw(ctx, camX) {
      const x = this.x - camX, y = this.y, t = this.t, flap = Math.sin(t * 26);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      let g = ctx.createRadialGradient(x, y, 0, x, y, 46);
      g.addColorStop(0, 'rgba(255,248,190,0.95)'); g.addColorStop(0.3, 'rgba(255,225,120,0.45)'); g.addColorStop(1, 'rgba(255,200,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 46, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.65; ctx.fillStyle = '#d9f6ff';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * 12, y - 6, 12, 5 + Math.abs(flap) * 6, s * (-0.6 - flap * 0.25), 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      if (this.say) this.bubble(ctx, x, y - 34, this.say);
    }
    bubble(ctx, x, y, s) {
      const a = Math.min(1, s.t / 0.2, (s.dur - s.t) / 0.3);
      ctx.save(); ctx.globalAlpha = Math.max(0, a);
      ctx.font = '700 14px "Trebuchet MS", sans-serif';
      const words = s.text.split(' '), lines = []; let cur = '';
      for (const w of words) { if (ctx.measureText(cur + ' ' + w).width > 230) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
      lines.push(cur.trim());
      const bw = Math.min(250, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22), bh = lines.length * 18 + 14;
      let bx = Math.max(10, Math.min(G.VW - bw - 10, x - bw / 2)); const by = y - bh;
      ctx.fillStyle = 'rgba(255,250,225,0.96)'; ctx.strokeStyle = '#c9984a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4a3320'; ctx.textAlign = 'left';
      lines.forEach((l, i) => ctx.fillText(l, bx + 11, by + 20 + i * 18));
      ctx.fillStyle = '#c9984a'; ctx.font = '800 10px "Trebuchet MS", sans-serif'; ctx.fillText('Lumi', bx + bw - 34, by - 3);
      ctx.restore();
    }
  }
  G.NPC = NPC; G.Companion = Companion;
})(window.Game = window.Game || {});
