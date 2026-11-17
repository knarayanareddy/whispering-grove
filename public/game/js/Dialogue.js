/* Dialogue: typewriter conversation box with portraits, narrator pages and branching choices. */
(function (G) {
  const $ = (id) => document.getElementById(id);
  const SPEAKERS = {
    narrator: { name: '', img: null },
    hero: { name: 'Wren', img: 'Assets/player_idle.png', cls: 'hero' },
    lumi: { name: 'Lumi', img: null, cls: 'lumi' },
    orrin: { name: 'Elder Orrin', img: 'Assets/npc_elder.png', cls: 'orrin' },
    warden: { name: 'Brambold', img: 'Assets/boss_gloomcap_idle.png', cls: 'warden' }
  };
  const CPS = 52;
  const portraitSrc = (img) => { if (!img) return null; if (img.indexOf('canvas:') === 0) { const c = G.Anim.images[img.slice(7)]; return c && c.toDataURL ? c.toDataURL() : null; } return img; }; // characters per second

  const Dlg = {
    active: false, queue: [], line: null, shown: 0, done: false, choiceOpen: false, onDone: null, cinematic: false,
    el: null, speakers: SPEAKERS,

    init: function () {
      this.el = { root: $('dialogue'), portrait: $('dlgPortrait'), name: $('dlgName'), text: $('dlgText'), hint: $('dlgHint'), choices: $('dlgChoices') };
      this.el.root.addEventListener('click', (e) => { if (e.target.closest('.choice')) return; this.advance(); });
    },

    open: function (lines, onDone, opts) {
      if (!this.el) this.init();
      this.queue = lines.map((l) => Object.assign({}, l)); this.onDone = onDone || null; this.active = true;
      this.cinematic = !!(opts && opts.cinematic);
      this.el.root.classList.remove('hidden');
      this.el.root.classList.toggle('cinematic', this.cinematic);
      this.next();
    },

    next: function () {
      if (!this.queue.length) return this.close();
      const l = this.queue.shift();
      if (l.run) { l.run(); if (!l.text) return this.next(); }
      this.line = l; this.shown = 0; this.done = false; this.choiceOpen = false;
      const sp = SPEAKERS[l.who] || SPEAKERS.narrator;
      const e = this.el;
      e.root.className = 'dlg-' + (sp.cls || 'narrator') + (this.cinematic ? ' cinematic' : '');
      e.name.textContent = sp.name;
      e.portrait.className = 'portraitBox ' + (sp.cls || '');
      const psrc = portraitSrc(sp.img); e.portrait.innerHTML = psrc ? '<img src="' + psrc + '" alt="">' : (sp.cls === 'lumi' ? '<div class="lumiGlow"></div>' : '');
      e.text.textContent = ''; e.choices.innerHTML = ''; e.hint.style.visibility = 'hidden';
    },

    close: function () {
      this.active = false; this.line = null; this.el.root.className = 'hidden';
      const cb = this.onDone; this.onDone = null; if (cb) cb();
    },

    showChoices: function () {
      const l = this.line, box = this.el.choices; box.innerHTML = ''; this.choiceOpen = true;
      l.choices.forEach((c, i) => {
        const b = document.createElement('button'); b.className = 'choice';
        b.textContent = (i + 1) + '.  ' + c.text;
        b.onclick = () => this.pick(i);
        box.appendChild(b);
      });
    },

    pick: function (i) {
      const c = this.line.choices[i]; if (!c) return;
      if (c.flag && G.game && G.game.story) G.game.story.flags[c.flag] = true;
      this.el.choices.innerHTML = ''; this.choiceOpen = false;
      const echo = [{ who: 'hero', text: c.text }].concat(c.reply || []);
      this.queue = echo.concat(this.queue);
      this.line.choices = null; this.next();
    },

    advance: function () {
      if (!this.active || !this.line) return;
      if (this.choiceOpen) return;
      if (!this.done) { this.shown = this.line.text.length; return; }
      if (this.line.choices) { this.showChoices(); return; }
      this.next();
    },

    update: function (dt, input) {
      if (!this.active || !this.line) return;
      const l = this.line;
      if (!this.done) {
        this.shown = Math.min(l.text.length, this.shown + CPS * dt);
        this.el.text.textContent = l.text.slice(0, Math.floor(this.shown));
        if (this.shown >= l.text.length) { this.done = true; this.el.hint.style.visibility = 'visible'; this.el.hint.textContent = l.choices ? 'Press E to answer' : 'Press E to continue'; if (l.choices) this.showChoices(); }
      }
      if (input.anyPressed(['KeyE', 'Enter', 'Space'], 200)) this.advance();
      if (this.choiceOpen) for (let i = 0; i < l.choices.length; i++) if (input.pressed('Digit' + (i + 1), 200)) { this.pick(i); break; }
    }
  };
  G.Dialogue = Dlg;
})(window.Game = window.Game || {});
