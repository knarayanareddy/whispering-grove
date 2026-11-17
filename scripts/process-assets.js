/*
 * process-assets.js
 * Turns raw GPT-image art from /art-source (magenta-keyed) into transparent, game-ready
 * PNGs in /public/game/Assets. Extra poses are derived from the idle art (squash/tilt/flash).
 * Run: node scripts/process-assets.js
 */
const sharp = require('sharp');
const fs = require('fs');
const A = 'public/game/Assets';
const R = 'art-source/';
fs.mkdirSync(A, { recursive: true });

// separable min filter on a Float32 alpha plane (erodes the matte so pink fringes vanish)
function erodeAlpha(al, w, h, rad) {
  const tmp = new Float32Array(al.length), out = new Float32Array(al.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let m = 1; for (let k = -rad; k <= rad; k++) { const xx = x + k; if (xx >= 0 && xx < w) m = Math.min(m, al[y * w + xx]); }
    tmp[y * w + x] = m;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let m = 1; for (let k = -rad; k <= rad; k++) { const yy = y + k; if (yy >= 0 && yy < h) m = Math.min(m, tmp[yy * w + x]); }
    out[y * w + x] = m;
  }
  return out;
}
async function key(file, erode) {
  erode = erode === undefined ? 1 : erode;
  const { data, info } = await sharp(R + file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  // background colour = average of the four corners (generated art uses a flat magenta/pink key colour)
  const corner = [[3, 3], [W - 4, 3], [3, H - 4], [W - 4, H - 4]].map(([x, y]) => { const i = (y * W + x) * 4; return [data[i], data[i + 1], data[i + 2]]; });
  const bg = [0, 1, 2].map((c) => corner.reduce((s, p) => s + p[c], 0) / 4);
  const bgIsKey = Math.min(bg[0], bg[2]) - bg[1] > 100;
  let al = new Float32Array(N);
  for (let p = 0; p < N; p++) {
    const i = p * 4, r = data[i], g = data[i + 1], b = data[i + 2];
    const m = Math.min(r, b) - g;
    let a = 1;
    if (m > 70) a = Math.max(0, 1 - (m - 70) / 50);
    if (bgIsKey) {
      const d = Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
      if (d < 85) a = Math.min(a, Math.max(0, (d - 40) / 45));
    }
    al[p] = a;
  }
  if (erode > 0) {
    const er = erodeAlpha(al, W, H, erode);
    const near = erodeAlpha(al, W, H, erode + 1);
    for (let p = 0; p < N; p++) {
      const i = p * 4;
      if (near[p] < 0.99 && Math.min(data[i], data[i + 2]) - data[i + 1] > 35) { // despill pink toward the surrounding colour
        const lim = data[i + 1] + 18;
        if (data[i] > lim) data[i] = lim;
        if (data[i + 2] > lim) data[i + 2] = lim;
      }
    }
    al = er;
  }
  for (let p = 0; p < N; p++) {
    const i = p * 4;
    data[i + 3] = Math.round(al[p] * 255);
    if (al[p] < 0.02) { data[i] = data[i + 1] = data[i + 2] = 0; }
  }
  return sharp(data, { raw: { width: W, height: H, channels: 4 } });
}
async function keyTrim(file, resizeOpts, erode) {
  const s = await key(file, erode);
  const buf = await s.png().toBuffer();
  return sharp(buf).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 5 }).resize(resizeOpts).png().toBuffer();
}
async function save(buf, name) { await sharp(buf).png({ compressionLevel: 9 }).toFile(A + '/' + name); }

// derive a pose: scaleX, scaleY, rotate degrees, optional white flash. Bottom-center anchored on a shared canvas.
async function pose(buf, name, sx, sy, rot, white) {
  const m = await sharp(buf).metadata();
  const w = Math.round(m.width * sx), h = Math.round(m.height * sy);
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
  const CW = Math.round(m.width * 1.4), CH = Math.round(m.height * 1.25);
  const om = await sharp(out).metadata();
  const left = Math.max(0, Math.round((CW - om.width) / 2));
  const top = Math.max(0, CH - om.height - (rot ? Math.round(Math.abs(rot) * 0.5) : 0));
  const canvas = await sharp({ create: { width: CW, height: CH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: out, left, top }]).png().toBuffer();
  await save(canvas, name);
}
const has = (f) => fs.existsSync(R + f);

(async () => {
  if (has('bg_sky.jpg')) await sharp(R + 'bg_sky.jpg').resize({ width: 1600 }).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(A + '/bg_sky.png');
  if (has('bg_mountains.png')) await sharp(await keyTrim('bg_mountains.png', { width: 1600 }, 3)).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(A + '/bg_mountains.png');
  if (has('bg_trees.png')) await sharp(await keyTrim('bg_trees.png', { width: 1600 }, 3)).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(A + '/bg_trees.png');
  if (has('fg_grass.png')) await save(await keyTrim('fg_grass.png', { width: 2000 }), 'fg_grass.png');
  if (has('platform_tile.png')) await save(await keyTrim('platform_tile.png', { width: 520 }), 'platform_tile.png');

  if (has('player_idle.png')) {
    const idle = await keyTrim('player_idle.png', { height: 300 });
    const atk = has('player_attack.png') ? await keyTrim('player_attack.png', { height: 300 }) : idle;
    await pose(idle, 'player_idle.png', 1, 1, 0);
    await pose(atk, 'player_attack.png', has('player_attack.png') ? 1 : 1.06, has('player_attack.png') ? 1 : 0.97, has('player_attack.png') ? 0 : 5);
    await pose(idle, 'player_walk_01.png', 1.03, 0.96, -4);
    await pose(idle, 'player_walk_02.png', 0.97, 1.03, 4);
    await pose(idle, 'player_jump.png', 0.9, 1.1, -7);
    await pose(idle, 'player_fall.png', 1.05, 0.95, 6);
  }
  for (const n of ['slime', 'mushroom', 'spirit']) {
    const f = `enemy_${n}_idle.png`; if (!has(f)) continue;
    const e = await keyTrim(f, { height: 200 });
    await pose(e, `enemy_${n}_idle.png`, 1, 1, 0);
    await pose(e, `enemy_${n}_walk.png`, 1.07, 0.93, 0);
    await pose(e, `enemy_${n}_hit.png`, 1.1, 0.9, -8, true);
  }
  if (has('boss_gloomcap.png')) {
    const b = await keyTrim('boss_gloomcap.png', { height: 420 });
    await pose(b, 'boss_gloomcap_idle.png', 1, 1, 0);
    await pose(b, 'boss_gloomcap_walk.png', 1.05, 0.95, 0);
    await pose(b, 'boss_gloomcap_slam.png', 1.12, 0.88, 0);
    await pose(b, 'boss_gloomcap_hit.png', 1.06, 0.94, -3, true);
  }
  if (has('npc_elder.png')) {
    const n = await keyTrim('npc_elder.png', { height: 220 });
    await pose(n, 'npc_elder.png', 1, 1, 0);
  }
  for (const f of fs.readdirSync(A).filter((x) => x.endsWith('.png'))) {
    const m = await sharp(A + '/' + f).metadata();
    console.log(f, m.width, m.height, fs.statSync(A + '/' + f).size);
  }
})();
