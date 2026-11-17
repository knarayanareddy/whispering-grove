/* main.js: bootstraps assets, title/difficulty flow, wires modules together and runs the fixed-step game loop. */
(function (G) {
  const STEP = 1 / 120;
  const $ = (id) => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d'), stage = $('stage'), overlay = $('overlay');
  let game = null, acc = 0, last = 0, time = 0, chosen = 'adventurer';
  G.hitStop = 0; G.paused = true; G.started = false; G.modal = false;
  const input = new G.InputManager();
  G.nullInput = { isDown: () => false, pressed: () => false, anyPressed: () => false, skillKey: () => 0 };
  const A_rand = (a, b) => a + Math.random() * (b - a);

  function fit() {
    const k = Math.min(window.innerWidth / G.VW, window.innerHeight / G.VH);
    stage.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
  }
  window.addEventListener('resize', fit); fit();

  /* ---------- modal panel (quests, inventory, skills) ---------- */
  G.openModal = function (title, html) { $('modalTitle').textContent = title; $('modalBody').innerHTML = html; $('modal').classList.remove('hidden'); G.modal = true; };
  G.closeModal = function () { $('modal').classList.add('hidden'); G.modal = false; };
  $('modalClose').addEventListener('click', G.closeModal);

  /* ---------- world construction ---------- */
  function build() {
    G.Dialogue.active = false; if (G.Dialogue.el) G.Dialogue.el.root.className = 'hidden';
    $('chapterCard').classList.add('hidden'); G.closeModal(); G.hitStop = 0;
    const level = new G.Level();
    const player = new G.Player(level);
    const fx = new G.Effects();
    const ui = new G.UI();
    const camera = new G.Camera(G.VW, G.VH, level.width);
    game = { level: level, player: player, fx: fx, ui: ui, camera: camera, input: input, enemies: level.spawns.map((s) => new G.Enemy(s)) };
    game.boss = new G.Boss(level.bossSpawn); game.enemies.push(game.boss);
    game.pickups = new G.PickupManager(level, player, fx, ui);
    game.boons = new G.BoonManager(level, player, fx, ui);
    game.combat = new G.CombatManager(game);
    game.npcs = level.npcs.map((n) => new G.NPC(n));
    game.companion = new G.Companion(player);
    game.story = new G.Story(game);
    ui.bind(game);
    camera.snapTo(player);
    G.game = game;
    $('diffBadge').textContent = G.Diff.cur.name; $('diffBadge').style.color = G.Diff.cur.color;
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
      game.companion.speak('Level ' + player.lvl + '! HP and MP fully restored. You are getting stronger, Wren!', 4);
      game.story.save();
    };
    G.onRespawn = function () { camera.snapTo(player); game.companion.snap(); game.boons.clear(); game.story.onRespawn(); };
  }

  /* ---------- loop ---------- */
  function update(dt) {
    const g = game;
    if (G.Dialogue.active) { // conversation: world holds its breath, Wren settles
      g.player.update(dt, G.nullInput, g.fx);
      g.fx.update(dt); g.camera.update(dt, g.player); g.companion.update(dt, g);
      for (const n of g.npcs) n.update(dt, g.player);
      G.Dialogue.update(dt, g.input);
      return;
    }
    g.player.update(dt, g.input, g.fx);
    g.combat.update(dt);
    for (const e of g.enemies) e.update(dt, g.player, g);
    if (g.enemies.some((e) => e.remove)) g.enemies = g.enemies.filter((e) => !e.remove);
    g.pickups.update(dt); g.boons.update(dt);
    g.fx.update(dt);
    g.camera.update(dt, g.player);
    for (const n of g.npcs) n.update(dt, g.player);
    g.companion.update(dt, g);
    g.story.update(dt);
    if (g.input.anyPressed(['KeyE', 'ArrowUp'], 160)) { const n = g.npcs.find((k) => k.near); if (n) g.story.interact(n); }
  }

  function render() {
    const g = game, cam = g.camera, camX = Math.round(cam.rx * 10) / 10;
    ctx.clearRect(0, 0, G.VW, G.VH);
    g.level.drawBackground(ctx, camX, time);
    ctx.save();
    ctx.translate(0, cam.ry);
    g.level.drawPlatforms(ctx, camX);
    g.story.drawWorld(ctx, camX, time);
    for (const n of g.npcs) n.draw(ctx, camX, g.story.markerFor(n));
    g.pickups.draw(ctx, camX);
    g.boons.draw(ctx, camX);
    for (const e of g.enemies) e.draw(ctx, camX);
    g.player.draw(ctx, camX);
    g.companion.draw(ctx, camX);
    g.combat.drawProjectiles(ctx, camX);
    g.fx.drawWorld(ctx, camX);
    g.level.drawForeground(ctx, camX, time);
    g.fx.drawTexts(ctx, camX);
    ctx.restore();
  }

  function frame(now) {
    const rdt = Math.min(0.05, (now - last) / 1000); last = now;
    if (game) {
      if (!G.paused && !G.modal) {
        time += rdt;
        if (G.hitStop > 0 && !G.Dialogue.active) { G.hitStop -= rdt; game.fx.update(rdt * 0.2); }
        else { acc += rdt; while (acc >= STEP) { update(STEP); acc -= STEP; } }
        game.ui.update(rdt);
      }
      render();
    }
    requestAnimationFrame(frame);
  }

  /* ---------- title / pause flow ---------- */
  function showTitle(mode) {
    overlay.classList.remove('hidden');
    $('titleBlock').classList.toggle('hidden', mode !== 'title');
    $('pauseBlock').classList.toggle('hidden', mode !== 'pause');
    $('overlayTitle').textContent = mode === 'title' ? 'Whispering Grove' : 'Paused';
    $('overlaySub').textContent = mode === 'title' ? 'The Last Lantern - Chapter 1: The Waking Grove' : 'Difficulty: ' + G.Diff.cur.name;
    $('contBtn').classList.toggle('hidden', !G.Save.has());
  }
  function selectDiff(id) {
    chosen = id;
    document.querySelectorAll('.diffBtn').forEach((b) => b.classList.toggle('sel', b.dataset.id === id));
    const d = G.Diff.tiers[id]; $('diffBlurb').textContent = d.blurb;
  }
  function buildDiffButtons() {
    const row = $('diffRow'); row.innerHTML = '';
    G.Diff.order.forEach((id) => {
      const d = G.Diff.tiers[id], b = document.createElement('button');
      b.className = 'diffBtn'; b.dataset.id = id; b.textContent = d.name; b.style.setProperty('--c', d.color);
      b.onclick = () => selectDiff(id); row.appendChild(b);
    });
    selectDiff('adventurer');
  }
  function run() { G.started = true; G.paused = false; overlay.classList.add('hidden'); last = performance.now(); acc = 0; }

  function newGame() { G.Save.clear(); G.Diff.set(chosen); build(); run(); game.story.begin(true); }
  function continueGame() {
    const s = G.Save.read(); if (!s) return newGame();
    G.Diff.set(s.diff); build(); run(); game.story.begin(false, s);
  }

  G.togglePause = function () {
    if (!G.started) return;
    if (G.modal) { G.closeModal(); return; }
    G.paused = !G.paused;
    if (G.paused) showTitle('pause'); else overlay.classList.add('hidden');
    last = performance.now();
  };

  $('newBtn').addEventListener('click', newGame);
  $('contBtn').addEventListener('click', continueGame);
  $('resumeBtn').addEventListener('click', () => G.togglePause());
  $('quitBtn').addEventListener('click', () => { if (game) game.story.save(); location.reload(); });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Escape') G.togglePause();
    else if (e.code === 'KeyQ' && G.started && !G.paused && !G.Dialogue.active) { if (G.modal) G.closeModal(); else $('btnQuests').click(); }
  });
  window.addEventListener('beforeunload', function () { if (G.started && game) game.story.save(); });

  const loadMsg = $('loadMsg'); $('newBtn').disabled = true; $('contBtn').disabled = true;
  buildDiffButtons();
  G.Anim.load(function (p) { loadMsg.textContent = 'Loading... ' + Math.round(p * 100) + '%'; }).then(function () {
    G.Diff.set('adventurer'); build();
    game.ui.update(0.016);
    loadMsg.textContent = 'Ready!'; $('newBtn').disabled = false; $('contBtn').disabled = false;
    showTitle('title');
    requestAnimationFrame(function (t) { last = t; frame(t); });
  });
})(window.Game = window.Game || {});
