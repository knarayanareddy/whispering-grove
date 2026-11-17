/* AnimationManager: asset loading + interpolation helpers used by every entity. */
(function (G) {
  const NAMES = [
    'bg_sky', 'bg_mountains', 'bg_trees', 'fg_grass', 'platform_tile',
    'player_idle', 'player_walk_01', 'player_walk_02', 'player_jump', 'player_fall', 'player_attack',
    'enemy_slime_idle', 'enemy_slime_walk', 'enemy_slime_hit',
    'enemy_mushroom_idle', 'enemy_mushroom_walk', 'enemy_mushroom_hit',
    'enemy_spirit_idle', 'enemy_spirit_walk', 'enemy_spirit_hit'
  ];
  const images = {};

  function load(onProgress) {
    let done = 0;
    return Promise.all(NAMES.map(function (n) {
      return new Promise(function (res) {
        const img = new Image();
        img.onload = function () { images[n] = img; done++; if (onProgress) onProgress(done / NAMES.length); res(); };
        img.onerror = function () { console.warn('Missing asset', n); done++; res(); };
        img.src = 'Assets/' + n + '.png';
      });
    }));
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
