const sharp = require('sharp');
const path = require('path');
const A = 'public/game/Assets';
const R = 'art-source/';

async function key(file) {
  const { data, info } = await sharp(R + file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const m = Math.min(r, b) - g;
    let a = 1;
    if (m > 70) a = Math.max(0, 1 - (m - 70) / 90);
    if (a < 1) { // despill
      const lim = g + 40;
      if (r > lim) data[i] = lim;
      if (b > lim) data[i + 2] = lim;
    }
    data[i + 3] = Math.round(a * 255);
    if (a < 0.02) { data[i] = data[i + 1] = data[i + 2] = 0; }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
}
async function keyTrim(file, resizeOpts) {
  const s = await key(file);
  const buf = await s.png().toBuffer();
  return sharp(buf).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 5 }).resize(resizeOpts).png().toBuffer();
}
async function save(buf, name) { await sharp(buf).png({ compressionLevel: 9 }).toFile(A + '/' + name); }

// derive pose: scaleX, scaleY, rotate degrees, anchored at bottom center
async function pose(buf, name, sx, sy, rot, white) {
  const m = await sharp(buf).metadata();
  let w = Math.round(m.width * sx), h = Math.round(m.height * sy);
  let img = sharp(buf).resize(w, h, { fit: 'fill' });
  if (white) {
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * 0.25 + 255 * 0.75);
      data[i + 1] = Math.min(255, data[i + 1] * 0.25 + 255 * 0.75);
      data[i + 2] = Math.min(255, data[i + 2] * 0.25 + 255 * 0.75);
    }
    img = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  }
  let out = await img.png().toBuffer();
  if (rot) out = await sharp(out).rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  // pad to canvas of original size x1.3 so all poses share a canvas, bottom-center anchored
  const CW = Math.round(m.width * 1.4), CH = Math.round(m.height * 1.25);
  const om = await sharp(out).metadata();
  const left = Math.max(0, Math.round((CW - om.width) / 2));
  const top = Math.max(0, CH - om.height - (rot ? Math.round(Math.abs(rot) * 0.5) : 0));
  const canvas = await sharp({ create: { width: CW, height: CH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: out, left, top }]).png().toBuffer();
  await save(canvas, name);
}

(async () => {
  // backgrounds
  await sharp(R + 'bg_sky.jpg').resize({ width: 1920 }).png({ compressionLevel: 9 }).toFile(A + '/bg_sky.png');
  await save(await keyTrim('bg_mountains.png', { width: 2000 }), 'bg_mountains.png');
  await save(await keyTrim('bg_trees.png', { width: 2000 }), 'bg_trees.png');
  await save(await keyTrim('fg_grass.png', { width: 2000 }), 'fg_grass.png');
  await save(await keyTrim('platform_tile.png', { width: 520 }), 'platform_tile.png');

  // player
  const idle = await keyTrim('player_idle.png', { height: 300 });
  const atk = await keyTrim('player_attack.png', { height: 300 });
  const pw = (await sharp(idle).metadata()).width;
  await pose(idle, 'player_idle.png', 1, 1, 0);
  await pose(atk, 'player_attack.png', 1, 1, 0);
  await pose(idle, 'player_walk_01.png', 1.03, 0.96, -4);
  await pose(idle, 'player_walk_02.png', 0.97, 1.03, 4);
  await pose(idle, 'player_jump.png', 0.9, 1.1, -7);
  await pose(idle, 'player_fall.png', 1.05, 0.95, 6);

  for (const [n, f] of [['slime', 'enemy_slime_idle.png'], ['mushroom', 'enemy_mushroom_idle.png'], ['spirit', 'enemy_spirit_idle.png']]) {
    const e = await keyTrim(f, { height: 200 });
    await pose(e, `enemy_${n}_idle.png`, 1, 1, 0);
    await pose(e, `enemy_${n}_walk.png`, 1.07, 0.93, 0);
    await pose(e, `enemy_${n}_hit.png`, 1.1, 0.9, -8, true);
  }
  const files = require('fs').readdirSync(A).filter(x => x.endsWith('.png'));
  for (const f of files) { const m = await sharp(A + '/' + f).metadata(); console.log(f, m.width, m.height, require('fs').statSync(A + '/' + f).size); }
})();
