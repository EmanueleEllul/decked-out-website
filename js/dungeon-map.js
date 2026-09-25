// Decked Out - Dungeon, Bestiary & Mystery Events Showcase
// Displays 3-Act progression roadmap, Act climax bosses, dungeon encounters, and subterranean mystery events

class DungeonMapManager {
  constructor() {
    this.acts = (typeof window !== 'undefined' && window.GAME_ACTS) ? window.GAME_ACTS : (typeof GAME_ACTS !== 'undefined' ? GAME_ACTS : []);
    this.mysteryEvents = (typeof window !== 'undefined' && window.MYSTERY_EVENTS) ? window.MYSTERY_EVENTS : (typeof MYSTERY_EVENTS !== 'undefined' ? MYSTERY_EVENTS : []);
    this.selectedActIndex = 0;

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

    this.init();
  }

  init() {
    this.renderActs();
    this.renderBestiary();
    this.renderMysteryEvents();
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

  renderActs() {
    const container = document.getElementById('acts-showcase-container');
    if (!container) return;

    this.ensureActs(() => {
      const currentAct = this.acts[this.selectedActIndex] || this.acts[0];
      if (!currentAct) return;

      const nodeIcons = [
        { type: 'Start', icon: '🏕️', name: 'Expedition Outpost' },
        { type: 'Combat', icon: '⚔️', name: 'Subterranean Skirmish' },
        { type: 'Campsite', icon: '🏕️', name: 'Rest Sanctuary (Heal / Forge)' },
        { type: 'Mystery', icon: '🔮', name: 'Runic Mystery Encounter' },
        { type: 'Shop', icon: '🛒', name: 'Goblin Scrap Merchant' },
        { type: 'Elite', icon: '💀', name: 'Elite Guardian Encounter' },
        { type: 'Boss', icon: '👑', name: 'Act Climax Boss' }
      ];

      let nodesHTML = '';
      for (let f = 0; f <= currentAct.floors; f++) {
        let node = nodeIcons[1];
        if (f === 0) node = nodeIcons[0];
        else if (f === currentAct.floors) node = nodeIcons[6];
        else if (f % 4 === 0) node = nodeIcons[2];
        else if (f === 3 || f === 7) node = nodeIcons[3];
        else if (f === 5) node = nodeIcons[4];
        else if (f === 6 || f === 9) node = nodeIcons[5];

        nodesHTML += `
          <div class="map-node-item" title="Floor ${f}: ${node.name}" style="flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 0.35rem;">
            <div style="width: 44px; height: 44px; border: 2px solid ${f === currentAct.floors ? 'var(--hp-red)' : 'var(--border-strong)'}; background: ${f === currentAct.floors ? '#2a0808' : '#000'}; box-shadow: 2px 2px 0 #000; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              ${node.icon}
            </div>
            <span style="font-family: var(--font-pixel); font-size: 0.42rem; color: var(--primary);">F${f}</span>
            <span style="font-size: 0.65rem; color: var(--text-faint); max-width: 55px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${node.type}</span>
          </div>
          ${f < currentAct.floors ? '<div style="align-self: center; color: var(--border-strong); font-size: 0.9rem; margin: 0 0.15rem 1rem 0.15rem;">➔</div>' : ''}
        `;
      }

      container.innerHTML = `
        <div class="bestiary-category-wrap">
          <h4 class="bestiary-category-title">🗺️ Act Progression Roadmap</h4>
          
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
              <span style="font-family: var(--font-pixel); font-size: 0.45rem; color: var(--text-faint); display: block; margin-bottom: 0.75rem;">FLOOR-BY-FLOOR ASCENT SEQUENCE:</span>
              <div style="display: flex; gap: 0.4rem; overflow-x: auto; padding: 0.75rem 0.5rem 1rem 0.5rem; scrollbar-width: thin;">
                ${nodesHTML}
              </div>
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll('.act-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.selectedActIndex = parseInt(btn.dataset.actIdx, 10);
          if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
          this.renderActs();
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
