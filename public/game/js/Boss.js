/* Boss: Brambold, the Gloomcap Warden. Three phases, telegraphed attacks (swing, shockwave slam, spore rain, summons). */
(function (G) {
  const A = G.Anim;

  class Boss {
    constructor(def) {
      const D = G.Diff.cur;
      this.isBoss = true; this.type = 'boss'; this.b = def.bounds;
      this.w = 124; this.h = 150;
      this.s = { name: 'Brambold, Gloomcap Warden', scale: 0.42, lift: 0, exp: Math.round(260 * D.expMul), gold: [Math.round(120 * D.goldMul), Math.round(180 * D.goldMul)] };
      this.maxHp = Math.round(900 * D.bossHp); this.dmgMul = D.bossDmg; this.speedMul = D.speedMul;
      this.t = 0; this.hazards = []; this.resetFight();
    }
    resetFight() {
      const b = this.b;
      this.hp = this.maxHp; this.x = b.x2 - 120; this.y = b.y; this.vx = 0; this.facing = -1; this.state = 'sleep';
      this.phase = 1; this.flash = 0; this.at = 0; this.cooldown = 1.5; this.alpha = 1; this.sx = 1; this.sy = 1; this.rot = 0;
      this.atk = null; this.struck = false; this.summonTimer = 6; this.hazards = []; this.transition = 0; this.last = ''; this.deathT = 0;
    }
    get alive() { return this.state !== 'sleep' && this.state !== 'dying' && this.state !== 'gone'; }
    get active() { return this.alive; }
    get cx() { return this.x; }
    get cy() { return this.y - this.h / 2; }
    get top() { return this.y - this.h; }

    wake() { if (this.state === 'sleep') { this.state = 'roar'; this.at = 0; this.cooldown = 1.2; } }

    takeHit(dmg, dir, knock) {
      if (!this.alive) return false;
      this.hp -= dmg; this.flash = 0.1; this.vx += dir * knock * 0.1; this.sx = 1.06; this.sy = 0.95;
      if (this.hp <= 0) { this.hp = 0; this.state = 'dying'; this.deathT = 0; this.hazards = []; return true; }
      const ratio = this.hp / this.maxHp, np = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
      if (np > this.phase) { this.phase = np; this.state = 'roar'; this.at = 0; this.atk = null; this.cooldown = 0.8; this.summonTimer = 0.5; this.phaseUp = true; }
      return false;
    }

    hurt(game, dmg, fromX) { game.combat.hurtPlayer(Math.round(dmg * this.dmgMul), fromX, true); }

    pickAttack(adx) {
      const opts = [];
      if (adx < 190) opts.push('swing', 'swing');
      opts.push('slam');
      opts.push('spores');
      if (this.phase >= 2 && adx > 120) opts.push('spores');
      let a; do { a = opts[Math.floor(Math.random() * opts.length)]; } while (a === this.last && opts.length > 2 && Math.random() < 0.7);
      this.last = a; return a;
    }

    summon(game) {
      const alive = game.enemies.filter((e) => e.summoned && e.alive).length;
      if (alive >= 2) return;
      for (let i = 0; i < 2 - alive; i++) {
        const e = new G.Enemy({ type: 'slime', bounds: this.b }); e.summoned = true; e.noRespawn = true;
        e.x = A.clamp(this.x + (i ? 150 : -150), this.b.x1 + 40, this.b.x2 - 40); e.y = this.b.y; e.alpha = 0;
        game.enemies.push(e);
        game.fx.burst(e.x, e.y - 20, { n: 14, colors: ['#c39bff', '#fff', '#7a3bd0'], speed: 240, life: 0.6, size: 5, glow: true });
      }
      game.fx.text(this.x, this.top - 20, 'Blight Spawn!', 'info');
    }

    update(dt, p, game) {
      this.t += dt;
      const fx = game.fx;
      // hazards run even while the boss is down so waves finish naturally
      this.updateHazards(dt, p, game);
      if (this.state === 'sleep' || this.state === 'gone') return;
      if (this.state === 'dying') {
        this.deathT += dt; this.alpha = Math.max(0, 1 - this.deathT / 2); this.sy = A.approach(this.sy, 0.85, 2, dt); this.sx = A.approach(this.sx, 1.1, 2, dt);
        if (Math.random() < 0.5) fx.burst(this.x + A.rand(-50, 50), this.y - A.rand(10, 140), { n: 3, colors: ['#c39bff', '#fff', '#ffe27a'], speed: 180, life: 0.8, size: 5, grav: -80, glow: true, shape: 'star' });
        game.camera.addShake(3);
        if (this.alpha <= 0) this.state = 'gone';
        return;
      }
      this.flash = Math.max(0, this.flash - dt); this.cooldown -= dt; this.summonTimer -= dt;
      const dx = p.x - this.x, adx = Math.abs(dx), enr = this.phase === 3 ? 1.35 : this.phase === 2 ? 1.15 : 1;
      let target = 0, tsx = 1, tsy = 1, trot = 0;
      const b = this.b;
      if (this.state === 'roar') {
        this.at += dt; const k = this.at / 1.1;
        tsy = 1 + 0.1 * Math.sin(k * Math.PI); tsx = 1 - 0.05 * Math.sin(k * Math.PI);
        if (this.at < dt * 1.5) { fx.ring(this.x, this.y - 70, 380, this.phase === 3 ? '#ff6a8a' : '#c39bff', 0.9, 14); game.camera.addShake(8); if (this.phaseUp) fx.text(this.x, this.top - 30, this.phase === 3 ? 'ENRAGED!' : 'Spores Awaken!', 'crit'); }
        if (this.at >= 1.1) { this.state = 'idle'; this.phaseUp = false; if (this.phase >= 2 && this.summonTimer <= 0) { this.summon(game); this.summonTimer = 14; } }
      } else if (this.state === 'idle') {
        this.facing = dx >= 0 ? 1 : -1;
        if (adx > 110) target = this.facing * 62 * enr * this.speedMul;
        if (this.phase >= 2 && this.summonTimer <= 0) { this.summon(game); this.summonTimer = 14; }
        if (this.cooldown <= 0 && !p.dead) { this.atk = this.pickAttack(adx); this.state = 'windup'; this.at = 0; this.struck = false; }
      } else if (this.state === 'windup') {
        this.at += dt; const wind = ({ swing: 0.75, slam: 0.95, spores: 0.7 }[this.atk]) / enr;
        const k = A.clamp(this.at / wind, 0, 1);
        if (this.atk !== 'swing') this.facing = dx >= 0 ? 1 : -1;
        if (this.atk === 'slam') { tsy = 1.12 - 0.18 * k; tsx = 0.94 + 0.16 * k; trot = 0; }
        else if (this.atk === 'swing') { tsx = 1 + 0.1 * k; tsy = 1 - 0.1 * k; trot = -0.12 * k * this.facing * -1; }
        else { tsy = 1 + 0.12 * k; tsx = 1 - 0.06 * k; }
        if (this.at >= wind) this.strike(p, game);
      } else if (this.state === 'recover') {
        this.at += dt; if (this.at > 0.45 / enr) { this.state = 'idle'; this.cooldown = (this.phase === 1 ? 1.5 : this.phase === 2 ? 1.1 : 0.8); }
      }
      this.vx = A.approach(this.vx, target, 7, dt);
      this.x = A.clamp(this.x + this.vx * dt, b.x1 + this.w / 2, b.x2 - this.w / 2);
      this.sx = A.approach(this.sx, tsx, 12, dt); this.sy = A.approach(this.sy, tsy, 12, dt); this.rot = A.approach(this.rot, trot, 10, dt);
    }

    strike(p, game) {
      const fx = game.fx, f = this.facing;
      if (this.atk === 'swing') {
        this.sx = 0.88; this.sy = 1.14; game.camera.addShake(7);
        fx.burst(this.x + f * 95, this.y - 40, { n: 14, colors: ['#c39bff', '#fff', '#7a3bd0'], speed: 340, life: 0.4, size: 6, glow: true });
        fx.ring(this.x + f * 90, this.y - 20, 110, '#c39bff', 0.3, 10);
        const dx = (p.x - this.x) * f;
        if (dx > -20 && dx < 190 && Math.abs(p.y - this.y) < 90) this.hurt(game, 26, this.x);
      } else if (this.atk === 'slam') {
        this.sx = 1.2; this.sy = 0.82; game.camera.addShake(12);
        fx.ring(this.x, this.y - 6, 150, '#e8d0ff', 0.45, 12);
        fx.burst(this.x, this.y - 6, { n: 26, colors: ['#8b5a3a', '#c9b08a', '#c39bff'], speed: 340, life: 0.6, size: 6, grav: 600, angle: -Math.PI / 2, spread: 1.6 });
        const pairs = this.phase === 3 ? 2 : 1;
        for (let i = 0; i < pairs; i++) for (const d of [-1, 1]) this.hazards.push({ kind: 'wave', x: this.x + d * 70, y: this.y, dir: d, speed: 330 + i * 40, delay: i * 0.55, life: 0 });
        if (Math.abs(p.x - this.x) < 80 && p.y > this.y - 40) this.hurt(game, 22, this.x);
      } else if (this.atk === 'spores') {
        const n = this.phase === 1 ? 4 : this.phase === 2 ? 6 : 8;
        fx.burst(this.x, this.top, { n: 24, colors: ['#c39bff', '#fff', '#7a3bd0'], speed: 260, life: 0.6, size: 5, glow: true, angle: -Math.PI / 2, spread: 1.2 });
        for (let i = 0; i < n; i++) {
          const tx = i === 0 ? p.x : A.clamp(p.x + A.rand(-340, 340), this.b.x1 + 20, this.b.x2 - 20);
          this.hazards.push({ kind: 'spore', x: tx, y: this.b.y, delay: 0.3 + i * 0.16, fall: 0, life: 0, fuse: 1.0 });
        }
      }
      this.state = 'recover'; this.at = 0;
    }

    updateHazards(dt, p, game) {
      const fx = game.fx;
      for (let i = this.hazards.length - 1; i >= 0; i--) {
        const h = this.hazards[i]; h.life += dt;
        if (h.life < (h.delay || 0)) continue;
        if (h.kind === 'wave') {
          h.x += h.dir * h.speed * dt;
          if (Math.random() < 0.8) fx.burst(h.x, h.y - 4, { n: 1, colors: ['#c39bff', '#e8d0ff'], speed: 80, life: 0.35, size: 6, grav: -60, glow: true });
          if (!p.dead && Math.abs(p.x - h.x) < 26 && p.y > h.y - 34) { this.hurt(game, 16, h.x - h.dir * 10); h.dead = true; }
          if (h.x < this.b.x1 - 20 || h.x > this.b.x2 + 20 || h.dead) this.hazards.splice(i, 1);
        } else if (h.kind === 'spore') {
          h.fall += dt;
          if (h.fall >= h.fuse) {
            fx.ring(h.x, h.y - 4, 70, '#c39bff', 0.4, 9);
            fx.burst(h.x, h.y - 10, { n: 16, colors: ['#c39bff', '#fff', '#7a3bd0'], speed: 300, life: 0.5, size: 5, grav: 300, glow: true, angle: -Math.PI / 2, spread: 1.4 });
            game.camera.addShake(3);
            if (!p.dead && Math.abs(p.x - h.x) < 58 && p.y > h.y - 70) this.hurt(game, 15, h.x);
            this.hazards.splice(i, 1);
          }
        }
      }
    }

    draw(ctx, camX) {
      // ground telegraphs and hazards
      if (this.state === 'windup' && this.atk) this.drawTelegraph(ctx, camX);
      this.drawHazards(ctx, camX);
      if (this.state === 'sleep' || this.state === 'gone') return;
      const key = this.flash > 0 ? 'boss_gloomcap_hit' : (this.state === 'windup' && this.atk === 'slam') ? 'boss_gloomcap_slam' : (Math.abs(this.vx) > 8 ? 'boss_gloomcap_walk' : 'boss_gloomcap_idle');
      const img = A.images[key] || A.images.boss_gloomcap_idle; if (!img) return;
      const dw = img.width * this.s.scale, dh = img.height * this.s.scale, x = this.x - camX;
      ctx.save(); ctx.globalAlpha = 0.3 * this.alpha; ctx.fillStyle = '#1a0f2a'; ctx.beginPath(); ctx.ellipse(x, this.y + 2, 84, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      // aura
      if (this.alive) {
        const col = this.phase === 3 ? '255,90,130' : '170,110,255', pulse = 0.25 + 0.12 * Math.sin(this.t * 4 + this.phase);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(x, this.y - 80, 20, x, this.y - 80, 150 + this.phase * 15);
        g.addColorStop(0, 'rgba(' + col + ',' + pulse + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, this.y - 80, 170, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      const br = Math.sin(this.t * 2) * 0.012;
      ctx.save(); ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.translate(x, this.y); ctx.scale(this.facing, 1); ctx.rotate(this.rot); ctx.scale(this.sx * (1 - br), this.sy * (1 + br));
      ctx.drawImage(img, -dw / 2, -dh + 6, dw, dh); ctx.restore();
    }

    drawTelegraph(ctx, camX) {
      const x = this.x - camX, k = A.clamp(this.at / 0.8, 0, 1), a = 0.15 + 0.3 * k + 0.1 * Math.sin(this.t * 30);
      ctx.save(); ctx.fillStyle = 'rgba(255,60,90,' + a + ')';
      if (this.atk === 'swing') { ctx.beginPath(); ctx.moveTo(x, this.y); ctx.lineTo(x + this.facing * 190, this.y); ctx.lineTo(x + this.facing * 190, this.y - 110); ctx.lineTo(x, this.y - 110); ctx.fill(); }
      else if (this.atk === 'slam') { ctx.beginPath(); ctx.ellipse(x, this.y, 90 + 40 * k, 14, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ff5a6a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.font = '900 30px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
      ctx.strokeText('!', x, this.top - 6); ctx.fillText('!', x, this.top - 6);
      ctx.restore();
    }

    drawHazards(ctx, camX) {
      for (const h of this.hazards) {
        if (h.life < (h.delay || 0)) continue;
        const x = h.x - camX;
        if (h.kind === 'wave') {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createRadialGradient(x, h.y - 16, 0, x, h.y - 16, 38);
          g.addColorStop(0, 'rgba(240,220,255,0.95)'); g.addColorStop(0.5, 'rgba(170,110,255,0.7)'); g.addColorStop(1, 'rgba(120,60,220,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, h.y - 16, 30, 40, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else if (h.kind === 'spore') {
          const k = A.clamp(h.fall / h.fuse, 0, 1);
          ctx.save();
          ctx.fillStyle = 'rgba(190,90,255,' + (0.18 + 0.3 * k) + ')'; ctx.strokeStyle = 'rgba(240,200,255,0.85)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(x, h.y - 2, 58 * (0.4 + 0.6 * k), 11 * (0.4 + 0.6 * k), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          const sy = h.y - 360 * (1 - k * k);
          ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createRadialGradient(x, sy, 0, x, sy, 26);
          g.addColorStop(0, 'rgba(255,240,255,1)'); g.addColorStop(0.4, 'rgba(180,100,255,0.8)'); g.addColorStop(1, 'rgba(120,60,220,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, sy, 26, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
    }
  }
  G.Boss = Boss;
})(window.Game = window.Game || {});
