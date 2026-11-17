/* InputManager: keyboard state + buffered "just pressed" events. */
(function (G) {
  const BLOCK = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ControlLeft', 'ControlRight', 'KeyA'];

  class InputManager {
    constructor() {
      this.down = {};
      this.pressedAt = {};
      window.addEventListener('keydown', (e) => {
        if (BLOCK.indexOf(e.code) >= 0 || /^(Digit|Numpad)[1-9]$/.test(e.code)) e.preventDefault();
        if (!e.repeat) this.pressedAt[e.code] = performance.now();
        this.down[e.code] = true;
      });
      window.addEventListener('keyup', (e) => { this.down[e.code] = false; });
      window.addEventListener('blur', () => { this.down = {}; });
    }
    isDown(code) { return !!this.down[code]; }
    // consumes a buffered press (valid for `windowMs`)
    pressed(code, windowMs) {
      const t = this.pressedAt[code];
      if (t !== undefined && performance.now() - t < (windowMs || 140)) { delete this.pressedAt[code]; return true; }
      return false;
    }
    anyPressed(codes, windowMs) {
      let hit = false;
      for (const c of codes) if (this.pressed(c, windowMs)) hit = true;
      return hit;
    }
    skillKey() {
      for (let i = 1; i <= 8; i++) {
        if (this.pressed('Digit' + i, 160) | this.pressed('Numpad' + i, 160)) return i;
      }
      return 0;
    }
  }
  G.InputManager = InputManager;
})(window.Game = window.Game || {});
