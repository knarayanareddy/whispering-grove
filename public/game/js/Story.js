/* Story: Chapter 1 "The Waking Grove" - quest chain, script, collectibles, blight gate, boss flow, journal and saves. */
(function (G) {
  const A = G.Anim;
  const SAVE_KEY = 'whisperingGrove.save.v1';

  /* ---------------- script ---------------- */
  const S = {
    prologue: [
      { who: 'narrator', text: 'Long ago, the Heartwood sang. Its song, the Whisper, drifted through every leaf, stream and stone, and the world kept its colours.' },
      { who: 'narrator', text: 'Five Lanterns carried that song to the corners of the land, tended by the Lantern Circle. Then, one by one, the Lanterns went dark.' },
      { who: 'narrator', text: 'A creeping silence called the Hollow began to swallow the Whisper. It is still quiet here, in the last grove that hums. And in that grove, a young apprentice is sleeping beneath a mossy log...' }
    ],
    opening: [
      { who: 'lumi', text: 'Wren! Wren, wake up! Can you hear it? The Whisper is getting quieter.' },
      { who: 'hero', text: 'Five more minutes, Lumi...' },
      { who: 'lumi', text: 'No minutes! Elder Orrin is waiting by the old log to the right, and the grove monsters have gone strange. Go, go, go!' },
      { who: 'lumi', text: 'Arrow keys to move, Space to jump (twice for a double jump). Ctrl or A to attack, keys 1 to 5 for skills. I will shout if I see anything important!' }
    ],
    orrinIntro: [
      { who: 'orrin', text: 'Ah, Wren. Awake at last. Tell me, do you hear it too? That faint humming beneath the wind?' },
      {
        who: 'hero', text: '...', choices: [
          { text: 'It is only the wind, Elder.', flag: 'humble', reply: [{ who: 'orrin', text: 'Is it? The wind has never hummed in the key of C-sharp. You hear it, child. You always have. That is why you are my apprentice.' }] },
          { text: 'I hear it. And it is fading.', flag: 'brave', reply: [{ who: 'orrin', text: 'Yes. Fading. Good. Fear sharpens the ears, and I see you have not let it dull your courage.' }] }
        ]
      },
      { who: 'orrin', text: 'Listen closely. East of here, beyond the blight gate, the Gloomcap Warden once guarded our first Lantern. Now purple silence seeps from it, and that Hollow twists every creature it touches.' },
      { who: 'orrin', text: 'The gate will not yield yet. Thin out the blight-touched creatures first. Six should loosen the Hollow\'s grip on this place.' },
      { who: 'lumi', text: 'Also! Everything glowy that drops from a monster, grab it. Gold, EXP, and sometimes Boons like Sunpetals and Windleaves. Trust me.' },
      { who: 'orrin', text: 'Go carefully, Wren. The Whisper was never meant to be carried alone.' }
    ],
    orrinReminder1: [{ who: 'orrin', text: 'Six blight-touched creatures, Wren. Use your Slash and Fireball, and keep an eye on your MP. Lumi will keep you honest.' }],
    orrinReminder2: [{ who: 'orrin', text: 'The Whisper Motes shimmer high in the canopy. Use your double jump, and look for the highest logs.' }],
    quest2Done: [
      { who: 'lumi', text: 'That is six! Wren, the Hollow let go for a second. I felt it!' },
      { who: 'lumi', text: 'Look up! Whisper Motes are shimmering in the canopy. Three of them, on the high logs. Time to use those double jumps!' }
    ],
    moteLines: ['It is... singing. Just a little. Like a lullaby.', 'These sound like the Heartwood. Like home.', 'That is all three! Back to Elder Orrin, quick!'],
    orrinTurnIn: [
      { who: 'orrin', text: 'Three motes, and still warm. You have kept the Whisper alive in your own two hands, Wren.' },
      { who: 'orrin', text: 'Hold still.' },
      { who: 'lumi', text: 'Elder! The cracked lantern on your hat, it is glowing! And the blight gate is... melting!' },
      { who: 'orrin', text: 'A Lantern remembers its duty. The way east is open. Take this Bloom Shield, a gift of the grove.' },
      { who: 'orrin', text: 'One more thing. The Warden was not always cruel. Before the Hollow, he was Brambold, the gentlest keeper in the Circle. If anything of him remains, be kind if you can. Be strong either way.' },
      { who: 'hero', text: 'I will do what I can, Elder.' }
    ],
    orrinReminder4: [{ who: 'orrin', text: 'The gate is open, Wren. Brambold waits in the clearing beyond. Be kind if you can. Be strong either way.' }],
    bossIntro: [
      { who: 'warden', text: '...who... walks... the quiet?' },
      { who: 'lumi', text: 'Wren, he is HUGE. And that lantern on his belt, it is leaking Hollow smoke everywhere!' },
      { who: 'warden', text: 'SILENCE. BE... SILENT.' }
    ],
    bossDefeat: [
      { who: 'warden', text: '...the song... I hear it again. Little light... thank you.' },
      { who: 'lumi', text: 'He is... crying. Wren, the smoke is lifting.' },
      { who: 'warden', text: 'Beware... the one who sits beneath the Heartwood. He said the quiet would end the grief... Sorrel...' },
      { who: 'hero', text: 'Sorrel? Elder Orrin has never mentioned that name.' },
      { who: 'lumi', text: 'Wren, look. The cracked lantern is pointing south, toward the Sunken Hollow. Something is calling us.' }
    ],
    orrinEpilogue: [
      { who: 'orrin', text: 'Brambold... rest well, old friend.' },
      { who: 'orrin', text: 'Sorrel. I had hoped never to hear that name again. Wren, the Hollow King was my first apprentice. He believed silence could save what he loved.' },
      { who: 'orrin', text: 'The Sunken Hollow lies south, past the Mistmarsh. Rest. Train. Come back stronger. The next Lantern will not light itself.' },
      { who: 'lumi', text: 'Chapter two... here we come!' }
    ]
  };

  const QUESTS = [
    { title: 'A Voice in the Leaves', desc: 'Speak with Elder Orrin near the grove entrance.' },
    { title: 'Blightbitten', desc: 'Defeat 6 blight-touched monsters.', goal: 6 },
    { title: 'Whisper Motes', desc: 'Find 3 Whisper Motes glowing high in the canopy.', goal: 3 },
    { title: 'The Lantern Rekindled', desc: 'Bring the Whisper Motes to Elder Orrin.' },
    { title: 'Warden of the Gloom', desc: 'Defeat Brambold, the Gloomcap Warden, beyond the blight gate.' }
  ];

  const JOURNAL = [
    { id: 'whisper', title: 'The Whisper', when: (s) => true, text: 'The Heartwood\'s ancient song. Every leaf, stream and stone hums it, and apprentices of the Lantern Circle can hear it.' },
    { id: 'hollow', title: 'The Hollow', when: (s) => s.stage >= 1, text: 'A creeping silence swallowing the Whisper. Creatures it touches turn blight-purple and cruel.' },
    { id: 'lumi', title: 'Lumi', when: (s) => true, text: 'A small spark of light that has followed Wren since the day the grove first fell quiet. Nobody knows where she came from. She never says.' },
    { id: 'motes', title: 'Whisper Motes', when: (s) => s.stage >= 2, text: 'Crystallised fragments of the song. They are warm to the touch and can rekindle a Lantern.' },
    { id: 'brambold', title: 'Brambold', when: (s) => s.stage >= 5, text: 'The gentlest keeper of the Circle, corrupted by the Hollow. His last words named a man called Sorrel.' },
    { id: 'sorrel', title: 'Sorrel, the Hollow King', when: (s) => s.flags.sorrel, text: 'Elder Orrin\'s first apprentice. He believed silence could end grief. He waits beneath the Heartwood.' }
  ];

  /* ---------------- save ---------------- */
  const Save = {
    has: function () { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } },
    read: function () { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; } },
    clear: function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } },
    write: function (game) {
      try {
        const p = game.player, st = game.story;
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          v: 1, diff: G.Diff.cur.id, savedAt: Date.now(),
          player: { lvl: p.lvl, exp: p.exp, expNext: p.expNext, maxHp: p.maxHp, maxMp: p.maxMp, hp: p.hp, mp: p.mp, gold: p.gold, kills: p.kills, deaths: p.deaths || 0 },
          story: { stage: st.stage, prog: st.prog, taken: st.motes.map((m) => !!m.taken), flags: st.flags, tips: st.tips, playTime: st.playTime, bossIntroSeen: st.bossIntroSeen, boons: game.boons.collected }
        }));
        return true;
      } catch (e) { return false; }
    }
  };

  class Story {
    constructor(game) {
      this.g = game; this.stage = 0; this.prog = 0; this.flags = {}; this.tips = {}; this.playTime = 0;
      this.bossIntroSeen = false; this.bossStarted = false; this.gateAlpha = 1; this.saveTimer = 20; this.checkT = 0; this.t = 0;
      this.motes = game.level.motes.map((m) => ({ x: m.x, y: m.y, taken: false, phase: Math.random() * 6 }));
      game.companion.seen = this.tips;
    }

    get quest() { return QUESTS[this.stage] || null; }

    /* ---- lifecycle ---- */
    begin(isNew, saved) {
      const g = this.g;
      if (saved) this.restore(saved);
      this.applyWorld();
      g.ui.refreshQuest();
      if (isNew) {
        G.Dialogue.open(S.prologue, () => G.Dialogue.open(S.opening, () => { g.companion.snap(); g.ui.chat('Quest: ' + QUESTS[0].title, 'good'); g.ui.banner('Chapter 1: The Waking Grove', 'sub'); }), { cinematic: true });
      } else {
        g.companion.speak('Welcome back, Wren! ' + (this.stage >= 5 ? 'Chapter one is done. Train up, or visit Orrin.' : 'Let us keep going.'), 4.5);
        g.ui.banner('Chapter 1: The Waking Grove', 'sub');
      }
    }

    restore(s) {
      const p = this.g.player, d = s.player, st = s.story;
      Object.assign(p, { lvl: d.lvl, exp: d.exp, expNext: d.expNext, maxHp: d.maxHp, maxMp: d.maxMp, hp: Math.max(1, d.hp), mp: d.mp, gold: d.gold, kills: d.kills, deaths: d.deaths || 0 });
      this.stage = st.stage; this.prog = st.prog; this.flags = st.flags || {}; this.playTime = st.playTime || 0; this.bossIntroSeen = !!st.bossIntroSeen;
      Object.assign(this.tips, st.tips || {}); this.g.boons.collected = st.boons || 0;
      (st.taken || []).forEach((t, i) => { if (this.motes[i]) this.motes[i].taken = t; });
      if (this.stage >= 4) { const c = this.g.level.checkpoint2; this.g.level.checkpoint = c; p.x = c.x; p.y = c.y; }
    }

    applyWorld() {
      const g = this.g;
      this.gateAlpha = this.stage >= 4 ? 0 : 1;
      if (this.stage >= 4) g.level.checkpoint = g.level.checkpoint2;
      if (this.stage >= 5 && g.boss) g.boss.state = 'gone';
    }

    setStage(n) {
      this.stage = n; this.prog = 0; const g = this.g;
      if (n === 4) g.level.checkpoint = g.level.checkpoint2;
      g.ui.refreshQuest(); const q = QUESTS[n];
      if (q) { g.ui.chat('New quest: ' + q.title, 'good'); }
      this.save();
    }

    save() { if (G.game === this.g) Save.write(this.g); }

    /* ---- NPC ---- */
    markerFor(npc) {
      if (npc.id !== 'orrin') return null;
      if (this.stage === 0) return 'start';
      if (this.stage === 3) return 'turnin';
      if (this.stage === 5 && !this.flags.sorrel) return 'start';
      return null;
    }

    interact(npc) {
      const g = this.g, D = G.Dialogue;
      if (npc.id !== 'orrin') return;
      if (this.stage === 0) D.open(S.orrinIntro, () => this.setStage(1));
      else if (this.stage === 1) D.open(S.orrinReminder1);
      else if (this.stage === 2) D.open(S.orrinReminder2);
      else if (this.stage === 3) D.open(S.orrinTurnIn, () => { g.boons.grant('bloom'); this.setStage(4); g.camera.addShake(6); g.fx.ring(this.g.level.gateX, 420, 300, '#c39bff', 1, 12); g.ui.banner('The Blight Gate Opens', 'sub'); });
      else if (this.stage === 4) D.open(S.orrinReminder4);
      else D.open(S.orrinEpilogue, () => { this.flags.sorrel = true; g.ui.refreshQuest(); this.save(); });
    }

    /* ---- events ---- */
    onKill(e) {
      const g = this.g;
      if (e.isBoss || e.summoned) return;
      if (this.stage === 1) {
        this.prog++; g.ui.refreshQuest();
        g.fx.text(g.player.x, g.player.y - 128, 'Blightbitten ' + Math.min(this.prog, 6) + '/6', 'info');
        if (this.prog >= 6) { g.ui.chat('Quest complete: ' + QUESTS[1].title, 'good'); this.setStage(2); G.Dialogue.open(S.quest2Done); }
      }
    }

    onBossDefeated(e) {
      const g = this.g;
      this.bossStarted = false; g.player.limitMin = 0;
      for (const id of ['heartseed', 'sunpetal', 'clover']) g.boons.spawn(id, e.x + A.rand(-60, 60), e.cy);
      this.stage = 5; this.prog = 0; g.ui.refreshQuest();
      setTimeout(() => {
        G.Dialogue.open(S.bossDefeat, () => { this.save(); g.ui.chapterCard(this.summary()); }, {});
      }, 1700);
      this.save();
    }

    onRespawn() {
      const g = this.g, p = g.player;
      p.limitMin = 0;
      if (this.stage === 4 && g.boss && g.boss.state !== 'gone') {
        g.boss.resetFight(); this.bossStarted = false;
        for (let i = g.enemies.length - 1; i >= 0; i--) if (g.enemies[i].summoned) g.enemies.splice(i, 1);
        g.companion.speak('Brambold is resting again. Try dodging the waves with a jump, and watch the purple circles!', 5);
      }
    }

    startBoss() {
      const g = this.g, p = g.player;
      this.bossStarted = true; p.limitMin = g.boss.b.x1 - 20;
      const go = () => { g.boss.wake(); g.ui.banner('Brambold, the Gloomcap Warden', 'boss'); };
      if (!this.bossIntroSeen) { this.bossIntroSeen = true; G.Dialogue.open(S.bossIntro, go); }
      else go();
    }

    summary() {
      const p = this.g.player, t = Math.round(this.playTime), mm = Math.floor(t / 60), ss = ('0' + (t % 60)).slice(-2);
      return { time: mm + ':' + ss, kills: p.kills, deaths: p.deaths || 0, motes: this.motes.filter((m) => m.taken).length + '/3', level: p.lvl, gold: p.gold, boons: this.g.boons.collected, diff: G.Diff.cur.name };
    }

    /* ---- per frame ---- */
    update(dt) {
      const g = this.g, p = g.player, L = g.level; this.t += dt; this.playTime += dt;
      p.limitMax = this.stage >= 4 ? Infinity : L.gateX - 18;
      this.gateAlpha = A.approach(this.gateAlpha, this.stage >= 4 ? 0 : 1, 2.5, dt);

      if (this.stage >= 2 && this.stage <= 3) {
        for (const m of this.motes) {
          if (m.taken) continue;
          if (!p.dead && Math.hypot(p.x - m.x, (p.y - 40) - m.y) < 46) {
            m.taken = true; const n = this.motes.filter((k) => k.taken).length; this.prog = n;
            g.fx.ring(m.x, m.y, 120, '#bdf3ff', 0.7, 10);
            g.fx.burst(m.x, m.y, { n: 28, colors: ['#bdf3ff', '#fff', '#fff3a0'], speed: 300, life: 0.9, size: 5, grav: -60, glow: true, shape: 'star' });
            g.fx.text(m.x, m.y - 30, 'Whisper Mote ' + n + '/3', 'boon');
            g.companion.speak(S.moteLines[n - 1], 4);
            g.ui.refreshQuest();
            if (n >= 3) { g.ui.chat('Quest complete: ' + QUESTS[2].title, 'good'); this.setStage(3); }
          }
        }
      }

      if (this.stage === 4 && !this.bossStarted && !p.dead && p.x > L.arenaX && g.boss && g.boss.state === 'sleep') this.startBoss();

      // Lumi tips
      this.checkT -= dt;
      if (this.checkT <= 0) {
        this.checkT = 0.5; const c = g.companion;
        if (p.hp < p.maxHp * 0.3 && !p.dead) c.tip('lowhp', 'Careful, Wren! Press 3 to cast Heal, or grab a glowing Heartseed.', 4.5);
        if (p.mp < 8) c.tip('lowmp', 'Out of MP? Your basic attack is free. Ctrl or A!', 4);
        if (this.stage >= 1) for (const e of g.enemies) if (e.alive && !e.isBoss && Math.abs(e.x - p.x) < 320 && Math.abs(e.y - p.y) < 120) { c.tip('enemy', 'Blight-touched! Watch for the red "!" before they strike.', 4.5); break; }
        if (g.enemies.some((e) => e.elite && e.alive && Math.abs(e.x - p.x) < 420)) c.tip('elite', 'That one glows. An Elite! Tough, but it always drops a Boon.', 4.5);
        if (p.y < 300 && p.jumpsUsed >= 2) c.tip('high', 'Nice jump! Hold Down and press Space to drop through logs.', 4);
      }
      this.saveTimer -= dt; if (this.saveTimer <= 0) { this.saveTimer = 20; if (!p.dead) this.save(); }
    }

    drawWorld(ctx, camX, t) {
      const L = this.g.level;
      // blight gate
      if (this.gateAlpha > 0.01) {
        const x = L.gateX - camX; if (x > -80 && x < G.VW + 80) {
          ctx.save(); ctx.globalAlpha = this.gateAlpha; ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createLinearGradient(x - 50, 0, x + 50, 0);
          g.addColorStop(0, 'rgba(120,60,200,0)'); g.addColorStop(0.5, 'rgba(180,110,255,0.65)'); g.addColorStop(1, 'rgba(120,60,200,0)');
          ctx.fillStyle = g; ctx.fillRect(x - 50, 0, 100, 610);
          ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = 'rgba(240,210,255,0.6)'; ctx.lineWidth = 2;
          for (let i = 0; i < 9; i++) { ctx.beginPath(); const yy = 40 + i * 66; ctx.moveTo(x - 24, yy); ctx.bezierCurveTo(x - 8, yy + 22 + Math.sin(t * 2 + i) * 6, x + 8, yy - 22, x + 24, yy + 10); ctx.stroke(); }
          ctx.font = '800 14px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#e8d0ff'; ctx.lineWidth = 4; ctx.strokeStyle = '#2a1040';
          ctx.strokeText('Blight Gate', x, 560); ctx.fillText('Blight Gate', x, 560);
          ctx.restore();
        }
      }
      // whisper motes
      if (this.stage >= 2 && this.stage <= 3) {
        for (const m of this.motes) {
          if (m.taken) continue;
          const x = m.x - camX, y = m.y + Math.sin(this.t * 2 + m.phase) * 8;
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createRadialGradient(x, y, 0, x, y, 50);
          g.addColorStop(0, 'rgba(230,252,255,1)'); g.addColorStop(0.3, 'rgba(160,230,255,0.6)'); g.addColorStop(1, 'rgba(120,200,255,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 50, 0, Math.PI * 2); ctx.fill();
          ctx.globalCompositeOperation = 'source-over'; ctx.translate(x, y); ctx.rotate(this.t);
          ctx.fillStyle = '#f4fdff'; ctx.strokeStyle = '#7fd0ff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 0); ctx.lineTo(0, 12); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.restore();
        }
      }
    }

    /* ---- UI helpers ---- */
    trackerHtml() {
      const q = this.quest;
      if (!q) return { title: 'Chapter 1 Complete', desc: this.flags.sorrel ? 'Explore freely, or train for Chapter 2.' : 'Speak with Elder Orrin once more.', prog: '' };
      let prog = '';
      if (this.stage === 1) prog = Math.min(this.prog, 6) + ' / 6';
      else if (this.stage === 2) prog = this.motes.filter((m) => m.taken).length + ' / 3';
      return { title: q.title, desc: q.desc, prog: prog };
    }

    journalHtml() {
      const done = QUESTS.slice(0, Math.min(this.stage, QUESTS.length)).map((q) => '<li class="done">' + q.title + '</li>').join('');
      const cur = this.quest ? '<li class="cur"><b>' + this.quest.title + '</b><br><span>' + this.quest.desc + '</span></li>' : '';
      const lore = JOURNAL.filter((j) => j.when(this)).map((j) => '<div class="lore"><b>' + j.title + '</b><br>' + j.text + '</div>').join('');
      const choices = (this.flags.brave ? 'You told Orrin you heard the Whisper fading.' : this.flags.humble ? 'You told Orrin it was only the wind.' : '');
      return '<h3>Quests</h3><ul class="qlist">' + cur + done + '</ul>' + (choices ? '<p class="note">' + choices + '</p>' : '') + '<h3>Journal</h3>' + lore;
    }
  }

  G.Story = Story; G.Save = Save; G.QUESTS = QUESTS;
})(window.Game = window.Game || {});
