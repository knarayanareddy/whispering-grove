/* Maps: every region of the Whispering Grove universe as plain data, plus the procedural Wilds generator. */
(function (G) {
  const npc = (id, name, x, y, img, extra) => Object.assign({ id: id, name: name, x: x, y: y || 600, img: img, scale: 0.42, artFacesLeft: true, facing: -1 }, extra || {});
  const P = (n, x, y, w, extra) => Object.assign({ n: n, x: x, y: y, w: w }, extra || {});
  const S = (type, on, x1, x2) => (x1 === undefined ? { type: type, on: on } : { type: type, on: on, x1: x1, x2: x2 });

  const MAPS = {};

  /* ---------- Chapter 1: Whispering Grove (original layout, unchanged) ---------- */
  MAPS.grove = {
    id: 'grove', name: 'Whispering Grove', theme: 'grove', width: 3640, power: 1, region: 'Chapter 1',
    platforms: [P('A', 240, 490, 460), P('C', 520, 380, 400), P('I', 880, 270, 360), P('B', 800, 490, 520), P('E', 1240, 380, 460), P('D', 1600, 490, 520), P('F', 1940, 380, 460), P('G', 2300, 490, 420), P('H', 3020, 470, 240), P('J', 3340, 470, 240)],
    spawns: [S('slime', 'ground', 380, 900), S('slime', 'A'), S('mushroom', 'B'), S('spirit', 'C'), S('mushroom', 'ground', 1350, 1900), S('slime', 'D'), S('spirit', 'F'), S('mushroom', 'E'), S('slime', 'ground', 2000, 2650), S('mushroom', 'G')],
    start: { x: 160, y: 600 },
    gateX: 2900, arenaX: 2990, bossSpawn: { bounds: { x1: 2960, x2: 3600, y: 600 } },
    npcs: [npc('orrin', 'Elder Orrin', 360, 600, 'npc_elder')],
    motes: [{ x: 720, y: 300 }, { x: 1060, y: 190 }, { x: 2170, y: 300 }],
    checkpoint2: { x: 2780, y: 600 },
    portals: [{ x: 70, to: 'hollow', label: 'Hollow Tree Path', req: 'ch1done' }]
  };

  /* ---------- Hub: Orrin's Hollow Tree ---------- */
  MAPS.hollow = {
    id: 'hollow', name: "Orrin's Hollow Tree", theme: 'hub', width: 2500, power: 1, town: true, region: 'Hub',
    platforms: [P('a', 520, 490, 300), P('b', 1080, 490, 320), P('c', 1120, 380, 240), P('d', 1700, 490, 320), P('e', 1760, 380, 220)],
    spawns: [], start: { x: 420, y: 600 },
    npcs: [
      npc('orrin', 'Elder Orrin', 420, 600, 'npc_elder'),
      npc('mira', 'Mira Mossback', 760, 600, 'npc_mira', { shop: 'mira' }),
      npc('tamsin', 'Archivist Tamsin', 1180, 380, 'npc_tamsin', { y: 380 }),
      npc('bramble', 'Warden Bramble', 2150, 600, 'npc_bramble')
    ],
    portals: [
      { x: 130, to: 'grove', label: 'Whispering Grove' },
      { x: 1000, to: 'marsh', label: 'Mistmarsh', req: 'unlock_marsh' },
      { x: 1260, to: 'sunken', label: 'Sunken Hollow', req: 'unlock_sunken' },
      { x: 1520, to: 'ember', label: 'Ember Peaks', req: 'unlock_ember' },
      { x: 1780, to: 'cloud', label: 'Cloud Orchard', req: 'unlock_cloud' },
      { x: 2020, to: 'heart', label: 'The Heartwood', req: 'unlock_heart' },
      { x: 2330, to: 'wilds', label: 'The Wildgate', kind: 'wilds', req: 'unlock_wilds' }
    ]
  };

  /* ---------- Chapter 2: Mistmarsh ---------- */
  MAPS.marsh = {
    id: 'marsh', name: 'Mistmarsh', theme: 'marsh', width: 3640, power: 1.7, region: 'Chapter 2',
    platforms: [P('a', 300, 490, 340), P('m1', 700, 400, 300, { move: { ax: 90, sp: 0.8 } }), P('c', 1100, 490, 400), P('d', 1250, 370, 300), P('e', 1650, 490, 360), P('m2', 2050, 400, 300, { move: { ax: 110, sp: 0.6, ph: 2 } }), P('f', 2450, 490, 400), P('g', 2500, 360, 280), P('h', 3200, 470, 240)],
    spawns: [S('bogtoad', 'ground', 420, 1000), S('bogtoad', 'a'), S('lanternbeetle', 'c'), S('gloweel', 'd'), S('bogtoad', 'ground', 1500, 2000), S('thornsprite', 'e'), S('lanternbeetle', 'f'), S('gloweel', 'g'), S('bogtoad', 'ground', 2100, 2850)],
    start: { x: 160, y: 600 }, arenaX: 3000, boss: { id: 'drowned', x1: 2980, x2: 3580 },
    npcs: [npc('fenn', 'Fenn the Herbalist', 230, 600, 'npc_fenn'), npc('ribbit', 'Ribbit the Angler', 1050, 600, 'npc_ribbit')],
    items: [{ what: 'lantern', x: 470, y: 400 }, { what: 'lantern', x: 1400, y: 280 }, { what: 'lantern', x: 2640, y: 270 }],
    portals: [{ x: 70, to: 'hollow', label: 'Back to Hollow Tree' }, { x: 3590, to: 'sunken', label: 'Sunken Hollow', req: 'marsh_boss' }]
  };

  /* ---------- Chapter 3: Sunken Hollow ---------- */
  MAPS.sunken = {
    id: 'sunken', name: 'Sunken Hollow', theme: 'sunken', width: 3500, power: 2.4, region: 'Chapter 3',
    platforms: [P('a', 260, 490, 320), P('b', 520, 380, 280), P('c', 820, 290, 300), P('d', 700, 490, 360), P('e', 1150, 400, 320), P('f', 1450, 490, 380), P('g', 1500, 330, 260), P('h', 1860, 420, 320), P('i', 2150, 320, 260), P('j', 2200, 490, 360), P('k', 2600, 400, 240)],
    spawns: [S('hollowwisp', 'b'), S('mossgolem', 'ground', 400, 1000), S('thornsprite', 'd'), S('hollowwisp', 'e'), S('mossgolem', 'f'), S('hollowwisp', 'g'), S('thornsprite', 'h'), S('hollowwisp', 'j'), S('mossgolem', 'ground', 1700, 2300), S('thornsprite', 'k')],
    start: { x: 160, y: 600 }, arenaX: 2900, boss: { id: 'marrow', x1: 2870, x2: 3440 },
    npcs: [],
    items: [{ what: 'letter', x: 960, y: 200 }, { what: 'letter', x: 2280, y: 230 }],
    portals: [{ x: 70, to: 'hollow', label: 'Back to Hollow Tree' }]
  };

  /* ---------- Chapter 4: Ember Peaks ---------- */
  MAPS.ember = {
    id: 'ember', name: 'Ember Peaks', theme: 'ember', width: 3800, power: 3.2, region: 'Chapter 4',
    platforms: [P('a', 300, 490, 300), P('b', 620, 380, 260), P('p1', 780, 490, 340), P('c', 1150, 400, 300), P('d', 1480, 490, 300), P('e', 1760, 390, 300), P('f', 2050, 490, 340), P('g', 2350, 490, 380), P('h', 2480, 370, 260), P('i', 2900, 470, 240)],
    spawns: [S('emberimp', 'ground', 450, 780), S('cinderspirit', 'b'), S('lavagolem', 'c'), S('emberimp', 'd'), S('cinderspirit', 'e'), S('emberimp', 'f'), S('emberimp', 'g'), S('cinderspirit', 'h'), S('lavagolem', 'ground', 2760, 3140), S('lavagolem', 'i')],
    zones: [{ x1: 800, x2: 1050, dmg: 12 }, { x1: 1600, x2: 1900, dmg: 14 }, { x1: 2400, x2: 2700, dmg: 16 }],
    start: { x: 160, y: 600 }, arenaX: 3240, boss: { id: 'magmaw', x1: 3220, x2: 3760 },
    npcs: [npc('ashe', 'Captain Ashe', 230, 600, 'npc_ashe', { shop: 'forge' })],
    items: [{ what: 'shard', x: 420, y: 400 }, { what: 'shard', x: 1250, y: 310 }, { what: 'shard', x: 2600, y: 280 }, { what: 'letter', x: 3000, y: 380 }],
    portals: [{ x: 70, to: 'hollow', label: 'Back to Hollow Tree' }]
  };

  /* ---------- Chapter 5: Cloud Orchard ---------- */
  MAPS.cloud = {
    id: 'cloud', name: 'Cloud Orchard', theme: 'cloud', width: 3800, power: 4.2, region: 'Chapter 5',
    platforms: [P('a', 300, 490, 300), P('b', 700, 480, 170, { bounce: true }), P('c', 900, 330, 260), P('m1', 1200, 420, 260, { move: { ax: 130, sp: 0.7 } }), P('d', 1550, 490, 320), P('e', 1950, 480, 170, { bounce: true }), P('f', 2200, 300, 300), P('m2', 2550, 400, 240, { move: { ax: 140, sp: 0.9, ph: 1.5 } }), P('g', 2900, 470, 260)],
    spawns: [S('cloudpuff', 'ground', 420, 900), S('stormsprite', 'c'), S('galeshroom', 'd'), S('cloudpuff', 'ground', 1300, 1900), S('stormsprite', 'f'), S('galeshroom', 'ground', 2100, 2750), S('cloudpuff', 'g')],
    winds: [{ x1: 700, x2: 1100, vx: 70 }, { x1: 2000, x2: 2500, vx: -80 }],
    start: { x: 160, y: 600 }, arenaX: 3270, boss: { id: 'stormwing', x1: 3250, x2: 3780 },
    npcs: [npc('zephyra', 'Zephyra', 230, 600, 'npc_zephyra')],
    items: [{ what: 'feather', x: 1040, y: 240 }, { what: 'feather', x: 2320, y: 210 }, { what: 'feather', x: 3000, y: 380 }, { what: 'letter', x: 1700, y: 400 }],
    portals: [{ x: 70, to: 'hollow', label: 'Back to Hollow Tree' }]
  };

  /* ---------- Chapter 6: The Heartwood (a climb through memories) ---------- */
  (function () {
    const plats = [], ys = [510, 430, 350, 270, 220, 270, 350, 430, 510], xs = [300, 650, 1000, 1350, 1700, 2250, 2550, 2850, 3150];
    ys.forEach((y, i) => plats.push(P('s' + i, xs[i], y, i === 4 ? 420 : 280)));
    MAPS.heart = {
      id: 'heart', name: 'The Heartwood', theme: 'heart', width: 4200, power: 5.4, region: 'Chapter 6',
      platforms: plats,
      spawns: [S('shade', 's0'), S('echo', 'ground', 500, 1100), S('shade', 's2'), S('griefcap', 'ground', 1250, 1900), S('shade', 's4'), S('echo', 's5'), S('shade', 's6'), S('griefcap', 'ground', 2300, 2900), S('echo', 's8')],
      start: { x: 160, y: 600 }, arenaX: 3520, boss: { id: 'sorrel', x1: 3500, x2: 4170 },
      npcs: [],
      items: [{ what: 'memory', x: 470, y: 420 }, { what: 'memory', x: 1120, y: 260 }, { what: 'memory', x: 1900, y: 130 }, { what: 'memory', x: 2700, y: 260 }, { what: 'letter', x: 3250, y: 420 }],
      portals: [{ x: 70, to: 'hollow', label: 'Back to Hollow Tree' }]
    };
  })();

  /* ---------- The Wilds: seeded, endless expeditions ---------- */
  const BIOMES = {
    grove: { name: 'Verdant Wilds', theme: 'grove', pool: ['slime', 'mushroom', 'spirit'], base: 1 },
    marsh: { name: 'Mist Wilds', theme: 'marsh', pool: ['bogtoad', 'gloweel', 'lanternbeetle', 'thornsprite'], base: 1.7 },
    sunken: { name: 'Hollow Wilds', theme: 'sunken', pool: ['hollowwisp', 'mossgolem', 'thornsprite'], base: 2.4 },
    ember: { name: 'Ember Wilds', theme: 'ember', pool: ['emberimp', 'cinderspirit', 'lavagolem'], base: 3.2 },
    cloud: { name: 'Sky Wilds', theme: 'cloud', pool: ['cloudpuff', 'stormsprite', 'galeshroom'], base: 4.2 },
    heart: { name: 'Memory Wilds', theme: 'heart', pool: ['shade', 'echo', 'griefcap'], base: 5.4 }
  };
  const MUTATORS = [
    { id: 'none', name: 'Calm Winds', desc: 'No modifier.' },
    { id: 'elites', name: 'Elite Surge', desc: 'Elite monsters are much more common.', eliteAdd: 0.35 },
    { id: 'swarm', name: 'The Swarm', desc: 'Roughly 60% more monsters.', swarm: 1.6 },
    { id: 'bounty', name: 'Golden Hour', desc: 'Double gold from every monster.', gold: 2 }
  ];
  function rngFrom(seed) { let s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function wilds(biomeId, tier, seed) {
    const b = BIOMES[biomeId] || BIOMES.grove, r = rngFrom(seed * 7919 + tier * 104729 + biomeId.length * 13);
    const width = 3000 + tier * 350, plats = [], spawns = [], ys = [490, 380, 270];
    let x = 280, i = 0;
    while (x < width - 700) {
      const w = 240 + Math.floor(r() * 200), y = ys[Math.floor(r() * 3)];
      const d = P('w' + i, x, y, w);
      if (biomeId === 'cloud' && r() < 0.3) { d.move = { ax: 100 + r() * 60, sp: 0.6 + r() * 0.5, ph: r() * 6 }; }
      plats.push(d); x += w + 70 + Math.floor(r() * 140); i++;
    }
    const mut = MUTATORS[Math.floor(r() * MUTATORS.length)];
    const count = Math.round((5 + tier * 2) * (mut.swarm || 1));
    for (let k = 0; k < count; k++) {
      const type = b.pool[Math.floor(r() * b.pool.length)];
      const staticPlats = plats.filter((p) => !p.move);
      if (r() < 0.5 && staticPlats.length) spawns.push(S(type, staticPlats[Math.floor(r() * staticPlats.length)].n));
      else { const x1 = 450 + r() * (width - 1300); spawns.push(S(type, 'ground', x1, x1 + 400 + r() * 300)); }
    }
    const zones = biomeId === 'ember' ? [{ x1: 900 + r() * 400, x2: 1300 + r() * 300, dmg: 10 + tier * 2 }] : [];
    const winds = biomeId === 'cloud' ? [{ x1: 800, x2: 1500, vx: r() < 0.5 ? 70 : -70 }] : [];
    return {
      id: 'wilds', name: b.name + ' - Tier ' + tier, theme: b.theme, width: width, power: b.base + tier * 0.55, region: 'Wilds', wilds: true, tier: tier, biome: biomeId, seed: seed, mut: mut,
      platforms: plats, spawns: spawns, zones: zones, winds: winds, start: { x: 160, y: 600 }, npcs: [],
      chest: { x: width - 360, y: 600 },
      portals: [{ x: 70, to: 'hollow', label: 'Leave the Wilds' }, { x: width - 90, to: 'hollow', label: 'Return to Hollow Tree' }]
    };
  }

  G.Maps = { defs: MAPS, biomes: BIOMES, mutators: MUTATORS, wilds: wilds, rng: rngFrom };
})(window.Game = window.Game || {});
