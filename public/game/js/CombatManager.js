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
  Object.assign(SKILLS, G.NEW_SKILLS, G.ULTS);
  const ORDER = ['slash', 'fireball', 'heal', 'dash', 'ult', 'thorn', 'spark', 'gale'];
  const RANKKEY = { sunbreaker: 'ult', tempest: 'ult', bloomsong: 'ult' };

  class CombatManager {
    constructor(game) {
      this.g = game; this.skills = SKILLS; this.order = ORDER;
      this.cd = {}; this.cdMax = {};
      for (const k in SKILLS) { this.cd[k] = 0; this.cdMax[k] = SKILLS[k].cd; }
      this.projectiles = []; this.queued = null; this.dashHit = null; this.shots = []; this.sparks = []; this.later = [];
    }

    resolve(id) { return id === 'ult' && G.Prog.cls ? G.CLASSES[G.Prog.cls].ult : id; }
    def(id) { return SKILLS[this.resolve(id)]; }
    roll(mult) {
      const p = this.g.player, crit = Math.random() < 0.22 + p.bonus.crit + (p.eclipse > 0 ? 0.5 : 0);
      let d = p.atk * mult * A.rand(0.85, 1.15) * (crit ? 1.8 : 1);
      return { dmg: Math.max(1, Math.round(d)), crit: crit };
    }

    hurtPlayer(dmg, fromX) {
      const p = this.g.player;
      if (p.takeDamage(dmg, fromX)) {
        if (G.Prog.hasRelic('thornmantle') && !p.dead) this.areaHit(p.x, 170, 0.9, 'thorn');
        if (p.lastTaken <= 0) this.g.fx.text(p.x, p.y - 85, 'Absorbed', 'boon'); else this.g.fx.text(p.x, p.y - 85, p.lastTaken, 'player');
        this.g.fx.burst(p.x, p.y - 35, { n: 8, colors: ['#ff7a7a', '#fff'], speed: 220, life: 0.4, size: 4 });
        this.g.camera.addShake(5);
        if (p.dead) { this.g.ui.chat('You were defeated... respawning at the entrance.', 'warn'); }
      }
    }

    hitEnemy(e, skill, opts) {
      const g = this.g, s = SKILLS[skill];
      const r = this.roll((opts && opts.mult ? opts.mult : s.mult) * G.Prog.mult(RANKKEY[skill] || skill));
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
      const pl = g.player, leech = pl.bonus.steal + (G.Prog.hasRelic('mossleech') ? 0.03 : 0);
      if (leech > 0 && !G.Mods.noheal) pl.heal(Math.max(1, Math.round(r.dmg * leech)));
      if (killed) this.onKill(e);
      return killed;
    }

    onKill(e) {
      const g = this.g;
      g.pickups.drop(e); g.player.kills++;
      if (g.boons && !e.summoned) g.boons.maybeDrop(e);
      if (!e.isBoss) G.Prog.kill(e.type);
      if (g.story) g.story.onKill(e);
      g.quests.onKill(e);
      this.maybeGear(e);
      if (e.isBoss) g.world.onBossDefeated(e);
      g.fx.burst(e.x, e.cy, { n: 16, colors: ['#fff', '#ffe9a0', '#bdf3ff'], speed: 300, life: 0.6, size: 5, grav: 200, glow: true, shape: 'star' });
      g.ui.chat(e.s.name + ' defeated!', 'good');
      if (e.elite) g.fx.text(e.x, e.top - 40, 'Elite slain!', 'crit');
    }

    maybeGear(e) {
      const g = this.g; if (e.summoned) return;
      if (!(e.isBoss || Math.random() < (e.elite ? 0.4 : 0.05))) return;
      const slots = ['staff', 'robe', 'hat', 'charm'], pw = Math.max(1, g.level.power);
      const it = G.Items.roll(slots[Math.floor(Math.random() * 4)], pw, e.isBoss ? Math.max(2, G.Items.RAR.length - 3 + Math.floor(Math.random() * 2)) : undefined);
      if (G.Inv.add(it)) { g.ui.chat('Loot: ' + it.name + ' (' + G.Items.RAR[it.rar].name + ')', 'good'); g.fx.text(e.x, e.top - 52, it.name, it.rar >= 3 ? 'crit' : 'info'); }
      else g.ui.chat('Pack full! ' + it.name + ' was left behind.', 'warn');
    }

    tryUse(id) {
      const g = this.g, p = g.player, rid = this.resolve(id), s = SKILLS[rid];
      if (!s || p.dead || p.hitTimer > 0) return;
      if (!G.Prog.isUnlocked(id)) { g.ui.chat(s.name + ' is locked. Open Skills (K) to learn it.', 'warn'); g.ui.slotDenied(id); return; }
      if (p.action) { this.queued = { id: id, t: 0.2 }; return; }
      if (this.cd[id] > 0) { g.ui.slotDenied(id); return; }
      if (rid === 'heal' && G.Mods.noheal) { g.ui.chat('Hollow Mode: No Heals is active.', 'warn'); return; }
      const rk = RANKKEY[rid] || rid;
      let cost = s.mp * p.mpCostMul * p.bonus.skillMpMul * (1 - 0.04 * ((G.Prog.rank[rk] || 1) - 1));
      if (rid === 'fireball' && G.Prog.hasRelic('splitspark')) cost *= 1.5;
      if (rid === 'dash' && G.Prog.hasRelic('windwalker')) cost = 0;
      cost = Math.ceil(cost);
      if (p.mp < cost) { g.ui.chat('Not enough MP for ' + s.name + '.', 'warn'); g.fx.text(p.x, p.y - 95, 'No MP', 'info'); g.ui.slotDenied(id); return; }
      p.mp -= cost; this.cd[id] = s.cd; this.cdMax[id] = s.cd;
      p.action = { skill: rid, t: 0, dur: s.dur, fired: false };
      if (rid === 'heal' || rid === 'bloomsong') p.sy = 1.15;
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
      if (this.fireExtra(id, s)) return;
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
      this.updateExtra(dt);
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
        const pr = this.projectiles[i]; pr.life += dt; pr.x += pr.vx * dt; pr.y += (pr.vy || 0) * dt; pr.rot += dt * 14;
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

    areaHit(x, radius, mult, skill) {
      const g = this.g; let n = 0;
      g.fx.ring(x, g.player.y - 30, radius, '#9bff9b', 0.35, 8);
      for (const e of g.enemies) if (e.alive && Math.abs(e.x - x) < radius + e.w / 2 && Math.abs(e.cy - (g.player.y - 35)) < 160) { this.hitEnemy(e, skill, { mult: mult }); n++; }
      return n;
    }
    echoRing(p) {
      if (!G.Prog.hasRelic('echostep')) return;
      this.g.fx.ring(p.x, p.y - 30, 140, '#c9f1ff', 0.4, 9); this.areaHit(p.x, 140, 0.8, 'basic');
    }
    fireExtra(id, s) {
      const g = this.g, p = g.player, fx = g.fx, P = G.Prog;
      if (id === 'heal') {
        const amt = Math.round(p.maxHp * 0.4 * (1 + 0.08 * (P.rank.heal - 1)) * (P.cls === 'healer' ? 1.25 : 1)); p.heal(amt);
        fx.text(p.x, p.y - 95, '+' + amt, 'heal'); fx.ring(p.x, p.y - 4, 80, '#8dffb0', 0.6, 8);
        fx.burst(p.x, p.y - 30, { n: 20, colors: ['#8dffb0', '#e6ffe9', '#fff'], speed: 120, life: 0.9, size: 5, grav: -120, glow: true, shape: 'star', angle: -Math.PI / 2, spread: 1.6 });
        g.ui.chat('Heal restored ' + amt + ' HP.', 'good'); return true;
      }
      if (id === 'fireball' && P.hasRelic('splitspark')) {
        for (const vy of [-90, 90]) this.projectiles.push({ x: p.x + p.facing * 34, y: p.y - 42, dir: p.facing, vx: p.facing * s.speed, vy: vy, life: 0, rot: 0 });
        fx.burst(p.x + p.facing * 34, p.y - 42, { n: 10, colors: ['#ffb02a', '#ff5a1a', '#fff3a0'], speed: 220, life: 0.3, size: 5, grav: 0, glow: true }); g.camera.addShake(2); return true;
      }
      if (id === 'sunbreaker') {
        fx.slash(p.x + p.facing * 8, p.y - 38, p.facing, s.range, true); fx.ring(p.x + p.facing * 120, p.y - 40, 160, '#ffe27a', 0.5, 14);
        for (const e of this.arcTargets(s.range, s.height)) this.hitEnemy(e, id);
        p.shield = Math.max(p.shield, 80 + p.lvl * 3); g.fx.text(p.x, p.y - 120, 'Bloom Shield', 'boon'); return true;
      }
      if (id === 'tempest') {
        const strike = () => {
          const list = g.enemies.filter((e) => e.alive && Math.abs(e.x - p.x) < s.radius).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x)).slice(0, 8);
          for (const e of list) { fx.burst(e.x, e.top - 60, { n: 10, colors: ['#fff6a0', '#9ad8ff', '#fff'], speed: 260, life: 0.35, size: 5, grav: 0, glow: true, shape: 'star' }); fx.ring(e.x, e.cy, 60, '#fff6a0', 0.25, 6); this.hitEnemy(e, id); }
          g.camera.addShake(8);
        };
        fx.ring(p.x, p.y - 30, s.radius, '#9ad8ff', 0.6, 12); strike(); this.later.push({ t: 0.28, fn: strike }, { t: 0.56, fn: strike }); return true;
      }
      if (id === 'bloomsong') {
        const amt = Math.round(p.maxHp * 0.6); p.heal(amt); fx.text(p.x, p.y - 95, '+' + amt, 'heal');
        fx.ring(p.x, p.y - 30, s.radius, '#8dffb0', 0.6, 14); fx.ring(p.x, p.y - 30, s.radius * 0.6, '#ffffff', 0.5, 8);
        fx.burst(p.x, p.y - 35, { n: 40, colors: ['#8dffb0', '#fff', '#ff9ad8', '#fff3a0'], speed: 420, life: 0.9, size: 6, grav: -60, glow: true, shape: 'star' });
        for (const e of g.enemies) if (e.alive && Math.abs(e.x - p.x) < s.radius && Math.abs(e.cy - (p.y - 35)) < 220) this.hitEnemy(e, id);
        p.shield = Math.max(p.shield, 40); g.camera.addShake(10); return true;
      }
      if (id === 'thorn') {
        fx.ring(p.x, p.y - 4, s.radius, '#7aff9b', 0.5, 12);
        fx.burst(p.x, p.y - 6, { n: 30, colors: ['#7aff9b', '#2f9a4a', '#fff'], speed: 320, life: 0.7, size: 6, grav: 200, angle: -Math.PI / 2, spread: 1.5 });
        for (const e of g.enemies) if (e.alive && Math.abs(e.x - p.x) < s.radius && Math.abs(e.cy - (p.y - 35)) < 170) { this.hitEnemy(e, id); if (!e.isBoss) e.rootT = 2.5; }
        return true;
      }
      if (id === 'spark') {
        for (let i = 0; i < 3; i++) this.sparks.push({ x: p.x + p.facing * 20, y: p.y - 50, vx: p.facing * 360 + (i - 1) * 40, vy: -120 + i * 120, life: 0, delay: i * 0.08 });
        fx.burst(p.x + p.facing * 24, p.y - 50, { n: 10, colors: ['#fff6a0', '#bdf3ff', '#fff'], speed: 200, life: 0.4, size: 5, grav: 0, glow: true }); return true;
      }
      if (id === 'gale') {
        p.vy = -860; p.vx = p.facing * 520; p.grounded = false; p.groundPlat = null; p.jumpsUsed = 1; p.invuln = Math.max(p.invuln, 0.35);
        fx.ring(p.x, p.y - 20, s.radius, '#d8fff4', 0.45, 12); fx.burst(p.x, p.y - 10, { n: 22, colors: ['#d8fff4', '#fff', '#9be8c8'], speed: 300, life: 0.6, size: 5, grav: 0, glow: true });
        for (const e of g.enemies) if (e.alive && Math.abs(e.x - p.x) < s.radius && Math.abs(e.cy - (p.y - 35)) < 150) this.hitEnemy(e, id);
        return true;
      }
      return false;
    }
    updateExtra(dt) {
      const g = this.g, p = g.player;
      for (let i = this.later.length - 1; i >= 0; i--) { const l = this.later[i]; l.t -= dt; if (l.t <= 0) { l.fn(); this.later.splice(i, 1); } }
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const sp = this.sparks[i]; sp.life += dt; if (sp.life < sp.delay) continue;
        let tgt = null, best = 520; for (const e of g.enemies) { if (!e.alive) continue; const d = Math.hypot(e.x - sp.x, e.cy - sp.y); if (d < best) { best = d; tgt = e; } }
        if (tgt) { const a = Math.atan2(tgt.cy - sp.y, tgt.x - sp.x), sp0 = 560; sp.vx = A.approach(sp.vx, Math.cos(a) * sp0, 7, dt); sp.vy = A.approach(sp.vy, Math.sin(a) * sp0, 7, dt); }
        sp.x += sp.vx * dt; sp.y += sp.vy * dt;
        g.fx.burst(sp.x, sp.y, { n: 1, colors: ['#fff6a0', '#bdf3ff'], speed: 30, life: 0.3, size: 4, grav: 0, glow: true });
        let hit = null; for (const e of g.enemies) if (e.alive && Math.abs(e.x - sp.x) < e.w / 2 + 12 && Math.abs(e.cy - sp.y) < e.h / 2 + 12) { hit = e; break; }
        if (hit) { g.fx.burst(sp.x, sp.y, { n: 10, colors: ['#fff6a0', '#fff'], speed: 220, life: 0.3, size: 4, glow: true, shape: 'star' }); this.hitEnemy(hit, 'spark'); this.sparks.splice(i, 1); }
        else if (sp.life > 2.2 || sp.x < 0 || sp.x > g.level.width) this.sparks.splice(i, 1);
      }
      for (let i = this.shots.length - 1; i >= 0; i--) {
        const sh = this.shots[i]; sh.life += dt; sh.x += sh.vx * dt;
        if (!p.dead && Math.abs(sh.x - sh.x) < 1 && Math.abs(p.x - sh.x) < 22 && Math.abs((p.y - 38) - sh.y) < 44) { this.hurtPlayer(sh.dmg, sh.x - Math.sign(sh.vx) * 10); g.fx.burst(sh.x, sh.y, { n: 8, colors: [sh.col, '#fff'], speed: 200, life: 0.3, size: 4, glow: true }); this.shots.splice(i, 1); continue; }
        if (sh.life > 2.4 || sh.x < 0 || sh.x > g.level.width) this.shots.splice(i, 1);
      }
    }
    drawExtra(ctx, camX) {
      const draw = (x, y, r, col) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.35, col); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
      for (const sp of this.sparks) if (sp.life >= sp.delay) draw(sp.x - camX, sp.y, 20, 'rgba(255,240,140,0.8)');
      for (const sh of this.shots) draw(sh.x - camX, sh.y, 18, sh.col);
    }

    drawProjectiles(ctx, camX) {
      this.drawExtra(ctx, camX);
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
