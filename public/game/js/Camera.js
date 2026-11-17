/* Camera: soft dead-zone follow, clamped to map edges, with screen shake. */
(function (G) {
  const A = G.Anim;
  class Camera {
    constructor(vw, vh, worldW) {
      this.vw = vw; this.vh = vh; this.worldW = worldW;
      this.x = 0; this.deadZone = 90; this.shake = 0; this.sx = 0; this.sy = 0; this.lead = 0;
    }
    snapTo(target) {
      this.x = A.clamp(target.x - this.vw / 2, 0, this.worldW - this.vw);
    }
    addShake(m) { this.shake = Math.min(18, Math.max(this.shake, m)); }
    update(dt, target) {
      this.lead = A.approach(this.lead, target.facing * 50, 2.5, dt);
      const cx = this.x + this.vw / 2;
      const tx = target.x + this.lead;
      let desired = this.x;
      if (tx > cx + this.deadZone) desired = tx - this.deadZone - this.vw / 2;
      else if (tx < cx - this.deadZone) desired = tx + this.deadZone - this.vw / 2;
      desired = A.clamp(desired, 0, this.worldW - this.vw);
      this.x = A.clamp(A.approach(this.x, desired, 5, dt), 0, this.worldW - this.vw);
      this.shake = Math.max(0, this.shake - dt * 30);
      const m = this.shake;
      this.sx = m ? (Math.random() * 2 - 1) * m : 0;
      this.sy = m ? (Math.random() * 2 - 1) * m : 0;
    }
    // render position never leaves the map
    get rx() { return A.clamp(this.x + this.sx, 0, this.worldW - this.vw); }
    get ry() { return this.sy; }
  }
  G.Camera = Camera;
})(window.Game = window.Game || {});
