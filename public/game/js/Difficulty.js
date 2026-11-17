/* Difficulty: four tiers that retune enemies, rewards, regen and death penalties. */
(function (G) {
  const TIERS = {
    cozy: {
      id: 'cozy', name: 'Cozy', color: '#9dffb4',
      blurb: 'A gentle stroll. Weaker monsters, fast healing, no gold lost on defeat. Best for the story.',
      hpMul: 0.7, dmgMul: 0.6, speedMul: 0.9, detectMul: 0.85, expMul: 1, goldMul: 1,
      dropChance: 0.34, eliteChance: 0, regenMul: 2.2, deathGoldLoss: 0, respawnHp: 0.8, playerDmg: 1.15, bossHp: 0.75, bossDmg: 0.6
    },
    adventurer: {
      id: 'adventurer', name: 'Adventurer', color: '#9ad8ff',
      blurb: 'The intended experience. Fair fights, steady rewards, a light penalty on defeat.',
      hpMul: 1, dmgMul: 1, speedMul: 1, detectMul: 1, expMul: 1, goldMul: 1,
      dropChance: 0.2, eliteChance: 0.04, regenMul: 1, deathGoldLoss: 0.1, respawnHp: 0.5, playerDmg: 1, bossHp: 1, bossDmg: 1
    },
    heroic: {
      id: 'heroic', name: 'Heroic', color: '#ffd37a',
      blurb: 'Tougher, faster monsters and frequent Elites. More EXP and gold. Boons are rarer.',
      hpMul: 1.55, dmgMul: 1.35, speedMul: 1.12, detectMul: 1.15, expMul: 1.3, goldMul: 1.25,
      dropChance: 0.14, eliteChance: 0.14, regenMul: 0.5, deathGoldLoss: 0.2, respawnHp: 0.4, playerDmg: 1, bossHp: 1.7, bossDmg: 1.3
    },
    nightmare: {
      id: 'nightmare', name: 'Nightmare', color: '#ff8aa0',
      blurb: 'The Hollow hits back. Brutal monsters, many Elites, no natural HP regen, big rewards.',
      hpMul: 2.3, dmgMul: 2, speedMul: 1.25, detectMul: 1.3, expMul: 1.8, goldMul: 1.6,
      dropChance: 0.08, eliteChance: 0.32, regenMul: 0, deathGoldLoss: 0.4, respawnHp: 0.25, playerDmg: 1, bossHp: 2.9, bossDmg: 1.8
    }
  };
  const ORDER = ['cozy', 'adventurer', 'heroic', 'nightmare'];
  const D = { tiers: TIERS, order: ORDER, cur: TIERS.adventurer, set: function (id) { D.cur = TIERS[id] || TIERS.adventurer; return D.cur; } };
  G.Diff = D;
})(window.Game = window.Game || {});
