/* main.js: bootstraps assets, wires modules together and runs the fixed-step game loop. */
(function (G) {
  const STEP = 1 / 120;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  let game = null, acc = 0, last = 0, time = 0;
  G.hitStop = 0; G.paused = true; G.started = false;

  function fit() {
    const k = Math.min(window.innerWidth / G.VW, window.innerHeight / G.VH);
    stage.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
  }
  window.addEventListener('resize', fit); fit();

  function build() {
    const level = new G.Level();
    const player = new G.Player(level);
    const fx = new G.Effects();
    const ui = new G.UI();
    const camera = new G.Camera(G.VW, G.VH, level.width);
    const input = new G.InputManager();
    game = { level: level, player: player, fx: fx, ui: ui, camera: camera, input: input, enemies: level.spawns.map(s => new G.Enemy(s)) };
    game.pickups = new G.PickupManager(level, player, fx, ui);
    game.combat = new G.CombatManager(game);
    ui.bind(game);
    camera.snapTo(player);
    G.game = game;
    G.onLevelUp = function () {
      ui.levelUp(player.lvl);
      fx.text(player.x, player.y - 110, 'LEVEL UP!', 'levelup');
      fx.ring(player.x, player.y - 30, 220, '#ffe96b', 0.8, 12);
      fx.ring(player.x, player.y - 30, 140, '#ffffff', 0.6, 8);
      for (let i = 0; i < 4; i++) {
        setTimeout(function () {
          fx.burst(player.x + A_rand(-60, 60), player.y - 60 - i * 15, { n: 24, colors: ['#ffe96b', '#ff9ad8', '#9ad8ff', '#fff'], speed: 420, life: 1.0, size: 6, grav: 260, glow: true, shape: 'star', up: 160 });
        }, i * 120);
      }
      camera.addShake(5);
    };
    G.onRespawn = function () { camera.snapTo(player); };
  }
  const A_rand = (a, b) => a + Math.random() * (b - a);

  function update(dt) {
    const g = game;
    g.player.update(dt, g.input, g.fx);
    g.combat.update(dt);
    for (const e of g.enemies) e.update(dt, g.player, g);
    g.pickups.update(dt);
    g.fx.update(dt);
    g.camera.update(dt, g.player);
  }

  function render() {
    const g = game, cam = g.camera, camX = Math.round(cam.rx * 10) / 10;
    ctx.clearRect(0, 0, G.VW, G.VH);
    g.level.drawBackground(ctx, camX, time);
    ctx.save();
    ctx.translate(0, cam.ry);
    g.level.drawPlatforms(ctx, camX);
    g.pickups.draw(ctx, camX);
    for (const e of g.enemies) e.draw(ctx, camX);
    g.player.draw(ctx, camX);
    g.combat.drawProjectiles(ctx, camX);
    g.fx.drawWorld(ctx, camX);
    g.level.drawForeground(ctx, camX, time);
    g.fx.drawTexts(ctx, camX);
    ctx.restore();
  }

  function frame(now) {
    const rdt = Math.min(0.05, (now - last) / 1000); last = now;
    if (game) {
      if (!G.paused) {
        time += rdt;
        if (G.hitStop > 0) { G.hitStop -= rdt; game.fx.update(rdt * 0.2); }
        else { acc += rdt; while (acc >= STEP) { update(STEP); acc -= STEP; } }
        game.ui.update(rdt);
      }
      render();
    }
    requestAnimationFrame(frame);
  }

  G.togglePause = function () {
    if (!G.started) return;
    G.paused = !G.paused;
    overlay.classList.toggle('hidden', !G.paused);
    document.getElementById('overlayTitle').textContent = 'Paused';
    document.getElementById('startBtn').textContent = 'Resume';
    document.getElementById('loadMsg').textContent = '';
  };

  function start() {
    if (!G.started) { G.started = true; }
    G.paused = false; overlay.classList.add('hidden'); last = performance.now(); acc = 0;
  }
  document.getElementById('startBtn').addEventListener('click', start);
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Escape') { G.togglePause(); }
    else if (e.code === 'Enter' && G.paused && game) start();
  });

  const loadMsg = document.getElementById('loadMsg'), startBtn = document.getElementById('startBtn');
  startBtn.disabled = true;
  G.Anim.load(function (p) { loadMsg.textContent = 'Loading... ' + Math.round(p * 100) + '%'; }).then(function () {
    build();
    game.ui.update(0.016);
    loadMsg.textContent = 'Ready!'; startBtn.disabled = false;
    requestAnimationFrame(function (t) { last = t; frame(t); });
  });
})(window.Game = window.Game || {});
