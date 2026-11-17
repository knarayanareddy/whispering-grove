/* CombatManager: basic attack, skills, cooldowns, projectiles, hit detection and hit feedback. */
(function (G) {
  const A = G.Anim;

  const SKILLS = {
    basic: { name: 'Attack', mp: 0, cd: 0.4, dur: 0.3, hitAt: 0.08, mult: 1, range: 105, height: 90, knock: 170, shake: 0, stop: 0.03 },
    slash: { name: 'Slash', mp: 8, cd: 1.6, dur: 0.38, hitAt: 0.1, mult: 2.2, range: 175, height: 110, knock: 330, shake: 6, stop: 0.06 },
    fireball: { name: 'Fireball', mp: 14, cd: 2.6, dur: 0.42, hitAt: 0.14, mult: 3, speed: 700, knock: 280, shake: 8, stop: 0.07 },
    heal: { name: 'Heal', mp: 20, cd: 8, dur: 0.5, hitAt: 0.12 },
    dash: { name: 'Dash', mp: 10, cd: 3.2, dur: 0.3, hitAt: 0.04, mult: 1.9, knock: 300, shake: 5, stop: 0.05 },
    ult: { name: 'Nova', mp: 40, cd: 20, dur: 0.75, hitAt: 0.32, mult: 5, radius: 340, knock: 420, shake: 16, stop: 0.12 }
  };
  const ORDER = ['slash', 'fireball', 'heal', 'dash', 'ult'];

  class CombatManager {
    constructor(game) {
      this.g = game; this.skills = SKILLS; this.order = ORDER;
      this.cd = {}; this.cdMax = {};
      for (const k in SKILLS) { this.cd[k] = 0; this.cdMax[k] = SKILLS[k].cd; }
      this.projectiles = []; this.queued = null; this.dashHit = null;
    }

    roll(mult) {
      const crit = Math.random() < 0.22;
      let d = this.g.player.atk * mult * A.rand(0.85, 1.15) * (crit ? 1.8 : 1);
      return { dmg: Math.max(1, Math.round(d)), crit: crit };
    }

    hurtPlayer(dmg, fromX) {
      const p = this.g.player;
      if (p.takeDamage(dmg, fromX)) {
        if (p.lastTaken <= 0) this.g.fx.text(p.x, p.y - 85, 'Absorbed', 'boon'); else this.g.fx.text(p.x, p.y - 85, p.lastTaken, 'player');
        this.g.fx.burst(p.x, p.y - 35, { n: 8, colors: ['#ff7a7a', '#fff'], speed: 220, life: 0.4, size: 4 });
        this.g.camera.addShake(5);
        if (p.dead) { this.g.ui.chat('You were defeated... respawning at the entrance.', 'warn'); }
      }
    }

    hitEnemy(e, skill, opts) {
      const g = this.g, s = SKILLS[skill];
      const r = this.roll(opts && opts.mult ? opts.mult : s.mult);
      const dir = e.x >= g.player.x ? 1 : -1;
      const killed = e.takeHit(r.dmg, dir, s.knock);
      if (e.isBoss) g.ui.bossHit && g.ui.bossHit();
      g.fx.text(e.x + A.rand(-10, 10), e.top - 10, r.dmg, r.crit ? 'crit' : 'normal');
      const hx = e.x - dir * e.w * 0.3, hy = e.cy;
      g.fx.burst(hx, hy, { n: r.crit ? 14 : 8, colors: r.crit ? ['#ffe14a', '#fff', '#ffb02a'] : ['#ffffff', '#cfeaff'], speed: r.crit ? 340 : 260, life: 0.4, size: 5, grav: 300, glow: true, shape: r.crit ? 'star' : 'circle', angle: dir > 0 ? 0 : Math.PI, spread: 1.4 });
      const heavy = s.shake > 0;
      if (heavy) g.camera.addShake(s.shake);
      else if (r.crit) g.camera.addShake(2);
      G.hitStop = Math.max(G.hitStop || 0, s.stop + (r.crit ? 0.02 : 0));
      if (killed) this.onKill(e);
      return killed;
    }

    onKill(e) {
      const g = this.g;
      g.pickups.drop(e); g.player.kills++;
      if (g.boons && !e.summoned) g.boons.maybeDrop(e);
      if (g.story) { g.story.onKill(e); if (e.isBoss) g.story.onBossDefeated(e); }
      g.fx.burst(e.x, e.cy, { n: 16, colors: ['#fff', '#ffe9a0', '#bdf3ff'], speed: 300, life: 0.6, size: 5, grav: 200, glow: true, shape: 'star' });
      g.ui.chat(e.s.name + ' defeated!', 'good');
      if (e.elite) g.fx.text(e.x, e.top - 40, 'Elite slain!', 'crit');
    }

    tryUse(id) {
      const g = this.g, p = g.player, s = SKILLS[id];
      if (!s || p.dead || p.hitTimer > 0) return;
      if (p.action) { this.queued = { id: id, t: 0.2 }; return; }
      if (this.cd[id] > 0) { g.ui.slotDenied(id); return; }
      const cost = Math.ceil(s.mp * p.mpCostMul);
      if (p.mp < cost) { g.ui.chat('Not enough MP for ' + s.name + '.', 'warn'); g.fx.text(p.x, p.y - 95, 'No MP', 'info'); g.ui.slotDenied(id); return; }
      p.mp -= cost; this.cd[id] = s.cd;
      p.action = { skill: id, t: 0, dur: s.dur, fired: false };
      if (id === 'heal') p.sy = 1.15;
    }

    arcTargets(range, height) {
      const p = this.g.player, out = [];
      for (const e of this.g.enemies) {
        if (!e.alive) continue;
        const dx = (e.x - p.x) * p.facing;
        const dy = Math.abs(e.cy - (p.y - 35));
        if (dx > -24 && dx - e.w / 2 < range && dy < height / 2 + e.h / 2) out.push(e);
      }
      return out;
    }

    fire(id) {
      const g = this.g, p = g.player, s = SKILLS[id], fx = g.fx;
      if (id === 'basic' || id === 'slash') {
        fx.slash(p.x + p.facing * 8, p.y - 38, p.facing, s.range, id === 'slash');
        const t = this.arcTargets(s.range, s.height);
        let n = 0; for (const e of t) { if (n++ >= 6) break; this.hitEnemy(e, id); }
      } else if (id === 'fireball') {
        this.projectiles.push({ x: p.x + p.facing * 34, y: p.y - 42, dir: p.facing, vx: p.facing * s.speed, life: 0, rot: 0 });
        fx.burst(p.x + p.facing * 34, p.y - 42, { n: 8, colors: ['#ffb02a', '#ff5a1a', '#fff3a0'], speed: 200, life: 0.3, size: 5, grav: 0, glow: true });
        g.camera.addShake(2);
      } else if (id === 'heal') {
        const amt = Math.round(p.maxHp * 0.4); p.heal(amt);
        fx.text(p.x, p.y - 95, '+' + amt, 'heal');
        fx.ring(p.x, p.y - 4, 80, '#8dffb0', 0.6, 8);
        fx.burst(p.x, p.y - 30, { n: 20, colors: ['#8dffb0', '#e6ffe9', '#fff'], speed: 120, life: 0.9, size: 5, grav: -120, glow: true, shape: 'star', angle: -Math.PI / 2, spread: 1.6 });
        g.ui.chat('Heal restored ' + amt + ' HP.', 'good');
      } else if (id === 'dash') {
        p.dashTimer = 0.2; p.invuln = Math.max(p.invuln, 0.3); this.dashHit = new Set();
        fx.burst(p.x, p.y - 30, { n: 10, colors: ['#bde7ff', '#fff'], speed: 160, life: 0.4, size: 5, grav: 0, glow: true, angle: p.facing > 0 ? Math.PI : 0, spread: 0.6 });
      } else if (id === 'ult') {
        fx.ring(p.x, p.y - 30, s.radius, '#ffe27a', 0.5, 14);
        fx.ring(p.x, p.y - 30, s.radius * 0.7, '#ffffff', 0.4, 8);
        fx.burst(p.x, p.y - 35, { n: 40, colors: ['#ffe27a', '#fff', '#ff9ad8', '#9ad8ff'], speed: 520, life: 0.8, size: 6, grav: 100, glow: true, shape: 'star' });
        for (const e of g.enemies) {
          if (!e.alive) continue;
          if (Math.abs(e.x - p.x) < s.radius && Math.abs(e.cy - (p.y - 35)) < 220) this.hitEnemy(e, 'ult');
        }
        g.camera.addShake(16);
      }
    }

    update(dt) {
      const g = this.g, p = g.player;
      for (const k in this.cd) this.cd[k] = Math.max(0, this.cd[k] - dt);

      // input
      const inp = g.input;
      if (inp.anyPressed(['ControlLeft', 'ControlRight', 'KeyA'], 150)) this.tryUse('basic');
      const key = inp.skillKey();
      if (key >= 1 && key <= ORDER.length) this.tryUse(ORDER[key - 1]);

      if (this.queued) { this.queued.t -= dt; if (this.queued.t <= 0) this.queued = null; }

      if (p.action) {
        const a = p.action, s = SKILLS[a.skill];
        a.t += dt;
        if (!a.fired && a.t >= s.hitAt) { a.fired = true; this.fire(a.skill); }
        if (a.t >= a.dur) {
          p.action = null;
          if (this.queued) { const q = this.queued.id; this.queued = null; this.tryUse(q); }
        }
      }
      if (p.dashTimer > 0 && this.dashHit) {
        const s = SKILLS.dash;
        for (const e of g.enemies) {
          if (!e.alive || this.dashHit.has(e)) continue;
          if (Math.abs(e.x - p.x) < e.w / 2 + 34 && Math.abs(e.cy - (p.y - 35)) < e.h / 2 + 40) { this.dashHit.add(e); this.hitEnemy(e, 'dash'); }
        }
        if (Math.random() < 0.7) g.fx.burst(p.x, p.y - 30, { n: 1, colors: ['#bde7ff'], speed: 40, life: 0.3, size: 7, grav: 0, glow: true });
      }

      // projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i]; pr.life += dt; pr.x += pr.vx * dt; pr.rot += dt * 14;
        g.fx.burst(pr.x, pr.y, { n: 1, colors: ['#ffb02a', '#ff5a1a'], speed: 40, life: 0.3, size: 6, grav: -60, glow: true });
        let hit = null;
        for (const e of g.enemies) {
          if (!e.alive) continue;
          if (Math.abs(e.x - pr.x) < e.w / 2 + 16 && Math.abs(e.cy - pr.y) < e.h / 2 + 16) { hit = e; break; }
        }
        if (hit || pr.life > 1.4 || pr.x < 0 || pr.x > g.level.width) {
          if (hit) {
            g.fx.ring(pr.x, pr.y, 80, '#ff9a3a', 0.35, 8);
            g.fx.burst(pr.x, pr.y, { n: 22, colors: ['#ffb02a', '#ff5a1a', '#fff3a0'], speed: 400, life: 0.55, size: 6, grav: 200, glow: true });
            for (const e of g.enemies) {
              if (e.alive && Math.abs(e.x - pr.x) < 90 && Math.abs(e.cy - pr.y) < 80) this.hitEnemy(e, 'fireball', e === hit ? null : { mult: 1.5 });
            }
          }
          this.projectiles.splice(i, 1);
        }
      }
    }

    drawProjectiles(ctx, camX) {
      for (const pr of this.projectiles) {
        const x = pr.x - camX, y = pr.y;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(x, y, 0, x, y, 34);
        g.addColorStop(0, 'rgba(255,250,200,1)'); g.addColorStop(0.35, 'rgba(255,170,40,0.9)'); g.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  }
  G.CombatManager = CombatManager; G.SKILLS = SKILLS;
})(window.Game = window.Game || {});
