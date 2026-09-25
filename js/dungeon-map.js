// Decked Out - Dungeon, Bestiary & Mystery Events Showcase

class DungeonMapManager {
  constructor() {
    this.acts = window.GAME_ACTS || [];
    this.mysteryEvents = window.MYSTERY_EVENTS || [];

    this.commonFoes = [
      {
        name: "Goblin Scavenger",
        title: "Pack Raider",
        hp: 35,
        atk: 7,
        armor: 2,
        ward: 0,
        icon: "⚙️",
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
        desc: "Heavily armored guardian in runic plate. Requires armor-piercing attacks or strong magical spells to vanquish."
      }
    ];

    this.init();
  }

  init() {
    this.renderBestiary();
    this.renderMysteryEvents();
  }

  renderBestiary() {
    const container = document.getElementById('bestiary-grid-container');
    if (!container) return;

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
                  <span class="foe-icon-glyph">${f.icon}</span>
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
  }

  renderMysteryEvents() {
    const container = document.getElementById('mystery-events-carousel');
    if (!container) return;

    container.innerHTML = this.mysteryEvents.map(evt => `
      <div class="mystery-event-card">
        <div class="mystery-event-header">
          <span class="mystery-event-icon">${evt.icon}</span>
          <h4 class="mystery-event-title">${evt.name}</h4>
        </div>
        <p class="mystery-event-lore">"${evt.lore}"</p>
        <div class="mystery-choices-list">
          ${evt.choices.map(c => `
            <div class="mystery-choice-preview">
              <strong class="choice-label">${c.label}</strong>
              <span class="choice-outcome">${c.outcome}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.dungeonMap = new DungeonMapManager();
});
