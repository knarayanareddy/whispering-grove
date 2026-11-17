/* Quests: data-driven quest engine + the story script for Chapters 2-6, side quests, Sorrel's letters, boss configs and endings. */
(function (G) {
  const L = (who, text) => ({ who: who, text: text });
  const K = (n, types, map) => ({ kind: 'kill', n: n, types: types || null, map: map || null });
  const C = (what, n) => ({ kind: 'collect', what: what, n: n });

  /* ---------- speakers ---------- */
  const SPK = {
    mira: { name: 'Mira Mossback', img: 'Assets/npc_mira.png', cls: 'orrin' }, tamsin: { name: 'Archivist Tamsin', img: 'canvas:npc_tamsin', cls: 'orrin' },
    bramble: { name: 'Warden Bramble', img: 'canvas:npc_bramble', cls: 'orrin' }, fenn: { name: 'Fenn the Herbalist', img: 'canvas:npc_fenn', cls: 'orrin' },
    ribbit: { name: 'Ribbit the Angler', img: 'canvas:npc_ribbit', cls: 'orrin' }, ashe: { name: 'Captain Ashe', img: 'canvas:npc_ashe', cls: 'orrin' },
    zephyra: { name: 'Zephyra', img: 'canvas:npc_zephyra', cls: 'orrin' }, sorrel: { name: 'Sorrel', img: 'canvas:npc_sorrel', cls: 'warden' },
    drowned: { name: 'The Drowned Warden', img: 'canvas:boss_drowned_idle', cls: 'warden' }, marrow: { name: 'Marrow', img: 'canvas:boss_marrow_idle', cls: 'warden' },
    magmaw: { name: 'Magmaw', img: 'canvas:boss_magmaw_idle', cls: 'warden' }, stormwing: { name: 'Stormwing Sovereign', img: 'canvas:boss_stormwing_idle', cls: 'warden' },
    heartwood: { name: 'The Heartwood', img: null, cls: 'lumi' }
  };
  Object.assign(G.Dialogue.speakers, SPK);

  /* ---------- Sorrel's letters (collectible lore) ---------- */
  const LETTERS = [
    'Orrin, the Lanterns dim again tonight. I sat with the Heartwood until dawn. It cried, Master. A tree cried. - S.',
    'I have found a way to stop it hurting. If nothing is heard, nothing can break. I will begin at the roots. - S.',
    'The apprentices call me the Hollow King now. A joke, I think. Perhaps a prayer. Please do not send anyone. - S.',
    'I have not slept since the third Lantern died. I still hear it beneath the quiet. It is learning my name. - S.',
    'If you read this, there is a child who can hear it. Do not let her do what I did. Let her listen first. - S.'
  ];

  /* ---------- boss configs ---------- */
  const BOSS = {
    drowned: { id: 'drowned', name: 'The Drowned Warden', sprite: 'boss_drowned', scale: 0.4, w: 120, h: 140, hp: 1400, dmg: 1.1, exp: 380, gold: [150, 220], attacks: ['slam', 'swing', 'spores'], summon: 'bogtoad', colors: { main: '#6fe0d0', light: '#d6fff6', dark: '#1d8c85', rgb: '90,220,200', rage: '255,120,160' } },
    marrow: { id: 'marrow', name: 'Marrow, the Hollow Hound', sprite: 'boss_marrow', scale: 0.36, w: 130, h: 115, hp: 2700, dmg: 1.3, exp: 800, gold: [240, 340], attacks: ['charge', 'swing', 'spores'], summon: 'hollowwisp', colors: { main: '#9bb0ff', light: '#e0e8ff', dark: '#4a5aa8', rgb: '130,150,255', rage: '255,90,130' } },
    magmaw: { id: 'magmaw', name: 'Magmaw, the Forge-Titan', sprite: 'boss_magmaw', scale: 0.46, w: 140, h: 170, hp: 5200, dmg: 1.5, exp: 1400, gold: [400, 560], attacks: ['slam', 'spores', 'swing', 'charge'], summon: 'emberimp', colors: { main: '#ff9a3a', light: '#ffe2a8', dark: '#c0360a', rgb: '255,140,50', rage: '255,60,60' } },
    stormwing: { id: 'stormwing', name: 'Stormwing Sovereign', sprite: 'boss_stormwing', scale: 0.44, w: 130, h: 165, hp: 6800, dmg: 1.6, exp: 1900, gold: [500, 700], attacks: ['charge', 'spores', 'slam', 'swing'], summon: 'stormsprite', colors: { main: '#ffe96b', light: '#fffbd0', dark: '#c79a10', rgb: '255,230,90', rage: '120,200,255' } },
    sorrel: { id: 'sorrel', name: 'Sorrel, the Hollow King', sprite: 'boss_sorrel', scale: 0.4, w: 80, h: 150, hp: 12000, dmg: 1.8, exp: 4000, gold: [900, 1200], phases: 4, phaseNames: ['Denial', 'Anger', 'Bargaining', 'Sorrow'], attacks: ['swing', 'slam', 'spores', 'charge'], summon: 'shade', colors: { main: '#b79bff', light: '#efe6ff', dark: '#43307d', rgb: '150,120,255', rage: '255,120,200' } }
  };

  /* ---------- quest table ---------- */
  const Q = [
    /* Chapter 2: Mistmarsh */
    { id: 'q2a', ch: 2, title: 'Home Under the Roots', giver: 'orrin', turnIn: 'mira', desc: 'Elder Orrin wants you to meet Mira Mossback in the Hollow Tree.', obj: { kind: 'talk' }, req: { ch1: true },
      offer: [L('orrin', 'Wren! Come in, come in. This is the Hollow Tree, the last true home of the Lantern Circle. Mind the roots.'), L('orrin', 'You cannot walk into the Mistmarsh with a grove-apprentice\'s kit. Find Mira Mossback, a mole of many wares and more opinions. Tell her I sent you.'), L('lumi', 'A shop! Do you think they sell shiny things? Wren, say yes.')],
      done: [L('mira', 'Ooh, a Circle apprentice! And Orrin sent you? That old owl owes me forty gold and a sandwich.'), L('mira', 'Take this for the road. Gear, charms, tonics: my pack has it all. Come back whenever your pockets jingle.')],
      reward: { exp: 90, gold: 60, items: [{ slot: 'staff', rar: 0 }], potions: { hp: 3, mp: 2 } } },
    { id: 'q2b', ch: 2, title: "Mira's Sample Run", giver: 'mira', turnIn: 'mira', desc: 'Defeat 8 monsters in the Whispering Grove so Mira can study the Hollow.', obj: K(8, null, 'grove'), req: { q: ['q2a'] },
      offer: [L('mira', 'Business proposal: the Hollow is twisting creatures, and twisted creatures drop very interesting bits. Bring me samples from the Whispering Grove. Eight should do.'), L('hero', 'You want me to fight monsters so you can sell their bits?'), L('mira', 'I want you to fight monsters so you can SURVIVE, and I will happen to take a small interest.')],
      done: [L('mira', 'Ha! Gnarly. Beautiful. Look at the colour of that spore!'), L('mira', 'A deal is a deal. And since you did not complain once, I will tell you about the Wildgate in the east of town. Warden Bramble keeps it. It leads somewhere new every day.')],
      reward: { exp: 160, gold: 120, items: [{ slot: 'charm', rar: 1 }], flags: ['unlock_wilds'] } },
    { id: 'q2c', ch: 2, title: 'Into the Mist', giver: 'orrin', turnIn: 'fenn', desc: 'Travel to Mistmarsh and find the herbalist, Fenn.', obj: { kind: 'enter', map: 'marsh' }, req: { q: ['q2b'] },
      offer: [L('orrin', 'The cracked lantern points south. Between us and the Sunken Hollow lies the Mistmarsh, a drowned country where even the fog has opinions.'), L('orrin', 'A herbalist named Fenn tends the edge of it. She will know what the Hollow has done there. The marsh portal is open now.'), L('lumi', 'Fog. Mud. Frogs. Wren, I have a good feeling about this. (I do not.)')],
      done: [L('fenn', 'Careful on the lily logs, little mage. They move. The marsh does not like to be stepped on twice.'), L('fenn', 'The Hollow came through here a season ago. Everything that glows has gone sour, and the Drowned Warden at the east end has stopped singing.')],
      onAccept: { flags: ['unlock_marsh'] }, reward: { exp: 140, gold: 80 } },
    { id: 'q2d', ch: 2, title: 'Glowcap Gatherer', giver: 'fenn', turnIn: 'fenn', desc: 'Defeat 6 Bog Toads. Fenn needs the glowcaps they hoard.', obj: K(6, ['bogtoad']), req: { q: ['q2c'] }, side: true,
      offer: [L('fenn', 'Bog Toads swallow glowcaps whole, and I need glowcaps for a salve. Six toads should cover it. Do try to be polite about it.')],
      done: [L('fenn', 'Six! And not too slimy. Here, a tonic for your trouble.')], reward: { exp: 220, gold: 90, potions: { hp: 2, mp: 1 } } },
    { id: 'q2e', ch: 2, title: 'Lost Lanterns', giver: 'fenn', turnIn: 'fenn', desc: 'Find 3 lost lanterns scattered around the marsh.', obj: C('lantern', 3), req: { q: ['q2c'] }, side: true,
      offer: [L('fenn', 'Pilgrims once carried small lanterns through this marsh. Three were dropped when the Hollow arrived. They may still glow. Bring them home, if you can find them.')],
      done: [L('fenn', 'Still warm. Still humming. Thank you, Wren. Take one of the old Circle charms I kept for such a day.')], reward: { exp: 260, gold: 60, items: [{ slot: 'charm', rar: 2 }] } },
    { id: 'q2f', ch: 2, title: 'The Great Eel Contest', giver: 'ribbit', turnIn: 'ribbit', desc: 'Defeat 5 Glow Eels for Ribbit\'s fishing contest.', obj: K(5, ['gloweel']), req: { q: ['q2c'] }, side: true,
      offer: [L('ribbit', 'Ribbit! Contest rules: whoever catches five glow eels wins. I have been trying for four seasons. You look pointy. Pointy is good for eels.')],
      done: [L('ribbit', 'RIBBIT! Five eels! I am humbled. Take my prize: a staff I did not know I owned.')], reward: { exp: 240, gold: 150, items: [{ slot: 'staff', rar: 1 }] } },
    { id: 'q2g', ch: 2, title: 'The Drowned Warden', giver: 'fenn', turnIn: 'fenn', desc: 'Defeat the Drowned Warden at the east end of Mistmarsh.', obj: { kind: 'boss', id: 'drowned' }, req: { q: ['q2c'] },
      offer: [L('fenn', 'The Warden was a Circle keeper of the marsh Lantern. Now he drowns everything in silence. He guards the way to the Sunken Hollow. Someone must stop him.'), L('fenn', 'Be strong. And if you can, be kind. Keepers do not turn on their own for no reason.')],
      done: [L('fenn', 'The marsh is singing again. Quietly, but it is singing. You have done a good thing, Wren.')], reward: { exp: 500, gold: 220, relic: true, flags: ['unlock_sunken'] } },
    { id: 'q2h', ch: 2, title: "Orrin's Confession", giver: 'orrin', turnIn: 'orrin', desc: 'Return to the Hollow Tree. Orrin owes you the truth about Sorrel.', obj: { kind: 'talk' }, req: { q: ['q2g'] },
      offer: [L('orrin', 'You have the look of someone with questions, Wren. Come. Sit. I owe you the truth.')],
      done: [L('narrator', '(A memory, painted in watercolour: two figures beneath the Heartwood, an old owl and a boy with a lantern too big for his hands.)'), L('orrin', 'Sorrel was the finest apprentice the Circle ever had. He could hear the Whisper from three valleys away. He could not bear that it could hurt.'),
        L('orrin', 'When the first Lantern died, he sat with the Heartwood for nine days. On the tenth he said: "If nothing is heard, nothing can break." I thought it was grief talking.'), L('orrin', 'It was a plan. I let him go. That is my shame, and the reason I never spoke his name.'),
        L('lumi', '...Elder? When you say the Heartwood hurt... I think I remember that. Not remember, exactly. It is like a song I forgot I knew.'), L('orrin', 'Lumi? Hm. We shall speak of that another day. Go: the Sunken Hollow lies beyond the marsh, and Marrow guards its door.')],
      reward: { exp: 300, gold: 100, pts: 1, flags: ['sorrel'] } },
    /* hub side quests */
    { id: 'qt1', ch: 2, title: 'Field Notes', giver: 'tamsin', turnIn: 'tamsin', desc: 'Defeat 20 monsters anywhere so Tamsin can update the bestiary.', obj: K(20), req: { q: ['q2a'] }, side: true,
      offer: [L('tamsin', 'Welcome to the Archive, such as it is. I am cataloguing every creature the Hollow touches. Defeat twenty of them, anywhere, and I will record your observations. Press C for the Codex.')],
      done: [L('tamsin', 'Wonderful notes! "Leaf Slime: bounces, then regrets." I will be quoting you for years.')], reward: { exp: 180, gold: 100, potions: { hp: 2 } } },
    { id: 'qb1', ch: 2, title: 'First Steps in the Wild', giver: 'bramble', turnIn: 'bramble', desc: 'Complete one Wilds expedition and open its cache.', obj: { kind: 'wilds', n: 1 }, req: { flag: 'unlock_wilds' }, side: true,
      offer: [L('bramble', 'I am Bramble, warden of the Wildgate. Each dawn it opens somewhere new: a different wood, a different sky. Past the gate, no two maps are alike.'), L('bramble', 'Walk to the far end, open the Warden\'s Cache, and come back alive. Pick an expedition from the gate.')],
      done: [L('bramble', 'You came back with all your limbs, and a cache! That is the best review I give.')], reward: { exp: 250, gold: 150, items: [{ slot: 'robe', rar: 2 }] } },
    { id: 'qb2', ch: 2, title: 'Wild Hunter', giver: 'bramble', turnIn: 'bramble', desc: 'Complete 3 Wilds expeditions in total.', obj: { kind: 'wilds', n: 3 }, req: { q: ['qb1'] }, side: true,
      offer: [L('bramble', 'Most wanderers do one expedition and call themselves a legend. Do three. Try a higher tier, if you are bold. The caches get better.')],
      done: [L('bramble', 'Three expeditions! Take this relic. It once belonged to someone who also never turned back.')], reward: { exp: 600, gold: 300, relic: true } },
    /* Chapter 3: Sunken Hollow */
    { id: 'q3a', ch: 3, title: 'Down the Roots', giver: 'orrin', turnIn: null, desc: 'Enter the Sunken Hollow beneath the marsh.', obj: { kind: 'enter', map: 'sunken' }, req: { q: ['q2h'] },
      offer: [L('orrin', 'The Sunken Hollow was once the second Lantern\'s cellar. Now it is the Hollow\'s nest. Marrow guards it. Listen for the wisps: they hum off-key.')],
      done: [L('lumi', 'Wren, it is so quiet down here. Even I feel small. Stay close, okay?')], onAccept: { flags: ['unlock_sunken'] }, reward: { exp: 200, gold: 100 } },
    { id: 'q3b', ch: 3, title: "Sorrel's Letters", giver: null, turnIn: null, desc: 'Find 2 of Sorrel\'s letters in the Sunken Hollow.', obj: C('letter', 2), req: { q: ['q3a'] }, autoStart: { map: 'sunken' },
      offer: [L('lumi', 'Wren, look. Paper, in the dark. It has someone\'s handwriting on it. Let us see if there are more.')],
      done: [L('lumi', 'Two letters, same hand. Sorrel was not a monster. He was a person who was very, very sad.')], reward: { exp: 300, gold: 120 } },
    { id: 'q3c', ch: 3, title: 'Marrow, the Hollow Hound', giver: null, turnIn: null, desc: 'Defeat Marrow at the far end of the Sunken Hollow.', obj: { kind: 'boss', id: 'marrow' }, req: { q: ['q3a'] }, autoStart: { map: 'sunken' },
      offer: [L('lumi', 'Wren, something is running in the dark ahead. Fast. Four legs. Very bad attitude. Be ready.')],
      done: [L('marrow', '...it hurts... the quiet... it hurts...'), L('lumi', 'Marrow was a Circle guardian. Look, Wren, the Hollow is lifting off him like fog.'), L('narrator', 'The Second Lantern, buried in the roots, flickers once. Twice. Then it burns steady and gold.'),
        L('lumi', 'The Whisper... I felt that. Like someone said my name. Wren, I think the Heartwood is calling me, not you.'), L('hero', 'Both of us, Lumi. Whatever it is, we will find out together.'), L('orrin', '(Through the lantern, faint:) Wren? The second Lantern lives! Come home. Captain Ashe of the Ember Peaks has sent word.')],
      reward: { exp: 900, gold: 350, relic: true, flags: ['unlock_ember', 'lumi_hint'] } },
    /* Chapter 4: Ember Peaks */
    { id: 'q4a', ch: 4, title: 'The Forge Beckons', giver: 'orrin', turnIn: 'ashe', desc: 'Travel to the Ember Peaks and meet Captain Ashe.', obj: { kind: 'enter', map: 'ember' }, req: { q: ['q3c'] },
      offer: [L('orrin', 'Captain Ashe has kept the Third Lantern\'s forge burning against all odds. She is blunt, proud, and has never once admitted she needs help. Which means she does.')],
      done: [L('ashe', 'So you are the Wren everyone keeps writing to me about. Smaller than I imagined. Good. Small people dodge.'), L('ashe', 'The Hollow cooled my forge. Magmaw, the Forge-Titan, is still hammering, but he does not remember what for. Help me, and I will reforge your kit.')],
      onAccept: { flags: ['unlock_ember'] }, reward: { exp: 400, gold: 150 } },
    { id: 'q4b', ch: 4, title: 'Cinder Cleanup', giver: 'ashe', turnIn: 'ashe', desc: 'Defeat 10 monsters in the Ember Peaks.', obj: K(10, null, 'ember'), req: { q: ['q4a'] }, side: true,
      offer: [L('ashe', 'Ember Imps have chewed through half my bellows. Ten of the little arsonists should make the rest think twice.')],
      done: [L('ashe', 'Ha! The bellows hold. Here: I made this from scrap and spite.')], reward: { exp: 700, gold: 280, items: [{ slot: 'hat', rar: 3 }] } },
    { id: 'q4c', ch: 4, title: 'Cooling Shards', giver: 'ashe', turnIn: 'ashe', desc: 'Find 3 cooling shards glowing in the Ember Peaks.', obj: C('shard', 3), req: { q: ['q4a'] }, side: true,
      offer: [L('ashe', 'There are moonstone shards in these cliffs: the only thing that cools Lantern-steel without cracking it. Three of them. High up. Do not fall into the lava.')],
      done: [L('ashe', 'Moonstone! Now I can forge properly. Let me see your staff... there. A little better. Visit the forge for more.')], reward: { exp: 650, gold: 320, items: [{ slot: 'staff', rar: 2 }] } },
    { id: 'q4d', ch: 4, title: 'Magmaw, the Forge-Titan', giver: 'ashe', turnIn: 'ashe', desc: 'Defeat Magmaw at the top of the Ember Peaks.', obj: { kind: 'boss', id: 'magmaw' }, req: { q: ['q4a'] },
      offer: [L('ashe', 'Magmaw built the Third Lantern with his own hands. When the Hollow swallowed it, he kept hammering. Stop him, Wren. Not for the Lantern. For him.')],
      done: [L('magmaw', '...the metal... was meant to sing...'), L('ashe', 'Rest, old smith. I will finish what you started.'), L('narrator', 'The Third Lantern coughs ash, sparks, and then blazes. The whole mountain glows like a banked hearth.'),
        L('ashe', 'Three Lanterns. Two to go. Take this: you earned a Captain\'s thanks, which is stingy but real.'), L('lumi', 'Wren... there is something strange in the flame. It sounds like my voice, singing backwards.')],
      reward: { exp: 1500, gold: 600, items: [{ slot: 'staff', rar: 3 }], relic: true, flags: ['unlock_cloud'] } },
    /* Chapter 5: Cloud Orchard */
    { id: 'q5a', ch: 5, title: 'Above the Clouds', giver: 'orrin', turnIn: 'zephyra', desc: 'Travel to the Cloud Orchard and meet Zephyra.', obj: { kind: 'enter', map: 'cloud' }, req: { q: ['q4d'] },
      offer: [L('orrin', 'The Fourth Lantern hangs in the Cloud Orchard, tended by a storm mage named Zephyra. She is brilliant, vain, and your equal in stubbornness. You two will either be friends or a thunderstorm.')],
      done: [L('zephyra', 'So YOU are the one carrying the Whisper. I imagined someone taller. Wait, no. I imagined someone less... earnest.'), L('zephyra', 'Fine. I am Zephyra. The orchard is falling out of the sky, and the Stormwing Sovereign is the reason.')],
      onAccept: { flags: ['unlock_cloud'] }, reward: { exp: 800, gold: 250 } },
    { id: 'q5b', ch: 5, title: 'Storm Chasers', giver: 'zephyra', turnIn: 'zephyra', desc: 'Defeat 12 monsters in the Cloud Orchard.', obj: K(12, null, 'cloud'), req: { q: ['q5a'] }, side: true,
      offer: [L('zephyra', 'Twelve storm-touched pests between here and the Sovereign. I would do it myself, but I am busy being magnificent.')],
      done: [L('zephyra', 'Twelve! Fine. You are mildly impressive. Do not tell anyone I said so.')], reward: { exp: 1100, gold: 420, items: [{ slot: 'robe', rar: 3 }] } },
    { id: 'q5c', ch: 5, title: 'Fallen Feathers', giver: 'zephyra', turnIn: 'zephyra', desc: 'Find 3 storm feathers drifting around the orchard.', obj: C('feather', 3), req: { q: ['q5a'] }, side: true,
      offer: [L('zephyra', 'The Sovereign sheds feathers charged with old lightning. Three of them will let me anchor the orchard\'s wind. Fetch them, will you?')],
      done: [L('zephyra', 'Feathers, charged, anchored. The orchard wobbles slightly less. Take this charm: from my own collection.')], reward: { exp: 1000, gold: 400, items: [{ slot: 'charm', rar: 3 }] } },
    { id: 'q5d', ch: 5, title: 'Stormwing Sovereign', giver: 'zephyra', turnIn: 'zephyra', desc: 'Defeat the Stormwing Sovereign above the orchard.', obj: { kind: 'boss', id: 'stormwing' }, req: { q: ['q5a'] },
      offer: [L('zephyra', 'I will tell you something I tell nobody: I lost my own Lantern vigil to the Hollow. I let it in. I was too proud to call for help.'), L('zephyra', 'You are not too proud. That is why I am calling for yours. Go. Break the storm.')],
      done: [L('stormwing', '...free... at last... the sky is so wide...'), L('narrator', 'The Fourth Lantern sways on its branch, then blooms like a golden flower. Behind you, the wind goes quiet. Not the Hollow\'s quiet. A watching quiet.'),
        L('sorrel', 'You are very good at lighting things, little one.'), L('hero', 'Sorrel?'), L('sorrel', 'You hear it too. That makes you precious. And that, I am afraid, makes you dangerous to everything I have built. Come to the Heartwood. We will talk.'),
        L('lumi', 'Wren... he is looking at ME. Why is he looking at me? ...Oh. Oh no. I remember now. I am not a spark that followed you. I was SENT. The Heartwood sent me to find someone who could hear it. I am a piece of the Whisper itself.'),
        L('hero', 'Lumi... you are not a piece of anything. You are my friend.'), L('lumi', '...Thank you. Then let us go finish this, together.'), L('zephyra', 'If you die up there, I will be furious. Go.')],
      reward: { exp: 2200, gold: 900, relic: true, flags: ['unlock_heart', 'lumi_secret'] } },
    /* Chapter 6: The Heartwood */
    { id: 'q6a', ch: 6, title: 'The Last Lantern', giver: 'orrin', turnIn: null, desc: 'Enter the Heartwood. The fifth and last Lantern waits at its heart.', obj: { kind: 'enter', map: 'heart' }, req: { q: ['q5d'] },
      offer: [L('orrin', 'The Heartwood. After all these years. I would come with you, Wren, but the last stretch is yours.'), L('orrin', 'Remember: the Hollow is not evil. It is grief that grew too big to sing. Listen before you strike.'), L('lumi', 'We are ready, Elder.')],
      done: [L('lumi', 'Here we are.')], onAccept: { flags: ['unlock_heart'] }, reward: { exp: 600, gold: 300 } },
    { id: 'q6b', ch: 6, title: 'Walk the Memories', giver: null, turnIn: null, desc: 'Gather 4 Memories rising through the Heartwood.', obj: C('memory', 4), req: { q: ['q6a'] }, autoStart: { map: 'heart' },
      offer: [L('heartwood', '...(a thousand leaves breathe at once. Four lights rise from the roots, each one a memory.)...')],
      done: [L('lumi', 'Four memories: the first Lantern lighting, Orrin and Sorrel laughing, the day the first one died, and... the day you woke me up, Wren.'), L('lumi', 'The path to the heart is open.')], reward: { exp: 1500, gold: 500 } },
    { id: 'q6c', ch: 6, title: 'Sorrel, the Hollow King', giver: null, turnIn: null, desc: 'Face Sorrel at the heart of the Heartwood.', obj: { kind: 'boss', id: 'sorrel' }, req: { q: ['q6b'] }, autoStart: { map: 'heart' },
      offer: [L('sorrel', 'You came. I wish you had not. I have spent so long making the world quiet enough to be safe.'), L('hero', 'It is not safe, Sorrel. It is just empty.'), L('sorrel', '...Then let us see who is right. Hold nothing back, Wren. I will not.')],
      done: [], reward: { exp: 6000, gold: 1500, relic: true, flags: ['sorrel_defeated'] } }
  ];

  /* ---------- NPC idle chatter ---------- */
  const IDLE = {
    orrin: ['The Whisper hums stronger when you are near, Wren.', 'Lanterns remember their duty. People forget. Do not forget.', 'Check the Codex (C). Tamsin keeps it honest.'],
    mira: ['Gold in, gear out. That is the law of the Hollow Tree.', 'Rare charms sell fast. Rarer ones sell themselves.', 'Lore for sale: the Heartwood was a seed once. Everything is, once.'],
    tamsin: ['Press C to read the Codex: bestiary, relics, letters, achievements.', 'Every creature in the Hollow has a story. Most are sad.', 'I do not fight. I observe, and I judge.'],
    bramble: ['The Wildgate opens a new world each time. Pick a biome and a tier.', 'Higher tiers: tougher monsters, richer caches. Do not be a hero before breakfast.', 'The Daily Trial is the same for everyone today. Same seed. Different luck.'],
    fenn: ['Mind the lily logs. They drift.', 'The marsh remembers every footstep.'], ribbit: ['Ribbit. The eels are quiet today. Suspicious.'],
    ashe: ['The forge never sleeps. Neither do I. Sleep is for the well-rested.', 'Stand clear of the lava. I am not carrying you back.'], zephyra: ['The wind is my familiar and my critic.', 'You are still mildly impressive, by the way.']
  };

  /* ---------- engine ---------- */
  class Quests {
    constructor(game) { this.g = game; this.q = {}; }
    get flags() { return this.g.story.flags; }
    flag(name) { if (name === 'ch1done') return this.g.story.stage >= 5; return !!this.flags[name]; }
    def(id) { return Q.find((x) => x.id === id); }
    state(id) { return this.q[id] || null; }
    done(id) { return !!(this.q[id] && this.q[id].st === 'done'); }
    reqOk(q) {
      const r = q.req || {};
      if (r.ch1 && !this.flag('ch1done')) return false;
      if (r.q && !r.q.every((id) => this.done(id))) return false;
      if (r.flag && !this.flag(r.flag)) return false;
      return true;
    }
    goal(q) { return q.obj.n || (q.obj.kind === 'boss' ? 1 : q.obj.kind === 'enter' ? 1 : 0); }
    ready(q) { const s = this.q[q.id]; if (!s || s.st !== 'active') return false; const k = q.obj.kind; if (k === 'talk') return true; return s.n >= this.goal(q); }
    available(npcId) { return Q.filter((q) => q.giver === npcId && !this.q[q.id] && this.reqOk(q)); }
    activeList() { return Q.filter((q) => this.q[q.id] && this.q[q.id].st === 'active'); }
    markerFor(npc) {
      if (Q.some((q) => q.turnIn === npc.id && this.ready(q))) return 'turnin';
      if (this.available(npc.id).length) return 'start';
      return null;
    }
    accept(q) {
      this.q[q.id] = { st: 'active', n: 0 };
      if (q.obj.kind === 'wilds') this.q[q.id].n = Math.min(this.g.quests ? G.Prog.wilds : 0, q.obj.n);
      if (q.onAccept && q.onAccept.flags) q.onAccept.flags.forEach((f) => { this.flags[f] = true; });
      this.g.ui.chat('New quest: ' + q.title, 'good'); this.g.ui.banner('New Quest: ' + q.title, 'sub');
      if (q.obj.kind === 'enter' && this.g.level.id === q.obj.map) this.progress(q, 1);
      if (q.obj.kind === 'collect') { const have = this.g.level.items.filter((i) => i.what === q.obj.what && i.taken).length; if (have) this.progress(q, have); }
      this.g.ui.refreshQuest(); this.g.story.save();
    }
    progress(q, n) {
      const s = this.q[q.id]; if (!s || s.st !== 'active') return; const goal = this.goal(q);
      s.n = Math.min(goal, s.n + n); this.g.ui.refreshQuest();
      if (goal > 1 || q.obj.kind === 'kill') this.g.fx.text(this.g.player.x, this.g.player.y - 125, q.title + ' ' + s.n + '/' + goal, 'info');
      if (s.n >= goal && !q.turnIn) this.complete(q);
      else if (s.n >= goal) { this.g.ui.chat('Quest ready to turn in: ' + q.title, 'good'); }
    }
    complete(q) {
      const g = this.g, s = this.q[q.id]; if (!s || s.st === 'done') return; s.st = 'done';
      const r = q.reward || {}, p = g.player, pw = Math.max(1, g.level.power, this.maxPower());
      g.ui.chat('Quest complete: ' + q.title, 'good'); g.ui.banner('Quest Complete: ' + q.title, 'sub');
      const run = () => {
        if (r.exp) { const lv = p.addExp(r.exp); g.fx.text(p.x, p.y - 95, '+' + r.exp + ' EXP', 'exp'); if (lv && G.onLevelUp) G.onLevelUp(); }
        if (r.gold) { p.gold += r.gold; g.ui.chat('Received ' + r.gold + ' gold.', 'good'); }
        (r.items || []).forEach((it) => { const item = G.Items.roll(it.slot, pw, it.rar); if (G.Inv.add(item)) g.ui.chat('Received ' + item.name + ' (' + G.Items.RAR[item.rar].name + ').', 'good'); });
        if (r.potions) { for (const k in r.potions) G.Inv.potions[k] = (G.Inv.potions[k] || 0) + r.potions[k]; g.ui.chat('Received potions.', 'good'); }
        if (r.relic) { const id = G.Prog.giveRelic(r.relic === true ? null : r.relic); if (id) { g.ui.chat('Relic found: ' + G.RELICS[id].name + '!', 'good'); g.fx.text(p.x, p.y - 140, G.RELICS[id].name, 'crit'); } }
        if (r.pts) { G.Prog.pts += r.pts; g.ui.chat('Gained ' + r.pts + ' skill point.', 'good'); }
        if (r.flags) r.flags.forEach((f) => { this.flags[f] = true; });
        G.Prog.recalc(p); g.ui.refreshQuest(); g.story.save(); g.world.onQuestDone(q);
      };
      if (q.done && q.done.length && !q.turnIn) G.Dialogue.open(q.done, run); else run();
    }
    /* talking to an NPC. returns true when a quest conversation happened */
    interact(npc) {
      const D = G.Dialogue;
      const turn = Q.find((q) => q.turnIn === npc.id && this.ready(q));
      if (turn) { D.open(turn.done, () => this.complete(turn)); return true; }
      const av = this.available(npc.id)[0];
      if (av) { D.open(av.offer, () => this.accept(av)); return true; }
      const act = Q.find((q) => (q.giver === npc.id) && this.q[q.id] && this.q[q.id].st === 'active');
      if (act) { D.open([L(npc.id, 'Still working on "' + act.title + '", Wren? ' + act.desc)]); return true; }
      const lines = IDLE[npc.id]; if (lines) { D.open([L(npc.id, lines[Math.floor(Math.random() * lines.length)])]); return true; }
      return false;
    }
    maxPower() { const u = G.MAPS_UNLOCK; let m = 1; for (const k in u) if (this.flag(k)) m = Math.max(m, u[k]); return m; }
    /* hooks */
    onKill(e) {
      if (e.summoned) return; const g = this.g;
      Q.forEach((q) => { const s = this.q[q.id]; if (!s || s.st !== 'active' || q.obj.kind !== 'kill' || e.isBoss) return;
        if (q.obj.types && q.obj.types.indexOf(e.type) < 0) return; if (q.obj.map && g.level.id !== q.obj.map) return; this.progress(q, 1); });
    }
    onBoss(id) { Q.forEach((q) => { const s = this.q[q.id]; if (s && s.st === 'active' && q.obj.kind === 'boss' && q.obj.id === id) this.progress(q, 1); }); }
    onItem(what) { Q.forEach((q) => { const s = this.q[q.id]; if (s && s.st === 'active' && q.obj.kind === 'collect' && q.obj.what === what) this.progress(q, 1); }); }
    onWilds() { Q.forEach((q) => { const s = this.q[q.id]; if (s && s.st === 'active' && q.obj.kind === 'wilds') { s.n = Math.min(q.obj.n, G.Prog.wilds); this.g.ui.refreshQuest(); if (s.n >= q.obj.n && !q.turnIn) this.complete(q); } }); }
    onEnter(mapId) {
      Q.forEach((q) => { const s = this.q[q.id];
        if (s && s.st === 'active' && q.obj.kind === 'enter' && q.obj.map === mapId) this.progress(q, 1);
        if (!s && q.autoStart && q.autoStart.map === mapId && this.reqOk(q)) { G.Dialogue.open(q.offer, () => this.accept(q)); }
      });
    }
    tracker() {
      const act = this.activeList(); if (!act.length) return null;
      const q = act.find((x) => !x.side) || act[0], s = this.q[q.id];
      const prog = (q.obj.kind === 'kill' || q.obj.kind === 'collect' || q.obj.kind === 'wilds') ? s.n + ' / ' + this.goal(q) : '';
      const where = this.ready(q) && q.turnIn ? 'Return to ' + (SPK[q.turnIn] ? SPK[q.turnIn].name : q.turnIn === 'orrin' ? 'Elder Orrin' : q.turnIn) + '.' : q.desc;
      return { title: q.title, desc: where, prog: prog, more: act.length - 1 };
    }
    serialize() { return { q: this.q }; }
    restore(d) { this.q = (d && d.q) || {}; }
  }

  G.MAPS_UNLOCK = { unlock_marsh: 1.7, unlock_sunken: 2.4, unlock_ember: 3.2, unlock_cloud: 4.2, unlock_heart: 5.4 };
  G.Quests = Quests; G.QUEST_DATA = Q; G.LETTERS = LETTERS; G.BOSS_CFG = BOSS; G.NPC_IDLE = IDLE;
})(window.Game = window.Game || {});
