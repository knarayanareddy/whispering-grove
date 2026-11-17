/* Enemy: patrol / chase / attack AI that stays on its assigned platform. */
(function (G) {
  const A = G.Anim;
  const TYPES = {
    slime: { name: 'Leaf Slime', w: 54, h: 44, scale: 0.26, hp: 40, dmg: 8, range: 46, detect: 230, patrol: 45, chase: 105, exp: 12, gold: [3, 8], lift: 0 },
    mushroom: { name: 'Grumpy Shroom', w: 56, h: 58, scale: 0.32, hp: 75, dmg: 12, range: 52, detect: 260, patrol: 55, chase: 125, exp: 20, gold: [6, 14], lift: 0 },
    spirit: { name: 'Wisp Spirit', w: 50, h: 56, scale: 0.30, hp: 55, dmg: 10, range: 120, detect: 300, patrol: 70, chase: 110, exp: 16, gold: [4, 10], lift: 16 }
  };

  class Enemy {
    constructor(spawn) {
      this.type = spawn.type; this.base = TYPES[spawn.type]; this.s = this.base; this.b = spawn.bounds;
      this.w = this.s.w; this.h = this.s.h; this.maxHp = this.s.hp; this.elite = false; this.summoned = false; this.noRespawn = false;
      this.cycler = new A.FrameCycler(['idle', 'walk'], 5);
      this.t = Math.random() * 10;
      this.reset(true);
    }
    /* difficulty + elite scaling, re-rolled on every (re)spawn */
    rollStats() {
      const D = G.Diff.cur, base = this.base;
      this.elite = Math.random() < D.eliteChance;
      const e = this.elite, k = e ? 1.25 : 1, s = Object.assign({}, base);
      s.name = (e ? 'Elite ' : '') + base.name;
      s.hp = Math.round(base.hp * D.hpMul * (e ? 2.4 : 1));
      s.dmg = Math.round(base.dmg * D.dmgMul * (e ? 1.4 : 1));
      s.detect = base.detect * D.detectMul; s.patrol = base.patrol * D.speedMul; s.chase = base.chase * D.speedMul;
      s.exp = Math.round(base.exp * D.expMul * (e ? 2.5 : 1));
      s.gold = [Math.round(base.gold[0] * D.goldMul * (e ? 2 : 1)), Math.round(base.gold[1] * D.goldMul * (e ? 2 : 1))];
      s.w = Math.round(base.w * k); s.h = Math.round(base.h * k); s.scale = base.scale * k;
      this.s = s; this.w = s.w; this.h = s.h; this.maxHp = s.hp;
    }
    reset(first) {
      this.rollStats();
      const b = this.b;
      this.x = A.rand(b.x1 + this.w, Math.max(b.x1 + this.w, b.x2 - this.w)); this.y = b.y;
      this.hp = this.maxHp; this.vx = 0; this.facing = Math.random() < 0.5 ? -1 : 1; this.dir = this.facing;
      this.state = 'patrol'; this.flash = 0; this.stun = 0; this.cooldown = 0.5; this.wait = 0; this.at = 0; this.struck = false;
      this.alpha = first ? 1 : 0; this.sx = 1; this.sy = 1; this.rot = 0; this.respawn = 0;
    }
    get alive() { return this.state !== 'dying' && this.state !== 'gone'; }
    get cx() { return this.x; }
    get cy() { return this.y - this.s.lift - this.h / 2; }
    get top() { return this.y - this.s.lift - this.h; }

    takeHit(dmg, dir, knock) {
      if (!this.alive) return false;
      this.hp -= dmg; this.flash = 0.16; this.stun = 0.28; this.vx = dir * knock;
      this.sx = 1.3; this.sy = 0.75;
      if (this.hp <= 0) { this.hp = 0; this.state = 'dying'; this.alpha = 1; return true; }
      if (this.state === 'attack') { this.state = 'chase'; this.cooldown = 0.7; }
      else if (this.state === 'patrol') this.state = 'chase';
      return false;
    }

    update(dt, p, game) {
      const A_ = A; this.t += dt;
      if (this.state === 'gone') { if (this.noRespawn) { this.remove = true; return; } this.respawn -= dt; if (this.respawn <= 0) this.reset(false); return; }
      if (this.state === 'dying') {
        this.alpha -= dt / 0.9; this.vx = A_.approach(this.vx, 0, 5, dt); this.x += this.vx * dt;
        this.sy = A_.approach(this.sy, 0.6, 3, dt); this.sx = A_.approach(this.sx, 1.2, 3, dt); this.rot += dt * 2 * this.facing * -1;
        if (this.alpha <= 0) { this.state = 'gone'; this.respawn = 14; }
        return;
      }
      this.flash = Math.max(0, this.flash - dt); this.stun -= dt; this.cooldown -= dt;
      if (this.alpha < 1) this.alpha = Math.min(1, this.alpha + dt * 1.6);
      const s = this.s, b = this.b;
      const dx = p.x - this.x, dy = p.y - this.y, adx = Math.abs(dx);
      const canSee = !p.dead && adx < s.detect && Math.abs(dy) < 75;
      let target = 0;
      let tsx = 1, tsy = 1, trot = 0;

      if (this.stun > 0) { /* staggered */ }
      else if (this.state === 'patrol') {
        if (canSee) { this.state = 'chase'; game.fx.text(this.x, this.top - 14, '!', 'crit'); }
        else if (this.wait > 0) this.wait -= dt;
        else {
          target = this.dir * s.patrol; this.facing = this.dir;
          const nx = this.x + this.dir * (this.w / 2 + 4);
          if (nx >= b.x2 || nx <= b.x1) { this.dir *= -1; this.wait = 0.4 + Math.random() * 0.9; }
        }
      } else if (this.state === 'chase') {
        if (p.dead || Math.abs(dy) > 130 || adx > s.detect * 1.5) { this.state = 'patrol'; this.dir = this.facing; }
        else {
          this.facing = dx >= 0 ? 1 : -1;
          if (adx > s.range * 0.75) {
            target = this.facing * s.chase;
            const nx = this.x + this.facing * (this.w / 2 + 4);
            if (nx >= b.x2 || nx <= b.x1) target = 0; // never walk off the platform
          }
          if (adx <= s.range + p.w / 2 && Math.abs(dy) < 70 && this.cooldown <= 0) { this.state = 'attack'; this.at = 0; this.struck = false; }
        }
      } else if (this.state === 'attack') {
        this.at += dt; this.facing = dx >= 0 ? 1 : -1;
        const wind = 0.5;
        if (this.at < wind) { const k = this.at / wind; tsx = 1 + 0.14 * k; tsy = 1 - 0.14 * k; trot = -0.18 * k; }
        else if (!this.struck) {
          this.struck = true; this.sx = 0.86; this.sy = 1.18;
          if (this.type === 'spirit') game.fx.ring(this.x, this.y - 30, s.range, '#b8f0ff', 0.35, 7);
          else { this.vx = this.facing * 230; game.fx.burst(this.x + this.facing * 30, this.cy, { n: 5, colors: ['#fff', '#ffe9a0'], speed: 160, life: 0.25, size: 4, grav: 0, glow: true }); }
          if (adx < s.range + p.w / 2 && Math.abs(dy) < (this.type === 'spirit' ? 95 : 70)) game.combat.hurtPlayer(s.dmg + Math.floor(Math.random() * 4), this.x);
        }
        if (this.at >= wind + 0.35) { this.state = 'chase'; this.cooldown = 1.2; }
      }

      this.vx = A_.approach(this.vx, target, this.stun > 0 ? 4 : 9, dt);
      this.x = A_.clamp(this.x + this.vx * dt, b.x1 + this.w / 2, b.x2 - this.w / 2);
      this.sx = A_.approach(this.sx, tsx, 14, dt); this.sy = A_.approach(this.sy, tsy, 14, dt);
      this.rot = A_.approach(this.rot, trot, 12, dt);
      this.cycler.update(dt, Math.abs(this.vx) > 8 ? Math.abs(this.vx) / 60 + 0.4 : 0);
    }

    draw(ctx, camX) {
      if (this.state === 'gone') return;
      const s = this.s;
      let suffix = this.flash > 0 ? 'hit' : (Math.abs(this.vx) > 8 ? this.cycler.frame : 'idle');
      const img = A.images['enemy_' + this.type + '_' + suffix]; if (!img) return;
      const dw = img.width * s.scale, dh = img.height * s.scale;
      const hover = s.lift ? s.lift + Math.sin(this.t * 3) * 5 : 0;
      const br = this.state === 'attack' ? 0 : Math.sin(this.t * 3.2) * 0.025;
      if (this.elite && this.alive) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const ex = this.x - camX, ey = this.cy, pul = 0.3 + 0.12 * Math.sin(this.t * 5);
        const eg = ctx.createRadialGradient(ex, ey, 6, ex, ey, this.w * 1.1);
        eg.addColorStop(0, 'rgba(255,200,90,' + pul + ')'); eg.addColorStop(1, 'rgba(255,120,200,0)');
        ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(ex, ey, this.w * 1.1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha) * (this.type === 'spirit' ? 0.92 : 1);
      if (!hover) { ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillStyle = '#1a0f2a'; ctx.beginPath(); ctx.ellipse(this.x - camX, this.y + 1, this.w * 0.5, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      ctx.translate(this.x - camX, this.y - hover);
      ctx.scale(this.facing, 1); ctx.rotate(this.rot); ctx.scale(this.sx * (1 - br), this.sy * (1 + br));
      ctx.drawImage(img, -dw / 2, -dh, dw, dh);
      ctx.restore();
      if (this.alive && this.state === 'attack' && this.at < 0.5) {
        ctx.save(); ctx.fillStyle = '#ff4a4a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.font = '900 24px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
        ctx.strokeText('!', this.x - camX, this.top - 8); ctx.fillText('!', this.x - camX, this.top - 8); ctx.restore();
      }
      if (this.alive && this.elite) {
        ctx.save(); ctx.textAlign = 'center'; ctx.font = '800 11px "Trebuchet MS", sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = '#4a2a00'; ctx.fillStyle = '#ffd96b';
        ctx.strokeText('ELITE', this.x - camX, this.top - 24); ctx.fillText('ELITE', this.x - camX, this.top - 24); ctx.restore();
      }
      if (this.alive && this.hp < this.maxHp) {
        const bw = 46, bx = this.x - camX - bw / 2, by = this.top - 16;
        ctx.save(); ctx.fillStyle = 'rgba(30,15,40,0.8)'; ctx.fillRect(bx - 2, by - 2, bw + 4, 9);
        ctx.fillStyle = '#ff5a6a'; ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), 5); ctx.restore();
      }
    }
  }
  G.Enemy = Enemy; G.ENEMY_TYPES = TYPES;
})(window.Game = window.Game || {});
