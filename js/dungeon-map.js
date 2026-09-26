// Decked Out - Dungeon, Bestiary & Mystery Events Showcase
// Displays 3-Act progression roadmap, procedural random dungeon generator,
// Act climax bosses, dungeon encounters, and subterranean mystery events

class DungeonMapManager {
  constructor() {
    this.acts = (typeof window !== 'undefined' && window.GAME_ACTS) ? window.GAME_ACTS : (typeof GAME_ACTS !== 'undefined' ? GAME_ACTS : []);
    this.mysteryEvents = (typeof window !== 'undefined' && window.MYSTERY_EVENTS) ? window.MYSTERY_EVENTS : (typeof MYSTERY_EVENTS !== 'undefined' ? MYSTERY_EVENTS : []);
    this.selectedActIndex = 0;
    this.selectedFloorIndex = 0;
    this.actDungeons = {};

    this.commonFoes = [
      {
        name: "Goblin Scavenger",
        title: "Pack Raider",
        hp: 35,
        atk: 7,
        armor: 2,
        ward: 0,
        icon: "⚙️",
        sprite: "assets/enemies/anim/Goblin.gif",
        desc: "Fast, scurrying scavengers that strip scrap from fallen adventurers. Attacks in sudden aggressive bursts."
      },
      {
        name: "Shadow Bandit",
        title: "Subterranean Outlaw",
        hp: 55,
        atk: 10,
        armor: 4,
        ward: 2,
        icon: "🗡️",
        sprite: "assets/enemies/anim/Bandit.gif",
        desc: "Ruthless brigands lurking in dungeon choke points. Uses Bleed-inducing blades and swift evasion."
      },
      {
        name: "Corrupted Cultist",
        title: "Occult Ritualist",
        hp: 48,
        atk: 12,
        armor: 0,
        ward: 8,
        icon: "🔮",
        sprite: "assets/enemies/anim/Cultist.gif",
        desc: "Chants dark prayers in the catacombs. Casts high-damage magical spells that test your Ward mitigation."
      },
      {
        name: "Runic Gnome",
        title: "Clockwork Saboteur",
        hp: 40,
        atk: 9,
        armor: 3,
        ward: 5,
        icon: "⚡",
        sprite: "assets/enemies/anim/Gnome.gif",
        desc: "Tinkers with erratic arcane devices that apply Stun and volatile elemental damage."
      },
      {
        name: "Elite Iron Knight",
        title: "Dungeon Sentinel",
        hp: 95,
        atk: 16,
        armor: 14,
        ward: 4,
        icon: "🛡️",
        sprite: "assets/enemies/anim/EliteKnight.gif",
        desc: "Heavily armored guardian in runic plate. Requires armor-piercing attacks or strong magical spells to vanquish."
      }
    ];

    // Act-specific foe pools for dynamic procedural encounters
    this.actEncounters = {
      0: {
        normal: [
          { name: "Goblin Scavenger", hp: 35, atk: 7, armor: 2, ward: 0, icon: "⚙️", sprite: "assets/enemies/anim/Goblin.gif", desc: "Fast, scurrying scavenger stripping scrap from fallen crawlers." },
          { name: "Shadow Bandit", hp: 55, atk: 10, armor: 4, ward: 2, icon: "🗡️", sprite: "assets/enemies/anim/Bandit.gif", desc: "Ruthless catacomb brigand inflicting Bleed with concealed daggers." },
          { name: "Corrupted Cultist", hp: 48, atk: 12, armor: 0, ward: 8, icon: "🔮", sprite: "assets/enemies/anim/Cultist.gif", desc: "Occult chanter unleashing ethereal spellfire." },
          { name: "Runic Gnome", hp: 40, atk: 9, armor: 3, ward: 5, icon: "⚡", sprite: "assets/enemies/anim/Gnome.gif", desc: "Erratic tinkerer deploying shock mines and volatile gears." }
        ],
        elite: [
          { name: "Elite Iron Knight", hp: 95, atk: 16, armor: 14, ward: 4, icon: "🛡️", sprite: "assets/enemies/anim/EliteKnight.gif", desc: "Towering runic sentinel with impenetrable plate and sweeping greatsword." },
          { name: "Crypt Boneguard", hp: 105, atk: 15, armor: 16, ward: 2, icon: "💀", desc: "Ancient petrified warrior defending forgotten catacomb vaults." }
        ]
      },
      1: {
        normal: [
          { name: "Magma Crawler", hp: 65, atk: 13, armor: 6, ward: 4, icon: "🔥", desc: "Molten chitinous fiend crawling from geothermal core fissures." },
          { name: "Cinder Shaman", hp: 60, atk: 16, armor: 2, ward: 10, icon: "🔮", desc: "Zealot channeling the living flame of the deep forge." },
          { name: "Forged Automaton", hp: 75, atk: 14, armor: 12, ward: 0, icon: "⚙️", desc: "Dormant foundry sentry reactivated by high-pressure steam." },
          { name: "Flame Imp", hp: 45, atk: 17, armor: 0, ward: 6, icon: "⚡", desc: "Agile, cackling fire sprite that hurls explosive magma embers." }
        ],
        elite: [
          { name: "Magma Core Colossus", hp: 150, atk: 22, armor: 22, ward: 8, icon: "🌋", desc: "Monolithic volcanic guardian fused from boiling basalt and obsidian." },
          { name: "Pyroclast Drake", hp: 135, atk: 24, armor: 14, ward: 14, icon: "🐉", desc: "Winged fire drake defending the molten blast gates." }
        ]
      },
      2: {
        normal: [
          { name: "Celestial Templar", hp: 95, atk: 20, armor: 14, ward: 16, icon: "✨", desc: "Holy sentinel of the summit wreathed in radiant auroras." },
          { name: "Astral Void Weaver", hp: 85, atk: 24, armor: 4, ward: 22, icon: "🌌", desc: "Cosmic spellcaster bending starlight into spatial distortions." },
          { name: "Skyrealm Gargoyle", hp: 110, atk: 19, armor: 18, ward: 8, icon: "🗿", desc: "Petrified aerie guardian diving with supersonic kinetic force." },
          { name: "Primordial Beast", hp: 120, atk: 22, armor: 12, ward: 6, icon: "🐺", desc: "Mythic apex predator stalking the frozen celestial crags." }
        ],
        elite: [
          { name: "Archon of the Summit", hp: 190, atk: 27, armor: 24, ward: 20, icon: "👑", desc: "High ethereal judge presiding over the gates to the Primordial Throne." },
          { name: "Star-Eater Behemoth", hp: 220, atk: 25, armor: 28, ward: 12, icon: "🪐", desc: "Cataclysmic astral entity that counters with cosmic pulses." }
        ]
      }
    };

    this.init();
  }

  init() {
    this.ensureActs(() => {
      // Pre-generate procedural dungeons for each Act
      this.acts.forEach((_, idx) => {
        if (!this.actDungeons[idx]) {
          this.generateRandomDungeon(idx);
        }
      });
      this.renderActs();
      this.renderBestiary();
      this.renderMysteryEvents();
    });
  }

  ensureActs(callback, maxRetries = 25) {
    if (this.acts && this.acts.length > 0) {
      callback();
      return;
    }
    if (typeof window !== 'undefined' && window.GAME_ACTS && window.GAME_ACTS.length > 0) {
      this.acts = window.GAME_ACTS;
      callback();
      return;
    }
    if (typeof GAME_ACTS !== 'undefined' && GAME_ACTS.length > 0) {
      this.acts = GAME_ACTS;
      callback();
      return;
    }
    if (maxRetries > 0) {
      setTimeout(() => this.ensureActs(callback, maxRetries - 1), 100);
    }
  }

  ensureMysteryEvents(callback, maxRetries = 25) {
    if (this.mysteryEvents && this.mysteryEvents.length > 0) {
      callback();
      return;
    }
    if (typeof window !== 'undefined' && window.MYSTERY_EVENTS && window.MYSTERY_EVENTS.length > 0) {
      this.mysteryEvents = window.MYSTERY_EVENTS;
      callback();
      return;
    }
    if (typeof MYSTERY_EVENTS !== 'undefined' && MYSTERY_EVENTS.length > 0) {
      this.mysteryEvents = MYSTERY_EVENTS;
      callback();
      return;
    }
    if (maxRetries > 0) {
      setTimeout(() => this.ensureMysteryEvents(callback, maxRetries - 1), 100);
    }
  }

  generateRandomDungeon(actIndex) {
    const act = this.acts[actIndex] || this.acts[0];
    if (!act) return;

    const totalFloors = act.floors;
    const seed = Math.random().toString(36).substring(2, 8).toUpperCase();
    const encounterPools = this.actEncounters[actIndex] || this.actEncounters[0];

    // Determine node types with balanced roguelike constraints
    const intermediateCount = totalFloors - 3; // Floors 2 to totalFloors - 2
    const floorTypes = new Array(totalFloors + 1);
    floorTypes[0] = 'Start';
    floorTypes[1] = 'Combat';
    floorTypes[totalFloors] = 'Boss';
    floorTypes[totalFloors - 1] = Math.random() < 0.65 ? 'Campsite' : 'Combat';

    let attempts = 0;
    let valid = false;
    while (!valid && attempts < 100) {
      attempts++;
      const pool = [];
      const eliteCount = Math.max(1, Math.round(totalFloors * 0.15));
      const shopCount = Math.max(1, Math.round(totalFloors * 0.12));
      const campCount = Math.max(1, Math.round(totalFloors * 0.12));
      const mysteryCount = Math.max(2, Math.round(totalFloors * 0.22));

      for (let i = 0; i < eliteCount; i++) pool.push('Elite');
      for (let i = 0; i < shopCount; i++) pool.push('Shop');
      for (let i = 0; i < campCount; i++) pool.push('Campsite');
      for (let i = 0; i < mysteryCount; i++) pool.push('Mystery');
      while (pool.length < intermediateCount) pool.push('Combat');
      while (pool.length > intermediateCount) pool.pop();

      // Fisher-Yates shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      for (let i = 0; i < intermediateCount; i++) {
        floorTypes[i + 2] = pool[i];
      }

      // Validate adjacency rules (no consecutive Campsite, Shop, or Elite; no Floor 2 Elite)
      valid = true;
      if (floorTypes[2] === 'Elite') valid = false;
      for (let f = 1; f < totalFloors; f++) {
        if (floorTypes[f] === 'Campsite' && floorTypes[f + 1] === 'Campsite') valid = false;
        if (floorTypes[f] === 'Shop' && floorTypes[f + 1] === 'Shop') valid = false;
        if (floorTypes[f] === 'Elite' && floorTypes[f + 1] === 'Elite') valid = false;
      }
    }

    // Pick Act boss from bossPool
    const bossList = act.bossPool && act.bossPool.length > 0 ? act.bossPool : [{ name: "Act Guardian", hp: 200, atk: 15, armor: 10, ward: 10, desc: "A terrible guardian.", icon: "👑" }];
    const chosenBoss = bossList[Math.floor(Math.random() * bossList.length)];

    // Build floor objects
    const floors = [];
    for (let f = 0; f <= totalFloors; f++) {
      const type = floorTypes[f];
      let node = {
        floor: f,
        type: type,
        icon: '⚔️',
        title: '',
        subtitle: '',
        threat: 'NORMAL',
        threatColor: '#f59e0b',
        foe: null,
        mystery: null,
        desc: '',
        rewards: []
      };

      if (type === 'Start') {
        node.icon = '🏕️';
        node.title = 'Expedition Outpost';
        node.subtitle = 'Expedition Starting Camp';
        node.threat = 'SAFE HAVEN';
        node.threatColor = 'var(--ward-cyan)';
        node.desc = 'The staging ground at the dungeon entrance. Review your 10-card starter deck, activate hero passives, and equip initial relics before descending.';
        node.rewards = ['Starting Deck: 10 Cards', 'Expedition Vigor: 100 HP', 'Initial Purse: 50 Gold'];
      } else if (type === 'Combat') {
        const foe = encounterPools.normal[Math.floor(Math.random() * encounterPools.normal.length)];
        node.icon = '⚔️';
        node.title = `${foe.name} Skirmish`;
        node.subtitle = 'Subterranean Battle';
        node.threat = 'HOSTILE FOE';
        node.threatColor = '#fbbf24';
        node.foe = foe;
        node.desc = `${foe.desc} Defeat this foe to clear the hallway and loot battlefield spoils.`;
        node.rewards = [`+${20 + Math.floor(Math.random() * 20) + (actIndex * 15)} Gold`, '1 Card Draft (Common / Uncommon)', '10% Relic Shard Drop'];
      } else if (type === 'Campsite') {
        node.icon = '🏕️';
        node.title = 'Expedition Campsite';
        node.subtitle = 'Rest Sanctuary & Runic Forge';
        node.threat = 'SANCTUARY';
        node.threatColor = '#34d399';
        node.desc = 'Rest beside the soothing campfire to heal your party or use the traveler anvil to forge an upgrade onto any card in your deck.';
        node.rewards = ['Rest: Restore 30% Max HP', 'Forge: Upgrade 1 Card in Deck', 'Campfire Lore: +5 Max Ward'];
      } else if (type === 'Mystery') {
        const evt = this.mysteryEvents && this.mysteryEvents.length > 0
          ? this.mysteryEvents[Math.floor(Math.random() * this.mysteryEvents.length)]
          : { name: 'Mysterious Runic Shrine', icon: '🔮', lore: 'An ancient relic hums in the gloom.', choices: [] };
        node.icon = evt.icon || '🔮';
        node.title = evt.name;
        node.subtitle = 'Ancient Arcane Event';
        node.threat = 'MYSTERY';
        node.threatColor = '#a855f7';
        node.mystery = evt;
        node.desc = evt.lore || 'An unpredictable encounter lurking in the shadows. Weigh risk versus reward.';
        node.rewards = ['Choice-Driven Outcome', 'Chance for Relic Shards & Gems', 'Buffs or High-Stakes Wagers'];
      } else if (type === 'Shop') {
        node.icon = '🛒';
        node.title = 'Goblin Scrap Merchant';
        node.subtitle = 'Contraband Market';
        node.threat = 'MERCHANT';
        node.threatColor = '#38bdf8';
        node.desc = 'A reinforced iron merchant wagon laden with Booster Packs, single cards, health draughts, and antique relics. Bargain with your collected Gold!';
        node.rewards = ['Booster Packs (Series 1)', '3 Discounted Singles', '1 Rare Relic for Sale', 'Card Purge Service (50 Gold)'];
      } else if (type === 'Elite') {
        const eliteFoe = encounterPools.elite[Math.floor(Math.random() * encounterPools.elite.length)];
        node.icon = '💀';
        node.title = `${eliteFoe.name} [ELITE]`;
        node.subtitle = 'High Threat Encounter';
        node.threat = 'ELITE THREAT';
        node.threatColor = '#f87171';
        node.foe = eliteFoe;
        node.desc = `${eliteFoe.desc} Highly perilous combat! Vanquishing this elite guarantees a rare relic shard.`;
        node.rewards = [`+${60 + Math.floor(Math.random() * 30) + (actIndex * 25)} Gold`, '1 Guaranteed Relic Shard', 'High-Tier Card Draft (Rare / Legendary)'];
      } else if (type === 'Boss') {
        node.icon = chosenBoss.icon || '👑';
        node.title = chosenBoss.name;
        node.subtitle = `Act ${act.act} Climax Boss`;
        node.threat = 'ACT CLIMAX BOSS';
        node.threatColor = 'var(--hp-red)';
        node.foe = chosenBoss;
        node.desc = chosenBoss.desc || `The fearsome apex ruler of Act ${act.act}. Defeat this titan to conquer the act and claim legendary spoils.`;
        node.rewards = [`Act ${act.act} Victory Trophy`, '1 Guaranteed Exotic Card Draft', '1 Rare Relic Reward', `+${120 + actIndex * 40} Gold`];
      }

      floors.push(node);
    }

    this.actDungeons[actIndex] = {
      seed: seed,
      floors: floors
    };

    // Reset floor selection to start
    this.selectedFloorIndex = 0;
    return this.actDungeons[actIndex];
  }

  getInspectorHTML(node) {
    if (!node) return '';

    const avatarHTML = node.foe && node.foe.sprite
      ? `<img src="${node.foe.sprite}" alt="${node.title}" class="pixel-art" onerror="this.outerHTML='<span class=\\'foe-icon-glyph\\'>${node.icon}</span>'" />`
      : `<span class="foe-icon-glyph ${node.type === 'Boss' ? 'boss-glyph' : ''}">${node.icon}</span>`;

    let choicesHTML = '';
    if (node.mystery && node.mystery.choices && node.mystery.choices.length > 0) {
      choicesHTML = `
        <div style="margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem;">
          <span style="font-family: var(--font-pixel); font-size: 0.42rem; color: #a855f7; display: block; margin-bottom: 0.2rem;">AVAILABLE RUNIC CHOICES:</span>
          ${node.mystery.choices.map(c => `
            <div style="background: #000; border: 1px solid var(--border-subtle); padding: 0.35rem 0.65rem; font-size: 0.75rem;">
              <span style="font-family: var(--font-pixel); font-size: 0.4rem; color: var(--primary);">▶ ${c.label}</span>
              <span style="color: #cbd5e1; display: block; margin-top: 0.15rem; font-size: 0.72rem;">${c.outcome}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="dungeon-floor-inspector">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
          <div class="foe-avatar-box ${node.type === 'Boss' ? 'boss-avatar' : ''}" style="width: 72px; height: 72px;">
            ${avatarHTML}
          </div>
          <span style="font-family: var(--font-pixel); font-size: 0.46rem; color: #fff; background: #000; border: 1px solid var(--border-strong); padding: 0.2rem 0.5rem;">
            FLOOR ${node.floor}
          </span>
        </div>

        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
            <span class="foe-rank-tag" style="color: ${node.threatColor}; border: 1px solid ${node.threatColor}; padding: 0.2rem 0.5rem; font-size: 0.42rem; background: rgba(0,0,0,0.5);">
              ${node.threat}
            </span>
            <span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-faint);">${node.subtitle}</span>
          </div>

          <h3 style="font-family: var(--font-pixel); font-size: 0.75rem; color: #fff; margin-bottom: 0.45rem; line-height: 1.6;">
            ${node.title}
          </h3>

          <p style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 0.6rem; max-width: 650px;">
            ${node.desc}
          </p>

          ${node.foe ? `
            <div class="foe-stats-mini">
              <span class="hp-stat">❤️ ${node.foe.hp} HP</span>
              <span class="atk-stat">⚔️ ${node.foe.atk} ATK</span>
              ${node.foe.armor > 0 ? `<span class="armor-stat">🛡️ ${node.foe.armor} Armor</span>` : ''}
              ${node.foe.ward > 0 ? `<span class="ward-stat">🔮 ${node.foe.ward} Ward</span>` : ''}
            </div>
          ` : ''}

          ${choicesHTML}
        </div>

        <div style="background: #000; border: 2px solid var(--border-strong); padding: 0.85rem 1.1rem; min-width: 220px; box-shadow: 2px 2px 0 #000;">
          <span style="font-family: var(--font-pixel); font-size: 0.42rem; color: #fbbf24; display: block; margin-bottom: 0.5rem; letter-spacing: 0.05em;">
            🎁 FLOOR REWARDS
          </span>
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
            ${node.rewards.map(r => `
              <li style="font-family: var(--font-mono); font-size: 0.76rem; color: #e2e8f0; display: flex; align-items: center; gap: 0.4rem;">
                <span style="color: var(--primary);">✦</span> ${r}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  updateInspector(floorIndex) {
    const dungeon = this.actDungeons[this.selectedActIndex];
    if (!dungeon || !dungeon.floors[floorIndex]) return;

    const mount = document.getElementById('dungeon-floor-inspector-mount');
    if (mount) {
      mount.innerHTML = this.getInspectorHTML(dungeon.floors[floorIndex]);
    }
  }

  renderActs() {
    const container = document.getElementById('acts-showcase-container');
    if (!container) return;

    this.ensureActs(() => {
      const currentAct = this.acts[this.selectedActIndex] || this.acts[0];
      if (!currentAct) return;

      if (!this.actDungeons[this.selectedActIndex]) {
        this.generateRandomDungeon(this.selectedActIndex);
      }
      const dungeon = this.actDungeons[this.selectedActIndex];

      // Build timeline nodes HTML
      let timelineHTML = '';
      dungeon.floors.forEach((node, f) => {
        const isBoss = node.type === 'Boss';
        const isSelected = f === this.selectedFloorIndex;
        timelineHTML += `
          <div class="map-node-item ${isBoss ? 'node-boss' : ''} ${isSelected ? 'selected' : ''}" data-floor-idx="${f}" title="Floor ${f}: ${node.title}">
            <div class="map-node-box">
              ${node.icon}
            </div>
            <span class="map-node-floor-label">F${f}</span>
            <span class="map-node-type-label">${node.type}</span>
          </div>
          ${f < dungeon.floors.length - 1 ? '<div class="map-node-arrow">➔</div>' : ''}
        `;
      });

      const selectedNode = dungeon.floors[this.selectedFloorIndex] || dungeon.floors[0];

      container.innerHTML = `
        <div class="bestiary-category-wrap">
          <div class="dungeon-controls-bar">
            <h4 class="bestiary-category-title" style="margin-bottom: 0; border-bottom: none; padding-bottom: 0;">
              🗺️ Act Progression Roadmap
            </h4>
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
              <div class="dungeon-seed-badge" title="Procedural Seed for this Dungeon Layout">
                <span>SEED:</span>
                <strong>#${dungeon.seed}</strong>
              </div>
              <button id="generate-dungeon-btn" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.52rem; padding: 0.55rem 1rem; cursor: pointer;">
                <span>🎲</span> Generate Random Dungeon
              </button>
            </div>
          </div>

          <div class="act-tab-group">
            ${this.acts.map((a, idx) => `
              <button class="act-tab-btn ${idx === this.selectedActIndex ? 'active' : ''}" data-act-idx="${idx}">
                Act ${a.act}: ${a.name}
              </button>
            `).join('')}
          </div>

          <div style="background: var(--bg-surface); border: 2px solid var(--border-strong); box-shadow: 4px 4px 0 #000; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
              <div>
                <span class="foe-rank-tag boss-rank">ACT ${currentAct.act} EXPEDITION</span>
                <h3 style="font-family: var(--font-pixel); font-size: 0.85rem; color: #fff; margin-top: 0.25rem; line-height: 1.6;">${currentAct.name}</h3>
                <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--mana-glow); display: block; margin-top: 0.35rem;">
                  ${currentAct.floors} Floors • Theme: ${currentAct.theme}
                </span>
              </div>
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--primary); padding: 0.5rem 0.85rem; font-size: 0.78rem; color: #fbbf24; font-family: var(--font-mono); line-height: 1.4;">
                ⚡ <strong>Progression Rule:</strong> Discard pile shuffles back into deck upon advancing to each new floor!
              </div>
            </div>

            <div style="margin-top: 1.5rem;">
              <span style="font-family: var(--font-pixel); font-size: 0.45rem; color: var(--text-faint); display: block; margin-bottom: 0.75rem;">
                FLOOR-BY-FLOOR ASCENT SEQUENCE (CLICK A FLOOR TO INSPECT):
              </span>
              <div class="dungeon-timeline-wrap">
                ${timelineHTML}
              </div>
            </div>

            <div id="dungeon-floor-inspector-mount">
              ${this.getInspectorHTML(selectedNode)}
            </div>
          </div>
        </div>
      `;

      // Event listener: Generate Random Dungeon Button
      const genBtn = container.querySelector('#generate-dungeon-btn');
      if (genBtn) {
        genBtn.addEventListener('click', () => {
          if (window.audioMgr) window.audioMgr.playSFX('cardPlay');
          const freshDungeon = this.generateRandomDungeon(this.selectedActIndex);
          if (typeof window.showToast === 'function') {
            window.showToast(`Act ${currentAct.act} Dungeon procedurally generated! Seed: #${freshDungeon.seed}`);
          }
          this.renderActs();
        });
      }

      // Event listeners: Act Switcher Tabs
      container.querySelectorAll('.act-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.selectedActIndex = parseInt(btn.dataset.actIdx, 10);
          this.selectedFloorIndex = 0;
          if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
          this.renderActs();
        });
      });

      // Event listeners: Floor Node Click Selection
      const nodeItems = container.querySelectorAll('.map-node-item');
      nodeItems.forEach(item => {
        item.addEventListener('click', () => {
          const fIdx = parseInt(item.dataset.floorIdx, 10);
          this.selectedFloorIndex = fIdx;
          nodeItems.forEach(it => {
            const itIdx = parseInt(it.dataset.floorIdx, 10);
            it.classList.toggle('selected', itIdx === fIdx);
          });
          if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
          this.updateInspector(fIdx);
        });
      });
    });
  }

  renderBestiary() {
    const container = document.getElementById('bestiary-grid-container');
    if (!container) return;

    this.ensureActs(() => {
      // Collect all bosses from all acts
      const allBosses = this.acts.flatMap(a =>
        (a.bossPool || []).map(b => ({ ...b, act: a.act, actName: a.name }))
      );

      let html = `
        <div class="bestiary-category-wrap">
          <h4 class="bestiary-category-title">👑 Act Climax Bosses</h4>
          <div class="bestiary-grid">
            ${allBosses.map(b => `
              <div class="foe-card boss-card">
                <div class="foe-card-top">
                  <div class="foe-avatar-box boss-avatar">
                    <span class="foe-icon-glyph boss-glyph">${b.icon || '👑'}</span>
                  </div>
                  <div class="foe-identity">
                    <span class="foe-rank-tag boss-rank">ACT ${b.act} — ${b.actName}</span>
                    <h4 class="foe-name">${b.name}</h4>
                    <div class="foe-stats-mini">
                      <span class="hp-stat">❤️ ${b.hp} HP</span>
                      <span class="atk-stat">⚔️ ${b.atk} ATK</span>
                      ${b.armor > 0 ? `<span class="armor-stat">🛡️ ${b.armor} Armor</span>` : ''}
                      ${b.ward > 0 ? `<span class="ward-stat">🔮 ${b.ward} Ward</span>` : ''}
                    </div>
                  </div>
                </div>
                <p class="foe-desc">${b.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="bestiary-category-wrap" style="margin-top: 2.5rem;">
          <h4 class="bestiary-category-title">👹 Dungeon Encounters</h4>
          <div class="bestiary-grid">
            ${this.commonFoes.map(f => `
              <div class="foe-card">
                <div class="foe-card-top">
                  <div class="foe-avatar-box">
                    <img src="${f.sprite}" alt="${f.name}" class="pixel-art" onerror="this.outerHTML='<span class=\\'foe-icon-glyph\\'>${f.icon}</span>'" />
                  </div>
                  <div class="foe-identity">
                    <span class="foe-rank-tag">${f.title}</span>
                    <h4 class="foe-name">${f.name}</h4>
                    <div class="foe-stats-mini">
                      <span class="hp-stat">❤️ ${f.hp} HP</span>
                      <span class="atk-stat">⚔️ ${f.atk} ATK</span>
                      ${f.armor > 0 ? `<span class="armor-stat">🛡️ ${f.armor} Armor</span>` : ''}
                      ${f.ward > 0 ? `<span class="ward-stat">🔮 ${f.ward} Ward</span>` : ''}
                    </div>
                  </div>
                </div>
                <p class="foe-desc">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      container.innerHTML = html;
    });
  }

  renderMysteryEvents() {
    const container = document.getElementById('mystery-events-container');
    if (!container) return;

    this.ensureMysteryEvents(() => {
      container.innerHTML = `
        <div class="bestiary-category-wrap">
          <h4 class="bestiary-category-title">🔮 Subterranean Mystery Encounters</h4>
          <p style="color: #94a3b8; font-size: 0.88rem; margin-bottom: 1.5rem; line-height: 1.6;">
            Unpredictable encounters lurking in dungeon catacombs. Weigh risk versus reward when bargaining with ancient entities.
          </p>

          <div class="mystery-events-grid">
            ${this.mysteryEvents.map(evt => `
              <div class="mystery-event-card">
                <div class="mystery-event-header">
                  <span class="mystery-event-icon">${evt.icon}</span>
                  <h4 class="mystery-event-title">${evt.name}</h4>
                </div>
                <p class="mystery-event-lore">"${evt.lore}"</p>
                <div class="mystery-choices-list">
                  ${evt.choices.map(c => `
                    <div class="mystery-choice-preview">
                      <span class="choice-label">${c.label}</span>
                      <span class="choice-outcome">${c.outcome}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
  }
}

if (typeof window !== 'undefined') {
  window.DungeonMapManager = DungeonMapManager;
}

function initDungeonMap() {
  if (document.getElementById('bestiary-grid-container') || document.getElementById('acts-showcase-container') || document.getElementById('mystery-events-container')) {
    window.dungeonMap = new DungeonMapManager();
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDungeonMap);
  } else {
    initDungeonMap();
  }
}
