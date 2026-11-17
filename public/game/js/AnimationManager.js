/* AnimationManager: asset loading + interpolation helpers used by every entity. */
(function (G) {
  const NAMES = [
    'bg_sky', 'bg_mountains', 'bg_trees', 'fg_grass', 'platform_tile',
    'player_idle', 'player_walk_01', 'player_walk_02', 'player_jump', 'player_fall', 'player_attack',
    'enemy_slime_idle', 'enemy_slime_walk', 'enemy_slime_hit',
    'enemy_mushroom_idle', 'enemy_mushroom_walk', 'enemy_mushroom_hit',
    'enemy_spirit_idle', 'enemy_spirit_walk', 'enemy_spirit_hit',
    'boss_gloomcap_idle', 'boss_gloomcap_walk', 'boss_gloomcap_slam', 'boss_gloomcap_hit', 'npc_elder', 'npc_mira'
  ];
  const images = {};


  /* ---- derived art: every variant below is recoloured from the generated source PNGs at load time ---- */
  const DERIVE = [];
  const ENEMY_VARIANTS = { // name: [base sprite, css filter]
    bogtoad: ['slime', 'hue-rotate(75deg) saturate(1.1) brightness(0.95)'],
    gloweel: ['spirit', 'hue-rotate(20deg) saturate(1.5) brightness(1.05)'],
    lanternbeetle: ['mushroom', 'hue-rotate(35deg) saturate(1.3)'],
    mossgolem: ['mushroom', 'hue-rotate(110deg) saturate(0.55) brightness(0.8)'],
    thornsprite: ['slime', 'hue-rotate(150deg) saturate(1.3)'],
    hollowwisp: ['spirit', 'hue-rotate(110deg) saturate(1.2) brightness(0.8)'],
    emberimp: ['slime', 'hue-rotate(-95deg) saturate(1.5)'],
    cinderspirit: ['spirit', 'hue-rotate(-140deg) saturate(1.6)'],
    lavagolem: ['mushroom', 'hue-rotate(-20deg) saturate(1.4) brightness(0.85)'],
    cloudpuff: ['slime', 'hue-rotate(40deg) saturate(0.4) brightness(1.35)'],
    stormsprite: ['spirit', 'hue-rotate(-60deg) saturate(1.5) brightness(1.1)'],
    galeshroom: ['mushroom', 'hue-rotate(160deg) saturate(1.1) brightness(1.1)'],
    shade: ['spirit', 'hue-rotate(200deg) saturate(0.5) brightness(0.65)'],
    echo: ['slime', 'grayscale(0.8) brightness(0.7) hue-rotate(220deg)'],
    griefcap: ['mushroom', 'hue-rotate(250deg) saturate(0.6) brightness(0.7)']
  };
  Object.keys(ENEMY_VARIANTS).forEach(function (k) {
    const v = ENEMY_VARIANTS[k];
    DERIVE.push(['enemy_' + k + '_idle', 'enemy_' + v[0] + '_idle', v[1]], ['enemy_' + k + '_walk', 'enemy_' + v[0] + '_walk', v[1]], ['enemy_' + k + '_hit', 'enemy_' + v[0] + '_hit', '']);
  });
  const BOSS_VARIANTS = {
    drowned: ['boss_gloomcap', 'hue-rotate(-100deg) saturate(1.2) brightness(1.05)'],
    marrow: ['boss_gloomcap', 'hue-rotate(30deg) saturate(0.45) brightness(0.7)'],
    magmaw: ['boss_gloomcap', 'hue-rotate(100deg) saturate(1.6) brightness(1.05)'],
    stormwing: ['boss_gloomcap', 'hue-rotate(-60deg) saturate(1.3) brightness(1.35)']
  };
  Object.keys(BOSS_VARIANTS).forEach(function (k) {
    const v = BOSS_VARIANTS[k];
    ['idle', 'walk', 'slam'].forEach(function (pose) { DERIVE.push(['boss_' + k + '_' + pose, v[0] + '_' + pose, v[1]]); });
    DERIVE.push(['boss_' + k + '_hit', 'boss_gloomcap_hit', '']);
  });
  // Sorrel: Wren's silhouette, dimmed and cold (he was Orrin's first apprentice)
  ['idle', 'walk', 'slam'].forEach(function (pose) { DERIVE.push(['boss_sorrel_' + pose, pose === 'idle' ? 'player_idle' : pose === 'walk' ? 'player_walk_01' : 'player_attack', 'hue-rotate(150deg) saturate(0.55) brightness(0.5) contrast(1.15)']); });
  DERIVE.push(['boss_sorrel_hit', 'player_idle', 'brightness(3) saturate(0.1)']);
  DERIVE.push(['npc_ashe', 'npc_mira', 'hue-rotate(-30deg) saturate(1.5) brightness(0.9)'], ['npc_fenn', 'npc_mira', 'hue-rotate(70deg) saturate(1.2)'], ['npc_ribbit', 'npc_mira', 'hue-rotate(130deg) saturate(1.4) brightness(1.1)'],
    ['npc_bramble', 'npc_mira', 'hue-rotate(200deg) saturate(1.1)'], ['npc_zephyra', 'npc_elder', 'hue-rotate(150deg) saturate(1.2) brightness(1.15)'], ['npc_tamsin', 'npc_elder', 'hue-rotate(-70deg) saturate(1.1)'],
    ['npc_sorrel', 'player_idle', 'hue-rotate(150deg) saturate(0.55) brightness(0.5) contrast(1.15)']);
  const THEME_FILTERS = {
    marsh: ['hue-rotate(35deg) saturate(0.75) brightness(0.85)', 'hue-rotate(60deg) saturate(0.8) brightness(0.9)', 'hue-rotate(30deg) brightness(0.85)'],
    sunken: ['hue-rotate(150deg) saturate(0.6) brightness(0.5)', 'hue-rotate(120deg) brightness(0.55) saturate(0.7)', 'hue-rotate(120deg) brightness(0.7) saturate(0.7)'],
    ember: ['hue-rotate(-85deg) saturate(1.3) brightness(0.8)', 'hue-rotate(110deg) saturate(1.5) brightness(0.85)', 'hue-rotate(-60deg) brightness(0.75) saturate(1.2)'],
    cloud: ['hue-rotate(45deg) saturate(0.9) brightness(1.25)', 'hue-rotate(-30deg) brightness(1.25) saturate(0.8)', 'hue-rotate(20deg) brightness(1.3) saturate(0.7)'],
    heart: ['hue-rotate(-40deg) saturate(1.4) brightness(1.15)', 'hue-rotate(80deg) brightness(1.2) saturate(1.2)', 'hue-rotate(-20deg) brightness(1.2) saturate(1.3)']
  };
  Object.keys(THEME_FILTERS).forEach(function (k) {
    const f = THEME_FILTERS[k];
    DERIVE.push(['bg_trees_' + k, 'bg_trees', f[0]], ['bg_mountains_' + k, 'bg_mountains', f[1]], ['platform_tile_' + k, 'platform_tile', f[2]]);
  });
  function derive() {
    DERIVE.forEach(function (d) {
      const src = images[d[1]]; if (!src) return;
      const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
      const x = c.getContext('2d'); if (d[2]) x.filter = d[2];
      x.drawImage(src, 0, 0); images[d[0]] = c;
    });
  }

  function load(onProgress) {
    let done = 0;
    return Promise.all(NAMES.map(function (n) {
      return new Promise(function (res) {
        const img = new Image();
        img.onload = function () { images[n] = img; done++; if (onProgress) onProgress(done / NAMES.length); res(); };
        img.onerror = function () { console.warn('Missing asset', n); done++; if (onProgress) onProgress(done / NAMES.length); res(); };
        img.src = 'Assets/' + n + '.png';
      });
    })).then(derive);
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  // frame-rate independent exponential approach toward target
  const approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
  const moveToward = (cur, target, step) => {
    if (cur < target) return Math.min(target, cur + step);
    return Math.max(target, cur - step);
  };
  const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const rand = (a, b) => a + Math.random() * (b - a);

  class FrameCycler {
    constructor(frames, fps) { this.frames = frames; this.fps = fps; this.time = 0; }
    update(dt, speedMul) { this.time += dt * this.fps * (speedMul === undefined ? 1 : speedMul); }
    get index() { return Math.floor(this.time) % this.frames.length; }
    get frame() { return this.frames[this.index]; }
    get phase() { return this.time; }
    reset() { this.time = 0; }
  }

  G.Anim = { images, load, clamp, lerp, approach, moveToward, easeOutBack, easeOutCubic, rand, FrameCycler };
})(window.Game = window.Game || {});
