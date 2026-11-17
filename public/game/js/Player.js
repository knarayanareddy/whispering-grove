/* Player: movement physics, state machine and interpolated sprite animation. */
(function (G) {
  const A = G.Anim;
  const MAXSPEED = 310, GRAV = 2300, JUMP = -830, DJUMP = -690, MAXFALL = 1150;
  const SCALE = 0.24;

  class Player {
    constructor(level) {
      this.level = level;
      this.w = 34; this.h = 70;
      this.x = level.playerStart.x; this.y = level.playerStart.y;
      this.vx = 0; this.vy = 0; this.facing = 1;
      this.grounded = true; this.groundPlat = level.ground; this.jumpsUsed = 0;
      this.coyote = 0; this.jumpBuf = 0; this.dropTimer = 0; this.dblTimer = 0; this.dashTimer = 0;
      this.state = 'idle'; this.stateTime = 0;
      // stats (deliberately NOT full at start)
      this.lvl = 1; this.maxHp = 120; this.hp = 72; this.maxMp = 60; this.mp = 38;
      this.exp = 12; this.expNext = 50; this.gold = 0; this.kills = 0; this.deaths = 0;
      // story/boon modifiers
      this.limitMin = 0; this.limitMax = Infinity; this.shield = 0; this.dmgMul = 1; this.speedMul = 1; this.jumpMul = 1; this.mpCostMul = 1; this.mpRegenMul = 1; this.expMul = 1;
      this.action = null; this.hitTimer = 0; this.invuln = 0; this.dead = false; this.deadTimer = 0;
      // visual interpolation values
      this.sx = 1; this.sy = 1; this.rot = 0; this.offX = 0; this.alpha = 1; this.wasDouble = false;
      this.walk = new A.FrameCycler(['player_walk_01', 'player_idle', 'player_walk_02', 'player_idle'], 9);
      this.t = 0;
    }

    get atk() { return (8 + this.lvl * 3) * this.dmgMul * G.Diff.cur.playerDmg; }

    addExp(n) {
      this.exp += n; let leveled = false;
      while (this.exp >= this.expNext) {
        this.exp -= this.expNext; this.lvl++; leveled = true;
        this.expNext = Math.floor(this.expNext * 1.35 + 10);
        this.maxHp += 20; this.maxMp += 8; this.hp = this.maxHp; this.mp = this.maxMp;
      }
      return leveled;
    }

    heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }

    takeDamage(dmg, fromX) {
      if (this.dead || this.invuln > 0 || this.dashTimer > 0) return false;
      this.lastTaken = dmg;
      if (this.shield > 0) { // Bloom Shield soaks damage first
        const soak = Math.min(this.shield, dmg); this.shield -= soak; dmg -= soak; this.lastTaken = dmg;
        if (dmg <= 0) { this.invuln = 0.6; this.sx = 1.12; this.sy = 0.9; return true; }
      }
      this.hp -= dmg; this.hitTimer = 0.38; this.invuln = 1.2; this.action = null;
      const dir = this.x < fromX ? -1 : 1;
      this.vx = dir * 280; this.vy = -380; this.grounded = false; this.groundPlat = null;
      this.jumpsUsed = Math.max(this.jumpsUsed, 1);
      this.sx = 0.8; this.sy = 1.2;
      if (this.hp <= 0) { this.hp = 0; this.dead = true; this.deadTimer = 2.4; this.vy = -520; this.vx = dir * 160; }
      return true;
    }

    respawn() {
      const D = G.Diff.cur, cp = this.level.checkpoint || this.level.playerStart;
      this.dead = false; this.hp = Math.max(1, Math.round(this.maxHp * D.respawnHp)); this.mp = Math.round(this.maxMp * 0.5); this.deaths++;
      this.x = cp.x; this.y = cp.y; this.shield = 0; this.vx = this.vy = 0;
      this.grounded = true; this.groundPlat = this.level.ground; this.invuln = 2; this.rot = 0; this.alpha = 1;
      this.gold = Math.floor(this.gold * (1 - D.deathGoldLoss));
      if (G.onRespawn) G.onRespawn();
    }

    doJump(fx) {
      this.vy = JUMP * this.jumpMul; this.grounded = false; this.groundPlat = null; this.jumpsUsed = 1; this.coyote = 0; this.jumpBuf = 0;
      this.sx = 0.78; this.sy = 1.28;
      fx.burst(this.x, this.y, { n: 6, colors: ['#efe3c2', '#cdbd95'], speed: 120, life: 0.35, size: 4, grav: 80, up: 20 });
    }
    doDouble(fx, dir) {
      this.vy = DJUMP * this.jumpMul; this.jumpsUsed = 2; this.dblTimer = 0.42;
      if (dir) this.vx = A.clamp(this.vx + dir * 90, -MAXSPEED * 1.1, MAXSPEED * 1.1);
      this.sx = 0.85; this.sy = 1.2;
      fx.burst(this.x, this.y - 8, { n: 14, colors: ['#bdf3ff', '#ffffff', '#fff3a0'], speed: 240, life: 0.5, size: 5, grav: 150, shape: 'star', glow: true, angle: Math.PI / 2, spread: 1.2 });
      fx.ring(this.x, this.y - 4, 55, '#aef0ff', 0.35, 5);
    }
    land(p, impact, fx) {
      this.grounded = true; this.groundPlat = p; this.jumpsUsed = 0; this.vy = 0; this.dblTimer = 0;
      if (impact > 250) {
        const k = A.clamp(impact / 2600, 0.08, 0.3);
        this.sx = 1 + k; this.sy = 1 - k;
        fx.burst(this.x, this.y, { n: 8, colors: ['#efe3c2', '#cdbd95'], speed: 170, life: 0.4, size: 4, grav: 100, up: 30, angle: -Math.PI / 2, spread: 1.5 });
      }
    }

    update(dt, input, fx) {
      const level = this.level;
      this.t += dt; this.stateTime += dt;
      this.hitTimer = Math.max(0, this.hitTimer - dt); this.invuln = Math.max(0, this.invuln - dt);
      this.dropTimer = Math.max(0, this.dropTimer - dt); this.dblTimer = Math.max(0, this.dblTimer - dt);
      this.jumpBuf = Math.max(0, this.jumpBuf - dt);

      if (this.dead) {
        this.deadTimer -= dt; this.vx = A.approach(this.vx, 0, 5, dt);
        this.physics(dt, fx);
        this.animate(dt);
        if (this.deadTimer <= 0) this.respawn();
        return;
      }

      this.mp = Math.min(this.maxMp, this.mp + 2.4 * this.mpRegenMul * dt);
      this.hp = Math.min(this.maxHp, this.hp + 0.5 * G.Diff.cur.regenMul * dt);

      const left = input.isDown('ArrowLeft'), right = input.isDown('ArrowRight');
      let dir = (right ? 1 : 0) - (left ? 1 : 0);
      const stunned = this.hitTimer > 0, acting = !!this.action;
      if (stunned) dir = 0;

      if (this.dashTimer > 0) {
        this.dashTimer -= dt;
        this.vx = A.approach(this.vx, this.facing * 820, 30, dt);
      } else if (stunned) {
        this.vx = A.approach(this.vx, 0, 3, dt);
      } else {
        const cap = MAXSPEED * this.speedMul * (acting && this.grounded ? 0.2 : 1);
        const target = dir * cap;
        let acc;
        if (dir !== 0) { acc = this.grounded ? 2800 : 1900; if (this.grounded && Math.sign(this.vx) === -dir) acc = 4200; }
        else acc = this.grounded ? 3000 : 500;
        this.vx = A.moveToward(this.vx, target, acc * dt);
        if (dir !== 0 && !acting) this.facing = dir;
      }

      // jumping
      if (input.pressed('Space') && !stunned) {
        const down = input.isDown('ArrowDown');
        if (down && this.grounded && this.groundPlat && this.groundPlat.oneWay) {
          this.dropTimer = 0.18; this.grounded = false; this.groundPlat = null; this.vy = 140; this.coyote = 0;
          this.jumpsUsed = 0; this.sy = 0.9; this.sx = 1.08;
        } else if (down && this.grounded) {
          /* solid ground: nothing to drop through */
        } else if (this.grounded || this.coyote > 0) this.doJump(fx);
        else if (this.jumpsUsed < 2) this.doDouble(fx, dir);
        else this.jumpBuf = 0.12;
      }

      if (!this.grounded) {
        this.coyote -= dt;
        if (this.coyote <= 0 && this.jumpsUsed === 0 && this.dropTimer <= 0) this.jumpsUsed = 1;
      }

      this.physics(dt, fx);

      // state machine
      let st;
      if (this.hitTimer > 0) st = 'hit';
      else if (this.action) st = this.action.skill === 'basic' ? 'attacking' : 'skillCasting';
      else if (!this.grounded) st = this.vy < 0 ? (this.dblTimer > 0 ? 'doubleJumping' : 'jumping') : 'falling';
      else st = Math.abs(this.vx) > 25 ? 'walking' : 'idle';
      if (st !== this.state) { this.state = st; this.stateTime = 0; }
      this.animate(dt);
    }

    physics(dt, fx) {
      const l = this.x - this.w / 2 + 4, r = this.x + this.w / 2 - 4;
      const prevB = this.y;
      this.vy = Math.min(MAXFALL, this.vy + (this.vy > 0 ? GRAV * 1.15 : GRAV) * dt);
      if (this.grounded) {
        const sup = this.level.support(l, r, this.y, this.dropTimer > 0);
        if (!sup) { this.grounded = false; this.groundPlat = null; this.coyote = 0.09; }
        else { this.vy = 0; this.groundPlat = sup; }
      }
      if (!this.grounded) {
        const newY = this.y + this.vy * dt;
        if (this.vy >= 0) {
          const p = this.level.landOn(l, r, prevB, newY, this.dropTimer > 0);
          if (p) {
            const impact = this.vy; this.y = p.y; this.land(p, impact, fx);
            if (this.jumpBuf > 0 && !this.dead) this.doJump(fx);
          } else this.y = newY;
        } else this.y = newY;
      }
      const lo = Math.max(this.w / 2, this.limitMin), hi = Math.min(this.level.width - this.w / 2, this.limitMax);
      this.x = A.clamp(this.x + this.vx * dt, lo, hi);
      if (this.x <= lo || this.x >= hi) this.vx = 0;
    }

    animate(dt) {
      const s = this.state, t = this.t;
      let tsx = 1, tsy = 1, trot = 0, toff = 0;
      const speedN = Math.abs(this.vx) / MAXSPEED;
      if (s === 'idle') {
        const b = Math.sin(t * 2.4);
        tsy = 1 + 0.02 * b; tsx = 1 - 0.012 * b; trot = 0.025 * Math.sin(t * 1.3);
      } else if (s === 'walking') {
        this.walk.update(dt, 0.5 + speedN);
        tsy = 1 + 0.035 * Math.abs(Math.sin(this.walk.phase * Math.PI / 2 * 2)); trot = 0.07 * speedN;
      } else if (s === 'jumping') { tsy = 1.07; tsx = 0.95; trot = -0.08; }
      else if (s === 'doubleJumping') { tsy = 1.0; tsx = 1.0; }
      else if (s === 'falling') { tsy = 0.96; tsx = 1.04; trot = 0.07; }
      else if (s === 'attacking' || s === 'skillCasting') {
        const a = this.action; const p = a ? A.clamp(a.t / a.dur, 0, 1) : 1;
        toff = Math.sin(p * Math.PI) * (s === 'attacking' ? 12 : 6);
        trot = s === 'attacking' ? -0.1 + p * 0.28 : -0.04;
        tsy = s === 'skillCasting' ? 1.04 : 1;
      } else if (s === 'hit') { trot = -0.18; tsy = 1.05; tsx = 0.95; }
      else if (this.dead) { trot = -1.4; }
      if (this.dead) trot = -1.4;

      if (s === 'doubleJumping') {
        this.rot = -(1 - this.dblTimer / 0.42) * Math.PI * 2; this.wasDouble = true;
      } else {
        if (this.wasDouble) { this.rot = 0; this.wasDouble = false; }
        this.rot = A.approach(this.rot, trot, 14, dt);
      }
      this.sx = A.approach(this.sx, tsx, 16, dt);
      this.sy = A.approach(this.sy, tsy, 16, dt);
      this.offX = A.approach(this.offX, toff, 22, dt);
      this.alpha = this.dead ? A.approach(this.alpha, this.deadTimer < 1 ? 0 : 1, 3, dt) : 1;
    }

    spriteKey() {
      switch (this.state) {
        case 'attacking': case 'skillCasting': return 'player_attack';
        case 'jumping': case 'doubleJumping': return 'player_jump';
        case 'falling': case 'hit': return 'player_fall';
        case 'walking': return this.walk.frame;
        default: return 'player_idle';
      }
    }

    draw(ctx, camX) {
      const key = this.dead ? 'player_fall' : this.spriteKey();
      const img = A.images[key]; if (!img) return;
      const dw = img.width * SCALE, dh = img.height * SCALE;
      let alpha = this.alpha;
      if (this.invuln > 0 && !this.dead && this.dashTimer <= 0) alpha *= (Math.floor(this.t * 18) % 2 ? 0.45 : 1);
      if (this.dashTimer > 0) alpha *= 0.6;
      const bob = this.state === 'walking' ? -Math.abs(Math.sin(this.walk.phase * Math.PI)) * 3 : 0;
      const shiftX = key === 'player_attack' ? 6 : 0;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(this.x - camX, this.y + bob);
      // soft ground shadow
      ctx.restore();
      if (this.grounded) {
        ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#1a0f2a';
        ctx.beginPath(); ctx.ellipse(this.x - camX, this.y + 1, 22 * this.sx, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(this.x - camX, this.y + bob - dh * 0.35);
      ctx.scale(this.facing, 1);
      ctx.rotate(this.rot);
      ctx.scale(this.sx, this.sy);
      ctx.drawImage(img, -dw / 2 + this.offX + shiftX, -dh * 0.65, dw, dh);
      ctx.restore();
    }
  }
  G.Player = Player;
})(window.Game = window.Game || {});
