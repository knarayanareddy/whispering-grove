/* Platform: a mossy log platform (one-way) or the solid ground. */
(function (G) {
  class Platform {
    constructor(name, x, y, w, h, solid) {
      this.name = name; this.x = x; this.y = y; this.w = w; this.h = h;
      this.solid = !!solid; this.oneWay = !solid; this.imgName = 'platform_tile'; this.x0 = x; this.dx = 0; this.bounce = false;
    }
    draw(ctx, camX) {
      const img = G.Anim.images[this.imgName] || G.Anim.images.platform_tile;
      if (!img) { return; }
      const s = this.h / img.height;
      const tw = Math.max(40, img.width * s);
      const top = this.y - 7 * (this.h / 46 > 1.5 ? 2 : 1);
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.x - camX, top - 12, this.w, this.h + 24);
      ctx.clip();
      for (let tx = this.x; tx < this.x + this.w; tx += tw - 6) {
        const sx = tx - camX;
        if (sx > 1300 || sx + tw < -20) continue;
        ctx.drawImage(img, sx, top, tw, this.h);
      }
      ctx.restore();
    }
  }
  G.Platform = Platform;
})(window.Game = window.Game || {});
