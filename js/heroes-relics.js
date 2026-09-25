// Decked Out - Official Heroes & Relics Showcase
// Displays the 7 Asymmetric Champions and 9 Ancient Relics

class HeroesRelicsManager {
  constructor() {
    this.heroes = window.GAME_HEROES || [];
    this.relics = window.GAME_RELICS || [];
    this.selectedHeroIndex = 0;

    this.init();
  }

  init() {
    this.renderHeroes();
    this.renderRelics();
  }

  renderHeroes() {
    const listContainer = document.getElementById('heroes-roster-shelf');
    if (!listContainer) return;

    listContainer.innerHTML = this.heroes.map((h, idx) => `
      <div class="hero-roster-card ${idx === this.selectedHeroIndex ? 'active' : ''}" data-hero-idx="${idx}">
        <div class="hero-roster-avatar">
          ${h.sprite ? `<img src="${h.sprite}" alt="${h.name}" class="pixel-art" />` : `<span class="hero-fallback-icon">🛡️</span>`}
        </div>
        <div class="hero-roster-info">
          <strong class="hero-roster-name">${h.name}</strong>
          <span class="hero-roster-title">${h.title}</span>
        </div>
        <span class="hero-roster-arrow">➔</span>
      </div>
    `).join('');

    listContainer.querySelectorAll('.hero-roster-card').forEach(el => {
      el.addEventListener('click', () => {
        this.selectedHeroIndex = parseInt(el.dataset.heroIdx, 10);
        if (window.audioMgr) window.audioMgr.playSFX('buttonClick');
        this.renderHeroes();
        this.updateHeroStatsDisplay();
      });
    });

    this.updateHeroStatsDisplay();
  }

  updateHeroStatsDisplay() {
    const h = this.heroes[this.selectedHeroIndex];
    if (!h) return;

    const nameEl = document.getElementById('hero-detail-name');
    const titleEl = document.getElementById('hero-detail-title');
    const avatarEl = document.getElementById('hero-detail-avatar');
    const unlockEl = document.getElementById('hero-detail-unlock');
    const passiveEl = document.getElementById('hero-detail-passive');
    const hpEl = document.getElementById('hero-scaled-hp');
    const atkEl = document.getElementById('hero-scaled-atk');
    const manaEl = document.getElementById('hero-scaled-mana');
    const affinityEl = document.getElementById('hero-detail-affinity');
    const descEl = document.getElementById('hero-detail-description');

    if (nameEl) nameEl.textContent = h.name;
    if (titleEl) titleEl.textContent = h.title;
    if (unlockEl) unlockEl.textContent = `Unlock: ${h.unlock}`;
    if (passiveEl) passiveEl.textContent = h.passive;
    if (affinityEl) affinityEl.textContent = h.affinity;
    if (hpEl) hpEl.textContent = `${h.hp} HP`;
    if (atkEl) atkEl.textContent = `${h.damage} ATK`;
    if (manaEl) manaEl.textContent = `${h.mana} Mana`;
    if (descEl) descEl.textContent = h.description || `${h.name} is a versatile champion in the subterranean depths.`;

    if (avatarEl) {
      if (h.sprite) {
        avatarEl.innerHTML = `<img src="${h.sprite}" alt="${h.name}" class="pixel-art" />`;
      } else {
        avatarEl.innerHTML = `<span style="font-size: 3rem;">🛡️</span>`;
      }
    }
  }

  renderRelics() {
    const container = document.getElementById('relics-grid-container');
    if (!container) return;

    container.innerHTML = this.relics.map(r => `
      <div class="relic-showcase-card">
        <div class="relic-card-header">
          <div class="relic-icon-frame">🏺</div>
          <div class="relic-header-text">
            <h4 class="relic-name">${r.name}</h4>
            <span class="relic-effect-badge">${r.effect}</span>
          </div>
        </div>
        <div class="relic-body">
          <p class="relic-tactical">${r.tactical}</p>
        </div>
        <div class="relic-footer">
          <span class="relic-cost-pill">Cost: ${r.cost} Relic Shards</span>
          <span class="relic-tier-pill">Tier ${r.cost > 3 ? 'II' : 'I'} Artifact</span>
        </div>
      </div>
    `).join('');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.heroesRelics = new HeroesRelicsManager();
});
